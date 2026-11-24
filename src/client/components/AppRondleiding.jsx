// src/client/components/AppRondleiding.jsx
//
// Rondleiding voor nieuwe app-gebruikers (24 nov 2026). Kersten (mascotte)
// laat na de onboarding de vier knoppen onderin zien. Zelfde stijl als de
// onboarding: zwart, wit, goud, grote schuine koppen, getypte tekst.
//
// Alleen voor clients.app_abonnee, één keer per apparaat (localStorage).
// De knoppen in de balk hebben data-rondleiding="<id>"; die worden uitgelicht.

import { useEffect, useLayoutEffect, useState } from 'react'

const GOUD = '#FFD700'
const KOP = { fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: '1.45rem', lineHeight: 1.1, letterSpacing: '-0.01em', color: '#fff' }
const ZIN = { fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, marginTop: 6 }

// Per pagina twee stappen (Kersten, 24 nov 2026): eerst de knop onderin,
// dan wat je op die pagina ziet. 'pagina' = welke pagina open moet staan,
// 'wijs' = data-rondleiding van het element dat oplicht. Vindt hij het
// element niet, dan toont hij de stap zonder aanwijzing.
const STAPPEN = [
  { pose: 'juichen', titel: 'Welkom bij MY ARC!', zin: 'Ik laat je snel zien hoe het werkt.' },
  { pagina: 'home', wijs: 'home', pose: 'wijzen', titel: 'Dit is Home', zin: 'Hier begint je dag.' },
  { pagina: 'home', wijs: 'home-dagkiezer', pose: 'wijzen', titel: 'Kies je dag', zin: 'Tik op de pijltjes. Zo zie je een andere dag.' },
  { pagina: 'home', wijs: 'home-dag', pose: 'wijzen', titel: 'Je dag', zin: 'Hier zie je wat je vandaag doet. Training, eten en meer.' },
  { pagina: 'workout', wijs: 'workout', pose: 'wijzen', titel: 'Dit is Workout', zin: 'Hier staat je training.' },
  { pagina: 'workout', wijs: 'workout-vandaag', pose: 'wijzen', titel: 'Je training', zin: 'Tik hierop om te starten. Log je sets na elke oefening.' },
  { pagina: 'meal', wijs: 'meal', pose: 'wijzen', titel: 'Dit is Meal', zin: 'Hier staat je eten.' },
  { pagina: 'meal', wijs: 'meal-macros', pose: 'wijzen', titel: 'Je doel van vandaag', zin: 'Hier zie je hoeveel je nog mag eten.' },
  { pagina: 'meal', wijs: 'meal-lijst', pose: 'wijzen', titel: 'Je maaltijden', zin: 'Vink af wat je hebt gegeten. Of wissel een maaltijd.' },
  { pagina: 'tracking', wijs: 'tracking', pose: 'wijzen', titel: 'Dit is Tracking', zin: 'Hier hou je je voortgang bij.' },
  { pagina: 'tracking', wijs: 'tracking-gewicht', pose: 'wijzen', titel: 'Je gewicht', zin: 'Weeg jezelf en sla het op.' },
  { pagina: 'tracking', wijs: 'tracking-fotos', pose: 'wijzen', titel: 'Je foto\'s', zin: 'Maak elke week een foto. Dan zie je het verschil.' },
  { pagina: 'mijnplan', wijs: 'mijnplan', pose: 'wijzen', titel: 'Dit is Mijn plan', zin: 'Hier pas je zelf je doel, je schema en je abonnement aan.' },
  { pagina: 'home', wijs: 'kersten-ai', pose: 'wijzen', titel: 'Vraag het mij', zin: 'Heb je een vraag? Tik op mij. Ik help je en breng je naar de juiste plek.' },
  { pose: 'spierballen', titel: 'Je bent klaar!', zin: 'Succes. Je kunt het!' },
]

// Zelfde sleutel als in ClientDashboard (rondleidingNodig).
const sleutelVan = (clientId) => `myarc_rondleiding_klaar_${clientId}`

function useTypen(tekst, snelheid = 24) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    let i = 0
    const t = setInterval(() => { i += 1; setN(i); if (i >= tekst.length) clearInterval(t) }, snelheid)
    return () => clearInterval(t)
  }, [tekst, snelheid])
  return tekst.slice(0, n)
}

export default function AppRondleiding({ clientId, onKiesPagina, onKlaar }) {
  const [i, setI] = useState(0)
  const [vak, setVak] = useState(null) // rechthoek van de uitgelichte knop
  const stap = STAPPEN[i]
  const laatste = i === STAPPEN.length - 1

  // Pagina openen en het element opzoeken dat oplicht. Een element op de
  // pagina zelf eerst in beeld scrollen; is het hoger dan het halve scherm,
  // dan alleen het bovenste stuk uitlichten.
  useLayoutEffect(() => {
    setVak(null)
    if (stap.pagina) onKiesPagina?.(stap.pagina)
    if (!stap.wijs) return
    const zoek = () => {
      // Er kunnen verborgen kopieën staan (pagina's blijven open): neem de zichtbare.
      return [...document.querySelectorAll(`[data-rondleiding="${stap.wijs}"]`)].find(e => e.getClientRects().length > 0)
    }
    // Omtrek van het element. Is het zelf (bijna) plat, bijvoorbeeld omdat de
    // inhoud absoluut staat, dan de omtrek van alles wat erin zichtbaar is.
    const omtrek = (el) => {
      const r = el.getBoundingClientRect()
      if (r.height >= 40 && r.width >= 40) return r
      let l = Infinity, t = Infinity, re = -Infinity, o = -Infinity
      for (const k of [el, ...el.querySelectorAll('*')].slice(0, 400)) {
        const q = k.getBoundingClientRect()
        if (q.width < 2 || q.height < 2) continue
        l = Math.min(l, q.left); t = Math.min(t, q.top); re = Math.max(re, q.right); o = Math.max(o, q.bottom)
      }
      return l === Infinity ? null : { left: l, top: t, width: re - l, height: o - t }
    }
    const meet = () => {
      const el = zoek()
      const r = el ? omtrek(el) : null
      if (!r) { setVak(null); return }
      const max = window.innerHeight * 0.45
      setVak({ x: Math.max(4, r.left - 6), y: Math.max(4, r.top - 6), b: Math.min(window.innerWidth - 8, r.width + 12), h: Math.min(max, r.height + 12) })
    }
    const t1 = setTimeout(() => {
      const el = zoek()
      if (el && stap.wijs.includes('-')) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      meet()
    }, 120)
    const t2 = setTimeout(meet, 600) // na het scrollen en laden nog eens meten
    window.addEventListener('resize', meet)
    return () => { window.removeEventListener('resize', meet); clearTimeout(t1); clearTimeout(t2) }
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  const klaar = () => {
    try { localStorage.setItem(sleutelVan(clientId), new Date().toISOString()) } catch { /* privé-venster */ }
    onKiesPagina?.('home')
    onKlaar?.()
  }
  const volgende = () => (laatste ? klaar() : setI(i + 1))

  const heel = `${stap.titel}\n${stap.zin}`
  const getypt = useTypen(heel)
  const [t1, t2 = ''] = getypt.split('\n')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" />
      <style>{`
        .rl-knop { transition: transform .08s ease, box-shadow .08s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .rl-knop:active { transform: translateY(4px); box-shadow: none !important; }
        @keyframes rlHop { 0% { transform: translateY(16px) scale(.94); opacity: 0 } 50% { transform: translateY(-10px) scale(1.02); opacity: 1 } 75% { transform: translateY(2px) } 100% { transform: none } }
        @keyframes rlAdem { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes rlPuls { 0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 0 rgba(255,215,0,0.6) } 50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 8px rgba(255,215,0,0) } }
      `}</style>

      {/* Donkere laag, met een gat rond de knop die uitgelegd wordt. */}
      {vak ? (
        <div style={{
          position: 'fixed', left: vak.x, top: vak.y, width: vak.b, height: vak.h, borderRadius: 16,
          border: `3px solid ${GOUD}`, animation: 'rlPuls 1.6s ease-in-out infinite', pointerEvents: 'none',
          transition: 'left .3s ease, top .3s ease, width .3s ease',
        }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)' }} />
      )}

      {/* Overslaan */}
      {!laatste && (
        <button onClick={klaar} style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 16,
          background: 'none', border: 'none', color: '#fff', fontSize: '1.05rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', padding: 8,
        }}>Overslaan</button>
      )}

      {/* Kersten + tekst: midden in beeld, boven de balk onderin. */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        ...(!vak ? { bottom: '50%', transform: 'translateY(50%)' }
          : vak.y > window.innerHeight / 2 ? { bottom: window.innerHeight - vak.y + 18 }
          : { top: Math.min(vak.y + vak.h + 18, window.innerHeight - 330) }),
        display: 'flex', justifyContent: 'center', padding: '0 1.25rem',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div key={i} style={{ width: 120, height: 150, flexShrink: 0, animation: 'rlHop .55s cubic-bezier(.3,1.4,.5,1) both', transformOrigin: '50% 100%' }}>
              <img src={`/mascottes/kersten-${stap.pose}.webp`} alt="" draggable={false}
                style={{ width: 120, height: 180, objectFit: 'contain', objectPosition: 'top', display: 'block', animation: 'rlAdem 3.6s ease-in-out infinite',
                  WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 83%)', maskImage: 'linear-gradient(to bottom, #000 72%, transparent 83%)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 14, display: 'grid' }}>
              {/* Onzichtbare volledige tekst houdt de hoogte vast tijdens het typen. */}
              <div style={{ gridArea: '1 / 1', visibility: 'hidden' }}><div style={KOP}>{stap.titel}</div><div style={ZIN}>{stap.zin}</div></div>
              <div style={{ gridArea: '1 / 1' }}><div style={KOP}>{t1}</div><div style={ZIN}>{t2}</div></div>
            </div>
          </div>
          <button className="rl-knop" onClick={volgende} style={{
            width: '100%', minHeight: 56, marginTop: 4, border: 'none', borderRadius: 10, cursor: 'pointer',
            background: '#fff', color: '#000', boxShadow: '0 4px 0 #9b9b9b', fontFamily: 'inherit',
            fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase',
          }}>{laatste ? 'Aan de slag' : i === 0 ? 'Laat zien' : 'Volgende'}</button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            {STAPPEN.map((_, k) => (
              <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, background: k <= i ? GOUD : 'rgba(255,255,255,0.3)', transition: 'width .25s ease' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
