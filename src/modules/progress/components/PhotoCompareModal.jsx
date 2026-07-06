// src/modules/progress/components/PhotoCompareModal.jsx
// Vergelijk-modal: toont automatisch de eerste en laatste foto van een hoek
// naast elkaar (VOOR/NA). Filter op hoek (front/side/back/...) + kies zelf
// welke datum links en rechts.

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight } from 'lucide-react'

const GOLD = '#FFD700'
const angleOf = (p) => (p?.metadata?.subtype || 'overig')
// Nette label per hoek (val terug op de ruwe waarde)
const ANGLE_LABEL = { front: 'Voorkant', side: 'Zijkant', back: 'Achterkant', overig: 'Overig' }
const angleLabel = (a) => ANGLE_LABEL[a] || (a.charAt(0).toUpperCase() + a.slice(1))
const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export default function PhotoCompareModal({ db, client, isMobile, onClose }) {
  const m = isMobile
  const [photos, setPhotos] = useState(null) // null = laden
  const [angle, setAngle] = useState(null)
  const [leftId, setLeftId] = useState(null)
  const [rightId, setRightId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('ch8_progress_photos')
          .select('id, photo_url, photo_date, created_at, metadata')
          .eq('client_id', client.id)
          .order('created_at', { ascending: true })
        if (cancelled) return
        const progress = (data || []).filter(p => (p.metadata?.category || 'progress') === 'progress' && p.photo_url)
        setPhotos(progress)
      } catch (e) { console.error('compare load failed', e); if (!cancelled) setPhotos([]) }
    })()
    return () => { cancelled = true }
  }, [db, client?.id])

  // Beschikbare hoeken (front eerst)
  const angles = useMemo(() => {
    if (!photos) return []
    const set = [...new Set(photos.map(angleOf))]
    return set.sort((a, b) => (a === 'front' ? -1 : b === 'front' ? 1 : a.localeCompare(b)))
  }, [photos])

  // Default hoek + selectie zodra de foto's binnen zijn / hoek wisselt
  useEffect(() => {
    if (!photos || angles.length === 0) return
    if (!angle || !angles.includes(angle)) setAngle(angles[0])
  }, [photos, angles]) // eslint-disable-line

  const forAngle = useMemo(
    () => (photos || []).filter(p => angleOf(p) === angle),
    [photos, angle]
  )

  // Bij hoek-wissel: reset naar eerste (voor) en laatste (na)
  useEffect(() => {
    if (forAngle.length === 0) { setLeftId(null); setRightId(null); return }
    setLeftId(forAngle[0].id)
    setRightId(forAngle[forAngle.length - 1].id)
  }, [angle, forAngle.length]) // eslint-disable-line

  const left = forAngle.find(p => p.id === leftId) || forAngle[0] || null
  const right = forAngle.find(p => p.id === rightId) || forAngle[forAngle.length - 1] || null

  const selectStyle = {
    width: '100%', boxSizing: 'border-box', marginTop: '0.4rem',
    padding: m ? '0.45rem 0.5rem' : '0.5rem 0.6rem',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: 8, color: '#fff', fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 700,
    fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
  }

  const Side = ({ label, photo, value, onChange }) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.08)' }}>
        {photo ? (
          <img src={photo.photo_url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>Geen foto</div>
        )}
        <span style={{ position: 'absolute', top: 8, left: 8, background: label === 'VOOR' ? 'rgba(0,0,0,0.7)' : GOLD, color: label === 'VOOR' ? '#fff' : '#000', fontSize: m ? '0.6rem' : '0.66rem', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: 6, letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {forAngle.map((p, i) => (
          <option key={p.id} value={p.id} style={{ background: '#111' }}>
            {fmtDate(p.photo_date)}{forAngle.filter(x => x.photo_date === p.photo_date).length > 1 ? ` (#${forAngle.filter((x, j) => x.photo_date === p.photo_date && j <= i).length})` : ''}
          </option>
        ))}
      </select>
    </div>
  )

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 760, width: '100%', margin: '0 auto', background: '#0a0a0a' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.75rem 0.9rem' : '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }}>
          <span style={{ fontSize: m ? '1rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Vergelijk foto's</span>
          <button onClick={onClose} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}><X size={17} /></button>
        </div>

        {photos === null ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Laden…</div>
        ) : angles.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', padding: '2rem' }}>Nog geen progressie-foto's om te vergelijken.</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: m ? '0.9rem' : '1.1rem 1.25rem' }}>

            {/* Hoek-filter */}
            <div style={{ fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Hoek</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.1rem' }}>
              {angles.map(a => {
                const on = a === angle
                const count = (photos || []).filter(p => angleOf(p) === a).length
                return (
                  <button key={a} onClick={() => setAngle(a)} style={{
                    padding: m ? '0.5rem 0.8rem' : '0.55rem 0.9rem',
                    background: on ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 999, color: on ? GOLD : 'rgba(255,255,255,0.7)',
                    fontSize: m ? '0.78rem' : '0.82rem', fontWeight: 800,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{angleLabel(a)} <span style={{ opacity: 0.6 }}>{count}</span></button>
                )
              })}
            </div>

            {forAngle.length < 2 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600 }}>
                Van deze hoek is er maar {forAngle.length} foto. Je hebt er minstens 2 nodig om te vergelijken.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: m ? '0.4rem' : '0.7rem' }}>
                <Side label="VOOR" photo={left} value={leftId} onChange={setLeftId} />
                <ArrowRight size={m ? 16 : 20} color="rgba(255,215,0,0.5)" style={{ flexShrink: 0 }} />
                <Side label="NA" photo={right} value={rightId} onChange={setRightId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
