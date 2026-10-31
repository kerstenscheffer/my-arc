// src/modules/business-os/GinoKalender.jsx
//
// Agenda boven Gino's bol (31 okt 2026). Twee weergaven:
// - week (standaard): de tijdlijn als HUD in de stijl van de bol (GinoWeek.jsx)
// - maand: opbouw als het content-overzicht in de leadbalk (soorten als rijen,
//   dagen als kolommen, groene gloed naar drukte, per dag een ring).
//
// Eén beeld van alles wat er gepland staat: Google Agenda (agenda_events),
// klantcalls (client_calls), content (content_items.planned_date), taken
// (productivity_tasks) en herinneringen. Klik een dag → wat er die dag staat.
//
// Gino opent hem met de actie
//   { soort: 'kalender', maand: 'YYYY-MM', dag?: 'YYYY-MM-DD',
//     concept?: [{ datum, titel, hook?, type? }] }
// Concepten zijn zijn voorstellen (gestippeld); "Inplannen" zet ze als
// content_items (status planned). Zo plan je samen de content van de maand.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, X, Calendar, Phone, Film, CheckCircle2, Bell, Sparkles, Plus, Check,
  Clapperboard, CircleDot, Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import GinoWeek from './GinoWeek'
import { colors } from '../../ui/tokens'

const G = colors.success
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const WEEKLETTER = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z']

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const nlDag = (ts) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const nlTijd = (ts) => new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
const nlMin = (ts) => { const [h, m] = nlTijd(ts).split(':').map(Number); return h * 60 + m }
const maandagVan = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const plusDagen = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const maandVan = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null
}
const isReel = (t) => !t || t === 'reel' || t === 'video'

// Rijen van het overzicht. `past` kiest de items van die rij.
const RIJEN = [
  { id: 'call', label: 'Calls', icoon: Phone, past: it => it.soort === 'call' },
  { id: 'agenda', label: 'Agenda', icoon: Calendar, past: it => it.soort === 'agenda' },
  { id: 'reel', label: 'Reels', icoon: Clapperboard, content: true, past: it => (it.soort === 'content' || it.soort === 'concept') && isReel(it.type) },
  { id: 'story', label: 'Stories', icoon: CircleDot, content: true, past: it => (it.soort === 'content' || it.soort === 'concept') && it.type === 'story' },
  { id: 'post', label: 'Posts', icoon: ImageIcon, content: true, past: it => (it.soort === 'content' || it.soort === 'concept') && !isReel(it.type) && it.type !== 'story' },
  { id: 'taak', label: 'Taken', icoon: CheckCircle2, past: it => it.soort === 'taak' },
  { id: 'herinnering', label: 'Herinneringen', icoon: Bell, past: it => it.soort === 'herinnering' },
]
const SOORT_ICOON = { call: Phone, agenda: Calendar, content: Film, taak: CheckCircle2, herinnering: Bell, concept: Sparkles }
const SOORT_LABEL = { call: 'Call', agenda: 'Agenda', content: 'Content', taak: 'Taak', herinnering: 'Herinnering', concept: 'Voorstel van Gino' }
const VOLGORDE = ['call', 'agenda', 'content', 'concept', 'taak', 'herinnering']

const leeg = () => ({ data: null })

async function laadPeriode(van, tot) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return []
  const a = iso(van), b = iso(tot)
  const [ag, ca, co, ta, he] = await Promise.all([
    supabase.from('agenda_events').select('id, titel, start_at, end_at, hele_dag, soort, contact_naam')
      .gte('start_at', van.toISOString()).lt('start_at', tot.toISOString()).order('start_at').limit(500).then(r => r, leeg),
    supabase.from('client_calls').select('id, scheduled_date, call_title, clients!inner(first_name, coach_id)')
      .eq('clients.coach_id', user.id).in('status', ['scheduled', 'completed']).is('canceled_at', null)
      .gte('scheduled_date', van.toISOString()).lt('scheduled_date', tot.toISOString()).limit(300).then(r => r, leeg),
    supabase.from('content_items').select('id, title, hook, type, status, planned_date, planned_time')
      .eq('coach_id', user.id).gte('planned_date', a).lt('planned_date', b)
      .or('is_template.is.null,is_template.eq.false').limit(300).then(r => r, leeg),
    supabase.from('productivity_tasks').select('id, title, scheduled_date, deadline')
      .eq('coach_id', user.id).eq('status', 'active')
      .or(`and(scheduled_date.gte.${a},scheduled_date.lt.${b}),and(deadline.gte.${a},deadline.lt.${b})`)
      .limit(300).then(r => r, leeg),
    supabase.from('business_os_herinneringen').select('id, tekst, moment').is('klaar_at', null)
      .gte('moment', van.toISOString()).lt('moment', tot.toISOString()).limit(200).then(r => r, leeg),
  ])
  const items = []
  ;(ag.data || []).forEach(e => items.push({
    id: `a${e.id}`, soort: ['salescall', 'opstartcall', 'klantcall'].includes(e.soort) ? 'call' : 'agenda',
    dag: nlDag(e.start_at), tijd: e.hele_dag ? null : nlTijd(e.start_at),
    startMin: e.hele_dag ? null : nlMin(e.start_at),
    eindMin: e.hele_dag ? null : (e.end_at && nlDag(e.end_at) === nlDag(e.start_at) ? nlMin(e.end_at) : (e.end_at ? 24 * 60 : nlMin(e.start_at) + 30)),
    titel: e.contact_naam ? `Call · ${e.contact_naam}` : (e.titel || 'Afspraak'),
  }))
  ;(ca.data || []).forEach(c => items.push({
    id: `c${c.id}`, soort: 'call', dag: nlDag(c.scheduled_date), tijd: nlTijd(c.scheduled_date),
    startMin: nlMin(c.scheduled_date), eindMin: nlMin(c.scheduled_date) + 30,
    titel: `${c.call_title || 'Call'} · ${c.clients?.first_name || ''}`.trim(),
  }))
  ;(co.data || []).forEach(c => items.push({
    id: `i${c.id}`, soort: 'content', type: c.type, dag: c.planned_date, tijd: c.planned_time || null,
    titel: c.title || c.hook || 'Content', sub: [c.type, c.status === 'created' ? 'gepost' : null].filter(Boolean).join(' · '),
    klaar: c.status === 'created',
  }))
  ;(ta.data || []).forEach(t => items.push({
    id: `t${t.id}`, soort: 'taak', dag: t.scheduled_date || t.deadline, tijd: null,
    titel: t.title, sub: t.deadline && t.deadline !== t.scheduled_date ? 'deadline' : null,
  }))
  ;(he.data || []).forEach(h => items.push({
    id: `h${h.id}`, soort: 'herinnering', dag: nlDag(h.moment), tijd: nlTijd(h.moment), titel: h.tekst,
    startMin: nlMin(h.moment), eindMin: nlMin(h.moment) + 15,
  }))
  return items
}

// Ring onder elke dag: loopt vol naar hoe vol de dag is (zoals de bol).
function DagRing({ deel, vandaag, vertraging }) {
  const r = 9, omtrek = 2 * Math.PI * r
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
      {deel > 0 && (
        <circle cx="12" cy="12" r={r} fill="none" stroke={deel >= 0.75 ? '#fff' : G} strokeWidth="2.5" strokeLinecap="round"
          transform="rotate(-90 12 12)" strokeDasharray={omtrek}
          style={{ '--gk-tot': omtrek * (1 - Math.min(1, deel)), strokeDashoffset: omtrek * (1 - Math.min(1, deel)), animation: `gk-ring .9s ease-out ${vertraging}ms both`, filter: vandaag ? `drop-shadow(0 0 4px ${G})` : 'none' }} />
      )}
    </svg>
  )
}

export default function GinoKalender({ verzoek, onSluit, onVraag, isMobile = false }) {
  const [maand, setMaand] = useState(() => maandVan(verzoek?.maand) || maandVan(verzoek?.dag) || new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [gekozen, setGekozen] = useState(verzoek?.dag || null)
  const [items, setItems] = useState(null)
  const [concept, setConcept] = useState(() => (Array.isArray(verzoek?.concept) ? verzoek.concept : []))
  const [bezig, setBezig] = useState(null)
  const scroller = useRef(null)
  // Week (agenda, standaard) of maand (overzicht per soort).
  const [weergave, setWeergave] = useState(verzoek?.weergave === 'maand' ? 'maand' : 'week')
  const [anker, setAnker] = useState(() => maandagVan(verzoek?.dag ? new Date(`${verzoek.dag}T12:00:00`) : new Date()))
  const weekDagen = useMemo(() => Array.from({ length: 7 }, (_, i) => plusDagen(anker, i)), [anker])
  const [weekH, setWeekH] = useState(380)
  const weekVak = useRef(null)
  useEffect(() => {
    const el = weekVak.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setWeekH(Math.round(e.contentRect.height)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [weergave])

  // Nieuw verzoek van Gino (zelfde component blijft staan): springen.
  useEffect(() => {
    if (!verzoek) return
    const m = maandVan(verzoek.maand) || maandVan(verzoek.dag)
    if (m) setMaand(m)
    if (verzoek.dag) setAnker(maandagVan(new Date(`${verzoek.dag}T12:00:00`)))
    if (verzoek.weergave === 'maand' || verzoek.weergave === 'week') setWeergave(verzoek.weergave)
    // Concepten zie je per dag in de week; een dag openklappen alleen in de maand.
    setGekozen(verzoek.dag && verzoek.weergave === 'maand' ? verzoek.dag : null)
    if (Array.isArray(verzoek.concept)) setConcept(verzoek.concept)
  }, [verzoek])

  const dagen = useMemo(() => {
    const n = new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate()
    return Array.from({ length: n }, (_, i) => new Date(maand.getFullYear(), maand.getMonth(), i + 1))
  }, [maand])

  const laad = useCallback(async () => {
    if (weergave === 'week') setItems(await laadPeriode(anker, plusDagen(anker, 7)))
    else setItems(await laadPeriode(maand, new Date(maand.getFullYear(), maand.getMonth() + 1, 1)))
  }, [maand, anker, weergave])
  useEffect(() => { setItems(null); laad() }, [laad])

  const perDag = useMemo(() => {
    const m = {}
    ;(items || []).forEach(it => { if (it.dag) (m[it.dag] ||= []).push(it) })
    concept.forEach((c, i) => {
      if (!c?.datum) return
      ;(m[c.datum] ||= []).push({ id: `x${i}`, soort: 'concept', type: c.type || 'reel', dag: c.datum, tijd: null, titel: c.titel || c.hook || 'Voorstel', sub: c.type || 'reel', concept: c })
    })
    Object.values(m).forEach(l => l.sort((x, y) => (VOLGORDE.indexOf(x.soort) - VOLGORDE.indexOf(y.soort)) || String(x.tijd || '').localeCompare(String(y.tijd || ''))))
    return m
  }, [items, concept])

  // Rijen met data (lege rijen weg, behalve de content-rijen: daar plan je in).
  const rijen = useMemo(() => RIJEN.filter(r => r.content || r.id === 'call'
    || dagen.some(d => (perDag[iso(d)] || []).some(r.past))), [perDag, dagen])
  const rijMax = useMemo(() => Object.fromEntries(rijen.map(r => [r.id,
    Math.max(1, ...dagen.map(d => (perDag[iso(d)] || []).filter(r.past).length))])), [rijen, perDag, dagen])
  const dagMax = Math.max(4, ...dagen.map(d => (perDag[iso(d)] || []).length))

  const vandaag = iso(new Date())
  const vandaagIdx = dagen.findIndex(d => iso(d) === vandaag)

  // Naar vandaag (of de gevraagde dag) scrollen.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const doel = verzoek?.dag ? dagen.findIndex(d => iso(d) === verzoek.dag) : vandaagIdx
    if (doel > 3) el.scrollTo({ left: (doel - 3) * (KOLOM + 4), behavior: 'smooth' })
  }, [dagen, vandaagIdx, verzoek?.dag])

  const telling = useMemo(() => {
    const periode = weergave === 'week' ? weekDagen : dagen
    const sleutels = new Set(periode.map(iso))
    const inMaand = Object.entries(perDag).filter(([k]) => sleutels.has(k)).flatMap(([, l]) => l)
    const content = inMaand.filter(x => x.soort === 'content').length
    const calls = inMaand.filter(x => x.soort === 'call').length
    const leegContent = periode.filter(d => iso(d) >= vandaag && !(perDag[iso(d)] || []).some(x => x.soort === 'content' || x.soort === 'concept')).length
    return { content, calls, leegContent }
  }, [perDag, dagen, weekDagen, weergave, vandaag])

  const inplannen = async (lijst) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || !lijst.length) return
    setBezig('plannen')
    const rijenIn = lijst.map(c => ({
      coach_id: user.id, title: String(c.titel || c.hook || 'Content').slice(0, 200), hook: c.hook || null,
      type: ['reel', 'story', 'post', 'carousel', 'video'].includes(c.type) ? c.type : 'reel',
      status: 'planned', planned_date: c.datum, notes: 'Gepland met Gino',
    }))
    const { error } = await supabase.from('content_items').insert(rijenIn).then(r => r, e => ({ error: e }))
    setBezig(null)
    if (error) return
    setConcept(cs => cs.filter(c => !lijst.includes(c)))
    laad()
  }

  const verzet = (n) => {
    setGekozen(null)
    if (weergave === 'week') setAnker(a => plusDagen(a, 7 * n))
    else setMaand(m => new Date(m.getFullYear(), m.getMonth() + n, 1))
  }
  const kiesWeergave = (w) => {
    setGekozen(null)
    if (w === 'maand') setMaand(new Date(anker.getFullYear(), plusDagen(anker, 3).getMonth(), 1))
    else setAnker(maandagVan(maand.getMonth() === new Date().getMonth() && maand.getFullYear() === new Date().getFullYear() ? new Date() : maand))
    setWeergave(w)
  }
  const weekTitel = (() => {
    const a = weekDagen[0], b = weekDagen[6]
    const m = (d) => MAANDEN[d.getMonth()].slice(0, 3)
    return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${m(b)}` : `${a.getDate()} ${m(a)} – ${b.getDate()} ${m(b)}`
  })()
  const maandNaam = MAANDEN[maand.getMonth()]
  const dagLijst = gekozen ? (perDag[gekozen] || []) : []
  const gekozenDatum = gekozen ? new Date(`${gekozen}T12:00:00`) : null
  const labelBreedte = isMobile ? 44 : 132
  // Vertraging per kolom: vanaf vandaag naar buiten (golf uit de bol).
  const golf = (i) => Math.abs(i - (vandaagIdx >= 0 ? vandaagIdx : 0)) * 28

  // Een dag open: wat er staat, en samen plannen (week én maand).
  const dagBlad = gekozen && (

          <div style={{
            position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(6px)',
            border: `1px solid ${G}33`, borderRadius: 16, boxShadow: `0 0 40px ${G}14`,
            display: 'flex', flexDirection: 'column', padding: isMobile ? 14 : 20, animation: 'gk-blad .25s ease-out both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button type="button" onClick={() => setGekozen(null)} aria-label="Terug naar de maand" style={rond}><ChevronLeft size={16} strokeWidth={2.6} /></button>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.3em', color: `${G}cc` }}>
                  {dagLijst.length ? `${dagLijst.length} GEPLAND` : 'NOG LEEG'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>
                  {gekozenDatum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {dagLijst.map((it, i) => {
                const Icoon = SOORT_ICOON[it.soort]
                const groen = it.soort === 'content' || it.soort === 'concept'
                return (
                  <div key={it.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    animation: `gk-blad .3s ease-out ${i * 40}ms both`,
                  }}>
                    <Icoon size={16} strokeWidth={2.4} style={{ color: groen ? G : 'rgba(255,255,255,0.7)', flexShrink: 0, filter: groen ? `drop-shadow(0 0 5px ${G})` : 'none' }} />
                    <div style={{ width: 44, flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{it.tijd || ''}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', textDecoration: it.klaar ? 'line-through' : 'none', opacity: it.klaar ? 0.6 : 1 }}>{it.titel}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {[SOORT_LABEL[it.soort], it.sub, it.concept?.hook && `"${it.concept.hook}"`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {it.soort === 'concept' && (
                      <button type="button" className="gk-link" disabled={!!bezig} onClick={() => inplannen([it.concept])}
                        style={{ ...link, color: G, opacity: 1 }}>
                        <Plus size={13} strokeWidth={2.8} /> Inplannen
                      </button>
                    )}
                  </div>
                )
              })}
              {!dagLijst.length && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', padding: '12px 0' }}>Niets gepland op deze dag.</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 18, paddingTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="gk-link" style={{ ...link, color: G, opacity: 1 }}
                onClick={() => onVraag?.(`Laten we ${gekozenDatum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} (${gekozen}) plannen. Kijk wat er al staat en stel content voor als concept in de kalender.`)}>
                <Sparkles size={13} /> Plan deze dag met Gino
              </button>
            </div>
          </div>
  )

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 1180, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column',
      transformOrigin: '50% 100%', animation: 'gk-op .55s cubic-bezier(.2,.8,.2,1) both',
    }}>
      <style>{`
        @keyframes gk-op { from { opacity: 0; transform: translateY(28px) scale(.94) } to { opacity: 1; transform: none } }
        @keyframes gk-cel { 0% { opacity: 0; transform: scale(.6) } 70% { transform: scale(1.06) } 100% { opacity: 1; transform: none } }
        @keyframes gk-rij { from { opacity: 0; transform: translateX(-10px) } to { opacity: 1; transform: none } }
        @keyframes gk-lijn { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes gk-draai { to { transform: rotate(360deg) } }
        @keyframes gk-puls { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes gk-ring { from { stroke-dashoffset: 60 } to { stroke-dashoffset: var(--gk-tot) } }
        @keyframes gk-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
        @keyframes gk-blad { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        .gk-vak { transition: transform .15s, box-shadow .15s }
        .gk-vak:hover { transform: scale(1.12); box-shadow: 0 0 0 1px ${G}, 0 0 16px ${G}66; z-index: 2 }
        .gk-kol:hover .gk-dagnr { color: ${G} }
        .gk-link { opacity: .7; transition: opacity .15s, color .15s }
        .gk-link:hover { opacity: 1; color: ${G} !important }
        .gk-scroll { scrollbar-width: none } .gk-scroll::-webkit-scrollbar { display: none }
      `}</style>

      {/* Kop: ring met hoeveel dagen content hebben, maand en pijltjes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.3em', color: `${G}cc` }}>GINO · AGENDA</div>
          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
            {telling.calls} calls · {telling.content} content gepland
            {telling.leegContent > 0 && <span style={{ color: '#fff' }}> · {telling.leegContent} dagen nog zonder content</span>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', border: `1px solid ${G}33`, borderRadius: 999, padding: 2 }}>
          {['week', 'maand'].map(w => (
            <button key={w} type="button" onClick={() => kiesWeergave(w)} style={{
              border: 'none', borderRadius: 999, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase',
              background: weergave === w ? `${G}22` : 'transparent', color: weergave === w ? G : 'rgba(255,255,255,0.5)',
              boxShadow: weergave === w ? `0 0 10px ${G}33` : 'none',
            }}>{w}</button>
          ))}
        </div>
        <button type="button" onClick={() => verzet(-1)} aria-label="Vorige" style={rond}><ChevronLeft size={16} strokeWidth={2.6} /></button>
        <div style={{ minWidth: isMobile ? 104 : 140, textAlign: 'center', fontSize: isMobile ? 15 : 17, fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>
          {weergave === 'week' ? weekTitel : `${maandNaam} ${maand.getFullYear()}`}
        </div>
        <button type="button" onClick={() => verzet(1)} aria-label="Volgende" style={rond}><ChevronRight size={16} strokeWidth={2.6} /></button>
        <button type="button" onClick={onSluit} aria-label="Planning sluiten" style={{ ...rond, marginLeft: 6 }}><X size={16} strokeWidth={2.6} /></button>
      </div>

      {/* Week: de agenda als HUD, met hoeken zoals een vizier */}
      {weergave === 'week' && (
        <div ref={weekVak} style={{ position: 'relative', flex: 1, minHeight: 0, padding: '14px 14px 10px' }}>
          {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
            <span key={v + h} aria-hidden style={{
              position: 'absolute', [v]: 0, [h]: 0, width: 18, height: 18, pointerEvents: 'none',
              [`border${v[0].toUpperCase() + v.slice(1)}`]: `1.5px solid ${G}`, [`border${h[0].toUpperCase() + h.slice(1)}`]: `1.5px solid ${G}`,
              filter: `drop-shadow(0 0 4px ${G})`, animation: 'gk-op .5s ease-out both',
            }} />
          ))}
          <GinoWeek dagen={weekDagen} items={Object.values(perDag).flat()} onKies={setGekozen} hoogte={Math.max(220, weekH - 24)} />
          {items === null && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gk-draai 1.2s linear infinite' }} />
            </div>
          )}
          {dagBlad}
        </div>
      )}

      {/* Maand: labels vast links, dagen scrollen */}
      {weergave === 'maand' && (
      <div className="gk-scroll" style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}>
        <div style={{ width: labelBreedte, flexShrink: 0, display: 'flex', flexDirection: 'column', paddingTop: KOP_H }}>
          {rijen.map((r, ri) => {
            const Icoon = r.icoon
            return (
              <div key={r.id} style={{
                height: KOLOM + 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#fff',
                animation: `gk-rij .35s ease-out ${ri * 50}ms both`,
              }}>
                <Icoon size={15} strokeWidth={2.4} style={{ color: r.content ? G : 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                {!isMobile && r.label}
              </div>
            )
          })}
          <div style={{ height: 34, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{isMobile ? '' : 'Dag'}</div>
        </div>

        <div ref={scroller} className="gk-scroll" style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 4, width: 'max-content', position: 'relative', paddingRight: 8 }}>
            {/* Eén keer een groene scanlijn over de maand, als de bol die opbouwt */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
              <div style={{ width: '40%', height: '100%', background: `linear-gradient(90deg, transparent, ${G}22, transparent)`, animation: 'gk-scan 1.4s ease-out .2s both' }} />
            </div>
            {dagen.map((d, i) => {
              const k = iso(d)
              const lijst = perDag[k] || []
              const isVandaag = k === vandaag
              const verleden = k < vandaag
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={k} className="gk-kol" onClick={() => setGekozen(k)} style={{
                  width: KOLOM, flexShrink: 0, cursor: 'pointer', borderRadius: 10, position: 'relative',
                  background: isVandaag ? `${G}14` : 'transparent', boxShadow: isVandaag ? `inset 0 0 0 1px ${G}55, 0 0 24px ${G}22` : 'none',
                }}>
                  <div style={{ height: KOP_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isVandaag ? G : 'rgba(255,255,255,0.4)' }}>{WEEKLETTER[d.getDay()]}</span>
                    <span className="gk-dagnr" style={{ fontSize: 15, fontWeight: 900, color: isVandaag ? G : weekend ? 'rgba(255,255,255,0.55)' : '#fff', textShadow: isVandaag ? `0 0 10px ${G}` : 'none' }}>{d.getDate()}</span>
                  </div>
                  {rijen.map(r => {
                    const hier = lijst.filter(r.past)
                    const n = hier.length
                    const voorstel = hier.some(x => x.soort === 'concept')
                    const echt = hier.filter(x => x.soort !== 'concept')
                    const sterkte = n / rijMax[r.id]
                    // Content: gepost = vol groen, gepland = donkergroen; rest: groen naar drukte.
                    const gepost = r.content && echt.length > 0 && echt.every(x => x.klaar)
                    const vul = !echt.length ? null
                      : r.content ? (gepost ? G : '#0f5132')
                      : `rgba(34,197,94,${(0.18 + sterkte * 0.62).toFixed(2)})`
                    return (
                      <div key={r.id} style={{ height: KOLOM + 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="gk-vak" title={hier.map(x => `${x.tijd ? `${x.tijd} ` : ''}${x.titel}`).join('\n') || undefined} style={{
                          width: KOLOM, height: KOLOM, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 900, color: vul ? (gepost || sterkte > 0.6 ? '#000' : '#fff') : G,
                          background: vul || (verleden ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'),
                          border: voorstel && !echt.length ? `1.5px dashed ${G}` : `1px solid ${vul ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: gepost ? `0 0 12px ${G}55` : 'none',
                          animation: voorstel && !echt.length
                            ? `gk-cel .35s ease-out ${golf(i)}ms both, gk-puls 1.8s ease-in-out ${golf(i) + 400}ms infinite`
                            : `gk-cel .35s ease-out ${golf(i)}ms both`,
                        }}>
                          {echt.length ? n : voorstel ? <Plus size={14} strokeWidth={3} /> : ''}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DagRing deel={lijst.length / dagMax} vandaag={isVandaag} vertraging={golf(i) + 200} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {items === null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gk-draai 1.2s linear infinite' }} />
          </div>
        )}

        {dagBlad}
      </div>
      )}

      {/* Onder het overzicht: Gino's voorstellen of samen plannen, dan de lijn naar de bol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, flexShrink: 0, flexWrap: 'wrap', minHeight: 28 }}>
        {concept.length > 0 ? (
          <>
            <span style={{ fontSize: 12, fontWeight: 800, color: G }}>{concept.length} voorstel{concept.length === 1 ? '' : 'len'} van Gino</span>
            <button type="button" className="gk-link" disabled={!!bezig} onClick={() => inplannen(concept)} style={{ ...link, color: G, opacity: 1 }}>
              <Check size={13} strokeWidth={2.8} /> {bezig ? 'Bezig…' : 'Alles inplannen'}
            </button>
            <button type="button" className="gk-link" onClick={() => setConcept([])} style={link}>Weg</button>
          </>
        ) : (
          <button type="button" className="gk-link" style={{ ...link, color: G, opacity: 1 }}
            onClick={() => onVraag?.(`Laten we samen de content voor ${weergave === 'week' ? `de week van ${weekTitel}` : `${maandNaam} ${maand.getFullYear()}`} plannen. Kijk wat er al gepland staat en wat er in mijn agenda staat, en zet per lege dag een voorstel als concept in de kalender.`)}>
            <Sparkles size={13} /> Content plannen met Gino
          </button>
        )}
      </div>
      <div style={{ height: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 1, height: '100%', background: `linear-gradient(to bottom, ${G}66, ${G})`, boxShadow: `0 0 6px ${G}`, transformOrigin: 'top', animation: 'gk-lijn .4s ease-out .3s both' }} />
      </div>
    </div>
  )
}

const KOLOM = 32
const KOP_H = 40

const rond = {
  width: 30, height: 30, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}
const link = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 0', border: 'none', background: 'none',
  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'inherit', color: '#fff',
}
