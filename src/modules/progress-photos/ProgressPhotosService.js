// src/modules/progress-photos/ProgressPhotosService.js
class ProgressPhotosService {
  constructor(databaseService) {
    this.db = databaseService
    this.supabase = this.db.supabase
    this.storage = this.supabase.storage
    this.bucketName = 'ch8-photos'
    this.tableName = 'ch8_progress_photos'
  }

  // === CHALLENGE TRACKING ===
  
  async getChallengeProgress(clientId) {
    try {
      // Get all Friday progress photos
      const { data: fridayPhotos, error } = await this.supabase
        .from(this.tableName)
        .select('photo_date, photo_type, metadata')
        .eq('client_id', clientId)
        .eq('is_friday_photo', true)
        .order('photo_date')
      
      if (error) throw error
      
      // Group by date and check for complete sets
      const completeSets = new Map()
      fridayPhotos?.forEach(photo => {
        const date = photo.photo_date
        if (!completeSets.has(date)) {
          completeSets.set(date, new Set())
        }
        completeSets.get(date).add(photo.photo_type)
      })
      
      // Count complete sets (front + side)
      const validSets = Array.from(completeSets.entries())
        .filter(([date, types]) => 
          types.has('front') && types.has('side')
        )
      
      // Calculate next Friday
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek
      const nextFriday = new Date(today)
      if (daysUntilFriday > 0) {
        nextFriday.setDate(today.getDate() + daysUntilFriday)
      }
      
      return {
        completedWeeks: validSets.length,
        totalWeeks: 8,
        percentage: Math.round((validSets.length / 8) * 100),
        isCompliant: validSets.length >= 8,
        nextFriday: nextFriday.toISOString().split('T')[0],
        daysUntilFriday: daysUntilFriday,
        completedDates: validSets.map(([date]) => date),
        currentWeek: Math.min(8, validSets.length + 1)
      }
    } catch (error) {
      console.error('Get challenge progress failed:', error)
      return {
        completedWeeks: 0,
        totalWeeks: 8,
        percentage: 0,
        isCompliant: false,
        nextFriday: new Date().toISOString().split('T')[0],
        daysUntilFriday: 0,
        completedDates: [],
        currentWeek: 1
      }
    }
  }

  // === TODAY'S PHOTOS ===
  
  async getTodayPhotos(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('client_id', clientId)
        .eq('photo_date', today)
      
      if (error) throw error
      
      const counts = {
        progress: 0,
        meal: 0,
        workout: 0,
        victory: 0,
        total: data?.length || 0
      }
      
      const progressTypes = new Set()
      
      data?.forEach(photo => {
        // Check metadata for category
        const category = photo.metadata?.category || 'progress'
        
        if (category === 'progress') {
          counts.progress++
          progressTypes.add(photo.photo_type)
        } else {
          counts[category] = (counts[category] || 0) + 1
        }
      })
      
      return {
        date: today,
        photos: data || [],
        counts: counts,
        hasCompleteFriday: progressTypes.has('front') && progressTypes.has('side'),
        progressSubtypes: Array.from(progressTypes),
        isFriday: new Date().getDay() === 5
      }
    } catch (error) {
      console.error('Get today photos failed:', error)
      return {
        date: new Date().toISOString().split('T')[0],
        photos: [],
        counts: { progress: 0, meal: 0, workout: 0, victory: 0, total: 0 },
        hasCompleteFriday: false,
        progressSubtypes: [],
        isFriday: false
      }
    }
  }

  // === WEEKLY STATS ===
  
  async getWeeklyStats(clientId) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('photo_type, photo_date, metadata')
        .eq('client_id', clientId)
        .gte('photo_date', startDate.toISOString().split('T')[0])
        .lte('photo_date', endDate.toISOString().split('T')[0])
      
      if (error) throw error
      
      const stats = {
        meal: 0,
        workout: 0,
        progress: 0,
        victory: 0,
        total: data?.length || 0,
        activeDays: new Set(),
        dailyAverage: 0
      }
      
      data?.forEach(photo => {
        const category = photo.metadata?.category || 'progress'
        stats[category] = (stats[category] || 0) + 1
        stats.activeDays.add(photo.photo_date)
      })
      
      stats.activeDays = stats.activeDays.size
      stats.dailyAverage = Math.round(stats.total / 7)
      
      return stats
    } catch (error) {
      console.error('Get weekly stats failed:', error)
      return {
        meal: 0,
        workout: 0,
        progress: 0,
        victory: 0,
        total: 0,
        activeDays: 0,
        dailyAverage: 0
      }
    }
  }

  // === UPLOAD PHOTO - FIXED VERSION ===
  
  async uploadPhoto(clientId, file, photoType, metadata = {}) {
    try {
      // Determine photo_type and category
      let dbPhotoType = 'front' // default
      let category = photoType // meal, workout, victory, progress
      
      if (photoType === 'progress') {
        // For progress photos, use the subtype (front/side/back)
        dbPhotoType = metadata.subtype || 'front'
        category = 'progress'
      } else {
        // For non-progress photos, we need to use a valid photo_type
        // Strategy: Use rotation of front/side/back to avoid duplicates
        const { data: todayPhotos } = await this.supabase
          .from(this.tableName)
          .select('photo_type, metadata')
          .eq('client_id', clientId)
          .eq('photo_date', new Date().toISOString().split('T')[0])
        
        // Count non-progress photos
        const nonProgressPhotos = todayPhotos?.filter(p => 
          p.metadata?.category && p.metadata.category !== 'progress'
        ) || []
        
        // Rotate through front/side/back for non-progress photos
        if (nonProgressPhotos.length === 0) {
          dbPhotoType = 'front'
        } else if (nonProgressPhotos.length === 1) {
          dbPhotoType = 'side'
        } else {
          dbPhotoType = 'back'
        }
      }
      
      // Generate file path
      const date = new Date()
      const timestamp = date.toISOString().split('T')[0]
      const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      const fileName = `${clientId}/${category}/${timestamp}_${uniqueId}.jpg`
      
      console.log('Uploading:', { fileName, dbPhotoType, category })
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Storage upload failed:', uploadError)
        throw uploadError
      }
      
      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)
      
      // Save to database
      const isFriday = date.getDay() === 5
      const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7)
      
      const { data: dbData, error: dbError } = await this.supabase
        .from(this.tableName)
        .insert({
          client_id: clientId,
          photo_date: timestamp,
          photo_type: dbPhotoType, // MUST be front/side/back
          photo_url: publicUrl,
          is_friday_photo: isFriday && category === 'progress',
          week_number: weekNumber,
          file_size: file.size,
          metadata: {
            uploaded_at: date.toISOString(),
            device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            path: fileName,
            category: category, // CRITICAL: Store actual category here
            subtype: metadata.subtype || null,
            exercise: metadata.exercise || null,
            meal_type: metadata.mealType || null,
            rating: metadata.rating || null
          }
        })
        .select()
        .single()
      
      if (dbError) {
        console.error('Database save failed:', dbError)
        
        // Clean up storage if DB fails
        await this.supabase.storage
          .from(this.bucketName)
          .remove([fileName])
          
        throw dbError
      }
      
      console.log('Photo saved successfully:', dbData)
      return dbData
    } catch (error) {
      console.error('Upload photo failed:', error)
      throw error
    }
  }

  // === GET RECENT PHOTOS ===
  
  async getRecentPhotos(clientId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('client_id', clientId)
        .order('photo_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      // Group by date
      const grouped = {}
      data?.forEach(photo => {
        const date = photo.photo_date
        if (!grouped[date]) {
          grouped[date] = []
        }
        
        // Add display category for UI
        photo.displayCategory = photo.metadata?.category || 'progress'
        photo.displayType = photo.metadata?.category === 'progress' 
          ? photo.photo_type 
          : photo.metadata?.category
        
        grouped[date].push(photo)
      })
      
      return grouped
    } catch (error) {
      console.error('Get recent photos failed:', error)
      return {}
    }
  }

  // === DELETE PHOTO ===
  
  async deletePhoto(photoId, photoUrl) {
    try {
      console.log('Deleting photo:', photoId)
      
      // Delete from storage first
      if (photoUrl && photoUrl.includes(this.bucketName)) {
        const pathMatch = photoUrl.match(new RegExp(`${this.bucketName}/(.+)`))
        if (pathMatch && pathMatch[1]) {
          const path = decodeURIComponent(pathMatch[1])
          console.log('Deleting from storage:', path)
          
          const { error: storageError } = await this.supabase.storage
            .from(this.bucketName)
            .remove([path])
          
          if (storageError) {
            console.error('Storage delete warning:', storageError)
            // Continue even if storage fails
          }
        }
      }
      
      // Delete from database
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', photoId)
      
      if (error) {
        console.error('Delete from database failed:', error)
        throw error
      }
      
      console.log('Photo deleted successfully')
      return true
    } catch (error) {
      console.error('Delete photo failed:', error)
      throw error
    }
  }

  // === GET PHOTO BY ID ===
  
  async getPhotoById(photoId) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', photoId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get photo by ID failed:', error)
      return null
    }
  }
}

export default ProgressPhotosService
