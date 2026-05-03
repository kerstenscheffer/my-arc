// src/modules/resource-hub/pages/CardioSerie.jsx
import { useState } from 'react'
import { ArrowLeft, Play, Lock, ArrowRight } from 'lucide-react'

const G = { primary: '#FFD700', border: 'rgba(255, 215, 0, 0.08)', muted: 'rgba(255, 215, 0, 0.5)', grad: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }

const VIDEOS = [
  { title: 'Waarom 90% Verkeerd Aan Cardio Doet', dur: '8 min', locked: false, desc: 'De waarheid over cardio en vetverbranding.', img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&h=200&fit=crop&q=80' },
  { title: 'Hoe Je De Juiste Cardiovorm Kiest', dur: '6 min', locked: true, desc: 'Stap-voor-stap de perfecte vorm vinden.', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=200&fit=crop&q=80' },
  { title: 'Cardio Opbouwen Zonder Blessures', dur: '7 min', locked: true, desc: 'Veilig opbouwen, ook als beginner.', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&q=80' },
  { title: 'Cardio + Krachttraining Combineren', dur: '9 min', locked: true, desc: 'Wanneer, hoeveel, voor of na je workout.', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop&q=80' },
  { title: 'Motivatie: Cardio Volhouden', dur: '5 min', locked: true, desc: 'Mental frames om cardio een gewoonte te maken.', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&h=200&fit=crop&q=80' }
]

export default function CardioSerie({ db, bundel, user, client, isMember, navigate }) {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem', borderBottom: `1px solid ${G.border}` }}>
        <button onClick={() => navigate(`/hub/${bundel.slug}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '0.5rem 0', marginBottom: '0.5rem', touchAction: 'manipulation' }}>
          <ArrowLeft size={14} /> Terug
        </button>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: '900' }}>Cardio Zonder Haten</h1>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>5 videos · van haten naar niet meer willen stoppen</div>
      </div>

      {/* Video list — TodaysWorkoutCard style */}
      <div>
        {VIDEOS.map((vid, idx) => {
          const isLocked = vid.locked && !isMember

          return (
            <div key={idx} style={{
              display: 'flex', alignItems: 'stretch',
              borderBottom: `1px solid ${G.border}`,
              minHeight: isMobile ? '80px' : '90px',
              position: 'relative', overflow: 'hidden',
              cursor: isLocked ? 'default' : 'pointer',
              touchAction: 'manipulation'
            }}>
              {/* Image */}
              <div style={{ width: isMobile ? '100px' : '120px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${vid.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: isLocked ? 0.15 : 0.85 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))' }} />
                
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: '6px', left: '6px',
                  width: '26px', height: '26px', borderRadius: '7px',
                  background: 'rgba(0,0,0,0.7)',
                  border: `1px solid ${isLocked ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 2
                }}>
                  {isLocked ? <Lock size={11} color="rgba(255,255,255,0.25)" /> : <Play size={11} color="#3b82f6" />}
                </div>

                {isLocked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', gap: '0.25rem' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: '700', color: isLocked ? 'rgba(255,255,255,0.12)' : G.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isLocked ? 'ALLEEN LEDEN' : `VIDEO ${idx + 1} · ${vid.dur}`}
                </div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', color: isLocked ? 'rgba(255,255,255,0.18)' : '#fff' }}>{vid.title}</div>
                <div style={{ fontSize: '0.7rem', color: isLocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)' }}>{vid.desc}</div>
              </div>

              {/* Action */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', flexShrink: 0 }}>
                {isLocked ? (
                  <button onClick={() => bundel.calendly_url && window.open(bundel.calendly_url, '_blank')} style={{
                    padding: '0.3rem 0.6rem', background: 'rgba(255,215,0,0.08)',
                    border: `1px solid ${G.border}`, borderRadius: '6px',
                    color: G.primary, fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer'
                  }}>Unlock</button>
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Play size={16} color="#3b82f6" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
