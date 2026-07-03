// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, price, email, name, phone, priceId, successPath, cancelPath, mode } = req.body;

    // 'payment' (eenmalig) of 'subscription' (maandelijks). Default eenmalig.
    const checkoutMode = mode === 'subscription' ? 'subscription' : 'payment';

    // Redirect-basis: gebruik de origin van het verzoek, val terug op de oude URL.
    const baseUrl = req.headers.origin || 'https://workapp-oyoj04i0x-myarc.vercel.app';

    // Line items: óf een bestaande Stripe Price (priceId), óf inline price_data.
    const lineItems = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `MY ARC ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: getPlanDescription(plan)
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      // iDEAL ondersteunt geen recurring; subscriptions dus alleen kaart.
      payment_method_types: checkoutMode === 'subscription' ? ['card'] : ['card', 'ideal'],
      line_items: lineItems,
      mode: checkoutMode,
      allow_promotion_codes: true,
      success_url: `${baseUrl}${successPath || '/success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath || '/checkout'}`,
      ...(email ? { customer_email: email } : {}),
      metadata: {
        plan: plan || 'back-in-shape',
        customer_name: name || '',
        customer_phone: phone || '',
      }
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}

function getPlanDescription(plan) {
  const descriptions = {
    trial: '2 weken begeleiding met basis meal plan en workout schema',
    standard: '12 weken complete transformatie met persoonlijke begeleiding',
    premium: '24 weken intensive coaching met AI-powered planning en garantie',
    test: 'Test betaling voor development'
  };
  return descriptions[plan] || 'Personal training programma';
}
