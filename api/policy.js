/* ==========================================================================
   POLICY CENTER GATE

   Access to the Business Policy Center is a paid member benefit, so the
   content must not sit in the public site where anyone can read it.

   WHY THIS IS A SERVER FUNCTION AND NOT A JAVASCRIPT PASSWORD BOX

   A password check written in the browser is theatre. The content still
   ships to everyone who loads the page and anyone can read it with View
   Source. If the Policy Center is going to be a benefit people pay for,
   the content has to genuinely not be sent to people who have not paid.

   So the entries live here, inside the function, not in the built site.
   The browser gets nothing until the passcode checks out on the server.

   SET THE PASSCODE BEFORE DEPLOYING

   In Vercel: Project, Settings, Environment Variables.
       Name   MEMBER_PASSCODE
       Value  whatever you tell members

   Without it the endpoint refuses everyone, which is the safe failure.

   WHAT THIS IS NOT

   One shared passcode for the whole membership. Not per-member accounts.
   A member who leaves can still use it until you change it, and one member
   can pass it to a friend. That is a real limitation and it is the right
   trade for now: it keeps the content off the public web, costs nothing,
   and adds no database. Per-member logins belong with dues collection,
   which is the back office decision the board has not made yet.

   Change the passcode when the membership year turns over.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const COOKIE = 'pcc_policy';
const MAX_AGE = 60 * 60 * 24 * 30; // thirty days, then they enter it again

/* Read once per cold start rather than per request. */
let cached = null;
function payload() {
  if (cached) return cached;
  const dir = path.join(__dirname, '_policy');
  /* Entries only. Membership lives on the public site at /membership/,
     not in here, so there is one place to edit it and no chance of the
     two drifting apart. */
  cached = fs.readFileSync(path.join(dir, 'content.js'), 'utf8');
  return cached;
}

/* Constant-time compare, so the response time does not leak how much of
   the passcode was right. */
function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function tokenFor(passcode) {
  return require('crypto').createHash('sha256')
    .update('pcc:' + passcode).digest('hex').slice(0, 32);
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function body(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

module.exports = async (req, res) => {
  const secret = process.env.MEMBER_PASSCODE;

  if (!secret) {
    res.status(503).json({
      error: 'not_configured',
      message: 'The Policy Center passcode has not been set. Set MEMBER_PASSCODE in the Vercel project settings.'
    });
    return;
  }

  const good = tokenFor(secret);

  /* Already unlocked on this device. */
  if (req.method === 'GET') {
    if (same(readCookie(req, COOKIE) || '', good)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store');
      res.status(200).send(payload());
    } else {
      res.status(401).json({ error: 'locked' });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { passcode } = await body(req);

  if (!same(String(passcode || '').trim(), secret)) {
    /* Slow every wrong answer down. Makes guessing impractical without
       needing any rate-limiting infrastructure. */
    await new Promise(r => setTimeout(r, 700));
    res.status(401).json({ error: 'wrong_passcode' });
    return;
  }

  res.setHeader('Set-Cookie',
    `${COOKIE}=${good}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(payload());
};
