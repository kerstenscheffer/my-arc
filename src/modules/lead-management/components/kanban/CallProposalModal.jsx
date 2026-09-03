// src/modules/lead-management/components/kanban/CallProposalModal.jsx
// Opens right after a lead is dropped into a "Call voorgesteld"-style
// section so the coach can log the exact message they sent. Stored in the
// existing `lead_notes` table with note_type='call_proposal' — no extra
// table needed.
//
// The stats modal renders these grouped per-lead so the coach can review
// which proposals converted to actual calls (and which didn't) and tune
// the wording.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Send, PhoneCall, Eraser } from 'lucide-react'

const GOLD = '#FFD700'

export default function CallProposalModal({
  isOpen, onClose, lead, db, coachId, isMobile = false,
}) {
  const modalHost = useModalHost()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [previous, setPrevious] = useState([])
  const taRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setText('')
    setSaving(false)
    // Load prior call-proposal messages for this lead — handy as a
    // starting point when the coach has tried before.
    if (!db?.supabase || !lead?.id) return
    let cancelled = false
    db.supabase
      .from('lead_notes')
      .select('id, content, created_at')
      .eq('lead_id', lead.id)
      .eq('note_type', 'call_proposal')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (!cancelled) setPrevious(data || []) })
    return () => { cancelled = true }
  }, [isOpen, lead?.id, db])

  useEffect(() => {
    if (isOpen && taRef.current) setTimeout(() => taRef.current?.focus(), 80)
  }, [isOpen])

  if (!isOpen || !lead) return null

  const handleSave = async () => {
    const body = text.trim()
    if (!body || saving) return
    if (!db?.supabase || !coachId) return
    setSaving(true)
    try {
      const { error } = await db.supabase
        .from('lead_notes')
        .insert({
          lead_id: lead.id,
          coach_id: coachId,
          note_type: 'call_proposal',
          content: body,
          subject: null,
        })
      if (error) throw error
      onClose?.()
    } catch (e) {
      console.error('save call proposal failed:', e)
      alert('Opslaan mislukt — ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => onClose?.()

  const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'deze lead'

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleSkip() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483550,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: isMobile ? '92vh' : '85vh',
          background: '#0a0a0a',
          border: `1px solid ${GOLD}33`,
          borderRadius: isMobile ? '14px 14px 0 0' : 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 14px 50px rgba(0,0,0,0.7), 0 0 30px ${GOLD}22`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.55rem',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `${GOLD}10`,
        }}>
          <PhoneCall size={17} color={GOLD} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 800,
              color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Call voorgesteld
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
              Welk bericht heb je gestuurd aan {leadName}?
            </div>
          </div>
          <button
            onClick={handleSkip}
            title="Skip"
            style={{
              width: 28, height: 28, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '0.85rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.65rem',
        }}>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Plak hier de exacte tekst van je call-voorstel. Achteraf kun je in de stats per lead terugzien welke wording wel/niet werkt."
            rows={isMobile ? 6 : 8}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.7rem 0.85rem',
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${GOLD}33`,
              borderRadius: 8,
              color: '#fff', fontSize: '0.85rem', lineHeight: 1.5,
              fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
          />

          {previous.length > 0 && (
            <div style={{
              padding: '0.55rem 0.7rem',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 6,
            }}>
              <div style={{
                fontSize: '0.55rem', fontWeight: 800,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                Eerder geprobeerd ({previous.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {previous.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setText(p.content || '')}
                    title="Klik om over te nemen + bewerken"
                    style={{
                      textAlign: 'left',
                      padding: '4px 7px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 5,
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '0.7rem', lineHeight: 1.35,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                      {new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {p.content}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 6,
          padding: '0.7rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setText('')}
            disabled={!text.trim()}
            style={{
              padding: '0.55rem 0.85rem',
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 6,
              color: text.trim() ? '#fca5a5' : 'rgba(255,255,255,0.25)',
              fontSize: '0.7rem', fontWeight: 700,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Eraser size={12} /> Leeg
          </button>
          <button
            onClick={handleSkip}
            style={{
              flex: 1, padding: '0.6rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            style={{
              flex: 2, padding: '0.6rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: text.trim() ? GOLD : 'rgba(255,255,255,0.04)',
              border: `1px solid ${text.trim() ? GOLD : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              color: text.trim() ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem', fontWeight: 800,
              cursor: text.trim() && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={13} />
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    modalHost,
  )
}
