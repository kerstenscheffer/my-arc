// src/modules/meal-plan/utils/ingredientenUitschrijven.js
//
// Gelogde of geplande ingrediënten in één vorm: naam, hoeveelheid, eenheid en
// macro's. Gedeeld door het voedingspaneel in het inzicht en het
// realiteit-blad in de agenda, zodat een maaltijd op beide plekken hetzelfde
// uitpakt.
// De gelogde ingrediënten zijn op twee manieren opgeslagen: eigen maaltijden
// van de klant (my_meals) al uitgeschreven met naam en macro's; maaltijden
// uit het plan (plan_check) als verwijzing naar ai_ingredients. Beide komen
// hier uit als dezelfde vorm.
export async function schrijfIngredientenUit(db, lijst) {
  const rijen = Array.isArray(lijst) ? lijst : []
  if (rijen.length === 0) return []
  const uitgeschreven = rijen.filter(r => r?.name)
  if (uitgeschreven.length === rijen.length) {
    return uitgeschreven.map(r => ({
      name: r.name, amount: Number(r.amount) || 0, unit: r.unit || 'g',
      calories: Number(r.calories) || 0, protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0, fat: Number(r.fat) || 0,
    }))
  }
  const ids = [...new Set(rijen.map(r => r?.ingredient_id).filter(Boolean))]
  if (ids.length === 0 || !db?.supabase) return []
  try {
    const { data, error } = await db.supabase
      .from('ai_ingredients')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .in('id', ids)
    if (error) throw error
    const opId = new Map((data || []).map(i => [i.id, i]))
    return rijen.map(r => {
      const b = opId.get(r.ingredient_id)
      if (!b) return null
      const gram = Number(r.amount) || 0
      const deel = gram / 100
      return {
        name: b.name, amount: gram, unit: r.unit || 'gram',
        calories: Math.round((b.calories_per_100g || 0) * deel),
        protein: Math.round((b.protein_per_100g || 0) * deel * 10) / 10,
        carbs: Math.round((b.carbs_per_100g || 0) * deel * 10) / 10,
        fat: Math.round((b.fat_per_100g || 0) * deel * 10) / 10,
      }
    }).filter(Boolean)
  } catch (e) {
    console.error('Ingrediënten uitschrijven mislukt:', e)
    return []
  }
}

export const eenheidKort = (u) => (u === 'gram' || u === 'g') ? 'g' : u === 'ml' ? ' ml' : u === 'portion' ? ' portie' : ` ${u || ''}`

