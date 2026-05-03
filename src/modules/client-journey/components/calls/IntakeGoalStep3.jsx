// src/modules/client-journey/components/calls/IntakeGoalStep3.jsx
// Stap 3: Resultaat — macro's, tijdlijn, wat je zegt
import React from 'react'
import { TrendingDown } from 'lucide-react'
import { C, StatBar } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80'

const PRESET_LABELS = { mild: 'Mild', moderate: 'Moderate', aggressive: 'Agressief' }

export default function IntakeGoalStep3({ cd, result, isMobile, deficitPreset, cardioSessions, cheatDays, onNext, onBack }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <TrendingDown size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Het resultaat</span>
        </div>
      </div>

      {/* Big number — target kcal */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem', textAlign: 'center',
        borderBottom: `1px solid ${C.goldBorder}`, background: C.goldBg
      }}>
        <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, color: C.gold, lineHeight: 1, letterSpacing: '-0.03em' }}>
          {result.targetCal}
          <span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.5, marginLeft: '0.1rem' }}>kcal/dag</span>
        </div>
        <div style={{ fontSize: '0.5rem', color: C.text25, marginTop: '0.2rem' }}>
          {result.isCut ? `${PRESET_LABELS[result.activePreset] || 'Custom'} deficit` : 'Surplus voor spieropbouw'} · {result.deficitPct}% {result.isCut ? 'onder' : 'boven'} TDEE ({result.tdee} kcal)
        </div>
      </div>

      {/* Macro's — prominent */}
      <div style={{ borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ padding: '0.3rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>MACRO'S PER DAG</div>
        <StatBar isMobile={isMobile} stats={[
          { label: 'EIWIT', value: result.prot, unit: 'g', color: C.blue },
          { label: 'CARBS', value: result.carbs, unit: 'g', color: C.gold },
          { label: 'VET', value: result.fat, unit: 'g', color: C.purple }
        ]} />
        <div style={{ padding: '0.2rem 0.75rem 0.3rem', fontSize: '0.4rem', color: C.text15 }}>
          Eiwit: 2.0g/kg · Vet: 0.9g/kg · Carbs: rest
        </div>
      </div>

      {/* TDEE breakdown als cardio actief */}
      {cardioSessions > 0 && (
        <StatBar isMobile={isMobile} stats={[
          { label: 'BASIS TDEE', value: result.baseTdee, unit: 'kcal' },
          { label: 'CARDIO', value: `+${result.cardioDaily}`, unit: `kcal (${cardioSessions}x)`, color: C.green },
          { label: 'TOTAAL TDEE', value: result.tdee, unit: 'kcal', color: C.gold }
        ]} />
      )}

      {/* Resultaat stats */}
      <StatBar isMobile={isMobile} stats={[
        { label: 'PER WEEK', value: result.weeklyLoss, unit: 'kg', color: C.gold },
        { label: 'DUUR', value: result.weeksNeeded, unit: 'weken', color: C.gold },
        { label: 'EINDGEWICHT', value: result.goalWeight, unit: 'kg', color: C.gold }
      ]} />

      {/* Cheat day impact */}
      {cheatDays > 0 && (
        <div style={{
          padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`,
          fontSize: '0.5rem', color: C.amber,
          display: 'flex', alignItems: 'center', gap: '0.3rem'
        }}>
          <span style={{ fontWeight: 800 }}>{cheatDays}x cheatday/week</span>
          <span style={{ color: C.text25 }}>→ {result.weeksNeeded} weken ipv {result.weeksWithoutCheat}</span>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />

      {/* Tijdlijn */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>GEWICHTSVERLOOP</div>
        {/* Header */}
        <div style={{ display: 'flex', padding: '0.15rem 0', borderBottom: `1px solid ${C.goldBorder}` }}>
          <span style={{ flex: 0.4, fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase' }}>WEEK</span>
          <span style={{ flex: 1, fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase' }}>GEWICHT</span>
          <span style={{ flex: 0.6, fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase' }}>{result.isCut ? 'VERLOREN' : 'ERBIJ'}</span>
        </div>
        {result.timeline.filter(r => [1, 4, 8, 12, 16, 20, 24].includes(r.week) || r.week === result.weeksNeeded).map((row, i) => (
          <div key={i} style={{
            display: 'flex', padding: '0.2rem 0', borderBottom: `1px solid ${C.borderFaint}`,
            background: row.week === result.weeksNeeded ? C.goldBg : 'transparent'
          }}>
            <span style={{ flex: 0.4, fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 600, color: row.week === result.weeksNeeded ? C.gold : C.text50 }}>W{row.week}</span>
            <span style={{ flex: 1, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: C.text }}>{row.weight} kg</span>
            <span style={{ flex: 0.6, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: result.isCut ? C.gold : C.green }}>{result.isCut ? '-' : '+'}{row.lost} kg</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />

      {/* Script — wat je zegt */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${C.gold}`
      }}>
        <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>DIT ZEG JE TEGEN DE CLIENT</div>
        <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 600, color: C.text50, lineHeight: 1.6, fontStyle: 'italic' }}>
          "Je verbrandt {result.tdee} kcal per dag{cardioSessions > 0 ? ` met ${cardioSessions}x cardio` : ''}.
          We gaan naar <span style={{ color: C.gold, fontWeight: 800, fontStyle: 'normal' }}>{result.targetCal} kcal</span> per dag — {result.isCut ? `een ${PRESET_LABELS[result.activePreset]?.toLowerCase() || ''} deficit van ${result.deficitPct}%` : `een surplus van ${result.deficitPct}% voor spieropbouw`}.
          Dat is <span style={{ color: C.gold, fontWeight: 800, fontStyle: 'normal' }}>{result.weeklyLoss} kg per week</span>{cheatDays > 0 ? ` met ${cheatDays} cheatday` : ''}.
          In <span style={{ color: C.gold, fontWeight: 800, fontStyle: 'normal' }}>{result.weeksNeeded} weken</span> sta je op <span style={{ color: C.gold, fontWeight: 800, fontStyle: 'normal' }}>{result.goalWeight} kg</span>."
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: isMobile ? '0.75rem' : '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={onBack} style={{
          padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: 0, color: C.text25, fontSize: '0.65rem', fontWeight: 700,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px'
        }}>← AANPASSEN</button>
        <button onClick={onNext} style={{
          flex: 1, padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.gold}, ${C.darkGold})`,
          border: 'none', borderRadius: 0, color: '#000',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px'
        }}>AKKOORD → BEVESTIGEN</button>
      </div>
    </div>
  )
}
