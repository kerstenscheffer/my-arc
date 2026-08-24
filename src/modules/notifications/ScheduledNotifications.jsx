// src/modules/notifications/ScheduledNotifications.jsx
// Regel-bouwer voor terugkerende klant-meldingen. Elke regel = "check dit, en
// stuur op dit tijdstip een melding aan wie er niet aan voldoet". De cron-job
// `run-notification-schedules` (elk kwartier) evalueert ze server-side; deze
// component beheert alleen de regels zelf.
//
// Een nieuwe regel staat bewust UIT — hij stuurt pas iets nadat je 'm aanzet.
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, X, Trash2, Clock, Users, Scale, UtensilsCrossed, Dumbbell,
  Bell, Eye, Loader2, AlertCircle, ClipboardCheck, Camera,
} from 'lucide-react'

const GOLD = '#FFD700'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const RED = '#ef4444'

// Moet 1-op-1 matchen met de check_type-constraint op notification_schedules.
const CHECK_TYPES = [
  {
    value: 'weight_not_logged', label: 'Gewicht niet gelogd', Icon: Scale, color: '#3b82f6',
    desc: 'Stuurt alleen naar klanten die hun gewicht niet hebben ingevuld.',
    defaults: { name: 'Dagelijkse weeg-herinnering', title: 'Weeg je even?', message: 'Hoi {naam}, je hebt vandaag je gewicht nog niet gelogd. Even op de weegschaal?', page_context: 'tracking' },
  },
  {
    value: 'meal_not_logged', label: 'Maaltijd niet gelogd', Icon: UtensilsCrossed, color: GREEN,
    desc: 'Stuurt alleen naar klanten die niets aan hun maaltijdplan afvinkten.',
    defaults: { name: 'Maaltijd-herinnering', title: 'Vergeet je maaltijden niet', message: 'Hoi {naam}, je hebt vandaag nog niets afgevinkt in je maaltijdplan.', page_context: 'meal' },
  },
  {
    value: 'workout_not_logged', label: 'Niet getraind', Icon: Dumbbell, color: '#a855f7',
    desc: 'Stuurt naar klanten zonder afgeronde workout in de gekozen periode.',
    defaults: { name: 'Trainings-herinnering', title: 'Tijd om te trainen', message: 'Hoi {naam}, we missen je in de gym. Vandaag weer een sessie pakken?', page_context: 'workout' },
  },
  {
    value: 'checkin_not_done', label: 'Check-in niet gedaan', Icon: ClipboardCheck, color: '#06b6d4',
    desc: 'Stuurt naar klanten zonder check-in in de gekozen periode.',
    defaults: { name: 'Check-in herinnering', title: 'Tijd voor je check-in', message: 'Heyy het is tijd om je check-in in te vullen!', page_context: 'all' },
  },
  {
    value: 'photo_not_uploaded', label: 'Geen progressiefoto', Icon: Camera, color: '#ec4899',
    desc: 'Stuurt naar klanten die in de gekozen periode geen foto uploadden.',
    defaults: { name: 'Progressiefoto', title: 'Tijd voor een nieuwe foto', message: 'Heyy, upload even een nieuwe progressiefoto — dan zien we je vooruitgang terug!', page_context: 'tracking' },
  },
  {
    value: 'always', label: 'Altijd sturen', Icon: Bell, color: AMBER,
    desc: 'Geen check — iedereen in de doelgroep krijgt de melding.',
    defaults: { name: 'Herinnering', title: 'Even een reminder', message: 'Hoi {naam}!', page_context: 'all' },
  },
]

const checkMeta = (v) => CHECK_TYPES.find(c => c.value === v) || CHECK_TYPES[0]

const AUDIENCES = [
  { value: 'active', label: 'Actieve klanten' },
  { value: 'all', label: 'Al mijn klanten' },
]

const DAYS = [
  { n: 1, l: 'M' }, { n: 2, l: 'D' }, { n: 3, l: 'W' }, { n: 4, l: 'D' },
  { n: 5, l: 'V' }, { n: 6, l: 'Z' }, { n: 7, l: 'Z' },
]

const PAGE_CONTEXTS = [
  { value: 'all', label: 'Overal' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'meal', label: 'Maaltijden' },
  { value: 'workout', label: 'Workout' },
]

const emptyRule = () => ({
  ...checkMeta('weight_not_logged').defaults,
  check_type: 'weight_not_logged',
  target: 'client',
  check_days: 1,
  run_at: '19:00',
  days_of_week: [1, 2, 3, 4, 5, 6, 7],
  audience: 'active',
  cooldown_hours: 20,
  priority: 'normal',
  is_active: false,
})

const fmtLastRun = (iso) => {
  if (!iso) return 'nog niet gedraaid'
  try {
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m geleden`
    if (diff < 86400) return `${Math.floor(diff / 3600)}u geleden`
    return `${Math.floor(diff / 86400)}d geleden`
  } catch { return '' }
}

export default function ScheduledNotifications({ db, coachId, isMobile }) {
  const [rules, setRules] = useState([])
  const [counts, setCounts] = useState({})   // schedule_id → aantal verzonden
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // regel-object of null
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!coachId) return
    setLoading(true); setError(null)
    try {
      const { data, error: e } = await db.supabase
        .from('notification_schedules')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: true })
      if (e) throw e
      setRules(data || [])

      // Verzendaantallen per regel — laat zien dat een regel echt iets doet.
      const ids = (data || []).map(r => r.id)
      if (ids.length) {
        const { data: runs } = await db.supabase
          .from('notification_schedule_runs')
          .select('schedule_id')
          .in('schedule_id', ids)
        const tally = {}
        ;(runs || []).forEach(r => { tally[r.schedule_id] = (tally[r.schedule_id] || 0) + 1 })
        setCounts(tally)
      } else {
        setCounts({})
      }
    } catch (e) {
      console.error('Regels laden mislukt:', e)
      setError(e.message || 'Laden mislukt')
    } finally { setLoading(false) }
  }, [db, coachId])

  useEffect(() => { load() }, [load])

  const toggleActive = async (rule) => {
    setBusyId(rule.id)
    try {
      const { error: e } = await db.supabase
        .from('notification_schedules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id)
      if (e) throw e
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
    } catch (e) {
      console.error('Aan/uit zetten mislukt:', e)
      setError(e.message || 'Aan/uit zetten mislukt')
    } finally { setBusyId(null) }
  }

  const removeRule = async (rule) => {
    setBusyId(rule.id)
    try {
      const { error: e } = await db.supabase
        .from('notification_schedules').delete().eq('id', rule.id)
      if (e) throw e
      setRules(prev => prev.filter(r => r.id !== rule.id))
    } catch (e) {
      console.error('Verwijderen mislukt:', e)
      setError(e.message || 'Verwijderen mislukt')
    } finally { setBusyId(null) }
  }

  const saveRule = async (draft) => {
    const payload = {
      coach_id: coachId,
      name: draft.name?.trim() || 'Naamloze regel',
      check_type: draft.check_type,
      check_days: Number(draft.check_days) || 1,
      run_at: draft.run_at,
      days_of_week: draft.days_of_week?.length ? draft.days_of_week : [1, 2, 3, 4, 5, 6, 7],
      title: draft.title?.trim() || 'Herinnering',
      message: draft.message?.trim() || '',
      page_context: draft.page_context || 'all',
      priority: draft.priority || 'normal',
      audience: draft.audience || 'active',
      target: draft.target || 'client',
      cooldown_hours: Number(draft.cooldown_hours) || 20,
    }
    if (draft.id) {
      const { error: e } = await db.supabase
        .from('notification_schedules').update(payload).eq('id', draft.id)
      if (e) throw e
    } else {
      const { error: e } = await db.supabase
        .from('notification_schedules').insert({ ...payload, is_active: false })
      if (e) throw e
    }
    setEditing(null)
    await load()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 0.5rem 0.15rem' }}>
        <div style={{ flex: 1, fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          Automatische meldingen
        </div>
        <button onClick={() => setEditing(emptyRule())}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.7rem', borderRadius: 8, background: 'rgba(255,215,0,0.12)', border: `1px solid ${GOLD}44`, color: GOLD, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>
          <Plus size={13} /> Nieuw
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: `1px solid ${RED}44`, marginBottom: 8, fontSize: '0.75rem', color: RED }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: '1.3rem' }}>
        {loading ? (
          <div style={{ padding: '1.6rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Regels laden…</div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '1.6rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Nog geen automatische meldingen.</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, lineHeight: 1.45 }}>
              Maak er bijvoorbeeld één die elke avond om 19:00 een reminder stuurt<br />naar iedereen die z'n gewicht nog niet loggde.
            </div>
          </div>
        ) : rules.map((r, i) => {
          const m = checkMeta(r.check_type)
          const allDays = (r.days_of_week || []).length === 7
          return (
            <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0.7rem 0.85rem', borderBottom: i === rules.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: `${m.color}1a`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.Icon size={15} color={m.color} />
              </div>
              <button onClick={() => setEditing(r)} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.42)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 1 }}>
                  <span><Clock size={9} style={{ verticalAlign: -1 }} /> {String(r.run_at).slice(0, 5)}{allDays ? '' : ' · ' + (r.days_of_week || []).map(d => DAYS[d - 1]?.l).join('')}</span>
                  <span><Users size={9} style={{ verticalAlign: -1 }} /> {AUDIENCES.find(a => a.value === r.audience)?.label || r.audience}</span>
                  {r.target === 'coach' && <span style={{ color: GOLD, fontWeight: 800 }}>→ naar jou</span>}
                  <span style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {counts[r.id] ? `${counts[r.id]}× verstuurd` : fmtLastRun(r.last_run_at)}
                  </span>
                </div>
              </button>
              <button onClick={() => toggleActive(r)} disabled={busyId === r.id} title={r.is_active ? 'Uitzetten' : 'Aanzetten'}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: busyId === r.id ? 'wait' : 'pointer', padding: 2, background: r.is_active ? GREEN : 'rgba(255,255,255,0.14)', transition: 'background 0.15s', position: 'relative' }}>
                <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: `translateX(${r.is_active ? 20 : 0}px)`, transition: 'transform 0.15s' }} />
              </button>
              <button onClick={() => removeRule(r)} disabled={busyId === r.id} title="Verwijderen"
                style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {editing && (
        <RuleEditor db={db} isMobile={isMobile} rule={editing}
          onClose={() => setEditing(null)} onSave={saveRule} />
      )}
    </>
  )
}

function RuleEditor({ db, isMobile, rule, onClose, onSave }) {
  const [draft, setDraft] = useState(rule)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewing, setPreviewing] = useState(false)

  const set = (k, v) => setDraft(p => ({ ...p, [k]: v }))

  // Van check-type wisselen vult de teksten met een passend voorbeeld — maar
  // alleen zolang de coach ze nog niet zelf heeft aangepast.
  const changeCheckType = (v) => {
    const prevDefaults = checkMeta(draft.check_type).defaults
    const next = checkMeta(v).defaults
    setDraft(p => ({
      ...p,
      check_type: v,
      name:         p.name === prevDefaults.name ? next.name : p.name,
      title:        p.title === prevDefaults.title ? next.title : p.title,
      message:      p.message === prevDefaults.message ? next.message : p.message,
      page_context: p.page_context === prevDefaults.page_context ? next.page_context : p.page_context,
    }))
    setPreview(null)
  }

  const toggleDay = (n) => {
    const cur = draft.days_of_week || []
    set('days_of_week', cur.includes(n) ? cur.filter(d => d !== n) : [...cur, n].sort())
  }

  const runPreview = async () => {
    if (!draft.id) return
    setPreviewing(true); setPreview(null)
    try {
      const { data, error } = await db.supabase.rpc('preview_notification_schedule', { p_schedule_id: draft.id })
      if (error) throw error
      setPreview(data)
    } catch (e) {
      console.error('Preview mislukt:', e)
      setErr(e.message || 'Preview mislukt')
    } finally { setPreviewing(false) }
  }

  const submit = async () => {
    setSaving(true); setErr(null)
    try { await onSave(draft) }
    catch (e) {
      console.error('Opslaan mislukt:', e)
      setErr(e.message || 'Opslaan mislukt')
      setSaving(false)
    }
  }

  const meta = checkMeta(draft.check_type)

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: isMobile ? '92vh' : '88vh', overflowY: 'auto', background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '16px 16px 0 0' : 16, padding: isMobile ? '1.1rem 1rem 1.6rem' : '1.4rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${meta.color}1a`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <meta.Icon size={17} color={meta.color} />
          </div>
          <div style={{ flex: 1, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
            {draft.id ? 'Regel bewerken' : 'Nieuwe regel'}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <Field label="Naam (alleen voor jou)">
          <Input value={draft.name} onChange={v => set('name', v)} placeholder="Dagelijkse weeg-herinnering" />
        </Field>

        <Field label="Wanneer sturen?" hint={meta.desc}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: 6 }}>
            {CHECK_TYPES.map(ct => (
              <button key={ct.value} onClick={() => changeCheckType(ct.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.55rem 0.6rem', borderRadius: 9, cursor: 'pointer', textAlign: 'left', background: draft.check_type === ct.value ? `${ct.color}1a` : 'rgba(255,255,255,0.03)', border: `1px solid ${draft.check_type === ct.value ? ct.color + '66' : 'rgba(255,255,255,0.08)'}` }}>
                <ct.Icon size={14} color={draft.check_type === ct.value ? ct.color : 'rgba(255,255,255,0.4)'} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: draft.check_type === ct.value ? '#fff' : 'rgba(255,255,255,0.6)' }}>{ct.label}</span>
              </button>
            ))}
          </div>
        </Field>

        {draft.check_type !== 'always' && (
          <Field label="Periode" hint={`Stuurt pas als er ${draft.check_days} dag(en) niets gelogd is.`}>
            <Input type="number" min={1} max={30} value={draft.check_days} onChange={v => set('check_days', v)} />
          </Field>
        )}

        <Field label="Wie krijgt de melding?">
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'client', label: 'De klant' },
              { key: 'coach',  label: 'Ik (coach)' },
            ].map(t => {
              const on = (draft.target || 'client') === t.key
              return (
                <button key={t.key} onClick={() => set('target', t.key)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 9, cursor: 'pointer',
                  background: on ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${on ? GOLD + '66' : 'rgba(255,255,255,0.08)'}`,
                  color: on ? GOLD : 'rgba(255,255,255,0.55)', fontSize: '0.74rem', fontWeight: 800,
                }}>{t.label}</button>
              )
            })}
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Tijdstip">
            <Input type="time" value={String(draft.run_at).slice(0, 5)} onChange={v => set('run_at', v)} />
          </Field>
          <Field label="Over welke klanten">
            <Select value={draft.audience} onChange={v => set('audience', v)} options={AUDIENCES} />
          </Field>
        </div>

        <Field label="Dagen">
          <div style={{ display: 'flex', gap: 5 }}>
            {DAYS.map(d => {
              const on = (draft.days_of_week || []).includes(d.n)
              return (
                <button key={d.n} onClick={() => toggleDay(d.n)}
                  style={{ flex: 1, padding: '0.45rem 0', borderRadius: 8, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800, background: on ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? GOLD + '55' : 'rgba(255,255,255,0.08)'}`, color: on ? GOLD : 'rgba(255,255,255,0.35)' }}>
                  {d.l}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Titel van de melding">
          <Input value={draft.title} onChange={v => set('title', v)} placeholder="Weeg je even?" />
        </Field>

        <Field label="Bericht" hint="{naam} wordt vervangen door de voornaam van de klant.">
          <textarea value={draft.message} onChange={e => set('message', e.target.value)} rows={3}
            style={{ width: '100%', padding: '0.6rem 0.7rem', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Opent in de app">
            <Select value={draft.page_context} onChange={v => set('page_context', v)} options={PAGE_CONTEXTS} />
          </Field>
          <Field label="Min. uren ertussen" hint="Bepaalt ook het ritme: 312 op alleen maandag = elke 2 weken.">
            <Input type="number" min={1} max={720} value={draft.cooldown_hours} onChange={v => set('cooldown_hours', v)} />
          </Field>
        </div>

        {/* Droogloop — alleen zinvol voor een bestaande regel. */}
        {draft.id && (
          <div style={{ padding: '0.7rem 0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                Kijk wie deze regel nú zou raken — stuurt niets.
              </div>
              <button onClick={runPreview} disabled={previewing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.7rem', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: previewing ? 'wait' : 'pointer' }}>
                {previewing ? <Loader2 size={12} className="spin" /> : <Eye size={12} />} Preview
              </button>
            </div>
            {preview && !preview.error && (
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                <strong style={{ color: preview.would_receive > 0 ? GOLD : 'rgba(255,255,255,0.5)' }}>
                  {preview.would_receive}
                </strong> van {preview.audience_size} klanten
                {Array.isArray(preview.names) && preview.names.length > 0 && (
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}> — {preview.names.join(', ')}{preview.would_receive > preview.names.length ? '…' : ''}</span>
                )}
              </div>
            )}
          </div>
        )}

        {err && (
          <div style={{ padding: '0.6rem 0.8rem', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: `1px solid ${RED}44`, color: RED, fontSize: '0.75rem', marginBottom: '0.8rem' }}>{err}</div>
        )}

        {!draft.id && (
          <div style={{ padding: '0.6rem 0.8rem', borderRadius: 9, background: 'rgba(245,158,11,0.07)', border: `1px solid ${AMBER}44`, color: 'rgba(255,255,255,0.7)', fontSize: '0.73rem', marginBottom: '0.8rem', lineHeight: 1.45 }}>
            De regel wordt <strong>uitgeschakeld</strong> opgeslagen. Zet 'm pas aan als de tekst klopt.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.7rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            Annuleren
          </button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 2, padding: '0.7rem', borderRadius: 10, background: GOLD, border: 'none', color: '#000', fontSize: '0.82rem', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Opslaan…' : draft.id ? 'Opslaan' : 'Regel aanmaken'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.32)', marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.7rem', borderRadius: 9,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box',
}

function Input({ value, onChange, ...rest }) {
  return <input value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle} {...rest} />
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0d0d0f' }}>{o.label}</option>)}
    </select>
  )
}
