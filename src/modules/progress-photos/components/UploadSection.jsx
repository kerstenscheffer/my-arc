// src/modules/progress-photos/components/UploadSection.jsx
// v3.0 - ONLY PROGRESS TYPE - No type selector needed
// Props IDENTIEK: { onUpload, todayData, isFriday, isMobile }

import React, { useState, useRef } from 'react'
import { Camera, Upload, PersonStanding, BicepsFlexed, Check, Plus } from 'lucide-react'
import { fotoWeergaveUrl } from '../../progress/fotoWeergave'

// De vijf foto's van een fotomoment. flex_f / flex_b = aangespannen voor en
// achter (bewust zonder 'front'/'back' in de naam: oudere schermen zoeken op
// die woorden en zouden ze anders bij de gewone foto's voegen).
const VAKKEN = [
  { hoek: 'front', label: 'Voor', Icoon: PersonStanding },
  { hoek: 'flex_f', label: 'Voor flex', Icoon: BicepsFlexed },
  { hoek: 'side', label: 'Zij', Icoon: PersonStanding },
  { hoek: 'back', label: 'Achter', Icoon: PersonStanding },
  { hoek: 'flex_b', label: 'Achter flex', Icoon: BicepsFlexed },
]
const lokaal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// `naast`: een knop naast Upload op dezelfde regel (Vergelijk, 27 okt 2026).
export default function UploadSection({ photos = [], onUpload, todayData = {}, isFriday = false, isMobile = false, naast = null }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { hasCompleteFriday = false } = todayData

  // Fotovakken: wat er deze week (ma t/m zo) al per hoek is ingeleverd.
  const vakInput = useRef(null)
  const vakHoek = useRef(null)
  const [vakBezig, setVakBezig] = useState(null)
  const nu = new Date()
  const maandag = new Date(nu); maandag.setDate(nu.getDate() - ((nu.getDay() + 6) % 7))
  const vanaf = lokaal(maandag)
  const dezeWeek = {}
  ;[...photos].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''))).forEach(p => {
    if (!p.photo_url || String(p.photo_date || '').slice(0, 10) < vanaf) return
    if ((p.metadata?.category || 'progress') !== 'progress') return
    dezeWeek[String(p.metadata?.subtype || p.photo_type || '').toLowerCase()] = p // de nieuwste wint
  })
  const kiesVak = (hoek) => { if (vakBezig) return; vakHoek.current = hoek; vakInput.current?.click() }
  const vakGekozen = async (event) => {
    const file = event.target.files?.[0]
    const hoek = vakHoek.current
    if (!file || !hoek) return
    setVakBezig(hoek)
    try { await onUpload(file, 'progress', hoek) } catch (e) { console.error('Upload failed:', e) }
    finally { setVakBezig(null); if (vakInput.current) vakInput.current.value = '' }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file, 'progress')
      fileInputRef.current.value = ''
    } catch (e) { console.error('Upload failed:', e) }
    finally { setUploading(false) }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* ── Friday banner — only when relevant ── */}
      {isFriday && !hasCompleteFriday && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Camera size={12} color="#fff" style={{ opacity: 0.6 }} />
          <span style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '900',
            color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.03em'
          }}>
            Vrijdag — Upload je progress foto's
          </span>
        </div>
      )}

      {/* ── Fotovakken: tik op een vak om die foto te maken of te kiezen ── */}
      <input ref={vakInput} type="file" accept="image/*" onChange={vakGekozen} style={{ display: 'none' }} />
      <div style={{ padding: isMobile ? '0.75rem 1rem 0' : '0.85rem 1.5rem 0' }}>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Foto's van deze week
          <span style={{ marginLeft: 8, fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>
            {VAKKEN.filter(v => dezeWeek[v.hoek]).length}/{VAKKEN.length}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: isMobile ? 6 : 10 }}>
          {VAKKEN.map((vak) => {
            const foto = dezeWeek[vak.hoek]
            const bezig = vakBezig === vak.hoek
            const VakIcoon = vak.Icoon
            return (
              <button key={vak.hoek} type="button" onClick={() => kiesVak(vak.hoek)} disabled={!!vakBezig}
                aria-label={`${vak.label}: ${foto ? 'andere foto kiezen' : 'foto uploaden'}`}
                style={{
                  position: 'relative', aspectRatio: '3 / 4', padding: 0, overflow: 'hidden', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', fontFamily: 'inherit',
                  cursor: vakBezig ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                {foto && <img src={fotoWeergaveUrl(foto.photo_url, { breedte: 300 })} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                {foto && <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)' }} />}
                {bezig ? (
                  <span style={{ position: 'relative', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : !foto && (
                  <span style={{ position: 'relative', display: 'flex', color: 'rgba(255,255,255,0.55)' }}>
                    <VakIcoon size={isMobile ? 22 : 28} strokeWidth={2.2} />
                    <Plus size={11} strokeWidth={3.4} style={{ position: 'absolute', right: -9, top: -4 }} />
                  </span>
                )}
                {foto && !bezig && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#10b981', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} strokeWidth={3.6} />
                  </span>
                )}
                <span style={{ position: foto ? 'absolute' : 'relative', left: 0, right: 0, bottom: foto ? 4 : 'auto', textAlign: 'center', fontSize: isMobile ? '0.6rem' : '0.72rem', fontWeight: 900, color: foto ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.1, padding: '0 2px', textShadow: foto ? '0 1px 4px rgba(0,0,0,0.9)' : 'none' }}>
                  {vak.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── UPLOAD KNOP — vol wit vlak, zwarte tekst ── */}
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.5rem', display: 'flex', gap: 8 }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, minWidth: 0,
            background: uploading ? 'rgba(255,255,255,0.2)' : '#fff',
            border: 'none', borderRadius: 12,
            padding: isMobile ? '0.8rem' : '0.9rem',
            color: uploading ? '#fff' : '#0a0a0a',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.45rem',
            minHeight: '48px',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={(e) => { if (!uploading && isMobile) e.currentTarget.style.filter = 'brightness(0.92)' }}
          onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.filter = 'none' }}
        >
          {uploading ? (
            <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255, 255, 255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Uploaden…</>
          ) : (
            <><Upload size={isMobile ? 16 : 17} strokeWidth={2.6} /> Andere foto</>
          )}
        </button>
        {naast}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
