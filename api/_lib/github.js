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
