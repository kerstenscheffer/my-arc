// src/modules/manual-workout-builder/components/WorkoutLogsModal.jsx
//
// Gelogde sessies van de klant als zwevend venster in de builder (10 nov 2026):
// te verslepen aan de kop, te vergroten aan de hoek, in te klappen, en zonder
// gedimde achtergrond, zodat je ernaast gewoon verder bouwt. Zelfde gedrag als
// het to-do-venster (useZwevendVenster). De sessies zelf komen uit WorkoutColumn
// van Coach Inzicht (alleenSessies), met data uit dezelfde service.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { History, GripVertical, Minus, Maximize2, X } from 'lucide-react'
import CommandCenterService from '../../coach-command-center/CommandCenterService'
import WorkoutColumn from '../../coach-command-center/components/insight/WorkoutColumn'
import useZwevendVenster from '../../../components/useZwevendVenster'

const kopKnop = {
  width: 26, height: 26, flexShrink: 0, padding: 0, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
}

export default function WorkoutLogsModal({ db, client, isMobile, onClose }) {
  const [data, setData] = useState(null)
  const { ingeklapt, setIngeklapt, herstel, vensterStijl, sleepHandvat, formaatHandvat } =
    useZwevendVenster({ isMobile, standaard: { w: 440, h: 640 } })

  useEffect(() => {
    let weg = false
    const svc = new CommandCenterService(db)
    Promise.all([
      svc.getClientsWorkoutData([client.id]),
      svc.getClientsExerciseProgress([client.id]),
    ]).then(([w, p]) => {
      if (!weg) setData({ workoutData: w?.[client.id] || null, exerciseProgress: p?.[client.id] || {} })
    }, () => { if (!weg) setData({ workoutData: null, exerciseProgress: {} }) })
    return () => { weg = true }
  }, [db, client.id])

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return createPortal(
    <div style={{
      ...vensterStijl,
      // Onder de pop-ups van de builder zelf (oefening kiezen, bewerken).
      zIndex: 9000,
      background: '#000',
      border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)',
      borderRadius: isMobile ? 0 : 14,
      boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85)',
    }}>
      <div {...sleepHandvat} style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0,
        padding: isMobile ? '0.85rem 1rem' : '0.55rem 0.6rem 0.55rem 0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        ...(sleepHandvat.style || {}),
      }}>
        {!isMobile && <GripVertical size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />}
        <History size={15} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Workout logs{client.first_name ? ` · ${client.first_name}` : ''}
        </span>
        {!isMobile && (
          <button onClick={() => setIngeklapt(v => !v)} title={ingeklapt ? 'Uitklappen' : 'Inklappen'} aria-label={ingeklapt ? 'Uitklappen' : 'Inklappen'} style={kopKnop}>
            <Minus size={16} strokeWidth={2.8} />
          </button>
        )}
        {!isMobile && (
          <button onClick={herstel} title="Terug naar het midden" aria-label="Terug naar het midden" style={kopKnop}>
            <Maximize2 size={15} strokeWidth={2.8} />
          </button>
        )}
        <button onClick={onClose} aria-label="Sluiten" style={kopKnop}>
          <X size={17} strokeWidth={2.8} />
        </button>
      </div>

      {!ingeklapt && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {data
            ? <WorkoutColumn db={db} client={client} isMobile={isMobile}
                workoutData={data.workoutData} exerciseProgress={data.exerciseProgress} alleenSessies />
            : <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 700 }}>Laden…</div>}
        </div>
      )}

      {formaatHandvat && !ingeklapt && (
        <div {...formaatHandvat} style={{
          position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, cursor: 'se-resize',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 3,
        }}>
          <div style={{ width: 8, height: 8, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)' }} />
        </div>
      )}
    </div>,
    document.body
  )
}
