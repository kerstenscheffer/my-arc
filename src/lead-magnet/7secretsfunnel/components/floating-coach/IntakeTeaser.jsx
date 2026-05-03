// ========================================
// 📁 src/lead-magnet/components/floating-coach/IntakeTeaser.jsx
// Teaser view shown when popup opens (before intake starts)
// ========================================
import { GOLD, GOLD_DARK, ArrowIcon, GiftIcon } from './constants'

export default function IntakeTeaser({ isMobile, page, onStart }) {
  const isResult = page === 'result'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Coach chat bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <img src="/coach-modal.png" alt="K" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '16px 16px 16px 4px',
          padding: isMobile ? '0.7rem 0.9rem' : '0.8rem 1rem',
          maxWidth: '85%'
        }}>
          <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: '#fff', fontWeight: '500', lineHeight: 1.45, margin: 0 }}>
            {isResult
              ? <>Heyy, succes met het fixen! Mocht je moeite hebben met toepassen, ik kan met je meekijken in een <strong>gratis call</strong>.</>
              : <>Zeker zijn van je resultaat? Kijk of <strong>1-op-1 begeleiding</strong> bij je past. 💪</>
            }
          </p>
        </div>
      </div>

      {/* Bonus teaser for result page */}
      {isResult && (
        <div style={{
          marginLeft: '36px',
          background: 'linear-gradient(135deg, rgba(255,186,9,0.08), rgba(255,186,9,0.03))',
          border: '1px solid rgba(255,186,9,0.12)',
          borderRadius: '16px 16px 16px 4px',
          padding: isMobile ? '0.6rem 0.9rem' : '0.65rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'rgba(255,186,9,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <GiftIcon size={13} />
          </div>
          <p style={{
            fontSize: isMobile ? '0.72rem' : '0.78rem',
            color: 'rgba(255,255,255,0.5)', fontWeight: '600',
            lineHeight: 1.4, margin: 0
          }}>
            Start deze week: ontvang het <span style={{ color: GOLD, fontWeight: '800' }}>Eat Better, Spend Less</span> systeem
          </p>
        </div>
      )}

      {/* CTA button */}
      <button onClick={onStart} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        padding: isMobile ? '0.8rem' : '0.9rem',
        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
        color: '#000', border: 'none', borderRadius: '10px',
        fontSize: isMobile ? '0.84rem' : '0.9rem', fontWeight: '800',
        cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 4px 15px rgba(255,186,9,0.25)'
      }}>
        {isResult ? 'Plan een gratis call' : 'Kijk of het bij je past'} <ArrowIcon size={14} />
      </button>
    </div>
  )
}
