// src/modules/content-batches/components/BatchFormatSelector.jsx
// Stap 1: kies één van je EIGEN formats (leeg bij start) of maak er een via
// "+ Format toevoegen". Daarna: post/story + batch-instellingen.

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Layers } from 'lucide-react'
import BatchService from '../BatchService'
import FormatBuilderModal from './FormatBuilderModal'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function BatchFormatSelector({
  selectedFormat,
  contentType,
  batchName,
  itemCount,
  onFormatSelect,
  onContentTypeChange,
  onBatchNameChange,
  onItemCountChange,
  db,
  isMobile = false,
}) {
  const [formats, setFormats] = useState([])
  const [loading, setLoading] = useState(true)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState(null)

  const loadFormats = useCallback(async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      const svc = new BatchService(db.supabase)
      setFormats(await svc.getFormats(user.id))
    } catch (e) {
      console.error('Formats laden mislukt:', e)
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => { loadFormats() }, [loadFormats])

  const handleSaved = (saved) => {
    loadFormats()
    if (saved) onFormatSelect(saved)   // net gemaakt format meteen selecteren
  }

  const accent = selectedFormat?.color || GOLD.primary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>
      {/* Formats */}
      <div>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Kies een format</h3>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '1rem' }}>Laden…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '0.75rem' : '1rem' }}>
            {formats.map(format => {
              const isSelected = selectedFormat?.id === format.id
              const c = format.color || GOLD.primary
              return (
                <button key={format.id} onClick={() => onFormatSelect(format)} style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                  padding: isMobile ? '1rem' : '1.1rem', minHeight: isMobile ? 110 : 128,
                  background: isSelected ? `linear-gradient(135deg, ${c}22 0%, rgba(0,0,0,0.4) 100%)` : 'rgba(255,255,255,0.03)',
                  border: isSelected ? `2px solid ${c}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {/* edit */}
                  <span onClick={(e) => { e.stopPropagation(); setEditingFormat(format); setBuilderOpen(true) }}
                    title="Format bewerken"
                    style={{ position: 'absolute', top: 6, left: 6, width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <Pencil size={11} />
                  </span>
                  {isSelected && (
                    <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: c, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>
                  )}
                  <div style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, background: `${c}25`, border: `1px solid ${c}60`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={isMobile ? 22 : 26} color={c} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 700, color: isSelected ? c : '#fff', textAlign: 'center', lineHeight: 1.2 }}>{format.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{(format.fields || []).length} velden</span>
                </button>
              )
            })}

            {/* + Format toevoegen */}
            <button onClick={() => { setEditingFormat(null); setBuilderOpen(true) }} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              padding: isMobile ? '1rem' : '1.1rem', minHeight: isMobile ? 110 : 128,
              background: 'rgba(255,215,0,0.05)', border: `1px dashed ${GOLD.border}`, borderRadius: 12,
              cursor: 'pointer', color: GOLD.primary, touchAction: 'manipulation',
            }}>
              <div style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12, background: 'rgba(255,215,0,0.1)', border: `1px solid ${GOLD.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={isMobile ? 22 : 26} color={GOLD.primary} />
              </div>
              <span style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 700 }}>Format toevoegen</span>
            </button>
          </div>
        )}

        {!loading && formats.length === 0 && (
          <p style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Nog geen formats. Maak er één via <strong style={{ color: GOLD.primary }}>Format toevoegen</strong> — je velden worden bewaard zodat je ze steeds hergebruikt.
          </p>
        )}
      </div>

      {/* Post / Story + instellingen — pas zichtbaar als een format gekozen is */}
      {selectedFormat && (
        <>
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Plaats als Post of Story?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 480 }}>
              {[{ id: 'post', emoji: '📄', label: 'Feed Post', c: accent }, { id: 'story', emoji: '📱', label: 'Instagram Story', c: '#ec4899' }].map(opt => (
                <button key={opt.id} onClick={() => onContentTypeChange(opt.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.1rem',
                  background: contentType === opt.id ? `linear-gradient(135deg, ${opt.c}22 0%, rgba(0,0,0,0.4) 100%)` : 'rgba(255,255,255,0.03)',
                  border: contentType === opt.id ? `2px solid ${opt.c}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, cursor: 'pointer', touchAction: 'manipulation',
                }}>
                  <span style={{ fontSize: '1.8rem' }}>{opt.emoji}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: contentType === opt.id ? opt.c : '#fff' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Batch-instellingen</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', maxWidth: 560 }}>
              <div>
                <label style={settingLabel}>Batch-naam (optioneel)</label>
                <input type="text" value={batchName} onChange={e => onBatchNameChange(e.target.value)} placeholder={`${selectedFormat.name} week 1`} style={settingInput} />
              </div>
              <div>
                <label style={settingLabel}>Aantal items</label>
                <input type="number" min="1" max="30" value={itemCount} onChange={e => onItemCountChange(Math.max(1, Math.min(30, parseInt(e.target.value) || 7)))} style={settingInput} />
              </div>
            </div>
          </div>
        </>
      )}

      {builderOpen && (
        <FormatBuilderModal
          isOpen={builderOpen}
          existing={editingFormat}
          db={db}
          isMobile={isMobile}
          onClose={() => { setBuilderOpen(false); setEditingFormat(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

const settingLabel = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }
const settingInput = { width: '100%', boxSizing: 'border-box', padding: '0.75rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', outline: 'none' }
