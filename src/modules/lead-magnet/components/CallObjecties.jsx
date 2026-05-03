// src/modules/lead-magnet/components/CallObjecties.jsx
import React, { useState } from 'react'
import { HelpCircle, ArrowLeft, DollarSign, Clock, Brain } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function CallObjecties({ onBack, copiedId, onCopy, isMobile }) {
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

  const SubSectionButton = ({ label, onClick, color = '#ef4444' }) => (
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
        <SectionHeader icon={HelpCircle} title="Call Objecties" color="#ef4444" />
        
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: '600' }}>
            🛡️ Bezwaren na je call push? Hier zijn de antwoorden!
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubSectionButton 
            label="💰 'Is het gratis?'" 
            onClick={() => setActiveSubSection('gratis')}
          />
          <SubSectionButton 
            label="⏰ 'Heb geen tijd deze week'" 
            onClick={() => setActiveSubSection('geen-tijd')}
          />
          <SubSectionButton 
            label="🤔 'Moet erover nadenken'" 
            onClick={() => setActiveSubSection('nadenken')}
          />
          <SubSectionButton 
            label="❓ 'Wat ga je me vertellen?'" 
            onClick={() => setActiveSubSection('wat-vertellen')}
          />
          <SubSectionButton 
            label="🛒 'Is dit een sales pitch?'" 
            onClick={() => setActiveSubSection('sales')}
          />
          <SubSectionButton 
            label="😐 'Weet niet of ik dat nodig heb'" 
            onClick={() => setActiveSubSection('niet-nodig')}
          />
          <SubSectionButton 
            label="📱 'Kan het niet via chat?'" 
            onClick={() => setActiveSubSection('via-chat')}
          />
          <SubSectionButton 
            label="👎 Ze zeggen NEE" 
            onClick={() => setActiveSubSection('nee')}
          />
        </div>
      </div>
    )
  }

  // SUB SECTIONS
  const subSections = {
    'gratis': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={DollarSign} title="'Is het gratis?'" color="#ef4444" />

        <MessageTemplate
          id="gratis-1"
          label="Variant A - Direct ja"
          text={`Ja man, de call is gewoon gratis! 😊

Puur om even te kijken waar je staat en of ik je kan helpen. Geen verplichtingen ofzo!

Welke dag zou kunnen?`}
          tags={['objectie', 'gratis', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="gratis-2"
          label="Variant B - Met uitleg"
          text={`Haha ja hoor, kost je niks 😊

Het is gewoon een kennismakingsgesprek. Ik kijk waar je nu staat, wat je doel is, en of ik je ergens mee kan helpen.

Als het niks voor je is, is dat ook prima! Geen druk.

Zullen we inplannen?`}
          tags={['objectie', 'gratis', 'uitleg']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="gratis-3"
          label="Variant C - Kort"
          text={`Ja 100% gratis! Gewoon even kijken of ik je kan helpen 💪

Wanneer past jou?`}
          tags={['objectie', 'gratis', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="gratis-4"
          label="Variant D - Relaxed"
          text={`Haha geen stress man, is gewoon gratis 😊

Ik probeer niet iets te verkopen ofzo. Gewoon even kijken of ik je op weg kan helpen!`}
          tags={['objectie', 'gratis', 'relaxed']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'geen-tijd': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Clock} title="'Heb geen tijd deze week'" color="#ef4444" />

        <MessageTemplate
          id="tijd-obj-1"
          label="Variant A - Week erna"
          text={`Geen probleem! Wanneer zou volgende week wel kunnen? 😊

Dan plannen we hem gewoon iets later in.`}
          tags={['objectie', 'tijd', 'reschedule']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-obj-2"
          label="Variant B - Flexibel"
          text={`Snap ik! Hoeft ook niet per se deze week hoor 😊

Stuur maar wanneer het je beter uitkomt, dan kijk ik of ik kan.`}
          tags={['objectie', 'tijd', 'flexibel']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-obj-3"
          label="Variant C - Kort gesprek benadrukken"
          text={`Is maar 15 minuutjes hoor! 😊

Maar als het echt niet past, wanneer zou wel kunnen? Volgende week misschien?`}
          tags={['objectie', 'tijd', '15 min']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-obj-4"
          label="Variant D - Weekend optie"
          text={`Snap ik man, drukke week! 

Zou in het weekend wel kunnen? Ik heb zaterdag nog wat plekken 😊`}
          tags={['objectie', 'tijd', 'weekend']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'nadenken': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Brain} title="'Moet erover nadenken'" color="#ef4444" />

        <MessageTemplate
          id="nadenken-1"
          label="Variant A - Begrip + lichte push"
          text={`Ja snap ik! Maar het is echt maar een kwartiertje en kost niks 😊

Gewoon even kijken of ik je kan helpen. Worst case heb je wat meer duidelijkheid!

Laat maar weten als je zover bent 💪`}
          tags={['objectie', 'nadenken', 'push']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nadenken-2"
          label="Variant B - Geen druk"
          text={`Geen probleem man, neem je tijd! 😊

Als je er klaar voor bent, stuur me dan even een berichtje. Dan plannen we iets in.`}
          tags={['objectie', 'nadenken', 'relaxed']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nadenken-3"
          label="Variant C - Vraag doorvragen"
          text={`Ja is goed! Maar mag ik vragen waar je over twijfelt? 😊

Misschien kan ik je vraag nu al beantwoorden.`}
          tags={['objectie', 'nadenken', 'doorvragen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nadenken-4"
          label="Variant D - Follow-up plannen"
          text={`Oké geen probleem! Zal ik je over een paar dagen even een berichtje sturen? 😊

Dan kun je het even laten bezinken.`}
          tags={['objectie', 'nadenken', 'followup']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'wat-vertellen': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="'Wat ga je me vertellen?'" color="#ef4444" />

        <MessageTemplate
          id="vertellen-1"
          label="Variant A - Uitgebreid"
          text={`Goeie vraag! 😊

Ik ga even kijken waar je nu staat - wat je doel is, wat je nu doet, en waar je tegenaan loopt.

Dan reken ik uit wat jij nodig hebt qua voeding (calorieën, eiwitten etc.) en geef ik je wat concrete tips die je meteen kunt toepassen.

Zo weet je precies wat je moet doen in plaats van gokken!`}
          tags={['objectie', 'uitleg', 'wat']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="vertellen-2"
          label="Variant B - Kort"
          text={`Ik kijk waar je nu staat, wat je doel is, en reken uit wat jij nodig hebt 😊

Zo krijg je duidelijkheid en hoef je niet meer te gokken!`}
          tags={['objectie', 'uitleg', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="vertellen-3"
          label="Variant C - Op maat"
          text={`Even kijken wat voor jou werkt! 😊

Iedereen is anders, dus ik wil eerst weten waar je staat. Dan kan ik je tips geven die echt bij jouw situatie passen.`}
          tags={['objectie', 'uitleg', 'persoonlijk']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'sales': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="'Is dit een sales pitch?'" color="#ef4444" />

        <MessageTemplate
          id="sales-1"
          label="Variant A - Direct ontkennen"
          text={`Haha nee man, gewoon even kijken of ik je kan helpen! 😊

Als het niks voor je is dan is dat ook prima. Maar de meeste jongens vinden het handig om even duidelijkheid te krijgen.`}
          tags={['objectie', 'sales', 'ontkennen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="sales-2"
          label="Variant B - Eerlijk"
          text={`Nee hoor, geen sales call! 😊

Puur een kennismaking. Ik wil eerst weten of ik je überhaupt kan helpen voordat we het over iets anders hebben.

Gewoon relaxed even praten!`}
          tags={['objectie', 'sales', 'eerlijk']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="sales-3"
          label="Variant C - Met humor"
          text={`Haha nee man, ik ga je niet 2 uur vastpraten over een of ander pakket 😂

Gewoon 15 min kijken of ik je op weg kan helpen. Niks meer, niks minder!`}
          tags={['objectie', 'sales', 'humor']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'niet-nodig': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="'Weet niet of ik dat nodig heb'" color="#ef4444" />

        <MessageTemplate
          id="nodig-1"
          label="Variant A - Laagdrempelig"
          text={`Ja geen stress hoor! Het is maar een kwartiertje en kost je niks 😊

Puur even kijken of ik je kan helpen. Zo niet, dan heb je in ieder geval wat meer duidelijkheid!

Welke dag zou eventueel kunnen?`}
          tags={['objectie', 'niet nodig', 'laagdrempelig']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nodig-2"
          label="Variant B - Nieuwsgierigheid"
          text={`Snap ik! Maar daarom is zo'n gesprek juist handig 😊

Dan kunnen we kijken waar je staat en of er iets is waar ik je mee kan helpen. Misschien wel, misschien niet - maar dan weet je het tenminste!`}
          tags={['objectie', 'niet nodig', 'nieuwsgierig']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nodig-3"
          label="Variant C - Geen verplichting"
          text={`Helemaal prima! Het is ook gewoon vrijblijvend hoor 😊

Mocht je ooit ergens tegenaan lopen of vragen hebben, laat het weten!`}
          tags={['objectie', 'niet nodig', 'vrijblijvend']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'via-chat': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="'Kan het niet via chat?'" color="#ef4444" />

        <MessageTemplate
          id="chat-1"
          label="Variant A - Uitleg waarom call beter is"
          text={`Snap ik! Maar eerlijk gezegd kan ik je via chat niet zo goed helpen 😊

In een gesprek kan ik doorvragen, precies horen wat er speelt, en je echt op maat advies geven. Dat lukt via tekst gewoon minder goed.

Is maar 15 min en dan weet je precies waar je aan toe bent!`}
          tags={['objectie', 'chat', 'call beter']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="chat-2"
          label="Variant B - Kort"
          text={`Via chat is lastig om je echt goed te helpen 😊

In een call kan ik doorvragen en je persoonlijk advies geven. Duurt maar een kwartiertje!`}
          tags={['objectie', 'chat', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="chat-3"
          label="Variant C - Compromis"
          text={`Ik snap dat je liever chat! 😊

Maar voor dit soort dingen werkt een kort gesprek echt beter. Ik kan je dan veel specifieker helpen.

Zou je het willen proberen? Als je het niks vindt hoef je nooit meer te bellen haha`}
          tags={['objectie', 'chat', 'compromis']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'nee': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="Ze zeggen NEE" color="#ef4444" />

        <MessageTemplate
          id="nee-1"
          label="Variant A - Respectvol afsluiten"
          text={`Geen probleem man! Als je ooit ergens tegenaan loopt, laat het weten 💪`}
          tags={['nee', 'afsluiten', 'respectvol']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nee-2"
          label="Variant B - Deur open houden"
          text={`Helemaal prima! 😊

Mocht je in de toekomst wel interesse hebben of vragen hebt, je weet me te vinden!

Succes met alles 💪`}
          tags={['nee', 'afsluiten', 'deur open']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nee-3"
          label="Variant C - Community aanbieden"
          text={`Oké geen probleem!

Ik heb wel een gratis community waar ik tips deel als je dat interessant vindt. Geen call nodig, gewoon waardevolle content 😊

Interesse?`}
          tags={['nee', 'community', 'alternatief']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="nee-4"
          label="Variant D - Kort"
          text={`Prima man, succes! 💪`}
          tags={['nee', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    )
  }

  return subSections[activeSubSection] || null
}
