// src/modules/productivity/components/kanban/StartTaskModal.jsx
// Popup om een taak te starten: hoelang, en dan starten. Zelfde taal als de
// task-modal — grote waarde bovenaan, chips eronder, witte hoofdknop.

import { useState } from 'react'
import { Play, Clock } from 'lucide-react'
import { Venster, VensterKop, VensterVoet, Kopje, Chip, Knop } from '../ui'

const PRESETS = [5, 15, 25, 30, 45, 60, 90]

export default function StartTaskModal({ task, isMobile, onStart, onClose }) {
  const [minutes, setMinutes] = useState(task.estimated_minutes || 25)

  const handleStart = () => {
    if (!minutes || minutes < 1) return
    onStart(minutes)
  }

  const label = minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}u${minutes % 60 ? ` ${minutes % 60}m` : ''}`

  return (
    <Venster isMobile={isMobile} onClose={onClose} maxWidth={380} zIndex={10000}>
      <VensterKop isMobile={isMobile} titel={task.title} sub="Hoelang ga je hieraan werken?" onClose={onClose} />

      <div style={{ padding: isMobile ? '1rem' : '1.15rem', overflowY: 'auto' }}>
        {/* De klok zelf is de blikvanger, zoals het gewicht in de weegslider. */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.25rem' }}>
          <span style={{
            fontSize: isMobile ? '2.6rem' : '3rem', fontWeight: 900, color: '#fff',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {String(Math.floor(minutes)).padStart(2, '0')}:00
          </span>
        </div>

        <Kopje Icon={Clock} tekst="Duur" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {PRESETS.map(p => (
            <Chip key={p} actief={minutes === p} onClick={() => setMinutes(p)}>
              {p < 60 ? `${p}m` : `${p / 60}u`}
            </Chip>
          ))}
          <input
            type="number" min="1" max="480" placeholder="eigen"
            value={PRESETS.includes(minutes) ? '' : minutes}
            onChange={(e) => setMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
            style={{
              width: 62, minHeight: 30, padding: '0 0.6rem', borderRadius: 999,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.7rem', fontWeight: 800, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <VensterVoet isMobile={isMobile}>
        <Knop soort="stil" flex={1} onClick={onClose}>Annuleer</Knop>
        <Knop soort="primair" flex={2} onClick={handleStart}>
          <Play size={15} strokeWidth={3} />
          Start · {label}
        </Knop>
      </VensterVoet>
    </Venster>
  )
}
