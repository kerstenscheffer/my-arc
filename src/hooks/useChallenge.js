// src/hooks/useChallenge.js
import { useState, useEffect } from 'react'

export function useChallenge(db, clientId) {
  const [isInChallenge, setIsInChallenge] = useState(false)
  const [challengeData, setChallengeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db || !clientId) {
      setLoading(false)
      return
    }

    // Initial load
    checkChallenge()

    // Refresh every 5 minutes
    const interval = setInterval(checkChallenge, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [db, clientId])

  const checkChallenge = async () => {
    try {
      // FIRST: Check if client is assigned to a challenge
      const { data: assignment, error: assignmentError } = await db.supabase
        .from('challenge_assignments')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()

      if (assignmentError || !assignment) {
        // No active challenge assignment
        setIsInChallenge(false)
        setChallengeData(null)
        setLoading(false)
        return
      }

      // Client IS assigned - now get progress data
      const { data: photos } = await db.supabase
        .from('ch8_progress_photos')
        .select('photo_date, photo_type, is_friday_photo, metadata')
        .eq('client_id', clientId)
        .eq('is_friday_photo', true)
        .order('photo_date')

      // Count complete Friday sets (front + side)
      const fridaySets = new Map()
      photos?.forEach(photo => {
        const date = photo.photo_date
        if (!fridaySets.has(date)) {
          fridaySets.set(date, new Set())
        }
        fridaySets.get(date).add(photo.photo_type)
      })

      const completedWeeks = Array.from(fridaySets.entries())
        .filter(([_, types]) => types.has('front') && types.has('side'))
        .length

      // Calculate current week based on assignment start date
      const startDate = new Date(assignment.start_date)
      const now = new Date()
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
      const currentWeek = Math.min(8, Math.floor(daysSinceStart / 7) + 1)

      // Days until next Friday
      const dayOfWeek = now.getDay()
      const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek

      setChallengeData({
        type: '8week',
        currentWeek,
        totalWeeks: 8,
        completedWeeks,
        percentage: Math.round((completedWeeks / 8) * 100),
        daysUntilFriday,
        dayNumber: daysSinceStart + 1,
        isCompliant: completedWeeks >= currentWeek - 1,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        assignedBy: assignment.coach_id
      })
      setIsInChallenge(true)

    } catch (error) {
      console.error('Error checking challenge:', error)
      setIsInChallenge(false)
      setChallengeData(null)
    } finally {
      setLoading(false)
    }
  }

  return { isInChallenge, challengeData, loading, refresh: checkChallenge }
}
