// api/stripe-webhook.js
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
      // Payment events
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
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

// ============================================
// ONE-TIME PAYMENT HANDLERS
// ============================================

async function handleCheckoutCompleted(session) {
  console.log('Processing checkout:', session.id);
  
  try {
    // Extract alle data uit session
    const clientEmail = session.customer_email || session.customer_details?.email || 'unknown@test.com';
    const clientName = session.customer_details?.name || extractNameFromEmail(clientEmail);
    const phone = session.customer_details?.phone || '';
    
    // Check of het een subscription of payment is
    const isSubscription = session.mode === 'subscription';
    
    // Bepaal product type op basis van amount
    const amount = session.amount_total || 0;
    let productType = 'standard';
    
    if (amount >= 50000) { // €500+
      productType = 'premium';
    } else if (amount >= 30000) { // €300+
      productType = 'advanced';
    } else if (amount >= 15000) { // €150+
      productType = 'standard';
    } else if (amount <= 100) { // €1 test
      productType = 'test';
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
          is_subscription: isSubscription,
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
      .select('*')
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
          stripe_subscription_id: session.subscription, // Voor subscriptions
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
      const updateData = {
        status: 'active',
        stripe_customer_id: session.customer || existingClient.stripe_customer_id,
        last_payment_date: new Date().toISOString(),
        total_paid: (existingClient.total_paid || 0) + amount,
        updated_at: new Date().toISOString()
      };
      
      // Add subscription ID if it's a subscription
      if (session.subscription) {
        updateData.stripe_subscription_id = session.subscription;
      }
      
      await supabase
        .from('clients')
        .update(updateData)
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

// ============================================
// SUBSCRIPTION HANDLERS
// ============================================

async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    // Check of subscriptions tabel bestaat, zo niet gebruik payments
    const { error: tableCheckError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    const hasSubscriptionsTable = !tableCheckError;
    
    if (hasSubscriptionsTable) {
      // Save subscription to dedicated table
      await supabase
        .from('subscriptions')
        .insert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          price_id: subscription.items.data[0]?.price?.id,
          amount: subscription.items.data[0]?.price?.unit_amount,
          interval: subscription.items.data[0]?.price?.recurring?.interval,
          created_at: new Date().toISOString()
        });
    }
    
    // Update client status
    await supabase
      .from('clients')
      .update({ 
        status: 'active',
        stripe_subscription_id: subscription.id,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_customer_id', subscription.customer);
      
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    // Check of subscriptions tabel bestaat
    const { error: tableCheckError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    if (!tableCheckError) {
      // Update subscription in dedicated table
      await supabase
        .from('subscriptions')
        .update({ 
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
    }
    
    // Update client
    await supabase
      .from('clients')
      .update({ 
        status: subscription.status === 'active' ? 'active' : 'inactive',
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_customer_id', subscription.customer);
      
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription cancelled:', subscription.id);
  
  try {
    // Check of subscriptions tabel bestaat
    const { error: tableCheckError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    if (!tableCheckError) {
      // Mark as cancelled in subscriptions table
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
    }
    
    // Update client status
    await supabase
      .from('clients')
      .update({ 
        status: 'cancelled',
        subscription_end_date: new Date().toISOString()
      })
      .eq('stripe_customer_id', subscription.customer);
      
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // Skip eerste betaling (wordt al afgehandeld door checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    return;
  }
  
  try {
    // Log recurring subscription payment
    await supabase
      .from('payments')
      .insert({
        stripe_payment_id: invoice.payment_intent,
        stripe_customer_id: invoice.customer,
        client_email: invoice.customer_email,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method: 'subscription',
        product_type: 'subscription_renewal',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          billing_reason: invoice.billing_reason
        },
        created_at: new Date().toISOString()
      });
    
    // Update client last payment date
    await supabase
      .from('clients')
      .update({ 
        last_payment_date: new Date().toISOString(),
        status: 'active'
      })
      .eq('stripe_customer_id', invoice.customer);
      
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  try {
    // Log failed payment attempt
    await supabase
      .from('payments')
      .insert({
        stripe_payment_id: invoice.payment_intent,
        stripe_customer_id: invoice.customer,
        client_email: invoice.customer_email,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        payment_method: 'subscription',
        product_type: 'subscription_renewal',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          failure_message: invoice.last_payment_error?.message
        },
        created_at: new Date().toISOString()
      });
    
    // Update client status
    await supabase
      .from('clients')
      .update({ 
        status: 'payment_failed'
      })
      .eq('stripe_customer_id', invoice.customer);
      
  } catch (error) {
    console.error('Error handling failed invoice payment:', error);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractNameFromEmail(email) {
  const username = email.split('@')[0];
  return username
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
