// src/modules/client-checkin/CoachCheckinDashboard.jsx
// REFACTORED: Main dashboard als router met modulaire components
// Features: View routing, state management, data loading

import { useState, useEffect } from 'react'
import CheckinService from './CheckinService'
import { openCheckinForPrint } from './CheckinPDFGenerator'
import CheckinListView from './components/CheckinListView'
import CheckinCreateView from './components/CheckinCreateView'
import CheckinDetailView from './components/CheckinDetailView'

export default function CoachCheckinDashboard({ db, clients }) {
  const [loading, setLoading] = useState(true)
  const [checkins, setCheckins] = useState([])
  const [view, setView] = useState('list') // 'list' | 'create' | 'detail'
  const [selectedCheckin, setSelectedCheckin] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const service = new CheckinService(db)
  
  // Load check-ins on mount
  useEffect(() => {
    loadCheckins()
  }, [])
  
  const loadCheckins = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (user) {
        const data = await service.getCoachCheckins(user.id)
        setCheckins(data)
      }
    } catch (error) {
      console.error('❌ Error loading check-ins:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle create new check-in
  const handleCreateNew = () => {
    setSelectedCheckin(null)
    setView('create')
  }
  
  // Handle select check-in from list
  const handleSelectCheckin = (checkin) => {
    setSelectedCheckin(checkin)
    setView('detail')
  }
  
  // Handle save new check-in
  const handleSaveCheckin = async (formData) => {
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      const selectedClient = clients.find(c => c.id === formData.client_id)
      
      await service.createCheckin({
        ...formData,
        coach_id: user?.id || selectedClient?.trainer_id,
        status: 'reviewed',
        reviewed_at: new Date().toISOString()
      })
      
      alert('✅ Check-in opgeslagen!')
      await loadCheckins()
      setView('list')
    } catch (error) {
      console.error('❌ Save error:', error)
      alert('❌ Fout bij opslaan: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Handle mark as reviewed
  const handleMarkReviewed = async () => {
    if (!selectedCheckin) return
    
    setSaving(true)
    try {
      await service.markAsReviewed(selectedCheckin.id)
      
      // Update local state
      setCheckins(prev => prev.map(c =>
        c.id === selectedCheckin.id
          ? { ...c, status: 'reviewed', reviewed_at: new Date().toISOString() }
          : c
      ))
      setSelectedCheckin(prev => ({
        ...prev,
        status: 'reviewed',
        reviewed_at: new Date().toISOString()
      }))
      
      alert('✅ Check-in gemarkeerd als bekeken')
    } catch (error) {
      console.error('❌ Mark reviewed error:', error)
      alert('❌ Fout: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  // Handle PDF export
  const handleExportPDF = () => {
    if (!selectedCheckin) return
    
    const clientName = `${selectedCheckin.clients?.first_name || ''} ${selectedCheckin.clients?.last_name || ''}`.trim()
    openCheckinForPrint(selectedCheckin, clientName)
  }
  
  // Handle back navigation
  const handleBack = () => {
    setSelectedCheckin(null)
    setView('list')
  }
  
  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: '3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(255, 215, 0, 0.3)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  // Render based on view
  return (
    <div>
      {view === 'list' && (
        <CheckinListView
          checkins={checkins}
          onSelectCheckin={handleSelectCheckin}
          onCreateNew={handleCreateNew}
        />
      )}
      
      {view === 'create' && (
        <CheckinCreateView
          clients={clients}
          onSave={handleSaveCheckin}
          onBack={handleBack}
          saving={saving}
        />
      )}
      
      {view === 'detail' && selectedCheckin && (
        <CheckinDetailView
          checkin={selectedCheckin}
          onBack={handleBack}
          onMarkReviewed={handleMarkReviewed}
          onExportPDF={handleExportPDF}
          saving={saving}
        />
      )}
    </div>
  )
}
