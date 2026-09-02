// Client Agenda Service — fase 1 read-only.
//
// Verzamelt voor een gegeven client alle "blokken" die in hun week
// staan: meals (uit client_meal_plans.week_structure), trainingen
// (is_training_day per dag) en placeholder-blokken voor slaap/werk
// (komen pas écht in fase 2 met een eigen tabel).
//
// Een block:
//   { id, day, type, label, start, end, color, source, sourceId,
//     editable: false, meta: { ... } }
//   - day: 'monday'|'tuesday'|...|'sunday'
//   - start/end: minuten sinds middernacht (0–1440)
//   - type: 'meal'|'training'|'sleep'|'work'|'custom'
//   - source: 'meal_plan'|'workout_schema'|'placeholder'
//
// Conventies voor duur (geen opslag nog):
//   breakfast/lunch/dinner → 45 min
//   snack*                 → 15 min
//   training               → 60 min, default 17:00
//   sleep                  → 23:00–07:00 (placeholder)
//   work                   → alleen uit de intake; niets ingevuld = geen blok

import { laadSupplementen, groepeerPerMoment, doseringTekst, geldtOpDag } from '../supplements/utils/supplementSchedule'

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Intake-form gebruikt NL-afkortingen (ma/di/wo/do/vr/za/zo).
// Mapping naar onze interne lowercase Engelse keys.
const NL_TO_EN_DAY = {
  ma: 'monday', di: 'tuesday', wo: 'wednesday', do: 'thursday',
  vr: 'friday', za: 'saturday', zo: 'sunday',
}
// Intake-type mapping naar onze block-types.
// De weekbouwer schrijft het SOORT BAAN als blok-type (zie WORK_TYPES in
// public-intake/components/WeekBuilder). Deze tabel kende alleen 'anders' en
// 'werk', waardoor kantoor-, horeca-, fysiek- en winkel-uren stilletjes uit de
// agenda vielen. Van de 15 klanten met een werkschema was er maar één type
// dat doorkwam.
const INTAKE_TYPE_MAP = {
  slaap: 'sleep',
  training: 'training',
  werk: 'work',
  anders: 'work',
  kantoor: 'work',
  horeca: 'work',
  fysiek: 'work',
  winkel: 'work',
}

// Wat voor werk het is, voor het label op het blok. "Winkel 06:00-15:00" zegt
// meer dan "Werk 06:00-15:00", en dat is precies waarvoor de coach kijkt.
const WERK_LABEL = {
  kantoor: 'Kantoor',
  horeca: 'Horeca',
  fysiek: 'Fysiek werk',
  winkel: 'Winkel',
  anders: 'Werk',
  werk: 'Werk',
}

// Maandag van de week voor een gegeven datum (lokale tz).
export const getMondayOf = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // zo=0 ma=1 .. za=6
  const offset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + offset)
  return d
}
// YYYY-MM-DD voor PostgreSQL date columns.
export const toIsoDate = (date) => {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}
// Datum voor een dag-naam in de week van weekAnchor (maandag).
export const dateForDay = (weekAnchor, dayName) => {
  const idx = DAYS.indexOf(dayName)
  if (idx < 0) return null
  const d = new Date(weekAnchor)
  d.setDate(d.getDate() + idx)
  return d
}

// Recurring-id helpers — stabiele identifiers voor template-items.
// Met deze id linken we per-datum overrides aan het terugkerende blok.
export const recurringIdFor = (block) => {
  if (block.type === 'meal') return `meal-${block.day}-${block.meta?.slot || 'unknown'}`
  if (block.dbId) return `block-${block.dbId}`
  if (block.type === 'training') return `training-${block.day}-default`
  if (block.type === 'sleep')    return `sleep-${block.day}-default`
  if (block.type === 'work')     return `work-${block.day}-default`
  return `custom-${block.day}-${block.start}`
}
export const DAY_LABELS_NL = { monday: 'Ma', tuesday: 'Di', wednesday: 'Wo', thursday: 'Do', friday: 'Vr', saturday: 'Za', sunday: 'Zo' }
export const DAY_LABELS_NL_LONG = { monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag', thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag' }

const SLOT_DURATION = { breakfast: 15, lunch: 15, dinner: 15, snack1: 15, snack2: 15, snack3: 15 }
const SLOT_LABEL = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Avondeten', snack1: 'Snack', snack2: 'Snack', snack3: 'Snack' }
// Fallback-kloktijd per slot: meals uit ai_meals dragen .timing soms als
// maaltijd-type-array (['lunch']) i.p.v. een klok-tijd. Zonder fallback zou
// zo'n meal uit de agenda verdwijnen. Zelfde defaults als de Plan Analyzer.
const SLOT_DEFAULT_TIME = {
  breakfast: '07:30', snack1: '10:30', lunch: '13:00', snack2: '15:30',
  dinner: '19:00', snack3: '21:30', snack4: '22:00', snack5: '22:30',
  snack6: '23:00', snack7: '23:30', snack8: '23:59',
}
const SLOT_COLOR = '#f59e0b' // amber voor meals
const SUPPLEMENT_COLOR = '#22c55e' // groen — onderscheidt zich van maaltijd-amber
const SUPPLEMENT_DURATION = 20
const TRAINING_COLOR = '#3b82f6' // blue
const SLEEP_COLOR = '#6366f1' // indigo
const WORK_COLOR = '#64748b' // slate (placeholder)

// Pre-workout maaltijd: staat op het plan (client_meal_plans.pre_workout_meal),
// niet in week_structure. Hij hoort dus niet bij een vaste dag maar bij de
// training — hij schuift mee als de trainingsdag verschuift. In de agenda
// plaatsen we hem daarom relatief aan het trainingsblok van die dag.
const PRE_WORKOUT_LEAD = 60   // minuten vóór aanvang training
const PRE_WORKOUT_DURATION = 15

const TRAINING_DEFAULT_START = 17 * 60
const TRAINING_DEFAULT_DURATION = 60
const SLEEP_START = 23 * 60
const SLEEP_END = 7 * 60 // wraps midnight — block split

const parseTime = (timeStr) => {
  if (!timeStr) return null
  // Accepteert "07:30", "7:30", "17:00" — geeft minuten sinds middernacht
  const m = /^(\d{1,2}):(\d{2})/.exec(String(timeStr))
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

const sortAndAssign = (blocks) => {
  return blocks
    .filter(b => Number.isFinite(b.start) && Number.isFinite(b.end))
    .sort((a, b) => a.start - b.start)
}

// Helpers voor PostgreSQL time-strings (HH:MM:SS).
const minutesToTimeStr = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}
const timeStrToMinutes = (str) => {
  if (!str) return null
  const m = /^(\d{2}):(\d{2})/.exec(str)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

export class ClientAgendaService {
  constructor(supabase) { this.supabase = supabase }

  async loadWeek(clientId, weekAnchor = null, forcedMealPlanId = null) {
    const anchor = weekAnchor ? getMondayOf(weekAnchor) : getMondayOf(new Date())
    const weekStart = toIsoDate(anchor)
    const weekEndDate = new Date(anchor); weekEndDate.setDate(weekEndDate.getDate() + 6)
    const weekEnd = toIsoDate(weekEndDate)

    const [mealPlan, schema, customBlocks, workoutSchedule, overrides, intakeSchedule, supplementen] = await Promise.all([
      forcedMealPlanId ? this._loadMealPlanById(forcedMealPlanId) : this._loadMealPlan(clientId),
      this._loadWorkoutSchema(clientId),
      this._loadCustomBlocks(clientId),
      this._loadWorkoutSchedule(clientId),
      this._loadOverrides(clientId, weekStart, weekEnd),
      this._loadIntakeSchedule(clientId),
      laadSupplementen(this.supabase, clientId),
    ])

    // Bouw per dag een lookup van intake-blokken per type. Gebruikt als
    // bron voor placeholders die echte tijden uit het intake-formulier
    // tonen (slaap, werk, training) i.p.v. hardcoded defaults.
    // intakePlaceholders[day] = { sleep: [{start,end}], work: [{start,end}], training: [{start,end}] }
    const intakePlaceholders = {}
    DAYS.forEach(d => { intakePlaceholders[d] = { sleep: [], work: [], training: [] } })
    if (intakeSchedule && typeof intakeSchedule === 'object') {
      Object.entries(intakeSchedule).forEach(([nlDay, items]) => {
        const enDay = NL_TO_EN_DAY[nlDay]
        if (!enDay || !Array.isArray(items)) return
        const seen = new Set() // dedupe (intake kan duplicates hebben)
        items.forEach(blk => {
          if (!blk?.type || !blk?.start || !blk?.end) return
          const ourType = INTAKE_TYPE_MAP[blk.type]
          if (!ourType) return
          const key = `${ourType}-${blk.start}-${blk.end}`
          if (seen.has(key)) return
          seen.add(key)
          intakePlaceholders[enDay][ourType].push({
            start: timeStrToMinutes(blk.start),
            end: timeStrToMinutes(blk.end),
            bron: blk.type,
          })
        })
      })
    }

    // Map: { day → { recurringId → override-row } } voor snelle lookup
    const overridesByDayId = {}
    DAYS.forEach(d => { overridesByDayId[d] = {} })
    overrides.forEach(o => {
      const day = this._dayFromIsoDate(o.override_date, anchor)
      if (day) overridesByDayId[day][o.recurring_id] = o
    })

    const blocksByDay = {}
    DAYS.forEach(d => { blocksByDay[d] = [] })
    // Per dag de kloktijd per maaltijd-slot. Supplementen met een
    // meal_reference haken hierop aan, zodat ze meeschuiven als de coach een
    // maaltijd verzet.
    const mealTimesByDay = {}
    DAYS.forEach(d => { mealTimesByDay[d] = {} })

    // ── Meals ──
    // Legacy plans store week_structure as {setA, setB, training_days}.
    // Expand to per-day before iterating, using workoutSchedule for training-day
    // truth when available — falls back to plan.training_days otherwise.
    let mealWeek = mealPlan?.week_structure || null
    if (mealWeek && (mealWeek.setA || mealWeek.setB) && !DAYS.some(d => mealWeek[d])) {
      const EN_BY_INDEX = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      let trainingSet = null
      if (workoutSchedule && typeof workoutSchedule === 'object') {
        const scheduleKeys = new Set(Object.keys(workoutSchedule))
        trainingSet = new Set(
          EN_BY_INDEX.map((en, i) => scheduleKeys.has(en) ? i : -1).filter(i => i >= 0)
        )
      } else if (Array.isArray(mealWeek.training_days)) {
        trainingSet = new Set(mealWeek.training_days.map(n => parseInt(n, 10)))
      } else {
        trainingSet = new Set()
      }
      const expanded = {}
      DAYS.forEach((d, idx) => {
        const isTraining = trainingSet.has(idx)
        const tpl = isTraining ? (mealWeek.setA || mealWeek.setB) : (mealWeek.setB || mealWeek.setA)
        if (!tpl) return
        expanded[d] = { ...tpl, is_training_day: isTraining }
      })
      mealWeek = expanded
    }
    if (mealWeek) {
      DAYS.forEach(day => {
        const dayData = mealWeek[day]
        if (!dayData) return
        Object.entries(dayData).forEach(([slot, meal]) => {
          if (slot === 'totals' || slot === 'is_training_day') return
          if (!meal || typeof meal !== 'object') return
          // Klok-tijd bepalen: meal.timing indien geldig, anders slot-default.
          // (ai_meals slaat .timing soms als type-array op → geen klok-tijd.)
          const timing = parseTime(meal.timing) ?? parseTime(SLOT_DEFAULT_TIME[slot])
          if (timing == null) return
          const duration = SLOT_DURATION[slot] || 30
          mealTimesByDay[day][slot] = timing
          blocksByDay[day].push({
            id: `meal-${day}-${slot}`,
            day, type: 'meal',
            // meal.display_label (custom door coach) wint van slot-default
            label: meal.display_label || SLOT_LABEL[slot] || slot,
            sublabel: meal.name || meal.meal_name,
            start: timing,
            end: timing + duration,
            color: SLOT_COLOR,
            source: 'meal_plan',
            sourceId: meal.meal_id || meal.id,
            editable: true,
            meta: {
              slot,
              kcal: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              image_url: meal.image_url || null,
              icon: meal.icon || null,
              mealPlanId: mealPlan.id,
            },
          })
        })
      })
    }

    // ── Index custom blokken per dag per type, voor placeholder-override ──
    const customByDayType = {}
    DAYS.forEach(d => { customByDayType[d] = { training: [], sleep: [], work: [], custom: [] } })
    customBlocks.forEach(row => {
      if (!customByDayType[row.day]) return
      customByDayType[row.day][row.type]?.push(row)
    })

    const COLOR_BY_TYPE = {
      training: TRAINING_COLOR,
      sleep: SLEEP_COLOR,
      work: WORK_COLOR,
      custom: '#a855f7',
    }

    // ── Trainingen ──
    // Source of truth: clients.workout_schedule[day] → workoutKey in
    // schema.week_structure. Geeft de échte per-dag workout-naam +
    // exercises (zelfde data als TodaysWorkoutCard). Fallback op
    // mealPlan.is_training_day als er geen workout_schedule is.
    //
    // Case-mismatch: legacy schedules slaan "Monday"/"Tuesday" op
    // (capitalized) terwijl deze module lowercase gebruikt. Daarom een
    // case-insensitive lookup over alle keys.
    const scheduleLookup = (day) => {
      if (!workoutSchedule) return null
      const target = day.toLowerCase()
      for (const k of Object.keys(workoutSchedule)) {
        if (k.toLowerCase() === target) return workoutSchedule[k]
      }
      return null
    }
    // split_type kan in de DB op "custom" staan als sjabloon-default.
    // Dat is geen zinvolle info voor de coach — filter weg.
    const cleanSplit = (s) => {
      if (!s) return null
      const v = String(s).trim().toLowerCase()
      if (v === 'custom' || v === '') return null
      return s
    }

    // Als het workout_schedule + schema oplosbaar zijn, zijn de trainingsdagen
    // uitsluitend de dagen waar workout_schedule[day] naar een bestaande
    // schema-key wijst (zelfde bron als de Plan Analyzer). De is_training_day
    // vlag in het meal-plan kan stale zijn en mag dan NIET extra dagen bijtellen.
    // Alleen zonder bruikbaar schema vallen we terug op die vlag.
    const canResolveWorkouts = !!workoutSchedule && !!schema?.week_structure
    // Vroegste trainingsstart per dag — nodig om de pre-workout maaltijd
    // ervoor te kunnen zetten.
    const trainingStartByDay = {}
    DAYS.forEach(day => {
      const dbTrainings = customByDayType[day].training
      const workoutKey = scheduleLookup(day)
      const dayWorkout = (workoutKey && schema?.week_structure?.[workoutKey]) || null
      const isTrainingDayFlag = !!mealPlan?.week_structure?.[day]?.is_training_day
      const isTrainingDay = canResolveWorkouts ? !!dayWorkout : (!!dayWorkout || isTrainingDayFlag)

      // Workout-specifieke meta: titel + oefenaantal als die er zijn.
      // Als er geen specifieke workout voor de dag is val terug op het
      // schema-niveau (split-naam etc.).
      const workoutMeta = dayWorkout
        ? {
            workout_name: dayWorkout.name || workoutKey,
            exercise_count: Array.isArray(dayWorkout.exercises) ? dayWorkout.exercises.length : null,
            estimated_time: dayWorkout.geschatteTijd || null,
          }
        : (schema ? {
            split: cleanSplit(schema.split_name) || cleanSplit(schema.split_type),
            days_per_week: schema.days_per_week,
          } : {})

      const workoutTitle = workoutMeta.workout_name || (schema ? schema.name : null)

      // Als het schema de trainingsdagen bepaalt, tonen we opgeslagen
      // trainingsblokken alleen op échte trainingsdagen. Zo verdwijnen stale
      // rijen die op rustdagen zijn achtergebleven (bv. van oude is_training_day
      // syncs). Dedupe bovendien identieke rijen (zelfde tijd/sublabel) per dag.
      const showDbTrainings = !canResolveWorkouts || !!dayWorkout
      const seenTraining = new Set()
      const noteerStart = (min) => {
        if (!Number.isFinite(min)) return
        if (trainingStartByDay[day] == null || min < trainingStartByDay[day]) trainingStartByDay[day] = min
      }
      if (showDbTrainings) dbTrainings.forEach(row => {
        const dedupeKey = `${row.start_time}|${row.end_time}|${row.sublabel || ''}`
        if (seenTraining.has(dedupeKey)) return
        seenTraining.add(dedupeKey)
        const start = timeStrToMinutes(row.start_time)
        const end = timeStrToMinutes(row.end_time)
        noteerStart(start)
        blocksByDay[day].push({
          id: `db-${row.id}`,
          dbId: row.id,
          day, type: 'training',
          label: row.label || 'Training',
          sublabel: row.sublabel || workoutTitle,
          start, end,
          color: row.color || TRAINING_COLOR,
          source: 'client_agenda_blocks',
          sourceId: row.id,
          editable: true,
          meta: { ...workoutMeta },
        })
      })

      // Geen DB-blok maar wel training-dag → toon placeholder als hint.
      // Gebruik intake-tijden als die er zijn, anders hardcoded default.
      if (isTrainingDay && dbTrainings.length === 0) {
        const intakeTrainings = intakePlaceholders[day]?.training || []
        if (intakeTrainings.length > 0) {
          intakeTrainings.forEach((blk, i) => {
            noteerStart(blk.start)
            blocksByDay[day].push({
              id: `training-intake-${day}-${i}`,
              day, type: 'training',
              label: 'Training',
              sublabel: workoutTitle || 'Uit intake-formulier',
              start: blk.start, end: blk.end,
              color: TRAINING_COLOR,
              source: 'intake',
              editable: true,
              meta: { placeholder: true, from_intake: true, ...workoutMeta },
            })
          })
        } else {
          noteerStart(TRAINING_DEFAULT_START)
          blocksByDay[day].push({
            id: `training-placeholder-${day}`,
            day, type: 'training',
            label: 'Training',
            sublabel: workoutTitle || 'Tijd nog niet ingesteld',
            start: TRAINING_DEFAULT_START,
            end: TRAINING_DEFAULT_START + TRAINING_DEFAULT_DURATION,
            color: TRAINING_COLOR,
            source: 'placeholder',
            editable: true,
            meta: { placeholder_time: true, ...workoutMeta },
          })
        }
      }
    })

    // ── Pre-workout maaltijd ──
    // Eén maaltijd op het plan, die alleen op trainingsdagen telt. We hangen
    // hem aan het trainingsblok van die dag i.p.v. aan een vast tijdstip:
    // verplaatst de coach de training, dan verhuist de maaltijd mee.
    // Niet editable — hij hoort bij het plan, niet bij deze ene dag. Wie hem
    // wil wijzigen doet dat in de Plan Analyzer (dagweergave).
    const preWorkout = mealPlan?.pre_workout_meal
    if (preWorkout && typeof preWorkout === 'object') {
      DAYS.forEach(day => {
        const trainStart = trainingStartByDay[day]
        if (!Number.isFinite(trainStart)) return
        // Niet vóór middernacht duwen bij een vroege ochtendtraining.
        const start = Math.max(0, trainStart - PRE_WORKOUT_LEAD)
        blocksByDay[day].push({
          id: `meal-${day}-pre_workout`,
          day, type: 'meal',
          label: 'Pre-workout',
          sublabel: preWorkout.name || preWorkout.meal_name,
          start,
          end: Math.min(trainStart, start + PRE_WORKOUT_DURATION),
          color: SLOT_COLOR,
          source: 'meal_plan',
          sourceId: preWorkout.meal_id || preWorkout.id,
          editable: false,
          meta: {
            slot: 'pre_workout',
            preWorkout: true,
            kcal: preWorkout.calories,
            protein: preWorkout.protein,
            carbs: preWorkout.carbs,
            fat: preWorkout.fat,
            image_url: preWorkout.image_url || null,
            icon: preWorkout.icon || null,
            mealPlanId: mealPlan.id,
          },
        })
      })
    }

    // ── Supplementen ──
    // Uit supplement_plans (status active). Meerdere supplementen op hetzelfde
    // moment worden één blok: drie pillen om 07:00 zijn voor de coach één
    // handeling, en drie losse blokjes zouden de tijdlijn dichtslibben.
    // Niet sleepbaar — de tijd hoort bij het supplementenplan, niet bij de
    // agenda. Wijzigen gaat in de Supplementen-tab.
    if (supplementen.length > 0) {
      DAYS.forEach(day => {
        // Per dag filteren: een supplement kan aan bepaalde dagen zijn
        // toegewezen (bv. creatine alleen op trainingsdagen).
        const vandaag = supplementen.filter(x => geldtOpDag(x, day))
        if (vandaag.length === 0) return
        groepeerPerMoment(vandaag, mealTimesByDay[day]).forEach((moment, i) => {
          // Zonder tijdstip ("flexible") hoort het niet op een tijdlijn.
          // De dagweergave toont die wel, onder "Flexibel".
          if (moment.minuten == null) return
          const namen = moment.items.map(x => x.name).filter(Boolean)
          blocksByDay[day].push({
            id: `supplement-${day}-${i}`,
            day, type: 'supplement',
            label: 'Supplementen',
            sublabel: namen.join(' · '),
            start: moment.minuten,
            end: Math.min(24 * 60, moment.minuten + SUPPLEMENT_DURATION),
            color: SUPPLEMENT_COLOR,
            source: 'supplement_plan',
            editable: false,
            meta: {
              supplement: true,
              aantal: moment.items.length,
              emojis: moment.items.map(x => x.emoji).filter(Boolean).join(''),
              items: moment.items.map(x => ({
                naam: x.name,
                emoji: x.emoji || null,
                dosering: doseringTekst(x),
                notitie: x.timing?.notes || null,
                prioriteit: x.priority_level || null,
              })),
            },
          })
        })
      })
    }

    // ── Slaap ──
    // Wrap-around (start > end) wordt visueel in twee halves gesplitst,
    // maar fullStart/fullEnd in meta laat de modal de hele window
    // editen i.p.v. één helft.
    DAYS.forEach(day => {
      const dbSleep = customByDayType[day].sleep
      if (dbSleep.length > 0) {
        dbSleep.forEach(row => {
          const start = timeStrToMinutes(row.start_time)
          const end = timeStrToMinutes(row.end_time)
          const base = {
            dbId: row.id, day, type: 'sleep',
            label: row.label || 'Slaap',
            color: row.color || SLEEP_COLOR,
            source: 'client_agenda_blocks', sourceId: row.id,
            editable: true,
          }
          if (start > end) {
            const m = { fullStart: start, fullEnd: end }
            blocksByDay[day].push({ ...base, id: `db-${row.id}-late`,  start, end: 24*60, meta: { ...m, wrapHalf: 'late' } })
            blocksByDay[day].push({ ...base, id: `db-${row.id}-early`, start: 0, end,    meta: { ...m, wrapHalf: 'early' } })
          } else {
            blocksByDay[day].push({ ...base, id: `db-${row.id}`, start, end, meta: {} })
          }
        })
      } else {
        // Geen DB-rij → gebruik intake-tijd als die er is, anders hardcoded
        // default 23:00 → 07:00.
        const intakeSleep = intakePlaceholders[day]?.sleep || []
        const sleepBlocks = intakeSleep.length > 0
          ? intakeSleep.map(b => ({ start: b.start, end: b.end, fromIntake: true }))
          : [{ start: SLEEP_START, end: SLEEP_END, fromIntake: false }]

        sleepBlocks.forEach((sb, i) => {
          const fullMeta = {
            placeholder: true,
            from_intake: sb.fromIntake,
            fullStart: sb.start, fullEnd: sb.end,
          }
          const sourceLabel = sb.fromIntake ? 'intake' : 'placeholder'
          if (sb.start > sb.end) {
            // Over-middernacht → split in twee visuele halves
            blocksByDay[day].push({
              id: `sleep-${sourceLabel}-late-${day}-${i}`, day, type: 'sleep', label: 'Slaap',
              start: sb.start, end: 24 * 60,
              color: SLEEP_COLOR, source: sourceLabel, editable: true,
              meta: { ...fullMeta, wrapHalf: 'late' },
            })
            blocksByDay[day].push({
              id: `sleep-${sourceLabel}-early-${day}-${i}`, day, type: 'sleep', label: 'Slaap',
              start: 0, end: sb.end,
              color: SLEEP_COLOR, source: sourceLabel, editable: true,
              meta: { ...fullMeta, wrapHalf: 'early' },
            })
          } else {
            blocksByDay[day].push({
              id: `sleep-${sourceLabel}-${day}-${i}`, day, type: 'sleep', label: 'Slaap',
              start: sb.start, end: sb.end,
              color: SLEEP_COLOR, source: sourceLabel, editable: true,
              meta: fullMeta,
            })
          }
        })
      }
    })

    // ── Werk ──
    DAYS.forEach(day => {
      const dbWork = customByDayType[day].work
      if (dbWork.length > 0) {
        dbWork.forEach(row => {
          const start = timeStrToMinutes(row.start_time)
          const end = timeStrToMinutes(row.end_time)
          const baseBlock = {
            dbId: row.id, day, type: 'work',
            label: row.label || 'Werk',
            sublabel: row.sublabel,
            color: row.color || WORK_COLOR,
            source: 'client_agenda_blocks', sourceId: row.id,
            editable: true,
          }
          if (start > end) {
            blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}-late`, start, end: 24*60, meta: { wrapHalf: 'late' } })
            blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}-early`, start: 0, end, meta: { wrapHalf: 'early' } })
          } else {
            blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}`, start, end, meta: {} })
          }
        })
      } else {
        // Alleen werkuren tonen die de klant écht heeft opgegeven. Eén dag
        // mag meerdere blokken hebben (ochtend- plus middagshift).
        //
        // Hier stond een terugval: geen intake-werkuren → toch een blok
        // 09:00-17:00 op ma t/m vr. Dat verzon werk dat niemand had
        // ingevuld, bij 41 van de 57 klanten, en maakte de agenda voller
        // dan de werkelijkheid. Werk toevoegen kan nog steeds met de
        // plus-knop bovenaan de dag.
        const intakeWork = intakePlaceholders[day]?.work || []
        intakeWork.forEach((blk, i) => {
          blocksByDay[day].push({
            id: `work-intake-${day}-${i}`,
            day, type: 'work', label: WERK_LABEL[blk.bron] || 'Werk',
            start: blk.start, end: blk.end,
            color: WORK_COLOR, source: 'intake',
            editable: true,
            meta: { placeholder: true, from_intake: true },
          })
        })
      }
    })

    // ── Custom blokken (vrij invulbaar) ──
    DAYS.forEach(day => {
      customByDayType[day].custom.forEach(row => {
        const start = timeStrToMinutes(row.start_time)
        const end = timeStrToMinutes(row.end_time)
        const baseBlock = {
          dbId: row.id, day, type: 'custom',
          label: row.label || 'Custom',
          sublabel: row.sublabel,
          color: row.color || COLOR_BY_TYPE.custom,
          source: 'client_agenda_blocks', sourceId: row.id,
          editable: true,
        }
        if (start > end) {
          blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}-late`, start, end: 24*60, meta: { wrapHalf: 'late' } })
          blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}-early`, start: 0, end, meta: { wrapHalf: 'early' } })
        } else {
          blocksByDay[day].push({ ...baseBlock, id: `db-${row.id}`, start, end, meta: {} })
        }
      })
    })

    // ── Per-datum overrides toepassen ──
    // Loop alle blokken in alle dagen door en kijk of er voor de
    // bijbehorende datum + recurring_id een override bestaat. Skipped =
    // weglaten. Anders start/end vervangen.
    DAYS.forEach(day => {
      const dayOverrides = overridesByDayId[day]
      if (!dayOverrides) return
      blocksByDay[day] = blocksByDay[day].flatMap(b => {
        const recId = recurringIdFor(b)
        const ov = dayOverrides[recId]
        if (!ov) return [b]
        if (ov.skipped) return [] // dag overslaan
        const newStart = timeStrToMinutes(ov.override_start_time) ?? b.start
        const newEnd   = timeStrToMinutes(ov.override_end_time)   ?? b.end
        return [{
          ...b,
          start: newStart, end: newEnd,
          meta: { ...b.meta, overrideId: ov.id, isOverridden: true },
        }]
      })
    })

    Object.keys(blocksByDay).forEach(d => { blocksByDay[d] = sortAndAssign(blocksByDay[d]) })
    return {
      blocksByDay,
      mealPlan,
      schema,
      weekAnchor: anchor,
      weekStart, weekEnd,
      hasMealPlan: !!mealPlan,
      hasSchema: !!schema,
    }
  }

  // Welke weekdag-naam hoort bij een ISO-datum binnen de week vanaf anchor?
  _dayFromIsoDate(isoDate, anchor) {
    if (!isoDate) return null
    const target = new Date(isoDate); target.setHours(0, 0, 0, 0)
    const ms = target.getTime() - anchor.getTime()
    const idx = Math.round(ms / (24 * 60 * 60 * 1000))
    return idx >= 0 && idx < 7 ? DAYS[idx] : null
  }

  async _loadOverrides(clientId, weekStartIso, weekEndIso) {
    const { data, error } = await this.supabase
      .from('client_agenda_overrides')
      .select('*')
      .eq('client_id', clientId)
      .gte('override_date', weekStartIso)
      .lte('override_date', weekEndIso)
    if (error) { console.warn('overrides', error); return [] }
    return data || []
  }

  // ── Override CRUD ──
  async upsertOverride({ clientId, dateIso, recurringId, startMin, endMin, skipped = false }) {
    const payload = {
      client_id: clientId,
      override_date: dateIso,
      recurring_id: recurringId,
      override_start_time: startMin != null ? minutesToTimeStr(startMin) : null,
      override_end_time:   endMin   != null ? minutesToTimeStr(endMin)   : null,
      skipped,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await this.supabase
      .from('client_agenda_overrides')
      .upsert(payload, { onConflict: 'client_id,override_date,recurring_id' })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteOverride({ clientId, dateIso, recurringId }) {
    const { error } = await this.supabase
      .from('client_agenda_overrides')
      .delete()
      .eq('client_id', clientId)
      .eq('override_date', dateIso)
      .eq('recurring_id', recurringId)
    if (error) throw error
  }

  async _loadMealPlan(clientId) {
    const { data, error } = await this.supabase
      .from('client_meal_plans')
      .select('id, template_name, week_structure, is_active, pre_workout_meal')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle()
    if (error) { console.warn('loadMealPlan', error); return null }
    return data
  }

  // Laadt een specifiek meal-plan op id (i.p.v. de actieve voor een
  // client). Wordt gebruikt wanneer plan-analyzer de agenda ingesloten
  // toont van een concept-plan dat nog niet active is.
  async _loadMealPlanById(planId) {
    const { data, error } = await this.supabase
      .from('client_meal_plans')
      .select('id, template_name, week_structure, is_active, pre_workout_meal')
      .eq('id', planId)
      .maybeSingle()
    if (error) { console.warn('loadMealPlanById', error); return null }
    return data
  }

  // Werk-schedule uit het intake-formulier (jsonb in clients.work_schedule).
  // Bevat slaap/training/anders tijden per dag — perfect als bron voor
  // placeholder-blokken in de agenda.
  async _loadIntakeSchedule(clientId) {
    const { data, error } = await this.supabase
      .from('clients')
      .select('work_schedule')
      .eq('id', clientId)
      .maybeSingle()
    if (error) { console.warn('work_schedule', error); return null }
    return data?.work_schedule || null
  }

  async _loadCustomBlocks(clientId) {
    const { data, error } = await this.supabase
      .from('client_agenda_blocks')
      .select('*')
      .eq('client_id', clientId)
    if (error) { console.warn('loadCustomBlocks', error); return [] }
    return data || []
  }

  // ── CRUD voor client_agenda_blocks ──
  async upsertBlock({ id, clientId, coachId, day, type, label, sublabel, startMin, endMin, color }) {
    const payload = {
      client_id: clientId,
      coach_id: coachId || null,
      day,
      type,
      label: label || (type[0].toUpperCase() + type.slice(1)),
      sublabel: sublabel || null,
      start_time: minutesToTimeStr(startMin),
      end_time: minutesToTimeStr(endMin),
      color: color || null,
      updated_at: new Date().toISOString(),
    }
    if (id) {
      const { data, error } = await this.supabase
        .from('client_agenda_blocks')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await this.supabase
        .from('client_agenda_blocks')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    }
  }

  async deleteBlock(id) {
    const { error } = await this.supabase
      .from('client_agenda_blocks')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  // ── Verplaats een blok naar een andere dag ──
  // Eén entry-point voor de view. Routeert op type:
  //   meal     → swap met de zelfde slot op de target-dag
  //   training → swap de is_training_day flag + verplaats eventueel
  //              custom training-block via dbId
  //   sleep/work/custom met dbId → simpelweg `day`-column updaten
  //   placeholder zonder dbId    → insert nieuwe row op de target-dag
  async moveBlock({ block, toDay, mealPlanId }) {
    if (!block || !toDay) throw new Error('block + toDay vereist')
    if (block.day === toDay) return false

    if (block.type === 'meal') {
      if (!mealPlanId || !block.meta?.slot) throw new Error('meal-block heeft mealPlanId + slot nodig')
      return this.swapMealSlot({ mealPlanId, fromDay: block.day, toDay, slot: block.meta.slot })
    }

    if (block.type === 'training') {
      if (!mealPlanId) throw new Error('training-block heeft mealPlanId nodig (is_training_day flag)')
      await this.flipTrainingDay({ mealPlanId, fromDay: block.day, toDay })
      // De échte workout-assignment leeft in clients.workout_schedule —
      // verschuif die ook mee, anders blijven titel + oefeningen op de
      // verkeerde dag staan.
      if (block.clientId) {
        await this.swapWorkoutScheduleDays({ clientId: block.clientId, fromDay: block.day, toDay })
      }
      if (block.dbId) await this._setBlockDay(block.dbId, toDay)
      return true
    }

    // sleep / work / custom
    if (block.dbId) {
      await this._setBlockDay(block.dbId, toDay)
      return true
    }
    // placeholder → maak een echte row op de target-dag
    await this.upsertBlock({
      id: null,
      clientId: block.clientId, // niet altijd aanwezig — caller moet vullen
      day: toDay,
      type: block.type,
      label: block.label,
      sublabel: block.sublabel,
      startMin: block.meta?.fullStart ?? block.start,
      endMin: block.meta?.fullEnd ?? block.end,
      color: block.color,
    })
    return true
  }

  async _setBlockDay(blockId, toDay) {
    const { error } = await this.supabase
      .from('client_agenda_blocks')
      .update({ day: toDay, updated_at: new Date().toISOString() })
      .eq('id', blockId)
    if (error) throw error
  }

  // Pas een tijd-verschuiving toe op meerdere dagen tegelijk. Voor
  // meal-blokken update we de timing in week_structure[day][slot] per
  // dag. Voor sleep/work/custom: upsert een client_agenda_blocks row
  // per dag (insert als die nog niet bestaat, update als wel).
  // Voor training: idem, maar zónder workout-template aan te raken
  // (workouts horen per-dag te verschillen).
  async applyBulkShift({ block, newStartMin, newEndMin: explicitEnd, days, mealPlanId, clientId }) {
    if (!Array.isArray(days) || days.length === 0) throw new Error('days vereist')
    // Bij drag krijgen we alleen newStartMin → end volgt uit originele duur.
    // Bij modal-save krijgen we expliciet beide tijden — die hebben voorrang.
    // Belangrijk voor over-middernacht-blokken (slaap): duur uit (end-start)
    // is negatief en mag dus NIET gebruikt worden als de user end zelf zet.
    let newEndMin
    if (explicitEnd != null) {
      newEndMin = explicitEnd
    } else {
      const fullStart = block.meta?.fullStart ?? block.start
      const fullEnd = block.meta?.fullEnd ?? block.end
      const duration = fullEnd >= fullStart ? (fullEnd - fullStart) : ((24*60 - fullStart) + fullEnd)
      newEndMin = (newStartMin + duration) % (24*60)
    }

    if (block.type === 'meal') {
      if (!mealPlanId || !block.meta?.slot) throw new Error('meal-block heeft mealPlanId + slot nodig')
      const { data: plan, error: loadErr } = await this.supabase
        .from('client_meal_plans')
        .select('week_structure')
        .eq('id', mealPlanId)
        .single()
      if (loadErr) throw loadErr
      const ws = plan?.week_structure || {}
      const newTiming = `${String(Math.floor(newStartMin / 60)).padStart(2, '0')}:${String(newStartMin % 60).padStart(2, '0')}`
      days.forEach(day => {
        if (!ws[day]) return // alleen dagen die al een slot hebben
        if (!ws[day][block.meta.slot]) return
        ws[day][block.meta.slot] = { ...ws[day][block.meta.slot], timing: newTiming }
      })
      const { error: saveErr } = await this.supabase
        .from('client_meal_plans')
        .update({ week_structure: ws, updated_at: new Date().toISOString() })
        .eq('id', mealPlanId)
      if (saveErr) throw saveErr
      return true
    }

    // sleep / work / training / custom — per dag een row upserten
    // Eerst alle bestaande rows ophalen om te beslissen tussen update / insert
    const { data: existing, error: existErr } = await this.supabase
      .from('client_agenda_blocks')
      .select('id, day, type')
      .eq('client_id', clientId)
      .eq('type', block.type)
      .in('day', days)
    if (existErr) throw existErr
    const existingByDay = {}
    ;(existing || []).forEach(r => { existingByDay[r.day] = r.id })

    for (const day of days) {
      const existingId = existingByDay[day] || null
      await this.upsertBlock({
        id: existingId,
        clientId,
        day,
        type: block.type,
        label: block.label,
        sublabel: block.sublabel,
        startMin: newStartMin, endMin: newEndMin,
        color: block.color,
      })
    }
    return true
  }

  // Verschuif een blok in tijd (en optioneel naar een andere dag).
  // Behoudt de duur. Routeert per type — meal → week_structure timing,
  // overige met dbId → update row, placeholder/nieuw → insert.
  async shiftBlock({ block, newStartMin, newEndMin: explicitEnd, toDay, mealPlanId }) {
    const targetDay = toDay || block.day
    let newEndMin
    if (explicitEnd != null) {
      newEndMin = explicitEnd
    } else {
      const fullStart = block.meta?.fullStart ?? block.start
      const fullEnd = block.meta?.fullEnd ?? block.end
      const duration = fullEnd >= fullStart ? (fullEnd - fullStart) : ((24*60 - fullStart) + fullEnd)
      newEndMin = (newStartMin + duration) % (24*60)
    }

    if (block.type === 'meal') {
      if (!mealPlanId || !block.meta?.slot) throw new Error('meal-block heeft mealPlanId + slot nodig')
      // Cross-day: eerst slot verhuizen, dan tijd op nieuwe dag updaten
      if (targetDay !== block.day) {
        await this.swapMealSlot({ mealPlanId, fromDay: block.day, toDay: targetDay, slot: block.meta.slot })
      }
      await this.updateMealTiming({ mealPlanId, day: targetDay, slot: block.meta.slot, newStartMin })
      return true
    }

    if (block.type === 'training') {
      // Cross-day: flip training-day flag + workout_schedule swap
      if (targetDay !== block.day) {
        if (mealPlanId) await this.flipTrainingDay({ mealPlanId, fromDay: block.day, toDay: targetDay })
        if (block.clientId) {
          await this.swapWorkoutScheduleDays({ clientId: block.clientId, fromDay: block.day, toDay: targetDay })
        }
      }
      // Tijd opslaan in client_agenda_blocks (workout_schemas heeft geen tijd-veld)
      await this.upsertBlock({
        id: block.dbId || null,
        clientId: block.clientId,
        day: targetDay,
        type: 'training',
        label: block.label || 'Training',
        sublabel: block.sublabel,
        startMin: newStartMin, endMin: newEndMin,
        color: block.color,
      })
      return true
    }

    // sleep / work / custom
    await this.upsertBlock({
      id: block.dbId || null,
      clientId: block.clientId,
      day: targetDay,
      type: block.type,
      label: block.label,
      sublabel: block.sublabel,
      startMin: newStartMin, endMin: newEndMin,
      color: block.color,
    })
    return true
  }

  // Swap dezelfde slot tussen twee dagen in week_structure. Als de
  // target-dag de slot niet heeft, verhuizen we 'm één kant op (move
  // i.p.v. swap) en zetten we de source-slot op null/leeg.
  async swapMealSlot({ mealPlanId, fromDay, toDay, slot }) {
    const { data: plan, error: loadErr } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', mealPlanId)
      .single()
    if (loadErr) throw loadErr

    const ws = plan?.week_structure || {}
    if (!ws[fromDay]) throw new Error(`${fromDay} bestaat niet in week_structure`)
    if (!ws[toDay]) ws[toDay] = {}

    const sourceMeal = ws[fromDay][slot]
    const targetMeal = ws[toDay][slot]
    if (!sourceMeal) throw new Error(`Slot ${fromDay}.${slot} is leeg — niets om te verplaatsen`)

    // Swap: source naar target, target naar source. Als target leeg
    // is wordt source weggehaald (verhuizing).
    ws[toDay][slot] = sourceMeal
    if (targetMeal) {
      ws[fromDay][slot] = targetMeal
    } else {
      delete ws[fromDay][slot]
    }

    const { error: saveErr } = await this.supabase
      .from('client_meal_plans')
      .update({ week_structure: ws, updated_at: new Date().toISOString() })
      .eq('id', mealPlanId)
    if (saveErr) throw saveErr
    return true
  }

  // Swap workout-keys tussen twee dagen in clients.workout_schedule.
  // Als toDay leeg was: workoutKey verhuist gewoon. Anders: swap.
  // Case-insensitive lookup voor legacy schedules met capitalized
  // weekdagen ("Monday" naast onze lowercase 'monday').
  async swapWorkoutScheduleDays({ clientId, fromDay, toDay }) {
    const { data: row, error: loadErr } = await this.supabase
      .from('clients')
      .select('workout_schedule')
      .eq('id', clientId)
      .single()
    if (loadErr) throw loadErr
    const schedule = row?.workout_schedule || {}
    // Vind de echte key in het object (behoudt z'n casing) zodat we
    // niet een duplicate-key in andere casing introduceren.
    const findRealKey = (target) => {
      const lc = target.toLowerCase()
      for (const k of Object.keys(schedule)) {
        if (k.toLowerCase() === lc) return k
      }
      return null
    }
    const fromKeyName = findRealKey(fromDay)
    const toKeyName   = findRealKey(toDay)
    const fromVal = fromKeyName ? schedule[fromKeyName] : null
    const toVal   = toKeyName   ? schedule[toKeyName]   : null
    if (!fromVal) return false

    // Gebruik dezelfde casing-conventie als die al in 't object zit,
    // anders val terug op onze lowercase day-naam.
    const useToKey   = toKeyName   || (fromKeyName ? this._sameCaseAs(fromKeyName, toDay) : toDay)
    const useFromKey = fromKeyName || (toKeyName ? this._sameCaseAs(toKeyName, fromDay) : fromDay)

    schedule[useToKey] = fromVal
    if (toVal) {
      schedule[useFromKey] = toVal
    } else {
      delete schedule[useFromKey]
    }
    // Cleanup: als de oude (other-case) key nog bestaat naast een nieuwe
    if (fromKeyName && useFromKey !== fromKeyName && !toVal) delete schedule[fromKeyName]

    const { error: saveErr } = await this.supabase
      .from('clients')
      .update({ workout_schedule: schedule, updated_at: new Date().toISOString() })
      .eq('id', clientId)
    if (saveErr) throw saveErr
    return true
  }

  _sameCaseAs(referenceKey, targetLower) {
    // Als referenceKey met hoofdletter begint, capitalize targetLower
    if (referenceKey[0] === referenceKey[0].toUpperCase()) {
      return targetLower.charAt(0).toUpperCase() + targetLower.slice(1)
    }
    return targetLower
  }

  // Flip de is_training_day flag tussen twee dagen — als er op de
  // target dag al een training stond doen we niks (toDay blijft true,
  // fromDay wordt false). Anders wisselen we de flags.
  async flipTrainingDay({ mealPlanId, fromDay, toDay }) {
    const { data: plan, error: loadErr } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', mealPlanId)
      .single()
    if (loadErr) throw loadErr

    const ws = plan?.week_structure || {}
    if (!ws[fromDay]) ws[fromDay] = {}
    if (!ws[toDay])   ws[toDay] = {}

    ws[fromDay].is_training_day = false
    ws[toDay].is_training_day = true

    const { error: saveErr } = await this.supabase
      .from('client_meal_plans')
      .update({ week_structure: ws, updated_at: new Date().toISOString() })
      .eq('id', mealPlanId)
    if (saveErr) throw saveErr
    return true
  }

  // ── Update meal-tijd in client_meal_plans.week_structure ──
  // De agenda toont meal-blokken uit de jsonb week_structure. Wanneer de
  // coach de tijd verzet hier, schrijven we 'm terug naar de juiste slot
  // zodat plan-analyzer en client-meal-pagina dezelfde tijd zien.
  async updateMealTiming({ mealPlanId, day, slot, newStartMin }) {
    if (!mealPlanId || !day || !slot) throw new Error('mealPlanId, day, slot vereist')
    const { data: plan, error: loadErr } = await this.supabase
      .from('client_meal_plans')
      .select('week_structure')
      .eq('id', mealPlanId)
      .single()
    if (loadErr) throw loadErr

    const ws = plan?.week_structure || {}
    if (!ws[day] || !ws[day][slot]) {
      throw new Error(`Slot ${day}.${slot} bestaat niet in dit meal-plan`)
    }
    const newTiming = `${String(Math.floor(newStartMin / 60)).padStart(2, '0')}:${String(newStartMin % 60).padStart(2, '0')}`
    ws[day][slot] = { ...ws[day][slot], timing: newTiming }

    const { error: saveErr } = await this.supabase
      .from('client_meal_plans')
      .update({ week_structure: ws, updated_at: new Date().toISOString() })
      .eq('id', mealPlanId)
    if (saveErr) throw saveErr
    return true
  }

  // Mapping dag-naam → workoutKey in week_structure. Bron: clients.workout_schedule.
  // Voorbeeld: { monday: 'pull_a', tuesday: 'push_a', ... }
  async _loadWorkoutSchedule(clientId) {
    const { data, error } = await this.supabase
      .from('clients')
      .select('workout_schedule')
      .eq('id', clientId)
      .maybeSingle()
    if (error) { console.warn('workout_schedule', error); return null }
    return data?.workout_schedule || null
  }

  async _loadWorkoutSchema(clientId) {
    // Eerst checken of client een assigned_schema_id heeft
    const { data: client, error: clientErr } = await this.supabase
      .from('clients')
      .select('assigned_schema_id')
      .eq('id', clientId)
      .maybeSingle()
    if (clientErr) { console.warn('client lookup', clientErr); return null }
    if (!client?.assigned_schema_id) return null
    const { data, error } = await this.supabase
      .from('workout_schemas')
      .select('id, name, days_per_week, split_name, split_type, week_structure')
      .eq('id', client.assigned_schema_id)
      .maybeSingle()
    if (error) { console.warn('loadWorkoutSchema', error); return null }
    return data
  }
}

export default ClientAgendaService
