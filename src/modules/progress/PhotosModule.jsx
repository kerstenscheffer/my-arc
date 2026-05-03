// src/modules/progress/PhotosModule.jsx
import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Camera, Plus, Calendar, Lock,
  ChevronLeft, ChevronRight, Grid, List, Upload,
  Image, Trash2, Eye, EyeOff, Check, X, Star,
  Trophy, TrendingUp, Award, Zap, CheckCircle,
  Rocket, Sparkles, Flame, Crown, Target, Shield,
  ChefHat, Home, Utensils, Palette, Activity,
  Heart, Mountain, User, Coffee, Dumbbell, ChevronDown
} from 'lucide-react'

const THEME = {
  primary: '#ec4899',
  secondary: '#a855f7',
  gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
  border: 'rgba(236, 72, 153, 0.2)'
}

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

// ── PHOTO POSE OPTIONS ──
const POSE_OPTIONS = [
  { value: 'front', label: 'Voorkant', sublabel: 'Front' },
  { value: 'side', label: 'Zijkant', sublabel: 'Side' },
  { value: 'back', label: 'Achterkant', sublabel: 'Back' }
]

// ── NUMBER PICKER (zelfde als ExerciseLogModal) ──
function NumberPicker({ value, onChange, min = 0, max = 300, step = 1, unit = 'kg', onConfirm, halfStep = null }) {
  const isMobile = window.innerWidth <= 768
  const scrollRef = useRef(null)
  const [localValue, setLocalValue] = useState(value)

  const options = []
  for (let i = min; i <= max; i += step) options.push(Math.round(i * 10) / 10)

  useEffect(() => {
    if (scrollRef.current) {
      const closest = options.reduce((prev, curr) =>
        Math.abs(curr - localValue) < Math.abs(prev - localValue) ? curr : prev, options[0])
      const index = options.indexOf(closest)
      if (index >= 0) {
        const itemHeight = 48
        scrollRef.current.scrollTop = index * itemHeight - (scrollRef.current.clientHeight / 2) + (itemHeight / 2)
      }
    }
  }, [])

  const handleSelect = (val) => {
    const clamped = Math.max(min, Math.min(max, Math.round(val * 10) / 10))
    setLocalValue(clamped)
    onChange(clamped)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const displayValue = localValue % 1 === 0 ? localValue.toString() : localValue.toFixed(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', fontWeight: '900', color: '#FFD700', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {displayValue}<span style={{ fontSize: '0.4em', color: 'rgba(255,215,0,0.4)', marginLeft: '0.25rem' }}>{unit}</span>
      </div>

      <div ref={scrollRef} style={{ width: '100%', height: isMobile ? '200px' : '240px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {options.map((opt) => (
          <div
            key={opt}
            onClick={() => handleSelect(opt)}
            style={{
              height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: opt === localValue ? (isMobile ? '1.3rem' : '1.5rem') : (isMobile ? '0.9rem' : '1rem'),
              fontWeight: opt === localValue ? '800' : '600',
              color: opt === localValue ? '#FFD700' : 'rgba(255,255,255,0.25)',
              cursor: 'pointer', transition: 'all 0.15s ease',
              background: opt === localValue ? 'rgba(255,215,0,0.06)' : 'transparent',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
          >
            {opt} {unit}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <AdjustBtn label={`-${step * 5}`} onClick={() => handleSelect(localValue - step * 5)} isMobile={isMobile} />
        <AdjustBtn label={`-${step}`} onClick={() => handleSelect(localValue - step)} isMobile={isMobile} />
        {halfStep && <AdjustBtn label={`-${halfStep}`} onClick={() => handleSelect(localValue - halfStep)} isMobile={isMobile} half />}
        {halfStep && <AdjustBtn label={`+${halfStep}`} onClick={() => handleSelect(localValue + halfStep)} isMobile={isMobile} half positive />}
        <AdjustBtn label={`+${step}`} onClick={() => handleSelect(localValue + step)} isMobile={isMobile} positive />
        <AdjustBtn label={`+${step * 5}`} onClick={() => handleSelect(localValue + step * 5)} isMobile={isMobile} positive />
      </div>

      <button
        onClick={onConfirm}
        style={{
          width: '100%', padding: isMobile ? '0.875rem' : '1rem',
          background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: '10px', color: '#FFD700',
          fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          cursor: 'pointer', minHeight: '48px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}
      >
        Bevestigen
      </button>
    </div>
  )
}

function AdjustBtn({ label, onClick, isMobile, positive, half }) {
  return (
    <button onClick={onClick} style={{
      padding: isMobile ? '0.4rem 0.6rem' : '0.45rem 0.7rem',
      background: half ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${half ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '8px',
      color: positive ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.35)',
      fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '700',
      cursor: 'pointer', minHeight: '34px',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
    }}>
      {label}
    </button>
  )
}

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

  // Upload flow state
  const [uploadStep, setUploadStep] = useState('pose') // 'pose' | 'weight'
  const [selectedPose, setSelectedPose] = useState(null)
  const [uploadWeight, setUploadWeight] = useState(75)
  const [weightConfirmed, setWeightConfirmed] = useState(false)

  const isMobile = useIsMobile()

  useEffect(() => {
    loadPhotos()
    loadCoachTransformation()
    loadPhotoStats()
  }, [client?.id, photoType])

  const getLocalPhotos = (clientId, type = null) => {
    try {
      const allPhotos = JSON.parse(localStorage.getItem('progress_photos') || '[]')
      let photos = allPhotos.filter(p => p.client_id === clientId)
      if (type) photos = photos.filter(p => p.photo_type === type)
      if (photos.length === 0) return []
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
      const photoData = getLocalPhotos(client.id, photoType === 'all' ? null : photoType)
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
      const allPhotos = getLocalPhotos(client.id)
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
        setUploadPreview({ file, preview: reader.result })
        setUploadStep('pose')
        setSelectedPose(null)
        setWeightConfirmed(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadPreview?.file || !client?.id || !selectedPose) return
    try {
      saveLocalPhoto(client.id, uploadPreview.file, 'progress', {
        milestone_week: selectedMilestone?.week || null,
        pose: selectedPose,
        weight: weightConfirmed ? uploadWeight : null
      })
      resetUploadState()
      await loadPhotos()
      await loadPhotoStats()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Er ging iets mis bij het uploaden')
    }
  }

  const resetUploadState = () => {
    setShowUpload(false)
    setUploadPreview(null)
    setSelectedMilestone(null)
    setUploadStep('pose')
    setSelectedPose(null)
    setWeightConfirmed(false)
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

  // ── UPLOAD MODAL ──
  const renderUploadModal = () => {
    if (!showUpload) return null
    const MilestoneIcon = selectedMilestone?.icon

    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.98)', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        {/* Gouden top streep */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.5) 50%, transparent 100%)', zIndex: 1 }} />

        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {!uploadPreview ? 'FOTO SELECTEREN' : uploadStep === 'pose' ? 'STAP 1/2 — POSITIE' : 'STAP 2/2 — GEWICHT'}
          </div>
          <button
            onClick={resetUploadState}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
              color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '600', cursor: 'pointer', padding: '0.35rem 0.75rem', touchAction: 'manipulation'
            }}
          >
            Annuleren
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem'
        }}>

          {/* STAP 0: Foto selecteren */}
          {!uploadPreview && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 1.5rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>
                {selectedMilestone ? `${selectedMilestone.label} Foto` : 'Foto toevoegen'}
              </h3>
              <label
                htmlFor="photo-upload"
                style={{
                  display: 'block', padding: '3rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: '16px', textAlign: 'center', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Upload size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontWeight: '700' }}>
                  Klik om foto te selecteren
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                  of sleep een bestand hierheen
                </div>
              </label>
              <input id="photo-upload" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </div>
          )}

          {/* STAP 1: Pose kiezen */}
          {uploadPreview && uploadStep === 'pose' && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>
                Welke positie?
              </h3>
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500', textAlign: 'center', margin: '0 0 1.5rem 0' }}>
                Kies de positie van deze foto
              </p>

              {/* Preview thumbnail */}
              <img
                src={uploadPreview.preview}
                alt="Preview"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1.5rem', opacity: 0.8 }}
              />

              {/* Pose buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {POSE_OPTIONS.map(pose => (
                  <button
                    key={pose.value}
                    onClick={() => setSelectedPose(pose.value)}
                    style={{
                      width: '100%', padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                      background: selectedPose === pose.value ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedPose === pose.value ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: selectedPose === pose.value ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <User size={18} color={selectedPose === pose.value ? '#FFD700' : 'rgba(255,255,255,0.3)'} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', color: selectedPose === pose.value ? '#FFD700' : '#fff' }}>
                          {pose.label}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '600', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {pose.sublabel}
                        </div>
                      </div>
                    </div>
                    {selectedPose === pose.value && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} color="#FFD700" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => selectedPose && setUploadStep('weight')}
                disabled={!selectedPose}
                style={{
                  width: '100%', padding: isMobile ? '0.875rem' : '1rem',
                  background: selectedPose ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedPose ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '10px',
                  color: selectedPose ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: selectedPose ? 'pointer' : 'not-allowed', minHeight: '48px',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                Volgende →
              </button>
            </div>
          )}

          {/* STAP 2: Gewicht loggen */}
          {uploadPreview && uploadStep === 'weight' && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', textAlign: 'center' }}>
                Huidig gewicht?
              </h3>
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500', textAlign: 'center', margin: '0 0 1.5rem 0' }}>
                Optioneel — sla over als je niet wilt invullen
              </p>

              <NumberPicker
                value={uploadWeight}
                onChange={setUploadWeight}
                min={30}
                max={200}
                step={1}
                unit="kg"
                halfStep={0.5}
                onConfirm={() => {
                  setWeightConfirmed(true)
                  handleUpload()
                }}
              />

              <button
                onClick={() => {
                  setWeightConfirmed(false)
                  handleUpload()
                }}
                style={{
                  width: '100%', marginTop: '0.75rem', padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', color: 'rgba(255,255,255,0.3)',
                  fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: '600',
                  cursor: 'pointer', minHeight: '44px',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                }}
              >
                Overslaan — foto opslaan zonder gewicht
              </button>

              <button
                onClick={() => setUploadStep('pose')}
                style={{
                  width: '100%', marginTop: '0.375rem', padding: isMobile ? '0.5rem' : '0.625rem',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.72rem' : '0.77rem', fontWeight: '600',
                  cursor: 'pointer', touchAction: 'manipulation'
                }}
              >
                ← Terug
              </button>
            </div>
          )}
        </div>

        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      </div>,
      document.body
    )
  }

  const renderMilestoneView = () => {
    const currentMealLevel = getCurrentMealLevel()
    const nextMealLevel = getNextMealLevel()
    const mealProgress = ((photoStats.meals - currentMealLevel.photos) / (nextMealLevel.photos - currentMealLevel.photos)) * 100
    const MealIcon = currentMealLevel.icon

    return (
      <div>
        {/* Header */}
        <div style={{
          background: THEME.gradient,
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Camera size={isMobile ? 28 : 36} />
              Journey Milestones
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: isMobile ? '0.75rem' : '1rem', marginTop: '1rem' }}>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', color: 'rgba(255,255,255,0.95)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                Volgende milestone
              </div>
              <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(nextMilestone.icon, { size: 24, color: 'white' })}
                </div>
                <span>{daysToNext} dagen — {nextMilestone.badge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Inspiratie */}
        {coachTransformation && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
            borderRadius: isMobile ? '16px' : '20px', padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: isMobile ? '1.5rem' : '2rem', border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.75rem' : '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={isMobile ? 24 : 28} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Coach Transformatie</div>
                <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', color: 'white', fontWeight: '600' }}>{coachTransformation.story}</div>
              </div>
              <Zap size={isMobile ? 20 : 24} style={{ color: '#fbbf24' }} />
            </div>
          </div>
        )}

        {/* Milestone Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          {MILESTONES.map((milestone, index) => {
            const MilestoneIcon = milestone.icon
            const hasPhoto = photos.some(p => p.metadata?.milestone_week === milestone.week)
            const isLocked = milestone.week > currentWeek
            const isCurrent = milestone.week <= currentWeek && milestone.week + 1 > currentWeek

            return (
              <button
                key={milestone.week}
                onClick={() => { if (!isLocked) { setSelectedMilestone(milestone); setShowUpload(true) } }}
                style={{
                  background: hasPhoto ? `linear-gradient(135deg, ${milestone.color}30, ${milestone.color}15)` : isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
                  border: isCurrent ? `2px solid ${milestone.color}` : hasPhoto ? `1px solid ${milestone.color}40` : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '1rem' : '1.25rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1,
                  transition: 'all 0.2s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  minHeight: '140px', position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: '14px', background: isLocked ? 'rgba(100, 116, 139, 0.2)' : `${milestone.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    {isLocked ? <Lock size={isMobile ? 24 : 28} style={{ color: '#64748b' }} /> : hasPhoto ? <CheckCircle size={isMobile ? 24 : 28} style={{ color: milestone.color }} /> : <MilestoneIcon size={isMobile ? 24 : 28} style={{ color: milestone.color }} />}
                  </div>
                  <div style={{ fontSize: isMobile ? '0.875rem' : '0.95rem', fontWeight: '700', color: hasPhoto ? milestone.color : '#fff', marginBottom: '0.25rem' }}>{milestone.label}</div>
                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>{milestone.badge}</div>
                  {hasPhoto && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}><Star size={16} style={{ color: '#fbbf24', fill: '#fbbf24' }} /></div>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          {/* Meal Level */}
          <div style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)', borderRadius: isMobile ? '16px' : '20px', padding: isMobile ? '1.25rem' : '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 'bold', color: 'white' }}>Meal Journey</div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'white', fontWeight: '600' }}>Level {MEAL_LEVELS.indexOf(currentMealLevel) + 1}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MealIcon size={20} color="white" />
              </div>
              <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', color: 'white', fontWeight: '600' }}>{currentMealLevel.level}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ width: `${Math.min(100, mealProgress)}%`, height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChevronRight size={14} />
              Nog {nextMealLevel.photos - photoStats.meals} tot {nextMealLevel.level}
            </div>
          </div>

          {/* Action Badges */}
          <div style={{ background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)', borderRadius: isMobile ? '16px' : '20px', padding: isMobile ? '1.25rem' : '1.5rem', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
            <div style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Action Badges</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {ACTION_BADGES.slice(0, 4).map((badge) => {
                const BadgeIcon = badge.icon
                return (
                  <div key={badge.type} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BadgeIcon size={16} color="white" />
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'white', fontWeight: '600' }}>{photoStats.actions}/{badge.count}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={14} />
              Upload action foto's voor badges
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPhotoCard = (photo, index) => {
    const isSelected = selectedPhotos.find(p => p.id === photo.id)
    const poseLabel = POSE_OPTIONS.find(p => p.value === photo.metadata?.pose)?.label

    return (
      <div
        key={photo.id || index}
        style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: compareMode ? 'pointer' : 'default', border: isSelected ? `3px solid ${THEME.primary}` : 'none' }}
        onClick={() => handleCompareSelect(photo)}
      >
        <img
          src={photo.signedUrl || photo.photo_url}
          alt={`Progress ${index + 1}`}
          style={{ width: '100%', height: viewMode === 'grid' ? '200px' : '300px', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '1rem', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {poseLabel && (
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,215,0,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  {poseLabel}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={12} />
                {new Date(photo.date_taken).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {photo.metadata?.weight && (
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFD700' }}>{photo.metadata.weight} kg</div>
              )}
            </div>
          </div>
        </div>
        {compareMode && isSelected && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '32px', height: '32px', borderRadius: '50%', background: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={18} color="#fff" />
          </div>
        )}
      </div>
    )
  }

  const renderComparisonView = () => {
    if (selectedPhotos.length !== 2) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', background: THEME.lightGradient, borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
          <Eye size={48} color={THEME.primary} style={{ marginBottom: '1rem' }} />
          <div style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>Selecteer 2 foto's om te vergelijken</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>Klik op foto's om ze te selecteren</div>
        </div>
      )
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        {selectedPhotos.map((photo, index) => (
          <div key={index}>
            <div style={{ background: index === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '0.5rem', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: index === 0 ? '#ef4444' : '#10b981', border: `1px solid ${index === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
              {index === 0 ? 'Voor' : 'Na'}
            </div>
            <img src={photo.signedUrl || photo.photo_url} alt={index === 0 ? 'Before' : 'After'} style={{ width: '100%', borderRadius: '12px' }} />
            <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Calendar size={14} />
              {new Date(photo.date_taken).toLocaleDateString('nl-NL')}
              {photo.metadata?.weight && ` · ${photo.metadata.weight} kg`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ width: '50px', height: '50px', border: `3px solid ${THEME.border}`, borderTopColor: THEME.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '0.5rem' }}>
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
                if (view.id === 'compare') { setCompareMode(true); setSelectedPhotos([]) }
                else { setCompareMode(false); setSelectedPhotos([]) }
              }}
              style={{
                padding: '0.75rem 1.25rem',
                background: viewMode === view.id ? THEME.gradient : 'transparent',
                border: 'none', borderRadius: '8px 8px 0 0',
                color: viewMode === view.id ? 'white' : '#94a3b8',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: viewMode === view.id ? '600' : 'normal',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              <ViewIcon size={16} />
              {view.label}
            </button>
          )
        })}
      </div>

      {viewMode === 'milestones' && renderMilestoneView()}

      {viewMode === 'grid' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['all', 'progress', 'meal', 'action'].map(type => (
              <button key={type} onClick={() => setPhotoType(type)} style={{ padding: '0.5rem 1rem', background: photoType === type ? THEME.gradient : 'rgba(255, 255, 255, 0.05)', border: photoType === type ? 'none' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: photoType === type ? '600' : 'normal', cursor: 'pointer', touchAction: 'manipulation' }}>
                {type === 'all' ? 'Alle' : type}
              </button>
            ))}
          </div>
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: THEME.lightGradient, borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
              <Camera size={64} color={THEME.primary} style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Nog geen foto's</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem' }}>Begin met het vastleggen van je transformatie!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
              {photos.map((photo, index) => renderPhotoCard(photo, index))}
            </div>
          )}
        </>
      )}

      {viewMode === 'compare' && renderComparisonView()}

      {/* Floating Add Button */}
      <button
        onClick={() => { setSelectedMilestone(null); setShowUpload(true) }}
        style={{
          position: 'fixed', bottom: isMobile ? '90px' : '2rem', right: '1.5rem',
          width: '56px', height: '56px', borderRadius: '50%',
          background: THEME.gradient, border: 'none',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}
      >
        <Plus size={24} color="#fff" />
      </button>

      {renderUploadModal()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
