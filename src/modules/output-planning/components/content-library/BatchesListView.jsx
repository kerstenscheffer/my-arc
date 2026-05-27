// src/modules/output-planning/components/content-library/BatchesListView.jsx
// Shows real batches from `content_batches` + `batch_items`. Each batch
// expands into its items inline. Read-mostly; edit/plan/delete delegate to
// the parent's existing modal handlers.

import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Edit3, Trash2, CalendarPlus, Package,
} from 'lucide-react'

const GOLD = '#FFD700'

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
      padding: '2px 8px', borderRadius: '3px',
      background: s.bg, color: s.color,
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
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
  onDeleteBatch,
  isMobile,
}) {
  const [expandedId, setExpandedId] = useState(null)

  const toggle = (id) => setExpandedId(prev => (prev === id ? null : id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.625rem' : '0.75rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: isMobile ? '0.25rem' : '0.5rem',
      }}>
        <div style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 700, color: '#fff' }}>
          Batches
        </div>
        {onCreateBatch && (
          <button
            onClick={onCreateBatch}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: isMobile ? '0.55rem 0.8rem' : '0.55rem 0.95rem',
              minHeight: 44,
              background: GOLD, color: '#000', border: 'none',
              borderRadius: '8px', fontWeight: 700, fontSize: isMobile ? '0.8rem' : '0.85rem',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nieuwe Batch
          </button>
        )}
      </div>

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
          Nog geen batches. Klik op <strong>Nieuwe Batch</strong> om te starten.
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
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => toggle(batch.id)}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                background: 'transparent', border: 'none', color: '#fff',
                cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
              }}
            >
              {isOpen
                ? <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                : <ChevronRight size={18} color="rgba(255,255,255,0.5)" />}
              <Package size={isMobile ? 16 : 18} color={GOLD} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 700, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {batch.batch_name || 'Naamloze batch'}
                </div>
                <div style={{
                  display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: 2,
                  fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)',
                }}>
                  <StatusPill status={batch.status || 'draft'} />
                  <span style={{ fontWeight: 600 }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                    {completedCount > 0 && (
                      <span style={{ color: '#10b981' }}> · {completedCount} klaar</span>
                    )}
                  </span>
                  {batch.created_at && <span>{formatDate(batch.created_at)}</span>}
                </div>
              </div>
              {onDeleteBatch && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDeleteBatch(batch) }}
                  style={{
                    padding: '8px', borderRadius: 6, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)',
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
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: 4,
                      background: 'rgba(255,215,0,0.12)', color: GOLD,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800,
                    }}>
                      {item.item_number || '—'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600,
                        color: '#fff', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.title || '(geen titel)'}
                      </div>
                      {item.hook && (
                        <div style={{
                          fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.hook}
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
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item, batch)}
                          style={{
                            padding: 8, minHeight: 44, minWidth: 44,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                          title="Bewerken"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      {onPlanItem && (
                        <button
                          onClick={() => onPlanItem(item, batch)}
                          style={{
                            padding: 8, minHeight: 44, minWidth: 44,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6, color: GOLD, cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                          title="Plannen in week"
                        >
                          <CalendarPlus size={14} />
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
