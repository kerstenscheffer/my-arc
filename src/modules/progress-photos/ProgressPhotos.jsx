// src/modules/progress-photos/ProgressPhotos.jsx
// v2.0 AINextMeal DNA — flush stacking, no outer padding
// Props IDENTIEK: { db, client }

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import ProgressPhotosService from './ProgressPhotosService'
import PhotoGallery from './components/PhotoGallery'
import PhotoStats from './components/PhotoStats'

export default function ProgressPhotos({ db, client }) {
  const [service] = useState(() => new ProgressPhotosService(db))
  const [todayData, setTodayData] = useState({})
  const [weeklyStats, setWeeklyStats] = useState({})
  const [recentPhotos, setRecentPhotos] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMobile = window.innerWidth <= 768

  useEffect(() => { if (client?.id) loadAllData() }, [client?.id, refreshKey])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [today, weekly, photos] = await Promise.all([
        service.getTodayPhotos(client.id),
        service.getWeeklyStats(client.id),
        service.getRecentPhotos(client.id, 50)
      ])
      setTodayData(today); setWeeklyStats(weekly); setRecentPhotos(photos)
    } catch (e) { console.error('Error loading photo data:', e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (photoId, photoUrl) => {
    try { await service.deletePhoto(photoId, photoUrl); setRefreshKey(p => p + 1) }
    catch (e) { console.error('Delete failed:', e); alert('Kon foto niet verwijderen') }
  }

  const handleUpdateSubtype = async (photoId, subtype) => {
    try { await service.updatePhotoSubtype(photoId, subtype); setRefreshKey(p => p + 1) }
    catch (e) { console.error('Update subtype failed:', e); alert('Kon hoek niet aanpassen') }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Loader2 size={24} color="#FFD700" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      <PhotoGallery photos={recentPhotos} onDelete={handleDelete} onUpdateSubtype={handleUpdateSubtype} isMobile={isMobile} />
      <PhotoStats weeklyStats={weeklyStats} todayData={todayData} isMobile={isMobile} />
    </div>
  )
}
