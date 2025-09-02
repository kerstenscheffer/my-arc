import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Weight, Activity, Heart, Camera, Trophy,
  BarChart3, Ruler, ChevronRight, ArrowLeft, Plus, Target
} from 'lucide-react'

import WeightModule from './weight-v2/WeightDashboard'
import WorkoutLogModule from './workout/WorkoutLogModule'
import NutritionModule from "./NutritionModule"
import PhotosModule from "./PhotosModule"
import ClientChallenges from "../../modules/challenges/ClientChallenges"
import OverviewTab from './overview/OverviewTab'
import GoalsManager from '../../modules/goals/GoalsManager'

// Module themes - FIXED KLEUREN volgens MY ARC documentatie
const MODULE_THEMES = {
  overview: {
    primary: '#f59e0b',  // Mooi oker geel
    primaryDark: '#d97706', 
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
    borderColor: 'rgba(245, 158, 11, 0.1)',
    borderActive: 'rgba(245, 158, 11, 0.2)',
    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.25)',
    glow: '0 0 60px rgba(245, 158, 11, 0.1)',
    icon: TrendingUp
  },
  weight: {
    primary: '#3b82f6',  // Blauw
    primaryDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
    borderColor: 'rgba(59, 130, 246, 0.1)',
    borderActive: 'rgba(59, 130, 246, 0.2)',
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
    glow: '0 0 60px rgba(59, 130, 246, 0.1)',
    icon: Weight
  },
  workouts: {
    primary: '#f97316',  // Oranje
    primaryDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.08) 100%)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderActive: 'rgba(249, 115, 22, 0.2)',
    boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)',
    glow: '0 0 60px rgba(249, 115, 22, 0.1)',
    icon: Activity
  },
  nutrition: {
    primary: '#10b981',  // Groen
    primaryDark: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
    borderActive: 'rgba(16, 185, 129, 0.2)',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)',
    glow: '0 0 60px rgba(16, 185, 129, 0.1)',
    icon: Heart
  },
  photos: {
    primary: '#ec4899',  // Paars
    primaryDark: '#db2777',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.08) 100%)',
    borderColor: 'rgba(236, 72, 153, 0.1)',
    borderActive: 'rgba(236, 72, 153, 0.2)',
    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.25)',
    glow: '0 0 60px rgba(236, 72, 153, 0.1)',
    icon: Camera
  },
  challenges: {
    primary: '#ef4444',  // ROOD (was geel #f59e0b)
    primaryDark: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
    borderColor: 'rgba(239, 68, 68, 0.1)', 
    borderActive: 'rgba(239, 68, 68, 0.2)',
    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25)',
    glow: '0 0 60px rgba(239, 68, 68, 0.1)',
    icon: Trophy
  },
  goals: {
    primary: '#a855f7',  // PAARS (was cyaan #06b6d4)
    primaryDark: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ffffff 100%)', // PAARS-WIT GRADIENT
    lightGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
    borderColor: 'rgba(168, 85, 247, 0.1)',
    borderActive: 'rgba(168, 85, 247, 0.2)',
    boxShadow: '0 10px 25px rgba(168, 85, 247, 0.25)',
    glow: '0 0 60px rgba(168, 85, 247, 0.1)',
    icon: Target
  }
}

export default function ProgressRouter({ client, db, onNavigate }) {
  const [activeModule, setActiveModule] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [stats, setStats] = useState({
    weight: 0,
    workouts: 0,
    meals: 0,
    streak: 0,
    activeChallenge: null,
    totalChallenges: 0
  })
  
  // Verbeterde mobile detection - minder restrictief
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (db && client?.id) {
      loadStats()
    }
  }, [db, client])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileMenu && !event.target.closest('[data-mobile-menu]')) {
        setShowMobileMenu(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMobileMenu])

  const loadStats = async () => {
    if (!client?.id) {
      console.warn('No client ID available for loading stats')
      return
    }

    setLoading(true)
    try {
      // Safe loading with fallbacks
      const [weightData, workoutCount, mealProgress] = await Promise.allSettled([
        db.getLatestWeight?.(client.id),
        db.getWeeklyWorkoutCount?.(client.id),
        db.getTodayMealProgress?.(client.id)
      ])

      setStats({
        weight: weightData.status === 'fulfilled' ? (weightData.value?.weight || 0) : 0,
        workouts: workoutCount.status === 'fulfilled' ? (workoutCount.value || 0) : 0,
        meals: mealProgress.status === 'fulfilled' ? (mealProgress.value?.compliance || 0) : 0,
        streak: 0,
        activeChallenge: null,
        totalChallenges: 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Keep default stats on error
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    { id: 'overview', label: 'Overview', Icon: TrendingUp, theme: MODULE_THEMES.overview },
    { id: 'weight', label: 'Gewicht', Icon: Weight, theme: MODULE_THEMES.weight },
    { id: 'workouts', label: 'Workouts', Icon: Activity, theme: MODULE_THEMES.workouts },
    { id: 'nutrition', label: 'Voeding', Icon: Heart, theme: MODULE_THEMES.nutrition },
    { id: 'photos', label: 'Foto\'s', Icon: Camera, theme: MODULE_THEMES.photos },
    { id: 'challenges', label: 'Challenges', Icon: Trophy, theme: MODULE_THEMES.challenges },
    { id: 'goals', label: 'Doelen', Icon: Target, theme: MODULE_THEMES.goals }
  ]

  const renderContent = () => {
    const commonProps = { client, db }
    
    switch (activeModule) {
      case 'overview':
        return <OverviewTab {...commonProps} stats={stats} onNavigate={setActiveModule} />
      case 'weight':
        return <WeightModule {...commonProps} />
      case 'workouts':
        return <WorkoutLogModule {...commonProps} />
      case 'nutrition':
        return <NutritionModule {...commonProps} />
      case 'photos':
        return <PhotosModule {...commonProps} />
      case 'challenges':
        return <ClientChallenges {...commonProps} />
      case 'goals':
        return <GoalsManager {...commonProps} />
      default:
        return <OverviewTab {...commonProps} stats={stats} onNavigate={setActiveModule} />
    }
  }

  const currentTheme = MODULE_THEMES[activeModule] || MODULE_THEMES.overview

  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',  // Minder restrictieve padding
      maxWidth: '100%',
      width: '100%',
      margin: '0 auto',
      minHeight: 'calc(100vh - 3rem)',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      position: 'relative'
    }}>
      {/* Floating background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: isMobile ? '200px' : '300px',  // Responsive achtergrond
        height: isMobile ? '200px' : '300px',
        background: `radial-gradient(circle, ${currentTheme.primary}15 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        zIndex: -1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: isMobile ? '150px' : '250px',
        height: isMobile ? '150px' : '250px',
        background: `radial-gradient(circle, ${currentTheme.primary}10 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'float 12s ease-in-out infinite reverse',
        zIndex: -1
      }} />

      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '2rem' : '3rem',  // Responsive spacing
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: isMobile ? '2rem' : '2.5rem',  // Responsive maar niet te klein
          fontWeight: '900',
          backgroundImage: currentTheme.gradient,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          animation: 'gradientShift 8s ease-in-out infinite',
          lineHeight: 1.1
        }}>
          Progress Tracking
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: isMobile ? '1rem' : '1.1rem',  // Minder dramatische verkleining
          fontWeight: '500',
          margin: 0
        }}>
          Track your transformation journey
        </p>
      </div>

        {/* Mobile Menu Button + Desktop Tabs */}
        {isMobile ? (
          <div style={{ position: 'relative', marginBottom: '1.5rem' }} data-mobile-menu>
            {/* Premium Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '1rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                borderRadius: '16px',
                border: `1px solid ${currentTheme.borderActive}`,
                cursor: 'pointer',
                background: currentTheme.gradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: '#fff',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: currentTheme.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: currentTheme.boxShadow
                }}>
                  {(() => {
                    const ActiveIcon = modules.find(m => m.id === activeModule)?.Icon || TrendingUp
                    return <ActiveIcon size={18} color="#fff" />
                  })()}
                </div>
                <span style={{ color: '#fff', fontWeight: '600' }}>
                  {modules.find(m => m.id === activeModule)?.label || 'Overview'}
                </span>
              </div>
              <div style={{
                transform: showMobileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                color: '#fff',
                fontSize: '1.2rem'
              }}>
                ▼
              </div>
            </button>

            {/* Premium Mobile Dropdown Menu */}
            {showMobileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '0.75rem',
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), ${currentTheme.glow}`,
                animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                padding: '0.75rem',
                overflow: 'hidden'
              }}>
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${currentTheme.primary}08 0%, transparent 100%)`,
                  zIndex: -1
                }} />
                
                {modules.map((module, index) => {
                  const isActive = activeModule === module.id
                  const theme = module.theme
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id)
                        setShowMobileMenu(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        width: '100%',
                        padding: '1rem 1.25rem',
                        fontSize: '0.95rem',
                        fontWeight: isActive ? '600' : '500',
                        border: isActive ? `1px solid ${theme.primary}` : '1px solid transparent',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        background: isActive ? theme.lightGradient : 'transparent',
                        color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.9)',
                        textAlign: 'left',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        marginBottom: '0.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        animation: `slideInUp ${200 + (index * 50)}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                        opacity: 0
                      }}
                      onTouchStart={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                          e.currentTarget.style.transform = 'translateX(4px) scale(0.98)'
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.transform = 'translateX(0) scale(1)'
                        }
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: isActive ? theme.gradient : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: isActive ? theme.boxShadow : 'none',
                        position: 'relative'
                      }}>
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '14px',
                            background: theme.gradient,
                            opacity: 0.1,
                            animation: 'pulse 2s ease-in-out infinite'
                          }} />
                        )}
                        <module.Icon 
                          size={22} 
                          color={isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)'} 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ 
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>
                          {module.label}
                        </span>
                      </div>
                      {isActive && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: theme.primary,
                          boxShadow: `0 0 12px ${theme.primary}`,
                          animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Premium Desktop Tabs */
          <div style={{
            background: 'rgba(17, 17, 17, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.75rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {modules.map((module) => {
              const isActive = activeModule === module.id
              const theme = module.theme
              
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: isActive ? '600' : '500',
                    borderRadius: '14px',
                    border: isActive ? `1px solid ${theme.primary}` : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                    background: isActive ? theme.lightGradient : 'transparent',
                    color: isActive ? theme.primary : 'rgba(255, 255, 255, 0.7)',
                    boxShadow: isActive ? theme.boxShadow : 'none',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isActive ? theme.gradient : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <module.Icon 
                      size={16} 
                      color={isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)'} 
                    />
                  </div>
                  <span>{module.label}</span>
                </button>
              )
            })}
          </div>
        )}

      {/* Direct Content Rendering - No Container Wrapper */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: `4px solid ${currentTheme.borderColor}`,
            borderTopColor: currentTheme.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            textAlign: 'center'
          }}>
            <p style={{
              color: currentTheme.primary,
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Loading Progress Data
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1rem',
              margin: 0
            }}>
              Preparing your insights...
            </p>
          </div>
        </div>
      ) : (
        renderContent()
      )}

      {/* Premium Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-15px) rotate(1deg); 
          }
          66% { 
            transform: translateY(5px) rotate(-1deg); 
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        /* Hide scrollbar but keep functionality */
        div::-webkit-scrollbar { 
          display: none; 
        }
        
        /* Smooth scroll for navigation */
        div[style*="overflowX"] {
          scroll-behavior: smooth;
        }
        
        /* Premium mobile optimizations - MINDER RESTRICTIEF */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden;
          }
          
          input, select, textarea {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
