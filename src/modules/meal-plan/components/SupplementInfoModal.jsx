// src/modules/meal-plan/components/SupplementInfoModal.jsx
//
// Wat staat er over dit supplement in het plan van de klant?
//
// Alles komt uit supplement_plans.supplements — dus uit wat de coach heeft
// toegewezen, niet uit een algemene database. Wat hij aanpast, leest de
// klant. Ontbreekt een onderdeel, dan blijft dat blok gewoon weg in plaats
// van een lege kop te tonen.

import React, { useState, useEffect } from 'react'
import { X, Check, AlertTriangle, Clock, ExternalLink, BookOpen } from 'lucide-react'
import { supplementFoto } from '../../supplements/utils/supplementFoto'

export default function SupplementInfoModal({ supplement, isMobile, onClose, db }) {
  const m = isMobile
  const sp = supplement

  // Bronnen komen uit supplement_templates en niet uit het plan van de klant.
  // Het plan draagt een momentopname; werk je een bron bij, dan zou die daar
  // niet in meekomen. Zo leest iedereen meteen de bijgewerkte versie.
  const [sjabloon, setSjabloon] = useState(null)   // null = laden
  useEffect(() => {
    if (!db?.supabase || !sp?.id) { setSjabloon({ sources: [], benefits: null }); return }
    let leeft = true
    db.supabase
      .from('supplement_templates').select('sources, benefits')
      .eq('supplement_id', sp.id).maybeSingle()
      .then(({ data }) => { if (leeft) setSjabloon(data || { sources: [], benefits: null }) },
            () => { if (leeft) setSjabloon({ sources: [], benefits: null }) })
    return () => { leeft = false }
  }, [db, sp?.id])

  const bronnen = sjabloon ? (Array.isArray(sjabloon.sources) ? sjabloon.sources : []) : null

  // Wat de klant leest komt bij voorkeur uit het sjabloon, niet uit het plan.
  //
  // Het plan draagt een momentopname van het moment dat het supplement werd
  // toegewezen. Corrigeer je een claim in het sjabloon — zoals de
  // testosteron-bewering bij magnesium — dan zou die correctie in bestaande
  // plannen blijven hangen. Dat is precies verkeerd om: een claim die je
  // hebt teruggenomen mag nergens meer staan.
  //
  // Heeft het sjabloon niets, dan valt hij terug op wat er in het plan staat.
  const voordelen = (Array.isArray(sjabloon?.benefits) && sjabloon.benefits.length > 0)
    ? sjabloon.benefits
    : (sp.voordelen || [])

  // Pas hierna afhaken. Een vroege return bóven de hooks laat het aantal
  // hooks tussen renders verschillen, en dan gooit React
  // "Rendered more hooks than during the previous render".
  if (!supplement) return null

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

          {voordelen.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Waarvoor')}
              {voordelen.map((v, i) => (
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

          {/* Bronnen. Onderaan, want je leest ze niet altijd — maar wel
              volledig, met de kanttekening erbij. Een claim zonder bron en
              een claim met één kleine studie zien er anders identiek uit. */}
          {bronnen && bronnen.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {kop('Waar dit op gebaseerd is', <BookOpen size={11} />)}
              {bronnen.map((b, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <a href={b.url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 5,
                    fontSize: '0.74rem', fontWeight: 700, color: '#6366f1',
                    textDecoration: 'none', lineHeight: 1.4,
                  }}>
                    <ExternalLink size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{b.titel}</span>
                  </a>
                  {b.soort && (
                    <span style={{
                      display: 'inline-block', marginTop: 3, padding: '1px 6px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)', fontSize: '0.55rem', fontWeight: 800,
                      color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{b.soort}</span>
                  )}
                  {b.kanttekening && (
                    <div style={{ marginTop: 2, fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                      {b.kanttekening}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Geen bronnen betekent "nog niet nagezocht", niet "geen bewijs".
              Dat verschil hoort er te staan. */}
          {bronnen && bronnen.length === 0 && voordelen.length > 0 && (
            <div style={{
              marginTop: '0.9rem', padding: '0.55rem 0.7rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4,
            }}>
              Bij dit supplement zijn nog geen bronnen vastgelegd. De punten
              hierboven komen uit het plan van je coach.
            </div>
          )}

          {!sp.instructies && voordelen.length === 0 && !veiligheid.max_dose && (
            <div style={{ padding: '1rem 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Er is verder geen informatie bij dit supplement vastgelegd.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
