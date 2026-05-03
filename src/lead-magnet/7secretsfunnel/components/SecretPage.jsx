// src/lead-magnet/7secretsfunnel/components/SecretPage.jsx
import { useState, useEffect } from 'react'
import { GOLD, GOLD_BRIGHT, GOLD_DARK } from './shared'

const G = ({children}) => <span className="sp-gold" style={{ fontSize:'105%' }}>{children}</span>
const B = ({children}) => <span style={{ color:'#fff', fontWeight:700, fontSize:'105%' }}>{children}</span>

const DEADLINE = new Date('2026-03-11T12:00:00').getTime()

function useCountdown() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      if (diff <= 0) { setT('Verlopen'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setT((d > 0 ? d+'d ' : '')+h+'u '+m+'m '+s+'s')
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

const icons = {
  flame: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  droplet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
  dumbbell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>,
  utensils: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  sunrise: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
}

const IMAGES = [
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
]

const CONTENT = [
  {
    tag: 'VETVERLIES',
    icon: 'flame',
    title: <>Verhoog je <G>NEAT</G> voor meer eten en sneller vetverlies</>,
    body: <>De mannen die moeiteloos droog de zomer ingaan hebben één ding gemeen: <B>ze bewegen meer buiten de gym.</B><br/><br/>Lopen. Staan. Traplopen. Dit heet NEAT en het verbrandt tot <G>30% van je dagelijkse calorieën.</G><br/><br/>Hoe hoger je NEAT, hoe meer je kunt eten en alsnog vet verliezen. Het mooie? <B>Het kost geen extra willskracht</B> — alleen kleine aanpassingen.</>,
    tip: <>Bij mijn klanten is dit altijd een van de eerste dingen die ik aanpas. <B>Tussen je setjes rondlopen, af en toe wandelen, niet de hele avond op de bank.</B> Kleine veranderingen, groot verschil in hoe snel dat buikvet verdwijnt.</>,
  },
  {
    tag: 'BUIKVET',
    icon: 'moon',
    title: <>Waarom dat laatste laagje <G>buikvet</G> niet weg wil</>,
    body: <>Je doet alles goed maar dat laagje rond je buik blijft zitten.<br/><br/>Een van de meest voorkomende oorzaken? <G>Chronisch hoog cortisol</G> door te weinig slaap en te veel stress.<br/><br/>Je lichaam geeft dan het signaal om <B>vet vast te houden — juist rond je buik.</B><br/><br/>Beter slapen en minder stress 's avonds kan het verschil maken tussen een zachte buik en <G>zichtbare abs.</G></>,
    tip: <>Wat mij enorm helpt is 's avonds mijn volgende dag voorbereiden. Dat haalt stress weg. Daarnaast: <B>koude kamer, warme douche, telefoon weg.</B> Simpele dingen die ervoor zorgen dat je lichaam 's nachts écht herstelt.</>,
  },
  {
    tag: 'DEFINITIE',
    icon: 'droplet',
    title: <>Meer <G>spierdefinitie</G> door een simpele dagelijkse gewoonte</>,
    body: <>Je hebt misschien al meer spieren dan je denkt — <B>ze zijn alleen niet zichtbaar.</B><br/><br/>Door te weinig water te drinken houdt je lichaam vocht vast onder je huid. Dat maakt je <B>zachter en platter</B> dan je eigenlijk bent.<br/><br/>Mannen die er altijd droog en gedefinieerd uitzien drinken vaak <G>3+ liter per dag.</G> Het is een van de simpelste dingen die je kunt doen voor meer definitie.</>,
    tip: <>Bijna elke klant die bij mij start drinkt te weinig. Zodra ze naar <B>3+ liter</B> gaan zien ze binnen dagen verschil. Geen nieuwe spieren — gewoon <B>zichtbaar maken wat er al zit.</B></>,
  },
  {
    tag: 'SPIERGROEI',
    icon: 'dumbbell',
    title: <>De ene set die <G>80%</G> van je groei bepaalt</>,
    body: <>De meeste mannen bouwen hun sets op: licht beginnen, steeds zwaarder.<br/><br/>Maar tegen de tijd dat ze bij hun zwaarste set komen is <B>hun energie al op.</B><br/><br/>Het geheim van de gasten met de grootste armen? Ze doen na een goede warm-up <G>direct hun zwaarste set</G> — wanneer hun kracht en focus op het hoogst zijn.<br/><br/>Die ene set tot falen stimuleert <B>meer spiervezels dan alle andere sets samen.</B></>,
    tip: <>Dit is een van de dingen die ik bij elke klant direct verander. <B>Goede warm-up, dan vol gas op die eerste werkset.</B> Ze tillen zwaarder, groeien sneller, en zijn eerder klaar.</>,
  },
  {
    tag: 'VOEDING',
    icon: 'utensils',
    title: <>Dezelfde carbs, ander moment — meer energie en een <G>droger</G> lichaam</>,
    body: <>Je hoeft <B>niet minder te eten</B> om er droger uit te zien. Het gaat ook om <G>wanneer</G> je eet.<br/><br/>Plan 50-60% van je koolhydraten rond je training. Je spieren gebruiken ze als brandstof en voor herstel.<br/><br/>Het resultaat: <B>meer energie in de gym, sneller herstel</B>, en een lichaam dat koolhydraten <G>gebruikt in plaats van opslaat.</G></>,
    tip: <>Ik doe altijd <B>3 uur voor de training</B> een grotere maaltijd met eiwit en koolhydraten, dan 1 uur van tevoren snel opneembare koolhydraten. Ze eten niet minder, alleen <B>slimmer.</B></>,
  },
  {
    tag: 'VETVERBRANDING',
    icon: 'sunrise',
    title: <>De makkelijkste manier om extra <G>vet te verliezen</G> zonder harder te diëten</>,
    body: <>'s Ochtends voor je eerste maaltijd zijn je glycogeenvoorraden laag. Daardoor schakelt je lichaam sneller over op <G>vetverbranding.</G><br/><br/>Een wandeling, fietsen naar werk, of gewoon je ochtend actief beginnen — het verbrandt <B>meer vet dan diezelfde beweging na de lunch.</B><br/><br/>Het mooie: je hoeft niet minder te eten. Je benut alleen het moment waarop je lichaam <G>al klaarstaat om vet te verbranden.</G></>,
    tip: <>Bij veel van mijn klanten stel ik het ontbijt iets uit. <B>Niet als straf</B>, maar omdat het hun ochtend verandert in een vetverbrandingsmoment. Resultaat: <B>plattere buik, nul extra moeite.</B></>,
  },
  {
    tag: 'HORMONEN',
    icon: 'zap',
    title: <><G>Testosteron</G> verhogen — gratis en effectiever dan elk supplement</>,
    body: <><G>95% van je testosteron</G> wordt aangemaakt tijdens diepe slaap.<br/><br/>Zonlicht stimuleert vitamine D, direct gelinkt aan <B>hogere testosteron.</B> Gezonde vetten leveren het cholesterol dat je lichaam nodig heeft.<br/><br/>Dit zijn drie <G>gratis dingen</G> die effectiever zijn dan welk supplement dan ook — en ze zorgen voor <B>meer spiergroei, meer energie en minder buikvet.</B></>,
    tip: <>Het eerste wat ik bij elke klant check is <B>slaap.</B> Niet training, niet voeding — slaap. Als dat niet op orde is, werkt de rest half zo goed. <B>Goeie slaap, voldoende zon, gezonde vetten</B> — en je lichaam doet de rest.</>,
  },
]

export default function SecretPage({ secret, isActive, animState, isMobile, onNext }) {
  const vis = isActive && animState === 'active'
  const countdown = useCountdown()
  const ir = (idx) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(8px)',
    transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1) '+(0.2+idx*0.1)+'s',
  })
  const pp = "'Poppins', sans-serif"
  const ci = "'Cinzel', serif"
  const content = CONTENT[secret.number - 1]
  const bgImg = IMAGES[secret.number - 1]

  return (
    <div style={{ position:'absolute',inset:0, opacity:isActive?1:0, transform:animState==='turn-out'?'rotateY(-90deg) scale(0.95)':animState==='turn-in'?'rotateY(90deg) scale(0.95)':'none', transformOrigin:'left center', transition:animState==='turn-out'?'all 0.3s cubic-bezier(0.55,0.06,0.68,0.19)':'all 0.35s cubic-bezier(0.23,1,0.32,1)', pointerEvents:isActive?'auto':'none', overflow:'hidden' }}>

      {/* Background photo */}
      <div style={{ position:'absolute',inset:0, backgroundImage:'url('+bgImg+')', backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(0.22) saturate(0.3)' }} />
      <div style={{ position:'absolute',inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)' }} />

      <div style={{ position:'relative',zIndex:2, height:'100%', display:'flex',flexDirection:'column',alignItems:'center', padding:isMobile?'1rem 1.25rem':'1.5rem 2rem', overflowY:'auto' }}>

        {/* Progress bar */}
        <div style={{ ...ir(0), width:'100%',maxWidth:'440px', display:'flex',gap:'4px', marginBottom:'0.35rem' }}>
          {[1,2,3,4,5,6,7].map(n => (
            <div key={n} style={{ flex:1, height:'2.5px', borderRadius:'1px', background: n <= secret.number ? GOLD : 'rgba(255,255,255,0.06)', transition:'background 0.3s' }} />
          ))}
        </div>

        {/* Timer + giveaway reminder — prominent */}
        <div style={{ ...ir(0), display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem', marginBottom:isMobile?'0.6rem':'0.75rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontFamily:pp, fontSize:isMobile?'0.58rem':'0.64rem', color:'rgba(255,255,255,0.35)', fontWeight:600 }}>Giveaway eindigt over</span>
          <span style={{ fontFamily:pp, fontSize:isMobile?'0.7rem':'0.78rem', color:GOLD, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>{countdown}</span>
        </div>

        {/* Secret number + icon — subtle label */}
        <div style={{ ...ir(0), display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:isMobile?'0.25rem':'0.3rem' }}>
          <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'rgba(255,186,9,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {icons[content.icon]}
          </div>
          <div style={{ fontFamily:pp, fontSize:isMobile?'0.55rem':'0.6rem', fontWeight:700, color:'rgba(255,186,9,0.5)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{'Secret '+secret.number}</div>
        </div>

        {/* Tag */}
        <div style={{ ...ir(1), fontFamily:pp, fontSize:'0.52rem', fontWeight:700, letterSpacing:'0.2em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:'0.3rem' }}>{content.tag}</div>

        {/* Title — PRIMARY focus */}
        <h2 style={{ ...ir(1), fontFamily:pp, fontSize:isMobile?'1.45rem':'1.7rem', fontWeight:900, lineHeight:1.3, color:'#fff', textAlign:'center', maxWidth:'420px', margin:'0 0 0.1rem' }}>{content.title}</h2>

        <div style={{ flex:'0 0 '+(isMobile?'0.6rem':'0.8rem') }} />

        {/* Body — formatted, scannable, READABLE */}
        <div style={{ ...ir(2), fontFamily:pp, fontSize:isMobile?'0.88rem':'0.95rem', lineHeight:1.85, color:'rgba(255,255,255,0.5)', fontWeight:400, textAlign:'left', maxWidth:'420px', width:'100%' }}>{content.body}</div>

        <div style={{ flex:'0 0 '+(isMobile?'0.6rem':'0.8rem') }} />

        {/* Tip van Kersten — with star icon */}
        <div style={{ ...ir(3), display:'flex', alignItems:'flex-start', gap:isMobile?'0.5rem':'0.6rem', maxWidth:'420px', width:'100%', background:'rgba(255,186,9,0.03)', border:'1px solid rgba(255,186,9,0.1)', borderRadius:'12px', padding:isMobile?'0.7rem':'0.8rem' }}>
          <div style={{ width:isMobile?'34px':'38px', height:isMobile?'34px':'38px', borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid rgba(255,186,9,0.25)' }}>
            <img src="/coach-modal.png" alt="" style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', marginBottom:'0.2rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={GOLD} stroke={GOLD} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <div style={{ fontFamily:pp, fontSize:'0.5rem', fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'0.1em' }}>Tip van Kersten</div>
            </div>
            <div style={{ fontFamily:pp, fontSize:isMobile?'0.73rem':'0.78rem', color:'rgba(255,255,255,0.55)', fontStyle:'italic', lineHeight:1.65, fontWeight:400 }}>{content.tip}</div>
          </div>
        </div>

        {/* Next button */}
        <div style={{ ...ir(4), paddingTop:isMobile?'0.75rem':'1rem', width:'100%', maxWidth:'420px' }}>
          <button onClick={onNext} style={{
            width:'100%', padding:isMobile?'0.75rem':'0.85rem', border:'none', borderRadius:'12px',
            fontFamily:pp, fontSize:isMobile?'0.78rem':'0.85rem', fontWeight:800,
            color:'#000', background:'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
            cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
            boxShadow:'0 4px 20px rgba(255,186,9,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem',
            animation: vis ? 'spPulse 2s ease-in-out 1s infinite' : 'none'
          }}>
            Volgende Secret
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

      </div>

      <style>{`
        .sp-gold {
          background: linear-gradient(135deg, #402400, #ffba09, #ffd44d, #ffba09, #402400);
          background-size: 100% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          font-style: italic;
        }
        @keyframes spPulse{0%,100%{box-shadow:0 4px 20px rgba(255,186,9,0.25)}50%{box-shadow:0 4px 35px rgba(255,186,9,0.55)}}
      `}</style>
    </div>
  )
}
