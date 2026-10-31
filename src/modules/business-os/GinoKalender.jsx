// src/modules/business-os/GinoKalender.jsx
//
// Interactieve maandkalender boven Gino's bol (31 okt 2026). Groeit uit de bol
// op (groene lijn, vakjes die vanaf onderen oplichten) in dezelfde stijl:
// dunne groene lijnen, gloed waar het druk is, vandaag als mini-bol.
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft, ChevronRight, X, Calendar, Phone, Film, CheckCircle2, Bell, Sparkles, Plus, Check,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const WEEKDAGEN = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const nlDag = (ts) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const nlTijd = (ts) => new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
const maandVan = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : null
}

// Soorten: icoon, label en hoe fel ze in het vakje staan. Groen = content
// (wat Kersten met Gino plant), wit = afspraken, gedempt = de rest.
const SOORT = {
  call: { icoon: Phone, label: 'Call', kleur: '#fff' },
  agenda: { icoon: Calendar, label: 'Agenda', kleur: 'rgba(255,255,255,0.7)' },
  content: { icoon: Film, label: 'Content', kleur: G },
  taak: { icoon: CheckCircle2, label: 'Taak', kleur: 'rgba(255,255,255,0.55)' },
  herinnering: { icoon: Bell, label: 'Herinnering', kleur: 'rgba(255,255,255,0.55)' },
  concept: { icoon: Sparkles, label: 'Voorstel', kleur: G },
}
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
    titel: e.contact_naam ? `Call · ${e.contact_naam}` : (e.titel || 'Afspraak'),
  }))
  ;(ca.data || []).forEach(c => items.push({
    id: `c${c.id}`, soort: 'call', dag: nlDag(c.scheduled_date), tijd: nlTijd(c.scheduled_date),
    titel: `${c.call_title || 'Call'} · ${c.clients?.first_name || ''}`.trim(),
  }))
  ;(co.data || []).forEach(c => items.push({
    id: `i${c.id}`, soort: 'content', dag: c.planned_date, tijd: c.planned_time || null,
    titel: c.title || c.hook || 'Content', sub: [c.type, c.status === 'created' ? 'gepost' : null].filter(Boolean).join(' · '),
    klaar: c.status === 'created',
  }))
  ;(ta.data || []).forEach(t => items.push({
    id: `t${t.id}`, soort: 'taak', dag: t.scheduled_date || t.deadline, tijd: null,
    titel: t.title, sub: t.deadline && t.deadline !== t.scheduled_date ? 'deadline' : null,
  }))
  ;(he.data || []).forEach(h => items.push({
    id: `h${h.id}`, soort: 'herinnering', dag: nlDag(h.moment), tijd: nlTijd(h.moment), titel: h.tekst,
  }))
  return items
}

export default function GinoKalender({ verzoek, onSluit, onVraag, isMobile = false }) {
  const [maand, setMaand] = useState(() => maandVan(verzoek?.maand) || maandVan(verzoek?.dag) || new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [gekozen, setGekozen] = useState(verzoek?.dag || null)
  const [items, setItems] = useState(null)
  const [concept, setConcept] = useState(() => (Array.isArray(verzoek?.concept) ? verzoek.concept : []))
  const [bezig, setBezig] = useState(null)

  // Nieuw verzoek van Gino (zelfde component blijft staan): springen.
  useEffect(() => {
    if (!verzoek) return
    const m = maandVan(verzoek.maand) || maandVan(verzoek.dag)
    if (m) setMaand(m)
    setGekozen(verzoek.dag || null)
    if (Array.isArray(verzoek.concept)) setConcept(verzoek.concept)
  }, [verzoek])

  // Raster: maandag vóór de 1e t/m 6 weken verder.
  const raster = useMemo(() => {
    const start = new Date(maand)
    start.setDate(1 - ((maand.getDay() + 6) % 7))
    const weken = Math.ceil((((maand.getDay() + 6) % 7) + new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate()) / 7)
    return Array.from({ length: weken * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [maand])

  const laad = useCallback(async () => {
    const tot = new Date(raster[raster.length - 1])
    tot.setDate(tot.getDate() + 1)
    setItems(await laadPeriode(raster[0], tot))
  }, [raster])
  useEffect(() => { setItems(null); laad() }, [laad])

  const perDag = useMemo(() => {
    const m = {}
    ;(items || []).forEach(it => { if (it.dag) (m[it.dag] ||= []).push(it) })
    concept.forEach((c, i) => {
      if (!c?.datum) return
      ;(m[c.datum] ||= []).push({ id: `x${i}`, soort: 'concept', dag: c.datum, tijd: null, titel: c.titel || c.hook || 'Voorstel', sub: c.type || 'reel', concept: c })
    })
    Object.values(m).forEach(l => l.sort((x, y) => (VOLGORDE.indexOf(x.soort) - VOLGORDE.indexOf(y.soort)) || String(x.tijd || '').localeCompare(String(y.tijd || ''))))
    return m
  }, [items, concept])

  const vandaag = iso(new Date())
  const maxDruk = Math.max(1, ...raster.map(d => (perDag[iso(d)] || []).length))

  const inplannen = async (lijst) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || !lijst.length) return
    setBezig('plannen')
    const rijen = lijst.map(c => ({
      coach_id: user.id, title: String(c.titel || c.hook || 'Content').slice(0, 200), hook: c.hook || null,
      type: ['reel', 'story', 'post', 'carousel', 'video'].includes(c.type) ? c.type : 'reel',
      status: 'planned', planned_date: c.datum, notes: 'Gepland met Gino',
    }))
    const { error } = await supabase.from('content_items').insert(rijen).then(r => r, e => ({ error: e }))
    setBezig(null)
    if (error) return
    setConcept(cs => cs.filter(c => !lijst.includes(c)))
    laad()
  }

  const verzet = (n) => { setGekozen(null); setMaand(m => new Date(m.getFullYear(), m.getMonth() + n, 1)) }
  const maandNaam = MAANDEN[maand.getMonth()]
  const dagLijst = gekozen ? (perDag[gekozen] || []) : []
  const gekozenDatum = gekozen ? new Date(`${gekozen}T12:00:00`) : null
  const cel = isMobile ? 4 : 6

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 760, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column',
      transformOrigin: '50% 100%', animation: 'gk-op .55s cubic-bezier(.2,.8,.2,1) both',
    }}>
      <style>{`
        @keyframes gk-op { from { opacity: 0; transform: translateY(28px) scale(.94) } to { opacity: 1; transform: none } }
        @keyframes gk-cel { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes gk-lijn { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes gk-draai { to { transform: rotate(360deg) } }
        @keyframes gk-puls { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes gk-blad { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
        .gk-cel { transition: box-shadow .2s, background-color .2s }
        .gk-cel:hover { box-shadow: inset 0 0 0 1px ${G}99, 0 0 18px ${G}33; z-index: 1 }
        .gk-link { opacity: .7; transition: opacity .15s, color .15s }
        .gk-link:hover { opacity: 1; color: ${G} !important }
      `}</style>

      {/* Kop: maand, pijltjes, samen plannen, sluiten */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.3em', color: `${G}cc` }}>GINO · AGENDA</div>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => verzet(-1)} aria-label="Vorige maand" style={rond}><ChevronLeft size={16} strokeWidth={2.6} /></button>
        <div style={{ minWidth: isMobile ? 110 : 150, textAlign: 'center', fontSize: isMobile ? 15 : 17, fontWeight: 900, color: '#fff', textTransform: 'capitalize' }}>
          {maandNaam} {maand.getFullYear()}
        </div>
        <button type="button" onClick={() => verzet(1)} aria-label="Volgende maand" style={rond}><ChevronRight size={16} strokeWidth={2.6} /></button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onSluit} aria-label="Kalender sluiten" style={rond}><X size={16} strokeWidth={2.6} /></button>
      </div>

      {/* Weekdagen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flexShrink: 0, paddingBottom: 6 }}>
        {WEEKDAGEN.map(w => (
          <div key={w} style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.25em', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{w}</div>
        ))}
      </div>

      {/* Raster: 1px groene lijnen = de achtergrond tussen de vakjes */}
      <div style={{
        position: 'relative', flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${raster.length / 7}, 1fr)`, gap: 1, background: `${G}26`,
        border: `1px solid ${G}33`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 0 40px ${G}12`,
      }}>
        {raster.map((d, i) => {
          const k = iso(d)
          const lijst = perDag[k] || []
          const inMaand = d.getMonth() === maand.getMonth()
          const isVandaag = k === vandaag
          const druk = lijst.length / maxDruk
          const rij = Math.floor(i / 7), kol = i % 7
          // Vanaf onder-midden (waar de bol staat) oplichten.
          const afstand = Math.hypot(kol - 3, (raster.length / 7 - 1) - rij)
          const tellen = VOLGORDE.map(s => [s, lijst.filter(x => x.soort === s).length]).filter(([, n]) => n > 0)
          const eerste = lijst.find(x => x.soort === 'content' || x.soort === 'concept') || lijst.find(x => x.soort === 'call')
          return (
            <button key={k} type="button" className="gk-cel" onClick={() => setGekozen(k)} style={{
              position: 'relative', minWidth: 0, minHeight: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              padding: `${cel}px ${cel + 1}px`, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden',
              background: lijst.length && inMaand
                ? `radial-gradient(circle at 50% 120%, ${G}${Math.round(10 + druk * 38).toString(16).padStart(2, '0')} 0%, #050505 75%)`
                : '#050505',
              opacity: inMaand ? 1 : 0.35,
              animation: `gk-cel .4s ease-out ${(afstand * 45).toFixed(0)}ms both`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  position: 'relative', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', fontSize: 12, fontWeight: 900, color: isVandaag ? '#000' : '#fff', flexShrink: 0,
                  background: isVandaag ? G : 'transparent', boxShadow: isVandaag ? `0 0 14px ${G}` : 'none',
                }}>
                  {d.getDate()}
                  {isVandaag && <span style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px dashed ${G}99`, animation: 'gk-draai 6s linear infinite' }} />}
                </span>
                {!isMobile && tellen.length > 0 && (
                  <span style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                    {tellen.map(([s, n]) => (
                      <span key={s} title={`${n} ${SOORT[s].label.toLowerCase()}`} style={{
                        width: 6, height: 6, borderRadius: '50%', background: s === 'concept' ? 'transparent' : SOORT[s].kleur,
                        border: s === 'concept' ? `1px dashed ${G}` : 'none', boxShadow: s === 'content' ? `0 0 6px ${G}` : 'none',
                      }} />
                    ))}
                  </span>
                )}
              </div>
              {isMobile
                ? lijst.length > 0 && <span style={{ fontSize: 10, fontWeight: 900, color: lijst.some(x => x.soort === 'content' || x.soort === 'concept') ? G : 'rgba(255,255,255,0.7)' }}>{lijst.length}</span>
                : eerste && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, lineHeight: 1.25, color: SOORT[eerste.soort].kleur, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    ...(eerste.soort === 'concept' ? { border: `1px dashed ${G}`, borderRadius: 6, padding: '1px 4px', animation: 'gk-puls 1.8s ease-in-out infinite' } : {}),
                  }}>
                    {eerste.soort === 'concept' ? '+ ' : ''}{eerste.titel}
                  </span>
                )}
              {!isMobile && lijst.length > 1 && (
                <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 'auto' }}>+{lijst.length - 1}</span>
              )}
            </button>
          )
        })}

        {items === null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gk-draai 1.2s linear infinite' }} />
          </div>
        )}

        {/* Een dag open: wat er staat, en samen plannen */}
        {gekozen && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(6px)',
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
                const S = SOORT[it.soort]
                const Icoon = S.icoon
                return (
                  <div key={it.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    animation: `gk-cel .3s ease-out ${i * 40}ms both`,
                  }}>
                    <Icoon size={16} strokeWidth={2.4} style={{ color: S.kleur, flexShrink: 0, filter: it.soort === 'content' ? `drop-shadow(0 0 5px ${G})` : 'none' }} />
                    <div style={{ width: 44, flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{it.tijd || ''}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', textDecoration: it.klaar ? 'line-through' : 'none', opacity: it.klaar ? 0.6 : 1 }}>{it.titel}</div>
                      {(it.sub || it.concept?.hook) && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                          {[S.label, it.sub, it.concept?.hook && `"${it.concept.hook}"`].filter(Boolean).join(' · ')}
                        </div>
                      )}
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
        )}
      </div>

      {/* Onder het raster: legenda of Gino's voorstellen, dan de lijn naar de bol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, flexShrink: 0, flexWrap: 'wrap', minHeight: 28 }}>
        {concept.length > 0 ? (
          <>
            <span style={{ fontSize: 12, fontWeight: 800, color: G }}>{concept.length} voorstel{concept.length === 1 ? '' : 'len'} van Gino</span>
            <button type="button" className="gk-link" disabled={!!bezig} onClick={() => inplannen(concept)} style={{ ...link, color: G, opacity: 1 }}>
              <Check size={13} strokeWidth={2.8} /> {bezig ? 'Bezig…' : 'Alles inplannen'}
            </button>
            <button type="button" className="gk-link" onClick={() => setConcept([])} style={link}>Weg</button>
          </>
        ) : (
          <>
            {['call', 'agenda', 'content', 'taak'].map(s => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: SOORT[s].kleur }} /> {SOORT[s].label}
              </span>
            ))}
            <div style={{ flex: 1 }} />
            <button type="button" className="gk-link" style={{ ...link, color: G, opacity: 1 }}
              onClick={() => onVraag?.(`Laten we samen de content voor ${maandNaam} ${maand.getFullYear()} plannen. Kijk wat er al gepland staat en wat er in mijn agenda staat, en zet per lege dag een voorstel als concept in de kalender.`)}>
              <Sparkles size={13} /> Content plannen met Gino
            </button>
          </>
        )}
      </div>
      <div style={{ height: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: 1, height: '100%', background: `linear-gradient(to bottom, ${G}66, ${G})`, boxShadow: `0 0 6px ${G}`, transformOrigin: 'top', animation: 'gk-lijn .4s ease-out .3s both' }} />
      </div>
    </div>
  )
}

const rond = {
  width: 30, height: 30, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
}
const link = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 0', border: 'none', background: 'none',
  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'inherit', color: '#fff',
}
