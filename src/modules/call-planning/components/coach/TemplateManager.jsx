import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, Users, Clock, Zap, Search, Check, X } from 'lucide-react'
import CallPlanningService from '../../CallPlanningService'
import CreateTemplateModal from './CreateTemplateModal'

export default function TemplateManager({ templates, onRefresh }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  
  // Load clients when modal opens
  useEffect(() => {
    if (assignModal) {
      loadClients()
    }
  }, [assignModal])
  
  const loadClients = async () => {
    setLoadingClients(true)
    try {
      // Try to get clients from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
      
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .order('first_name')
      
      if (data) {
        // Format client names
        const formattedClients = data.map(client => ({
          ...client,
          display_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email || 'Unnamed Client'
        }))
        setClients(formattedClients)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }
  
  const handleAssignTemplate = async () => {
    if (!selectedClient || !assignModal) return
    
    setAssigning(true)
    try {
      await CallPlanningService.assignTemplateToClient(
        selectedClient.id,
        assignModal.id,
        new Date().toISOString().split('T')[0]
      )
      
      // Success feedback
      setAssignModal(null)
      setSelectedClient(null)
      setSearchQuery('')
      
      // Refresh data
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Error assigning template:', error)
      alert(error.message || 'Er ging iets mis bij het toewijzen')
    } finally {
      setAssigning(false)
    }
  }
  
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Weet je zeker dat je dit template wilt verwijderen?')) return
    
    try {
      await CallPlanningService.deleteTemplate(templateId)
      onRefresh()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Er ging iets mis bij het verwijderen')
    }
  }
  
  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Premium Header */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: 0
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <FileText size={20} style={{ color: '#10b981' }} />
          </div>
          Call Templates
        </h2>
        
        <button
          onClick={() => setCreateModal(true)}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            borderRadius: '12px',
            border: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Plus size={18} />
          Nieuw Template
        </button>
      </div>
      
      {/* Template Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1rem'
      }}>
        {templates.map((template, index) => {
          const isHovered = hoveredCard === template.id
          
          return (
            <div
              key={template.id}
              onMouseEnter={() => setHoveredCard(template.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: isHovered 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isHovered 
                  ? '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 10px 30px rgba(0,0,0,0.2)',
                animation: `slideInUp ${300 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                opacity: 0,
                position: 'relative'
              }}
            >
              {/* Decorative gradient orb */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                filter: 'blur(30px)'
              }} />
              
              <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    {template.template_name}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: '1.5'
                  }}>
                    {template.description || 'Geen beschrijving'}
                  </p>
                </div>
                
                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Clock size={16} style={{ color: '#3b82f6' }} />
                    <div>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Calls
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#fff'
                      }}>
                        {template.total_calls}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(251, 146, 60, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(251, 146, 60, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Zap size={16} style={{ color: '#fb923c' }} />
                    <div>
                      <p style={{ 
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '0.25rem'
                      }}>
                        Bonus
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#fff'
                      }}>
                        {template.bonus_calls_allowed}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <button
                    onClick={() => setEditModal(template)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      borderRadius: '10px',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Edit size={16} />
                    Bewerk
                  </button>
                  
                  <button
                    onClick={() => setAssignModal(template)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      e.currentTarget.style.color = '#10b981'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Users size={16} />
                    Toewijzen
                  </button>
                  
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      borderRadius: '10px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Assign Modal */}
      {assignModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    Template Toewijzen
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    {assignModal.template_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAssignModal(null)
                    setSelectedClient(null)
                    setSearchQuery('')
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <X size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
                </button>
              </div>
            </div>
            
            {/* Search Input */}
            <div style={{ padding: '1.5rem 1.5rem 0' }}>
              <div style={{
                position: 'relative'
              }}>
                <Search size={20} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.4)'
                }} />
                <input
                  type="text"
                  placeholder="Zoek client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  autoFocus
                />
              </div>
            </div>
            
            {/* Client List */}
            <div style={{
              flex: 1,
              padding: '1rem 1.5rem',
              overflowY: 'auto',
              maxHeight: '400px'
            }}>
              {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(16, 185, 129, 0.2)',
                    borderTopColor: '#10b981',
                    borderRadius: '50%',
                    margin: '0 auto',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
                    Clients laden...
                  </p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Users size={40} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {searchQuery ? 'Geen clients gevonden' : 'Geen clients beschikbaar'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id
                    
                    return (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        style={{
                          padding: '1rem',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.transform = 'translateX(4px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                            e.currentTarget.style.transform = 'translateX(0)'
                          }
                        }}
                      >
                        <div>
                          <p style={{
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '0.25rem'
                          }}>
                            {client.display_name}
                          </p>
                          {client.email && (
                            <p style={{
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.5)'
                            }}>
                              {client.email}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={14} style={{ color: '#fff' }} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  setAssignModal(null)
                  setSelectedClient(null)
                  setSearchQuery('')
                }}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.8)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Annuleren
              </button>
              
              <button
                onClick={handleAssignTemplate}
                disabled={!selectedClient || assigning}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: !selectedClient || assigning
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: !selectedClient || assigning ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: !selectedClient || assigning ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedClient && !assigning) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedClient && !assigning) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {assigning ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Toewijzen...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Template Toewijzen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Template Modal */}
      {createModal && (
        <CreateTemplateModal
          onClose={() => setCreateModal(false)}
          onSave={() => {
            setCreateModal(false)
            onRefresh()
          }}
        />
      )}
      
      {/* Edit Template Modal */}
      {editModal && (
        <CreateTemplateModal
          template={editModal}
          onClose={() => setEditModal(null)}
          onSave={() => {
            setEditModal(null)
            onRefresh()
          }}
        />
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
