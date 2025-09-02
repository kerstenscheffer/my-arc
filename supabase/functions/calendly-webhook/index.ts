// supabase/functions/calendly-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CALENDLY_API_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU1OTQxMjk1LCJqdGkiOiI4ZjU3NmE3NC04NWYwLTRjNTYtOWUxYy01MDFmMGYwYTg5ZTIiLCJ1c2VyX3V1aWQiOiJkZjEwMDNlYS1iNDk5LTQ5MzQtOTFmYi01YWI5OTY1OTZlYmQifQ.ak3k8KXAbsBpU9Gtyp4vEmgt7vZQGVvSMW2yaS7ekK2kszBJxkMalaIo0Cxnpv9FnxPSD82X0cadbqtV9LdiyA';

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const body = await req.json()
    console.log('📨 Webhook received:', body.event)
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    if (body.event === 'invitee.created') {
      console.log('🎯 Processing new booking...')
      
      // Extract info
      const payload = body.payload
      const eventUri = payload.scheduled_event.uri
      const inviteeEmail = payload.email
      const inviteeName = payload.name
      
      // Parse call ID from tracking
      const utmContent = payload.tracking?.utm_content || ''
      const callId = utmContent.replace('call_', '')
      
      if (!callId) {
        console.warn('⚠️ No call ID in tracking parameters')
        return new Response(JSON.stringify({ warning: 'No call ID found' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        })
      }
      
      console.log(`📞 Processing call #${callId} for ${inviteeName}`)
      
      // Fetch complete event details from Calendly
      const eventResponse = await fetch(eventUri, {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      
      const eventData = await eventResponse.json()
      const event = eventData.resource
      
      // Extract Zoom link
      let zoomLink = null
      
      // Check verschillende locatie velden
      if (event.location?.join_url) {
        zoomLink = event.location.join_url
      } else if (event.location?.type === 'zoom' && event.location?.data) {
        // Parse zoom link uit data
        const zoomMatch = event.location.data.match(/https:\/\/[^\s]+zoom\.us\/j\/[^\s]+/i)
        if (zoomMatch) {
          zoomLink = zoomMatch[0]
        }
      }
      
      console.log('🔗 Zoom link:', zoomLink || 'Not found yet')
      
      // Update database
      const { data, error } = await supabase
        .from('client_calls')
        .update({
          status: 'scheduled',
          scheduled_date: event.start_time,
          scheduled_end: event.end_time,
          zoom_link: zoomLink,
          calendly_event_uri: eventUri,
          invitee_name: inviteeName,
          invitee_email: inviteeEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Database error:', error)
        throw error
      }
      
      console.log('✅ Call updated successfully:', data)
      
      // Optional: Send email notification
      if (zoomLink && inviteeEmail) {
        // Hier kun je een email sturen met de zoom link
        console.log(`📧 Would send email to ${inviteeEmail} with zoom link`)
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        callId,
        hasZoom: !!zoomLink 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }
    
    if (body.event === 'invitee.canceled') {
      console.log('🗑️ Processing cancellation...')
      
      const eventUri = body.payload.scheduled_event.uri
      
      // Reset call naar available
      const { error } = await supabase
        .from('client_calls')
        .update({
          status: 'available',
          scheduled_date: null,
          scheduled_end: null,
          zoom_link: null,
          calendly_event_uri: null,
          invitee_name: null,
          invitee_email: null
        })
        .eq('calendly_event_uri', eventUri)
      
      if (error) {
        console.error('❌ Error resetting call:', error)
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }
    
    // Other events
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
