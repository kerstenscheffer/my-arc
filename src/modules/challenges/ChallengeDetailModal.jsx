// src/modules/challenges/ChallengeDetailModal.jsx
// Main Challenge Detail Modal - Modular Structure
// Kersten - 28 Augustus 2025

import { useState, useEffect } from 'react'
import { X, Target, Calendar, TrendingUp } from 'lucide-react'
import ChallengeService from '../../services/ChallengeService'
import ChallengeHeader from './components/ChallengeHeader'
import ChallengeStats from './components/ChallengeStats'
import ChallengeRules from './components/ChallengeRules'
import ChallengeGoals from './components/ChallengeGoals'
import ChallengeActions from './components/ChallengeActions'

const THEME = {
  primary: '#dc2626',
  gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
  backgroundGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
  borderColor: 'rgba(220, 38, 38, 0.1)',
  borderActive: 'rgba(220, 38, 38, 0.2)',
  boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
  glow: '0 0 60px rgba(220, 38, 38, 0.1)'
}

export default function ChallengeDetailModal({ 
  challenge, 
  isOpen, 
  onClose, 
  clientId,
  isActive = false 
}) {
  const [loading, setLoading] = useState(false)
  const [challengeGoals, setChallengeGoals] = useState([])
  const [expandedGoals, setExpandedGoals] = useState({})
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (isOpen && challenge && clientId) {
      loadChallengeDetails()
    }
  }, [isOpen, challenge, clientId])

  const loadChallengeDetails = async () => {
    try {
      setLoading(true)
      console.log('🎯 Loading challenge details for:', challenge.title || challenge.name)
      
      // Try multiple approaches to find goals
      let goals = []
      
      // Method 1: By challenge name/title
      if (challenge.title || challenge.name) {
        goals = await ChallengeService.getChallengeGoalsByName(challenge.title || challenge.name)
      }
      
      // Method 2: If no goals found, try by ID if available
      if (goals.length === 0 && challenge.id) {
        goals = await ChallengeService.getChallengeGoals(challenge.id)
      }
      
      // Method 3: If still no goals, try finding template by exact name match
      if (goals.length === 0) {
        const templates = await ChallengeService.getChallengeTemplates()
        const matchedTemplate = templates.find(t => 
          t.template_name === challenge.title || 
          t.template_name === challenge.name ||
          t.title === challenge.title
        )
        if (matchedTemplate) {
          goals = await ChallengeService.getChallengeGoals(matchedTemplate.id)
        }
      }
      
      console.log('📋 Found goals:', goals.length)
      setChallengeGoals(goals)
      
    } catch (error) {
      console.error('Failed to load challenge details:', error)
      setChallengeGoals([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartChallenge = async () => {
    if (!clientId || !challenge) return
    
    try {
      setLoading(true)
      await ChallengeService.startChallenge(clientId, challenge.id, 0)
      onClose(true)
    } catch (error) {
      console.error('Failed to start challenge:', error)
      alert('Er ging iets mis bij het starten van de challenge. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

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

  if (!isOpen || !challenge) return null

  // Parse rules
  const rules = Array.isArray(challenge.rules) 
    ? challenge.rules 
    : (challenge.rules ? JSON.parse(challenge.rules) : [
        'Complete alle dagelijkse doelen',
        'Log je voortgang elke dag', 
        'Upload bewijs waar nodig',
        'Blijf consistent voor beste resultaten'
      ])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      
      {/* Floating background orb */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <div style={{
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '24px 24px 0 0' : '24px',
        width: isMobile ? '100%' : '520px',
        maxHeight: isMobile ? '90vh' : '85vh',
        overflow: 'auto',
        boxShadow: `0 25px 80px rgba(0,0,0,0.8), ${THEME.glow}`,
        animation: isMobile ? 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${THEME.borderColor}`,
        position: 'relative',
        transform: 'translateZ(0)'
      }}>
        
        {/* Challenge Header Component */}
        <ChallengeHeader 
          challenge={challenge}
          onClose={onClose}
          isMobile={isMobile}
          theme={THEME}
        />

        {/* Modal Content */}
        <div style={{ padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem' }}>
          
          {/* Challenge Stats Component */}
          <ChallengeStats
            challenge={challenge}
            getDifficultyColor={getDifficultyColor}
            getDifficultyLabel={getDifficultyLabel}
            isMobile={isMobile}
            theme={THEME}
          />

          {/* Challenge Rules Component */}
          <ChallengeRules
            rules={rules}
            isMobile={isMobile}
            theme={THEME}
          />

          {/* Challenge Goals Component */}
          <ChallengeGoals
            challengeGoals={challengeGoals}
            loading={loading}
            expandedGoals={expandedGoals}
            setExpandedGoals={setExpandedGoals}
            isMobile={isMobile}
            theme={THEME}
          />

          {/* Challenge Actions Component */}
          {!isActive && (
            <ChallengeActions
              onStartChallenge={handleStartChallenge}
              loading={loading}
              isMobile={isMobile}
              theme={THEME}
            />
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
