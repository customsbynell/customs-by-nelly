import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s) => createHash("sha256").update(String(s)).digest();

// The site sends the password URI-encoded in the x-admin-password header.
export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  let given = req.headers.get("x-admin-password") || "";
  try { given = decodeURIComponent(given); } catch { return false; }
  return timingSafeEqual(digest(given), digest(expected));
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
