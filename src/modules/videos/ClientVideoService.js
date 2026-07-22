// src/modules/videos/ClientVideoService.js
// Client-side video data layer — proper JOIN, category grouping, watch tracking

import { supabase } from '../../lib/supabase'

const clientVideoService = {
  /**
   * Get all videos assigned to a client, joined with coach_videos data.
   * Groups by category for Netflix-style rendering.
   *
   * @param {string} clientId
   * @param {object} options - { pageContext?: string (filter), onlyActive?: boolean }
   * @returns {{ videos, grouped, categories, stats }}
   */
  getClientVideoLibrary: async (clientId, options = {}) => {
    const empty = { videos: [], grouped: {}, categories: [], stats: { total: 0, watched: 0 } }
    if (!clientId) return empty

    try {
      const { pageContext = null } = options

      // 1. Assignments for this client
      let query = supabase
        .from('video_assignments')
        .select('id, video_id, status, scheduled_for, page_context, viewed_at, completed_at, client_rating, notes')
        .eq('client_id', clientId)
        .order('scheduled_for', { ascending: false })

      if (pageContext) {
        query = query.eq('page_context', pageContext)
      }

      const { data: assignments, error: aErr } = await query
      if (aErr) {
        console.error('❌ Error fetching video assignments:', aErr)
        return empty
      }
      if (!assignments?.length) return empty

      // 2. Fetch video details for all assigned videoIds
      const videoIds = [...new Set(assignments.map(a => a.video_id).filter(Boolean))]
      if (!videoIds.length) return empty

      const { data: videos, error: vErr } = await supabase
        .from('coach_videos')
        .select('*')
        .in('id', videoIds)
        .eq('is_active', true)

      if (vErr) {
        console.error('❌ Error fetching coach videos:', vErr)
        return empty
      }

      // 3. JOIN: attach video to each assignment, drop orphans
      const videoMap = new Map((videos || []).map(v => [v.id, v]))
      const joined = assignments
        .map(a => ({ ...a, video: videoMap.get(a.video_id) }))
        .filter(item => item.video)

      if (!joined.length) return empty

      // 4. Group by category
      const grouped = {}
      joined.forEach(item => {
        const cat = item.video.category || 'other'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(item)
      })

      // Category order: education first (uitleg), then by count
      const categories = Object.keys(grouped).sort((a, b) => {
        if (a === 'education') return -1
        if (b === 'education') return 1
        return grouped[b].length - grouped[a].length
      })

      const stats = {
        total: joined.length,
        watched: joined.filter(i => i.status === 'completed' || i.viewed_at).length,
      }

      return { videos: joined, grouped, categories, stats }
    } catch (error) {
      console.error('❌ getClientVideoLibrary failed:', error)
      return empty
    }
  },

  /**
   * Mark a video assignment as viewed (opens modal) or completed (closes modal).
   */
  markVideoWatched: async (assignmentId, watchData = {}) => {
    if (!assignmentId) return { success: false, error: 'No assignment id' }

    try {
      const updates = {
        viewed_at: new Date().toISOString(),
        status: watchData.completed ? 'completed' : 'viewed',
      }
      if (watchData.completed) updates.completed_at = new Date().toISOString()
      if (watchData.duration) updates.watch_duration = watchData.duration

      const { data, error } = await supabase
        .from('video_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) {
        console.error('❌ markVideoWatched failed:', error)
        return { success: false, error: error.message }
      }

      // Increment view count on the coach_video (best effort, non-blocking)
      if (data?.video_id) {
        const { data: video } = await supabase
          .from('coach_videos')
          .select('view_count')
          .eq('id', data.video_id)
          .single()

        if (video) {
          await supabase
            .from('coach_videos')
            .update({ view_count: (video.view_count || 0) + 1 })
            .eq('id', data.video_id)
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('❌ markVideoWatched error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Rate a video (1-5 stars + optional feedback).
   */
  rateVideo: async (assignmentId, rating, feedback = '') => {
    if (!assignmentId || rating < 1 || rating > 5) {
      return { success: false, error: 'Invalid input' }
    }

    try {
      const { error } = await supabase
        .from('video_assignments')
        .update({
          client_rating: rating,
          client_feedback: feedback || null,
        })
        .eq('id', assignmentId)

      if (error) {
        console.error('❌ rateVideo failed:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      console.error('❌ rateVideo error:', error)
      return { success: false, error: error.message }
    }
  },

  // Home-slider video's: coach-video's die de coach met de "in home-slider"-
  // vlag heeft gemarkeerd (show_in_slider). Standaard voor ALLE clients van die
  // coach — niet meer via per-client video_assignments.
  getSliderVideos: async (coachId) => {
    if (!coachId) return []
    try {
      const { data, error } = await supabase
        .from('coach_videos')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .eq('show_in_slider', true)
        .order('created_at', { ascending: false })
      if (error) { console.error('❌ getSliderVideos error:', error); return [] }
      return (data || []).map(v => ({ id: v.id, video_id: v.id, video: v }))
    } catch (error) {
      console.error('❌ getSliderVideos failed:', error)
      return []
    }
  },
}

export default clientVideoService
