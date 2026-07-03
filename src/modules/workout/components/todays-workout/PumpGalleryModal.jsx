// src/modules/workout/components/todays-workout/PumpGalleryModal.jsx
//
// Gallery-overlay die opent wanneer de Pump-knop wordt ingedrukt. Toont alle
// eerder opgeslagen pump-foto's van de client (uit `pump_photos`) en heeft
// een grote CTA om een nieuwe foto te maken — die opent dan de bestaande
// PumpShareModal (camera + stats-overlay + uploadPumpPhoto naar de library).
//
// Na opslaan van een nieuwe foto wordt de lijst hier automatisch herladen.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera, ImageOff, Loader2 } from 'lucide-react'
import PumpShareModal from './PumpShareModal'

const GOLD = '#FFD700'

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '' }
}

export default function PumpGalleryModal({ isOpen, onClose, client, db, stats }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  // Foto die de gebruiker tikt voor full-screen view. null = grid.
  const [viewingPhoto, setViewingPhoto] = useState(null)

  const loadPhotos = async () => {
    if (!client?.id || !db?.getPumpPhotoFeed) return
    setLoading(true)
    try {
      const res = await db.getPumpPhotoFeed(50, 0, client.id)
      setPhotos(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      console.error('Load pump photos failed:', e)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, client?.id])

  const handleCameraClose = () => {
    setShowCamera(false)
    // Lijst opnieuw ophalen — een net-geüploade foto verschijnt zo bovenaan.
    loadPhotos()
  }

  if (!isOpen) return null

  const gridCols = isMobile ? 3 : 4

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, height: '100dvh',
      background: '#0a0a0a', zIndex: 2147483500,
      display: 'flex', flexDirection: 'column',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: `calc(0.85rem + env(safe-area-inset-top)) 1rem 0.85rem 1rem`,
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,10,0.95)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: 800, color: GOLD,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            opacity: 0.85, lineHeight: 1, marginBottom: 4,
          }}>
            Pump foto's
          </div>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Sla jouw pump op om later terug te zien
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            flexShrink: 0,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        // Extra bottom-padding zodat de laatste foto-rij niet onder de
        // floating "Maak pump foto"-knop verdwijnt.
        padding: `1rem 1rem calc(env(safe-area-inset-bottom, 0px) + 110px) 1rem`,
      }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '3rem 1rem', color: 'rgba(255,255,255,0.5)', gap: 8,
          }}>
            <Loader2 size={20} className="pg-spin" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Foto's laden…</span>
          </div>
        ) : photos.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '3rem 1rem', gap: 12,
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,215,0,0.08)',
              border: '1.5px dashed rgba(255,215,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: GOLD,
            }}>
              <ImageOff size={26} />
            </div>
            <div style={{
              fontSize: '0.95rem', fontWeight: 700, color: '#fff',
            }}>
              Nog geen pump foto's
            </div>
            <div style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)',
              maxWidth: 260, lineHeight: 1.4,
            }}>
              Leg je eerste pump vast en bouw langzaam een archief op van hoe je groeit.
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 6,
          }}>
            {photos.map(p => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,215,0,0.15)',
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
                onClick={() => setViewingPhoto(p)}
              >
                <img
                  src={p.photo_url}
                  alt={p.caption || 'Pump'}
                  loading="lazy"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                  }}
                />
                {/* Datum-strip onderaan */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  padding: '14px 6px 4px 6px',
                  background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.75))',
                  fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                  letterSpacing: '0.02em',
                }}>
                  {formatDate(p.workout_date || p.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating CTA — pill rechtsonder, geen footer-balk meer. */}
      <button
        onClick={() => setShowCamera(true)}
        style={{
          position: 'fixed',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)`,
          right: 18,
          zIndex: 5,
          minHeight: 58,
          padding: '0 1.4rem',
          background: `linear-gradient(135deg, ${GOLD} 0%, #D4AF37 100%)`,
          border: 'none',
          borderRadius: 30,
          color: '#0a0a0a',
          fontSize: isMobile ? '0.88rem' : '0.95rem',
          fontWeight: 900,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 14px 36px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <Camera size={20} strokeWidth={2.4} />
        Maak pump foto
      </button>

      {/* Full-screen foto-viewer met sluit-knop. Tap op de achtergrond óf op
          de X sluit'm. */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          style={{
            position: 'fixed', inset: 0, height: '100dvh',
            background: 'rgba(0,0,0,0.96)',
            zIndex: 2147483550,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setViewingPhoto(null) }}
            aria-label="Sluit foto"
            style={{
              position: 'fixed',
              top: `calc(env(safe-area-inset-top, 0px) + 12px)`,
              right: 14,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 2,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <X size={22} strokeWidth={2.4} />
          </button>
          <img
            src={viewingPhoto.photo_url}
            alt={viewingPhoto.caption || 'Pump'}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          />
          {(viewingPhoto.caption || viewingPhoto.workout_date || viewingPhoto.created_at) && (
            <div style={{
              position: 'fixed',
              left: 0, right: 0,
              bottom: `calc(env(safe-area-inset-bottom, 0px) + 18px)`,
              textAlign: 'center',
              padding: '0 1.5rem',
              pointerEvents: 'none',
            }}>
              {viewingPhoto.caption && (
                <div style={{
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                  marginBottom: 4,
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}>
                  {viewingPhoto.caption}
                </div>
              )}
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, color: GOLD,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              }}>
                {formatDate(viewingPhoto.workout_date || viewingPhoto.created_at)}
              </div>
            </div>
          )}
        </div>
      )}

      <PumpShareModal
        isOpen={showCamera}
        onClose={handleCameraClose}
        client={client}
        db={db}
        stats={stats || {}}
      />

      <style>{`
        @keyframes pg-spin { to { transform: rotate(360deg); } }
        .pg-spin { animation: pg-spin 1s linear infinite; }
      `}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
