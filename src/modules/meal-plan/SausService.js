// src/modules/meal-plan/SausService.js
//
// Sausideeën bij een maaltijd: inspiratie om een bord lekkerder te maken
// zonder het plan te slopen, met de macro's erbij.
//
// Twee soorten keuze, net als bij de dag-templates: met een datum geldt de saus
// alleen die dag, zonder datum hoort hij voortaan bij die maaltijd. Zo hoeft
// iemand zijn vaste knoflooksaus niet elke keer opnieuw te kiezen.
//
// De macro's van een saus zijn per portie, niet per 100 gram — je neemt een
// lepel, geen ons.

export const SOORTEN = ['kant-en-klaar', 'zelfgemaakt']

export const lokaleDatum = (d = new Date()) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export async function haalSausIdeeen(db) {
  const { data, error } = await db.supabase
    .from('saus_ideeen')
    .select('id, naam, soort, portie, kcal, eiwit, koolhydraten, vet, omschrijving, recept, image_url')
    .eq('actief', true)
    .order('volgorde', { ascending: true })
  if (error) { console.warn('sausideeën laden mislukt:', error.message); return [] }
  return data || []
}

// Welke sauzen gelden er vandaag bij deze maaltijd: de vaste plus die van deze
// dag. Levert de rijen uit client_meal_sauzen mét het idee erin geplakt.
export async function haalSauzenVoorMaaltijd(db, { clientId, mealId, datum = lokaleDatum() }) {
  if (!db?.supabase || !clientId || !mealId) return []
  const { data, error } = await db.supabase
    .from('client_meal_sauzen')
    .select('id, datum, saus_id, saus:saus_ideeen (id, naam, soort, portie, kcal, eiwit, koolhydraten, vet, omschrijving, recept, image_url)')
    .eq('client_id', clientId)
    .eq('meal_id', mealId)
    .or(`datum.is.null,datum.eq.${datum}`)
  if (error) { console.warn('sauzen laden mislukt:', error.message); return [] }
  return (data || []).filter(r => r.saus)
}

export async function voegSausToe(db, { clientId, mealId, sausId, altijd = false, datum = lokaleDatum() }) {
  const rij = {
    client_id: clientId,
    meal_id: mealId,
    saus_id: sausId,
    datum: altijd ? null : datum,
  }
  const { error } = await db.supabase.from('client_meal_sauzen').insert(rij)
  if (error) {
    // De partiële unique-indexen vangen dubbel toevoegen af; dat is geen fout
    // om de klant mee lastig te vallen.
    if (error.code === '23505') return { error: null }
    return { error: error.message }
  }
  return { error: null }
}

export async function verwijderSaus(db, id) {
  const { error } = await db.supabase.from('client_meal_sauzen').delete().eq('id', id)
  return { error: error?.message || null }
}

// Wat de gekozen sauzen bij elkaar aan macro's doen.
export function sausMacros(rijen) {
  return (rijen || []).reduce((som, r) => {
    const s = r.saus || r
    return {
      kcal: som.kcal + (Number(s.kcal) || 0),
      eiwit: som.eiwit + (Number(s.eiwit) || 0),
      koolhydraten: som.koolhydraten + (Number(s.koolhydraten) || 0),
      vet: som.vet + (Number(s.vet) || 0),
    }
  }, { kcal: 0, eiwit: 0, koolhydraten: 0, vet: 0 })
}

// De macro's van een maaltijd inclusief de sauzen die eraan hangen. Eén plek,
// zodat de kaart, het infoscherm en het loggen niet ieder hun eigen optelling
// maken.
export function maaltijdMetSauzen(meal, rijen) {
  const extra = sausMacros(rijen)
  if (!extra.kcal && !extra.eiwit && !extra.koolhydraten && !extra.vet) return meal
  return {
    ...meal,
    calories: Math.round((Number(meal?.calories) || 0) + extra.kcal),
    protein: Math.round(((Number(meal?.protein) || 0) + extra.eiwit) * 10) / 10,
    carbs: Math.round(((Number(meal?.carbs) || 0) + extra.koolhydraten) * 10) / 10,
    fat: Math.round(((Number(meal?.fat) || 0) + extra.vet) * 10) / 10,
    _sauzen: rijen,
  }
}
