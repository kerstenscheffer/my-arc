// src/modules/lead-magnet/components/EersteBerichten.jsx
import React from 'react'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function EersteBerichten({ onBack, copiedId, onCopy, isMobile }) {

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

  return (
    <div>
      <BackButton onClick={onBack} />
      <SectionHeader icon={MessageCircle} title="Eerste Berichten" color="#10b981" />
      
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
          📝 Vervang [NAAM] met hun naam en pas het compliment aan!
        </div>
      </div>

      <Divider text="SPORT FOCUS" />

      <MessageTemplate
        id="eerste-1"
        label="Variant A - Sport vraag (simpel)"
        text={`Heyy [NAAM]! Leuk dat je mij volgt, dankjewel daarvoor! 😊

Leuke profielfoto!

Ik was benieuwd, sport jij ook? 💪`}
        tags={['eerste', 'sport', 'simpel']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="eerste-2"
        label="Variant B - Sportschool vraag"
        text={`Heyy [NAAM]! Leuk dat je mij volgt! 😊

Leuke profielfoto!

Ik was benieuwd, ga jij ook naar de sportschool? 💪`}
        tags={['eerste', 'sport', 'sportschool']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="eerste-3"
        label="Variant C - Kort & krachtig"
        text={`Heyy [NAAM]! Thanks voor het volgen! 💪

Leuke profielfoto!

Sport je veel? 😊`}
        tags={['eerste', 'sport', 'kort']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <Divider text="KEUZE VRAGEN" />

      <MessageTemplate
        id="eerste-4"
        label="Variant D - Voeding of sport"
        text={`Heyy [NAAM]! Top dat je mij ook bent gaan volgen! 💪

Leuke profielfoto!

Waar ligt jouw interesse meer? Is dat juist voeding en gezonder eten of juist sporten en workouts? 😊`}
        tags={['eerste', 'keuze', 'voeding', 'sport']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="eerste-5"
        label="Variant E - Fitness of voeding"
        text={`Heyy [NAAM]! Leuk dat je mij volgt man! 😊

Leuke profielfoto!

Ben je ook bezig met fitness of meer voeding? 💪`}
        tags={['eerste', 'keuze', 'fitness']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <Divider text="CASUAL / CHILL" />

      <MessageTemplate
        id="eerste-6"
        label="Variant F - Super casual"
        text={`Yoo [NAAM]! Thanks voor de follow! 🤙

Leuke Insta heb je!

Ben je ook bezig met fitness? 💪`}
        tags={['eerste', 'casual', 'chill']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="eerste-7"
        label="Variant G - Relaxed"
        text={`Hey [NAAM]! Leuk dat je volgt 😊

Nice profielfoto man!

Doe je zelf ook aan fitness? 💪`}
        tags={['eerste', 'casual', 'relaxed']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <Divider text="SPECIFIEKE COMPLIMENTEN" />

      <MessageTemplate
        id="eerste-8"
        label="Variant H - Auto compliment"
        text={`Heyy [NAAM]! Thanks voor het volgen! 💪

Zieke [AUTO] heb je man!

Sport jij ook? 😊`}
        tags={['eerste', 'compliment', 'auto']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
        note="Vervang [AUTO] met het automerk"
      />

      <MessageTemplate
        id="eerste-9"
        label="Variant I - Voetbal club"
        text={`Heyy [NAAM]! Leuk dat je mij volgt! 😊

Ik zie dat je [CLUB] fan bent, lekker man!

Ben je ook bezig met fitness? 💪`}
        tags={['eerste', 'compliment', 'voetbal']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
        note="Vervang [CLUB] met de voetbalclub"
      />

      <MessageTemplate
        id="eerste-10"
        label="Variant J - Hobby"
        text={`Heyy [NAAM]! Thanks voor de follow! 💪

Ik zag dat je ook [HOBBY] doet, nice!

Sport je daarnaast ook? 😊`}
        tags={['eerste', 'compliment', 'hobby']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
        note="Vervang [HOBBY] met hun hobby"
      />

      <Divider text="COMPLIMENT INSPIRATIE" />

      <div style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '12px',
        padding: '1rem'
      }}>
        <div style={{ color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          💡 Andere complimenten om te gebruiken:
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.8 }}>
          • "Zieke [AUTO] heb je man!"<br/>
          • "Leuke Insta heb je, ziet er netjes uit!"<br/>
          • "Ik zie dat je [CLUB] fan bent, lekker man!"<br/>
          • "Mooie foto's heb je!"<br/>
          • "Ziet er professioneel uit je pagina!"<br/>
          • "Ik zag dat je ook [HOBBY] doet, nice!"<br/>
          • "Nice physique man!"<br/>
          • "Ziet eruit alsof je serieus traint!"
        </div>
      </div>
    </div>
  )
}
