// src/modules/videos/VideoService.js - COMPLETE FIXED v2.1
// + Categorieën CRUD
// + extractYouTubeId ondersteunt /shorts/ en mobile URLs
// + createVideo/updateVideo ondersteunen category_id
// + FIX: markAsViewed gebruikt geen kapotte .rpc().catch() meer
import DatabaseService from '../../services/DatabaseService'

const { supabase } = DatabaseService

const videoService = {
  uploadThumbnail: async (file, coachId) => {
    try {
      if (!file) return { success: false, error: 'Geen bestand geselecteerd' }
      if (file.size > 5 * 1024 * 1024) return { success: false, error: 'Bestand is te groot (max 5MB)' }
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) return { success: false, error: 'Ongeldig bestandstype (gebruik JPG of PNG)' }

      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `coach_${coachId}/thumbnails/${timestamp}_${randomString}.${fileExtension}`
      const bucketOptions = ['coach-content', 'video-thumbnails', 'files']
      let uploadSuccess = false, bucketUsed = null

      for (const bucket of bucketOptions) {
        try {
          const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false })
          if (!error && data) { uploadSuccess = true; bucketUsed = bucket; break }
        } catch (err) {}
      }
      if (!uploadSuccess) return { success: false, error: `Geen werkende storage bucket gevonden` }
      const { data: { publicUrl } } = supabase.storage.from(bucketUsed).getPublicUrl(fileName)
      return { success: true, thumbnailUrl: publicUrl, filePath: fileName, bucket: bucketUsed }
    } catch (error) {
      console.error('Thumbnail upload failed:', error)
      return { success: false, error: error.message }
    }
  },

  deleteThumbnail: async (filePath, bucket = null) => {
    try {
      if (!filePath) return { success: true }
      const bucketOptions = bucket ? [bucket] : ['coach-content', 'video-thumbnails', 'files']
      let deleteSuccess = false
      for (const bucketName of bucketOptions) {
        try {
          const { error } = await supabase.storage.from(bucketName).remove([filePath])
          if (!error) { deleteSuccess = true; break }
        } catch (err) {}
      }
      return { success: deleteSuccess }
    } catch (error) { return { success: false, error: error.message } }
  },

  createVideo: async (videoData) => {
    try {
      const { data, error } = await supabase.from('coach_videos').insert([{
        coach_id: videoData.coach_id,
        title: videoData.title,
        description: videoData.description,
        video_url: videoData.video_url,
        thumbnail_url: videoData.thumbnail_url,
        category: videoData.category,
        category_id: videoData.category_id || null,
        tags: videoData.tags || [],
        difficulty_level: videoData.difficulty_level || 'beginner',
        best_time_to_watch: videoData.best_time_to_watch || 'anytime',
        duration_seconds: videoData.duration_seconds || null,
        default_pages: videoData.default_pages || [],
        is_active: true,
        view_count: 0,
        like_count: 0,
        created_at: new Date().toISOString()
      }]).select().single()
      if (error) { console.error('Video creation error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Video creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  updateVideo: async (videoId, updates) => {
    try {
      const { data, error } = await supabase.from('coach_videos').update(updates).eq('id', videoId).select().single()
      if (error) { console.error('Video update error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Video update failed:', error)
      return { success: false, error: error.message }
    }
  },

  deleteVideo: async (videoId) => {
    try {
      const { data: video } = await supabase.from('coach_videos').select('thumbnail_url').eq('id', videoId).single()
      if (video?.thumbnail_url) {
        const urlParts = video.thumbnail_url.split('/video-thumbnails/')
        if (urlParts[1]) await videoService.deleteThumbnail(urlParts[1])
      }
      await supabase.from('video_assignments').delete().eq('video_id', videoId)
      const { error } = await supabase.from('coach_videos').delete().eq('id', videoId)
      if (error) { console.error('Video delete error:', error); return { success: false, error: error.message } }
      return { success: true }
    } catch (error) {
      console.error('Video delete failed:', error)
      return { success: false, error: error.message }
    }
  },

  getCoachVideos: async (coachId) => {
    try {
      const { data, error } = await supabase.from('coach_videos').select('*').eq('coach_id', coachId).order('created_at', { ascending: false })
      if (error) { console.error('Error fetching videos:', error); return [] }
      return data || []
    } catch (error) { console.error('Failed to fetch videos:', error); return [] }
  },

  getVideoAssignments: async (videoId) => {
    try {
      const { data, error } = await supabase.from('video_assignments').select(`*, client:clients(id, first_name, last_name, email)`).eq('video_id', videoId).order('created_at', { ascending: false })
      if (error) { console.error('Error fetching video assignments:', error); return [] }
      return data || []
    } catch (error) { console.error('Failed to fetch video assignments:', error); return [] }
  },

  assignVideo: async (videoId, clientIds, assignmentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Geen gebruiker ingelogd' }
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
      const { data, error } = await supabase.from('video_assignments').insert(assignments).select()
      if (error) { console.error('Video assignment error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Video assignment failed:', error)
      return { success: false, error: error.message }
    }
  },

  unassignVideo: async (videoId, clientIds) => {
    try {
      const { error } = await supabase.from('video_assignments').delete().eq('video_id', videoId).in('client_id', clientIds)
      if (error) { console.error('Video unassign error:', error); return { success: false, error: error.message } }
      return { success: true }
    } catch (error) {
      console.error('Video unassign failed:', error)
      return { success: false, error: error.message }
    }
  },

  unassignAllClients: async (videoId) => {
    try {
      const { error } = await supabase.from('video_assignments').delete().eq('video_id', videoId)
      if (error) { console.error('Bulk unassign error:', error); return { success: false, error: error.message } }
      return { success: true }
    } catch (error) {
      console.error('Bulk unassign failed:', error)
      return { success: false, error: error.message }
    }
  },

  updateAssignment: async (assignmentId, updates) => {
    try {
      const { data, error } = await supabase.from('video_assignments').update(updates).eq('id', assignmentId).select().single()
      if (error) { console.error('Assignment update error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Assignment update failed:', error)
      return { success: false, error: error.message }
    }
  },

  getVideosForPage: async (clientId, pageContext = 'home') => {
    try {
      const { data: assignments, error: assignmentError } = await supabase.from('video_assignments').select('*').eq('client_id', clientId).eq('page_context', pageContext).order('scheduled_for', { ascending: false })
      if (assignmentError) { console.error('Error fetching assignments:', assignmentError); return [] }

      // Embed category (id/name/color/icon/order_index) directly. Saves a
      // second roundtrip in the UI and avoids coach_id-mismatch fallbacks.
      const VIDEO_SELECT = '*, video_category:video_categories(id, name, color, icon, order_index)'

      const { data: defaultVideos, error: defaultError } = await supabase.from('coach_videos').select(VIDEO_SELECT).contains('default_pages', [pageContext]).eq('is_active', true)
      if (defaultError) console.error('Error fetching default videos:', defaultError)

      let assignedVideoData = []
      if (assignments && assignments.length > 0) {
        const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
        if (videoIds.length > 0) {
          const { data: videos, error: videoError } = await supabase.from('coach_videos').select(VIDEO_SELECT).in('id', videoIds).eq('is_active', true)
          if (!videoError && videos) {
            const videoMap = new Map(videos.map(v => [v.id, v]))
            assignedVideoData = assignments.map(assignment => ({
              id: assignment.id,
              assignment_id: assignment.id,
              video_id: assignment.video_id,
              video: videoMap.get(assignment.video_id),
              scheduled_for: assignment.scheduled_for,
              completed: assignment.status === 'completed',
              viewed_at: assignment.viewed_at,
              status: assignment.status,
              // Cursus-info (context_data.course_id/course_title) zodat de
              // client-widget cursus-video's kan groeperen onder hun cursus.
              context_data: assignment.context_data || null,
              is_default: false
            })).filter(item => item.video !== null && item.video !== undefined)
          }
        }
      }

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

      const assignedVideoIds = new Set(assignedVideoData.map(a => a.video_id))
      const uniqueDefaultVideos = defaultVideoData.filter(d => !assignedVideoIds.has(d.video_id))
      const allVideos = [...assignedVideoData, ...uniqueDefaultVideos]

      allVideos.sort((a, b) => {
        if (a.scheduled_for && !b.scheduled_for) return -1
        if (!a.scheduled_for && b.scheduled_for) return 1
        if (a.scheduled_for && b.scheduled_for) return new Date(b.scheduled_for) - new Date(a.scheduled_for)
        return 0
      })

      return allVideos
    } catch (error) {
      console.error('Failed to fetch videos for page:', error)
      return []
    }
  },

  getClientAssignments: async (clientId, pageContext = null) => {
    try {
      let query = supabase.from('video_assignments').select(`*, video:coach_videos(*)`).eq('client_id', clientId).order('scheduled_for', { ascending: true })
      if (pageContext) query = query.eq('page_context', pageContext)
      const { data, error } = await query
      if (error) { console.error('Error fetching assignments:', error); return [] }
      return data || []
    } catch (error) { console.error('Failed to fetch assignments:', error); return [] }
  },

  getTodaysVideos: async (clientId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: assignments, error: assignmentError } = await supabase.from('video_assignments').select('*').eq('client_id', clientId).eq('scheduled_for', today).in('status', ['pending', 'viewed']).order('time_of_day', { ascending: true })
      if (assignmentError) { console.error('Error fetching today videos:', assignmentError); return [] }
      if (!assignments || assignments.length === 0) return []
      const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
      if (videoIds.length === 0) return []
      const { data: videos, error: videoError } = await supabase.from('coach_videos').select('*').in('id', videoIds)
      if (videoError) { console.error('Error fetching videos:', videoError); return [] }
      const videoMap = new Map()
      videos?.forEach(video => { videoMap.set(video.id, video) })
      return assignments.map(assignment => ({ ...assignment, video: videoMap.get(assignment.video_id) || null })).filter(item => item.video !== null)
    } catch (error) { console.error('Failed to fetch today videos:', error); return [] }
  },

  // FIXED v2.1: simpele read+write i.p.v. kapotte .rpc().catch()
  markAsViewed: async (assignmentId) => {
    try {
      const { error: assignmentError } = await supabase
        .from('video_assignments')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', assignmentId)

      if (assignmentError) {
        console.error('Error updating assignment:', assignmentError)
        return { success: false }
      }

      const { data: assignment } = await supabase
        .from('video_assignments')
        .select('video_id')
        .eq('id', assignmentId)
        .single()

      if (assignment?.video_id) {
        try {
          const { data: vid } = await supabase
            .from('coach_videos')
            .select('view_count')
            .eq('id', assignment.video_id)
            .single()

          if (vid) {
            await supabase
              .from('coach_videos')
              .update({ view_count: (vid.view_count || 0) + 1 })
              .eq('id', assignment.video_id)
          }
        } catch (e) {
          console.warn('view_count increment failed:', e?.message)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to mark as viewed:', error)
      return { success: false }
    }
  },

  markVideoAsViewed: async (assignmentId) => videoService.markAsViewed(assignmentId),

  markAsCompleted: async (assignmentId, watchDuration, rating = null, feedback = null) => {
    try {
      const updateData = { status: 'completed', completed_at: new Date().toISOString(), watch_duration: watchDuration }
      if (rating) updateData.client_rating = rating
      if (feedback) updateData.client_feedback = feedback
      const { error } = await supabase.from('video_assignments').update(updateData).eq('id', assignmentId)
      if (error) { console.error('Error marking as completed:', error); return { success: false } }
      return { success: true }
    } catch (error) {
      console.error('Failed to mark as completed:', error)
      return { success: false }
    }
  },

  markVideoAsCompleted: async (assignmentId, watchDuration) => videoService.markAsCompleted(assignmentId, watchDuration),

  rateVideo: async (assignmentId, rating, feedback = null) => {
    try {
      const updateData = { client_rating: rating }
      if (feedback) updateData.client_feedback = feedback
      const { data, error } = await supabase.from('video_assignments').update(updateData).eq('id', assignmentId).select().single()
      if (error) { console.error('Error rating video:', error); return { success: false, error } }
      return { success: true, data }
    } catch (error) { console.error('Failed to rate video:', error); return { success: false, error } }
  },

  getCategories: async (coachId) => {
    try {
      const { data, error } = await supabase.from('video_categories').select('*').eq('coach_id', coachId).order('order_index', { ascending: true })
      if (error) { console.error('Error fetching categories:', error); return [] }
      return data || []
    } catch (error) { console.error('Failed to fetch categories:', error); return [] }
  },

  createCategory: async (categoryData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Geen gebruiker ingelogd' }
      const { data: existing } = await supabase.from('video_categories').select('order_index').eq('coach_id', user.id).order('order_index', { ascending: false }).limit(1)
      const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 0
      const { data, error } = await supabase.from('video_categories').insert([{
        coach_id: user.id,
        name: categoryData.name,
        color: categoryData.color || '#10b981',
        icon: categoryData.icon || null,
        order_index: categoryData.order_index ?? nextOrder,
        created_at: new Date().toISOString()
      }]).select().single()
      if (error) { console.error('Category creation error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Category creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  updateCategory: async (categoryId, updates) => {
    try {
      const { data, error } = await supabase.from('video_categories').update(updates).eq('id', categoryId).select().single()
      if (error) { console.error('Category update error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Category update failed:', error)
      return { success: false, error: error.message }
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const { error } = await supabase.from('video_categories').delete().eq('id', categoryId)
      if (error) { console.error('Category delete error:', error); return { success: false, error: error.message } }
      return { success: true }
    } catch (error) {
      console.error('Category delete failed:', error)
      return { success: false, error: error.message }
    }
  },

  reorderCategories: async (categoryIds) => {
    try {
      const updates = categoryIds.map((id, index) => supabase.from('video_categories').update({ order_index: index }).eq('id', id))
      await Promise.all(updates)
      return { success: true }
    } catch (error) {
      console.error('Category reorder failed:', error)
      return { success: false, error: error.message }
    }
  },

  getVideosByCategory: async (coachId) => {
    try {
      const [categories, videos] = await Promise.all([videoService.getCategories(coachId), videoService.getCoachVideos(coachId)])
      const grouped = {}
      categories.forEach(cat => { grouped[cat.id] = { category: cat, videos: [] } })
      grouped['uncategorized'] = { category: { id: 'uncategorized', name: 'Zonder Categorie', color: 'rgba(255,255,255,0.3)' }, videos: [] }
      videos.forEach(video => {
        const catId = video.category_id || 'uncategorized'
        if (grouped[catId]) grouped[catId].videos.push(video)
        else grouped['uncategorized'].videos.push(video)
      })
      return grouped
    } catch (error) { console.error('Failed to group videos:', error); return {} }
  },

  // ═══════════════════════════════════════════
  // CURSUSSEN — bundel video's; toewijzing hergebruikt video_assignments
  // ═══════════════════════════════════════════

  getCoachCourses: async (coachId) => {
    try {
      const { data: courses, error } = await supabase
        .from('video_courses')
        .select('*, items:video_course_items(id, video_id, order_index)')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) { console.error('Error fetching courses:', error); return [] }
      return (courses || []).map(c => ({
        ...c,
        videoIds: (c.items || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(i => i.video_id),
        videoCount: (c.items || []).length
      }))
    } catch (error) { console.error('Failed to fetch courses:', error); return [] }
  },

  createCourse: async (courseData, videoIds = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Geen gebruiker ingelogd' }
      const { data: course, error } = await supabase.from('video_courses').insert([{
        coach_id: user.id,
        title: courseData.title,
        description: courseData.description || null,
        thumbnail_url: courseData.thumbnail_url || null,
        category_id: courseData.category_id || null,
        is_active: true,
        created_at: new Date().toISOString()
      }]).select().single()
      if (error) { console.error('Course creation error:', error); return { success: false, error: error.message } }
      const res = await videoService.setCourseVideos(course.id, videoIds)
      if (!res.success) return res
      return { success: true, data: course }
    } catch (error) {
      console.error('Course creation failed:', error)
      return { success: false, error: error.message }
    }
  },

  updateCourse: async (courseId, updates, videoIds = null) => {
    try {
      const { error } = await supabase.from('video_courses').update(updates).eq('id', courseId)
      if (error) { console.error('Course update error:', error); return { success: false, error: error.message } }
      if (Array.isArray(videoIds)) {
        const res = await videoService.setCourseVideos(courseId, videoIds)
        if (!res.success) return res
      }
      return { success: true }
    } catch (error) {
      console.error('Course update failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Vervangt de video-lijst van een cursus (simpel: leeg + opnieuw vullen, in volgorde).
  setCourseVideos: async (courseId, videoIds = []) => {
    try {
      await supabase.from('video_course_items').delete().eq('course_id', courseId)
      if (videoIds.length > 0) {
        const rows = videoIds.map((vid, i) => ({ course_id: courseId, video_id: vid, order_index: i }))
        const { error } = await supabase.from('video_course_items').insert(rows)
        if (error) { console.error('Course items error:', error); return { success: false, error: error.message } }
      }
      return { success: true }
    } catch (error) {
      console.error('Set course videos failed:', error)
      return { success: false, error: error.message }
    }
  },

  deleteCourse: async (courseId) => {
    try {
      // Verwijder toewijzingen die bij deze cursus horen (context_data.course_id).
      await supabase.from('video_assignments').delete().contains('context_data', { course_id: courseId })
      const { error } = await supabase.from('video_courses').delete().eq('id', courseId)
      if (error) { console.error('Course delete error:', error); return { success: false, error: error.message } }
      return { success: true }
    } catch (error) {
      console.error('Course delete failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Wijst een hele cursus toe: maakt voor elke video × client een video_assignment
  // met context_data.course_id, zodat de client-kant ze als cursus kan groeperen.
  // Hergebruikt exact dezelfde page/scheduling-logica als losse video's.
  assignCourse: async (courseId, clientIds, assignmentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Geen gebruiker ingelogd' }

      const { data: course } = await supabase.from('video_courses').select('title').eq('id', courseId).single()
      const { data: items, error: itemsErr } = await supabase
        .from('video_course_items').select('video_id, order_index').eq('course_id', courseId).order('order_index', { ascending: true })
      if (itemsErr) return { success: false, error: itemsErr.message }
      const videoIds = (items || []).map(i => i.video_id)
      if (videoIds.length === 0) return { success: false, error: 'Deze cursus heeft nog geen video’s' }

      const baseContext = { ...(assignmentData.contextData || {}), course_id: courseId, course_title: course?.title || '' }
      const assignments = []
      for (const clientId of clientIds) {
        videoIds.forEach((vid, idx) => {
          assignments.push({
            video_id: vid,
            client_id: clientId,
            assigned_by: user.id,
            assignment_type: assignmentData.type || 'manual',
            scheduled_for: assignmentData.scheduledFor || new Date().toISOString().split('T')[0],
            time_of_day: assignmentData.timeOfDay || 'anytime',
            status: 'pending',
            page_context: assignmentData.pageContext || 'home',
            context_data: { ...baseContext, course_order: idx },
            notes: assignmentData.notes || '',
            created_at: new Date().toISOString()
          })
        })
      }
      const { data, error } = await supabase.from('video_assignments').insert(assignments).select()
      if (error) { console.error('Course assignment error:', error); return { success: false, error: error.message } }
      return { success: true, data }
    } catch (error) {
      console.error('Course assignment failed:', error)
      return { success: false, error: error.message }
    }
  },

  extractYouTubeId: (url) => {
    if (!url) return null
    const patterns = [
      /youtube\.com\/watch\?v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
      /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
      /m\.youtube\.com\/shorts\/([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  },

  isYouTubeShort: (url) => {
    if (!url) return false
    return /youtube\.com\/shorts\//.test(url) || /m\.youtube\.com\/shorts\//.test(url)
  },

  getThumbnailUrl: (video) => {
    if (video.thumbnail_url) return video.thumbnail_url
    const youtubeId = videoService.extractYouTubeId(video.video_url)
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzMzMyIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4='
  }
}

export default videoService
