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
    } catch (error) {
      console.error('❌ Mark reviewed error:', error)
      alert('❌ Fout: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Coach stuurt bericht naar client n.a.v. een check-in. Slaat het bericht
  // op de check-in op (komt onderaan PDF) én pusht via notifications-tabel
  // zodat client het in de NotificationWidget ziet. Optioneel markeert het
  // de check-in tegelijk als 'reviewed' (vanuit "verstuur & markeer").
  const handleSendFeedback = async ({ message, markAsReviewed: alsoReview }) => {
    if (!selectedCheckin || !message?.trim()) return false
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      const coachId = user?.id || selectedCheckin.coach_id

      // 1) Save coach_message op de check-in (zichtbaar in PDF + detail view)
      const updates = { coach_message: message.trim() }
      if (alsoReview) {
        updates.status = 'reviewed'
        updates.reviewed_at = new Date().toISOString()
      }
      await service.updateCheckin(selectedCheckin.id, updates)

      // 2) Push naar client via notifications-tabel (NotificationWidget)
      const clientName = `${selectedCheckin.clients?.first_name || ''} ${selectedCheckin.clients?.last_name || ''}`.trim()
      await db.notifications.sendManualNotification({
        clientId: selectedCheckin.client_id,
        coachId,
        title: 'Bericht van je coach',
        message: message.trim(),
        pageContext: 'all',
        priority: 'high',
      })

      // 3) Lokale state updaten
      setCheckins(prev => prev.map(c =>
        c.id === selectedCheckin.id ? { ...c, ...updates } : c
      ))
      setSelectedCheckin(prev => ({ ...prev, ...updates }))
      return true
    } catch (error) {
      console.error('❌ Send feedback error:', error)
      alert('❌ Versturen mislukt: ' + error.message)
      return false
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
          onSendFeedback={handleSendFeedback}
          onExportPDF={handleExportPDF}
          saving={saving}
        />
      )}
    </div>
  )
}
