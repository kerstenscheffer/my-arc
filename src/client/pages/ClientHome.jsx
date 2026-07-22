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
  const endStr = client?.subscription_end_date
  let curWeek = null, weeksTotal = null
  if (startStr) {
    const start = new Date(startStr)
    const elapsedWeeks = Math.floor(Math.max(0, (today.getTime() - start.getTime()) / 86400000) / 7)
    if (endStr) {
      const end = new Date(endStr)
      weeksTotal = Math.ceil(Math.max(1, (end.getTime() - start.getTime()) / 86400000) / 7)
      curWeek = Math.min(weeksTotal, elapsedWeeks + 1)
    } else {
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
// PROGRESS TOWARDS GOAL — primaire hero op de home pagina:
//   "Je komt van X kg, zit nu op Y kg. Doel = Z kg. Traject loopt af op DATE."
// Toont een gouden progress-bar van start → doel met huidige positie.
// ============================================
function ProgressTowardsGoal({ client, currentWeight }) {
  const isMobile = useIsMobile()

  const start   = Number(client?.start_weight) || null
  const goal    = Number(client?.goal_weight) || null
  const current = Number(currentWeight) || Number(client?.current_weight) || null

  // Niks om te tonen als de weight-data ontbreekt.
  if (!start || !goal || !current) return null

  // Berekening: hoeveel % van het verschil heeft client afgelegd?
  const totalDelta = Math.abs(goal - start) || 1
  const doneDelta  = Math.abs(current - start)
  const remaining  = Math.abs(current - goal).toFixed(1)
  const pct = Math.max(0, Math.min(100, Math.round((doneDelta / totalDelta) * 100)))
  const losingWeight = goal < start

  // Eind-datum: subscription_end_date is leidend, anders coaching_start_date
  // + standaard traject-lengte onbekend → laat'm weg.
  const endStr = client?.subscription_end_date
  let endLabel = null
  if (endStr) {
    const d = new Date(endStr)
    if (!isNaN(d.getTime())) {
      endLabel = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      {/* Heading — bold wit, geen card eromheen */}
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: 900, color: '#fff',
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
        margin: 0,
        marginBottom: isMobile ? '1rem' : '1.25rem',
      }}>
        Jouw progressie richting doel
      </h2>

      {/* Progress bar — start → doel met huidig gewicht als middenpunt-label */}
      <div style={{ position: 'relative', marginTop: isMobile ? '0.5rem' : '0.65rem' }}>
        <div style={{
          height: 10, borderRadius: 5,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #FFD700 0%, #D4AF37 100%)',
            borderRadius: 5,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginTop: 10,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.015em',
          }}>
            Start <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{start} kg</span>
          </span>
          <span style={{
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            fontWeight: 900, color: '#FFD700',
            letterSpacing: '-0.02em',
          }}>
            {current} kg
          </span>
          <span style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.015em',
          }}>
            Doel <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{goal} kg</span>
          </span>
        </div>
      </div>

      {/* Nog te gaan + traject einde — minimal */}
      <div style={{
        marginTop: isMobile ? '0.9rem' : '1.1rem',
        fontSize: isMobile ? '0.8rem' : '0.88rem',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600, lineHeight: 1.5,
        textAlign: 'center',
      }}>
        Nog <strong style={{ color: '#fff', fontWeight: 800 }}>{remaining} kg</strong>{' '}
        te {losingWeight ? 'verliezen' : 'winnen'}
        {endLabel && (
          <> · traject loopt af op <strong style={{ color: '#fff', fontWeight: 800 }}>{endLabel}</strong></>
        )}
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
  const [latestWeight, setLatestWeight] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => { setTimeout(() => setLoading(false), 300) }, [])

  // Huidig gewicht uit logs. clients.current_weight is vaak NULL omdat we
  // weight_challenge_logs als source-of-truth gebruiken.
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await db.supabase
        .from('weight_challenge_logs')
        .select('weight, date')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)
      if (cancelled) return
      if (error) {
        console.error('Load latest weight failed:', error)
        return
      }
      if (data && data.length > 0) setLatestWeight(data[0].weight)
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


      {/* Hero: progressie richting doel */}
      <FadeOnScroll>
        <div style={{ marginTop: isMobile ? '4rem' : '5rem' }}>
          <ProgressTowardsGoal client={client} currentWeight={latestWeight} />
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
