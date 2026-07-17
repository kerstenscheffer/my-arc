// src/coach/tabs/client-info/IntakeSummaryModal.jsx
// Read-only viewer voor de 3 delen van de publieke intake (/myintake):
//   1. Persoonlijk  -> velden uit de `clients` tabel (deel 1)
//   2. Voeding      -> voedings-velden uit de `clients` tabel (deel 2)
//   3. Training     -> `user_workout_preferences` tabel (deel 3)
import { useState, useEffect } from 'react'
import { X, User, Utensils, Dumbbell, CheckCircle2, Clock } from 'lucide-react'

const GREEN = '#10b981'

// ---- waarde-formatters -----------------------------------------------------

const humanize = (v) =>
  String(v)
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

const MAPS = {
  gender: { male: 'Man', female: 'Vrouw' },
  goal: {
    fat_loss: 'Vetverlies',
    muscle_gain: 'Spieropbouw',
    recomp: 'Recompositie',
    general_fitness: 'Algemene fitness'
  },
  muscle_goal_type: { lean: 'Lean', muscular: 'Gespierd', big: 'Massa', shredded: 'Shredded' },
  goal_timeline: { 3: '3 maanden', 6: '6 maanden', 12: '12 maanden', no_rush: 'Geen haast' },
  activity_level: {
    sedentary: 'Zittend werk',
    lightly_active: 'Licht actief',
    moderately_active: 'Matig actief',
    very_active: 'Zeer actief'
  },
  coaching_style: {
    direct: 'Direct',
    motivating: 'Motiverend',
    data_driven: 'Data-gedreven',
    relaxed: 'Relaxed'
  },
  experience: { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Ervaren' },
  willingness: { starting: 'Wil beginnen', already: 'Traint al', no: 'Traint niet' },
  location: { gym: 'Sportschool', home: 'Thuis', both: 'Beide' },
  yes_no_soms: { yes: 'Ja', sometimes: 'Soms', no: 'Nee', maybe: 'Misschien' },
  split: {
    full_body: 'Full body',
    ppl: 'Push / Pull / Legs',
    upper_lower: 'Upper / Lower',
    bro_split: 'Bro split',
    no_preference: 'Geen voorkeur'
  },
  days: { ma: 'Ma', di: 'Di', wo: 'Wo', do: 'Do', vr: 'Vr', za: 'Za', zo: 'Zo' }
}

const fmtMap = (map) => (v) => map[v] ?? humanize(v)
const fmtBool = (v) => (v ? 'Ja' : 'Nee')
const fmtArr = (map) => (v) =>
  (Array.isArray(v) ? v : [v]).map((x) => (map ? map[x] ?? humanize(x) : humanize(x))).join(', ')
const fmtDate = (v) => {
  try {
    return new Date(v).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return String(v)
  }
}
const fmtNum = (unit) => (v) => `${v}${unit ? ' ' + unit : ''}`

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)

// ---- veld-definities per deel ---------------------------------------------

const PART1_SECTIONS = [
  {
    title: 'Basis',
    fields: [
      { key: 'first_name', label: 'Voornaam' },
      { key: 'last_name', label: 'Achternaam' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefoon' },
      { key: 'gender', label: 'Geslacht', fmt: fmtMap(MAPS.gender) },
      { key: 'date_of_birth', label: 'Geboortedatum', fmt: fmtDate },
      { key: 'age', label: 'Leeftijd', fmt: fmtNum('jaar') }
    ]
  },
  {
    title: 'Lichaam',
    fields: [
      { key: 'height', label: 'Lengte', fmt: fmtNum('cm') },
      { key: 'current_weight', label: 'Huidig gewicht', fmt: fmtNum('kg') },
      { key: 'current_body_fat', label: 'Huidig vetpercentage', fmt: fmtNum('%') },
      { key: 'current_body_fat_2', label: 'Vetpercentage (2e)', fmt: fmtNum('%') }
    ]
  },
  {
    title: 'Doel',
    fields: [
      { key: 'primary_goal', label: 'Hoofddoel', fmt: fmtMap(MAPS.goal) },
      { key: 'target_weight', label: 'Streefgewicht', fmt: fmtNum('kg') },
      { key: 'has_weight_goal', label: 'Gewichtsdoel', fmt: fmtBool },
      { key: 'target_body_fat', label: 'Streef-vetpercentage', fmt: fmtNum('%') },
      { key: 'muscle_goal_type', label: 'Spierdoel', fmt: fmtMap(MAPS.muscle_goal_type) },
      { key: 'lichaam_omschrijving', label: 'Gewenst lichaam' },
      { key: 'fitness_doel_tags', label: 'Fitnessdoelen', fmt: fmtArr() },
      { key: 'goal_timeline', label: 'Tijdlijn', fmt: fmtMap(MAPS.goal_timeline) },
      { key: 'goal_deadline', label: 'Deadline', fmt: fmtDate },
      { key: 'goal_urgency', label: 'Urgentie', fmt: fmtNum('/ 10') },
      { key: 'motivation', label: 'Motivatie' }
    ]
  },
  {
    title: 'Levensstijl',
    fields: [
      { key: 'activity_level', label: 'Activiteitsniveau', fmt: fmtMap(MAPS.activity_level) },
      { key: 'preferred_training_days', label: 'Trainingsdagen', fmt: fmtArr(MAPS.days) },
      { key: 'training_time', label: 'Trainingstijd' },
      { key: 'sleep_hours', label: 'Slaap', fmt: fmtNum('uur') },
      { key: 'cooking_time', label: 'Kooktijd', fmt: fmtNum('min') },
      { key: 'stress_level', label: 'Stressniveau', fmt: fmtNum('/ 10') }
    ]
  },
  {
    title: 'Gezondheid',
    fields: [{ key: 'medical_conditions', label: 'Medische aandoeningen' }]
  },
  {
    title: 'Coaching',
    fields: [
      { key: 'previous_coaching', label: 'Eerdere coaching' },
      { key: 'wat_werkte_eerder', label: 'Wat werkte eerder' },
      { key: 'waarom_gestopt', label: 'Waarom gestopt' },
      { key: 'biggest_obstacle', label: 'Grootste obstakel' },
      { key: 'coaching_style_pref', label: 'Coachingsstijl', fmt: fmtMap(MAPS.coaching_style) },
      { key: 'coaching_expectations', label: 'Verwachtingen' },
      { key: 'coaching_goal_tags', label: 'Coachingdoelen', fmt: fmtArr() },
      { key: 'coaching_goals_extra', label: 'Extra doelen' }
    ]
  }
]

const PART2_SECTIONS = [
  {
    title: 'Voedingsvoorkeuren',
    fields: [
      { key: 'meals_per_day', label: 'Maaltijden per dag' },
      { key: 'loved_foods', label: 'Favoriete voeding' },
      { key: 'hated_foods', label: 'Vermijdt liever' },
      { key: 'allergies', label: 'Allergieën' },
      { key: 'cooking_skill', label: 'Kookvaardigheid', fmt: (v) => humanize(v) },
      { key: 'variety_preference', label: 'Variatie-voorkeur', fmt: (v) => humanize(v) }
    ]
  },
  {
    title: 'Berekende doelen',
    fields: [
      { key: 'tdee', label: 'TDEE', fmt: fmtNum('kcal') },
      { key: 'target_calories', label: 'Streefcalorieën', fmt: fmtNum('kcal') },
      { key: 'target_protein', label: 'Eiwit', fmt: fmtNum('g') },
      { key: 'target_carbs', label: 'Koolhydraten', fmt: fmtNum('g') },
      { key: 'target_fat', label: 'Vetten', fmt: fmtNum('g') }
    ]
  }
]

const PART3_SECTIONS = [
  {
    title: 'Ervaring',
    fields: [
      { key: 'training_willingness', label: 'Trainingsbereidheid', fmt: fmtMap(MAPS.willingness) },
      { key: 'no_training_reason', label: 'Reden geen training' },
      { key: 'default_experience_level', label: 'Ervaringsniveau', fmt: fmtMap(MAPS.experience) }
    ]
  },
  {
    title: 'Praktisch',
    fields: [
      { key: 'default_days_per_week', label: 'Dagen per week', fmt: fmtNum('x') },
      { key: 'default_time_per_session', label: 'Tijd per sessie', fmt: fmtNum('min') },
      { key: 'training_location', label: 'Locatie', fmt: fmtMap(MAPS.location) },
      { key: 'gym_name', label: 'Sportschool' },
      { key: 'default_equipment', label: 'Materiaal', fmt: fmtArr() },
      { key: 'training_time', label: 'Trainingstijd' }
    ]
  },
  {
    title: 'Focus',
    fields: [
      { key: '_split_pref', label: 'Split-voorkeur', fmt: fmtMap(MAPS.split) },
      { key: '_split_focus', label: 'Focus', fmt: fmtArr() },
      { key: 'emphasize_stretch', label: 'Nadruk op stretch', fmt: fmtBool },
      { key: 'prioritize_compounds', label: 'Compound-prioriteit', fmt: fmtBool }
    ]
  },
  {
    title: 'Cardio',
    fields: [
      { key: 'does_cardio', label: 'Doet cardio', fmt: fmtMap(MAPS.yes_no_soms) },
      { key: 'cardio_interest', label: 'Interesse in cardio', fmt: fmtMap(MAPS.yes_no_soms) },
      { key: 'cardio_types', label: 'Type cardio', fmt: fmtArr() },
      { key: 'cardio_frequency', label: 'Frequentie', fmt: fmtNum('x / week') },
      { key: 'cardio_duration', label: 'Duur', fmt: fmtNum('min') }
    ]
  },
  {
    title: 'Beperkingen',
    fields: [
      { key: 'injuries', label: 'Blessures' },
      { key: 'avoided_exercises', label: 'Vermijdt oefeningen' },
      { key: 'other_limitations', label: 'Overige beperkingen' }
    ]
  }
]

// ---- render helpers --------------------------------------------------------

function renderSections(sections, data) {
  const rendered = sections
    .map((section) => {
      const rows = section.fields
        .map((f) => {
          const raw = data?.[f.key]
          if (isEmpty(raw)) return null
          const value = f.fmt ? f.fmt(raw) : String(raw)
          if (isEmpty(value)) return null
          return { label: f.label, value }
        })
        .filter(Boolean)
      return rows.length ? { title: section.title, rows } : null
    })
    .filter(Boolean)

  if (!rendered.length) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.9rem'
        }}
      >
        Dit deel van de intake is nog niet ingevuld.
      </div>
    )
  }

  return rendered.map((section) => (
    <div key={section.title} style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: GREEN,
          marginBottom: '0.6rem'
        }}
      >
        {section.title}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {section.rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              padding: '0.7rem 0.9rem',
              background: '#111'
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.55)',
                flexShrink: 0
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                color: '#fff',
                fontWeight: '500',
                textAlign: 'right',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))
}

// ---- component -------------------------------------------------------------

export default function IntakeSummaryModal({ db, client, isMobile, onClose }) {
  const [activeTab, setActiveTab] = useState('part1')
  const [training, setTraining] = useState(null)
  const [clientTraining, setClientTraining] = useState(null)
  const [loadingTraining, setLoadingTraining] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadTraining = async () => {
      setLoadingTraining(true)
      try {
        if (!client?.id || !db?.supabase) {
          if (!cancelled) setTraining(null)
          return
        }
        // user_workout_preferences.user_id = auth_user_id. Het klantobject
        // bevat auth_user_id niet altijd (bv. vanuit het Command Center), en
        // sommige intakes schrijven de training-antwoorden alleen naar de
        // clients-kolommen. Daarom halen we die rij hier op: voor auth_user_id
        // én als fallback-bron voor de training-velden.
        const { data: c } = await db.supabase
          .from('clients')
          .select('auth_user_id, training_experience, training_days, workout_days_per_week, preferred_training_days, training_time, training_info')
          .eq('id', client.id).single()
        if (!cancelled) setClientTraining(c || null)
        const authUserId = client?.auth_user_id || c?.auth_user_id || null
        const ids = [authUserId, client.id].filter(Boolean)
        const { data, error } = ids.length ? await db.supabase
          .from('user_workout_preferences')
          .select('*')
          .in('user_id', ids)
          .order('workout_completed_at', { ascending: false, nullsFirst: false })
          .limit(1) : { data: null, error: null }
        if (error) throw error
        if (!cancelled) setTraining(data?.[0] || null)
      } catch (e) {
        console.error('[IntakeSummaryModal] training load failed:', e)
        if (!cancelled) setTraining(null)
      } finally {
        if (!cancelled) setLoadingTraining(false)
      }
    }
    loadTraining()
    return () => {
      cancelled = true
    }
  }, [client?.id, client?.auth_user_id, db])

  // Fallback vanuit de clients-kolommen → op de uwp-veldnamen die de renderer
  // gebruikt. Sommige intakes vullen alleen deze kolommen (geen uwp-rij), dan
  // zou de Training-tab anders leeg blijven.
  const clientFallback = clientTraining
    ? {
        default_experience_level: clientTraining.training_experience || undefined,
        default_days_per_week: clientTraining.training_days ?? clientTraining.workout_days_per_week ?? undefined,
        training_time: clientTraining.training_time || undefined,
        other_limitations: clientTraining.training_info || undefined,
      }
    : {}

  // Merge: uwp-waarden winnen, clients-kolommen vullen de gaten. Zo werkt de
  // Training-tab of de data nu in user_workout_preferences of op clients staat.
  const merged = { ...clientFallback, ...(training || {}) }
  const hasTrainingData = Object.values(merged).some(v => v !== undefined && v !== null && v !== '')
  const trainingData = hasTrainingData
    ? {
        ...merged,
        _split_pref: training?.split_preferences?.preferred,
        _split_focus: training?.split_preferences?.focus
      }
    : null

  const tabs = [
    { id: 'part1', label: 'Persoonlijk', icon: User, done: client?.intake_completed },
    { id: 'part2', label: 'Voeding', icon: Utensils, done: client?.intake_completed },
    { id: 'part3', label: 'Training', icon: Dumbbell, done: training?.workout_completed || (hasTrainingData && client?.intake_completed) }
  ]

  const fullName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Boven de CoachInsight-modal (zIndex 10000) zodat 'ie ook vanuit het
        // Command Center vóór de insight-modal opent, niet erachter.
        zIndex: 10600,
        padding: isMobile ? '0' : '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0d0d',
          borderRadius: isMobile ? '0' : '16px',
          border: '1px solid rgba(16,185,129,0.25)',
          width: '100%',
          maxWidth: '560px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>Intake</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{fullName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            padding: '0.75rem 1.25rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.4rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${GREEN}` : '2px solid transparent',
                  color: active ? GREEN : 'rgba(255,255,255,0.55)',
                  fontSize: isMobile ? '0.78rem' : '0.85rem',
                  fontWeight: active ? '700' : '500',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Icon size={16} />
                {tab.label}
                {tab.done && <CheckCircle2 size={13} color={GREEN} />}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {activeTab === 'part1' && renderSections(PART1_SECTIONS, client)}
          {activeTab === 'part2' && renderSections(PART2_SECTIONS, client)}
          {activeTab === 'part3' &&
            (loadingTraining ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '2rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.9rem'
                }}
              >
                <Clock size={16} /> Training laden…
              </div>
            ) : (
              renderSections(PART3_SECTIONS, trainingData)
            ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
