// src/modules/client-checkin/CheckinService.js
// UPDATED: Support voor section_details JSONB
// Features: Per-sectie struggles, afspraken, coach notes

export default class CheckinService {
  constructor(db) {
    // db is DatabaseService, we need db.supabase for queries
    this.db = db
    this.supabase = db.supabase
  }

  // ==========================================
  // CLIENT METHODS
  // ==========================================

  async getClientCheckins(clientId, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('checkin_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get client check-ins failed:', error)
      return []
    }
  }

  async getLatestCheckin(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientId)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data
    } catch (error) {
      console.error('❌ Get latest check-in failed:', error)
      return null
    }
  }

  // Returns true if the client has submitted/reviewed a check-in since the
  // most recent Friday (inclusive). On Friday itself "lastFriday" === today,
  // so this returns true only after they fill in today's check-in.
  async hasCheckinSinceLastFriday(clientId) {
    try {
      const now = new Date()
      const day = now.getDay() // 0=Sun..6=Sat
      const daysSinceFriday = (day - 5 + 7) % 7
      const lastFriday = new Date(now)
      lastFriday.setDate(now.getDate() - daysSinceFriday)
      lastFriday.setHours(0, 0, 0, 0)
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select('id')
        .eq('client_id', clientId)
        .gte('checkin_date', lastFriday.toISOString().split('T')[0])
        .in('status', ['submitted', 'reviewed'])
        .limit(1)
      if (error) throw error
      return Array.isArray(data) && data.length > 0
    } catch (error) {
      console.error('❌ hasCheckinSinceLastFriday failed:', error)
      return false
    }
  }

  async hasCheckinThisWeek(clientId) {
    try {
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - daysToMonday)
      weekStart.setHours(0, 0, 0, 0)

      const { data, error } = await this.supabase
        .from('client_checkins')
        .select('id, checkin_date, status')
        .eq('client_id', clientId)
        .gte('checkin_date', weekStart.toISOString().split('T')[0])
        .in('status', ['submitted', 'reviewed'])

      if (error) throw error
      return data && data.length > 0
    } catch (error) {
      console.error('❌ Has check-in this week check failed:', error)
      return false
    }
  }

  // ==========================================
  // CREATE / UPDATE METHODS
  // ==========================================

  /**
   * Create new check-in with section_details JSONB
   */
  async createCheckin(checkinData) {
    try {
      // Extract section_details if present
      const { section_details, ...baseData } = checkinData
      
      const insertData = {
        ...baseData,
        checkin_date: new Date().toISOString().split('T')[0],
        status: checkinData.status || 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Add section_details as JSONB if present
      if (section_details) {
        insertData.section_details = section_details
      }

      const { data, error } = await this.supabase
        .from('client_checkins')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      console.log('✅ Check-in created:', data.id)

      // Coach een melding sturen dat de check-in binnen is (CoachNotificationBell
      // leest coach_notifications). Alleen bij een echte submit, niet bij concept.
      // Non-blocking: faalt dit, dan blijft de check-in zelf gewoon opgeslagen.
      if (insertData.status === 'submitted' && baseData.coach_id) {
        try {
          let clientName = ''
          if (baseData.client_id) {
            const { data: c } = await this.supabase
              .from('clients').select('first_name, last_name').eq('id', baseData.client_id).maybeSingle()
            if (c) clientName = `${c.first_name || ''} ${c.last_name || ''}`.trim()
          }
          await this.supabase.from('coach_notifications').insert([{
            coach_id: baseData.coach_id,
            client_id: baseData.client_id || null,
            type: 'checkin_completed',
            priority: 'normal',
            title: 'Check-in ingevuld',
            message: clientName
              ? `${clientName} heeft de wekelijkse check-in ingevuld`
              : 'Een client heeft de wekelijkse check-in ingevuld',
            read_status: false,
          }])
        } catch (notifyErr) {
          console.error('⚠️ Coach-notificatie voor check-in mislukt (check-in zelf is opgeslagen):', notifyErr)
        }
      }

      return data
    } catch (error) {
      console.error('❌ Create check-in failed:', error)
      throw error
    }
  }

  /**
   * Update existing check-in
   */
  async updateCheckin(checkinId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkinId)
        .select()
        .single()

      if (error) throw error
      console.log('✅ Check-in updated:', data.id)
      return data
    } catch (error) {
      console.error('❌ Update check-in failed:', error)
      throw error
    }
  }

  /**
   * Save as draft
   */
  async saveDraft(clientId, draftData) {
    try {
      const existing = await this.getLatestCheckin(clientId)
      
      if (existing && existing.status === 'draft') {
        return await this.updateCheckin(existing.id, {
          ...draftData,
          status: 'draft'
        })
      } else {
        return await this.createCheckin({
          client_id: clientId,
          ...draftData,
          status: 'draft'
        })
      }
    } catch (error) {
      console.error('❌ Save draft failed:', error)
      throw error
    }
  }

  // ==========================================
  // COACH METHODS
  // ==========================================

  /**
   * Get all check-ins for coach
   */
  async getCoachCheckins(coachId, filters = {}) {
    try {
      let query = this.supabase
        .from('client_checkins')
        .select(`
          *,
          clients:client_id(first_name, last_name, email)
        `)
        .eq('coach_id', coachId)
        .order('checkin_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId)
      }

      if (filters.startDate) {
        query = query.gte('checkin_date', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('checkin_date', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get coach check-ins failed:', error)
      return []
    }
  }

  /**
   * Get pending check-ins
   */
  async getPendingCheckins(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select(`
          *,
          clients:client_id(first_name, last_name)
        `)
        .eq('coach_id', coachId)
        .eq('status', 'submitted')
        .order('checkin_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get pending check-ins failed:', error)
      return []
    }
  }

  /**
   * Get clients without check-in this week
   */
  async getClientsWithoutCheckinThisWeek(coachId) {
    try {
      const { data: clients, error: clientsError } = await this.supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('coach_id', coachId)

      if (clientsError) throw clientsError
      if (!clients || clients.length === 0) return []

      const clientsWithoutCheckin = []

      for (const client of clients) {
        // Vrijdag-cyclus: consistent met de client-form/banner/popup.
        const hasCheckin = await this.hasCheckinSinceLastFriday(client.id)
        if (!hasCheckin) {
          clientsWithoutCheckin.push(client)
        }
      }

      return clientsWithoutCheckin
    } catch (error) {
      console.error('❌ Get clients without check-in failed:', error)
      return []
    }
  }

  /**
   * Mark check-in as reviewed
   */
  async markAsReviewed(checkinId, coachNotes = null) {
    try {
      const updates = {
        status: 'reviewed',
        reviewed_at: new Date().toISOString()
      }

      if (coachNotes) {
        updates.coach_notes = coachNotes
      }

      return await this.updateCheckin(checkinId, updates)
    } catch (error) {
      console.error('❌ Mark as reviewed failed:', error)
      throw error
    }
  }

  // ==========================================
  // STATS & ANALYTICS
  // ==========================================

  /**
   * Get client stats
   */
  async getClientStats(clientId) {
    try {
      const checkins = await this.getClientCheckins(clientId, 100)

      if (!checkins || checkins.length === 0) {
        return {
          total: 0,
          avgVoeding: 0,
          avgWeekend: 0,
          avgSlaap: 0,
          avgTraining: 0,
          avgEnergie: 0,
          avgMotivatie: 0,
          avgOverall: 0,
          trend: 'neutral'
        }
      }

      const totals = checkins.reduce((acc, c) => {
        acc.voeding += c.voeding_score || 0
        acc.weekend += c.weekend_score || 0
        acc.slaap += c.slaap_score || 0
        acc.training += c.training_score || 0
        acc.energie += c.energie_score || 0
        acc.motivatie += c.motivatie_score || 0
        return acc
      }, { voeding: 0, weekend: 0, slaap: 0, training: 0, energie: 0, motivatie: 0 })

      const count = checkins.length

      const stats = {
        total: count,
        avgVoeding: (totals.voeding / count).toFixed(1),
        avgWeekend: (totals.weekend / count).toFixed(1),
        avgSlaap: (totals.slaap / count).toFixed(1),
        avgTraining: (totals.training / count).toFixed(1),
        avgEnergie: (totals.energie / count).toFixed(1),
        avgMotivatie: (totals.motivatie / count).toFixed(1),
        avgOverall: (
          (totals.voeding + totals.weekend + totals.slaap +
            totals.training + totals.energie + totals.motivatie) /
          (count * 6)
        ).toFixed(1)
      }

      // Calculate trend
      if (count >= 6) {
        const recent3 = checkins.slice(0, 3)
        const previous3 = checkins.slice(3, 6)

        const recentAvg = this.calculateAverage(recent3)
        const previousAvg = this.calculateAverage(previous3)

        if (recentAvg > previousAvg + 0.5) {
          stats.trend = 'up'
        } else if (recentAvg < previousAvg - 0.5) {
          stats.trend = 'down'
        } else {
          stats.trend = 'neutral'
        }
      } else {
        stats.trend = 'neutral'
      }

      return stats
    } catch (error) {
      console.error('❌ Get client stats failed:', error)
      return { total: 0, trend: 'neutral' }
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  calculateAverage(checkins) {
    if (!checkins || checkins.length === 0) return 0

    const total = checkins.reduce((sum, c) => {
      return sum +
        (c.voeding_score || 0) +
        (c.weekend_score || 0) +
        (c.slaap_score || 0) +
        (c.training_score || 0) +
        (c.energie_score || 0) +
        (c.motivatie_score || 0)
    }, 0)

    return total / (checkins.length * 6)
  }

  calculateOverallScore(checkin) {
    if (!checkin) return 0

    const scores = [
      checkin.voeding_score || 0,
      checkin.weekend_score || 0,
      checkin.slaap_score || 0,
      checkin.training_score || 0,
      checkin.energie_score || 0,
      checkin.motivatie_score || 0
    ]

    const total = scores.reduce((sum, score) => sum + score, 0)
    return (total / 6).toFixed(1)
  }

  getWeekStart() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  // ==========================================
  // EXPORT METHODS
  // ==========================================

  async getCheckinForPDF(checkinId) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select(`
          *,
          clients:client_id(first_name, last_name)
        `)
        .eq('id', checkinId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Get check-in for PDF failed:', error)
      return null
    }
  }

  async getCheckinsForReport(clientId, startDate, endDate) {
    try {
      const { data, error } = await this.supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientId)
        .gte('checkin_date', startDate)
        .lte('checkin_date', endDate)
        .order('checkin_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Get check-ins for report failed:', error)
      return []
    }
  }

  /**
   * Get all coach notes from check-ins
   */
  async getCoachNotesReport(coachId, clientId = null) {
    try {
      let query = this.supabase
        .from('client_checkins')
        .select(`
          id,
          checkin_date,
          section_details,
          coach_notes,
          clients:client_id(first_name, last_name)
        `)
        .eq('coach_id', coachId)
        .order('checkin_date', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error

      // Extract coach notes from section_details
      return (data || []).map(checkin => {
        const sectionNotes = {}
        const details = checkin.section_details || {}

        Object.keys(details).forEach(section => {
          if (details[section]?.coach_notes) {
            sectionNotes[section] = details[section].coach_notes
          }
        })

        return {
          id: checkin.id,
          date: checkin.checkin_date,
          clientName: `${checkin.clients?.first_name || ''} ${checkin.clients?.last_name || ''}`.trim(),
          generalNotes: checkin.coach_notes,
          sectionNotes
        }
      })
    } catch (error) {
      console.error('❌ Get coach notes report failed:', error)
      return []
    }
  }
}
