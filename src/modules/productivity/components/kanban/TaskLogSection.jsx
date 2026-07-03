// src/modules/productivity/components/kanban/TaskLogSection.jsx
// Daily log + history for a recurring task. Lives inside AddTaskModal
// (edit-mode). Today's answers autosave with a debounce so the coach can
// just type and tab away.

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Calendar, History, Loader2, ChevronDown } from 'lucide-react'
import TaskLogService from '../../TaskLogService'

const AUTOSAVE_MS = 700

const QUESTIONS = [
  { key: 'hoe_ging_het',  label: 'Hoe ging het vandaag?',       placeholder: 'Korte samenvatting van vandaag…', rows: 2 },
  { key: 'wat_ging_goed', label: 'Wat ging er goed (concreet)?', placeholder: 'Bv. "5 DMs binnen 30 min verstuurd"', rows: 2 },
  { key: 'morgen_beter',  label: 'Wat kan je morgen beter doen (concreet)?', placeholder: 'Bv. "Eerst 10 leads scrapen, dan pas DM"', rows: 2 },
]

const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function TaskLogSection({ taskId, coachId, db, isMobile }) {
  const [service] = useState(() => new TaskLogService(db))
  const [today] = useState(() => TaskLogService.todayISO())

  const [todayLog, setTodayLog] = useState({
    hoe_ging_het: '', wat_ging_goed: '', genoeg_score: null, morgen_beter: '',
  })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  // Which past log the prominent "Vorige keer"-card shows. Defaults to the
  // most recent non-today entry; the dropdown lets the coach scroll back.
  const [selectedPastDate, setSelectedPastDate] = useState(null)
  const [savingState, setSavingState] = useState('idle') // idle | saving | saved
  const debounceRef = useRef(null)
  const skipFirstSaveRef = useRef(true)

  // Load today's row + recent history on mount / when taskId changes.
  useEffect(() => {
    if (!taskId || !coachId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [t, hist] = await Promise.all([
          service.getOne(taskId, today),
          service.listForTask(taskId, 20),
        ])
        if (cancelled) return
        if (t) {
          setTodayLog({
            hoe_ging_het:  t.hoe_ging_het  || '',
            wat_ging_goed: t.wat_ging_goed || '',
            genoeg_score:  t.genoeg_score  ?? null,
            morgen_beter:  t.morgen_beter  || '',
          })
        }
        setHistory(hist)
      } finally {
        if (!cancelled) {
          setLoading(false)
          // Skip the first save effect-fire so loading the row doesn't
          // immediately re-upsert it.
          setTimeout(() => { skipFirstSaveRef.current = false }, 50)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [taskId, coachId, today, service])

  // Autosave whenever the form changes.
  useEffect(() => {
    if (!taskId || !coachId || skipFirstSaveRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSavingState('saving')
      try {
        const saved = await service.upsert(taskId, coachId, today, todayLog)
        setSavingState('saved')
        // Update history if today's row was new.
        setHistory(prev => {
          const without = prev.filter(h => h.log_date !== today)
          return [{ ...saved }, ...without]
        })
      } catch {
        setSavingState('idle')
      }
    }, AUTOSAVE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [todayLog, taskId, coachId, today, service])

  const setField = (key, value) => setTodayLog(prev => ({ ...prev, [key]: value }))

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.5rem 0.65rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
    color: '#fff', fontSize: '0.8rem', fontWeight: 500,
    lineHeight: 1.4, outline: 'none', resize: 'vertical',
    fontFamily: 'inherit',
  }

  // All prior logs (excluding today), newest first.
  const priorLogs = useMemo(
    () => history.filter(h => h.log_date !== today),
    [history, today]
  )
  // The log shown in the prominent "Vorige keer" preview. Defaults to the
  // newest prior log; dropdown lets the coach pick an earlier date.
  const lastLog = useMemo(() => {
    if (!priorLogs.length) return null
    if (selectedPastDate) {
      const m = priorLogs.find(h => h.log_date === selectedPastDate)
      if (m) return m
    }
    return priorLogs[0]
  }, [priorLogs, selectedPastDate])

  return (
    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* ── VORIGE KEER preview ─────────────────────────────────────────── */}
      {lastLog && (
        <div style={{
          marginBottom: '0.85rem',
          padding: '0.65rem 0.7rem',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.10), rgba(255,215,0,0.04))',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6,
          }}>
            <Calendar size={10} color="#FFD700" />
            <span style={{
              fontSize: '0.52rem', fontWeight: 800, color: '#FFD700',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Vorige keer
            </span>
            {/* Date picker dropdown — scroll back through earlier log entries
                without having to scan the full history list below. */}
            {priorLogs.length > 1 ? (
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={lastLog.log_date}
                  onChange={(e) => setSelectedPastDate(e.target.value)}
                  style={{
                    appearance: 'none', WebkitAppearance: 'none',
                    padding: '2px 18px 2px 6px',
                    background: 'rgba(255,215,0,0.12)',
                    border: '1px solid rgba(255,215,0,0.35)',
                    borderRadius: 4,
                    color: '#FFD700',
                    fontSize: '0.6rem', fontWeight: 800,
                    letterSpacing: '0.02em', textTransform: 'capitalize',
                    cursor: 'pointer', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {priorLogs.map(h => (
                    <option key={h.id} value={h.log_date} style={{ background: '#0a0a0a', color: '#fff' }}>
                      {fmtDate(h.log_date)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={9} color="#FFD700" style={{ position: 'absolute', right: 4, pointerEvents: 'none' }} />
              </div>
            ) : (
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, color: '#FFD700',
                textTransform: 'capitalize',
              }}>
                · {fmtDate(lastLog.log_date)}
              </span>
            )}
            {lastLog.genoeg_score != null && (
              <span style={{
                marginLeft: 'auto',
                padding: '1px 6px', borderRadius: 4,
                background: lastLog.genoeg_score >= 4 ? 'rgba(16,185,129,0.2)' : lastLog.genoeg_score >= 3 ? 'rgba(255,215,0,0.2)' : 'rgba(239,68,68,0.2)',
                color: lastLog.genoeg_score >= 4 ? '#10b981' : lastLog.genoeg_score >= 3 ? '#FFD700' : '#fca5a5',
                fontSize: '0.55rem', fontWeight: 800, fontFamily: 'monospace',
              }}>
                {lastLog.genoeg_score}/5
              </span>
            )}
          </div>
          {lastLog.hoe_ging_het && (
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 4 }}>
              {lastLog.hoe_ging_het}
            </div>
          )}
          {lastLog.morgen_beter && (
            <div style={{
              marginTop: 6,
              padding: '5px 7px',
              background: 'rgba(255,215,0,0.08)',
              borderLeft: '2px solid #FFD700', borderRadius: 3,
              fontSize: '0.68rem', color: '#fde68a', fontWeight: 600,
              lineHeight: 1.4,
            }}>
              <span style={{ color: '#FFD700', fontWeight: 800, marginRight: 4 }}>→ Vandaag:</span>
              {lastLog.morgen_beter}
            </div>
          )}
          {lastLog.wat_ging_goed && (
            <div style={{ marginTop: 4, fontSize: '0.62rem', color: 'rgba(16,185,129,0.8)', fontStyle: 'italic' }}>
              ✓ {lastLog.wat_ging_goed}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        marginBottom: '0.5rem',
      }}>
        <BookOpen size={11} color="#FFD700" />
        <span style={{
          fontSize: '0.5rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Logboek · vandaag
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.5rem', fontWeight: 700,
          color: savingState === 'saving' ? 'rgba(255,215,0,0.7)'
            : savingState === 'saved' ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {loading ? 'Laden…' : savingState === 'saving' ? 'Opslaan…' : savingState === 'saved' ? 'Bewaard' : ''}
        </span>
      </div>

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {QUESTIONS.map(q => (
            <div key={q.key}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.6)', marginBottom: 3,
              }}>{q.label}</div>
              <textarea
                value={todayLog[q.key] || ''}
                onChange={(e) => setField(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={q.rows}
                style={inputStyle}
              />
            </div>
          ))}

          {/* Genoeg score 1-5 */}
          <div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.6)', marginBottom: 4,
            }}>
              Heb je genoeg gedaan? <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>(1 = nee, 5 = ja absoluut)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => {
                const active = todayLog.genoeg_score === n
                const color = n >= 4 ? '#10b981' : n >= 3 ? '#FFD700' : n >= 2 ? '#f59e0b' : '#ef4444'
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setField('genoeg_score', active ? null : n)}
                    style={{
                      minHeight: 38, padding: 0,
                      background: active ? color : 'rgba(255,255,255,0.04)',
                      border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      color: active ? '#000' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.95rem', fontWeight: 900,
                      fontFamily: 'monospace',
                      cursor: 'pointer', touchAction: 'manipulation',
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div style={{ marginTop: '0.85rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.5rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>
            <History size={10} /> Geschiedenis
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {history.filter(h => h.log_date !== today).slice(0, 10).map(h => (
              <div key={h.id} style={{
                padding: '0.5rem 0.65rem',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                  <Calendar size={9} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                    {fmtDate(h.log_date)}
                  </span>
                  {h.genoeg_score != null && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '1px 6px', borderRadius: 4,
                      background: h.genoeg_score >= 4 ? 'rgba(16,185,129,0.18)' : h.genoeg_score >= 3 ? 'rgba(255,215,0,0.18)' : 'rgba(239,68,68,0.18)',
                      color: h.genoeg_score >= 4 ? '#10b981' : h.genoeg_score >= 3 ? '#FFD700' : '#fca5a5',
                      fontSize: '0.55rem', fontWeight: 800,
                      fontFamily: 'monospace',
                    }}>
                      {h.genoeg_score}/5
                    </span>
                  )}
                </div>
                {h.hoe_ging_het && (
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.35 }}>
                    {h.hoe_ging_het}
                  </div>
                )}
                {h.wat_ging_goed && (
                  <div style={{ fontSize: '0.62rem', color: 'rgba(16,185,129,0.75)', marginTop: 3 }}>
                    ✓ {h.wat_ging_goed}
                  </div>
                )}
                {h.morgen_beter && (
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,215,0,0.75)', marginTop: 2 }}>
                    → {h.morgen_beter}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && history.length === 0 && (
        <div style={{
          marginTop: '0.55rem', textAlign: 'center',
          padding: '0.55rem',
          color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem',
          fontStyle: 'italic',
        }}>
          Eerste keer dat je logt voor deze task — leg de toon voor morgen.
        </div>
      )}
    </div>
  )
}
