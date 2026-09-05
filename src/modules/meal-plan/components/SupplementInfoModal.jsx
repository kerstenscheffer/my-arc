// src/modules/meal-plan/components/SupplementInfoModal.jsx
//
// Wat staat er over dit supplement in het plan van de klant?
//
// Alles komt uit supplement_plans.supplements — dus uit wat de coach heeft
// toegewezen, niet uit een algemene database. Wat hij aanpast, leest de
// klant. Ontbreekt een onderdeel, dan blijft dat blok gewoon weg in plaats
// van een lege kop te tonen.

import React from 'react'
import { X, Check, AlertTriangle, Clock } from 'lucide-react'
import { supplementFoto } from '../../supplements/utils/supplementFoto'

export default function SupplementInfoModal({ supplement, isMobile, onClose }) {
  if (!supplement) return null
  const m = isMobile
  const sp = supplement
  const veiligheid = sp.veiligheid || {}
  const waarschuwingen = Array.isArray(veiligheid.warnings) ? veiligheid.warnings : []
  const interacties = Array.isArray(veiligheid.interactions) ? veiligheid.interactions : []

  const kop = (tekst, icoon) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
      marginBottom: 5,
    }}>
      {icoon}{tekst}
    </div>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center',
        padding: m ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: m ? 'none' : 460,
          maxHeight: m ? '85vh' : '80vh',
          background: '#0f0f0f',
          borderRadius: m ? '16px 16px 0 0' : 14,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Foto met de naam eroverheen — zelfde beeldtaal als de kaart. */}
        <div style={{
          position: 'relative', height: 120, flexShrink: 0,
          background: `url(${supplementFoto(sp, 480)}) center/cover`,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15,15,15,0.95), rgba(15,15,15,0.2))',
          }} />
          <button onClick={onClose} style={{
            position: 'absolute', right: 10, top: 10,
            width: 30, height: 30, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer',
          }}><X size={15} /></button>
          <div style={{ position: 'absolute', left: 14, bottom: 10, right: 50 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {sp.emoji} Supplement
            </div>
            <div style={{ fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff' }}>
              {sp.naam}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.9rem 1rem 1.1rem' }}>
          {/* Dosering en tijdstip: het antwoord op "wat moet ik nu doen". */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.9rem',
          }}>
            {sp.dosering && (
              <div style={{
                padding: '0.45rem 0.7rem', background: 'rgba(255,215,0,0.08)',
                border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8,
              }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>DOSERING</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#FFD700' }}>{sp.dosering}</div>
              </div>
            )}
            {sp.tijdNotitie && (
              <div style={{
                flex: 1, minWidth: 140,
                padding: '0.45rem 0.7rem', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Clock size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                  {sp.tijdNotitie}
                </span>
              </div>
            )}
          </div>

          {sp.doseringNotitie && (
            <div style={{ marginBottom: '0.9rem', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              {sp.doseringNotitie}
            </div>
          )}

          {sp.instructies && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Hoe te nemen')}
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {sp.instructies}
              </div>
            </div>
          )}

          {sp.voordelen?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Waarvoor')}
              {sp.voordelen.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 4 }}>
                  <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Veiligheid onderaan maar wel volledig. Een maximale dosering of
              een waarschuwing weglaten omdat het niet mooi staat is precies
              het verkeerde compromis. */}
          {(veiligheid.max_dose || waarschuwingen.length > 0 || interacties.length > 0) && (
            <div style={{
              padding: '0.7rem 0.8rem', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              {kop('Let op', <AlertTriangle size={11} style={{ color: '#f59e0b' }} />)}
              {veiligheid.max_dose && (
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
                  Maximaal {veiligheid.max_dose} per dag
                </div>
              )}
              {[...waarschuwingen, ...interacties].map((w, i) => (
                <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                  · {w}
                </div>
              ))}
            </div>
          )}

          {!sp.instructies && !sp.voordelen?.length && !veiligheid.max_dose && (
            <div style={{ padding: '1rem 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Er is verder geen informatie bij dit supplement vastgelegd.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
