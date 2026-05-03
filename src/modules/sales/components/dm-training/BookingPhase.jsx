// src/modules/sales/components/dm-training/BookingPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function BookingPhase({ isMobile, color }) {
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
          text="Perfect man! Ik kan deze week op:
- Dinsdag 18:00
- Woensdag 20:00
- Vrijdag 17:00

Welke past het beste voor jou?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Perfect man! Ik kan deze week op:\n- Dinsdag 18:00\n- Woensdag 20:00\n- Vrijdag 17:00\n\nWelke past het beste voor jou?", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Woensdag 20:00 zou goed zijn!"
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <MessageBlock
          label="JIJ"
          text="Top man! Woensdag 10 januari om 20:00 staat genoteerd. ✅

Ik stuur je zo de Calendly link naar je email. Check ook je spam als je hem niet ziet.

Zorg dat je 15-20 minuten rustig kunt zitten, dan kunnen we echt goed in je situatie duiken en een plan maken. 💪

Zie je woensdag! 🤙"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Top man! Woensdag 10 januari om 20:00 staat genoteerd. ✅\n\nIk stuur je zo de Calendly link naar je email. Check ook je spam als je hem niet ziet.\n\nZorg dat je 15-20 minuten rustig kunt zitten, dan kunnen we echt goed in je situatie duiken en een plan maken. 💪\n\nZie je woensdag! 🤙", 'main-2')}
          copied={copiedIndex === 'main-2'}
        />

        <MessageBlock
          label="NOAH"
          text="Nice man! Tot woensdag 🔥"
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
          ✅ CALL GEBOEKT
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
            title="7A: KAN GEEN VAN DEZE TIJDEN"
            color="#f59e0b"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Kan geen van deze tijden man"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Geen probleem man! Wanneer zou volgende week dan wel kunnen voor je?"
              isMobile={isMobile}
              onCopy={() => copyText("Geen probleem man! Wanneer zou volgende week dan wel kunnen voor je?", 'decision-7a-1')}
              copied={copiedIndex === 'decision-7a-1'}
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
              → Reschedule → CALL GEBOEKT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="7B: GHOST NA BOOKING"
            color="#8b5cf6"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Situatie:</strong> Noah bevestigt tijd maar reageert daarna niet meer
              </div>
            </div>

            <ActionBlock
              label="REMINDER OCHTEND VAN CALL:"
              text="Heyy Noah! Reminder dat we vanavond om 20:00 bellen. Zie je dan! 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Reminder dat we vanavond om 20:00 bellen. Zie je dan! 💪", 'decision-7b-1')}
              copied={copiedIndex === 'decision-7b-1'}
            />

            <ActionBlock
              label="1 UUR VOOR CALL:"
              text="Heyy Noah! Over een uurtje bellen we. Ben je er klaar voor?"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Over een uurtje bellen we. Ben je er klaar voor?", 'decision-7b-2')}
              copied={copiedIndex === 'decision-7b-2'}
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
              Als geen reactie → NO SHOW (zie 7C)
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="7C: NO SHOW"
            color="#ef4444"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Situatie:</strong> Noah komt niet opdagen voor de call
              </div>
            </div>

            <ActionBlock
              label="DIRECT NA CALL TIJD:"
              text="Heyy Noah, ik zie dat je de call had gemist. Is alles goed?

Ik had een paar goede oplossingen bedacht voor jouw situatie die ik je graag zou meegeven. Wil je hem verzetten naar een andere tijd?"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah, ik zie dat je de call had gemist. Is alles goed?\n\nIk had een paar goede oplossingen bedacht voor jouw situatie die ik je graag zou meegeven. Wil je hem verzetten naar een andere tijd?", 'decision-7c-1')}
              copied={copiedIndex === 'decision-7c-1'}
            />

            <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
              Als "Ja graag sorry":
            </div>

            <ActionBlock
              text="Geen probleem man! Dit is wel de laatste keer dat ik hem kan verzetten. Wanneer weet je 100% zeker dat je tijd hebt?"
              isMobile={isMobile}
              onCopy={() => copyText("Geen probleem man! Dit is wel de laatste keer dat ik hem kan verzetten. Wanneer weet je 100% zeker dat je tijd hebt?", 'decision-7c-2')}
              copied={copiedIndex === 'decision-7c-2'}
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
              → RESCHEDULE
            </div>

            <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: '700' }}>
              Als geen reactie na 24 uur:
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 2:"
              text="Heyy Noah! Laatste kans om te verzetten. Laat maar weten als je alsnog wilt, anders laat ik het hierbij 🤙"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Laatste kans om te verzetten. Laat maar weten als je alsnog wilt, anders laat ik het hierbij 🤙", 'decision-7c-3')}
              copied={copiedIndex === 'decision-7c-3'}
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
              Als dan geen reactie → EXIT
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

function DecisionPoint({ title, color, isMobile, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={isMobile ? 16 : 18} color={color} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', color: color }}>
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
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', paddingTop: 0, animation: 'slideDown 0.2s ease-out' }}>
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
