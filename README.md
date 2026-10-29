# Customs by Nelly — website

A single-page site (`public/index.html`) with a built-in editor and a small Netlify backend for one-click publishing.

## How it works

- **The site** reads its content from `/api/content` (stored in Netlify Blobs). If nothing has been published yet, it uses the content built into `index.html`.
- **The editor** opens at `/#admin`. It asks for the admin password, then lets you edit text inline, manage artwork, photos, prices and reviews, and press **Publish**.
- **Photos** uploaded in the editor are resized in the browser (max 1600px JPEG), then stored in Netlify Blobs and served from `/api/img/<id>`.
- **Forms** (`commission`, `order`, `review`, `newsletter`) use Netlify Forms. Turn on form detection, then redeploy once.

## Deploy

Functions need a Git or CLI deploy. Drag-and-drop won't run them.

**Option A — GitHub (no terminal):** push this folder to a repo, then use Netlify → Import an existing project. Set the environment variable `ADMIN_PASSWORD` before the first deploy. Settings come from `netlify.toml` (publish `public`, functions in `netlify/functions`).

**Option B — Netlify CLI:**

```bash
npm install
npx netlify-cli login
npx netlify-cli init          # or: link
npx netlify-cli env:set ADMIN_PASSWORD "choose-a-long-password"
npx netlify-cli deploy --prod
```

Then: Forms → Enable form detection → redeploy, and Forms → Submission notifications → add an email notification.

## Files

| Path | Purpose |
| --- | --- |
| `public/index.html` | The whole site, styles, editor and fallback content |
| `netlify/functions/content.mjs` | `GET/POST /api/content`. Keeps the previous version as `content-previous` |
| `netlify/functions/login.mjs` | `POST /api/login`. Checks the password |
| `netlify/functions/upload.mjs` | `POST /api/upload`. Stores a photo, max 5 MB |
| `netlify/functions/img.mjs` | `GET /api/img/:key`. Serves photos, cached for 1 year |
| `netlify/lib/auth.mjs` | Password check: `x-admin-password` header, URI-encoded, constant-time compare |

## Notes

- To change the password, update `ADMIN_PASSWORD` and redeploy.
- Without the backend (local file, preview, drag-and-drop hosting), the editor's **Save** button downloads an updated `index.html` instead of publishing.
- The cart sends an order request and takes no payment. Nelly follows up with a payment link.
