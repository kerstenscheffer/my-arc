// scripts/gino-kaart-melding.mjs (5 nov 2026)
//
// Melding bij een toestemmingskaart. De kaart zelf staat direct in de chat; een rij in
// coach_notifications (= push + bel) komt pas als de vraag na 60 s nog op wacht staat,
// en hooguit één per 15 minuten, ook bij meerdere open kaarten. Was 110 rijen in 2 dagen.
//
// De afstand komt uit de database: de PA herstart na elke code-opdracht, dus alleen
// een teller in het geheugen zou na elke opdracht opnieuw beginnen.
// Blijft een kaart open terwijl de afstand nog loopt, dan kijkt hij aan het eind
// daarvan opnieuw. De controles lopen na elkaar, anders melden twee kaarten tegelijk.

export const MELD_TITEL = 'Gino vraagt toestemming'
export const MELD_NA_MS = 60 * 1000
export const MELD_AFSTAND_MS = 15 * 60 * 1000
// Alleen rijen van deze regeling tellen mee voor de afstand; de oude kwamen per kaart.
// Tekst, geen boolean: action_data gaat mee in de push.
const REGELING = 'na60s'

export function maakKaartMelder({ sb, coachId, fout = () => {}, naMs = MELD_NA_MS, afstandMs = MELD_AFSTAND_MS }) {
  let laatste = 0
  let rij = Promise.resolve()

  async function laatsteMelding() {
    const { data, error } = await sb.from('coach_notifications').select('created_at')
      .eq('coach_id', coachId()).eq('title', MELD_TITEL).contains('action_data', { regeling: REGELING })
      .order('created_at', { ascending: false }).limit(1)
      .then(r => r, (e) => ({ error: e }))
    if (error) fout(`Laatste melding lezen mislukt: ${error.message}`)
    return Math.max(laatste, data?.[0] ? new Date(data[0].created_at).getTime() : 0)
  }

  async function controleer(id, reden) {
    const { data, error } = await sb.from('business_os_toestemmingen').select('status').eq('id', id).maybeSingle()
      .then(r => r, (e) => ({ error: e }))
    if (error) return fout(`Kaart nalezen mislukt: ${error.message}`)
    if (data?.status !== 'wacht') return

    const rest = await laatsteMelding() + afstandMs - Date.now()
    if (rest > 0) return void setTimeout(() => inRij(id, reden), rest)

    const { error: e } = await sb.from('coach_notifications').insert({
      coach_id: coachId(), type: 'personal', priority: 'high', title: MELD_TITEL,
      message: `${reden}`.slice(0, 140), tags: ['gino'], action_data: { soort: 'gino_toestemming', toestemming_id: id, regeling: REGELING },
    }).then(r => r, (x) => ({ error: x }))
    if (e) return fout(`Push mislukt: ${e.message}`)
    laatste = Date.now()
  }

  const inRij = (id, reden) => {
    rij = rij.then(() => controleer(id, reden)).catch(e => fout(`Kaartmelding mislukt: ${e.message}`))
    return rij
  }

  return { kaart: (id, reden) => void setTimeout(() => inRij(id, reden), naMs) }
}
