// src/modules/videos/VideoService.js - COMPLETE FIXED
import DatabaseService from '../../services/DatabaseService'

const { supabase } = DatabaseService

const videoService = {
  // ========================================
  // THUMBNAIL UPLOAD
  // ========================================
  uploadThumbnail: async (file, coachId) => {
    try {
      if (!file) {
        return { success: false, error: 'Geen bestand geselecteerd' }
      }

      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Bestand is te groot (max 5MB)' }
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Ongeldig bestandstype (gebruik JPG of PNG)' }
      }

      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `coach_${coachId}/thumbnails/${timestamp}_${randomString}.${fileExtension}`

      const bucketOptions = ['coach-content', 'video-thumbnails', 'files']
      let uploadSuccess = false
      let uploadData = null
      let bucketUsed = null

      for (const bucket of bucketOptions) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (!error && data) {
            uploadSuccess = true
            uploadData = data
            bucketUsed = bucket
            console.log(`✅ Upload succesvol naar bucket: ${bucket}`)
            break
          }
        } catch (err) {
          console.log(`❌ Bucket ${bucket} niet beschikbaar`)
        }
      }

      if (!uploadSuccess) {
        return { 
          success: false, 
          error: `Geen werkende storage bucket gevonden`
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketUsed)
        .getPublicUrl(fileName)

      return { 
        success: true, 
        thumbnailUrl: publicUrl,
        filePath: fileName,
        bucket: bucketUsed 
      }
    } catch (error) {
      console.error('❌ Thumbnail upload failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // DELETE THUMBNAIL
  // ========================================
  deleteThumbnail: async (filePath, bucket = null) => {
    try {
      if (!filePath) return { success: true }

      const bucketOptions = bucket ? [bucket] : ['coach-content', 'video-thumbnails', 'files']
      let deleteSuccess = false

      for (const bucketName of bucketOptions) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath])

          if (!error) {
            deleteSuccess = true
            break
          }
        } catch (err) {
          console.log(`Bucket ${bucketName} skip`)
        }
      }

      return { success: deleteSuccess }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // CREATE VIDEO
  // ========================================
  createVideo: async (videoData) => {
    try {
      const { data, error } = await supabase
        .from('coach_videos')
        .insert([{
          coach_id: videoData.coach_id,
          title: videoData.title,
          description: videoData.description,
          video_url: videoData.video_url,
          thumbnail_url: videoData.thumbnail_url,
          category: videoData.category,
          tags: videoData.tags || [],
          difficulty_level: videoData.difficulty_level || 'beginner',
          best_time_to_watch: videoData.best_time_to_watch || 'anytime',
          duration_seconds: videoData.duration_seconds || null,
          default_pages: videoData.default_pages || [],
          is_active: true,
          view_count: 0,
          like_count: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Video creation error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Video created:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Video creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // UPDATE VIDEO
  // ========================================
  updateVideo: async (videoId, updates) => {
    try {
      const { data, error } = await supabase
        .from('coach_videos')
        .update(updates)
        .eq('id', videoId)
        .select()
        .single()

      if (error) {
        console.error('❌ Video update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Video update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // DELETE VIDEO
  // ========================================
  deleteVideo: async (videoId) => {
    try {
      const { data: video } = await supabase
        .from('coach_videos')
        .select('thumbnail_url')
        .eq('id', videoId)
        .single()

      if (video?.thumbnail_url) {
        const urlParts = video.thumbnail_url.split('/video-thumbnails/')
        if (urlParts[1]) {
          await videoService.deleteThumbnail(urlParts[1])
        }
      }

      await supabase
        .from('video_assignments')
        .delete()
        .eq('video_id', videoId)

      const { error } = await supabase
        .from('coach_videos')
        .delete()
        .eq('id', videoId)

      if (error) {
        console.error('❌ Video delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Video delete failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // GET COACH VIDEOS
  // ========================================
  getCoachVideos: async (coachId) => {
    try {
      const { data, error } = await supabase
        .from('coach_videos')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching videos:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error)
      return []
    }
  },

  // ========================================
  // GET VIDEO ASSIGNMENTS
  // ========================================
  getVideoAssignments: async (videoId) => {
    try {
      const { data, error } = await supabase
        .from('video_assignments')
        .select(`
          *,
          client:clients(id, first_name, last_name, email)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching video assignments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch video assignments:', error)
      return []
    }
  },

  // ========================================
  // ASSIGN VIDEO
  // ========================================
  assignVideo: async (videoId, clientIds, assignmentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Geen gebruiker ingelogd' }
      }

      const assignments = clientIds.map(clientId => ({
        video_id: videoId,
        client_id: clientId,
        assigned_by: user.id,
        assignment_type: assignmentData.type || 'manual',
        scheduled_for: assignmentData.scheduledFor || new Date().toISOString().split('T')[0],
        time_of_day: assignmentData.timeOfDay || 'anytime',
        status: 'pending',
        page_context: assignmentData.pageContext || 'home',
        context_data: assignmentData.contextData || {},
        notes: assignmentData.notes || '',
        created_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('video_assignments')
        .insert(assignments)
        .select()

      if (error) {
        console.error('❌ Video assignment error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Video assigned to clients:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Video assignment failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // UNASSIGN VIDEO
  // ========================================
  unassignVideo: async (videoId, clientIds) => {
    try {
      const { error } = await supabase
        .from('video_assignments')
        .delete()
        .eq('video_id', videoId)
        .in('client_id', clientIds)

      if (error) {
        console.error('❌ Video unassign error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Video unassigned from ${clientIds.length} client(s)`)
      return { success: true }
    } catch (error) {
      console.error('❌ Video unassign failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // UNASSIGN ALL CLIENTS
  // ========================================
  unassignAllClients: async (videoId) => {
    try {
      const { error } = await supabase
        .from('video_assignments')
        .delete()
        .eq('video_id', videoId)

      if (error) {
        console.error('❌ Bulk unassign error:', error)
        return { success: false, error: error.message }
      }

      console.log(`✅ Video unassigned from all clients`)
      return { success: true }
    } catch (error) {
      console.error('❌ Bulk unassign failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // UPDATE ASSIGNMENT
  // ========================================
  updateAssignment: async (assignmentId, updates) => {
    try {
      const { data, error } = await supabase
        .from('video_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) {
        console.error('❌ Assignment update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Assignment update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // 🔥 FIXED: GET VIDEOS FOR PAGE (Client Dashboard)
  // Haalt ZOWEL assigned videos ALS default videos op
  // ========================================
  getVideosForPage: async (clientId, pageContext = 'home') => {
    try {
      console.log('📹 Loading videos for client:', clientId, 'page:', pageContext)
      
      // STAP 1: Haal ASSIGNED videos op
      const { data: assignments, error: assignmentError } = await supabase
        .from('video_assignments')
        .select('*')
        .eq('client_id', clientId)
        .eq('page_context', pageContext)
        .order('scheduled_for', { ascending: false })

      if (assignmentError) {
        console.error('❌ Error fetching assignments:', assignmentError)
        return []
      }

      console.log('📹 Found assignments:', assignments?.length || 0)

      // STAP 2: Haal DEFAULT videos voor deze pagina
      const { data: defaultVideos, error: defaultError } = await supabase
        .from('coach_videos')
        .select('*')
        .contains('default_pages', [pageContext])
        .eq('is_active', true)

      if (defaultError) {
        console.error('❌ Error fetching default videos:', defaultError)
      } else {
        console.log('📹 Found default videos:', defaultVideos?.length || 0)
      }

      // STAP 3: Haal video details voor assignments
      let assignedVideoData = []
      if (assignments && assignments.length > 0) {
        const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
        
        if (videoIds.length > 0) {
          const { data: videos, error: videoError } = await supabase
            .from('coach_videos')
            .select('*')
            .in('id', videoIds)
            .eq('is_active', true)

          if (!videoError && videos) {
            const videoMap = new Map(videos.map(v => [v.id, v]))
            
            assignedVideoData = assignments
              .map(assignment => ({
                id: assignment.id,
                assignment_id: assignment.id,
                video_id: assignment.video_id,
                video: videoMap.get(assignment.video_id),
                scheduled_for: assignment.scheduled_for,
                completed: assignment.status === 'completed',
                viewed_at: assignment.viewed_at,
                status: assignment.status,
                is_default: false
              }))
              .filter(item => item.video !== null && item.video !== undefined)
          }
        }
      }

      // STAP 4: Format default videos
      const defaultVideoData = (defaultVideos || []).map(v => ({
        id: `default-${v.id}`,
        assignment_id: null,
        video_id: v.id,
        video: v,
        scheduled_for: null,
        completed: false,
        viewed_at: null,
        status: 'pending',
        is_default: true
      }))

      // STAP 5: Verwijder duplicaten (default videos die ook assigned zijn)
      const assignedVideoIds = new Set(assignedVideoData.map(a => a.video_id))
      const uniqueDefaultVideos = defaultVideoData.filter(d => !assignedVideoIds.has(d.video_id))

      // STAP 6: Combineer
      const allVideos = [...assignedVideoData, ...uniqueDefaultVideos]

      console.log(`✅ Total: ${allVideos.length} videos (${assignedVideoData.length} assigned + ${uniqueDefaultVideos.length} default)`)

      // Sort: scheduled eerst, dan defaults
      allVideos.sort((a, b) => {
        if (a.scheduled_for && !b.scheduled_for) return -1
        if (!a.scheduled_for && b.scheduled_for) return 1
        if (a.scheduled_for && b.scheduled_for) {
          return new Date(b.scheduled_for) - new Date(a.scheduled_for)
        }
        return 0
      })

      return allVideos

    } catch (error) {
      console.error('❌ Failed to fetch videos for page:', error)
      return []
    }
  },

  // ========================================
  // GET CLIENT ASSIGNMENTS
  // ========================================
  getClientAssignments: async (clientId, pageContext = null) => {
    try {
      let query = supabase
        .from('video_assignments')
        .select(`
          *,
          video:coach_videos(*)
        `)
        .eq('client_id', clientId)
        .order('scheduled_for', { ascending: true })

      if (pageContext) {
        query = query.eq('page_context', pageContext)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching assignments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch assignments:', error)
      return []
    }
  },

  // ========================================
  // GET TODAY'S VIDEOS
  // ========================================
  getTodaysVideos: async (clientId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: assignments, error: assignmentError } = await supabase
        .from('video_assignments')
        .select('*')
        .eq('client_id', clientId)
        .eq('scheduled_for', today)
        .in('status', ['pending', 'viewed'])
        .order('time_of_day', { ascending: true })

      if (assignmentError) {
        console.error('❌ Error fetching today\'s videos:', assignmentError)
        return []
      }

      if (!assignments || assignments.length === 0) {
        return []
      }

      const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
      
      if (videoIds.length === 0) {
        return []
      }

      const { data: videos, error: videoError } = await supabase
        .from('coach_videos')
        .select('*')
        .in('id', videoIds)

      if (videoError) {
        console.error('❌ Error fetching videos:', videoError)
        return []
      }

      const videoMap = new Map()
      videos?.forEach(video => {
        videoMap.set(video.id, video)
      })

      const result = assignments.map(assignment => ({
        ...assignment,
        video: videoMap.get(assignment.video_id) || null
      })).filter(item => item.video !== null)

      return result
    } catch (error) {
      console.error('❌ Failed to fetch today\'s videos:', error)
      return []
    }
  },

  // ========================================
  // MARK AS VIEWED
  // ========================================
  markAsViewed: async (assignmentId) => {
    try {
      const { error: assignmentError } = await supabase
        .from('video_assignments')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (assignmentError) {
        console.error('❌ Error updating assignment:', assignmentError)
        return { success: false }
      }

      const { data: assignment } = await supabase
        .from('video_assignments')
        .select('video_id')
        .eq('id', assignmentId)
        .single()

      if (assignment?.video_id) {
        await supabase.rpc('increment', {
          table_name: 'coach_videos',
          column_name: 'view_count',
          row_id: assignment.video_id
        }).catch(() => {
          return supabase
            .from('coach_videos')
            .update({ 
              view_count: supabase.raw('view_count + 1')
            })
            .eq('id', assignment.video_id)
        })
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Failed to mark as viewed:', error)
      return { success: false }
    }
  },

  markVideoAsViewed: async (assignmentId) => {
    return videoService.markAsViewed(assignmentId)
  },

  // ========================================
  // MARK AS COMPLETED
  // ========================================
  markAsCompleted: async (assignmentId, watchDuration, rating = null, feedback = null) => {
    try {
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        watch_duration: watchDuration
      }

      if (rating) updateData.client_rating = rating
      if (feedback) updateData.client_feedback = feedback

      const { error } = await supabase
        .from('video_assignments')
        .update(updateData)
        .eq('id', assignmentId)

      if (error) {
        console.error('❌ Error marking as completed:', error)
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Failed to mark as completed:', error)
      return { success: false }
    }
  },

  markVideoAsCompleted: async (assignmentId, watchDuration) => {
    return videoService.markAsCompleted(assignmentId, watchDuration)
  },

  // ========================================
  // RATE VIDEO
  // ========================================
  rateVideo: async (assignmentId, rating, feedback = null) => {
    try {
      const updateData = { client_rating: rating }
      if (feedback) updateData.client_feedback = feedback

      const { data, error } = await supabase
        .from('video_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error rating video:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ Failed to rate video:', error)
      return { success: false, error }
    }
  },

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  extractYouTubeId: (url) => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  },

  getThumbnailUrl: (video) => {
    if (video.thumbnail_url) {
      return video.thumbnail_url
    }
    
    const youtubeId = videoService.extractYouTubeId(video.video_url)
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    }
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='
  }
}

export default videoService
