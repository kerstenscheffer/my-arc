// api/create-6month-subscription.js - ES MODULE VERSION
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { plan, priceId, email, name, phone, duration } = req.body

    console.log('📥 6-Month Subscription request:', { plan, priceId, email, name, duration })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan: plan,
          duration: duration || '6-months',
          start_date: new Date().toISOString(),
          customer_name: name,
          customer_phone: phone
        }
      },
      customer_email: email,
      success_url: `${req.headers.origin || 'https://www.myarcfitness.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.myarcfitness.com'}/6month-checkout`,
      metadata: {
        plan: plan,
        duration: duration || '6-months',
        customer_name: name,
        customer_phone: phone
      }
    })

    console.log('✅ Session created:', session.id)

    return res.status(200).json({ 
      sessionId: session.id 
    })

  } catch (error) {
    console.error('❌ Stripe error:', error)
    return res.status(500).json({ 
      error: error.message 
    })
  }
}
