// Turns a cart into a safe Stripe order. Prices and availability come from the site's
// saved content (never from the browser), so a shopper can't change what they pay.

export const PRINT_SHIPPING_CENTS = 700; // flat $7 per order, however many prints
export const MAX_QTY = 10;

const optionsOf = (a) =>
  Array.isArray(a.options) ? a.options.filter((o) => o && typeof o === "object" && String(o.label ?? "").trim()) : [];

export function findByPrice(content, priceId) {
  for (const a of (content && content.artwork) || []) {
    if (!a || typeof a !== "object") continue;
    const opts = optionsOf(a);
    if (opts.length) {
      const o = opts.find((o) => o.stripePrice === priceId);
      if (o) return { a, label: String(o.label) };
    } else if (a.stripePrice === priceId) {
      return { a, label: "" };
    }
  }
  return null;
}

export const isAvailable = (a) => !(a.status === "sold" || a.status === "display" || a.inShop === false);
export const isPrint = (a) => a.type === "print";

const quoteCents = (a) => {
  if (a.shipping === "" || a.shipping == null || isNaN(Number(a.shipping))) return null;
  return Math.round(Number(a.shipping) * 100);
};

/** items: [{ price: "price_…", quantity }]  →  { lines, shipping } or { error } */
export function buildOrder(content, items) {
  if (!Array.isArray(items) || !items.length) return { error: "Your cart is empty." };
  if (items.length > 30) return { error: "That cart is too large." };

  const byPrice = new Map();
  for (const it of items) {
    const price = it && typeof it.price === "string" ? it.price.trim() : "";
    if (!/^price_[A-Za-z0-9]+$/.test(price)) return { error: "One of the items in your cart isn't set up for checkout." };
    const found = findByPrice(content, price);
    if (!found) return { error: "One of the items in your cart is no longer available. Please refresh the page." };
    const { a, label } = found;
    if (!isAvailable(a)) return { error: `“${a.title}” is no longer available.` };
    // One-of-a-kind originals are always quantity 1.
    const qty = isPrint(a) ? Math.min(Math.max(parseInt(it.quantity) || 1, 1), MAX_QTY) : 1;
    const prev = byPrice.get(price);
    byPrice.set(price, { price, a, label, quantity: isPrint(a) ? Math.min((prev ? prev.quantity : 0) + qty, MAX_QTY) : 1 });
  }

  const lines = [...byPrice.values()];
  const prints = lines.filter((l) => isPrint(l.a));
  const originals = lines.filter((l) => !isPrint(l.a));
  const quoted = originals.filter((l) => quoteCents(l.a) !== null);
  const pending = originals.length > quoted.length;
  const cents = (prints.length ? PRINT_SHIPPING_CENTS : 0) + quoted.reduce((s, l) => s + quoteCents(l.a), 0);

  return {
    lines,
    shipping: {
      cents,
      printsOnly: prints.length > 0 && originals.length === 0,
      pendingQuote: pending,
      label: pending
        ? prints.length ? "Shipping (prints $7 flat; originals quoted separately)" : "Shipping (quoted separately by Nelly)"
        : originals.length ? "Shipping" : "Standard Shipping",
    },
  };
}
