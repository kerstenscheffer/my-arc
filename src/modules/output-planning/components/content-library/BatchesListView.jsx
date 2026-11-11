// src/modules/output-planning/components/content-library/BatchesListView.jsx
// Shows real batches from `content_batches` + `batch_items`. Each batch
// expands into its items inline. Read-mostly; edit/plan/delete delegate to
// the parent's existing modal handlers.

import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Edit3, Trash2, CalendarPlus, Package, Eye,
  Check, RotateCcw,
} from 'lucide-react'

// Korte preview van de ingevulde format-velden (naast/onder de titel).
function fieldPreview(item, format) {
  const fields = format?.fields || []
  for (const f of fields) {
    const v = item.field_values?.[f.key]
    if (Array.isArray(v)) { const c = v.filter(Boolean); if (c.length) return c.join(' · ') }
    else if (v && String(v).trim() && item.title !== String(v)) return String(v)
  }
  return item.hook || ''
}

const STATUS_STYLES = {
  draft:     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'DRAFT' },
  ready:     { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'READY' },
  planned:   { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'GEPLAND' },
  completed: { bg: 'rgba(168,85,247,0.15)',  color: '#a855f7', label: 'KLAAR' },
  archived:  { bg: 'rgba(75,85,99,0.15)',    color: '#6b7280', label: 'GEARCHIVEERD' },
}

const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: 0, background: 'transparent', color: s.color,
      fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>{s.label}</span>
  )
}

const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

export default function BatchesListView({
  batches = [],
  loading = false,
  onCreateBatch,
  onEditItem,
  onPlanItem,
  onViewItem,
  onPlanBatch,
  onDeleteBatch,
  // Afronden zet de batch in het archief; heropenen haalt hem er weer uit.
  // De lijst krijgt er telkens één van de twee: de werklijst kan afronden,
  // het archief kan heropenen.
  onCompleteBatch,
  onReopenBatch,
  emptyText = 'Nog geen batches. Klik op Nieuwe Batch om te starten.',
  // Eigen kopje. Staat de lijst al onder een sectiekop (zoals in het archief),
  // geef dan null mee — anders staat er "Archief" met daaronder "Batches".
  title = 'Batches',
  isMobile,
}) {
  const [expandedId, setExpandedId] = useState(null)

  const toggle = (id) => setExpandedId(prev => (prev === id ? null : id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.625rem' : '0.75rem' }}>
      {(title || onCreateBatch) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: isMobile ? '0.25rem' : '0.5rem',
      }}>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 900, color: '#fff' }}>
          {title}
        </div>
        {onCreateBatch && (
          <button
            onClick={onCreateBatch}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: isMobile ? '0.55rem 0.8rem' : '0.55rem 0.95rem',
              minHeight: 44,
              background: '#fff', color: '#000', border: 'none',
              borderRadius: '8px', fontWeight: 700, fontSize: isMobile ? '0.8rem' : '0.85rem',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nieuwe Batch
          </button>
        )}
      </div>
      )}

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Laden…
        </div>
      )}

      {!loading && batches.length === 0 && (
        <div style={{
          padding: isMobile ? '1.25rem' : '2rem', textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px',
          color: 'rgba(255,255,255,0.55)', fontSize: isMobile ? '0.85rem' : '0.95rem',
        }}>
          {emptyText}
        </div>
      )}

      {!loading && batches.map(batch => {
        const items = batch.batch_items || []
        const isOpen = expandedId === batch.id
        const completedCount = items.filter(i => i.status === 'posted' || i.status === 'completed').length

        return (
          <div
            key={batch.id}
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              background: 'transparent',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggle(batch.id)}
              style={{
                width: '100%',
                padding: isMobile ? '0.6rem 0.4rem 0.6rem 0.6rem' : '0.75rem 0.85rem',
                display: 'flex', alignItems: 'center', gap: isMobile ? '0.45rem' : '0.65rem',
                background: 'transparent', border: 'none', color: '#fff',
                cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
              }}
            >
              {isOpen
                ? <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                : <ChevronRight size={18} color="rgba(255,255,255,0.5)" />}
              {!isMobile && <Package size={17} color="#fff" strokeWidth={2.4} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {batch.batch_name || 'Naamloze batch'}
                </div>
                <div style={{
                  display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: 2,
                  fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                  <StatusPill status={batch.status || 'draft'} />
                  <span style={{ fontWeight: 600 }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                    {completedCount > 0 && (
                      <span style={{ color: '#10b981' }}> · {completedCount} klaar</span>
                    )}
                  </span>
                  {batch.shoot_date
                    ? <span style={{ color: '#fff', fontWeight: 900 }}>🎬 {formatDate(batch.shoot_date)}</span>
                    : (batch.created_at && <span>{formatDate(batch.created_at)}</span>)}
                </div>
              </div>
              {onCompleteBatch && (
                <span
                  onClick={(e) => { e.stopPropagation(); onCompleteBatch(batch) }}
                  style={{
                    padding: isMobile ? '6px' : '8px', borderRadius: 6, cursor: 'pointer', display: 'flex',
                    color: '#10b981',
                  }}
                  title="Batch afronden — gaat naar het archief"
                >
                  <Check size={16} strokeWidth={2.6} />
                </span>
              )}
              {onReopenBatch && (
                <span
                  onClick={(e) => { e.stopPropagation(); onReopenBatch(batch) }}
                  style={{
                    padding: isMobile ? '6px' : '8px', borderRadius: 6, cursor: 'pointer', display: 'flex',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                  title="Terug naar de werklijst"
                >
                  <RotateCcw size={15} />
                </span>
              )}
              {onPlanBatch && (
                <span
                  onClick={(e) => { e.stopPropagation(); onPlanBatch(batch) }}
                  style={{
                    padding: isMobile ? '6px' : '8px', borderRadius: 6, cursor: 'pointer', display: 'flex',
                    color: '#fff',
                  }}
                  title={batch.shoot_date ? 'Opnamemoment aanpassen' : 'Hele batch inplannen'}
                >
                  <CalendarPlus size={16} strokeWidth={2.4} />
                </span>
              )}
              {onDeleteBatch && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDeleteBatch(batch) }}
                  style={{
                    padding: isMobile ? '6px' : '8px', borderRadius: 6, cursor: 'pointer', display: 'flex',
                    color: '#ef4444',
                  }}
                  title="Batch verwijderen"
                >
                  <Trash2 size={15} />
                </span>
              )}
            </button>

            {isOpen && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: isMobile ? '0.5rem' : '0.65rem',
                display: 'flex', flexDirection: 'column', gap: '0.4rem',
              }}>
                {items.length === 0 && (
                  <div style={{
                    padding: '0.85rem', textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem',
                  }}>
                    Geen items in deze batch.
                  </div>
                )}
                {items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
                      padding: isMobile ? '0.55rem 0.6rem' : '0.6rem 0.75rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: 22, height: 22,
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 900,
                    }}>
                      {item.item_number || '—'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isMobile ? '0.86rem' : '0.9rem', fontWeight: 800,
                        color: '#fff', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.title || '(geen titel)'}
                      </div>
                      {fieldPreview(item, batch.format) && (
                        <div style={{
                          fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {fieldPreview(item, batch.format)}
                        </div>
                      )}
                      <div style={{ marginTop: 5, display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <StatusPill status={item.status || 'draft'} />
                        {item.planned_date && (
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                            {formatDate(item.planned_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                      {onViewItem && (
                        <button
                          onClick={() => onViewItem(item, batch)}
                          style={{
                            padding: 0, minHeight: 40, minWidth: isMobile ? 34 : 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            borderRadius: 6, color: '#fff', cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                          title="Inzien"
                        >
                          <Eye size={16} strokeWidth={2.4} />
                        </button>
                      )}
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item, batch)}
                          style={{
                            padding: 0, minHeight: 40, minWidth: isMobile ? 34 : 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            borderRadius: 6, color: '#fff', cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                          title="Bewerken"
                        >
                          <Edit3 size={16} strokeWidth={2.4} />
                        </button>
                      )}
                      {onPlanItem && (
                        <button
                          onClick={() => onPlanItem(item, batch)}
                          style={{
                            padding: 0, minHeight: 40, minWidth: isMobile ? 34 : 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            borderRadius: 6, color: '#fff', cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                          title="Plannen in week"
                        >
                          <CalendarPlus size={16} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
