// src/modules/sales/components/dm-training/OpeningPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function OpeningPhase({ isMobile, color }) {
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
          text="Heyy Noah! Ik zag dat je ook flink aan het trainen was, lekker bezig! 💪 Hoe lang train je al?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Heyy Noah! Ik zag dat je ook flink aan het trainen was, lekker bezig! 💪 Hoe lang train je al?", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Heyy! Thanks man. Ik train nu denk ik 6 maandjes echt consistent man."
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
          → FASE 2
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
            title="1A: GEEN REACTIE"
            color="#ef4444"
            isMobile={isMobile}
            copyText={copyText}
            copiedIndex={copiedIndex}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Situatie:</strong> Noah reageert niet op je opening bericht
              </div>
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 1:"
              text="Heyy Noah! Had je mijn bericht nog gezien? 😊"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Had je mijn bericht nog gezien? 😊", 'decision-1a-1')}
              copied={copiedIndex === 'decision-1a-1'}
            />

            <div style={{
              margin: '0.75rem 0',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              Als reactie → FASE 2
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 3:"
              text="Heyy Noah! Voor ik ga, Ik heb een training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.

Laat maar weten als je hier interesse in hebt. 👋"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Voor ik ga, Ik heb een training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.\n\nLaat maar weten als je hier interesse in hebt. 👋", 'decision-1a-2')}
              copied={copiedIndex === 'decision-1a-2'}
            />

            <div style={{
              margin: '0.75rem 0',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              Als reactie → Lead Magnet flow
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 7:"
              text="Heyy Noah! Laatste berichtje van mij, Ik zag dat je ook flink aan het trainen bent. Dat is goed om te zien man. 💪

Deed me denken aan Thijmen die ook veel bezig was in de sportschool. Hij was erg gedreven en wilde zijn droom fysiek heel graag bereiken, maar had nog moeite met voeding en consistentie.

Ik dacht ik deel dit nog even met jou: ik heb een training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.

Laat maar weten als je hier interesse in hebt. 👋"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Laatste berichtje van mij, Ik zag dat je ook flink aan het trainen bent. Dat is goed om te zien man. 💪\n\nDeed me denken aan Thijmen die ook veel bezig was in de sportschool. Hij was erg gedreven en wilde zijn droom fysiek heel graag bereiken, maar had nog moeite met voeding en consistentie.\n\nIk dacht ik deel dit nog even met jou: ik heb een training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.\n\nLaat maar weten als je hier interesse in hebt. 👋", 'decision-1a-3')}
              copied={copiedIndex === 'decision-1a-3'}
            />

            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#ef4444',
              fontWeight: '600'
            }}>
              Als dan geen reactie → STOP
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="1B: TE KORT BEZIG"
            color="#f59e0b"
            isMobile={isMobile}
            copyText={copyText}
            copiedIndex={copiedIndex}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Net begonnen, paar weken pas"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Ah nice man! Top dat je begonnen bent 💪 Hoe bevalt dat sporten en gezonde voeding tot nu toe?"
              isMobile={isMobile}
              onCopy={() => copyText("Ah nice man! Top dat je begonnen bent 💪 Hoe bevalt dat sporten en gezonde voeding tot nu toe?", 'decision-1b-1')}
              copied={copiedIndex === 'decision-1b-1'}
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
              → FASE 2
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="1C: TRAINT NIET"
            color="#8b5cf6"
            isMobile={isMobile}
            copyText={copyText}
            copiedIndex={copiedIndex}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Ik train eigenlijk niet echt"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Ahh oké snap ik. Ben je wel van plan om te gaan trainen of gewoon aan het kijken?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh oké snap ik. Ben je wel van plan om te gaan trainen of gewoon aan het kijken?", 'decision-1c-1')}
              copied={copiedIndex === 'decision-1c-1'}
            />

            <div style={{
              margin: '1rem 0 0.5rem',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#10b981',
              fontWeight: '700'
            }}>
              Als "Wil beginnen":
            </div>

            <ActionBlock
              text="Top man! Als je gaat beginnen is het slim om direct je voeding ook goed te zetten. Dan haal je vanaf dag 1 al betere resultaten. Laat maar weten als je begint, dan kan ik je helpen! 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Top man! Als je gaat beginnen is het slim om direct je voeding ook goed te zetten. Dan haal je vanaf dag 1 al betere resultaten. Laat maar weten als je begint, dan kan ik je helpen! 💪", 'decision-1c-2')}
              copied={copiedIndex === 'decision-1c-2'}
            />

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

            <div style={{
              margin: '1rem 0 0',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: '#ef4444',
              fontWeight: '700'
            }}>
              Als "Nee niet echt":
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
              → STOP
            </div>
          </DecisionPoint>
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

function DecisionPoint({ title, color, isMobile, children, copyText, copiedIndex }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      {/* Collapsible Header */}
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

      {/* Content */}
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
