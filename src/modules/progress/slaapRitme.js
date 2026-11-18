// src/modules/progress/slaapRitme.js
//
// Slaap uit de agenda koppelen aan de gelogde nachten (18 nov 2026, Kersten:
// "als we zien dat iemand altijd om x naar bed gaat van ma-vrij, dat de
// agenda die tijden ook hanteert en het loggen met die tijden opent").
//
// Agenda-slaap per weekdag, in volgorde van voorrang (zelfde als
// ClientAgendaService): vaste rij in client_agenda_blocks (type 'sleep',
// week_start leeg) > intake (clients.work_schedule, type 'slaap') > 23:00-07:00.
// Een rij op dag X = naar bed op de avond van X, op ochtend X opstaan
// (start > end, de agenda knipt hem in twee helften).
//
// Een nacht met log_date D: bedtijd hoort bij de avond ervoor (dag D-1),
// opstaan bij dag D.

import { bedMin, opMin, plusDagen, klokTekst } from './slaapTips'

export const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const NL = { monday: 'ma', tuesday: 'di', wednesday: 'wo', thursday: 'do', friday: 'vr', saturday: 'za', sunday: 'zo' }
export const dagVan = (iso) => DAGEN[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7]
const naarMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null }

// { monday: { bed, op, rijId } ... } in minuten (bed als kloktijd, 0-1439).
export async function leesAgendaSlaap(db, clientId) {
  const [blokken, klant] = await Promise.all([
    db.supabase.from('client_agenda_blocks').select('id, day, start_time, end_time, hidden, week_start')
      .eq('client_id', clientId).eq('type', 'sleep').is('week_start', null).then(r => r, () => ({ data: [] })),
    db.supabase.from('clients').select('work_schedule').eq('id', clientId).maybeSingle().then(r => r, () => ({ data: null })),
  ])
  const ws = klant?.data?.work_schedule || {}
  const uit = {}
  for (const d of DAGEN) {
    const rij = (blokken.data || []).find(b => b.day === d && !b.hidden)
    const intake = (Array.isArray(ws[NL[d]]) ? ws[NL[d]] : []).find(b => b?.type === 'slaap')
    if (rij) uit[d] = { bed: naarMin(rij.start_time), op: naarMin(rij.end_time), rijId: rij.id }
    else if (intake?.start && intake?.end) uit[d] = { bed: naarMin(intake.start), op: naarMin(intake.end), rijId: null }
    else uit[d] = { bed: 23 * 60, op: 7 * 60, rijId: null }
  }
  return uit
}

// Startwaarden voor het logscherm van de nacht die op `logDatum` eindigt.
export function agendaTijdenVoor(agenda, logDatum) {
  const avond = agenda?.[dagVan(plusDagen(logDatum, -1))]
  const ochtend = agenda?.[dagVan(logDatum)]
  if (!avond || !ochtend) return null
  return { bed: klokTekst(avond.bed), op: klokTekst(ochtend.op) }
}

const mediaan = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const spreiding = (a) => { const g = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - g) ** 2, 0) / a.length) }
const opVijf = (m) => Math.round(m / 5) * 5

const GROEPEN = [
  { sleutel: 'werk', naam: 'Doordeweeks', dagen: DAGEN.slice(0, 5), minimaal: 4 },
  { sleutel: 'weekend', naam: 'In het weekend', dagen: DAGEN.slice(5), minimaal: 3 },
]

// Vaste gewoonte uit de laatste 3 weken die afwijkt van de agenda?
// Geeft per groep { naam, dagen, bed, op, huidigBed, huidigOp } terug.
// Vast = minstens `minimaal` nachten en een spreiding van hooguit 30 min;
// afwijkend = minstens 15 min anders dan wat er in de agenda staat.
export function ritmeVoorstellen(nachten, agenda, totEnMet) {
  if (!agenda) return []
  const van = plusDagen(totEnMet, -21)
  const recent = (nachten || []).filter(n => n.log_date > van && n.log_date <= totEnMet)
  const uit = []
  for (const g of GROEPEN) {
    const bedden = recent.filter(n => g.dagen.includes(dagVan(plusDagen(n.log_date, -1)))).map(n => bedMin(n.bedtime)).filter(v => v != null)
    const oppen = recent.filter(n => g.dagen.includes(dagVan(n.log_date))).map(n => opMin(n.wake_time)).filter(v => v != null)
    if (bedden.length < g.minimaal || oppen.length < g.minimaal) continue
    if (spreiding(bedden) > 30 || spreiding(oppen) > 30) continue
    const bed = opVijf(mediaan(bedden)) % 1440
    const op = opVijf(mediaan(oppen)) % 1440
    const verschil = (a, b) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d) }
    const wijktAf = g.dagen.some(d => verschil(agenda[d].bed, bed) >= 15 || verschil(agenda[d].op, op) >= 15)
    if (!wijktAf) continue
    const eerste = agenda[g.dagen[0]]
    uit.push({ sleutel: g.sleutel, naam: g.naam, dagen: g.dagen, bed, op, huidigBed: eerste.bed, huidigOp: eerste.op })
  }
  return uit
}

// Zet de tijden als vaste slaaprij op die dagen (bestaande rij bijwerken,
// anders een nieuwe; die gaat dan voor de intake-tijd).
export async function zetInAgenda(db, clientId, agenda, voorstel) {
  const tijd = (m) => `${klokTekst(m)}:00`
  for (const d of voorstel.dagen) {
    const rijId = agenda?.[d]?.rijId
    const velden = { start_time: tijd(voorstel.bed), end_time: tijd(voorstel.op), updated_at: new Date().toISOString() }
    const { error } = rijId
      ? await db.supabase.from('client_agenda_blocks').update(velden).eq('id', rijId)
      : await db.supabase.from('client_agenda_blocks').insert({ client_id: clientId, day: d, type: 'sleep', label: 'Slaap', ...velden })
    if (error) throw error
  }
  window.dispatchEvent(new CustomEvent('myarc:agenda-slaap-gewijzigd'))
}
