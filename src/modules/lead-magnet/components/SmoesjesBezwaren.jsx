// src/modules/lead-magnet/components/SmoesjesBezwaren.jsx
import React, { useState } from 'react'
import { AlertTriangle, ArrowLeft, Clock, DollarSign, HelpCircle, Heart } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function SmoesjesBezwaren({ onBack, copiedId, onCopy, isMobile }) {
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

  const SubSectionButton = ({ label, onClick, color = '#f59e0b' }) => (
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

  // MAIN MENU
  if (!activeSubSection) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <SectionHeader icon={AlertTriangle} title="Smoesjes & Bezwaren" color="#f59e0b" />
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600' }}>
            🛡️ Algemene bezwaren tijdens het gesprek (niet specifiek over de call)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubSectionButton 
            label="⏰ Geen tijd / fulltime baan" 
            onClick={() => setActiveSubSection('geen-tijd')}
          />
          <SubSectionButton 
            label="💸 Geen geld voor sportschool" 
            onClick={() => setActiveSubSection('geen-geld')}
          />
          <SubSectionButton 
            label="🤷 Weet niet waar te beginnen" 
            onClick={() => setActiveSubSection('weet-niet')}
          />
          <SubSectionButton 
            label="😰 Bang dat ik het niet volhou" 
            onClick={() => setActiveSubSection('niet-volhouden')}
          />
          <SubSectionButton 
            label="😳 Schaam me voor de sportschool" 
            onClick={() => setActiveSubSection('schaamte')}
          />
          <SubSectionButton 
            label="🤕 Blessure / fysieke beperking" 
            onClick={() => setActiveSubSection('blessure')}
          />
          <SubSectionButton 
            label="🍕 Ik hou te veel van eten" 
            onClick={() => setActiveSubSection('hou-van-eten')}
          />
          <SubSectionButton 
            label="😴 Te moe / geen energie" 
            onClick={() => setActiveSubSection('moe')}
          />
        </div>
      </div>
    )
  }

  // SUB SECTIONS
  const subSections = {
    'geen-tijd': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Clock} title="Geen tijd / fulltime baan" color="#f59e0b" />

        <MessageTemplate
          id="tijd-1"
          label="Variant A - Begrip + vraag"
          text={`Ja snap ik man, tijd is altijd lastig 😅

Maar hoeveel tijd zou je realistisch kunnen vrijmaken per week? Ook al is het maar 2 of 3 keer een half uurtje?`}
          tags={['smoesje', 'tijd', 'vraag']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-2"
          label="Variant B - Herkenbaar"
          text={`Ja herkenbaar! Ik had ook een fulltime baan met wisselende tijden, was ook lastig in het begin 😅

Wat voor mij werkte was gewoon korte workouts van 30-45 min, 3x per week. Hoeft niet meer te zijn om resultaat te zien hoor!

Wat zou voor jou haalbaar zijn denk je?`}
          tags={['smoesje', 'tijd', 'herkenbaar']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-3"
          label="Variant C - Perspectief"
          text={`Ja dat hoor ik vaker man! Maar eerlijk, je hebt geen 2 uur per dag nodig 😊

3x per week 45 minuten is al genoeg om serieus resultaat te boeken.

Zou dat erin passen denk je?`}
          tags={['smoesje', 'tijd', 'perspectief']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="tijd-4"
          label="Variant D - Prioriteit"
          text={`Snap ik! Maar vaak is het geen tijd, maar prioriteit 😊

Als fitness belangrijk voor je is, kun je er altijd tijd voor maken. Al is het maar 30 min, 3x per week.

Zou je dat willen proberen?`}
          tags={['smoesje', 'tijd', 'prioriteit']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'geen-geld': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={DollarSign} title="Geen geld voor sportschool" color="#f59e0b" />

        <MessageTemplate
          id="geld-1"
          label="Variant A - Thuis optie"
          text={`Ja snap ik, sportschool kan duur zijn 😅

Maar wist je dat je ook gewoon thuis kunt beginnen? Met eigen lichaamsgewicht kun je al een heel eind komen!

Heb je thuis een beetje ruimte om te trainen?`}
          tags={['smoesje', 'geld', 'thuis']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geld-2"
          label="Variant B - Geen spullen nodig"
          text={`Ja begrijpelijk man! Maar je hoeft niet per se naar de gym hoor 😊

Pushups, squats, lunges... je kunt thuis al super veel doen zonder spullen.

Zou je daar interesse in hebben om zo te beginnen?`}
          tags={['smoesje', 'geld', 'geen spullen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geld-3"
          label="Variant C - Eigen ervaring"
          text={`Ja dat is balen 😕

Maar eerlijk, ik ben zelf ook thuis begonnen zonder gym. Gewoon met lichaamsgewicht en een paar basic oefeningen.

Is thuis trainen een optie voor jou? Dan kan ik je misschien wat tips geven 💪`}
          tags={['smoesje', 'geld', 'ervaring']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geld-4"
          label="Variant D - Budget gym"
          text={`Snap ik! Maar er zijn ook budget sportscholen voor €15-20 per maand 😊

Basic Fit bijvoorbeeld is best betaalbaar. Anders kun je ook gewoon thuis beginnen!

Wat zou voor jou werken?`}
          tags={['smoesje', 'geld', 'budget']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'weet-niet': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={HelpCircle} title="Weet niet waar te beginnen" color="#f59e0b" />

        <MessageTemplate
          id="weet-1"
          label="Variant A - Overwhelming"
          text={`Ja dat snap ik man, er is zoveel info online dat je door de bomen het bos niet meer ziet 😅

Wat is je doel eigenlijk? Afvallen, spieren opbouwen of gewoon fitter worden?`}
          tags={['smoesje', 'beginnen', 'overwhelming']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="weet-2"
          label="Variant B - Herkenbaar"
          text={`Ja herkenbaar! Zo voelde ik me in het begin ook, overwhelming 😅

Maar het hoeft niet ingewikkeld te zijn hoor. Wat zou jij het liefste willen bereiken?`}
          tags={['smoesje', 'beginnen', 'herkenbaar']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="weet-3"
          label="Variant C - Simpel houden"
          text={`Snap ik! Er is zoveel info dat het verwarrend kan zijn 😅

Maar eerlijk, fitness hoeft niet ingewikkeld. Gewoon beginnen met de basics en consistent zijn.

Wat zou je willen bereiken? Dan kan ik je misschien in de goede richting wijzen 💪`}
          tags={['smoesje', 'beginnen', 'simpel']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="weet-4"
          label="Variant D - Direct hulp"
          text={`Ja dat is precies waarom mensen vastlopen 😅

Als je wilt kan ik je helpen met een startpunt. Even kijken waar je nu staat en wat je doel is, dan weet je precies waar te beginnen!

Zou je dat handig vinden?`}
          tags={['smoesje', 'beginnen', 'hulp', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'niet-volhouden': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Heart} title="Bang dat ik het niet volhou" color="#f59e0b" />

        <MessageTemplate
          id="volhou-1"
          label="Variant A - Klein beginnen"
          text={`Ja dat snap ik man, dat heeft iedereen in het begin 😊

Maar weet je wat helpt? Klein beginnen. Niet meteen 6x per week willen gaan, maar gewoon 2-3x en dat volhouden.

Heb je het al eens eerder geprobeerd?`}
          tags={['smoesje', 'volhouden', 'klein']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="volhou-2"
          label="Variant B - Simpel"
          text={`Ja herkenbaar! Maar dat hoeft geen probleem te zijn hoor 💪

De truc is om het simpel te houden en niet te veel te willen in het begin.

Wat zorgde ervoor dat je eerder stopte denk je?`}
          tags={['smoesje', 'volhouden', 'simpel']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="volhou-3"
          label="Variant C - Routine"
          text={`Snap ik! Maar weet je wat helpt? Een vaste routine maken 😊

Dezelfde dagen, dezelfde tijden. Dan hoef je niet na te denken, je doet het gewoon.

Zou dat iets voor jou kunnen werken?`}
          tags={['smoesje', 'volhouden', 'routine']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="volhou-4"
          label="Variant D - Accountability"
          text={`Ja dat gevoel ken ik 😅

Wat vaak helpt is accountability - iemand die je op de hoogte houdt. Daarom help ik ook mensen, om ze gemotiveerd en consistent te houden.

Zou dat iets voor je zijn?`}
          tags={['smoesje', 'volhouden', 'accountability', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'schaamte': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={AlertTriangle} title="Schaam me voor de sportschool" color="#f59e0b" />

        <MessageTemplate
          id="schaam-1"
          label="Variant A - Niemand let op je"
          text={`Ja dat hoor ik vaker man, maar weet je wat? Niemand let op je daar 😊

Iedereen is met zichzelf bezig. En eerlijk, mensen hebben juist respect voor beginners die de stap zetten!

Wat houdt je precies tegen?`}
          tags={['smoesje', 'schaamte', 'perspectief']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="schaam-2"
          label="Variant B - Thuis beginnen"
          text={`Ja snap ik, voelde ik in het begin ook 😅

Maar geloof me, niemand kijkt naar je. En anders kun je ook gewoon thuis beginnen tot je je wat zekerder voelt!

Zou dat een optie zijn?`}
          tags={['smoesje', 'schaamte', 'thuis']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="schaam-3"
          label="Variant C - Rustige tijden"
          text={`Snap ik man! Maar weet je wat kan helpen? Ga op rustige tijden 😊

's Ochtends vroeg of later in de avond. Dan is het rustiger en voel je je meer op je gemak.

Zou je dat willen proberen?`}
          tags={['smoesje', 'schaamte', 'rustig']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'blessure': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={AlertTriangle} title="Blessure / fysieke beperking" color="#f59e0b" />

        <MessageTemplate
          id="blessure-1"
          label="Variant A - Doorvragen"
          text={`Ahh dat is balen man 😕

Maar vaak kun je wel nog trainen, alleen moet je het slim aanpakken en bepaalde oefeningen vermijden.

Wat voor blessure heb je precies? Misschien kan ik je wat tips geven 💪`}
          tags={['smoesje', 'blessure', 'doorvragen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="blessure-2"
          label="Variant B - Aanpassen"
          text={`Ja dat is kut 😕

Maar je kunt meestal wel omheen trainen. Als je schouder pijn doet, train je je benen. Als je knie pijn doet, focus je op bovenlichaam.

Waar heb je precies last van?`}
          tags={['smoesje', 'blessure', 'aanpassen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="blessure-3"
          label="Variant C - Voeding focus"
          text={`Ahh vervelend man 😕

Maar weet je wat, als je niet kunt trainen kun je je focussen op voeding! Dat is toch 80% van je resultaat.

Is dat iets waar je mee aan de slag wilt?`}
          tags={['smoesje', 'blessure', 'voeding']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'hou-van-eten': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={AlertTriangle} title="Ik hou te veel van eten" color="#f59e0b" />

        <MessageTemplate
          id="eten-1"
          label="Variant A - Niet opgeven"
          text={`Haha ja wie niet man! 😂

Maar je hoeft niet te stoppen met lekker eten hoor. Het gaat erom dat je de juiste hoeveelheid eet, niet dat je alleen nog maar salade mag.

Waar hou je het meeste van? Pizza, pasta, snacks?`}
          tags={['smoesje', 'eten', 'begrip']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="eten-2"
          label="Variant B - Slimme keuzes"
          text={`Ja man, eten is life 😂

Maar weet je, je kunt nog steeds lekker eten en resultaat boeken. Het gaat om slimme keuzes maken, niet alles opgeven.

Wat voor doel heb je eigenlijk?`}
          tags={['smoesje', 'eten', 'slim']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="eten-3"
          label="Variant C - Calorieën verdelen"
          text={`Haha herkenbaar! 😂

Maar je kunt je calorieën zo verdelen dat je nog steeds af en toe kan genieten. Als je doordeweeks goed eet, kun je in het weekend wat losser.

Is dat een aanpak die je zou kunnen doen?`}
          tags={['smoesje', 'eten', 'verdelen']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'moe': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={AlertTriangle} title="Te moe / geen energie" color="#f59e0b" />

        <MessageTemplate
          id="moe-1"
          label="Variant A - Sporten geeft energie"
          text={`Ja snap ik 😅

Maar weet je wat gek is? Sporten geeft juist energie! Na een workout voel je je vaak beter dan ervoor.

Heb je dat wel eens ervaren?`}
          tags={['smoesje', 'moe', 'energie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="moe-2"
          label="Variant B - Oorzaak"
          text={`Ja dat is lastig 😕

Maar vaak heeft vermoeidheid te maken met voeding of slaap. Eet je wel genoeg? En slaap je goed?`}
          tags={['smoesje', 'moe', 'oorzaak']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="moe-3"
          label="Variant C - Lichte workout"
          text={`Snap ik man! 😅

Maar je hoeft niet meteen super intensief te trainen. Een lichte workout kan al helpen om je energie te boosten.

Zou je dat willen proberen?`}
          tags={['smoesje', 'moe', 'licht']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    )
  }

  return subSections[activeSubSection] || null
}
