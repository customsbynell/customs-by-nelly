// POST /api/checkout  { items: [{ price: "price_…", quantity }] }  →  { url } (a Stripe Checkout page)
import Stripe from "stripe";
import { getStore } from "@netlify/blobs";
import { json } from "../lib/auth.mjs";
import { buildOrder } from "../lib/order.mjs";

// The flat $7 "Standard Shipping" rate created in Stripe, used when the cart is prints only.
const PRINT_SHIPPING_RATE = process.env.STRIPE_PRINT_SHIPPING_RATE || "shr_1UX62J9vUMYisRBucVV26wOU";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!process.env.STRIPE_SECRET_KEY) return json({ error: "Checkout isn't set up yet." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "That cart wasn't valid." }, 400); }

  const content = await getStore({ name: "site", consistency: "strong" }).get("content", { type: "json" });
  if (!content) return json({ error: "Checkout isn't ready yet. Publish the site once from #admin." }, 503);

  const order = buildOrder(content, body && body.items);
  if (order.error) return json({ error: order.error }, 400);

  const { shipping } = order;
  const shipping_options = shipping.printsOnly
    ? [{ shipping_rate: PRINT_SHIPPING_RATE }]
    : [{
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping.cents, currency: "usd" },
          display_name: shipping.label,
        },
      }];

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: order.lines.map((l) => ({ price: l.price, quantity: l.quantity })),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options,
      ...(shipping.pendingQuote
        ? { custom_text: { shipping_address: { message: "Shipping for original artwork is quoted separately. Nelly will email you a shipping invoice after you order." } } }
        : {}),
      metadata: {
        pieces: order.lines.map((l) => `${l.a.id}${l.label ? " (" + l.label + ")" : ""} x${l.quantity}`).join("; ").slice(0, 480),
        shipping_quote_pending: shipping.pendingQuote ? "yes" : "no",
      },
      success_url: `${origin}/?order=success`,
      cancel_url: `${origin}/`,
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: "Checkout couldn't start. Please try again in a moment." }, 502);
  }
};

export const config = { path: "/api/checkout" };
