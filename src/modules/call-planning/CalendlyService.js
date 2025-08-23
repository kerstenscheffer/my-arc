// ============================================
// CALENDLY API SERVICE
// ============================================

class CalendlyService {
  constructor() {
    this.apiToken = import.meta.env.VITE_CALENDLY_TOKEN
    this.baseUrl = 'https://api.calendly.com'
    this.userUri = null
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      this.userUri = data.resource.uri
      console.log('📅 Calendly user loaded:', data.resource.name)
      return data.resource
    } catch (error) {
      console.error('Calendly auth error:', error)
      return null
    }
  }

  // Get all scheduled events
  async getScheduledEvents(minTime = null, maxTime = null) {
    try {
      if (!this.userUri) {
        await this.getCurrentUser()
      }

      const params = new URLSearchParams({
        user: this.userUri,
        status: 'active',
        sort: 'start_time:asc'
      })

      if (minTime) params.append('min_start_time', minTime)
      if (maxTime) params.append('max_start_time', maxTime)

      const response = await fetch(`${this.baseUrl}/scheduled_events?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('📅 Scheduled events:', data.collection.length)
      
      // Extract Zoom links from events
      const eventsWithZoom = data.collection.map(event => ({
        uuid: event.uri.split('/').pop(),
        name: event.name,
        start_time: event.start_time,
        end_time: event.end_time,
        status: event.status,
        location: event.location?.location || null,
        zoom_link: event.location?.join_url || null,
        invitees_count: event.invitees_counter?.total || 0,
        event_type: event.event_type
      }))

      return eventsWithZoom
    } catch (error) {
      console.error('Error fetching events:', error)
      return []
    }
  }

  // Get event details with invitee info
  async getEventDetails(eventUuid) {
    try {
      const response = await fetch(`${this.baseUrl}/scheduled_events/${eventUuid}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      return data.resource
    } catch (error) {
      console.error('Error fetching event details:', error)
      return null
    }
  }

  // Get invitees for an event
  async getEventInvitees(eventUuid) {
    try {
      const response = await fetch(`${this.baseUrl}/scheduled_events/${eventUuid}/invitees`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      return data.collection
    } catch (error) {
      console.error('Error fetching invitees:', error)
      return []
    }
  }

  // Get event types (your different call templates in Calendly)
  async getEventTypes() {
    try {
      if (!this.userUri) {
        await this.getCurrentUser()
      }

      const params = new URLSearchParams({
        user: this.userUri,
        active: 'true'
      })

      const response = await fetch(`${this.baseUrl}/event_types?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      return data.collection
    } catch (error) {
      console.error('Error fetching event types:', error)
      return []
    }
  }

  // Sync events with database
  async syncWithDatabase(supabase) {
    try {
      console.log('🔄 Starting Calendly sync...')
      
      // Get events for next 30 days
      const minTime = new Date().toISOString()
      const maxTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const events = await this.getScheduledEvents(minTime, maxTime)
      
      for (const event of events) {
        // Get invitees to find client email
        const invitees = await this.getEventInvitees(event.uuid)
        
        if (invitees.length > 0) {
          const invitee = invitees[0]
          const clientEmail = invitee.email
          
          // Find client in database
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('email', clientEmail)
            .single()
          
          if (client) {
            // Update matching call
            const { error } = await supabase
              .from('client_calls')
              .update({
                scheduled_date: event.start_time,
                status: 'scheduled',
                calendly_event_id: event.uuid,
                zoom_link: event.zoom_link,
                meeting_location: event.location
              })
              .eq('client_id', client.id)
              .eq('status', 'available')
              .order('call_number')
              .limit(1)
            
            if (!error) {
              console.log(`✅ Synced call for ${clientEmail}`)
            }
          }
        }
      }
      
      console.log('✅ Calendly sync complete')
      return events
    } catch (error) {
      console.error('Sync error:', error)
      return []
    }
  }
}

export default new CalendlyService()
