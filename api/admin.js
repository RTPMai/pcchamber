/* ==========================================================================
   ADMIN API

   Lets somebody with no technical background change the site's content.

   HOW IT WORKS, IN ONE PARAGRAPH

   The admin page reads and writes the JSON files in content/ through the
   GitHub API. Saving makes a real commit. Vercel sees the commit and
   rebuilds the site, which takes about a minute. So there is no database,
   nothing new to back up, and every change has an author, a timestamp and
   an undo, because it is all just git history.

   WHAT YOU MUST SET IN VERCEL BEFORE THIS WORKS
   Project, Settings, Environment Variables:

     ADMIN_PASSCODE   what you give the person doing the editing.
                      Different from MEMBER_PASSCODE. Do not reuse it.
     GITHUB_TOKEN     a fine-grained personal access token with
                      Contents: Read and write, on this repository ONLY.
     GITHUB_REPO      owner/repository, e.g. polkcitychamber/website
     GITHUB_BRANCH    optional, defaults to main

   THE RISK, PLAINLY

   That token can rewrite the site. Treat it like the keys to the building:
   scope it to this one repository, never to an account, set an expiry, and
   rotate it when whoever holds the admin passcode changes. If it ever
   leaks, revoke it on GitHub and the problem stops immediately.

   The passcode is shared, not per-person, which is why saving asks who you
   are and puts that name in the commit. That gives a record of who changed
   what. It is a record, not a security boundary: anybody with the passcode
   could type any name.

   CONCURRENT EDITS

   Every write sends the file version it was based on. If somebody else
   saved in the meantime, GitHub rejects it and the admin says so rather
   than silently overwriting their work.
   ========================================================================== */

import { createHash } from 'node:crypto';

const COOKIE = 'pcc_admin';
const MAX_AGE = 60 * 60 * 8;   // a working day, then sign in again

/* Only these. A bug or a bad actor cannot reach anything else in the repo. */
const ALLOWED = new Set([
  'members.json', 'events.json', 'jobs.json',
  'news.json', 'board.json', 'referrals.json'
]);

const api = () => ({
  repo: process.env.GITHUB_REPO,
  branch: process.env.GITHUB_BRANCH || 'main',
  token: process.env.GITHUB_TOKEN
});

function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const tokenFor = pass =>
  createHash('sha256').update('pcc-admin:' + pass).digest('hex').slice(0, 32);

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

async function github(path, options = {}) {
  const { repo, token } = api();
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'polk-city-chamber-admin',
      ...(options.headers || {})
    }
  });
  return res;
}

/* ---------- the four things this endpoint does ---------------------------- */

/* GitHub answers 404 for four completely different problems, and one of
   them is deliberate: a fine-grained token that has not been granted this
   repository gets 404 rather than 403, so a token cannot be used to probe
   which private repositories exist. That is good security and terrible
   debugging, so when a read fails we work out which it actually is. */
async function diagnose(name) {
  const { repo, branch } = api();

  const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'polk-city-chamber-admin'
    }
  });

  if (repoRes.status === 401) {
    return `The GitHub token is not valid. It may have expired. Create a new one and update GITHUB_TOKEN in the Vercel settings.`;
  }

  if (repoRes.status === 404) {
    return `Cannot see the repository "${repo}". Either GITHUB_REPO is wrong, or the token has not been given access to it. `
      + `A fine-grained token has to name this repository under Repository access, with Contents set to Read and write. `
      + `If you created it as a fine-grained token on an organisation, an owner may still need to approve it.`;
  }

  if (!repoRes.ok) {
    return `GitHub returned ${repoRes.status} for the repository "${repo}".`;
  }

  const info = await repoRes.json();

  const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'polk-city-chamber-admin'
    }
  });

  if (branchRes.status === 404) {
    return `The repository is there, but it has no branch called "${branch}". Its default branch is "${info.default_branch}". `
      + `Set GITHUB_BRANCH to that in the Vercel settings, or leave it unset if the default is main.`;
  }

  /* Repo and branch are fine, so the file genuinely is not there. */
  return `The repository and branch are fine, but content/${name} is not in them. `
    + `That folder holds the site's content and is created by the build. `
    + `Check that the content/ folder was committed and pushed, not left out by a .gitignore.`;
}

async function loadFile(name) {
  const { branch } = api();
  const res = await github(`content/${name}?ref=${encodeURIComponent(branch)}`);

  if (res.status === 404) {
    throw Object.assign(new Error(await diagnose(name)), { status: 502 });
  }
  if (!res.ok) {
    const detail = await res.text();
    throw Object.assign(
      new Error(`GitHub returned ${res.status} reading content/${name}.`),
      { status: 502, detail }
    );
  }

  const meta = await res.json();
  return {
    name,
    sha: meta.sha,                                     // the version this edit is based on
    data: JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'))
  };
}

async function saveFile(name, data, sha, who, note) {
  const { branch } = api();

  /* Two spaces, trailing newline. Matches how the files are written by
     hand, so a diff shows the actual change rather than reformatting. */
  const body = JSON.stringify(data, null, 2) + '\n';

  const res = await github(`content/${name}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `${note || 'Update ' + name.replace('.json', '')} (via admin, by ${who})`,
      content: Buffer.from(body, 'utf8').toString('base64'),
      /* Omitted entirely when the file does not exist yet. Sending an
         undefined sha to GitHub is an error rather than a create. */
      ...(sha ? { sha } : {}),
      branch,
      committer: { name: `${who} via chamber admin`, email: 'admin@polkcitychamber.com' }
    })
  });

  if (res.status === 409 || res.status === 422) {
    throw Object.assign(new Error(
      'Somebody else saved a change while you were editing. Reload the page and make your change again.'
    ), { status: 409 });
  }
  if (!res.ok) {
    const detail = await res.text();
    throw Object.assign(new Error(`GitHub refused the save (${res.status}).`), { status: 502, detail });
  }

  const out = await res.json();
  return { sha: out.content.sha, commit: out.commit.sha.slice(0, 7) };
}

/* ---------- handler ------------------------------------------------------- */

export default async function handler(req, res) {
  try {
    const pass = process.env.ADMIN_PASSCODE;
    const { repo, token } = api();

    if (!pass || !repo || !token) {
      const missing = [
        !pass && 'ADMIN_PASSCODE',
        !repo && 'GITHUB_REPO',
        !token && 'GITHUB_TOKEN'
      ].filter(Boolean);
      res.status(503).json({
        error: 'not_configured',
        message: `The admin is not set up yet. Missing in the Vercel project settings: ${missing.join(', ')}.`
      });
      return;
    }

    /* Checked before anything is sent to GitHub. Without this, a value
       pasted into the wrong box comes back as a permissions error, which
       sends you looking at the token instead of the typo. */
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      res.status(503).json({
        error: 'bad_repo',
        message: `GITHUB_REPO is set to "${repo}", which is not a repository name. `
          + `It needs the form owner/repository, for example polkcitychamber/website. `
          + `That is the two parts after github.com in the address of your repository. `
          + `If what you pasted was meant to be a token or a passcode, change it, because it is now sitting in a settings field it does not belong in.`
      });
      return;
    }

    if (/^gh[pousr]_|^github_pat_/.test(repo)) {
      res.status(503).json({
        error: 'bad_repo',
        message: `GITHUB_REPO contains what looks like a GitHub token. Move it to GITHUB_TOKEN, put owner/repository in GITHUB_REPO, and revoke that token on GitHub since it has been in the wrong place.`
      });
      return;
    }

    const good = tokenFor(pass);
    const body = req.method === 'POST' ? await readBody(req) : {};
    const action = body.action || (req.method === 'GET' ? 'load' : null);

    /* Signing in is the only thing you can do without a cookie. */
    if (action === 'signin') {
      if (!same(String(body.passcode || '').trim(), pass)) {
        await new Promise(r => setTimeout(r, 700));
        res.status(401).json({ error: 'wrong_passcode', message: 'That passcode is not right.' });
        return;
      }
      res.setHeader('Set-Cookie',
        `${COOKIE}=${good}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
      res.status(200).json({ ok: true });
      return;
    }

    if (!same(readCookie(req, COOKIE) || '', good)) {
      res.status(401).json({ error: 'locked', message: 'Please sign in again.' });
      return;
    }

    if (action === 'signout') {
      res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'load') {
      const name = (req.query?.file) || body.file;
      if (!ALLOWED.has(name)) {
        res.status(400).json({ error: 'bad_file', message: 'That is not a file the admin can open.' });
        return;
      }
      res.status(200).json(await loadFile(name));
      return;
    }

    if (action === 'save') {
      const { file, data, sha, who, note } = body;
      if (!ALLOWED.has(file)) {
        res.status(400).json({ error: 'bad_file', message: 'That is not a file the admin can change.' });
        return;
      }
      if (!who || !String(who).trim()) {
        res.status(400).json({ error: 'no_name', message: 'Say who you are before saving.' });
        return;
      }
      if (!data || typeof data !== 'object') {
        res.status(400).json({ error: 'bad_data', message: 'Nothing to save.' });
        return;
      }
      const out = await saveFile(file, data, sha, String(who).trim(), note);
      res.status(200).json({ ok: true, ...out });
      return;
    }

    res.status(400).json({ error: 'unknown_action', message: 'That is not something the admin can do.' });
  } catch (err) {
    console.error('admin api failed:', err, err.detail || '');
    res.status(err.status || 500).json({
      error: 'server_error',
      message: err.message || 'Something went wrong saving that.'
    });
  }
}
