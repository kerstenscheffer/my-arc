import { Camera } from 'lucide-react'

export const photosConfig = {
  icon: Camera,
  title: 'Photos',
  color: '#f59e0b',
  required: 8
}

export async function loadPhotosData(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    const { data } = await db.supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
    
    // Group by Friday dates to find complete sets (front + side)
    const fridayPhotos = {}
    
    data?.forEach(photo => {
      const day = new Date(photo.date).getDay()
      if (day === 5) {  // Friday
        if (!fridayPhotos[photo.date]) {
          fridayPhotos[photo.date] = {
            types: new Set(),
            photos: []
          }
        }
        fridayPhotos[photo.date].types.add(photo.photo_type)
        fridayPhotos[photo.date].photos.push(photo)
      }
    })
    
    // Count complete sets (both front AND side)
    const completeSets = Object.entries(fridayPhotos).filter(([date, data]) => 
      data.types.has('front') && data.types.has('side')
    )
    
    // Get last complete set for removal
    const lastCompleteSet = completeSets[0]
    
    return {
      current: completeSets.length,
      lastEntry: lastCompleteSet?.[0] || null,
      lastEntryData: lastCompleteSet ? fridayPhotos[lastCompleteSet[0]].photos : null
    }
  } catch (error) {
    console.error('Error loading photos data:', error)
    return { current: 0, lastEntry: null, lastEntryData: null }
  }
}

export async function addPhoto(db, clientId, challengeData) {
  try {
    const startDate = new Date(challengeData.start_date)
    const endDate = new Date(challengeData.end_date)
    
    // Get existing photos
    const { data: existing } = await db.supabase
      .from('progress_photos')
      .select('date, photo_type')
      .eq('client_id', clientId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    // Group existing Friday photos
    const fridayPhotos = {}
    existing?.forEach(photo => {
      const day = new Date(photo.date).getDay()
      if (day === 5) {
        if (!fridayPhotos[photo.date]) {
          fridayPhotos[photo.date] = new Set()
        }
        fridayPhotos[photo.date].add(photo.photo_type)
      }
    })
    
    // Find first Friday without complete set (from today backwards)
    let targetDate = null
    const today = new Date()
    
    for (let i = 0; i <= 56; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate < startDate) break
      if (checkDate > endDate) continue
      if (checkDate.getDay() !== 5) continue  // Skip non-Fridays
      
      const dateStr = checkDate.toISOString().split('T')[0]
      const existingTypes = fridayPhotos[dateStr] || new Set()
      
      // Check if this Friday needs photos
      if (!existingTypes.has('front') || !existingTypes.has('side')) {
        targetDate = dateStr
        
        // Determine what photos to add
        const photosToAdd = []
        if (!existingTypes.has('front')) {
          photosToAdd.push({ type: 'front' })
        }
        if (!existingTypes.has('side')) {
          photosToAdd.push({ type: 'side' })
        }
        
        // Insert missing photos with placeholder URLs
        // Clean insert - only columns that exist in table
        const insertData = photosToAdd.map(photo => ({
          client_id: clientId,
          date: targetDate,
          photo_url: `https://via.placeholder.com/400x600/1a1a1a/f59e0b?text=${photo.type.toUpperCase()}+PHOTO`,
          photo_type: photo.type,
          is_private: false
        }))
        
        const { error } = await db.supabase
          .from('progress_photos')
          .insert(insertData)
        
        if (error) {
          // If RLS error, provide clear instructions
          if (error.message.includes('row-level security') || error.code === '42501') {
            throw new Error(
              '❌ RLS Policy Missing!\n\n' +
              'De progress_photos tabel heeft geen INSERT policy voor coaches.\n\n' +
              'FIX: Ga naar Supabase SQL Editor en run:\n\n' +
              'CREATE POLICY "progress_photos_insert" ON progress_photos\n' +
              'FOR INSERT WITH CHECK (\n' +
              '  auth.uid() = client_id OR\n' +
              '  EXISTS (SELECT 1 FROM clients WHERE clients.id = progress_photos.client_id AND clients.trainer_id = auth.uid())\n' +
              ');'
            )
          }
          throw error
        }
        
        const addedTypes = photosToAdd.map(p => p.type).join(' + ')
        return {
          success: true,
          message: `Foto's (${addedTypes}) toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')} - Upload echte foto's later`
        }
      }
    }
    
    throw new Error('Geen beschikbare vrijdag zonder complete foto set')
    
  } catch (error) {
    console.error('Error adding photo:', error)
    throw error
  }
}

export async function removePhoto(db, clientId, lastEntryData) {
  try {
    if (!lastEntryData || !Array.isArray(lastEntryData)) {
      throw new Error('Geen foto set om te verwijderen')
    }
    
    // Delete all photos from the set (both front and side)
    const photoIds = lastEntryData.map(photo => photo.id)
    
    const { error } = await db.supabase
      .from('progress_photos')
      .delete()
      .in('id', photoIds)
    
    if (error) {
      // If RLS error, provide clear instructions
      if (error.message.includes('row-level security') || error.code === '42501') {
        throw new Error(
          '❌ RLS Policy Missing!\n\n' +
          'De progress_photos tabel heeft geen DELETE policy voor coaches.\n\n' +
          'FIX: Ga naar Supabase SQL Editor en run:\n\n' +
          'CREATE POLICY "progress_photos_delete" ON progress_photos\n' +
          'FOR DELETE USING (\n' +
          '  auth.uid() = client_id OR\n' +
          '  EXISTS (SELECT 1 FROM clients WHERE clients.id = progress_photos.client_id AND clients.trainer_id = auth.uid())\n' +
          ');'
        )
      }
      throw error
    }
    
    return {
      success: true,
      message: `Foto set verwijderd (${lastEntryData.length} foto's)`
    }
  } catch (error) {
    console.error('Error removing photos:', error)
    throw error
  }
}
