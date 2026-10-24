// src/modules/progress/components/PhotoCompareModal.jsx
//
// Twee progressiefoto's naast elkaar: automatisch de eerste en laatste van een
// hoek (voorkant naast voorkant), met een hoekfilter en per kant een
// datumkeuze. Gedeeld door de klant (tracking-pagina) en de coach
// (coach insight), zodat allebei hetzelfde zien.
//
// Bovenaan staat meteen het eindresultaat: dezelfde transformatiekaart als op
// de tracking-pagina (4:5, MA-COACHING-logo met fade, "Maand X"-labels),
// getekend uit de twee gekozen foto's. Download slaat precies dat plaatje op,
// klaar om te delen. Lukt het tekenen niet (CORS), dan openen we de twee
// foto's los in nieuwe tabbladen in plaats van stil te falen.

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Download, ArrowLeftRight, Loader } from 'lucide-react'
import { tekenTransformatie } from './transformatieKaart'

const angleOf = (p) => (p?.metadata?.subtype || 'overig')
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

  // "Maand 1" = de eerste progressiefoto van de klant, welke hoek dan ook.
  const startDatum = useMemo(() => {
    const d = (photos || []).map(p => p.photo_date).filter(Boolean).sort()[0]
    return d || null
  }, [photos])

  // Het resultaat tekenen zodra de keuze verandert.
  const canvasRef = useRef(null)
  const [beeld, setBeeld] = useState('laden') // laden | klaar | fout
  useEffect(() => {
    if (!left || !right || left.id === right.id || !canvasRef.current) return
    let weg = false
    setBeeld('laden')
    ;(async () => {
      try {
        const klaar = await tekenTransformatie(canvasRef.current, left, right, { startDatum, afgebroken: () => weg })
        if (klaar && !weg) setBeeld('klaar')
      } catch (e) {
        console.error('Vergelijking tekenen mislukt:', e)
        if (!weg) setBeeld('fout')
      }
    })()
    return () => { weg = true }
  }, [left?.id, right?.id, left?.photo_url, right?.photo_url, startDatum]) // eslint-disable-line

  // Hoek van een foto verzetten. Klanten kiezen bij het uploaden nog wel eens
  // de verkeerde kant; dan staat een zijkant tussen de voorkanten. De foto
  // verhuist naar de gekozen hoek, en je blijft op de huidige hoek kijken.
  const [hoekFout, setHoekFout] = useState(null)
  const zetHoek = async (foto, nieuw) => {
    if (!foto || nieuw === angleOf(foto)) return
    const vorige = photos
    const metadata = { ...(foto.metadata || {}), subtype: nieuw }
    setHoekFout(null)
    setPhotos(ps => ps.map(p => (p.id === foto.id ? { ...p, metadata } : p)))
    const { data, error } = await db.supabase
      .from('ch8_progress_photos').update({ metadata }).eq('id', foto.id).select('id')
    if (error || !data?.length) {
      console.error('Hoek wijzigen mislukt:', error)
      setPhotos(vorige)
      setHoekFout('Hoek wijzigen lukte niet. Probeer het opnieuw.')
    }
  }

  // Het getekende resultaat bewaren als PNG.
  const download = async () => {
    if (!left || !right || bezig) return
    setBezig(true)
    const naam = `${(client?.first_name || 'client')}-${angle}-${(left.photo_date || '').slice(0, 10)}-vs-${(right.photo_date || '').slice(0, 10)}`.replace(/[^\w.-]+/g, '-').toLowerCase()
    try {
      if (beeld !== 'klaar') throw new Error('nog niet getekend')
      const url = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url; link.download = `myarc-transformatie-${naam}.png`
      document.body.appendChild(link); link.click(); link.remove()
    } catch (e) {
      // Meestal CORS op de foto-URL. Dan los openen, zodat er altijd iets gebeurt.
      console.error('Vergelijking opslaan mislukt, open los:', e)
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

  // Per kant: datum kiezen, en de hoek verzetten als de klant bij het
  // uploaden de verkeerde kant koos.
  const Keuze = ({ label, photo, value, onChange }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: m ? '0.66rem' : '0.7rem', fontWeight: 900, letterSpacing: '0.08em', color: '#fff' }}>{label}</span>
        {photo && (
          <select
            value={angleOf(photo)}
            onChange={e => zetHoek(photo, e.target.value)}
            title="Hoek van deze foto wijzigen"
            style={{
              marginLeft: 'auto', maxWidth: '60%', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
              fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 800, padding: '0.15rem 0.3rem',
              fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
            }}
          >
            {['front', 'back', 'side'].map(a => (
              <option key={a} value={a} style={{ background: '#111' }}>{angleLabel(a)}</option>
            ))}
            {!['front', 'back', 'side'].includes(angleOf(photo)) && (
              <option value={angleOf(photo)} style={{ background: '#111' }}>{angleLabel(angleOf(photo))}</option>
            )}
          </select>
        )}
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

            {hoekFout && (
              <div style={{ marginBottom: '0.75rem', color: '#ef4444', fontSize: '0.78rem', fontWeight: 800 }}>{hoekFout}</div>
            )}

            {forAngle.length < 2 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600 }}>
                Van deze hoek is er maar {forAngle.length} foto. Je hebt er minstens 2 nodig om te vergelijken.
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                {/* Het eindresultaat, zoals het gedownload wordt. */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', borderRadius: 14, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: beeld === 'klaar' ? 'block' : 'none' }} />
                  {left?.id === right?.id ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 700 }}>Kies links en rechts een andere foto.</div>
                  ) : beeld === 'laden' ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Laden…
                    </div>
                  ) : beeld === 'fout' ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 700 }}>Voorbeeld lukt niet. Download opent de twee foto's los.</div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: m ? '0.6rem' : '0.8rem', marginTop: '0.8rem' }}>
                  <Keuze label="VOOR" photo={left} value={leftId} onChange={setLeftId} />
                  <Keuze label="NA" photo={right} value={rightId} onChange={setRightId} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
