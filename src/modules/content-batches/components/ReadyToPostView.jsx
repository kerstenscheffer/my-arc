// src/modules/content-batches/components/ReadyToPostView.jsx
// Shows all batch items with status='ready' (not yet planned)
// User can drag to week planning or click to schedule

import { useState } from 'react'
import { Calendar, Clock, Trash2, Edit3, Eye } from 'lucide-react'
import { POST_FORMATS, getItemColor, getFormatIcon } from '../constants'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function ReadyToPostView({
  readyItems,
  onPlanItem,
  onEditItem,
  onDeleteItem,
  onViewBatch,
  isMobile = false
}) {
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [selectedContentType, setSelectedContentType] = useState('all')

  // Group items by batch
  const itemsByBatch = readyItems.reduce((acc, item) => {
    const batchId = item.batch?.id || 'unknown'
    if (!acc[batchId]) {
      acc[batchId] = {
        batch: item.batch,
        items: []
      }
    }
    acc[batchId].items.push(item)
    return acc
  }, {})

  // Filter
  const filteredBatches = Object.values(itemsByBatch).filter(group => {
    if (selectedFormat !== 'all' && group.batch?.post_format !== selectedFormat) return false
    if (selectedContentType !== 'all' && group.batch?.content_type !== selectedContentType) return false
    return true
  })

  // Get unique formats and content types for filters
  const availableFormats = [...new Set(readyItems.map(i => i.batch?.post_format))].filter(Boolean)
  const hasStories = readyItems.some(i => i.batch?.content_type === 'story')
  const hasPosts = readyItems.some(i => i.batch?.content_type === 'post')

  if (readyItems.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px dashed rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
        </div>
        <h3 style={{
          margin: '0 0 0.75rem',
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          Geen Ready Items
        </h3>
        <p style={{
          margin: 0,
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          Maak een nieuwe batch met "Ready to Post" planning om items hier te zien verschijnen.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem',
      padding: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '800',
            color: '#fff'
          }}>
            ✅ Ready to Post
          </h2>
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {readyItems.length} items klaar om in te plannen
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Content Type Filter */}
          {(hasStories || hasPosts) && (
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Types</option>
              {hasPosts && <option value="post">📄 Posts</option>}
              {hasStories && <option value="story">📱 Stories</option>}
            </select>
          )}

          {/* Format Filter */}
          {availableFormats.length > 1 && (
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Alle Formats</option>
              {availableFormats.map(format => {
                const formatData = POST_FORMATS[format]
                return (
                  <option key={format} value={format}>
                    {formatData?.label || format}
                  </option>
                )
              })}
            </select>
          )}
        </div>
      </div>

      {/* Batches */}
      {filteredBatches.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          Geen items met deze filters
        </div>
      ) : (
        filteredBatches.map(({ batch, items }) => {
          const format = POST_FORMATS[batch.post_format]
          const Icon = format ? getFormatIcon(batch.post_format) : Calendar
          const color = getItemColor(batch.post_format, batch.content_type)

          return (
            <div
              key={batch.id}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Batch Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: `linear-gradient(135deg, ${color}15 0%, rgba(0,0,0,0.4) 100%)`,
                  borderBottom: `1px solid ${color}30`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flex: 1
                }}>
                  {/* Format Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: `${color}20`,
                    border: `1px solid ${color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {batch.content_type === 'story' ? (
                      <span style={{ fontSize: '1.5rem' }}>📱</span>
                    ) : (
                      <Icon size={24} color={color} />
                    )}
                  </div>

                  {/* Batch Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: '700',
                      color,
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {batch.batch_name || format?.label || 'Batch'}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {items.length} items • {batch.content_type === 'story' ? 'Story' : 'Post'}
                    </div>
                  </div>
                </div>

                {/* View Batch Button */}
                {!isMobile && onViewBatch && (
                  <button
                    onClick={() => onViewBatch(batch)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={16} />
                    Bekijk Batch
                  </button>
                )}
              </div>

              {/* Items Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
                padding: isMobile ? '1rem' : '1.25rem'
              }}>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('batchItemId', item.id)
                      e.dataTransfer.setData('batchId', batch.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderLeft: `3px solid ${color}`,
                      borderRadius: '8px',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {/* Item Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: color,
                        textTransform: 'uppercase'
                      }}>
                        Item {item.item_number}
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#fff',
                      marginBottom: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      {item.title}
                    </div>

                    {/* Location */}
                    {item.location && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📁 {item.location}
                      </div>
                    )}

                    {/* Caption Preview */}
                    {item.caption && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '0.75rem',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.caption}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <button
                        onClick={() => onPlanItem(item)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                          border: 'none',
                          borderRadius: '6px',
                          color: '#000',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Calendar size={14} />
                        Plan In
                      </button>

                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      {onDeleteItem && (
                        <button
                          onClick={() => {
                            if (confirm('Item verwijderen?')) {
                              onDeleteItem(item.id)
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Drag Hint */}
      {readyItems.length > 0 && !isMobile && (
        <div style={{
          padding: '1rem',
          background: `${GOLD.background}`,
          border: `1px solid ${GOLD.border}`,
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center'
        }}>
          💡 <strong style={{ color: GOLD.primary }}>Tip:</strong> Sleep items naar de week planning om ze in te plannen, of klik op "Plan In" voor handmatige selectie
        </div>
      )}
    </div>
  )
}
