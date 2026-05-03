// src/modules/resource-hub/Blocks.jsx

// ═══ GOLD SYSTEM ═══
export const G = {
  primary: '#FFD700',
  border: 'rgba(255, 215, 0, 0.08)',
  borderActive: 'rgba(255, 215, 0, 0.2)',
  muted: 'rgba(255, 215, 0, 0.5)',
  grad: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
}
export const GREEN = '#10b981'

export const IMG = {
  menu: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&h=400&fit=crop&q=80',
  schema: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=300&fit=crop&q=80',
  blessure: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop&q=80',
  video: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop&q=80',
  tracking: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&h=300&fit=crop&q=80',
  hero: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=500&fit=crop&q=80'
}

// ═══ ICONS ═══
import {
  List, Activity, Heart, Play, Flame, MessageCircle,
  Lock, ChevronRight, ArrowRight, Shield, LogIn, X,
  Eye, EyeOff, HelpCircle
} from 'lucide-react'

export const I = { List, Activity, Heart, Play, Flame, MessageCircle, Lock, ChevronRight, ArrowRight, Shield, LogIn, X, Eye, EyeOff, HelpCircle }

// ═══ ROW CARD ═══
export function Row({ title, label, info, image, BadgeIcon, badgeColor, locked, isMember, onClick, onCTA, tag }) {
  const lk = locked && !isMember
  const m = window.innerWidth <= 768

  return (
    <div onClick={lk ? onCTA : onClick} style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: `1px solid ${lk ? 'rgba(255,255,255,0.03)' : G.border}`,
      borderBottom: `1px solid ${lk ? 'rgba(255,255,255,0.03)' : G.border}`,
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      minHeight: '100px', marginBottom: '-1px'
    }}>
      <div style={{ width: '100px', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: lk ? 0.1 : 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.05))' }} />
        <div style={{ position: 'absolute', top: '6px', left: '6px', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(0,0,0,0.7)', border: `1px solid ${lk ? 'rgba(255,255,255,0.08)' : G.borderActive}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          {lk ? <Lock size={13} color="rgba(255,255,255,0.15)" /> : <BadgeIcon size={13} color={badgeColor || G.primary} />}
        </div>
        {lk && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }} />}
        {tag && !lk && <div style={{ position: 'absolute', bottom: '6px', left: '6px', padding: '0.1rem 0.35rem', background: 'rgba(0,0,0,0.7)', border: `1px solid ${G.borderActive}`, fontSize: '0.42rem', fontWeight: '700', color: G.primary, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: '3px', zIndex: 2 }}>{tag}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: m ? '0.7rem 0.8rem' : '0.8rem 1rem', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.52rem', fontWeight: '700', color: lk ? 'rgba(255,255,255,0.08)' : G.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lk ? 'ALLEEN LEDEN' : label}</div>
        <div style={{ fontSize: m ? '0.95rem' : '1.02rem', fontWeight: '800', color: lk ? 'rgba(255,255,255,0.13)' : '#fff', lineHeight: 1.2 }}>{title}</div>
        {info && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {info.map((t, i) => (
              <span key={i} style={{ fontSize: '0.58rem', fontWeight: '600', color: lk ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {t.Icon && <t.Icon size={10} strokeWidth={2} />} {t.text}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.75rem' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: lk ? 'rgba(255,255,255,0.015)' : 'rgba(255,215,0,0.07)', border: `1px solid ${lk ? 'rgba(255,255,255,0.03)' : G.borderActive}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {lk ? <Lock size={15} color="rgba(255,255,255,0.08)" /> : <ChevronRight size={16} color={G.primary} />}
        </div>
      </div>
    </div>
  )
}

// ═══ BANNER CARD ═══
export function Banner({ title, label, desc, image, gradient, BtnIcon, btn, locked, isMember, onClick, onCTA }) {
  const lk = locked && !isMember
  const m = window.innerWidth <= 768

  return (
    <div onClick={lk ? onCTA : onClick} style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', touchAction: 'manipulation', minHeight: m ? '110px' : '125px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: lk ? 0.05 : 0.18 }} />
      <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      <div style={{ position: 'relative', zIndex: 2, padding: m ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.5rem', fontWeight: '700', color: lk ? 'rgba(255,255,255,0.1)' : G.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{lk ? 'ALLEEN LEDEN' : label}</div>
          <div style={{ fontSize: m ? '1rem' : '1.1rem', fontWeight: '800', color: lk ? 'rgba(255,255,255,0.1)' : '#fff', lineHeight: 1.2, marginBottom: '0.25rem' }}>{title}</div>
          <div style={{ fontSize: '0.68rem', color: lk ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.22)', lineHeight: 1.4 }}>{desc}</div>
        </div>
        {lk
          ? <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Lock size={17} color="rgba(255,255,255,0.08)" /></div>
          : <div style={{ padding: '0.45rem 0.8rem', background: G.grad, borderRadius: '7px', fontSize: '0.68rem', fontWeight: '700', color: '#000', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{BtnIcon && <BtnIcon size={12} />} {btn}</div>
        }
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: G.border }} />
    </div>
  )
}

// ═══ BREATHER ═══
export function Breather({ text }) {
  return (
    <div style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
      <div style={{ width: '16px', height: '1px', background: G.primary, margin: '0 auto 0.875rem', opacity: 0.3 }} />
      <div style={{ fontSize: '0.72rem', fontWeight: '500', color: 'rgba(255,255,255,0.18)', lineHeight: 1.5, maxWidth: '260px', margin: '0 auto' }}>{text}</div>
    </div>
  )
}

// ═══ SECTION HEAD ═══
export function SectionHead({ pre, title }) {
  const m = window.innerWidth <= 768
  return (
    <div style={{ padding: m ? '2rem 1.5rem 1.25rem' : '2.25rem 2rem 1.5rem', textAlign: 'center' }}>
      <div style={{ width: '20px', height: '1px', background: G.primary, margin: '0 auto 0.875rem', opacity: 0.35 }} />
      {pre && <div style={{ fontSize: '0.46rem', fontWeight: '700', color: G.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>{pre}</div>}
      <div style={{ fontSize: m ? '1.1rem' : '1.25rem', fontWeight: '900', color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</div>
    </div>
  )
}
