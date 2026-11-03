import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { items } = await req.json(); // [{ price: 'price_123', quantity: 2 }]
    if (!Array.isArray(items) || !items.length) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }
    const line_items = items
      .filter(i => typeof i.price === 'string' && i.price.startsWith('price_'))
      .map(i => ({ price: i.price, quantity: Math.min(Math.max(parseInt(i.quantity) || 1, 1), 10) }));
    if (!line_items.length) return Response.json({ error: 'No valid items' }, { status: 400 });

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: [{ shipping_rate: 'shr_1UX62J9vUMYisRBucVV26wOU' }],
      success_url: `${origin}/?order=success`,
      cancel_url: `${origin}/`,
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: '/api/checkout' };
