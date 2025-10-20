// src/modules/photos-8ch/Photos8CHService.js
class Photos8CHService {
  constructor(databaseService) {
    this.db = databaseService
    this.supabase = this.db.supabase
    this.storage = this.supabase.storage
    this.bucketName = 'ch8-photos'
    this.tableName = 'ch8_progress_photos'
  }

  // === HELPER METHODS ===
  
  // Get challenge start date for a client
  async getChallengeStartDate(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_challenges')
        .select('start_date')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single()
      
      if (data?.start_date) {
        return new Date(data.start_date)
      }
      
      // Fallback to 8 weeks ago
      const fallbackDate = new Date()
      fallbackDate.setDate(fallbackDate.getDate() - 56)
      return fallbackDate
    } catch (error) {
      console.warn('Could not get challenge start date, using fallback')
      const fallbackDate = new Date()
      fallbackDate.setDate(fallbackDate.getDate() - 56)
      return fallbackDate
    }
  }

  // Calculate week number from challenge start
  async getWeekNumber(clientId, date = new Date()) {
    const startDate = await this.getChallengeStartDate(clientId)
    const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.ceil((daysDiff + 1) / 7)
    return Math.min(8, Math.max(1, weekNumber))
  }

  // Check if a date is Friday
  isFriday(date) {
    return date.getDay() === 5
  }

  // Get next Friday date
  getNextFriday() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 12 - dayOfWeek
    
    if (daysUntilFriday === 0) {
      return today
    }
    
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday
  }

  // Get daily photo goals
  getDailyGoals() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const goals = []
    
    // Friday = Progress photos
    if (dayOfWeek === 5) {
      goals.push({ type: 'progress', required: 2, label: 'Vrijdag Check-in' })
    }
    
    // Every day = Meals
    goals.push({ type: 'meal', required: 3, label: 'Maaltijden vandaag' })
    
    // Workout days (not Sunday)
    if (dayOfWeek !== 0) {
      goals.push({ type: 'workout', required: 1, label: 'Workout vastleggen' })
    }
    
    return goals
  }

  // === UPLOAD METHODS ===

  // Upload photo file to Supabase Storage
  async uploadPhotoFile(clientId, file, photoType) {
    try {
      const date = new Date()
      const timestamp = date.toISOString().split('T')[0]
      const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      const fileName = `${clientId}/${photoType}/${timestamp}_${uniqueId}.jpg`
      
      console.log('Uploading file to storage:', fileName)
      
      // Create bucket if it doesn't exist
      const { data: buckets } = await this.storage.listBuckets()
      if (!buckets?.find(b => b.name === this.bucketName)) {
        await this.storage.createBucket(this.bucketName, { public: true })
      }
      
      // Upload file
      const { data: uploadData, error: uploadError } = await this.storage
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
      const { data: { publicUrl } } = this.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)
      
      console.log('File uploaded, URL:', publicUrl)
      
      return {
        path: fileName,
        url: publicUrl,
        size: file.size
      }
    } catch (error) {
      console.error('Upload photo file failed:', error)
      throw error
    }
  }

  // Save photo metadata to database
  async savePhotoMetadata(clientId, photoData) {
    try {
      const date = new Date()
      const isFriday = this.isFriday(date)
      const weekNumber = await this.getWeekNumber(clientId, date)
      const photoDate = date.toISOString().split('T')[0]
      
      // Add subtypes for better categorization
      let subtype = photoData.subtype || null
      if (photoData.type === 'progress') {
        subtype = photoData.subtype // 'front' or 'side'
      }
      
      console.log('Saving photo metadata:', {
        client_id: clientId,
        photo_date: photoDate,
        photo_type: photoData.type,
        subtype: subtype,
        is_friday: isFriday,
        week: weekNumber
      })
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          client_id: clientId,
          photo_date: photoDate,
          photo_type: photoData.type,
          photo_url: photoData.url,
          is_friday_photo: isFriday && photoData.type === 'progress',
          week_number: weekNumber,
          file_size: photoData.size,
          metadata: {
            uploaded_at: date.toISOString(),
            device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            path: photoData.path,
            subtype: subtype,
            exercise: photoData.exercise || null,
            meal_type: photoData.mealType || null,
            rating: photoData.rating || null
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database save failed:', error)
        throw error
      }
      
      console.log('Photo metadata saved:', data)
      return data
    } catch (error) {
      console.error('Save photo metadata failed:', error)
      throw error
    }
  }

  // Main upload method
  async uploadPhoto(clientId, file, photoType, extraData = {}) {
    try {
      console.log('Starting photo upload:', photoType)
      
      // Step 1: Upload file to storage
      const uploadResult = await this.uploadPhotoFile(clientId, file, photoType)
      
      // Step 2: Save metadata to database
      const metadata = await this.savePhotoMetadata(clientId, {
        type: photoType,
        url: uploadResult.url,
        size: uploadResult.size,
        path: uploadResult.path,
        ...extraData
      })
      
      console.log('Photo upload complete')
      return metadata
    } catch (error) {
      console.error('Upload photo failed:', error)
      throw error
    }
  }

  // === RETRIEVAL METHODS ===

  // Get all photos for a client
  async getPhotos(clientId, limit = 100, photoType = null) {
    try {
      console.log('Getting photos for client:', clientId, 'type:', photoType)
      
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('client_id', clientId)
        .order('photo_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (photoType) {
        query = query.eq('photo_type', photoType)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Get photos query failed:', error)
        throw error
      }
      
      console.log(`Found ${data?.length || 0} photos`)
      
      // Group photos by date and type
      const grouped = {}
      data?.forEach(photo => {
        const date = photo.photo_date
        if (!grouped[date]) {
          grouped[date] = {
            date: date,
            progress: [],
            meals: [],
            workouts: [],
            victories: [],
            isFriday: photo.is_friday_photo,
            weekNumber: photo.week_number
          }
        }
        
        switch(photo.photo_type) {
          case 'progress':
            grouped[date].progress.push(photo)
            break
          case 'meal':
            grouped[date].meals.push(photo)
            break
          case 'workout':
            grouped[date].workouts.push(photo)
            break
          case 'victory':
            grouped[date].victories.push(photo)
            break
        }
      })
      
      return grouped
    } catch (error) {
      console.error('Get photos failed:', error)
      return {}
    }
  }

  // Get today's photos
  async getTodayPhotos(clientId) {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('Getting today photos:', today)
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('client_id', clientId)
        .eq('photo_date', today)
      
      if (error) {
        console.error('Get today photos failed:', error)
        throw error
      }
      
      // Count by type
      const counts = {
        progress: 0,
        meal: 0,
        workout: 0,
        victory: 0
      }
      
      const progressSubtypes = []
      
      data?.forEach(photo => {
        counts[photo.photo_type] = (counts[photo.photo_type] || 0) + 1
        
        if (photo.photo_type === 'progress' && photo.metadata?.subtype) {
          progressSubtypes.push(photo.metadata.subtype)
        }
      })
      
      console.log('Today counts:', counts)
      
      return {
        date: today,
        photos: data || [],
        counts: counts,
        progressSubtypes: progressSubtypes,
        hasRequiredProgress: progressSubtypes.includes('front') && progressSubtypes.includes('side')
      }
    } catch (error) {
      console.error('Get today photos failed:', error)
      return {
        date: new Date().toISOString().split('T')[0],
        photos: [],
        counts: { progress: 0, meal: 0, workout: 0, victory: 0 },
        progressSubtypes: [],
        hasRequiredProgress: false
      }
    }
  }

  // Get weekly stats
  async getWeeklyStats(clientId) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('photo_type, photo_date')
        .eq('client_id', clientId)
        .gte('photo_date', startDate.toISOString().split('T')[0])
        .lte('photo_date', endDate.toISOString().split('T')[0])
      
      if (error) throw error
      
      // Count by type
      const stats = {
        meal: 0,
        workout: 0,
        progress: 0,
        victory: 0,
        totalDays: 7,
        activeDays: new Set()
      }
      
      data?.forEach(photo => {
        stats[photo.photo_type] = (stats[photo.photo_type] || 0) + 1
        stats.activeDays.add(photo.photo_date)
      })
      
      stats.activeDays = stats.activeDays.size
      stats.streak = this.calculateStreak(data)
      
      return stats
    } catch (error) {
      console.error('Get weekly stats failed:', error)
      return {
        meal: 0,
        workout: 0,
        progress: 0,
        victory: 0,
        totalDays: 7,
        activeDays: 0,
        streak: 0
      }
    }
  }

  // Calculate photo streak
  calculateStreak(photos) {
    if (!photos || photos.length === 0) return 0
    
    const dates = [...new Set(photos.map(p => p.photo_date))].sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < dates.length; i++) {
      const photoDate = dates[i]
      const expectedDate = currentDate.toISOString().split('T')[0]
      
      if (photoDate === expectedDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  // === CHALLENGE COMPLIANCE ===

  // Get Friday photo sets for challenge requirement (now only front/side)
  async getFridayPhotoSets(clientId, startDate, endDate) {
    try {
      console.log('Checking Friday compliance:', { startDate, endDate })
      
      // Get all Friday progress photos in date range
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('photo_date, metadata')
        .eq('client_id', clientId)
        .eq('is_friday_photo', true)
        .eq('photo_type', 'progress')
        .gte('photo_date', startDate)
        .lte('photo_date', endDate)
        .order('photo_date')
      
      if (error) {
        console.error('Friday sets query failed:', error)
        throw error
      }
      
      // Group by date and check for complete sets (front + side)
      const dateGroups = {}
      data?.forEach(photo => {
        if (!dateGroups[photo.photo_date]) {
          dateGroups[photo.photo_date] = new Set()
        }
        if (photo.metadata?.subtype) {
          dateGroups[photo.photo_date].add(photo.metadata.subtype)
        }
      })
      
      // Filter for complete sets (must have both front and side)
      const completeSets = Object.entries(dateGroups)
        .filter(([date, subtypes]) => 
          subtypes.has('front') && subtypes.has('side')
        )
        .map(([date]) => date)
      
      const result = {
        completeSets: completeSets.length,
        required: 8,
        met: completeSets.length >= 8,
        percentage: Math.round((completeSets.length / 8) * 100),
        dates: completeSets
      }
      
      console.log('Friday compliance:', result)
      return result
    } catch (error) {
      console.error('Get Friday sets failed:', error)
      return {
        completeSets: 0,
        required: 8,
        met: false,
        percentage: 0,
        dates: []
      }
    }
  }

  // Get overall challenge progress
  async getChallengePhotoProgress(clientId, challengeStartDate) {
    try {
      const startDate = challengeStartDate || await this.getChallengeStartDate(clientId)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 56) // 8 weeks
      
      console.log('Getting challenge progress')
      
      // Get Friday sets
      const fridaySets = await this.getFridayPhotoSets(
        clientId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      
      // Get all photos count by type
      const { data: allPhotos } = await this.supabase
        .from(this.tableName)
        .select('photo_type, week_number')
        .eq('client_id', clientId)
        .gte('photo_date', startDate.toISOString().split('T')[0])
        .lte('photo_date', endDate.toISOString().split('T')[0])
      
      const counts = {
        progress: 0,
        meal: 0,
        workout: 0,
        victory: 0
      }
      
      allPhotos?.forEach(photo => {
        counts[photo.photo_type] = (counts[photo.photo_type] || 0) + 1
      })
      
      const uniqueWeeks = new Set(allPhotos?.map(p => p.week_number) || []).size
      const nextFriday = this.getNextFriday()
      
      return {
        fridaySets: fridaySets,
        photoCounts: counts,
        totalPhotos: allPhotos?.length || 0,
        weeksWithPhotos: uniqueWeeks,
        isCompliant: fridaySets.met,
        nextFriday: nextFriday.toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Get challenge progress failed:', error)
      return {
        fridaySets: { completeSets: 0, required: 8, met: false, percentage: 0, dates: [] },
        photoCounts: { progress: 0, meal: 0, workout: 0, victory: 0 },
        totalPhotos: 0,
        weeksWithPhotos: 0,
        isCompliant: false,
        nextFriday: this.getNextFriday().toISOString().split('T')[0]
      }
    }
  }

  // === DELETE METHOD ===

  // Delete a photo
  async deletePhoto(photoId, photoUrl) {
    try {
      console.log('Deleting photo:', photoId)
      
      // Delete from storage if URL contains our bucket
      if (photoUrl && photoUrl.includes(this.bucketName)) {
        const pathMatch = photoUrl.match(new RegExp(`${this.bucketName}/(.+)`))
        if (pathMatch && pathMatch[1]) {
          const path = pathMatch[1]
          console.log('Deleting from storage:', path)
          
          await this.storage
            .from(this.bucketName)
            .remove([path])
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
}

export default Photos8CHService
