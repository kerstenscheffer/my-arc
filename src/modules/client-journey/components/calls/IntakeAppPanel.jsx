// src/modules/client-journey/components/calls/IntakeAppPanel.jsx
import React from 'react'
import { Monitor } from 'lucide-react'
import { C, NoteField } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80'

const APP_ITEMS = [
  { title: 'Dashboard / Home', sub: 'Laat zien wat de client als eerste ziet na het inloggen', tips: 'Wijs op de overzichtspagina, uitleg van de knoppen' },
  { title: 'Voedingsplan', sub: 'Waar het plan staat, hoe ze maaltijden bekijken en swappen', tips: 'Laat een voorbeelddag zien, toon de swap functie' },
  { title: 'Workout Logging', sub: 'Hoe ze een training loggen — sets, reps, gewicht', tips: 'Doe een demo oefening samen, laat zien hoe je een set logt' },
  { title: 'Weging & Tracking', sub: 'Hoe ze zich wegen en hun gewicht invoeren', tips: 'Leg uit: elke ochtend, nuchter, na toilet. Weekgemiddelde telt.' },
  { title: 'Progressie Foto\'s', sub: 'Hoe ze progress foto\'s uploaden', tips: 'Zelfde plek, zelfde licht, elke 2-4 weken. Voor/zij/achter.' },
  { title: 'Communicatie', sub: 'WhatsApp, berichten, wanneer ze je kunnen bereiken', tips: 'Vertel je reactietijd en wat ze via WhatsApp mogen sturen' }
]

export default function IntakeAppPanel({ stepNotes, setStepNotes, stepActions, setStepActions, isMobile }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Monitor size={16} color={C.purple} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>App walkthrough</span>
        </div>
      </div>

      {/* Intro */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}`, borderLeft: `3px solid ${C.purple}` }}>
        <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: C.text50, lineHeight: 1.5 }}>
          Deel je scherm en loop door deze onderdelen. De client moet na de call zelfstandig kunnen navigeren.
        </div>
      </div>

      {/* Items */}
      <div style={{ borderLeft: `3px solid ${C.gold}` }}>
        <div style={{ padding: '0.3rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LOOP DOOR DEZE ONDERDELEN</div>
        {APP_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '0.4rem 0.75rem', borderBottom: `1px solid ${C.borderSub}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.1rem' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.4rem', fontWeight: 800, color: C.gold, flexShrink: 0
              }}>{i + 1}</div>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: C.text }}>{item.title}</span>
            </div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: C.text25, marginLeft: '1.4rem' }}>{item.sub}</div>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: C.gold, marginLeft: '1.4rem', marginTop: '0.05rem', fontStyle: 'italic' }}>💡 {item.tips}</div>
          </div>
        ))}
      </div>

      <NoteField label="NOTITIES" value={stepNotes.app} onChange={v => setStepNotes(p => ({ ...p, app: v }))} placeholder="Vragen van de client, issues met de app..." isMobile={isMobile} />
      <NoteField label="ACTIES" value={stepActions.app} onChange={v => setStepActions(p => ({ ...p, app: v }))} color={C.gold} placeholder="Bijv: inloggegevens sturen, plan toewijzen in app..." isMobile={isMobile} />
    </div>
  )
}
