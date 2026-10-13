// api/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Het 2-termijnen-plan van de 6 weken challenge. Stripe kent geen abonnement
// dat "twee keer int en dan stopt", dus dat zetten we hier: bij het afrekenen
// leggen we meteen de einddatum vast, en na de tweede betaling zeggen we het
// nog een keer op. Twee onafhankelijke stops, want een gemiste webhook mag
// geen derde afschrijving worden.
const PLAN_2X = '6-week-challenge-2x';
const DRIE_WEKEN = 21 * 24 * 60 * 60;

async function stopNaTweedeTermijn(session) {
  const subId = session.subscription;
  if (!subId) return;
  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    // Eerste periode eindigt over drie weken; dan volgt de tweede incasso.
    // Een uur vóór het einde van die tweede periode zetten we hem stop, zodat
    // er geen derde factuur meer aangemaakt wordt.
    const einde = (sub.current_period_end || 0) + DRIE_WEKEN - 3600;
    await stripe.subscriptions.update(subId, {
      cancel_at: einde,
      metadata: { ...(sub.metadata || {}), plan: PLAN_2X, termijnen: '2' },
    });
    console.log('2-termijnen: stop gezet op', new Date(einde * 1000).toISOString());
  } catch (e) {
    console.error('2-termijnen: stop zetten mislukt:', e.message);
  }
}

async function stopAlsTweedeBetaling(invoice) {
  const subId = invoice.subscription;
  if (!subId || invoice.billing_reason !== 'subscription_cycle') return;
  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    if (sub.metadata?.plan !== PLAN_2X) return;
    if (sub.cancel_at_period_end || sub.status === 'canceled') return;
    await stripe.subscriptions.cancel(subId);
    console.log('2-termijnen: tweede betaling binnen, abonnement gestopt', subId);
  } catch (e) {
    console.error('2-termijnen: opzeggen na tweede betaling mislukt:', e.message);
  }
}

// Abonnementen met een afgesproken looptijd ("3-months", "4-months",
// "6-months" in de metadata) stoppen vanzelf na precies zoveel termijnen.
// Checkout Sessions kennen geen cancel_at, dus dat zetten we hier zodra het
// abonnement bestaat. We lezen het abonnement altijd opnieuw bij Stripe op
// (de webhook-body wordt niet ondertekend gecontroleerd), en raken alleen
// verse abonnementen zonder cancel_at aan — bestaande blijven zoals ze zijn.
const EEN_UUR = 3600;
const MAX_LEEFTIJD = 2 * 24 * 3600; // ouder dan twee dagen: niet aankomen

export function maandenUitDuur(duur) {
  const m = String(duur || '').trim().match(/^(\d{1,2})[-\s]?(months?|maanden?|mnd)$/i);
  const n = m ? parseInt(m[1], 10) : NaN;
  return n >= 1 && n <= 36 ? n : null;
}

// Moment van de (N+1)e verlenging: anker + N kalendermaanden (UTC). Een uur
// ervoor stoppen, zodat Stripe op de grens geen nieuwe factuur meer maakt
// (zelfde marge als het 2-termijnen-plan).
export function stopMomentNa(anker, maanden) {
  const d = new Date(anker * 1000);
  const dag = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + maanden);
  // 31 jan + 1 maand = 28/29 feb, niet 3 maart (zo rekent Stripe ook).
  const laatste = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dag, laatste));
  return Math.floor(d.getTime() / 1000) - EEN_UUR;
}

async function zetEinddatum(subId, bron) {
  if (!subId) return;
  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    if (sub.metadata?.plan === PLAN_2X) return;           // heeft eigen stop
    if (sub.cancel_at || sub.cancel_at_period_end || sub.status === 'canceled') return;
    if (Date.now() / 1000 - (sub.created || 0) > MAX_LEEFTIJD) {
      console.log('Einddatum: abonnement te oud, niet aangepast', subId);
      return;
    }
    const maanden = maandenUitDuur(sub.metadata?.duration);
    if (!maanden) {
      console.log(`Einddatum: geen of onbekende duration ("${sub.metadata?.duration ?? ''}") op ${subId} (${bron}), niets aangepast`);
      return;
    }
    const anker = sub.billing_cycle_anchor || sub.start_date || sub.created;
    const cancelAt = stopMomentNa(anker, maanden);
    await stripe.subscriptions.update(subId, { cancel_at: cancelAt, proration_behavior: 'none' });
    console.log(`Einddatum: ${subId} stopt na ${maanden} termijnen, cancel_at ${new Date(cancelAt * 1000).toISOString()}`);
  } catch (e) {
    console.error('Einddatum zetten mislukt:', subId, e.message);
  }
}

// Service key komt uitsluitend uit Vercel env (SUPABASE_SERVICE_KEY). Hier
// stond tot 10 okt 2026 de echte service_role-sleutel als fallback, in een
// openbare repo. Nooit meer een sleutel in code: alleen env-variabelen.
// SUPABASE_URL is op Vercel-prod kapot (rommel eromheen, zie public-intake.js);
// createClient gooit daarop bij het laden en dan crasht de hele webhook. Neem
// de eerste geldige URL.
const SUPABASE_URL = [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL]
  .map(v => String(v || '').trim().replace(/^["']|["']$/g, ''))
  .find(v => /^https?:\/\/\S+$/.test(v)) || 'https://xlaycpwpnhjmulfsnynh.supabase.co';
const supabase = createClient(
  SUPABASE_URL,
  String(process.env.SUPABASE_SERVICE_KEY || '').trim() || 'ontbreekt'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Echtheid: de body wordt niet ondertekend gecontroleerd (geen ruwe body
    // in deze Vercel-functie). Daarom halen we het event zelf opnieuw op bij
    // Stripe op basis van het id. Een verzonnen POST heeft geen geldig id en
    // wordt geweigerd; een echte krijgt de inhoud zoals Stripe die kent.
    const id = req.body?.id;
    if (!id || !/^evt_/.test(id)) return res.status(400).json({ error: 'Geen event-id' });
    let event;
    try {
      event = await stripe.events.retrieve(id);
    } catch (e) {
      console.warn('Webhook: event niet bij Stripe gevonden, genegeerd:', id, e.message);
      return res.status(400).json({ error: 'Onbekend event' });
    }
    console.log('Webhook received:', event.type);

    switch (event.type) {
      // Payment events
      case 'checkout.session.completed':
        // handleCheckoutCompleted (payments-rij + automatisch een klantrecord
        // zonder coach) staat uit: klanten komen via de intake (/myintake) en
        // omzet via het leadbord. Deze webhook stond tot 13 okt 2026 uit in
        // Stripe; aanzetten zou anders dubbele klanten opleveren.
        if (event.data.object?.metadata?.plan === PLAN_2X) {
          await stopNaTweedeTermijn(event.data.object);
        } else if (event.data.object?.subscription) {
          // Vangnet als customer.subscription.created gemist werd.
          await zetEinddatum(event.data.object.subscription, 'checkout.session.completed');
        }
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      // Subscription events
      case 'customer.subscription.created':
        // Eerst de einddatum: de opslag hieronder kan falen, de stop niet.
        await zetEinddatum(event.data.object?.id, 'customer.subscription.created');
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
        await stopAlsTweedeBetaling(event.data.object);
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

// Uitgeschakeld (zie checkout.session.completed hierboven); bewaard voor als het terug moet.
async function _handleCheckoutCompleted(session) {
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
