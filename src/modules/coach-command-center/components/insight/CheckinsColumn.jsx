// src/modules/coach-command-center/components/insight/CheckinsColumn.jsx
// 5e column in CoachInsight — read-only weekly check-in history per client.
// Loads via existing CheckinService. Each submission is a tappable card
// that expands to show all section scores + notes + coach fields.

import React, { useEffect, useState } from 'react'
import {
  ClipboardCheck, ChevronDown, ChevronRight,
  Utensils, Beer, Moon, Dumbbell, Heart, Zap, Trophy, AlertTriangle,
  Calendar, MessageSquare,
} from 'lucide-react'
import CheckinService from '../../../client-checkin/CheckinService'

const G = {
  primary:    '#fff',
  secondary:  '#D4AF37',
  bg:         'rgba(255, 215, 0, 0.06)',
  bgStrong:   'rgba(255, 215, 0, 0.12)',
  border:     'rgba(255, 215, 0, 0.18)',
  textDim:    'rgba(255, 255, 255, 0.45)',
  textFaint:  'rgba(255, 255, 255, 0.25)',
  good:       '#10b981',
  warn:       '#f59e0b',
  bad:        '#ef4444',
}

const fmtDate = (d) => {
  if (!d) return '-'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

// Score color: red <5, amber 5-6, gold 7-8, green 9-10
const scoreColor = (n) => {
  const v = parseFloat(n)
  if (!Number.isFinite(v) || v <= 0) return G.textFaint
  if (v >= 9) return G.good
  if (v >= 7) return G.primary
  if (v >= 5) return G.warn
  return G.bad
}

const overallScore = (c) => {
  // Het formulier vanaf sep 2026 (versie 2) heeft nog maar één score:
  // energie. Die als "gemiddelde" presenteren suggereert een totaalbeeld dat
  // er niet is — dus geen cijfer tonen bij die check-ins.
  if (c?.formulier_versie === 2) return null
  const fields = ['voeding_score', 'training_score', 'slaap_score', 'weekend_score', 'energie_score', 'motivatie_score']
  const vals = fields.map(f => parseFloat(c[f])).filter(v => Number.isFinite(v) && v > 0)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 10) / 10
}

const SECTIONS = [
  { id: 'voeding',  Icon: Utensils, label: 'Voeding',  scoreField: 'voeding_score',  notesField: 'voeding_notes',
    extra: [{ field: 'voeding_suikers', label: 'Plan' }] },
  { id: 'training', Icon: Dumbbell, label: 'Training', scoreField: 'training_score', notesField: 'training_notes',
    extra: [{ field: 'training_sessies', label: 'Sessies' }, { field: 'training_intensiteit', label: 'Intensiteit' }] },
  { id: 'slaap',    Icon: Moon,     label: 'Slaap',    scoreField: 'slaap_score',    notesField: 'slaap_notes',
    extra: [{ field: 'slaap_uren', label: 'Uren' }, { field: 'slaap_kwaliteit', label: 'Kwaliteit' }, { field: 'slaap_ritme', label: 'Ritme' }] },
  { id: 'weekend',  Icon: Beer,     label: 'Weekend',  scoreField: 'weekend_score',  notesField: 'weekend_notes',
    extra: [{ field: 'weekend_alcohol', label: 'Alcohol' }, { field: 'weekend_cheat', label: 'Uitschieters' }] },
]

// ── Single expandable check-in card ───────────────────────────────
function CheckinCard({ checkin, isMobile }) {
  const [open, setOpen] = useState(false)
  const score = overallScore(checkin)
  const reviewed = !!checkin.reviewed_at
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: isMobile ? '0.625rem 0.75rem' : '0.7rem 0.875rem',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Score circle */}
        <div style={{
          width: '38px', height: '38px',
          borderRadius: '50%',
          background: G.bg,
          border: `1.5px solid ${score ? scoreColor(score) : G.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '0.85rem', fontWeight: 900,
            color: score ? scoreColor(score) : G.textFaint,
            letterSpacing: '-0.02em',
          }}>
            {score ?? '–'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '0.15rem',
          }}>
            <Calendar size={10} color={G.textFaint} />
            <span style={{
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: 700, color: '#fff',
              textTransform: 'capitalize',
            }}>
              {fmtDate(checkin.checkin_date)}
            </span>
            {reviewed && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 800,
                color: G.good, padding: '0.1rem 0.3rem',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: '3px', letterSpacing: '-0.01em',
              }}>
                ✓ Gelezen
              </span>
            )}
          </div>
          <div style={{
            display: 'flex', gap: '0.4rem', alignItems: 'center',
            fontSize: '0.72rem', color: G.textFaint, fontWeight: 600,
          }}>
            {SECTIONS.map(s => {
              const v = checkin[s.scoreField]
              if (!v) return null
              return (
                <span key={s.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
                  color: scoreColor(v),
                }}>
                  <s.Icon size={9} />
                  <span style={{ fontWeight: 800 }}>{v}</span>
                </span>
              )
            })}
          </div>
        </div>
        <div style={{ flexShrink: 0, color: G.textFaint }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div style={{
          padding: isMobile ? '0 0.75rem 0.75rem' : '0 0.875rem 0.875rem',
          background: 'rgba(255,255,255,0.015)',
        }}>
          {/* Energy + motivation pills */}
          {(checkin.energie_score || checkin.motivatie_score) && (
            <div style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem 0' }}>
              {checkin.energie_score && (
                <ScorePill label="Energie" value={checkin.energie_score}>
                  <Zap size={10} color={scoreColor(checkin.energie_score)} />
                </ScorePill>
              )}
              {checkin.motivatie_score && (
                <ScorePill label="Motivatie" value={checkin.motivatie_score}>
                  <Heart size={10} color={scoreColor(checkin.motivatie_score)} />
                </ScorePill>
              )}
            </div>
          )}

          {/* Openingsvraag — staat vooraan omdat het de toon van de week zet. */}
          {checkin.hoe_gaat_het && (
            <NoteBlock label="Hoe het gaat" text={checkin.hoe_gaat_het} accent={G.primary}>
              <MessageSquare size={10} />
            </NoteBlock>
          )}

          {/* Harde cijfers uit het formulier vanaf sep 2026. De oude
              secties hieronder blijven leeg bij zo'n check-in en vallen
              vanzelf weg; deze rij vervangt ze. */}
          {checkin.formulier_versie === 2 && (() => {
            const vul = (v) => v !== null && v !== undefined && v !== ''
            const rijen = [
              { label: 'Trainingen', val: vul(checkin.training_gedaan)
                  ? `${checkin.training_gedaan}${vul(checkin.training_gepland) ? `/${checkin.training_gepland}` : ''}` : null },
              { label: 'Gelogd',     val: checkin.training_gelogd },
              { label: 'Tot falen',  val: checkin.training_falen },
              { label: 'Gewogen',    val: vul(checkin.dagen_gewogen) ? `${checkin.dagen_gewogen}/7` : null },
              { label: 'Op plan',    val: vul(checkin.dagen_voeding) ? `${checkin.dagen_voeding}/7` : null },
              { label: 'Alcohol',    val: vul(checkin.alcohol_aantal) ? `${checkin.alcohol_aantal}` : null },
              { label: 'Slaap',      val: vul(checkin.slaap_uren_gem) ? `${checkin.slaap_uren_gem}u` : null },
            ].filter(r => vul(r.val))
            if (!rijen.length) return null
            return (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                gap: 6, padding: '0.5rem 0',
              }}>
                {rijen.map(r => (
                  <div key={r.label} style={{
                    padding: '0.4rem 0.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                  }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: G.textFaint }}>{r.label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{r.val}</div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Wins / struggles */}
          {checkin.wins && (
            <NoteBlock label="Wins" text={checkin.wins} accent={G.good}>
              <Trophy size={10} />
            </NoteBlock>
          )}
          {checkin.struggles && (
            <NoteBlock label="Struggles" text={checkin.struggles} accent={G.warn}>
              <AlertTriangle size={10} />
            </NoteBlock>
          )}

          {checkin.vastgelopen && (
            <NoteBlock label="Vastgelopen op" text={checkin.vastgelopen} accent={G.warn}>
              <AlertTriangle size={10} />
            </NoteBlock>
          )}

          {/* Client's ask: "Wat kan ik voor je doen?" — gold so it stands out */}
          {checkin.algemeen_help && (
            <NoteBlock label="Vraagt jou" text={checkin.algemeen_help} accent={G.primary}>
              <MessageSquare size={10} />
            </NoteBlock>
          )}

          {/* Per-section detail */}
          {SECTIONS.map(s => {
            const score = checkin[s.scoreField]
            const notes = checkin[s.notesField]
            const extras = s.extra.map(e => ({ label: e.label, val: checkin[e.field] })).filter(e => e.val)
            if (!score && !notes && extras.length === 0) return null
            return (
              <SectionBlock key={s.id} section={s} score={score} notes={notes} extras={extras} />
            )
          })}

          {/* Coach fields if filled */}
          {checkin.coach_notes && (
            <NoteBlock label="Coach notes" text={checkin.coach_notes} accent={G.primary}>
              <MessageSquare size={10} />
            </NoteBlock>
          )}
        </div>
      )}
    </div>
  )
}

const ScorePill = ({ children, label, value }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.25rem 0.5rem',
    background: G.bg, border: `1px solid ${G.border}`,
    borderRadius: '6px',
  }}>
    {children}
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: G.textDim, letterSpacing: '-0.01em' }}>
      {label}
    </span>
    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: scoreColor(value) }}>
      {value}
    </span>
  </div>
)

const NoteBlock = ({ children, label, text, accent }) => (
  <div style={{
    margin: '0.3rem 0',
    padding: '0.4rem 0.55rem',
    background: 'rgba(255,255,255,0.025)',
    borderLeft: `2px solid ${accent}`,
    borderRadius: '0 6px 6px 0',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.72rem', fontWeight: 800, color: accent,
      letterSpacing: '-0.01em',
      marginBottom: '0.2rem',
    }}>
      {children}
      {label}
    </div>
    <div style={{
      fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)',
      lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      {text}
    </div>
  </div>
)

const SectionBlock = ({ section, score, notes, extras }) => (
  <div style={{
    margin: '0.4rem 0',
    padding: '0.4rem 0.55rem',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '6px',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      marginBottom: extras.length > 0 || notes ? '0.3rem' : 0,
    }}>
      <section.Icon size={12} color={G.primary} />
      <span style={{
        fontSize: '0.72rem', fontWeight: 800, color: G.primary,
        letterSpacing: '-0.01em',
        flex: 1,
      }}>
        {section.label}
      </span>
      {score && (
        <span style={{
          fontSize: '0.75rem', fontWeight: 900,
          color: scoreColor(score),
        }}>
          {score}/10
        </span>
      )}
    </div>
    {extras.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.5rem', marginBottom: notes ? '0.25rem' : 0 }}>
        {extras.map((e, i) => (
          <div key={i} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
            <span style={{ color: G.textFaint }}>{e.label}:</span>{' '}
            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{e.val}</span>
          </div>
        ))}
      </div>
    )}
    {notes && (
      <div style={{
        fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)',
        lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontStyle: 'italic',
      }}>
        “{notes}”
      </div>
    )}
  </div>
)

// ── Main column ──────────────────────────────────────────────────
export default function CheckinsColumn({ client, db, isMobile }) {
  const [checkins, setCheckins] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    // CheckinService expects the DatabaseService wrapper (it reads .supabase
    // off it internally). Passing db.supabase directly results in queries
    // running against `undefined` and failing silently.
    const service = new CheckinService(db)
    setLoading(true)
    service.getClientCheckins(client.id, 12)
      .then(rows => { if (!cancelled) setCheckins(rows || []) })
      .catch(() => { if (!cancelled) setCheckins([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [client?.id, db])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <ClipboardCheck size={14} color={G.primary} />
        <span style={{
          fontSize: '0.75rem', fontWeight: 700, color: G.primary,
          letterSpacing: '-0.01em', flex: 1,
        }}>
          Check-ins
        </span>
        {checkins && checkins.length > 0 && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            padding: '0.15rem 0.4rem',
            background: G.bg, border: `1px solid ${G.border}`,
            borderRadius: '4px', color: G.primary,
          }}>
            {checkins.length}
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: G.textFaint, fontSize: '0.75rem' }}>
            Laden…
          </div>
        ) : !checkins || checkins.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <ClipboardCheck size={28} color="rgba(255,255,255,0.18)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
              Nog geen check-ins
            </div>
            <div style={{ fontSize: '0.72rem', color: G.textFaint, marginTop: '0.3rem' }}>
              Client heeft de wekelijkse vragenlijst nog niet ingevuld.
            </div>
          </div>
        ) : (
          checkins.map(c => (
            <CheckinCard key={c.id} checkin={c} isMobile={isMobile} />
          ))
        )}
      </div>
    </div>
  )
}
