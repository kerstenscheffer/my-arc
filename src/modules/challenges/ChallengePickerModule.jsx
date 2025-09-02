import { useState, useEffect } from 'react'
import { Star, Calendar, Award, ChevronRight, Loader } from 'lucide-react'
import ChallengeService from '../../services/ChallengeService'

const THEME = {
  primary: '#dc2626',
  gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(127, 29, 29, 0.08) 100%)',
  border: 'rgba(220, 38, 38, 0.2)'
}

export default function ChallengePickerModule({ onChallengeSelect }) {
  const [availableChallenges, setAvailableChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const isMobile = window.innerWidth <= 768

  // Load challenges on mount
  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      setLoading(true)
      const templates = await ChallengeService.getChallengeTemplates()
      
      // Transform templates to challenge format
      const challenges = templates.map(template => ({
        id: template.id,
        title: template.template_name,
        description: template.description || 'Challenge beschrijving komt binnenkort',
        category: template.category,
        difficulty: template.difficulty,
        duration_weeks: template.duration_weeks,
        icon: getCategoryIcon(template.category),
        points: 100, // Default points
        rules: template.rules ? JSON.parse(template.rules) : [],
        success_criteria: template.success_criteria ? JSON.parse(template.success_criteria) : {}
      }))
      
      setAvailableChallenges(challenges)
    } catch (error) {
      console.error('❌ Failed to load challenges:', error)
      setAvailableChallenges([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      fitness: '💪',
      nutrition: '🥗',
      mindset: '🧠',
      hybrid: '⚡',
      default: '🏆'
    }
    return icons[category] || icons.default
  }

  const categories = [
    { id: 'all', label: 'Alle', icon: '🎯' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'nutrition', label: 'Voeding', icon: '🥗' },
    { id: 'mindset', label: 'Mindset', icon: '🧠' },
    { id: 'hybrid', label: 'Hybrid', icon: '⚡' }
  ]

  const filteredChallenges = selectedCategory === 'all' 
    ? availableChallenges 
    : availableChallenges.filter(c => c.category === selectedCategory)

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#10b981'
    }
  }

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Beginner'
      case 'medium': return 'Gevorderd'
      case 'hard': return 'Expert'
      default: return 'Beginner'
    }
  }

  const renderCategoryFilter = () => {
    return (
      <div style={{
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '300px',
            padding: isMobile ? '0.75rem 2.5rem 0.75rem 1rem' : '0.85rem 3rem 0.85rem 1.25rem',
            background: '#111',
            border: `1px solid ${THEME.border}`,
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `right ${isMobile ? '0.75rem' : '1rem'} center`,
            backgroundSize: '20px',
            minHeight: '44px',
            touchAction: 'manipulation'
          }}
        >
          {categories.map(cat => (
            <option 
              key={cat.id} 
              value={cat.id}
              style={{
                background: '#111',
                color: '#fff',
                padding: '0.5rem'
              }}
            >
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        
        {/* Selected Category Indicator */}
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem 1rem',
          background: THEME.lightGradient,
          border: `1px solid ${THEME.border}`,
          borderRadius: '10px',
          display: 'inline-block'
        }}>
          <span style={{
            color: THEME.primary,
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            {categories.find(c => c.id === selectedCategory)?.icon} {' '}
            {categories.find(c => c.id === selectedCategory)?.label} Challenges ({filteredChallenges.length})
          </span>
        </div>
      </div>
    )
  }

  const renderChallengeCard = (challenge) => {
    return (
      <div key={challenge.id} style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'translateZ(0)',
        position: 'relative',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '140px'
      }}
      onClick={() => onChallengeSelect && onChallengeSelect(challenge)}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.lightGradient} 0%, rgba(0,0,0,0.6) 100%)`
          e.currentTarget.style.borderColor = THEME.border
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.background = `linear-gradient(135deg, ${THEME.lightGradient} 0%, rgba(0,0,0,0.6) 100%)`
          e.currentTarget.style.borderColor = THEME.border
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
        }
      }}>
        
        {/* Difficulty Badge */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.25rem 0.75rem',
          background: getDifficultyColor(challenge.difficulty),
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#000'
        }}>
          {getDifficultyLabel(challenge.difficulty)}
        </div>

        <div style={{ marginBottom: '0.75rem', paddingRight: '80px' }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem',
            lineHeight: 1.2
          }}>
            {challenge.icon} {challenge.title}
          </h3>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {challenge.description}
          </p>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '500'
            }}>
              <Calendar size={14} />
              {challenge.duration_weeks} weken
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: '500'
            }}>
              <Award size={14} />
              {challenge.points} pts
            </span>
          </div>
          <ChevronRight 
            size={16} 
            color={THEME.primary} 
            style={{
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div id="challenge-picker">
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Star size={24} color={THEME.primary} />
          Beschikbare Challenges
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem',
          background: THEME.lightGradient,
          borderRadius: '20px',
          border: `1px solid ${THEME.border}`
        }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <Loader 
              size={40} 
              color={THEME.primary} 
              style={{
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}
            />
            <p style={{ fontSize: '1rem', margin: 0 }}>
              Challenges laden...
            </p>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="challenge-picker">
      <h2 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Star size={24} color={THEME.primary} />
        Beschikbare Challenges
      </h2>

      {renderCategoryFilter()}

      {filteredChallenges.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: THEME.lightGradient,
          borderRadius: '20px',
          border: `1px solid ${THEME.border}`,
          color: 'rgba(255,255,255,0.6)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Geen challenges beschikbaar
          </h3>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            {selectedCategory === 'all' 
              ? 'Er zijn momenteel geen challenges beschikbaar'
              : `Geen challenges in categorie "${categories.find(c => c.id === selectedCategory)?.label}"`
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))'
        }}>
          {filteredChallenges.map((challenge) => renderChallengeCard(challenge))}
        </div>
      )}
    </div>
  )
}
