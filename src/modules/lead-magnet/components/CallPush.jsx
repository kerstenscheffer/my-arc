// src/modules/lead-magnet/components/CallPush.jsx
import React, { useState } from 'react'
import { Phone, Calendar, ArrowLeft, Clock } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function CallPush({ onBack, copiedId, onCopy, isMobile }) {
  const [activeSubSection, setActiveSubSection] = useState(null)

  const BackButton = ({ onClick, label = "Terug" }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '1.5rem',
        touchAction: 'manipulation'
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  )

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: `2px solid ${color}40`
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      <h2 style={{
        color: '#fff',
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        margin: 0
      }}>
        {title}
      </h2>
    </div>
  )

  const SubSectionButton = ({ label, onClick, color = '#8b5cf6' }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}40`,
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '600',
        fontSize: isMobile ? '0.9rem' : '0.95rem',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
    >
      {label}
    </button>
  )

  const Divider = ({ text }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.5rem 0'
    }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600' }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  )

  // MAIN MENU
  if (!activeSubSection) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <SectionHeader icon={Phone} title="Call Push Berichten" color="#8b5cf6" />
        
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: '600' }}>
            🎯 DOEL: Gesprek → Call booking. Geef altijd concrete tijden!
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubSectionButton 
            label="📞 Call Push - Met tijdslots" 
            onClick={() => setActiveSubSection('tijdslots')}
          />
          <SubSectionButton 
            label="💬 Call Push - Soft approach" 
            onClick={() => setActiveSubSection('soft')}
          />
          <SubSectionButton 
            label="🔥 Call Push - Direct & urgent" 
            onClick={() => setActiveSubSection('direct')}
          />
          <SubSectionButton 
            label="📧 Mailadres vragen" 
            onClick={() => setActiveSubSection('mailadres')}
          />
          <SubSectionButton 
            label="✅ Bevestiging & Reminders" 
            onClick={() => setActiveSubSection('bevestiging')}
          />
        </div>
      </div>
    )
  }

  // SUB SECTIONS
  const subSections = {
    'tijdslots': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Calendar} title="Call Push - Met Tijdslots" color="#8b5cf6" />

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
            💡 Pas de dagen/tijden aan naar jouw beschikbaarheid!
          </div>
        </div>

        <MessageTemplate
          id="push-tijd-1"
          label="Variant A - Afvallen focus"
          text={`Top man! Fijn dat je open staat voor hulp 💪

Laten we even bellen, dan kijk ik wat jij nodig hebt qua voeding om af te vallen én spieren te behouden. Scheelt jou het uitzoeken!

Ik kan volgende week op:
- Woensdag: 18:00 of 19:00
- Donderdag: 17:00 of 20:00
- Vrijdag: 16:00 of 18:00

Laat maar weten wat jou het beste uitkomt 😊`}
          tags={['afvallen', 'call', 'tijdslots']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-tijd-2"
          label="Variant B - Bulken focus"
          text={`Nice man! Goed dat je er serieus mee bezig wilt 💪

Laten we even kort bellen, dan reken ik uit wat jij nodig hebt om aan te komen in spiermassa zonder te veel vet. Kost maar een kwartiertje!

Ik heb plek op:
- Dinsdag: 17:00 of 19:00
- Woensdag: 18:00 of 20:00
- Zaterdag: 11:00 of 14:00

Welke past jou? 😊`}
          tags={['bulken', 'call', 'tijdslots']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-tijd-3"
          label="Variant C - Algemeen"
          text={`Top! Laten we even bellen, dan kijk ik waar je nu staat en wat voor jou het beste werkt 💪

Scheelt jou een hoop uitzoekwerk!

Ik kan op:
- Woensdag: 18:00 of 19:30
- Donderdag: 17:00 of 20:00
- Vrijdag: 16:00 of 18:00

Wat past jou het beste? 😊`}
          tags={['algemeen', 'call', 'tijdslots']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-tijd-4"
          label="Variant D - Kort & krachtig"
          text={`Zullen we even bellen? Dan help ik je op weg 💪

Kan op:
- Wo 18:00
- Do 17:00 of 20:00
- Vr 18:00

Laat maar weten!`}
          tags={['kort', 'call', 'tijdslots']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-tijd-5"
          label="Variant E - Weekend optie"
          text={`Top man! Laten we even kort bellen, dan kijk ik wat jij nodig hebt 💪

Deze week kan ik op:
- Donderdag: 19:00 of 20:30
- Vrijdag: 17:00 of 19:00
- Zaterdag: 10:00 of 12:00

Welke dag schikt jou? 😊`}
          tags={['weekend', 'call', 'tijdslots']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'soft': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Phone} title="Call Push - Soft Approach" color="#8b5cf6" />

        <MessageTemplate
          id="push-soft-1"
          label="Variant A - Hulp aanbieden"
          text={`Als je wilt kan ik je een beetje op weg helpen 😊

Ik help vaker jongens die net beginnen of ergens vastlopen. Gewoon even kijken waar je staat en wat voor jou zou werken.

Zou je dat handig vinden? 💪`}
          tags={['soft', 'hulp', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-soft-2"
          label="Variant B - Vrijblijvend"
          text={`Weet je wat, als je wilt kunnen we even kort bellen 😊

Puur om te kijken of ik je ergens mee kan helpen. Helemaal vrijblijvend hoor!

Zou je dat zien zitten?`}
          tags={['soft', 'vrijblijvend', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-soft-3"
          label="Variant C - Duidelijkheid geven"
          text={`Ik denk dat een korte call het makkelijkst is om je verder te helpen 😊

Dan kan ik je een paar vragen stellen en kijken wat voor jou het beste zou werken. Kost maar 15 minuutjes!

Wat denk je?`}
          tags={['soft', 'duidelijkheid', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-soft-4"
          label="Variant D - Waarde eerst"
          text={`Ik kan je wel wat tips geven via chat, maar eerlijk gezegd werkt een kort gesprek veel beter 😊

Dan kan ik precies horen waar je tegenaan loopt en je echt op weg helpen.

Heb je ergens deze week een kwartiertje?`}
          tags={['soft', 'waarde', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'direct': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Phone} title="Call Push - Direct & Urgent" color="#8b5cf6" />

        <MessageTemplate
          id="push-direct-1"
          label="Variant A - Direct"
          text={`Oké dit is wat we gaan doen - we plannen even een call in 💪

Dan reken ik uit wat jij nodig hebt en maak ik een plan voor je. Kost je 15 min max.

Wanneer kan jij?`}
          tags={['direct', 'urgent', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-direct-2"
          label="Variant B - Urgentie"
          text={`Weet je wat man, laten we gewoon even bellen 💪

Hoe langer je wacht, hoe langer je blijft gokken. Ik help je in een kwartiertje op weg.

Kan je morgen of overmorgen?`}
          tags={['direct', 'urgent', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="push-direct-3"
          label="Variant C - Geen excuses"
          text={`Laten we dit aanpakken man 💪

Stuur me even wanneer je kan deze week, dan plan ik je in voor een korte call. 15 minuten en je weet precies wat je moet doen.

Deal?`}
          tags={['direct', 'actie', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'mailadres': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Phone} title="Mailadres Vragen" color="#8b5cf6" />

        <MessageTemplate
          id="mail-1"
          label="Variant A - Simpel"
          text={`Top! Stuur even je mailadres, dan zet ik het vast via Calendly 💪`}
          tags={['mailadres', 'calendly']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="mail-2"
          label="Variant B - Met uitleg"
          text={`Nice! Stuur me even je mailadres, dan stuur ik je een invite voor de call 😊

Dan krijg je ook een reminder zodat je het niet vergeet!`}
          tags={['mailadres', 'calendly', 'reminder']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="mail-3"
          label="Variant C - Kort"
          text={`Perfect! Je mailadres even, dan regel ik de rest 💪`}
          tags={['mailadres', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'bevestiging': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Clock} title="Bevestiging & Reminders" color="#8b5cf6" />

        <Divider text="BEVESTIGING NA BOOKING" />

        <MessageTemplate
          id="bevestig-1"
          label="Bevestiging"
          text={`Top! Ik stuur je zo de invite. Spreek je [DAG] om [TIJD]! 💪`}
          tags={['bevestiging']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
          note="Vervang [DAG] en [TIJD]"
        />

        <MessageTemplate
          id="bevestig-2"
          label="Bevestiging met info"
          text={`Perfect, staat genoteerd! 📅

Je krijgt zo een invite van mij. [DAG] om [TIJD] spreken we!

Tot dan 💪`}
          tags={['bevestiging', 'invite']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="REMINDER DAG VAN DE CALL" />

        <MessageTemplate
          id="remind-1"
          label="Reminder - Casual"
          text={`Heyy! Zie je vanavond om [TIJD]! 🤙`}
          tags={['reminder', 'casual']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="remind-2"
          label="Reminder - Check"
          text={`Yoo [NAAM]! Nog even checken, lukt het straks om [TIJD]? 😊`}
          tags={['reminder', 'check']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="remind-3"
          label="Reminder - Enthousiast"
          text={`Hey [NAAM]! Ik kijk uit naar onze call straks om [TIJD] 💪

Tot zo!`}
          tags={['reminder', 'enthousiast']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="NO-SHOW / NIET REAGEREN" />

        <MessageTemplate
          id="noshow-1"
          label="Gemiste call"
          text={`Hey [NAAM]! Ik had je net geprobeerd te bellen maar kreeg je niet te pakken 😊

Laat even weten wanneer het je beter uitkomt, dan plannen we opnieuw in!`}
          tags={['noshow', 'reschedule']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="noshow-2"
          label="Niet gereageerd"
          text={`Hey! Alles goed? We hadden een call staan maar ik hoorde niks meer van je.

Wil je hem verzetten naar een ander moment? 😊`}
          tags={['noshow', 'followup']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    )
  }

  return subSections[activeSubSection] || null
}
