// src/modules/meal-plan/components/food-log/GelogdAnimatie.jsx
//
// Het "gelogd"-moment (15 okt 2026; was een groen vinkje). Een wit bestek-
// icoon draait één keer rond terwijl er een witte ring omheen getekend wordt,
// daarna een korte puls. Duurt ~0,9 s, past binnen de 1,5 s van het scherm.

import { UtensilsCrossed } from 'lucide-react'

const OMTREK = 2 * Math.PI * 44

export default function GelogdAnimatie({ grootte = 112 }) {
  return (
    <div style={{ position: 'relative', width: grootte, height: grootte }}>
      <style>{`
        @keyframes glRing { from { stroke-dashoffset: ${OMTREK}; } to { stroke-dashoffset: 0; } }
        @keyframes glDraai {
          0% { transform: scale(0.4) rotate(-200deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(15deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes glPuls {
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>
      {/* Puls die na de ring naar buiten loopt */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '2px solid #fff', opacity: 0,
        animation: 'glPuls 0.7s ease-out 0.75s',
      }} />
      <svg width={grootte} height={grootte} viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="50" cy="50" r="44" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={OMTREK} strokeDashoffset={OMTREK}
          style={{ animation: 'glRing 0.75s cubic-bezier(0.65, 0, 0.35, 1) 0.1s forwards' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'glDraai 0.8s cubic-bezier(0.34, 1.3, 0.64, 1) both',
      }}>
        <UtensilsCrossed size={grootte * 0.38} color="#fff" strokeWidth={2.4} />
      </div>
    </div>
  )
}
