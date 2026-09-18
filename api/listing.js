/* ==========================================================================
   A MEMBER EDITING THEIR OWN LISTING

   Signed-in members change their own directory page. Nobody else's.

   WHY THIS EXISTS

   Sixty-one listings have no description because collecting them was the
   chamber's job and the chamber has no staff. It was never going to happen
   by phone. The member knows what their business does; the chamber does
   not. So the member writes it.

   WHAT A MEMBER CAN CHANGE

   Their name, what they do, their contact details, their category, the
   tags on their page, and their logo.

   WHAT THEY CANNOT, AND WHY EACH ONE

     slug     their web address. Changing it after search engines have
              found the page breaks every link to it.
     tier     what they pay. That is a billing decision, not a form field.
     access   who can sign in as them. If this were editable, anybody who
              got into one account could add themselves permanently.

   Those three are simply not read from the request. They are not hidden in
   the interface and rejected later; they never leave the stored record.

   EDITS GO LIVE STRAIGHT AWAY

   No approval queue. A queue in an organisation with no staff is a queue
   that never empties, and members stop bothering after the second time
   their change sits for a fortnight.

   The protection is that every change is a git commit with the member's
   name on it, so the chamber can see exactly who changed what and put it
   back with one click. An audit trail and an undo, rather than a gate.
   ========================================================================== */

import { createHash } from 'node:crypto';
import { currentMember } from './member.js';
import { updateContent, ghMissing, writeAsset, deleteAsset } from './_lib/github.js';

/* Long enough for anything genuine, short enough that the field cannot be
   used to publish an essay on the chamber's website. */
const LIMITS = {
  name: 120,
  summary: 300,
  about: 1500,
  city: 60,
  person: 80,
  phone: 40,
  email: 120,
  web: 200,
  address: 200,
  serves: 40      // each tag
};

const MAX_TAGS = 8;

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);

function tidyUrl(v) {
  const s = clean(v, LIMITS.web);
  if (!s) return '';
  const withScheme = /^https?:\/\//i.test(s) ? s : 'https://' + s;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

/* ---------- the logo --------------------------------------------------------

   The browser does the hard part before anything is sent: whatever the
   member picks (PNG, JPEG, WebP, even SVG) is drawn onto a canvas, shrunk
   to fit 400 pixels, and sent as WebP or PNG. So what arrives here is
   always one of two small raster formats.

   That matters for more than size. An SVG is a document that can carry
   script, and one uploaded to this site and opened directly would run on
   the chamber's own address. Accepting only raster images, and checking
   the actual bytes rather than trusting the label, closes that off.

   Each upload gets a new name built from its contents, so a browser never
   shows the old logo from its cache. The previous upload is then removed. */

const MAX_LOGO_BYTES = 400 * 1024;
const OURS = slug => new RegExp('^/assets/members/' + slug + '-[0-9a-f]{10}\\.(webp|png)$');

function sniff(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

async function saveLogo(member, body, res) {
  const author = `${member.name} via member sign in`;
  let path = null;

  if (body.action === 'logo') {
    const m = /^data:image\/(png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
    const buf = m ? Buffer.from(m[2], 'base64') : null;
    const kind = buf ? sniff(buf) : null;
    if (!kind) {
      res.status(400).json({ error: 'bad_image', message: 'That file could not be read as an image. A PNG or JPEG works best.' });
      return;
    }
    if (buf.length > MAX_LOGO_BYTES) {
      res.status(400).json({ error: 'too_big', message: 'That image is too large even after shrinking it. Try a simpler version of the logo.' });
      return;
    }
    const id = createHash('sha256').update(buf).digest('hex').slice(0, 10);
    path = `assets/members/${member.slug}-${id}.${kind}`;
    await writeAsset(path, buf.toString('base64'), `${member.name} uploaded a logo`, author);
  }

  let before = null;
  await updateContent('members.json', data => {
    const rec = (data.members || []).find(x => x.slug === member.slug);
    if (!rec) throw Object.assign(new Error('That listing is no longer in the directory.'), { status: 404 });
    before = rec.logo || null;
    if (path) rec.logo = '/' + path; else delete rec.logo;
  }, path ? `${member.name} changed their logo` : `${member.name} removed their logo`, author);

  /* Only ever a file this member uploaded. A logo the chamber put in
     place by hand, under some other name, is left alone. */
  if (before && before !== (path && '/' + path) && OURS(member.slug).test(before)) {
    await deleteAsset(before.slice(1), `Remove ${member.name}'s previous logo`, author);
  }

  res.status(200).json({
    ok: true,
    logo: path ? '/' + path : null,
    message: path
      ? 'Logo saved. It shows on your page in about a minute.'
      : 'Logo removed. Your page goes back to showing your initial in about a minute.'
  });
}

export default async function handler(req, res) {
  try {
    const member = currentMember(req);
    if (!member) {
      res.status(401).json({ error: 'signed_out', message: 'Please sign in again.' });
      return;
    }

    const body = req.method === 'POST' ? await readBody(req) : {};

    if (req.method === 'GET' || body.action === 'load') {
      res.status(200).json({ member });
      return;
    }

    const missing = ghMissing();
    if (missing.length) {
      res.status(503).json({
        error: 'not_configured',
        message: `Saving is not set up yet. Missing in the Vercel project settings: ${missing.join(', ')}.`
      });
      return;
    }

    if (body.action === 'logo' || body.action === 'removelogo') {
      await saveLogo(member, body, res);
      return;
    }

    const name = clean(body.name, LIMITS.name);
    if (!name) {
      res.status(400).json({ error: 'no_name', message: 'A business name is needed.' });
      return;
    }

    const web = tidyUrl(body.web);
    if (web === null) {
      res.status(400).json({
        error: 'bad_url',
        message: 'That website address does not look right. It should look like example.com or https://example.com.'
      });
      return;
    }

    const email = clean(body.email, LIMITS.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'bad_email', message: 'That email address does not look right.' });
      return;
    }

    const serves = (Array.isArray(body.serves) ? body.serves : [])
      .map(s => clean(s, LIMITS.serves))
      .filter(Boolean)
      .slice(0, MAX_TAGS);

    const contact = {};
    const person = clean(body.person, LIMITS.person);
    const phone = clean(body.phone, LIMITS.phone);
    const address = clean(body.address, LIMITS.address);
    if (person) contact.person = person;
    if (phone) contact.phone = phone;
    if (email) contact.email = email;
    if (web) contact.web = web;
    if (address) contact.address = address;

    const category = clean(body.category, 40);

    /* Applied to a freshly read copy of the file, and only ever to this
       member's own record. Everything about them that is not in the form
       is carried across untouched, which is what protects slug, tier and
       access without needing to mention them. */
    const apply = data => {
      const list = data.members || [];
      const i = list.findIndex(m => m.slug === member.slug);
      if (i === -1) throw Object.assign(new Error('That listing is no longer in the directory.'), { status: 404 });

      const known = (data.categories || []).some(c => c.id === category);
      const before = list[i];

      list[i] = {
        ...before,
        name,
        summary: clean(body.summary, LIMITS.summary),
        about: clean(body.about, LIMITS.about),
        city: clean(body.city, LIMITS.city),
        category: known ? category : before.category,
        contact,
        ...(serves.length ? { serves } : {})
      };

      if (!serves.length) delete list[i].serves;
      if (!list[i].summary) delete list[i].summary;
      if (!list[i].about) delete list[i].about;
      if (!list[i].city) delete list[i].city;
    };

    const out = await updateContent(
      'members.json',
      apply,
      `${member.name} updated their own listing`,
      `${member.name} via member sign in`
    );

    res.status(200).json({
      ok: true,
      commit: out.commit,
      message: 'Saved. Your page updates in about a minute.'
    });
  } catch (err) {
    console.error('listing edit failed:', err, err.detail || '');
    res.status(err.status || 500).json({
      error: 'server_error',
      message: err.message || 'Something went wrong saving that.'
    });
  }
}
