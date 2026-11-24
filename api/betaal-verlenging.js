// api/betaal-verlenging.js
//
// Betaallink voor een open verlenging (24 nov 2026, Kersten): de klant tikt in
// de app op "Nu betalen" en komt hier met ?id=<lead_movements.id>. Wij maken
// een Stripe Checkout voor precies dat bedrag en sturen door. De webhook
// (stripe-webhook.js, checkout.session.completed met metadata.verlenging_id)
// zet de verlenging daarna op betaald; triggers doen de rest (doorstap
// betaald, borg behouden, slot eraf), en de melding in de app verdwijnt.
//
//   prepaid  → eenmalig, iDEAL of kaart, order_value
//   monthly  → abonnement van order_value / duration_months per maand, stopt
//              vanzelf na duration_months termijnen (metadata.duration, zie
//              zetEinddatum in stripe-webhook.js)
//
// Het id is een uuid (niet te raden). Er wordt hier niets geschreven.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const SUPABASE_URL = [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL]
  .map(v => String(v || '').trim().replace(/^["']|["']$/g, ''))
  .find(v => /^https?:\/\/\S+$/.test(v)) || 'https://xlaycpwpnhjmulfsnynh.supabase.co';
const supabase = createClient(SUPABASE_URL, String(process.env.SUPABASE_SERVICE_KEY || '').trim() || 'ontbreekt');

const BASIS = 'https://www.myarcfitness.com';
const VERLENGING = 'Verlenging 🔁';

function pagina(res, status, titel, tekst) {
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titel}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:-apple-system,system-ui,sans-serif;padding:24px;box-sizing:border-box;text-align:center}
h1{font-size:1.4rem;margin:0 0 10px}p{color:rgba(255,255,255,.65);line-height:1.5;margin:0}</style></head>
<body><div><h1>${titel}</h1><p>${tekst}</p></div></body></html>`);
}

export default async function handler(req, res) {
  const id = String(req.query?.id || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return pagina(res, 400, 'Link klopt niet', 'Open de betaling opnieuw vanuit de app.');

  try {
    const { data: lm, error } = await supabase.from('lead_movements')
      .select('id, client_id, order_value, payment_type, duration_months, payment_received, reverted_at, aanbod, to_section_title')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!lm || lm.reverted_at || lm.to_section_title !== VERLENGING || !(Number(lm.order_value) > 0)) {
      return pagina(res, 404, 'Geen open betaling', 'Deze betaling bestaat niet (meer). Vraag je coach om een nieuwe link.');
    }
    if (lm.payment_received) return pagina(res, 200, 'Al betaald', 'Deze betaling is al binnen. Je kunt de app weer openen.');

    const { data: klant } = await supabase.from('clients').select('email, first_name, last_name').eq('id', lm.client_id).maybeSingle();
    const naam = [klant?.first_name, klant?.last_name].filter(Boolean).join(' ').trim();
    const product = `MY ARC ${lm.aanbod || 'vervolgtraject'}`;
    const metadata = { plan: 'verlenging', verlenging_id: lm.id, client_id: lm.client_id || '', customer_name: naam };
    const maandelijks = lm.payment_type === 'monthly' && Number(lm.duration_months) > 1;
    const maanden = Math.max(1, Number(lm.duration_months) || 1);

    const session = await stripe.checkout.sessions.create(maandelijks ? {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: product, description: `${maanden} maanden, per maand` },
          unit_amount: Math.round((Number(lm.order_value) / maanden) * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      subscription_data: { metadata: { ...metadata, duration: `${maanden}-months` } },
      metadata,
      ...(klant?.email ? { customer_email: klant.email } : {}),
      success_url: `${BASIS}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASIS}/`,
    } : {
      mode: 'payment',
      payment_method_types: ['card', 'ideal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: product },
          unit_amount: Math.round(Number(lm.order_value) * 100),
        },
        quantity: 1,
      }],
      payment_intent_data: { metadata },
      metadata,
      ...(klant?.email ? { customer_email: klant.email } : {}),
      success_url: `${BASIS}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASIS}/`,
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(303, session.url);
  } catch (e) {
    console.error('betaal-verlenging:', id, e.message);
    return pagina(res, 500, 'Even mis', 'De betaalpagina kon niet geopend worden. Probeer het zo nog eens of laat het je coach weten.');
  }
}
