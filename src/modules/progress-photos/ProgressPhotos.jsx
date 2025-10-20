// src/modules/progress-photos/ProgressPhotos.jsx
import React, { useState, useEffect } from 'react'
import ProgressPhotosService from './ProgressPhotosService'
import ExampleSlider from './components/ExampleSlider'
import UploadSection from './components/UploadSection'
import PhotoGallery from './components/PhotoGallery'
import PhotoStats from './components/PhotoStats'

export default function ProgressPhotos({ db, client }) {
  // Initialize service
  const [service] = useState(() => new ProgressPhotosService(db))
  
  // State
  const [todayData, setTodayData] = useState({})
  const [weeklyStats, setWeeklyStats] = useState({})
  const [recentPhotos, setRecentPhotos] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const isMobile = window.innerWidth <= 768
  const isFriday = new Date().getDay() === 5

  // Load all data
  useEffect(() => {
    if (client?.id) {
      loadAllData()
    }
  }, [client?.id, refreshKey])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [today, weekly, photos] = await Promise.all([
        service.getTodayPhotos(client.id),
        service.getWeeklyStats(client.id),
        service.getRecentPhotos(client.id, 50)
      ])
      
      setTodayData(today)
      setWeeklyStats(weekly)
      setRecentPhotos(photos)
    } catch (error) {
      console.error('Error loading photo data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle photo upload
  const handleUpload = async (file, photoType) => {
    try {
      const metadata = {}
      if (photoType === 'progress') {
        const subtype = prompt('Is dit een FRONT of SIDE foto?', 'front')?.toLowerCase()
        if (!['front', 'side'].includes(subtype)) {
          alert('Kies front of side')
          return
        }
        metadata.subtype = subtype
      }
      
      await service.uploadPhoto(client.id, file, photoType, metadata)
      setRefreshKey(prev => prev + 1)
      
      const messages = {
        progress: 'Progressie foto geupload!',
        meal: 'Maaltijd foto vastgelegd!',
        workout: 'Workout vastgelegd!',
        victory: 'Overwinning opgeslagen!'
      }
      alert(messages[photoType] || 'Foto geupload!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload mislukt. Probeer opnieuw.')
    }
  }

  // Handle photo deletion
  const handleDelete = async (photoId, photoUrl) => {
    try {
      await service.deletePhoto(photoId, photoUrl)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Kon foto niet verwijderen')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem' // Minimale spacing tussen alle secties
    }}>
      {/* 1. Example Slider */}
      <ExampleSlider isMobile={isMobile} />

      {/* 2. Upload Section */}
      <UploadSection
        onUpload={handleUpload}
        todayData={todayData}
        isFriday={isFriday}
        isMobile={isMobile}
      />

      {/* 3. Photo Gallery */}
      <PhotoGallery
        photos={recentPhotos}
        onDelete={handleDelete}
        isMobile={isMobile}
      />

      {/* 4. Statistics */}
      <PhotoStats
        weeklyStats={weeklyStats}
        todayData={todayData}
        isMobile={isMobile}
      />
    </div>
  )
}
