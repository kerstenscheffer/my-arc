// src/modules/business-os/PrioriteitenMatrix.jsx
//
// Eisenhower-matrix voor Kerstens taken (11 nov 2026). Zwevend venster zoals
// het To-do-venster: verslepen aan de kop, groter maken aan de hoek, sluiten.
// Openen: Business OS → puntjes → Prioriteiten, of de knop Matrix in To-do's.
//
// Data: productivity_tasks (status active, eigen coach_id), kolom kwadrant
// ('doen' | 'plannen' | 'gino' | 'weg', zie productivity/kwadrant.sql).
// Zonder kwadrant krijgt een taak een voorlopige plek (voorlopig()), die pas
// wordt opgeslagen als Kersten hem sleept. Herhalende blokken en agendablokken
// (scheduled_start_time) staan er niet in; beloftes wel.
//
// Slepen met pointer events: muis = de hele kaart, touch = het greepje links
// (zo blijft scrollen in een vak gewoon werken).
//   → Inplannen: datumkeuze (vandaag, morgen, kies dag) zet scheduled_date.
//   → Gino laten doen: regel "Gino: gedelegeerd (dd-mm-jjjj)" onderaan
//     description; de To-do-check (scripts/todocheck.mjs) pakt die eerst.
//   → Weg: status archived (nooit delete), 5 s Ongedaan maken.
//   → Uitgepland (kwadrant 'uit', 11 nov): uit de vakken gehaald, blijft
//     actief maar staat in een eigen kolom. Ook via "Uitplannen" op de kaart.
// Kaart aantikken: titel bewerken en afvinken.
//
// 12 nov 2026:
//   - Rondje vooraan = direct afvinken.
//   - Gino en Weg krimpen tot hun kop zolang ze leeg zijn (groeien bij slepen).
//   - Inplannen gegroepeerd: Deze week (incl. te laat) / Later / Zonder datum.
//   - Weg toont wat de laatste 7 dagen gearchiveerd is, met Terug.
//   - Naar Gino slepen vraagt om een opdracht (gino_opdracht, status 'wacht').
//     De PA (scripts/ginotaak.mjs) pakt hem binnen een minuut op en zet het
//     resultaat in gino_resultaat. Zonder opdracht: oude gedrag hieronder.
//   - Gino-taken tonen de laatste regel "Gino (dd-mm-jjjj): …" uit
//     description (todocheck), anders "Wacht op Gino".

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { useModalHost } from '../../coach/ModalHost'
import { X, Minus, Maximize2, Grid2x2, Check, CalendarDays, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import useZwevendVenster from '../../components/useZwevendVenster'

const WIT = colors.textPrimary
const ZACHT = colors.textSecondary
const GROEN = colors.success

// Vakken gevuld met een diepe kleur (11 nov 2026). Uitgepland zit als knop
// in de kopregel: erop slepen haalt een taak uit de vakken, aantikken opent
// de lijst.
const VAKKEN = [
  { id: 'doen', titel: 'Nu doen', kleur: '#000', rand: '#a855f7' },
  { id: 'plannen', titel: 'Inplannen', kleur: '#000', rand: '#3b82f6' },
  { id: 'gino', titel: 'Gino laten doen', kleur: '#000', rand: '#22c55e' },
  { id: 'weg', titel: 'Weg', kleur: '#000', rand: '#9ca3af' },
]

// Nu doen verdeeld over de dag (12 nov 2026), kolom productivity_tasks.dagdeel.
const DAGDELEN = [
  { id: 'ochtend', titel: 'Ochtend', tijd: '06–12', van: 6, tot: 12 },
  { id: 'middag', titel: 'Middag', tijd: '12–18', van: 12, tot: 18 },
  { id: 'avond', titel: 'Avond', tijd: '18–24', van: 18, tot: 24 },
]
const dagdeelNu = () => { const u = new Date().getHours(); return DAGDELEN.find(d => u >= d.van && u < d.tot)?.id || null }
const VELDEN = 'id, title, description, priority, deadline, scheduled_date, scheduled_start_time, recurrence_active, section_id, kwadrant, dagdeel, gino_opdracht, gino_status, gino_resultaat, gino_klaar_at, created_at'

const dagIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDagen = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dagIso(d) }
const isBelofte = (t) => /^belofte/i.test(t.title || '')

// Vroegste van deadline en scheduled_date.
const datumVan = (t) => [t.deadline, t.scheduled_date].filter(Boolean).sort()[0] || null

function voorlopig(t) {
  const prio = t.priority || 'medium'
  const d = datumVan(t)
  const spoed = !!d && d <= plusDagen(2)
  if (prio === 'high') return spoed ? 'doen' : 'plannen'
  if (prio === 'medium') return 'plannen'
  return spoed ? 'gino' : 'weg'
}
const kwadrantVan = (t) => t.kwadrant || voorlopig(t)

const kortDatum = (iso) => {
  if (iso === plusDagen(0)) return 'vandaag'
  if (iso === plusDagen(1)) return 'morgen'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

const KNOP = {
  border: 'none', background: 'transparent', color: WIT, cursor: 'pointer', padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
}
const KOPKNOP = { ...KNOP, width: 24, height: 24, borderRadius: 6 }

export default function PrioriteitenMatrix({ coachId, isMobile, onClose }) {
  const modalHost = useModalHost()
  const { ingeklapt, setIngeklapt, herstel, vensterStijl, sleepHandvat, formaatHandvat } =
    useZwevendVenster({ isMobile, standaard: { w: 900, h: 660 } })
  const [taken, setTaken] = useState(null)
  const [secties, setSecties] = useState({})
  const [fout, setFout] = useState(null)
  const [open, setOpen] = useState(null)
  const [titelEdit, setTitelEdit] = useState('')
  const [datumVoor, setDatumVoor] = useState(null)
  const [ongedaan, setOngedaan] = useState(null)
  const [sleep, setSleep] = useState(null)
  const [uitOpen, setUitOpen] = useState(false)
  const [wegLijst, setWegLijst] = useState([])
  const [afgevinkt, setAfgevinkt] = useState(null)
  const [ginoVoor, setGinoVoor] = useState(null)      // taak-id waarvoor het opdracht-venster open staat
  const [ginoTekst, setGinoTekst] = useState('')
  // Dichtgeklapte dagdelen in Nu doen, onthouden per browser.
  const [dichtDelen, setDichtDelen] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('prio_dicht_delen') || '[]')) } catch { return new Set() }
  })
  const wisselDeel = (id) => setDichtDelen(oud => {
    const n = new Set(oud)
    if (n.has(id)) n.delete(id); else n.add(id)
    try { localStorage.setItem('prio_dicht_delen', JSON.stringify([...n])) } catch { /* privé-venster */ }
    return n
  })
  const sleepteNet = useRef(false)
  const ongedaanTimer = useRef(null)

  const laad = useCallback(async () => {
    let uid = coachId
    if (!uid) {
      const { data } = await supabase.auth.getUser()
      uid = data?.user?.id
    }
    if (!uid) { setFout('Niet ingelogd'); return }
    const week = new Date(Date.now() - 7 * 86400000).toISOString()
    const [t, s, w] = await Promise.all([
      supabase.from('productivity_tasks').select(VELDEN).eq('coach_id', uid).eq('status', 'active')
        .order('created_at', { ascending: true })
        .then(r => r, e => ({ data: null, error: e })),
      supabase.from('productivity_sections').select('id, title').eq('coach_id', uid)
        .then(r => r, e => ({ data: null, error: e })),
      supabase.from('productivity_tasks').select('id, title, updated_at').eq('coach_id', uid)
        .eq('status', 'archived').eq('kwadrant', 'weg').gte('updated_at', week)
        .order('updated_at', { ascending: false }).limit(50)
        .then(r => r, e => ({ data: null, error: e })),
    ])
    if (t.error) { setFout('Laden mislukt'); console.error('Matrix laden:', t.error); return }
    setFout(null)
    setTaken((t.data || []).filter(x => !x.recurrence_active && (!x.scheduled_start_time || isBelofte(x))))
    setSecties(Object.fromEntries((s.data || []).map(x => [x.id, x.title])))
    setWegLijst(w.data || [])
  }, [coachId])

  useEffect(() => { laad() }, [laad])
  // Loopt er een Gino-taak, dan elke 15 s verversen tot hij klaar is.
  const ginoLoopt = (taken || []).some(t => t.gino_status === 'wacht' || t.gino_status === 'bezig')
  useEffect(() => {
    if (!ginoLoopt) return undefined
    const id = setInterval(laad, 15000)
    return () => clearInterval(id)
  }, [ginoLoopt, laad])
  useEffect(() => () => clearTimeout(ongedaanTimer.current), [])

  // Optimistisch bijwerken; bij een fout opnieuw laden.
  const schrijf = async (id, velden) => {
    setTaken(l => (l || []).map(x => (x.id === id ? { ...x, ...velden } : x)))
    const { error } = await supabase.from('productivity_tasks')
      .update({ ...velden, updated_at: new Date().toISOString() }).eq('id', id)
      .then(r => r, e => ({ error: e }))
    if (error) { console.error('Matrix opslaan:', error); setFout('Opslaan mislukt'); laad() }
    return !error
  }

  // naar = 'doen' | 'doen:ochtend' | 'plannen' | …
  const verplaats = async (t, doelId) => {
    const [naar, deel] = String(doelId).split(':')
    if (naar === 'doen') {
      if (t.kwadrant === 'doen' && (!deel || deel === t.dagdeel)) return
      await schrijf(t.id, { kwadrant: 'doen', dagdeel: deel || (t.kwadrant === 'doen' ? t.dagdeel : null) || null })
      return
    }
    if (t.kwadrant && t.kwadrant === naar) return
    if (naar === 'weg') {
      const vorig = { kwadrant: t.kwadrant || null }
      setTaken(l => (l || []).filter(x => x.id !== t.id))
      setOpen(null)
      const { error } = await supabase.from('productivity_tasks')
        .update({ kwadrant: 'weg', status: 'archived', updated_at: new Date().toISOString() }).eq('id', t.id)
        .then(r => r, e => ({ error: e }))
      if (error) { console.error('Matrix archiveren:', error); setFout('Opslaan mislukt'); laad(); return }
      setWegLijst(l => [{ id: t.id, title: t.title, updated_at: new Date().toISOString() }, ...l.filter(x => x.id !== t.id)])
      clearTimeout(ongedaanTimer.current)
      setOngedaan({ taak: t, vorig })
      ongedaanTimer.current = setTimeout(() => setOngedaan(null), 5000)
      return
    }
    if (naar === 'gino') {
      const d = plusDagen(0).split('-').reverse().join('-')
      const regel = `Gino: gedelegeerd (${d})`
      const oud = (t.description || '').trimEnd()
      const description = oud.includes(regel) ? oud : [oud, regel].filter(Boolean).join('\n')
      await schrijf(t.id, { kwadrant: 'gino', dagdeel: null, description })
      openGino(t)
      return
    }
    const ok = await schrijf(t.id, { kwadrant: naar, dagdeel: null })
    if (ok && naar === 'plannen') setDatumVoor(t.id)
  }

  const openGino = (t) => { setGinoVoor(t.id); setGinoTekst(t.gino_opdracht || '') }
  const geefAanGino = async () => {
    const id = ginoVoor
    const tekst = ginoTekst.trim()
    setGinoVoor(null)
    if (!id || !tekst) return
    await schrijf(id, { kwadrant: 'gino', dagdeel: null, gino_opdracht: tekst, gino_status: 'wacht', gino_resultaat: null, gino_klaar_at: null })
  }

  const maakOngedaan = async () => {
    if (!ongedaan) return
    const { taak, vorig } = ongedaan
    clearTimeout(ongedaanTimer.current)
    setOngedaan(null)
    const { error } = await supabase.from('productivity_tasks')
      .update({ ...vorig, status: 'active', updated_at: new Date().toISOString() }).eq('id', taak.id)
      .then(r => r, e => ({ error: e }))
    if (error) { console.error('Matrix ongedaan:', error); setFout('Ongedaan maken mislukt') }
    setWegLijst(l => l.filter(x => x.id !== taak.id))
    laad()
  }

  // Uit Weg terughalen: weer actief, zonder vak (krijgt zijn voorlopige plek).
  const haalTerug = async (w) => {
    setWegLijst(l => l.filter(x => x.id !== w.id))
    const { error } = await supabase.from('productivity_tasks')
      .update({ kwadrant: null, status: 'active', updated_at: new Date().toISOString() }).eq('id', w.id)
      .then(r => r, e => ({ error: e }))
    if (error) { console.error('Matrix terughalen:', error); setFout('Terughalen mislukt') }
    laad()
  }

  const vinkAf = async (t) => {
    // Even het vinkje laten zien, dan pas weg uit de lijst.
    setAfgevinkt(t.id)
    await new Promise(r => setTimeout(r, 350))
    setAfgevinkt(null)
    setTaken(l => (l || []).filter(x => x.id !== t.id))
    setOpen(null)
    const { error } = await supabase.from('productivity_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', t.id)
      .then(r => r, e => ({ error: e }))
    if (error) { console.error('Matrix afvinken:', error); setFout('Afvinken mislukt'); laad() }
  }

  const bewaarTitel = async (t) => {
    const titel = titelEdit.trim()
    if (titel && titel !== t.title) await schrijf(t.id, { title: titel })
    setOpen(null)
  }

  // Slepen: pas na 6 px beweging, zodat een tik een tik blijft.
  const vakOnder = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-kwadrant]')?.getAttribute('data-kwadrant') || null
  // Hele kaart sleepbaar (12 nov 2026). Muis: na 6 px beweging. Touch: kaart
  // 300 ms vasthouden, dan slepen; eerder bewegen = gewoon scrollen.
  const startSleep = (e, t) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target.closest('button, input, label')) return
    const touch = e.pointerType !== 'mouse'
    const r = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    let actief = false
    let vast = !touch
    const houdTimer = touch ? setTimeout(() => { vast = true; navigator.vibrate?.(10) }, 300) : null
    const blokScroll = (ev) => { if (vast) ev.preventDefault() }
    const beweeg = (ev) => {
      const afstand = Math.hypot(ev.clientX - sx, ev.clientY - sy)
      if (!vast) { if (afstand > 8) opruimen(); return }
      if (!actief && afstand < 6) return
      actief = true
      sleepteNet.current = true
      ev.preventDefault()
      setSleep({ taak: t, x: ev.clientX - (sx - r.left), y: ev.clientY - (sy - r.top), w: r.width, over: vakOnder(ev.clientX, ev.clientY) })
    }
    const opruimen = () => {
      clearTimeout(houdTimer)
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', klaar)
      window.removeEventListener('pointercancel', klaar)
      window.removeEventListener('touchmove', blokScroll)
    }
    const klaar = (ev) => {
      opruimen()
      if (!actief) return
      const vak = ev.type === 'pointerup' ? vakOnder(ev.clientX, ev.clientY) : null
      setSleep(null)
      if (vak) verplaats(t, vak)
      setTimeout(() => { sleepteNet.current = false }, 0)
    }
    window.addEventListener('pointermove', beweeg, { passive: false })
    window.addEventListener('pointerup', klaar)
    window.addEventListener('pointercancel', klaar)
    if (touch) window.addEventListener('touchmove', blokScroll, { passive: false })
  }

  const labelVan = (t) => {
    const m = /^belofte\s+([^:]+):/i.exec(t.title || '')
    if (m) return m[1].trim()
    return t.section_id ? secties[t.section_id] || null : null
  }

  const perVak = (id) => (taken || [])
    .filter(t => kwadrantVan(t) === id)
    .sort((a, b) => (datumVan(a) || '9').localeCompare(datumVan(b) || '9') || String(a.created_at).localeCompare(String(b.created_at)))

  const vandaag = plusDagen(0)

  // Laatste "Gino (dd-mm-jjjj): …"-regel uit description.
  const ginoStand = (t) => {
    const regels = String(t.description || '').split('\n').map(r => r.trim())
      .filter(r => /^Gino \(\d{2}-\d{2}-\d{4}\):/.test(r))
    if (!regels.length) return null
    const r = regels[regels.length - 1]
    const m = /^Gino \((\d{2})-(\d{2})-\d{4}\):\s*(.*)$/.exec(r)
    return m ? { dag: `${Number(m[1])}/${Number(m[2])}`, tekst: m[3] } : null
  }

  const kaart = (t) => {
    const isOpen = open === t.id
    const gloed = VAKKEN.find(v => v.id === kwadrantVan(t))?.rand || '#ffffff'
    const label = labelVan(t)
    const d = datumVan(t)
    const dKleur = d && d < vandaag ? colors.danger : d === vandaag ? GROEN : ZACHT
    return (
      <div key={t.id}
        onPointerDown={isOpen ? undefined : (e) => startSleep(e, t)}
        onClick={() => {
          if (sleepteNet.current || isOpen) return
          setOpen(t.id); setTitelEdit(t.title || '')
        }}
        onContextMenu={e => e.preventDefault()}
        style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '8px 8px 8px 10px', marginBottom: 6,
          background: '#050505', border: `1px solid ${gloed}80`, borderRadius: 12,
          boxShadow: `0 0 10px ${gloed}33, inset 0 0 12px ${gloed}14`,
          WebkitTouchCallout: 'none',
          opacity: sleep?.taak.id === t.id ? 0.3 : afgevinkt === t.id ? 0.5 : 1,
          cursor: isOpen ? 'default' : 'grab', userSelect: 'none', WebkitUserSelect: 'none',
        }}>
        {!isOpen && (
          <button type="button" onClick={(e) => { e.stopPropagation(); vinkAf(t) }} aria-label="Afvinken" title="Afvinken" style={{
            ...KNOP, width: 18, height: 18, marginTop: 1, borderRadius: '50%',
            border: `1.8px solid ${afgevinkt === t.id ? GROEN : 'rgba(255,255,255,0.55)'}`,
            background: afgevinkt === t.id ? GROEN : 'transparent', color: '#000',
          }}>
            {afgevinkt === t.id && <Check size={11} strokeWidth={3.5} />}
          </button>
        )}
        {isOpen ? (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
            <input autoFocus value={titelEdit} onChange={e => setTitelEdit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') bewaarTitel(t); if (e.key === 'Escape') setOpen(null) }}
              style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.35)', outline: 'none', color: WIT, fontSize: '0.86rem', fontWeight: 800, fontFamily: 'inherit', padding: '2px 0', userSelect: 'text', WebkitUserSelect: 'text' }} />
            {kwadrantVan(t) === 'gino' && (t.gino_opdracht || t.gino_resultaat) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, userSelect: 'text', WebkitUserSelect: 'text' }}>
                {t.gino_opdracht && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ZACHT, whiteSpace: 'pre-wrap' }}><b style={{ color: WIT }}>Opdracht:</b> {t.gino_opdracht}</div>}
                {t.gino_resultaat && (
                  <div style={{ maxHeight: 260, overflowY: 'auto', fontSize: '0.78rem', fontWeight: 700, color: WIT, lineHeight: 1.45, whiteSpace: 'pre-wrap', padding: '8px 10px', borderRadius: 10, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    {t.gino_resultaat}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {kwadrantVan(t) === 'gino' && (
                <button type="button" onClick={() => { setOpen(null); openGino(t) }} style={{ ...KNOP, height: 30, padding: '0 12px', borderRadius: 999, border: '1.5px solid #22c55e', color: '#86efac', fontSize: '0.76rem', fontWeight: 900 }}>
                  {t.gino_opdracht ? 'Opdracht aanpassen' : 'Opdracht'}
                </button>
              )}
              <button type="button" onClick={() => vinkAf(t)} style={{ ...KNOP, gap: 5, height: 30, padding: '0 12px', borderRadius: 999, background: GROEN, color: '#000', fontSize: '0.76rem', fontWeight: 900 }}>
                <Check size={14} strokeWidth={3} /> Afvinken
              </button>
              {t.kwadrant !== 'uit' && (
                <button type="button" onClick={() => { setOpen(null); verplaats(t, 'uit') }} style={{ ...KNOP, height: 30, padding: '0 10px', fontSize: '0.76rem', fontWeight: 900 }}>
                  Uitplannen
                </button>
              )}
              <button type="button" onClick={() => bewaarTitel(t)} style={{ ...KNOP, height: 30, padding: '0 10px', fontSize: '0.76rem', fontWeight: 900 }}>
                {titelEdit.trim() && titelEdit.trim() !== t.title ? 'Opslaan' : 'Sluiten'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div title={t.kwadrant ? undefined : 'Voorlopige plek: sleep om vast te zetten'} style={{ fontSize: '0.8rem', fontWeight: 800, color: t.kwadrant ? WIT : 'rgba(255,255,255,0.72)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {t.title}
            </div>
            {kwadrantVan(t) === 'gino' && (() => {
              const st = t.gino_opdracht ? t.gino_status : null
              if (st) {
                const eerste = String(t.gino_resultaat || '').split('\n').find(r => r.trim()) || ''
                const [kleur, tekst] = st === 'wacht' ? [ZACHT, 'In de rij, Gino begint binnen een minuut']
                  : st === 'bezig' ? ['#86efac', 'Gino is bezig…']
                  : st === 'klaar' ? ['#86efac', `Klaar: ${eerste}`]
                  : [colors.danger, `Mislukt: ${eerste}`]
                return (
                  <div title={st === 'klaar' || st === 'mislukt' ? t.gino_resultaat : undefined} style={{ marginTop: 2, fontSize: '0.68rem', fontWeight: 800, color: kleur, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', animation: st === 'bezig' ? 'prio-puls 1.4s ease-in-out infinite' : 'none' }}>
                    {tekst}
                  </div>
                )
              }
              const g = ginoStand(t)
              return (
                <div title={g?.tekst} style={{ marginTop: 2, fontSize: '0.68rem', fontWeight: 800, color: g ? '#86efac' : ZACHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g ? `Gino ${g.dag}: ${g.tekst}` : 'Nog geen opdracht, tik op Opdracht'}
                </div>
              )
            })()}
            {label && (
              <div style={{ marginTop: 2, fontSize: '0.66rem', fontWeight: 800, color: ZACHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
            )}
          </div>
        )}
        {!isOpen && kwadrantVan(t) === 'gino' && !t.gino_opdracht && (
          <button type="button" onClick={(e) => { e.stopPropagation(); openGino(t) }} style={{ ...KNOP, height: 22, padding: '0 8px', borderRadius: 999, background: '#22c55e', color: '#000', fontSize: '0.68rem', fontWeight: 900 }}>
            Opdracht
          </button>
        )}
        {!isOpen && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setDatumVoor(t.id) }} title="Datum kiezen" aria-label="Datum kiezen" style={{
            ...KNOP, gap: 4, height: 22, padding: d ? '0 7px' : 0, width: d ? 'auto' : 22, borderRadius: 999,
            background: d ? 'rgba(255,255,255,0.08)' : 'transparent', color: d ? dKleur : 'rgba(255,255,255,0.55)',
            fontSize: '0.68rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          }}>
            <CalendarDays size={13} strokeWidth={2.6} />
            {d && kortDatum(d)}
          </button>
        )}
      </div>
    )
  }

  const datumTaak = datumVoor ? (taken || []).find(t => t.id === datumVoor) : null
  const kiesDatum = async (iso) => {
    const id = datumVoor
    setDatumVoor(null)
    if (id && iso) await schrijf(id, { scheduled_date: iso })
  }
  const datumKnop = { ...KNOP, height: 40, borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: 900, padding: '0 16px' }

  const venster = (
    <div style={{
      ...vensterStijl,
      background: '#0a0a0a',
      border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: isMobile ? 0 : 16,
      boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      <style>{'@keyframes prio-puls { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }'}</style>
      <div {...sleepHandvat} style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        padding: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 8px) 12px 6px' : '5px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        ...(sleepHandvat.style || {}),
      }}>
        <Grid2x2 size={15} color={WIT} strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900, color: WIT, letterSpacing: '-0.02em' }}>Prioriteiten</span>
        <button type="button" data-kwadrant="uit" onClick={() => setUitOpen(v => !v)} title="Uitgeplande taken"
          style={{
            ...KNOP, gap: 6, height: 24, padding: '0 9px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 900,
            border: `1.5px solid ${sleep?.over === 'uit' ? WIT : 'rgba(255,255,255,0.3)'}`,
            background: sleep?.over === 'uit' || uitOpen ? WIT : 'transparent',
            color: sleep?.over === 'uit' || uitOpen ? '#000' : WIT,
            transform: sleep?.over === 'uit' ? 'scale(1.08)' : 'none', transition: 'transform 0.1s',
          }}>
          Uitgepland{taken ? ` ${perVak('uit').length}` : ''}
        </button>
        {!isMobile && (
          <button type="button" onClick={() => setIngeklapt(v => !v)} aria-label={ingeklapt ? 'Uitklappen' : 'Inklappen'} title={ingeklapt ? 'Uitklappen' : 'Inklappen'} style={KOPKNOP}>
            <Minus size={16} strokeWidth={2.8} />
          </button>
        )}
        {!isMobile && (
          <button type="button" onClick={herstel} aria-label="Terug naar het midden" title="Terug naar het midden" style={KOPKNOP}>
            <Maximize2 size={15} strokeWidth={2.8} />
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Sluiten" title="Sluiten" style={KOPKNOP}>
          <X size={18} strokeWidth={2.8} />
        </button>
      </div>

      {!ingeklapt && (() => {
        const onderLeeg = !sleep && perVak('gino').length === 0 && perVak('weg').length === 0 && wegLijst.length === 0
        const groepKop = (tekst, n, kleur) => (
          <div key={`kop-${tekst}`} style={{ display: 'flex', gap: 6, padding: '8px 4px 5px', fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: kleur || ZACHT }}>
            <span>{tekst}</span><span style={{ opacity: 0.7 }}>{n}</span>
          </div>
        )
        const plannenInhoud = (lijst) => {
          const grens = plusDagen(7)
          const groepen = [
            ['Deze week', lijst.filter(t => datumVan(t) && datumVan(t) <= grens)],
            ['Later', lijst.filter(t => datumVan(t) && datumVan(t) > grens)],
            ['Zonder datum', lijst.filter(t => !datumVan(t))],
          ].filter(([, l]) => l.length)
          return groepen.flatMap(([naam, l]) => [groepKop(naam, l.length), ...l.map(kaart)])
        }
        // Nu doen per dagdeel; elk dagdeel is zelf een plek om op te droppen.
        const doenInhoud = (lijst) => {
          const nu = dagdeelNu()
          const rest = lijst.filter(t => !DAGDELEN.some(d => d.id === t.dagdeel))
          return [
            ...DAGDELEN.map(d => {
              const l = lijst.filter(t => t.dagdeel === d.id)
              const hier = sleep?.over === `doen:${d.id}`
              return (
                <div key={d.id} data-kwadrant={`doen:${d.id}`} style={{
                  minHeight: 30, marginBottom: 4, borderRadius: 10,
                  background: hier ? 'rgba(167,139,250,0.16)' : 'transparent',
                  outline: hier ? '1.5px dashed #a78bfa' : 'none', outlineOffset: -1,
                }}>
                  <button type="button" onClick={() => wisselDeel(d.id)} aria-expanded={!dichtDelen.has(d.id)} style={{ ...KNOP, width: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 6, padding: '6px 4px 5px', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: d.id === nu ? WIT : ZACHT }}>
                    <ChevronDown size={13} strokeWidth={3} style={{ transform: dichtDelen.has(d.id) ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }} />
                    <span>{d.titel}</span>
                    <span style={{ opacity: 0.7, letterSpacing: 0 }}>{d.tijd}</span>
                    {d.id === nu && <span style={{ color: '#a78bfa' }}>· nu</span>}
                    <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{l.length || ''}</span>
                  </button>
                  {!dichtDelen.has(d.id) && l.map(kaart)}
                </div>
              )
            }),
            ...(rest.length ? [groepKop('Nog geen dagdeel', rest.length), ...rest.map(kaart)] : []),
          ]
        }
        // Voorlopig in Weg (nog actief) bovenaan, daarna wat al gearchiveerd is.
        const wegInhoud = () => [...perVak('weg').map(kaart), ...(wegLijst.length ? [groepKop('Gearchiveerd, 7 dagen', wegLijst.length)] : []), ...wegLijst.map(w => (
          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 4px 6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</span>
            <button type="button" onClick={() => haalTerug(w)} style={{ ...KNOP, height: 22, padding: '0 6px', fontSize: '0.7rem', fontWeight: 900 }}>Terug</button>
          </div>
        ))]
        return (
          <div style={{
            flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: onderLeeg ? '1fr auto' : sleep ? '1fr 1fr' : '1fr minmax(0, 0.65fr)',
            gap: 0, padding: 0, overflow: 'hidden', borderRadius: isMobile ? 0 : '0 0 16px 16px',
          }}>
            {VAKKEN.map(v => {
              const lijst = v.id === 'weg' ? [...perVak('weg'), ...wegLijst] : perVak(v.id)
              const doel = sleep && String(sleep.over || '').split(':')[0] === v.id
              return (
                <div key={v.id} data-kwadrant={v.id} style={{
                  minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column',
                  background: v.kleur,
                  boxShadow: `inset 0 0 0 ${doel ? 2 : 1}px ${v.rand}${doel ? '' : 'aa'}, inset 0 0 ${doel ? 36 : 22}px ${v.rand}${doel ? '55' : '2e'}`,
                  transition: 'box-shadow 0.12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: onderLeeg && (v.id === 'gino' || v.id === 'weg') ? '7px 12px' : '7px 12px 3px', flexShrink: 0 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                      {v.titel}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: WIT, opacity: lijst.length ? 1 : 0.5, fontVariantNumeric: 'tabular-nums' }}>{taken ? lijst.length : ''}</span>
                  </div>
                  {!(onderLeeg && (v.id === 'gino' || v.id === 'weg')) && (
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'block', padding: '2px 10px 12px' }}>
                      {v.id === 'plannen' ? plannenInhoud(lijst) : v.id === 'weg' ? wegInhoud() : v.id === 'doen' ? doenInhoud(lijst) : lijst.map(kaart)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {uitOpen && !ingeklapt && (
        <div onClick={() => setUitOpen(false)} style={{ pointerEvents: sleep ? 'none' : 'auto', opacity: sleep ? 0.35 : 1, position: 'absolute', inset: 0, top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 40px)' : 35 }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 6, right: 10, width: isMobile ? 'calc(100% - 20px)' : 340, maxHeight: '70%',
            display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 6px' }}>
              <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900, color: WIT }}>Uitgepland</span>
              <button type="button" onClick={() => setUitOpen(false)} aria-label="Sluiten" style={KOPKNOP}><X size={16} strokeWidth={2.8} /></button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 6px 10px' }}>
              {perVak('uit').map(kaart)}
              {!perVak('uit').length && (
                <div style={{ padding: '6px 8px 4px', fontSize: '0.78rem', fontWeight: 700, color: ZACHT }}>Nog niets. Sleep een taak op de knop Uitgepland.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!ingeklapt && (fout || taken === null) && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: fout ? colors.danger : ZACHT, background: '#000', padding: '6px 12px', borderRadius: 999 }}>{fout || 'Laden…'}</span>
        </div>
      )}

      {ongedaan && !ingeklapt && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '4px 4px 4px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: WIT, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Weg</span>
            <button type="button" onClick={maakOngedaan} style={{ ...KNOP, height: 32, padding: '0 14px', borderRadius: 999, background: WIT, color: '#000', fontSize: '0.78rem', fontWeight: 900 }}>
              Ongedaan maken
            </button>
          </div>
        </div>
      )}

      {ginoVoor && !ingeklapt && (() => {
        const gt = (taken || []).find(t => t.id === ginoVoor)
        return (
          <div onClick={() => setGinoVoor(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 5 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#050505', border: '1px solid #22c55e88', boxShadow: '0 0 24px #22c55e33', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: WIT }}>Wat moet Gino doen?</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZACHT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gt?.title}</div>
                </div>
                <button type="button" onClick={() => setGinoVoor(null)} aria-label="Later" title="Later" style={KOPKNOP}><X size={17} strokeWidth={2.8} /></button>
              </div>
              <textarea autoFocus value={ginoTekst} onChange={e => setGinoTekst(e.target.value)} rows={6}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) geefAanGino() }}
                placeholder="Bijv. Zoek uit welke 3 Strava-stats klanten het meest motiveren en schrijf een korte opzet voor het scherm."
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, outline: 'none', color: WIT, fontSize: '0.86rem', fontWeight: 700, fontFamily: 'inherit', lineHeight: 1.45, padding: '10px 12px' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: ZACHT, margin: '8px 0 12px', lineHeight: 1.4 }}>
                Gino pakt hem binnen een minuut op (als de PA op je Mac draait). Hij kan uitzoeken, content-concepten maken, teksten schrijven en dingen op de ontwikkellijst zetten. Niets naar klanten, geen plannen wijzigen.
              </div>
              <button type="button" onClick={geefAanGino} disabled={!ginoTekst.trim()} style={{ ...KNOP, width: '100%', height: 42, borderRadius: 12, background: ginoTekst.trim() ? '#22c55e' : 'rgba(255,255,255,0.1)', color: ginoTekst.trim() ? '#000' : ZACHT, fontSize: '0.88rem', fontWeight: 900, cursor: ginoTekst.trim() ? 'pointer' : 'default' }}>
                {gt?.gino_opdracht ? 'Opnieuw laten doen' : 'Gino laten doen'}
              </button>
            </div>
          </div>
        )
      })()}

      {datumTaak && !ingeklapt && (
        <div onClick={() => setDatumVoor(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: WIT }}>Wanneer?</div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZACHT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{datumTaak.title}</div>
              </div>
              <button type="button" onClick={() => setDatumVoor(null)} aria-label="Zonder datum" title="Zonder datum" style={KOPKNOP}><X size={17} strokeWidth={2.8} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => kiesDatum(plusDagen(0))} style={{ ...datumKnop, flex: 1 }}>Vandaag</button>
              <button type="button" onClick={() => kiesDatum(plusDagen(1))} style={{ ...datumKnop, flex: 1 }}>Morgen</button>
              <label style={{ ...datumKnop, width: '100%', position: 'relative', cursor: 'pointer', boxSizing: 'border-box', color: WIT }}>
                Kies dag
                <input type="date" min={plusDagen(0)} aria-label="Kies dag"
                  onChange={e => { if (e.target.value) kiesDatum(e.target.value) }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {formaatHandvat && !ingeklapt && (
        <div {...formaatHandvat} style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, cursor: 'se-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 3 }}>
          <div style={{ width: 8, height: 8, borderRight: '2px solid rgba(255,255,255,0.2)', borderBottom: '2px solid rgba(255,255,255,0.2)' }} />
        </div>
      )}
    </div>
  )

  // Spook-kaart buiten het venster: dat heeft een transform, waardoor fixed
  // daarbinnen niet meer op het scherm zou staan.
  const spook = sleep && (
    <div style={{
      position: 'fixed', left: sleep.x, top: sleep.y, width: sleep.w, zIndex: 2147483300, pointerEvents: 'none',
      background: '#111', border: `2px solid ${VAKKEN.find(v => v.id === String(sleep.over || '').split(':')[0])?.rand || 'rgba(255,255,255,0.6)'}`,
      borderRadius: 10, padding: '8px 12px', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', transform: 'rotate(-1.5deg)',
      fontSize: '0.84rem', fontWeight: 800, color: WIT, lineHeight: 1.3, boxSizing: 'border-box',
    }}>
      {sleep.taak.title}
    </div>
  )

  return createPortal(<>{venster}{spook}</>, modalHost)
}
