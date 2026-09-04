/* ==========================================================================
   IS THIS THING SET UP

   Reports which settings are in place and which are not.

   IT NEVER RETURNS A VALUE, ONLY WHETHER ONE EXISTS

   No secret is echoed back, not even partially. What comes out is a list of
   names and yes or no. That is why it does not need a password of its own:
   it tells an attacker nothing they could not learn by trying each feature
   and seeing which ones work.

   It exists because setting this up means nine separate values across three
   services, and finding out which one is wrong by clicking around the site
   is miserable. Ask this instead.
   ========================================================================== */

const has = name => Boolean((process.env[name] || '').trim());
const either = (...names) => names.some(has);

export default async function handler(req, res) {
  const groups = [
    {
      id: 'members',
      title: 'Member sign in',
      what: 'Members sign in with their own password at /members/.',
      settings: [
        { name: 'MEMBER_SECRET', ok: has('MEMBER_SECRET'),
          note: (process.env.MEMBER_SECRET || '').trim().length >= 32
            ? null
            : 'Set, but shorter than 32 characters. Make it longer.' },
        { name: 'KV_REST_API_URL', ok: either('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'),
          note: 'Or UPSTASH_REDIS_REST_URL. Where passwords are kept.' },
        { name: 'KV_REST_API_TOKEN', ok: either('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'),
          note: 'Or UPSTASH_REDIS_REST_TOKEN.' },
        { name: 'RESEND_API_KEY', ok: has('RESEND_API_KEY'),
          note: 'Sends the links for setting and resetting a password.' },
        { name: 'MEMBER_EMAIL_FROM', ok: has('MEMBER_EMAIL_FROM'),
          note: 'The address those come from, on a domain verified with Resend.' }
      ]
    },
    {
      id: 'policy',
      title: 'Business Policy Center',
      what: 'The shared passcode, which is the fallback while some members have no email address.',
      settings: [
        { name: 'MEMBER_PASSCODE', ok: has('MEMBER_PASSCODE'),
          note: 'Optional once every member can sign in. Until then, the only way most of them get in.' }
      ]
    },
    {
      id: 'admin',
      title: 'The admin',
      what: 'Editing the site content at /admin/ without touching GitHub.',
      settings: [
        { name: 'ADMIN_PASSCODE', ok: has('ADMIN_PASSCODE'),
          note: 'Must not be the same as MEMBER_PASSCODE.' },
        { name: 'GITHUB_REPO', ok: has('GITHUB_REPO'),
          note: /^[\w.-]+\/[\w.-]+$/.test((process.env.GITHUB_REPO || '').trim())
            ? null
            : 'Set, but not in the form owner/repository.' },
        { name: 'GITHUB_TOKEN', ok: has('GITHUB_TOKEN'),
          note: /^(gh[pousr]_|github_pat_)/.test((process.env.GITHUB_TOKEN || '').trim())
            ? null
            : 'Set, but it does not look like a GitHub token. Real ones start github_pat_ or ghp_.' },
        { name: 'GITHUB_BRANCH', ok: true, optional: true,
          note: has('GITHUB_BRANCH')
            ? `Set to "${process.env.GITHUB_BRANCH.trim()}".`
            : 'Not set, so main is assumed. Only needed if your default branch is something else.' }
      ]
    }
  ];

  for (const g of groups) {
    const required = g.settings.filter(s => !s.optional);
    g.ready = required.every(s => s.ok);
    g.missing = required.filter(s => !s.ok).length;
    g.warnings = g.settings.filter(s => s.ok && s.note && /Set, but/.test(s.note)).length;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ready: groups.every(g => g.ready),
    groups
  });
}
