// src/modules/sales/components/dm-training/InteresseCheckPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function InteresseCheckPhase({ isMobile, color }) {
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
          label="JIJ"
          text="Nice man! Lekker bezig, in 6 maanden consistent kun je een hele hoop spieren opbouwen. Hoe bevalt dat sporten en gezonde voeding tot nu toe?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Nice man! Lekker bezig, in 6 maanden consistent kun je een hele hoop spieren opbouwen. Hoe bevalt dat sporten en gezonde voeding tot nu toe?", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Jaa sporten bevalt goed, ik vind het heel erg leuk. Voeding kan alleen wel wat beter haha."
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
          → FASE 3
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
          animation: 'slideDown 0.3s ease-out'
        }}>
          <DecisionPoint
            title="2A: ALLES GAAT PRIMA"
            color="#10b981"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Gaat prima man! Zie ook goede resultaten"
              </div>
            </div>

            <ActionBlock
              label="JIJ (Dieper graven):"
              text="Ah top man! Daar draait het uiteindelijk ook om, resultaten halen. Waar ben je naartoe aan het werken?"
              isMobile={isMobile}
              onCopy={() => copyText("Ah top man! Daar draait het uiteindelijk ook om, resultaten halen. Waar ben je naartoe aan het werken?", 'decision-2a-1')}
              copied={copiedIndex === 'decision-2a-1'}
            />

            <div style={{ margin: '0.75rem 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              <strong>Noah:</strong> "Ik wil gewoon wat gespierder worden man"
            </div>

            <ActionBlock
              label="JIJ (Educatie + Check):"
              text="Nice man! Mooi dat je een duidelijk doel voor ogen hebt. 💪

Wat ik veel zie is dat de meeste spiergroei behaald wordt wanneer je meer calorieën eet dan dat je verbrandt en zwaarder wordt in gewicht.

De calorieën geven je lichaam de kans om spieren op te bouwen, en zwaarder worden in gewicht toont aan dat je massa aan het opbouwen bent.

Hoe gaat dat bij jou? Let je daar ook een beetje op?"
              isMobile={isMobile}
              onCopy={() => copyText("Nice man! Mooi dat je een duidelijk doel voor ogen hebt. 💪\n\nWat ik veel zie is dat de meeste spiergroei behaald wordt wanneer je meer calorieën eet dan dat je verbrandt en zwaarder wordt in gewicht.\n\nDe calorieën geven je lichaam de kans om spieren op te bouwen, en zwaarder worden in gewicht toont aan dat je massa aan het opbouwen bent.\n\nHoe gaat dat bij jou? Let je daar ook een beetje op?", 'decision-2a-2')}
              copied={copiedIndex === 'decision-2a-2'}
            />

            <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
              Als "Nee let niet op":
            </div>

            <ActionBlock
              text="Ahh oké snap ik! Dan mis je misschien wel kansen. Waar loop je op dit moment tegenaan met je voeding?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh oké snap ik! Dan mis je misschien wel kansen. Waar loop je op dit moment tegenaan met je voeding?", 'decision-2a-3')}
              copied={copiedIndex === 'decision-2a-3'}
            />

            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              → FASE 3
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="2B: GEEN MOTIVATIE"
            color="#f59e0b"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Eigenlijk niet goed, heb geen motivatie meer"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Ahh kut man, dat is lastig. Hoe komt het dat de motivatie weg is? Vind je het gewoon niet leuk of zie je geen resultaat?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh kut man, dat is lastig. Hoe komt het dat de motivatie weg is? Vind je het gewoon niet leuk of zie je geen resultaat?", 'decision-2b-1')}
              copied={copiedIndex === 'decision-2b-1'}
            />

            <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
              Als "Zie geen resultaat":
            </div>

            <ActionBlock
              text="Ahh dan snap ik het. Als je geen resultaat ziet terwijl je wel traint, komt dat meestal door je voeding. Waar loop je op dit moment tegenaan met je voeding?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh dan snap ik het. Als je geen resultaat ziet terwijl je wel traint, komt dat meestal door je voeding. Waar loop je op dit moment tegenaan met je voeding?", 'decision-2b-2')}
              copied={copiedIndex === 'decision-2b-2'}
            />

            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              → FASE 3
            </div>

            <div style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }}>
              Als "Vind het niet leuk":
            </div>

            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#ef4444',
              fontWeight: '600'
            }}>
              → EXIT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="2C: TRAINING PROBLEEM"
            color="#8b5cf6"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Voeding gaat wel, maar weet niet of ik goed train"
              </div>
            </div>

            <ActionBlock
              label="JIJ (Redirect):"
              text="Ahh oké! Wat train je op dit moment?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh oké! Wat train je op dit moment?", 'decision-2c-1')}
              copied={copiedIndex === 'decision-2c-1'}
            />

            <div style={{ margin: '0.75rem 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              <strong>Noah:</strong> [Vertelt over training]
            </div>

            <ActionBlock
              text="Klinkt goed! Maar wist je dat voeding 80% van je resultaat bepaalt? Je kunt perfect trainen, maar als je voeding niet klopt zie je geen groei.

Hoe zit dat bij jou? Let je daar ook op?"
              isMobile={isMobile}
              onCopy={() => copyText("Klinkt goed! Maar wist je dat voeding 80% van je resultaat bepaalt? Je kunt perfect trainen, maar als je voeding niet klopt zie je geen groei.\n\nHoe zit dat bij jou? Let je daar ook op?", 'decision-2c-2')}
              copied={copiedIndex === 'decision-2c-2'}
            />

            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              Als "Nee" → FASE 3 | Als "Ja" → Behandel als 2A
            </div>
          </DecisionPoint>
        </div>
      )}
    </div>
  )
}

// Helper Components (same as OpeningPhase)
function MessageBlock({ label, text, isMobile, color, onCopy, copied, isResponse }) {
  return (
    <div style={{
      background: isResponse ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.2)',
      border: `1px solid ${isResponse ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}`,
      borderRadius: '8px',
      padding: isMobile ? '0.75rem' : '1rem',
      marginBottom: '1rem',
      position: 'relative'
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

function DecisionPoint({ title, color, isMobile, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isOpen ? `${color}10` : 'transparent',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={isMobile ? 16 : 18} color={color} />
          <span style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '700',
            color: color
          }}>
            {title}
          </span>
        </div>
        <div style={{
          fontSize: '1rem',
          color: color,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          paddingTop: 0,
          animation: 'slideDown 0.2s ease-out'
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ActionBlock({ label, text, isMobile, onCopy, copied }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      padding: isMobile ? '0.75rem' : '1rem',
      marginBottom: '0.75rem'
    }}>
      {label && (
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: '#10b981',
          fontWeight: '700',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
      )}
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.85rem',
        color: '#e5e5e5',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        marginBottom: onCopy ? '0.75rem' : 0
      }}>
        {text}
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          style={{
            background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: copied ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '0.5rem 0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            color: copied ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
            transition: 'all 0.2s ease',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Gekopieerd!' : 'Kopieer tekst'}
        </button>
      )}
    </div>
  )
}
