// src/funnel/90days/components/Countdown.jsx

import { useState, useEffect } from 'react'
import { GOLD, pp } from '../colors'
import DatabaseService from '../../../services/DatabaseService'

// Calculate next bi-weekly Wednesday at 23:59:59
function getNextBiWeeklyWednesday() {
  // Anchor date: a known Wednesday to count from (e.g. March 12, 2026)
  const anchor = new Date('2026-03-11T23:59:59')
  const now = new Date()
  
  // How many ms since anchor
  const diff = now.getTime() - anchor.getTime()
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
  
  // How many full 2-week cycles have passed
  const cyclesPassed = Math.floor(diff / twoWeeksMs)
  
  // Next deadline = anchor + (cyclesPassed + 1) * 2 weeks
  const next = new Date(anchor.getTime() + (cyclesPassed + 1) * twoWeeksMs)
  
  // If we're past anchor but before first cycle, use anchor
  if (now < anchor) return anchor

  return next
}

export default function Countdown({ isMobile }) {
  const [t, setT] = useState({ d: '00', h: '00', m: '00', s: '00' })
  const [spots, setSpots] = useState(null)
  const [deadline] = useState(() => getNextBiWeeklyWednesday().getTime())

  // Load spots from main_offer_spots
  useEffect(() => {
    const loadSpots = async () => {
      try {
        const spotsService = DatabaseService.getSpotsService()
        const data = await spotsService.getMainOfferSpots()
        setSpots(data)
      } catch (err) {
        console.error('Spots load failed:', err)
        setSpots({ current_spots: 2, max_spots: 5 })
      }
    }
    loadSpots()

    // Subscribe to real-time updates
    try {
      const spotsService = DatabaseService.getSpotsService()
      const sub = spotsService.subscribeToMainOfferSpots((newData) => {
        setSpots(newData)
      })
      return () => sub.unsubscribe()
    } catch (err) {
      // Fallback if subscription fails
    }
  }, [])

  // Countdown tick
  useEffect(() => {
    const tick = () => {
      const diff = deadline - Date.now()
      if (diff <= 0) {
        setT({ d: '00', h: '00', m: '00', s: '00' })
        return
      }
      setT({
        d: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      })
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [deadline])

  const available = spots ? spots.max_spots - spots.current_spots : null
  const maxSpots = spots?.max_spots || 5

  return (
    <div style={{
      padding: isMobile ? '0.75rem 1rem 0.5rem' : '1rem 2rem 0.6rem',
      textAlign: 'center',
    }}>
      {/* MY ARC — darker gold */}
      <div style={{
        fontFamily: pp, fontWeight: 900,
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: '0',
        color: '#b8860b',
      }}>MY ARC</div>

      <style>{`
        @keyframes spotsLivePulse {
          0%, 100% { opacity: 1; transform: scale(1) }
          50% { opacity: 0.5; transform: scale(1.4) }
        }
      `}</style>
    </div>
  )
}
