import React, { useState, useEffect } from 'react'
import { X, Plus, Clock, Zap, Calendar, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import CallPlanningService from '../../CallPlanningService'

// MY ARC Standaard Template
const STANDARD_TEMPLATE = {
  template_name: '6 Calls Transformatie Programma',
  description: 'Complete begeleiding van intake tot eindresultaat - MY ARC standaard programma',
  total_calls: 6,
  bonus_calls_allowed: 2,
  items: [
    {
      call_title: 'Kennismaking + Doelstelling',
      client_subject: 'We gaan kennismaken, je doelen bespreken en kijken wat jij wilt bereiken met MY ARC',
      coach_subject: 'Basisgegevens noteren, Client hub invullen, Doelen: wat wil bereiken/waarom/gevoel/motivatie, Workout info: ervaring/voorkeuren/frequentie, Meal plan info: dieet ervaring/wensen/budget, Accountability bespreken, Uitleg programma + app + systeem',
      calendly_link: '',
      week_number: 1
    },
    {
      call_title: 'Eerste Check-in + Aanpassingen',
      client_subject: 'We evalueren je eerste week, bespreken uitdagingen en maken eventuele aanpassingen',
      coach_subject: 'Week 1 evaluatie, Compliance check, Obstakels identificeren, Schema bijstellen indien nodig, Mindset coaching, Volgende week doelen',
      calendly_link: '',
      week_number: 2
    },
    {
      call_title: 'Progress Review + Optimalisatie',
      client_subject: 'We kijken naar je voortgang, vieren successen en optimaliseren je aanpak',
      coach_subject: 'Progress meting (gewicht/maten/kracht), Workout progressie check, Voeding evaluatie, Energy levels bespreken, Recovery optimalisatie, Motivatie boost',
      calendly_link: '',
      week_number: 4
    },
    {
      call_title: 'Halftime Evaluatie',
      client_subject: 'Halverwege evaluatie: waar sta je nu en wat zijn de volgende stappen?',
      coach_subject: 'Mid-program assessment, Doelen herdefiniëren indien nodig, Nieuwe challenges introduceren, Plateau preventie strategieën, Lifestyle integratie bespreken',
      calendly_link: '',
      week_number: 6
    },
    {
      call_title: 'Final Push Strategie',
      client_subject: 'De laatste sprint: maximale resultaten behalen in de laatste weken',
      coach_subject: 'Eindspurt planning, Intensiteit verhogen, Fine-tuning voeding, Mentale voorbereiding eindresultaat, Post-programma planning introduceren',
      calendly_link: '',
      week_number: 10
    },
    {
      call_title: 'Eindevaluatie + Toekomstplan',
      client_subject: 'Resultaten bespreken, successen vieren en plan voor de toekomst maken',
      coach_subject: 'Complete resultaten review, Before/after vergelijking, Lessons learned, Maintenance strategie, Lange termijn doelen, Vervolg programma opties',
      calendly_link: '',
      week_number: 12
    }
  ]
}

export default function CreateTemplateModal({ template = null, onClose, onSave }) {
  const [name, setName] = useState(template?.template_name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [totalCalls, setTotalCalls] = useState(template?.total_calls || 6)
  const [bonusCalls, setBonusCalls] = useState(template?.bonus_calls_allowed || 2)
  const [calls, setCalls] = useState([])
  const [saving, setSaving] = useState(false)
  const [expandedCall, setExpandedCall] = useState(null)

  // Initialize calls when component mounts or totalCalls changes
  useEffect(() => {
    if (template?.call_template_items) {
      // Editing existing template
      setCalls(template.call_template_items.map(item => ({
        number: item.call_number,
        title: item.call_title,
        clientSubject: item.client_subject,
        coachSubject: item.coach_subject,
        calendlyLink: item.calendly_link || '',
        week: item.week_number
      })))
    } else if (calls.length !== totalCalls) {
      // Creating new template or totalCalls changed
      const newCalls = []
      for (let i = 0; i < totalCalls; i++) {
        if (calls[i]) {
          newCalls.push(calls[i])
        } else {
          newCalls.push({
            number: i + 1,
            title: '',
            clientSubject: '',
            coachSubject: '',
            calendlyLink: '',
            week: Math.ceil((i + 1) * 2) // Spread calls over weeks
          })
        }
      }
      setCalls(newCalls)
    }
  }, [totalCalls, template])

  const handleQuickTemplate = () => {
    setName(STANDARD_TEMPLATE.template_name)
    setDescription(STANDARD_TEMPLATE.description)
    setTotalCalls(STANDARD_TEMPLATE.total_calls)
    setBonusCalls(STANDARD_TEMPLATE.bonus_calls_allowed)
    
    const standardCalls = STANDARD_TEMPLATE.items.map((item, i) => ({
      number: i + 1,
      title: item.call_title,
      clientSubject: item.client_subject,
      coachSubject: item.coach_subject,
      calendlyLink: item.calendly_link,
      week: item.week_number
    }))
    setCalls(standardCalls)
  }

  const updateCall = (index, field, value) => {
    const updatedCalls = [...calls]
    updatedCalls[index][field] = value
    setCalls(updatedCalls)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Template naam is verplicht')
      return
    }

    setSaving(true)
    try {
      const templateData = {
        template_name: name,
        description,
        total_calls: parseInt(totalCalls),
        bonus_calls_allowed: parseInt(bonusCalls),
        items: calls.map(call => ({
          call_title: call.title,
          client_subject: call.clientSubject,
          coach_subject: call.coachSubject,
          calendly_link: call.calendlyLink,
          week_number: parseInt(call.week)
        }))
      }

      if (template) {
        await CallPlanningService.updateTemplate(template.id, templateData)
      } else {
        await CallPlanningService.createTemplate(templateData)
      }

      onSave()
    } catch (error) {
      console.error('Error saving template:', error)
      alert(error.message || 'Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%)',
        borderRadius: '20px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                {template ? 'Template Bewerken' : 'Nieuw Call Template'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                Configureer je call programma met onderwerpen en planning
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
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
              <X size={24} style={{ color: '#fff' }} />
            </button>
          </div>

          {/* Quick Template Button */}
          {!template && (
            <button
              onClick={handleQuickTemplate}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(234, 88, 12, 0.15) 100%)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: '12px',
                color: '#fb923c',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 146, 60, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Zap size={18} />
              Quick: MY ARC 6-Call Standaard Template
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Basic Info */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <h3 style={{
              color: '#10b981',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Basis Informatie
            </h3>

            {/* Template Name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '0.5rem'
              }}>
                Template Naam *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv: 6 Calls Transformatie Programma"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
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
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '0.5rem'
              }}>
                Beschrijving
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Korte beschrijving van het programma"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)'
                  e.target.style.background = 'rgba(255,255,255,0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* Numbers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.5rem'
                }}>
                  <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', color: '#3b82f6' }} />
                  Aantal Calls
                </label>
                <input
                  type="number"
                  value={totalCalls}
                  onChange={(e) => setTotalCalls(parseInt(e.target.value) || 1)}
                  min="1"
                  max="12"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.5rem'
                }}>
                  <Zap size={16} style={{ display: 'inline', marginRight: '0.5rem', color: '#fb923c' }} />
                  Bonus Calls
                </label>
                <input
                  type="number"
                  value={bonusCalls}
                  onChange={(e) => setBonusCalls(parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(251, 146, 60, 0.1)',
                    border: '1px solid rgba(251, 146, 60, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Calls Configuration */}
          <div>
            <h3 style={{
              color: '#10b981',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FileText size={18} />
              Call Planning ({calls.length} calls)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {calls.map((call, index) => (
                <div
                  key={index}
                  style={{
                    background: expandedCall === index 
                      ? 'rgba(16, 185, 129, 0.05)' 
                      : 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    border: `1px solid ${expandedCall === index 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'rgba(255,255,255,0.08)'}`,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Call Header */}
                  <button
                    onClick={() => setExpandedCall(expandedCall === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '1.25rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#10b981',
                        fontSize: '1.1rem'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{
                          color: '#fff',
                          fontWeight: '600',
                          marginBottom: '0.25rem'
                        }}>
                          {call.title || `Call ${index + 1}`}
                        </h4>
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          Week {call.week}
                        </p>
                      </div>
                    </div>
                    {expandedCall === index ? (
                      <ChevronUp size={20} style={{ color: '#10b981' }} />
                    ) : (
                      <ChevronDown size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    )}
                  </button>

                  {/* Expanded Content */}
                  {expandedCall === index && (
                    <div style={{ padding: '0 1.25rem 1.25rem' }}>
                      {/* Call Title */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem'
                        }}>
                          Call Titel
                        </label>
                        <input
                          type="text"
                          value={call.title}
                          onChange={(e) => updateCall(index, 'title', e.target.value)}
                          placeholder="Bijv: Kennismaking + Doelstelling"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Week Number */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem'
                        }}>
                          <Calendar size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                          Week Nummer
                        </label>
                        <input
                          type="number"
                          value={call.week}
                          onChange={(e) => updateCall(index, 'week', parseInt(e.target.value) || 1)}
                          min="1"
                          max="52"
                          style={{
                            width: '150px',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Client Subject */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem'
                        }}>
                          Onderwerp voor Client (wat de client ziet)
                        </label>
                        <textarea
                          value={call.clientSubject}
                          onChange={(e) => updateCall(index, 'clientSubject', e.target.value)}
                          placeholder="Wat gaan we bespreken in deze call?"
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Coach Subject */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem'
                        }}>
                          Coach Notities (intern gebruik)
                        </label>
                        <textarea
                          value={call.coachSubject}
                          onChange={(e) => updateCall(index, 'coachSubject', e.target.value)}
                          placeholder="Interne notities, checklist items, etc."
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Calendly Link */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.7)',
                          marginBottom: '0.5rem'
                        }}>
                          Calendly Link (optioneel)
                        </label>
                        <input
                          type="url"
                          value={call.calendlyLink}
                          onChange={(e) => updateCall(index, 'calendlyLink', e.target.value)}
                          placeholder="https://calendly.com/..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
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
            onClick={handleSave}
            disabled={!name.trim() || saving}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: !name.trim() || saving
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '600',
              cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: !name.trim() || saving ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (name.trim() && !saving) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (name.trim() && !saving) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Plus size={18} />
                {template ? 'Template Bijwerken' : 'Template Aanmaken'}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
