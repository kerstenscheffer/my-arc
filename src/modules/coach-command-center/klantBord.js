// Klantenbord op Command: eigen secties + wie in welke sectie staat.
// Opslag in command_bord_secties / command_bord_plek (klant-bord.sql).
// Lukt de database niet, dan valt alles terug op localStorage, zodat het bord
// altijd werkt (alleen dan niet op een ander apparaat).

const LOKAAL = 'myarc:klantbord'

export const KLEUREN = {
  rood: '#ef4444',
  oranje: '#f59e0b',
  groen: '#22c55e',
  wit: '#ffffff',
}
export const KLEUR_VOLGORDE = ['rood', 'oranje', 'groen', 'wit']

const STANDAARD = [
  { naam: 'Aandacht nodig', kleur: 'rood' },
  { naam: 'Opvolgen', kleur: 'oranje' },
  { naam: 'Loopt goed', kleur: 'groen' },
]

const lokaalLezen = () => {
  try {
    const r = JSON.parse(localStorage.getItem(LOKAAL) || 'null')
    if (r?.secties?.length) return r
  } catch { /* leeg of geblokkeerd */ }
  return {
    secties: STANDAARD.map((s, i) => ({ id: `lokaal-${i}`, ...s, volgorde: i })),
    plek: {},
    vorige: {},
  }
}
const lokaalSchrijven = (bord) => {
  try { localStorage.setItem(LOKAAL, JSON.stringify({ secties: bord.secties, plek: bord.plek })) } catch { /* vol of geblokkeerd */ }
}

export async function laadBord(supabase) {
  const [s, p] = await Promise.all([
    supabase.from('command_bord_secties').select('id, naam, kleur, volgorde, rol').order('volgorde').then(r => r, e => ({ error: e })),
    supabase.from('command_bord_plek').select('client_id, sectie_id, updated_at, vorige_naam, vorige_kleur, vorige_rol').then(r => r, e => ({ error: e })),
  ])
  if (s.error || p.error) return { bron: 'lokaal', ...lokaalLezen() }
  let secties = s.data || []
  if (!secties.length) {
    const ins = await supabase.from('command_bord_secties')
      .insert(STANDAARD.map((x, i) => ({ ...x, volgorde: i })))
      .select('id, naam, kleur, volgorde, rol')
      .then(r => r, e => ({ error: e }))
    if (ins.error) return { bron: 'lokaal', ...lokaalLezen() }
    secties = ins.data || []
  }
  const plek = {}, vorige = {}, tijd = {}
  for (const r of p.data || []) {
    plek[r.client_id] = r.sectie_id
    tijd[r.client_id] = r.updated_at
    if (r.vorige_naam) vorige[r.client_id] = { naam: r.vorige_naam, kleur: r.vorige_kleur, rol: r.vorige_rol }
  }
  return { bron: 'db', secties, plek, vorige, tijd }
}

// Alle schrijfacties krijgen het nieuwe bord mee (al optimistisch bijgewerkt)
// en schrijven alleen het verschil weg.
export async function bewaarPlek(supabase, bord, clientId, sectieId) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const q = sectieId
    ? supabase.from('command_bord_plek').upsert({ client_id: clientId, sectie_id: sectieId, updated_at: new Date().toISOString() }, { onConflict: 'coach_id,client_id' })
    : supabase.from('command_bord_plek').delete().eq('client_id', clientId)
  const r = await q.then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] plek niet bewaard', r.error)
}

export async function nieuweSectie(supabase, bord, naam) {
  const volgorde = bord.secties.length ? Math.max(...bord.secties.map(s => s.volgorde)) + 1 : 0
  if (bord.bron !== 'db') return { id: `lokaal-${Date.now()}`, naam, kleur: 'wit', volgorde }
  const r = await supabase.from('command_bord_secties').insert({ naam, kleur: 'wit', volgorde })
    .select('id, naam, kleur, volgorde, rol').single().then(x => x, e => ({ error: e }))
  if (r.error) { console.warn('[klantbord] sectie niet gemaakt', r.error); return null }
  return r.data
}

export async function wijzigSectie(supabase, bord, id, velden) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const r = await supabase.from('command_bord_secties').update(velden).eq('id', id).then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] sectie niet gewijzigd', r.error)
}

export async function verwijderSectie(supabase, bord, id) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  const r = await supabase.from('command_bord_secties').delete().eq('id', id).then(x => x, e => ({ error: e }))
  if (r.error) console.warn('[klantbord] sectie niet verwijderd', r.error)
}

export async function bewaarVolgorde(supabase, bord) {
  if (bord.bron !== 'db') return lokaalSchrijven(bord)
  await Promise.all(bord.secties.map(s =>
    supabase.from('command_bord_secties').update({ volgorde: s.volgorde }).eq('id', s.id).then(x => x, e => ({ error: e }))))
}

// Afgevinkt = deze ronde gehad (25 nov 2026, Kersten). Elke klant heeft een
// vaste frisse dag: Op koers (pakket 'basis') maandag, de rest donderdag.
// Vink je een klant af, dan zakt de kaart naar de achtergrond en kleurt hij
// elke dag een stukje voller, tot hij op zijn frisse dag weer helemaal vol
// staat. Niet afgevinkt sinds de laatste frisse dag = vol (moet nog).
// Verplaatsen tussen kolommen telt niet als afvinken.
const VOL_NA_VINK = 0.35  // net afgevinkt
const VOL_VOOR_RESET = 0.85 // de dag voor de frisse dag
const DAG_MS = 86400000

const middernacht = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const datumStr = (d) => d.toLocaleDateString('sv-SE')

export function weekMoment(nu = new Date()) {
  const dag = (nu.getDay() + 6) % 7 // 0 = maandag
  const maandag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - dag)
  const donderdag = new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + 3)
  return { dag, vandaag: middernacht(nu), maandag, donderdag, donderdagStr: datumStr(donderdag) }
}

/** Frisse dag van een klant: 0 = maandag (Op koers), 3 = donderdag (de rest). */
export const frisseDag = (pakket) => (pakket === 'basis' ? 0 : 3)

/** Laatste frisse dag tot en met vandaag, als JJJJ-MM-DD. */
export function laatsteReset(pakket, moment = weekMoment()) {
  const terug = (moment.dag - frisseDag(pakket) + 7) % 7
  return datumStr(new Date(moment.vandaag.getTime() - terug * DAG_MS))
}

/** Is deze klant deze ronde al afgevinkt? */
export function gehadDezeRonde(dagen, pakket, moment = weekMoment()) {
  const sinds = laatsteReset(pakket, moment)
  return (dagen || []).some(d => d >= sinds)
}

export function kaartVolheid({ dagen, pakket, moment }) {
  const sinds = laatsteReset(pakket, moment)
  const vinkjes = (dagen || []).filter(d => d >= sinds).sort()
  if (!vinkjes.length) return 1
  const vink = new Date(`${vinkjes[vinkjes.length - 1]}T00:00:00`)
  const reset = new Date(`${sinds}T00:00:00`)
  const volgende = new Date(reset.getFullYear(), reset.getMonth(), reset.getDate() + 7)
  const totaal = Math.max(1, Math.round((volgende - vink) / DAG_MS))
  const voorbij = Math.max(0, Math.round((moment.vandaag - vink) / DAG_MS))
  const deel = Math.min(1, voorbij / Math.max(1, totaal - 1))
  return VOL_NA_VINK + (VOL_VOOR_RESET - VOL_NA_VINK) * deel
}
