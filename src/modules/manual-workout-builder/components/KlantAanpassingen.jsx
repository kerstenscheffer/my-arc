// src/modules/manual-workout-builder/components/KlantAanpassingen.jsx
//
// Knop in de kopbalk van de builder: wat de klant zelf aan zijn plan deed
// (wissels, toevoegen, weghalen, overslaan), uit client_plan_changes. Zelfde
// bron als "Aangepast in plan" in Coach Inzicht (10 nov 2026).

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserPen, ArrowLeftRight, Plus, Trash2, SkipForward, X } from 'lucide-react'

const SOORT = {
  wissel_week: { icoon: ArrowLeftRight, wissel: true, sub: 'gewisseld voor deze week' },
  wissel_dag: { icoon: ArrowLeftRight, wissel: true, sub: 'gewisseld voor één dag' },
  wissel_permanent: { icoon: ArrowLeftRight, wissel: true, sub: 'permanent gewisseld' },
  toegevoegd: { icoon: Plus, sub: 'permanent in plan gezet' },
  toegevoegd_week: { icoon: Plus, sub: 'toegevoegd' },
  verwijderd: { icoon: Trash2, sub: 'uit plan gehaald' },
  overgeslagen: { icoon: SkipForward, sub: 'overgeslagen' },
}

export default function KlantAanpassingen({ db, client, knopStijl, refreshKey = 0 }) {
  const [rijen, setRijen] = useState([])
  const [open, setOpen] = useState(false)
  const [plek, setPlek] = useState(null)
  const knopRef = useRef(null)
  const lijstRef = useRef(null)

  useEffect(() => {
    if (!client?.id || !db?.supabase) { setRijen([]); return undefined }
    let weg = false
    db.supabase.from('client_plan_changes')
      .select('id, day_key, dag_naam, soort, oefening, was, door, created_at')
      .eq('client_id', client.id).eq('door', 'klant')
      .order('created_at', { ascending: false }).limit(60)
      .then(({ data }) => { if (!weg) setRijen(data || []) }, () => { if (!weg) setRijen([]) })
    return () => { weg = true }
  }, [client?.id, db, refreshKey])

  useEffect(() => {
    if (!open) return undefined
    const dicht = (e) => {
      if (knopRef.current?.contains(e.target) || lijstRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', dicht)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', dicht); window.removeEventListener('keydown', esc) }
  }, [open])

  const wissel = () => {
    const r = knopRef.current?.getBoundingClientRect()
    if (r) setPlek({ top: r.bottom + 6, left: Math.max(12, Math.min(r.left, window.innerWidth - 352)) })
    setOpen(v => !v)
  }

  const week = Date.now() - 7 * 864e5
  const nieuw = rijen.filter(r => new Date(r.created_at).getTime() > week).length

  return (
    <>
      <button ref={knopRef} onClick={wissel} title="Door de klant zelf aangepast" aria-label="Door de klant aangepast"
        style={{ ...knopStijl, position: 'relative', background: open ? '#fff' : knopStijl.background, color: open ? '#000' : knopStijl.color }}>
        <UserPen size={15} strokeWidth={2.6} />
        {nieuw > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box', borderRadius: 999, background: '#22c55e', color: '#000', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nieuw}</span>
        )}
      </button>
      {open && plek && createPortal(
        <div ref={lijstRef} style={{
          position: 'fixed', top: plek.top, left: plek.left, zIndex: 2147483000, width: 340, maxHeight: 420,
          display: 'flex', flexDirection: 'column', background: '#111', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>Zelf aangepast door {client?.first_name || 'klant'}</div>
            <button onClick={() => setOpen(false)} aria-label="Sluit" style={{ width: 26, height: 26, padding: 0, borderRadius: 7, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </div>
          <div style={{ overflowY: 'auto' }}>
            {!rijen.length && (
              <div style={{ padding: '1.2rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Nog niets zelf aangepast.</div>
            )}
            {rijen.map(r => {
              const m = SOORT[r.soort] || SOORT.toegevoegd
              const Icoon = m.icoon
              const datum = new Date(r.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Icoon size={13} strokeWidth={2.6} color="#fff" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.wissel ? `${r.was || '?'} → ${r.oefening || '?'}` : (r.oefening || 'Oefening')}
                    </div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.sub}{r.dag_naam ? ` · ${r.dag_naam}` : ''} · {datum}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
