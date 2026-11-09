// src/modules/workout/bouwfase/FaseReflectieBlad.jsx
//
// Einde bouwfase: per oefening eerste tegen laatste training, en een korte
// reflectie (training_fases.reflectie). Daarna maakt de coach het nieuwe schema.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Check } from 'lucide-react'
import HorizontaleSlider from '../../../client/components/HorizontaleSlider'
import { faseProgressie, bewaarReflectie } from './bouwfaseData'

const veld = {
  width: '100%', minHeight: 60, padding: '0.6rem 0.75rem', boxSizing: 'border-box', marginBottom: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
  color: '#fff', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', resize: 'none',
}
const vraag = { fontSize: '0.92rem', fontWeight: 900, color: '#fff', textAlign: 'center', margin: '4px 0 10px' }
const setTekst = (s) => `${s.weight}×${s.reps}`
const CIJFERS = Array.from({ length: 10 }, (_, k) => k + 1)

export default function FaseReflectieBlad({ open, onClose, db, fase, onOpgeslagen }) {
  const [lijst, setLijst] = useState(null)
  const [cijfer, setCijfer] = useState(7)
  const [herstel, setHerstel] = useState(7)
  const [goed, setGoed] = useState('')
  const [beter, setBeter] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (!open || !fase) return undefined
    let weg = false
    setLijst(null); setFout(null)
    faseProgressie(db.supabase, fase).then(l => { if (!weg) setLijst(l) }, () => { if (!weg) setLijst([]) })
    return () => { weg = true }
  }, [open, fase, db])

  if (!open || !fase) return null

  const bewaar = async () => {
    if (bezig) return
    setBezig(true); setFout(null)
    try {
      const reflectie = { cijfer, herstel, goed: goed.trim() || null, beter: beter.trim() || null, ingevuld_op: new Date().toISOString() }
      await bewaarReflectie(db.supabase, fase.id, reflectie)
      onOpgeslagen?.(reflectie)
      onClose?.()
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
    setBezig(false)
  }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.1rem 1rem 1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Je bouwfase</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {lijst?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {lijst.map(o => (
              <div key={o.naam} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{o.naam}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{setTekst(o.eerste)} → {setTekst(o.laatste)}</span>
                </span>
                <span style={{ flexShrink: 0, fontSize: '0.85rem', fontWeight: 900, color: o.verschil > 0 ? '#10b981' : o.verschil < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{o.verschil > 0 ? '+' : ''}{o.verschil}%</span>
              </div>
            ))}
          </div>
        )}

        <div style={vraag}>Hoe ging deze bouwfase?</div>
        <HorizontaleSlider waarden={CIJFERS} waarde={cijfer} onChange={setCijfer} itemBreedte={64} />
        <div style={{ ...vraag, marginTop: 14 }}>Hoe goed kon je herstellen?</div>
        <HorizontaleSlider waarden={CIJFERS} waarde={herstel} onChange={setHerstel} itemBreedte={64} />
        <div style={{ height: 14 }} />
        <textarea value={goed} onChange={e => setGoed(e.target.value)} rows={2} placeholder="Wat ging het beste?" style={veld} />
        <textarea value={beter} onChange={e => setBeter(e.target.value)} rows={2} placeholder="Wat wil je de volgende fase anders?" style={veld} />
        {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10 }}>{fout}</div>}
        <button onClick={bewaar} disabled={bezig} style={{ width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', opacity: bezig ? 0.6 : 1 }}>
          <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : 'Opslaan'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
