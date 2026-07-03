// src/modules/shopping/components/BudgetOnboarding.jsx - V3 FREQ + OWN AMOUNT
import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const CATEGORIES = [
  {
    key: 'breakfast_out',
    title: 'Ontbijt buitenshuis',
    subtitle: 'Bakker, broodjeszaak, café',
    suggestedCost: 6.50,
    freqOptions: [
      { label: 'Nooit', value: 0 },
      { label: '1-2x', value: 1.5 },
      { label: '3-4x', value: 3.5 },
      { label: 'Elke dag', value: 7 }
    ]
  },
  {
    key: 'lunch_out',
    title: 'Lunch buitenshuis',
    subtitle: 'Kantine, lunchroom, broodjeszaak',
    suggestedCost: 10,
    freqOptions: [
      { label: 'Nooit', value: 0 },
      { label: '1-2x', value: 1.5 },
      { label: '3-4x', value: 3.5 },
      { label: 'Elke dag', value: 5 }
    ]
  },
  {
    key: 'dinner_out',
    title: 'Uit eten',
    subtitle: 'Restaurant, eetcafé',
    suggestedCost: 25,
    freqOptions: [
      { label: 'Nooit', value: 0 },
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '3+', value: 3.5 }
    ]
  },
  {
    key: 'delivery',
    title: 'Eten bestellen',
    subtitle: 'Thuisbezorgd, UberEats, Dominos',
    suggestedCost: 22,
    freqOptions: [
      { label: 'Nooit', value: 0 },
      { label: '1x', value: 1 },
      { label: '2-3x', value: 2.5 },
      { label: '4+', value: 4.5 }
    ]
  },
  {
    key: 'going_out',
    title: 'Uitgaan',
    subtitle: 'Café, bar, club (eten & drinken)',
    suggestedCost: 50,
    freqOptions: [
      { label: 'Nooit', value: 0 },
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '3+', value: 3 }
    ]
  },
  {
    key: 'snacks',
    title: 'Snacks & drinken onderweg',
    subtitle: 'Tankstation, kiosk, automaat, koffie to-go',
    suggestedCost: 3.50,
    freqOptions: [
      { label: 'Zelden', value: 0 },
      { label: 'Paar keer', value: 3 },
      { label: 'Dagelijks', value: 5 },
      { label: 'Veel', value: 10 }
    ]
  }
]

export default function BudgetOnboarding({ clientId, budgetService, onComplete, isMobile }) {
  // Per category: { freq, costPerTime }
  const [values, setValues] = useState(() => {
    const init = {}
    CATEGORIES.forEach(cat => {
      init[cat.key] = { freq: 0, costPerTime: cat.suggestedCost }
    })
    return init
  })
  const [step, setStep] = useState(0) // 0 = questions, 1 = reveal
  const [saving, setSaving] = useState(false)

  const setFreq = (key, freq) => {
    setValues(prev => ({ ...prev, [key]: { ...prev[key], freq } }))
  }

  const setCost = (key, costPerTime) => {
    setValues(prev => ({ ...prev, [key]: { ...prev[key], costPerTime } }))
  }

  // Calculate totals
  const categoryTotals = {}
  let weeklyTotal = 0
  CATEGORIES.forEach(cat => {
    const v = values[cat.key]
    const weekly = v.freq * v.costPerTime
    categoryTotals[cat.key] = Math.round(weekly * 100) / 100
    weeklyTotal += weekly
  })
  weeklyTotal = Math.round(weeklyTotal * 100) / 100
  const monthlyTotal = Math.round(weeklyTotal * 4.33)
  const yearlyTotal = Math.round(weeklyTotal * 52)

  const handleSave = async () => {
    setSaving(true)
    // Build frequencies + custom costs for BudgetService
    const frequencies = {}
    const costsPerTime = {}
    CATEGORIES.forEach(cat => {
      frequencies[cat.key] = values[cat.key].freq
      costsPerTime[cat.key] = values[cat.key].costPerTime
    })
    const result = await budgetService.saveBudgetBaseline(clientId, frequencies, costsPerTime)
    setSaving(false)
    if (result.success) onComplete(result.total)
  }

  // ── STEP 0: QUESTIONS ──
  if (step === 0) {
    return (
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: isMobile ? '10px' : '12px',
        overflow: 'hidden',
        transform: 'translateZ(0)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Wat geef je nu uit aan eten?
          </div>
          <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.15rem' }}>
            Per categorie: hoe vaak + hoeveel per keer
          </div>
        </div>

        {/* Categories */}
        {CATEGORIES.map((cat, catIdx) => {
          const v = values[cat.key]
          const isActive = v.freq > 0

          return (
            <div key={cat.key}>
              {/* Category row */}
              <div style={{
                padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem'
              }}>
                {/* Title + weekly cost */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.375rem'
                }}>
                  <div>
                    <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {cat.title}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'rgba(255, 255, 255, 0.2)', marginTop: '0.05rem' }}>
                      {cat.subtitle}
                    </div>
                  </div>
                  {isActive && (
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      fontWeight: 800,
                      color: '#ef4444'
                    }}>
                      €{Math.round(categoryTotals[cat.key])}/w
                    </span>
                  )}
                </div>

                {/* Frequency pills */}
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: isActive ? '0.375rem' : 0
                }}>
                  {cat.freqOptions.map(opt => {
                    const selected = v.freq === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFreq(cat.key, opt.value)}
                        style={{
                          flex: 1,
                          padding: isMobile ? '0.3rem 0.25rem' : '0.35rem 0.375rem',
                          background: selected ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                          border: selected
                            ? '1px solid rgba(255, 215, 0, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '6px',
                          color: selected ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                          fontSize: isMobile ? '0.55rem' : '0.6rem',
                          fontWeight: selected ? 700 : 600,
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          outline: 'none',
                          minHeight: '28px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          textAlign: 'center'
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {/* Cost per time — only shows when freq > 0 */}
                {isActive && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.55rem',
                      color: 'rgba(255, 255, 255, 0.25)',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      Per keer:
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.125rem'
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>€</span>
                      <input
                        type="number"
                        value={v.costPerTime}
                        onChange={(e) => setCost(cat.key, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '52px',
                          height: '26px',
                          padding: '0 0.25rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '5px',
                          color: '#fff',
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#FFD700' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)' }}
                      />
                    </div>
                    <span style={{
                      fontSize: '0.45rem',
                      color: 'rgba(255, 255, 255, 0.15)',
                      fontWeight: 600
                    }}>
                      suggestie: €{cat.suggestedCost}
                    </span>
                  </div>
                )}
              </div>

              {catIdx < CATEGORIES.length - 1 && (
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }} />
              )}
            </div>
          )
        })}

        {/* Running total + continue */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{
            display: 'flex',
            background: weeklyTotal > 0 ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
          }}>
            {[
              { label: 'Per week', value: `€${Math.round(weeklyTotal)}`, color: weeklyTotal > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)' },
              { label: 'Per maand', value: `€${monthlyTotal}`, color: weeklyTotal > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)' },
              { label: 'Per jaar', value: `€${yearlyTotal}`, color: weeklyTotal > 0 ? '#ef4444' : 'rgba(255,255,255,0.2)' }
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center',
                padding: isMobile ? '0.5rem 0.125rem' : '0.625rem 0.25rem',
                borderRight: i < 2 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
              }}>
                <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem' }}>
            <button
              onClick={() => setStep(1)}
              disabled={weeklyTotal === 0}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: weeklyTotal > 0 ? '#FFD700' : 'rgba(255, 255, 255, 0.04)',
                border: 'none',
                borderRadius: '8px',
                color: weeklyTotal > 0 ? '#000' : 'rgba(255, 255, 255, 0.15)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: 800,
                cursor: weeklyTotal > 0 ? 'pointer' : 'default',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.375rem'
              }}
              onTouchStart={e => { if (weeklyTotal > 0) e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              Bekijk hoeveel je bespaart
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1: REVEAL ──
  const planCost = 78
  const weeklySaving = Math.max(0, weeklyTotal - planCost)
  const monthlySaving = Math.round(weeklySaving * 4.33)
  const yearlySaving = Math.round(weeklySaving * 52)
  const fiveYearSaving = yearlySaving * 5

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      transform: 'translateZ(0)'
    }}>
      {/* Current spend */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
          Jij geeft nu uit
        </div>
        <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.03em', lineHeight: 1 }}>
          €{Math.round(weeklyTotal)}
          <span style={{ fontSize: '0.5rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.3)', marginLeft: '0.15rem' }}>/week</span>
        </div>
        <div style={{ fontSize: '0.55rem', color: 'rgba(255, 255, 255, 0.2)', marginTop: '0.25rem' }}>
          €{monthlyTotal}/maand · €{yearlyTotal}/jaar
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem' }}>
        {CATEGORIES.filter(cat => values[cat.key].freq > 0).map((cat, idx, arr) => (
          <div key={cat.key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.3rem 0',
            borderBottom: idx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
          }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)' }}>{cat.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255, 255, 255, 0.15)' }}>
                {values[cat.key].freq}x × €{values[cat.key].costPerTime}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', minWidth: '40px', textAlign: 'right' }}>
                €{Math.round(categoryTotals[cat.key])}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* VS bar */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.5rem' : '0.625rem', borderRight: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Voorheen</div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#ef4444', lineHeight: 1, textDecoration: 'line-through', textDecorationColor: 'rgba(239,68,68,0.4)' }}>€{Math.round(weeklyTotal)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.5rem' : '0.625rem', borderRight: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Met MY ARC</div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>€{planCost}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.5rem' : '0.625rem' }}>
          <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Besparing</div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>€{Math.round(weeklySaving)}</div>
        </div>
      </div>

      {/* Lifetime */}
      <div style={{ display: 'flex', background: 'rgba(255, 215, 0, 0.02)' }}>
        {[
          { label: 'Per maand', value: `€${monthlySaving}` },
          { label: 'Per jaar', value: `€${yearlySaving}` },
          { label: '5 jaar', value: `€${fiveYearSaving}` }
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem',
            borderRight: i < 2 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
          }}>
            <div style={{ fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '0.75rem',
            background: '#FFD700', border: 'none', borderRadius: '8px',
            color: '#000', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800,
            cursor: saving ? 'wait' : 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '44px', outline: 'none', opacity: saving ? 0.6 : 1
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {saving ? 'Opslaan...' : 'OPSLAAN — Begin met besparen'}
        </button>
        <button onClick={() => setStep(0)} style={{
          width: '100%', padding: '0.5rem', background: 'transparent', border: 'none',
          color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.6rem', fontWeight: 600,
          cursor: 'pointer', marginTop: '0.375rem', outline: 'none'
        }}>
          Aanpassen
        </button>
      </div>
    </div>
  )
}
