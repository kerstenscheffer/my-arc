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
import { X, Download, ArrowLeftRight, Loader, Crop, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { tekenTransformatie, FORMATEN } from './transformatieKaart'

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

  // Formaat van de kaart en de uitsnede per foto (op foto-id, zodat hij
  // meegaat als je links en rechts omdraait). Standaard staat elke foto
  // passend in zijn vak: heel in beeld, met een vage rand. Eerder werd hij
  // bijgesneden tot hij het smalle vak vulde, en dat zag eruit als inzoomen.
  // Altijd 4:5 (27 okt 2026): de keuze met o.a. 'Instagram' is weg.
  const formaat = '4:5'
  const [uitsnedes, setUitsnedes] = useState({}) // { [fotoId]: { zoom, x, y } }
  const [aanpassen, setAanpassen] = useState(false)
  const uitsnedeVan = (foto) => (foto && uitsnedes[foto.id]) || { zoom: 1, x: 0, y: 0 }
  const zetUitsnede = (foto, patch) => foto && setUitsnedes(u => ({ ...u, [foto.id]: { ...uitsnedeVan(foto), ...patch } }))

  // Gewicht op de dag van de foto (27 okt 2026): uit dezelfde weeglogs als
  // de Tracking-pagina. Geen weging die dag? De dichtstbijzijnde binnen een
  // week. Met de kg-knop staat het ook op de afbeelding (onthouden).
  const [wegingen, setWegingen] = useState([])
  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    db.supabase.from('weight_challenge_logs').select('date, weight').eq('client_id', client.id).order('date')
      .then(r => { if (!weg) setWegingen((r?.data || []).filter(w => Number(w.weight) > 0)) }, () => {})
    return () => { weg = true }
  }, [db, client?.id])
  const gewichtOp = (foto) => {
    const d = String(foto?.photo_date || '').slice(0, 10)
    if (!d || !wegingen.length) return null
    const t = new Date(`${d}T12:00:00`).getTime()
    let beste = null
    wegingen.forEach(w => {
      const af = Math.abs(new Date(`${w.date}T12:00:00`).getTime() - t) / 864e5
      if (af <= 7 && (!beste || af < beste.af)) beste = { af, kg: Number(w.weight) }
    })
    return beste ? beste.kg : null
  }
  const [toonGewicht, setToonGewichtRuw] = useState(() => { try { return localStorage.getItem('myarc_vergelijk_kg') === '1' } catch { return false } })
  const setToonGewicht = (v) => { setToonGewichtRuw(v); try { localStorage.setItem('myarc_vergelijk_kg', v ? '1' : '0') } catch { /* geen opslag */ } }
  const kgLinks = gewichtOp(left), kgRechts = gewichtOp(right)
  const kgTekst = (v) => v == null ? '—' : `${String(Math.round(v * 10) / 10).replace('.', ',')} kg`

  // Het resultaat tekenen zodra de keuze verandert.
  const canvasRef = useRef(null)
  const [beeld, setBeeld] = useState('laden') // laden | klaar | fout
  const getekendRef = useRef('')
  useEffect(() => {
    if (!left || !right || left.id === right.id || !canvasRef.current) return
    let weg = false
    // Alleen "Laden…" als er andere foto's komen; bij slepen en zoomen blijft
    // het vorige beeld staan tot het nieuwe er is.
    const sleutel = `${left.id}|${right.id}`
    if (getekendRef.current !== sleutel) setBeeld('laden')
    ;(async () => {
      try {
        const klaar = await tekenTransformatie(canvasRef.current, left, right, {
          startDatum, afgebroken: () => weg, formaat,
          uitsnede: { links: uitsnedeVan(left), rechts: uitsnedeVan(right) },
          gewichten: toonGewicht ? { links: kgLinks, rechts: kgRechts } : null,
        })
        if (klaar && !weg) { getekendRef.current = sleutel; setBeeld('klaar') }
      } catch (e) {
        console.error('Vergelijking tekenen mislukt:', e)
        if (!weg) setBeeld('fout')
      }
    })()
    return () => { weg = true }
  }, [left?.id, right?.id, left?.photo_url, right?.photo_url, startDatum, formaat, JSON.stringify(uitsnedes), toonGewicht, kgLinks, kgRechts]) // eslint-disable-line

  // Slepen in het voorbeeld schuift de foto in de helft waar je begon;
  // scrollen (of de schuif eronder) zoomt.
  // Twee vingers = knijpen om te zoomen in de helft waar je knijpt; de
  // schuifbalken eronder zijn daarmee weg (27 okt 2026).
  const sleepRef = useRef(null)
  const vingers = useRef(new Map())
  const knijpRef = useRef(null)
  const kantOnder = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return (e.clientX - r.left) < r.width / 2 ? left : right
  }
  const afstand = () => {
    const [a, b] = [...vingers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  const sleepStart = (e) => {
    if (!aanpassen || !canvasRef.current) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    vingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (vingers.current.size === 2) {
      const [a, b] = [...vingers.current.values()]
      const foto = kantOnder({ clientX: (a.x + b.x) / 2 })
      knijpRef.current = { foto, d: afstand() || 1, zoom: uitsnedeVan(foto).zoom }
      sleepRef.current = null
      return
    }
    if (vingers.current.size > 2) return
    const foto = kantOnder(e)
    const r = canvasRef.current.getBoundingClientRect()
    sleepRef.current = { foto, x: e.clientX, y: e.clientY, b: r.width / 2, h: r.height, start: uitsnedeVan(foto) }
  }
  const sleepBeweeg = (e) => {
    if (vingers.current.has(e.pointerId)) vingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const kn = knijpRef.current
    if (kn) {
      const z = kn.zoom * (afstand() / kn.d)
      zetUitsnede(kn.foto, { zoom: Math.max(1, Math.min(4, z)) })
      return
    }
    const sl = sleepRef.current
    if (!sl) return
    const nx = sl.start.x + (e.clientX - sl.x) / sl.b
    const ny = sl.start.y + (e.clientY - sl.y) / sl.h
    zetUitsnede(sl.foto, { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) })
  }
  const sleepEind = (e) => {
    vingers.current.delete(e?.pointerId)
    if (vingers.current.size < 2) knijpRef.current = null
    sleepRef.current = null
  }
  const wiel = (e) => {
    if (!aanpassen || !canvasRef.current) return
    e.preventDefault()
    const foto = kantOnder(e)
    const z = uitsnedeVan(foto).zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06)
    zetUitsnede(foto, { zoom: Math.max(1, Math.min(4, z)) })
  }
  // Wiel-listener niet-passief, anders mag preventDefault niet en scrollt de pagina mee.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return undefined
    el.addEventListener('wheel', wiel, { passive: false })
    return () => el.removeEventListener('wheel', wiel)
  })

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

  // Per kant één regel: ‹ datum ›. Tik op de datum = direct springen (de
  // keuzelijst ligt onzichtbaar over de datum heen).
  const labelVan = (p, i) => `${fmtDate(p.photo_date)}${forAngle.filter(x => x.photo_date === p.photo_date).length > 1 ? ` (#${forAngle.filter((x, j) => x.photo_date === p.photo_date && j <= i).length})` : ''}`
  const DatumStap = ({ label, value, onChange, kg }) => {
    const idx = Math.max(0, forAngle.findIndex(p => p.id === value))
    const pijl = (uit) => ({
      width: 30, height: 30, padding: 0, background: 'none', border: 'none', color: '#fff', opacity: uit ? 0.25 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uit ? 'default' : 'pointer', flexShrink: 0,
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    })
    return (
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <button onClick={() => idx > 0 && onChange(forAngle[idx - 1].id)} disabled={idx <= 0} aria-label="Eerdere foto" style={pijl(idx <= 0)}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <span style={{ fontSize: m ? '0.88rem' : '0.92rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>{forAngle[idx] ? labelVan(forAngle[idx], idx) : '—'}</span>
            <select value={value || ''} onChange={e => onChange(e.target.value)} aria-label={`${label} kiezen`}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}>
              {forAngle.map((p, i) => <option key={p.id} value={p.id}>{labelVan(p, i)}</option>)}
            </select>
          </div>
          <button onClick={() => idx < forAngle.length - 1 && onChange(forAngle[idx + 1].id)} disabled={idx >= forAngle.length - 1} aria-label="Latere foto" style={pijl(idx >= forAngle.length - 1)}><ChevronRight size={18} strokeWidth={2.8} /></button>
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: kg == null ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)', marginTop: 1 }}>{kgTekst(kg)}</div>
      </div>
    )
  }

  const knop = (vol) => ({
    height: 44, padding: '0 0.9rem', borderRadius: 12,
    background: vol ? '#fff' : 'rgba(255,255,255,0.07)',
    border: 'none',
    color: vol ? '#0a0a0a' : '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
  })

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10600, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' }}>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 760, width: '100%', margin: '0 auto', background: '#0a0a0a' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? 'calc(0.75rem + env(safe-area-inset-top, 0px)) 0.9rem 0.75rem' : '0.9rem 1.25rem', flexShrink: 0 }}>
          <span style={{ flex: 1, fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Vergelijk foto's</span>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 40, height: 40, padding: 0, background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={22} strokeWidth={2.4} /></button>
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
                    background: on ? '#fff' : 'transparent', border: 'none',
                    borderRadius: 999, color: on ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
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
                <div style={{ position: 'relative', width: '100%', aspectRatio: `${FORMATEN[formaat].W} / ${FORMATEN[formaat].H}`, maxHeight: formaat === '9:16' ? '70vh' : undefined, margin: '0 auto', borderRadius: 14, overflow: 'hidden', background: '#000', border: aanpassen ? '1px solid rgba(255,255,255,0.5)' : 'none' }}>
                  <canvas ref={canvasRef}
                    onPointerDown={sleepStart} onPointerMove={sleepBeweeg} onPointerUp={sleepEind} onPointerCancel={sleepEind}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: beeld === 'klaar' ? 'block' : 'none', cursor: aanpassen ? 'grab' : 'default', touchAction: aanpassen ? 'none' : 'auto' }} />
                  {aanpassen && beeld === 'klaar' && (
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  )}
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
                {/* Voor en na: per kant ‹ datum ›, onder de eigen helft. */}
                <div style={{ display: 'flex', gap: 8, marginTop: '0.8rem' }}>
                  <DatumStap label="Voor" value={leftId} onChange={setLeftId} kg={kgLinks} />
                  <DatumStap label="Na" value={rightId} onChange={setRightId} kg={kgRechts} />
                </div>
                {kgLinks != null && kgRechts != null && (() => {
                  const v = Math.round((kgRechts - kgLinks) * 10) / 10
                  return (
                    <div style={{ textAlign: 'center', marginTop: 6, fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
                      {v > 0 ? '+' : v < 0 ? '−' : ''}{String(Math.abs(v)).replace('.', ',')} kg
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>verschil</span>
                    </div>
                  )
                })()}

                {/* Acties: wissel en bewerk als icoon, download als hoofdknop. */}
                <div style={{ display: 'flex', gap: 8, marginTop: '0.9rem' }}>
                  <button onClick={wissel} aria-label="Voor en na omdraaien" title="Voor en na omdraaien" style={{ ...knop(false), width: 44, padding: 0, justifyContent: 'center' }}><ArrowLeftRight size={18} strokeWidth={2.6} /></button>
                  <button onClick={() => setAanpassen(v => !v)} aria-label="Bewerken" title="Uitsnede en hoek" style={{ ...knop(aanpassen), width: 44, padding: 0, justifyContent: 'center' }}><Crop size={18} strokeWidth={2.6} /></button>
                  <button onClick={() => setToonGewicht(!toonGewicht)} aria-label="Gewicht op de foto" title="Gewicht op de foto aan/uit" style={{ ...knop(toonGewicht), width: 44, padding: 0, justifyContent: 'center', fontSize: '0.8rem' }}>kg</button>
                  <button onClick={download} disabled={bezig} style={{ ...knop(true), flex: 1, justifyContent: 'center', opacity: bezig ? 0.6 : 1 }}>
                    <Download size={17} strokeWidth={2.8} />{bezig ? 'Bezig…' : 'Download'}
                  </button>
                </div>

                {/* Bewerken: uitsnede per foto en, als de foto verkeerd staat, de hoek. */}
                {aanpassen && left && right && (
                  <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
                      Sleep om te verschuiven · {m ? 'knijp met twee vingers' : 'scroll'} om te zoomen
                    </div>
                    {/* Hoek per foto, voor een foto die bij het uploaden verkeerd is gezet. */}
                    <div style={{ display: 'flex', gap: 8 }}>
                    {[{ label: 'Voor', foto: left }, { label: 'Na', foto: right }].map(({ label, foto }) => (
                      <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                        <select value={angleOf(foto)} onChange={e => zetHoek(foto, e.target.value)} title="Hoek van deze foto"
                          style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, padding: '0.35rem 0.4rem', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }}>
                          {['front', 'back', 'side'].map(a => <option key={a} value={a}>{angleLabel(a)}</option>)}
                          {!['front', 'back', 'side'].includes(angleOf(foto)) && <option value={angleOf(foto)}>{angleLabel(angleOf(foto))}</option>}
                        </select>
                      </div>
                    ))}
                    </div>
                    <button onClick={() => setUitsnedes(u => { const n = { ...u }; delete n[left.id]; delete n[right.id]; return n })}
                      style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RotateCcw size={14} strokeWidth={2.6} /> Terug naar passend
                    </button>
                  </div>
                )}
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
