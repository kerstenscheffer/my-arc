// src/lead-magnet/7secretsfunnel/components/CoverPage.jsx
import { useState, useEffect } from 'react'
import { GOLD, GOLD_BRIGHT, GOLD_DARK } from './shared'

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

export default function CoverPage({ isActive, onOpen, isMobile, isZooming }) {
  const [sparkles, setSparkles] = useState([])
  const countdown = useCountdown()

  useEffect(() => {
    if (!isActive) return
    const s = []
    for (let i = 0; i < (isMobile ? 4 : 6); i++) {
      s.push({ id: i, left: 15+Math.random()*70, top: 8+Math.random()*84, size: 1+Math.random()*1.2, delay: Math.random()*5, dur: 3+Math.random()*3 })
    }
    setSparkles(s)
  }, [isActive, isMobile])

  const a = (d) => ({ opacity: 0, animation: isActive && !isZooming ? 'inkReveal 0.9s ease '+d+'s forwards' : 'none' })
  const pp = "'Poppins', sans-serif"
  const coverImg = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80'

  return (
    <div style={{ position:'absolute',inset:0, display:'flex',flexDirection:'column', alignItems:'center',justifyContent:'flex-start', paddingTop:isMobile?'3vh':'5vh', opacity:isActive?1:0, transition:isZooming?'all 0.8s cubic-bezier(0.4,0,0.2,1)':'all 0.5s cubic-bezier(0.23,1,0.32,1)', pointerEvents:isActive&&!isZooming?'auto':'none', transform:isZooming?'scale(3.5)':isActive?'scale(1)':'scale(0.9)', filter:isZooming?'brightness(2.5) blur(4px)':'none' }}>

      {/* Countdown timer + urgency */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.25rem', marginBottom:isMobile?'0.6rem':'0.75rem', opacity:0, animation:isActive?'inkReveal 0.6s ease 0.1s forwards':'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontFamily:pp, fontSize:isMobile?'0.85rem':'0.95rem', color:GOLD, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>{countdown}</span>
        </div>
        <span style={{ fontFamily:pp, fontSize:isMobile?'0.48rem':'0.52rem', color:'rgba(255,255,255,0.3)', fontWeight:600, textAlign:'center' }}>Lees de secrets & doe gratis mee aan de Summer Shape Giveaway</span>
      </div>

      {/* Headline above book */}
      <div style={{ textAlign:'center', marginBottom:isMobile?'0.75rem':'1rem', maxWidth:isMobile?'90vw':'420px', padding:'0 1rem', opacity:0, animation:isActive?'inkReveal 0.7s ease 0.3s forwards':'none' }}>
        <div style={{ fontFamily:pp, fontSize:isMobile?'1.5rem':'1.8rem', fontWeight:900, color:'#fff', lineHeight:1.25 }}>
          7 Secrets Die <span className="cp-red-gloss">Niemand Je Verteld</span> Om Sneller <span className="cp-green-gloss">Vet Kwijt</span> Te Raken En Er <span className="cp-green-gloss">Gespierd</span> Uit Te Zien Deze Zomer
        </div>
      </div>

      {/* Book */}
      <div onClick={onOpen} style={{ position:'relative', width:isMobile?'55vw':'220px', maxWidth:'240px', cursor:'pointer', WebkitTapHighlightColor:'transparent', outline:'none', userSelect:'none', ...a(0.1) }}>
        <div style={{ position:'relative', width:'100%', borderRadius:'3px', overflow:'hidden', minHeight:isMobile?'40vh':'320px', display:'flex',flexDirection:'column', boxShadow:'0 0 30px rgba(255,186,9,0.15), 0 0 60px rgba(255,186,9,0.08), 0 15px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ position:'absolute',inset:0, backgroundImage:'url('+coverImg+')', backgroundSize:'cover', backgroundPosition:'center top', filter:'brightness(0.25) saturate(0.4) contrast(1.1)' }} />
          <div style={{ position:'absolute',inset:0, background:'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.85) 100%)' }} />
          <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px', background:'linear-gradient(90deg, transparent 5%, '+GOLD+' 50%, transparent 95%)', opacity:0.5, zIndex:3 }} />
          <div style={{ position:'absolute',inset:0, overflow:'hidden', pointerEvents:'none',zIndex:3, borderRadius:'3px' }}>
            <div style={{ position:'absolute', top:'-40%',left:'-20%', width:'160%',height:'160%', background:'linear-gradient(155deg, transparent 42%, rgba(255,255,255,0.06) 44%, rgba(255,255,255,0.1) 46%, rgba(255,255,255,0.06) 48%, transparent 50%)' }} />
          </div>
          <div style={{ position:'relative',zIndex:2, flex:1, display:'flex',flexDirection:'column', alignItems:'center', justifyContent:'center', padding:isMobile?'0.6rem 0.8rem':'0.75rem 1rem' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', width:'100%', ...a(0.3) }}>
              <div style={{ fontFamily:pp, fontSize:isMobile?'3.2rem':'3.8rem', fontWeight:900, lineHeight:1, color:GOLD, marginTop:isMobile?'-0.2rem':'-0.25rem', textShadow:'0 0 30px rgba(255,186,9,0.2), 0 2px 10px rgba(0,0,0,0.5)' }}>7</div>
              <div style={{ display:'flex',flexDirection:'column', marginLeft:isMobile?'0.08rem':'0.1rem' }}>
                <div style={{ fontFamily:pp, fontSize:isMobile?'1.1rem':'1.3rem', fontWeight:800, color:'#fff', letterSpacing:'0.04em', textTransform:'uppercase', lineHeight:1.15, whiteSpace:'nowrap', textShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>SUMMER SHAPE</div>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:isMobile?'1.15rem':'1.4rem', fontWeight:900, color:GOLD, letterSpacing:'0.25em', textTransform:'uppercase', lineHeight:1.15, textShadow:'0 0 20px rgba(255,186,9,0.15), 0 2px 8px rgba(0,0,0,0.5)' }}>SECRETS</div>
              </div>
            </div>
            <div style={{ flex:'0 0 1.5rem' }} />
            <div style={{ textAlign:'center', ...a(0.7) }}>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:isMobile?'0.65rem':'0.75rem', fontWeight:400, color:'rgba(255,255,255,0.45)', lineHeight:1.7, textTransform:'uppercase', letterSpacing:'0.04em', fontStyle:'italic' }}>
                Waarom sommige mannen resultaat zien<br/>en jij nog niet — <span style={{ color:GOLD, fontWeight:700 }}>en hoe je dat verandert</span>
              </div>
            </div>
          </div>
          <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'1px', background:'linear-gradient(90deg, transparent 10%, rgba(255,186,9,0.1) 50%, transparent 90%)', zIndex:3 }} />
        </div>
        <div style={{ position:'absolute', top:'3px',bottom:'3px',right:'-5px',width:'5px', background:'linear-gradient(90deg, #e8e0d0, #f5efe2, #e0d8c8)', borderRadius:'0 2px 2px 0', boxShadow:'1px 0 6px rgba(0,0,0,0.2)' }} />
        <div style={{ position:'absolute', top:'6px',bottom:'6px',right:'-9px',width:'4px', background:'linear-gradient(90deg, #ddd6c6, #ece4d4, #d8d0c0)', borderRadius:'0 2px 2px 0', boxShadow:'1px 0 4px rgba(0,0,0,0.15)' }} />
        <div style={{ position:'absolute', top:'9px',bottom:'9px',right:'-12px',width:'3px', background:'linear-gradient(90deg, #d4ccbc, #e0d8c8)', borderRadius:'0 1px 1px 0', boxShadow:'1px 0 3px rgba(0,0,0,0.1)' }} />
      </div>

      {/* CTA button — opens secrets directly */}
      <button onClick={onOpen} style={{
        marginTop:isMobile?'0.75rem':'1rem', position:'relative', zIndex:10,
        width:isMobile?'75vw':'300px', padding:isMobile?'0.9rem':'1rem', border:'none', borderRadius:'14px',
        fontFamily:pp, fontSize:isMobile?'0.9rem':'1rem', fontWeight:900,
        color:'#000', background:'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
        cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
        boxShadow:'0 4px 25px rgba(255,186,9,0.4)',
        opacity:0,
        animation:isActive?'inkReveal 0.7s ease 0.8s forwards, cpPulse 2s ease-in-out 1.5s infinite, cpShake 0.6s ease-in-out 3s infinite':'none',
      }}>
        <span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.15rem' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem' }}>
            Bekijk De 7 Secrets
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
          <span style={{ fontSize:isMobile?'0.52rem':'0.56rem', fontWeight:600, opacity:0.7 }}>Sneller vet kwijt en spier opbouwen</span>
        </span>
      </button>

      {/* Sparkles */}
      {sparkles.map(s=>(
        <div key={s.id} style={{ position:'absolute', left:s.left+'%', top:s.top+'%', width:s.size+'px', height:s.size+'px', borderRadius:'50%', background:'radial-gradient(circle, #fff, '+GOLD_BRIGHT+')', boxShadow:'0 0 '+(s.size*3)+'px rgba(255,186,9,0.4)', pointerEvents:'none', animation:'sf'+(s.id%3)+' '+s.dur+'s ease-in-out '+s.delay+'s infinite', opacity:0, zIndex:1 }} />
      ))}

      <style>{`
        @keyframes cpPulse{0%,100%{box-shadow:0 4px 20px rgba(255,186,9,0.35)}50%{box-shadow:0 4px 35px rgba(255,186,9,0.6)}}
        @keyframes cpShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-2px)}30%{transform:translateX(2px)}45%{transform:translateX(-1px)}55%{transform:translateX(0)}}
        @keyframes cpFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes cpModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        .cp-gold{background:linear-gradient(135deg,#402400,#ffba09,#ffd44d,#ffba09,#402400);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .cp-red-gloss{font-style:italic;background:linear-gradient(135deg,#cc0000,#ff3333,#ff8888,#ff3333,#cc0000);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(255,50,50,0.3))}
        .cp-green-gloss{font-style:italic;background:linear-gradient(135deg,#b8860b,#ffba09,#ffd44d,#ffba09,#b8860b);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(255,186,9,0.3))}
        @keyframes sf0{0%,100%{opacity:0;transform:translateY(0) scale(0)}15%{opacity:.5;transform:translateY(-12px) translateX(5px) scale(1)}50%{opacity:.15;transform:translateY(-40px) scale(.5)}85%{opacity:.3;transform:translateY(-15px) scale(.9)}}
        @keyframes sf1{0%,100%{opacity:0;transform:scale(0)}20%{opacity:.4;transform:translateY(-18px) translateX(-8px) scale(1)}55%{opacity:.5;transform:translateY(-45px) scale(.6)}80%{opacity:.15;transform:translateY(-25px) scale(.3)}}
        @keyframes sf2{0%,100%{opacity:0;transform:scale(0)}10%{opacity:.4;transform:translate(10px,-8px) scale(.8)}40%{opacity:.2;transform:translate(-4px,-40px) scale(1)}70%{opacity:.4;transform:translate(5px,-20px) scale(.4)}}
      `}</style>
    </div>
  )
}
