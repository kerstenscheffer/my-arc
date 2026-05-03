// src/modules/client-journey/components/calls/IntakeExpectationsPanel.jsx
import React from 'react'
import { Clock, TrendingDown, Shield } from 'lucide-react'
import { C, StatBar, NoteField, labels } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=800&q=80'

export default function IntakeExpectationsPanel({ cd, stepNotes, setStepNotes, stepActions, setStepActions, isMobile }) {
  const goal = cd.primary_goal
  const isCut = ['fat_loss', 'recomp', 'general_fitness'].includes(goal)

  const timeline = isCut ? [
    { week: 'Week 1-2', event: 'Gewenning aan plan. Mogelijk watergewicht verlies (1-2kg). Niet schrikken — dit is normaal.', color: C.text50 },
    { week: 'Week 3-4', event: 'Eerste echte vetverlies zichtbaar op de weegschaal. Honger stabiliseert.', color: C.text50 },
    { week: 'Week 5-8', event: 'Kleding begint losser te zitten. Energie verbetert. Routine wordt normaal.', color: C.gold },
    { week: 'Week 9-12', event: 'Andere mensen merken het. Duidelijke visuele transformatie.', color: C.gold }
  ] : [
    { week: 'Week 1-2', event: 'Gewenning aan hoger volume eten. Kracht nog niet omhoog.', color: C.text50 },
    { week: 'Week 3-4', event: 'Eerste kracht toename. Pumps worden beter.', color: C.text50 },
    { week: 'Week 5-8', event: 'Zichtbare spierontwikkeling. Kracht gaat omhoog.', color: C.gold },
    { week: 'Week 9-12', event: 'Significante transformatie. Sterker en voller.', color: C.gold }
  ]

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 60%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Verwachtingen stellen</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}60, transparent)` }} />

      {/* ──────── REALISTISCHE TIJDLIJN ──────── */}
      <div style={{ borderLeft: `3px solid ${C.gold}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          REALISTISCHE TIJDLIJN — {isCut ? 'VETVERLIES' : 'SPIEROPBOUW'}
        </div>
        {timeline.map((t, i) => (
          <div key={i} style={{ padding: '0.35rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 800, color: C.gold, minWidth: '65px', flexShrink: 0 }}>{t.week}</span>
            <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: t.color, lineHeight: 1.4 }}>{t.event}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.green}40, transparent)` }} />

      {/* ──────── KEY POINTS ──────── */}
      <div style={{ borderLeft: `3px solid ${C.green}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DIT MOET JE BENOEMEN</div>
        {[
          { text: '"Het hoeft niet perfect te zijn — 80% compliance is genoeg voor resultaat"', important: true },
          { text: '"Gewicht fluctueert dagelijks met 1-2kg — kijk naar weekgemiddelden, niet dagelijks"', important: true },
          { text: '"De eerste 2 weken zijn gewenning — het wordt makkelijker"', important: false },
          { text: '"Ik ben er voor je als het even niet lukt — dat is waar coaching voor is"', important: false },
          { text: '"We evalueren elke 2 weken en passen aan als het nodig is"', important: true },
          { text: '"Na 3 maanden is dit geen dieet meer — het is je lifestyle"', important: false }
        ].map((item, i) => (
          <div key={i} style={{
            padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderFaint}`,
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: item.important ? 700 : 500,
            color: item.important ? C.text50 : C.text25,
            fontStyle: 'italic', lineHeight: 1.5
          }}>{item.text}</div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.amber}40, transparent)` }} />

      {/* ──────── WAT ALS SCENARIO'S ──────── */}
      <div style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WAT ALS... (BESPREEK DEZE)</div>
        {[
          { scenario: 'Je wordt ziek', answer: 'We pauzeren het plan. Geen stress. Zodra je beter bent pakken we op waar we gebleven waren.' },
          { scenario: 'Je gaat op vakantie', answer: 'We schakelen naar maintenance. Geniet. We passen het plan aan voor en na de vakantie.' },
          { scenario: 'Je hebt een slechte week', answer: 'Eén slechte week maakt niks uit op het totaalplaatje. We kijken naar het gemiddelde over weken.' },
          { scenario: 'Je ziet 2 weken geen resultaat', answer: 'Normaal. Gewicht fluctueert door water, stress, slaap. We evalueren elke 2 weken en passen dan aan.' },
          { scenario: 'Je motivatie zakt weg', answer: 'Dat is precies waar ik voor ben. Motivatie komt en gaat — discipline en systeem blijven.' },
          { scenario: 'Sociale druk (eten/drinken)', answer: 'We bouwen flexibiliteit in. Je hoeft niks te missen. Ik leer je hoe je slim kiest.' }
        ].map((item, i) => (
          <div key={i} style={{ padding: '0.35rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: C.text }}>{item.scenario}</div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: C.text25, fontStyle: 'italic', lineHeight: 1.5, marginTop: '0.05rem' }}>→ "{item.answer}"</div>
          </div>
        ))}
      </div>

      <NoteField label="NOTITIES" value={stepNotes.expectations} onChange={v => setStepNotes(p => ({ ...p, expectations: v }))} isMobile={isMobile} />
      <NoteField label="ACTIES" value={stepActions.expectations} onChange={v => setStepActions(p => ({ ...p, expectations: v }))} color={C.gold} isMobile={isMobile} />
    </div>
  )
}
