// src/modules/steps/StappenService.js
//
// Stappen per dag: één rij per klant per dag in client_step_logs.
//
// Waarom een eigen tabel naast cardio_logs: daar staat een sessie in ("30 min
// wandelen op dinsdag"). Stappen zijn geen sessie maar een dagtotaal, en dat
// totaal wordt de hele dag door bijgewerkt — als losse sessie-rijen tel je het
// nooit meer goed op.
//
// De bron staat erbij omdat de telefoon later dezelfde rij vult. Een stand uit
// Apple Health hoort een getal dat iemand zelf intikte niet stilletjes te
// overschrijven, en andersom wil je kunnen zien waar een getal vandaan komt.

export const STANDAARD_DOEL = 8000

// Lokale datum, niet via toISOString: die zet 's avonds de dag een terug.
export const vandaagIso = (d = new Date()) => {
  const j = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${j}-${m}-${da}`
}

const StappenService = {
  // De laatste n dagen, oudste eerst, met een lege dag voor elke dag zonder
  // rij — niets gelopen is ook een antwoord.
  async haalDagen(db, clientId, aantal = 7) {
    if (!db?.supabase || !clientId) return []
    const vanaf = new Date()
    vanaf.setDate(vanaf.getDate() - (aantal - 1))
    const { data, error } = await db.supabase
      .from('client_step_logs')
      .select('date, steps, source')
      .eq('client_id', clientId)
      .gte('date', vandaagIso(vanaf))
      .order('date', { ascending: true })
    if (error) { console.error('Stappen laden mislukt:', error); return [] }

    const perDag = new Map((data || []).map(r => [String(r.date).slice(0, 10), r]))
    const uit = []
    for (let i = aantal - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const iso = vandaagIso(d)
      const rij = perDag.get(iso)
      uit.push({
        iso,
        dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
        steps: Number(rij?.steps) || 0,
        source: rij?.source || null,
      })
    }
    return uit
  },

  // De lopende week, maandag t/m zondag. Dagen in de toekomst krijgen
  // toekomst: true, zodat een gemiddelde niet door lege dagen wordt verpest.
  async haalWeek(db, clientId, anker = new Date()) {
    if (!db?.supabase || !clientId) return []
    const maandag = new Date(anker)
    maandag.setDate(maandag.getDate() - ((maandag.getDay() + 6) % 7))
    maandag.setHours(0, 0, 0, 0)
    const zondag = new Date(maandag)
    zondag.setDate(zondag.getDate() + 6)

    const { data, error } = await db.supabase
      .from('client_step_logs')
      .select('date, steps, source')
      .eq('client_id', clientId)
      .gte('date', vandaagIso(maandag))
      .lte('date', vandaagIso(zondag))
    if (error) { console.error('Stappen van de week laden mislukt:', error); return [] }

    const perDag = new Map((data || []).map(r => [String(r.date).slice(0, 10), r]))
    const vandaag = vandaagIso()
    const uit = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(maandag)
      d.setDate(d.getDate() + i)
      const iso = vandaagIso(d)
      const rij = perDag.get(iso)
      uit.push({
        iso,
        dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
        steps: Number(rij?.steps) || 0,
        source: rij?.source || null,
        isVandaag: iso === vandaag,
        toekomst: iso > vandaag,
      })
    }
    return uit
  },

  async bewaar(db, clientId, steps, { datum = vandaagIso(), source = 'handmatig' } = {}) {
    if (!db?.supabase || !clientId) return null
    const aantal = Math.max(0, Math.min(200000, Math.round(Number(steps) || 0)))
    const { data, error } = await db.supabase
      .from('client_step_logs')
      .upsert({
        client_id: clientId,
        date: datum,
        steps: aantal,
        source,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id,date' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async haalDoel(db, clientId) {
    if (!db?.supabase || !clientId) return STANDAARD_DOEL
    const { data } = await db.supabase
      .from('clients').select('step_goal').eq('id', clientId).maybeSingle()
    return Number(data?.step_goal) > 0 ? Number(data.step_goal) : STANDAARD_DOEL
  },

  async zetDoel(db, clientId, doel) {
    if (!db?.supabase || !clientId) return false
    const waarde = Math.max(1000, Math.min(50000, Math.round(Number(doel) || 0)))
    const { error } = await db.supabase
      .from('clients').update({ step_goal: waarde }).eq('id', clientId)
    if (error) throw error
    return true
  },
}

export default StappenService
