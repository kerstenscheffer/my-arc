// src/coach/v2/1-client-management/ClientManagementV2.jsx
// HOOFDPAGINA 1: CLIENT MANAGEMENT ROUTER
// Importeert alle 6 V2 assignment pages

import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Dumbbell, 
  Utensils, 
  Phone, 
  MessageSquare, 
  Trophy,
  Check,
  ChevronRight,
  Users
} from 'lucide-react'

// ✅ IMPORT ALLE 6 V2 PAGES - Correct paths
import ClientCreateV2 from './pages/ClientCreateV2'
import WorkoutAssignV2 from './pages/WorkoutAssignV2'
import MealAssignV2 from './pages/MealAssignV2'
import CallAssignV2 from './pages/CallAssignV2'
import MessagesV2 from './pages/MessagesV2'
import ChallengeAssignV2 from './pages/ChallengeAssignV2'

function ClientManagementV2({ 
  db, 
  clients = [],
  workoutSchemas = [],
  mealTemplates = [],
  challenges = [],
  refreshData 
}) {
  const [activeTab, setActiveTab] = useState('create')
  const [selectedClient, setSelectedClient] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Tab configuratie met V2 components
  const managementTabs = [
    {
      id: 'create',
      label: 'Client Beheer',
      icon: UserPlus,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      description: 'Maak nieuwe clients aan en beheer info',
      requiresClient: false
    },
    {
      id: 'workout',
      label: 'Workout Plan',
      icon: Dumbbell,
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      description: 'Wijs workout schema\'s toe',
      requiresClient: true
    },
    {
      id: 'meal',
      label: 'Meal Plan',
      icon: Utensils,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      description: 'Wijs meal plans toe',
      requiresClient: true
    },
    {
      id: 'calls',
      label: 'Call Planning',
      icon: Phone,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      description: 'Plan gesprekken en consultaties',
      requiresClient: true
    },
    {
      id: 'messages',
      label: 'Berichten',
      icon: MessageSquare,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      description: 'Stuur berichten naar clients',
      requiresClient: true
    },
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Trophy,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      description: 'Wijs challenges toe',
      requiresClient: true
    }
  ]
  
  const currentTab = managementTabs.find(tab => tab.id === activeTab)
  
  // Client Selector Component
  const ClientSelector = () => {
    // 🔍 DEBUG LOGGING
    console.log('=== CLIENT SELECTOR DEBUG ===')
    console.log('1. Aantal clients:', clients?.length || 0)
    console.log('2. Clients array:', clients)
    console.log('3. Selected client:', selectedClient)
    console.log('4. Active tab:', activeTab)
    
    // Check voor problematische client data
    if (clients && clients.length > 0) {
      clients.forEach((client, index) => {
        if (!client?.id) {
          console.error(`❌ Client ${index} heeft geen ID:`, client)
        }
      })
    }
    
    const handleClientClick = (client) => {
      console.log('🖱️ CLICK EVENT:', {
        clickedClient: client,
        clientId: client?.id,
        clientName: `${client?.first_name} ${client?.last_name}`,
        previousSelected: selectedClient?.id
      })
      
      // Force update
      setSelectedClient(client)
      
      // Double check na 100ms
      setTimeout(() => {
        console.log('✅ Selected client na update:', selectedClient)
      }, 100)
    }
    
    return (
    <div style={{
      marginBottom: '2rem',
      padding: isMobile ? '1rem' : '1.5rem',
      background: 'rgba(17, 17, 17, 0.5)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <Users size={20} color="#3b82f6" />
        <h3 style={{
          color: '#fff',
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '600',
          margin: 0
        }}>
          Selecteer Client
        </h3>
      </div>
      
      {/* DEBUG PANEL - Verwijder dit later */}
      <div style={{
        marginTop: '1rem',
        padding: '0.5rem',
        background: 'rgba(255, 100, 100, 0.1)',
        border: '1px solid rgba(255, 100, 100, 0.3)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: '#ff6b6b'
      }}>
        <strong>🔍 DEBUG INFO:</strong><br/>
        • Clients geladen: {clients?.length > 0 ? `✅ ${clients.length} clients` : '❌ Geen'}<br/>
        • Selected: {selectedClient ? `${selectedClient.first_name} (ID: ${selectedClient.id})` : 'Niemand'}<br/>
        • Tab: {activeTab}<br/>
        • Klik op een client en check console voor logs
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.75rem'
      }}>
        {!clients || clients.length === 0 ? (
          <div style={{
            color: 'rgba(255, 255, 255, 0.5)',
            padding: '2rem',
            textAlign: 'center',
            gridColumn: '1 / -1'
          }}>
            ⚠️ Geen clients gevonden. Voeg eerst een client toe.
          </div>
        ) : (
          clients.map((client, index) => {
            const isSelected = selectedClient?.id === client?.id
            
            return (
              <button
                key={client?.id || `client-${index}`}
                onClick={() => handleClientClick(client)}
                onMouseDown={(e) => {
                  console.log('🖱️ MouseDown event fired voor:', client?.first_name)
                }}
                style={{
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid #3b82f6'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: isSelected ? '#3b82f6' : '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: isSelected ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'auto'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div>{client?.first_name || 'Naam'} {client?.last_name || 'onbekend'}</div>
                  {!isMobile && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '0.25rem'
                    }}>
                      {client?.email || 'Geen email'}
                    </div>
                  )}
                </div>
                {isSelected && <Check size={16} />}
              </button>
            )
          })
        )}
      </div>
      
      {selectedClient && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{
            color: '#3b82f6',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            margin: 0,
            fontWeight: '600'
          }}>
            ✓ Geselecteerd: {selectedClient.first_name} {selectedClient.last_name}
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            margin: '0.25rem 0 0'
          }}>
            {selectedClient.email}
          </p>
        </div>
      )}
    </div>
  )
}
  
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Tab Navigation Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '2rem'
      }}>
        {managementTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: activeTab === tab.id
                ? `linear-gradient(135deg, ${tab.color}20 0%, ${tab.color}10 100%)`
                : 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: activeTab === tab.id
                ? `2px solid ${tab.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '120px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 15px 40px ${tab.color}30`
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Gradient background for active */}
            {activeTab === tab.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: tab.gradient,
                opacity: 0.1,
                pointerEvents: 'none'
              }} />
            )}
            
            {/* Icon Container */}
            <div style={{
              width: isMobile ? '44px' : '52px',
              height: isMobile ? '44px' : '52px',
              borderRadius: '14px',
              background: activeTab === tab.id ? tab.gradient : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: activeTab === tab.id 
                ? `0 8px 20px ${tab.color}40`
                : '0 4px 10px rgba(0, 0, 0, 0.2)'
            }}>
              <tab.icon size={isMobile ? 22 : 26} color="#fff" />
            </div>
            
            {/* Label & Description */}
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{
                color: activeTab === tab.id ? tab.color : '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600'
              }}>
                {tab.label}
              </div>
              {!isMobile && (
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  {tab.description}
                </div>
              )}
            </div>
            
            {/* Active indicator bar */}
            {activeTab === tab.id && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '20%',
                right: '20%',
                height: '3px',
                background: tab.gradient,
                borderRadius: '3px 3px 0 0'
              }} />
            )}
          </button>
        ))}
      </div>
      
      {/* Client Selector - alleen voor tabs die client nodig hebben */}
      {currentTab?.requiresClient && <ClientSelector />}
      
      {/* Content Area met V2 Components */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: isMobile ? '1.5rem' : '2rem',
        minHeight: '500px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Tab Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: currentTab?.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentTab && <currentTab.icon size={20} color="#fff" />}
          </div>
          <div>
            <h2 style={{
              color: '#fff',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              fontWeight: '700',
              margin: 0
            }}>
              {currentTab?.label}
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              margin: '0.25rem 0 0'
            }}>
              {currentTab?.description}
            </p>
          </div>
        </div>
        
        {/* RENDER V2 COMPONENTS */}
        {activeTab === 'create' && (
          <ClientCreateV2 
            db={db}
            clients={clients}
            refreshData={() => {
              refreshData()
              setSelectedClient(null) // Reset selection na nieuwe client
            }}
            isMobile={isMobile}
          />
        )}
        
        {activeTab === 'workout' && (
          selectedClient ? (
            <WorkoutAssignV2 
              db={db}
              client={selectedClient}
              workoutSchemas={workoutSchemas}
              refreshData={refreshData}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Dumbbell size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Selecteer eerst een client om een workout plan toe te wijzen</p>
            </div>
          )
        )}
        
        {activeTab === 'meal' && (
          selectedClient ? (
            <MealAssignV2 
              db={db}
              client={selectedClient}
              mealTemplates={mealTemplates}
              refreshData={refreshData}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Utensils size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Selecteer eerst een client om een meal plan toe te wijzen</p>
            </div>
          )
        )}
        
        {activeTab === 'calls' && (
          selectedClient ? (
            <CallAssignV2 
              db={db}
              client={selectedClient}
              refreshData={refreshData}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Phone size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Selecteer eerst een client voor call planning</p>
            </div>
          )
        )}
        
        {activeTab === 'messages' && (
          selectedClient ? (
            <MessagesV2 
              db={db}
              client={selectedClient}
              refreshData={refreshData}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Selecteer eerst een client om berichten te sturen</p>
            </div>
          )
        )}
        
        {activeTab === 'challenges' && (
          selectedClient ? (
            <ChallengeAssignV2 
              db={db}
              client={selectedClient}
              challenges={challenges}
              refreshData={refreshData}
              isMobile={isMobile}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Selecteer eerst een client om een challenge toe te wijzen</p>
            </div>
          )
        )}
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ✅ EXPORT STATEMENT TOEGEVOEGD
export default ClientManagementV2
