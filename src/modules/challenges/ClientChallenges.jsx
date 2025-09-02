import React, { useState, useEffect } from 'react';
import ChallengeHeaderCard from './ChallengeHeaderCard';
import ChallengeProgressModule from './ChallengeProgressModule';
import ChallengeListModule from './ChallengeListModule';
import ChallengeDetailModal from './ChallengeDetailModal';

export default function ClientChallenges({ client, db }) {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [moneyBackStatus, setMoneyBackStatus] = useState({ count: 1, eligible: true });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadChallenges();
  }, [client?.id]);
  
  const loadChallenges = async () => {
    try {
      // Simulated data - replace with actual db calls
      setActiveChallenges([
        {
          id: '1',
          name: 'Speed Demon 5K',
          category: 'fitness',
          progress: 65,
          streak: 7,
          daysLeft: 12,
          totalDays: 30
        }
      ]);
      
      setAvailableChallenges([
        {
          id: '2',
          name: 'Kracht Revolutie',
          subtitle: 'Verhoog je squat met 20kg',
          category: 'fitness',
          difficulty: 'gevorderd',
          duration_days: 60,
          base_points: 300,
          participants: 156,
          success_rate: 65
        },
        {
          id: '3',
          name: 'Schoon 30',
          subtitle: '30 dagen onbewerkte voeding',
          category: 'voeding',
          difficulty: 'beginner',
          duration_days: 30,
          base_points: 150,
          participants: 892,
          success_rate: 82
        }
      ]);
      
      setMoneyBackStatus({ count: 1, eligible: true });
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowDetail(true);
  };
  
  const handleStartChallenge = async () => {
    // Add challenge start logic here
    alert('Challenge gestart!');
    setShowDetail(false);
    loadChallenges();
  };
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(239, 68, 68, 0.2)',
          borderTopColor: '#ef4444',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      paddingBottom: '2rem'
    }}>
      {/* Page Title */}
      <div style={{
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <h1 style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          MY ARC / CHALLENGES
        </h1>
      </div>
      
      {/* Money Back Header Card */}
      <div style={{ padding: '0 1rem' }}>
        <ChallengeHeaderCard moneyBackStatus={moneyBackStatus} />
      </div>
      
      {/* Active Challenges Progress */}
      {activeChallenges.length > 0 && (
        <div style={{ padding: '0 1rem' }}>
          <ChallengeProgressModule 
            activeChallenges={activeChallenges}
            onSelectChallenge={handleSelectChallenge}
          />
        </div>
      )}
      
      {/* Available Challenges List */}
      <div style={{ padding: '0 1rem' }}>
        <div style={{
          marginBottom: '1rem'
        }}>
          <h3 style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '600'
          }}>
            BESCHIKBARE CHALLENGES
          </h3>
        </div>
        
        <ChallengeListModule 
          challenges={availableChallenges}
          onSelectChallenge={handleSelectChallenge}
        />
      </div>
      
      {/* Challenge Detail Modal */}
      {showDetail && selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setShowDetail(false)}
          onStart={handleStartChallenge}
          isActive={activeChallenges.some(c => c.id === selectedChallenge.id)}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
