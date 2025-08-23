// api/calendly-webhook.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase met service role key voor server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      method: req.method 
    });
  }

  try {
    const { event, payload } = req.body;
    
    console.log('📅 Calendly webhook ontvangen:', {
      event,
      uri: payload?.uri,
      scheduled_event: payload?.scheduled_event,
      email: payload?.email
    });

    // Handle invitee.created event
    if (event === 'invitee.created') {
      const eventUri = payload.scheduled_event?.uri;
      
      if (!eventUri) {
        console.error('❌ Geen event URI in payload');
        return res.status(400).json({ error: 'Missing event URI' });
      }

      // Haal complete event details op van Calendly API
// Gebruik data direct uit webhook payload (geen API call nodig!)
const scheduledEvent = payload.scheduled_event;
console.log('📋 Using webhook payload data (no API call needed)');


      
      console.log('📋 Event details:', {
        name: scheduledEvent.name,
        start: scheduledEvent.start_time,
        location: scheduledEvent.location
      });

      // Extract Zoom link en andere belangrijke data
      const zoomLink = scheduledEvent.location?.join_url || 
                       scheduledEvent.location?.location || 
                       null;
      
      const scheduledDate = scheduledEvent.start_time;
      const eventId = scheduledEvent.uri.split('/').pop();
// Extract call_id uit UTM parameters
let targetCallId = null;
if (payload.tracking?.utm_content) {
  const match = payload.tracking.utm_content.match(/call_([a-f0-9-]+)/);
  if (match) {
    targetCallId = match[1];
    console.log('🎯 Call ID gevonden in tracking:', targetCallId);
  }
}      



      // Vind de client op basis van email
      const clientEmail = payload.email;
      console.log('👤 Zoeken naar client met email:', clientEmail);
      
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, coach_id, name')
        .eq('email', clientEmail)
        .single();

      if (clientError || !client) {
        console.warn('⚠️ Client niet gevonden voor email:', clientEmail);
        // Ga door zonder client_id, kan later gekoppeld worden
      } else {
        console.log('✅ Client gevonden:', client.name);
      }

// Als we een targetCallId hebben, gebruik die direct
let callToUpdate = null;

if (targetCallId) {
  const { data: specificCall } = await supabase
    .from('client_calls')
    .select('*')
    .eq('id', targetCallId)
    .single();
  
  if (specificCall) {
    callToUpdate = specificCall;
    console.log('✅ Specifieke call gevonden via tracking:', targetCallId);
  }
}

// Anders check voor duplicates en available calls
if (!callToUpdate) {
  // Check duplicates
  const { data: existingCall } = await supabase
    .from('client_calls')
    .select('*')
    .eq('calendly_event_id', eventId)
    .single();
  
  if (existingCall) {
    console.log('⚠️ Call bestaat al:', existingCall.id);
    return res.status(200).json({
      success: true,
      message: 'Call already exists',
      call_id: existingCall.id
    });
  }
  
  // Check available calls
  if (client) {
    const { data: pendingCalls } = await supabase
      .from('client_calls')
      .select('*')
      .eq('client_id', client.id)
      .in('status', ['pending', 'available'])
      .order('call_number')
      .limit(1);

    if (pendingCalls && pendingCalls.length > 0) {
      callToUpdate = pendingCalls[0];
      console.log('📞 Available call gevonden:', callToUpdate.id);
    }
  }
}
      // Update de call of maak een nieuwe aan
      if (callToUpdate) {
        // Update bestaande call
        const { data: updatedCall, error: updateError } = await supabase
          .from('client_calls')
          .update({
            scheduled_date: scheduledDate,
            scheduled_end: scheduledEvent.end_time,
            zoom_link: zoomLink,
            meeting_location: zoomLink ? 'Zoom Meeting' : 'To be determined',
            status: 'scheduled',
            calendly_event_id: eventId,
            calendly_event_uri: scheduledEvent.uri,
            updated_at: new Date().toISOString()
          })
          .eq('id', callToUpdate.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating call:', updateError);
          throw updateError;
        }

        console.log('✅ Call succesvol geüpdatet:', updatedCall.id);

        // Maak notificatie voor coach
        if (client?.coach_id) {
          await supabase
            .from('coach_notifications')
            .insert({
              coach_id: client.coach_id,
              type: 'call_scheduled',
              title: '📅 Nieuwe Call Ingepland',
              message: `${client.name} heeft een call ingepland voor ${new Date(scheduledDate).toLocaleString('nl-NL')}`,
              metadata: { 
                call_id: updatedCall.id,
                client_id: client.id,
                zoom_link: zoomLink 
              },
              read: false
            });
        }

      } else {
        // Maak nieuwe call aan (als er geen pending call was)
        console.log('📝 Geen pending call gevonden, nieuwe call aanmaken');
        
        // Vind het actieve plan voor deze client
        let planId = null;
        if (client) {
          const { data: activePlan } = await supabase
            .from('call_templates')
            .select('id')
            .eq('client_id', client.id)
            .eq('status', 'active')
            .single();
          
          if (activePlan) {
            planId = activePlan.id;
          }
        }
        
        const newCallData = {
          plan_id: planId,
          client_id: client?.id || null,
          scheduled_date: scheduledDate,
          zoom_link: zoomLink,
          meeting_location: zoomLink ? 'Zoom Meeting' : 'To be determined',
          status: 'scheduled',
          calendly_event_id: eventId,
          call_number: 1, // Default, kan later aangepast worden
          call_title: scheduledEvent.name || 'Consultation Call',
          client_notes: `Scheduled via Calendly by ${payload.name || 'Client'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newCall, error: insertError } = await supabase
          .from('client_calls')
          .insert(newCallData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating call:', insertError);
          throw insertError;
        }

        console.log('✅ Nieuwe call aangemaakt:', newCall.id);
        
        // Notificatie voor coach
        if (client?.coach_id) {
          await supabase
            .from('coach_notifications')
            .insert({
              coach_id: client.coach_id,
              type: 'call_scheduled',
              title: '📅 Nieuwe Call Ingepland',
              message: `${client.name} heeft een call ingepland voor ${new Date(scheduledDate).toLocaleString('nl-NL')}`,
              metadata: { 
                call_id: newCall.id,
                client_id: client.id,
                zoom_link: zoomLink 
              },
              read: false
            });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Call scheduled successfully',
        event: 'invitee.created',
        scheduled_date: scheduledDate,
        zoom_link: zoomLink
      });
    }

    // Handle invitee.canceled event
    if (event === 'invitee.canceled') {
      const eventUri = payload.scheduled_event?.uri;
      const eventId = eventUri ? eventUri.split('/').pop() : null;
      
      if (!eventId) {
        console.error('❌ Geen event ID in cancel payload');
        return res.status(400).json({ error: 'Missing event ID' });
      }

      console.log('🚫 Canceling call voor event:', eventId);

      // Update call status naar canceled
      const { data: canceledCall, error: cancelError } = await supabase
        .from('client_calls')
        .update({ 
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('calendly_event_id', eventId)
        .select()
        .single();

      if (cancelError) {
        console.error('❌ Error canceling call:', cancelError);
        // Niet fataal, mogelijk was de call al gecanceld
      } else {
        console.log('✅ Call gecanceld:', canceledCall.id);

        // Vind de coach via client
        if (canceledCall.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('coach_id, name')
            .eq('id', canceledCall.client_id)
            .single();
          
          if (client?.coach_id) {
            await supabase
              .from('coach_notifications')
              .insert({
                coach_id: client.coach_id,
                type: 'call_canceled',
                title: '❌ Call Geannuleerd',
                message: `${client.name} heeft de call van ${new Date(canceledCall.scheduled_date).toLocaleString('nl-NL')} geannuleerd`,
                metadata: { 
                  call_id: canceledCall.id,
                  client_id: canceledCall.client_id
                },
                read: false
              });
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Call canceled successfully',
        event: 'invitee.canceled'
      });
    }

    // Onbekend event type
    console.log('⚠️ Onbekend event type:', event);
    return res.status(200).json({
      success: true,
      message: 'Event received but not processed',
      event
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Export config voor Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
