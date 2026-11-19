# Customs by Nelly — website

A single-page site (`public/index.html`) with a built-in editor and a small Netlify backend for one-click publishing.

## How it works

- **The site** reads its content from `/api/content` (stored in Netlify Blobs). If nothing has been published yet, it uses the content built into `index.html`.
- **The editor** opens at `/#admin`. It asks for the admin password, then lets you edit text inline, manage artwork (photos, prices, size options), rearrange/add/hide sections, edit the menu, change colors, fonts and logo, manage reviews, and press **Publish**.
- **Updating the design** never touches published content: replace `public/index.html` and the site reads the same stored content. Older content (from the previous layout) is upgraded automatically on load and saved in the new shape on the next Publish. The editor's Settings → *Bring in a saved site* imports content from a downloaded `index.html`.
- **Photos** uploaded in the editor are resized in the browser (max 1800px; JPEG, or PNG for see-through images), then stored in Netlify Blobs and served from `/api/img/<id>`.
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
| `netlify/functions/checkout.mjs` | `POST /api/checkout`. Creates the Stripe Checkout session |
| `netlify/lib/order.mjs` | Prices, availability and shipping rules for an order |
| `netlify/lib/auth.mjs` | Password check: `x-admin-password` header, URI-encoded, constant-time compare |

## Notes

- To change the password, update `ADMIN_PASSWORD` and redeploy.
- Without the backend (local file, preview, drag-and-drop hosting), the editor's **Save** button downloads an updated `index.html` instead of publishing.
- **Checkout:** the cart opens a Stripe Checkout page (`/api/checkout`). Prints ship for a flat $7 per order. Originals are one of a kind (quantity 1) and their shipping is quoted separately, or set per piece in the editor. Prices and availability are read from the saved site content on the server, not from the browser.
- **Stripe price IDs:** every piece (or every size of a piece) needs a `price_…` ID in the editor. Pieces missing one show “⚠ Needs Stripe ID” in the editor and can't be checked out.
- **Environment variables:** `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`. Optional: `STRIPE_PRINT_SHIPPING_RATE` (defaults to the $7 Standard Shipping rate).
- **Preview safety:** publishing only works on the live site. Previews and branch deploys share the live site's saved content, so `/api/content` refuses to save there and the editor shows “Preview only”.
- Mark an original **Sold** in the editor after it sells (this isn't automatic yet).
