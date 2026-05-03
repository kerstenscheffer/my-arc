// src/modules/resource-hub/Modals.jsx
import { useState } from 'react'
import { G, I } from './Blocks'

const { X, Eye, EyeOff, ArrowRight } = I

// ═══ QUIZ MODAL ═══
export function QuizModal({ onClose, isMember, onCTA }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const m = window.innerWidth <= 768

  const qs = [
    { q: 'Wat is je hoofddoel?', opts: ['Vet verliezen', 'Conditie opbouwen', 'Herstel verbeteren', 'Algemene gezondheid'] },
    { q: 'Heb je last van blessures?', opts: ['Nee, alles goed', 'Knieën / gewrichten', 'Rug', 'Anders'] },
    { q: 'Hoeveel tijd per sessie?', opts: ['15-20 min', '30-45 min', '45-60+ min'] },
    { q: 'Wat heb je beschikbaar?', opts: ['Sportschool', 'Buiten / thuis', 'Beide'] }
  ]

  const recs = [
    { name: 'Incline Walking + HIIT Sprints', why: 'Incline walking voor steady-state vetverbranding, HIIT voor metabole boost.', top: ['Incline Treadmill Walking', 'HIIT Sprints (fiets)', 'Roeien'] },
    { name: 'Fietsen + Roeien', why: 'Laag impact, hoge hartslag. Bouwt aerobe capaciteit.', top: ['Fietsen', 'Roeien', 'Zwemmen'] },
    { name: 'Wandelen + Zwemmen', why: 'Zero impact. Bevordert herstel zonder extra stress.', top: ['Wandelen', 'Zwemmen', 'Licht fietsen'] },
    { name: 'Fietsen + Wandelen', why: 'Afwisselend en makkelijk vol te houden.', top: ['Fietsen', 'Wandelen', 'Traplopen'] }
  ]

  const pick = (i) => {
    const a = { ...answers, [step]: i }
    setAnswers(a)
    if (step < qs.length - 1) setStep(step + 1)
    else setResult(recs[a[0] || 0])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: `1px solid ${G.border}` }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Cardio Quiz</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1rem' }}>
        {!result ? (
          <>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '2rem' }}>
              {qs.map((_, i) => <div key={i} style={{ flex: 1, height: '2px', background: i <= step ? G.primary : 'rgba(255,255,255,0.04)' }} />)}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: G.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Vraag {step + 1} / {qs.length}</div>
            <div style={{ fontSize: m ? '1.2rem' : '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '1.5rem', lineHeight: 1.15 }}>{qs[step].q}</div>
            {qs[step].opts.map((o, i) => (
              <button key={i} onClick={() => pick(i)} style={{
                display: 'block', width: '100%', padding: '1rem', textAlign: 'left', background: 'transparent',
                borderTop: i === 0 ? `1px solid ${G.border}` : 'none', borderBottom: `1px solid ${G.border}`,
                borderLeft: 'none', borderRight: 'none', color: '#fff', fontSize: '0.92rem', fontWeight: '500',
                cursor: 'pointer', minHeight: '52px', touchAction: 'manipulation'
              }}>{o}</button>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.55rem', fontWeight: '700', color: G.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>Jouw Aanbeveling</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', marginBottom: '0.6rem', lineHeight: 1.15 }}>{result.name}</div>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{result.why}</p>
            {result.top.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 0', borderBottom: `1px solid ${G.border}` }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: G.primary, width: '20px' }}>{i + 1}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.55)' }}>{f}</span>
              </div>
            ))}
            <button onClick={() => { onCTA(); onClose() }} style={{
              width: '100%', padding: '1rem', marginTop: '1.5rem', background: G.grad, border: 'none',
              color: '#000', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', minHeight: '52px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', touchAction: 'manipulation'
            }}>{isMember ? 'Bekijk Je Schema' : 'Plan een Gratis Call'} <ArrowRight size={14} /></button>
          </>
        )}
      </div>
    </div>
  )
}

// ═══ LOGIN MODAL ═══
export function LoginModal({ onClose, onLogin, db }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async () => {
    if (!email || !pw) { setErr('Vul email en wachtwoord in'); return }
    setLoading(true); setErr('')
    try {
      const result = await db.signIn(email, pw)
      if (result) onLogin(result)
      else setErr('Ongeldige inloggegevens')
    } catch (e) { setErr('Inloggen mislukt') }
    finally { setLoading(false) }
  }

  const inp = {
    width: '100%', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${G.border}`, borderRadius: 0, color: '#fff',
    fontSize: '0.88rem', outline: 'none', minHeight: '48px', boxSizing: 'border-box'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '380px', background: '#0a0a0a', border: `1px solid ${G.borderActive}`, padding: '1.75rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}><X size={20} /></button>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: '800', color: G.primary }}>MY ARC</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>Log in om alles te unlocken</div>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        <div style={{ position: 'relative' }}>
          <input type={showPw ? 'text' : 'password'} placeholder="Wachtwoord" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ ...inp, borderTop: 'none', paddingRight: '2.75rem' }} />
          <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        {err && <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: '0.75rem' }}>{err}</div>}
        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: '0.875rem', marginTop: '0.75rem',
          background: loading ? 'rgba(255,215,0,0.2)' : G.grad, border: 'none',
          color: loading ? 'rgba(255,255,255,0.5)' : '#000', fontSize: '0.88rem', fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer', minHeight: '48px'
        }}>{loading ? 'Inloggen...' : 'INLOGGEN'}</button>
      </div>
    </div>
  )
}
