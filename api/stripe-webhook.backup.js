import { createClient } from '@supabase/supabase-js';

// VOLLEDIG HARDCODED - geen environment variables
const supabase = createClient(
  'https://xlaycpwpnhjmulfsnynh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxMTM0NSwiZXhwIjoyMDcwNTg3MzQ1fQ.Pq3ikZmgbMKia_KxEVfVs_QktFuI-fLy-Awh_Cf104w'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutCompleted(session) {
  console.log('Processing checkout:', session.id);
  
  try {
    // Extract alle data uit session
    const clientEmail = session.customer_email || session.customer_details?.email || 'unknown@test.com';
    const clientName = session.customer_details?.name || extractNameFromEmail(clientEmail);
    const phone = session.customer_details?.phone || '';
    
    // Bepaal product type op basis van amount
    const amount = session.amount_total || 0;
    let productType = 'standard';
    
    if (amount >= 50000) { // €500+
      productType = 'premium';
    } else if (amount >= 30000) { // €300+
      productType = 'advanced';
    } else if (amount >= 15000) { // €150+
      productType = 'standard';
    } else {
      productType = 'trial';
    }

    // Check of payment al bestaat (voorkom duplicates)
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single();

    if (existing) {
      console.log('Payment already exists:', existing.id);
      return;
    }

    // Save payment naar database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_id: session.payment_intent,
        stripe_customer_id: session.customer,
        client_email: clientEmail,
        client_name: clientName,
        phone: phone,
        amount: amount,
        currency: session.currency || 'eur',
        status: 'completed',
        payment_method: session.payment_method_types?.[0] || 'card',
        product_type: productType,
        metadata: {
          mode: session.mode,
          payment_status: session.payment_status,
          session_metadata: session.metadata || {}
        },
        created_at: new Date().toISOString(),
        activated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      throw paymentError;
    }

    console.log('Payment saved:', payment.id);

    // Check of client al bestaat
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, email, status')
      .eq('email', clientEmail)
      .single();

    if (!existingClient) {
      // Maak nieuwe client aan
      const firstName = clientName.split(' ')[0] || 'New';
      const lastName = clientName.split(' ').slice(1).join(' ') || 'Client';
      
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          email: clientEmail,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          status: 'active',
          // Set stripe info
          stripe_customer_id: session.customer,
          last_payment_date: new Date().toISOString(),
          total_paid: amount,
          // Set initial targets based on product type
          target_calories: productType === 'premium' ? 2500 : 2200,
          target_protein: productType === 'premium' ? 180 : 150,
          primary_goal: productType === 'premium' ? 'muscle_gain' : 'fat_loss',
          created_at: new Date().toISOString(),
          activated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('Client creation error:', clientError);
        // Don't throw - payment is already saved
      } else {
        console.log('New client created:', newClient.id);
        
        // Update payment met client_id
        await supabase
          .from('payments')
          .update({ 
            client_id: newClient.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
      }
    } else {
      // Update bestaande client
      console.log('Existing client found:', existingClient.id);
      
      // Update bestaande client met payment info
      await supabase
        .from('clients')
        .update({ 
          status: 'active',
          stripe_customer_id: session.customer || existingClient.stripe_customer_id,
          last_payment_date: new Date().toISOString(),
          total_paid: (existingClient.total_paid || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingClient.id);
      
      // Link payment aan client
      await supabase
        .from('payments')
        .update({ 
          client_id: existingClient.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);
    }

    // Send notification (optional - voor later)
    // await sendWelcomeEmail(clientEmail, clientName, productType);

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    // Don't throw - we want webhook to return 200
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    // Update payment status als het bestaat
    const { data, error } = await supabase
      .from('payments')
      .update({ 
        status: 'succeeded',
        stripe_payment_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .or(`stripe_payment_id.eq.${paymentIntent.id}`, `stripe_session_id.eq.${paymentIntent.id}`);

    if (error) {
      console.error('Error updating payment:', error);
    } else if (data) {
      console.log('Payment updated to succeeded');
    }
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

// Helper function
function extractNameFromEmail(email) {
  const username = email.split('@')[0];
  return username
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
