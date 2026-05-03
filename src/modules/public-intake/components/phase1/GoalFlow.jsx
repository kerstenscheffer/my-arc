// src/modules/public-intake/components/phase1/GoalFlow.jsx
// Stap 3: Doel — primary goal, streefgewicht/vet%, timeline, urgentie, motivatie

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, PhotoGrid, OptionGrid, TextField, Slider, NumberField } from './FlowStep'
import { Flame, Dumbbell, Scale, Activity } from 'lucide-react'

const BF_TARGET_OPTIONS = [
  { value: '10', label: '~10%', sub: 'Zichtbare sixpack',      img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { value: '14', label: '~14%', sub: 'Droog en atletisch',     img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { value: '18', label: '~18%', sub: 'Slank, lichte definitie', img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { value: '22', label: '~22%', sub: 'Fit, gezond gewicht',    img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
]

const MOTIVATION_OPTIONS = [
  { value: 'beter_uitzien', label: 'Ik wil beter uitzien' },
  { value: 'meer_energie', label: 'Ik wil meer energie' },
  { value: 'gezonder_leven', label: 'Ik wil gezonder leven' },
  { value: 'zelfvertrouwen', label: 'Ik wil meer zelfvertrouwen' },
  { value: 'prestaties', label: 'Ik wil beter presteren in sport' },
  { value: 'anders', label: 'Iets anders' },
]

// Foto-grid specifiek voor streef vetpercentage — zelfde look als BF picker
function BfPhotoGrid({ value, onChange, isMobile, extraOption }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.3rem'
      }}>
        {BF_TARGET_OPTIONS.map(opt => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                background: 'transparent',
                border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px', overflow: 'hidden',
                cursor: 'pointer', padding: 0,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'border-color 0.15s ease', position: 'relative'
              }}
            >
              <img
                src={opt.img} alt={opt.label}
                style={{
                  width: '100%', aspectRatio: '2/3',
                  objectFit: 'cover', objectPosition: 'top', display: 'block',
                  filter: isSelected ? 'none' : 'brightness(0.5)'
                }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.35rem 0.25rem',
                background: isSelected ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.75)'
              }}>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.68rem', fontWeight: 800, color: isSelected ? '#000' : '#fff', textAlign: 'center' }}>{opt.label}</div>
                <div style={{ fontSize: '0.42rem', color: isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3, marginTop: '0.1rem' }}>{opt.sub}</div>
              </div>
              {isSelected && (
                <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', width: '16px', height: '16px', borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#000' }}>✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {extraOption && (
        <button onClick={() => onChange('geen')} style={{
          width: '100%', padding: '0.65rem 1rem',
          background: value === 'geen' ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
          border: `1px solid ${value === 'geen' ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
          borderLeft: value === 'geen' ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: value === 'geen' ? '0 8px 8px 0' : '8px',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${value === 'geen' ? '#FFD700' : 'rgba(255,255,255,0.15)'}`, background: value === 'geen' ? '#FFD700' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {value === 'geen' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />}
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 700, color: value === 'geen' ? '#FFD700' : 'rgba(255,255,255,0.8)' }}>Geen voorkeur</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: '0.15rem' }}>Coach bepaalt wat haalbaar is</div>
          </div>
        </button>
      )}
    </div>
  )
}

const MUSCLE_OPTIONS = [
  { value: 'lean',     label: 'Slank & atletisch',    sub: 'Fit, licht gespierd',          img: 'https://i.ibb.co/BVSLB4dg/Scherm-afbeelding-2026-04-03-om-11-02-33.png' },
  { value: 'muscular', label: 'Gespierd & droog',     sub: 'Duidelijke definitie',          img: 'https://i.ibb.co/yF4sXLc6/Scherm-afbeelding-2026-04-03-om-10-59-31.png' },
  { value: 'big',      label: 'Heel gespierd & bulk', sub: 'Maximale massa',                img: 'https://i.ibb.co/ynvJBcxW/Scherm-afbeelding-2026-04-03-om-11-01-08.png' },
  { value: 'shredded', label: 'Heel gespierd & droog', sub: 'Massa met scherpe definitie', img: 'https://i.ibb.co/XrTRXk9h/Scherm-afbeelding-2026-04-03-om-11-00-52.png' },
]

function MusclePhotoGrid({ value, onChange, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.3rem'
      }}>
        {MUSCLE_OPTIONS.map(opt => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                background: 'transparent',
                border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '8px', overflow: 'hidden',
                cursor: 'pointer', padding: 0,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'border-color 0.15s ease', position: 'relative'
              }}
            >
              <img
                src={opt.img} alt={opt.label}
                style={{
                  width: '100%', aspectRatio: '2/3',
                  objectFit: 'cover', objectPosition: 'top', display: 'block',
                  filter: isSelected ? 'none' : 'brightness(0.5)'
                }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.35rem 0.25rem',
                background: isSelected ? 'rgba(255,215,0,0.9)' : 'rgba(0,0,0,0.75)'
              }}>
                <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', fontWeight: 800, color: isSelected ? '#000' : '#fff', textAlign: 'center' }}>{opt.label}</div>
                <div style={{ fontSize: '0.42rem', color: isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.3, marginTop: '0.1rem' }}>{opt.sub}</div>
              </div>
              {isSelected && (
                <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', width: '16px', height: '16px', borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#000' }}>✓</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      <button onClick={() => onChange('geen')} style={{
        width: '100%', padding: '0.65rem 1rem',
        background: value === 'geen' ? 'rgba(255,215,0,0.07)' : '#0d0d0d',
        border: `1px solid ${value === 'geen' ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderLeft: value === 'geen' ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: value === 'geen' ? '0 8px 8px 0' : '8px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${value === 'geen' ? '#FFD700' : 'rgba(255,255,255,0.15)'}`, background: value === 'geen' ? '#FFD700' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {value === 'geen' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />}
        </div>
        <div>
          <div style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 700, color: value === 'geen' ? '#FFD700' : 'rgba(255,255,255,0.8)' }}>Geen voorkeur</div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: '0.15rem' }}>Coach bepaalt wat haalbaar is</div>
        </div>
      </button>
    </div>
  )
}

export default function GoalFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState('doel')
  const [history, setHistory] = useState([])
  const [motivationExtra, setMotivationExtra] = useState('')

  const go = (next) => { setHistory(h => [...h, step]); setStep(next) }
  const goBack = () => {
    if (history.length === 0) { onBack?.(); return }
    setStep(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const update = (field, value) => onChange({ ...data, [field]: value })
  const updateMultiple = (fields) => onChange({ ...data, ...fields })

  const handleOnNext = () => {
    if (!data.goal_urgency) update('goal_urgency', 5)
    console.log('✅ SECTIE 3 (Doel) klaar:', {
      doel: data.primary_goal,
      streefgewicht: data.target_weight,
      streef_vet: data.target_body_fat,
      timeline: data.goal_timeline,
      urgentie: data.goal_urgency,
      motivatie: data.motivation,
    })
    onNext()
  }

  // Na doel-keuze bepalen welke volgende stap
  const afterGoal = (goal) => {
    if (goal === 'recomp') go('streef_vet_recomp')
    else if (goal === 'muscle_gain') go('streef_gewicht')
    else go('streef_gewicht')
  }

  const renderStep = () => {
    switch (step) {

      case 'doel':
        return <>
          <Q isMobile={isMobile}>Wat is je hoofddoel?</Q>
          <PhotoGrid
            value={data.primary_goal}
            onChange={v => { update('primary_goal', v); afterGoal(v) }}
            isMobile={isMobile}
            options={[
              { value: 'fat_loss',       label: 'Vetverlies',    sub: 'Droog worden, definitie',           image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=200&fit=crop&q=80' },
              { value: 'muscle_gain',    label: 'Spieropbouw',   sub: 'Massa, kracht, volume',             image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=200&fit=crop&q=80' },
              { value: 'recomp',         label: 'Recomp',        sub: 'Vet verliezen + spier opbouwen',    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=200&fit=crop&q=80' },
              { value: 'general_fitness',label: 'Fitter worden', sub: 'Energie, conditie, gezondheid',     image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop&q=80' },
            ]}
          />
        </>

      // ── VETVERLIES / SPIEROPBOUW / GENERAL FITNESS ──────────────────────

      case 'streef_gewicht':
        // Fat loss: gewoon invoerveld
        if (data.primary_goal === 'fat_loss') return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat is je streefgewicht?</Q>
          <NumberField value={data.target_weight} onChange={v => update('target_weight', v)} placeholder="75" unit="kg" min={40} max={200} isMobile={isMobile} />
          <NextBtn onClick={() => go('streef_vet')} disabled={!data.target_weight} isMobile={isMobile} />
        </>

        // Muscle gain: Nee / Ja met inline invoer
        if (data.primary_goal === 'muscle_gain') return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Heb je een gewichtsdoel?</Q>
          <BigOption
            label="Nee — ik stuur op uiterlijk en kracht"
            onClick={() => { updateMultiple({ target_weight: null, has_weight_goal: false }); go('streef_spier') }}
            selected={data.has_weight_goal === false}
            isMobile={isMobile}
          />
          <BigOption
            label="Ja, ik wil een bepaald gewicht bereiken"
            onClick={() => update('has_weight_goal', true)}
            selected={data.has_weight_goal === true}
            isMobile={isMobile}
          />
          {data.has_weight_goal === true && (
            <>
              <NumberField value={data.target_weight} onChange={v => update('target_weight', v)} placeholder="85" unit="kg" min={40} max={200} isMobile={isMobile} />
              <NextBtn onClick={() => go('streef_spier')} disabled={!data.target_weight} isMobile={isMobile} />
            </>
          )}
        </>

        // General fitness: optioneel met twee knoppen
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Heb je een gewichtsdoel?</Q>
          <BigOption
            label="Nee — geen gewichtsdoel"
            onClick={() => { updateMultiple({ target_weight: null, has_weight_goal: false }); go('fitness_betekenis') }}
            selected={data.has_weight_goal === false}
            isMobile={isMobile}
          />
          <BigOption
            label="Ja, ik wil een bepaald gewicht bereiken"
            onClick={() => update('has_weight_goal', true)}
            selected={data.has_weight_goal === true}
            isMobile={isMobile}
          />
          {data.has_weight_goal === true && (
            <>
              <NumberField value={data.target_weight} onChange={v => update('target_weight', v)} placeholder="75" unit="kg" min={40} max={200} isMobile={isMobile} />
              <NextBtn onClick={() => go('fitness_betekenis')} disabled={!data.target_weight} isMobile={isMobile} />
            </>
          )}
        </>

      case 'fitness_betekenis':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat betekent fitter worden voor jou?</Q>
          <Hint isMobile={isMobile}>Denk aan wat jij concreet wil voelen of kunnen.</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {[
              { value: 'meer_energie',    label: 'Meer energie in het dagelijks leven' },
              { value: 'beter_slapen',    label: 'Beter slapen' },
              { value: 'minder_pijn',     label: 'Minder pijn of klachten' },
              { value: 'conditie',        label: 'Betere conditie en uithoudingsvermogen' },
              { value: 'sterker',         label: 'Sterker worden' },
              { value: 'gezonder_eten',   label: 'Gezonder eten als gewoonte' },
              { value: 'zelfvertrouwen',  label: 'Beter in mijn vel zitten' },
              { value: 'bewegen',         label: 'Meer bewegen in mijn dagelijkse leven' },
            ].map(opt => (
              <BigOption
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  const current = data.fitness_doel_tags || []
                  const updated = current.includes(opt.value) ? current.filter(v => v !== opt.value) : [...current, opt.value]
                  update('fitness_doel_tags', updated)
                }}
                selected={(data.fitness_doel_tags || []).includes(opt.value)}
                isMobile={isMobile}
              />
            ))}
          </div>
          <NextBtn onClick={() => go('streef_vet')} disabled={!data.fitness_doel_tags?.length} isMobile={isMobile} />
        </>

      case 'streef_vet':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>
            {data.primary_goal === 'fat_loss'        && 'Tot welk lichaam wil je?'}
            {data.primary_goal === 'general_fitness' && 'Heb je een streefdoel qua lichaam?'}
          </Q>
          <BfPhotoGrid
            value={data.target_body_fat ? String(data.target_body_fat) : (data.target_body_fat === null ? 'geen' : null)}
            onChange={v => {
              update('target_body_fat', v === 'geen' ? null : parseInt(v))
              go('timeline')
            }}
            isMobile={isMobile}
            extraOption={data.primary_goal !== 'fat_loss'}
          />
        </>

      case 'streef_spier':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat voor lichaam wil je opbouwen?</Q>
          <MusclePhotoGrid
            value={data.muscle_goal_type || null}
            onChange={v => { update('muscle_goal_type', v === 'geen' ? null : v); go('lichaam_omschrijving') }}
            isMobile={isMobile}
          />
        </>

      case 'lichaam_omschrijving':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Omschrijf jouw ideale lichaam</Q>
          <Hint isMobile={isMobile}>Bijv: V-shape, brede rug, volle armen, zichtbare abs — of wat het voor jou betekent.</Hint>
          <textarea
            value={data.lichaam_omschrijving || ''}
            onChange={e => update('lichaam_omschrijving', e.target.value)}
            placeholder="Schrijf hier in eigen woorden..."
            rows={3}
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 500, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 }}
          />
          <NextBtn onClick={() => go('timeline')} disabled={!data.lichaam_omschrijving?.trim()} isMobile={isMobile} />
          <button onClick={() => go('timeline')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', fontSize: isMobile?'0.68rem':'0.7rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', padding:'0.2rem 0', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>Overslaan →</button>
        </>

      case 'streef_vet_recomp':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Tot welk lichaam wil je?</Q>
          <Hint isMobile={isMobile}>Bij recomp blijft je gewicht ongeveer gelijk — maar je lichaam verandert van samenstelling.</Hint>
          <BfPhotoGrid
            value={data.target_body_fat ? String(data.target_body_fat) : null}
            onChange={v => { update('target_body_fat', parseInt(v)); go('urgentie') }}
            isMobile={isMobile}
            extraOption={false}
          />
        </>

      // ── TIMELINE (niet bij recomp) ──────────────────────────────────────

      case 'timeline':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wanneer wil je dit bereiken?</Q>
          {[
            { value: '3',      label: '3 maanden',  sub: 'Snel, intensief' },
            { value: '6',      label: '6 maanden',  sub: 'Realistisch en haalbaar' },
            { value: '12',     label: '12 maanden', sub: 'Rustig en duurzaam' },
            { value: 'no_rush', label: 'Geen haast', sub: 'Ik doe het op mijn eigen tempo' },
          ].map(opt => (
            <BigOption
              key={opt.value}
              label={opt.label} sub={opt.sub}
              onClick={() => {
                let deadlineDate = null
                if (opt.value !== 'no_rush') {
                  const d = new Date()
                  d.setMonth(d.getMonth() + parseInt(opt.value))
                  deadlineDate = d.toISOString().split('T')[0]
                }
                updateMultiple({ goal_timeline: opt.value, goal_deadline_date: deadlineDate })
                go('urgentie')
              }}
              selected={data.goal_timeline === opt.value}
              isMobile={isMobile}
            />
          ))}
        </>

      // ── URGENTIE ────────────────────────────────────────────────────────

      case 'urgentie':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Hoe belangrijk is dit doel voor je?</Q>
          <Slider
            label="Hoe urgent?"
            value={data.goal_urgency || 5}
            onChange={v => update('goal_urgency', v)}
            min={1} max={10} suffix="/10"
            isMobile={isMobile}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Niet zo urgent</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Heel belangrijk</span>
          </div>
          <NextBtn onClick={() => go('motivatie')} isMobile={isMobile} />
        </>

      // ── MOTIVATIE ────────────────────────────────────────────────────────

      case 'motivatie':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Waarom wil je dit bereiken?</Q>
          <Hint isMobile={isMobile}>Kies wat het beste past — of schrijf het zelf.</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {MOTIVATION_OPTIONS.map(opt => (
              <BigOption
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  const current = data.motivation_tags || []
                  const updated = current.includes(opt.value)
                    ? current.filter(v => v !== opt.value)
                    : [...current, opt.value]
                  update('motivation_tags', updated)
                }}
                selected={(data.motivation_tags || []).includes(opt.value)}
                isMobile={isMobile}
              />
            ))}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginBottom: '0.3rem' }}>
              Wil je het in eigen woorden toevoegen? (optioneel)
            </div>
            <textarea
              value={motivationExtra}
              onChange={e => {
                setMotivationExtra(e.target.value)
                // Combineer tags + eigen tekst
                const tags = (data.motivation_tags || []).map(t => MOTIVATION_OPTIONS.find(o => o.value === t)?.label || t).join(', ')
                update('motivation', [tags, e.target.value].filter(Boolean).join('. '))
              }}
              placeholder="Bijv: Ik wil me beter voelen in mijn kleren..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: isMobile ? '0.75rem 0.9rem' : '0.8rem 1rem',
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: 500, fontFamily: 'inherit', outline: 'none',
                resize: 'none', lineHeight: 1.5
              }}
            />
          </div>
          <NextBtn
            onClick={handleOnNext}
            disabled={!data.motivation_tags?.length && !motivationExtra}
            label="VOLGENDE →"
            isMobile={isMobile}
          />
        </>

      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {renderStep()}
    </div>
  )
}
