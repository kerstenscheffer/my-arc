// src/modules/dm-conversation/utils/components/GhostPanel.jsx
// Ghost follow-up messages panel — shown inline in the conversation flow

import { useState } from 'react'
import { Ghost, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const GHOST_MESSAGES = [
  { id: 'ghost-1', step: 'Na opening', text: 'Heyy [naam]! Had je mijn bericht nog gezien? 😊' },
  { id: 'ghost-2', step: 'Na struggle', text: 'Heyy [naam]! Ik was benieuwd naar je antwoord, laat maar weten wanneer je tijd hebt! 💪' },
  { id: 'ghost-3', step: 'Na dieper', text: 'Heyy [naam]! Wilde even checken, heb je m\'n bericht nog gezien?' },
  { id: 'ghost-4', step: 'Na meekijken', text: 'Heyy [naam]! Laat maar weten of je het ziet zitten om even te bellen, dan kan ik je op weg helpen. 🤙' },
  { id: 'ghost-5', step: 'Na call voorstel', text: 'Heyy [naam]! Had je m\'n bericht nog gezien over het inplannen? Laat maar weten wat voor jou werkt! 📅' },
  { id: 'ghost-6', step: 'Call no show', text: 'Heyy [naam]! Ik zie dat je de call had gemist, is alles goed?\n\nIk had een paar goede ideeën voor jouw situatie. Wil je hem verzetten naar een andere tijd?' },
  { id: 'ghost-7', step: 'Ghost na call', text: 'Heyy [naam]! Hoe gaat het? Wilde even checken of je nog vragen had over het programma. Laat maar weten! 🙃' }
]

export default function GhostPanel({ leadName, isMobile, isOpen, onToggle }) {
  const [copiedId, setCopiedId] = useState(null)

  const replaceName = (text) => (text || '').replace(/\[naam\]/g, leadName || '[naam]')

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(replaceName(text))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) { console.error('Copy failed:', e) }
  }

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(139,92,246,0.12)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      marginTop: '0.75rem'
    }}>
      {/* Toggle header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.75rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <Ghost size={13} color="#a855f7" />
        <span style={{
          fontSize: '0.4rem', fontWeight: '700',
          color: '#a855f7',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flex: 1, textAlign: 'left'
        }}>
          GHOST FOLLOW-UPS ({GHOST_MESSAGES.length})
        </span>
        {isOpen ? <ChevronUp size={12} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.2)" />}
      </button>

      {/* Messages */}
      {isOpen && (
        <div>
          {GHOST_MESSAGES.map((ghost, idx) => {
            const isCopied = copiedId === ghost.id
            return (
              <div key={ghost.id} style={{
                borderTop: '1px solid rgba(255,255,255,0.03)',
                padding: isMobile ? '0.4rem 0.625rem' : '0.4rem 0.75rem'
              }}>
                {/* Step label + copy */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '3px'
                }}>
                  <span style={{
                    fontSize: '0.45rem', fontWeight: '700',
                    color: 'rgba(168,85,247,0.5)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {ghost.step}
                  </span>
                  <button
                    onClick={() => handleCopy(ghost.text, ghost.id)}
                    style={{
                      padding: '2px 5px',
                      background: isCopied ? 'rgba(16,185,129,0.08)' : 'rgba(168,85,247,0.06)',
                      border: `1px solid ${isCopied ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.15)'}`,
                      borderRadius: '3px',
                      color: isCopied ? '#10b981' : '#a855f7',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '2px',
                      fontSize: '0.45rem', fontWeight: '700',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {isCopied ? <CheckCircle size={8} /> : <Copy size={8} />}
                    {isCopied ? 'Gekopieerd' : 'Kopieer'}
                  </button>
                </div>

                {/* Message text */}
                <div style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {replaceName(ghost.text)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
