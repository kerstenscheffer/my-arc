import PageVideoWidget from '../../modules/videos/PageVideoWidget'
import { useState, useEffect } from 'react'
import BetOnYourselfCard from '../../modules/challenges/BetOnYourselfCard'
import ActiveChallengesModule from '../../modules/challenges/ActiveChallengesModule'
import ChallengePickerModule from '../../modules/challenges/ChallengePickerModule'
import ChallengeDetailModal from '../../modules/challenges/ChallengeDetailModal'

export default function ClientChallengePage({ db, client }) {
  const [activeChallenges, setActiveChallenges] = useState([])
  const [availableChallenges, setAvailableChallenges] = useState([])
  const [completedChallenges, setCompletedChallenges] = useState([])
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [moneyBackProgress, setMoneyBackProgress] = useState({ 
    completed: 0, 
    required: 3, 
    daysLeft: 90,
    eligible: false 
  })
  
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    loadAllData()
  }, [client])

  const loadAllData = async () => {
    if (!client?.id) return
    
    try {
      setLoading(true)
      
      // Load all challenge data
      const [active, available, completed, clientBalance] = await Promise.all([
        db.getClientActiveChallenges?.(client.id) || [],
        db.getChallenges?.() || [],
        db.getClientCompletedChallenges?.(client.id) || [],
        db.getClientBalance?.(client.id) || 0
      ])
      
      setActiveChallenges(active)
      setAvailableChallenges(available)
      setCompletedChallenges(completed)
      setBalance(clientBalance)
      
      // Calculate money back eligibility
      const eligibleCompleted = completed.filter(c => {
        const completedDate = new Date(c.completed_at)
        const daysSinceStart = Math.floor((Date.now() - new Date(c.started_at)) / (1000 * 60 * 60 * 24))
        return daysSinceStart <= 90
      })
      
      const clientCreatedDate = new Date(client.created_at || Date.now())
      const daysAsClient = Math.floor((Date.now() - clientCreatedDate) / (1000 * 60 * 60 * 24))
      
      setMoneyBackProgress({
        completed: eligibleCompleted.length,
        required: 3,
        daysLeft: Math.max(0, 90 - daysAsClient),
        eligible: eligibleCompleted.length >= 3
      })
      
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChallenge = async (challengeId, betAmount = 0) => {
    try {
      await db.startClientChallenge?.(client.id, challengeId, betAmount > 0)
      
      if (betAmount > 0) {
        await db.updateClientBalance?.(client.id, -betAmount)
      }
      
      await loadAllData()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Error starting challenge:', error)
      alert('Er ging iets mis bij het starten van de challenge')
    }
  }

  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge)
    setShowDetailModal(true)
  }

  const scrollToChallengePicker = () => {
    const element = document.getElementById('challenge-picker')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(220, 38, 38, 0.15)',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: isMobile ? '100px' : '2rem'
    }}>
      <div style={{
        padding: isMobile ? '0' : '0 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>



{/* Video Widget voor Challenges */}
<PageVideoWidget 
  client={client}
  db={db}
  pageContext="challenges"
/>


        {/* Bet On Yourself Card - Full width on mobile */}
        <div style={{ padding: isMobile ? '0' : '0' }}>
          <BetOnYourselfCard 
            completedChallenges={completedChallenges.length}
            activeChallenges={activeChallenges.length}
            balance={balance}
            moneyBackProgress={moneyBackProgress}
          />
        </div>

        {/* Content with padding */}
        <div style={{ padding: isMobile ? '0 1rem' : '0' }}>
          {/* Active Challenges */}
          <ActiveChallengesModule 
            activeChallenges={activeChallenges}
            onChallengeClick={handleChallengeClick}
            onScrollToPicker={scrollToChallengePicker}
          />

          {/* Available Challenges Picker */}
          <ChallengePickerModule 
            availableChallenges={availableChallenges}
            onChallengeSelect={handleChallengeClick}
          />
        </div>

        {/* Challenge Detail Modal */}
        <ChallengeDetailModal 
          challenge={selectedChallenge}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onStartChallenge={handleStartChallenge}
          isActive={selectedChallenge?.is_active}
        />
      </div>
    </div>
  )
}
