/* The admin cookie, checked the same way api/admin.js checks it, for the
   newer endpoints that have admin-only actions (event check-in, the
   newsletter, the quarterly email). Signing in still only happens in
   api/admin.js. */

import { createHash } from 'node:crypto';

export function isAdmin(req) {
  const pass = process.env.ADMIN_PASSCODE;
  if (!pass) return false;
  const good = createHash('sha256').update('pcc-admin:' + pass).digest('hex').slice(0, 32);
  let got = '';
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === 'pcc_admin') got = decodeURIComponent(v.join('='));
  }
  if (got.length !== good.length) return false;
  let diff = 0;
  for (let i = 0; i < good.length; i++) diff |= got.charCodeAt(i) ^ good.charCodeAt(i);
  return diff === 0;
}

export async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

/* The visitor's address, hashed with a daily salt, for rate limits and
   for not counting the same person twice. Never stored as-is. */
export function visitorKey(req, extra = '') {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${day}|${ip}|${ua}|${extra}`).digest('hex').slice(0, 20);
}

export function fail(res, err, what) {
  if (!err.status || err.status >= 500) console.error(what, err, err.detail || '');
  res.status(err.status || 500).json({ error: 'server_error', message: err.message || 'Something went wrong.' });
}
