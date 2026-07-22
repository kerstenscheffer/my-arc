// src/client/pages/ClientHome.jsx
//
// Client home — focus op wat ECHT relevant is voor de client:
//   1) ChallengeHomeBanner (bestaand)
//   2) WelcomeSection (datum + naam)
//   3) GoalCard — primaire doelstelling van de client
//   4) TrajectProgress — hoeveel weken in, hoeveel over
//   5) ActionItems — afgesproken acties tussen coach en client
//
// Quick-action tiles zijn verwijderd: de bottom-nav heeft al alle hoofd-
// navigatie en de tiles voegden alleen duplicaat-navigatie toe zonder content.

import ChallengeHomeBanner from "../components/challenge-banner/ChallengeHomeBanner"
import TodayCard from "../components/TodayCard"
import React, { useState, useEffect } from 'react'
import {
  Calendar, Coffee, Sun, Moon, Target, Clock,
  CheckCircle2, Circle, Phone, MessageCircle, Sparkles,
  ListChecks,
} from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import FadeOnScroll from '../../components/FadeOnScroll'
import { weightGoalColor } from '../../modules/weight-tracker/utils/weightGoalColor'

// Klein gouden section-header, identiek aan het patroon op de workout-pagina.
function SectionLabel({ icon: Icon, label, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      marginBottom: isMobile ? '0.7rem' : '0.85rem',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: isMobile ? '0.65rem' : '0.72rem',
      fontWeight: 800, color: '#FFD700',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      opacity: 0.85,
    }}>
      {Icon && <Icon size={isMobile ? 13 : 14} strokeWidth={2.4} />}
      {label}
    </div>
  )
}

// Dagelijkse tips/quotes — random gepicked op basis van date-of-year zodat'ie
// per dag constant is maar elke dag een ander tipje toont.
const DAILY_TIPS = [
  'Consistentie wint van perfectie. Eén goede dag telt, vandaag opnieuw.',
  'Drink je eerste glas water voordat je je telefoon pakt — kleine win, hele dag profiteren.',
  'Slecht geslapen? Doe je workout, maar verlaag het volume met 20%. Beter iets dan niets.',
  'De beste oefening is degene die je daadwerkelijk doet.',
  'Eet je eiwit eerst — dan zit je sneller vol bij de rest van je bord.',
  'Plan je workout in je agenda alsof het een meeting met jezelf is.',
  'Discipline is vrijheid — minder beslissingen, meer resultaat.',
  'Maak je bed elke ochtend. Eerste win van de dag, gratis.',
  '10 minuten zwaarder trainen kan effectiever zijn dan een uur hangen.',
  'Vergelijk jezelf met wie je gisteren was, niet met wie anderen vandaag zijn.',
]
const pickTip = () => {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length]
}

// ============================================
// WELCOME SECTION — twee regels:
//   1) Grote gouden DAG-naam + datum-pill (bv. "Maandag [10 juni]")
//   2) Daaronder: "Goedemorgen, Kersten"
// ============================================
function WelcomeSection({ client }) {
  const isMobile = useIsMobile()

  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  const today = new Date()
  const dayName = days[today.getDay()]
  const dateLabel = `${today.getDate()} ${months[today.getMonth()]}`

  const getGreeting = () => {
    const hour = today.getHours()
    if (hour < 12) return 'Goedemorgen'
    if (hour < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }

  const firstName = client?.first_name || 'Champion'

  // Traject-voortgang voor in de balk: "Week X/Y" + dunne balk.
  const startStr = client?.coaching_start_date
  const totalWeeks = client?.coaching_total_weeks
  const endStr = client?.subscription_end_date
  let curWeek = null, weeksTotal = null
  if (startStr) {
    const start = new Date(startStr)
    const elapsedWeeks = Math.floor(Math.max(0, (today.getTime() - start.getTime()) / 86400000) / 7)
    if (totalWeeks && totalWeeks > 0) {
      // Traject-lengte staat op de client (coaching_total_weeks) — leidend.
      weeksTotal = totalWeeks
      curWeek = Math.min(weeksTotal, elapsedWeeks + 1)
    } else if (endStr) {
      // Anders afleiden uit de einddatum.
      const end = new Date(endStr)
      weeksTotal = Math.ceil(Math.max(1, (end.getTime() - start.getTime()) / 86400000) / 7)
      curWeek = Math.min(weeksTotal, elapsedWeeks + 1)
    } else {
      // Open-ended: alleen hoeveelste week.
      curWeek = elapsedWeeks + 1
    }
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      paddingTop: 'env(safe-area-inset-top, 0)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
        textAlign: 'center',
      }}>
        {/* Dag + datum-pill + traject-week (bold wit) */}
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.35rem',
          fontWeight: 900, color: '#FFD700', letterSpacing: '-0.02em',
          lineHeight: 1.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          {dayName}
          <span style={{
            fontSize: '0.62rem', fontWeight: 800,
            color: 'rgba(0,0,0,0.85)', background: '#FFD700',
            padding: '2px 7px', borderRadius: 4,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {dateLabel}
          </span>
          {curWeek != null && (
            <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
              week {curWeek}{weeksTotal != null && `/${weeksTotal}`}
            </span>
          )}
        </div>

        {/* Begroeting + naam */}
        <div style={{
          marginTop: 6,
          fontSize: isMobile ? '0.92rem' : '1rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: '-0.01em',
        }}>
          {getGreeting()}, <span style={{ color: '#fff', fontWeight: 900 }}>{firstName}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DAILY TIP — eigen sectie, zelfde anatomie als workout-section-headers
// ============================================
function DailyTipSection({ isMobile }) {
  return (
    <div style={{ marginTop: isMobile ? '1.75rem' : '2.25rem' }}>
      <SectionLabel icon={Sparkles} label="Tip van de dag" isMobile={isMobile} />
      <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
        <div style={{
          padding: isMobile ? '0.95rem 1.05rem' : '1.1rem 1.25rem',
          background: 'rgba(255,215,0,0.05)',
          border: '1px solid rgba(255,215,0,0.18)',
          borderRadius: 14,
          fontSize: isMobile ? '0.85rem' : '0.92rem',
          color: 'rgba(255,255,255,0.85)',
          fontWeight: 600,
          lineHeight: 1.5,
        }}>
          {pickTip()}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COACH NOTE — laatste notificatie van de coach, met coach-foto.
// Bron: `notifications` tabel (de standaard voor coach → client berichten).
// Vroeger las'm uit `coach_messages` — die tabel houden we als legacy
// fallback wanneer er geen actieve notificatie is.
// ============================================
const COACH_PHOTO_URL = 'https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg'

function CoachNoteCard({ client, db }) {
  const isMobile = useIsMobile()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client?.id || !db?.supabase) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
      // 1) Probeer eerst de laatste actieve notification (uit `notifications`).
      const { data: notifData, error: notifErr } = await db.supabase
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('client_id', client.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      if (cancelled) return
      if (notifErr) console.error('Load coach note (notifications) failed:', notifErr)
      if (notifData && notifData.length > 0) {
        const n = notifData[0]
        setNote({ id: n.id, title: n.title, body: n.message, created_at: n.created_at })
        setLoading(false)
        return
      }

      // 2) Fallback: laatste coach_messages-entry (legacy).
      const { data: msgData, error: msgErr } = await db.supabase
        .from('coach_messages')
        .select('id, title, body, created_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (cancelled) return
      if (msgErr) console.error('Load coach note (coach_messages) failed:', msgErr)
      setNote(msgData && msgData.length > 0 ? msgData[0] : null)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  if (loading || !note) return null

  const dateLabel = (() => {
    const d = new Date(note.created_at)
    if (isNaN(d.getTime())) return ''
    const today = new Date(); today.setHours(0,0,0,0)
    const yest = new Date(today); yest.setDate(today.getDate() - 1)
    const dDay = new Date(d); dDay.setHours(0,0,0,0)
    if (dDay.getTime() === today.getTime()) return 'Vandaag'
    if (dDay.getTime() === yest.getTime()) return 'Gisteren'
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
  })()

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div style={{
        display: 'flex', gap: isMobile ? 12 : 14,
        alignItems: 'flex-start',
      }}>
        <img
          src={COACH_PHOTO_URL}
          alt="Coach"
          style={{
            width: isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,215,0,0.45)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 4,
            fontSize: isMobile ? '0.62rem' : '0.68rem',
            fontWeight: 800, color: '#FFD700',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Bericht van Kersten
            {dateLabel && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{dateLabel}</span>
              </>
            )}
          </div>
          {note.title && (
            <div style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em',
              lineHeight: 1.25,
              marginBottom: 4,
            }}>
              {note.title}
            </div>
          )}
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem',
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 500, lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}>
            {note.body}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// WEEK-DOEL & GEMIDDELDEN — primaire hero op de home pagina:
//   Bovenaan het huidige weekgemiddelde, daaronder de weekgemiddelden van
//   afgelopen weken, elk met of het weekdoel die week gehaald is.
//   Kleur van het verschil = richting (t.o.v. weekdoel); de badge = of de
//   doel-grootte gehaald is (bijv. doel -0,6 → minstens 0,6 kg eraf).
// ============================================
function WeekGoalStatus({ client, history = [] }) {
  const isMobile = useIsMobile()
  const goal = Number(client?.weekly_weight_goal)
  const hasGoal = client?.weekly_weight_goal != null && client?.weekly_weight_goal !== '' && Number.isFinite(goal) && goal !== 0

  const fmt = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }

  // Groepeer logs per kalenderweek (maandag-start) → gemiddelde per week,
  // nieuwste week bovenaan, met verschil t.o.v. de week ervoor.
  const weeks = (() => {
    if (!history || history.length === 0) return []
    const mondayOf = (date) => { const d = new Date(date); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0); return d.toISOString().split('T')[0] }
    const map = {}
    history.forEach(e => { const w = parseFloat(e.weight); if (!Number.isFinite(w)) return; const wk = mondayOf(e.date); (map[wk] = map[wk] || []).push(w) })
    const arr = Object.keys(map).sort().map(wk => {
      const vals = map[wk]
      const avg = Math.round((vals.reduce((t, v) => t + v, 0) / vals.length) * 10) / 10
      const end = new Date(wk); end.setDate(end.getDate() + 6)
      return { start: wk, end: end.toISOString().split('T')[0], avg, count: vals.length }
    })
    return arr.map((w, i) => ({ ...w, diff: i > 0 ? Math.round((w.avg - arr[i - 1].avg) * 10) / 10 : null })).reverse()
  })()

  if (weeks.length === 0) return null
  const currentAvg = weeks[0].avg

  // Doel gehaald deze week = verandering in de doel-richting én minstens de
  // doel-grootte. null = niet te bepalen (geen doel of geen vorige week).
  const reached = (diff) => {
    if (diff == null || !hasGoal) return null
    if (Math.sign(diff) !== Math.sign(goal)) return false
    return Math.abs(diff) >= Math.abs(goal) - 0.001
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
        lineHeight: 1.2, margin: 0, marginBottom: isMobile ? '1rem' : '1.25rem',
      }}>
        Jouw weekdoel
      </h2>

      {/* Huidig weekgemiddelde — bovenaan, prominent */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? '1.1rem' : '1.35rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Huidig gemiddelde</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
            <span style={{ fontSize: isMobile ? '2.4rem' : '2.8rem', fontWeight: 900, color: '#FFD700', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{currentAvg.toFixed(1)}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>kg</span>
          </div>
        </div>
        {hasGoal && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Weekdoel</div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{goal > 0 ? '+' : ''}{goal} <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>kg/week</span></div>
          </div>
        )}
      </div>

      {/* Weekgemiddelden onder elkaar — nieuwste bovenaan */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        {weeks.map((w, idx) => {
          const ok = reached(w.diff)
          const diffColor = w.diff == null ? 'rgba(255,255,255,0.3)' : weightGoalColor(w.diff, goal)
          return (
            <div key={w.start} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.8rem 1rem' : '0.9rem 1.15rem', borderBottom: idx < weeks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontVariantNumeric: 'tabular-nums' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 800, color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.7)' }}>{idx === 0 ? 'Deze week' : `${fmt(w.start)} – ${fmt(w.end)}`}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{idx === 0 ? `${fmt(w.start)} – ${fmt(w.end)} · ` : ''}{w.count} meting{w.count === 1 ? '' : 'en'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: idx === 0 ? '#FFD700' : '#fff', letterSpacing: '-0.02em' }}>{w.avg.toFixed(1)}<span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5 }}> kg</span></span>
                {w.diff !== null && (
                  <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 800, color: diffColor, minWidth: 40, textAlign: 'right' }}>{w.diff > 0 ? '+' : ''}{w.diff}</span>
                )}
                {ok !== null && w.diff !== null && (
                  <span style={{ fontSize: '0.54rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', padding: '0.18rem 0.4rem', borderRadius: 6, whiteSpace: 'nowrap',
                    color: ok ? '#10b981' : 'rgba(255,255,255,0.4)',
                    background: ok ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${ok ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                    {ok ? '✓ gehaald' : 'niet gehaald'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// WEIGHT LOG CARD — recente weeglogs, groen/rood t.o.v. het weekdoel.
//   De coach zet clients.weekly_weight_goal (+ = aankomen, - = afvallen).
//   Elke meting kleurt groen als'ie de goede kant op beweegt, rood zo niet.
// ============================================
function WeightLogCard({ history = [], weeklyGoal }) {
  const isMobile = useIsMobile()
  if (!history || history.length < 2) return null

  const fmt = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }
  const goalNum = Number(weeklyGoal)
  const hasGoal = weeklyGoal != null && weeklyGoal !== '' && Number.isFinite(goalNum) && goalNum !== 0
  const recent = history.slice(0, 6) // nieuwste-eerst

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: isMobile ? '0.85rem' : '1rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
          lineHeight: 1.2, margin: 0,
        }}>
          Je gewicht
        </h2>
        {hasGoal && (
          <span style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
            doel {goalNum > 0 ? '+' : ''}{goalNum} kg/week
          </span>
        )}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {recent.map((e, idx) => {
          const prev = history[idx + 1] // chronologisch vorige meting
          const w = Number(e.weight)
          const pw = prev ? Number(prev.weight) : null
          const delta = pw != null && Number.isFinite(w) && Number.isFinite(pw)
            ? Math.round((w - pw) * 10) / 10 : null
          const color = delta === null ? 'rgba(255,255,255,0.3)' : weightGoalColor(delta, weeklyGoal)
          return (
            <div key={`${e.date}-${idx}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.15rem',
              borderBottom: idx < recent.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontVariantNumeric: 'tabular-nums',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Richting-stip */}
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: delta ? `0 0 8px ${color}66` : 'none' }} />
                <span style={{ fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{fmt(e.date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: idx === 0 ? '#FFD700' : '#fff', letterSpacing: '-0.02em' }}>
                  {Number.isFinite(w) ? w.toFixed(1) : '—'} <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5 }}>kg</span>
                </span>
                {delta !== null && delta !== 0 && (
                  <span style={{ fontSize: isMobile ? '0.8rem' : '0.88rem', fontWeight: 800, color, minWidth: 44, textAlign: 'right' }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// GOAL CARD
// ============================================
function GoalCard({ client, currentWeight }) {
  const isMobile = useIsMobile()

  // Bepaal welke goal-tekst we tonen. Eerst primary_goal, dan goal, anders fallback.
  const primaryGoalText = (client?.primary_goal || client?.goal || '').trim()

  // Weight: huidig komt uit een echte log (weight_challenge_logs latest)
  // wanneer clients.current_weight niet gevuld is. Bovenliggende component
  // resolved dit voor ons.
  const start = Number(client?.start_weight) || null
  const goal  = Number(client?.goal_weight) || null
  const current = Number(currentWeight) || Number(client?.current_weight) || null
  const hasWeight = start && goal && start !== goal

  const deadlineStr = client?.goal_deadline
  const daysLeft = (() => {
    if (!deadlineStr) return null
    const diff = (new Date(deadlineStr).getTime() - Date.now()) / 86400000
    return Math.round(diff)
  })()

  if (!primaryGoalText && !hasWeight && daysLeft == null) {
    // Niks om te tonen.
    return null
  }

  return (
    <div>
      <SectionLabel icon={Target} label="Jouw doel" isMobile={isMobile} />
      <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: isMobile ? '1rem 1.1rem' : '1.2rem 1.35rem',
        }}>
        {primaryGoalText && (
          <div style={{
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
            marginBottom: hasWeight || daysLeft != null ? '0.7rem' : 0,
          }}>
            {primaryGoalText}
          </div>
        )}

        {(hasWeight || daysLeft != null) && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.85rem',
            marginTop: primaryGoalText ? 0 : '0.2rem',
          }}>
            {hasWeight && (
              <div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 3,
                }}>
                  Gewicht
                </div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: 800, color: '#fff',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  display: 'flex', alignItems: 'baseline', gap: 4,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{start}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                  {current && current !== start && (
                    <>
                      <span style={{ color: '#fff' }}>{current}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                    </>
                  )}
                  <span style={{ color: '#FFD700' }}>{goal}</span>
                  <span style={{ fontSize: '0.7em', color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>kg</span>
                </div>
              </div>
            )}
            {daysLeft != null && (
              <div>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 800,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 3,
                }}>
                  Deadline
                </div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  fontWeight: 800, color: '#fff',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}>
                  {daysLeft > 0 ? `nog ${daysLeft}` : (daysLeft === 0 ? 'vandaag' : `${Math.abs(daysLeft)} over tijd`)}
                  {daysLeft !== 0 && (
                    <span style={{ fontSize: '0.7em', color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>dgn</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}


// ============================================
// ACTION ITEMS
// ============================================
function ActionItems({ client, db }) {
  const isMobile = useIsMobile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error } = await db.supabase
        .from('client_action_items')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!cancelled) {
        if (error) console.error('Load action items failed:', error)
        setItems(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [client?.id, db])

  const toggle = async (item) => {
    const nextStatus = item.status === 'done' ? 'open' : 'done'
    const nextCompleted = nextStatus === 'done' ? new Date().toISOString() : null
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, status: nextStatus, completed_at: nextCompleted }
      : i))
    const { error } = await db.supabase
      .from('client_action_items')
      .update({ status: nextStatus, completed_at: nextCompleted })
      .eq('id', item.id)
    if (error) {
      console.error('Toggle action item failed:', error)
      // Rollback
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
    }
  }

  const open = items.filter(i => i.status !== 'done')
  const done = items.filter(i => i.status === 'done')

  if (loading) return null
  // Sectie pas tonen als er actie-items zijn (anders is'ie lege ruimte).
  if (items.length === 0) return null

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const today = new Date(); today.setHours(0,0,0,0)
      const yest = new Date(today); yest.setDate(today.getDate() - 1)
      const dDay = new Date(d); dDay.setHours(0,0,0,0)
      if (dDay.getTime() === today.getTime()) return 'Vandaag'
      if (dDay.getTime() === yest.getTime()) return 'Gisteren'
      return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  return (
    <div>
      <div style={{
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        marginBottom: isMobile ? '0.7rem' : '0.85rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: isMobile ? '0.65rem' : '0.72rem',
          fontWeight: 800, color: '#FFD700',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          opacity: 0.85,
        }}>
          <ListChecks size={isMobile ? 13 : 14} strokeWidth={2.4} />
          Acties
        </div>
        {open.length > 0 && (
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, color: '#FFD700',
            padding: '0.18rem 0.55rem',
            background: 'rgba(255,215,0,0.12)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {open.length} open
          </div>
        )}
      </div>

      <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: isMobile ? '0.95rem 1.05rem' : '1.1rem 1.35rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {open.map(item => (
            <ActionRow key={item.id} item={item} onToggle={toggle} isMobile={isMobile} formatDate={formatDate} />
          ))}
        </div>

        {done.length > 0 && (
          <div style={{ marginTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.7rem' }}>
            <button
              onClick={() => setShowCompleted(v => !v)}
              style={{
                background: 'transparent', border: 'none', padding: 0,
                fontSize: '0.7rem', fontWeight: 800,
                color: 'rgba(255,255,255,0.55)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {showCompleted ? '−' : '+'} {done.length} afgerond
            </button>
            {showCompleted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.55rem' }}>
                {done.map(item => (
                  <ActionRow key={item.id} item={item} onToggle={toggle} isMobile={isMobile} formatDate={formatDate} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function ActionRow({ item, onToggle, isMobile, formatDate }) {
  const done = item.status === 'done'
  const SourceIcon = ({ source }) => {
    const s = (source || '').toLowerCase()
    if (s === 'call') return <Phone size={11} strokeWidth={2.4} />
    if (s === 'whatsapp') return <MessageCircle size={11} strokeWidth={2.4} />
    return null
  }
  return (
    <button
      onClick={() => onToggle(item)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '0.55rem 0.7rem',
        background: done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{
        width: 22, height: 22, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>
        {done
          ? <CheckCircle2 size={20} color="#10b981" strokeWidth={2.4} />
          : <Circle size={20} color="rgba(255,255,255,0.35)" strokeWidth={2} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: 700,
          color: done ? 'rgba(255,255,255,0.45)' : '#fff',
          textDecoration: done ? 'line-through' : 'none',
          lineHeight: 1.35,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {item.text}
        </div>
        {(item.source || item.created_at || item.due_date) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 4,
            fontSize: '0.66rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
          }}>
            {item.source && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <SourceIcon source={item.source} />
                {item.source}
              </span>
            )}
            {item.created_at && (
              <span style={{ opacity: 0.7 }}>
                {formatDate(item.created_at)}
              </span>
            )}
            {item.due_date && !done && (
              <span style={{ color: '#FFD700', fontWeight: 800 }}>
                · uiterlijk {formatDate(item.due_date)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================
// MAIN CLIENT HOME
// ============================================
export default function ClientHome({ client, db, setCurrentView }) {
  const [loading, setLoading] = useState(true)
  const [weightHistory, setWeightHistory] = useState([])
  const isMobile = useIsMobile()

  useEffect(() => { setTimeout(() => setLoading(false), 300) }, [])

  // Gewicht-logs uit weight_challenge_logs (source-of-truth; clients.current_weight
  // is vaak NULL). Nieuwste-eerst — [0] = huidig gewicht, de rest voor de log-kaart.
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await db.supabase
        .from('weight_challenge_logs')
        .select('weight, date, is_friday_weighin')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(60)
      if (cancelled) return
      if (error) {
        console.error('Load weight logs failed:', error)
        return
      }
      if (data && data.length > 0) {
        setWeightHistory(data)
      }
    })()
    return () => { cancelled = true }
  }, [client?.id, db])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.08)',
            borderTopColor: '#FFD700',
            borderRadius: '50%', margin: '0 auto 0.75rem',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', fontWeight: 600 }}>
            Laden…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: isMobile ? '9rem' : '6rem', background: '#0a0a0a' }}>
      <WelcomeSection client={client} />

      {/* Vandaag-overzicht: training, macro's over, water, volgende call. */}
      <div style={{ marginTop: isMobile ? '3.5rem' : '4.5rem' }}>
        <TodayCard client={client} db={db} setCurrentView={setCurrentView} isMobile={isMobile} />
      </div>


      {/* Hero: weekdoel + weekgemiddelden */}
      <FadeOnScroll>
        <div style={{ marginTop: isMobile ? '4rem' : '5rem' }}>
          <WeekGoalStatus client={client} history={weightHistory} />
        </div>
      </FadeOnScroll>

      {/* Weeglogs — groen/rood t.o.v. het weekdoel dat de coach instelt */}
      <FadeOnScroll>
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <WeightLogCard history={weightHistory} weeklyGoal={client?.weekly_weight_goal} />
        </div>
      </FadeOnScroll>

      {/* Challenge-banner alleen tonen als'ie actief is — bewust krappe ruimte
          (visueel gegroepeerd met de progressie hierboven, en rendert soms niet). */}
      <FadeOnScroll>
        <div style={{ marginTop: isMobile ? '0.5rem' : '0.75rem' }}>
          <ChallengeHomeBanner db={db} client={client} />
        </div>
      </FadeOnScroll>

      <FadeOnScroll>
        <div style={{ marginTop: isMobile ? '4.5rem' : '5.5rem' }}>
          <ActionItems client={client} db={db} />
        </div>
      </FadeOnScroll>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
