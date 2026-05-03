// ============================================
// 📁 FILE: src/modules/client-journey/components/SetupFlow.jsx
// 3-step setup: Template → Customize → Actions
// ============================================
import React from 'react'
import { CheckCircle, ChevronRight, Plus, Minus, Zap } from 'lucide-react'
import { G, ACTION_TYPES, TEMPLATES, CALL_FREQ } from '../journeyConfig'

export default function SetupFlow({
  isMobile, clientName, step,
  template, weeks, callFreq, setupActions,
  onSelectTemplate, onSetWeeks, onSetCallFreq,
  onGoStep2, onGoStep3, onToggleAction, onCreateJourney, onBack
}) {
  const sBtn = { width: isMobile ? '40px' : '44px', height: isMobile ? '40px' : '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, color: G.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }
  const backBtn = { padding: '0.875rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, color: G.textMuted, fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const nextBtn = { flex: 1, padding: '0.875rem', background: G.gradient, border: 'none', borderRadius: '12px', color: '#000', fontWeight: '700', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }

  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: step >= s ? `${G.gold}25` : 'rgba(255,255,255,0.04)',
              border: `2px solid ${step >= s ? G.gold : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: '700',
              color: step >= s ? G.gold : G.textDim
            }}>
              {step > s ? <CheckCircle size={14} /> : s}
            </div>
            {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? G.gold : 'rgba(255,255,255,0.06)' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Template */}
      {step === 1 && (
        <div>
          <h2 style={{ color: G.text, fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem' }}>
            Journey voor {clientName}
          </h2>
          <p style={{ color: G.textMuted, fontSize: '0.8rem', margin: '0 0 1.5rem' }}>Kies een traject.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.values(TEMPLATES).map(t => {
              const sel = template === t.id
              return (
                <button key={t.id} onClick={() => onSelectTemplate(t.id)} style={{
                  padding: '1rem', borderRadius: '12px',
                  background: sel ? `${G.gold}12` : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${sel ? G.gold : 'rgba(255,255,255,0.06)'}`,
                  textAlign: 'left', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  boxShadow: sel ? G.glow : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ color: sel ? G.text : 'rgba(255,255,255,0.7)', fontWeight: '600', margin: 0 }}>{t.name}</p>
                      <p style={{ color: G.textMuted, fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{t.description}</p>
                    </div>
                    <div style={{
                      padding: '0.35rem 0.75rem', borderRadius: '8px',
                      background: sel ? `${G.gold}20` : 'rgba(255,255,255,0.04)',
                      color: sel ? G.gold : G.textMuted, fontWeight: '700'
                    }}>{t.total_weeks}w</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem' }}>
                    {t.phases.map((p, i) => (
                      <div key={i} style={{
                        flex: `0 0 ${((p.week_end - p.week_start + 1) / t.total_weeks) * 100}%`,
                        height: '4px', borderRadius: '2px',
                        background: sel ? p.color : `${p.color}40`
                      }} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          <button onClick={onGoStep2} style={{ ...nextBtn, width: '100%', marginTop: '1.5rem', flex: 'none' }}>
            Volgende <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
          </button>
        </div>
      )}

      {/* STEP 2: Customize */}
      {step === 2 && (
        <div>
          <h2 style={{ color: G.text, fontSize: '1.2rem', fontWeight: '700', margin: '0 0 1.5rem' }}>Aanpassen</h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '500', color: G.textMuted }}>Aantal weken</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => onSetWeeks(Math.max(4, weeks - 1))} style={sBtn}><Minus size={16} /></button>
              <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}` }}>
                <span style={{ color: G.gold, fontSize: '1.5rem', fontWeight: '800' }}>{weeks}</span>
                <span style={{ color: G.textMuted, marginLeft: '0.5rem' }}>weken</span>
              </div>
              <button onClick={() => onSetWeeks(Math.min(104, weeks + 1))} style={sBtn}><Plus size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
              {[8, 12, 16, 26, 52].map(w => (
                <button key={w} onClick={() => onSetWeeks(w)} style={{
                  flex: 1, padding: '0.4rem', borderRadius: '6px',
                  background: weeks === w ? `${G.gold}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${weeks === w ? `${G.gold}50` : 'rgba(255,255,255,0.06)'}`,
                  color: weeks === w ? G.gold : G.textMuted,
                  fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}>{w}w</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '500', color: G.textMuted }}>Call frequentie</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {Object.entries(CALL_FREQ).map(([k, c]) => {
                const sel = callFreq === k
                return (
                  <button key={k} onClick={() => onSetCallFreq(k)} style={{
                    padding: '0.75rem', borderRadius: '10px',
                    background: sel ? `${G.gold}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sel ? G.borderActive : 'rgba(255,255,255,0.06)'}`,
                    textAlign: 'left', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span style={{ color: sel ? G.text : G.textMuted, fontWeight: sel ? '600' : '400' }}>{c.label}</span>
                    <span style={{ color: G.textDim, fontSize: '0.7rem' }}>~{Math.ceil(weeks / c.interval)} calls</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onBack} style={backBtn}>Terug</button>
            <button onClick={onGoStep3} style={nextBtn}>Volgende <ChevronRight size={16} style={{ verticalAlign: 'middle' }} /></button>
          </div>
        </div>
      )}

      {/* STEP 3: Actions */}
      {step === 3 && (
        <div>
          <h2 style={{ color: G.text, fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.75rem' }}>Actiepunten</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: `${G.green}15`, border: `1px solid ${G.green}30`, color: G.green, fontSize: '0.7rem', fontWeight: '600' }}>
              {setupActions.filter(a => a.enabled).length} actief
            </span>
          </div>

          <div style={{ maxHeight: '45vh', overflowY: 'auto', borderRadius: '10px', border: `1px solid ${G.border}`, marginBottom: '1rem' }}>
            {[...new Set(setupActions.map(a => a.week))].sort((a, b) => a - b).map(w => (
              <div key={w}>
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'sticky', top: 0, zIndex: 2 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: G.textMuted, textTransform: 'uppercase' }}>Week {w}</span>
                </div>
                {setupActions.filter(a => a.week === w).map(action => {
                  const gi = setupActions.indexOf(action)
                  const tc = ACTION_TYPES[action.type] || ACTION_TYPES.task
                  const Icon = tc.icon
                  return (
                    <div key={gi} onClick={() => onToggleAction(gi)} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      opacity: action.enabled ? 1 : 0.4
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '4px',
                        background: action.enabled ? `${G.green}20` : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${action.enabled ? G.green : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {action.enabled && <CheckCircle size={12} color={G.green} />}
                      </div>
                      <Icon size={14} color={tc.color} style={{ flexShrink: 0 }} />
                      <p style={{
                        color: action.enabled ? G.text : G.textMuted,
                        fontSize: '0.8rem', fontWeight: '500', margin: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{action.title}</p>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onBack} style={backBtn}>Terug</button>
            <button onClick={onCreateJourney} style={nextBtn}>
              <Zap size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Start Journey
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
