// src/modules/business-os/GinoTimer.jsx
//
// Taaktimer in Business OS (6 nov 2026). TimerKiezer zit in het blad onder de
// puntjes (Timer): taak kiezen of typen, dan duur. TimerBlok is het aftellende
// blokje bij de bol: pauze en stop, en als de tijd op is Klaar? met Afvinken en
// +10 min. Logica en opslag: ginoTimer.js.

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, Square, X, ChevronLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
// Met extensie: ginoTimer.js en GinoTimer.jsx botsen anders op macOS (hoofdletterongevoelig).
import { openKaarten, klok } from './ginoTimer.js'

const WIT = colors.textPrimary
const ZACHT = colors.textSecondary
const GROEN = colors.success
const LIJN = 'rgba(255,255,255,0.06)'
const DUREN = [15, 25, 45, 60]
const KOP = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: WIT, margin: '20px 0 4px' }
const TIK = { minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', color: WIT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }

const vandaagIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const kortDag = (iso) => (iso === vandaagIso() ? 'vandaag'
  : new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }))

function Regel({ titel, sub, rechts, onKies }) {
  return (
    <button type="button" onClick={onKies} style={{
      ...TIK, width: '100%', justifyContent: 'flex-start', gap: 12, textAlign: 'left',
      padding: '8px 0', borderBottom: `1px solid ${LIJN}`,
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, lineHeight: 1.3 }}>{titel}</span>
        {sub && <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: ZACHT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      {rechts && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: rechts === 'vandaag' ? GROEN : ZACHT, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{rechts}</span>}
    </button>
  )
}

// taken = productivity_tasks van vandaag (Vandaag-lijst), lopend = titel van een lopende timer.
export function TimerKiezer({ taken, lopend, onStart }) {
  const [kaarten, setKaarten] = useState(null)
  const [eigen, setEigen] = useState('')
  const [taak, setTaak] = useState(null)
  const [minuten, setMinuten] = useState(25)

  useEffect(() => {
    let weg = false
    supabase.from('business_os_projecten').select('id, titel, plan').eq('status', 'uitvoering')
      .then(r => r, e => ({ data: null, error: e }))
      .then(({ data }) => { if (!weg) setKaarten(openKaarten(data)) })
    return () => { weg = true }
  }, [])

  const kiesEigen = () => { const t = eigen.trim(); if (t) setTaak({ soort: 'eigen', id: null, titel: t }) }

  if (taak) {
    const ok = minuten >= 1
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: -12 }}>
          <button type="button" onClick={() => setTaak(null)} aria-label="Terug" style={TIK}><ChevronLeft size={22} strokeWidth={2.6} /></button>
          <div style={{ flex: 1, minWidth: 0, fontSize: '1.05rem', fontWeight: 900, lineHeight: 1.3 }}>{taak.titel}</div>
        </div>
        <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {ok ? klok(minuten * 60000) : '–'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DUREN.map(m => (
            <button key={m} type="button" onClick={() => setMinuten(m)} style={{
              ...TIK, flex: '1 1 56px', borderRadius: 999, fontSize: '0.9rem', fontWeight: 900,
              background: minuten === m ? WIT : 'transparent', color: minuten === m ? '#000' : WIT,
              border: `1.5px solid ${minuten === m ? WIT : 'rgba(255,255,255,0.35)'}`,
            }}>{m}</button>
          ))}
          <input type="number" inputMode="numeric" min="1" max="480" placeholder="eigen" aria-label="Eigen duur in minuten"
            value={DUREN.includes(minuten) ? '' : minuten || ''}
            onChange={e => setMinuten(Math.min(480, Math.max(0, parseInt(e.target.value, 10) || 0)))}
            style={{
              flex: '1 1 72px', minWidth: 0, minHeight: 44, borderRadius: 999, boxSizing: 'border-box', padding: '0 14px',
              background: 'transparent', border: `1.5px solid ${DUREN.includes(minuten) ? 'rgba(255,255,255,0.35)' : WIT}`,
              color: WIT, fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none', textAlign: 'center',
            }} />
        </div>
        {lopend && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: ZACHT, marginTop: 16, textAlign: 'center' }}>Stopt {lopend}</div>}
        <button type="button" disabled={!ok} onClick={() => onStart(taak, minuten)} style={{
          ...TIK, width: '100%', marginTop: lopend ? 8 : 20, minHeight: 52, borderRadius: 999, gap: 8,
          background: GROEN, color: '#000', fontSize: '1rem', fontWeight: 900, opacity: ok ? 1 : 0.4,
        }}>
          <Play size={18} strokeWidth={3} fill="#000" /> Start
        </button>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); kiesEigen() }} style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1.5px solid ${eigen.trim() ? WIT : 'rgba(255,255,255,0.35)'}` }}>
        <input value={eigen} onChange={e => setEigen(e.target.value)} placeholder="Eigen taak" aria-label="Eigen taak" style={{
          flex: 1, minWidth: 0, minHeight: 44, background: 'transparent', border: 'none', outline: 'none',
          color: WIT, fontSize: '0.95rem', fontWeight: 800, fontFamily: 'inherit', padding: 0,
        }} />
        <button type="submit" aria-label="Verder" disabled={!eigen.trim()} style={{ ...TIK, color: eigen.trim() ? GROEN : ZACHT }}>
          <ArrowRight size={20} strokeWidth={2.8} />
        </button>
      </form>

      <div style={KOP}>Bord</div>
      {kaarten === null && <div style={{ fontSize: '0.85rem', color: ZACHT, padding: '8px 0' }}>Laden…</div>}
      {kaarten?.length === 0 && <div style={{ fontSize: '0.85rem', color: ZACHT, padding: '8px 0' }}>Geen open kaarten.</div>}
      {(kaarten || []).map(k => (
        <Regel key={`${k.projectId}:${k.id}`} titel={k.titel} sub={k.project} rechts={k.dag ? kortDag(k.dag) : null}
          onKies={() => setTaak({ soort: 'kaart', id: k.id, projectId: k.projectId, titel: k.titel })} />
      ))}

      <div style={KOP}>Vandaag</div>
      {(taken || []).length === 0 && <div style={{ fontSize: '0.85rem', color: ZACHT, padding: '8px 0' }}>Geen taken.</div>}
      {(taken || []).map(t => (
        <Regel key={t.id} titel={t.title}
          onKies={() => setTaak({ soort: 'taak', id: t.id, titel: t.title, scheduled_date: t.scheduled_date || null })} />
      ))}
    </div>
  )
}

// plek: 'boven' (gecentreerd boven de bol), 'links' (boven, links uitgelijnd: kleine bol in een balk),
// 'onder-links' / 'onder-rechts' (zijtab).
// Versleepbaar (6 nov 2026): het hele blokje is de greep, behalve de knoppen. Zodra hij versleept
// is staat hij via een portal vast op het scherm (plek in localStorage); dubbelklik = terug.
const PLEK_SLEUTEL = 'gino_timer_plek'
const RAND = 8
const leesPlek = () => {
  try {
    const p = JSON.parse(localStorage.getItem(PLEK_SLEUTEL) || 'null')
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : null
  } catch { return null }
}
// Houd het blokje binnen het venster, met de laatst gemeten maat.
const binnenScherm = (p, maat) => ({
  x: Math.max(RAND, Math.min(p.x, window.innerWidth - maat.w - RAND)),
  y: Math.max(RAND, Math.min(p.y, window.innerHeight - maat.h - RAND)),
})

export function TimerBlok({ timer, plek = 'boven', onAfvinken, onStop }) {
  const { stand, rest, af, gepauzeerd } = timer
  const [bezig, setBezig] = useState(false)
  const [mislukt, setMislukt] = useState(false)
  const [eigenPlek, setEigenPlek] = useState(leesPlek)
  const [, herteken] = useState(0)
  const blokRef = useRef(null)
  const maatRef = useRef({ w: 0, h: 0 })

  // Maat bijhouden (taaknaam, Klaar?-stand) zodat de klem klopt.
  useLayoutEffect(() => {
    const el = blokRef.current
    if (!el) return
    const w = el.offsetWidth, h = el.offsetHeight
    if (w !== maatRef.current.w || h !== maatRef.current.h) {
      maatRef.current = { w, h }
      if (eigenPlek) herteken(n => n + 1)
    }
  }, [eigenPlek, stand, rest, af, mislukt, gepauzeerd])

  // Draaien of venster verkleinen: opnieuw binnen het scherm klemmen.
  useEffect(() => {
    if (!eigenPlek) return
    const opnieuw = () => herteken(n => n + 1)
    window.addEventListener('resize', opnieuw)
    window.addEventListener('orientationchange', opnieuw)
    return () => {
      window.removeEventListener('resize', opnieuw)
      window.removeEventListener('orientationchange', opnieuw)
    }
  }, [eigenPlek])

  if (!stand) return null

  const startSleep = (e) => {
    e.stopPropagation()
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target.closest('button')) return
    const el = blokRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    let sleept = false, laatste = null
    const beweeg = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy
      if (!sleept && Math.hypot(dx, dy) < 5) return
      sleept = true
      ev.preventDefault()
      maatRef.current = { w: r.width, h: r.height }
      laatste = binnenScherm({ x: r.left + dx, y: r.top + dy }, maatRef.current)
      setEigenPlek(laatste)
    }
    const klaar = () => {
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', klaar)
      window.removeEventListener('pointercancel', klaar)
      if (sleept && laatste) {
        try { localStorage.setItem(PLEK_SLEUTEL, JSON.stringify(laatste)) } catch { /* privémodus */ }
      }
    }
    // Op window: blijft werken als het blokje bij de eerste beweging naar de portal verhuist.
    window.addEventListener('pointermove', beweeg, { passive: false })
    window.addEventListener('pointerup', klaar)
    window.addEventListener('pointercancel', klaar)
  }

  const terugNaarStandaard = (e) => {
    if (e.target.closest('button')) return
    setEigenPlek(null)
    try { localStorage.removeItem(PLEK_SLEUTEL) } catch { /* privémodus */ }
  }

  const pct = stand.totaal ? Math.max(0, Math.min(1, rest / stand.totaal)) : 0
  const afvinken = async () => {
    setBezig(true); setMislukt(false)
    const ok = await onAfvinken().then(r => r, () => false)
    setBezig(false)
    if (!ok) setMislukt(true)
  }

  const plekStijl = {
    boven: { bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' },
    links: { bottom: 'calc(100% + 10px)', left: 0 },
    'onder-links': { top: 'calc(100% + 8px)', left: 0 },
    'onder-rechts': { top: 'calc(100% + 8px)', right: 0 },
  }[plek]
  const vast = eigenPlek ? binnenScherm(eigenPlek, maatRef.current) : null

  const blok = (
    <div ref={blokRef} role="timer" aria-label={`${stand.taak.titel}, nog ${klok(rest)}`}
      onPointerDown={startSleep} onDoubleClick={terugNaarStandaard}
      style={{
        ...(vast ? { position: 'fixed', left: vast.x, top: vast.y, zIndex: 61 } : { position: 'absolute', ...plekStijl, zIndex: 8 }),
        width: 'max-content', maxWidth: 'min(440px, calc(100vw - 32px))', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px 0 18px', overflow: 'hidden',
        background: 'rgba(10,10,10,0.94)', borderRadius: 999, boxShadow: '0 10px 32px rgba(0,0,0,0.6)',
        color: WIT, cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
      }}>
      {af ? (
        <>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, flexShrink: 0 }}>{mislukt ? 'Niet gelukt' : 'Klaar?'}</span>
          <span style={{ flex: '0 1 auto', minWidth: 0, marginLeft: 6, fontSize: '0.8rem', fontWeight: 700, color: ZACHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stand.taak.titel}</span>
          <button type="button" disabled={bezig} onClick={afvinken} style={{
            ...TIK, marginLeft: 10, padding: '0 18px', borderRadius: 999, background: GROEN, color: '#000',
            fontSize: '0.85rem', fontWeight: 900, opacity: bezig ? 0.5 : 1,
          }}>Afvinken</button>
          <button type="button" onClick={() => timer.verleng(10)} style={{ ...TIK, padding: '0 10px', fontSize: '0.85rem', fontWeight: 900 }}>+10 min</button>
          <button type="button" onClick={timer.sluit} aria-label="Sluiten" title="Sluiten" style={{ ...TIK, color: ZACHT }}><X size={18} strokeWidth={2.6} /></button>
        </>
      ) : (
        <>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: gepauzeerd ? ZACHT : WIT, flexShrink: 0 }}>{klok(rest)}</span>
          <span style={{ flex: '0 1 auto', minWidth: 0, maxWidth: 220, marginLeft: 8, fontSize: '0.8rem', fontWeight: 700, color: ZACHT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stand.taak.titel}</span>
          <button type="button" onClick={gepauzeerd ? timer.hervat : timer.pauze} aria-label={gepauzeerd ? 'Hervatten' : 'Pauzeren'} title={gepauzeerd ? 'Hervatten' : 'Pauzeren'} style={{ ...TIK, marginLeft: 4 }}>
            {gepauzeerd ? <Play size={18} strokeWidth={2.6} /> : <Pause size={18} strokeWidth={2.6} />}
          </button>
          <button type="button" onClick={onStop} aria-label="Stoppen" title="Stoppen" style={TIK}><Square size={16} strokeWidth={2.8} /></button>
          {/* resterende tijd als dunne groene streep onderaan */}
          <span aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width: `${pct * 100}%`, background: GROEN, opacity: gepauzeerd ? 0.4 : 1, transition: 'width 1s linear' }} />
        </>
      )}
    </div>
  )
  // Versleept: naar body, zodat geen ouder (transform, overflow) de vaste plek verstoort.
  return vast ? createPortal(blok, document.body) : blok
}
