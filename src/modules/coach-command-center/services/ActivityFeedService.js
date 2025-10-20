// ActivityFeedService.js - Complete real-time client activity aggregation service
class ActivityFeedService {
  constructor(db) {
    this.db = db
    this.supabase = db.supabase
  }

  async getRecentActivities(clientIds, hoursBack = 24) {
    console.log('🔍 Starting getRecentActivities with:', { 
      clientIds: clientIds?.length || 0, 
      hoursBack 
    })
    
    if (!clientIds || clientIds.length === 0) {
      console.warn('⚠️ No client IDs provided')
      return []
    }
    
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
    console.log('📅 Fetching activities since:', since)
    
    const activities = []

    try {
      // 1. MEAL TRACKING
      console.log('🍽️ Fetching meal progress...')
      try {
        const { data: mealData, error: mealError } = await this.supabase
          .from('ai_meal_progress')
          .select('*')
          .in('client_id', clientIds)
          .gte('updated_at', since)
          .order('updated_at', { ascending: false })
          .limit(50)

        console.log('🍽️ Meal result:', { 
          count: mealData?.length || 0, 
          error: mealError?.message 
        })

        if (mealData && mealData.length > 0) {
          mealData.forEach(meal => {
            activities.push({
              id: `meal_${meal.id}`,
              clientId: meal.client_id,
              type: 'meal',
              icon: '🍽️',
              message: `logged ${meal.meals_consumed || 0}/${meal.meals_planned || 0} meals`,
              detail: `${meal.total_calories || 0} kcal, ${Math.round(meal.total_protein || 0)}g protein`,
              timestamp: new Date(meal.updated_at),
              rawData: meal
            })
          })
        }
      } catch (err) {
        console.error('❌ Meal query failed:', err)
      }

      // 2. WORKOUT COMPLETIONS
      console.log('💪 Fetching workout sessions...')
      try {
        const { data: workoutData, error: workoutError } = await this.supabase
          .from('workout_sessions')
          .select('*')
          .in('client_id', clientIds)
          .gte('completed_at', since)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(50)

        console.log('💪 Workout result:', { 
          count: workoutData?.length || 0, 
          error: workoutError?.message 
        })

        if (workoutData && workoutData.length > 0) {
          workoutData.forEach(workout => {
            const exerciseCount = workout.exercises_completed ? 
              Object.keys(workout.exercises_completed).length : 0
            
            activities.push({
              id: `workout_${workout.id}`,
              clientId: workout.client_id,
              type: 'workout',
              icon: '💪',
              message: `completed ${workout.day_display_name || 'workout'}`,
              detail: `${exerciseCount} exercises, ${workout.duration_minutes || 0} min`,
              timestamp: new Date(workout.completed_at),
              rawData: workout
            })
          })
        }
      } catch (err) {
        console.error('❌ Workout query failed:', err)
      }

      // 3. WEIGHT TRACKING
      console.log('⚖️ Fetching weight tracking...')
      try {
        const { data: weightData, error: weightError } = await this.supabase
          .from('weight_tracking')
          .select('*')
          .in('client_id', clientIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('⚖️ Weight result:', { 
          count: weightData?.length || 0, 
          error: weightError?.message 
        })

        if (weightData && weightData.length > 0) {
          weightData.forEach(weight => {
            const extras = []
            if (weight.body_fat_percentage) {
              extras.push(`${weight.body_fat_percentage}% fat`)
            }
            if (weight.muscle_mass) {
              extras.push(`${weight.muscle_mass}kg muscle`)
            }
            
            activities.push({
              id: `weight_${weight.id}`,
              clientId: weight.client_id,
              type: 'weight',
              icon: '⚖️',
              message: 'logged weight',
              detail: `${weight.weight} kg${extras.length > 0 ? ' • ' + extras.join(' • ') : ''}`,
              timestamp: new Date(weight.created_at),
              rawData: weight
            })
          })
        }
      } catch (err) {
        console.error('❌ Weight query failed:', err)
      }

      // 4. WATER TRACKING
      console.log('💧 Fetching water tracking...')
      try {
        const { data: waterData, error: waterError } = await this.supabase
          .from('water_tracking')
          .select('*')
          .in('client_id', clientIds)
          .gte('updated_at', since)
          .order('updated_at', { ascending: false })
          .limit(50)

        console.log('💧 Water result:', { 
          count: waterData?.length || 0, 
          error: waterError?.message 
        })

        if (waterData && waterData.length > 0) {
          waterData.forEach(water => {
            const percentage = water.target_liters > 0 
              ? Math.round((water.amount_liters / water.target_liters) * 100)
              : 0
            
            activities.push({
              id: `water_${water.id}`,
              clientId: water.client_id,
              type: 'water',
              icon: '💧',
              message: 'tracked water intake',
              detail: `${water.amount_liters}L / ${water.target_liters}L (${percentage}%)`,
              timestamp: new Date(water.updated_at),
              rawData: water
            })
          })
        }
      } catch (err) {
        console.error('❌ Water query failed:', err)
      }

      // 5. MOOD LOGS
      console.log('😊 Fetching mood logs...')
      try {
        const { data: moodData, error: moodError } = await this.supabase
          .from('ai_mood_logs')
          .select('*')
          .in('client_id', clientIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('😊 Mood result:', { 
          count: moodData?.length || 0, 
          error: moodError?.message 
        })

        if (moodData && moodData.length > 0) {
          const moodEmojis = ['😔', '😕', '😐', '🙂', '😊']
          moodData.forEach(mood => {
            const emoji = moodEmojis[Math.min(Math.max(mood.mood_score - 1, 0), 4)]
            
            activities.push({
              id: `mood_${mood.id}`,
              clientId: mood.client_id,
              type: 'mood',
              icon: emoji,
              message: 'logged mood',
              detail: mood.mood_reason || `Score: ${mood.mood_score}/5`,
              timestamp: new Date(mood.created_at),
              rawData: mood
            })
          })
        }
      } catch (err) {
        console.error('❌ Mood query failed:', err)
      }

      // 6. PROGRESS PHOTOS
      console.log('📸 Fetching progress photos...')
      try {
        const { data: photoData, error: photoError } = await this.supabase
          .from('progress_photos')
          .select('*')
          .in('client_id', clientIds)
          .gte('created_at', since)
          .eq('is_private', false)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('📸 Photo result:', { 
          count: photoData?.length || 0, 
          error: photoError?.message 
        })

        if (photoData && photoData.length > 0) {
          photoData.forEach(photo => {
            activities.push({
              id: `photo_${photo.id}`,
              clientId: photo.client_id,
              type: 'photo',
              icon: '📸',
              message: 'uploaded progress photo',
              detail: photo.photo_type || 'Photo',
              timestamp: new Date(photo.created_at),
              rawData: photo
            })
          })
        }
      } catch (err) {
        console.error('❌ Photo query failed:', err)
      }

      // 7. VIDEO ANALYTICS
      console.log('📺 Fetching video analytics...')
      try {
        const { data: videoData, error: videoError } = await this.supabase
          .from('video_analytics')
          .select('*')
          .in('client_id', clientIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('📺 Video result:', { 
          count: videoData?.length || 0, 
          error: videoError?.message 
        })

        if (videoData && videoData.length > 0) {
          videoData.forEach(video => {
            const watchPercent = video.average_watch_percentage || 0
            const watchMinutes = Math.round((video.total_watch_time || 0) / 60)
            
            activities.push({
              id: `video_${video.id}`,
              clientId: video.client_id,
              type: 'video',
              icon: '📺',
              message: 'watched video',
              detail: `${watchPercent}% completed • ${watchMinutes} min`,
              timestamp: new Date(video.created_at),
              rawData: video
            })
          })
        }
      } catch (err) {
        console.error('❌ Video query failed:', err)
      }

      // 8. CLIENT CALLS
      console.log('📞 Fetching client calls...')
      try {
        const { data: callData, error: callError } = await this.supabase
          .from('client_calls')
          .select('*')
          .in('client_id', clientIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('📞 Call result:', { 
          count: callData?.length || 0, 
          error: callError?.message 
        })

        if (callData && callData.length > 0) {
          callData.forEach(call => {
            let message = 'scheduled a call'
            let detail = ''
            
            if (call.completed_date) {
              message = 'completed call'
              detail = `${call.duration_minutes || 30} minutes`
            } else if (call.canceled_at) {
              message = 'canceled call'
              detail = call.call_title || 'Call canceled'
            } else if (call.scheduled_date) {
              message = 'scheduled call'
              const date = new Date(call.scheduled_date)
              detail = `${date.toLocaleDateString('nl-NL')} at ${date.toLocaleTimeString('nl-NL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}`
            }
            
            activities.push({
              id: `call_${call.id}`,
              clientId: call.client_id,
              type: 'call',
              icon: '📞',
              message: message,
              detail: detail,
              timestamp: new Date(call.created_at),
              rawData: call
            })
          })
        }
      } catch (err) {
        console.error('❌ Call query failed:', err)
      }

      // Sort all activities by timestamp (newest first)
      console.log('📊 Total activities collected:', activities.length)
      activities.sort((a, b) => b.timestamp - a.timestamp)

      // Limit to 20 most recent
      const finalActivities = activities.slice(0, 20)
      
      console.log('✅ Final activities:', {
        total: finalActivities.length,
        types: finalActivities.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1
          return acc
        }, {})
      })
      
      return finalActivities

    } catch (error) {
      console.error('❌ CRITICAL ERROR in getRecentActivities:', error)
      return []
    }
  }

  // Get client names for activities
  async enrichWithClientNames(activities, clients) {
    const clientMap = {}
    clients.forEach(client => {
      clientMap[client.id] = `${client.first_name} ${client.last_name || ''}`.trim()
    })

    return activities.map(activity => ({
      ...activity,
      clientName: clientMap[activity.clientId] || 'Unknown',
      timeAgo: this.getTimeAgo(activity.timestamp)
    }))
  }

  getTimeAgo(timestamp) {
    const now = new Date()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days} days ago`
    return timestamp.toLocaleDateString('nl-NL')
  }

  // Subscribe to real-time updates
  subscribeToActivities(clientIds, callback) {
    const channels = []

    // Subscribe to each table
    const tables = [
      'ai_meal_progress',
      'workout_sessions',
      'weight_tracking',
      'water_tracking',
      'ai_mood_logs',
      'progress_photos',
      'video_analytics',
      'client_calls'
    ]

    tables.forEach(table => {
      const channel = this.supabase
        .channel(`${table}_changes_${Date.now()}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: clientIds.length > 0 ? `client_id=in.(${clientIds.join(',')})` : undefined
          },
          (payload) => {
            console.log(`📡 Real-time update from ${table}:`, payload)
            callback(payload)
          }
        )
        .subscribe()
      
      channels.push(channel)
    })

    // Return unsubscribe function
    return () => {
      channels.forEach(channel => {
        this.supabase.removeChannel(channel)
      })
    }
  }
}

export default ActivityFeedService
