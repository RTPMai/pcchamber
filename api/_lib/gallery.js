/* ==========================================================================
   EVENT PHOTOS, FROM THE ADMIN

   Three steps, so a whole album is one commit and one rebuild:

     gallery-blob     one photo at a time, already shrunk by the browser.
                      Stored on GitHub as a loose blob. Nothing published.
     gallery-save     the album's details, the photos added (by blob),
                      removed and re-captioned. One commit: the image files
                      and content/gallery.json together.
     gallery-delete   the whole album and its files, in one commit.

   Only JPEGs, only under assets/gallery/, only in content/gallery.json.
   Nothing here can write anywhere else in the repository.
   ========================================================================== */

import { randomBytes } from 'node:crypto';
import { createBlob, commitFiles, ghMissing } from './github.js';

const MAX_FULL = 1.6 * 1024 * 1024;
const MAX_THUMB = 400 * 1024;
const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const isId = v => /^[0-9a-f]{10}$/.test(String(v || ''));
const isSha = v => /^[0-9a-f]{40}$/.test(String(v || ''));

const slugify = s => String(s).toLowerCase()
  .replace(/&/g, ' and ').replace(/['’`.,]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

const bad = (message, status = 400) => Object.assign(new Error(message), { status });

function jpeg(b64, max, what) {
  const data = String(b64 || '').replace(/^data:image\/jpeg;base64,/, '');
  if (!/^\/9j\//.test(data)) throw bad(`The ${what} is not a JPEG. Try the photo again.`);
  if (data.length * 0.75 > max) throw bad(`The ${what} is too large even after shrinking. Try a different photo.`);
  return data;
}

export async function galleryBlob(body) {
  if (ghMissing().length) throw bad(`Not set up. Missing in Vercel: ${ghMissing().join(', ')}.`, 503);
  const full = jpeg(body.full, MAX_FULL, 'photo');
  const thumb = jpeg(body.thumb, MAX_THUMB, 'small copy');
  const [sha, tsha] = await Promise.all([createBlob(full), createBlob(thumb)]);
  return { id: randomBytes(5).toString('hex'), sha, tsha };
}

const paths = (slug, id) => ({ src: `assets/gallery/${slug}/${id}.jpg`, thumb: `assets/gallery/${slug}/${id}-t.jpg` });

export async function gallerySave(body, who) {
  if (ghMissing().length) throw bad(`Not set up. Missing in Vercel: ${ghMissing().join(', ')}.`, 503);
  const a = body.album || {};
  const title = clean(a.title, 90);
  if (!title) throw bad('Give the album a name.');
  if (!isDate(a.date)) throw bad('Put in the date of the event.');

  const add = (Array.isArray(body.add) ? body.add : []).filter(p => isId(p.id) && isSha(p.sha) && isSha(p.tsha));
  const remove = new Set((Array.isArray(body.remove) ? body.remove : []).filter(isId));
  const alts = body.alts && typeof body.alts === 'object' ? body.alts : {};
  const order = Array.isArray(body.order) ? body.order.filter(isId) : null;
  let slug = /^[a-z0-9-]{1,70}$/.test(String(a.slug || '')) ? a.slug : '';
  const creating = !slug;

  const files = [];
  let removedFiles = [];

  const { commit, result } = await commitFiles({
    files,
    content: {
      name: 'gallery.json',
      apply: data => {
        data.albums = Array.isArray(data.albums) ? data.albums : [];
        let album;
        if (creating) {
          const base = slugify(`${title} ${a.date.slice(0, 7)}`) || 'album';
          slug = base;
          for (let n = 2; data.albums.some(x => x.slug === slug); n++) slug = `${base}-${n}`;
          album = { slug, photos: [] };
          data.albums.push(album);
        } else {
          album = data.albums.find(x => x.slug === slug);
          if (!album) throw bad('That album is not there any more. Somebody may have deleted it.', 404);
        }

        album.title = title;
        album.date = a.date;
        if (clean(a.summary, 400)) album.summary = clean(a.summary, 400); else delete album.summary;
        if ('event' in a) {
          if (/^[a-z0-9-]{1,80}$/.test(String(a.event || ''))) album.event = a.event; else delete album.event;
        }

        /* Removing: drop from the list and delete the files, in this commit. */
        removedFiles = [];
        album.photos = (album.photos || []).filter(p => {
          if (!remove.has(p.id)) return true;
          removedFiles.push(p.src.slice(1), p.thumb.slice(1));
          return false;
        });

        for (const p of add) {
          if (album.photos.some(x => x.id === p.id)) continue;
          const at = paths(slug, p.id);
          album.photos.push({
            id: p.id, src: '/' + at.src, thumb: '/' + at.thumb,
            w: Math.max(1, Math.min(4000, Number(p.w) || 1)), h: Math.max(1, Math.min(4000, Number(p.h) || 1)),
            ...(clean(p.alt, 200) ? { alt: clean(p.alt, 200) } : {})
          });
        }

        for (const p of album.photos) {
          if (Object.prototype.hasOwnProperty.call(alts, p.id)) {
            const t = clean(alts[p.id], 200);
            if (t) p.alt = t; else delete p.alt;
          }
        }

        if (order) {
          const rank = new Map(order.map((id, i) => [id, i]));
          album.photos.sort((x, y) => (rank.has(x.id) ? rank.get(x.id) : 1e6) - (rank.has(y.id) ? rank.get(y.id) : 1e6));
        }

        if (isId(a.cover) && album.photos.some(p => p.id === a.cover)) album.cover = a.cover;
        else if (!album.photos.some(p => p.id === album.cover)) delete album.cover;

        /* The files to write, now the slug is known. Rebuilt on every
           attempt, because a retry starts from a fresh copy. */
        files.length = 0;
        for (const p of add) {
          const at = paths(slug, p.id);
          files.push({ path: at.src, sha: p.sha }, { path: at.thumb, sha: p.tsha });
        }
        for (const f of removedFiles) files.push({ path: f, sha: null });

        return { slug, photos: album.photos.length };
      }
    }
  }, creating ? `Add photo album: ${title}` : `Update photo album: ${title} (${add.length} added, ${remove.size} removed)`, `${who} via chamber admin`);

  return { ok: true, commit, ...result };
}

export async function galleryDelete(body, who) {
  if (ghMissing().length) throw bad(`Not set up. Missing in Vercel: ${ghMissing().join(', ')}.`, 503);
  const slug = String(body.slug || '');
  if (!/^[a-z0-9-]{1,70}$/.test(slug)) throw bad('Pick an album.');
  const files = [];
  let title = slug;
  const { commit } = await commitFiles({
    files,
    content: {
      name: 'gallery.json',
      apply: data => {
        const album = (data.albums || []).find(x => x.slug === slug);
        if (!album) throw bad('That album was already deleted.', 404);
        title = album.title;
        files.length = 0;
        for (const p of album.photos || []) files.push({ path: p.src.slice(1), sha: null }, { path: p.thumb.slice(1), sha: null });
        data.albums = data.albums.filter(x => x !== album);
      }
    }
  }, `Delete photo album: ${title}`, `${who} via chamber admin`);
  return { ok: true, commit };
}
