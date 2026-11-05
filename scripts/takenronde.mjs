// scripts/takenronde.mjs
//
// Regels van de automatische takenronde (scripts/business-os-pa.mjs, planTaken):
// welke kaarten mee mogen, en het wijzigen van één kaart. Gedeeld met pa-db.mjs,
// zodat de droge run (taken-droog) precies dezelfde selectie geeft als de echte ronde.

import { schrijfPlan } from '../src/modules/business-os/projectStappen.js'

export const MAX_KAARTEN = 3

const isDag = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))
export const vandaagNL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

export const leesLopendeProjecten = (sb) => sb.from('business_os_projecten')
  .select('id, titel, plan').eq('status', 'uitvoering').order('created_at')

// Waarom een open kaart van Gino niet mee mag, of null als hij mag.
function redenNiet(s, fase, vandaag) {
  if (s.vast) return 'vast'
  if (!s.id) return 'geen id'
  if (!isDag(s.dag)) return 'geen dag'
  if (s.dag > vandaag) return `dag ${s.dag} is nog niet`
  const eerder = (fase.stappen || []).find(k => k?.wie === 'kersten' && k.klaar !== true && isDag(k.dag) && k.dag < s.dag)
  return eerder ? `wacht op kaart van Kersten: ${eerder.titel} (${eerder.dag})` : null
}

// Oudste dag eerst. Gelijke dag: volgorde van project, fase en kaart.
export function kiesTaken(projecten, vandaag) {
  const mogen = []
  const overgeslagen = []
  for (const p of projecten || []) {
    for (const fase of p.plan?.fases || []) {
      for (const s of fase.stappen || []) {
        if (s?.wie !== 'gino' || s.klaar === true) continue
        const kaart = { project_id: p.id, stap_id: s.id, titel: s.titel, dag: s.dag || null }
        const reden = redenNiet(s, fase, vandaag)
        if (reden) overgeslagen.push({ ...kaart, reden })
        else mogen.push(kaart)
      }
    }
  }
  mogen.sort((a, b) => a.dag.localeCompare(b.dag))
  return {
    kaarten: mogen.slice(0, MAX_KAARTEN),
    overgeslagen: [...mogen.slice(MAX_KAARTEN).map(k => ({ ...k, reden: `meer dan ${MAX_KAARTEN} per ronde` })), ...overgeslagen],
  }
}

function zoekKaart(plan, stapId) {
  for (const fase of plan?.fases || []) {
    const s = (fase.stappen || []).find(k => k?.id === stapId)
    if (s) return s
  }
  return null
}

const notitieErbij = (s, tekst) => { s.notitie = [typeof s.notitie === 'string' ? s.notitie.trim() : '', tekst].filter(Boolean).join('\n') }

// Eén kaart wijzigen. schrijfPlan leest het plan vlak ervoor opnieuw en schrijft alleen als het intussen niet veranderde.
// klaar: true|false. vast: true zet, null of false haalt het veld weg. notitie: komt onder de bestaande notitie.
export async function wijzigKaart(sb, projectId, stapId, { klaar, vast, notitie }) {
  let gevonden = false
  const uit = await schrijfPlan(sb, projectId, (plan) => {
    const s = zoekKaart(plan, stapId)
    if (!s) return false
    gevonden = true
    if (typeof klaar === 'boolean') s.klaar = klaar
    if (vast === true) s.vast = true
    else if (vast === null || vast === false) delete s.vast
    if (typeof notitie === 'string' && notitie.trim()) notitieErbij(s, notitie.trim())
    return true
  })
  return { ok: uit.ok, gevonden }
}

// Na de ronde: staat een kaart nog steeds open en mag hij nog mee, dan heeft de ronde hem niet afgerond.
// Vast zetten, anders pakt elke ronde hem opnieuw op, elke 30 minuten, zonder dat iemand het ziet.
export async function kaartenVastNaRonde(sb, kaarten, reden) {
  const vandaag = vandaagNL()
  let aantal = 0
  for (const k of kaarten || []) {
    const uit = await schrijfPlan(sb, k.project_id, (plan) => {
      const s = zoekKaart(plan, k.stap_id)
      if (!s || s.wie !== 'gino' || s.klaar === true || s.vast || !isDag(s.dag) || s.dag > vandaag) return false
      s.vast = true
      notitieErbij(s, reden)
      return true
    })
    if (uit.ok) aantal++
  }
  return aantal
}
