// src/modules/meal-plan/components/food-log/IngredientFeedbackModal.jsx
// Bottom-sheet modal where a client can flag a wrong ingredient and
// suggest a correction (title + macros per 100g). The submission lands
// in the `ingredient_feedback` table for the coach to review.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react'

const GOLD = '#FFD700'

// Pull a per-100g value out of an item in a tolerant way — different parts
// of the app store macros on slightly different keys (per_100g vs raw).
const per100 = (item, key100, keyAlt) => {
  if (!item) return ''
  const v = item[key100] ?? item[keyAlt]
  if (v === undefined || v === null || v === '') return ''
  return String(v)
}

export default function IngredientFeedbackModal({
  isOpen, onClose, item, client, db,
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Pre-fill with the values the client saw, so they only correct what's
  // wrong instead of typing everything from scratch.
  useEffect(() => {
    if (!isOpen) return
    setName(item?.name || item?.product_name || '')
    setKcal(per100(item, 'kcal_per_100g', 'kcal'))
    setProtein(per100(item, 'protein_per_100g', 'protein'))
    setCarbs(per100(item, 'carbs_per_100g', 'carbs'))
    setFat(per100(item, 'fat_per_100g', 'fat'))
    setNotes('')
    setError('')
    setDone(false)
  }, [isOpen, item])

  if (!isOpen) return null

  const canSubmit = name.trim().length > 0 && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true); setError('')
    try {
      const user = await db.getCurrentUser?.()
      const payload = {
        client_id: client?.id || null,
        coach_id: client?.coach_id || client?.trainer_id || null,
        submitter_email: user?.email || client?.email || null,

        original_ingredient_id: item?.id ? String(item.id) : null,
        original_name: item?.name || item?.product_name || null,
        original_barcode: item?.barcode || null,
        original_kcal:    Number(item?.kcal_per_100g ?? item?.kcal ?? null) || null,
        original_protein: Number(item?.protein_per_100g ?? item?.protein ?? null) || null,
        original_carbs:   Number(item?.carbs_per_100g ?? item?.carbs ?? null) || null,
        original_fat:     Number(item?.fat_per_100g ?? item?.fat ?? null) || null,

        suggested_name: name.trim(),
        suggested_kcal:    kcal    === '' ? null : Number(kcal),
        suggested_protein: protein === '' ? null : Number(protein),
        suggested_carbs:   carbs   === '' ? null : Number(carbs),
        suggested_fat:     fat     === '' ? null : Number(fat),

        notes: notes.trim() || null,
      }
      const { error: err } = await db.supabase.from('ingredient_feedback').insert(payload)
      if (err) throw err
      setDone(true)
      setTimeout(() => onClose?.(), 1200)
    } catch (e) {
      console.error('Feedback submit failed:', e)
      setError(e?.message || 'Versturen mislukt')
    } finally {
      setSaving(false)
    }
  }

  const fieldLabel = {
    display: 'block', fontSize: '0.68rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em',
    textTransform: 'uppercase', marginBottom: 4,
  }
  const fieldInput = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.7rem 0.8rem', minHeight: 46,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#fff', fontSize: '0.95rem', fontWeight: 600,
    outline: 'none',
  }

  const sheet = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        zIndex: 2147483600, display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 600,
          background: '#0a0a0a', borderRadius: '16px 16px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '1rem 1rem calc(1rem + env(safe-area-inset-bottom)) 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.7rem',
          maxHeight: '92vh', overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} color={GOLD} />
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
              Klopt iets niet?
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              minWidth: 40, minHeight: 40, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.4 }}>
          Stuur de juiste waardes door zodat je coach 't ingredient kan aanpassen.
          Velden zijn ingevuld met wat jij nu zag — pas alleen aan wat fout is.
        </div>

        {done ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.85rem', borderRadius: 10,
            background: 'rgba(16,185,129,0.15)', color: '#10b981',
            fontWeight: 700, fontSize: '0.9rem',
          }}>
            <CheckCircle size={18} /> Verstuurd — dankjewel!
          </div>
        ) : (
          <>
            <div>
              <label style={fieldLabel}>Wat moet de naam zijn?</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="bv. Volle Griekse yoghurt 10%"
                style={fieldInput}
              />
            </div>

            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Macro's per 100 g
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '0.5rem' }}>
              <div>
                <label style={fieldLabel}>Kcal</label>
                <input type="number" inputMode="decimal" value={kcal}
                  onChange={(e) => setKcal(e.target.value)} placeholder="0" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Eiwit (g)</label>
                <input type="number" inputMode="decimal" value={protein}
                  onChange={(e) => setProtein(e.target.value)} placeholder="0" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Koolhydraten (g)</label>
                <input type="number" inputMode="decimal" value={carbs}
                  onChange={(e) => setCarbs(e.target.value)} placeholder="0" style={fieldInput} />
              </div>
              <div>
                <label style={fieldLabel}>Vet (g)</label>
                <input type="number" inputMode="decimal" value={fat}
                  onChange={(e) => setFat(e.target.value)} placeholder="0" style={fieldInput} />
              </div>
            </div>

            <div>
              <label style={fieldLabel}>Notitie (optioneel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. ander merk, andere variant…"
                rows={3}
                style={{ ...fieldInput, minHeight: 70, resize: 'vertical', lineHeight: 1.4 }}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.55rem 0.7rem', borderRadius: 6,
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                marginTop: 4, minHeight: 50, padding: '0 0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                background: canSubmit ? GOLD : 'rgba(255,255,255,0.06)',
                color: canSubmit ? '#000' : 'rgba(255,255,255,0.3)',
                border: 'none', borderRadius: 10,
                fontSize: '0.95rem', fontWeight: 800,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={16} /> {saving ? 'Versturen…' : 'Versturen'}
            </button>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
