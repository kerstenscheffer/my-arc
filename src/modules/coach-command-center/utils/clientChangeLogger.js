// src/modules/coach-command-center/utils/clientChangeLogger.js
//
// Schrijft een auto-log naar `client_coaching_logs` wanneer de coach een
// doel of macro-waarde van een klant aanpast. Hangt onder de bestaande
// CoachingLogModal (category='change_log') zodat de log-modal de wijzigingen
// chronologisch laat zien.
//
// Gebruik:
//   const before = pickTrackedFields(client)
//   await db.supabase.from('clients').update(payload).eq('id', client.id)
//   await logClientChanges({ db, clientId: client.id, before, after: payload, source })
//
// `after` mag een gedeeltelijk payload zijn (alleen de gewijzigde velden).

// Lijst velden die we tracken. Key = client-kolom, label = wat we in de
// log-note tonen, unit = optionele suffix.
const TRACKED_FIELDS = [
  { key: 'primary_goal',         label: 'Doel',                unit: '',  format: 'text' },
  { key: 'goal_deadline',        label: 'Doel-deadline',       unit: '',  format: 'date' },
  { key: 'start_weight',         label: 'Startgewicht',        unit: 'kg' },
  { key: 'current_weight',       label: 'Huidig gewicht',      unit: 'kg' },
  { key: 'target_weight',        label: 'Doel-gewicht',        unit: 'kg' },
  { key: 'goal_weight',          label: 'Goal-gewicht',        unit: 'kg' },
  { key: 'current_body_fat',     label: 'Huidig vet%',         unit: '%' },
  { key: 'target_body_fat',      label: 'Doel-vet%',           unit: '%' },
  { key: 'tdee',                 label: 'TDEE',                unit: 'kcal' },
  { key: 'surplus',              label: 'Surplus',             unit: 'kcal' },
  { key: 'target_calories',      label: 'Kcal',                unit: 'kcal' },
  { key: 'target_protein',       label: 'Eiwit',               unit: 'g' },
  { key: 'target_carbs',         label: 'Koolh',               unit: 'g' },
  { key: 'target_fat',           label: 'Vet',                 unit: 'g' },
  { key: 'manual_macro_targets', label: 'Macro-modus',         unit: '',  format: 'bool', boolTrue: 'handmatig', boolFalse: 'auto' },
  { key: 'manual_tdee',          label: 'Handmatige TDEE',     unit: 'kcal' },
]

const TRACKED_KEYS = new Set(TRACKED_FIELDS.map(f => f.key))

// Capture huidige waardes voor alle tracked velden — gebruik dit voordat
// je de DB update doet, zodat je een before/after-vergelijking kan maken.
export function pickTrackedFields(client) {
  if (!client) return {}
  const out = {}
  for (const f of TRACKED_FIELDS) {
    out[f.key] = client[f.key]
  }
  return out
}

function formatVal(val, field) {
  if (val == null || val === '') return '—'
  if (field.format === 'bool') {
    return val ? (field.boolTrue || 'aan') : (field.boolFalse || 'uit')
  }
  if (field.format === 'date') {
    try {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {}
    return String(val)
  }
  if (field.format === 'text') return String(val)
  // numeric default — strip trailing zeros for kg/cm metrics
  const n = Number(val)
  if (!Number.isFinite(n)) return String(val)
  if (Number.isInteger(n)) return String(n)
  return (Math.round(n * 10) / 10).toString()
}

function isEqual(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  if (typeof a === 'number' || typeof b === 'number') {
    return Number(a) === Number(b)
  }
  return String(a) === String(b)
}

export async function logClientChanges({ db, clientId, before, after, source = 'coach_edit' }) {
  if (!db?.supabase || !clientId || !after) return
  const diffs = []
  for (const field of TRACKED_FIELDS) {
    if (!(field.key in after)) continue
    const oldVal = before?.[field.key]
    const newVal = after[field.key]
    if (isEqual(oldVal, newVal)) continue
    const oldStr = formatVal(oldVal, field)
    const newStr = formatVal(newVal, field)
    const unit = field.unit ? ` ${field.unit}` : ''
    diffs.push(`${field.label}: ${oldStr}${oldStr !== '—' && field.format !== 'text' && field.format !== 'date' && field.format !== 'bool' ? unit : ''} → ${newStr}${newStr !== '—' && field.format !== 'text' && field.format !== 'date' && field.format !== 'bool' ? unit : ''}`)
  }
  if (diffs.length === 0) return

  let coachId = null
  try {
    const { data: { user } } = await db.supabase.auth.getUser()
    coachId = user?.id || null
  } catch {}

  const note = diffs.join('\n')
  try {
    await db.supabase.from('client_coaching_logs').insert({
      client_id: clientId,
      coach_id: coachId,
      status: 'on_track',
      note,
      category: 'change_log',
    })
  } catch (e) {
    console.error('logClientChanges insert failed:', e)
  }
}

export { TRACKED_KEYS }
