// src/modules/resource-hub/pages/CardioBlessures.jsx
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react'

const G = { primary: '#FFD700', border: 'rgba(255, 215, 0, 0.08)', grad: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }

export default function CardioBlessures({ db, bundel, user, client, isMember, navigate }) {
  const isMobile = window.innerWidth <= 768

  if (!isMember) return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <Lock size={32} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.6 }} />
      <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: '800' }}>Blessure Alternatieve Gids</h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', maxWidth: '300px', lineHeight: 1.5 }}>Exclusief voor MY ARC leden. Ontdek welke cardiovormen bij jouw blessure werken.</p>
      <button onClick={() => bundel.calendly_url ? window.open(bundel.calendly_url, '_blank') : navigate(`/hub/${bundel.slug}`)} style={{ padding: '0.875rem 1.5rem', background: G.grad, border: 'none', color: '#000', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderRadius: '10px' }}>Word Lid <ArrowRight size={16} /></button>
      <button onClick={() => navigate(`/hub/${bundel.slug}`)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ArrowLeft size={14} /> Terug</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: isMobile ? '1rem' : '1.5rem' }}>
      <button onClick={() => navigate(`/hub/${bundel.slug}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '0.5rem 0', marginBottom: '0.75rem' }}><ArrowLeft size={14} /> Terug</button>
      <h1 style={{ margin: '0 0 0.25rem', fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: '900' }}>Blessure Alternatieve Gids</h1>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>Selecteer je blessure en ontdek opties.</p>
      <div style={{ padding: '3rem', textAlign: 'center', borderBottom: `1px solid ${G.border}`, borderTop: `1px solid ${G.border}` }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>Blessure gids wordt binnenkort toegevoegd</p>
      </div>
    </div>
  )
}
