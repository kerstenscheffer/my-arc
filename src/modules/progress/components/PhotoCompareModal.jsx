// src/modules/progress/components/PhotoCompareModal.jsx
//
// Twee progressiefoto's naast elkaar: automatisch de eerste en laatste van een
// hoek (voorkant naast voorkant), met een hoekfilter en per kant een
// datumkeuze. Gedeeld door de klant (tracking-pagina) en de coach
// (coach insight), zodat allebei hetzelfde zien.
//
// Downloaden tekent de vergelijking op een canvas — twee foto's, de hoek en
// de datums erbij — en slaat dat op als één JPG. Geen html2canvas: dat
// struikelt over externe foto's; met crossOrigin op de Image-elementen werkt
// Supabase-storage gewoon. Lukt het tekenen niet (CORS), dan openen we de
// twee foto's los in nieuwe tabbladen in plaats van stil te falen.

import React, { useState, useEffect, useMemo } from 'react'
import { fotoWeergaveUrl } from '../fotoWeergave'
import { createPortal } from 'react-dom'
import { X, ArrowRight, Download, ArrowLeftRight } from 'lucide-react'

const angleOf = (p) => (p?.metadata?.subtype || 'overig')
const ANGLE_LABEL = { front: 'Voorkant', side: 'Zijkant', back: 'Achterkant', overig: 'Overig' }
const angleLabel = (a) => ANGLE_LABEL[a] || (a.charAt(0).toUpperCase() + a.slice(1))
const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const laadAfbeelding = (url) => new Promise((ok, nee) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => ok(img)
  img.onerror = nee
  img.src = url
})

export default function PhotoCompareModal({ db, client, isMobile, onClose }) {
  const m = isMobile
  const [photos, setPhotos] = useState(null) // null = laden
  const [angle, setAngle] = useState(null)
  const [leftId, setLeftId] = useState(null)
  const [rightId, setRightId] = useState(null)
  const [bezig, setBezig] = useState(false)

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

  // Beschikbare hoeken, voorkant eerst.
  const angles = useMemo(() => {
    if (!photos) return []
    const set = [...new Set(photos.map(angleOf))]
    return set.sort((a, b) => (a === 'front' ? -1 : b === 'front' ? 1 : a.localeCompare(b)))
  }, [photos])

  useEffect(() => {
    if (!photos || angles.length === 0) return
    if (!angle || !angles.includes(angle)) setAngle(angles[0])
  }, [photos, angles]) // eslint-disable-line

  const forAngle = useMemo(() => (photos || []).filter(p => angleOf(p) === angle), [photos, angle])

  // Hoek gewisseld: eerste (voor) en laatste (na) van die hoek.
  useEffect(() => {
    if (forAngle.length === 0) { setLeftId(null); setRightId(null); return }
    setLeftId(forAngle[0].id)
    setRightId(forAngle[forAngle.length - 1].id)
  }, [angle, forAngle.length]) // eslint-disable-line

  const left = forAngle.find(p => p.id === leftId) || forAngle[0] || null
  const right = forAngle.find(p => p.id === rightId) || forAngle[forAngle.length - 1] || null

  const wissel = () => { const l = leftId; setLeftId(rightId); setRightId(l) }

  // De vergelijking als één afbeelding bewaren.
  const download = async () => {
    if (!left || !right || bezig) return
    setBezig(true)
    const naam = `${(client?.first_name || 'client')}-${angle}-${(left.photo_date || '').slice(0, 10)}-vs-${(right.photo_date || '').slice(0, 10)}`.replace(/[^\w.-]+/g, '-').toLowerCase()
    try {
      const [a, b] = await Promise.all([laadAfbeelding(left.photo_url), laadAfbeelding(right.photo_url)])
      const H = 1600, W = 1200, KOP = 120, GAP = 24
      const c = document.createElement('canvas')
      c.width = W * 2 + GAP
      c.height = H + KOP
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, c.width, c.height)
      // Foto's: cover-crop in een 3:4-vak, zodat ze gelijk uitgelijnd staan.
      const teken = (img, x) => {
        const s = Math.max(W / img.width, H / img.height)
        const w = img.width * s, h = img.height * s
        ctx.drawImage(img, x + (W - w) / 2, KOP + (H - h) / 2, w, h)
      }
      ctx.save(); ctx.beginPath(); ctx.rect(0, KOP, W, H); ctx.clip(); teken(a, 0); ctx.restore()
      ctx.save(); ctx.beginPath(); ctx.rect(W + GAP, KOP, W, H); ctx.clip(); teken(b, W + GAP); ctx.restore()
      // Kop: hoek links, datums per kant.
      ctx.fillStyle = '#ffffff'
      ctx.font = '900 44px -apple-system, Helvetica, Arial, sans-serif'
      ctx.fillText(`${angleLabel(angle)}`, 32, 56)
      ctx.font = '800 34px -apple-system, Helvetica, Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(`VOOR · ${fmtDate(left.photo_date)}`, 32, 100)
      ctx.fillText(`NA · ${fmtDate(right.photo_date)}`, W + GAP + 32, 100)
      ctx.font = '700 28px -apple-system, Helvetica, Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      const merk = 'MY ARC'
      ctx.fillText(merk, c.width - 32 - ctx.measureText(merk).width, 56)

      const url = c.toDataURL('image/jpeg', 0.9)
      const link = document.createElement('a')
      link.href = url; link.download = `myarc-vergelijking-${naam}.jpg`
      document.body.appendChild(link); link.click(); link.remove()
    } catch (e) {
      // Meestal CORS op de foto-URL. Dan los openen, zodat er altijd iets gebeurt.
      console.error('Vergelijking tekenen mislukt, open los:', e)
      window.open(left.photo_url, '_blank'); window.open(right.photo_url, '_blank')
    } finally { setBezig(false) }
  }

  const selectStyle = {
    width: '100%', boxSizing: 'border-box', marginTop: '0.45rem',
    padding: m ? '0.5rem 0.6rem' : '0.55rem 0.7rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 10, color: '#fff', fontSize: m ? '0.76rem' : '0.8rem', fontWeight: 800,
    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
  }

  const Side = ({ label, photo, value, onChange }) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
        {photo ? (
          <img src={fotoWeergaveUrl(photo.photo_url, { breedte: 900, kwaliteit: 85 })} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>Geen foto</div>
        )}
        <span style={{ position: 'absolute', top: 8, left: 8, background: label === 'VOOR' ? 'rgba(0,0,0,0.7)' : '#fff', color: label === 'VOOR' ? '#fff' : '#0a0a0a', fontSize: m ? '0.6rem' : '0.66rem', fontWeight: 900, padding: '0.18rem 0.5rem', borderRadius: 6, letterSpacing: '0.08em' }}>{label}</span>
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

  const knop = (vol) => ({
    height: 40, padding: '0 0.85rem', borderRadius: 10,
    background: vol ? '#fff' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${vol ? '#fff' : 'rgba(255,255,255,0.14)'}`,
    color: vol ? '#0a0a0a' : '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
  })

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10600, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 760, width: '100%', margin: '0 auto', background: '#0a0a0a' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? 'calc(0.75rem + env(safe-area-inset-top, 0px)) 0.9rem 0.75rem' : '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <span style={{ flex: 1, fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Vergelijk foto's</span>
          {left && right && (
            <>
              <button onClick={wissel} title="Links en rechts omdraaien" style={knop(false)}><ArrowLeftRight size={15} strokeWidth={2.6} />{!m && 'Wissel'}</button>
              <button onClick={download} disabled={bezig} title="Vergelijking opslaan als afbeelding" style={{ ...knop(true), opacity: bezig ? 0.6 : 1 }}><Download size={15} strokeWidth={2.6} />{bezig ? 'Bezig…' : 'Download'}</button>
            </>
          )}
          <button onClick={onClose} aria-label="Sluiten" style={{ ...knop(false), width: 40, padding: 0, justifyContent: 'center' }}><X size={17} /></button>
        </div>

        {photos === null ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>Laden…</div>
        ) : angles.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', padding: '2rem' }}>Nog geen progressiefoto's om te vergelijken.</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: m ? '0.9rem' : '1.1rem 1.25rem' }}>

            {/* Hoek: voorkant naast voorkant, nooit door elkaar. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {angles.map(a => {
                const on = a === angle
                const count = (photos || []).filter(p => angleOf(p) === a).length
                return (
                  <button key={a} onClick={() => setAngle(a)} style={{
                    padding: m ? '0.5rem 0.85rem' : '0.55rem 0.95rem',
                    background: on ? '#fff' : 'transparent',
                    border: `1px solid ${on ? '#fff' : 'rgba(255,255,255,0.18)'}`,
                    borderRadius: 999, color: on ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                    fontSize: m ? '0.78rem' : '0.82rem', fontWeight: 900, fontFamily: 'inherit',
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{angleLabel(a)} <span style={{ opacity: 0.55 }}>{count}</span></button>
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
                <ArrowRight size={m ? 16 : 20} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
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
