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
  Phone, Trophy, Euro, Wallet, UserX, PhoneOff, XCircle, Percent, X, ChevronDown, Filter, GripVertical, Check, Trash2, Mars, Venus, VenusAndMars, Megaphone,
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
  { key: 'challenge', label: 'Challenge campagne', Icon: Megaphone, kleur: '#a855f7' },
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

// Klik op de naam van Nieuwe leads wisselt beide → mannen → vrouwen. De keuze onthoudt dit apparaat.
const GESLACHT = {
  beide: { naam: 'Beide', Icon: VenusAndMars, kleur: '#fff', key: 'nieuw', volgende: 'mannen' },
  mannen: { naam: 'Mannen', Icon: Mars, kleur: '#3b82f6', key: 'nieuwMannen', volgende: 'vrouwen' },
  vrouwen: { naam: 'Vrouwen', Icon: Venus, kleur: '#ec4899', key: 'nieuwVrouwen', volgende: 'beide' },
}
const GESLACHT_KEY = 'myarc.keten.geslacht'
const leesGeslacht = () => {
  try { const g = localStorage.getItem(GESLACHT_KEY); return GESLACHT[g] ? g : 'beide' } catch { return 'beide' }
}

const ALLE_KEYS = RIJEN.map(r => r.key)
const RIJ_VAN = Object.fromEntries(RIJEN.map(r => [r.key, r]))
const STAND = 'myarc.keten.stand'
const leesStand = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STAND))
    const keys = Array.isArray(s?.keys) ? s.keys.filter(k => RIJ_VAN[k]) : []
    return keys.length ? { actief: s.actief || null, keys } : null
  } catch { return null }
}
const bewaarStand = (actief, keys) => {
  try { localStorage.setItem(STAND, JSON.stringify({ actief, keys })) } catch { /* privémodus */ }
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
async function telChallenge(s, e) {
  const ids = await haalChallengeIds()
  if (!ids) return null
  if (!ids.length) return 0
  const res = await supabase.from('lead_campaign_tags').select('id', { count: 'exact', head: true })
    .in('campaign_id', ids).gte('tagged_at', s).lt('tagged_at', e).then(r => r, () => ({ error: true }))
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
  const [act, fun, rx, cash, media, mannen, vrouwen, challenge] = await Promise.all([
    svc.getRangeActivity(coachId, s, e),
    svc.getRangeFunnelStats(coachId, s, e),
    svc.getRangeReactionStats(coachId, s, e),
    svc.getRangeCashCollected(coachId, s, e),
    supabase.from('content_ig_media').select('id, tijd, soort, woord, views, comments, tekst').gte('dag', isoLokaal(van)).lt('dag', isoLokaal(tot)).limit(1000).then(r => r, () => ({ data: null })),
    telLeads('male'),
    telLeads('female'),
    telChallenge(s, e),
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
  waarden.challenge = challenge
  waarden.nieuwMannen = mannen
  waarden.nieuwVrouwen = vrouwen
  const week = { waarden, posts: m || [], fun }
  if (tot <= new Date()) cache.set(sleutel, week)
  return week
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
          {rij.label} · {kolom.label} <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>({aantal})</span>
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

// Laatste 3 volle weken tegen de 4 weken daarvoor.
function conclusie(volle) {
  if (volle.length < 5) return null
  const nu = volle.slice(0, 3), toen = volle.slice(3, 7)
  const verschil = (r) => {
    const a = gemiddelde(r, toen), b = gemiddelde(r, nu)
    return a > 0 && b != null ? { r, oud: a, nieuw: b, pct: Math.round(((b - a) / a) * 100) } : null
  }
  const stappen = RIJEN.filter(r => r.stap).map(verschil).filter(Boolean).sort((x, y) => x.pct - y.pct)
  const grootste = stappen[0]
  if (!grootste || grootste.pct >= 0) return { tekst: 'Geen stap in de keten is gedaald tegenover de 4 weken daarvoor.' }
  const rij = (k) => RIJEN.find(r => r.key === k)
  const close = verschil(rij('close'))
  const calls = verschil(rij('gevoerd'))
  const sales = gemiddelde(rij('sales'), nu), order = gemiddelde(rij('order'), nu)
  // Wat de gemiste calls kosten: tegen de close en orderwaarde van nu.
  const extra = calls && calls.pct < 0 && close && sales > 0
    ? Math.round((calls.oud - calls.nieuw) * (close.nieuw / 100) * (order / sales) / 10) * 10
    : null
  return {
    daling: stappen.filter(s => s.pct <= -15).slice(0, 3),
    close,
    extra,
  }
}

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
  const wisselGeslacht = () => {
    const nieuw = GESLACHT[geslacht].volgende
    setGeslacht(nieuw)
    try { localStorage.setItem(GESLACHT_KEY, nieuw) } catch { /* privémodus */ }
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
    const nieuw = w ? w.keys.filter(k => RIJ_VAN[k]) : ALLE_KEYS
    setActief(w ? w.id : null)
    setKeys(nieuw.length ? nieuw : ALLE_KEYS)
    setMelding(null)
    bewaarStand(w ? w.id : null, nieuw)
  }
  const wisselStat = (k) => {
    // De laatste stat blijft staan: een lege tabel kun je niet meer lezen.
    if (keys.includes(k) && keys.length === 1) return
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
  const zin = kolommen.slice(0, 8).every(k => perWeek[k.id]) ? conclusie(volle) : null

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
    if (loopt || v == null || !(gem > 0)) return '#fff'
    const d = (v - gem) / gem
    const slechter = Math.max(0, r.omgekeerd ? d : -d)
    return `hsl(${Math.round(GROEN_TINT * (1 - Math.min(1, slechter / ROOD_BIJ)))}, 80%, 52%)`
  }

  const NAAM_B = isMobile ? 150 : 170
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ width: 'fit-content', maxWidth: '100%', maxHeight: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Eén regel: de conclusie kort, daarnaast de knoppen. Breedte 0 + minWidth: de regel volgt de tabel. */}
        <div style={{ position: 'relative', width: 0, minWidth: '100%', boxSizing: 'border-box', flexShrink: 0, display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'center', gap: 4, paddingBottom: 8 }}>
          {zin && (
            <div style={{ position: isMobile ? 'static' : 'relative', minWidth: 0, flex: '0 1 auto' }}>
              <button type="button" aria-expanded={tekstOpen} onClick={() => wissel('tekst')} style={{ ...knop(tekstOpen), maxWidth: '100%', paddingLeft: 0, flexShrink: 1 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {zin.tekst || (zin.daling?.length ? <>Grootste daling: {zin.daling[0].r.label.toLowerCase()} <span style={{ color: ROOD }}>{zin.daling[0].pct}%</span></> : 'Geen grote dalingen')}
                </span>
                <ChevronDown size={14} strokeWidth={2.8} style={{ flexShrink: 0, transform: tekstOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {tekstOpen && !zin.tekst && (
                <div style={{ ...paneel, left: 0, width: 'min(360px, 100%)', minWidth: isMobile ? 0 : 320, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', paddingBottom: 6 }}>Laatste 3 weken tegen de 4 ervoor</div>
                  {zin.daling?.map(d => (
                    <div key={d.r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                      <span>{d.r.label}</span><span style={{ color: ROOD, fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</span>
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
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.14)' }}>
                  <input value={naam} onChange={(e) => setNaam(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') bewaarAlsNieuw() }}
                    maxLength={60} placeholder="Naam van deze weergave" style={{
                      flex: 1, minWidth: 0, height: 34, padding: '0 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9,
                      color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, outline: 'none',
                    }} />
                  <button type="button" onClick={bewaarAlsNieuw} disabled={!naam.trim()} style={{
                    height: 34, padding: '0 12px', background: '#fff', border: '1px solid #fff', borderRadius: 9, color: '#0a0a0a', cursor: naam.trim() ? 'pointer' : 'default',
                    opacity: naam.trim() ? 1 : 0.5, fontFamily: 'inherit', fontSize: 13, fontWeight: 900, flexShrink: 0,
                  }}>Opslaan</button>
                  {actief && (
                    <button type="button" onClick={verwijderWeergave} aria-label="Deze weergave verwijderen" title="Deze weergave verwijderen" style={{
                      width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9, color: '#fff',
                    }}><Trash2 size={14} /></button>
                  )}
                </div>
                {melding && <div style={{ paddingTop: 8, fontSize: 12, fontWeight: 700, color: ROOD }}>{melding}</div>}
                {actief && !melding && <div style={{ paddingTop: 8, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Wijzigingen in deze weergave worden vanzelf bewaard.</div>}
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
          onScroll={bijEinde}
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
              {keys.map((key, ri) => {
                const r = RIJ_VAN[key]
                const sleept = sleepKey === key
                // Om de rij een dikke witte lijn boven en onder: zo volg je een rij zonder te verspringen.
                const lijn = ri % 2 === 0 ? { borderTop: LIJN, borderBottom: LIJN } : {}
                const waardeKey = r.key === 'nieuw' ? GESLACHT[geslacht].key : r.key
                const gem = gemiddelde({ ...r, key: waardeKey }, basis)
                const Icon = r.Icon
                return (
                  <tr key={r.key} data-rij={r.key} style={sleept ? { background: 'rgba(255,255,255,0.14)' } : undefined}>
                    <td
                      onPointerDown={(e) => sleepRij(e, r.key)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ ...cel, ...lijn, ...plak, background: sleept ? '#2a2a2a' : '#000', padding: '4px 8px 4px 0', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.85)', cursor: sleept ? 'grabbing' : 'grab' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span data-greep aria-hidden style={{ display: 'flex', touchAction: 'none', padding: isMobile ? '4px 4px 4px 0' : 0, color: 'rgba(255,255,255,0.45)' }}><GripVertical size={14} strokeWidth={2.4} /></span>
                        <Icon size={15} strokeWidth={2.4} color={r.kleur} style={{ flexShrink: 0 }} />
                        {r.key === 'nieuw' ? (
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={wisselGeslacht}
                            title={`${GESLACHT[geslacht].naam}. Klik om te wisselen. Bij een deel van de leads is het geslacht niet ingevuld, dus mannen plus vrouwen is minder dan beide.`}
                            aria-label={`Nieuwe leads: ${GESLACHT[geslacht].naam}. Klik om te wisselen.`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                          >
                            {r.label}
                            {(() => { const G = GESLACHT[geslacht]; return <G.Icon size={15} strokeWidth={2.8} color={G.kleur} style={{ flexShrink: 0 }} /> })()}
                          </button>
                        ) : r.label}
                      </span>
                    </td>
                    {kolommen.map((k, ki) => {
                      const week = perWeek[k.id]
                      const v = week ? week.waarden[waardeKey] : undefined
                      const klikbaar = !!week && (r.lijst || r.stage)
                      const actief = detail?.rij.key === r.key && detail?.kolom.id === k.id
                      return (
                        <td key={k.id} style={{ ...cel, ...lijn, ...kolLijn(ki), color: week ? kleurVan(r, v, gem, k.loopt) : 'rgba(255,255,255,0.3)' }}>
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
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  )
}
