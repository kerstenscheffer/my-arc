// src/modules/public-intake/components/phase1/CoachingFlow.jsx
// Stap 6: Coaching — eerdere coaching, obstakels, stijl, verwachtingen

import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, PhotoGrid, TextField, OptionGrid } from './FlowStep'
import { Flame, Zap, Target, Heart } from 'lucide-react'

const COACHING_HISTORY_OPTIONS = [
  { value: 'nooit',        label: 'Nooit gedaan',         sub: 'Eerste keer coaching' },
  { value: 'pt',           label: 'Personal trainer',     sub: 'In de gym begeleiding gehad' },
  { value: 'online_coach', label: 'Online coach',         sub: 'Via app of programma' },
  { value: 'eigen_plan',   label: 'Eigen plan gevolgd',   sub: 'Zelf iets uitgewerkt' },
  { value: 'dieet',        label: 'Dieet programma',      sub: 'Bijv. Weight Watchers, Atkins' },
]

const OBSTACLE_OPTIONS = [
  { value: 'consistentie', label: 'Consistentie',          sub: 'Ik val vaak terug in oude gewoontes' },
  { value: 'voeding',      label: 'Voeding',               sub: 'Ik weet niet wat ik moet eten' },
  { value: 'tijd',         label: 'Tijd',                  sub: 'Ik heb het te druk' },
  { value: 'motivatie',    label: 'Motivatie',             sub: 'Ik val snel weg' },
  { value: 'kennis',       label: 'Kennis',                sub: 'Ik weet niet hoe ik moet trainen' },
  { value: 'anders',       label: 'Iets anders',           sub: '' },
]

const COACHING_GOAL_OPTIONS = [
  { value: 'discipline',    label: 'Meer discipline opbouwen' },
  { value: 'zelfvertrouwen', label: 'Meer zelfvertrouwen' },
  { value: 'kennis',        label: 'Meer kennis over voeding en training' },
  { value: 'energie',       label: 'Meer energie in het dagelijks leven' },
  { value: 'gewoonte',      label: 'Gezonde gewoontes aanleren' },
]

export default function CoachingFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState('geschiedenis')
  const [history, setHistory] = useState([])
  const [extraObstacle, setExtraObstacle] = useState('')
  const [extraExpectations, setExtraExpectations] = useState(data.coaching_expectations || '')

  const go = (next) => { setHistory(h => [...h, step]); setStep(next) }
  const goBack = () => {
    if (history.length === 0) { onBack?.(); return }
    setStep(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const update = (field, value) => onChange({ ...data, [field]: value })
  const updateMultiple = (fields) => onChange({ ...data, ...fields })

  const handleOnNext = () => {
    console.log('✅ CoachingFlow voltooid — onComplete aanroepen met data:', {
      coaching_style_pref: data.coaching_style_pref,
      coaching_expectations: data.coaching_expectations,
      biggest_obstacle: data.biggest_obstacle,
      previous_coaching: data.previous_coaching,
    })
    onNext()
  }

  const toggleObstacle = (val) => {
    const current = data.obstacle_tags || []
    const updated = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val]
    const labels = updated.map(v => OBSTACLE_OPTIONS.find(o => o.value === v)?.label || v)
    if (extraObstacle) labels.push(extraObstacle)
    updateMultiple({
      obstacle_tags: updated,
      biggest_obstacle: labels.join(', ')
    })
  }

  const renderStep = () => {
    switch (step) {

      case 'geschiedenis':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Heb je eerder coaching of een dieet gevolgd?</Q>
          <Hint isMobile={isMobile}>Meerdere opties mogelijk.</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {COACHING_HISTORY_OPTIONS.map(opt => (
              <BigOption
                key={opt.value}
                label={opt.label} sub={opt.sub}
                onClick={() => {
                  const current = data.coaching_history_tags || []
                  const updated = current.includes(opt.value)
                    ? current.filter(v => v !== opt.value)
                    : [...current, opt.value]
                  const labels = updated.map(v => COACHING_HISTORY_OPTIONS.find(o => o.value === v)?.label || v)
                  updateMultiple({ coaching_history_tags: updated, previous_coaching: labels.join(', ') })
                }}
                selected={(data.coaching_history_tags || []).includes(opt.value)}
                isMobile={isMobile}
              />
            ))}
          </div>
          <NextBtn
            onClick={() => {
              const tags = data.coaching_history_tags || []
              // Alleen doorvragen als iemand eerder iets heeft gedaan
              if (tags.length === 1 && tags[0] === 'nooit') {
                go('obstakel')
              } else {
                go('wat_werkte')
              }
            }}
            disabled={!data.coaching_history_tags?.length}
            isMobile={isMobile}
          />
        </>

      case 'wat_werkte':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat werkte er eerder wél voor jou?</Q>
          <Hint isMobile={isMobile}>Denk aan wat je energie gaf, wat haalbaar voelde, wat resultaat opleverde.</Hint>
          <textarea
            value={data.wat_werkte_eerder || ''}
            onChange={e => update('wat_werkte_eerder', e.target.value)}
            placeholder="Bijv: Vaste maaltijden hielpen me, meer bewegen gaf energie, structuur werkte goed..."
            rows={3}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 500,
              fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6
            }}
          />
          <NextBtn
            onClick={() => go('waarom_gestopt')}
            disabled={!data.wat_werkte_eerder?.trim()}
            isMobile={isMobile}
          />
        </>

      case 'waarom_gestopt':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Waarom stopte je precies?</Q>
          <Hint isMobile={isMobile}>Eerlijk antwoord helpt je coach om dit keer wél een plan te maken dat past.</Hint>
          <textarea
            value={data.waarom_gestopt || ''}
            onChange={e => update('waarom_gestopt', e.target.value)}
            placeholder="Bijv: Te streng plan, paste niet bij mijn leven, geen tijd, sociale druk..."
            rows={3}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 500,
              fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6
            }}
          />
          <NextBtn
            onClick={() => go('obstakel')}
            disabled={!data.waarom_gestopt?.trim()}
            isMobile={isMobile}
          />
        </>

      case 'obstakel':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat is je grootste obstakel?</Q>
          <Hint isMobile={isMobile}>Wat maakt het moeilijk om je doel te bereiken?</Hint>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {OBSTACLE_OPTIONS.map(opt => (
              <BigOption
                key={opt.value}
                label={opt.label} sub={opt.sub}
                onClick={() => toggleObstacle(opt.value)}
                selected={(data.obstacle_tags || []).includes(opt.value)}
                isMobile={isMobile}
              />
            ))}
          </div>
          {(data.obstacle_tags || []).includes('anders') && (
            <TextField
              value={extraObstacle}
              onChange={v => {
                setExtraObstacle(v)
                const labels = (data.obstacle_tags || []).map(tag => OBSTACLE_OPTIONS.find(o => o.value === tag)?.label || tag)
                labels.push(v)
                update('biggest_obstacle', labels.filter(Boolean).join(', '))
              }}
              placeholder="Vertel kort wat jouw obstakel is..."
              isMobile={isMobile}
              autoFocus
            />
          )}
          <NextBtn
            onClick={() => go('stijl')}
            disabled={!data.obstacle_tags?.length}
            isMobile={isMobile}
          />
        </>

      case 'stijl':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Welke coaching stijl past bij jou?</Q>
          <PhotoGrid
            value={data.coaching_style_pref}
            onChange={v => { update('coaching_style_pref', v); go('verwachtingen') }}
            isMobile={isMobile}
            options={[
              { value: 'direct',      label: 'Hard & direct',  sub: 'Push me, geen excuses',       image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=200&fit=crop&q=80' },
              { value: 'motivating',  label: 'Motiverend',     sub: 'Positief, aanmoedigend',       image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=200&fit=crop&q=80' },
              { value: 'data_driven', label: 'Data-driven',    sub: 'Cijfers en feiten',            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&q=80' },
              { value: 'relaxed',     label: 'Relaxed',        sub: 'Op mijn tempo, geen druk',     image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop&q=80' },
            ]}
          />
        </>

      case 'verwachtingen':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat verwacht je van de coaching?</Q>
          <Hint isMobile={isMobile}>Vertel in eigen woorden wat voor jou belangrijk is.</Hint>
          <textarea
            value={extraExpectations}
            onChange={e => {
              setExtraExpectations(e.target.value)
              update('coaching_expectations', e.target.value)
            }}
            placeholder="Bijv: Ik wil duidelijk weten wat ik moet eten, streng zijn als ik afhaal..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: isMobile ? '0.8rem 0.9rem' : '0.85rem 1rem',
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: 500, fontFamily: 'inherit',
              outline: 'none', resize: 'none', lineHeight: 1.6
            }}
            autoFocus
          />
          <NextBtn
            onClick={() => go('coaching_doel')}
            disabled={!extraExpectations.trim()}
            isMobile={isMobile}
          />
        </>

      case 'coaching_doel':
        return <>
          <BackBtn onBack={goBack} />
          <Q isMobile={isMobile}>Wat wil je halen uit dit traject, naast fysiek resultaat?</Q>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {COACHING_GOAL_OPTIONS.map(opt => (
              <BigOption
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  const current = data.coaching_goal_tags || []
                  const updated = current.includes(opt.value)
                    ? current.filter(v => v !== opt.value)
                    : [...current, opt.value]
                  const labels = updated.map(v => COACHING_GOAL_OPTIONS.find(o => o.value === v)?.label || v)
                  updateMultiple({ coaching_goal_tags: updated, coaching_goals_extra: labels.join(', ') })
                }}
                selected={(data.coaching_goal_tags || []).includes(opt.value)}
                isMobile={isMobile}
              />
            ))}
          </div>
          <NextBtn
            onClick={handleOnNext}
            label="DOORGAAN NAAR VOEDING →"
            disabled={!data.coaching_goal_tags?.length}
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
