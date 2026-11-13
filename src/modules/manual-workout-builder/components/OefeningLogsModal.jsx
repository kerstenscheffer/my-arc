// src/modules/manual-workout-builder/components/OefeningLogsModal.jsx
//
// Logs van de klant voor één oefening, vanuit de builder (13 nov 2026,
// Kersten): de krachtgrafiek en wat hij per keer deed, zonder de builder te
// verlaten. Dezelfde grafiek en historie als in het logscherm van de klant,
// hier alleen om te lezen.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X } from 'lucide-react'
import ExerciseProgressChart from '../../workout/components/todays-workout/components/ExerciseProgressChart'

export default function OefeningLogsModal({ db, client, exercise, isMobile, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  // Alle keren onder elkaar, nieuwste boven. De historie uit het logscherm van
  // de klant bladert per week; hier wil je in één keer naar beneden scrollen.
  const [keren, setKeren] = useState(null) // null = laden
  useEffect(() => {
    let weg = false
    ;(async () => {
      try {
        const { data: sessies } = await db.supabase.from('workout_sessions').select('id, workout_date')
          .eq('client_id', client.id).order('workout_date', { ascending: false }).limit(400)
        if (!sessies?.length) { if (!weg) setKeren([]); return }
        const { data: rijen } = await db.supabase.from('workout_progress').select('session_id, sets, notes, created_at')
          .in('session_id', sessies.map(x => x.id)).eq('exercise_name', exercise.name)
        const datum = new Map(sessies.map(x => [x.id, x.workout_date]))
        const perDag = new Map()
        for (const r of rijen || []) {
          const d = datum.get(r.session_id)
          if (!d || !Array.isArray(r.sets) || !r.sets.length) continue
          const dag = perDag.get(d) || { datum: d, sets: [], notities: [] }
          dag.sets.push(...r.sets)
          if (r.notes) dag.notities.push(r.notes)
          perDag.set(d, dag)
        }
        if (!weg) setKeren([...perDag.values()].sort((a, b) => (a.datum < b.datum ? 1 : -1)))
      } catch (e) {
        console.warn('Logs van de oefening niet geladen:', e?.message)
        if (!weg) setKeren([])
      }
    })()
    return () => { weg = true }
  }, [db, client.id, exercise.name])

  // Kliks en slepen in dit venster lopen via React terug naar de oefeningkaart
  // eronder; die begon dan te verslepen in plaats van dat je kon scrollen.
  const stil = (e) => e.stopPropagation()
  const naam = [client?.first_name, client?.last_name].filter(Boolean).join(' ')
  return createPortal(
    <div onClick={(e) => { e.stopPropagation(); onClose() }} onPointerDown={stil} onPointerMove={stil} onPointerUp={stil} onDragStart={stil} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 620, height: isMobile ? '100%' : 'min(88vh, 780px)', background: '#0a0a0a', color: '#fff',
        border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: isMobile ? 0 : 16,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '0.85rem 0.9rem' : '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exercise.name}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Logs van {naam || 'de klant'}</div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, flexShrink: 0, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: '1rem' }}>
          <ExerciseProgressChart db={db} client={client} exerciseName={exercise.name} isMobile={isMobile} />
          <div style={{ margin: isMobile ? '1rem 1rem 0' : '1.1rem 1.25rem 0' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 4 }}>Alle keren{keren?.length ? ` · ${keren.length}` : ''}</div>
            {keren === null && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>}
            {keren?.length === 0 && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Deze oefening is nog niet gelogd.</div>}
            {keren?.map(k => (
              <div key={k.datum} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 92, fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                    {new Date(`${k.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: '0.9rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {k.sets.map((st, i) => (
                      <span key={i} style={{ whiteSpace: 'nowrap', color: st.snelheid ? 'rgba(255,255,255,0.75)' : '#fff' }}>
                        {st.weight || 0}<span style={{ fontSize: '0.7em', color: 'rgba(255,255,255,0.4)' }}>kg</span>×{st.reps || 0}
                        {st.partials ? <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.5)' }}> +{st.partials}p</span> : null}
                      </span>
                    ))}
                  </span>
                </div>
                {k.notities.length > 0 && <div style={{ marginTop: 3, marginLeft: 102, fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap' }}>{k.notities.join(' · ')}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
