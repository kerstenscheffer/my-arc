// src/client/components/KerstenAI.jsx
//
// Kersten AI (24 nov 2026): zwevend knopje met Kerstens gezicht, rechtsonder
// boven de balk, alleen voor app-gebruikers (clients.app_abonnee). Tik erop en
// je chat met Kersten. Hij beantwoordt vragen en kan je naar een pagina sturen
// (knop in zijn antwoord).
//
// Server: edge function kersten-ai (limiet 20 vragen per dag, geschiedenis in
// kersten_ai_berichten). Stijl: zwart, wit, goud; groot en vet.

import { useEffect, useRef, useState } from 'react'
import { X, ArrowUp, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const GOUD = '#FFD700'
const PAGINA_NAAM = { home: 'Home', workout: 'Workout', meal: 'Meal', tracking: 'Tracking', boodschappen: 'Boodschappen', agenda: 'Agenda', profile: 'Profiel' }
const SUGGESTIES = ['Hoe log ik mijn eten?', 'Hoeveel eiwit moet ik eten?', 'Waar zie ik mijn training?', 'Ik heb geen zin vandaag. Tips?']

function Gezicht({ maat = 60 }) {
  // Uitsnede van het hoofd uit de mascotte (560x840).
  const breed = Math.round(maat * 1.85)
  return (
    <span style={{ width: maat, height: maat, borderRadius: '50%', overflow: 'hidden', display: 'block', background: '#1a1a1c', flexShrink: 0 }}>
      <img src="/mascottes/kersten-duim.webp" alt="" draggable={false}
        style={{ width: breed, height: 'auto', marginLeft: -(breed * 0.5 - maat / 2) + breed * 0.02, marginTop: -maat * 0.02, display: 'block' }} />
    </span>
  )
}

export default function KerstenAI({ onNavigeer, isMobile = true }) {
  const [open, setOpen] = useState(false)
  const [berichten, setBerichten] = useState([]) // { rol: 'vraag'|'antwoord', tekst, acties }
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [over, setOver] = useState(null)
  const [geladen, setGeladen] = useState(false)
  const lijstRef = useRef(null)

  // Bij openen: de berichten van vandaag ophalen.
  useEffect(() => {
    if (!open || geladen) return
    const begin = new Date(); begin.setHours(0, 0, 0, 0)
    supabase.from('kersten_ai_berichten').select('rol, tekst, acties, created_at')
      .gte('created_at', begin.toISOString()).order('created_at', { ascending: true }).limit(60)
      .then(({ data }) => {
        setBerichten((data || []).map(b => ({ rol: b.rol, tekst: b.tekst, acties: b.acties || [] })))
        setGeladen(true)
      }, () => setGeladen(true))
  }, [open, geladen])

  useEffect(() => {
    const el = lijstRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [berichten, bezig, open])

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

  const ga = (pagina) => { setOpen(false); onNavigeer?.(pagina) }

  if (!open) {
    return (
      <button data-rondleiding="kersten-ai" onClick={() => setOpen(true)} aria-label="Vraag het Kersten" style={{
        position: 'fixed', right: isMobile ? 14 : 24, bottom: isMobile ? 96 : 104, zIndex: 95,
        width: 62, height: 62, borderRadius: '50%', padding: 0, cursor: 'pointer',
        border: `3px solid ${GOUD}`, background: '#1a1a1c', boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <Gezicht maat={56} />
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, background: '#0b0b0c', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" />
      <style>{'@keyframes kaiPunt { 0%,80%,100% { opacity: .25 } 40% { opacity: 1 } }'}</style>

      {/* Kop */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px', borderBottom: '1px solid #222' }}>
        <Gezicht maat={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: '1.2rem' }}>Kersten</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: GOUD }}>Stel je vraag</div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Sluiten" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, display: 'flex' }}>
          <X size={28} strokeWidth={3} />
        </button>
      </div>

      {/* Berichten */}
      <div ref={lijstRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {geladen && berichten.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 12 }}>
            <img src="/mascottes/kersten-wijzen.webp" alt="" style={{ height: 180, width: 'auto' }} />
            <div style={{ fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: '1.4rem', marginTop: 8 }}>Hoi! Waar kan ik je mee helpen?</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 6 }}>Vraag alles over je training, je eten of de app.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 18 }}>
              {SUGGESTIES.map(s => (
                <button key={s} onClick={() => stuur(s)} style={{
                  width: '100%', minHeight: 50, borderRadius: 10, border: '2px solid #2e2e31', background: '#1a1a1c', color: '#fff',
                  fontSize: '1.02rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0 14px',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {berichten.map((b, i) => b.rol === 'vraag' ? (
          <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#fff', color: '#000', borderRadius: '16px 16px 4px 16px', padding: '10px 14px', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.35 }}>
            {b.tekst}
          </div>
        ) : (
          <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Gezicht maat={30} />
            <div style={{ background: '#1a1a1c', border: '1px solid #2e2e31', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{b.tekst}</div>
              {(b.acties || []).filter(a => a.type === 'navigeer' && PAGINA_NAAM[a.pagina]).map(a => (
                <button key={a.pagina} onClick={() => ga(a.pagina)} style={{
                  marginTop: 10, minHeight: 44, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: GOUD, color: '#000', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', textTransform: 'uppercase',
                  display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 3px 0 #9c8200',
                }}>Ga naar {PAGINA_NAAM[a.pagina]} <ArrowRight size={18} strokeWidth={3} /></button>
              ))}
            </div>
          </div>
        ))}

        {bezig && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Gezicht maat={30} />
            <div style={{ background: '#1a1a1c', border: '1px solid #2e2e31', borderRadius: '16px 16px 16px 4px', padding: '14px 16px', display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(k => <span key={k} style={{ width: 9, height: 9, borderRadius: 5, background: '#fff', animation: `kaiPunt 1.2s ${k * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Invoer */}
      <form onSubmit={e => { e.preventDefault(); stuur() }} style={{ padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)', borderTop: '1px solid #222' }}>
        {over !== null && over <= 5 && (
          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: GOUD, marginBottom: 8 }}>Nog {over} {over === 1 ? 'vraag' : 'vragen'} vandaag</div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={invoer} onChange={e => setInvoer(e.target.value)} placeholder="Typ je vraag…" maxLength={1000}
            style={{ flex: 1, minHeight: 52, borderRadius: 12, border: '2px solid #2e2e31', background: '#1a1a1c', color: '#fff', padding: '0 14px', fontSize: '1.05rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none' }} />
          <button type="submit" disabled={bezig || !invoer.trim()} aria-label="Verstuur" style={{
            width: 52, height: 52, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: invoer.trim() && !bezig ? GOUD : '#3a3a3d', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowUp size={24} strokeWidth={3.2} /></button>
        </div>
      </form>
    </div>
  )
}
