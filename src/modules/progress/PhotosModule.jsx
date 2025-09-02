import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { 
  Camera, Plus, Calendar, Lock, Unlock, Download,
  ChevronLeft, ChevronRight, Grid, List, Upload,
  Image, Trash2, Eye, EyeOff, Check, X, Star,
  Trophy, TrendingUp, Award, Zap, CheckCircle,
  Rocket, Sparkles, Flame, Crown, Target, Shield,
  ChefHat, Home, Utensils, Palette, Activity,
  Heart, Mountain, User, Coffee, Dumbbell
} from 'lucide-react'
// ProgressService import removed - using local storage instead

const THEME = {
  primary: '#ec4899',
  secondary: '#a855f7',
  gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
  border: 'rgba(236, 72, 153, 0.2)'
}

// Journey Milestones configuratie met Lucide icons
const MILESTONES = [
  { week: 0, label: 'Start', icon: Rocket, badge: 'Fresh Start', color: '#10b981' },
  { week: 1, label: 'Week 1', icon: Sparkles, badge: 'First Steps', color: '#3b82f6' },
  { week: 2, label: 'Week 2', icon: Flame, badge: 'Building Momentum', color: '#f59e0b' },
  { week: 4, label: 'Maand 1', icon: Trophy, badge: 'Month Warrior', color: '#ec4899' },
  { week: 8, label: 'Maand 2', icon: Dumbbell, badge: 'Transformation Mode', color: '#a855f7' },
  { week: 12, label: 'Maand 3', icon: Star, badge: 'Quarter Champion', color: '#ef4444' },
  { week: 16, label: 'Maand 4', icon: Crown, badge: 'Legend Status', color: '#f97316' }
]

const MEAL_LEVELS = [
  { photos: 0, level: 'Beginner Chef', icon: User, color: '#94a3b8' },
  { photos: 10, level: 'Home Cook', icon: Home, color: '#10b981' },
  { photos: 25, level: 'Meal Prep Pro', icon: Utensils, color: '#3b82f6' },
  { photos: 50, level: 'Nutrition Master', icon: Target, color: '#ec4899' },
  { photos: 100, level: 'Food Artist', icon: Palette, color: '#f59e0b' }
]

const ACTION_BADGES = [
  { type: 'cardio', count: 5, badge: 'Cardio Crusher', icon: Activity },
  { type: 'strength', count: 10, badge: 'Iron Warrior', icon: Dumbbell },
  { type: 'flexibility', count: 7, badge: 'Flex Master', icon: Heart },
  { type: 'outdoor', count: 3, badge: 'Nature Athlete', icon: Mountain }
]

export default function PhotosModule({ client, db }) {
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [viewMode, setViewMode] = useState('milestones')
  const [photoType, setPhotoType] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [uploadPreview, setUploadPreview] = useState(null)
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [coachTransformation, setCoachTransformation] = useState(null)
  const [photoStats, setPhotoStats] = useState({ meals: 0, actions: 0, progress: 0 })
  const [hoveredCard, setHoveredCard] = useState(null)
  
  const isMobile = useIsMobile()

  useEffect(() => {
    loadPhotos()
    loadCoachTransformation()
    loadPhotoStats()
  }, [client?.id, photoType])

  // Local storage helper functions (tijdelijke oplossing zonder Supabase)
  const getLocalPhotos = (clientId, type = null) => {
    try {
      const allPhotos = JSON.parse(localStorage.getItem('progress_photos') || '[]')
      let photos = allPhotos.filter(p => p.client_id === clientId)
      
      if (type) {
        photos = photos.filter(p => p.photo_type === type)
      }
      
      // Als geen photos, return demo data
      if (photos.length === 0) {
        return [
          {
            id: 'demo_1',
            client_id: clientId,
            photo_url: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Week+1',
            photo_type: 'progress',
            date_taken: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { milestone_week: 1, weight: 78.5 }
          },
          {
            id: 'demo_2',
            client_id: clientId,
            photo_url: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Meal',
            photo_type: 'meal',
            date_taken: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {}
          }
        ]
      }
      
      return photos.sort((a, b) => new Date(b.date_taken) - new Date(a.date_taken))
    } catch (error) {
      console.error('Error getting local photos:', error)
      return []
    }
  }

  const saveLocalPhoto = (clientId, file, type, metadata = {}) => {
    try {
      const mockPhoto = {
        id: `photo_${Date.now()}`,
        client_id: clientId,
        photo_url: URL.createObjectURL(file),
        photo_type: type,
        date_taken: new Date().toISOString(),
        metadata: {
          ...metadata,
          milestone_week: metadata.milestone_week || null,
          file_name: file.name
        }
      }
      
      const existingPhotos = JSON.parse(localStorage.getItem('progress_photos') || '[]')
      existingPhotos.push(mockPhoto)
      localStorage.setItem('progress_photos', JSON.stringify(existingPhotos))
      
      return mockPhoto
    } catch (error) {
      console.error('Error saving local photo:', error)
      throw error
    }
  }

  const loadPhotos = async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      // Gebruik local storage in plaats van ProgressService
      const photoData = getLocalPhotos(
        client.id,
        photoType === 'all' ? null : photoType
      )
      setPhotos(photoData || [])
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCoachTransformation = async () => {
    try {
      setCoachTransformation({
        story: "12 weken van 92kg naar 78kg - jij kan dit ook!",
        weeks: 12,
        result: "-14kg"
      })
    } catch (error) {
      console.error('Error loading coach data:', error)
    }
  }

  const loadPhotoStats = async () => {
    if (!client?.id) return
    try {
      const allPhotos = await ProgressService.getProgressPhotos(client.id)
      const stats = {
        meals: allPhotos?.filter(p => p.photo_type === 'meal').length || 0,
        actions: allPhotos?.filter(p => p.photo_type === 'action').length || 0,
        progress: allPhotos?.filter(p => p.photo_type === 'progress').length || 0
      }
      setPhotoStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const calculateProgress = () => {
    const startDate = new Date(client?.created_at || Date.now())
    const now = new Date()
    const weeks = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000))
    return weeks
  }

  const currentWeek = calculateProgress()
  const nextMilestone = MILESTONES.find(m => m.week > currentWeek) || MILESTONES[MILESTONES.length - 1]
  const daysToNext = Math.max(0, (nextMilestone.week * 7) - (currentWeek * 7))

  const getCurrentMealLevel = () => {
    const meals = photoStats.meals
    return MEAL_LEVELS.slice().reverse().find(level => meals >= level.photos) || MEAL_LEVELS[0]
  }

  const getNextMealLevel = () => {
    const meals = photoStats.meals
    return MEAL_LEVELS.find(level => meals < level.photos) || MEAL_LEVELS[MEAL_LEVELS.length - 1]
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview({
          file,
          preview: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async (type, milestone = null) => {
    if (!uploadPreview?.file || !client?.id) return

    try {
      // Gebruik local storage - NO ProgressService
      const newPhoto = saveLocalPhoto(client.id, uploadPreview.file, type, {
        milestone_week: milestone
      })
      
      setShowUpload(false)
      setUploadPreview(null)
      setSelectedMilestone(null)
      
      // Reload photos
      await loadPhotos()
      await loadPhotoStats()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Er ging iets mis bij het uploaden')
    }
  }

  const handleCompareSelect = (photo) => {
    if (compareMode) {
      if (selectedPhotos.find(p => p.id === photo.id)) {
        setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id))
      } else if (selectedPhotos.length < 2) {
        setSelectedPhotos([...selectedPhotos, photo])
      }
    }
  }

  const renderMilestoneView = () => {
    const currentMealLevel = getCurrentMealLevel()
    const nextMealLevel = getNextMealLevel()
    const mealProgress = ((photoStats.meals - currentMealLevel.photos) / (nextMealLevel.photos - currentMealLevel.photos)) * 100
    const MealIcon = currentMealLevel.icon
    const NextMealIcon = nextMealLevel.icon

    return (
      <div>
        {/* Premium Header with gradient animation */}
        <div style={{
          background: THEME.gradient,
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 20px 40px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'gradientShift 8s ease infinite',
          backgroundSize: '200% 200%'
        }}>
          {/* Animated background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              <Camera size={isMobile ? 28 : 36} />
              Journey Milestones
            </div>
            
            {/* Next milestone countdown with glassmorphism */}
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: isMobile ? '0.75rem' : '1rem',
              marginTop: '1rem',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255,255,255,0.95)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={16} />
                Volgende milestone
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {React.createElement(nextMilestone.icon, { size: 24, color: 'white' })}
                </div>
                <span>
                  {daysToNext} dagen - {nextMilestone.badge}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Inspiratie Widget - Premium styling */}
        {coachTransformation && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: 'shimmer 2s infinite'
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={isMobile ? 24 : 28} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600'
                }}>
                  Coach Transformatie
                </div>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {coachTransformation.story}
                </div>
              </div>
              <Zap size={isMobile ? 20 : 24} style={{ color: '#fbbf24' }} />
            </div>
          </div>
        )}

        {/* Milestone Timeline - Premium Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          {MILESTONES.map((milestone, index) => {
            const MilestoneIcon = milestone.icon
            const hasPhoto = photos.some(p => p.metadata?.milestone_week === milestone.week)
            const isLocked = milestone.week > currentWeek
            const isCurrent = milestone.week <= currentWeek && milestone.week + 1 > currentWeek
            const isHovered = hoveredCard === `milestone-${milestone.week}`
            
            return (
              <button
                key={milestone.week}
                onMouseEnter={() => setHoveredCard(`milestone-${milestone.week}`)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => {
                  if (!isLocked) {
                    setSelectedMilestone(milestone)
                    setShowUpload(true)
                  }
                }}
                style={{
                  background: hasPhoto 
                    ? `linear-gradient(135deg, ${milestone.color}30, ${milestone.color}15)`
                    : isLocked
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.5))'
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                  backdropFilter: 'blur(10px)',
                  border: isCurrent 
                    ? `2px solid ${milestone.color}`
                    : hasPhoto
                    ? `1px solid ${milestone.color}40`
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: isMobile ? '12px' : '16px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.5 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transform: isHovered && !isLocked ? 'translateY(-2px) scale(1.02)' : 'scale(1)',
                  boxShadow: isCurrent 
                    ? `0 15px 40px ${milestone.color}30` 
                    : isHovered && !isLocked
                    ? `0 10px 30px ${milestone.color}20`
                    : 'none',
                  animation: `slideInUp ${300 + index * 50}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                  minHeight: '140px'
                }}
                onTouchStart={(e) => {
                  if (isMobile && !isLocked) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile && !isLocked) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {/* Decorative circle */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: milestone.color,
                  opacity: 0.1
                }} />

                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(circle at center, ${milestone.color}15, transparent)`,
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                )}
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: isMobile ? '44px' : '52px',
                    height: isMobile ? '44px' : '52px',
                    borderRadius: '14px',
                    background: isLocked 
                      ? 'rgba(100, 116, 139, 0.2)'
                      : `linear-gradient(135deg, ${milestone.color}30, ${milestone.color}10)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    transform: isHovered && !isLocked ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {isLocked ? (
                      <Lock size={isMobile ? 24 : 28} style={{ color: '#64748b' }} />
                    ) : hasPhoto ? (
                      <CheckCircle size={isMobile ? 24 : 28} style={{ color: milestone.color }} />
                    ) : (
                      <MilestoneIcon size={isMobile ? 24 : 28} style={{ color: milestone.color }} />
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '0.875rem' : '0.95rem',
                    fontWeight: '700',
                    color: hasPhoto ? milestone.color : 'white',
                    marginBottom: '0.25rem'
                  }}>
                    {milestone.label}
                  </div>
                  
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: '500'
                  }}>
                    {milestone.badge}
                  </div>
                  
                  {hasPhoto && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem'
                    }}>
                      <Star size={16} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Meal & Action Stats - Premium Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          {/* Meal Level Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)'
          }}>
            {/* Decorative element */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              animation: 'float 4s ease-in-out infinite'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  Meal Journey
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '0.25rem 0.75rem',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: 'white',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)'
                }}>
                  Level {MEAL_LEVELS.indexOf(currentMealLevel) + 1}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MealIcon size={20} color="white" />
                </div>
                <div style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {currentMealLevel.level}
                </div>
              </div>
              
              <div style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '0.5rem'
              }}>
                {photoStats.meals}/{nextMealLevel.photos} meals
              </div>
              
              {/* Progress bar */}
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                height: '8px',
                overflow: 'hidden',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: `${Math.min(100, mealProgress)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                  borderRadius: '8px',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }} />
              </div>
              
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ChevronRight size={14} />
                Nog {nextMealLevel.photos - photoStats.meals} tot {nextMealLevel.level}
              </div>
            </div>
          </div>

          {/* Action Badges Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1.25rem' : '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)'
          }}>
            {/* Decorative element */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              animation: 'float 5s ease-in-out infinite'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '1rem'
              }}>
                Action Badges
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem'
              }}>
                {ACTION_BADGES.slice(0, 4).map((badge) => {
                  const BadgeIcon = badge.icon
                  return (
                    <div key={badge.type} style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '10px',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <BadgeIcon size={16} color="white" />
                      <div style={{
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {photoStats.actions}/{badge.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div style={{
                marginTop: '0.75rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Upload size={14} />
                Upload action foto's voor badges
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPhotoCard = (photo, index) => {
    const isSelected = selectedPhotos.find(p => p.id === photo.id)
    
    return (
      <div
        key={photo.id || index}
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: compareMode ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          border: isSelected ? `3px solid ${THEME.primary}` : 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
        onClick={() => handleCompareSelect(photo)}
        onMouseEnter={(e) => {
          if (!compareMode) {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <img
          src={photo.signedUrl || photo.photo_url}
          alt={`Progress ${index + 1}`}
          style={{
            width: '100%',
            height: viewMode === 'grid' ? '200px' : '300px',
            objectFit: 'cover'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          padding: '1rem',
          color: '#fff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                opacity: 0.8,
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Calendar size={12} />
                {new Date(photo.date_taken).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              {photo.metadata?.weight && (
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {photo.metadata.weight} kg
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {photo.photo_type === 'meal' && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Utensils size={12} />
                  Meal
                </div>
              )}
              {photo.photo_type === 'action' && (
                <div style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Dumbbell size={12} />
                  Action
                </div>
              )}
              {photo.is_private && <Lock size={16} />}
            </div>
          </div>
        </div>

        {compareMode && isSelected && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: THEME.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)'
          }}>
            <Check size={18} color="#fff" />
          </div>
        )}
      </div>
    )
  }

  const renderUploadModal = () => {
    if (!showUpload) return null

    const MilestoneIcon = selectedMilestone?.icon

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: THEME.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
            }}>
              {selectedMilestone ? (
                <MilestoneIcon size={24} color="#fff" />
              ) : (
                <Camera size={24} color="#fff" />
              )}
            </div>
            {selectedMilestone ? `${selectedMilestone.label} Foto` : 'Foto toevoegen'}
          </h2>

          {!uploadPreview ? (
            <div>
              <label
                htmlFor="photo-upload"
                style={{
                  display: 'block',
                  padding: '3rem',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.05))',
                  border: `2px dashed ${THEME.border}`,
                  borderRadius: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.1))'
                  e.currentTarget.style.borderColor = THEME.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.05))'
                  e.currentTarget.style.borderColor = THEME.border
                }}
              >
                <Upload size={48} color={THEME.primary} style={{ marginBottom: '1rem' }} />
                <div style={{
                  fontSize: '1.1rem',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  Klik om foto te selecteren
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  of sleep een bestand hierheen
                </div>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              <img
                src={uploadPreview.preview}
                alt="Upload preview"
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  marginBottom: '1.5rem'
                }}
              />

              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem'
              }}>
                {selectedMilestone ? 'Upload deze milestone foto:' : 'Selecteer foto type:'}
              </div>

              {selectedMilestone ? (
                <button
                  onClick={() => handleUpload('progress', selectedMilestone.week)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: `linear-gradient(135deg, ${selectedMilestone.color}, ${selectedMilestone.color}80)`,
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: `0 10px 25px ${selectedMilestone.color}40`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 15px 35px ${selectedMilestone.color}50`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 10px 25px ${selectedMilestone.color}40`
                  }}
                >
                  <MilestoneIcon size={20} />
                  Upload {selectedMilestone.label} - {selectedMilestone.badge}
                </button>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  {[
                    { type: 'progress', label: 'Progress', icon: Camera },
                    { type: 'meal', label: 'Maaltijd', icon: Utensils },
                    { type: 'action', label: 'Actie', icon: Dumbbell }
                  ].map(option => {
                    const OptionIcon = option.icon
                    return (
                      <button
                        key={option.type}
                        onClick={() => handleUpload(option.type)}
                        style={{
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = THEME.lightGradient
                          e.currentTarget.style.borderColor = THEME.primary
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <OptionIcon size={24} color={THEME.primary} style={{ marginBottom: '0.5rem' }} />
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#fff'
                        }}>
                          {option.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  setUploadPreview(null)
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Andere foto kiezen
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setShowUpload(false)
              setUploadPreview(null)
              setSelectedMilestone(null)
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
      </div>
    )
  }

  const renderComparisonView = () => {
    if (selectedPhotos.length !== 2) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: THEME.lightGradient,
          borderRadius: '20px',
          border: `1px solid ${THEME.border}`
        }}>
          <Eye size={48} color={THEME.primary} style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '1.1rem',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            Selecteer 2 foto's om te vergelijken
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Klik op foto's om ze te selecteren
          </div>
        </div>
      )
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '1rem'
      }}>
        {selectedPhotos.map((photo, index) => (
          <div key={index}>
            <div style={{
              background: index === 0 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
              borderRadius: '12px',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: index === 0 ? '#ef4444' : '#10b981',
              border: `1px solid ${index === 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {index === 0 ? 'Voor' : 'Na'}
            </div>
            <img
              src={photo.signedUrl || photo.photo_url}
              alt={index === 0 ? 'Before' : 'After'}
              style={{
                width: '100%',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{
              marginTop: '0.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={14} />
              {new Date(photo.date_taken).toLocaleDateString('nl-NL')}
              {photo.metadata?.weight && ` • ${photo.metadata.weight} kg`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: `3px solid ${THEME.border}`,
          borderTopColor: THEME.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div>
      {/* View Mode Tabs - Premium Style */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: `1px solid ${THEME.border}`,
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'milestones', label: 'Journey', icon: Trophy },
          { id: 'grid', label: 'Gallery', icon: Grid },
          { id: 'compare', label: 'Compare', icon: Eye }
        ].map(view => {
          const ViewIcon = view.icon
          return (
            <button
              key={view.id}
              onClick={() => {
                setViewMode(view.id)
                if (view.id === 'compare') {
                  setCompareMode(true)
                  setSelectedPhotos([])
                } else {
                  setCompareMode(false)
                  setSelectedPhotos([])
                }
              }}
              style={{
                padding: '0.75rem 1.25rem',
                background: viewMode === view.id ? THEME.gradient : 'transparent',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                color: viewMode === view.id ? 'white' : '#94a3b8',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: viewMode === view.id ? '600' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ViewIcon size={16} />
              {view.label}
            </button>
          )
        })}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'milestones' && renderMilestoneView()}
      
      {viewMode === 'grid' && (
        <>
          {/* Photo Type Filter */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {['all', 'progress', 'meal', 'action'].map(type => (
              <button
                key={type}
                onClick={() => setPhotoType(type)}
                style={{
                  padding: '0.5rem 1rem',
                  background: photoType === type ? THEME.gradient : 'rgba(255, 255, 255, 0.05)',
                  border: photoType === type ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: photoType === type ? '600' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'capitalize'
                }}
              >
                {type === 'all' ? 'Alle' : type}
              </button>
            ))}
          </div>

          {photos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: THEME.lightGradient,
              borderRadius: '20px',
              border: `1px solid ${THEME.border}`
            }}>
              <Camera size={64} color={THEME.primary} style={{ marginBottom: '1rem' }} />
              <h3 style={{
                fontSize: '1.2rem',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Nog geen foto's
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem'
              }}>
                Begin met het vastleggen van je transformatie!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {photos.map((photo, index) => renderPhotoCard(photo, index))}
            </div>
          )}
        </>
      )}
      
      {viewMode === 'compare' && renderComparisonView()}

      {/* Floating Add Button - Premium Style */}
      <button
        onClick={() => setShowUpload(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '90px' : '2rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: THEME.gradient,
          border: 'none',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(236, 72, 153, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(236, 72, 153, 0.4)'
        }}
      >
        <Plus size={24} color="#fff" />
      </button>

      {/* Upload Modal */}
      {renderUploadModal()}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
