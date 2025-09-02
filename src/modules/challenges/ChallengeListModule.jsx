import useIsMobile from '../../hooks/useIsMobile'
import React, { useState } from 'react';
import { ChevronRight, Clock, Award, Users, Play } from 'lucide-react';

export default function ChallengeListModule({ challenges = [], onSelectChallenge }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isMobile = useIsMobile();
  
  // Demo challenges if none provided
  const defaultChallenges = [
    {
      id: '1',
      name: 'Speed Demon 5K',
      subtitle: 'Verbeter je 5K tijd met 2 minuten',
      category: 'fitness',
      difficulty: 'gemiddeld',
      duration_days: 30,
      base_points: 200,
      participants: 234,
      success_rate: 78
    },
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
    },
    {
      id: '4',
      name: '5AM Club',
      subtitle: 'Word 30 dagen voor 5:30 wakker',
      category: 'mindset',
      difficulty: 'gevorderd',
      duration_days: 30,
      base_points: 250,
      participants: 145,
      success_rate: 45
    }
  ];
  
  const displayChallenges = challenges.length > 0 ? challenges : defaultChallenges;
  
  const categories = [
    { id: 'all', label: 'Alle', color: '#ef4444' },
    { id: 'fitness', label: 'Fitness', color: '#dc2626' },
    { id: 'voeding', label: 'Voeding', color: '#ef4444' },
    { id: 'mindset', label: 'Mindset', color: '#f87171' }
  ];
  
  const getDifficultyColor = (difficulty) => ({
    beginner: '#10b981',
    gemiddeld: '#f59e0b',
    gevorderd: '#ef4444'
  }[difficulty] || '#6b7280');
  
  const filteredChallenges = selectedCategory === 'all' 
    ? displayChallenges 
    : displayChallenges.filter(c => c.category === selectedCategory);
  
  return (
    <div>
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '0.5rem 1rem',
              background: selectedCategory === cat.id 
                ? cat.color
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '20px',
              color: selectedCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Challenge List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {filteredChallenges.map(challenge => (
          <div
            key={challenge.id}
            onClick={() => onSelectChallenge(challenge)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
            }}
          >
            {/* Main Content */}
            <div style={{ flex: 1 }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  {challenge.name}
                </h4>
                <span style={{
                  padding: '0.2rem 0.5rem',
                  background: `${getDifficultyColor(challenge.difficulty)}20`,
                  color: getDifficultyColor(challenge.difficulty),
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {challenge.difficulty}
                </span>
              </div>
              
              {/* Subtitle */}
              <p style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.75rem'
              }}>
                {challenge.subtitle}
              </p>
              
              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Clock size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    {challenge.duration_days} dagen
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Award size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    {challenge.base_points} pts
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Users size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    {challenge.participants}
                  </span>
                </div>
                
                {challenge.success_rate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      {challenge.success_rate}% slagen
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Button */}
            <button style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              borderRadius: '12px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}>
              <ChevronRight size={20} style={{ color: '#ef4444' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
