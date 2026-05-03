// src/modules/lead-magnet/components/CommunityPitch.jsx
import React from 'react'
import { Users, ArrowLeft, Gift, Sparkles } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function CommunityPitch({ onBack, copiedId, onCopy, isMobile }) {

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
      <SectionHeader icon={Users} title="Community Pitch" color="#10b981" />

      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
          📱 Gebruik deze berichten om mensen naar je WhatsApp community te krijgen. Voeg je eigen link toe!
        </div>
      </div>

      <Divider text="COMMUNITY INTRODUCTIE" />

      <MessageTemplate
        id="comm-1"
        label="Variant A - Uitgebreide pitch"
        text={`Ik heb trouwens een gratis WhatsApp community waar ik wekelijks waardevolle content deel 💪

Wat je krijgt:
- Gratis PDF's over voeding & training
- Tips om af te vallen / spieren op te bouwen
- Recepten en meal prep ideeën
- Motivatie en accountability
- Q&A waar je vragen kunt stellen

Helemaal gratis, gewoon om mensen te helpen die serieus bezig willen zijn!

Wil je erbij? Dan stuur ik je de link 😊`}
        tags={['community', 'pitch', 'uitgebreid']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="comm-2"
        label="Variant B - Korte pitch"
        text={`Ik heb een gratis WhatsApp community waar ik tips deel over voeding, training en gezonder leven 💪

Elke week nieuwe content, PDF's, en je kunt vragen stellen.

Interesse? Dan stuur ik de link! 😊`}
        tags={['community', 'pitch', 'kort']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="comm-3"
        label="Variant C - Na goed gesprek"
        text={`Top man, dan zit je helemaal goed! Gewoon blijven doen wat je doet 💪

Ik heb trouwens een community waar ik gratis tips deel over training en voeding. Kan handig zijn om erbij te zitten!

Zal ik je de link sturen?`}
        tags={['community', 'na gesprek']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="comm-4"
        label="Variant D - Specifiek voor bulken"
        text={`Nice dat je aan het bulken bent! 💪

Ik heb een gratis community waar ik veel tips deel over massa bouwen, voeding voor bulk, en trainingsschema's.

Wil je erbij? Is gratis hoor 😊`}
        tags={['community', 'bulken']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="comm-5"
        label="Variant E - Specifiek voor cutten"
        text={`Top dat je aan het cutten bent! 🔥

Ik heb een gratis community waar ik tips deel over vet verliezen, spieren behouden, en slimme voedingskeuzes.

Interesse om te joinen? Kost niks! 😊`}
        tags={['community', 'cutten']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <Divider text="LINK STUREN" />

      <MessageTemplate
        id="comm-link-1"
        label="Link bericht A"
        text={`Top! Hier is de link: [JOUW COMMUNITY LINK]

Welkom! 💪`}
        tags={['community', 'link']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
        note="Vervang [JOUW COMMUNITY LINK] met je echte link"
      />

      <MessageTemplate
        id="comm-link-2"
        label="Link bericht B - Met instructie"
        text={`Nice! Hier is de link om te joinen: [JOUW COMMUNITY LINK]

Stel jezelf even voor als je erin komt, dan weet ik wie je bent 😊

Welkom! 💪`}
        tags={['community', 'link', 'introductie']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <Divider text="ALS ZE TWIJFELEN" />

      <MessageTemplate
        id="comm-twijfel-1"
        label="'Wat voor content deel je?'"
        text={`Elke week deel ik:
- Tips over voeding en training
- Gratis PDF's (voedingsschema's, oefeningen)
- Recepten en meal prep ideeën
- Motivatie posts
- Q&A's waar je vragen kunt stellen

Alles gericht op fitter worden, afvallen, of spieren bouwen 💪`}
        tags={['community', 'twijfel', 'content']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
      />

      <MessageTemplate
        id="comm-twijfel-2"
        label="'Hoeveel mensen zitten erin?'"
        text={`Er zitten nu [AANTAL] mensen in die allemaal serieus bezig zijn met fitness en gezondheid 💪

Leuke groep, iedereen helpt elkaar!`}
        tags={['community', 'twijfel', 'grootte']}
        copiedId={copiedId}
        onCopy={onCopy}
        isMobile={isMobile}
        note="Vervang [AANTAL] met je echte aantal"
      />
    </div>
  )
}
