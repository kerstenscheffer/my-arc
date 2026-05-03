// src/modules/sales/components/dm-training/ImpactCallPushPhase.jsx
import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'

export default function ImpactCallPushPhase({ isMobile, color }) {
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
          label="JIJ (Impact vraag)"
          text="Snap ik man, de meeste mensen doen dat niet. Maar dat is vaak precies het probleem.

Want als je niet weet hoeveel je eet, kun je ook niet weten of het genoeg is om te groeien. Dan gooi je er gewoon wat in en hoop je dat het werkt.

Hoeveel impact heeft het op je progressie dat je niet weet hoeveel je moet eten, denk je?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Snap ik man, de meeste mensen doen dat niet. Maar dat is vaak precies het probleem.\n\nWant als je niet weet hoeveel je eet, kun je ook niet weten of het genoeg is om te groeien. Dan gooi je er gewoon wat in en hoop je dat het werkt.\n\nHoeveel impact heeft het op je progressie dat je niet weet hoeveel je moet eten, denk je?", 'main-1')}
          copied={copiedIndex === 'main-1'}
        />

        <MessageBlock
          label="NOAH"
          text="Hmmm, ja ik denk wel dat het impact heeft op mijn progressie. Denk dat ik daarom niet echt groei zoals ik zou willen of zo. Eet waarschijnlijk gewoon te weinig."
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <MessageBlock
          label="JIJ (Call Push Stap 1)"
          text="Precies man, dat is vaak het verhaal. Je traint wel goed, maar je lichaam krijgt niet genoeg bouwstenen om daadwerkelijk spieren op te bouwen.

Kijk, je bent nu al 6 maanden consistent aan het trainen, dat is echt top. Maar je mist de kennis over hoeveel je moet eten en wat je moet eten om te groeien.

Dat is precies waar ik jongens mee help. Ik laat ze zien hoeveel ze precies moeten eten voor hun doel, welke producten het makkelijkst zijn, en hoe ze het consistent kunnen volhouden zonder al te veel geld of tijd kwijt te zijn aan eten. 🔥

Zou dat iets zijn waar je op dit moment meer richting in wilt krijgen?"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Precies man, dat is vaak het verhaal. Je traint wel goed, maar je lichaam krijgt niet genoeg bouwstenen om daadwerkelijk spieren op te bouwen.\n\nKijk, je bent nu al 6 maanden consistent aan het trainen, dat is echt top. Maar je mist de kennis over hoeveel je moet eten en wat je moet eten om te groeien.\n\nDat is precies waar ik jongens mee help. Ik laat ze zien hoeveel ze precies moeten eten voor hun doel, welke producten het makkelijkst zijn, en hoe ze het consistent kunnen volhouden zonder al te veel geld of tijd kwijt te zijn aan eten. 🔥\n\nZou dat iets zijn waar je op dit moment meer richting in wilt krijgen?", 'main-2')}
          copied={copiedIndex === 'main-2'}
        />

        <MessageBlock
          label="NOAH"
          text="Ja zeker man! Zou echt helpen denk ik. Ben het zat om niet te groeien terwijl ik wel train."
          isMobile={isMobile}
          color="rgba(255, 255, 255, 0.5)"
          isResponse
        />

        <MessageBlock
          label="JIJ (Call Push Stap 2)"
          text="Top dat je dat zo voelt man! 💪

Dan lijkt het me waardevol om een call te doen, zodat we samen je situatie kunnen verkennen en concreet kunnen maken wat jij precies moet doen om wel te groeien zonder blijven gokken hoeveel je eet.

In de call gaan we kijken naar:
- Hoeveel je precies moet eten voor jouw lichaam en doel
- Welke producten het makkelijkst zijn om genoeg binnen te krijgen
- Hoe je het consistent kunt volhouden

En als het aan beide kanten goed voelt, kan ik laten zien hoe, en of ik je verder kan helpen om die 5-8kg spier erbij te krijgen.

Ik check even mijn agenda. Het is handig als ik alvast je e-mailadres heb, dan stuur ik je een Calendly link. 📅"
          isMobile={isMobile}
          color={color}
          onCopy={() => copyText("Top dat je dat zo voelt man! 💪\n\nDan lijkt het me waardevol om een call te doen, zodat we samen je situatie kunnen verkennen en concreet kunnen maken wat jij precies moet doen om wel te groeien zonder blijven gokken hoeveel je eet.\n\nIn de call gaan we kijken naar:\n- Hoeveel je precies moet eten voor jouw lichaam en doel\n- Welke producten het makkelijkst zijn om genoeg binnen te krijgen\n- Hoe je het consistent kunt volhouden\n\nEn als het aan beide kanten goed voelt, kan ik laten zien hoe, en of ik je verder kan helpen om die 5-8kg spier erbij te krijgen.\n\nIk check even mijn agenda. Het is handig als ik alvast je e-mailadres heb, dan stuur ik je een Calendly link. 📅", 'main-3')}
          copied={copiedIndex === 'main-3'}
        />

        <MessageBlock
          label="NOAH"
          text="Sounds good! noah.jansen@gmail.com"
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
          → FASE 7 (Booking)
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
            title="6A: MOET NADENKEN"
            color="#f59e0b"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Ja misschien wel, maar moet er even over nadenken"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Snap ik helemaal man! Kun je mij vertellen waar je over na moet denken?"
              isMobile={isMobile}
              onCopy={() => copyText("Snap ik helemaal man! Kun je mij vertellen waar je over na moet denken?", 'decision-6a-1')}
              copied={copiedIndex === 'decision-6a-1'}
            />

            <ActionBlock
              label="DAN:"
              text="Ahh oké. Bedenk wel: De call is gratis en je bent nergens toe verplicht. Gewoon kijken of ik je kan helpen. Klinkt dat fair?"
              isMobile={isMobile}
              onCopy={() => copyText("Ahh oké. Bedenk wel: De call is gratis en je bent nergens toe verplicht. Gewoon kijken of ik je kan helpen. Klinkt dat fair?", 'decision-6a-2')}
              copied={copiedIndex === 'decision-6a-2'}
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
              Als "Ja oké" → FASE 7 | Als "Nee" → EXIT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="6B: GEEN TIJD"
            color="#ef4444"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Wil wel maar heb nu echt geen tijd"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Snap ik man, iedereen is druk. Maar even eerlijk: 15 minuten is letterlijk minder dan één Netflix aflevering. Kun je dat echt niet ergens vinden?"
              isMobile={isMobile}
              onCopy={() => copyText("Snap ik man, iedereen is druk. Maar even eerlijk: 15 minuten is letterlijk minder dan één Netflix aflevering. Kun je dat echt niet ergens vinden?", 'decision-6b-1')}
              copied={copiedIndex === 'decision-6b-1'}
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
              Als "Ja dat wel" → "Wanneer volgende week?" → FASE 7
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="6C: WIL ZELF PROBEREN"
            color="#8b5cf6"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Kan ik het niet eerst zelf proberen met de training?"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Respect dat je het zelf wilt proberen man. Maar even eerlijk: als het over 3 maanden nog steeds niet werkt, heb je wel 3 maanden verspild.

Waarom niet eerst even 15 minuten investeren om te weten of je de juiste richting opgaat?"
              isMobile={isMobile}
              onCopy={() => copyText("Respect dat je het zelf wilt proberen man. Maar even eerlijk: als het over 3 maanden nog steeds niet werkt, heb je wel 3 maanden verspild.\n\nWaarom niet eerst even 15 minuten investeren om te weten of je de juiste richting opgaat?", 'decision-6c-1')}
              copied={copiedIndex === 'decision-6c-1'}
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
              Als "Ja dat is waar" → FASE 7 | Als "Nee toch zelf" → EXIT
            </div>
          </DecisionPoint>

          <DecisionPoint
            title="6D: VIA CHAT?"
            color="#14b8a6"
            isMobile={isMobile}
          >
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.5rem'
              }}>
                <strong>Noah:</strong> "Kun je me niet gewoon via chat helpen?"
              </div>
            </div>

            <ActionBlock
              label="JIJ:"
              text="Snap ik helemaal man! Maar eerlijk gezegd kan ik je via chat niet zo goed helpen. In een gesprek kan ik doorvragen, precies horen wat er speelt, en je echt op maat advies geven. Dat lukt via tekst gewoon niet goed.

In 15 minuten bellen krijg je echt veel meer waarde dan 20 berichten sturen. Trust me 💪"
              isMobile={isMobile}
              onCopy={() => copyText("Snap ik helemaal man! Maar eerlijk gezegd kan ik je via chat niet zo goed helpen. In een gesprek kan ik doorvragen, precies horen wat er speelt, en je echt op maat advies geven. Dat lukt via tekst gewoon niet goed.\n\nIn 15 minuten bellen krijg je echt veel meer waarde dan 20 berichten sturen. Trust me 💪", 'decision-6d-1')}
              copied={copiedIndex === 'decision-6d-1'}
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
              Als "Oké fair" → FASE 7 | Als "Nee liever chat" → EXIT
            </div>
          </DecisionPoint>
        </div>
      )}
    </div>
  )
}

// Helper Components (same pattern as before)
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
