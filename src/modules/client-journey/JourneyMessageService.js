// ============================================
// FILE: src/modules/client-journey/JourneyMessageService.js
// Supabase service voor journey berichten
// ============================================

class JourneyMessageService {
  constructor(supabase) {
    this.supabase = supabase
  }

  // ========== TEMPLATES ==========

  // Haal templates op voor een specifieke fase
  async getTemplatesForPhase(phase) {
    try {
      const { data, error } = await this.supabase
        .from('journey_message_templates')
        .select('*')
        .eq('phase', phase)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('❌ Get templates failed:', e)
      return []
    }
  }

  // Haal templates op voor een week + dag (de juiste berichten voor die dag)
  async getTemplatesForWeekDay(weekNumber, dayNumber, totalWeeks) {
    try {
      const phases = this._getPhasesForWeek(weekNumber, totalWeeks)
      const { data, error } = await this.supabase
        .from('journey_message_templates')
        .select('*')
        .in('phase', phases)
        .eq('day_number', dayNumber)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return (data || []).filter(t => this._matchesWeek(t, weekNumber, totalWeeks))
    } catch (e) {
      console.error('❌ Get templates for day failed:', e)
      return []
    }
  }

  // Haal ALLE templates op voor een hele week (voor timeline cirkels)
  async getTemplatesForWeek(weekNumber, totalWeeks) {
    try {
      const phases = this._getPhasesForWeek(weekNumber, totalWeeks)
      const { data, error } = await this.supabase
        .from('journey_message_templates')
        .select('*')
        .in('phase', phases)
        .eq('is_active', true)
        .order('day_number', { ascending: true })
        .order('sort_order')
      if (error) {
        console.error('❌ [MsgService] Supabase query error:', error)
        throw error
      }
      const filtered = (data || []).filter(t => this._matchesWeek(t, weekNumber, totalWeeks))
      return filtered
    } catch (e) {
      console.error('❌ Get templates for week failed:', e)
      return []
    }
  }

  // Welke dagen in een week hebben berichten? (voor timeline bericht-cirkels)
  async getDaysWithMessages(weekNumber, totalWeeks) {
    const templates = await this.getTemplatesForWeek(weekNumber, totalWeeks)
    const byDay = {}
    templates.forEach(t => {
      if (!byDay[t.day_number]) byDay[t.day_number] = []
      byDay[t.day_number].push(t)
    })
    return byDay
  }

  // ========== CLIENT MESSAGES ==========

  // Genereer berichten voor een client voor een hele week
  async generateMessagesForWeek(journeyId, clientId, coachId, weekNumber, totalWeeks, client) {
    const templates = await this.getTemplatesForWeek(weekNumber, totalWeeks)
    const existing = await this.getClientMessages(journeyId, weekNumber)
    const existingTemplateIds = existing.map(m => m.template_id)

    const newMessages = templates
      .filter(t => !existingTemplateIds.includes(t.id))
      .map(t => ({
        journey_id: journeyId,
        client_id: clientId,
        coach_id: coachId,
        template_id: t.id,
        week_number: weekNumber,
        day_number: t.day_number,
        title: t.title,
        message_text: this._personalizeTemplate(t.template, t.variables, client),
        status: 'pending',
        priority: t.priority,
        tags: t.tags
      }))

    if (newMessages.length === 0) return existing

    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .insert(newMessages)
        .select()
      if (error) throw error
      return [...existing, ...(data || [])]
    } catch (e) {
      console.error('❌ Generate messages failed:', e)
      return existing
    }
  }

  // Haal client berichten op voor een week
  async getClientMessages(journeyId, weekNumber) {
    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .select('*, template:journey_message_templates(*)')
        .eq('journey_id', journeyId)
        .eq('week_number', weekNumber)
        .order('day_number')
        .order('created_at')
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('❌ Get client messages failed:', e)
      return []
    }
  }

  // Haal berichten op voor een specifieke dag
  async getClientMessagesForDay(journeyId, weekNumber, dayNumber) {
    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .select('*, template:journey_message_templates(*)')
        .eq('journey_id', journeyId)
        .eq('week_number', weekNumber)
        .eq('day_number', dayNumber)
        .order('created_at')
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('❌ Get day messages failed:', e)
      return []
    }
  }

  // Markeer bericht als verstuurd
  async markAsSent(messageId, sentVia = 'whatsapp') {
    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString(), sent_via: sentVia })
        .eq('id', messageId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Mark sent failed:', e)
      return null
    }
  }

  // Skip bericht
  async skipMessage(messageId) {
    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .update({ status: 'skipped' })
        .eq('id', messageId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Skip message failed:', e)
      return null
    }
  }

  // Update custom tekst
  async updateMessageText(messageId, customText) {
    try {
      const { data, error } = await this.supabase
        .from('journey_messages')
        .update({ custom_text: customText, message_text: customText })
        .eq('id', messageId)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('❌ Update message failed:', e)
      return null
    }
  }

  // ========== HELPERS ==========

  _getPhasesForWeek(weekNumber, totalWeeks) {
    const phases = []
    if (weekNumber === 0) phases.push('onboarding')
    if (weekNumber === 1) phases.push('week1')
    if (weekNumber === 2) phases.push('week2')
    if (weekNumber >= 3) phases.push('recurring')
    // Milestone checks
    if (weekNumber > 0 && weekNumber % 4 === 0) phases.push('milestone')
    if (weekNumber === Math.round(totalWeeks / 2)) phases.push('milestone')
    if (weekNumber === totalWeeks) phases.push('milestone')
    return [...new Set(phases)]
  }

  _matchesWeek(template, weekNumber, totalWeeks) {
    const { phase, frequency } = template
    if (phase === 'onboarding' && weekNumber !== 0) return false
    if (phase === 'week1' && weekNumber !== 1) return false
    if (phase === 'week2' && weekNumber !== 2) return false
    if (phase === 'recurring') {
      if (weekNumber < 3) return false
      if (frequency === 'biweekly' && weekNumber % 2 !== 0) return false
      if (frequency === 'monthly' && weekNumber % 4 !== 0) return false
    }
    if (phase === 'milestone') {
      if (template.title.includes('Halverwege') && weekNumber !== Math.round(totalWeeks / 2)) return false
      if (template.title.includes('Eindmeting') && weekNumber !== totalWeeks) return false
      if (template.title.includes('Vervolg') && weekNumber !== totalWeeks) return false
      if (frequency === 'monthly' && weekNumber % 4 !== 0 && !template.title.includes('Halverwege') && !template.title.includes('Eindmeting')) return false
    }
    return true
  }

  _personalizeTemplate(template, variables, client) {
    let msg = template || ''
    if (!variables || !Array.isArray(variables)) return msg

    variables.forEach(v => {
      let value = v.default || ''
      if (v.source === 'client.first_name' && client?.first_name) value = client.first_name
      if (v.source === 'client.email' && client?.email) value = client.email
      if (v.source === 'client.phone' && client?.phone) value = client.phone
      msg = msg.replace(new RegExp(v.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
    })

    return msg
  }

  // WhatsApp URL
  getWhatsAppUrl(client, message) {
    let phone = client?.phone || client?.phone_number || ''
    phone = phone.replace(/[\s\-\+]/g, '')
    if (phone.startsWith('0')) phone = '31' + phone.substring(1)
    if (!phone) return null
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }
}

export default JourneyMessageService
