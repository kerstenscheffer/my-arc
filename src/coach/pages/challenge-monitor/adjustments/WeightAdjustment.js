import { Weight } from 'lucide-react'

export const weightConfig = {
  icon: Weight,
  title: 'Weigh-ins',
  color: '#3b82f6',
  required: 8
}

export async function loadWeightData(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    const { data } = await db.supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    // Filter ONLY Friday weigh-ins
    const fridayWeighIns = data?.filter(w => {
      const day = new Date(w.date).getDay()
      return day === 5
    }) || []
    
    return {
      current: fridayWeighIns.length,
      lastEntry: fridayWeighIns[0]?.date || null,
      lastEntryData: fridayWeighIns[0] || null
    }
  } catch (error) {
    console.error('Error loading weight data:', error)
    return { current: 0, lastEntry: null, lastEntryData: null }
  }
}

export async function addWeight(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    // Get existing Friday weigh-ins
    const { data: existing } = await db.supabase
      .from('weight_logs')
      .select('date')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    const existingDates = new Set(existing?.map(w => w.date) || [])
    
    // Find first Friday without weigh-in (start from most recent)
    let targetDate = null
    const today = new Date()
    
    for (let i = 0; i <= 56; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate < startDate) break
      if (checkDate > endDate) continue
      if (checkDate.getDay() !== 5) continue  // Skip non-Fridays
      
      const dateStr = checkDate.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        targetDate = dateStr
        break
      }
    }
    
    if (!targetDate) {
      throw new Error('Geen beschikbare vrijdag in challenge periode')
    }
    
    // CRITICAL: Get client's latest weight + add small variation
    const { data: latestWeight } = await db.supabase
      .from('weight_logs')
      .select('weight')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    
    if (!latestWeight?.weight) {
      // Fallback: check client table for current weight
      const { data: clientData } = await db.supabase
        .from('clients')
        .select('current_weight')
        .eq('id', clientId)
        .single()
      
      if (!clientData?.current_weight) {
        throw new Error('Geen vorig gewicht gevonden. Kan weging niet toevoegen.')
      }
      
      // Use client's current weight
      const weightValue = parseFloat(clientData.current_weight)
      
      const { error } = await db.supabase
        .from('weight_logs')
        .insert({
          client_id: clientId,
          date: targetDate,
          weight: weightValue,
          notes: 'Handmatige aanpassing door coach - Controleer gewicht'
        })
      
      if (error) throw error
      
      return {
        success: true,
        message: `Weging toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')} (${weightValue}kg)`
      }
    }
    
    // Add 0.1kg variation (coach can edit manually later)
    const weightValue = parseFloat(latestWeight.weight) + 0.1
    
    const { error } = await db.supabase
      .from('weight_logs')
      .insert({
        client_id: clientId,
        date: targetDate,
        weight: weightValue,
        notes: 'Handmatige aanpassing door coach - Controleer gewicht'
      })
    
    if (error) throw error
    
    return {
      success: true,
      message: `Weging toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')} (${weightValue.toFixed(1)}kg)`
    }
  } catch (error) {
    console.error('Error adding weight:', error)
    throw error
  }
}

export async function removeWeight(db, clientId, lastEntryData) {
  try {
    if (!lastEntryData) {
      throw new Error('Geen weging om te verwijderen')
    }
    
    const { error } = await db.supabase
      .from('weight_logs')
      .delete()
      .eq('id', lastEntryData.id)
    
    if (error) throw error
    
    return {
      success: true,
      message: 'Weging verwijderd'
    }
  } catch (error) {
    console.error('Error removing weight:', error)
    throw error
  }
}
