/* ==========================================================================
   POLICY CENTER GATE

   Access to the Business Policy Center is a paid member benefit, so the
   content must not sit in the public site where anyone can read it.

   WHY THIS IS A SERVER FUNCTION AND NOT A JAVASCRIPT PASSWORD BOX

   A password check written in the browser is theatre. The content still
   ships to everyone who loads the page and anyone can read it with View
   Source. So the entries live here, inside the function, not in the built
   site. The browser gets nothing until the passcode checks out.

   THIS FILE IS ESM, DELIBERATELY

   package.json sets "type": "module", which makes every .js file in the
   project an ES module. Writing this with require, module.exports and
   __dirname makes the function throw on every single invocation, Vercel
   returns its own plain-text error page, and the browser reports a JSON
   parse error that has nothing to do with the real fault. If you add
   another function, write it this way.

   SET THE PASSCODE BEFORE DEPLOYING

   In Vercel: Project, Settings, Environment Variables.
       Name   MEMBER_PASSCODE
       Value  whatever you tell members

   Without it the endpoint refuses everyone, which is the safe failure.

   WHAT THIS IS NOT

   One shared passcode for the whole membership, not per-member accounts.
   A member who leaves can still use it until you change it. That is a real
   limitation and the right trade for now: it keeps the content off the
   public web, costs nothing, and adds no database. Change the passcode
   when the membership year turns over.
   ========================================================================== */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { currentMember } from './member.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COOKIE = 'pcc_policy';
const MAX_AGE = 60 * 60 * 24 * 30; // thirty days, then they enter it again

/* Read once per cold start rather than once per request. */
let cached = null;

function payload() {
  if (cached) return cached;

  /* Where a bundled file ends up depends on how the platform packaged it,
     so try the places it can reasonably be rather than assuming one. */
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, '_policy', 'content.js'),
    path.join(process.cwd(), 'api', '_policy', 'content.js'),
    path.join(here, '..', 'api', '_policy', 'content.js')
  ];

  const tried = [];
  for (const file of candidates) {
    try {
      cached = readFileSync(file, 'utf8');
      return cached;
    } catch (err) {
      tried.push(`${file} (${err.code || err.message})`);
    }
  }
  throw new Error('Could not read the Policy Center content. Tried:\n' + tried.join('\n'));
}

/* Constant-time compare, so response time does not leak how much of the
   passcode was right. */
function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const tokenFor = passcode =>
  createHash('sha256').update('pcc:' + passcode).digest('hex').slice(0, 32);

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function sendJs(res, body) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(body);
}

export default async function handler(req, res) {
  /* Every failure path returns JSON with a readable message, so a problem
     here shows up in the browser as the actual problem. */
  try {
    const secret = process.env.MEMBER_PASSCODE;

    if (!secret) {
      res.status(503).json({
        error: 'not_configured',
        message: 'The member passcode has not been set up yet. Set MEMBER_PASSCODE in the Vercel project settings.'
      });
      return;
    }

    const good = tokenFor(secret);

    if (req.method === 'GET') {
      /* A member signed in at /members/ never sees the passcode screen.
         Wrapped, because a failure to read the roster should fall back to
         the passcode rather than lock everybody out. */
      let signedIn = null;
      try { signedIn = currentMember(req); } catch { signedIn = null; }
      if (signedIn) { sendJs(res, payload()); return; }

      if (same(readCookie(req, COOKIE) || '', good)) sendJs(res, payload());
      else res.status(401).json({ error: 'locked' });
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ error: 'method_not_allowed', message: 'Use GET or POST.' });
      return;
    }

    const { passcode } = await readBody(req);

    if (!same(String(passcode || '').trim(), secret)) {
      /* Slow every wrong answer down. Makes guessing impractical without
         any rate-limiting infrastructure. */
      await new Promise(r => setTimeout(r, 700));
      res.status(401).json({ error: 'wrong_passcode', message: 'That passcode is not right.' });
      return;
    }

    const body = payload();
    res.setHeader('Set-Cookie',
      `${COOKIE}=${good}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
    sendJs(res, body);
  } catch (err) {
    console.error('policy gate failed:', err);
    res.status(500).json({
      error: 'server_error',
      message: 'The Policy Center could not be loaded. The chamber has been notified.'
    });
  }
}
