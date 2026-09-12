// src/modules/workout/components/todays-workout/components/AttachmentSelector.jsx
import { useState } from 'react'
import { ChevronDown, Check, AlertTriangle } from 'lucide-react'
import BladModal from './BladModal'
import { ATTACHMENTS, getAttachment, getExerciseAttachmentDefaults } from '../../../constants/attachments'

// `compact` = als knopje naast de oefeningtitel in plaats van als eigen blok
// met kopregel. Zelfde keuzescherm eronder; alleen de trigger verschilt.
export default function AttachmentSelector({ suggested, value, onChange, isMobile, exerciseName, compact = false }) {
  const [showPicker, setShowPicker] = useState(false)

  // Haal defaults op voor deze oefening
  const defaults = getExerciseAttachmentDefaults(exerciseName)
  const autoDefault = defaults?.default
  const availableIds = defaults?.available || null // null = alles tonen

  // Actieve attachment: expliciet gekozen > coach suggested > auto default
  const activeId = value || suggested || autoDefault
  const current = getAttachment(activeId)
  const isDefault = !value && !suggested && !!autoDefault
  const isSuggested = !value && !!suggested

  // Toon nu ALLE attachments, niet alleen de voorgeschreven. Daarmee kan
  // de klant kiezen voor iets dat niet in de defaults staat (bv. dumbbells
  // voor overhead tricep extension) — wel met een waarschuwingslabel.
  // Voorgeschreven attachments staan bovenaan, niet-voorgeschreven daaronder.
  const isPrescribed = (id) => !availableIds || availableIds.includes(id)
  const prescribed = ATTACHMENTS.filter(a => isPrescribed(a.id))
  const others = ATTACHMENTS.filter(a => !isPrescribed(a.id))
  const activeIsPrescribed = isPrescribed(activeId)

  // Het keuzescherm. Eén keer beschreven en door beide varianten gebruikt —
  // de compacte knop naast de titel en het volle blok eronder verschillen
  // alleen in hun trigger.
  // Eén tegel per stuk materiaal. Voorgeschreven boven, de rest eronder met
  // een waarschuwing erbij.
  const tegel = (attachment, { gekozen, aanbevolen, buitenPlan }) => (
    <button
      key={attachment.id}
      onClick={() => { onChange(attachment.id); setShowPicker(false) }}
      style={{
        background: gekozen ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `1px solid ${gekozen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, padding: '0.6rem 0.4rem 0.55rem',
        cursor: 'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
        fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {aanbevolen && !gekozen && (
        <span style={{
          position: 'absolute', top: 5, right: 5,
          fontSize: '0.5rem', fontWeight: 900, color: '#FFD700',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Advies
        </span>
      )}
      {gekozen && (
        <span style={{
          position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={10} color="#0a0a0a" strokeWidth={3.5} />
        </span>
      )}
      <div style={{
        width: '100%', aspectRatio: '1 / 1', borderRadius: 9,
        backgroundImage: `url(${attachment.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: gekozen ? 1 : buitenPlan ? 0.5 : 0.8,
      }} />
      <div style={{
        fontSize: '0.7rem', fontWeight: 800,
        color: gekozen ? '#fff' : 'rgba(255,255,255,0.6)',
        textAlign: 'center', lineHeight: 1.25,
      }}>
        {attachment.nl}
      </div>
    </button>
  )

  const picker = (
    <BladModal open={showPicker} titel="Kies je materiaal" onClose={() => setShowPicker(false)}>
      {prescribed.length > 0 && (
        <>
          {availableIds && (
            <div style={{
              fontSize: '0.66rem', fontWeight: 900, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem',
            }}>
              Voorgeschreven
            </div>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
            gap: '0.6rem', marginBottom: others.length > 0 ? '1.4rem' : 0,
          }}>
            {prescribed.map(a => tegel(a, {
              gekozen: activeId === a.id,
              aanbevolen: (suggested === a.id && !value) || (autoDefault === a.id && !value && !suggested),
              buitenPlan: false,
            }))}
          </div>
        </>
      )}

      {others.length > 0 && availableIds && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
            fontSize: '0.66rem', fontWeight: 900, color: '#f59e0b',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <AlertTriangle size={12} strokeWidth={2.6} />
            Overig
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45, marginBottom: '0.6rem' }}>
            Niet voorgeschreven voor deze oefening. Kies dit alleen als je het met je coach hebt overlegd.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: '0.6rem' }}>
            {others.map(a => tegel(a, { gekozen: activeId === a.id, aanbevolen: false, buitenPlan: true }))}
          </div>
        </>
      )}
    </BladModal>
  )

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowPicker(true)}
          title={current ? `Materiaal: ${current.nl}` : 'Kies je materiaal'}
          /* Geen kader eromheen: de foto is al een blok, en een doos daar
             weer omheen kostte breedte die de naam nodig heeft. */
          style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            width: '100%', minHeight: 44,
            background: 'transparent', border: 'none', padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {current
            ? <div style={{ width: 30, height: 30, borderRadius: 7, backgroundImage: `url(${current.img})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
            : <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />}
          <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
            <div style={{
              fontSize: '0.66rem', fontWeight: 900, color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1,
            }}>
              Materiaal
            </div>
            <div style={{
              fontSize: isMobile ? '0.74rem' : '0.8rem', fontWeight: 700,
              color: current ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', marginTop: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {current ? current.nl : 'Kiezen…'}
            </div>
          </div>
          <ChevronDown size={14} color="rgba(255,255,255,0.3)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
        </button>
        {picker}
      </>
    )
  }

  return (
    <>
      {/* Compact blokje */}
      <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,215,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Materiaal
          {isSuggested && <span style={{ marginLeft: '0.4rem', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>· aanbevolen door coach</span>}
          {isDefault && <span style={{ marginLeft: '0.4rem', fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'none', letterSpacing: '0' }}>· standaard voor deze oefening</span>}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.15s ease' }}
          onTouchStart={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
          onTouchEnd={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          {current ? (
            <>
              {/* Foto */}
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundImage: `url(${current.img})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, opacity: 1 }} />
              {/* Naam */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '700', color: '#fff' }}>{current.nl}</div>
                {isSuggested && <div style={{ fontSize: '0.58rem', color: 'rgba(255,215,0,0.4)', fontWeight: '600', marginTop: '0.1rem' }}>Aanbevolen</div>}
                {!!value && !activeIsPrescribed && (
                  <div style={{
                    fontSize: '0.58rem', color: '#f59e0b',
                    fontWeight: 700, marginTop: '0.15rem',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <AlertTriangle size={9} strokeWidth={2.6} />
                    Niet voorgeschreven — overleg met coach
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, textAlign: 'left', fontSize: isMobile ? '0.82rem' : '0.87rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontStyle: 'italic' }}>
              Selecteer materiaal...
            </div>
          )}
          <ChevronDown size={14} color="rgba(255,255,255,0.25)" strokeWidth={2.5} />
        </button>
      </div>

      {picker}
    </>
  )
}
