// src/modules/lead-management/components/kanban/SaleValueModal.jsx
// Opent wanneer een lead naar een sale-sectie is verplaatst: coach vult de
// order-waarde in + kiest de betaalwijze (vooruitbetaald of maandelijks + looptijd),
// zodat we later de cashflow kunnen berekenen. Portal + hoge z-index + korte
// guard tegen mobiele click-through (zelfde patroon als AddLeadModal).
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Euro, Wallet, CalendarClock } from 'lucide-react'

export default function SaleValueModal({ isMobile, leadName, onSave, onClose }) {
  const [value, setValue] = useState('')
  const [paymentType, setPaymentType] = useState('prepaid') // 'prepaid' | 'monthly'
  const [months, setMonths] = useState('12')
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  const totalNum = parseFloat(String(value).replace(',', '.'))
  const monthsNum = Math.max(1, parseInt(months, 10) || 0)
  const perMonth = (!isNaN(totalNum) && paymentType === 'monthly' && monthsNum > 0)
    ? totalNum / monthsNum : null

  const submit = () => {
    const val = isNaN(totalNum) ? null : totalNum
    const dur = paymentType === 'monthly' ? Math.max(1, parseInt(months, 10) || 12) : 1
    onSave({ value: val, paymentType, durationMonths: dur })
  }

  const pill = (active) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '0.7rem 0.5rem', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 800,
    background: active ? 'rgba(255,215,0,0.16)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
    color: active ? '#FFD700' : 'rgba(255,255,255,0.6)',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }}
      onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#111', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 16, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>🎉 Nieuwe sale!</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          {/* Totale orderwaarde */}
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            Totale orderwaarde van {leadName || 'deze lead'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.8rem 1rem', borderRadius: 12, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.03)', marginBottom: '1.1rem' }}>
            <Euro size={18} color="#FFD700" />
            <input
              type="number" inputMode="decimal" autoFocus value={value}
              onChange={e => setValue(e.target.value)} placeholder="Bijv. 597"
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'inherit' }}
            />
          </div>

          {/* Betaalwijze */}
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            Betaalwijze
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: paymentType === 'monthly' ? '0.9rem' : '1.1rem' }}>
            <div onClick={() => setPaymentType('prepaid')} style={pill(paymentType === 'prepaid')}>
              <Wallet size={15} /> Vooruitbetaald
            </div>
            <div onClick={() => setPaymentType('monthly')} style={pill(paymentType === 'monthly')}>
              <CalendarClock size={15} /> Maandelijks
            </div>
          </div>

          {/* Looptijd + maand-preview (alleen bij maandelijks) */}
          {paymentType === 'monthly' && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Looptijd</span>
                <input
                  type="number" inputMode="numeric" value={months}
                  onChange={e => setMonths(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: 64, textAlign: 'center', padding: '0.5rem', borderRadius: 8, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>maanden</span>
              </div>
              {perMonth != null && (
                <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 700, color: '#22c55e' }}>
                  = €{perMonth.toLocaleString('nl-NL', { maximumFractionDigits: 2 })} per maand × {monthsNum}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation' }}>Overslaan</button>
            <button onClick={submit} style={{ flex: 2, padding: '0.85rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FFD700, #D4AF37)', color: '#000', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>Opslaan</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
