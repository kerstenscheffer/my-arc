// src/client/components/KerstenAI.jsx
//
// Kersten AI (24 nov 2026), alleen voor app-gebruikers (clients.app_abonnee).
// Drie standen (Kersten, 24 nov):
//   1. dicht: Kersten staat los op de pagina, rechts boven de balk. Tik op hem.
//   2. balk:  een smalle chatbalk boven de balk onderin, met het laatste
//             antwoord erboven en een knop naar volledig scherm.
//   3. vol:   volledig scherm. Kersten links van zijn tekst, alles onderin bij
//             de typebalk; de typebalk heeft een gouden rand.
// Antwoorden kunnen een knop "Ga naar …" hebben (tool navigeer op de server).
//
// Server: edge function kersten-ai (20 vragen per dag, geschiedenis in
// kersten_ai_berichten). Stijl: zwart, wit, goud; groot en vet.

import { useEffect, useRef, useState } from 'react'
import { X, ArrowUp, ArrowRight, Maximize2, Minimize2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const GOUD = '#FFD700'
const KOP = { fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase' }
const PAGINA_NAAM = { home: 'Home', workout: 'Workout', meal: 'Meal', tracking: 'Tracking', boodschappen: 'Boodschappen', agenda: 'Agenda', profile: 'Profiel' }
const SUGGESTIES = ['Hoe log ik mijn eten?', 'Hoeveel eiwit moet ik eten?', 'Waar zie ik mijn training?', 'Ik heb geen zin vandaag. Tips?']
const BALK_ONDER = 92 // boven de zwevende balk onderin

function Punten() {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '4px 2px' }}>
      {[0, 1, 2].map(k => <span key={k} style={{ width: 9, height: 9, borderRadius: 5, background: '#fff', animation: `kaiPunt 1.2s ${k * 0.2}s infinite` }} />)}
    </div>
  )
}

function GaNaar({ acties, onGa }) {
  return (acties || []).filter(a => a.type === 'navigeer' && PAGINA_NAAM[a.pagina]).map(a => (
    <button key={a.pagina} onClick={() => onGa(a.pagina)} style={{
      marginTop: 8, minHeight: 36, padding: '0 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
      background: GOUD, color: '#000', fontSize: '0.92rem', fontWeight: 900, fontFamily: 'inherit', textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 3px 0 #9c8200',
    }}>Ga naar {PAGINA_NAAM[a.pagina]} <ArrowRight size={16} strokeWidth={3} /></button>
  ))
}

// Typebalk: gouden rand, groot, duidelijk.
function TypeBalk({ invoer, setInvoer, bezig, onStuur, autoFocus, rechts }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onStuur() }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input value={invoer} onChange={e => setInvoer(e.target.value)} placeholder="Typ hier je vraag…" maxLength={1000} autoFocus={autoFocus}
        style={{
          flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12, border: `2px solid ${GOUD}`, background: '#141416', color: '#fff',
          padding: '0 12px', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
        }} />
      <button type="submit" disabled={bezig || !invoer.trim()} aria-label="Verstuur" style={{
        width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: invoer.trim() && !bezig ? GOUD : '#3a3a3d', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><ArrowUp size={20} strokeWidth={3.2} /></button>
      {rechts}
    </form>
  )
}

const ikoonKnop = {
  width: 44, height: 44, borderRadius: 12, border: '2px solid #333', background: '#141416', color: '#fff', cursor: 'pointer',
  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export default function KerstenAI({ onNavigeer, isMobile = true }) {
  const [stand, setStand] = useState('dicht') // 'dicht' | 'balk' | 'vol'
  const [berichten, setBerichten] = useState([]) // { rol: 'vraag'|'antwoord', tekst, acties }
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [over, setOver] = useState(null)
  const [geladen, setGeladen] = useState(false)
  const lijstRef = useRef(null)

  // Bij de eerste keer openen: de berichten van vandaag ophalen.
  useEffect(() => {
    if (stand === 'dicht' || geladen) return
    const begin = new Date(); begin.setHours(0, 0, 0, 0)
    supabase.from('kersten_ai_berichten').select('rol, tekst, acties, created_at')
      .gte('created_at', begin.toISOString()).order('created_at', { ascending: true }).limit(60)
      .then(({ data }) => {
        setBerichten((data || []).map(b => ({ rol: b.rol, tekst: b.tekst, acties: b.acties || [] })))
        setGeladen(true)
      }, () => setGeladen(true))
  }, [stand, geladen])

  useEffect(() => {
    const el = lijstRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [berichten, bezig, stand])

  const stuur = async (tekst) => {
    const vraag = (tekst ?? invoer).trim()
    if (!vraag || bezig) return
    setInvoer('')
    setBerichten(b => [...b, { rol: 'vraag', tekst: vraag }])
    setBezig(true)
    const { data, error } = await supabase.functions.invoke('kersten-ai', { body: { vraag } }).then(r => r, e => ({ error: e }))
    setBezig(false)
    if (error || !data?.antwoord) {
      setBerichten(b => [...b, { rol: 'antwoord', tekst: 'Er ging even iets mis. Probeer het zo nog eens.' }])
      return
    }
    setBerichten(b => [...b, { rol: 'antwoord', tekst: data.antwoord, acties: data.acties || [] }])
    if (typeof data.over === 'number') setOver(data.over)
  }

  const ga = (pagina) => { setStand('dicht'); onNavigeer?.(pagina) }
  const laatste = [...berichten].reverse().find(b => b.rol === 'antwoord')
  const laatsteVraag = berichten.length && berichten[berichten.length - 1].rol === 'vraag' ? berichten[berichten.length - 1] : null

  const stijlen = (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" />
      <style>{`
        @keyframes kaiPunt { 0%,80%,100% { opacity: .25 } 40% { opacity: 1 } }
        @keyframes kaiAdem { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes kaiIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
      `}</style>
    </>
  )

  // ── 1. Dicht: Kersten los op de pagina ────────────────────────────────────
  if (stand === 'dicht') {
    return (
      // Alleen zijn bovenlijf steekt boven de balk onderin uit; de balk (zIndex
      // 101) ligt over zijn onderkant. Onderaan afknippen, boven en opzij niet.
      <button data-rondleiding="kersten-ai" onClick={() => setStand('balk')} aria-label="Vraag het Kersten" style={{
        position: 'fixed', right: isMobile ? 8 : 20, bottom: isMobile ? 58 : 66, zIndex: 95,
        width: 104, height: 92, padding: 0, border: 'none', background: 'none', cursor: 'pointer', overflow: 'visible',
        clipPath: 'inset(-60px -60px 0 -60px)', WebkitClipPath: 'inset(-60px -60px 0 -60px)',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        {stijlen}
        <img src="/mascottes/kersten-wijzen.webp" alt="" draggable={false} style={{
          width: 104, height: 'auto', display: 'block', marginTop: 4,
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))', animation: 'kaiAdem 3.6s ease-in-out infinite',
        }} />
      </button>
    )
  }

  // ── 2. Balk: smalle chat boven de balk onderin ────────────────────────────
  if (stand === 'balk') {
    return (
      <div style={{ position: 'fixed', left: 10, right: 10, bottom: BALK_ONDER, zIndex: 120, animation: 'kaiIn .25s ease both' }}>
        {stijlen}
        <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
          {/* Kersten staat op de balk, rechts */}
          {/* Alleen zijn bovenlijf boven de chatbalk; de rest valt erachter. */}
          <img src="/mascottes/kersten-wijzen.webp" alt="" draggable={false} style={{
            position: 'absolute', right: 6, bottom: '100%', marginBottom: -84, width: 100, height: 'auto', pointerEvents: 'none',
            filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))', animation: 'kaiAdem 3.6s ease-in-out infinite',
          }} />
          <div style={{ position: 'relative', background: 'rgb(11,11,12)', border: '1px solid #2e2e31', borderRadius: 18, padding: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            {/* Laatste vraag/antwoord, kort */}
            {(bezig || laatste) && (
              <div style={{ padding: '4px 64px 10px 4px', maxHeight: '32vh', overflowY: 'auto' }}>
                {bezig ? (
                  <>
                    {laatsteVraag && <div style={{ fontSize: '1rem', fontWeight: 900, color: GOUD, marginBottom: 6 }}>{laatsteVraag.tekst}</div>}
                    <Punten />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4, color: '#fff', whiteSpace: 'pre-wrap' }}>{laatste.tekst}</div>
                    <GaNaar acties={laatste.acties} onGa={ga} />
                  </>
                )}
              </div>
            )}
            {!bezig && !laatste && (
              <div style={{ ...KOP, fontSize: '1.15rem', color: '#fff', padding: '4px 64px 10px 4px' }}>Vraag het mij!</div>
            )}
            <TypeBalk invoer={invoer} setInvoer={setInvoer} bezig={bezig} onStuur={() => stuur()} autoFocus={!isMobile}
              rechts={
                <>
                  <button type="button" onClick={() => setStand('vol')} aria-label="Volledig scherm" style={ikoonKnop}><Maximize2 size={18} strokeWidth={2.8} /></button>
                  <button type="button" onClick={() => setStand('dicht')} aria-label="Sluiten" style={ikoonKnop}><X size={20} strokeWidth={3} /></button>
                </>
              } />
          </div>
        </div>
      </div>
    )
  }

  // ── 3. Vol: volledig scherm ───────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, background: '#0b0b0c', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {stijlen}
      {/* Kop: alleen sluiten en kleiner maken */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 14px 6px' }}>
        <div style={{ ...KOP, fontSize: '1.2rem' }}>Kersten</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStand('balk')} aria-label="Kleiner" style={{ ...ikoonKnop, width: 46, height: 46 }}><Minimize2 size={20} strokeWidth={2.8} /></button>
          <button onClick={() => setStand('dicht')} aria-label="Sluiten" style={{ ...ikoonKnop, width: 46, height: 46 }}><X size={24} strokeWidth={3} /></button>
        </div>
      </div>

      {/* Berichten: onderin, vlak boven de typebalk */}
      <div ref={lijstRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {geladen && berichten.length === 0 && (
            <>
              {/* Kersten links van zijn tekst */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <img src="/mascottes/kersten-wijzen.webp" alt="" style={{ height: 170, width: 'auto', flexShrink: 0, animation: 'kaiAdem 3.6s ease-in-out infinite' }} />
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ ...KOP, fontSize: '1.45rem', lineHeight: 1.1 }}>Hoi! Waar kan ik je mee helpen?</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 6, lineHeight: 1.35 }}>Vraag alles over je training, je eten of de app.</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SUGGESTIES.map(s => (
                  <button key={s} onClick={() => stuur(s)} style={{
                    width: '100%', minHeight: 50, borderRadius: 12, border: '2px solid #2e2e31', background: '#1a1a1c', color: '#fff',
                    fontSize: '1.02rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0 14px',
                  }}>{s}</button>
                ))}
              </div>
            </>
          )}

          {berichten.map((b, i) => b.rol === 'vraag' ? (
            <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#fff', color: '#000', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.35 }}>
              {b.tekst}
            </div>
          ) : (
            <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '90%', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <img src="/mascottes/kersten-duim.webp" alt="" style={{ height: 54, width: 'auto', flexShrink: 0 }} />
              <div style={{ background: '#1a1a1c', border: '1px solid #2e2e31', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{b.tekst}</div>
                <GaNaar acties={b.acties} onGa={ga} />
              </div>
            </div>
          ))}

          {bezig && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <img src="/mascottes/kersten-denken.webp" alt="" style={{ height: 54, width: 'auto', flexShrink: 0 }} />
              <div style={{ background: '#1a1a1c', border: '1px solid #2e2e31', borderRadius: '16px 16px 16px 4px', padding: '12px 16px' }}><Punten /></div>
            </div>
          )}
        </div>
      </div>

      {/* Typebalk */}
      <div style={{ padding: '10px 14px calc(env(safe-area-inset-bottom, 0px) + 14px)', background: '#0b0b0c', borderTop: '1px solid #222' }}>
        {over !== null && over <= 5 && (
          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: GOUD, marginBottom: 8 }}>Nog {over} {over === 1 ? 'vraag' : 'vragen'} vandaag</div>
        )}
        <TypeBalk invoer={invoer} setInvoer={setInvoer} bezig={bezig} onStuur={() => stuur()} autoFocus={!isMobile} />
      </div>
    </div>
  )
}
