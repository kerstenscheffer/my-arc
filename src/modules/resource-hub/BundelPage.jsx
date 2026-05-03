// src/modules/resource-hub/BundelPage.jsx
import { useState } from 'react'
import { G, GREEN, IMG, I, Row, Banner, Breather, SectionHead } from './Blocks'
import { QuizModal, LoginModal } from './Modals'

const { List, Activity, Heart, Play, Flame, MessageCircle, ArrowRight, Shield, LogIn } = I

export default function BundelPage({ db, bundel, user, client, isMember: propIsMember, navigate }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const m = window.innerWidth <= 768

  const isMember = propIsMember !== undefined ? propIsMember : !!(user && client)

  const cta = () => {
    if (bundel?.whatsapp_prompt && isMember) {
      window.open(`https://wa.me/31612345678?text=${encodeURIComponent(bundel.whatsapp_prompt)}`, '_blank')
    } else if (bundel?.calendly_url) {
      window.open(bundel.calendly_url, '_blank')
    } else {
      setShowLogin(true)
    }
  }

  const goTo = (sub) => navigate ? navigate(`/hub/${bundel?.slug || 'cardio'}/${sub}`) : null

  const handleLogin = async () => {
    setShowLogin(false)
    window.location.reload()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>

      {/* ═══ 1. HERO — topbar als transparante overlay ═══ */}
      <div style={{ position: 'relative', height: m ? '240px' : '300px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bundel?.hero_image || IMG.hero})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.94) 100%)' }} />

        {/* Top bar overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>MY ARC</div>
          {isMember
            ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem', fontWeight: '700', color: GREEN, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}><Shield size={12} /> LID</div>
            : <button onClick={() => setShowLogin(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.55rem', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: '0.63rem', fontWeight: '600', cursor: 'pointer', minHeight: '32px', touchAction: 'manipulation' }}><LogIn size={14} /> Inloggen</button>
          }
        </div>

        {/* Title */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: m ? '1.25rem 1rem' : '1.5rem', zIndex: 2 }}>
          <div style={{ fontSize: '0.46rem', fontWeight: '700', color: G.primary, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.45rem' }}>{bundel?.subtitle || 'CARDIO SYSTEEM'}</div>
          <h1 style={{ margin: 0, fontSize: m ? '1.5rem' : '1.9rem', fontWeight: '900', color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em' }}>{bundel?.title || 'Het Lean Machine\nCardio Plan'}</h1>
        </div>
      </div>

      {/* ═══ 2. ROW — Cardio Menu ═══ */}
      <Row
        title="Cardio Menu — 15+ Vormen"
        label="GRATIS · INTERACTIEF"
        image={IMG.menu} BadgeIcon={List} badgeColor={G.primary} tag="GRATIS"
        locked={false} isMember={isMember}
        onClick={() => goTo('menu')}
        info={[{ text: '15+ vormen' }, { text: 'Tips & uitleg' }]}
      />

      {/* ═══ 3. QUIZ — speels los element, geen container ═══ */}
      <div onClick={() => setShowQuiz(true)} style={{
        padding: m ? '2rem 1.25rem' : '2.5rem 1.5rem',
        cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}>
        <div style={{
          fontSize: m ? '1.3rem' : '1.6rem', fontWeight: '900', color: '#fff',
          lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '0.75rem'
        }}>
          Welke cardio past<br />
          <span style={{ color: G.primary }}>bij jou?</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            padding: '0.4rem 0.85rem', background: G.grad, borderRadius: '8px',
            fontSize: '0.7rem', fontWeight: '700', color: '#000',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
          }}>
            Doe de quiz <ArrowRight size={14} />
          </div>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', fontWeight: '500' }}>4 vragen · 30 sec</span>
        </div>
      </div>

      {/* ═══ 4. SECTION HEAD ═══ */}
      <SectionHead pre="EXCLUSIEF" title="Jouw Plan Op Maat" />

      {/* ═══ 5. ROW — Schema ═══ */}
      <Row title="8-Weken Opbouwschema" label="PER CARDIOVORM" image={IMG.schema} BadgeIcon={Activity} badgeColor="#a855f7" locked isMember={isMember} onClick={() => goTo('schema')} onCTA={cta} info={[{ Icon: Activity, text: 'Progressief' }, { text: 'Deload weken' }]} />

      {/* ═══ 6. BREATHER ═══ */}
      <Breather text="Kies je cardiovorm, krijg een schema van week 1 tot 8." />

      {/* ═══ 7. ROW — Blessure ═══ */}
      <Row title="Blessure Gids" label="PER BLESSURE" image={IMG.blessure} BadgeIcon={Heart} badgeColor="#ef4444" locked isMember={isMember} onClick={() => goTo('blessures')} onCTA={cta} info={[{ Icon: Heart, text: 'Per blessure' }, { text: 'Alternatieven' }]} />

      {/* ═══ 8. SECTION HEAD ═══ */}
      <SectionHead title="Leer Het Systeem" />

      {/* ═══ 9. BANNER — Video Serie ═══ */}
      <Banner
        title='Videoserie: Cardio Zonder Haten'
        label="5 VIDEOS · VIDEO 1 GRATIS" desc="Van mindset tot planning — alles wat je moet weten."
        image={IMG.video} gradient="linear-gradient(135deg, rgba(59,130,246,0.12), rgba(0,0,0,0.92))"
        BtnIcon={Play} btn="Bekijk" locked={false} isMember={isMember} onClick={() => goTo('serie')}
      />

      {/* ═══ 10. BREATHER ═══ */}
      <Breather text="Track elke sessie. Zie je progressie. Bouw een streak op." />

      {/* ═══ 11. BANNER — Tracking ═══ */}
      <Banner
        title="Cardio Logging & Streaks"
        label="APP FEATURE" desc="Log sessies, verdien badges, zie je voortgang."
        image={IMG.tracking} gradient="linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,0,0,0.92))"
        BtnIcon={Flame} btn="Open" locked isMember={isMember} onClick={() => {}} onCTA={cta}
      />

      {/* ═══ 12. 1-op-1 CTA ═══ */}
      <div style={{ height: '1rem' }} />
      <div onClick={cta} style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: m ? '1.125rem 1rem' : '1.25rem',
        background: isMember ? 'linear-gradient(135deg, rgba(16,185,129,0.04), transparent)' : 'linear-gradient(135deg, rgba(255,215,0,0.03), transparent)',
        borderTop: `1px solid ${isMember ? 'rgba(16,185,129,0.1)' : G.border}`,
        borderBottom: `1px solid ${isMember ? 'rgba(16,185,129,0.1)' : G.border}`,
        cursor: 'pointer', touchAction: 'manipulation'
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: isMember ? 'rgba(16,185,129,0.07)' : 'rgba(255,215,0,0.04)', border: `1px solid ${isMember ? 'rgba(16,185,129,0.15)' : G.borderActive}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle size={20} color={isMember ? GREEN : G.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '0.08rem' }}>{isMember ? 'Hulp Met Cardio?' : '1-op-1 Cardio Intake'}</div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>{isMember ? 'Stuur een bericht voor een plan op maat.' : '15 min call — ontdek welke cardiovorm bij jou past.'}</div>
        </div>
        <div style={{ padding: '0.45rem 0.8rem', borderRadius: '7px', background: isMember ? 'linear-gradient(135deg, #25D366, #128C7E)' : G.grad, color: isMember ? '#fff' : '#000', fontSize: '0.68rem', fontWeight: '700', flexShrink: 0 }}>{isMember ? 'Chat' : 'Plan Call'}</div>
      </div>

      {/* ═══ 13. BOTTOM CTA — visitors ═══ */}
      {!isMember && (
        <div style={{ padding: '2.5rem 1.5rem 3.5rem', textAlign: 'center' }}>
          <div style={{ width: '16px', height: '1px', background: G.primary, margin: '0 auto 1rem', opacity: 0.3 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>Alles unlocken?</div>
          <p style={{ margin: '0 auto 1.5rem', fontSize: '0.73rem', color: 'rgba(255,255,255,0.15)', lineHeight: 1.5, maxWidth: '240px' }}>Toegang tot dit systeem + 17 andere bundels.</p>
          <button onClick={cta} style={{ padding: '1rem 2.25rem', background: G.grad, border: 'none', color: '#000', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', minHeight: '52px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px', touchAction: 'manipulation' }}>PLAN EEN GRATIS CALL <ArrowRight size={14} /></button>
        </div>
      )}

      {showLogin && <LoginModal db={db} onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} isMember={isMember} onCTA={cta} />}
      <style>{`*{box-sizing:border-box;margin:0}input::placeholder{color:rgba(255,255,255,0.15)}`}</style>
    </div>
  )
}
