// api/create-subscription-session.js
// Handles BOTH subscription (€150/mnd) and one-time payment (€450)
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { plan, priceId, email, name, phone, duration, mode } = req.body

    console.log('📥 Checkout request:', { plan, priceId, email, name, mode })

    const isOneTime = mode === 'payment'

    const sessionConfig = {
      payment_method_types: ['card', 'ideal'],
      mode: isOneTime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${req.headers.origin || 'https://www.myarcfitness.com'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.myarcfitness.com'}/monthly-checkout`,
      metadata: {
        plan: plan || (isOneTime ? '12-weken-direct' : '12-weken-maandelijks'),
        customer_name: name,
        customer_phone: phone || ''
      }
    }

    // Add subscription metadata only for subscriptions
    if (!isOneTime) {
      sessionConfig.subscription_data = {
        metadata: {
          plan: plan,
          duration: duration || '3-months',
          start_date: new Date().toISOString(),
          customer_name: name,
          customer_phone: phone
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('✅ Session created:', session.id, isOneTime ? '(one-time)' : '(subscription)')
    return res.status(200).json({ sessionId: session.id })

  } catch (error) {
    console.error('❌ Stripe error:', error)
    return res.status(500).json({ error: error.message })
  }
}
