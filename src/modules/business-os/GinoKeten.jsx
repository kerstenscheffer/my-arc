// src/modules/business-os/GinoKeten.jsx
//
// De hele keten per week in één tabel: van content tot geld (5 nov 2026). Zo zie je
// waar het lekt: minder gepost, minder views, minder calls of minder close.
//
// De lead- en salescijfers komen uit STAT_REEKS, dus dezelfde services en rekenregels
// als het stats-scherm in Leads. De content komt uit content_ig_media.
//
// Kleur: elke week tegen het eigen gemiddelde van die rij. Op of boven het gemiddelde groen,
// daaronder via geel en oranje naar rood bij 60% slechter. De lopende week krijgt geen kleur: die is nog niet af, dus altijd lager.
//
// Een getal aanklikken toont wat erachter zit: de posts, of de leads uit de stats-service.
// Nieuwe leads, reacties, follow-ups en binnengekomen geven alleen aantallen terug.
//
// Rijen kun je slepen en met "Stats kiezen" aan of uit zetten. Dat kan als weergave worden
// bewaard (business_os_keten_weergaven); de laatste stand onthoudt dit apparaat.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Film, Sparkles, Eye, BarChart3, MessageSquare, UserPlus, Send, MessageCircle, PhoneCall, CalendarCheck, Calendar,
  Phone, Trophy, Euro, Wallet, UserX, PhoneOff, XCircle, Percent, X, ChevronDown, Filter, GripVertical, Check, Trash2, Mars, Venus, VenusAndMars, Megaphone, ChevronRight, EyeOff,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LeadManagementService from '../lead-management/LeadManagementService'
import { STAT_REEKS } from '../lead-management/components/statWeekReeks'

const GROEN = '#10b981'
const ROOD = '#ef4444'
const WEKEN = 13 // eerst: de lopende week plus 12 volle, daar rekent de kleur mee
const STAP = 4 // zoveel weken erbij als je naar het einde schuift
const MAX_WEKEN = 52
const CONTENT_VANAF = '2026-03-30' // daarvoor staat er geen content in content_ig_media
const ROOD_BIJ = 0.6 // zoveel onder het gemiddelde is helemaal rood
const GROEN_TINT = 142

// content = uit content_ig_media, stat = label uit STAT_REEKS, deel = percentage van twee rijen.
// stap = telt mee als schakel in de zin bovenaan.
const RIJEN = [
  { key: 'posts', label: 'Posts', Icon: Film, kleur: '#fff', content: c => c.posts, lijst: { sorteer: 'tijd' } },
  { key: 'magnets', label: 'Magnets', Icon: Sparkles, kleur: '#fff', content: c => c.magnets, lijst: { sorteer: 'tijd', filter: p => p.soort === 'magnet' } },
  { key: 'viewsMagnet', label: 'Views per magnet', Icon: Eye, kleur: '#fff', content: c => c.viewsMagnet, stap: true, lijst: { sorteer: 'views', filter: p => p.soort === 'magnet' } },
  { key: 'views', label: 'Totaal views', Icon: BarChart3, kleur: '#fff', content: c => c.views, stap: true, lijst: { sorteer: 'views', filter: p => p.views != null } },
  { key: 'comments', label: 'Comments', Icon: MessageSquare, kleur: '#fff', content: c => c.comments, stap: true, lijst: { sorteer: 'comments', filter: p => p.comments != null } },
  { key: 'nieuw', label: 'Nieuwe leads', Icon: UserPlus, kleur: '#3b82f6', stat: 'Nieuwe leads' },
  { key: 'follow', label: 'Follow-ups', Icon: Send, kleur: '#f59e0b', stat: 'Follow-ups' },
  { key: 'challenge', label: 'Campagne', Icon: Megaphone, kleur: '#a855f7' },
  { key: 'chal', label: 'Challenge', Icon: Trophy, kleur: '#FFD700' },
  { key: 'reacties', label: 'Reacties', Icon: MessageCircle, kleur: GROEN, stat: 'Reacties', stap: true },
  { key: 'voorgesteld', label: 'Voorgesteld', Icon: PhoneCall, kleur: '#a855f7', stat: 'Voorgesteld', stage: 'callProposed', stap: true },
  { key: 'ingepland', label: 'Ingepland', Icon: CalendarCheck, kleur: '#06b6d4', stat: 'Ingepland', stage: 'callScheduled', stap: true },
  { key: 'gepland', label: 'Calls gepland', Icon: Calendar, kleur: '#6366f1', stat: 'Calls gepland', stage: 'callBooked' },
  { key: 'gevoerd', label: 'Call gevoerd', Icon: Phone, kleur: GROEN, stat: 'Call gevoerd', stage: 'callHeld', stap: true },
  { key: 'sales', label: 'Sales', Icon: Trophy, kleur: '#FFD700', stat: 'Sales', stage: 'sale' },
  { key: 'order', label: 'Orderwaarde', Icon: Euro, kleur: '#FFD700', stat: 'Orderwaarde', stage: 'sale', euro: true },
  { key: 'binnen', label: 'Binnengekomen', Icon: Wallet, kleur: '#22c55e', stat: 'Binnengekomen', euro: true },
  { key: 'noshow', label: 'No-shows', Icon: UserX, kleur: ROOD, stat: 'No-shows', stage: 'noShow', omgekeerd: true },
  { key: 'afgewezen', label: 'Afgewezen', Icon: PhoneOff, kleur: '#f97316', stat: 'Afgewezen', stage: 'callRejected', omgekeerd: true },
  { key: 'verloren', label: 'Sale verloren', Icon: XCircle, kleur: ROOD, stat: 'Sale verloren', stage: 'saleLost', omgekeerd: true },
  { key: 'naarCall', label: 'Voorstel → ingepland', Icon: Percent, kleur: '#fff', deel: ['ingepland', 'voorgesteld'], stap: true },
  { key: 'showUp', label: 'Gepland → gevoerd', Icon: Percent, kleur: '#fff', deel: ['gevoerd', 'gepland'], stap: true },
  { key: 'close', label: 'Gevoerd → sale', Icon: Percent, kleur: '#fff', deel: ['sales', 'gevoerd'], stap: true },
]

// Vragen aan Gino op weg naar €10.000 per maand. Het antwoord komt in de chat.
const VRAAG_REGEL = 'Gebruik echte cijfers, zeg per punt wat we nu moeten doen, en noem een oorzaak een vermoeden als je hem niet kunt bewijzen.'
const VRAGEN = [
  { label: 'Waar zit het lek?', vraag: 'Kijk naar de keten van de laatste weken, van content tot geld: waar zit het lek, wat is de waarschijnlijke oorzaak en wat moeten we eerst fixen?' },
  { label: 'Wat is de kortste route naar €10K?', vraag: 'Reken terug van €10.000 omzet per maand naar sales, gevoerde calls, ingeplande calls, reacties en views per week. Waar staan we nu, en welke stap geeft het meeste geld als we hem verbeteren?' },
  { label: 'Wat is elke stap waard in euro’s?', vraag: 'Wat levert gemiddeld één reactie, één voorgestelde call, één ingeplande call en één gevoerde call op in euro’s? Wat is dus 1% beter per stap waard per maand?' },
  { label: 'Welke magnets leveren echt sales?', vraag: 'Zet de magnets per woord naast elkaar over de laatste 90 dagen: views, comments, leads, calls, sales en omzet. Welke moeten we meer posten en welke kunnen weg?' },
  { label: 'Waarom daalt mijn close?', vraag: 'Waarom gaat gevoerd naar sale omlaag? Kijk naar de redenen bij sale verloren en naar de calls van de laatste weken. Welke bezwaren komen terug, en wat kan ik in de call anders doen?' },
  { label: 'Waarom zeggen leads nee tegen een call?', vraag: 'Bekijk voorgesteld, ingepland en afgewezen van de laatste weken en de redenen bij afgewezen. Waarom zeggen leads nee, en wat moet er in de DM anders?' },
  { label: 'Welke leads moeten we nu benaderen?', vraag: 'Welke groep leads levert per bericht de meeste calls en sales: nieuw of oud, man of vrouw, per magnet? Hoeveel leads zitten er nog in de beste groep, en wie benaderen we deze week?' },
  { label: 'Hoeveel komt er zeker binnen deze maand?', vraag: 'Hoeveel geld komt er deze en volgende maand zeker binnen uit termijnen en openstaande betalingen, hoeveel nieuwe omzet is er dan nog nodig voor €10.000, en hoeveel sales is dat?' },
  { label: 'Wat doe ik deze week als eerste?', vraag: 'Kies op basis van de keten de 3 acties die deze week het meeste opleveren richting €10.000 per maand, op volgorde, met wat ik precies moet doen en hoe we zien of het werkt.' },
]

// Posts en Magnets klappen uit: per soort en per magnet-woord de posts, views en comments
// van elke week, bij een woord ook de nieuwe leads met dat woord. Zo zie je wat je postte
// en wie daardoor binnenkwam.
const UITKLAP = {
  posts: { groep: (p) => p.soort || 'overig', naam: (g) => SOORTEN[g] || g },
  magnets: { groep: (p) => (p.soort === 'magnet' && p.woord ? String(p.woord).trim().toUpperCase() : null), naam: (g) => g, leads: true },
}
UITKLAP.chal = { naam: (g) => g }
// De challenge in groepen. veld = uit get_keten_challenge. deel = percentage van twee rijen.
// neutraal = geen kleur: een cohort dat nog loopt is geen slechte week.
const CHALLENGE_GROEPEN = [
  { id: 'campagne', label: 'Campagne', rijen: [
    { id: 'berichten', label: 'Berichten', geslacht: 'chalBerichten' },
    { id: 'reacties', label: 'Reacties', veld: 'reacties' },
    { id: 'voorgesteld', label: 'Voorgesteld', veld: 'voorgesteld' },
    { id: 'ingepland', label: 'Ingepland', veld: 'ingepland' },
    { id: 'per100', label: 'Ingepland per 100 berichten', decimaal: true },
  ] },
  { id: 'calls', label: 'Calls', rijen: [
    { id: 'gevoerd', label: 'Gevoerd', veld: 'gevoerd' },
    { id: 'noshow', label: 'No-shows', veld: 'noshow', omgekeerd: true },
    { id: 'afgewezen', label: 'Call afgewezen', veld: 'afgewezen', omgekeerd: true },
    { id: 'verloren', label: 'Sale verloren', veld: 'verloren', omgekeerd: true },
    { id: 'sales', label: 'Sales uit campagne', veld: 'sales_campagne' },
    { id: 'close', label: 'Close', deel: ['chal:calls:sales', 'chal:calls:gevoerd'] },
  ] },
  { id: 'geld', label: 'Verkoop', rijen: [
    { id: 'verkocht', label: 'Challenges verkocht', veld: 'verkocht' },
    { id: 'order', label: 'Orderwaarde', veld: 'order', euro: true },
    { id: 'uitgesteld', label: 'Uitgesteld', veld: 'uitgesteld', omgekeerd: true },
    { id: 'verlengingen', label: 'Verlengingen', veld: 'verlengingen' },
    { id: 'verleng', label: 'Orderwaarde verlengingen', veld: 'verleng_order', euro: true },
  ] },
  { id: 'cohort', label: 'Uit deze week verkocht, nu', rijen: [
    { id: 'open', label: 'Loopt nog', veld: 'cohort_open', neutraal: true },
    { id: 'doorgezet', label: 'Doorgezet', veld: 'cohort_doorgezet', neutraal: true },
    { id: 'behouden', label: 'Borg behouden', veld: 'cohort_behouden', neutraal: true },
    { id: 'refund', label: 'Refunds', veld: 'cohort_refund', neutraal: true },
    { id: 'doorzet', label: 'Doorzet %', deel: ['chal:cohort:doorgezet', 'chal:geld:verkocht'], neutraal: true },
  ] },
  { id: 'doorstap', label: 'Doorstap-gesprekken', rijen: [
    { id: 'ja', label: 'Ja', veld: 'doorstap_ja', neutraal: true },
    { id: 'denkt', label: 'Denkt na', veld: 'doorstap_denkt', neutraal: true },
    { id: 'nee', label: 'Nee', veld: 'doorstap_nee', neutraal: true },
  ] },
]
const UITKLAP_KEY = 'myarc.keten.uitklap'
// Leads per 10 posts onder elk woord. Staat standaard aan: alleen "uit" wordt bewaard, zo
// verschijnt de rij ook in weergaven die al bestonden. Oudere app-versies negeren deze sleutel.
const PER10_UIT = 'magnetsPer10Uit'
const PER10_MIN_POSTS = 5 // minder posts in een week zegt te weinig: geen kleur en niet in het gemiddelde
const leesUitklap = () => {
  try { const u = JSON.parse(localStorage.getItem(UITKLAP_KEY)); return u && typeof u === 'object' ? u : {} } catch { return {} }
}

// Klik op de naam van deze rijen wisselt beide → mannen → vrouwen. Per rij; dit apparaat onthoudt het.
const GESLACHT_RIJEN = { nieuw: { mannen: 'nieuwMannen', vrouwen: 'nieuwVrouwen' }, challenge: { mannen: 'challengeMannen', vrouwen: 'challengeVrouwen' } }
const GESLACHT = {
  beide: { naam: 'Beide', Icon: VenusAndMars, kleur: '#fff', volgende: 'mannen' },
  mannen: { naam: 'Mannen', Icon: Mars, kleur: '#3b82f6', volgende: 'vrouwen' },
  vrouwen: { naam: 'Vrouwen', Icon: Venus, kleur: '#ec4899', volgende: 'beide' },
}
const GESLACHT_KEY = 'myarc.keten.geslacht.per_rij'
const leesGeslacht = () => {
  try { return JSON.parse(localStorage.getItem(GESLACHT_KEY)) || {} } catch { return {} }
}

const ALLE_KEYS = RIJEN.map(r => r.key)
const RIJ_VAN = Object.fromEntries(RIJEN.map(r => [r.key, r]))
const STAND = 'myarc.keten.stand'
const leesStand = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STAND))
    const keys = Array.isArray(s?.keys) ? s.keys.filter(k => RIJ_VAN[k] || k === PER10_UIT) : []
    // Een nieuwe stat verschijnt vanzelf, na de stat die er standaard boven staat. Wat je zelf
    // uitzette blijft uit: dat staat in `gezien`. Standen van vóór `gezien` kenden challenge nog niet.
    const gezien = Array.isArray(s?.gezien) ? s.gezien : ALLE_KEYS.filter(k => k !== 'challenge')
    for (const k of ALLE_KEYS) {
      if (gezien.includes(k) || keys.includes(k)) continue
      keys.splice(keys.indexOf(ALLE_KEYS[ALLE_KEYS.indexOf(k) - 1]) + 1, 0, k)
    }
    return keys.length ? { actief: s.actief || null, keys } : null
  } catch { return null }
}
const bewaarStand = (actief, keys) => {
  try { localStorage.setItem(STAND, JSON.stringify({ actief, keys, gezien: ALLE_KEYS })) } catch { /* privémodus */ }
}

const isoLokaal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const maandagVan = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const weekNr = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7))
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7)
}
const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')

// Alle challenge-campagnes samen (challenge Man, Challenge vrouw). Een week telt wie die
// week aan zo'n campagne is gekoppeld, net als "Getagd" in de campagnekaarten.
let challengeIds = null
const haalChallengeIds = () => {
  challengeIds ||= supabase.from('outreach_campaigns').select('id').ilike('name', '%challenge%')
    .then(res => { if (res.error) throw res.error; return res.data.map(c => c.id) })
    .catch(() => { challengeIds = null; return null })
  return challengeIds
}
// Geslacht komt van de lead en niet van de campagnenaam: vóór 2 nov stonden er ook vrouwen
// onder "challenge Man".
async function telChallenge(s, e, geslacht = null) {
  const ids = await haalChallengeIds()
  if (!ids) return null
  if (!ids.length) return 0
  let q = supabase.from('lead_campaign_tags').select(geslacht ? 'id, call_leads!inner(gender)' : 'id', { count: 'exact', head: true })
    .in('campaign_id', ids).gte('tagged_at', s).lt('tagged_at', e)
  if (geslacht) q = q.eq('call_leads.gender', geslacht)
  const res = await q.then(r => r, () => ({ error: true }))
  return res.error ? null : res.count
}

// Volle weken veranderen niet meer; de lopende week halen we elke keer vers op.
const cache = new Map()

async function haalWeek(svc, coachId, van) {
  const sleutel = `${coachId}|${isoLokaal(van)}`
  if (cache.has(sleutel)) return cache.get(sleutel)
  const tot = new Date(van); tot.setDate(tot.getDate() + 7)
  const s = van.toISOString(), e = tot.toISOString()
  // Geslacht apart tellen op de server: dezelfde telling als newLeads, plus het filter.
  const telLeads = (g) => supabase.from('call_leads').select('id', { count: 'exact', head: true })
    .gte('created_at', s).lt('created_at', e).is('deleted_at', null).eq('gender', g).then(res => (res.error ? null : res.count), () => null)
  const [act, fun, rx, cash, media, mannen, vrouwen, challenge, challengeMannen, challengeVrouwen, magnetLeads, chal] = await Promise.all([
    svc.getRangeActivity(coachId, s, e),
    svc.getRangeFunnelStats(coachId, s, e),
    svc.getRangeReactionStats(coachId, s, e),
    svc.getRangeCashCollected(coachId, s, e),
    supabase.from('content_ig_media').select('id, tijd, soort, woord, views, comments, tekst').gte('dag', isoLokaal(van)).lt('dag', isoLokaal(tot)).limit(1000).then(r => r, () => ({ data: null })),
    telLeads('male'),
    telLeads('female'),
    telChallenge(s, e),
    telChallenge(s, e, 'male'),
    telChallenge(s, e, 'female'),
    supabase.rpc('get_keten_magnet_leads', { p_van: s, p_tot: e }).then(res => (res.error ? null : res.data || []), () => null),
    supabase.rpc('get_keten_challenge', { p_van: s, p_tot: e }).then(res => res.data || null, () => null),
  ])
  const waarden = {}
  const ctx = { act, fun, rx, cash }
  const m = isoLokaal(van) >= CONTENT_VANAF ? media?.data : null
  const magnets = m?.filter(p => p.soort === 'magnet') || []
  const som = (l, k) => l.reduce((t, p) => t + (Number(p[k]) || 0), 0)
  const inhoud = m && { posts: m.length, magnets: magnets.length, views: som(m, 'views'), comments: som(m, 'comments'), viewsMagnet: magnets.length ? Math.round(som(magnets, 'views') / magnets.length) : null }
  for (const r of RIJEN) {
    if (r.content) waarden[r.key] = inhoud ? r.content(inhoud) : null
    else if (r.stat) waarden[r.key] = STAT_REEKS[r.stat][1](ctx)
  }
  for (const r of RIJEN) {
    if (r.deel) waarden[r.key] = waarden[r.deel[1]] > 0 ? Math.round((waarden[r.deel[0]] / waarden[r.deel[1]]) * 100) : null
  }
  // De uitklaprijen: posts, views en comments per groep, leads per woord.
  for (const [rij, u] of Object.entries(UITKLAP)) {
    if (!u.groep) continue
    for (const p of m || []) {
      const g = u.groep(p)
      if (!g) continue
      const k = `${rij}:${g}`
      waarden[`${k}:posts`] = (waarden[`${k}:posts`] || 0) + 1
      if (p.views != null) waarden[`${k}:views`] = (waarden[`${k}:views`] || 0) + Number(p.views)
      if (p.comments != null) waarden[`${k}:comments`] = (waarden[`${k}:comments`] || 0) + Number(p.comments)
    }
  }
  for (const l of magnetLeads || []) {
    waarden[`magnets:${l.woord}:leads`] = l.totaal
    waarden[`magnets:${l.woord}:leadsMannen`] = l.mannen
    waarden[`magnets:${l.woord}:leadsVrouwen`] = l.vrouwen
  }
  // Leads per 10 posts. Wel posts en geen leads is 0; lukte de telling niet, dan een streepje.
  if (magnetLeads) {
    for (const sleutel of Object.keys(waarden)) {
      const woord = sleutel.match(/^magnets:(.+):posts$/)?.[1]
      if (!woord) continue
      const k = `magnets:${woord}`
      const per10 = (leads) => ((leads || 0) / waarden[sleutel]) * 10
      waarden[`${k}:per10`] = per10(waarden[`${k}:leads`])
      waarden[`${k}:per10Mannen`] = per10(waarden[`${k}:leadsMannen`])
      waarden[`${k}:per10Vrouwen`] = per10(waarden[`${k}:leadsVrouwen`])
    }
  }
  // Totaal van alle magnets, voor de rij "Totaal" bovenaan de uitklap. Een lead met twee
  // magnets telt hier twee keer mee, net als onder de losse woorden.
  const metTotaal = m?.filter(p => p.soort === 'magnet' && p.woord) || []
  if (m) {
    waarden['magnetsTotaal:posts'] = metTotaal.length
    waarden['magnetsTotaal:views'] = som(metTotaal, 'views')
    waarden['magnetsTotaal:comments'] = som(metTotaal, 'comments')
  }
  if (magnetLeads) {
    const tel = (k) => magnetLeads.reduce((t, l) => t + (Number(l[k]) || 0), 0)
    waarden['magnetsTotaal:leads'] = tel('totaal')
    waarden['magnetsTotaal:leadsMannen'] = tel('mannen')
    waarden['magnetsTotaal:leadsVrouwen'] = tel('vrouwen')
    if (metTotaal.length) {
      waarden['magnetsTotaal:per10'] = (tel('totaal') / metTotaal.length) * 10
      waarden['magnetsTotaal:per10Mannen'] = (tel('mannen') / metTotaal.length) * 10
      waarden['magnetsTotaal:per10Vrouwen'] = (tel('vrouwen') / metTotaal.length) * 10
    }
  }
  // Challenge: de rijen uit CHALLENGE_GROEPEN, plus de berichten uit de telling hierboven.
  waarden['chal:campagne:berichten'] = challenge
  waarden['chal:campagne:berichtenMannen'] = challengeMannen
  waarden['chal:campagne:berichtenVrouwen'] = challengeVrouwen
  if (chal) {
    waarden.chal = Number(chal.verkocht) || 0
    for (const g of CHALLENGE_GROEPEN) {
      for (const c of g.rijen) if (c.veld) waarden[`chal:${g.id}:${c.id}`] = Number(chal[c.veld]) || 0
    }
    waarden['chal:campagne:per100'] = challenge > 0 ? (waarden['chal:campagne:ingepland'] / challenge) * 100 : null
    for (const g of CHALLENGE_GROEPEN) {
      for (const c of g.rijen) {
        if (c.deel) waarden[`chal:${g.id}:${c.id}`] = waarden[c.deel[1]] > 0 ? Math.round((waarden[c.deel[0]] / waarden[c.deel[1]]) * 100) : null
      }
    }
  }
  waarden.challenge = challenge
  waarden.challengeMannen = challengeMannen
  waarden.challengeVrouwen = challengeVrouwen
  waarden.nieuwMannen = mannen
  waarden.nieuwVrouwen = vrouwen
  const week = { waarden, posts: m || [], fun }
  if (tot <= new Date()) cache.set(sleutel, week)
  return week
}

// Piek-stip bij Nieuwe leads: één dag met minstens de helft van de week en minstens 200 leads,
// alle geslachten samen. Zo lees je een geïmporteerde lading niet als recordweek.
const PIEK_MIN = 200
const PIEK_DEEL = 0.5
const PIEK_KLEUR = '#f97316'
const PORTIE = 1000 // Supabase kapt af op 1000 rijen
const NL_DAG = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' })
const NL_UUR = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: 'numeric', hourCycle: 'h23' })
// 00:00 in Amsterdam op die datum, los van de tijdzone van het apparaat.
const nlMiddernacht = (iso) => {
  const utc = new Date(`${iso}T00:00:00Z`)
  return new Date(utc.getTime() - Number(NL_UUR.format(utc)) * 36e5)
}
const piekCache = new Map() // volle weken veranderen niet meer; mislukt ophalen komt er niet in

// Geeft de piek van de week, null zonder piek of als het ophalen mislukt: dan gewoon geen stip.
async function haalPiek(van) {
  const sleutel = isoLokaal(van)
  if (piekCache.has(sleutel)) return piekCache.get(sleutel)
  const einde = new Date(van); einde.setDate(einde.getDate() + 7)
  const s = nlMiddernacht(sleutel).toISOString(), e = nlMiddernacht(isoLokaal(einde)).toISOString()
  const dagen = {}
  const week = { n: 0, m: 0, v: 0 }
  for (let vanaf = 0; ; vanaf += PORTIE) {
    const res = await supabase.from('call_leads').select('created_at, gender')
      .gte('created_at', s).lt('created_at', e).is('deleted_at', null)
      .order('created_at').order('id').range(vanaf, vanaf + PORTIE - 1)
      .then(r => r, fout => ({ error: fout }))
    if (res.error || !res.data) return null
    for (const l of res.data) {
      const dag = NL_DAG.format(new Date(l.created_at))
      const d = dagen[dag] ||= { dag, n: 0, m: 0, v: 0 }
      d.n++; week.n++
      if (l.gender === 'male') { d.m++; week.m++ }
      if (l.gender === 'female') { d.v++; week.v++ }
    }
    if (res.data.length < PORTIE) break
  }
  const top = Object.values(dagen).sort((a, b) => b.n - a.n)[0]
  const piek = top && top.n >= PIEK_MIN && top.n >= week.n * PIEK_DEEL ? { top, week } : null
  if (einde <= new Date()) piekCache.set(sleutel, piek)
  return piek
}

const piekRegel = ({ top, week }, stand) => {
  const [deel, totaal, naam] = stand === 'mannen' ? [top.m, week.m, 'mannen'] : stand === 'vrouwen' ? [top.v, week.v, 'vrouwen'] : [top.n, week.n, 'leads']
  const [j, m, d] = top.dag.split('-').map(Number)
  return `${deel.toLocaleString('nl-NL')} van de ${totaal.toLocaleString('nl-NL')} ${naam} kwamen op ${kort(new Date(j, m - 1, d))} binnen.`
}

const postTijd = (t) => new Date(t).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Volgorde en namen van de dropdowns; een onbekende soort komt er gewoon achteraan.
const SOORTEN = { magnet: 'Magnets', reel: 'Reels', story: 'Stories', foto: "Foto's", carousel: 'Carrousels' }
const volgorde = (s) => { const i = Object.keys(SOORTEN).indexOf(s); return i < 0 ? 99 : i }

function Detail({ open, onSluit, isMobile }) {
  const [openSoort, setOpenSoort] = useState(null)
  const { rij, kolom, week } = open
  const metaStijl = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }
  const regel = { padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }
  const posts = rij.lijst
    ? week.posts.filter(rij.lijst.filter || (() => true)).sort((a, b) => (
      rij.lijst.sorteer === 'tijd' ? new Date(b.tijd) - new Date(a.tijd) : (b[rij.lijst.sorteer] || 0) - (a[rij.lijst.sorteer] || 0)))
    : null
  const leads = rij.stage ? (week.fun?.[rij.stage]?.leads || []) : null
  const aantal = posts ? posts.length : leads.length
  // Per soort, in de sortering van de rij. Eén soort hoeft niet open te klikken.
  const groepen = posts
    ? [...new Set(posts.map(p => p.soort || 'overig'))].sort((a, b) => volgorde(a) - volgorde(b))
      .map(soort => ({ soort, posts: posts.filter(p => (p.soort || 'overig') === soort) }))
    : []
  const postRegel = (p) => (
    <div key={p.id} style={regel}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {(p.tekst || '').trim() || (p.soort === 'story' ? 'Story' : 'Geen tekst')}
      </div>
      <div style={metaStijl}>
        {postTijd(p.tijd)}{p.woord ? ` · ${p.woord}` : ''}
        {p.views != null && ` · ${Number(p.views).toLocaleString('nl-NL')} views`}
        {p.comments != null && ` · ${p.comments} comments`}
      </div>
    </div>
  )
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 'min(430px, 100%)', zIndex: 5,
      display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 14, padding: '12px 14px', animation: 'gk-blad .2s ease-out both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 900, color: '#fff' }}>
          {rij.titel || rij.label} · {kolom.label} <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>({aantal})</span>
        </div>
        <button type="button" onClick={onSluit} aria-label="Sluiten" style={{
          width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff',
        }}><X size={15} strokeWidth={2.6} /></button>
      </div>
      <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {aantal === 0 && <div style={{ ...metaStijl, padding: '8px 0' }}>Niets in deze week.</div>}
        {groepen.length === 1 && groepen[0].posts.map(postRegel)}
        {groepen.length > 1 && groepen.map(g => {
          const isOpen = openSoort === g.soort
          return (
            <div key={g.soort} style={{ borderTop: '1px solid rgba(255,255,255,0.14)' }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpenSoort(isOpen ? null : g.soort)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 42, padding: '0 2px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, textAlign: 'left',
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>{SOORTEN[g.soort] || g.soort}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{g.posts.length}</span>
                <ChevronDown size={16} strokeWidth={2.6} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {isOpen && <div style={{ paddingBottom: 6 }}>{g.posts.map(postRegel)}</div>}
            </div>
          )
        })}
        {leads?.map((l, i) => (
          <div key={l.id || `${l.leadId}-${i}`} style={regel}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{l.name}</div>
            {(l.at || l.time || l.reason) && (
              <div style={metaStijl}>
                {[l.at || l.time ? new Date(l.at || l.time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : null, l.reason].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const toon = (r, v) => {
  if (v == null) return '—'
  if (r.euro) return `€${Number(v).toLocaleString('nl-NL')}`
  if (r.deel) return `${v}%`
  if (r.decimaal) return Number(v).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return Number(v).toLocaleString('nl-NL')
}

// De som van een rij over een stuk weken: percentages over de totalen, de rest per week.
function gemiddelde(r, weken) {
  if (r.deel) {
    const a = weken.reduce((t, w) => t + (w.waarden[r.deel[0]] || 0), 0)
    const b = weken.reduce((t, w) => t + (w.waarden[r.deel[1]] || 0), 0)
    return b > 0 ? (a / b) * 100 : null
  }
  const metWaarde = weken.filter(w => w.waarden[r.key] != null)
  return metWaarde.length ? metWaarde.reduce((t, w) => t + w.waarden[r.key], 0) / metWaarde.length : null
}

// Laatste 3 volle weken tegen de 4 weken daarvoor, over de rijen die nu in beeld staan.
// sleutelVan: welke waarde een rij nu toont (bv. alleen mannen).
function conclusie(volle, keys, sleutelVan) {
  if (volle.length < 5) return null
  const nu = volle.slice(0, 3), toen = volle.slice(3, 7)
  const verschil = (r) => {
    const rij = { ...r, key: sleutelVan(r) }
    const a = gemiddelde(rij, toen), b = gemiddelde(rij, nu)
    if (!(a > 0) || b == null) return null
    const pct = Math.round(((b - a) / a) * 100)
    // Bij no-shows en dergelijke is meer juist slechter.
    return { r, oud: a, nieuw: b, pct, slechter: r.omgekeerd ? pct : -pct }
  }
  const zichtbaar = keys.map(k => RIJ_VAN[k]).filter(Boolean)
  const stappen = zichtbaar.map(verschil).filter(Boolean).sort((x, y) => y.slechter - x.slechter)
  if (!stappen.length || stappen[0].slechter <= 0) return { tekst: 'Geen van deze stats is slechter dan de 4 weken daarvoor.' }
  const close = verschil(RIJ_VAN.close)
  const calls = verschil(RIJ_VAN.gevoerd)
  const sales = gemiddelde(RIJ_VAN.sales, nu), order = gemiddelde(RIJ_VAN.order, nu)
  // Wat de gemiste calls kosten, tegen de close en orderwaarde van nu. Alleen als de calls in beeld staan.
  const extra = keys.includes('gevoerd') && calls && calls.pct < 0 && close && sales > 0
    ? Math.round((calls.oud - calls.nieuw) * (close.nieuw / 100) * (order / sales) / 10) * 10
    : null
  const daling = stappen.filter(d => d.slechter >= 15).slice(0, 4)
  return {
    grootste: stappen[0],
    daling,
    close: keys.includes('close') && !daling.some(d => d.r.key === 'close') ? close : null,
    extra,
  }
}

// -58%, of 59% → 43% bij een rij die zelf al een percentage is.
const verschilTekst = (d) => (d.r.deel ? `${Math.round(d.oud)}% → ${Math.round(d.nieuw)}%` : `${d.pct > 0 ? '+' : ''}${d.pct}%`)

export default function GinoKeten({ isMobile, onVraag }) {
  const [aantal, setAantal] = useState(WEKEN)
  const kolommen = useMemo(() => {
    const m = maandagVan(new Date())
    return Array.from({ length: aantal }, (_, i) => {
      const van = new Date(m); van.setDate(van.getDate() - i * 7)
      return { id: isoLokaal(van), van, label: `WK ${weekNr(van)}`, subKort: kort(van), loopt: i === 0 }
    })
  }, [aantal])
  const [perWeek, setPerWeek] = useState({})
  const [fout, setFout] = useState(null)
  const [detail, setDetail] = useState(null)
  const [keys, setKeys] = useState(() => leesStand()?.keys || ALLE_KEYS)
  const [actief, setActief] = useState(() => leesStand()?.actief || null)
  const [weergaven, setWeergaven] = useState([])
  // Welk klapmenu boven de tabel open staat: 'tekst', 'menu', 'kiezer' of 'vragen'. Eén tegelijk.
  const [klap, setKlap] = useState(null)
  const tekstOpen = klap === 'tekst', menuOpen = klap === 'menu', kiezerOpen = klap === 'kiezer', vragenOpen = klap === 'vragen'
  const wissel = (w) => setKlap(o => (o === w ? null : w))
  const [naam, setNaam] = useState('')
  const [melding, setMelding] = useState(null)
  const [sleepKey, setSleepKey] = useState(null)
  const [geslacht, setGeslacht] = useState(leesGeslacht)
  const geslachtVan = (k) => (GESLACHT[geslacht[k]] ? geslacht[k] : 'beide')
  // Rijen die even weg zijn. Bewust niet bewaard: dit is voor een snelle check en raakt je
  // weergave niet. Verversen zet alles terug.
  const [verborgen, setVerborgen] = useState(() => new Set())
  const [verborgenOpen, setVerborgenOpen] = useState(false)
  const [statsUit, setStatsUit] = useState(() => new Set())
  const [uitklap, setUitklap] = useState(leesUitklap)
  const wisselUitklap = (k) => {
    const nieuw = { ...uitklap, [k]: !uitklap[k] }
    setUitklap(nieuw)
    try { localStorage.setItem(UITKLAP_KEY, JSON.stringify(nieuw)) } catch { /* privémodus */ }
  }
  const wisselGeslacht = (k) => {
    const nieuw = { ...geslacht, [k]: GESLACHT[geslachtVan(k)].volgende }
    setGeslacht(nieuw)
    try { localStorage.setItem(GESLACHT_KEY, JSON.stringify(nieuw)) } catch { /* privémodus */ }
  }
  const romp = useRef(null)
  const keysNu = useRef(keys)
  const gestart = useRef(new Set())
  const weg = useRef(false)
  const schuif = useRef(null)
  const sleep = useRef(null)

  useEffect(() => {
    weg.current = false
    return () => { weg.current = true }
  }, [])

  useEffect(() => { keysNu.current = keys }, [keys])

  useEffect(() => {
    let dicht = false
    supabase.from('business_os_keten_weergaven').select('id, naam, keys').order('naam').then((res) => {
      if (!dicht && res.data) setWeergaven(res.data)
    }, () => {})
    return () => { dicht = true }
  }, [])

  // Lokaal onthouden; hoort de stand bij een bewaarde weergave, dan die ook bijwerken.
  const legVast = async (nieuw, id = actief) => {
    bewaarStand(id, nieuw)
    if (!id) return
    setWeergaven(l => l.map(w => (w.id === id ? { ...w, keys: nieuw } : w)))
    const { error } = await supabase.from('business_os_keten_weergaven').update({ keys: nieuw, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) setMelding(`Opslaan mislukt: ${error.message}`)
  }
  const kiesWeergave = (id) => {
    const w = weergaven.find(x => x.id === id)
    const nieuw = w ? w.keys.filter(k => RIJ_VAN[k] || k === PER10_UIT) : ALLE_KEYS
    setActief(w ? w.id : null)
    setKeys(nieuw.length ? nieuw : ALLE_KEYS)
    setMelding(null)
    bewaarStand(w ? w.id : null, nieuw)
  }
  const wisselStat = (k) => {
    // De laatste stat blijft staan: een lege tabel kun je niet meer lezen.
    if (keys.includes(k) && RIJ_VAN[k] && keys.filter(x => RIJ_VAN[x]).length === 1) return
    const nieuw = keys.includes(k) ? keys.filter(x => x !== k) : [...keys, k]
    setKeys(nieuw)
    legVast(nieuw)
  }
  const bewaarAlsNieuw = async () => {
    const schoon = naam.trim()
    if (!schoon) return
    const { data, error } = await supabase.from('business_os_keten_weergaven').insert({ naam: schoon, keys }).select('id, naam, keys').single()
    if (error) {
      setMelding(error.code === '23505' ? 'Die naam bestaat al.' : `Opslaan mislukt: ${error.message}`)
      return
    }
    setWeergaven(l => [...l, data].sort((a, b) => a.naam.localeCompare(b.naam)))
    setActief(data.id)
    setNaam('')
    setMelding(null)
    bewaarStand(data.id, keys)
  }
  const hernoemWeergave = async () => {
    const schoon = naam.trim()
    if (!schoon || !actief) return
    const { error } = await supabase.from('business_os_keten_weergaven').update({ naam: schoon, updated_at: new Date().toISOString() }).eq('id', actief)
    if (error) {
      setMelding(error.code === '23505' ? 'Die naam bestaat al.' : `Hernoemen mislukt: ${error.message}`)
      return
    }
    setWeergaven(l => l.map(w => (w.id === actief ? { ...w, naam: schoon } : w)).sort((a, b) => a.naam.localeCompare(b.naam)))
    setNaam('')
    setMelding(null)
  }
  const verwijderWeergave = async () => {
    const { error } = await supabase.from('business_os_keten_weergaven').delete().eq('id', actief)
    if (error) { setMelding(`Verwijderen mislukt: ${error.message}`); return }
    setWeergaven(l => l.filter(w => w.id !== actief))
    setActief(null)
    bewaarStand(null, keys)
  }

  // Rij slepen. Muis: de hele naam. Telefoon: alleen het greepje, anders kun je daar niet meer scrollen.
  const sleepRij = (e, key) => {
    if (e.pointerType === 'mouse' ? e.button !== 0 : !e.target.closest('[data-greep]')) return
    setSleepKey(key)
    const beweeg = (m) => {
      const el = schuif.current
      if (el) {
        const vak = el.getBoundingClientRect()
        if (m.clientY > vak.bottom - 30) el.scrollTop += 12
        else if (m.clientY < vak.top + 50) el.scrollTop -= 12
      }
      const doel = [...(romp.current?.children || [])].find((tr) => {
        const b = tr.getBoundingClientRect()
        return m.clientY >= b.top && m.clientY <= b.bottom
      })?.dataset.rij
      if (!doel || doel === key) return
      setKeys((o) => {
        const van = o.indexOf(key), naar = o.indexOf(doel)
        if (van < 0 || naar < 0) return o
        const n = [...o]
        n.splice(van, 1)
        n.splice(naar, 0, key)
        return n
      })
    }
    const los = () => {
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', los)
      window.removeEventListener('pointercancel', los)
      setSleepKey(null)
      // Een tik later: de laatste verschuiving moet eerst in beeld staan.
      setTimeout(() => legVast(keysNu.current), 0)
    }
    window.addEventListener('pointermove', beweeg)
    window.addEventListener('pointerup', los)
    window.addEventListener('pointercancel', los)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) throw new Error('Niet ingelogd')
        const svc = new LeadManagementService()
        const nieuw = kolommen.filter(k => !gestart.current.has(k.id))
        nieuw.forEach(k => gestart.current.add(k.id))
        // Twee weken tegelijk, nieuwste eerst: spaart de database en je ziet meteen iets.
        for (let i = 0; i < nieuw.length && !weg.current; i += 2) {
          await Promise.all(nieuw.slice(i, i + 2).map(async (k) => {
            const week = await haalWeek(svc, user.id, k.van)
            if (!weg.current) setPerWeek(o => ({ ...o, [k.id]: week }))
          }))
        }
      } catch (e) {
        if (!weg.current) setFout(e.message || 'Laden mislukt')
      }
    })()
  }, [kolommen])

  const alles = kolommen.every(k => perWeek[k.id])
  const volle = kolommen.filter(k => !k.loopt && perWeek[k.id]).map(k => ({ ...k, waarden: perWeek[k.id].waarden }))
  // Vaste basis, anders verschieten de kleuren elke keer als je verder terug schuift.
  const basis = volle.slice(0, WEKEN - 1)
  // De zin volgt wat er in beeld staat: de gekozen stats en het gekozen geslacht.
  const sleutelVan = (rij) => {
    const g = GESLACHT_RIJEN[rij.key] ? geslachtVan(rij.key) : 'beide'
    return g === 'beide' ? rij.key : GESLACHT_RIJEN[rij.key][g]
  }
  const zin = kolommen.slice(0, 8).every(k => perWeek[k.id]) ? conclusie(volle, keys.filter(k => !verborgen.has(k)), sleutelVan) : null

  const meerWeken = () => setAantal(a => Math.min(MAX_WEKEN, a + STAP))
  const bijEinde = () => {
    const el = schuif.current
    if (el && alles && el.scrollLeft + el.clientWidth > el.scrollWidth - 160) meerWeken()
  }
  // Past alles al op het scherm, dan is er niets om te schuiven: vul dan eerst de breedte.
  useEffect(() => {
    const el = schuif.current
    if (el && alles && aantal < MAX_WEKEN && el.scrollWidth <= el.clientWidth + 1) meerWeken()
  }, [alles, aantal])

  // Slepen met de muis. Op een telefoon of trackpad schuift het vanzelf.
  const sleepStart = (e) => {
    const el = schuif.current
    if (!el || e.button !== 0) return
    sleep.current = { x: e.clientX, links: el.scrollLeft, bewogen: false }
    const beweeg = (m) => {
      const d = m.clientX - sleep.current.x
      if (Math.abs(d) > 4) sleep.current.bewogen = true
      if (sleep.current.bewogen) el.scrollLeft = sleep.current.links - d
    }
    const los = () => {
      window.removeEventListener('mousemove', beweeg)
      window.removeEventListener('mouseup', los)
    }
    window.addEventListener('mousemove', beweeg)
    window.addEventListener('mouseup', los)
  }
  // Na slepen geen klik op het getal waar je toevallig losliet.
  const naSlepen = (e) => {
    if (sleep.current?.bewogen) { e.stopPropagation(); e.preventDefault() }
    sleep.current = null
  }

  const kleurVan = (r, v, gem, loopt) => {
    if (loopt || r.neutraal || v == null || !(gem > 0)) return '#fff'
    const d = (v - gem) / gem
    const slechter = Math.max(0, r.omgekeerd ? d : -d)
    return `hsl(${Math.round(GROEN_TINT * (1 - Math.min(1, slechter / ROOD_BIJ)))}, 80%, 52%)`
  }

  const per10Label = `${{ beide: 'Leads', mannen: 'Mannen', vrouwen: 'Vrouwen' }[geslachtVan('magnetLeads')]} per 10 posts`
  // De groepen onder een uitgeklapte rij, de grootste eerst. Alleen wat er ook gepost is.
  const subRijen = (rij) => {
    if (rij === 'chal') {
      return CHALLENGE_GROEPEN.flatMap((g) => {
        const klap = `chal:${g.id}`
        return [
          { key: `${klap}:posts`, label: g.label, kop: true, klap, leeg: true },
          ...(uitklap[klap] ? g.rijen.map(c => ({
            ...c, key: `${klap}:${c.id}`, titel: `${g.label}: ${c.label.toLowerCase()}`, sub: true,
            ...(c.geslacht ? { basis: `${klap}:${c.id}` } : null),
          })) : []),
        ]
      })
    }
    const u = UITKLAP[rij]
    const posts = {}
    for (const k of volle) {
      for (const [sleutel, v] of Object.entries(k.waarden)) {
        const m = sleutel.match(new RegExp(`^${rij}:(.+):posts$`))
        if (m) posts[m[1]] = (posts[m[1]] || 0) + v
      }
    }
    const metPost = (g) => (p) => u.groep(p) === g
    // Elke groep start dicht: alleen de naam met het aantal posts. Klik = de stats eronder.
    const groepRijen = (g) => {
      const klap = `${rij}:${g}`
      return [
        { key: `${rij}:${g}:posts`, label: u.naam(g), kop: true, klap, lijst: { sorteer: 'tijd', filter: metPost(g) } },
        ...(uitklap[klap] ? [
          { key: `${rij}:${g}:views`, label: 'Views', titel: `${u.naam(g)}: views`, sub: true, lijst: { sorteer: 'views', filter: metPost(g) } },
          { key: `${rij}:${g}:comments`, label: 'Comments', titel: `${u.naam(g)}: comments`, sub: true, lijst: { sorteer: 'comments', filter: metPost(g) } },
          ...(u.leads ? [{ key: `${rij}:${g}:leads`, label: 'Nieuwe leads', titel: `${u.naam(g)}: nieuwe leads`, sub: true, geslacht: 'magnetLeads', basis: `${rij}:${g}:leads` }] : []),
          ...(u.leads && !keys.includes(PER10_UIT) ? [{ key: `${rij}:${g}:per10`, label: per10Label, titel: `${u.naam(g)}: ${per10Label.toLowerCase()}`, sub: true, geslacht: 'magnetLeads', basis: `${rij}:${g}:per10`, decimaal: true, postsKey: `${rij}:${g}:posts` }] : []),
        ] : []),
      ]
    }
    const groepen = Object.keys(posts).sort((a, b) => posts[b] - posts[a])
    // Niet gepost in de laatste 8 volle weken: samen op één dichte regel.
    const recent = volle.slice(0, 8)
    const isRecent = (g) => recent.some(k => k.waarden[`${rij}:${g}:posts`] > 0)
    const stil = groepen.filter(g => !isRecent(g))
    const stilKlap = `${rij}:__stil`
    // Totaal van alle woorden. Een oogje hier zet die stat bij elke magnet tegelijk uit.
    const isMagnet = (p) => p.soort === 'magnet' && !!p.woord
    const totaalKlap = 'magnetsTotaal'
    const totaalRijen = u.leads ? [
      { key: 'magnetsTotaal:posts', label: 'Totaal', titel: 'Alle magnets', kop: true, klap: totaalKlap, lijst: { sorteer: 'tijd', filter: isMagnet } },
      ...(uitklap[totaalKlap] ? [
        { key: 'magnetsTotaal:views', label: 'Views', titel: 'Alle magnets: views', sub: true, overal: 'views', lijst: { sorteer: 'views', filter: isMagnet } },
        { key: 'magnetsTotaal:comments', label: 'Comments', titel: 'Alle magnets: comments', sub: true, overal: 'comments', lijst: { sorteer: 'comments', filter: isMagnet } },
        { key: 'magnetsTotaal:leads', label: 'Nieuwe leads', titel: 'Alle magnets: nieuwe leads', sub: true, overal: 'leads', geslacht: 'magnetLeads', basis: 'magnetsTotaal:leads' },
        ...(!keys.includes(PER10_UIT) ? [{ key: 'magnetsTotaal:per10', label: per10Label, titel: `Alle magnets: ${per10Label.toLowerCase()}`, sub: true, overal: 'per10', geslacht: 'magnetLeads', basis: 'magnetsTotaal:per10', decimaal: true, postsKey: 'magnetsTotaal:posts' }] : []),
      ] : []),
    ] : []
    return [
      ...totaalRijen,
      ...groepen.filter(isRecent).flatMap(groepRijen),
      ...(stil.length ? [{ key: stilKlap, label: `Niet gepost, laatste 8 weken (${stil.length})`, kop: true, klap: stilKlap, leeg: true }] : []),
      ...(stil.length && uitklap[stilKlap] ? stil.flatMap(groepRijen) : []),
    ]
  }
  const weergaveRijen = keys.filter(k => RIJ_VAN[k]).flatMap((k) => {
    const rij = RIJ_VAN[k]
    return UITKLAP[k] && uitklap[k] ? [rij, ...subRijen(k)] : [rij]
  })

  // De stats onder een groep gaan mee weg als de groep zelf verborgen is.
  const kopVan = (r) => r.key.replace(/:[^:]+$/, ':posts')
  // Uit via Totaal: weg onder elk woord. De rij in Totaal zelf blijft staan om hem terug te zetten.
  const uitOveral = (r) => r.sub && !r.overal && r.key.startsWith('magnets:') && statsUit.has(r.key.split(':').pop())
  const zichtbareRijen = weergaveRijen.filter(r => !verborgen.has(r.key) && !(r.sub && verborgen.has(kopVan(r))) && !uitOveral(r))
  const verborgenRijen = weergaveRijen.filter(r => verborgen.has(r.key))
  const wisselZicht = (e, r) => {
    if (r.overal) {
      setStatsUit((o) => {
        const n = new Set(o)
        if (n.has(r.overal)) n.delete(r.overal); else n.add(r.overal)
        return n
      })
      return
    }
    // Shift-klik: alleen deze rij blijft staan (met zijn eigen stats eronder).
    if (e.shiftKey) {
      setVerborgen(new Set(weergaveRijen.filter(x => x.key !== r.key && !(x.sub && kopVan(x) === r.key)).map(x => x.key)))
      return
    }
    setVerborgen((o) => {
      const n = new Set(o)
      if (n.has(r.key)) n.delete(r.key); else n.add(r.key)
      return n
    })
  }
  const oog = { display: 'flex', flexShrink: 0, marginLeft: 'auto', padding: '2px 0 2px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }

  // Piek-stip: alleen ophalen voor geladen weken met genoeg leads, en alleen als de rij in beeld staat.
  const [pieken, setPieken] = useState({})
  const [piekOpen, setPiekOpen] = useState(null)
  const piekGestart = useRef(new Set())
  const piekVak = useRef(null)
  const nieuwInBeeld = zichtbareRijen.some(r => r.key === 'nieuw')
  useEffect(() => {
    if (!nieuwInBeeld) return
    const open = kolommen.filter(k => !piekGestart.current.has(k.id) && perWeek[k.id]?.waarden.nieuw >= PIEK_MIN)
    open.forEach(k => piekGestart.current.add(k.id))
    ;(async () => {
      for (const k of open) {
        if (weg.current) return
        const piek = await haalPiek(k.van).catch(() => null)
        if (piek && !weg.current) setPieken(o => ({ ...o, [k.id]: piek }))
      }
    })()
  }, [kolommen, perWeek, nieuwInBeeld])
  useEffect(() => {
    if (!piekOpen) return undefined
    const buiten = (e) => { if (!e.target.closest?.('[data-piek]')) setPiekOpen(null) }
    const sluit = () => setPiekOpen(null)
    window.addEventListener('pointerdown', buiten)
    window.addEventListener('resize', sluit)
    return () => {
      window.removeEventListener('pointerdown', buiten)
      window.removeEventListener('resize', sluit)
    }
  }, [piekOpen])
  const wisselPiek = (e, id) => {
    const vak = piekVak.current?.getBoundingClientRect()
    if (!vak) return
    if (piekOpen?.id === id) { setPiekOpen(null); return }
    const stip = e.currentTarget.getBoundingClientRect()
    const breed = Math.min(300, vak.width - 8)
    const links = Math.max(4, Math.min(stip.left - vak.left - breed / 2, vak.width - breed - 4))
    // Onderaan het vak gaat de regel boven de stip staan.
    const plek = stip.bottom - vak.top + 60 > vak.height ? { bottom: vak.bottom - stip.top + 4 } : { top: stip.bottom - vak.top + 4 }
    setPiekOpen({ id, breed, links, plek })
  }

  const NAAM_B = isMobile ? 118 : 170
  const LIJN = '1.5px solid #fff'
  const knop = (aan) => ({
    display: 'flex', alignItems: 'center', gap: 5, minHeight: 30, padding: '0 7px', cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
    background: aan ? 'rgba(255,255,255,0.14)' : 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
  })
  const paneel = { position: 'absolute', top: 'calc(100% + 4px)', zIndex: 6, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, boxShadow: '0 14px 40px rgba(0,0,0,0.7)' }
  const kolLijn = (i) => (i % 2 === 0 ? { borderLeft: LIJN, borderRight: LIJN } : {})
  const kop = { position: 'sticky', top: 0, zIndex: 2, background: '#000', padding: '6px 8px 6px 10px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 68 }
  const cel = {
    padding: '4px 8px 4px 10px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  }
  const plak = { position: 'sticky', left: 0, zIndex: 1, background: '#000' }

  if (fout) return <div style={{ padding: 16, fontSize: 13, fontWeight: 700, color: '#fff' }}>Kon de keten niet laden: {fout}</div>

  return (
    <>
      <style>{`
        .gk-klik:hover { background: rgba(255,255,255,0.12) !important }
        .gk-keten::-webkit-scrollbar { height: 8px; width: 0 }
        .gk-keten::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.45); border-radius: 4px }
        .gk-keten::-webkit-scrollbar-track { background: rgba(255,255,255,0.08); border-radius: 4px }
      `}</style>
      {detail && <Detail key={`${detail.rij.key}|${detail.kolom.id}`} open={detail} onSluit={() => setDetail(null)} isMobile={isMobile} />}
      <div ref={piekVak} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start' }}>
      {piekOpen && pieken[piekOpen.id] && (
        <div data-piek role="status" style={{ ...paneel, top: undefined, ...piekOpen.plek, left: piekOpen.links, width: 'max-content', maxWidth: piekOpen.breed, padding: '6px 10px', fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
          {piekRegel(pieken[piekOpen.id], geslachtVan('nieuw'))}
        </div>
      )}
      <div style={{ width: 'fit-content', maxWidth: '100%', maxHeight: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Eén regel: de conclusie kort, daarnaast de knoppen. Breedte 0 + minWidth: de regel volgt de tabel. */}
        <div style={{ position: 'relative', width: 0, minWidth: '100%', boxSizing: 'border-box', flexShrink: 0, display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'center', gap: 4, paddingBottom: 8 }}>
          {zin && (
            <div style={{ position: isMobile ? 'static' : 'relative', minWidth: 0, flex: '0 1 auto' }}>
              <button type="button" aria-expanded={tekstOpen} onClick={() => wissel('tekst')} style={{ ...knop(tekstOpen), maxWidth: '100%', paddingLeft: 0, flexShrink: 1 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {zin.tekst || <>{zin.grootste.r.omgekeerd ? 'Grootste stijging' : 'Grootste daling'}: {zin.grootste.r.label.toLowerCase()} <span style={{ color: ROOD }}>{verschilTekst(zin.grootste)}</span></>}
                </span>
                <ChevronDown size={14} strokeWidth={2.8} style={{ flexShrink: 0, transform: tekstOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {tekstOpen && !zin.tekst && (
                <div style={{ ...paneel, left: 0, width: 'min(360px, 100%)', minWidth: isMobile ? 0 : 320, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', paddingBottom: 6 }}>Laatste 3 weken tegen de 4 ervoor</div>
                  {zin.daling?.map(d => (
                    <div key={d.r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                      <span>{d.r.label}</span><span style={{ color: ROOD, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{verschilTekst(d)}</span>
                    </div>
                  ))}
                  {zin.close && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                      <span>Gevoerd → sale</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(zin.close.oud)}% → {Math.round(zin.close.nieuw)}%</span>
                    </div>
                  )}
                  {zin.extra > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.14)', fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                      Evenveel gevoerde calls als eerder: ongeveer <span style={{ color: GROEN }}>€{zin.extra.toLocaleString('nl-NL')} per week</span> meer
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div style={{ position: isMobile ? 'static' : 'relative', flexShrink: 0 }}>
            <button type="button" aria-expanded={menuOpen} onClick={() => wissel('menu')} style={{ ...knop(menuOpen), maxWidth: 200 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{weergaven.find(w => w.id === actief)?.naam || 'Alle stats'}</span>
              <ChevronDown size={14} strokeWidth={2.8} style={{ flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {menuOpen && (
              <div style={{ ...paneel, left: 0, minWidth: 180, maxHeight: 260, overflowY: 'auto', padding: 4 }}>
                {[{ id: null, naam: 'Alle stats' }, ...weergaven].map(w => (
                  <button key={w.id || 'alles'} type="button" onClick={() => { kiesWeergave(w.id); wissel(null) }} style={{
                    display: 'block', width: '100%', minHeight: 34, padding: '0 10px', background: (actief || null) === w.id ? 'rgba(255,255,255,0.14)' : 'transparent', border: 'none', borderRadius: 7,
                    color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>{w.naam}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: isMobile ? 'static' : 'relative', flexShrink: 0 }}>
            <button type="button" aria-expanded={kiezerOpen} onClick={() => wissel('kiezer')} style={knop(kiezerOpen)}>
              <Filter size={14} strokeWidth={2.6} /> Stats kiezen
            </button>
            {kiezerOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 6, width: isMobile ? '100%' : 420, maxHeight: 340, overflowY: 'auto', padding: 12,
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2px 12px' }}>
                  {RIJEN.map(r => {
                    const aan = keys.includes(r.key)
                    return (
                      <button key={r.key} type="button" onClick={() => wisselStat(r.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, minHeight: 32, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
                        color: aan ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, textAlign: 'left',
                      }}>
                        <span style={{
                          width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4,
                          background: aan ? '#fff' : 'transparent', border: `1.5px solid ${aan ? '#fff' : 'rgba(255,255,255,0.4)'}`,
                        }}>{aan && <Check size={12} strokeWidth={3.5} color="#0a0a0a" />}</span>
                        {r.label}
                      </button>
                    )
                  })}
                  {(() => {
                    const aan = !keys.includes(PER10_UIT)
                    return (
                      <button type="button" onClick={() => wisselStat(PER10_UIT)} style={{
                        display: 'flex', alignItems: 'center', gap: 8, minHeight: 32, padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
                        color: aan ? '#fff' : 'rgba(255,255,255,0.55)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, textAlign: 'left',
                      }}>
                        <span style={{
                          width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4,
                          background: aan ? '#fff' : 'transparent', border: `1.5px solid ${aan ? '#fff' : 'rgba(255,255,255,0.4)'}`,
                        }}>{aan && <Check size={12} strokeWidth={3.5} color="#0a0a0a" />}</span>
                        {per10Label}
                      </button>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                  <input value={naam} onChange={(e) => setNaam(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') bewaarAlsNieuw() }}
                    maxLength={60} placeholder={actief ? 'Nieuwe naam' : 'Naam van deze weergave'} style={{
                      flex: 1, minWidth: 0, height: 34, padding: '0 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9,
                      color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, outline: 'none',
                    }} />
                  <button type="button" onClick={bewaarAlsNieuw} disabled={!naam.trim()} style={{
                    height: 34, padding: '0 12px', background: '#fff', border: '1px solid #fff', borderRadius: 9, color: '#0a0a0a', cursor: naam.trim() ? 'pointer' : 'default',
                    opacity: naam.trim() ? 1 : 0.5, fontFamily: 'inherit', fontSize: 13, fontWeight: 900, flexShrink: 0,
                  }}>{actief ? 'Als nieuwe' : 'Opslaan'}</button>
                  {actief && (
                    <button type="button" onClick={hernoemWeergave} disabled={!naam.trim()} style={{
                      height: 34, padding: '0 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9, color: '#fff', cursor: naam.trim() ? 'pointer' : 'default',
                      opacity: naam.trim() ? 1 : 0.5, fontFamily: 'inherit', fontSize: 13, fontWeight: 800, flexShrink: 0,
                    }}>Hernoem</button>
                  )}
                  {actief && (
                    <button type="button" onClick={verwijderWeergave} aria-label="Deze weergave verwijderen" title="Deze weergave verwijderen" style={{
                      width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9, color: '#fff',
                    }}><Trash2 size={14} /></button>
                  )}
                </div>
                {melding && <div style={{ paddingTop: 8, fontSize: 12, fontWeight: 700, color: ROOD }}>{melding}</div>}
                {actief && !melding && <div style={{ paddingTop: 8, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Aanvinken en slepen wordt in deze weergave vanzelf bewaard.</div>}
              </div>
            )}
          </div>
          {onVraag && (
            <div style={{ position: isMobile ? 'static' : 'relative', flexShrink: 0 }}>
              <button type="button" aria-expanded={vragenOpen} onClick={() => wissel('vragen')} style={knop(vragenOpen)}>
                <Sparkles size={14} strokeWidth={2.6} /> Waar zit het lek?
                <ChevronDown size={14} strokeWidth={2.8} style={{ flexShrink: 0, transform: vragenOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {vragenOpen && (
                <div style={{ ...paneel, left: 0, width: isMobile ? '100%' : 320, maxHeight: 340, overflowY: 'auto', padding: 4 }}>
                  {VRAGEN.map(v => (
                    <button key={v.label} type="button" onClick={() => { wissel(null); onVraag(`${v.vraag} ${VRAAG_REGEL}`) }} style={{
                      display: 'block', width: '100%', minHeight: 36, padding: '6px 10px', background: 'transparent', border: 'none', borderRadius: 7,
                      color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, textAlign: 'left', lineHeight: 1.3, cursor: 'pointer',
                    }}>{v.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          ref={schuif}
          className="gk-keten"
          onScroll={() => { setPiekOpen(null); bijEinde() }}
          onMouseDown={sleepStart}
          onClickCapture={naSlepen}
          style={{ flex: '0 1 auto', minHeight: 0, overflow: 'auto', cursor: 'grab', userSelect: 'none' }}
        >
          {/* Zo smal als de cijfers toelaten: over de volle breedte lees je een rij niet meer door. */}
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content' }}>
            <thead>
              <tr>
                <th style={{ ...plak, top: 0, zIndex: 3, width: NAAM_B, minWidth: NAAM_B }} />
                {kolommen.map((k, ki) => (
                  <th key={k.id} style={{ ...kop, ...kolLijn(ki) }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{k.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{k.loopt ? 'loopt nog' : k.subKort}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={romp}>
              {zichtbareRijen.map((r, ri) => {
                const sleept = sleepKey === r.key
                const isSub = r.kop || r.sub
                // Om de rij een dikke witte lijn boven en onder: zo volg je een rij zonder te verspringen.
                const lijn = ri % 2 === 0 ? { borderTop: LIJN, borderBottom: LIJN } : {}
                const geslachtSleutel = r.geslacht || (GESLACHT_RIJEN[r.key] ? r.key : null)
                const rijGeslacht = geslachtSleutel ? geslachtVan(geslachtSleutel) : null
                const G = rijGeslacht && GESLACHT[rijGeslacht]
                const waardeKey = !rijGeslacht || rijGeslacht === 'beide' ? r.key
                  : r.geslacht ? `${r.basis}${rijGeslacht === 'mannen' ? 'Mannen' : 'Vrouwen'}`
                    : GESLACHT_RIJEN[r.key][rijGeslacht]
                const gem = gemiddelde({ ...r, key: waardeKey }, r.postsKey ? basis.filter(w => w.waarden[r.postsKey] >= PER10_MIN_POSTS) : basis)
                const Icon = r.Icon
                return (
                  <tr key={r.key} data-rij={isSub ? undefined : r.key} style={sleept ? { background: 'rgba(255,255,255,0.14)' } : undefined}>
                    <td
                      onPointerDown={isSub ? undefined : (e) => sleepRij(e, r.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ ...cel, ...lijn, ...plak, background: sleept ? '#2a2a2a' : '#000', padding: '4px 8px 4px 0', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.85)', cursor: sleept ? 'grabbing' : 'grab' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: r.kop ? (isMobile ? 8 : 20) : r.sub ? (isMobile ? 16 : 34) : 0, ...(isMobile ? { fontSize: 12, whiteSpace: 'normal' } : null), ...(r.kop ? { color: '#fff', fontWeight: 900 } : r.sub ? { color: 'rgba(255,255,255,0.7)', fontWeight: 600 } : {}) }}>
                        {!isSub && !isMobile && <span data-greep aria-hidden style={{ display: 'flex', touchAction: 'none', padding: isMobile ? '4px 4px 4px 0' : 0, color: 'rgba(255,255,255,0.45)' }}><GripVertical size={14} strokeWidth={2.4} /></span>}
                        {Icon && <Icon size={15} strokeWidth={2.4} color={r.kleur} style={{ flexShrink: 0 }} />}
                        {UITKLAP[r.key] || r.klap ? (
                          <button type="button" aria-expanded={!!uitklap[r.klap || r.key]} onPointerDown={(e) => e.stopPropagation()} onClick={() => wisselUitklap(r.klap || r.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                            {r.label}
                            <ChevronRight size={14} strokeWidth={2.8} color="#fff" style={{ flexShrink: 0, transform: uitklap[r.klap || r.key] ? 'rotate(90deg)' : 'none' }} />
                          </button>
                        ) : null}
                        {UITKLAP[r.key] || r.klap ? null : G ? (
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => wisselGeslacht(geslachtSleutel)}
                            title={`${G.naam}. Klik om te wisselen. Bij een deel van de leads is het geslacht niet ingevuld, dus mannen plus vrouwen is minder dan beide.`}
                            aria-label={`${r.label}: ${G.naam}. Klik om te wisselen.`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                          >
                            {r.label}
                            <G.Icon size={15} strokeWidth={2.8} color={G.kleur} style={{ flexShrink: 0 }} />
                          </button>
                        ) : r.label}
                        {!isMobile && <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => wisselZicht(e, r)} aria-label={`${r.titel || r.label} even verbergen`} title={r.overal ? (statsUit.has(r.overal) ? "Weer tonen bij elke magnet" : "Bij elke magnet verbergen") : "Even verbergen. Shift-klik: alleen deze laten staan."} style={oog}>
                          {r.overal && statsUit.has(r.overal) ? <EyeOff size={14} strokeWidth={2.4} color="#fff" /> : <Eye size={14} strokeWidth={2.4} />}
                        </button>}
                      </span>
                    </td>
                    {kolommen.map((k, ki) => {
                      if (r.leeg) return <td key={k.id} style={{ ...cel, ...lijn, ...kolLijn(ki) }} />
                      const week = perWeek[k.id]
                      const v = week ? week.waarden[waardeKey] : undefined
                      const klikbaar = !!week && (r.lijst || r.stage)
                      const actief = detail?.rij.key === r.key && detail?.kolom.id === k.id
                      const geenKleur = k.loopt || (r.postsKey && !(week?.waarden[r.postsKey] >= PER10_MIN_POSTS))
                      const piek = r.key === 'nieuw' && week ? pieken[k.id] : null
                      const piekTekst = piek ? piekRegel(piek, rijGeslacht) : null
                      return (
                        <td key={k.id} style={{ ...cel, ...lijn, ...kolLijn(ki), color: week ? kleurVan(r, v, gem, geenKleur) : 'rgba(255,255,255,0.3)' }}>
                          {piek && (
                            <button
                              type="button"
                              data-piek
                              aria-label={piekTekst}
                              aria-expanded={piekOpen?.id === k.id}
                              title={isMobile ? undefined : piekTekst}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => wisselPiek(e, k.id)}
                              style={{ display: 'inline-flex', verticalAlign: 'middle', background: 'none', border: 'none', cursor: 'pointer', padding: isMobile ? 10 : 5, margin: isMobile ? '-10px -6px -10px -10px' : '-5px -1px -5px -5px' }}
                            >
                              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: PIEK_KLEUR }} />
                            </button>
                          )}
                          {klikbaar ? (
                            <button type="button" className="gk-klik" onClick={() => setDetail(actief ? null : { rij: r, kolom: k, week })} style={{
                              background: actief ? 'rgba(255,255,255,0.16)' : 'transparent', border: 'none', borderRadius: 5, padding: '0 4px', margin: '0 -4px',
                              color: 'inherit', font: 'inherit', cursor: 'pointer',
                            }}>{toon(r, v)}</button>
                          ) : week ? toon(r, v) : '…'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {verborgenRijen.length > 0 && (
                <tr>
                  <td style={{ ...cel, ...plak, padding: '8px 8px 4px 0', textAlign: 'left' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                      <button type="button" aria-expanded={verborgenOpen} onClick={() => setVerborgenOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                        Verborgen ({verborgenRijen.length})
                        <ChevronRight size={14} strokeWidth={2.8} style={{ transform: verborgenOpen ? 'rotate(90deg)' : 'none' }} />
                      </button>
                      <button type="button" onClick={() => { setVerborgen(new Set()); setVerborgenOpen(false) }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: GROEN, font: 'inherit' }}>Alles tonen</button>
                    </span>
                  </td>
                  <td colSpan={kolommen.length} />
                </tr>
              )}
              {verborgenOpen && verborgenRijen.map(r => (
                <tr key={`v-${r.key}`}>
                  <td style={{ ...cel, ...plak, padding: '4px 8px 4px 0', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {r.titel || r.label}
                      <button type="button" onClick={(e) => wisselZicht(e, r)} aria-label={`${r.titel || r.label} weer tonen`} title="Weer tonen" style={{ ...oog, color: '#fff' }}>
                        <EyeOff size={14} strokeWidth={2.4} />
                      </button>
                    </span>
                  </td>
                  <td colSpan={kolommen.length} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  )
}
