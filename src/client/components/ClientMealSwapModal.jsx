// src/client/components/ClientMealSwapModal.jsx
import { useEffect, useState } from 'react'
import { getMeals, listMealsNearCalories } from '../../lib/mealplanDatabase'

export default function ClientMealSwapModal({ onClose, onPick, targetKcal }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [meals, setMeals] = useState([])

  useEffect(() => {
    // laad snelle suggesties rond target kcal
    ;(async () => {
      setLoading(true)
      try {
        const near = await listMealsNearCalories(targetKcal, 120, 30)
        setMeals(near)
      } finally {
        setLoading(false)
      }
    })()
  }, [targetKcal])

  async function search() {
    setLoading(true)
    try {
      const res = await getMeals({ q })
      setMeals(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="myarc-modal-backdrop">
      <div className="myarc-modal">
        <div className="myarc-modal-header">
          <h3>🔁 Swap maaltijd</h3>
          <button className="myarc-icon-btn" onClick={onClose}>✖</button>
        </div>

        <div className="myarc-flex myarc-gap-sm myarc-mb-lg">
          <input
            className="myarc-input myarc-flex-1"
            placeholder="Zoek maaltijden…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="myarc-btn myarc-btn-primary" onClick={search} disabled={loading}>
            {loading ? 'Zoeken…' : 'Zoek'}
          </button>
        </div>

        <div className="myarc-flex myarc-flex-col myarc-gap-sm" style={{maxHeight: '60vh', overflow: 'auto'}}>
          {loading && <div className="myarc-text-muted">Laden…</div>}
          {!loading && meals.length === 0 && (
            <div className="myarc-text-muted">Geen resultaten</div>
          )}
          {!loading && meals.map(m => (
            <button
              key={m.id}
              className="myarc-card myarc-hover-scale"
              onClick={() => onPick(m)}
              style={{textAlign: 'left'}}
            >
              <div className="myarc-flex myarc-justify-between myarc-items-center">
                <strong>{m.name}</strong>
                <span className="myarc-badge myarc-badge-info">{m.kcal} kcal</span>
              </div>
              <div className="myarc-text-muted" style={{fontSize: '0.85rem'}}>
                P:{m.protein}g • KH:{m.carbs}g • V:{m.fat}g
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

