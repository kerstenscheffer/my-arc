// src/modules/coach-command-center/components/insight/insightTokens.js
//
// Kleuren en rekenconstanten die meerdere panelen in Coach Insight delen.
// Stonden bovenin ClientDataColumn; sinds het macro-paneel een eigen bestand
// heeft, hebben ze een gedeelde plek nodig — anders lopen de twee kopieën uit
// elkaar zodra iemand één kleur aanpast.

export const LIFESTYLE_LEVELS = {
  sedentary:   { label: 'Zittend (kantoor, auto)',         factor: 1.20 },
  light:       { label: 'Licht (wandelen, soms staan)',    factor: 1.30 },
  moderate:    { label: 'Matig (veel lopen of staand)',    factor: 1.40 },
  active:      { label: 'Actief (fysiek werk)',            factor: 1.50 },
  very_active: { label: 'Zeer actief (zwaar fysiek werk)', factor: 1.60 },
}
export const DEFAULT_LIFESTYLE = 'sedentary'

// Standaard kcal-verbruik per krachttraining (45-60 min). Aanpasbaar per
// klant zodat een langere/zwaardere sessie hoger kan staan.
export const DEFAULT_KCAL_PER_SESSION = 350

// Cardio-types — kcal/min voor ~85 kg persoon op zone-2 intensiteit
// (steady state, gesprek-tempo). MET-waardes als referentie:
//   wandelen ~4 · crosstrainer ~5 · fietsen ~6,5 · zwemmen/roeien ~6 ·
//   hardlopen easy ~7. Hoge-intensiteit varianten apart erbij.
export const CARDIO_TYPES = {
  walking_fast: { label: 'Wandelen (stevig)',         kcalPerMin: 6    },
  elliptical:   { label: 'Crosstrainer',              kcalPerMin: 7.5  },
  cycling_easy: { label: 'Fietsen (rustig-matig)',    kcalPerMin: 10   },
  cycling_hard: { label: 'Fietsen (intensief)',       kcalPerMin: 12.5 },
  swimming:     { label: 'Zwemmen (rustige baantjes)',kcalPerMin: 9    },
  rowing:       { label: 'Roeien (matig)',            kcalPerMin: 9    },
  running:      { label: 'Hardlopen (easy/joggen)',   kcalPerMin: 10.5 },
  running_hard: { label: 'Hardlopen (snel)',          kcalPerMin: 13.5 },
  stairmaster:  { label: 'Stairmaster',               kcalPerMin: 11   },
  hiit:         { label: 'HIIT',                      kcalPerMin: 14   },
  spinning:     { label: 'Spinning (intensief)',      kcalPerMin: 12   },
}

export const C = {
  gold: '#fff', green: '#10b981', red: '#ef4444', amber: '#f59e0b',
  orange: '#f97316', purple: '#a855f7',
  text: '#fff', text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)',
  text20: 'rgba(255,255,255,0.2)', text15: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)', borderItem: 'rgba(255,255,255,0.03)',
  goldBg10: 'rgba(255,255,255,0.08)',
}
