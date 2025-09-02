import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Target, Zap, TrendingUp, Calendar, Clock, 
  ChevronRight, Award, Flame, Star, Lock, CheckCircle,
  Activity, Apple, Brain, Weight, Coffee, Sun, Moon,
  Timer, BarChart3, Users, ArrowUp, X
} from 'lucide-react';

// Theme matching workout module
const THEME = {
  primary: '#ef4444',
  gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)',
  border: 'rgba(239, 68, 68, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export default function ClientChallenges({ client, db }) {
  const [activeTab, setActiveTab] = useState('beschikbaar');
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moneyBackStatus, setMoneyBackStatus] = useState({ count: 0, eligible: true });
  const [stats, setStats] = useState({
    totalPoints: 2450,
    completedChallenges: 12,
    currentStreak: 7,
    leaderboardRank: 3
  });
  
  const isMobile = useIsMobile();

  useEffect(() => {
    loadChallenges();
  }, [client?.id]);

  const loadChallenges = async () => {
    try {
      // Simulated data for demo
      const demoActiveChallenges = [
        {
          id: '1',
          name: '⚡ Speed Demon 5K',
          subtitle: 'Verbeter je 5K tijd met 2 minuten',
          category: 'fitness',
          difficulty: 'gemiddeld',
          duration_days: 30,
          progress_percentage: 65,
          current_streak: 7,
          base_points: 200,
          completion_bonus: 1000,
          days_left: 12,
          milestones_completed: 2,
          total_milestones: 4
        }
      ];

      const demoChallenges = [
        {
          id: '2',
          name: '💪 Kracht Revolutie',
          subtitle: 'Verhoog je squat met 20kg in 60 dagen',
          category: 'fitness',
          difficulty: 'gevorderd',
          duration_days: 60,
          base_points: 250,
          completion_bonus: 1500,
          total_enrolled: 234,
          success_rate: 78
        },
        {
          id: '3',
          name: '🥗 Schoon 30',
          subtitle: '30 dagen alleen onbewerkte voeding',
          category: 'voeding',
          difficulty: 'beginner',
          duration_days: 30,
          base_points: 150,
          completion_bonus: 750,
          total_enrolled: 567,
          success_rate: 82
        },
        {
          id: '4',
          name: '💧 Hydratatie Held',
          subtitle: 'Drink 3L water per dag voor 30 dagen',
          category: 'voeding',
          difficulty: 'beginner',
          duration_days: 30,
          base_points: 100,
          completion_bonus: 500,
          total_enrolled: 892,
          success_rate: 91
        },
        {
          id: '5',
          name: '🌅 5AM Club',
          subtitle: 'Word 30 dagen voor 5:30 wakker',
          category: 'mindset',
          difficulty: 'gevorderd',
          duration_days: 30,
          base_points: 200,
          completion_bonus: 1000,
          total_enrolled: 145,
          success_rate: 45
        }
      ];

      setActiveChallenges(demoActiveChallenges);
      setChallenges(demoChallenges);
      
      setMoneyBackStatus({
        count: demoActiveChallenges.filter(c => c.is_money_back_challenge).length,
        eligible: true
      });
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fitness: <Activity size={16} />,
      voeding: <Apple size={16} />,
      mindset: <Brain size={16} />,
      transformatie: <Weight size={16} />
    };
    return icons[category] || <Target size={16} />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      fitness: '#f59e0b',
      voeding: '#10b981',
      mindset: '#8b5cf6',
      transformatie: '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#10b981',
      gemiddeld: '#f59e0b',
      gevorderd: '#ef4444',
      extreem: '#991b1b'
    };
    return colors[difficulty] || '#6b7280';
  };

  const startChallenge = async (challenge) => {
    try {
      const isMoneyBack = moneyBackStatus.eligible && 
        confirm('Wil je dit als Money Back Challenge starten? (Je hebt er ' + 
        moneyBackStatus.count + '/3)');
      
      alert('🎯 Challenge gestart! Succes!');
      loadChallenges();
      setShowDetail(false);
    } catch (error) {
      alert('Error starting challenge: ' + error.message);
    }
  };

  const renderMoneyBackBanner = () => {
    if (moneyBackStatus.count === 0) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
          borderRadius: isMobile ? '16px' : '24px',
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          margin: '0 1rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          opacity: 0.95
        }}>
          {/* Animated Background Pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: isMobile ? '250px' : '400px',
            height: isMobile ? '250px' : '400px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header with icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.95)',
              fontSize: isMobile ? '0.875rem' : '0.95rem'
            }}>
              <Trophy size={20} />
              <span>Exclusief Aanbod</span>
            </div>
            
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              lineHeight: 1.2
            }}>
              💰 Bet On Yourself - 100% Money Back!
            </h1>
            
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '1.5rem'
            }}>
              Voltooi 3 challenges binnen 90 dagen en krijg je volledige investering terug. 
              Geen addertjes, gewoon 100% terugbetaling.
            </p>
            
            {/* Progress Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {[1, 2, 3].map(num => (
                <div key={num} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    #{num}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600'
                  }}>
                    Challenge {num}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderStatsGrid = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <Flame size={24} color={THEME.primary} style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
          {stats.currentStreak}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dagen Streak
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <Trophy size={24} color="#fbbf24" style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
          {stats.totalPoints}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Totale Punten
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <CheckCircle size={24} color="#10b981" style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
          {stats.completedChallenges}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Voltooid
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)'
      }}>
        <Users size={24} color="#8b5cf6" style={{ marginBottom: '0.5rem', opacity: 0.9 }} />
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff' }}>
          #{stats.leaderboardRank}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ranking
        </div>
      </div>
    </div>
  );

  const renderChallengeCard = (challenge, isActive = false) => {
    const progress = isActive ? challenge.progress_percentage || 0 : 0;
    const categoryColor = getCategoryColor(challenge.category);
    
    return (
      <div
        key={challenge.id}
        onClick={() => {
          setSelectedChallenge(challenge);
          setShowDetail(true);
        }}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isActive ? categoryColor + '30' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: '20px',
          padding: '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 20px 40px ${categoryColor}25`;
          e.currentTarget.style.border = `1px solid ${categoryColor}50`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.border = `1px solid ${isActive ? categoryColor + '30' : 'rgba(255,255,255,0.05)'}`;
        }}
      >
        {/* Active Badge */}
        {isActive && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            ACTIEF
          </div>
        )}
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            {/* Category & Difficulty */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                background: `${categoryColor}15`,
                borderRadius: '20px',
                fontSize: '0.7rem',
                color: categoryColor,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {getCategoryIcon(challenge.category)}
                {challenge.category}
              </div>
              
              <div style={{
                padding: '0.35rem 0.75rem',
                background: `${getDifficultyColor(challenge.difficulty)}15`,
                color: getDifficultyColor(challenge.difficulty),
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                {challenge.difficulty === 'beginner' ? 'BEGINNER' :
                 challenge.difficulty === 'gemiddeld' ? 'GEMIDDELD' :
                 challenge.difficulty === 'gevorderd' ? 'GEVORDERD' :
                 'EXTREEM'}
              </div>
            </div>
            
            {/* Title */}
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem',
              lineHeight: 1.2
            }}>
              {challenge.name}
            </h3>
            
            {/* Subtitle */}
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.4
            }}>
              {challenge.subtitle}
            </p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isActive ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginTop: '1.25rem',
          marginBottom: isActive ? '1.25rem' : '0'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px'
          }}>
            <Calendar size={16} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
              {isActive ? challenge.days_left || challenge.duration_days : challenge.duration_days}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              {isActive ? 'Dagen Nog' : 'Dagen'}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px'
          }}>
            <Award size={16} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
              {challenge.base_points}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              Punten
            </div>
          </div>
          
          {isActive ? (
            <div style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px'
            }}>
              <Zap size={16} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
                {challenge.current_streak || 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                Streak
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px'
            }}>
              <Users size={16} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
                {challenge.total_enrolled || 0}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                Deelnemers
              </div>
            </div>
          )}
          
          {isActive && (
            <div style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px'
            }}>
              <Target size={16} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
                {challenge.milestones_completed || 0}/{challenge.total_milestones || 4}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                Mijlpalen
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Bar (if active) */}
        {isActive && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Voortgang
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: categoryColor }}>
                {progress}%
              </span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '10px',
                boxShadow: `0 0 20px ${categoryColor}66`
              }} />
            </div>
          </div>
        )}
        
        {/* Success Rate for available challenges */}
        {!isActive && challenge.success_rate && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              Slagingspercentage
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#10b981' }}>
              {challenge.success_rate}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: '2rem',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)'
    }}>
      {/* Header - Minimal, geen border */}
      <div style={{
        padding: '1rem 1rem 0',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.2rem' : '1.4rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Trophy size={20} style={{ color: '#ef4444' }} />
            Challenges
          </h1>
          
          <button style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Users size={16} />
            Leaderboard
          </button>
        </div>
      </div>
      
      {/* Money Back Banner - RODE VERSIE */}
      {renderMoneyBackBanner()}
      
      {/* Stats Grid - Matching ClientHome style */}
      <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
        {renderStatsGrid()}
      </div>
      
      {/* Tabs - Cleaner design */}
      <div style={{
        padding: '0 1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0.25rem',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { id: 'actief', label: 'Actief', count: activeChallenges.length },
            { id: 'beschikbaar', label: 'Beschikbaar', count: challenges.length },
            { id: 'voltooid', label: 'Voltooid', count: 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: activeTab === tab.id ? '#fff' : '#ef4444',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '0 1rem' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '300px'
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
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {activeTab === 'actief' && (
              activeChallenges.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Trophy size={56} style={{ 
                    color: 'rgba(255,255,255,0.1)', 
                    marginBottom: '1.5rem' 
                  }} />
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    Geen actieve challenges
                  </h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.4)',
                    marginBottom: '1.5rem'
                  }}>
                    Start je eerste challenge en begin met groeien
                  </p>
                  <button
                    onClick={() => setActiveTab('beschikbaar')}
                    style={{
                      padding: '0.9rem 2rem',
                      background: THEME.gradient,
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: `0 10px 30px ${THEME.primary}44`
                    }}
                  >
                    Bekijk Challenges
                  </button>
                </div>
              ) : (
                activeChallenges.map(challenge => renderChallengeCard(challenge, true))
              )
            )}
            
            {activeTab === 'beschikbaar' && 
              challenges.map(challenge => renderChallengeCard(challenge))
            }
            
            {activeTab === 'voltooid' && (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)'
              }}>
                <CheckCircle size={56} style={{ 
                  color: 'rgba(255,255,255,0.1)', 
                  marginBottom: '1.5rem' 
                }} />
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  Nog geen voltooide challenges
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  Je voltooide challenges verschijnen hier
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Challenge Detail Modal */}
      {showDetail && selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setShowDetail(false)}
          onStart={() => startChallenge(selectedChallenge)}
          isActive={activeChallenges.some(c => c.id === selectedChallenge.id)}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// Challenge Detail Modal Component
function ChallengeDetailModal({ challenge, onClose, onStart, isActive }) {
  const milestones = challenge.milestones || [
    { title: 'Week 1', description: 'Fundament leggen' },
    { title: 'Week 2', description: 'Momentum opbouwen' },
    { title: 'Week 3', description: 'Doorbreken barrières' },
    { title: 'Week 4', description: 'Finish sterk!' }
  ];
  
  const categoryColor = {
    fitness: '#f59e0b',
    voeding: '#10b981',
    mindset: '#8b5cf6',
    transformatie: '#ef4444'
  }[challenge.category] || '#ef4444';
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      backdropFilter: 'blur(20px)'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div style={{
          padding: '2rem 1.5rem',
          background: `linear-gradient(135deg, ${categoryColor}dd 0%, ${categoryColor}99 100%)`,
          position: 'relative'
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <X size={20} />
          </button>
          
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {challenge.name}
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1rem',
            lineHeight: 1.4
          }}>
            {challenge.subtitle}
          </p>
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <Calendar size={20} style={{ color: categoryColor, marginBottom: '0.5rem', opacity: 0.8 }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {challenge.duration_days}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Dagen
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <Award size={20} style={{ color: '#fbbf24', marginBottom: '0.5rem', opacity: 0.8 }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {challenge.base_points}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Basis Punten
              </div>
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <Zap size={20} style={{ color: '#10b981', marginBottom: '0.5rem', opacity: 0.8 }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                +{challenge.completion_bonus}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                Bonus
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Over deze challenge
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.6,
              fontSize: '0.95rem'
            }}>
              {challenge.description || 'Transformeer je lifestyle met deze krachtige challenge. Push je grenzen, doorbreek barrières en bereik je doelen. Elke dag is een nieuwe kans om te groeien!'}
            </p>
          </div>
          
          {/* Milestones */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              Mijlpalen
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {milestones.map((milestone, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${categoryColor}44 0%, ${categoryColor}22 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: categoryColor,
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#fff',
                      marginBottom: '0.25rem',
                      fontSize: '0.95rem'
                    }}>
                      {milestone.title}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      {milestone.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          {!isActive ? (
            <button
              onClick={onStart}
              style={{
                width: '100%',
                padding: '1.1rem',
                background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`,
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: `0 10px 30px ${categoryColor}44`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 15px 40px ${categoryColor}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 10px 30px ${categoryColor}44`;
              }}
            >
              <Flame size={20} />
              Start Challenge
            </button>
          ) : (
            <div style={{
              padding: '1.1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '14px',
              textAlign: 'center',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontWeight: '600'
            }}>
              ✓ Deze challenge is al actief
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
