export default async function handler(req, res) {
  // Log voor debugging
  console.log('Webhook called:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Accepteer alleen POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Voor nu, log en return success
    console.log('Calendly event received:', event.event || 'unknown');
    
    return res.status(200).json({ 
      success: true,
      received: true,
      message: 'Webhook received successfully',
      event: event.event || 'test'
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
