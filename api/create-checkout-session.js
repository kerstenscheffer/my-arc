// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, price, email, name, phone } = req.body;
    
    // Update deze URL naar je laatste deployment
    const baseUrl = 'https://workapp-oyoj04i0x-myarc.vercel.app';

    // Create Stripe checkout session ZONDER custom_fields (die zorgen voor de error)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `MY ARC ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            description: getPlanDescription(plan)
          },
          unit_amount: price * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      
      // Enable promotional codes
      allow_promotion_codes: true,
      
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      customer_email: email,
      metadata: {
        plan: plan,
        customer_name: name,
        customer_phone: phone || '',
        // Fitness goal in metadata instead of custom_fields
        fitness_goal: plan === 'premium' ? 'muscle_gain' : 'fat_loss'
      }
    });

    res.status(200).json({ sessionId: session.id });
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
