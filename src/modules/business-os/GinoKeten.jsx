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
  Phone, Trophy, Euro, Wallet, UserX, PhoneOff, XCircle, Percent, X, ChevronDown, Filter, GripVertical, Check, Trash2,
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

// Volle weken veranderen niet meer; de lopende week halen we elke keer vers op.
const cache = new Map()

async function haalWeek(svc, coachId, van) {
  const sleutel = `${coachId}|${isoLokaal(van)}`
  if (cache.has(sleutel)) return cache.get(sleutel)
  const tot = new Date(van); tot.setDate(tot.getDate() + 7)
  const s = van.toISOString(), e = tot.toISOString()
  const [act, fun, rx, cash, media] = await Promise.all([
    svc.getRangeActivity(coachId, s, e),
    svc.getRangeFunnelStats(coachId, s, e),
    svc.getRangeReactionStats(coachId, s, e),
    svc.getRangeCashCollected(coachId, s, e),
    supabase.from('content_ig_media').select('id, tijd, soort, woord, views, comments, tekst').gte('dag', isoLokaal(van)).lt('dag', isoLokaal(tot)).limit(1000).then(r => r, () => ({ data: null })),
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

export default function GinoKeten({ isMobile }) {
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
  const [kiezerOpen, setKiezerOpen] = useState(false)
  const [naam, setNaam] = useState('')
  const [melding, setMelding] = useState(null)
  const [sleepKey, setSleepKey] = useState(null)
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
  const kolLijn = (i) => (i % 2 === 0 ? { borderLeft: '1.5px solid #fff', borderRight: '1.5px solid #fff' } : {})
  const kop = { position: 'sticky', top: 0, zIndex: 2, background: '#000', padding: '0 8px 6px 10px', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 68 }
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {zin && (
          <div style={{ padding: '0 0 14px', flexShrink: 0, fontSize: isMobile ? 13 : 14, fontWeight: 800, color: '#fff', lineHeight: 1.45 }}>
            {zin.tekst || (
              <>
                Laatste 3 weken tegen de 4 ervoor:{' '}
                {zin.daling?.length
                  ? zin.daling.map((s, i) => <span key={s.r.key}>{i > 0 ? ', ' : ''}{s.r.label.toLowerCase()} <span style={{ color: ROOD }}>{s.pct}%</span></span>)
                  : 'geen grote dalingen'}
                {zin.close && <>. Gevoerd → sale van {Math.round(zin.close.oud)}% naar {Math.round(zin.close.nieuw)}%</>}
                {zin.extra > 0 && <>. Evenveel gevoerde calls als eerder is ongeveer <span style={{ color: GROEN }}>€{zin.extra.toLocaleString('nl-NL')} per week</span> meer</>}.
              </>
            )}
          </div>
        )}
        {/* Weergave kiezen en stats aan of uit */}
        <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <select value={actief || ''} onChange={(e) => kiesWeergave(e.target.value || null)} aria-label="Weergave kiezen" style={{
              appearance: 'none', WebkitAppearance: 'none', height: 34, maxWidth: 220, padding: '0 28px 0 12px', cursor: 'pointer', outline: 'none',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
            }}>
              <option value="" style={{ background: '#0a0a0a' }}>Alle stats</option>
              {weergaven.map(w => <option key={w.id} value={w.id} style={{ background: '#0a0a0a' }}>{w.naam}</option>)}
            </select>
            <ChevronDown size={14} strokeWidth={2.6} color="#fff" aria-hidden style={{ position: 'absolute', right: 9, top: 10, pointerEvents: 'none' }} />
          </div>
          <button type="button" aria-expanded={kiezerOpen} onClick={() => setKiezerOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', cursor: 'pointer', borderRadius: 10,
            background: kiezerOpen ? 'rgba(255,255,255,0.14)' : 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap',
          }}>
            <Filter size={14} strokeWidth={2.6} /> Stats kiezen
          </button>
          {kiezerOpen && (
            <div style={{
              position: 'absolute', top: 40, left: 0, zIndex: 6, width: 'min(420px, 100%)', maxHeight: 340, overflowY: 'auto', padding: 12,
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
        <div
          ref={schuif}
          className="gk-keten"
          onScroll={bijEinde}
          onMouseDown={sleepStart}
          onClickCapture={naSlepen}
          style={{ flex: 1, minHeight: 0, overflow: 'auto', cursor: 'grab', userSelect: 'none' }}
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
                const lijn = ri % 2 === 0 ? { borderTop: '1.5px solid #fff', borderBottom: '1.5px solid #fff' } : {}
                const gem = gemiddelde(r, basis)
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
                        {r.label}
                      </span>
                    </td>
                    {kolommen.map((k, ki) => {
                      const week = perWeek[k.id]
                      const v = week ? week.waarden[r.key] : undefined
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
    </>
  )
}
