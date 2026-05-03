// src/modules/manual-workout-builder/services/WorkoutPDFTemplate.js
// Brutalist Swiss style — wit/zwart/rood, grid-based, sharp borders
// Font: Be Vietnam Pro (weights 400-900)

// ============================================================
// HELPERS
// ============================================================

const formatEquipment = (eq) => {
  const map = {
    barbell: 'Barbell', dumbbells: 'Dumbbells', dumbbell: 'Dumbbells',
    cable: 'Cable', machine: 'Machine', bodyweight: 'Bodyweight',
    kettlebell: 'Kettlebell', bands: 'Bands', other: 'Other'
  }
  return map[eq] || eq || 'Free Weight'
}

const formatMuscle = (m) => {
  const map = {
    chest: 'Borst', back: 'Rug', shoulders: 'Schouders',
    biceps: 'Biceps', triceps: 'Triceps', legs: 'Benen',
    quads: 'Quadriceps', hamstrings: 'Hamstrings',
    core: 'Core', abs: 'Core', glutes: 'Billen',
    calves: 'Kuiten', full_body: 'Full Body'
  }
  return map[m] || m || ''
}

const calcStats = (plan) => {
  let totalExercises = 0, totalSets = 0, totalTime = 0
  const muscles = new Set()
  plan.days.forEach(day => {
    totalExercises += day.exercises.length
    day.exercises.forEach(ex => {
      totalSets += parseInt(ex.sets) || 3
      if (ex.primairSpieren) muscles.add(formatMuscle(ex.primairSpieren))
    })
    const t = (day.geschatteTijd || '60').match(/\d+/)
    if (t) totalTime += parseInt(t[0])
  })
  return {
    days: plan.days.length,
    totalExercises,
    totalSets,
    avgMin: Math.round(totalTime / Math.max(1, plan.days.length)),
    muscles: Array.from(muscles)
  }
}

const dayMuscles = (day) => {
  const set = new Set()
  day.exercises.forEach(ex => {
    const m = formatMuscle(ex.primairSpieren)
    if (m) set.add(m)
  })
  return Array.from(set).slice(0, 3).join(' · ')
}

const escapeHtml = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ============================================================
// CSS — BRUTALIST SWISS
// ============================================================

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --black: #000000;
    --white: #ffffff;
    --red: #ff0000;
    --gray: #666666;
    --light-gray: #f5f5f5;
  }

  html, body {
    background: var(--white);
    color: var(--black);
    font-family: 'Be Vietnam Pro', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page { size: A4; margin: 0; }

  .page {
    width: 210mm;
    height: 297mm;
    background: var(--white);
    page-break-after: always;
    overflow: hidden;
    position: relative;
  }
  .page:last-child { page-break-after: avoid; }

  /* -------- COVER -------- */
  .cover-brutal {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .cover-top {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 3px solid var(--black);
  }
  .cover-top-left {
    padding: 35px 40px;
    border-right: 3px solid var(--black);
  }
  .cover-top-right {
    padding: 35px 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .brutal-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray);
  }
  .brutal-year {
    font-size: 80px;
    font-weight: 900;
    line-height: 0.85;
    letter-spacing: -5px;
    margin-top: 20px;
  }
  .cover-main {
    padding: 50px 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .brutal-title {
    font-size: 120px;
    font-weight: 900;
    line-height: 0.85;
    letter-spacing: -7px;
    text-transform: uppercase;
  }
  .brutal-title .red { color: var(--red); }
  .brutal-subtitle {
    font-size: 17px;
    font-weight: 500;
    margin-top: 35px;
    max-width: 450px;
    line-height: 1.5;
  }
  .cover-bottom {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 3px solid var(--black);
  }
  .cover-stat {
    padding: 25px 30px;
    border-right: 3px solid var(--black);
    display: flex;
    flex-direction: column;
  }
  .cover-stat:last-child { border-right: none; }
  .stat-label-brutal {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray);
    margin-bottom: 10px;
  }
  .stat-value-brutal {
    font-size: 36px;
    font-weight: 900;
    letter-spacing: -2px;
    line-height: 1;
  }

  /* -------- CONTENT PAGE -------- */
  .brutal-page {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .brutal-header {
    display: grid;
    grid-template-columns: 120px 1fr 80px;
    border-bottom: 3px solid var(--black);
  }
  .brutal-header-cell {
    padding: 20px 30px;
    border-right: 3px solid var(--black);
    display: flex;
    align-items: center;
  }
  .brutal-header-cell:last-child {
    border-right: none;
    justify-content: center;
  }
  .chapter-num-brutal {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -2px;
    line-height: 1;
  }
  .chapter-title-brutal {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .chapter-title-brutal .red { color: var(--red); }
  .page-num-brutal {
    font-size: 22px;
    font-weight: 900;
  }

  .brutal-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }
  .brutal-col {
    padding: 40px;
    border-right: 3px solid var(--black);
    overflow: hidden;
  }
  .brutal-col:last-child { border-right: none; }

  .section-title-brutal {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray);
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--black);
  }

  .brutal-text {
    font-size: 14px;
    line-height: 1.65;
    margin-bottom: 20px;
  }
  .brutal-text strong {
    font-weight: 800;
    text-decoration: underline;
    text-decoration-color: var(--red);
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
  }

  /* Highlight Box */
  .highlight-brutal {
    background: var(--black);
    color: var(--white);
    padding: 25px;
    margin: 20px 0;
  }
  .highlight-brutal .number {
    font-size: 64px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -3px;
    color: var(--red);
  }
  .highlight-brutal .text {
    font-size: 13px;
    font-weight: 500;
    margin-top: 12px;
    line-height: 1.5;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Week overview grid */
  .week-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border-top: 2px solid var(--black);
    border-left: 2px solid var(--black);
  }
  .week-card {
    border-right: 2px solid var(--black);
    border-bottom: 2px solid var(--black);
    padding: 22px 24px;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    min-height: 150px;
  }
  .week-card.accent {
    background: var(--black);
    color: var(--white);
  }
  .week-card-num {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--red);
    margin-bottom: 6px;
  }
  .week-card-title {
    font-size: 26px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 10px;
  }
  .week-card-focus {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--gray);
    min-height: 14px;
  }
  .week-card.accent .week-card-focus { color: rgba(255,255,255,0.6); }
  .week-card-stats {
    display: flex;
    gap: 18px;
    padding-top: 14px;
    margin-top: 14px;
    border-top: 2px solid var(--black);
  }
  .week-card.accent .week-card-stats { border-top-color: var(--white); }
  .week-card-stat-val {
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -1px;
  }
  .week-card-stat-label {
    font-size: 8px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray);
    margin-top: 3px;
  }
  .week-card.accent .week-card-stat-label { color: rgba(255,255,255,0.5); }

  /* Day page */
  .day-hero {
    padding: 35px 40px 30px;
    border-bottom: 3px solid var(--black);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 30px;
    align-items: end;
  }
  .day-title {
    font-size: 80px;
    font-weight: 900;
    line-height: 0.85;
    letter-spacing: -5px;
    text-transform: uppercase;
  }
  .day-title .red { color: var(--red); }
  .day-focus-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray);
    margin-bottom: 8px;
  }
  .day-focus-val {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .day-stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 3px solid var(--black);
  }
  .day-stat-cell {
    padding: 20px 30px;
    border-right: 3px solid var(--black);
  }
  .day-stat-cell:last-child { border-right: none; }
  .day-stat-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray);
    margin-bottom: 6px;
  }
  .day-stat-value {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1;
  }
  .day-stat-value.red { color: var(--red); }

  /* Exercise list */
  .exercise-row {
    display: grid;
    grid-template-columns: 60px 1fr auto;
    gap: 24px;
    padding: 18px 40px;
    border-bottom: 2px solid var(--black);
    align-items: center;
  }
  .exercise-row:last-child { border-bottom: none; }
  .exercise-num {
    font-size: 30px;
    font-weight: 900;
    color: var(--red);
    letter-spacing: -2px;
    line-height: 1;
  }
  .exercise-body h4 {
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    line-height: 1.1;
  }
  .exercise-meta {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray);
  }
  .exercise-meta .sep {
    display: inline-block;
    margin: 0 8px;
    color: var(--black);
  }
  .exercise-stats {
    display: flex;
    gap: 0;
    border: 2px solid var(--black);
  }
  .ex-stat {
    padding: 8px 14px;
    border-right: 2px solid var(--black);
    text-align: center;
    min-width: 58px;
  }
  .ex-stat:last-child { border-right: none; }
  .ex-stat.primary {
    background: var(--red);
    color: var(--white);
  }
  .ex-stat-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--gray);
    line-height: 1;
    margin-bottom: 4px;
  }
  .ex-stat.primary .ex-stat-label { color: rgba(255,255,255,0.8); }
  .ex-stat-val {
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.5px;
  }
  .exercise-notes {
    grid-column: 2 / 4;
    padding-top: 8px;
    font-size: 12px;
    font-style: italic;
    color: var(--gray);
    line-height: 1.5;
    border-top: 1px dashed var(--gray);
    margin-top: 4px;
  }

  /* Footer */
  .brutal-footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 3px solid var(--black);
  }
  .brutal-footer-cell {
    padding: 18px 30px;
    border-right: 3px solid var(--black);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .brutal-footer-cell:last-child {
    border-right: none;
    text-align: right;
  }

  /* Flow closing */
  .flow-brutal {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    height: 100%;
  }
  .flow-step-brutal {
    padding: 60px 40px;
    border-right: 3px solid var(--black);
    display: flex;
    flex-direction: column;
  }
  .flow-step-brutal:last-child { border-right: none; }
  .flow-step-brutal.black { background: var(--black); color: var(--white); }
  .flow-step-brutal.red { background: var(--red); color: var(--white); }
  .flow-num-brutal {
    font-size: 120px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -7px;
    opacity: 0.15;
    margin-bottom: 25px;
  }
  .flow-step-brutal.black .flow-num-brutal,
  .flow-step-brutal.red .flow-num-brutal {
    opacity: 0.25;
  }
  .flow-title-brutal {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 15px;
  }
  .flow-heading-brutal {
    font-size: 42px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -2px;
    text-transform: uppercase;
    margin-bottom: 25px;
  }
  .flow-desc-brutal {
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.85;
    margin-bottom: auto;
  }
  .flow-arrow-brutal {
    font-size: 48px;
    font-weight: 900;
    margin-top: 30px;
    opacity: 0.3;
  }

  .print-btn {
    position: fixed;
    top: 30px;
    right: 30px;
    background: var(--black);
    color: var(--white);
    border: none;
    padding: 16px 32px;
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    z-index: 9999;
  }
  @media print { .print-btn { display: none; } }
`

// ============================================================
// PAGE BUILDERS
// ============================================================

const buildCover = (plan, stats, clientName, coachName, weekRange) => {
  const name = (plan.name || 'Workout Plan').toUpperCase()
  const words = name.split(' ')
  let titleHtml
  if (words.length === 1) {
    titleHtml = `<span class="red">${escapeHtml(name)}</span>`
  } else if (words.length === 2) {
    titleHtml = `<span class="red">${escapeHtml(words[0])}</span><br>${escapeHtml(words[1])}`
  } else {
    const mid = Math.ceil(words.length / 2)
    titleHtml = `<span class="red">${escapeHtml(words.slice(0, mid).join(' '))}</span><br>${escapeHtml(words.slice(mid).join(' '))}`
  }

  const goalLabel = {
    muscle_gain: 'Muscle Gain',
    fat_loss: 'Fat Loss',
    strength: 'Strength',
    endurance: 'Endurance',
    maintenance: 'Maintenance',
    recomp: 'Recomposition'
  }[plan.primary_goal] || 'Performance'

  return `
    <div class="page">
      <div class="cover-brutal">
        <div class="cover-top">
          <div class="cover-top-left">
            <div class="brutal-label">Program</div>
            <div class="brutal-year">${String(stats.days).padStart(2, '0')}</div>
            <div class="brutal-label" style="margin-top: 12px;">Dagen / Week</div>
          </div>
          <div class="cover-top-right">
            <div>
              <div class="brutal-label">Client</div>
              <div style="font-size: 16px; font-weight: 800; margin-top: 6px;">${escapeHtml(clientName)}</div>
            </div>
            <div>
              <div class="brutal-label">Coach</div>
              <div style="font-size: 14px; font-weight: 700; margin-top: 6px;">${escapeHtml(coachName)}</div>
              ${weekRange ? `<div class="brutal-label" style="margin-top: 10px;">${escapeHtml(weekRange)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="cover-main">
          <h1 class="brutal-title">${titleHtml}</h1>
          <p class="brutal-subtitle">
            ${plan.description 
              ? escapeHtml(plan.description) 
              : `Voer het plan uit zoals voorgeschreven. Log elke set. Bouw progressie over weken.`}
          </p>
        </div>

        <div class="cover-bottom">
          <div class="cover-stat">
            <span class="stat-label-brutal">Oefeningen</span>
            <span class="stat-value-brutal">${stats.totalExercises}</span>
          </div>
          <div class="cover-stat">
            <span class="stat-label-brutal">Total Sets</span>
            <span class="stat-value-brutal">${stats.totalSets}</span>
          </div>
          <div class="cover-stat">
            <span class="stat-label-brutal">Min/Dag</span>
            <span class="stat-value-brutal">${stats.avgMin}</span>
          </div>
          <div class="cover-stat">
            <span class="stat-label-brutal">Goal</span>
            <span class="stat-value-brutal" style="font-size: 18px; letter-spacing: 0;">${escapeHtml(goalLabel)}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

const buildWeekOverview = (plan, stats, pageNum, totalPages) => {
  return `
    <div class="page">
      <div class="brutal-page">
        <div class="brutal-header">
          <div class="brutal-header-cell">
            <span class="chapter-num-brutal">01</span>
          </div>
          <div class="brutal-header-cell">
            <span class="chapter-title-brutal"><span class="red">●</span>&nbsp;&nbsp;Week Overzicht</span>
          </div>
          <div class="brutal-header-cell">
            <span class="page-num-brutal">${String(pageNum).padStart(2, '0')}</span>
          </div>
        </div>

        <div class="brutal-content">
          <div class="brutal-col">
            <div class="section-title-brutal">Het Plan</div>

            <p class="brutal-text">
              <strong>${stats.days} trainingsdagen</strong> per week.
              ${stats.totalExercises} oefeningen. ${stats.totalSets} sets in totaal.
              ${stats.muscles.length > 0 ? `Focus op ${escapeHtml(stats.muscles.slice(0, 4).join(', '))}.` : ''}
            </p>

            <p class="brutal-text">
              Volg de dagen in volgorde. Rust op niet-trainingsdagen.
              Log elke set met <strong>gewicht en reps</strong> zodat je week op week
              kunt progresseren.
            </p>

            <div class="highlight-brutal">
              <div class="number">${stats.totalSets}</div>
              <div class="text">Total Sets / Week</div>
            </div>

            <p class="brutal-text" style="font-size: 12px; color: var(--gray); margin-top: 20px;">
              Gemiddeld <strong>${stats.avgMin} minuten</strong> per sessie.
              Compound lifts eerst, isolatie daarna.
            </p>
          </div>

          <div class="brutal-col" style="padding: 40px 30px;">
            <div class="section-title-brutal">De Week</div>
            <div class="week-grid">
              ${plan.days.map((day, i) => `
                <div class="week-card ${i % 3 === 1 ? 'accent' : ''}">
                  <div class="week-card-num">Dag ${String(i + 1).padStart(2, '0')}</div>
                  <div class="week-card-title">${escapeHtml((day.name || `Training ${i + 1}`).substring(0, 14))}</div>
                  <div class="week-card-focus">${escapeHtml(day.focus || dayMuscles(day) || '—')}</div>
                  <div class="week-card-stats">
                    <div>
                      <div class="week-card-stat-val">${day.exercises.length}</div>
                      <div class="week-card-stat-label">Oef</div>
                    </div>
                    <div>
                      <div class="week-card-stat-val">${day.exercises.reduce((s, ex) => s + (parseInt(ex.sets) || 3), 0)}</div>
                      <div class="week-card-stat-label">Sets</div>
                    </div>
                    <div>
                      <div class="week-card-stat-val">${(day.geschatteTijd || '60').match(/\d+/)?.[0] || '60'}</div>
                      <div class="week-card-stat-label">Min</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="brutal-footer">
          <div class="brutal-footer-cell">MY ARC</div>
          <div class="brutal-footer-cell">${escapeHtml(plan.name || 'Workout Plan')}</div>
          <div class="brutal-footer-cell">${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  `
}

const buildDayPage = (day, dayIndex, pageNum, totalPages, includeNotes, planName) => {
  const dayName = (day.name || `Training ${dayIndex + 1}`).toUpperCase()
  const totalSets = day.exercises.reduce((s, ex) => s + (parseInt(ex.sets) || 3), 0)
  const timeMin = (day.geschatteTijd || '60').match(/\d+/)?.[0] || '60'
  const compoundCount = day.exercises.filter(e => e.type === 'compound').length
  const muscles = dayMuscles(day)
  const chapterNum = String(dayIndex + 2).padStart(2, '0')

  const words = dayName.split(' ')
  let titleHtml
  if (words.length === 1) {
    titleHtml = `<span class="red">${escapeHtml(dayName)}</span>`
  } else {
    const mid = Math.ceil(words.length / 2)
    titleHtml = `<span class="red">${escapeHtml(words.slice(0, mid).join(' '))}</span><br>${escapeHtml(words.slice(mid).join(' '))}`
  }

  return `
    <div class="page">
      <div class="brutal-page">
        <div class="brutal-header">
          <div class="brutal-header-cell">
            <span class="chapter-num-brutal">${chapterNum}</span>
          </div>
          <div class="brutal-header-cell">
            <span class="chapter-title-brutal"><span class="red">●</span>&nbsp;&nbsp;Dag ${dayIndex + 1} · ${escapeHtml(day.focus || 'Training')}</span>
          </div>
          <div class="brutal-header-cell">
            <span class="page-num-brutal">${String(pageNum).padStart(2, '0')}</span>
          </div>
        </div>

        <div style="overflow: hidden;">
          <div class="day-hero">
            <h2 class="day-title">${titleHtml}</h2>
            <div style="text-align: right;">
              <div class="day-focus-label">Focus</div>
              <div class="day-focus-val">${escapeHtml(muscles || day.focus || 'Full Body')}</div>
            </div>
          </div>

          <div class="day-stats-bar">
            <div class="day-stat-cell">
              <div class="day-stat-label">Oefeningen</div>
              <div class="day-stat-value red">${day.exercises.length}</div>
            </div>
            <div class="day-stat-cell">
              <div class="day-stat-label">Total Sets</div>
              <div class="day-stat-value">${totalSets}</div>
            </div>
            <div class="day-stat-cell">
              <div class="day-stat-label">Minuten</div>
              <div class="day-stat-value">${timeMin}</div>
            </div>
            <div class="day-stat-cell">
              <div class="day-stat-label">Compound</div>
              <div class="day-stat-value">${compoundCount}</div>
            </div>
          </div>

          <div>
            ${day.exercises.map((ex, i) => buildExerciseRow(ex, i, includeNotes)).join('')}
          </div>
        </div>

        <div class="brutal-footer">
          <div class="brutal-footer-cell">${escapeHtml(planName)}</div>
          <div class="brutal-footer-cell">${escapeHtml(day.name || `Dag ${dayIndex + 1}`)}</div>
          <div class="brutal-footer-cell">${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  `
}

const buildExerciseRow = (ex, idx, includeNotes) => {
  const muscle = formatMuscle(ex.primairSpieren)
  const equipment = formatEquipment(ex.equipment)
  const sets = ex.sets || 3
  const reps = ex.reps || '8-12'
  const rust = ex.rust || '2 min'
  const rpe = ex.rpe || '7-8'

  const metaParts = [equipment]
  if (muscle) metaParts.push(muscle)
  if (ex.type === 'compound') metaParts.push('Compound')
  else if (ex.type) metaParts.push('Isolation')
  if (ex.stretch) metaParts.push('Stretch')

  return `
    <div class="exercise-row">
      <div class="exercise-num">${String(idx + 1).padStart(2, '0')}</div>
      <div class="exercise-body">
        <h4>${escapeHtml(ex.name || 'Exercise')}</h4>
        <div class="exercise-meta">
          ${metaParts.map((p, i) => `${escapeHtml(p)}${i < metaParts.length - 1 ? '<span class="sep">/</span>' : ''}`).join('')}
        </div>
      </div>
      <div class="exercise-stats">
        <div class="ex-stat primary">
          <div class="ex-stat-label">Sets</div>
          <div class="ex-stat-val">${sets}</div>
        </div>
        <div class="ex-stat">
          <div class="ex-stat-label">Reps</div>
          <div class="ex-stat-val">${escapeHtml(String(reps))}</div>
        </div>
        <div class="ex-stat">
          <div class="ex-stat-label">Rust</div>
          <div class="ex-stat-val">${escapeHtml(String(rust))}</div>
        </div>
        <div class="ex-stat">
          <div class="ex-stat-label">RPE</div>
          <div class="ex-stat-val">${escapeHtml(String(rpe))}</div>
        </div>
      </div>
      ${includeNotes && ex.notes ? `<div class="exercise-notes">“${escapeHtml(ex.notes)}”</div>` : ''}
    </div>
  `
}

const buildClosingPage = () => {
  return `
    <div class="page">
      <div class="flow-brutal">
        <div class="flow-step-brutal">
          <div class="flow-num-brutal">01</div>
          <div class="flow-title-brutal">Show Up</div>
          <h3 class="flow-heading-brutal">Elke<br>Dag.</h3>
          <p class="flow-desc-brutal">
            Het plan staat. Geen onderhandeling met jezelf.
            Je gaat naar de gym op je trainingsdagen — punt.
          </p>
          <div class="flow-arrow-brutal">→</div>
        </div>

        <div class="flow-step-brutal black">
          <div class="flow-num-brutal">02</div>
          <div class="flow-title-brutal">Progress</div>
          <h3 class="flow-heading-brutal">Log<br>Elke Set.</h3>
          <p class="flow-desc-brutal">
            Meer gewicht, meer reps, strakkere vorm.
            Zonder log geen data. Zonder data geen progressie.
          </p>
          <div class="flow-arrow-brutal">→</div>
        </div>

        <div class="flow-step-brutal red">
          <div class="flow-num-brutal">03</div>
          <div class="flow-title-brutal">Recover</div>
          <h3 class="flow-heading-brutal">Slaap.<br>Eet.</h3>
          <p class="flow-desc-brutal">
            7-9 uur slaap. Je macros gehaald. Hydrateer.
            Gains worden gemaakt in recovery, niet alleen in de gym.
          </p>
          <div class="flow-arrow-brutal">∎</div>
        </div>
      </div>
    </div>
  `
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function generateWorkoutPlanHTML(workoutPlan, clientName = 'Client', coachName = 'Coach', weekRange = '', includeNotes = true) {
  const stats = calcStats(workoutPlan)
  const planName = workoutPlan.name || 'Workout Plan'

  const totalPages = 2 + workoutPlan.days.length + 1

  let pages = ''
  pages += buildCover(workoutPlan, stats, clientName, coachName, weekRange)
  pages += buildWeekOverview(workoutPlan, stats, 2, totalPages)

  workoutPlan.days.forEach((day, i) => {
    pages += buildDayPage(day, i, 3 + i, totalPages, includeNotes, planName)
  })

  pages += buildClosingPage()

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(planName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Download PDF</button>
  ${pages}
</body>
</html>
  `
}

export default generateWorkoutPlanHTML
