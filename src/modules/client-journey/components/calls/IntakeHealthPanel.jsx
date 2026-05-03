// src/modules/client-journey/components/calls/IntakeHealthPanel.jsx
// v2 — Added: current_body_fat, current_body_fat_2, target_body_fat, water_intake_target from intake
import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { C, StatBar, DataRow, QuestionBlock, NoteField } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'

export default function IntakeHealthPanel({ cd, wp, stepNotes, setStepNotes, stepActions, setStepActions, isMobile }) {
  const hasIssues = cd.medical_conditions || cd.injuries || cd.allergies || cd.medications || cd.pregnant || cd.breastfeeding
  const bodyFat = cd.current_body_fat || cd.current_body_fat_2
  const targetBf = cd.target_body_fat

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={16} color={C.red} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Gezondheid & blessures</span>
        </div>
      </div>

      {/* ──────── BODY COMPOSITION ──────── */}
      {(bodyFat || targetBf || cd.height || cd.current_weight) && (
        <div style={{ borderLeft: `3px solid ${C.blue}` }}>
          <div style={{ padding: '0.3rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LICHAAMSSAMENSTELLING</div>
          <StatBar isMobile={isMobile} stats={[
            { label: 'GEWICHT', value: cd.current_weight ? `${cd.current_weight}` : '—', unit: 'kg' },
            { label: 'LENGTE', value: cd.height ? `${cd.height}` : '—', unit: 'cm' },
            { label: 'VET %', value: bodyFat ? `${bodyFat}%` : '—', color: bodyFat > 25 ? C.amber : undefined },
            { label: 'DOEL VET %', value: targetBf ? `${targetBf}%` : '—', color: C.gold }
          ].filter(s => s.value !== '—')} />
        </div>
      )}

      {/* ──────── MEDISCH ──────── */}
      <div style={{ borderLeft: `3px solid ${hasIssues ? C.red : C.green}` }}>
        <div style={{ padding: '0.3rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: hasIssues ? C.red : C.green, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {hasIssues ? 'MEDISCHE AANDACHTSPUNTEN' : 'GEEN BIJZONDERHEDEN'}
        </div>

        {cd.medical_conditions
          ? <DataRow label="⚠ MEDISCH" value={cd.medical_conditions} color={C.red} />
          : <DataRow label="MEDISCH" value="Geen bijzonderheden" />
        }
        {cd.injuries
          ? <DataRow label="⚠ BLESSURES" value={cd.injuries} color={C.red} />
          : <DataRow label="BLESSURES" value="Geen" />
        }
        {wp?.avoided_exercises && <DataRow label="VERMIJDE OEFENINGEN" value={wp.avoided_exercises} color={C.red} />}
        {wp?.other_limitations && <DataRow label="BEPERKINGEN" value={wp.other_limitations} color={C.amber} />}
        {cd.allergies
          ? <DataRow label="⚠ ALLERGIEËN" value={cd.allergies} color={C.amber} />
          : <DataRow label="ALLERGIEËN" value="Geen" />
        }
        {cd.intolerances && <DataRow label="INTOLERANTIES" value={cd.intolerances} color={C.amber} />}
        {cd.medications && <DataRow label="⚠ MEDICATIE" value={cd.medications} color={C.red} />}
        {cd.pregnant && <DataRow label="⚠ ZWANGER" value="Ja" color={C.red} />}
        {cd.breastfeeding && <DataRow label="BORSTVOEDING" value="Ja" color={C.amber} />}
      </div>

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.blue}40, transparent)` }} />

      {/* ──────── LEVENSSTIJL STATS ──────── */}
      <div style={{ borderLeft: `3px solid ${C.blue}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LEVENSSTIJL & HERSTEL</div>
        <StatBar isMobile={isMobile} stats={[
          { label: 'SLAAP', value: cd.sleep_hours ? `${cd.sleep_hours}` : '—', unit: 'uur', color: parseFloat(cd.sleep_hours) < 7 ? C.amber : undefined },
          { label: 'STRESS', value: cd.stress_level ? `${cd.stress_level}` : '—', unit: '/10', color: parseInt(cd.stress_level) >= 7 ? C.amber : undefined },
          { label: 'WATER', value: cd.water_intake_target ? `${cd.water_intake_target}` : '—', unit: 'L/dag' },
          { label: 'ACTIVITEIT', value: ({ sedentary: 'Sedentair', lightly_active: 'Licht', moderately_active: 'Matig', very_active: 'Zeer' }[cd.activity_level] || cd.activity_level || '—') }
        ]} />
        {parseFloat(cd.sleep_hours) < 7 && (
          <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`, fontSize: '0.5rem', color: C.amber }}>
            ⚠ Minder dan 7 uur slaap — impact op herstel en honger bespreken
          </div>
        )}
        {parseInt(cd.stress_level) >= 7 && (
          <div style={{ padding: '0.25rem 0.75rem', borderBottom: `1px solid ${C.borderSub}`, fontSize: '0.5rem', color: C.amber }}>
            ⚠ Hoog stressniveau — impact op cortisol en gewichtsverlies bespreken
          </div>
        )}
      </div>

      <div style={{ height: '2px', background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />

      {/* ──────── BESPREEKPUNTEN ──────── */}
      <div style={{ borderLeft: `3px solid ${C.gold}` }}>
        <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BESPREEK TIJDENS DE CALL</div>
        <div style={{ padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
          {[
            cd.injuries ? `Blessures: ${cd.injuries} — welke oefeningen aanpassen/vermijden?` : null,
            cd.medical_conditions ? `Medisch: ${cd.medical_conditions} — impact op training/voeding?` : null,
            cd.medications ? `Medicatie: ${cd.medications} — beïnvloedt dit energie/eetlust/herstel?` : null,
            cd.allergies ? `Allergieën: ${cd.allergies} — al verwerkt in voedingsplan?` : null,
            parseFloat(cd.sleep_hours) < 7 ? 'Slaaphygiëne bespreken — grote impact op resultaat' : null,
            parseInt(cd.stress_level) >= 7 ? 'Stressmanagement bespreken — cortisol remt vetverlies' : null,
            bodyFat ? `Vetpercentage ${bodyFat}% → doel ${targetBf || '?'}% — realistisch bespreken` : null,
            'Huidige supplementen — kloppen die? Iets toevoegen/verwijderen?',
            'Waterinname — hoeveel drink je nu per dag?'
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: C.text50,
              padding: '0.2rem 0', borderBottom: `1px solid ${C.borderFaint}`
            }}>
              <span style={{ color: C.gold, marginRight: '0.3rem' }}>•</span>{item}
            </div>
          ))}
        </div>
      </div>

      <QuestionBlock q="Hoe beïnvloeden de blessures de training?" value={stepNotes.health_impact} onChange={v => setStepNotes(p => ({ ...p, health_impact: v }))} isMobile={isMobile} />
      <QuestionBlock q="Welke oefeningen moeten we aanpassen of vermijden?" value={stepNotes.health_adjustments} onChange={v => setStepNotes(p => ({ ...p, health_adjustments: v }))} isMobile={isMobile} />
      <QuestionBlock q="Medicijnen die energie/eetlust beïnvloeden?" value={stepNotes.health_meds} onChange={v => setStepNotes(p => ({ ...p, health_meds: v }))} isMobile={isMobile} />

      <NoteField label="NOTITIES" value={stepNotes.health} onChange={v => setStepNotes(p => ({ ...p, health: v }))} isMobile={isMobile} />
      <NoteField label="ACTIES" value={stepActions.health} onChange={v => setStepActions(p => ({ ...p, health: v }))} color={C.gold} placeholder="Bijv: knie-oefeningen aanpassen, slaap protocol meegeven..." isMobile={isMobile} />
    </div>
  )
}
