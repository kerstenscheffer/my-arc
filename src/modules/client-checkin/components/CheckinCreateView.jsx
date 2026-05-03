// src/modules/client-checkin/components/CheckinCreateView.jsx
// Create view voor nieuwe check-ins
// Features: Client selector, 5 section cards, save functionality

import { useState } from 'react'
import {
  ArrowLeft,
  Users,
  Save,
  Utensils,
  Beer,
  Moon,
  Dumbbell,
  Sparkles,
  MessageCircle
} from 'lucide-react'
import SectionCard from './SectionCard'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Section configuratie
const SECTIONS = [
  {
    id: 'voeding',
    title: 'Voeding',
    icon: Utensils,
    description: 'Voedingsgedrag afgelopen week',
    scoreLabel: 'Hoe goed heb je afgelopen week naar je voedingsdoelen gegeten?',
    scoreHint: '1 = Slecht, helemaal niet naar plan | 10 = Perfect, 100% volgens plan'
  },
  {
    id: 'weekend',
    title: 'Weekend',
    icon: Beer,
    description: 'Weekend discipline & gedrag',
    scoreLabel: 'Hoe goed heb je het weekend onder controle gehouden?',
    scoreHint: '1 = Volledig ontspoord | 10 = Perfect op schema gebleven'
  },
  {
    id: 'slaap',
    title: 'Slaap',
    icon: Moon,
    description: 'Slaapkwaliteit & ritme',
    scoreLabel: 'Hoe zou je je slaap deze week beoordelen?',
    scoreHint: '1 = Verschrikkelijk geslapen | 10 = Elke nacht perfect geslapen'
  },
  {
    id: 'training',
    title: 'Training',
    icon: Dumbbell,
    description: 'Workout performance & intensiteit',
    scoreLabel: 'Hoe goed waren je trainingen deze week?',
    scoreHint: '1 = Niet getraind / slechte sessies | 10 = Alle sessies top niveau'
  },
  {
    id: 'algemeen',
    title: 'Algemeen',
    icon: Sparkles,
    description: 'Energie, motivatie & overall',
    scoreLabel: 'Hoe was je energieniveau en motivatie deze week?',
    scoreHint: '1 = Compleet uitgeput en geen motivatie | 10 = Vol energie en super gemotiveerd'
  }
]

export default function CheckinCreateView({
  clients = [],
  onSave,
  onBack,
  saving = false
}) {
  const isMobile = window.innerWidth <= 768
  
  const [selectedClientId, setSelectedClientId] = useState('')
  const [expandedSections, setExpandedSections] = useState(['voeding'])
  const [coachMessage, setCoachMessage] = useState('')
  
  // Form data per sectie
  const [formData, setFormData] = useState({
    voeding: { score: 5, struggles: '', afspraken: '', coach_notes: '' },
    weekend: { score: 5, struggles: '', afspraken: '', coach_notes: '' },
    slaap: { score: 5, struggles: '', afspraken: '', coach_notes: '' },
    training: { score: 5, struggles: '', afspraken: '', coach_notes: '' },
    algemeen: { score: 5, struggles: '', afspraken: '', coach_notes: '' }
  })
  
  // Update section data
  const updateSection = (sectionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }))
  }
  
  // Toggle section expanded
  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }
  
  // Handle save
  const handleSave = () => {
    if (!selectedClientId) {
      alert('⚠️ Selecteer eerst een client')
      return
    }
    
    // Check if at least one score is set
    const hasScores = Object.values(formData).some(section => section.score !== 5)
    if (!hasScores) {
      const confirm = window.confirm('Je hebt geen scores aangepast. Toch opslaan?')
      if (!confirm) return
    }
    
    // Format data for save
    const saveData = {
      client_id: selectedClientId,
      voeding_score: formData.voeding.score,
      weekend_score: formData.weekend.score,
      slaap_score: formData.slaap.score,
      training_score: formData.training.score,
      energie_score: formData.algemeen.score,
      motivatie_score: formData.algemeen.score, // Same as energie for algemeen
      coach_message: coachMessage.trim() || null, // Persoonlijk bericht voor PDF
      // Section details als JSONB
      section_details: {
        voeding: {
          struggles: formData.voeding.struggles,
          afspraken: formData.voeding.afspraken,
          coach_notes: formData.voeding.coach_notes
        },
        weekend: {
          struggles: formData.weekend.struggles,
          afspraken: formData.weekend.afspraken,
          coach_notes: formData.weekend.coach_notes
        },
        slaap: {
          struggles: formData.slaap.struggles,
          afspraken: formData.slaap.afspraken,
          coach_notes: formData.slaap.coach_notes
        },
        training: {
          struggles: formData.training.struggles,
          afspraken: formData.training.afspraken,
          coach_notes: formData.training.coach_notes
        },
        algemeen: {
          struggles: formData.algemeen.struggles,
          afspraken: formData.algemeen.afspraken,
          coach_notes: formData.algemeen.coach_notes
        }
      }
    }
    
    onSave?.(saveData)
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <ArrowLeft size={18} />
          Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          Nieuwe Check-in
        </h2>
        
        <div style={{ width: isMobile ? '100%' : 'auto' }} />
      </div>
      
      {/* Client Selector */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`,
        borderRadius: '16px',
        border: `1px solid ${GOLD.border}`,
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
        }} />
        
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          color: GOLD.primary,
          marginBottom: '0.75rem'
        }}>
          <Users size={18} />
          Selecteer Client
        </label>
        
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${selectedClientId ? GOLD.borderActive : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '56px',
            outline: 'none'
          }}
        >
          <option value="" style={{ background: '#111' }}>
            -- Kies een client --
          </option>
          {clients.map(client => (
            <option key={client.id} value={client.id} style={{ background: '#111' }}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Sections */}
      {selectedClientId && (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {SECTIONS.map((section, index) => (
              <SectionCard
                key={section.id}
                id={section.id}
                title={section.title}
                description={section.description}
                icon={section.icon}
                scoreLabel={section.scoreLabel}
                scoreHint={section.scoreHint}
                score={formData[section.id].score}
                onScoreChange={(val) => updateSection(section.id, 'score', val)}
                struggles={formData[section.id].struggles}
                onStrugglesChange={(val) => updateSection(section.id, 'struggles', val)}
                afspraken={formData[section.id].afspraken}
                onAfsprakenChange={(val) => updateSection(section.id, 'afspraken', val)}
                coachNotes={formData[section.id].coach_notes}
                onCoachNotesChange={(val) => updateSection(section.id, 'coach_notes', val)}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
          
          {/* Coach Message - Persoonlijk bericht voor PDF */}
          <div style={{
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`,
            borderRadius: '16px',
            border: `1px solid ${GOLD.border}`,
            marginBottom: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.3) 100%)`,
                border: `1px solid ${GOLD.border}`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageCircle size={18} color={GOLD.primary} />
              </div>
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '700',
                  color: GOLD.primary,
                  margin: 0
                }}>
                  Persoonlijk Bericht
                </h3>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  Dit komt onderaan de PDF als "Bericht van je Coach"
                </p>
              </div>
            </div>
            
            <textarea
              value={coachMessage}
              onChange={(e) => setCoachMessage(e.target.value)}
              placeholder="Schrijf een persoonlijk bericht voor je client... Bijvoorbeeld: 'Super goed bezig deze week! Focus komende week op...' of 'Ik zie dat slaap een uitdaging is, laten we daar volgende call extra aandacht aan geven.'"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${coachMessage ? GOLD.borderActive : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem',
              fontStyle: 'italic'
            }}>
              💡 Optioneel - Als je dit invult verschijnt het als motivatiebericht in de PDF export
            </p>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '14px',
              color: '#000',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '800',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '60px',
              boxShadow: `0 8px 32px ${GOLD.glow}`,
              opacity: saving ? 0.7 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Save size={22} />
            {saving ? 'Opslaan...' : 'Check-in Opslaan'}
          </button>
        </>
      )}
    </div>
  )
}
