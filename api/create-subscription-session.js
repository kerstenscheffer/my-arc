// api/create-subscription-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, priceId, email, name, phone } = req.body;

    // Voor subscriptions moet je eerst Price IDs maken in Stripe Dashboard
    // Of gebruik price_data voor dynamische prijzen
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal', 'sepa_debit'],
      line_items: [{
        price: priceId, // Gebruik Stripe Price ID voor subscriptions
        quantity: 1,
      }],
      mode: 'subscription', // BELANGRIJK: subscription ipv payment
      success_url: 'https://workapp-2mzfs6o1d-myarc.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://workapp-2mzfs6o1d-myarc.vercel.app/checkout',
      customer_email: email,
      metadata: {
        plan: plan,
        customer_name: name,
        customer_phone: phone || ''
      },
      subscription_data: {
        trial_period_days: 7, // Optioneel: 7 dagen gratis trial
        metadata: {
          plan: plan
        }
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Voor dynamische subscription zonder Price IDs
export async function createDynamicSubscription(req, res) {
  const { plan, monthlyPrice, email, name } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'ideal', 'sepa_debit'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `MY ARC ${plan} - Maandelijks`,
          description: 'Maandelijkse coaching subscription'
        },
        unit_amount: monthlyPrice * 100, // bijv €49/maand
        recurring: {
          interval: 'month' // of 'week', 'year'
        }
      },
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: 'https://workapp-2mzfs6o1d-myarc.vercel.app/success',
    cancel_url: 'https://workapp-2mzfs6o1d-myarc.vercel.app/checkout'
  });

  return session;
}
