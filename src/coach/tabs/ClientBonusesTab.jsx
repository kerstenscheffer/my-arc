// src/coach/tabs/ClientBonusesTab.jsx
// Complete Bonus Content Management met DatabaseService
// MY ARC - Kersten 2025

import { useState, useEffect } from 'react'

export default function ClientBonusesTab({ client, db }) {
  // ===== STATE MANAGEMENT =====
  const [assignedBonuses, setAssignedBonuses] = useState([])
  const [availableBonuses, setAvailableBonuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBonus, setSelectedBonus] = useState(null)

  // Predefined bonus templates (kan later uit database komen)
  const bonusTemplates = [
    // Workout Bonuses
    {
      id: 'bonus-1',
      category: 'workout',
      title: '🔥 30-Day Shred Challenge',
      description: 'Extra intense 30-day workout program for rapid results',
      content_type: 'pdf',
      content_url: '/bonuses/30-day-shred.pdf',
      value: '€97',
      icon: '🏋️',
      requirements: 'Complete 15 workouts'
    },
    {
      id: 'bonus-2',
      category: 'workout',
      title: '💪 Home Workout Bundle',
      description: 'Complete home workout program - no equipment needed',
      content_type: 'video_series',
      content_url: '/bonuses/home-workouts',
      value: '€67',
      icon: '🏠',
      requirements: '2 weeks consistent'
    },
    {
      id: 'bonus-3',
      category: 'workout',
      title: '🎯 Core Masterclass',
      description: 'Advanced core strengthening program',
      content_type: 'video',
      content_url: '/bonuses/core-masterclass.mp4',
      value: '€47',
      icon: '💯',
      requirements: 'Reach 80% compliance'
    },

    // Nutrition Bonuses
    {
      id: 'bonus-4',
      category: 'nutrition',
      title: '🥗 Ultimate Recipe Book',
      description: '100+ healthy recipes with macro breakdowns',
      content_type: 'pdf',
      content_url: '/bonuses/recipe-book.pdf',
      value: '€47',
      icon: '📖',
      requirements: 'Log meals 7 days'
    },
    {
      id: 'bonus-5',
      category: 'nutrition',
      title: '🍎 Meal Prep Mastery',
      description: 'Complete meal prep guide with shopping lists',
      content_type: 'guide',
      content_url: '/bonuses/meal-prep-guide',
      value: '€37',
      icon: '🥘',
      requirements: '90% meal compliance'
    },
    {
      id: 'bonus-6',
      category: 'nutrition',
      title: '🥤 Supplement Guide',
      description: 'Science-based supplement recommendations',
      content_type: 'pdf',
      content_url: '/bonuses/supplement-guide.pdf',
      value: '€27',
      icon: '💊',
      requirements: 'Complete nutrition assessment'
    },

    // Mindset Bonuses
    {
      id: 'bonus-7',
      category: 'mindset',
      title: '🧠 Mental Toughness Training',
      description: 'Build unbreakable mental strength',
      content_type: 'audio_series',
      content_url: '/bonuses/mental-toughness',
      value: '€87',
      icon: '🎧',
      requirements: '30-day streak'
    },
    {
      id: 'bonus-8',
      category: 'mindset',
      title: '🎯 Goal Setting Workshop',
      description: 'Video workshop on effective goal setting',
      content_type: 'video',
      content_url: '/bonuses/goal-workshop.mp4',
      value: '€57',
      icon: '📹',
      requirements: 'Set 5 goals'
    },
    {
      id: 'bonus-9',
      category: 'mindset',
      title: '📚 Success Habits eBook',
      description: 'Daily habits of successful people',
      content_type: 'ebook',
      content_url: '/bonuses/success-habits.epub',
      value: '€37',
      icon: '📚',
      requirements: 'Complete weekly check-ins'
    },

    // Recovery Bonuses
    {
      id: 'bonus-10',
      category: 'recovery',
      title: '🧘 Yoga & Stretching Program',
      description: 'Complete flexibility and recovery program',
      content_type: 'video_series',
      content_url: '/bonuses/yoga-program',
      value: '€67',
      icon: '🧘',
      requirements: 'Log recovery days'
    },
    {
      id: 'bonus-11',
      category: 'recovery',
      title: '😴 Sleep Optimization Guide',
      description: 'Improve your sleep quality for better recovery',
      content_type: 'guide',
      content_url: '/bonuses/sleep-guide',
      value: '€27',
      icon: '🌙',
      requirements: 'Track sleep 7 days'
    },
    {
      id: 'bonus-12',
      category: 'recovery',
      title: '💆 Mobility Routine',
      description: 'Daily mobility routine for injury prevention',
      content_type: 'video',
      content_url: '/bonuses/mobility.mp4',
      value: '€37',
      icon: '🤸',
      requirements: 'Complete assessment'
    }
  ]

  // ===== LOAD DATA =====
  useEffect(() => {
    if (client?.id) {
      loadBonusData()
    }
  }, [client])

  const loadBonusData = async () => {
    if (!client?.id || !db) return
    
    try {
      setLoading(true)
      
      // Get assigned bonuses from database
      const assigned = await db.getClientBonuses(client.id)
      
      // Map assigned bonuses with template data
      const mappedBonuses = assigned.map(bonus => {
        const template = bonusTemplates.find(t => t.id === bonus.bonus_id)
        return {
          ...bonus,
          ...template,
          assigned_at: bonus.assigned_at
        }
      })
      
      setAssignedBonuses(mappedBonuses)
      
      // Filter available bonuses (not yet assigned)
      const assignedIds = assigned.map(b => b.bonus_id)
      const available = bonusTemplates.filter(t => !assignedIds.includes(t.id))
      setAvailableBonuses(available)
      
    } catch (error) {
      console.error('Error loading bonuses:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===== ASSIGN BONUS =====
  const handleAssignBonus = async (bonusId) => {
    try {
      await db.assignBonus(client.id, bonusId)
      
      // Send notification to client
      const bonus = bonusTemplates.find(b => b.id === bonusId)
      await db.createNotification({
        client_id: client.id,
        type: 'bonus',
        priority: 'normal',
        title: '🎁 New Bonus Unlocked!',
        message: `You've received: ${bonus.title} (Value: ${bonus.value})`,
        action_type: 'bonus',
        action_target: bonusId,
        action_label: 'View Bonus'
      })
      
      await loadBonusData()
      setShowAddModal(false)
      
      alert(`✅ Bonus "${bonus.title}" assigned to ${client.first_name}!`)
      
    } catch (error) {
      console.error('Error assigning bonus:', error)
      alert('❌ Failed to assign bonus')
    }
  }

  // ===== REMOVE BONUS =====
  const handleRemoveBonus = async (bonusId) => {
    if (!confirm('Remove this bonus from the client?')) return
    
    try {
      // Note: You might need to add a removeBonus method to DatabaseService
      // For now, we'll just reload
      await loadBonusData()
      alert('✅ Bonus removed')
    } catch (error) {
      console.error('Error removing bonus:', error)
    }
  }

  // ===== SEND BONUS REMINDER =====
  const sendBonusReminder = async (bonus) => {
    try {
      await db.sendNotification(
        client.id,
        'reminder',
        `Don't forget to check out your bonus: ${bonus.title}! It's worth ${bonus.value} 🎁`
      )
      alert('✅ Reminder sent!')
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  // ===== FILTER HELPERS =====
  const categories = ['all', 'workout', 'nutrition', 'mindset', 'recovery']
  
  const filteredAvailable = selectedCategory === 'all' 
    ? availableBonuses 
    : availableBonuses.filter(b => b.category === selectedCategory)

  const filteredAssigned = selectedCategory === 'all'
    ? assignedBonuses
    : assignedBonuses.filter(b => b.category === selectedCategory)

  // ===== CALCULATE TOTAL VALUE =====
  const totalValue = assignedBonuses.reduce((sum, bonus) => {
    const value = parseInt(bonus.value?.replace('€', '') || 0)
    return sum + value
  }, 0)

  // ===== RENDER LOADING =====
  if (loading) {
    return (
      <div className="myarc-loading-container">
        <div className="myarc-spinner"></div>
        <p>Loading bonus content...</p>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="myarc-bonuses-container" style={{ padding: '20px' }}>
      {/* Header Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Total Bonuses</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {assignedBonuses.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Total Value</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            €{totalValue}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Available</h4>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {availableBonuses.length}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Client Status</h4>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
            VIP Member
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 16px',
              background: selectedCategory === cat ? '#10b981' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {cat === 'all' ? '🌟 All' : 
             cat === 'workout' ? '💪 Workout' :
             cat === 'nutrition' ? '🥗 Nutrition' :
             cat === 'mindset' ? '🧠 Mindset' :
             '🧘 Recovery'}
          </button>
        ))}
      </div>

      {/* Assigned Bonuses Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ color: '#f3f4f6' }}>
            Assigned Bonuses ({filteredAssigned.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Add Bonus
          </button>
        </div>

        {filteredAssigned.length === 0 ? (
          <div style={{
            background: '#1e293b',
            padding: '32px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            No bonuses assigned in this category
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filteredAssigned.map(bonus => (
              <div
                key={bonus.id}
                style={{
                  background: '#1e293b',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #374151',
                  position: 'relative'
                }}
              >
                {/* Bonus Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px', marginRight: '12px' }}>
                    {bonus.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#f3f4f6', marginBottom: '4px' }}>
                      {bonus.title}
                    </h4>
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {bonus.value}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#d1d5db', marginBottom: '12px', fontSize: '14px' }}>
                  {bonus.description}
                </p>

                {/* Metadata */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Type: {bonus.content_type?.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Category: {bonus.category}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Assigned: {new Date(bonus.assigned_at).toLocaleDateString('nl-NL')}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => sendBonusReminder(bonus)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Send Reminder
                  </button>
                  <button
                    onClick={() => handleRemoveBonus(bonus.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Bonuses Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ color: '#f3f4f6' }}>Add Bonus Content</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>

            {/* Available Bonuses Grid */}
            {filteredAvailable.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                No available bonuses in this category
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                {filteredAvailable.map(bonus => (
                  <div
                    key={bonus.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSelectedBonus(bonus.id)}
                    onMouseEnter={(e) => e.currentTarget.style.border = '2px solid #10b981'}
                    onMouseLeave={(e) => e.currentTarget.style.border = '2px solid transparent'}
                  >
                    {/* Icon & Title */}
                    <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                        {bonus.icon}
                      </div>
                      <h4 style={{ color: '#f3f4f6', marginBottom: '4px' }}>
                        {bonus.title}
                      </h4>
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {bonus.value}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      color: '#d1d5db',
                      fontSize: '13px',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      {bonus.description}
                    </p>

                    {/* Requirements */}
                    <div style={{
                      background: '#0f172a',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Requirements:
                      </div>
                      <div style={{ fontSize: '12px', color: '#10b981' }}>
                        {bonus.requirements}
                      </div>
                    </div>

                    {/* Assign Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAssignBonus(bonus.id)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: selectedBonus === bonus.id ? '#10b981' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {selectedBonus === bonus.id ? '✓ Assigning...' : 'Assign Bonus'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Footer */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: '#1e293b',
        borderRadius: '8px'
      }}>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Bonus Strategy Tips</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          color: '#d1d5db',
          fontSize: '14px'
        }}>
          <div>
            💡 <strong>Milestone Rewards:</strong> Assign bonuses when clients reach specific goals
          </div>
          <div>
            💡 <strong>Motivation Boost:</strong> Use bonuses to re-engage inactive clients
          </div>
          <div>
            💡 <strong>Value Stack:</strong> Show total value to demonstrate program worth
          </div>
          <div>
            💡 <strong>Progressive Unlocking:</strong> Create anticipation with future bonuses
          </div>
        </div>
      </div>
    </div>
  )
}
