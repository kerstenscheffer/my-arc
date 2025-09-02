import ManageAssignmentsModal from './ManageAssignmentsModal'
import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Play, Plus, X, Upload, Eye, Clock, Star, Users, 
  TrendingUp, Calendar, Filter, Search, ChevronRight,
  Youtube, Edit, Trash2, Copy, Send, BarChart,
  Video, FileVideo, PlayCircle, Settings, Award,
  Sparkles, Target, Brain, Activity, Heart, Zap,
  Home, Dumbbell, Apple, Image, Camera, Phone, Trophy
} from 'lucide-react'
import videoService from '../videos/VideoService'

export default function CoachVideoTab({ clients = [], db }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('library')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientsLoading, setClientsLoading] = useState(true)
  const [localClients, setLocalClients] = useState([])
  const [showManageModal, setShowManageModal] = useState(false)
  const [managingVideo, setManagingVideo] = useState(null)
  
  const categories = [
    { value: 'motivation', label: 'Motivatie', icon: Zap, color: '#ef4444' },
    { value: 'technique', label: 'Techniek', icon: Target, color: '#3b82f6' },
    { value: 'nutrition', label: 'Voeding', icon: Heart, color: '#10b981' },
    { value: 'mindset', label: 'Mindset', icon: Brain, color: '#8b5cf6' },
    { value: 'recovery', label: 'Herstel', icon: Activity, color: '#06b6d4' },
    { value: 'onboarding', label: 'Onboarding', icon: Sparkles, color: '#f59e0b' }
  ]
  
  const isMobile = useIsMobile()
  
  // Debug useEffect om state changes te monitoren
  useEffect(() => {
    console.log('State Update - showManageModal:', showManageModal);
    console.log('State Update - managingVideo:', managingVideo);
  }, [showManageModal, managingVideo]);
  
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
    return categories.find(c => c.value === category) || categories[0]
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
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            onMouseEnter={(e) => {
              if (!isMobile) e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              if (!isMobile) e.currentTarget.style.opacity = '0.95'
            }}
          >
            <Plus size={18} />
            Nieuwe Video
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Totaal Videos', value: videos.length, icon: Play, color: 'rgba(59, 130, 246, 0.8)' },
          { label: 'Totaal Views', value: videos.reduce((sum, v) => sum + (v.view_count || 0), 0), icon: Eye, color: 'rgba(16, 185, 129, 0.8)' },
          { label: 'Clients', value: localClients.length, icon: Users, color: 'rgba(245, 158, 11, 0.8)' },
          { label: 'Avg Rating', value: '4.8', icon: Star, color: 'rgba(139, 92, 246, 0.8)' }
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <stat.icon size={20} style={{ color: stat.color, opacity: 0.8 }} />
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255,255,255,0.4)'
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Search */}
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)'
            }}
          />
          <input
            type="text"
            placeholder="Zoek videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem'
            }}
          />
        </div>
        
        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '0.5rem 1rem',
              background: selectedCategory === 'all' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedCategory === 'all' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              color: selectedCategory === 'all' ? '#10b981' : 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            Alle
          </button>
          {categories.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedCategory === cat.value
                    ? `linear-gradient(135deg, ${cat.color}33 0%, ${cat.color}11 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCategory === cat.value ? cat.color + '88' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '8px',
                  color: selectedCategory === cat.value ? cat.color : 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>
      
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
          {filteredVideos.map(video => {
            const categoryConfig = getCategoryConfig(video.category)
            const thumbnailUrl = videoService.getThumbnailUrl(video)
            const Icon = categoryConfig.icon
            
            return (
              <div key={video.id} style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease'
              }}>
                {/* Video Thumbnail */}
                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  background: '#000',
                  overflow: 'hidden'
                }}>
                  <img
                    src={thumbnailUrl}
                    alt={video.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const youtubeId = videoService.extractYouTubeId(video.video_url)
                      if (youtubeId && e.target.src !== `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`) {
                        e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                      }
                    }}
                  />
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    background: `${categoryConfig.color}dd`,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Icon size={12} />
                    {categoryConfig.label}
                  </div>

                  {/* Custom Thumbnail Indicator */}
                  {video.thumbnail_url && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      padding: '0.35rem',
                      background: 'rgba(16, 185, 129, 0.9)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Camera size={12} color="#fff" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  onClick={() => window.open(video.video_url, '_blank')}
                  >
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Play size={24} color="#000" style={{ marginLeft: '4px' }} />
                    </div>
                  </div>
                </div>
                
                {/* Video Info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3
                  }}>
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: '1rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {video.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.4)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Eye size={14} />
                      {video.view_count || 0} views
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Star size={14} />
                      {video.like_count || 0} likes
                    </span>
                    {video.duration_seconds && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} />
                        {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => {
                        setSelectedVideo(video)
                        setShowAssignModal(true)
                      }}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        color: '#10b981',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.3s ease',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)'
                        }
                      }}
                    >
                      <Send size={14} />
                      Assign
                    </button>

                    <button
                      onClick={() => {
                        console.log('MANAGE BUTTON CLICKED!');
                        console.log('Current video:', video);
                        console.log('Setting managingVideo to:', video);
                        setManagingVideo(video);
                        console.log('Setting showManageModal to true');
                        setShowManageModal(true);
                        console.log('State updates triggered');
                      }}
                      style={{
                        padding: '0.6rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        }
                      }}
                    >
                      <Users size={14} />
                      Manage
                    </button>
                    
                    <button
                      onClick={() => window.open(video.video_url, '_blank')}
                      style={{
                        padding: '0.6rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (confirm(`Weet je zeker dat je "${video.title}" wilt verwijderen? Dit verwijdert de video ook van alle clients.`)) {
                          console.log('Deleting video:', video.id);
                          const result = await videoService.deleteVideo(video.id);
                          if (result.success) {
                            alert('Video succesvol verwijderd');
                            await loadVideos();
                          } else {
                            alert('Er ging iets mis bij het verwijderen: ' + (result.error || 'Onbekende fout'));
                          }
                        }
                      }}
                      style={{
                        padding: '0.6rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
          categories={categories}
          db={db}
        />
      )}
      
      {/* Assign Modal */}
      {showAssignModal && selectedVideo && (
        <VideoAssignModal
          video={selectedVideo}
          clients={localClients}
          clientsLoading={clientsLoading}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedVideo(null)
          }}
          onAssign={async (clientIds, assignmentData) => {
            const result = await videoService.assignVideo(
              selectedVideo.id,
              clientIds,
              assignmentData
            )
            if (result.success) {
              alert(`Video assigned aan ${clientIds.length} client(s)!`)
              setShowAssignModal(false)
              setSelectedVideo(null)
            }
          }}
        />
      )}

      {/* Manage Assignments Modal - OP HET JUISTE NIVEAU */}
      {showManageModal && managingVideo && (
        <>
          {console.log('RENDERING ManageAssignmentsModal with video:', managingVideo)}
          {typeof ManageAssignmentsModal !== 'undefined' ? (
            <ManageAssignmentsModal
              video={managingVideo}
              onClose={() => {
                console.log('Closing manage modal');
                setShowManageModal(false);
                setManagingVideo(null);
              }}
              onUpdate={() => {
                console.log('Updating after manage action');
                loadVideos();
              }}
            />
          ) : (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid red',
              zIndex: 10000
            }}>
              <h2 style={{ color: '#fff' }}>ManageAssignmentsModal not loaded!</h2>
              <p style={{ color: '#ff6666' }}>Check if ManageAssignmentsModal.jsx exists in src/modules/videos/</p>
              <button 
                onClick={() => {
                  setShowManageModal(false);
                  setManagingVideo(null);
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#ff6666',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================
// VIDEO UPLOAD MODAL - MET THUMBNAIL UPLOAD
// ============================================
function VideoUploadModal({ onClose, onSave, categories, db }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'motivation',
    tags: [],
    difficulty_level: 'beginner',
    best_time_to_watch: 'anytime'
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'rgba(16, 185, 129, 0.8)' },
    { value: 'intermediate', label: 'Gemiddeld', color: 'rgba(245, 158, 11, 0.8)' },
    { value: 'advanced', label: 'Gevorderd', color: 'rgba(239, 68, 68, 0.8)' }
  ]
  
  const isMobile = useIsMobile()

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url) {
      alert('Vul minimaal een titel en video URL in')
      return
    }

    setUploading(true)
    try {
      let thumbnailUrl = null

      if (thumbnailFile) {
        // Get current user voor coach_id
        const user = await db.getCurrentUser()
        const uploadResult = await videoService.uploadThumbnail(
          thumbnailFile, 
          user.id
        )
        
        if (uploadResult.success) {
          thumbnailUrl = uploadResult.thumbnailUrl
        } else {
          console.warn('Thumbnail upload failed:', uploadResult.error)
          // Toon error aan gebruiker
          alert(`Upload mislukt: ${uploadResult.error}`)
        }
      }

      await onSave({
        ...formData,
        thumbnail_url: thumbnailUrl
      })
    } catch (error) {
      console.error('Error creating video:', error)
      alert('Er ging iets mis bij het uploaden')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Upload size={20} style={{ color: '#10b981' }} />
            Nieuwe Video Toevoegen
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        <div>
          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="bv. Morning Motivation - Start Strong"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          {/* YouTube URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Youtube size={16} />
              YouTube URL *
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({...formData, video_url: e.target.value})}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Thumbnail Upload */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Camera size={16} />
              Custom Thumbnail (optioneel)
            </label>
            
            <div style={{
              border: '2px dashed rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              background: 'rgba(255,255,255,0.02)'
            }}>
              {thumbnailPreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '150px',
                      borderRadius: '6px',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={() => {
                      setThumbnailFile(null)
                      setThumbnailPreview(null)
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  <Image size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    Sleep een afbeelding hierheen of klik om te uploaden
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.75rem'
                  }}>
                    JPG, PNG tot 5MB
                  </p>
                </>
              )}
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleThumbnailChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
            
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '0.5rem'
            }}>
              Zonder custom thumbnail wordt automatisch de YouTube thumbnail gebruikt
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Korte beschrijving van de video..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>
          
          {/* Category */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Categorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} style={{ background: '#1a1a1a' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <button
              onClick={onClose}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: uploading ? 0.5 : 1
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: uploading
                  ? 'rgba(255,255,255,0.03)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                border: 'none',
                borderRadius: '8px',
                color: uploading ? 'rgba(255,255,255,0.4)' : '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 0.95,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {uploading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Uploaden...
                </>
              ) : (
                'Video Toevoegen'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// VIDEO ASSIGN MODAL
// ============================================
function VideoAssignModal({ video, clients, clientsLoading, onClose, onAssign }) {
  const [selectedClients, setSelectedClients] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [assignmentData, setAssignmentData] = useState({
    type: 'manual',
    scheduledFor: new Date().toISOString().split('T')[0],
    timeOfDay: 'anytime',
    pageContext: 'home',
    contextData: {},
    notes: ''
  })
  
  const pageContextOptions = [
    { value: 'home', label: 'Home / Dashboard', icon: Home, color: '#10b981' },
    { value: 'workout', label: 'Workout Pagina', icon: Dumbbell, color: '#f59e0b' },
    { value: 'meals', label: 'Meal Planning', icon: Apple, color: '#3b82f6' },
    { value: 'calls', label: 'Calls Pagina', icon: Phone, color: '#3b82f6' },
    { value: 'challenges', label: 'Challenges Pagina', icon: Trophy, color: '#dc2626' },
    { value: 'progress', label: 'Progress Tracking', icon: TrendingUp, color: '#8b5cf6' },
    { value: 'workout_day', label: 'Specifieke Workout Dag', icon: Calendar, color: '#ef4444' },
    { value: 'meal_moment', label: 'Specifiek Meal Moment', icon: Clock, color: '#06b6d4' }
  ]
  
  const isMobile = useIsMobile()
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }
  
  const handleClientToggle = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId))
    } else {
      setSelectedClients([...selectedClients, clientId])
    }
  }
  
  const handleAssign = () => {
    if (selectedClients.length === 0) {
      alert('Selecteer minimaal 1 client')
      return
    }
    
    const finalAssignmentData = {
      ...assignmentData,
      pageContext: assignmentData.pageContext,
      contextData: assignmentData.contextData
    }
    
    onAssign(selectedClients, finalAssignmentData)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Send size={20} style={{ color: '#10b981' }} />
            Assign Video
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Video Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {video.title}
          </h4>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.4)'
          }}>
            {video.description}
          </p>
        </div>
        
        {/* Page Context Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <FileVideo size={16} />
            Waar moet deze video verschijnen?
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '0.5rem'
          }}>
            {pageContextOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setAssignmentData({...assignmentData, pageContext: option.value})}
                style={{
                  padding: '0.75rem',
                  background: assignmentData.pageContext === option.value
                    ? `linear-gradient(135deg, ${option.color}33 0%, ${option.color}11 100%)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${assignmentData.pageContext === option.value ? option.color + '88' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '8px',
                  color: assignmentData.pageContext === option.value ? option.color : 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {React.createElement(option.icon, { size: 14 })}
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Extra Context Fields */}
        {assignmentData.pageContext === 'workout_day' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Welke workout dag?
            </label>
            <select
              onChange={(e) => setAssignmentData({
                ...assignmentData, 
                contextData: {...assignmentData.contextData, day: e.target.value}
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              <option value="">Selecteer dag</option>
              <option value="monday">Maandag</option>
              <option value="tuesday">Dinsdag</option>
              <option value="wednesday">Woensdag</option>
              <option value="thursday">Donderdag</option>
              <option value="friday">Vrijdag</option>
              <option value="saturday">Zaterdag</option>
              <option value="sunday">Zondag</option>
            </select>
          </div>
        )}
        
        {assignmentData.pageContext === 'meal_moment' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Welk meal moment?
            </label>
            <select
              onChange={(e) => setAssignmentData({
                ...assignmentData,
                contextData: {...assignmentData.contextData, mealType: e.target.value}
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            >
              <option value="">Selecteer moment</option>
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
              <option value="pre-workout">Pre-workout</option>
              <option value="post-workout">Post-workout</option>
            </select>
          </div>
        )}
        
        {/* Schedule Date */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Calendar size={16} />
            Schedule voor
          </label>
          <input
            type="date"
            value={assignmentData.scheduledFor}
            onChange={(e) => setAssignmentData({...assignmentData, scheduledFor: e.target.value})}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.95rem'
            }}
          />
        </div>
        
        {/* Client Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <label style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Users size={16} />
              Selecteer Clients ({selectedClients.length}/{clients.length})
            </label>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {selectAll ? 'Deselecteer Alle' : 'Selecteer Alle'}
            </button>
          </div>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.02)'
          }}>
            {clientsLoading ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Clients laden...
              </div>
            ) : clients.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Geen clients gevonden. Voeg eerst clients toe.
              </div>
            ) : (
              clients.map((client, index) => {
                const clientName = client.first_name && client.last_name 
                  ? `${client.first_name} ${client.last_name}`
                  : client.first_name || client.last_name || client.email || `Client ${index + 1}`
                
                return (
                  <label
                    key={client.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      background: selectedClients.includes(client.id)
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span style={{ 
                      color: '#fff', 
                      fontSize: '0.9rem',
                      textTransform: 'capitalize'
                    }}>
                      {clientName}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedClients.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedClients.length === 0 
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
              border: selectedClients.length === 0 
                ? '1px solid rgba(255,255,255,0.08)'
                : 'none',
              borderRadius: '8px',
              color: selectedClients.length === 0 
                ? 'rgba(255,255,255,0.3)'
                : '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedClients.length === 0 ? 0.5 : 0.95,
              transition: 'all 0.3s ease'
            }}
          >
            {selectedClients.length === 0 
              ? 'Selecteer minimaal 1 client'
              : `Assign aan ${selectedClients.length} Client${selectedClients.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
