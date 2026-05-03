// src/lead-magnet/7secretsfunnel/7SecretsFunnel.jsx
import { useState, useEffect } from 'react'
import { manuscriptStyles } from './components/shared'
import SecretsPage from './components/SecretsPage'
import BonusCard from './components/BonusCard'
import GiveawayPopup from './components/GiveawayPopup'
import FinalSection from './components/FinalSection'

export default function SevenSecretsFunnel() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [showGiveaway, setShowGiveaway] = useState(false)
  const [giveawaySubmitted, setGiveawaySubmitted] = useState(false)
  const [bonusClicked, setBonusClicked] = useState(false)

  useEffect(() => {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script","vokm1bxawa");
  }, [])

  const handleBonusOpen = () => {
    setBonusClicked(true)
    setShowGiveaway(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', overflowX: 'hidden', position: 'relative' }}>
      {/* Dark gym background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.08) saturate(0.2)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>

      <SecretsPage
        isMobile={isMobile}
        bonusClicked={bonusClicked}
        bonusSlot={
          <BonusCard
            isMobile={isMobile}
            submitted={giveawaySubmitted}
            isBlocking={!bonusClicked}
            onOpen={handleBonusOpen}
          />
        }
      />

      <FinalSection isMobile={isMobile} />

      </div>

      <GiveawayPopup
        show={showGiveaway}
        isMobile={isMobile}
        onClose={() => setShowGiveaway(false)}
        onSubmitted={() => setGiveawaySubmitted(true)}
      />
      <style>{`
        .ss-gold{background:linear-gradient(135deg,#402400,#ffba09,#ffd44d,#ffba09,#402400);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;font-style:italic}
        .ss-gold-gloss{font-style:italic;background:linear-gradient(135deg,#b8860b,#ffba09,#ffd44d,#ffba09,#b8860b);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(255,186,9,0.3))}
        .ss-red-gloss{font-style:italic;background:linear-gradient(135deg,#cc0000,#ff3333,#ff8888,#ff3333,#cc0000);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(255,50,50,0.3))}
        @keyframes ssFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes ssPulse{0%,100%{box-shadow:0 4px 20px rgba(255,186,9,0.35)}50%{box-shadow:0 4px 35px rgba(255,186,9,0.6)}}
        @keyframes ssSlide{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes ssBonusGlow{0%,100%{box-shadow:0 0 10px rgba(255,186,9,0.15)}50%{box-shadow:0 0 25px rgba(255,186,9,0.3),0 0 50px rgba(255,186,9,0.1)}}
        @keyframes ssShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes ssSparkle{0%,100%{opacity:0;transform:scale(0)}20%{opacity:0.6;transform:scale(1)}50%{opacity:0.15;transform:scale(0.5)}80%{opacity:0.4;transform:scale(0.8)}}
        @keyframes ssRowShake{0%,100%{transform:translateX(0)}3%{transform:translateX(-5px)}6%{transform:translateX(5px)}9%{transform:translateX(-3px)}12%{transform:translateX(3px)}15%{transform:translateX(0)}}
        @keyframes ssBonusShake{0%,100%{transform:translateX(0)}4%{transform:translateX(-6px) rotate(-0.5deg)}8%{transform:translateX(6px) rotate(0.5deg)}12%{transform:translateX(-4px)}16%{transform:translateX(4px)}20%{transform:translateX(-2px)}24%{transform:translateX(0)}}
      `}</style>
      <style>{manuscriptStyles}</style>
    </div>
  )
}
