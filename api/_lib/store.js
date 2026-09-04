/* ==========================================================================
   THE CREDENTIAL STORE

   The only part of this project that is not a file in the repository.

   WHY CREDENTIALS CANNOT LIVE IN GIT

   Two reasons, and the second is the one people miss.

   First, git history is permanent. A password hash committed today is in
   the history for ever, including after the member leaves, and including
   if the hashing turns out to be weak in ten years. You cannot take it
   back out without rewriting history.

   Second, every password change would be a commit, and every commit
   rebuilds the site. A member changing their own password should not
   trigger a deployment of the chamber website.

   WHAT TO USE

   Upstash Redis. The free tier is 256 MB and 500,000 commands a month,
   which is far more than 61 members will ever use.

   TWO WAYS TO SET IT UP, AND ONLY ONE OF THEM IS FREE

   Through the Vercel marketplace, billing runs through Vercel and the free
   tier is not offered. Sign up at upstash.com directly and it is.

   Either way this only needs two values, so create the database wherever
   you like and put them in the Vercel settings. Both naming conventions
   are accepted, so you can paste whichever pair you are shown without
   renaming anything:

     KV_REST_API_URL          what the Vercel integration sets
     KV_REST_API_TOKEN

     UPSTASH_REDIS_REST_URL   what the Upstash console shows you
     UPSTASH_REDIS_REST_TOKEN

   IF IT IS EVER LOST

   Nothing irreplaceable is in here. Members set a new password by email,
   the same way they set the first one. That is worth knowing, because it
   means this does not need backing up and does not carry the obligations
   a real member database would.
   ========================================================================== */

/* Either naming. The Vercel integration sets KV_*, the Upstash console
   shows UPSTASH_*, and having to rename one to the other is a pointless
   step that only exists to be got wrong. */
const conf = () => ({
  url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '')
    .trim().replace(/\/$/, ''),
  token: (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '')
    .trim()
});

export function storeReady() {
  const { url, token } = conf();
  return Boolean(url && token);
}

export function storeMissing() {
  const { url, token } = conf();
  return [
    !url && 'KV_REST_API_URL (or UPSTASH_REDIS_REST_URL)',
    !token && 'KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)'
  ].filter(Boolean);
}

async function command(...parts) {
  const { url, token } = conf();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(parts)
  });

  if (!res.ok) {
    const detail = await res.text();
    throw Object.assign(
      new Error('The credential store did not answer. Check KV_REST_API_URL and KV_REST_API_TOKEN.'),
      { status: 502, detail }
    );
  }

  const out = await res.json();
  if (out.error) {
    throw Object.assign(new Error('The credential store returned an error.'), { status: 502, detail: out.error });
  }
  return out.result;
}

export const kvGet = key => command('GET', key);
export const kvSet = (key, value) => command('SET', key, value);
export const kvDel = key => command('DEL', key);

/* Counts that clean themselves up. Used for failed sign-in attempts, so a
   lockout expires on its own rather than needing anybody to clear it. */
export async function kvBump(key, seconds) {
  const n = await command('INCR', key);
  if (n === 1) await command('EXPIRE', key, String(seconds));
  return n;
}
