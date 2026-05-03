// ============================================
// 📁 FILE: src/modules/client-journey/components/callflow/CallFlowSystem.jsx
// CALL FLOW SYSTEM - Voor, tijdens en na de call
// 3 modes: prep → live → summary
// ============================================
import React, { useState, useMemo } from 'react'
import { Phone, CheckCircle, Clock, ChevronDown, ChevronRight, FileText, Send, Copy, Edit3, Save, X, Play, Square, MessageCircle, ClipboardList, AlertCircle, Zap } from 'lucide-react'
import { getCallTemplateForWeek } from './callTemplates'
import { personalizeMessage, getWhatsAppUrl } from '../messages/MessageSystem'

const GOLD = { primary: '#d4a853', background: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.2)' }
const GREEN = '#10b981'

// ============================================
// MAIN COMPONENT
// ============================================
export default function CallFlowSystem({ weekNumber, totalWeeks, client, isMobile, callNotes, onSaveCallNotes }) {
  const [mode, setMode] = useState('prep') // prep, live, summary
  const [agenda, setAgenda] = useState(null)
  const [prepChecklist, setPrepChecklist] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [callStartTime, setCallStartTime] = useState(null)
  const [copied, setCopied] = useState(false)

  // Get template for this week
  const template = useMemo(() => getCallTemplateForWeek(weekNumber, totalWeeks), [weekNumber, totalWeeks])

  // Initialize agenda from template (or saved notes)
  const initializeCall = () => {
    if (callNotes?.agenda) {
      setAgenda(callNotes.agenda)
      setPrepChecklist(callNotes.prepChecklist || template.prepChecklist)
    } else {
      setAgenda(template.agenda.map(item => ({ ...item })))
      setPrepChecklist(template.prepChecklist.map(item => ({ ...item })))
    }
  }

  // Init on first render
  if (!agenda) initializeCall()

  const handleStartCall = () => {
    setMode('live')
    setCallStartTime(new Date())
    setActiveItem(agenda[0]?.id || null)
  }

  const handleEndCall = () => {
    setMode('summary')
    if (onSaveCallNotes) {
      onSaveCallNotes({
        weekNumber,
        templateId: template.id,
        agenda,
        prepChecklist,
        callDate: callStartTime?.toISOString(),
        callDuration: callStartTime ? Math.round((Date.now() - callStartTime.getTime()) / 60000) : null
      })
    }
  }

  const handleToggleAgendaItem = (itemId) => {
    setAgenda(prev => prev.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    ))
  }

  const handleUpdateNotes = (itemId, notes) => {
    setAgenda(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ))
  }

  const handleTogglePrepItem = (index) => {
    setPrepChecklist(prev => prev.map((item, i) =>
      i === index ? { ...item, done: !item.done } : item
    ))
  }

  // Generate summary text for WhatsApp
  const generateSummary = () => {
    if (!agenda) return ''
    const notesItems = agenda.filter(item => item.notes?.trim()).map(item => `• ${item.title}: ${item.notes.trim()}`).join('\n')
    const actionItems = agenda.find(a => a.id === 'afspraken')?.notes?.trim() || ''

    return `Hey ${client?.first_name || 'daar'}, top call man! 💪

${notesItems ? `Hier even een overzicht:\n${notesItems}` : 'We hebben alles goed doorgenomen.'}

${actionItems ? `Actiepunten voor deze week:\n${actionItems}` : ''}

We houden contact! 🏆`
  }

  const summaryText = mode === 'summary' ? generateSummary() : ''
  const whatsappUrl = mode === 'summary' ? getWhatsAppUrl(client, summaryText) : null
  const hasPhone = !!(client?.phone || client?.phone_number)
  const prepDone = prepChecklist?.filter(p => p.done).length || 0
  const prepTotal = prepChecklist?.length || 0
  const agendaDone = agenda?.filter(a => a.done).length || 0
  const agendaTotal = agenda?.length || 0

  return (
    <div style={{
      borderRadius: '10px',
      background: 'rgba(245,158,11,0.03)',
      border: '1px solid rgba(245,158,11,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.7rem 0.75rem' : '0.85rem 1rem',
        background: 'rgba(245,158,11,0.06)',
        borderBottom: '1px solid rgba(245,158,11,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Phone size={14} color="#f59e0b" />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.85rem', margin: 0 }}>
              {template.name}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', margin: '0.1rem 0 0' }}>
              {template.duration} min • Week {weekNumber}
            </p>
          </div>
        </div>

        {/* Mode indicator */}
        <div style={{
          display: 'flex', gap: '0.25rem'
        }}>
          {['prep', 'live', 'summary'].map(m => (
            <div key={m} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: mode === m ? (m === 'live' ? '#ef4444' : m === 'summary' ? GREEN : '#f59e0b') : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>

      {/* ===== PREP MODE ===== */}
      {mode === 'prep' && (
        <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
          {/* Prep checklist */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <ClipboardList size={12} color="#f59e0b" />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: '#f59e0b' }}>
                Voorbereiding ({prepDone}/{prepTotal})
              </span>
            </div>
            {prepChecklist?.map((item, i) => (
              <div key={i} onClick={() => handleTogglePrepItem(i)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.5rem', borderRadius: '6px', marginBottom: '0.2rem',
                background: item.done ? 'rgba(16,185,129,0.04)' : 'transparent',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                  border: `2px solid ${item.done ? GREEN : 'rgba(255,255,255,0.15)'}`,
                  background: item.done ? `${GREEN}20` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {item.done && <CheckCircle size={10} color={GREEN} />}
                </div>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: item.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                  textDecoration: item.done ? 'line-through' : 'none'
                }}>{item.item}</span>
              </div>
            ))}
          </div>

          {/* Agenda preview */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <FileText size={12} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>
                Agenda ({template.duration} min)
              </span>
            </div>
            {agenda?.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.5rem', marginBottom: '0.15rem'
              }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', width: '30px', flexShrink: 0 }}>
                  {item.duration}m
                </span>
                <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>

          {/* Deliverables */}
          {template.deliverables?.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Zap size={12} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>
                  Deliverables na call
                </span>
              </div>
              {template.deliverables.map((d, i) => (
                <p key={i} style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.35)',
                  margin: '0.15rem 0', paddingLeft: '0.5rem'
                }}>• {d}</p>
              ))}
            </div>
          )}

          {/* Start Call button */}
          <button onClick={handleStartCall} style={{
            width: '100%', padding: isMobile ? '0.7rem' : '0.8rem', borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none',
            color: '#000', fontWeight: '700', fontSize: isMobile ? '0.85rem' : '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <Play size={16} /> Start Call
          </button>
        </div>
      )}

      {/* ===== LIVE MODE ===== */}
      {mode === 'live' && (
        <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
          {/* Live indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
            padding: '0.4rem 0.6rem', borderRadius: '6px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600', color: '#ef4444' }}>
              Call bezig
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
              {agendaDone}/{agendaTotal} punten
            </span>
          </div>

          {/* Agenda items with notes */}
          {agenda?.map((item, index) => {
            const isActive = activeItem === item.id
            return (
              <div key={item.id} style={{
                borderRadius: '8px', marginBottom: '0.4rem', overflow: 'hidden',
                border: `1px solid ${isActive ? 'rgba(245,158,11,0.25)' : item.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)'}`,
                background: isActive ? 'rgba(245,158,11,0.04)' : item.done ? 'rgba(16,185,129,0.02)' : 'transparent'
              }}>
                {/* Item header */}
                <div
                  onClick={() => setActiveItem(isActive ? null : item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: isMobile ? '0.5rem 0.6rem' : '0.6rem 0.75rem',
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleAgendaItem(item.id) }}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${item.done ? GREEN : 'rgba(245,158,11,0.4)'}`,
                      background: item.done ? `${GREEN}20` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {item.done && <CheckCircle size={12} color={GREEN} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: '500',
                      color: item.done ? 'rgba(255,255,255,0.4)' : '#fff',
                      textDecoration: item.done ? 'line-through' : 'none'
                    }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                    {item.duration}m
                  </span>
                  {isActive ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.2)" />}
                </div>

                {/* Expanded: prompts + notes */}
                {isActive && (
                  <div style={{ padding: isMobile ? '0 0.6rem 0.6rem' : '0 0.75rem 0.75rem' }}>
                    {/* Prompts */}
                    {item.prompts?.length > 0 && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        {item.prompts.map((prompt, pi) => (
                          <p key={pi} style={{
                            fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(245,158,11,0.6)',
                            margin: '0.15rem 0', paddingLeft: '0.4rem',
                            borderLeft: '2px solid rgba(245,158,11,0.15)'
                          }}>
                            💬 {prompt}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Notes textarea */}
                    <textarea
                      value={item.notes}
                      onChange={e => handleUpdateNotes(item.id, e.target.value)}
                      placeholder="Notities typen..."
                      rows={3}
                      style={{
                        width: '100%', padding: '0.5rem', borderRadius: '6px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', fontSize: isMobile ? '0.78rem' : '0.83rem',
                        outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                        minHeight: '60px', boxSizing: 'border-box'
                      }}
                      autoFocus
                    />

                    {/* Next item button */}
                    {index < agenda.length - 1 && (
                      <button
                        onClick={() => { handleToggleAgendaItem(item.id); setActiveItem(agenda[index + 1].id) }}
                        style={{
                          width: '100%', padding: '0.4rem', marginTop: '0.35rem', borderRadius: '6px',
                          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                          color: '#f59e0b', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '600',
                          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                        }}
                      >
                        Volgende: {agenda[index + 1].title} <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* End Call button */}
          <button onClick={handleEndCall} style={{
            width: '100%', padding: isMobile ? '0.7rem' : '0.8rem', marginTop: '0.5rem', borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none',
            color: '#fff', fontWeight: '700', fontSize: isMobile ? '0.85rem' : '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            <Square size={14} /> Beëindig Call
          </button>

          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      )}

      {/* ===== SUMMARY MODE ===== */}
      {mode === 'summary' && (
        <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem'
          }}>
            <CheckCircle size={16} color={GREEN} />
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600', color: GREEN }}>
              Call afgerond
            </span>
            {callStartTime && (
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                {Math.round((Date.now() - callStartTime.getTime()) / 60000)} min
              </span>
            )}
          </div>

          {/* Notes summary */}
          <div style={{ marginBottom: '0.75rem' }}>
            {agenda?.filter(item => item.notes?.trim()).map(item => (
              <div key={item.id} style={{
                padding: '0.4rem 0.5rem', marginBottom: '0.2rem', borderRadius: '6px',
                background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid rgba(245,158,11,0.3)`
              }}>
                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: '600' }}>{item.title}</span>
                <p style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.6)', margin: '0.15rem 0 0', whiteSpace: 'pre-wrap' }}>
                  {item.notes}
                </p>
              </div>
            ))}
          </div>

          {/* WhatsApp summary preview */}
          <div style={{
            padding: isMobile ? '0.6rem' : '0.75rem', borderRadius: '8px',
            background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.1)',
            marginBottom: '0.5rem'
          }}>
            <div style={{ fontSize: '0.55rem', color: 'rgba(37,211,102,0.5)', fontWeight: '600', marginBottom: '0.3rem' }}>
              WhatsApp samenvatting
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? '0.72rem' : '0.78rem',
              lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap'
            }}>
              {summaryText}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {hasPhone && (
              <button
                onClick={() => { if (whatsappUrl) window.open(whatsappUrl, '_blank') }}
                style={{
                  flex: 1, padding: isMobile ? '0.5rem' : '0.6rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.2), rgba(37,211,102,0.1))',
                  border: '1px solid rgba(37,211,102,0.3)', color: '#25D366',
                  fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
                }}
              >
                <Send size={14} /> Stuur samenvatting
              </button>
            )}

            <button
              onClick={async () => { await navigator.clipboard.writeText(summaryText); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.85rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: copied ? GREEN : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
              }}
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copied ? 'Gekopieerd!' : 'Kopieer'}
            </button>

            <button
              onClick={() => setMode('live')}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.85rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
              }}
            >
              <Edit3 size={13} /> Terug naar notities
            </button>
          </div>

          {/* Deliverables reminder */}
          {template.deliverables?.length > 0 && (
            <div style={{
              marginTop: '0.5rem', padding: '0.5rem', borderRadius: '6px',
              background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.1)'
            }}>
              <span style={{ fontSize: '0.6rem', color: GOLD.primary, fontWeight: '600' }}>📋 Nog te doen:</span>
              {template.deliverables.map((d, i) => (
                <p key={i} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', margin: '0.15rem 0 0', paddingLeft: '0.4rem' }}>• {d}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
