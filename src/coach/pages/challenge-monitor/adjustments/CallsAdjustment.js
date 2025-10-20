import { Phone } from 'lucide-react'

export const callsConfig = {
  icon: Phone,
  title: 'Calls',
  color: '#8b5cf6',
  required: 8
}

export async function loadCallsData(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    const { data } = await db.supabase
      .from('client_calls')
      .select('*')
      .eq('client_id', clientId)
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString())
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
    
    return {
      current: data?.length || 0,
      lastEntry: data?.[0]?.scheduled_date || null,
      lastEntryData: data?.[0] || null
    }
  } catch (error) {
    console.error('Error loading calls data:', error)
    return { current: 0, lastEntry: null, lastEntryData: null }
  }
}

export async function addCall(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    // 1. Get plan_id - try multiple sources
    let plan_id = null
    
    // First: Try to get from client's existing calls
    const { data: existingCall } = await db.supabase
      .from('client_calls')
      .select('plan_id')
      .eq('client_id', clientId)
      .not('plan_id', 'is', null)
      .limit(1)
      .maybeSingle()
    
    if (existingCall?.plan_id) {
      plan_id = existingCall.plan_id
    } else {
      // Second: Get ANY valid plan_id from call_plans table
      const { data: anyPlan } = await db.supabase
        .from('call_plans')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      if (anyPlan?.id) {
        plan_id = anyPlan.id
      } else {
        // Third: Try to get from any other client's calls (last resort)
        const { data: anyCall } = await db.supabase
          .from('client_calls')
          .select('plan_id')
          .not('plan_id', 'is', null)
          .limit(1)
          .maybeSingle()
        
        if (anyCall?.plan_id) {
          plan_id = anyCall.plan_id
        } else {
          throw new Error('Geen call plan gevonden in het systeem. Maak eerst een call plan aan.')
        }
      }
    }
    
    // 2. Get next call number
    const { data: existingCalls } = await db.supabase
      .from('client_calls')
      .select('call_number')
      .eq('client_id', clientId)
      .order('call_number', { ascending: false })
      .limit(1)
    
    const nextCallNumber = (existingCalls?.[0]?.call_number || 0) + 1
    
    // 3. Find available date
    const { data: existingCompleted } = await db.supabase
      .from('client_calls')
      .select('scheduled_date')
      .eq('client_id', clientId)
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString())
      .eq('status', 'completed')
    
    const existingDates = new Set(
      existingCompleted?.map(c => new Date(c.scheduled_date).toISOString().split('T')[0]) || []
    )
    
    let targetDate = null
    const today = new Date()
    
    for (let i = 0; i <= 56; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate < startDate) break
      if (checkDate > endDate) continue
      
      const dateStr = checkDate.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        targetDate = checkDate.toISOString()
        break
      }
    }
    
    if (!targetDate) {
      throw new Error('Geen beschikbare datum in challenge periode')
    }
    
    // 4. Insert call - ONLY required fields from banner
    const { error } = await db.supabase
      .from('client_calls')
      .insert({
        client_id: clientId,
        plan_id: plan_id,
        call_number: nextCallNumber,
        call_title: `Call #${nextCallNumber}`,
        scheduled_date: targetDate,
        completed_date: targetDate,
        status: 'completed'
      })
    
    if (error) throw error
    
    return {
      success: true,
      message: `Call #${nextCallNumber} toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')}`
    }
  } catch (error) {
    console.error('Error adding call:', error)
    throw new Error(error.message || 'Kan call niet toevoegen')
  }
}

export async function removeCall(db, clientId, lastEntryData) {
  try {
    if (!lastEntryData) {
      throw new Error('Geen call om te verwijderen')
    }
    
    const { error } = await db.supabase
      .from('client_calls')
      .delete()
      .eq('id', lastEntryData.id)
    
    if (error) throw error
    
    return {
      success: true,
      message: 'Call verwijderd'
    }
  } catch (error) {
    console.error('Error removing call:', error)
    throw error
  }
}
