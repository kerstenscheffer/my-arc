// src/modules/nutrition-intake/components/SupplementSection.jsx
// Supplementen — meer context dan standaard PreferenceSection
// Vraagt: wat neem je nu, sta je open voor supps, budget
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const RECOMMENDED_SUPPS = [
  {
    id: 'creatine',
    name: 'Creatine Monohydraat',
    dose: '5g per dag',
    why: 'Meest bewezen supplement voor kracht en spiergroei. Goedkoop en veilig.',
    tags: []
  },
  {
    id: 'omega3',
    name: 'Omega-3 Visolie',
    dose: '2-3g per dag',
    why: 'Herstel, ontstekingsremming, hart- en hormonale gezondheid.',
    tags: ['vis']
  },
  {
    id: 'vitd',
    name: 'Vitamine D3',
    dose: '2000-4000 IU per dag',
    why: 'De meeste Nederlanders zijn deficiënt. Belangrijk voor immuunsysteem en botten.',
    tags: []
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    dose: '400mg voor het slapen',
    why: 'Slaapkwaliteit, spierherstel, stressregulatie.',
    tags: []
  },
  {
    id: 'whey',
    name: 'Whey Protein',
    dose: 'Naar behoefte',
    why: 'Alleen als je moeite hebt je eiwit target te halen via voeding.',
    tags: ['zuivel']
  }
]

const OPENNESS_OPTIONS = [
  { id: 'ja_graag', label: 'Ja, ik sta open voor supplementen' },
  { id: 'basics', label: 'Alleen de basis (creatine, vitamines)' },
  { id: 'liever_niet', label: 'Liever niet, tenzij echt nodig' },
  { id: 'nee', label: 'Nee, geen supplementen' }
]

const BUDGET_OPTIONS = [
  { id: '0', label: 'Geen budget voor supps' },
  { id: '15-25', label: '€15 — 25 / maand' },
  { id: '25-40', label: '€25 — 40 / maand' },
  { id: '40+', label: '€40+ / maand' }
]

export default function SupplementSection({ value, onChange, isMobile, allergenData }) {
  const [data, setData] = useState({
    openness: null,
    supp_budget: null,
    current_supps: '',
    recommended_removals: [],
    notes: '',
    ...(value || {})
  })

  useEffect(() => {
    if (value) setData(prev => ({ ...prev, ...value }))
  }, [value])

  const update = (field, val) => setData(prev => ({ ...prev, [field]: val }))

  const toggleRecommended = (suppId) => {
    const current = data.recommended_removals || []
    update('recommended_removals', current.includes(suppId) ? current.filter(id => id !== suppId) : [...current, suppId])
  }

  // Filter supps based on allergens
  const blockedTags = new Set()
  if (allergenData) {
    const ALLERGEN_TO_TAGS = { 'lactose': ['zuivel'], 'vis': ['vis'] }
    ;(allergenData.selected_allergens || []).forEach(a => {
      (ALLERGEN_TO_TAGS[a] || []).forEach(tag => blockedTags.add(tag))
    })
  }
  const availableSupps = RECOMMENDED_SUPPS.filter(s => !(s.tags || []).some(tag => blockedTags.has(tag)))
  const blockedSupps = RECOMMENDED_SUPPS.filter(s => (s.tags || []).some(tag => blockedTags.has(tag)))

  const showRecommendations = data.openness && data.openness !== 'nee'
  const isComplete = !!data.openness

  const handleConfirm = () => {
    if (!isComplete) return
    onChange(data)
  }

  return (
    <div>
      {/* Sta je open voor supplementen? */}
      <QRow label="Sta je open voor supplementen?" isMobile={isMobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: r(isMobile, '0.25rem', '0.3rem') }}>
          {OPENNESS_OPTIONS.map(opt => {
            const sel = data.openness === opt.id
            return (
              <button key={opt.id} onClick={() => update('openness', opt.id)} style={{
                padding: r(isMobile, '0.5rem 0.6rem', '0.55rem 0.7rem'),
                background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                borderRadius: '8px', color: sel ? '#FFD700' : t.colors.textSecondary,
                fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600,
                cursor: 'pointer', minHeight: '40px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', textAlign: 'left', fontFamily: 'inherit'
              }}>{opt.label}</button>
            )
          })}
        </div>
      </QRow>

      {/* Budget voor supplementen */}
      {showRecommendations && (
        <QRow label="Hoeveel wil je uitgeven aan supplementen?" isMobile={isMobile}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: r(isMobile, '0.3rem', '0.35rem') }}>
            {BUDGET_OPTIONS.map(opt => {
              const sel = data.supp_budget === opt.id
              return (
                <button key={opt.id} onClick={() => update('supp_budget', opt.id)} style={{
                  padding: r(isMobile, '0.5rem 0.5rem', '0.55rem 0.6rem'),
                  background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
                  border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
                  borderRadius: '8px', color: sel ? '#FFD700' : t.colors.textSecondary,
                  fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600,
                  cursor: 'pointer', minHeight: '40px',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease', textAlign: 'center', fontFamily: 'inherit'
                }}>{opt.label}</button>
              )
            })}
          </div>
        </QRow>
      )}

      {/* Wat neem je nu al? */}
      {showRecommendations && (
        <QRow label="Neem je op dit moment al supplementen?" isMobile={isMobile}>
          <input type="text" value={data.current_supps} onChange={e => update('current_supps', e.target.value)}
            placeholder="Bijv: creatine, multivitamine, eiwitshake..."
            style={{
              width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
              background: t.colors.inputBg,
              border: `1px solid ${data.current_supps ? 'rgba(255,215,0,0.25)' : t.colors.borderVisible}`,
              borderRadius: '8px', color: data.current_supps ? '#FFD700' : t.colors.white,
              fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: data.current_supps ? 700 : 600,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
            }}
            onFocus={e => { e.target.style.borderColor = '#FFD700' }}
            onBlur={e => { e.target.style.borderColor = data.current_supps ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)' }}
          />
        </QRow>
      )}

      {/* Aanbevolen supplementen */}
      {showRecommendations && (
        <div style={{ borderBottom: `1px solid ${t.colors.border}` }}>
          <div style={{
            padding: r(isMobile, '0.35rem 1rem', '0.4rem 1.25rem'),
            background: t.colors.goldBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: `1px solid ${t.colors.border}`
          }}>
            <span style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.gold }}>Ons advies — deselecteer wat je niet wilt</span>
            <span style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 800, color: t.colors.textSecondary }}>
              {availableSupps.length - (data.recommended_removals || []).length}/{availableSupps.length}
            </span>
          </div>

          {/* Blocked by allergens */}
          {blockedSupps.length > 0 && (
            <div style={{
              padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.04)',
              borderBottom: `1px solid ${t.colors.border}`,
              fontSize: r(isMobile, '0.55rem', '0.6rem'), color: 'rgba(239,68,68,0.6)', fontWeight: 600
            }}>
              Uitgesloten door allergieën: {blockedSupps.map(s => s.name).join(', ')}
            </div>
          )}

          {availableSupps.map((supp, index) => {
            const isRemoved = (data.recommended_removals || []).includes(supp.id)
            return (
              <div key={supp.id} onClick={() => toggleRecommended(supp.id)} style={{
                padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'),
                borderBottom: index < availableSupps.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                opacity: isRemoved ? 0.35 : 1,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: r(isMobile, '0.5rem', '0.6rem') }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '4px', marginTop: '0.1rem',
                    border: `2px solid ${isRemoved ? t.colors.red : t.colors.gold}`,
                    background: isRemoved ? 'transparent' : t.colors.gold,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s ease'
                  }}>
                    {!isRemoved && <span style={{ fontSize: '11px', fontWeight: 800, color: '#000' }}>{'\u2713'}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.1rem' }}>
                      <span style={{
                        fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: 700,
                        color: isRemoved ? t.colors.textMuted : t.colors.white,
                        textDecoration: isRemoved ? 'line-through' : 'none'
                      }}>{supp.name}</span>
                      <span style={{
                        fontSize: r(isMobile, '0.5rem', '0.52rem'), fontWeight: 700,
                        color: t.colors.gold, opacity: 0.6
                      }}>{supp.dose}</span>
                    </div>
                    <div style={{
                      fontSize: r(isMobile, '0.55rem', '0.58rem'),
                      color: t.colors.textMuted, lineHeight: 1.35
                    }}>{supp.why}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Extra opmerkingen */}
      {showRecommendations && (
        <QRow label="Overige opmerkingen over supplementen?" isMobile={isMobile}>
          <textarea value={data.notes} onChange={e => update('notes', e.target.value)}
            placeholder="Bijv: ik heb een maagprobleem met visolie, ik wil alleen plantaardige supps..."
            rows={2} style={{
              width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
              background: t.colors.inputBg, border: `1px solid ${t.colors.borderVisible}`,
              borderRadius: '8px', color: t.colors.white,
              fontSize: r(isMobile, '0.8rem', '0.85rem'), fontFamily: 'inherit',
              outline: 'none', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box'
            }}
            onFocus={e => { e.target.style.borderColor = '#FFD700' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </QRow>
      )}

      {/* Confirm */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={handleConfirm} disabled={!isComplete} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: isComplete ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isComplete ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
          borderRadius: '8px', color: isComplete ? '#FFD700' : t.colors.textMuted,
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: isComplete ? 'pointer' : 'default', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: isComplete ? 1 : 0.4, transition: 'all 0.2s ease'
        }}>
          {data.openness === 'nee' ? 'GEEN SUPPLEMENTEN — DOOR' : 'OPSLAAN EN DOOR'}
        </button>
      </div>
    </div>
  )
}

function QRow({ label, children, isMobile }) {
  return (
    <div style={{ padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: r(isMobile, '0.35rem', '0.4rem') }}>{label}</div>
      {children}
    </div>
  )
}
