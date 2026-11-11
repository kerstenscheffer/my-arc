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
// Kaart aantikken: titel bewerken en afvinken.

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { useModalHost } from '../../coach/ModalHost'
import { X, Minus, Maximize2, GripVertical, Grid2x2, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import useZwevendVenster from '../../components/useZwevendVenster'

const WIT = colors.textPrimary
const ZACHT = colors.textSecondary
const GROEN = colors.success

const VAKKEN = [
  { id: 'doen', titel: 'Nu doen', tint: 'rgba(249,115,22,0.10)', kleur: '#f97316' },
  { id: 'plannen', titel: 'Inplannen', tint: 'rgba(142,36,170,0.16)', kleur: '#8e24aa' },
  { id: 'gino', titel: 'Gino laten doen', tint: 'rgba(34,197,94,0.09)', kleur: GROEN },
  { id: 'weg', titel: 'Weg', tint: 'rgba(255,255,255,0.04)', kleur: '#9ca3af' },
]

const VELDEN = 'id, title, description, priority, deadline, scheduled_date, scheduled_start_time, recurrence_active, section_id, kwadrant, created_at'

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
const KOPKNOP = { ...KNOP, width: 28, height: 28, borderRadius: 8 }

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
  const sleepteNet = useRef(false)
  const ongedaanTimer = useRef(null)

  const laad = useCallback(async () => {
    let uid = coachId
    if (!uid) {
      const { data } = await supabase.auth.getUser()
      uid = data?.user?.id
    }
    if (!uid) { setFout('Niet ingelogd'); return }
    const [t, s] = await Promise.all([
      supabase.from('productivity_tasks').select(VELDEN).eq('coach_id', uid).eq('status', 'active')
        .order('created_at', { ascending: true })
        .then(r => r, e => ({ data: null, error: e })),
      supabase.from('productivity_sections').select('id, title').eq('coach_id', uid)
        .then(r => r, e => ({ data: null, error: e })),
    ])
    if (t.error) { setFout('Laden mislukt'); console.error('Matrix laden:', t.error); return }
    setFout(null)
    setTaken((t.data || []).filter(x => !x.recurrence_active && (!x.scheduled_start_time || isBelofte(x))))
    setSecties(Object.fromEntries((s.data || []).map(x => [x.id, x.title])))
  }, [coachId])

  useEffect(() => { laad() }, [laad])
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

  const verplaats = async (t, naar) => {
    if (t.kwadrant && t.kwadrant === naar) return
    if (naar === 'weg') {
      const vorig = { kwadrant: t.kwadrant || null }
      setTaken(l => (l || []).filter(x => x.id !== t.id))
      setOpen(null)
      const { error } = await supabase.from('productivity_tasks')
        .update({ kwadrant: 'weg', status: 'archived', updated_at: new Date().toISOString() }).eq('id', t.id)
        .then(r => r, e => ({ error: e }))
      if (error) { console.error('Matrix archiveren:', error); setFout('Opslaan mislukt'); laad(); return }
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
      await schrijf(t.id, { kwadrant: 'gino', description })
      return
    }
    const ok = await schrijf(t.id, { kwadrant: naar })
    if (ok && naar === 'plannen') setDatumVoor(t.id)
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
    laad()
  }

  const vinkAf = async (t) => {
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
  const startSleep = (e, t) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target.closest('button, input')) return
    if (e.pointerType !== 'mouse' && !e.target.closest('[data-greep]')) return
    const r = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    let actief = false
    const beweeg = (ev) => {
      if (!actief && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return
      actief = true
      sleepteNet.current = true
      ev.preventDefault()
      setSleep({ taak: t, x: ev.clientX - (sx - r.left), y: ev.clientY - (sy - r.top), w: r.width, over: vakOnder(ev.clientX, ev.clientY) })
    }
    const klaar = (ev) => {
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', klaar)
      window.removeEventListener('pointercancel', klaar)
      if (!actief) return
      const vak = ev.type === 'pointerup' ? vakOnder(ev.clientX, ev.clientY) : null
      setSleep(null)
      if (vak) verplaats(t, vak)
      setTimeout(() => { sleepteNet.current = false }, 0)
    }
    window.addEventListener('pointermove', beweeg, { passive: false })
    window.addEventListener('pointerup', klaar)
    window.addEventListener('pointercancel', klaar)
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

  const kaart = (t) => {
    const isOpen = open === t.id
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
        style={{
          display: 'flex', gap: 6, alignItems: 'flex-start',
          background: '#0b0b0b', borderRadius: 10, padding: '8px 10px 8px 4px',
          border: t.kwadrant ? '1px solid rgba(255,255,255,0.07)' : '1px dashed rgba(255,255,255,0.16)',
          opacity: sleep?.taak.id === t.id ? 0.3 : 1,
          cursor: isOpen ? 'default' : 'grab', userSelect: 'none', WebkitUserSelect: 'none',
        }}>
        <span data-greep="" aria-hidden style={{ flexShrink: 0, display: 'flex', alignItems: 'center', alignSelf: 'stretch', padding: '0 2px', color: 'rgba(255,255,255,0.25)', touchAction: 'none', cursor: 'grab' }}>
          <GripVertical size={14} />
        </span>
        {isOpen ? (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
            <input autoFocus value={titelEdit} onChange={e => setTitelEdit(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') bewaarTitel(t); if (e.key === 'Escape') setOpen(null) }}
              style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.35)', outline: 'none', color: WIT, fontSize: '0.86rem', fontWeight: 800, fontFamily: 'inherit', padding: '2px 0', userSelect: 'text', WebkitUserSelect: 'text' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => vinkAf(t)} style={{ ...KNOP, gap: 5, height: 30, padding: '0 12px', borderRadius: 999, background: GROEN, color: '#000', fontSize: '0.76rem', fontWeight: 900 }}>
                <Check size={14} strokeWidth={3} /> Afvinken
              </button>
              <button type="button" onClick={() => bewaarTitel(t)} style={{ ...KNOP, height: 30, padding: '0 10px', fontSize: '0.76rem', fontWeight: 900 }}>
                {titelEdit.trim() && titelEdit.trim() !== t.title ? 'Opslaan' : 'Sluiten'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: WIT, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {t.title}
            </div>
            {(label || d) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                {label && <span style={{ flex: 1, minWidth: 0, fontSize: '0.66rem', fontWeight: 800, color: ZACHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
                {d && <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '0.66rem', fontWeight: 900, color: dKleur, fontVariantNumeric: 'tabular-nums' }}>{kortDatum(d)}</span>}
              </div>
            )}
          </div>
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
      border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: isMobile ? 0 : 16,
      boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      <div {...sleepHandvat} style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        padding: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 12px) 14px 10px' : '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        ...(sleepHandvat.style || {}),
      }}>
        <Grid2x2 size={17} color={GROEN} strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: WIT, letterSpacing: '-0.02em' }}>Prioriteiten</span>
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

      {!ingeklapt && (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, padding: isMobile ? 8 : 10 }}>
          {VAKKEN.map(v => {
            const lijst = perVak(v.id)
            const doel = sleep && sleep.over === v.id
            return (
              <div key={v.id} data-kwadrant={v.id} style={{
                minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column',
                background: v.tint, borderRadius: 14,
                outline: doel ? `2px solid ${v.kleur}` : '2px solid transparent', outlineOffset: -2,
                transition: 'outline-color 0.1s',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 12px 6px', flexShrink: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.kleur, flexShrink: 0, alignSelf: 'center' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.titel}</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 900, color: lijst.length ? WIT : ZACHT, fontVariantNumeric: 'tabular-nums' }}>{taken ? lijst.length : ''}</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 6, padding: '2px 8px 10px' }}>
                  {lijst.map(kaart)}
                </div>
              </div>
            )
          })}
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
      background: '#111', border: `1.5px solid ${VAKKEN.find(v => v.id === sleep.over)?.kleur || 'rgba(255,255,255,0.4)'}`,
      borderRadius: 10, padding: '8px 12px', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', transform: 'rotate(-1.5deg)',
      fontSize: '0.84rem', fontWeight: 800, color: WIT, lineHeight: 1.3, boxSizing: 'border-box',
    }}>
      {sleep.taak.title}
    </div>
  )

  return createPortal(<>{venster}{spook}</>, modalHost)
}
