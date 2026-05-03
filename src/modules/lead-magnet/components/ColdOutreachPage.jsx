// src/modules/lead-magnet/components/ColdOutreachPage.jsx
import React, { useState } from 'react'
import { 
  Target, 
  Zap, 
  Users, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function ColdOutreachPage({ 
  onBack, 
  copiedId, 
  onCopy, 
  isMobile 
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedSection, setExpandedSection] = useState('openers')

  // Cold outreach categories
  const categories = [
    { id: 'all', label: 'Alles', icon: Filter },
    { id: 'fitness', label: 'Fitness', icon: Zap },
    { id: 'business', label: 'Business', icon: TrendingUp },
    { id: 'lifestyle', label: 'Lifestyle', icon: Users }
  ]

  // COLD OUTREACH MESSAGE TEMPLATES
  const coldMessages = {
    openers: {
      title: '🎯 Eerste Contact (Openers)',
      description: 'Berichten om het gesprek te starten met iemand die je nog niet volgt',
      messages: [
        {
          id: 'cold-1',
          label: 'Compliment + Vraag',
          tags: ['fitness', 'universeel'],
          text: `Hey! 👋

Ik kwam net je profiel tegen en zag je fitness journey. Echt respect voor je consistentie!

Ben benieuwd - hoe lang ben je al bezig met trainen?`,
          note: 'Start met oprechte interesse. Geen pitch in eerste bericht!'
        },
        {
          id: 'cold-2',
          label: 'Story Reactie Opener',
          tags: ['fitness', 'warm'],
          text: `Die workout zag er killer uit! 🔥

Welk programma volg je? Zelf ook altijd op zoek naar nieuwe inspiratie.`,
          note: 'Reageer op hun story VOORDAT je dit stuurt - dan is het warm contact'
        },
        {
          id: 'cold-3',
          label: 'Gemeenschappelijke Interesse',
          tags: ['universeel'],
          text: `Hey! Zag dat je ook [specifiek onderwerp] volgt.

Hoe ben je daar in terecht gekomen? Zelf sinds kort super geïnteresseerd.`,
          note: 'Vervang [specifiek onderwerp] met iets van hun profiel'
        },
        {
          id: 'cold-4',
          label: 'Directe Vraag',
          tags: ['fitness', 'direct'],
          text: `Hey! Quick question - 

Hoe combineer je je training met je werk/studie? Zie dat je consistent post, benieuwd naar je routine.`,
          note: 'Werkt goed bij mensen die duidelijk actief zijn'
        },
        {
          id: 'cold-5',
          label: 'Lokale Connectie',
          tags: ['lifestyle', 'lokaal'],
          text: `Hey! Zag dat je ook uit [stad/regio] komt.

Ken je [specifieke gym/locatie]? Zoek altijd naar mensen uit de buurt om mee te connecten.`,
          note: 'Lokale angle maakt het persoonlijker'
        },
        {
          id: 'cold-6',
          label: 'Reel/Post Compliment',
          tags: ['fitness', 'content'],
          text: `Yo die reel over [onderwerp] was on point! 💪

Hoe lang doe je dit al? Content is echt solid.`,
          note: 'Specifiek zijn over welke content je bedoelt'
        }
      ]
    },
    followups: {
      title: '💬 Follow-up Berichten',
      description: 'Als ze reageren op je opener - zo bouw je het gesprek op',
      messages: [
        {
          id: 'follow-1',
          label: 'Na Positieve Reactie',
          tags: ['universeel'],
          text: `Nice! Dat is echt gaaf.

Wat is je biggest win tot nu toe? Altijd benieuwd naar de journey van anderen.`,
          note: 'Blijf vragen stellen, nog geen pitch'
        },
        {
          id: 'follow-2',
          label: 'Verdieping Fitness',
          tags: ['fitness'],
          text: `Ah interessant! En hoe gaat het met je progressie?

Zelf merk ik dat [deel iets persoonlijks] - herken je dat?`,
          note: 'Deel ook iets van jezelf om connectie te bouwen'
        },
        {
          id: 'follow-3',
          label: 'Transitie naar Value',
          tags: ['business', 'fitness'],
          text: `Man, ik herken dat 100%! Had precies hetzelfde.

Wat heeft jou het meest geholpen om door te breken?`,
          note: 'Laat ZIJ eerst hun struggles/wins delen'
        },
        {
          id: 'follow-4',
          label: 'Na Struggle Delen',
          tags: ['fitness', 'transitie'],
          text: `Ah man, dat is frustrerend. Echt herkenbaar.

Heb je al geprobeerd om [specifieke tip]? Dat hielp mij enorm toen ik daar zat.`,
          note: 'Geef waarde VOORDAT je pitch - dit bouwt trust'
        },
        {
          id: 'follow-5',
          label: 'Ze Vragen Wat Je Doet',
          tags: ['business', 'transitie'],
          text: `Ik help mensen met hun fitness/voeding journey! 💪

Maar los daarvan - vertel, waar wil jij naartoe? Wat is je doel?`,
          note: 'Beantwoord kort, draai gesprek terug naar hen'
        }
      ]
    },
    valueFirst: {
      title: '🎁 Value-First Berichten',
      description: 'Berichten die waarde geven zonder direct te verkopen',
      messages: [
        {
          id: 'value-1',
          label: 'Gratis Tip Delen',
          tags: ['fitness', 'value'],
          text: `Hey! Zag je post over [onderwerp].

Quick tip die mij echt hielp: [specifieke tip]

Geen idee of het voor jou werkt, maar voor mij was het een game-changer.`,
          note: 'Geef waarde zonder iets terug te verwachten'
        },
        {
          id: 'value-2',
          label: 'Resource Delen',
          tags: ['fitness', 'business'],
          text: `Hey! Dacht aan je toen ik dit zag.

[Link/tip/resource]

Leek me iets voor jou based on je profiel. Laat maar weten wat je ervan vindt!`,
          note: 'Personaliseer de resource naar hun situatie'
        },
        {
          id: 'value-3',
          label: 'Uitnodiging Zonder Druk',
          tags: ['community'],
          text: `Hey! We hebben een kleine community van mensen die ook bezig zijn met [onderwerp].

Geen sales of iets - gewoon mensen die elkaar helpen. 

Interesse om een keer mee te kijken?`,
          note: 'Community invite voelt minder als pitch'
        },
        {
          id: 'value-4',
          label: 'Gratis PDF/Guide Aanbieden',
          tags: ['fitness', 'lead magnet'],
          text: `Hey! Ik heb recent een gratis guide gemaakt over [onderwerp].

Denk dat het je kan helpen met [hun struggle]. Wil je hem hebben?`,
          note: 'Lead magnet - vraag EERST of ze interesse hebben'
        }
      ]
    },
    softPitch: {
      title: '🎯 Soft Pitch (Na Rapport)',
      description: 'Pas gebruiken NA meerdere gesprekken en opgebouwde connectie',
      messages: [
        {
          id: 'pitch-1',
          label: 'Hulp Aanbieden',
          tags: ['fitness', 'coaching'],
          text: `Hey, ik denk de laatste tijd na over ons gesprek.

Ik help mensen met exact dit soort challenges. Zou je er open voor staan als ik eens meekijk naar je situatie?

Geen pressure - gewoon omdat ik denk dat ik kan helpen.`,
          note: 'Alleen NA 3+ positieve interacties'
        },
        {
          id: 'pitch-2',
          label: 'Subtiele Transitie',
          tags: ['universeel'],
          text: `Weet je, ik merk dat je echt serieus bent over [goal].

Ik werk zelf ook met mensen die hetzelfde willen. Misschien kunnen we eens bellen om te kijken of ik je ergens mee kan helpen?

Totaal vrijblijvend.`,
          note: 'Bellen aanbieden is laagdrempeliger dan "coaching verkopen"'
        },
        {
          id: 'pitch-3',
          label: 'Case Study Mention',
          tags: ['fitness', 'social proof'],
          text: `Dit herinnert me aan een client van me die exact hetzelfde had.

Hij/zij deed [specifieke actie] en binnen [tijdsframe] was [resultaat].

Als je wil kan ik je vertellen wat voor hem/haar werkte?`,
          note: 'Social proof via verhalen, niet via claims'
        },
        {
          id: 'pitch-4',
          label: 'Direct Maar Respectvol',
          tags: ['business', 'direct'],
          text: `Hey, ik ga gewoon eerlijk zijn.

Ik denk dat ik je kan helpen met [specifiek probleem]. Geen harde sales - gewoon een gesprek om te kijken of het klikt.

Interesse?`,
          note: 'Werkt bij mensen die directheid waarderen'
        }
      ]
    },
    doNotDo: {
      title: '🚫 Wat Je NIET Moet Doen',
      description: 'Voorbeelden van slechte cold outreach - leer hiervan',
      messages: [
        {
          id: 'bad-1',
          label: '❌ Te Direct Verkopen',
          tags: ['vermijd'],
          text: `Hey! Ik ben personal trainer en help mensen afvallen.

Ik zie dat je ook aan fitness doet. Wil je een gratis consultatie?`,
          note: 'Dit is spam. Geen rapport, geen waarde, direct pitch.'
        },
        {
          id: 'bad-2',
          label: '❌ Copy-Paste Vibes',
          tags: ['vermijd'],
          text: `Hey [naam]! 

Ik kwam je profiel tegen en dacht dat we moeten connecten. Ik help [type persoon] met [resultaat]. 

Wil je meer weten?`,
          note: 'Dit SCHREEUWT template. Mensen voelen dit direct.'
        },
        {
          id: 'bad-3',
          label: '❌ Te Lang Eerste Bericht',
          tags: ['vermijd'],
          text: `Hey! Mijn naam is [naam] en ik ben al 5 jaar personal trainer. Ik heb geholpen met meer dan 100 clients en mijn specialiteit is [etc etc etc]...

[3 paragrafen later]

Dus als je interesse hebt, laat het weten!`,
          note: 'Niemand leest dit. Eerste bericht = KORT en engaging.'
        },
        {
          id: 'bad-4',
          label: '❌ Fake Complimenten',
          tags: ['vermijd'],
          text: `OMG je profiel is AMAZING!! 😍😍

Je bent echt een inspiratie! Ik moet je iets vertellen...`,
          note: 'Overdreven complimenten zijn obvious en creepy.'
        }
      ]
    }
  }

  const sections = Object.entries(coldMessages)

  const toggleSection = (key) => {
    setExpandedSection(expandedSection === key ? null : key)
  }

  // Filter messages by category
  const filterMessages = (messages) => {
    if (activeCategory === 'all') return messages
    return messages.filter(msg => 
      msg.tags.some(tag => tag.toLowerCase().includes(activeCategory))
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000'
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
      >
        <ArrowLeft size={18} />
        Terug naar menu
      </button>

      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)',
          borderRadius: '16px',
          marginBottom: '1rem',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.2)'
        }}>
          <Target size={isMobile ? 28 : 32} color="#f97316" />
        </div>
        
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Cold Outreach
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Berichten voor mensen die je nog niet volgen
        </p>
      </div>

      {/* Warning Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255,255,255,0.8)',
          margin: 0,
          lineHeight: 1.5
        }}>
          <strong style={{ color: '#ef4444' }}>Gebruik met respect!</strong> Cold DMs kunnen als spam overkomen. 
          Max 5-10 per dag, altijd personaliseren.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
              background: activeCategory === cat.id 
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'rgba(255,255,255,0.05)',
              border: activeCategory === cat.id 
                ? 'none'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: activeCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Golden Rule Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '700',
          color: '#f59e0b',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 De Gouden Regel
        </h3>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6,
          margin: 0
        }}>
          <strong style={{ color: '#f59e0b' }}>Geen pitch in eerste 3 berichten.</strong>
          {' '}Bouw eerst rapport op. Stel vragen. Toon interesse. 
          Mensen kopen van mensen die ze vertrouwen.
        </p>
      </div>

      {/* Message Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map(([key, section]) => {
          const filteredMessages = filterMessages(section.messages)
          if (filteredMessages.length === 0 && activeCategory !== 'all') return null
          
          const isExpanded = expandedSection === key
          const isDanger = key === 'doNotDo'
          
          return (
            <div 
              key={key}
              style={{
                background: isDanger 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                  : 'rgba(17, 17, 17, 0.5)',
                border: isDanger 
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    color: isDanger ? '#ef4444' : '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {section.title}
                  </h2>
                  <p style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    margin: 0
                  }}>
                    {section.description}
                  </p>
                </div>
                
                <div style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  flexShrink: 0,
                  marginLeft: '1rem'
                }}>
                  {isExpanded ? (
                    <ChevronUp size={18} color="rgba(255,255,255,0.7)" />
                  ) : (
                    <ChevronDown size={18} color="rgba(255,255,255,0.7)" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div style={{
                  padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem'
                }}>
                  {filteredMessages.map(msg => (
                    <MessageTemplate
                      key={msg.id}
                      id={msg.id}
                      text={msg.text}
                      label={msg.label}
                      note={msg.note}
                      tags={msg.tags}
                      copiedId={copiedId}
                      onCopy={onCopy}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pro Tips Footer */}
      <div style={{
        marginTop: '2rem',
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          💡 Pro Tips voor Cold Outreach
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[
            'Warm ze eerst op via story views/likes voordat je DM stuurt',
            'Personaliseer ALTIJD - noem iets specifieks van hun profiel',
            'Stuur niet meer dan 5-10 cold DMs per dag (anders flag als spam)',
            'Best times: 8-9 AM of 7-9 PM lokale tijd',
            'Als ze niet reageren na 1 follow-up: stop. Geen 3e bericht.'
          ].map((tip, i) => (
            <div 
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: '#10b981',
                fontWeight: '700',
                flexShrink: 0
              }}>
                {i + 1}
              </div>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                lineHeight: 1.5
              }}>
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
