// src/modules/lead-magnet/LeadMessageFlow.jsx
// COMPLETE FINAL VERSION - Alle 7 fasen geïntegreerd

import { useState } from 'react'
import { Search, X, ArrowLeft } from 'lucide-react'
import { MESSAGE_DATABASE } from './data/messageDatabase'
import MessageCard from './components/MessageCard'
import { 
  IntroScreen, 
  OpenersView, 
  QualifyView,
  CallPushView,
  BezwarenView,
  CallAdminView,
  SimpleMessageList 
} from './components/PhaseViews'

export default function LeadMessageFlow() {
  const isMobile = window.innerWidth <= 768
  const [currentPhase, setCurrentPhase] = useState('intro')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  const handleCopy = (text, id) => {
    const processedText = text.replace(/\[naam\]/gi, '[NAAM HIER]')
    navigator.clipboard.writeText(processedText)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const searchAllMessages = (query) => {
    if (!query.trim()) return []
    const results = []
    const lowerQuery = query.toLowerCase()
    
    Object.entries(MESSAGE_DATABASE.openers).forEach(([scenario, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
          results.push({ ...msg, category: `Opening - ${scenario}`, color: '#10b981' })
        }
      })
    })
    
    Object.entries(MESSAGE_DATABASE.qualify).forEach(([cat, data]) => {
      data.messages.forEach(msg => {
        if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
          results.push({ ...msg, category: `Qualify - ${cat}`, color: '#3b82f6', trigger: data.trigger, triggerLabel: data.triggerLabel })
        }
      })
    })
    
    Object.entries(MESSAGE_DATABASE.callPush).forEach(([style, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
          results.push({ ...msg, category: `Call Push - ${style}`, color: '#8b5cf6' })
        }
      })
    })
    
    Object.entries(MESSAGE_DATABASE.bezwaren).forEach(([type, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
          results.push({ ...msg, category: `Bezwaren - ${type}`, color: '#ef4444' })
        }
      })
    })
    
    MESSAGE_DATABASE.followUp.forEach(msg => {
      if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
        results.push({ ...msg, category: `Follow-up - ${msg.phase}`, color: '#f59e0b' })
      }
    })
    
    MESSAGE_DATABASE.waarde.forEach(msg => {
      if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
        results.push({ ...msg, category: `Waarde - ${msg.type}`, color: '#ec4899' })
      }
    })
    
    Object.entries(MESSAGE_DATABASE.callAdmin).forEach(([type, msgs]) => {
      msgs.forEach(msg => {
        if (msg.text.toLowerCase().includes(lowerQuery) || msg.label.toLowerCase().includes(lowerQuery)) {
          results.push({ ...msg, category: `Call Admin - ${type}`, color: '#06b6d4' })
        }
      })
    })
    
    return results
  }
  
  const searchResults = searchOpen ? searchAllMessages(searchQuery) : []
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)', paddingBottom: isMobile ? '100px' : '2rem' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', padding: isMobile ? '1rem' : '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '900', color: '#10b981', margin: 0 }}>DM MESSAGE FLOW</h1>
            <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0, marginTop: '0.25rem' }}>120+ berichten systeem</p>
          </div>
          {currentPhase !== 'intro' && (
            <button onClick={() => setSearchOpen(true)} style={{ width: isMobile ? '40px' : '44px', height: isMobile ? '40px' : '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', touchAction: 'manipulation' }}>
              <Search size={isMobile ? 18 : 20} color="#10b981" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem' }}>
        {currentPhase === 'intro' && <IntroScreen onSelectPhase={setCurrentPhase} />}
        {currentPhase === 'openers' && <OpenersView messages={MESSAGE_DATABASE} onCopy={handleCopy} copiedId={copiedId} onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'qualify' && <QualifyView messages={MESSAGE_DATABASE} onCopy={handleCopy} copiedId={copiedId} onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'callPush' && <CallPushView messages={MESSAGE_DATABASE} onCopy={handleCopy} copiedId={copiedId} onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'bezwaren' && <BezwarenView messages={MESSAGE_DATABASE} onCopy={handleCopy} copiedId={copiedId} onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'followUp' && <SimpleMessageList messages={MESSAGE_DATABASE.followUp} onCopy={handleCopy} copiedId={copiedId} color="#f59e0b" title="📈 Follow-up Timeline" onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'waarde' && <SimpleMessageList messages={MESSAGE_DATABASE.waarde} onCopy={handleCopy} copiedId={copiedId} color="#ec4899" title="🔥 Waarde Toevoegen" onBack={() => setCurrentPhase('intro')} />}
        {currentPhase === 'callAdmin' && <CallAdminView messages={MESSAGE_DATABASE} onCopy={handleCopy} copiedId={copiedId} onBack={() => setCurrentPhase('intro')} />}
      </div>
      
      {searchOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)', zIndex: 1000, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
              <input type="text" placeholder="Zoek door alle 120+ berichten..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus style={{ flex: 1, padding: isMobile ? '1rem' : '1.25rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#fff', fontSize: isMobile ? '0.95rem' : '1rem', outline: 'none' }} />
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} style={{ width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', touchAction: 'manipulation', minHeight: '44px' }}>
                <X size={isMobile ? 20 : 24} color="#ef4444" strokeWidth={2.5} />
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.875rem' : '1rem' }}>
                {searchResults.map(msg => (
                  <MessageCard key={msg.id} message={msg} onCopy={handleCopy} isCopied={copiedId === msg.id} color={msg.color} showCategory={true} categoryLabel={msg.category} trigger={msg.trigger} triggerLabel={msg.triggerLabel} />
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.95rem' : '1rem' }}>Geen resultaten voor "{searchQuery}"</div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.95rem' : '1rem' }}>Typ om te zoeken...</div>
            )}
          </div>
        </div>
      )}
      
      {isMobile && currentPhase !== 'intro' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)', backdropFilter: 'blur(20px)', padding: '1rem', borderTop: '1px solid rgba(16, 185, 129, 0.3)', zIndex: 100, display: 'flex', justifyContent: 'space-around' }}>
          <button onClick={() => setCurrentPhase('intro')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#10b981', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', minHeight: '44px' }}>
            <ArrowLeft size={16} />MENU
          </button>
        </div>
      )}
    </div>
  )
}
