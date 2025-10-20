// Call Detector - Detecteert toekomstige en ongeplande calls
class CallDetector {
  constructor(db) {
    this.db = db
  }

  async detect(client) {
    const actions = []
    
    try {
      // 1. Check voor toekomstige geplande calls
      const upcomingCall = await this.detectUpcomingCall(client)
      if (upcomingCall) actions.push(upcomingCall)
      
      // 2. Check voor ongeplande calls
      const unscheduledCall = await this.detectUnscheduledCall(client)
      if (unscheduledCall) actions.push(unscheduledCall)
      
      // 3. Check voor pending call requests
      const pendingRequests = await this.detectPendingRequests(client)
      if (pendingRequests && pendingRequests.length > 0) {
        actions.push(...pendingRequests)
      }
      
      return actions.length > 0 ? actions : null
    } catch (error) {
      console.error('Call detection failed for', client.first_name, ':', error)
      return null
    }
  }

  // Detect toekomstige geplande calls
  async detectUpcomingCall(client) {
    try {
      const { data: futureCall, error } = await this.db.supabase
        .from('client_calls')
        .select(`
          id,
          plan_id,
          call_number,
          call_title,
          scheduled_date,
          status,
          zoom_link,
          calendly_link,
          duration_minutes
        `)
        .eq('client_id', client.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single()

      if (error || !futureCall) return null

      const minutesUntil = this.getMinutesUntil(futureCall.scheduled_date)
      
      // Bepaal prioriteit en bericht
      let priority = 'upcoming'
      let urgencyScore = 30
      let message = ''
      let buttonText = 'ZOOM LINK'
      
      if (minutesUntil <= 5) {
        priority = 'urgent'
        urgencyScore = 100
        message = `Call #${futureCall.call_number} begint NU!`
        buttonText = 'JOIN NU'
      } else if (minutesUntil <= 15) {
        priority = 'urgent'
        urgencyScore = 90
        message = `Call #${futureCall.call_number} over ${minutesUntil} minuten`
        buttonText = 'JOIN ZOOM'
      } else if (minutesUntil <= 60) {
        priority = 'today'
        urgencyScore = 70
        message = `Call #${futureCall.call_number} over ${minutesUntil} minuten`
        buttonText = 'JOIN ZOOM'
      } else if (minutesUntil <= 1440) { // Binnen 24 uur
        const hours = Math.floor(minutesUntil / 60)
        priority = 'today'
        urgencyScore = 40
        message = `Call #${futureCall.call_number} over ${hours} uur`
      } else {
        const days = Math.floor(minutesUntil / 1440)
        priority = 'upcoming'
        urgencyScore = 20
        message = `Call #${futureCall.call_number} over ${days} ${days === 1 ? 'dag' : 'dagen'}`
      }
      
      return {
        id: `call_scheduled_${futureCall.id}`,
        clientId: client.id,
        clientName: client.first_name,
        type: 'call',
        priority,
        urgencyScore,
        icon: '📞',
        message,
        detail: futureCall.call_title || 'Video call gepland',
        buttonText,
        data: {
          call_id: futureCall.id,
          zoom_link: futureCall.zoom_link || futureCall.calendly_link,
          scheduled_date: futureCall.scheduled_date,
          duration: futureCall.duration_minutes || 30
        }
      }
    } catch (error) {
      // Geen toekomstige calls
      return null
    }
  }

  // Detect ongeplande calls
  async detectUnscheduledCall(client) {
    try {
      const { data: unscheduledCall, error } = await this.db.supabase
        .from('client_calls')
        .select('id, call_number, call_title')
        .eq('client_id', client.id)
        .eq('status', 'scheduled')
        .is('scheduled_date', null)
        .order('call_number', { ascending: true })
        .limit(1)
        .single()
      
      if (error || !unscheduledCall) return null
      
      return {
        id: `call_unscheduled_${unscheduledCall.id}`,
        clientId: client.id,
        clientName: client.first_name,
        type: 'schedule',
        priority: 'today',
        urgencyScore: 60,
        icon: '📅',
        message: `Call #${unscheduledCall.call_number} moet nog gepland worden`,
        detail: unscheduledCall.call_title || 'Client moet datum kiezen',
        buttonText: 'PLAN CALL',
        data: {
          call_id: unscheduledCall.id,
          call_number: unscheduledCall.call_number
        }
      }
    } catch (error) {
      // Geen ongeplande calls
      return null
    }
  }

  // Detect pending call requests
  async detectPendingRequests(client) {
    try {
      const { data: requests, error } = await this.db.supabase
        .from('call_requests')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error || !requests || requests.length === 0) return null

      return requests.map(request => {
        const daysSince = this.getDaysSince(request.created_at)
        const isUrgent = request.urgency === 'urgent' || daysSince > 2
        
        return {
          id: `call_request_${request.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'request',
          priority: isUrgent ? 'urgent' : 'today',
          urgencyScore: isUrgent ? 85 : 60,
          icon: '🔔',
          message: `Call request: "${request.reason.substring(0, 40)}..."`,
          detail: `Aangevraagd ${daysSince === 0 ? 'vandaag' : `${daysSince} dagen geleden`}${request.urgency === 'urgent' ? ' - URGENT' : ''}`,
          buttonText: 'REAGEER',
          data: {
            request_id: request.id,
            reason: request.reason,
            urgency: request.urgency
          }
        }
      })
    } catch (error) {
      console.error('Call request detection failed:', error)
      return null
    }
  }

  // Detect als client helemaal geen call plan heeft
  async detectNoPlan(client) {
    try {
      // Check of client een call plan heeft
      const { data: callPlan, error } = await this.db.supabase
        .from('client_call_plans')
        .select('id, template_id')
        .eq('client_id', client.id)
        .limit(1)
        .single()
      
      if (error || !callPlan) {
        // Geen call plan toegewezen
        return {
          id: `call_no_plan_${client.id}`,
          clientId: client.id,
          clientName: client.first_name,
          type: 'no_plan',
          priority: 'today',
          urgencyScore: 55,
          icon: '📋',
          message: 'Geen call plan toegewezen',
          detail: 'Client heeft nog geen call traject',
          buttonText: 'ASSIGN PLAN',
          data: {
            type: 'no_plan'
          }
        }
      }
      
      // Als er wel een plan is maar geen calls, check of alle calls completed zijn
      const { data: allCalls } = await this.db.supabase
        .from('client_calls')
        .select('id, status')
        .eq('client_id', client.id)
        .eq('plan_id', callPlan.id)
      
      if (allCalls && allCalls.length > 0) {
        const hasScheduledOrPending = allCalls.some(c => 
          c.status === 'scheduled' || c.status === 'pending'
        )
        
        if (!hasScheduledOrPending) {
          // Alle calls zijn completed
          return {
            id: `call_all_done_${client.id}`,
            clientId: client.id,
            clientName: client.first_name,
            type: 'completed',
            priority: 'upcoming',
            urgencyScore: 25,
            icon: '✅',
            message: 'Alle calls voltooid',
            detail: 'Call traject is afgerond',
            buttonText: 'BEKIJK',
            data: {
              type: 'all_completed',
              plan_id: callPlan.id
            }
          }
        }
      }
      
      return null
    } catch (error) {
      // Geen plan gevonden
      return null
    }
  }

  // Helper: Bereken minuten tot scheduled datum
  getMinutesUntil(scheduledDate) {
    const now = new Date()
    const scheduled = new Date(scheduledDate)
    const diff = scheduled - now
    return Math.floor(diff / (1000 * 60))
  }

  // Helper: Bereken dagen sinds datum
  getDaysSince(date) {
    const now = new Date()
    const past = new Date(date)
    const diff = now - past
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }
}

export default CallDetector
