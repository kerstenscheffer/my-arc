// src/pages/PrivacyPolicy.jsx

import React from 'react'

export default function PrivacyPolicy() {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '1rem 1.25rem' : '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <span style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '800',
          color: '#FFD700',
          letterSpacing: '-0.01em'
        }}>MY ARC</span>
        <span style={{
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.8rem'
        }}>/</span>
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}>Privacybeleid</span>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: isMobile ? '2rem 1.25rem' : '3rem 2rem',
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>Privacybeleid</h1>

        <p style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '2.5rem',
          fontWeight: '500'
        }}>Laatst bijgewerkt: april 2026</p>

        <Section title="1. Wie zijn wij">
          MY ARC is een platform voor persoonlijke coaching, ontwikkeld en beheerd door Jino (KvK-nummer: 92854486). Je kunt contact opnemen via: kerstenscheffer@gmail.com
        </Section>

        <Section title="2. Welke gegevens verzamelen wij">
          <p>Wij verzamelen de volgende categorieën persoonsgegevens:</p>
          <ul>
            <li><strong>Identiteitsgegevens</strong> — naam, e-mailadres, geboortedatum</li>
            <li><strong>Lichaamsgegevens</strong> — gewicht, lengte, vetpercentage, voortgangs­foto's</li>
            <li><strong>Gezondheid & fitness</strong> — calorie- en macrodoelen, voedingslog, trainingsdata, workouts</li>
            <li><strong>Communicatie</strong> — berichten tussen coach en cliënt binnen het platform</li>
            <li><strong>Gebruiksgegevens</strong> — inlogtijden, app-activiteit</li>
          </ul>
        </Section>

        <Section title="3. Waarom verzamelen wij deze gegevens">
          <ul>
            <li>Om gepersonaliseerd coaching- en voedingsadvies te kunnen leveren</li>
            <li>Om voortgang bij te houden en inzichtelijk te maken</li>
            <li>Om communicatie tussen coach en cliënt mogelijk te maken</li>
            <li>Om de app te verbeteren en technisch te onderhouden</li>
          </ul>
        </Section>

        <Section title="4. Wie heeft toegang tot jouw gegevens">
          <p>Jouw gegevens worden uitsluitend gedeeld met:</p>
          <ul>
            <li><strong>Jouw coach</strong> — voor het leveren van de coachingsdienst</li>
            <li><strong>Supabase</strong> — onze dataverwerker voor opslag en authenticatie. Supabase slaat gegevens op binnen de Europese Unie (regio: eu-west). Meer informatie: supabase.com/privacy</li>
          </ul>
          <p>Wij verkopen jouw gegevens nooit aan derden. Wij gebruiken geen advertentienetwerken.</p>
        </Section>

        <Section title="5. Bewaartermijn">
          Jouw gegevens worden bewaard zolang je een actief account hebt. Na verwijdering van je account worden jouw gegevens binnen 30 dagen definitief gewist uit onze systemen.
        </Section>

        <Section title="6. Jouw rechten">
          <p>Je hebt het recht om:</p>
          <ul>
            <li>Jouw gegevens in te zien</li>
            <li>Jouw gegevens te laten corrigeren</li>
            <li>Jouw account en alle bijbehorende gegevens te laten verwijderen</li>
            <li>Bezwaar te maken tegen verwerking</li>
          </ul>
          <p>Je kunt jouw account direct verwijderen vanuit de app via <strong>Profiel → Account verwijderen</strong>. Voor overige verzoeken kun je contact opnemen via info@myarcfitness.com</p>
        </Section>

        <Section title="7. Beveiliging">
          Wij nemen passende technische en organisatorische maatregelen om jouw gegevens te beschermen. Alle verbindingen zijn versleuteld via HTTPS. Toegang tot gegevens is beperkt via Row Level Security in onze database.
        </Section>

        <Section title="8. Wijzigingen">
          Wij kunnen dit privacybeleid aanpassen. Bij belangrijke wijzigingen ontvang je een melding via de app of per e-mail. De meest actuele versie is altijd beschikbaar op myarcfitness.com/privacy.
        </Section>

        <Section title="9. Contact">
          Vragen over dit privacybeleid? Neem contact op via info@myarcfitness.com
        </Section>

        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.2)',
          fontWeight: '500'
        }}>
          © 2026 Jino — MY ARC. Alle rechten voorbehouden.
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: '700',
        color: '#FFD700',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.75rem'
      }}>{title}</h2>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '0.9rem',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: '1.7',
        borderLeft: '2px solid rgba(255,215,0,0.15)',
        paddingLeft: '1rem'
      }}>
        {children}
      </div>
    </div>
  )
}
