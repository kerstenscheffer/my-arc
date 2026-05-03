// src/intake/sections/HeroSection.jsx
import { useState } from 'react'
import { Star, MessageCircle } from 'lucide-react'
import IntakeService from '../IntakeService'

const G = '#C9A84C'
const GD = '#B8973F'
const COACH_PHOTO = '/coach-kersten.png'

const QUOTES = [
  '"Als jij je aan het plan houd zal Kersten altijd de volle 100% geven!" — Hessel',
  '"Na 100 mislukte pogingen is het mij eindelijk gelukt!" — Sassus',
  '"Professioneel, persoonlijk, betrouwbaar en veel lachen!" — Indi',
  '"Je krijgt een goed schema om je doel te halen" — Me',
  '"Super Coach, leuke gesprekken en altijd enthousiast!" — Toon',
  '"Een absolute aanrader voor wie fitter wil worden!" — Consumer',
  '"De kennis zorgt ervoor dat ik nu stabiel blijf in gewicht" — Hessel',
  '"Niet alleen fysiek maar ook mentaal geholpen" — Sassus'
]

const STEPS = [
  { key: 'goal', question: 'Hoe kan ik je het beste helpen?', type: 'grid', options: ['Afvallen', 'Spiermassa opbouwen', 'Gezonde levensstijl', 'Lichaamstransformatie Programma'] },
  { key: 'age', question: 'Ik ben', type: 'grid', options: ['16-17', '18-25', '25-35', '35+'] },
  { key: 'goal_description', question: 'Wat is je absolute nummer 1 doel, wat je op dit moment wilt bereiken op het gebied van fitness en gezondheid?', type: 'textarea', placeholder: 'Schrijf hier...' },
  { key: 'obstacle', question: 'Wat staat je momenteel het meest in de weg om dit doel te bereiken?', type: 'textarea', placeholder: 'Schrijf hier...' },
  { key: 'urgency', question: 'Hoe belangrijk is het voor jou om dit NU aan te pakken (schaal 1-5)', type: 'list', options: [
    '1 — Helemaal niet belangrijk.',
    '2 — Niet zo belangrijk.',
    '3 — Neutraal. Ik twijfel nog.',
    '4 — Belangrijk. Ik wil serieus aan de slag.',
    '5 — Zeer belangrijk / absolute prioriteit.'
  ]},
  { key: 'budget', question: 'Stel je zou nú in jezelf investeren: wat zou voor jou per week realistisch voelen?', type: 'grid', options: ['€45 – €55', '€55 – €75', '€75+', 'Geen idee'] },
  { key: 'commitment', question: 'Ben je bereid om tijd én geld te investeren om jouw transformatie waar te maken?', type: 'grid', options: ['Ja! Ik ben ready!', 'Nee nog niet'] },
  { key: 'contact', question: 'Contactinformatie', type: 'contact' }
]

export default function HeroSection({ isMobile }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [sending, setSending] = useState(false)

  const progress = ((step + 1) / STEPS.length) * 100
  const s = STEPS[step]

  const pick = (opt) => {
    setAnswers({ ...answers, [s.key]: opt })
    setTimeout(() => { if (step < STEPS.length - 1) setStep(step + 1) }, 200)
  }

  const submit = async () => {
    if (!form.name || !form.phone) return
    setSending(true)
    try {
      await IntakeService.submitIntake(answers, form)
      window.location.href = '/bedankt'
    } catch (error) {
      console.error('❌ Submit failed:', error)
      window.location.href = '/bedankt'
    } finally { setSending(false) }
  }

  // ── Option button style ──
  const optBtn = (opt, selected, fullWidth) => ({
    width: fullWidth ? '100%' : undefined,
    padding: isMobile ? '0.85rem 0.9rem' : '0.9rem 1rem',
    background: selected ? `linear-gradient(135deg, ${G}, ${GD})` : '#5a5a5a',
    color: '#fff',
    border: selected ? `2px solid ${G}` : '2px solid transparent',
    borderRadius: '8px',
    fontSize: isMobile ? '0.88rem' : '0.9rem',
    fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: fullWidth ? 'left' : 'center',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    lineHeight: 1.35, minHeight: '50px',
    display: 'flex', alignItems: 'center',
    justifyContent: fullWidth ? 'flex-start' : 'center'
  })

  const inputSt = {
    width: '100%', padding: '0.85rem 1rem', background: '#fff',
    border: '2px solid #e0e0e0', borderRadius: '8px',
    fontSize: isMobile ? '0.9rem' : '0.95rem', fontFamily: 'inherit',
    color: '#1a1a1a', outline: 'none', boxSizing: 'border-box'
  }

  // ── Render step content ──
  const renderContent = () => {
    if (s.type === 'grid') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {s.options.map(o => <button key={o} onClick={() => pick(o)} style={optBtn(o, answers[s.key] === o, false)}>{o}</button>)}
      </div>
    )
    if (s.type === 'list') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {s.options.map(o => <button key={o} onClick={() => pick(o)} style={optBtn(o, answers[s.key] === o, true)}>{o}</button>)}
      </div>
    )
    if (s.type === 'textarea') return (
      <textarea value={answers[s.key] || ''} onChange={e => setAnswers({ ...answers, [s.key]: e.target.value })}
        placeholder={s.placeholder} rows={4} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }}
        onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
    )
    if (s.type === 'contact') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input type="text" placeholder="Je volledige naam" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
        <input type="email" placeholder="Je e-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputSt} onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', background: '#fff', border: '2px solid #e0e0e0', borderRadius: '8px' }}>
          <span>🇳🇱</span><span style={{ fontSize: '0.9rem', color: '#888', fontWeight: '500' }}>+31</span>
          <input type="tel" placeholder="6 12345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.95rem', fontFamily: 'inherit', color: '#1a1a1a', outline: 'none' }} />
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <p style={{ fontSize: '0.68rem', color: '#999', lineHeight: 1.5, margin: 0 }}>
            Wanneer je het formulier verstuurt, worden je contactgegevens gebruikt om speciale aanbiedingen te sturen. Lees meer in ons{' '}
            <a href="#" style={{ color: G, textDecoration: 'underline' }}>Privacybeleid</a>.
          </p>
        </div>
      </div>
    )
    return null
  }

  const showBack = step > 0
  const showNext = s.type === 'textarea'
  const showSubmit = s.type === 'contact'

  // ── Form Card ──
  const formCard = (
    <div style={{
      background: '#fff', border: `2px solid ${G}`, borderRadius: '14px',
      padding: isMobile ? '1.75rem 1.25rem' : '2rem 1.75rem',
      position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        position: 'absolute', top: '-14px', left: isMobile ? '1.25rem' : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        background: G, color: '#fff', padding: '0.4rem 1.25rem', borderRadius: '4px',
        fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.15em', whiteSpace: 'nowrap'
      }}>BEGIN HIER</div>

      <p style={{ textAlign: 'center', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '700', lineHeight: 1.4, margin: '0.5rem 0 1.25rem', color: '#1a1a1a' }}>
        Laat mij via het formulier hieronder weten welke doelen jij wilt bereiken!
      </p>

      <div style={{ width: '100%', height: '5px', background: '#eee', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${G}, ${GD})`, borderRadius: '3px', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>

      <h3 style={{ textAlign: 'center', fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '600', margin: '0 0 1.25rem', color: '#333', lineHeight: 1.4 }}>{s.question}</h3>

      {renderContent()}

      {(showBack || showNext || showSubmit) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {showBack && <button onClick={() => setStep(step - 1)} style={{ padding: '0.8rem 1.5rem', background: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#fff', cursor: 'pointer', touchAction: 'manipulation', minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>← TERUG</button>}
          {showNext && <button onClick={() => { if (answers[s.key]?.trim()) setStep(step + 1) }} disabled={!answers[s.key]?.trim()} style={{ flex: 1, padding: '0.8rem', background: answers[s.key]?.trim() ? '#5a5a5a' : '#ccc', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#fff', cursor: answers[s.key]?.trim() ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}>VOLGENDE →</button>}
          {showSubmit && <button onClick={submit} disabled={!form.name || !form.phone || sending} style={{ flex: 1, padding: '0.8rem', background: (form.name && form.phone) ? '#5a5a5a' : '#ccc', border: 'none', borderRadius: '8px', fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: '700', color: '#fff', cursor: (form.name && form.phone) ? 'pointer' : 'not-allowed', touchAction: 'manipulation' }}>{sending ? 'VERZENDEN...' : 'NEEM CONTACT MET ME OP →'}</button>}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <p style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontStyle: 'italic', color: G, margin: '0 0 0.5rem', lineHeight: 1.4, fontWeight: '500' }}>{QUOTES[step]}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#1a1a1a' }}>4.8</span>
          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#FFD700" color="#FFD700" />)}
        </div>
        <span style={{ fontSize: '0.7rem', color: '#aaa' }}>513 beoordelingen</span>
      </div>
    </div>
  )

  // ── RENDER ──
  return (
    <section id="intake-form" style={{ background: '#fff' }}>

      {/* Hero top: Title + Photo */}
      <div style={{ background: '#f5f0e8', padding: isMobile ? '1.5rem 1rem 0' : '2.5rem 2rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontWeight: '900', lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ display: 'block', fontSize: isMobile ? 'clamp(2rem, 10vw, 2.8rem)' : 'clamp(3rem, 5vw, 4.5rem)', color: '#1a1a1a' }}>VAL AF, WORD FIT</span>
            <span style={{ display: 'block', fontSize: isMobile ? 'clamp(1.4rem, 7vw, 2rem)' : 'clamp(2rem, 3.5vw, 3rem)', color: '#1a1a1a' }}>EN VOEL JE WEER</span>
            <span style={{ display: 'block', fontSize: isMobile ? 'clamp(2.2rem, 11vw, 3rem)' : 'clamp(3.5rem, 6vw, 5.5rem)', color: G, fontStyle: 'italic', letterSpacing: '-0.03em' }}>GOED</span>
          </h1>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '0' : '2rem', alignItems: 'end' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginTop: isMobile ? '0.5rem' : '1rem' }}>
            {/* 96% stat */}
            <div style={{ position: 'absolute', bottom: isMobile ? '50px' : '40px', left: 0, zIndex: 3 }}>
              <div style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: '900', color: G, lineHeight: 1 }}>96%</div>
              <div style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', lineHeight: 1.3 }}>ZOU HET AAN<br/>EEN VRIEND<br/>AANRADEN</div>
            </div>

            {/* Badge */}
            <div style={{ position: 'absolute', top: isMobile ? '15px' : '20px', right: isMobile ? '5px' : '20px', width: isMobile ? '75px' : '95px', height: isMobile ? '75px' : '95px', borderRadius: '50%', background: `linear-gradient(135deg, ${G} 0%, #D4B85A 30%, ${GD} 70%, ${G} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(201,168,76,0.5), inset 0 1px 0 rgba(255,255,255,0.3)', zIndex: 3, border: '2px solid #D4B85A' }}>
              <span style={{ fontSize: isMobile ? '0.55rem' : '0.65rem', fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 1.15, textTransform: 'uppercase' }}>NIET<br/>GOED?</span>
              <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '800', color: '#5a1a1a', textAlign: 'center', marginTop: '1px' }}>GELD TERUG!</span>
            </div>

            {/* Photo */}
            <div style={{ width: isMobile ? '75%' : '100%', maxWidth: '420px', position: 'relative' }}>
              <img src={COACH_PHOTO} alt="Coach Kersten" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover', objectPosition: 'top center' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              <div style={{ display: 'none', width: '100%', aspectRatio: '3/4', background: 'linear-gradient(135deg, #2D3436, #1a1d1e)', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>COACH FOTO</div>
            </div>
          </div>

          {/* Desktop: form next to photo */}
          {!isMobile && <div style={{ paddingBottom: '2rem' }}>{formCard}</div>}
        </div>
      </div>

      {/* Mobile: form directly against photo — no gap */}
      {isMobile && <div style={{ padding: '0 1rem 2rem', marginTop: '-10px', position: 'relative', zIndex: 5 }}>{formCard}</div>}
    </section>
  )
}
