/* ==========================================================================
   READING AND WRITING content/ THROUGH GITHUB

   Shared by the admin and by members editing their own listing. Extracted
   so there is one place that knows how to talk to GitHub, rather than two
   that drift apart.

   Needs GITHUB_REPO, GITHUB_TOKEN and optionally GITHUB_BRANCH.
   ========================================================================== */

export const gh = () => ({
  repo: (process.env.GITHUB_REPO || '').trim(),
  branch: (process.env.GITHUB_BRANCH || 'main').trim(),
  token: (process.env.GITHUB_TOKEN || '').trim()
});

export function ghMissing() {
  const { repo, token } = gh();
  return [!repo && 'GITHUB_REPO', !token && 'GITHUB_TOKEN'].filter(Boolean);
}

async function call(path, options = {}) {
  const { repo, token } = gh();
  return fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'polk-city-chamber',
      ...(options.headers || {})
    }
  });
}

export async function readContent(name) {
  const { branch } = gh();
  const res = await call(`content/${name}?ref=${encodeURIComponent(branch)}`);
  if (!res.ok) {
    throw Object.assign(
      new Error(`Could not read content/${name} from GitHub (${res.status}).`),
      { status: 502, detail: await res.text() }
    );
  }
  const meta = await res.json();
  return {
    sha: meta.sha,
    data: JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'))
  };
}

export async function writeContent(name, data, sha, message, author) {
  const { branch } = gh();
  const res = await call(`content/${name}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8').toString('base64'),
      ...(sha ? { sha } : {}),
      branch,
      committer: { name: author, email: 'admin@polkcitychamber.com' }
    })
  });

  if (res.status === 409 || res.status === 422) {
    throw Object.assign(new Error('conflict'), { status: 409, conflict: true });
  }
  if (!res.ok) {
    throw Object.assign(
      new Error(`GitHub refused the save (${res.status}).`),
      { status: 502, detail: await res.text() }
    );
  }
  const out = await res.json();
  return { sha: out.content.sha, commit: out.commit.sha.slice(0, 7) };
}

/* Two members editing their own listings at the same time both write to
   members.json, and the second one is rejected because the file moved.
   Nothing is actually in conflict: each is only touching their own record.
   So on rejection, read the file again, reapply the change, and retry.

   apply(data) must change only what belongs to that member. */
export async function updateContent(name, apply, message, author, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    const { sha, data } = await readContent(name);
    apply(data);
    try {
      return await writeContent(name, data, sha, message, author);
    } catch (err) {
      if (!err.conflict) throw err;
      lastError = err;
      await new Promise(r => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw Object.assign(
    new Error('Somebody else was saving at the same time and it could not be applied. Please try again.'),
    { status: 409, cause: lastError }
  );
}

/* ---------- files outside content/ ----------------------------------------

   Only used for member logos, which live in assets/members/ so the build
   copies them into the site like any other image. Each upload gets a new
   file name, so it never has to overwrite anything and no browser ever
   shows last month's logo from its cache. */

export async function writeAsset(path, base64, message, author) {
  const { branch } = gh();
  const res = await call(path, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: base64,
      branch,
      committer: { name: author, email: 'admin@polkcitychamber.com' }
    })
  });
  /* 422 here means the file is already there, which only happens when
     somebody uploads the exact same image twice. That is fine. */
  if (res.status === 422) return { existed: true };
  if (!res.ok) {
    throw Object.assign(
      new Error(`GitHub refused the upload (${res.status}).`),
      { status: 502, detail: await res.text() }
    );
  }
  return { existed: false };
}

/* Best effort. A logo left behind costs a few kilobytes; failing a save
   over it would cost the member their change. */
export async function deleteAsset(path, message, author) {
  try {
    const { branch } = gh();
    const meta = await call(`${path}?ref=${encodeURIComponent(branch)}`);
    if (!meta.ok) return;
    const { sha } = await meta.json();
    await call(path, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha, branch, committer: { name: author, email: 'admin@polkcitychamber.com' } })
    });
  } catch (err) {
    console.error('could not remove old logo', path, err);
  }
}

/* ---------- several files in one commit -------------------------------------

   Every commit rebuilds the site. Uploading thirty event photos one file
   at a time would be thirty rebuilds, and the plan limits how many a day
   are allowed. So photos go up first as loose blobs, which GitHub stores
   without committing anything, and then one commit adds all of them and
   the change to the content file together. One save, one rebuild.

   Blobs that never make it into a commit (somebody closed the tab) are
   cleaned up by GitHub on its own. */

async function git(path, options = {}) {
  const { repo, token } = gh();
  const res = await fetch(`https://api.github.com/repos/${repo}/git/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'polk-city-chamber',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  return res;
}

async function gitJson(path, options, what) {
  const res = await git(path, options);
  if (!res.ok) {
    throw Object.assign(new Error(`GitHub refused ${what} (${res.status}).`), { status: res.status === 422 ? 409 : 502, detail: await res.text(), gitStatus: res.status });
  }
  return res.json();
}

export async function createBlob(base64) {
  const out = await gitJson('blobs', { method: 'POST', body: JSON.stringify({ content: base64, encoding: 'base64' }) }, 'the upload');
  return out.sha;
}

/* files: [{ path, sha }] to add (sha from createBlob), or { path, sha: null }
   to delete. content: { name, apply } changes one file in content/ in the
   same commit, applied to the copy in that exact commit, and retried on top
   of anything somebody else committed in the meantime. */
export async function commitFiles({ files = [], content }, message, author, attempts = 3) {
  const { branch } = gh();
  for (let i = 0; i < attempts; i++) {
    const ref = await gitJson(`ref/heads/${encodeURIComponent(branch)}`, {}, 'reading the branch');
    const head = ref.object.sha;
    const commit = await gitJson(`commits/${head}`, {}, 'reading the last commit');

    /* The content change runs first: it may decide which files go in
       (a new album's folder name, say), so files is read after it. */
    let result, json = null;
    if (content) {
      const res = await call(`content/${content.name}?ref=${head}`);
      let data = {};
      if (res.ok) data = JSON.parse(Buffer.from((await res.json()).content, 'base64').toString('utf8'));
      else if (res.status !== 404) throw Object.assign(new Error(`Could not read content/${content.name} (${res.status}).`), { status: 502 });
      result = content.apply(data);
      json = JSON.stringify(data, null, 2) + '\n';
    }
    const entries = files.map(f => ({ path: f.path, mode: '100644', type: 'blob', sha: f.sha }));
    if (content) entries.push({ path: `content/${content.name}`, mode: '100644', type: 'blob', content: json });

    const tree = await gitJson('trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree: entries }) }, 'the change');
    const who = { name: author, email: 'admin@polkcitychamber.com', date: new Date().toISOString() };
    const next = await gitJson('commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [head], author: who, committer: who }) }, 'the commit');
    const move = await git(`refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: next.sha, force: false }) });
    if (move.ok) return { commit: next.sha.slice(0, 7), result };
    if (move.status !== 422) {
      throw Object.assign(new Error(`GitHub refused the save (${move.status}).`), { status: 502, detail: await move.text() });
    }
    /* Somebody else committed first. Start again on top of theirs. */
    await new Promise(r => setTimeout(r, 300 * (i + 1)));
  }
  throw Object.assign(new Error('Somebody else was saving at the same time. Please press Save again.'), { status: 409 });
}
