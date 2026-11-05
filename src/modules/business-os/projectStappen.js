// src/modules/business-os/projectStappen.js
//
// Stappen van een projectplan bewerken (business_os_projecten.plan). Gino schrijft
// in hetzelfde plan, dus elke wijziging leest het plan vlak ervoor opnieuw, past
// alleen die ene stap aan en schrijft alleen als updated_at intussen niet veranderde.
// Veranderde die wel, dan opnieuw lezen en opnieuw toepassen.
//
// Een wijziging is een functie die het plan ter plekke aanpast en true geeft als
// het lukte. Zo kan dezelfde functie ook op het scherm worden voorgedaan.

const TABEL = 'business_os_projecten'
const POGINGEN = 3

export const kopieVanPlan = (plan) => JSON.parse(JSON.stringify(plan || {}))
export const nieuweStapId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function zoekStap(plan, id) {
  if (!id) return null
  for (const fase of plan?.fases || []) {
    const si = (fase.stappen || []).findIndex(s => s?.id === id)
    if (si >= 0) return { fase, si }
  }
  return null
}

// Fases hebben geen id: op plek én naam, en anders op naam. Nooit in een andere fase.
function zoekFase(plan, { fi, naam }) {
  const fases = plan?.fases || []
  return fases[fi]?.naam === naam ? fases[fi] : fases.find(f => f.naam === naam) || null
}

export const wijzigStap = (id, velden) => (plan) => {
  const hit = zoekStap(plan, id)
  if (!hit) return false
  Object.assign(hit.fase.stappen[hit.si], velden)
  return true
}

// Eigenaar, notitie en datum op het bord. Leeg (null of '') haalt het veld weg.
export const zetKaartVelden = (id, velden) => (plan) => {
  const hit = zoekStap(plan, id)
  if (!hit) return false
  const stap = hit.fase.stappen[hit.si]
  for (const [veld, waarde] of Object.entries(velden)) {
    if (waarde === null || waarde === '' || waarde === undefined) delete stap[veld]
    else stap[veld] = waarde
  }
  return true
}

export const verwijderStap = (id) => (plan) => {
  const hit = zoekStap(plan, id)
  if (hit) hit.fase.stappen.splice(hit.si, 1)
  return true
}

export const voegStapToe = (plek, stap) => (plan) => {
  const fase = zoekFase(plan, plek)
  if (!fase) return false
  if (!Array.isArray(fase.stappen)) fase.stappen = []
  fase.stappen.push({ ...stap })
  return true
}

// Terug op de oude plek: achter de stap die ervoor stond, anders op hetzelfde nummer.
export const zetStapTerug = ({ plek, stap, si, naId }) => (plan) => {
  if (zoekStap(plan, stap.id)) return true
  const fase = zoekFase(plan, plek)
  if (!fase) return false
  if (!Array.isArray(fase.stappen)) fase.stappen = []
  const na = naId ? fase.stappen.findIndex(s => s?.id === naId) : -1
  const op = na >= 0 ? na + 1 : Math.min(si, fase.stappen.length)
  fase.stappen.splice(op, 0, { ...stap })
  return true
}

// ── Testbord (fase.bord) ──

// Naar een andere kolom: achteraan het plan. Zonder dag komt de kaart dus bovenop de stapel (zie kolomVolgorde).
export const verplaatsStap = (id, kolom) => (plan) => {
  const hit = zoekStap(plan, id)
  if (!hit) return false
  const [stap] = hit.fase.stappen.splice(hit.si, 1)
  hit.fase.stappen.push({ ...stap, kolom })
  return true
}

// Leeg (null of '') haalt het veld weg, zodat het weer als open telt.
export const wijzigTest = (plek, velden) => (plan) => {
  const fase = zoekFase(plan, plek)
  if (!fase) return false
  if (!fase.test || typeof fase.test !== 'object') fase.test = {}
  for (const [veld, waarde] of Object.entries(velden)) {
    if (waarde === null || waarde === '' || waarde === undefined) delete fase.test[veld]
    else fase.test[veld] = waarde
  }
  return true
}

// Fases worden op naam teruggevonden, dus een naam komt maar één keer voor.
const uniekeNaam = (fases, naam, behalve = null) => {
  const bezet = (n) => fases.some(f => f !== behalve && f.naam === n)
  let uit = naam
  for (let i = 2; bezet(uit); i++) uit = `${naam} ${i}`
  return uit
}

export const hernoemFase = (plek, naam) => (plan) => {
  const fase = zoekFase(plan, plek)
  if (!fase) return false
  fase.naam = uniekeNaam(plan.fases, naam, fase)
  return true
}

// Onder de laatste test.
export const voegTestToe = (naam) => (plan) => {
  if (!Array.isArray(plan.fases)) plan.fases = []
  const laatste = plan.fases.reduce((n, f, i) => (f.bord === true ? i : n), -1)
  const fase = { naam: uniekeNaam(plan.fases, naam), bord: true, test: {}, stappen: [] }
  plan.fases.splice(laatste >= 0 ? laatste + 1 : plan.fases.length, 0, fase)
  return true
}

export const verwijderFase = (plek) => (plan) => {
  const fase = zoekFase(plan, plek)
  if (fase) plan.fases.splice(plan.fases.indexOf(fase), 1)
  return true
}

// Terug op de oude plek: achter de fase die ervoor stond, anders op hetzelfde nummer.
export const zetFaseTerug = ({ fase, fi, naNaam }) => (plan) => {
  if (!Array.isArray(plan.fases)) plan.fases = []
  if (plan.fases.some(f => f.naam === fase.naam)) return true
  const na = naNaam ? plan.fases.findIndex(f => f.naam === naNaam) : -1
  plan.fases.splice(na >= 0 ? na + 1 : Math.min(fi, plan.fases.length), 0, kopieVanPlan(fase))
  return true
}

// Geeft { ok, plan }: plan is de stand in de database, of null als die niet te lezen was.
export async function schrijfPlan(sb, projectId, wijzig) {
  let laatste = null
  for (let i = 0; i < POGINGEN; i++) {
    const { data: rij, error: leesFout } = await sb.from(TABEL).select('plan, updated_at').eq('id', projectId).maybeSingle()
      .then(r => r, e => ({ error: e }))
    if (leesFout || !rij) return { ok: false, plan: laatste }
    laatste = rij.plan

    const plan = kopieVanPlan(rij.plan)
    if (!wijzig(plan)) return { ok: false, plan: laatste }

    // Geen fout maar ook geen rij: updated_at veranderde net (opnieuw) of RLS weigert (na de pogingen mislukt).
    const { data, error } = await sb.from(TABEL).update({ plan, updated_at: new Date().toISOString() })
      .eq('id', projectId).eq('updated_at', rij.updated_at).select('id')
      .then(r => r, e => ({ error: e }))
    if (error) return { ok: false, plan: laatste }
    if (data?.length) return { ok: true, plan }
  }
  return { ok: false, plan: laatste }
}
