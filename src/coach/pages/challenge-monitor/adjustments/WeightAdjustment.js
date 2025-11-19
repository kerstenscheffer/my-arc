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
    
    // ✅ FIXED: Changed from weight_logs to weight_challenge_logs
    const { data } = await db.supabase
      .from('weight_challenge_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    // NO FRIDAY FILTER - count ALL entries (matches banner logic)
    const count = data?.length || 0
    
    return {
      current: count,
      lastEntry: data?.[0]?.date || null,
      lastEntryData: data?.[0] || null
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
    
    // ✅ FIXED: Get existing from weight_challenge_logs
    const { data: existing } = await db.supabase
      .from('weight_challenge_logs')
      .select('date')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    const existingDates = new Set(existing?.map(w => w.date) || [])
    
    // Find first date without weigh-in (start from most recent)
    let targetDate = null
    const today = new Date()
    
    for (let i = 0; i <= 56; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate < startDate) break
      if (checkDate > endDate) continue
      
      const dateStr = checkDate.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        targetDate = dateStr
        break
      }
    }
    
    if (!targetDate) {
      throw new Error('Geen beschikbare datum in challenge periode')
    }
    
    // ✅ FIXED: Get client's latest weight from weight_challenge_logs
    const { data: latestWeight } = await db.supabase
      .from('weight_challenge_logs')
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
      
      // ✅ FIXED: Insert into weight_challenge_logs with correct columns
      const { error } = await db.supabase
        .from('weight_challenge_logs')
        .insert({
          client_id: clientId,
          date: targetDate,
          weight: weightValue,
          time_of_day: 'morning',
          is_friday_weighin: new Date(targetDate).getDay() === 5
        })
      
      if (error) throw error
      
      return {
        success: true,
        message: `Weging toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')} (${weightValue}kg)`
      }
    }
    
    // Add 0.1kg variation (coach can edit manually later)
    const weightValue = parseFloat(latestWeight.weight) + 0.1
    
    // ✅ FIXED: Insert into weight_challenge_logs
    const { error } = await db.supabase
      .from('weight_challenge_logs')
      .insert({
        client_id: clientId,
        date: targetDate,
        weight: weightValue,
        time_of_day: 'morning',
        is_friday_weighin: new Date(targetDate).getDay() === 5
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
    
    // ✅ FIXED: Delete from weight_challenge_logs
    const { error } = await db.supabase
      .from('weight_challenge_logs')
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
