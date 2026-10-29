// GET  /api/content  → the published site content (or null if nothing published yet)
// POST /api/content  → publish new content (admin password required)
import { getStore } from "@netlify/blobs";
import { isAdmin, json } from "../lib/auth.mjs";

export default async (req) => {
  const store = getStore({ name: "site", consistency: "strong" });

  if (req.method === "GET") {
    const content = await store.get("content", { type: "json" });
    return json({ backend: true, content: content || null });
  }

  if (req.method === "POST") {
    if (!isAdmin(req)) return json({ error: "Wrong password" }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: "That wasn't valid site content." }, 400); }
    if (!body || typeof body !== "object" || !Array.isArray(body.artwork)) {
      return json({ error: "That wasn't valid site content." }, 400);
    }
    // Keep the previous version, just in case.
    const previous = await store.get("content", { type: "json" });
    if (previous) await store.setJSON("content-previous", previous);
    await store.setJSON("content", body, { metadata: { publishedAt: new Date().toISOString() } });
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/content" };
