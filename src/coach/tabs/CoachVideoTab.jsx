// src/coach/tabs/CoachVideoTab.jsx - MAIN (MODULAR)
import React, { useState, useEffect } from 'react'
import { Video, Plus } from 'lucide-react'
import { 
  Zap, Target, Heart, Brain, Activity, Sparkles 
} from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import videoService from '../../modules/videos/VideoService'
import ManageAssignmentsModal from '../../modules/videos/ManageAssignmentsModal'

// Modular Components
import VideoStatsCards from './video-tab-components/VideoStatsCards'
import VideoSearchFilters from './video-tab-components/VideoSearchFilters'
import VideoCard from './video-tab-components/VideoCard'
import VideoUploadModal from './video-tab-components/VideoUploadModal'

const CATEGORIES = [
  { value: 'motivation', label: 'Motivatie', icon: Zap, color: '#ef4444' },
  { value: 'technique', label: 'Techniek', icon: Target, color: '#3b82f6' },
  { value: 'nutrition', label: 'Voeding', icon: Heart, color: '#10b981' },
  { value: 'mindset', label: 'Mindset', icon: Brain, color: '#8b5cf6' },
  { value: 'recovery', label: 'Herstel', icon: Activity, color: '#06b6d4' },
  { value: 'onboarding', label: 'Onboarding', icon: Sparkles, color: '#f59e0b' }
]

export default function CoachVideoTab({ clients = [], db }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientsLoading, setClientsLoading] = useState(true)
  const [localClients, setLocalClients] = useState([])
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingVideo, setManagingVideo] = useState(null)
  
  const isMobile = useIsMobile()
  
  useEffect(() => {
    loadVideos()
    loadClients()
  }, [])
  
  const loadVideos = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      const data = await videoService.getCoachVideos(user.id)
      setVideos(data)
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadClients = async () => {
    setClientsLoading(true)
    try {
      if (!clients || clients.length === 0) {
        const user = await db.getCurrentUser()
        const clientsData = await db.getClients(user.id)
        setLocalClients(clientsData || [])
      } else {
        setLocalClients(clients)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setClientsLoading(false)
    }
  }
  
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          video.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  const getCategoryConfig = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0]
  }

  const handleDeleteVideo = async (video) => {
    const confirmMessage = video.is_default
      ? `Weet je zeker dat je "${video.title}" wilt verwijderen? Deze video is standaard zichtbaar voor alle clients!`
      : `Weet je zeker dat je "${video.title}" wilt verwijderen?`
    
    if (confirm(confirmMessage)) {
      const result = await videoService.deleteVideo(video.id)
      if (result.success) {
        alert('Video succesvol verwijderd')
        await loadVideos()
      } else {
        alert('Er ging iets mis: ' + (result.error || 'Onbekende fout'))
      }
    }
  }
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: '#0a0f0d',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Video size={24} style={{ color: '#10b981' }} />
          Video Library
        </h2>
        
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            opacity: 0.95,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          <Plus size={18} />
          Nieuwe Video
        </button>
      </div>
      
      {/* Stats Cards */}
      <VideoStatsCards 
        videos={videos} 
        clientsCount={localClients.length} 
      />
      
      {/* Search and Filters */}
      <VideoSearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={CATEGORIES}
      />
      
      {/* Video Grid */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'rgba(255,255,255,0.4)'
        }}>
          Videos laden...
        </div>
      ) : filteredVideos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Video size={48} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
            {searchQuery || selectedCategory !== 'all' 
              ? 'Geen videos gevonden'
              : 'Nog geen videos toegevoegd'}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: 0.95
            }}
          >
            Upload je eerste video
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredVideos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              categoryConfig={getCategoryConfig(video.category)}
              onAssign={() => {
                setSelectedVideo(video)
                setShowAssignModal(true)
              }}
              onManage={() => {
                setManagingVideo(video)
                setShowManageModal(true)
              }}
              onDelete={() => handleDeleteVideo(video)}
            />
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <VideoUploadModal
          onClose={() => setShowUploadModal(false)}
          onSave={async (videoData) => {
            const user = await db.getCurrentUser()
            const result = await videoService.createVideo({
              ...videoData,
              coach_id: user.id
            })
            if (result.success) {
              await loadVideos()
              setShowUploadModal(false)
            }
          }}
          categories={CATEGORIES}
          db={db}
        />
      )}
      
      {/* Manage Assignments Modal */}
      {showManageModal && managingVideo && (
        <ManageAssignmentsModal
          video={managingVideo}
          onClose={() => {
            setShowManageModal(false)
            setManagingVideo(null)
          }}
          onUpdate={() => {
            loadVideos()
          }}
        />
      )}
    </div>
  )
}
