// api/stripe-webhook.js
// MINIMAL WORKING VERSION - Start hier, voeg features toe

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Webhook received at:', new Date().toISOString());
  console.log('Event type:', req.body?.type);

  try {
    // For now, just log and acknowledge
    const event = req.body;
    
    if (!event || !event.type) {
      console.error('Invalid webhook body');
      return res.status(400).json({ error: 'Invalid webhook body' });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Checkout completed!');
        console.log('Session ID:', event.data?.object?.id);
        console.log('Customer email:', event.data?.object?.customer_email);
        // TODO: Add database save here
        break;
        
      case 'payment_intent.succeeded':
        console.log('Payment succeeded!');
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Disable body parsing for raw body (needed for signature verification later)
export const config = {
  api: {
    bodyParser: true, // Start with true for testing, change to false when adding signature verification
  },
};
