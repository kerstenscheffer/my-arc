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
    
    // ✅ FIXED: Count ALL photos (matches banner logic)
    const count = data?.length || 0
    
    return {
      current: count,
      lastEntry: data?.[0]?.date || null,
      lastEntryData: data?.[0] || null
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
    
    // Find first available date (from today backwards)
    let targetDate = null
    const today = new Date()
    
    for (let i = 0; i <= 56; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      if (checkDate < startDate) break
      if (checkDate > endDate) continue
      
      const dateStr = checkDate.toISOString().split('T')[0]
      targetDate = dateStr
      break
    }
    
    if (!targetDate) {
      throw new Error('Geen beschikbare datum in challenge periode')
    }
    
    // Add a single front photo (coach can add more manually)
    const insertData = {
      client_id: clientId,
      date: targetDate,
      photo_url: `https://via.placeholder.com/400x600/1a1a1a/f59e0b?text=PROGRESS+PHOTO`,
      photo_type: 'front',
      is_private: false
    }
    
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
    
    return {
      success: true,
      message: `Foto toegevoegd voor ${new Date(targetDate).toLocaleDateString('nl-NL')} - Upload echte foto later`
    }
    
  } catch (error) {
    console.error('Error adding photo:', error)
    throw error
  }
}

export async function removePhoto(db, clientId, lastEntryData) {
  try {
    if (!lastEntryData) {
      throw new Error('Geen foto om te verwijderen')
    }
    
    // Delete the photo
    const { error } = await db.supabase
      .from('progress_photos')
      .delete()
      .eq('id', lastEntryData.id)
    
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
      message: 'Foto verwijderd'
    }
  } catch (error) {
    console.error('Error removing photos:', error)
    throw error
  }
}
