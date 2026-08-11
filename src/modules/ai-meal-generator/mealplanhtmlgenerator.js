// src/modules/ai-meal-generator/mealplanhtmlgenerator.js
// v4.0 — Brutalist Swiss style, snack1/2/3 support, correct training days

const SLOT_KEYS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']

const SLOT_CONFIG = {
  breakfast: { label: 'ONTBIJT',        icon: '🌅' },
  snack1:    { label: 'SNACK',          icon: '🥤' },
  lunch:     { label: 'LUNCH',          icon: '🍱' },
  snack2:    { label: 'SNACK',          icon: '⚡' },
  dinner:    { label: 'DINER',          icon: '🍽️' },
  snack3:    { label: 'VOOR BED',       icon: '🌙' },
}

const DAY_NAMES = {
  monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
  thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
}

const DAY_SHORT = {
  monday: 'MA', tuesday: 'DI', wednesday: 'WO',
  thursday: 'DO', friday: 'VR', saturday: 'ZA', sunday: 'ZO'
}

// ── Styles ──────────────────────────────────────────────────────────────────
const generateStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --black: #000000; --white: #ffffff; --red: #ff0000; --gray: #666666; --light: #f0f0f0; }
  body { background: var(--white); color: var(--black); font-family: 'Be Vietnam Pro', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 0; }
  .page { width: 210mm; min-height: 297mm; background: var(--white); page-break-after: always; overflow: hidden; position: relative; }
  .page:last-child { page-break-after: avoid; }
  .page.inv { background: var(--black); color: var(--white); }

  /* ── COVER ── */
  .cover { height: 297mm; display: grid; grid-template-rows: auto 1fr auto; }
  .cover-top { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 3px solid var(--black); }
  .cover-top-l { padding: 40px; border-right: 3px solid var(--black); }
  .cover-top-r { padding: 40px; display: flex; flex-direction: column; justify-content: space-between; }
  .lbl { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--gray); }
  .yr { font-size: 120px; font-weight: 900; line-height: 0.85; letter-spacing: -8px; }
  .cover-main { padding: 50px 60px; display: flex; flex-direction: column; justify-content: center; }
  .brutal-title { font-size: 120px; font-weight: 900; line-height: 0.85; letter-spacing: -8px; text-transform: uppercase; }
  .brutal-title .red { color: var(--red); }
  .cover-sub { font-size: 16px; font-weight: 500; margin-top: 30px; max-width: 380px; line-height: 1.5; color: var(--gray); }
  .cover-bottom { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 3px solid var(--black); }
  .cover-stat { padding: 28px; border-right: 3px solid var(--black); }
  .cover-stat:last-child { border-right: none; }
  .cs-lbl { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gray); margin-bottom: 8px; }
  .cs-val { font-size: 34px; font-weight: 900; letter-spacing: -2px; }

  /* ── DAY PAGE ── */
  .day-pg { height: 297mm; display: grid; grid-template-rows: auto auto auto 1fr auto; }
  .day-hdr { display: grid; grid-template-columns: 120px 1fr 80px; border-bottom: 3px solid var(--black); }
  .dhc { padding: 20px 28px; border-right: 3px solid var(--black); display: flex; align-items: center; }
  .dhc:last-child { border-right: none; justify-content: center; }
  .day-num { font-size: 42px; font-weight: 900; letter-spacing: -3px; }
  .day-name-brutal { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  .pg-num { font-size: 22px; font-weight: 900; }

  /* Training badge */
  .training-bar { padding: 12px 28px; border-bottom: 3px solid var(--black); display: flex; align-items: center; justify-content: space-between; }
  .training-bar.train { background: var(--black); color: var(--white); }
  .training-bar.rest { background: var(--light); }
  .train-lbl { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  .train-lbl.red { color: var(--red); }

  /* Day macro totals */
  .day-totals { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 3px solid var(--black); }
  .dt { padding: 16px 20px; border-right: 3px solid var(--black); text-align: center; }
  .dt:last-child { border-right: none; }
  .dt-val { font-size: 28px; font-weight: 900; letter-spacing: -2px; }
  .dt-lbl { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gray); margin-top: 4px; }

  /* Meals grid */
  .meals-grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); overflow: hidden; }
  .meal-card { border-right: 3px solid var(--black); border-bottom: 3px solid var(--black); display: flex; flex-direction: column; overflow: hidden; }
  .meal-card:nth-child(even) { border-right: none; }
  .meal-card:nth-last-child(-n+2) { border-bottom: none; }

  /* Meal photo */
  .meal-photo { height: 90px; background-size: cover; background-position: center; position: relative; flex-shrink: 0; }
  .meal-photo-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2)); display: flex; align-items: flex-end; padding: 10px 14px; }
  .meal-slot-tag { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--white); }
  .meal-time-tag { font-size: 11px; font-weight: 900; color: var(--white); margin-left: auto; }

  /* Meal content */
  .meal-content { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .meal-name { font-size: 13px; font-weight: 800; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.3px; }
  .meal-macros { display: flex; gap: 6px; margin-top: auto; flex-wrap: wrap; }
  .macro-pill { font-size: 10px; font-weight: 800; padding: 3px 8px; border: 1.5px solid var(--black); }
  .macro-pill.e { background: var(--black); color: var(--white); }
  .meal-kcal { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
  .meal-kcal-lbl { font-size: 9px; font-weight: 700; color: var(--gray); letter-spacing: 1px; text-transform: uppercase; }

  /* Ingredients */
  .ing-list { display: flex; flex-direction: column; gap: 2px; }
  .ing-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; border-bottom: 1px solid var(--light); }
  .ing-name { color: var(--gray); }
  .ing-amt { font-weight: 700; }

  /* Footer */
  .brutal-footer { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 3px solid var(--black); }
  .bfc { padding: 14px 22px; border-right: 3px solid var(--black); font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gray); }
  .bfc:last-child { border-right: none; text-align: right; }

  /* ── COVER PAGE 2: WEEK OVERVIEW ── */
  .week-ov { height: 297mm; display: grid; grid-template-rows: auto 1fr auto; }
  .week-hdr { display: grid; grid-template-columns: 1fr 80px; border-bottom: 3px solid var(--black); }
  .whc { padding: 22px 28px; border-right: 3px solid var(--black); }
  .whc:last-child { border-right: none; display: flex; align-items: center; justify-content: center; }
  .week-title-brutal { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); flex: 1; }
  .wday { border-right: 3px solid var(--black); display: flex; flex-direction: column; }
  .wday:last-child { border-right: none; }
  .wday-hdr { padding: 12px 10px; border-bottom: 3px solid var(--black); text-align: center; }
  .wday-hdr.train { background: var(--black); color: var(--white); }
  .wday-short { font-size: 14px; font-weight: 900; letter-spacing: -1px; }
  .wday-name { font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--gray); margin-top: 2px; }
  .wday-hdr.train .wday-name { color: rgba(255,255,255,0.5); }
  .wday-meals { flex: 1; display: flex; flex-direction: column; }
  .wday-meal { padding: 8px 10px; border-bottom: 1px solid var(--light); flex: 1; }
  .wday-meal-slot { font-size: 7px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gray); margin-bottom: 3px; }
  .wday-meal-name { font-size: 9px; font-weight: 700; line-height: 1.25; }
  .wday-meal-kcal { font-size: 11px; font-weight: 900; margin-top: 2px; }
  .wday-total { padding: 10px; border-top: 3px solid var(--black); text-align: center; }
  .wday-total-kcal { font-size: 16px; font-weight: 900; }
  .wday-total-e { font-size: 9px; font-weight: 700; color: var(--gray); }

  /* Print btn */
  .print-btn { position: fixed; top: 20px; right: 20px; background: var(--black); color: var(--white); border: none; padding: 14px 28px; font-family: 'Be Vietnam Pro', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; z-index: 9999; }
  @media print { .print-btn { display: none; } }
`

// ── Cover Page ───────────────────────────────────────────────────────────────
const generateCoverPage = (clientName, weekRange, stats, customTitle = null) => `
  <div class="page">
    <div class="cover">
      <div class="cover-top">
        <div class="cover-top-l">
          <div class="lbl">MY ARC — Voedingsplan</div>
          <div class="yr">25</div>
        </div>
        <div class="cover-top-r">
          <div class="lbl">Coaching</div>
          <div class="lbl" style="margin-top:auto;">Door Kersten van den Berg</div>
        </div>
      </div>
      <div class="cover-main">
        <h1 class="brutal-title">
          <span class="red">${clientName.toUpperCase()}</span><br>
          WEEK<br>
          PLAN
        </h1>
        <p class="cover-sub">${customTitle ? customTitle : `${weekRange} — Jouw persoonlijke voedingsplan op maat. Alles is berekend. Volg het plan.`}</p>
      </div>
      <div class="cover-bottom">
        <div class="cover-stat"><div class="cs-lbl">Kcal/dag</div><div class="cs-val">${stats.avgCalories}</div></div>
        <div class="cover-stat"><div class="cs-lbl">Eiwit/dag</div><div class="cs-val">${stats.avgProtein}g</div></div>
        <div class="cover-stat"><div class="cs-lbl">Koolh/dag</div><div class="cs-val">${stats.avgCarbs}g</div></div>
        <div class="cover-stat"><div class="cs-lbl">Vet/dag</div><div class="cs-val">${stats.avgFat}g</div></div>
      </div>
    </div>
  </div>
`

// ── Week Overview Page ────────────────────────────────────────────────────────
const generateWeekOverviewPage = (enrichedPlan) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const ws = enrichedPlan.week_structure_enriched || {}

  const daysCols = days.map((day, di) => {
    const dayData = ws[day]
    if (!dayData) return `<div class="wday"><div class="wday-hdr"><div class="wday-short">${DAY_SHORT[day]}</div></div></div>`

    const isTraining = dayData.is_training_day === true
    const meals = SLOT_KEYS.filter(s => dayData[s]).map(slot => {
      const m = dayData[slot]
      const name = m.name || m.meal_name || '—'
      const kcal = m.calories || 0
      const timing = (typeof m.timing === 'string' && m.timing.length <= 5 && m.timing.includes(':')) ? m.timing : null
      return `
        <div class="wday-meal">
          <div class="wday-meal-slot">${SLOT_CONFIG[slot].icon} ${SLOT_CONFIG[slot].label}${timing ? ` · ${timing}` : ''}</div>
          <div class="wday-meal-name">${name.length > 22 ? name.slice(0, 22) + '…' : name}</div>
          <div class="wday-meal-kcal">${kcal}</div>
        </div>
      `
    }).join('')

    const totCal  = Math.round(dayData.totals?.kcal || 0)
    const totProt = Math.round(dayData.totals?.protein || 0)

    return `
      <div class="wday">
        <div class="wday-hdr${isTraining ? ' train' : ''}">
          <div class="wday-short">${DAY_SHORT[day]}</div>
          <div class="wday-name">${isTraining ? '💪 Training' : 'Rust'}</div>
        </div>
        <div class="wday-meals">${meals}</div>
        <div class="wday-total">
          <div class="wday-total-kcal">${totCal}</div>
          <div class="wday-total-e">${totProt}g E</div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="page">
      <div class="week-ov">
        <div class="week-hdr">
          <div class="whc">
            <div class="week-title-brutal">Week Overzicht — 7 Dagen</div>
          </div>
          <div class="whc"><span class="pg-num">02</span></div>
        </div>
        <div class="week-grid">${daysCols}</div>
        <div class="brutal-footer">
          <div class="bfc">MY ARC</div>
          <div class="bfc">Voedingsplan</div>
          <div class="bfc">Pagina 2</div>
        </div>
      </div>
    </div>
  `
}

// ── Day Page ─────────────────────────────────────────────────────────────────
const generateDayPage = (day, dayData, dayIndex, pageNum) => {
  const isTraining = dayData.is_training_day === true
  const totals = dayData.totals || {}

  // Verzamel gevulde slots in chronologische volgorde
  const filledSlots = SLOT_KEYS.filter(slot => dayData[slot])

  // Genereer meal cards — max 6 per pagina in 2 kolommen
  const mealCards = filledSlots.map(slot => {
    const m = dayData[slot]
    const cfg = SLOT_CONFIG[slot]
    const name = m.name || m.meal_name || '—'
    const timing = (typeof m.timing === 'string' && m.timing.includes(':')) ? m.timing : null
    const kcal = m.calories || 0
    const photo = m.image_url || 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=200&fit=crop'

    // Ingrediënten — allemaal tonen (geen afkapping)
    const ings = (m.ingredients || [])
    const ingHtml = ings.length > 0
      ? `<div class="ing-list">${ings.map(i => `
          <div class="ing-row">
            <span class="ing-name">${i.name || '—'}</span>
            <span class="ing-amt">${Math.round(i.amount_scaled || i.amount || 0)}${i.unit || 'g'}</span>
          </div>`).join('')}
        </div>`
      : ''

    return `
      <div class="meal-card">
        <div class="meal-photo" style="background-image:url('${photo}');">
          <div class="meal-photo-ov">
            <span class="meal-slot-tag">${cfg.icon} ${cfg.label}</span>
            <span class="meal-time-tag">${timing || '—'}</span>
          </div>
        </div>
        <div class="meal-content">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div class="meal-name">${name}</div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="meal-kcal">${kcal}</div>
              <div class="meal-kcal-lbl">kcal</div>
            </div>
          </div>
          ${ingHtml}
          <div class="meal-macros">
            <span class="macro-pill e">${Math.round(m.protein || 0)}g E</span>
            <span class="macro-pill">${Math.round(m.carbs || 0)}g K</span>
            <span class="macro-pill">${Math.round(m.fat || 0)}g V</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="page">
      <div class="day-pg">
        <div class="day-hdr">
          <div class="dhc"><span class="day-num">0${dayIndex + 1}</span></div>
          <div class="dhc"><span class="day-name-brutal">${DAY_NAMES[day].toUpperCase()}</span></div>
          <div class="dhc"><span class="pg-num">${pageNum}</span></div>
        </div>

        <div class="training-bar ${isTraining ? 'train' : 'rest'}">
          <span class="train-lbl ${isTraining ? 'red' : ''}">${isTraining ? '💪 TRAININGSDAG' : '🌙 RUSTDAG'}</span>
          <span class="train-lbl">${filledSlots.length} maaltijden</span>
        </div>

        <div class="day-totals">
          <div class="dt"><div class="dt-val">${Math.round(totals.kcal || 0)}</div><div class="dt-lbl">Kcal</div></div>
          <div class="dt"><div class="dt-val">${Math.round(totals.protein || 0)}g</div><div class="dt-lbl">Eiwit</div></div>
          <div class="dt"><div class="dt-val">${Math.round(totals.carbs || 0)}g</div><div class="dt-lbl">Koolh</div></div>
          <div class="dt"><div class="dt-val">${Math.round(totals.fat || 0)}g</div><div class="dt-lbl">Vet</div></div>
        </div>

        <div class="meals-grid">${mealCards}</div>

        <div class="brutal-footer">
          <div class="bfc">${DAY_NAMES[day]}</div>
          <div class="bfc">MY ARC | Transform Your Life</div>
          <div class="bfc">Pagina ${pageNum}</div>
        </div>
      </div>
    </div>
  `
}

// ── Coaching Pages ────────────────────────────────────────────────────────────
const generateCoachingPages = () => `

  <!-- COACHING PAGE 1: TIMING -->
  <div class="page">
    <div class="day-pg">
      <div class="day-hdr">
        <div class="dhc"><span class="day-num" style="font-size:28px;">TIP</span></div>
        <div class="dhc"><span class="day-name-brutal">MAALTIJD TIMING</span></div>
        <div class="dhc"><span class="pg-num">A</span></div>
      </div>
      <div class="training-bar train">
        <span class="train-lbl red">WANNEER EET JE WAT — EN WAAROM</span>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;">
        <div style="padding:28px 28px;border-right:3px solid #000;border-bottom:3px solid #000;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">🌅 ONTBIJT — 07:00–08:00</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:8px;">BALANCED: ~20–30g E · 50–70g K · 15–25g V</div>
          <p style="font-size:13px;line-height:1.65;color:#222;">Je lichaam heeft 8 uur gevast. Glycogeen aanvullen met koolhydraten, spiereiwitopbouw starten met eiwit. Complexe koolhydraten zoals haver geven langdurige energie. Ontbijt binnen 1u verhoogt je metabolisme met 15–20%.</p>
        </div>
        <div style="padding:28px 28px;border-bottom:3px solid #000;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">🍱 LUNCH / PRE-WORKOUT — 13:00</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:8px;">HIGH CARB: ~35–50g E · 45–60g K · &lt;15g V</div>
          <p style="font-size:13px;line-height:1.65;color:#222;">Glycogeen laden voor de training. Complexe koolhydraten voor geleidelijke glucosetoevoer. Laag vet zodat je maag niet zwaar voelt. 30–40% betere performance vs trainen op een lege maag.</p>
        </div>
        <div style="padding:28px 28px;border-right:3px solid #000;border-bottom:3px solid #000;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">⚡ PRE-WORKOUT SNACK — 16:00</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:8px;">FAST CARBS: 60–100g K · &lt;5g V</div>
          <p style="font-size:13px;line-height:1.65;color:#222;">Snelle glucose direct in het bloed. Rijstwafels, banaan, honing — geen vet of eiwit want dat vertraagt opname. 30–45 min voor training = glucose beschikbaar bij de eerste sets. +12% kracht, +15% volume.</p>
        </div>
        <div style="padding:28px 28px;border-bottom:3px solid #000;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">🍽️ DINER / POST-WORKOUT — 19:00</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:8px;">HIGH CARB+EIWIT: ~40–50g E · 50–60g K · 20–30g V</div>
          <p style="font-size:13px;line-height:1.65;color:#222;">Glycogeen voorraden zijn leeg na training. Koolhydraten herstellen ze. Eiwit zorgt voor aminozuren voor spiergroei. Gezonde vetten voor herstel. 25–30% meer spiergroei vs meer dan 3u wachten.</p>
        </div>
        <div style="padding:28px 28px;border-right:3px solid #000;grid-column:span 1;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">🌙 VOOR BED — 21:30</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:8px;">CASEÏNE: 25–35g E · &lt;10g K</div>
          <p style="font-size:13px;line-height:1.65;color:#222;">Tijdens slaap wil je geen spierafbraak. Caseïne eiwit verteert in 7–8u voor constante aminozuurtoevoer. Kwark of Griekse yoghurt werkt perfect. +22% meer nachtelijk spierherstel.</p>
        </div>
        <div style="padding:28px 28px;">
          <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">💡 VOORBEELD: TRAINING OM 18:00</div>
          <div style="font-size:12px;line-height:1.9;color:#222;">
            <strong>15:30</strong> → Lunch: Kip + Rijst + Groenten<br>
            <strong>17:30</strong> → Pre-workout: rijstwafels + banaan<br>
            <strong>18:00–19:30</strong> → Training<br>
            <strong>20:00</strong> → Diner: Kip + Pasta + Groenten<br>
            <strong>21:30</strong> → Voor bed: Kwark of caseïne
          </div>
        </div>
      </div>
      <div class="brutal-footer">
        <div class="bfc">MY ARC</div>
        <div class="bfc">Coaching Guide</div>
        <div class="bfc">Pagina A</div>
      </div>
    </div>
  </div>

  <!-- COACHING PAGE 2: VERGELIJKING + FLOW -->
  <div class="page">
    <div style="height:297mm;display:grid;grid-template-rows:auto 1fr auto;">
      <div class="day-hdr">
        <div class="dhc"><span class="day-num" style="font-size:28px;">TIP</span></div>
        <div class="dhc"><span class="day-name-brutal">ENERGIE & RESULTAAT</span></div>
        <div class="dhc"><span class="pg-num">B</span></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;flex:1;overflow:hidden;">

        <!-- Weinig energie -->
        <div style="background:#000;color:#fff;padding:40px 32px;border-right:3px solid #fff;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid rgba(255,255,255,0.2);">
            <div style="width:48px;height:48px;background:#ff0000;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">✗</div>
            <span style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Weinig Energie</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0;flex:1;">
            ${['Slecht geslapen','Geen voeding prep','Constant honger','Telefoon scrollen','Taken uitstellen','Slechte beslissingen'].map(item => `
            <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;font-weight:500;">
              <span style="color:#ff0000;font-weight:900;flex-shrink:0;">✗</span>${item}
            </div>`).join('')}
          </div>
        </div>

        <!-- Veel energie -->
        <div style="background:#fff;padding:40px 32px;border-right:3px solid #000;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #000;">
            <div style="width:48px;height:48px;background:#000;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0;">✓</div>
            <span style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Veel Energie</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0;flex:1;">
            ${['Goed uitgerust','Eten staat klaar','Stabiele energie','Telefoon blijft weg','Direct aan de slag','Betere keuzes'].map(item => `
            <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-size:13px;font-weight:500;">
              <span style="color:#000;font-weight:900;flex-shrink:0;">✓</span>${item}
            </div>`).join('')}
          </div>
        </div>

        <!-- Flow: 3 stappen -->
        <div style="display:flex;flex-direction:column;">
          <div style="flex:1;padding:32px 28px;background:#fff;border-bottom:3px solid #000;display:flex;flex-direction:column;">
            <div style="font-size:80px;font-weight:900;line-height:1;letter-spacing:-6px;opacity:0.1;margin-bottom:16px;">01</div>
            <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Energie</div>
            <p style="font-size:12px;line-height:1.6;color:#444;flex:1;">Goed geslapen, goed gegeten. De basis van alles wat volgt.</p>
            <div style="font-size:28px;font-weight:900;opacity:0.2;margin-top:16px;">↓</div>
          </div>
          <div style="flex:1;padding:32px 28px;background:#000;color:#fff;border-bottom:3px solid #fff;display:flex;flex-direction:column;">
            <div style="font-size:80px;font-weight:900;line-height:1;letter-spacing:-6px;opacity:0.2;margin-bottom:16px;">02</div>
            <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Focus</div>
            <p style="font-size:12px;line-height:1.6;color:rgba(255,255,255,0.7);flex:1;">Geen afleiding, geen cravings. Telefoon blijft liggen.</p>
            <div style="font-size:28px;font-weight:900;opacity:0.2;margin-top:16px;">↓</div>
          </div>
          <div style="flex:1;padding:32px 28px;background:#ff0000;color:#fff;display:flex;flex-direction:column;">
            <div style="font-size:80px;font-weight:900;line-height:1;letter-spacing:-6px;opacity:0.2;margin-bottom:16px;">03</div>
            <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Output</div>
            <p style="font-size:12px;line-height:1.6;color:rgba(255,255,255,0.85);flex:1;">Meer gedaan, betere keuzes. Exponentiële resultaten.</p>
            <div style="font-size:28px;font-weight:900;opacity:0.3;margin-top:16px;">■</div>
          </div>
        </div>

      </div>

      <div class="brutal-footer">
        <div class="bfc">MY ARC</div>
        <div class="bfc">Coaching Guide</div>
        <div class="bfc">Pagina B</div>
      </div>
    </div>
  </div>

  <!-- COACHING PAGE 3: SUPPLEMENTEN -->
  <div class="page">
    <div class="day-pg">
      <div class="day-hdr">
        <div class="dhc"><span class="day-num" style="font-size:28px;">TIP</span></div>
        <div class="dhc"><span class="day-name-brutal">SUPPLEMENTEN</span></div>
        <div class="dhc"><span class="pg-num">C</span></div>
      </div>
      <div class="training-bar" style="background:#f0f0f0;">
        <span class="train-lbl">BASIS STACK — WETENSCHAPPELIJK BEWEZEN</span>
        <span class="train-lbl">€43–70 / MAAND · 20–30% BETERE GAINS</span>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;">
        ${[
          {badge:'MUST-HAVE', name:'Creatine Monohydraat', dose:'5g/dag · Ochtend of post-workout', why:'+15% kracht & power, +10% volume, betere recovery. Meest onderzochte supplement (>500 studies).', cost:'~€10/maand'},
          {badge:'MUST-HAVE', name:'Vitamine D3 + K2', dose:'4000 IU + 100µg · Ochtend met vet', why:'+25% testosteron boost, betere spiercontractie, immuunsupport. K2 stuurt calcium naar botten.', cost:'~€3/maand'},
          {badge:'MUST-HAVE', name:'Omega-3 (EPA/DHA)', dose:'2000–2500mg · Avond bij diner', why:'Anti-inflammatoir voor snellere recovery, eiwitsynthese support, testosteron ondersteuning.', cost:'~€15/maand'},
          {badge:'MUST-HAVE', name:'Magnesium Bisglycinaat', dose:'400mg · Avond (1u voor bed)', why:'+20–24% testosteron, betere slaap (diepere REM), spierontspanning, cortisol demping.', cost:'~€15/maand'},
          {badge:'OPTIONEEL', name:'Whey Protein', dose:'25–30g · Post-workout of tussendoor', why:'Gemak: makkelijke 25g eiwit, snelle absorptie. Alleen nodig als je moeite hebt met 150g+ via voeding.', cost:'~€25/maand'},
          {badge:'SKIP', name:'Fat Burners & Test Boosters', dose:'', why:'Geldverspilling. Calorietekort is de enige echte fat burner. D3 + Magnesium doen het al beter dan test boosters.', cost:'€0/maand'},
        ].map((s, i) => `
        <div style="padding:20px 24px;border-right:${i%2===0?'3px solid #000':'none'};border-bottom:${i<4?'3px solid #000':'none'};">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:8px;font-weight:800;letter-spacing:2px;padding:3px 8px;background:${s.badge==='MUST-HAVE'?'#000':s.badge==='SKIP'?'#ff0000':'#666'};color:#fff;text-transform:uppercase;">${s.badge}</span>
            <span style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:-0.3px;">${s.name}</span>
          </div>
          ${s.dose ? `<div style="font-size:10px;font-weight:600;color:#666;margin-bottom:8px;letter-spacing:0.5px;">${s.dose}</div>` : ''}
          <p style="font-size:12px;line-height:1.6;color:#333;">${s.why}</p>
          ${s.cost ? `<div style="margin-top:10px;font-size:14px;font-weight:900;letter-spacing:-1px;">${s.cost}</div>` : ''}
        </div>`).join('')}
      </div>
      <div class="brutal-footer">
        <div class="bfc">MY ARC</div>
        <div class="bfc">Coaching Guide</div>
        <div class="bfc">Pagina C</div>
      </div>
    </div>
  </div>
`
// ── Swaps Page ────────────────────────────────────────────────────────────────
const SWAP_SLOT_CONFIG = {
  breakfast:   { label: 'ONTBIJT',       icon: '🌅' },
  lunch:       { label: 'LUNCH',          icon: '🍱' },
  dinner:      { label: 'DINER',          icon: '🍽️' },
  snack:       { label: 'SNACKS',         icon: '🥤' },
  pre_workout: { label: 'PRE-WORKOUT',    icon: '⚡' },
}

const generateSwapsPage = (swapOptions) => {
  const slots = Object.entries(SWAP_SLOT_CONFIG)
    .map(([key, cfg]) => ({ key, ...cfg, meals: swapOptions[key] || [] }))
    .filter(s => s.meals.length > 0)

  if (slots.length === 0) return ''

  const slotHtml = slots.map((slot, i) => {
    const mealRows = slot.meals.map(m => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.08);font-size:12px;">
        <span style="font-weight:600;color:#111;">${m.name || m.internal_name || '—'}</span>
        <span style="font-size:11px;font-weight:700;letter-spacing:-0.5px;color:#666;white-space:nowrap;margin-left:8px;">${m.calories ? m.calories + ' kcal' : ''} · ${m.protein ? Math.round(m.protein) + 'e' : ''}</span>
      </div>`).join('')

    const isLastCol = i === slots.length - 1
    return `
      <div style="padding:20px 24px;border-right:${isLastCol ? 'none' : '3px solid #000'};overflow:hidden;">
        <div style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#666;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #000;">
          ${slot.icon} ${slot.label}
        </div>
        ${mealRows || '<span style="font-size:11px;color:#999;">Geen opties ingesteld</span>'}
      </div>`
  }).join('')

  const cols = Math.min(slots.length, 3)
  return `
  <div class="page">
    <div class="day-pg">
      <div class="day-hdr">
        <div class="dhc"><span class="day-num" style="font-size:22px;">SWAP</span></div>
        <div class="dhc"><span class="day-name-brutal">MAALTIJD SWAPS — JOUW OPTIES</span></div>
        <div class="dhc"><span class="pg-num">S</span></div>
      </div>
      <div class="training-bar" style="background:#f0f0f0;">
        <span class="train-lbl">WISSEL FLEXIBEL BINNEN DEZE OPTIES — MACRO'S BLIJVEN OP DOEL</span>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:repeat(${cols},1fr);overflow:hidden;">
        ${slotHtml}
      </div>
      <div class="brutal-footer">
        <div class="bfc">MY ARC</div>
        <div class="bfc">Weekplan</div>
        <div class="bfc">Swaps</div>
      </div>
    </div>
  </div>`
}

export const generateMealPlanHTML = (enrichedPlan, clientName = 'Client', weekRange = 'Week Plan', opts = {}) => {
  // opts: { title, days (array van day-keys, null = alle), includeCover,
  //         includeWeekOverview, swapOptions }. Backward-compatibel: als opts
  //        per ongeluk een oude swapOptions-map is, pakken we die op.
  const {
    title = null,
    days: dayFilter = null,
    includeCover = true,
    includeWeekOverview = true,
    swapOptions = null,
  } = (opts && (opts.title !== undefined || opts.days !== undefined || opts.swapOptions !== undefined ||
                opts.includeCover !== undefined || opts.includeWeekOverview !== undefined))
        ? opts
        : { swapOptions: opts || null }

  const stats = enrichedPlan.weeklyStats || { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0 }
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const ws    = enrichedPlan.week_structure_enriched || {}

  // dayFilter null = alle dagen; [] = geen dag-pagina's (bv. 'alleen weekschema').
  const daysToRender = Array.isArray(dayFilter) ? allDays.filter(d => dayFilter.includes(d)) : allDays
  const dayPages = daysToRender.map((day) => {
    const dayData = ws[day]
    if (!dayData) return ''
    const i = allDays.indexOf(day)
    return generateDayPage(day, dayData, i, i + 3)
  }).join('')

  const swapsPage = swapOptions ? generateSwapsPage(swapOptions) : ''
  const docTitle = title || `${clientName} — MY ARC Weekplan`

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${generateStyles()}</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Download PDF</button>
  ${includeCover ? generateCoverPage(clientName, weekRange, stats, title) : ''}
  ${includeWeekOverview ? generateWeekOverviewPage(enrichedPlan) : ''}
  ${dayPages}
  ${swapsPage}
  <script>lucide.createIcons();</script>
</body>
</html>
  `
}

// ── Coaching Guide HTML (aparte PDF) ─────────────────────────────────────────
export const generateCoachingGuideHTML = (clientName = 'Client') => {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${clientName} — MY ARC Coaching Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${generateStyles()}</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Download PDF</button>

  <!-- COVER -->
  <div class="page">
    <div class="cover">
      <div class="cover-top">
        <div class="cover-top-l">
          <div class="lbl">MY ARC — Coaching Guide</div>
          <div class="yr">25</div>
        </div>
        <div class="cover-top-r">
          <div class="lbl">Voeding & Lifestyle</div>
          <div class="lbl" style="margin-top:auto;">Door Kersten van den Berg</div>
        </div>
      </div>
      <div class="cover-main">
        <h1 class="brutal-title">
          <span class="red">${clientName.toUpperCase()}</span><br>
          COA<br>
          CHING<br>
          GUIDE
        </h1>
        <p class="cover-sub">Timing, supplementen en levensstijl tips. Eenmalig te lezen — altijd als referentie te bewaren.</p>
      </div>
      <div class="cover-bottom">
        <div class="cover-stat"><div class="cs-lbl">Onderwerpen</div><div class="cs-val">3</div></div>
        <div class="cover-stat"><div class="cs-lbl">Pagina's</div><div class="cs-val">4</div></div>
        <div class="cover-stat"><div class="cs-lbl">Coach</div><div class="cs-val" style="font-size:18px;">Kersten</div></div>
        <div class="cover-stat"><div class="cs-lbl">MY ARC</div><div class="cs-val" style="font-size:18px;">2025</div></div>
      </div>
    </div>
  </div>

  ${generateCoachingPages()}
</body>
</html>
  `
}

// ── Helper: open HTML in print window ────────────────────────────────────────
const openHTMLForPrint = (html, loadingText = 'PDF MAKEN...') => {
  const loadingDiv = document.createElement('div')
  loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px 40px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;z-index:9999;'
  loadingDiv.textContent = loadingText
  document.body.appendChild(loadingDiv)

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => setTimeout(() => printWindow.print(), 600)
  } else {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open(); doc.write(html); doc.close()
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000) }, 500)
  }

  if (document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv)
}

export const openMealPlanForPrint = async (mealPlan, clientName, weekRange, opts = {}) => {
  const MealPlanPDFService = (await import('./MealPlanPDFService')).default
  const pdfService = new MealPlanPDFService()

  const loadingDiv = document.createElement('div')
  loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px 40px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;z-index:9999;'
  loadingDiv.textContent = 'PDF MAKEN...'
  document.body.appendChild(loadingDiv)

  try {
    const enrichedPlan = await pdfService.enrichMealPlanData(mealPlan)
    enrichedPlan.weeklyStats = pdfService.calculateWeeklyStats(enrichedPlan)
    const html = generateMealPlanHTML(enrichedPlan, clientName, weekRange, opts)
    if (document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv)
    openHTMLForPrint(html)
  } catch (err) {
    console.error('❌ PDF error:', err)
    if (document.body.contains(loadingDiv)) document.body.removeChild(loadingDiv)
    alert('PDF maken mislukt: ' + err.message)
  }
}

export const openCoachingGuideForPrint = (clientName) => {
  const html = generateCoachingGuideHTML(clientName)
  openHTMLForPrint(html, 'COACHING GUIDE MAKEN...')
}

export default { generateMealPlanHTML, generateCoachingGuideHTML, openMealPlanForPrint, openCoachingGuideForPrint }
