// src/modules/sales/components/dm-training/GapVerdiepingPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function GapVerdiepingPhase({ isMobile, color }) {
  const [decisionsOpen, setDecisionsOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyText = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div>
      {/* Main Flow */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderLeft: `4px solid ${color}`
      }}>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: color,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '1rem'
        }}>
          Main Flow
        </div>

        <MessageBlock
          label="NOAH (komt terug)"
          text="Yo man! Net de training bekeken, echt top. Legt het helder uit.

Mijn grootste uitdaging denk ik is gewoon dat ik niet weet wat ik precies moet eten om genoeg binnen te krijgen. Ik train wel hard maar groei niet echt."
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <MessageBlock
          label="JIJ"
          text="Ah top man! Blij dat je er wat aan hebt gehad.

Herkenbaar wat je zegt. Veel jongens trainen keihard maar zien niet de spiergroei die ze zouden kunnen zien, simpelweg omdat ze te weinig eten of niet de juiste dingen eten. 💪

Heb je wel eens uitgezocht hoeveel calorieën en eiwitten je nu ongeveer binnenkrijgt per dag?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Ah top man! Blij dat je er wat aan hebt gehad.\n\nHerkenbaar wat je zegt. Veel jongens trainen keihard maar zien niet de spiergroei die ze zouden kunnen zien, simpelweg omdat ze te weinig eten of niet de juiste dingen eten. 💪\n\nHeb je wel eens uitgezocht hoeveel calorieën en eiwitten je nu ongeveer binnenkrijgt per dag?", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Nee eigenlijk niet. Ik eet gewoon wat ik denk dat goed is maar track het niet ofzo."
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: '8px',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          fontWeight: '600',
          color: color
        }}>
          → FASE 6 (Impact)
        </div>
      </div>

      {/* Decision Points Button */}
      <button
        onClick={() => setDecisionsOpen(!decisionsOpen)}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          border: 'none',
          color: '#000',
          fontWeight: '700',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease'
        }}
      >
        <AlertTriangle size={18} />
        {decisionsOpen ? 'Beslispunten verbergen' : 'Beslispunten tonen'}
      </button>

      {/* Decision Points */}
      {decisionsOpen && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
          animation: 'slideDown 0.3s ease-out',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            ℹ️ <strong>FASE 5:</strong> Geen specifieke beslispunten
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '0.5rem'
          }}>
            Deze fase is onderdeel van de gap verdieping na lead magnet. Als Noah reageert, ga door naar Impact.
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function MessageBlock({ label, text, isMobile, color, onCopy, copied, isResponse }) {
  return (
    <div style={{
      background: isResponse ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.2)',
      border: `1px solid ${isResponse ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
      borderRadius: '8px',
      padding: isMobile ? '0.75rem' : '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: color || 'rgba(255, 255, 255, 0.5)',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: copied ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.7rem',
              fontWeight: '600',
              color: copied ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Gekopieerd!' : 'Kopieer'}
          </button>
        )}
      </div>
      <div style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: '#e5e5e5',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap'
      }}>
        {text}
      </div>
    </div>
  )
}
