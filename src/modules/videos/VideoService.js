// VideoService.js - Complete service met thumbnail upload, client dashboard methods EN UNASSIGN
import DatabaseService from '../../services/DatabaseService'

// Haal supabase instance uit DatabaseService
const { supabase } = DatabaseService

const videoService = {
  // ========================================
  // THUMBNAIL UPLOAD FUNCTIE - Met fallback buckets
  // ========================================
  uploadThumbnail: async (file, coachId) => {
    try {
      // Valideer file
      if (!file) {
        return { success: false, error: 'Geen bestand geselecteerd' }
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Bestand is te groot (max 5MB)' }
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Ongeldig bestandstype (gebruik JPG of PNG)' }
      }

      // Genereer unieke filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `coach_${coachId}/thumbnails/${timestamp}_${randomString}.${fileExtension}`

      // Probeer verschillende bucket namen die mogelijk bestaan
      const bucketOptions = ['coach-content', 'video-thumbnails', 'files']
      let uploadSuccess = false
      let uploadData = null
      let bucketUsed = null
      let lastError = null

      // Probeer elke bucket optie
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
          } else {
            lastError = error
            console.log(`❌ Bucket ${bucket} failed:`, error?.message)
          }
        } catch (err) {
          console.log(`❌ Bucket ${bucket} niet beschikbaar`)
          lastError = err
        }
      }

      if (!uploadSuccess) {
        console.error('❌ Geen werkende bucket gevonden')
        return { 
          success: false, 
          error: `Geen werkende storage bucket gevonden. Maak een "${bucketOptions.join('", "')}" bucket aan in Supabase.`
        }
      }

      // Get public URL van de gebruikte bucket
      const { data: { publicUrl } } = supabase.storage
        .from(bucketUsed)
        .getPublicUrl(fileName)

      console.log('✅ Thumbnail uploaded:', publicUrl)
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
  // DELETE THUMBNAIL - Met multiple bucket support
  // ========================================
  deleteThumbnail: async (filePath, bucket = null) => {
    try {
      if (!filePath) return { success: true }

      // Als geen bucket opgegeven, probeer alle mogelijke buckets
      const bucketOptions = bucket ? [bucket] : ['coach-content', 'video-thumbnails', 'files']
      let deleteSuccess = false

      for (const bucketName of bucketOptions) {
        try {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath])

          if (!error) {
            deleteSuccess = true
            console.log(`✅ Thumbnail deleted from bucket: ${bucketName}`)
            break
          }
        } catch (err) {
          console.log(`Bucket ${bucketName} skip:`, err.message)
        }
      }

      return { success: deleteSuccess }
    } catch (error) {
      console.error('❌ Thumbnail delete failed:', error)
      return { success: false, error: error.message }
    }
  },

  // ========================================
  // CREATE VIDEO (met thumbnail)
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
          thumbnail_url: videoData.thumbnail_url, // Custom thumbnail URL
          category: videoData.category,
          tags: videoData.tags || [],
          difficulty_level: videoData.difficulty_level || 'beginner',
          best_time_to_watch: videoData.best_time_to_watch || 'anytime',
          duration_seconds: videoData.duration_seconds || null,
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
  // 🆕 GET VIDEO ASSIGNMENTS - Voor een specifieke video
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
  // 🆕 UNASSIGN VIDEO - Verwijder video van clients
  // ========================================
  unassignVideo: async (videoId, clientIds) => {
    try {
      // Delete assignments voor de geselecteerde clients
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
  // 🆕 BULK UNASSIGN - Verwijder alle assignments van een video
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
  // 🆕 UPDATE ASSIGNMENT - Update assignment details
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
  // ASSIGN VIDEO TO CLIENTS
  // ========================================
  assignVideo: async (videoId, clientIds, assignmentData) => {
    try {
      // Haal current user op voor assigned_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Geen gebruiker ingelogd' }
      }

      const assignments = clientIds.map(clientId => ({
        video_id: videoId,
        client_id: clientId,
        assigned_by: user.id, // Coach die de video assigned
        assignment_type: assignmentData.type || 'manual',
        scheduled_for: assignmentData.scheduledFor || new Date().toISOString().split('T')[0],
        time_of_day: assignmentData.timeOfDay || 'anytime',
        status: 'pending', // pending, viewed, completed
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
  // GET CLIENT VIDEO ASSIGNMENTS
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

      // Filter by page context if provided
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
  // GET VIDEOS FOR PAGE - Client Dashboard Method
  // ========================================
// FIXED getVideosForPage method - plaats dit in VideoService.js
// Vervang de bestaande getVideosForPage methode (regel 369-434) met deze:

getVideosForPage: async (clientId, pageContext = 'home') => {
  try {
    console.log('📹 Loading videos for client:', clientId, 'context:', pageContext)
    
    // Debug: Check if we can fetch ANY assignments for this client
    const { data: allAssignments, error: allError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('client_id', clientId)
    
    console.log('📹 ALL assignments for client (debug):', allAssignments?.length || 0, allAssignments)
    
    // Fetch assignments - ZONDER status filter (dat was het probleem!)
    const { data: assignments, error: assignmentError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('page_context', pageContext)
      .order('scheduled_for', { ascending: false }) // Nieuwste eerst

    if (assignmentError) {
      console.error('❌ Error fetching assignments:', assignmentError)
      return []
    }

    console.log('📹 Found assignments for page:', assignments?.length || 0, assignments)

    if (!assignments || assignments.length === 0) {
      console.log('📹 No assignments found for page:', pageContext)
      return []
    }

    // Get unique video IDs
    const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
    
    if (videoIds.length === 0) {
      console.log('📹 No valid video IDs in assignments')
      return []
    }

    console.log('📹 Fetching videos for IDs:', videoIds)

    // Fetch videos separately
    const { data: videos, error: videoError } = await supabase
      .from('coach_videos')
      .select('*')
      .in('id', videoIds)
      .eq('is_active', true) // Alleen actieve videos

    if (videoError) {
      console.error('❌ Error fetching videos:', videoError)
      return []
    }

    console.log('📹 Found videos:', videos?.length || 0)

    // Create video map for quick lookup
    const videoMap = new Map()
    videos?.forEach(video => {
      videoMap.set(video.id, video)
    })

    // Combine assignments with videos
    const result = assignments.map(assignment => {
      const video = videoMap.get(assignment.video_id)
      return {
        ...assignment,
        video: video || null
      }
    }).filter(item => item.video !== null) // Filter out assignments zonder video

    console.log(`✅ Loaded ${result.length} videos for page ${pageContext}`)
    return result

  } catch (error) {
    console.error('❌ Failed to fetch videos for page:', error)
    return []
  }
},
  // ========================================
  // GET CLIENT VIDEO ASSIGNMENTS - Extended version
  // ========================================
  getClientVideoAssignments: async (clientId) => {
    try {
      // Fetch all assignments for client
      const { data: assignments, error: assignmentError } = await supabase
        .from('video_assignments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (assignmentError) {
        console.error('❌ Error fetching assignments:', assignmentError)
        return []
      }

      if (!assignments || assignments.length === 0) {
        return []
      }

      // Get video IDs
      const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
      
      if (videoIds.length === 0) {
        return []
      }

      // Fetch videos
      const { data: videos, error: videoError } = await supabase
        .from('coach_videos')
        .select('*')
        .in('id', videoIds)

      if (videoError) {
        console.error('❌ Error fetching videos:', videoError)
        return []
      }

      // Create video map
      const videoMap = new Map()
      videos?.forEach(video => {
        videoMap.set(video.id, video)
      })

      // Combine data
      const result = assignments.map(assignment => ({
        ...assignment,
        video: videoMap.get(assignment.video_id) || null
      }))

      return result
    } catch (error) {
      console.error('❌ Failed to fetch client video assignments:', error)
      return []
    }
  },

  // ========================================
  // GET TODAY'S VIDEOS
  // ========================================
  getTodaysVideos: async (clientId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's assignments
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

      // Get video IDs
      const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
      
      if (videoIds.length === 0) {
        return []
      }

      // Fetch videos
      const { data: videos, error: videoError } = await supabase
        .from('coach_videos')
        .select('*')
        .in('id', videoIds)

      if (videoError) {
        console.error('❌ Error fetching videos:', videoError)
        return []
      }

      // Create video map
      const videoMap = new Map()
      videos?.forEach(video => {
        videoMap.set(video.id, video)
      })

      // Combine and return
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
  // MARK VIDEO AS VIEWED
  // ========================================
  markAsViewed: async (assignmentId) => {
    try {
      // Update assignment met viewed info
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

      // Get video ID to update total view count
      const { data: assignment } = await supabase
        .from('video_assignments')
        .select('video_id')
        .eq('id', assignmentId)
        .single()

      if (assignment?.video_id) {
        // Update video view count
        const { error } = await supabase.rpc('increment', {
          table_name: 'coach_videos',
          column_name: 'view_count',
          row_id: assignment.video_id
        }).catch(() => {
          // Fallback als RPC niet bestaat
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

  // ========================================
  // MARK VIDEO AS VIEWED - Alias voor compatibiliteit
  // ========================================
  markVideoAsViewed: async (assignmentId) => {
    return videoService.markAsViewed(assignmentId)
  },

  // ========================================
  // MARK VIDEO AS COMPLETED
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

  // ========================================
  // MARK VIDEO AS COMPLETED - Alias voor compatibiliteit
  // ========================================
  markVideoAsCompleted: async (assignmentId, watchDuration) => {
    return videoService.markAsCompleted(assignmentId, watchDuration)
  },

  // ========================================
  // RATE VIDEO
  // ========================================
  rateVideo: async (assignmentId, rating, feedback = null) => {
    try {
      const updateData = {
        client_rating: rating
      }
      
      if (feedback) {
        updateData.client_feedback = feedback
      }

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
  // GET VIDEO STATISTICS
  // ========================================
  getVideoStatistics: async (coachId) => {
    try {
      // Get all videos for this coach
      const { data: videos, error: videosError } = await supabase
        .from('coach_videos')
        .select('*')
        .eq('coach_id', coachId)

      if (videosError) {
        console.error('❌ Error fetching videos:', videosError)
        return null
      }

      if (!videos || videos.length === 0) {
        return {
          totalVideos: 0,
          totalAssignments: 0,
          totalViews: 0,
          totalCompletions: 0,
          averageRating: 0,
          categoryBreakdown: {},
          viewsByVideo: []
        }
      }

      // Get all assignments for these videos
      const videoIds = videos.map(v => v.id)
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('video_assignments')
        .select('*')
        .in('video_id', videoIds)

      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError)
      }

      // Calculate statistics
      const stats = {
        totalVideos: videos.length,
        totalAssignments: assignments?.length || 0,
        totalViews: 0,
        totalCompletions: 0,
        averageRating: 0,
        categoryBreakdown: {},
        viewsByVideo: []
      }

      let totalRatings = 0
      let ratingsCount = 0

      // Process assignments
      assignments?.forEach(assignment => {
        if (assignment.status === 'viewed' || assignment.status === 'completed') {
          stats.totalViews++
        }
        if (assignment.status === 'completed') {
          stats.totalCompletions++
        }
        if (assignment.client_rating) {
          totalRatings += assignment.client_rating
          ratingsCount++
        }
      })

      // Process videos
      videos.forEach(video => {
        // Category breakdown
        const category = video.category || 'Uncategorized'
        if (!stats.categoryBreakdown[category]) {
          stats.categoryBreakdown[category] = 0
        }
        stats.categoryBreakdown[category]++

        // Views by video
        const videoAssignments = assignments?.filter(a => a.video_id === video.id) || []
        stats.viewsByVideo.push({
          title: video.title,
          views: video.view_count || 0,
          assignments: videoAssignments.length
        })
      })

      // Calculate average rating
      if (ratingsCount > 0) {
        stats.averageRating = (totalRatings / ratingsCount).toFixed(1)
      }

      return stats
    } catch (error) {
      console.error('❌ Failed to fetch video statistics:', error)
      return null
    }
  },

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  extractYouTubeId: (url) => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/ // Just the ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  },

  getThumbnailUrl: (video) => {
    // Prioriteit: custom thumbnail > YouTube thumbnail
    if (video.thumbnail_url) {
      return video.thumbnail_url
    }
    
    const youtubeId = videoService.extractYouTubeId(video.video_url)
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    }
    
    // Fallback placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='
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
      // First get video to check for thumbnail
      const { data: video } = await supabase
        .from('coach_videos')
        .select('thumbnail_url')
        .eq('id', videoId)
        .single()

      // Delete thumbnail if exists
      if (video?.thumbnail_url) {
        // Extract file path from URL
        const urlParts = video.thumbnail_url.split('/video-thumbnails/')
        if (urlParts[1]) {
          await videoService.deleteThumbnail(urlParts[1])
        }
      }

      // Delete all assignments first
      await supabase
        .from('video_assignments')
        .delete()
        .eq('video_id', videoId)

      // Then delete the video
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
  }
}

export default videoService
