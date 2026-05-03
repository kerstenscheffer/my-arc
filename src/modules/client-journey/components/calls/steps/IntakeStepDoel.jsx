// src/modules/client-journey/components/calls/steps/IntakeStepDoel.jsx
// v2 — foto context, verticale pills met icons, vraag centraal
import React, { useState, useRef } from 'react'
import {
  RefreshCw, ChevronRight, Check,
  Target, Zap, Scale, Dumbbell,
  Clock, AlertTriangle, TrendingDown,
  Flame, Heart, Activity, Shield, Star,
  ArrowRight, Repeat, Brain, Coffee
} from 'lucide-react'

const C = {
  gold: '#FFD700', green: '#10b981', blue: '#3b82f6', amber: '#f59e0b', red: '#ef4444',
  text: '#ffffff',
  text50: 'rgba(255,255,255,0.5)',
  text25: 'rgba(255,255,255,0.25)',
  text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)',
  borderSub: 'rgba(255,255,255,0.04)',
}

const BF_OPTIONS = [
  { value: 10, label: '7–10%',  sub: 'Competitie',        img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { value: 14, label: '10–15%', sub: 'Atletisch',          img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { value: 18, label: '15–20%', sub: 'Slank',              img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { value: 23, label: '20–25%', sub: 'Gemiddeld',          img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
  { value: 33, label: '25–35%', sub: 'Duidelijk buikje',   img: 'https://i.ibb.co/RGKN8LZr/Scherm-afbeelding-2026-03-27-om-12-39-02.png' },
]

const BF_TARGET_OPTIONS = [
  { value: 10, label: '~10%', sub: 'Sixpack',              img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { value: 14, label: '~14%', sub: 'Droog & atletisch',    img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { value: 18, label: '~18%', sub: 'Slank',                img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { value: 22, label: '~22%', sub: 'Fit & gezond',         img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
]

const MUSCLE_OPTIONS = [
  { value: 'lean',     label: 'Slank & atletisch',     img: 'https://i.ibb.co/BVSLB4dg/Scherm-afbeelding-2026-04-03-om-11-02-33.png' },
  { value: 'muscular', label: 'Gespierd & droog',      img: 'https://i.ibb.co/yF4sXLc6/Scherm-afbeelding-2026-04-03-om-10-59-31.png' },
  { value: 'big',      label: 'Heel gespierd & bulk',  img: 'https://i.ibb.co/ynvJBcxW/Scherm-afbeelding-2026-04-03-om-11-01-08.png' },
  { value: 'shredded', label: 'Gespierd & droog',      img: 'https://i.ibb.co/XrTRXk9h/Scherm-afbeelding-2026-04-03-om-11-00-52.png' },
]

const GOAL_IMAGES = {
  fat_loss:        'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80',
  muscle_gain:     'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
  recomp:          'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80',
  general_fitness: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
}

const GOAL_TO_ROUTE = {
  fat_loss: 'afvallen', muscle_gain: 'spieren',
  recomp: 'recomp', general_fitness: 'fitness',
}
const ROUTE_COLOR   = { afvallen: '#FFD700', spieren: '#3b82f6', recomp: '#10b981', fitness: '#10b981' }
const ROUTE_LABEL   = { afvallen: 'Vetverlies', spieren: 'Spieropbouw', recomp: 'Body Recomp', fitness: 'Fitter worden' }
const MOTIVATION_LABELS = {
  beter_uitzien: 'Beter uitzien', meer_energie: 'Meer energie',
  gezonder_leven: 'Gezonder leven', zelfvertrouwen: 'Meer zelfvertrouwen',
  prestaties: 'Betere sportprestaties', anders: 'Andere reden',
}

const QUESTIONS = {
  afvallen: [
    {
      id: 'doel',
      question: (cd) => `Je hebt aangegeven dat je wil afvallen. Wat bedoel je daar precies mee?`,
      suggestions: [
        { icon: Scale,        text: (cd) => cd?.current_weight && cd?.target_weight ? `${Math.abs(Number(cd.current_weight) - Number(cd.target_weight)).toFixed(1)} kg kwijtraken` : '5–10 kg kwijt' },
        { icon: TrendingDown, text: () => 'Buikvet kwijtraken specifiek' },
        { icon: Zap,          text: () => 'Strakker worden in het algemeen' },
        { icon: Activity,     text: () => 'Passen in kleinere kleding' },
        { icon: Heart,        text: () => 'Me lichter en fitter voelen' },
        { icon: Star,         text: () => 'Meer zelfvertrouwen in mijn lichaam' },
      ],
    },
    {
      id: 'richting',
      question: () => 'Hoeveel wil je afvallen en hoe snel wil je dat aanpakken?',
      suggestions: [
        { icon: Flame,        text: () => 'Zo snel mogelijk, ik ben er klaar voor' },
        { icon: Clock,        text: () => 'Rustig en duurzaam, liever langzamer' },
        { icon: Target,       text: () => 'Voor een specifiek moment of datum' },
        { icon: ArrowRight,   text: () => 'Gewoon beginnen, tempo later bepalen' },
      ],
    },
    {
      id: 'blokkades',
      question: () => 'Wat heeft het eerder tegengehouden? En wat is nu anders?',
      suggestions: [
        { icon: AlertTriangle,text: () => 'Te streng plan — niet vol te houden' },
        { icon: Shield,       text: () => 'Geen begeleiding of accountability' },
        { icon: Brain,        text: () => 'Motivatie zakte weg na 2–3 weken' },
        { icon: Coffee,       text: () => 'Leven werd druk — werk of privé' },
        { icon: Repeat,       text: () => 'Val altijd terug in oude gewoontes' },
        { icon: Star,         text: () => 'Nu is het anders want...' },
      ],
    },
  ],
  spieren: [
    {
      id: 'doel',
      question: () => 'Je wil spieren opbouwen. Wat bedoel je daar precies mee?',
      suggestions: [
        { icon: Dumbbell,     text: () => 'Groter en voller worden' },
        { icon: Scale,        text: () => 'Lean bulk — zo weinig mogelijk vet erbij' },
        { icon: TrendingDown, text: () => 'Van skinny naar gespierd' },
        { icon: Target,       text: () => 'Meer volume in schouders/borst/benen' },
        { icon: Flame,        text: () => 'Serieuze massa opbouwen' },
        { icon: Star,         text: () => 'Sterker worden met meer massa' },
      ],
    },
    {
      id: 'aanpak',
      question: () => 'Wil je puur massa opbouwen, of ook tegelijk vet verliezen?',
      suggestions: [
        { icon: Dumbbell,     text: () => 'Puur massa — ik wil groter en zwaarder' },
        { icon: Activity,     text: () => 'Lean bulk — massa met zo weinig mogelijk vet' },
        { icon: Repeat,       text: () => 'Eerst bulk, later cutten' },
        { icon: Brain,        text: () => 'Ik weet het nog niet precies' },
      ],
    },
    {
      id: 'blokkades',
      question: () => 'Wat heeft het eerder tegengehouden? En wat is nu anders?',
      suggestions: [
        { icon: AlertTriangle,text: () => 'Geen structuur in mijn training' },
        { icon: Scale,        text: () => 'Te weinig eten — wist het niet' },
        { icon: Repeat,       text: () => 'Consistentie was mijn probleem' },
        { icon: Star,         text: () => 'Nu is het anders want...' },
      ],
    },
  ],
  recomp: [
    {
      id: 'doel',
      question: () => 'Je hebt body recomp ingevuld. Wat is voor jou het belangrijkste resultaat?',
      suggestions: [
        { icon: TrendingDown, text: () => 'Strakker worden — minder vet zichtbaar' },
        { icon: Dumbbell,     text: () => 'Meer spieren — ook al val ik niet veel af' },
        { icon: Star,         text: () => 'Meer definitie en vorm zien' },
        { icon: Activity,     text: () => 'Betere lichaamssamenstelling overall' },
        { icon: Heart,        text: () => 'Er gewoon beter uitzien' },
      ],
    },
    {
      id: 'geduld',
      question: () => 'Recomp vergt geduld — resultaat is zichtbaar maar langzamer. Hoe sta je daarin?',
      suggestions: [
        { icon: Clock,        text: () => 'Ik heb geduld — wil het goed doen' },
        { icon: Flame,        text: () => 'Ik wil snel resultaat zien' },
        { icon: Brain,        text: () => 'Leg me uit hoe lang het duurt' },
        { icon: ArrowRight,   text: () => 'Liever toch eerst cutten' },
      ],
    },
    {
      id: 'blokkades',
      question: () => 'Wat heeft het eerder tegengehouden?',
      suggestions: [
        { icon: AlertTriangle,text: () => 'Geen structuur in voeding' },
        { icon: Dumbbell,     text: () => 'Training was niet op orde' },
        { icon: Repeat,       text: () => 'Nooit echt serieus aangepakt' },
        { icon: Star,         text: () => 'Nu is het anders want...' },
      ],
    },
  ],
  fitness: [
    {
      id: 'doel',
      question: () => 'Je wil fitter worden. Wat betekent dat concreet voor jou?',
      suggestions: [
        { icon: Zap,          text: () => 'Meer energie overdag' },
        { icon: Activity,     text: () => 'Betere conditie — niet snel buiten adem' },
        { icon: Dumbbell,     text: () => 'Sterker worden in dagelijks leven' },
        { icon: TrendingDown, text: () => 'Minder buikvet zichtbaar' },
        { icon: Heart,        text: () => 'Gewoon lekkerder in mijn vel zitten' },
        { icon: Star,         text: () => 'Gezonder oud worden' },
      ],
    },
    {
      id: 'leefstijl',
      question: () => 'Wat moet er veranderen in je dagelijkse leven?',
      suggestions: [
        { icon: Activity,     text: () => 'Meer bewegen — minder zitten' },
        { icon: Clock,        text: () => 'Beter en langer slapen' },
        { icon: Coffee,       text: () => 'Regelmatiger eten' },
        { icon: Brain,        text: () => 'Meer structuur in mijn dag' },
        { icon: Heart,        text: () => 'Minder alcohol' },
      ],
    },
    {
      id: 'blokkades',
      question: () => 'Wat heeft het eerder tegengehouden?',
      suggestions: [
        { icon: Clock,        text: () => 'Geen tijd of motivatie' },
        { icon: Brain,        text: () => 'Wist niet waar te beginnen' },
        { icon: Coffee,       text: () => 'Te druk met werk of gezin' },
        { icon: Star,         text: () => 'Nu is het anders want...' },
      ],
    },
  ],
}

function detectRoute(value, cd) {
  const v = (value || '').toLowerCase()
  if (v.includes('recomp') || v.includes('strakk') || v.includes('definitie') || v.includes('tegelijk')) return 'recomp'
  if (v.includes('spier') || v.includes('massa') || v.includes('bulk') || v.includes('groter') || v.includes('gespierd')) return 'spieren'
  if (v.includes('afvall') || v.includes('kwijt') || v.includes('cutt') || v.includes('lichter')) return 'afvallen'
  if (v.includes('fit') || v.includes('energie') || v.includes('gezond') || v.includes('conditie')) return 'fitness'
  return GOAL_TO_ROUTE[cd?.primary_goal] || 'fitness'
}

function PhotoCard({ img, label, sub, badge, badgeColor }) {
  return (
    <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', width: '90px', flexShrink: 0 }}>
      <img src={img} alt={label} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 4px 3px', background: 'rgba(0,0,0,0.85)' }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.2, marginTop: '1px' }}>{sub}</div>}
      </div>
      {badge && (
        <div style={{ position: 'absolute', top: '4px', left: '4px', background: badgeColor || C.gold, borderRadius: '3px', padding: '1px 4px', fontSize: '8px', fontWeight: 800, color: '#000' }}>
          {badge}
        </div>
      )}
    </div>
  )
}

// Rustige context strip — foto's + data + obstakel
function IntakeContext({ cd }) {
  const bf1 = BF_OPTIONS.find(o => o.value === cd?.current_body_fat)
  const bf2 = BF_OPTIONS.find(o => o.value === cd?.current_body_fat_2)
  const bfTarget = BF_TARGET_OPTIONS.find(o => o.value === parseInt(cd?.target_body_fat))
  const muscleTarget = MUSCLE_OPTIONS.find(o => o.value === cd?.muscle_goal_type)
  const hasPhotos = bf1 || bfTarget || muscleTarget

  const chips = [
    cd?.current_weight && cd?.target_weight
      ? `${cd.current_weight} → ${cd.target_weight} kg`
      : cd?.current_weight ? `${cd.current_weight} kg` : null,
    cd?.goal_urgency ? `urgentie ${cd.goal_urgency}/10` : null,
    cd?.goal_timeline ? ({ '3': '3 mnd', '6': '6 mnd', '12': '12 mnd', no_rush: 'geen haast' }[cd.goal_timeline] || cd.goal_timeline) : null,
  ].filter(Boolean)

  const warnings = [
    cd?.sleep_hours && parseFloat(cd.sleep_hours) < 7 ? `slaap ${cd.sleep_hours}u` : null,
    cd?.stress_level && parseInt(cd.stress_level) >= 7 ? `stress ${cd.stress_level}/10` : null,
  ].filter(Boolean)

  return (
    <div style={{ paddingTop: '16px', paddingBottom: '12px', borderBottom: `1px solid ${C.borderSub}`, textAlign: 'center' }}>

      {/* Foto's + data — één gecentreerde rij */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {hasPhotos && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {(bf1 || bf2) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Huidig</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {bf1 && <MiniPhoto img={bf1.img} label={bf1.label} />}
                  {bf2 && <MiniPhoto img={bf2.img} label={bf2.label} />}
                </div>
              </div>
            )}
            {(bf1 || bf2) && (bfTarget || muscleTarget) && (
              <div style={{ paddingBottom: '52px' }}>
                <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
              </div>
            )}
            {(bfTarget || muscleTarget) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Doel</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {bfTarget && <MiniPhoto img={bfTarget.img} label={bfTarget.label} highlight />}
                  {muscleTarget && <MiniPhoto img={muscleTarget.img} label={muscleTarget.label} highlight />}
                </div>
              </div>
            )}
          </div>
        )}

        {hasPhotos && chips.length > 0 && (
          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.08)' }} />
        )}

        {/* Data — plain wit, geen kleur */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {chips.map((chip, i) => (
            <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{chip}</span>
          ))}
          {warnings.map((w, i) => (
            <span key={i} style={{ fontSize: '12px', fontWeight: 700, color: C.amber }}>⚠ {w}</span>
          ))}
        </div>
      </div>

      {/* Obstakel — rood, alleen als aanwezig */}
      {cd?.biggest_obstacle && (
        <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: C.red }}>obstakel: </span>
          <span style={{ color: 'rgba(239,68,68,0.75)' }}>
            {cd.biggest_obstacle.slice(0, 80)}{cd.biggest_obstacle.length > 80 ? '...' : ''}
          </span>
        </div>
      )}

      {/* Motivatie — tags + vrije tekst */}
      {(cd?.motivation_tags?.length > 0 || cd?.motivation) && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>motivatie</span>
          {(cd.motivation_tags || []).map(t => (
            <span key={t} style={{
              fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px', padding: '2px 7px',
            }}>{MOTIVATION_LABELS[t] || t}</span>
          ))}
          {cd.motivation && !cd.motivation_tags?.length && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              "{cd.motivation}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function MiniPhoto({ img, label, highlight }) {
  return (
    <div style={{
      position: 'relative', borderRadius: '4px', overflow: 'hidden', flexShrink: 0,
      width: '70px', height: '105px',
      border: `1px solid ${highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
      opacity: highlight ? 1 : 0.65,
    }}>
      <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1px 2px', background: 'rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{label}</div>
      </div>
    </div>
  )
}

function Pill({ icon: Icon, text, active, onToggle, color }) {
  const activeColor = color || C.gold
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '8px 12px',
      background: active ? `${activeColor}08` : 'transparent',
      border: `1px solid ${active ? `${activeColor}30` : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.12s ease', minHeight: '40px',
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
        background: active ? `${activeColor}15` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? `${activeColor}30` : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s ease',
      }}>
        {active
          ? <Check size={13} color={activeColor} strokeWidth={2.5} />
          : <Icon size={13} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
        }
      </div>
      <span style={{
        fontSize: '13px', fontWeight: active ? 700 : 500,
        color: active ? activeColor : 'rgba(255,255,255,0.5)',
        lineHeight: 1.3, flex: 1,
        transition: 'color 0.12s ease',
      }}>{text}</span>
    </button>
  )
}

export default function IntakeStepDoel({ cd, db, notes, updateNotes, onComplete, isMobile }) {
  const intakeRoute = GOAL_TO_ROUTE[cd?.primary_goal] || 'fitness'
  // Route staat in notes zodat hij persistent is bij tab switch
  const savedRoute = notes?.doel?.route
  const [route, setRoute] = useState(savedRoute || intakeRoute)
  const [qIndex, setQIndex] = useState(0)
  const [showSwitch, setShowSwitch] = useState(false)
  const [localText, setLocalText] = useState('')
  const history = useRef([])

  const routeColor = ROUTE_COLOR[route]
  const questions = QUESTIONS[route] || QUESTIONS.fitness
  const currentQ = questions[qIndex]
  const progress = (qIndex + 1) / (questions.length + 1)
  const isLast = qIndex === questions.length - 1

  const doelNotes = notes.doel || {}
  const currentValue = doelNotes[currentQ?.id] || ''

  const getAllSuggestionTexts = (q) =>
    (q?.suggestions || []).map(s => typeof s.text === 'function' ? s.text(cd) : s.text)

  const selectedPills = currentValue
    .split(' · ')
    .filter(p => getAllSuggestionTexts(currentQ).includes(p))

  const updateNote = (id, pills, text) => {
    const parts = [...pills, ...(text ? [text] : [])].filter(Boolean)
    updateNotes('doel', { [id]: parts.join(' · ') })
  }

  const togglePill = (text) => {
    const next = selectedPills.includes(text)
      ? selectedPills.filter(p => p !== text)
      : [...selectedPills, text]
    updateNote(currentQ.id, next, localText)
  }

  const handleText = (e) => {
    setLocalText(e.target.value)
    updateNote(currentQ.id, selectedPills, e.target.value)
  }

  const handleNext = () => {
    // Vraag 1: alleen auto-detecteren als er GEEN expliciete switch was
    if (qIndex === 0 && !notes?.doel?.route) {
      const detected = detectRoute(currentValue, cd)
      if (detected !== route) {
        setRoute(detected)
        updateNotes('doel', { route: detected })
        history.current = []
        setQIndex(1)
        setLocalText('')
        setShowSwitch(false)
        return
      }
    }
    if (!isLast) {
      history.current.push(qIndex)
      setQIndex(qIndex + 1)
      setLocalText('')
    } else {
      onComplete()
    }
    setShowSwitch(false)
  }

  const handleBack = () => {
    if (history.current.length > 0) {
      setQIndex(history.current.pop())
      setLocalText('')
    }
  }

  const ROUTE_TO_GOAL = {
    afvallen: 'fat_loss', spieren: 'muscle_gain',
    recomp: 'recomp', fitness: 'general_fitness',
  }

  const handleSwitch = async (newRoute) => {
    setRoute(newRoute)
    setQIndex(0)
    history.current = []
    setLocalText('')
    setShowSwitch(false)
    // Persistent opslaan in notes
    updateNotes('doel', { route: newRoute })

    // Direct opslaan in DB
    if (db?.supabase && cd?.id) {
      const newGoal = ROUTE_TO_GOAL[newRoute]
      const { error } = await db.supabase
        .from('clients')
        .update({ primary_goal: newGoal })
        .eq('id', cd.id)
      if (error) console.error('❌ Route switch save:', error.message)
      else console.log('✅ primary_goal opgeslagen:', newGoal)
    }
  }

  const SWITCH_OPTIONS = [
    { route: 'afvallen', label: 'Toch vetverlies als focus' },
    { route: 'spieren',  label: 'Toch spieropbouw als focus' },
    { route: 'recomp',   label: 'Toch body recomp als focus' },
    { route: 'fitness',  label: 'Toch fitter worden als focus' },
  ].filter(o => o.route !== route)

  const MAX_W = 560

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Route balk — vol breed */}
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stap 1 · Doel</span>
        <span style={{ fontSize: '9px', fontWeight: 700, color: routeColor, background: `${routeColor}12`, border: `1px solid ${routeColor}25`, borderRadius: '4px', padding: '1px 7px', textTransform: 'uppercase' }}>
          {ROUTE_LABEL[route]}
        </span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: routeColor, transition: 'width 0.3s ease' }} />
        </div>
        <button onClick={() => setShowSwitch(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: showSwitch ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
          padding: '3px 8px', color: 'rgba(255,255,255,0.4)',
          fontSize: '10px', fontWeight: 700, cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '26px',
        }}>
          <RefreshCw size={9} />Wijzig
        </button>
      </div>

      {/* Switch opties */}
      {showSwitch && (
        <div style={{ borderBottom: `1px solid ${C.borderSub}`, background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
          {SWITCH_OPTIONS.map(opt => (
            <button key={opt.route} onClick={() => handleSwitch(opt.route)} style={{
              width: '100%', padding: '8px 16px', background: 'transparent', border: 'none',
              borderBottom: `1px solid ${C.borderSub}`, color: 'rgba(255,255,255,0.5)',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '36px',
            }}>{opt.label}</button>
          ))}
        </div>
      )}

      {/* Scrollbare content — alles gecentreerd */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: `${MAX_W}px`, margin: '0 auto', padding: '0 16px' }}>

          {/* Context strip — gecentreerd */}
          <IntakeContext cd={cd} />

          {/* Voortgang dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', paddingTop: '20px', paddingBottom: '14px' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: i === qIndex ? '24px' : '6px', height: '3px', borderRadius: '2px',
                background: i <= qIndex ? routeColor : 'rgba(255,255,255,0.12)',
                transition: 'all 0.25s ease',
              }} />
            ))}
          </div>

          {/* Vraag — groot, gecentreerd */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              fontSize: isMobile ? '22px' : '26px',
              fontWeight: 800, color: C.text,
              lineHeight: 1.25, letterSpacing: '-0.02em',
            }}>
              {typeof currentQ?.question === 'function' ? currentQ.question(cd) : currentQ?.question}
            </div>
          </div>

          {/* Pills — gecentreerd, vol breed binnen de kolom */}
          {currentQ && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {currentQ.suggestions.map((s, i) => {
                const text = typeof s.text === 'function' ? s.text(cd) : s.text
                return (
                  <Pill
                    key={i}
                    icon={s.icon}
                    text={text}
                    active={selectedPills.includes(text)}
                    color={routeColor}
                    onToggle={() => togglePill(text)}
                  />
                )
              })}

              {/* Vrij tekstveld */}
              <div style={{ marginTop: '4px', borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: '4px' }}>
                <button
                  onClick={() => document.getElementById('doel-free-input')?.focus()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '8px 12px',
                    background: localText ? `${routeColor}06` : 'transparent',
                    border: `1px solid ${localText ? `${routeColor}20` : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '8px', cursor: 'text', textAlign: 'left',
                    touchAction: 'manipulation', transition: 'all 0.12s',
                  }}
                >
                  <ArrowRight size={13} color="rgba(255,255,255,0.2)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <input
                    id="doel-free-input"
                    type="text"
                    value={localText}
                    onChange={handleText}
                    placeholder="Of typ zelf..."
                    style={{
                      flex: 1, padding: 0, background: 'transparent', border: 'none',
                      outline: 'none', fontFamily: 'inherit',
                      fontSize: '13px', fontWeight: localText ? 600 : 400,
                      color: localText ? C.text : 'rgba(255,255,255,0.25)',
                    }}
                  />
                </button>
              </div>

              {/* Knop direct onder "of typ zelf" */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {qIndex > 0 && (
                  <button onClick={handleBack} style={{
                    width: '44px', height: '44px', background: 'transparent',
                    border: `1px solid ${C.border}`, borderRadius: '8px',
                    color: C.text25, cursor: 'pointer', fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                  }}>←</button>
                )}
                <button onClick={handleNext} style={{
                  flex: 1, height: '44px',
                  background: isLast ? 'rgba(16,185,129,0.08)' : `${routeColor}08`,
                  border: `1px solid ${isLast ? 'rgba(16,185,129,0.3)' : `${routeColor}30`}`,
                  borderRadius: '8px',
                  color: isLast ? C.green : routeColor,
                  fontSize: '12px', fontWeight: 800,
                  cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}>
                  {isLast ? 'Naar plan' : 'Volgende vraag'}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          <div style={{ height: '20px' }} />
        </div>
      </div>
    </div>
  )
}
