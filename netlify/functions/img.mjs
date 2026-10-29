// GET /api/img/:key → serves an uploaded photo
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const key = context.params.key;
  if (!key || !/^[a-zA-Z0-9-]{8,64}$/.test(key)) return new Response("Not found", { status: 404 });

  const entry = await getStore("images").getWithMetadata(key, { type: "stream" });
  if (!entry) return new Response("Not found", { status: 404 });

  return new Response(entry.data, {
    headers: {
      "content-type": entry.metadata?.type || "image/jpeg",
      // Photos never change once uploaded (a new upload gets a new address), so cache them for a year.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/img/:key" };
