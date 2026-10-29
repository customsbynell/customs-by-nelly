// POST /api/upload → stores a photo (admin password required) and returns its URL
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { isAdmin, json } from "../lib/auth.mjs";

const MAX_BYTES = 5 * 1024 * 1024; // photos are resized in the browser first, so they're usually well under 1 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAdmin(req)) return json({ error: "Wrong password" }, 401);

  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED.includes(type)) return json({ error: "Please upload a JPG, PNG or WebP photo." }, 415);

  const data = await req.arrayBuffer();
  if (!data.byteLength) return json({ error: "The photo was empty." }, 400);
  if (data.byteLength > MAX_BYTES) return json({ error: "That photo is too large." }, 413);

  const key = randomUUID();
  await getStore("images").set(key, data, { metadata: { type, uploadedAt: new Date().toISOString() } });
  return json({ url: `/api/img/${key}` });
};

export const config = { path: "/api/upload" };
