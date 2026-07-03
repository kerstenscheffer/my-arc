// src/modules/shopping/tabs/components/AddCustomItemModal.jsx
//
// Modal voor "Eigen ingredient toevoegen" — eenvoudig formulier dat een rij
// schrijft naar client_shopping_custom_items. Geen koppeling aan canonieke
// ingredients-database; puur een persoonlijke aanvulling op de boodschappen-
// lijst (bv. "tandenpasta", "wijn", "een specifiek lokaal product").

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus } from 'lucide-react'

const CATEGORIES = [
  { id: 'protein',    label: 'Eiwit' },
  { id: 'carbs',      label: 'Koolhydraten' },
  { id: 'vegetables', label: 'Groente' },
  { id: 'fruit',      label: 'Fruit' },
  { id: 'dairy',      label: 'Zuivel' },
  { id: 'fats',       label: 'Vetten' },
  { id: 'sauces',     label: 'Sauzen' },
  { id: 'other',      label: 'Overig' },
]

const UNITS = [
  { id: 'stuks',  label: 'stuks' },
  { id: 'gram',   label: 'gram' },
  { id: 'kg',     label: 'kg' },
  { id: 'ml',     label: 'ml' },
  { id: 'liter',  label: 'liter' },
  { id: 'pak',    label: 'pak' },
]

export default function AddCustomItemModal({
  open,
  onClose,
  onSave,
  isMobile,
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('1')
  const [unit, setUnit] = useState('stuks')
  const [category, setCategory] = useState('other')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  const reset = () => {
    setName('')
    setAmount('1')
    setUnit('stuks')
    setCategory('other')
    setCost('')
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Naam is verplicht')
      return
    }
    const amountNum = parseFloat(String(amount).replace(',', '.'))
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('Hoeveelheid moet een getal zijn > 0')
      return
    }
    const costNum = cost === '' ? null : parseFloat(String(cost).replace(',', '.'))
    if (cost !== '' && (!Number.isFinite(costNum) || costNum < 0)) {
      setError('Prijs moet een geldig getal zijn')
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: trimmed,
        amount: amountNum,
        unit,
        category,
        estimated_cost: costNum,
      })
      reset()
      onClose?.()
    } catch (e) {
      console.error('save custom item failed:', e)
      setError(`Opslaan mislukt: ${e.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = {
    fontSize: '0.7rem', fontWeight: 800, color: '#FFD700',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 6, opacity: 0.85,
  }
  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.8rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#fff',
    fontSize: isMobile ? '0.9rem' : '0.95rem',
    fontWeight: 600,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }
  const chipBtn = (active) => ({
    padding: '0.45rem 0.75rem',
    background: active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${active ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 999,
    color: active ? '#FFD700' : 'rgba(255,255,255,0.75)',
    fontSize: '0.74rem',
    fontWeight: active ? 900 : 700,
    cursor: 'pointer',
    flexShrink: 0,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    minHeight: 36,
  })

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, height: '100dvh',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2147483600,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: isMobile ? '20px 20px 0 0' : 16,
          padding: '1.25rem 1.1rem',
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1.25rem)`,
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.3rem',
        }}>
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            Eigen ingrediënt toevoegen
          </div>
          <button onClick={() => !saving && onClose?.()} aria-label="Sluit" style={{
            width: 40, height: 40, padding: 0,
            background: 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 10,
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <label style={labelStyle}>Naam</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bv. Tandpasta, wijn, etc."
            autoFocus
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Hoeveelheid</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1.2 }}>
            <label style={labelStyle}>Eenheid</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {UNITS.map(u => (
                <button
                  key={u.id}
                  onClick={() => setUnit(u.id)}
                  style={chipBtn(unit === u.id)}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Categorie</label>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={chipBtn(category === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Prijs (optioneel)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="€"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.55rem 0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: '0.78rem', fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          style={{
            minHeight: 54,
            padding: '0.85rem',
            background: name.trim() ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)' : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 14,
            color: name.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            fontSize: isMobile ? '0.92rem' : '1rem',
            fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            cursor: saving ? 'wait' : (name.trim() ? 'pointer' : 'not-allowed'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.7 : 1,
            boxShadow: name.trim() ? '0 8px 22px rgba(255,215,0,0.3)' : 'none',
          }}
        >
          <Plus size={20} strokeWidth={2.6} />
          {saving ? 'Toevoegen…' : 'Toevoegen'}
        </button>
      </div>
    </div>,
    document.body
  )
}
