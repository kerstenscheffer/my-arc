// api/calendly-webhook.js
// Voor Vercel of Netlify Functions
// Plaats dit in: /api/calendly-webhook.js (Vercel) of /netlify/functions/calendly-webhook.js (Netlify)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key, niet anon key!
);

export default async function handler(req, res) {
  // Alleen POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('📨 Calendly webhook received:', event.event);

    // Check event type
    if (event.event === 'invitee.created') {
      const { payload } = event;
      
      // Extract belangrijke data
      const scheduledTime = payload.scheduled_event.start_time;
      const endTime = payload.scheduled_event.end_time;
      const inviteeName = payload.invitee.name;
      const inviteeEmail = payload.invitee.email;
      const eventName = payload.scheduled_event.name;
      
      // Extract Zoom link uit location
      let zoomLink = '';
      if (payload.scheduled_event.location) {
        const location = payload.scheduled_event.location;
        
        // Calendly stuurt Zoom link in verschillende formats
        if (location.type === 'zoom' || location.type === 'custom') {
          zoomLink = location.join_url || location.location || '';
        } else if (typeof location === 'string' && location.includes('zoom')) {
          zoomLink = location;
        }
      }
      
      console.log('🔗 Extracted Zoom link:', zoomLink);
      
      // Zoek de call op basis van client email en status
      // Eerst: vind de client
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('email', inviteeEmail)
        .single();
      
      if (!client) {
        console.log('Client not found for email:', inviteeEmail);
        return res.status(200).json({ message: 'Client not found, skipping' });
      }
      
      // Dan: vind de active plan
      const { data: plan } = await supabase
        .from('client_call_plans')
        .select('id')
        .eq('client_id', client.id)
        .eq('status', 'active')
        .single();
      
      if (!plan) {
        console.log('No active plan for client');
        return res.status(200).json({ message: 'No active plan' });
      }
      
      // Vind de eerste available of recentelijk scheduled call
      const { data: calls } = await supabase
        .from('client_calls')
        .select('*')
        .eq('plan_id', plan.id)
        .in('status', ['available', 'scheduled'])
        .order('call_number', { ascending: true });
      
      if (!calls || calls.length === 0) {
        console.log('No available calls found');
        return res.status(200).json({ message: 'No available calls' });
      }
      
      // Update de eerste call die nog geen scheduled_date heeft
      const callToUpdate = calls.find(c => !c.scheduled_date) || calls[0];
      
      // Update de call met alle Calendly data
      const { error: updateError } = await supabase
        .from('client_calls')
        .update({
          status: 'scheduled',
          scheduled_date: scheduledTime,
          zoom_link: zoomLink || `https://zoom.us/j/${Date.now()}`, // Fallback
          meeting_location: zoomLink ? 'Zoom Meeting' : 'Online Meeting',
          calendly_event_id: payload.scheduled_event.uri,
          client_notes: `Gepland door: ${inviteeName}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', callToUpdate.id);
      
      if (updateError) {
        console.error('Error updating call:', updateError);
        return res.status(500).json({ error: 'Failed to update call' });
      }
      
      console.log('✅ Call updated successfully');
      
      // Optioneel: stuur een notificatie naar de coach
      await supabase
        .from('call_notifications')
        .insert({
          recipient_id: plan.coach_id,
          recipient_type: 'coach',
          call_id: callToUpdate.id,
          type: 'call_scheduled',
          title: 'Nieuwe Call Gepland',
          message: `${inviteeName} heeft Call #${callToUpdate.call_number} gepland voor ${new Date(scheduledTime).toLocaleDateString('nl-NL')}`,
          created_at: new Date().toISOString()
        });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Call scheduled',
        zoomLink: zoomLink 
      });
    }
    
    // Handle cancellation
    if (event.event === 'invitee.canceled') {
      // Implement cancellation logic
      console.log('Booking cancelled');
    }
    
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Voor Netlify, gebruik deze export:
// exports.handler = async (event, context) => {
//   const body = JSON.parse(event.body);
//   // ... rest van de code
// };
