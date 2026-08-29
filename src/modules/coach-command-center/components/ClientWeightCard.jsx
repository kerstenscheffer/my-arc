// src/modules/coach-command-center/components/ClientWeightCard.jsx
// v3.0 — styling-upgrade: goud, bold wit, simpel. Gestript tot de essentie
// (naam, doel, gewicht+datum, gewicht-progressie, notitie-log, insight-knop,
// deactiveer). Gradients eruit → solide #0a0a0a.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  TrendingDown, TrendingUp,
  MessageCircle, Power, MoreHorizontal, Trash2,
  BarChart3, BookOpen, Pause
} from 'lucide-react'
import DeleteClientModal from './DeleteClientModal'
import ClientInsightModal from './ClientInsightModal'
import CoachingLogModal from './CoachingLogModal'
import { weightGoalColor } from '../../weight-tracker/utils/weightGoalColor'

// Platte actieknop: geen vlak, geen rand — alleen icoon + woord. Drie
// omkaderde knoppen naast elkaar maakten de kaart onrustig.
const platteKnop = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  background: 'none', border: 'none', padding: 0,
  color: '#fff', fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const GOAL_LABELS = {
  afvallen: 'Afvallen', fat_loss: 'Afvallen', weight_loss: 'Afvallen',
  spieren: 'Spieropbouw', muscle_gain: 'Spieropbouw',
  recomp: 'Recomp', body_recomposition: 'Recomp',
  fitness: 'Fitter worden', general_fitness: 'Fitter worden',
}

export default function ClientWeightCard({ client, isMobile, onToggleStatus, onDeleted, showStatusToggle = false, onNavigatePlan, onNavigateWorkout, db, coachId, onOpenMealPanel, onOpenWorkoutPanel }) {
  const [showInsight, setShowInsight]   = useState(false)
  const [showLog, setShowLog]           = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const [showDelete, setShowDelete]     = useState(false)
  const [toggling, setToggling]         = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)

  const weightData    = client.weightData
  const latest        = weightData?.latest
  const history       = weightData?.history || []
  const isInactive    = client.status === 'inactive'

  const getTrend = () => {
    if (history.length < 2) return null
    const diff = history[0].weight - history[1].weight
    if (Math.abs(diff) < 0.1) return null
    return diff < 0 ? 'down' : 'up'
  }
  const trend = getTrend()

  const getUrgencyColor = () => {
    if (isInactive) return '#4b5563'
    const status = weightData?.weightStatus
    if (status === 'never' || status === 'overdue' || weightData?.fridayMissing) return '#ef4444'
    if (status === 'warning') return '#f59e0b'
    if (status === 'today' || status === 'recent') return '#10b981'
    return '#333'
  }

  // Kalenderweek-gemiddelden — appels met appels i.p.v. rollende 7-daagse
  // vensters. weekOffset 0 = deze week (Ma→Zo), -1 = vorige week, enz.
  const mondayOf = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const getCalendarWeekAvg = (weekOffset = 0) => {
    const monday = mondayOf(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    const entries = history.filter(e => {
      const d = new Date(e.date)
      return d >= monday && d <= sunday
    })
    if (entries.length === 0) return { avg: null, count: 0, monday, sunday }
    const avg = parseFloat(
      (entries.reduce((t, e) => t + parseFloat(e.weight), 0) / entries.length).toFixed(1)
    )
    return { avg, count: entries.length, monday, sunday }
  }
  const fmtWeekRange = (mon, sun) => {
    const fmt = d => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${fmt(mon)} – ${fmt(sun)}`
  }
  const thisWeek = getCalendarWeekAvg(0)
  const lastWeek = getCalendarWeekAvg(-1)
  const curAvg  = thisWeek.avg
  const prevAvg = lastWeek.avg
  const weekDiff = (curAvg !== null && prevAvg !== null)
    ? parseFloat((curAvg - prevAvg).toFixed(1))
    : null

  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstEntry  = sortedHistory[0]
  const latestEntry = sortedHistory[sortedHistory.length - 1]
  const totalChange = (firstEntry && latestEntry && sortedHistory.length >= 2)
    ? parseFloat((parseFloat(latestEntry.weight) - parseFloat(firstEntry.weight)).toFixed(1))
    : null
  const startDateLabel = firstEntry
    ? new Date(firstEntry.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null
  const totalEntries = sortedHistory.length

  const openWhatsApp = () => {
    let phone = client.phone || client.phone_number || ''
    phone = phone.replace(/[\s-]/g, '')
    if (phone.startsWith('0')) phone = '31' + phone.substring(1)
    phone = phone.replace(/\+/g, '')
    const msg = `Hey ${client.first_name || 'daar'}! Is het je gelukt om te wegen vanochtend? 💪`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  const hasPhone = !!(client.phone || client.phone_number)

  const handleToggle = async () => {
    if (toggling || !onToggleStatus) return
    setToggling(true)
    await onToggleStatus(client.id, client.status)
    setToggling(false)
    setShowMenu(false)
  }

  const urgencyColor = getUrgencyColor()

  const intakeDoel = client.coachingPlan?.plan?.intake_call_notes?.notes?.doel
  const goalRoute  = intakeDoel?.route || client.primary_goal || null
  const goalLabel  = GOAL_LABELS[goalRoute] || goalRoute || null

  const isPaused = client.coaching_status === 'paused'

  // Eén status-signaal: de linker-accentrand (urgentiekleur). Verder solide
  // #0a0a0a met een subtiele goud-rand — geen gradients, niet druk.
  const cardBorderLeft = `3px solid ${urgencyColor}`

  // Kerncijfers op de kaartregel: alleen wat je in één blik wilt zien.
  // "Deze week" en "Vorige week" zitten in de uitklap; het huidige gewicht
  // staat al bovenaan de kaart.
  const kernStats = [
    {
      label: 'Verschil',
      val: weekDiff !== null ? `${weekDiff > 0 ? '+' : ''}${weekDiff}` : '—',
      color: weekDiff !== null ? weightGoalColor(weekDiff, client) : 'rgba(255,255,255,0.4)',
    },
    {
      label: 'Sinds start',
      val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—',
      color: totalChange !== null ? weightGoalColor(totalChange, client) : 'rgba(255,255,255,0.4)',
    },
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: cardBorderLeft,
      borderRadius: isMobile ? '12px' : '14px',
      overflow: 'hidden', position: 'relative',
      transition: 'all 0.2s ease', transform: 'translateZ(0)',
      opacity: isInactive ? 0.55 : 1,
    }}>

      {/* ── PAUSE BANNER ── */}
      {isPaused && (
        <div style={{
          padding: '0.35rem 0.85rem',
          background: 'rgba(245,158,11,0.12)',
          borderBottom: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: '#f59e0b',
        }}>
          <Pause size={12} strokeWidth={2.8} fill="#f59e0b" />
          <span style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Coaching gepauzeerd
          </span>
        </div>
      )}

      {/* ── ROW 1 — naam · doel  |  gewicht · datum, alles op één regel ── */}
      <div style={{
        display: 'flex', alignItems: 'baseline',
        padding: isMobile ? '0.6rem 0.85rem 0.5rem' : '0.7rem 1rem 0.55rem',
        gap: isMobile ? '0.5rem' : '0.625rem',
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '0.4rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: isInactive ? '#6b7280' : '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, letterSpacing: '-0.01em' }}>
            {client.first_name} {client.last_name}
          </h3>
          {/* Doel achter de naam i.p.v. op een eigen regel eronder. */}
          {goalLabel && !isInactive && (
            <span style={{ flexShrink: 0, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              {goalLabel}
            </span>
          )}
          {isInactive && (
            <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, color: '#6b7280', whiteSpace: 'nowrap' }}>inactief</span>
          )}
        </div>

        {/* Gewicht + datum naast elkaar, niet onder elkaar. */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <span style={{ fontSize: isMobile ? '1.45rem' : '1.6rem', fontWeight: 900, color: isInactive ? '#6b7280' : '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {latest?.weight ? latest.weight.toFixed(1) : '—'}
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isInactive ? 'rgba(107,114,128,0.5)' : 'rgba(255,255,255,0.4)' }}>kg</span>
          {trend && !isInactive && (
            trend === 'down'
              ? <TrendingDown size={14} color="#10b981" />
              : <TrendingUp size={14} color="#ef4444" />
          )}
          {latest?.date && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              {new Date(latest.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* ── ROW 2 — kerncijfers links, acties rechts, op één regel ── */}
      {/* Alleen Verschil en Sinds start: deze week / vorige week staan in de
          uitklap en het huidige gewicht staat al op de regel hierboven. */}
      {/* Wrapt op smalle schermen: twee cijfers plus drie knoppen passen niet
          altijd op 375px. Past het wél, dan blijft het één regel. */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        rowGap: '0.45rem',
        padding: isMobile ? '0 0.85rem 0.6rem' : '0 1rem 0.65rem',
        gap: isMobile ? '0.7rem' : '1rem',
      }}>
        {!isInactive && !statsExpanded && (
          <button onClick={() => setStatsExpanded(true)}
            title="Toon alle weekcijfers"
            style={{
              display: 'flex', alignItems: 'baseline', gap: isMobile ? '0.7rem' : '0.95rem',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 1, minWidth: 0, overflow: 'hidden',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            {kernStats.map((st, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{st.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: st.color, lineHeight: 1 }}>{st.val}</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>kg</span>
              </span>
            ))}
          </button>
        )}

        {/* De drie acties zijn één blok. Los van elkaar waren het drie
            flex-items, en dan brak op een smalle kaart alleen de ⋯ af naar
            een eigen regel — een lege derde regel voor één knopje. Nu gaan
            ze samen naar de volgende regel of blijven ze samen staan. */}
        <div style={{
          display: 'flex', alignItems: 'center', flexShrink: 0,
          marginLeft: 'auto',
          gap: isMobile ? '0.7rem' : '1rem',
        }}>
        <button onClick={() => setShowLog(true)} style={platteKnop}>
          <BookOpen size={13} /> Log
        </button>
        <button onClick={() => setShowInsight(true)} style={platteKnop}>
          <BarChart3 size={13} /> Inzicht
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ ...platteKnop, color: showMenu ? '#fff' : 'rgba(255,255,255,0.5)' }}>
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '0.35rem', zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden', minWidth: '160px', boxShadow: '0 -8px 24px rgba(0,0,0,0.6)' }}>
                {hasPhone && !isInactive && (
                  <button onClick={() => { openWhatsApp(); setShowMenu(false) }} style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', color: '#25D366', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                )}
                {showStatusToggle && (
                  <button onClick={handleToggle} disabled={toggling} style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', borderTop: hasPhone && !isInactive ? '1px solid rgba(255,255,255,0.06)' : 'none', color: isInactive ? '#10b981' : '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: toggling ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', opacity: toggling ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Power size={15} /> {isInactive ? 'Activeer' : 'Deactiveer'}
                  </button>
                )}
                {/* Onomkeerbaar — de bevestiging zit in DeleteClientModal. */}
                <button onClick={() => { setShowDelete(true); setShowMenu(false) }} style={{ width: '100%', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <Trash2 size={15} /> Verwijderen
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Uitgeklapte weekcijfers — klik erop om weer in te klappen. */}
      {!isInactive && statsExpanded && (
        <div
                onClick={() => setStatsExpanded(false)}
                style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
                  padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                }}
              >
                {[
                  { label: 'Deze week (Ma-Zo)',   sub: thisWeek.count > 0 ? `${thisWeek.count} meting${thisWeek.count === 1 ? '' : 'en'} · ${fmtWeekRange(thisWeek.monday, thisWeek.sunday)}` : `geen metingen · ${fmtWeekRange(thisWeek.monday, thisWeek.sunday)}`, val: curAvg ?? '—', color: '#fff' },
                  { label: 'Vorige week (Ma-Zo)', sub: lastWeek.count > 0 ? `${lastWeek.count} meting${lastWeek.count === 1 ? '' : 'en'} · ${fmtWeekRange(lastWeek.monday, lastWeek.sunday)}` : `geen metingen · ${fmtWeekRange(lastWeek.monday, lastWeek.sunday)}`, val: prevAvg ?? '—', color: '#fff' },
                  { label: 'vs Vorige week', sub: weekDiff !== null ? 'verschil tussen weekgemiddelden' : 'geen vergelijking', val: weekDiff !== null ? `${weekDiff > 0 ? '+' : ''}${weekDiff}` : '—', color: weekDiff !== null ? weightGoalColor(weekDiff, client) : 'rgba(255,255,255,0.4)' },
                  { label: 'Sinds start', sub: startDateLabel ? `eerste meting · ${startDateLabel}` : 'geen startmeting', val: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange}` : '—', color: totalChange !== null ? weightGoalColor(totalChange, client) : 'rgba(255,255,255,0.4)' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '0.5rem 0.6rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>{s.label}</div>
                    <div style={{ fontSize: isMobile ? '1.2rem' : '1.3rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                      {s.val}<span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.5, marginLeft: 4 }}>kg</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.sub}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                  {totalEntries} meting{totalEntries === 1 ? '' : 'en'} totaal · klik om in te klappen
                </div>
              </div>
      )}

      {/* ── MODALS ── */}
      {showDelete && (
        <DeleteClientModal db={db} client={client} isMobile={isMobile}
          onClose={() => setShowDelete(false)}
          onDeleted={(id) => { setShowDelete(false); onDeleted?.(id) }} />
      )}

      {showInsight && createPortal(
        <ClientInsightModal
          isOpen={showInsight}
          onClose={() => setShowInsight(false)}
          client={client}
          isMobile={isMobile}
          onNavigatePlan={onNavigatePlan}
          onNavigateWorkout={onNavigateWorkout}
          db={db}
          coachId={coachId}
          onOpenMealPanel={onOpenMealPanel}
          onOpenWorkoutPanel={onOpenWorkoutPanel}
          onSwitchToClientView={(c) => {
            localStorage.setItem('coachPreviewClientId', c.id)
            localStorage.setItem('isClientMode', 'true')
            // CoachHub gebruikt hash-tabs (bv. /#command). Alleen href='/' zetten
            // verandert dan enkel de hash → geen volledige reload → App leest
            // isClientMode niet opnieuw. Forceer daarom een echte reload.
            if (window.location.pathname !== '/') {
              window.location.href = '/'
            } else {
              window.location.hash = ''
              window.location.reload()
            }
          }}
        />,
        document.body
      )}

      {showLog && createPortal(
        <CoachingLogModal
          client={client}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowLog(false)}
        />,
        document.body
      )}
    </div>
  )
}
