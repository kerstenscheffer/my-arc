// src/modules/manual-workout-builder/components/WorkoutLogsModal.jsx
//
// Workout-logs van de klant als pop-up in de builder (10 nov 2026): dezelfde
// kolom als in Coach Inzicht (WorkoutColumn), zodat je tijdens het bouwen ziet
// wat de klant echt logt. Data komt uit dezelfde service als Coach Inzicht.

import { useEffect, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { Dumbbell } from 'lucide-react'
import CommandCenterService from '../../coach-command-center/CommandCenterService'
import WorkoutColumn from '../../coach-command-center/components/insight/WorkoutColumn'
import { KolomKop } from '../../coach-command-center/components/insight/KolomKop'

export default function WorkoutLogsModal({ db, client, isMobile, onClose }) {
  const [data, setData] = useState(null)

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
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 520, height: isMobile ? '92vh' : '88vh',
        background: '#000', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: isMobile ? '16px 16px 0 0' : 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <KolomKop icon={Dumbbell} titel={`Workout logs · ${client.first_name || ''}`.trim()} onVerberg={onClose}>
          {data
            ? <WorkoutColumn db={db} client={client} isMobile={isMobile}
                workoutData={data.workoutData} exerciseProgress={data.exerciseProgress} />
            : <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 700 }}>Laden…</div>}
        </KolomKop>
      </div>
    </div>
  )
}
