/* ==========================================================================
   HASHING AND CHECKING PASSWORDS

   scrypt, from Node's own crypto. No dependency to install, no dependency
   to keep patched. It is deliberately slow and memory-hungry, which is the
   whole point: it makes guessing expensive.

   The stored form records the parameters alongside the hash, so the cost
   can be raised later without invalidating everybody's existing password.

     scrypt$16384$8$1$<salt base64url>$<hash base64url>

   WHAT THE RULES ARE, AND WHY

   Length is the only rule. No "must contain a number and a symbol".

   Composition rules push people towards Passw0rd! and towards writing it
   on a note by the till. Length is what actually makes a password hard to
   guess. This asks for twelve characters and suggests three or four
   unrelated words, which is easy to remember and hard to attack.

   Common passwords are refused outright, because they are the first things
   any attacker tries and no length rule catches "password1234".
   ========================================================================== */

import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

const N = 16384, r = 8, p = 1, KEYLEN = 64;

export const MIN_LENGTH = 12;

/* Not a complete list and does not need to be. It catches the handful of
   things people actually pick when told to invent a password on the spot. */
const OBVIOUS = [
  'password', 'passw0rd', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'letmein', 'welcome', 'iloveyou', 'admin', 'chamber',
  'polkcity', 'polkcitychamber', 'chamberofcommerce', 'abc123', 'monkey',
  'football', 'baseball', 'sunshine', 'princess', 'trustno1', 'changeme'
];

export function checkStrength(password, memberName = '') {
  const pw = String(password || '');

  if (pw.length < MIN_LENGTH) {
    return `Passwords need to be at least ${MIN_LENGTH} characters. Three or four unrelated words is the easiest way to get there and the easiest to remember.`;
  }
  if (pw.length > 200) {
    return 'That is longer than 200 characters, which is longer than anything needs to be.';
  }

  const flat = pw.toLowerCase().replace(/[^a-z0-9]/g, '');

  /* Strip trailing digits before comparing. Sticking numbers on the end is
     exactly what people do when told a password is too short, so
     "password1234" has to be caught as readily as "password". */
  const stem = flat.replace(/\d+$/, '');
  if (OBVIOUS.includes(flat) || OBVIOUS.includes(stem)) {
    return 'That is one of the first passwords anybody guesses, with or without numbers on the end. Please pick something else.';
  }

  /* Their own business name is the other obvious guess. */
  const name = memberName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (name.length > 5 && flat.includes(name)) {
    return 'Please do not use your business name. It is the first thing anybody would try.';
  }

  if (/^(.)\1+$/.test(pw)) {
    return 'That is the same character repeated. Please pick something else.';
  }

  return null;
}

export async function hash(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function matches(password, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;

  const [, sN, sr, sp, salt64, key64] = stored.split('$');
  const key = await scrypt(
    password,
    Buffer.from(salt64, 'base64url'),
    Buffer.from(key64, 'base64url').length,
    { N: Number(sN), r: Number(sr), p: Number(sp), maxmem: 64 * 1024 * 1024 }
  );

  const a = key;
  const b = Buffer.from(key64, 'base64url');
  return a.length === b.length && timingSafeEqual(a, b);
}

/* Run when the email is not on the roster, so that a wrong address and a
   wrong password take the same amount of time. Without this, response
   timing tells an attacker which addresses are real. */
export async function wasteTime() {
  await scrypt('placeholder', randomBytes(16), KEYLEN, { N, r, p, maxmem: 64 * 1024 * 1024 });
}
