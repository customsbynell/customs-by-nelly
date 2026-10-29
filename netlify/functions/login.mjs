// POST /api/login → checks the admin password (set as ADMIN_PASSWORD in Netlify)
import { isAdmin, json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: "No admin password is set. Add ADMIN_PASSWORD in Netlify, then redeploy." }, 401);
  }
  // Small delay makes password guessing slower.
  await new Promise((r) => setTimeout(r, 400));
  return isAdmin(req) ? json({ ok: true }) : json({ error: "Wrong password" }, 401);
};

export const config = { path: "/api/login" };
