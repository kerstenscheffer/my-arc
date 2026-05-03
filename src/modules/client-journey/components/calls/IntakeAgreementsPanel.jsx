// src/modules/client-journey/components/calls/IntakeAgreementsPanel.jsx
import React from 'react'
import { FileText, Calendar, MessageSquare } from 'lucide-react'
import { C, QuestionBlock, NoteField } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80'

export default function IntakeAgreementsPanel({ cd, stepNotes, setStepNotes, stepActions, setStepActions, isMobile }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={16} color={C.gold} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Afspraken vastleggen</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}60, transparent)` }} />

      {/* ──────── WAT JIJ DOET NA DE CALL ──────── */}
      <div style={{ borderLeft: `3px solid ${C.gold}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WAT JIJ DOET NA DE CALL</div>
        <div style={{ padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          {[
            'Trainingsschema klaarzetten en toewijzen in de app',
            'Voedingsplan genereren op basis van besproken voorkeuren',
            'Boodschappenlijst meesturen',
            'Welkomstbericht sturen via WhatsApp met samenvatting',
            'Eerste weging + foto afspreken'
          ].map((item, i) => (
            <div key={i} style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: C.text50,
              padding: '0.2rem 0', borderBottom: `1px solid ${C.borderFaint}`
            }}>
              <span style={{ color: C.gold, marginRight: '0.3rem' }}>□</span>{item}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.blue}40, transparent)` }} />

      {/* ──────── PLANNING ──────── */}
      <div style={{ borderLeft: `3px solid ${C.blue}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PLANNING & COMMUNICATIE</div>
      </div>

      <QuestionBlock q="Wanneer start de client? (morgen / maandag / datum)" value={stepNotes.agreement_start} onChange={v => setStepNotes(p => ({ ...p, agreement_start: v }))} isMobile={isMobile} />
      <QuestionBlock q="Call frequentie en dag/tijd? (bijv. elke donderdag 17:00)" value={stepNotes.agreement_calls} onChange={v => setStepNotes(p => ({ ...p, agreement_calls: v }))} isMobile={isMobile} />
      <QuestionBlock q="WhatsApp afspraken — hoe vaak mag de client berichten, jouw reactietijd?" value={stepNotes.agreement_whatsapp} onChange={v => setStepNotes(p => ({ ...p, agreement_whatsapp: v }))} isMobile={isMobile} />
      <QuestionBlock q="Weeg momenten — wanneer en hoe vaak? (elke ochtend aanbevolen)" value={stepNotes.agreement_weigh} onChange={v => setStepNotes(p => ({ ...p, agreement_weigh: v }))} isMobile={isMobile} />

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.green}40, transparent)` }} />

      {/* ──────── WAT CLIENT DOET ──────── */}
      <div style={{ borderLeft: `3px solid ${C.green}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WAT DE CLIENT DOET</div>
        <div style={{ padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          {[
            'Elke ochtend wegen (nuchter, na toilet)',
            'Voedingsplan volgen (of macro\'s halen bij level B/C)',
            `${cd.workout_days_per_week || 4}x per week trainen volgens schema`,
            'Workouts loggen in de app',
            'Eerlijk communiceren — ook als het niet lukt',
            'Elke 2-4 weken progress foto\'s',
            'Op tijd zijn voor calls'
          ].map((item, i) => (
            <div key={i} style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: C.text50,
              padding: '0.2rem 0', borderBottom: `1px solid ${C.borderFaint}`
            }}>
              <span style={{ color: C.green, marginRight: '0.3rem' }}>✓</span>{item}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.purple}40, transparent)` }} />

      {/* ──────── LONG-TERM ──────── */}
      <div style={{ borderLeft: `3px solid ${C.purple}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LONG-TERM VISION</div>
      </div>

      <QuestionBlock q="Waar wil je over 6 maanden staan?" value={stepNotes.agreement_6m} onChange={v => setStepNotes(p => ({ ...p, agreement_6m: v }))} isMobile={isMobile} />
      <QuestionBlock q="Waar wil je over een jaar staan?" value={stepNotes.agreement_1y} onChange={v => setStepNotes(p => ({ ...p, agreement_1y: v }))} isMobile={isMobile} />

      <NoteField label="EXTRA NOTITIES" value={stepNotes.agreements} onChange={v => setStepNotes(p => ({ ...p, agreements: v }))} isMobile={isMobile} />
      <NoteField label="ACTIES (verschijnen onderaan)" value={stepActions.agreements} onChange={v => setStepActions(p => ({ ...p, agreements: v }))} color={C.gold} placeholder="Bijv: PPL toewijzen, mealplan maken, boodschappenlijst, welkomstbericht..." isMobile={isMobile} />
    </div>
  )
}
