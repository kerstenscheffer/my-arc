// src/modules/sales/components/dm-training/LeadMagnetPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function LeadMagnetPhase({ isMobile, color }) {
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
          text="Snap ik helemaal man, dat begin is ook het lastigste. Zeker als je niet weet hoeveel je moet eten om richting je doel te gaan. Maar goed dat je je er in ieder geval al bewust van bent! Dat is al een sterke eerste stap. 💪

Wat ik vaak zie is dat het missen van de juiste voeding ervoor zorgt dat veel jongens niet de spiergroei maken die ze zouden kunnen maken, simpelweg omdat hun lichaam niet de bouwstenen krijgt om efficiënt spieren op te bouwen.

Ik heb een gratis training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.

Zou je het interessant vinden om deze te ontvangen? Dan stuur ik je de training even door? 👌"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Snap ik helemaal man, dat begin is ook het lastigste. Zeker als je niet weet hoeveel je moet eten om richting je doel te gaan. Maar goed dat je je er in ieder geval al bewust van bent! Dat is al een sterke eerste stap. 💪\n\nWat ik vaak zie is dat het missen van de juiste voeding ervoor zorgt dat veel jongens niet de spiergroei maken die ze zouden kunnen maken, simpelweg omdat hun lichaam niet de bouwstenen krijgt om efficiënt spieren op te bouwen.\n\nIk heb een gratis training gemaakt voor (startende) lifters die willen doorgroeien naar hun droom fysiek en binnen 6 maanden 5-8KG spier op willen bouwen.\n\nZou je het interessant vinden om deze te ontvangen? Dan stuur ik je de training even door? 👌", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Ja dat klinkt interessant, ik zou deze training graag ontvangen!"
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <MessageBlock
          label="JIJ"
          text="Zoals beloofd hier de training en bijbehorend stappenplan:

Ik heb een e-book die je kunt downloaden en bij je kunt houden, en een video waar ik het snel en duidelijk uitleg.

[LINKS]

Ben benieuwd wat je ervan vindt, laat het zeker even weten!

Waar ik ook wel benieuwd naar ben: wat merk jij op dit moment dat je grootste uitdaging is om dit doel te bereiken?

Misschien kan ik je nog een stapje in de juiste richting helpen."
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Zoals beloofd hier de training en bijbehorend stappenplan:\n\nIk heb een e-book die je kunt downloaden en bij je kunt houden, en een video waar ik het snel en duidelijk uitleg.\n\n[LINKS]\n\nBen benieuwd wat je ervan vindt, laat het zeker even weten!\n\nWaar ik ook wel benieuwd naar ben: wat merk jij op dit moment dat je grootste uitdaging is om dit doel te bereiken?\n\nMisschien kan ik je nog een stapje in de juiste richting helpen.", 'main-2')}
          copied={copiedIndex === 'main-2'}
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
          → WACHT OP REACTIE → FASE 5
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
            title="4A: NEE DANK JE"
            color="#ef4444"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Nee dank je, niet interested"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Helemaal goed man! Mocht je ooit vragen hebben over voeding of training, laat maar weten 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Helemaal goed man! Mocht je ooit vragen hebben over voeding of training, laat maar weten 💪", 'decision-4a-1')}
              copied={copiedIndex === 'decision-4a-1'}
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
              → EXIT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="4B: MISSCHIEN LATER"
            color="#f59e0b"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Misschien later man, heb nu geen tijd"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Helemaal goed man! Laat maar weten wanneer het beter uitkomt, dan stuur ik hem door 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Helemaal goed man! Laat maar weten wanneer het beter uitkomt, dan stuur ik hem door 💪", 'decision-4b-1')}
              copied={copiedIndex === 'decision-4b-1'}
            />

            <div style={{ margin: '1rem 0 0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
              FOLLOW-UP DAG 3:
            </div>

            <ActionBlock
              text="Heyy Noah! Zou je die training nog willen ontvangen of is het nu niet het juiste moment?"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Zou je die training nog willen ontvangen of is het nu niet het juiste moment?", 'decision-4b-2')}
              copied={copiedIndex === 'decision-4b-2'}
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
              Als JA → Stuur training | Als NEE → EXIT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="4C: GHOST NA LEAD MAGNET"
            color="#8b5cf6"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Situatie:</strong> Training gestuurd, maar Noah reageert niet
              </div>
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 2:"
              text="Heyy Noah! Heb je de training al kunnen bekijken? Benieuwd wat je ervan vindt! 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Heb je de training al kunnen bekijken? Benieuwd wat je ervan vindt! 💪", 'decision-4c-1')}
              copied={copiedIndex === 'decision-4c-1'}
            />

            <div style={{ margin: '0.75rem 0', fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
              Als reactie → FASE 5
            </div>

            <ActionBlock
              label="FOLLOW-UP DAG 5:"
              text="Heyy Noah! Geen stress als je druk bent hoor. Mocht je de training bekijken en vragen hebben, laat maar weten! 🤙"
              isMobile={isMobile}
              onCopy={() => copyText("Heyy Noah! Geen stress als je druk bent hoor. Mocht je de training bekijken en vragen hebben, laat maar weten! 🤙", 'decision-4c-2')}
              copied={copiedIndex === 'decision-4c-2'}
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

// Helper Components (same pattern)
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
