// Vraag die verschijnt als je een terugkerende taak verwijdert of inkort:
// geldt het voor deze datum of voor de hele reeks? De keuze gaat terug via
// onChoose.

import { Repeat, Calendar } from 'lucide-react'
import { Venster, VensterKop, VensterVoet, Knop } from '../../../../components/arc-ui'

export default function RecurringActionPrompt({
  action,           // 'delete' | 'shorten'
  dateLabel,        // leesbare datum bij de "alleen deze"-keuze
  onChoose,         // (scope: 'only-this' | 'all') => void
  onCancel,
  isMobile = false,
}) {
  const isDelete = action === 'delete'

  // Twee brede keuzes met uitleg eronder, zoals pauze/coaching in de agenda.
  const keuzes = [
    {
      scope: 'only-this',
      Icon: Calendar,
      kop: isDelete ? 'Alleen deze datum verwijderen' : 'Alleen deze datum aanpassen',
      sub: dateLabel || 'De rest van de reeks blijft staan',
    },
    {
      scope: 'all',
      Icon: Repeat,
      kop: isDelete ? 'Hele reeks verwijderen' : 'Hele reeks aanpassen',
      sub: 'Geldt voor elke week',
      gevaar: isDelete,
    },
  ]

  return (
    <Venster isMobile={isMobile} onClose={onCancel} maxWidth={400} zIndex={2147483640}>
      <VensterKop
        isMobile={isMobile}
        titel={isDelete ? 'Terugkerende taak verwijderen' : 'Terugkerende taak aanpassen'}
        sub="Voor welke dagen geldt dit?"
        onClose={onCancel}
      />

      <div style={{ padding: isMobile ? '1rem' : '1.15rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {keuzes.map(k => (
          <button
            key={k.scope}
            type="button"
            onClick={() => onChoose(k.scope)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              padding: '0.7rem 0.85rem', minHeight: 52, borderRadius: 10,
              background: k.gevaar ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${k.gevaar ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <k.Icon
              size={16}
              strokeWidth={2.4}
              color={k.gevaar ? '#fca5a5' : 'rgba(255,255,255,0.7)'}
              style={{ flexShrink: 0 }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{
                display: 'block', fontSize: '0.85rem', fontWeight: 900,
                color: k.gevaar ? '#fca5a5' : '#fff', letterSpacing: '-0.015em',
              }}>
                {k.kop}
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {k.sub}
              </span>
            </span>
          </button>
        ))}
      </div>

      <VensterVoet isMobile={isMobile}>
        <Knop soort="stil" flex={1} onClick={onCancel}>Annuleer</Knop>
      </VensterVoet>
    </Venster>
  )
}
