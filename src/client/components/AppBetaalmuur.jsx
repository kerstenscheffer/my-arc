// src/client/components/AppBetaalmuur.jsx
//
// Betaalmuur voor het app-abonnement (24 nov 2026). Alleen in de native app.
// Wordt getoond aan:
//   - zelf aangemaakte app-accounts zonder lopend abonnement;
//   - oud-klanten op slot die in het slotscherm voor "App-abonnement" kiezen.
//
// Apple-eisen die hier in zitten: prijs en looptijd per optie, proefmaand en
// automatische verlenging uitgelegd, Herstel aankopen, links naar de
// gebruiksvoorwaarden en de privacyverklaring.

import { useEffect, useState } from 'react'
import { Check, LogOut, ArrowLeft, RotateCcw } from 'lucide-react'
import { haalAanbod, koop, herstel, abonnementMogelijk, VOORWAARDEN_URL, PRIVACY_URL, OPZEG_PLEK } from '../../lib/appAbonnement'

// Kersten (24 nov 2026): groot, vet, wit, korte zinnen.
const VOORDELEN = [
  'Jouw eigen eetplan',
  'Jouw eigen training',
  'Eten loggen in een tik',
  'Zie hoe je vooruitgaat',
]

// Stijl van de onboarding (thema 'arc', 24 nov 2026): zwart, wit, goud, schuine koppen.
const GOUD = '#FFD700'
const KOP = { fontFamily: '"Archivo Black", "Arial Black", sans-serif', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em' }
const CSS = `
  .bm-knop { transition: transform .08s ease, box-shadow .08s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .bm-knop:not(:disabled):active { transform: translateY(4px); box-shadow: none !important; }
`
const knopWit = {
  width: '100%', minHeight: 58, borderRadius: 10, background: '#fff', border: 'none', color: '#000',
  fontSize: '1.15rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'uppercase',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 0 #9b9b9b',
}
const linkKnop = {
  background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit',
  fontSize: '1rem', fontWeight: 900, cursor: 'pointer', padding: '0.6rem 0.4rem',
  display: 'inline-flex', alignItems: 'center', gap: 6, touchAction: 'manipulation',
}

// voorbeeldAanbod: alleen voor /test-betaalmuur (screenshot voor App Store Connect);
// toont de muur met vaste prijzen zonder winkel en zonder kopen.
export default function AppBetaalmuur({ authUserId, voornaam, titel, onGelukt, onTerug, onLogout, voorbeeldAanbod = null }) {
  const [aanbod, setAanbod] = useState(null) // null = laden, [] = niets
  const [gekozen, setGekozen] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)

  useEffect(() => {
    let leeft = true
    if (voorbeeldAanbod) { setAanbod(voorbeeldAanbod); setGekozen(voorbeeldAanbod[0]?.id || null); return }
    haalAanbod(authUserId)
      .then(a => { if (!leeft) return; setAanbod(a); setGekozen(a[0]?.id || null) })
      .catch(() => { if (leeft) setAanbod([]) })
    return () => { leeft = false }
  }, [authUserId, voorbeeldAanbod])

  const keuze = aanbod?.find(a => a.id === gekozen) || null
  const maand = aanbod?.find(a => a.maanden === 1)
  const besparing = (a) => {
    if (!maand || !a.maanden || a.maanden <= 1 || !maand.prijsGetal) return null
    const pct = Math.round((1 - a.prijsGetal / (maand.prijsGetal * a.maanden)) * 100)
    return pct >= 5 ? `${pct}% voordeliger` : null
  }

  const start = async () => {
    if (!keuze || bezig) return
    setBezig(true); setMelding(null)
    const r = await koop(authUserId, keuze.pkg)
    setBezig(false)
    if (r.ok) onGelukt?.()
    else if (!r.geannuleerd) setMelding(r.fout)
  }

  const herstelAankopen = async () => {
    if (bezig) return
    setBezig(true); setMelding(null)
    const r = await herstel(authUserId)
    setBezig(false)
    if (r.ok) onGelukt?.()
    else setMelding(r.fout)
  }

  const open = (url) => window.open(url, '_blank', 'noopener')

  // Op het web kan niemand een abonnement afsluiten: verwijs naar de app.
  if (!abonnementMogelijk() && !voorbeeldAanbod) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <img src="/mascottes/kersten-duim.webp" alt="" style={{ width: 120, height: 180, objectFit: 'contain' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: 10 }}>Open de MY ARC app</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 8, lineHeight: 1.4 }}>Daar start je je abonnement. Daarna werkt het ook hier.</div>
          {onLogout && (
            <button onClick={onLogout} style={{ marginTop: 24, width: '100%', minHeight: 50, borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer' }}>
              Uitloggen
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', color: '#fff',
      background: 'radial-gradient(ellipse at 50% 22%, rgba(255,215,0,0.09) 0%, transparent 60%), #0b0b0c',
      display: 'flex', justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 1rem) 1.25rem calc(env(safe-area-inset-bottom) + 1rem)',
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" />
      <style>{CSS}</style>
      <div style={{ maxWidth: 420, width: '100%' }}>
        {onTerug && (
          <button onClick={onTerug} style={{ ...linkKnop, paddingLeft: 0 }}>
            <ArrowLeft size={16} strokeWidth={2.6} /> Terug
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: onTerug ? 4 : 16 }}>
          <img src="/mascottes/kersten-juichen.webp" alt="" style={{ width: 130, height: 195, objectFit: 'contain' }} />
          <div style={{ ...KOP, fontSize: '1.75rem', lineHeight: 1.08, marginTop: 6 }}>
            {titel || (voornaam ? `${voornaam}, ga door met MY ARC` : 'Ga door met MY ARC')}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VOORDELEN.map(v => (
            <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
              <Check size={22} strokeWidth={3.4} color={GOUD} style={{ flexShrink: 0 }} />
              {v}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {aanbod === null && <div style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>Even laden…</div>}
          {aanbod?.length === 0 && (
            <div style={{ textAlign: 'center', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              Dat lukte niet. Check je internet.
            </div>
          )}
          {aanbod?.map(a => {
            const actief = a.id === gekozen
            const extra = besparing(a)
            return (
              <button key={a.id} className="bm-knop" onClick={() => setGekozen(a.id)} style={{
                width: '100%', textAlign: 'left', padding: '0.95rem 1rem', borderRadius: 10, cursor: 'pointer',
                background: actief ? GOUD : '#1a1a1c', border: 'none', marginBottom: 4,
                boxShadow: `0 4px 0 ${actief ? '#9c8200' : '#000'}`,
                color: actief ? '#000' : '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 12,
                  border: `3px solid ${actief ? '#000' : 'rgba(255,255,255,0.45)'}`,
                  background: actief ? '#000' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {actief && <Check size={13} strokeWidth={3.6} color={GOUD} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {a.maanden === 12 ? 'Jaar' : a.maanden === 1 ? 'Maand' : `${a.maanden} maanden`}
                    {extra && <span style={{ fontSize: '0.85rem', fontWeight: 900, background: actief ? '#000' : GOUD, color: actief ? GOUD : '#000', borderRadius: 6, padding: '2px 6px' }}>{extra}</span>}
                  </span>
                  {a.proef && <span style={{ display: 'block', fontSize: '1rem', fontWeight: 900, marginTop: 2 }}>{a.proefDuur === '1 maand' ? 'Eerste maand gratis' : `Eerste ${a.proefDuur} gratis`}</span>}
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 900 }}>{a.prijs}</span>
                  <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900 }}>
                    {a.maanden === 12 ? (a.perMaand ? `${a.perMaand} /mnd` : 'per jaar') : a.maanden === 1 ? 'per maand' : 'per periode'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {keuze && (
          <>
            <button className="bm-knop" onClick={start} disabled={bezig} style={{ ...knopWit, marginTop: 18, opacity: bezig ? 0.6 : 1 }}>
              {bezig ? 'Even wachten…' : keuze.proef ? `Start gratis` : 'Start'}
            </button>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.45, marginTop: 12, textAlign: 'center' }}>
              {keuze.proef
                ? `Eerst ${keuze.proefDuur} gratis. Daarna ${keuze.prijs} per ${keuze.maanden === 12 ? 'jaar' : 'maand'}. `
                : `${keuze.prijs} per ${keuze.maanden === 12 ? 'jaar' : 'maand'}. `}
              Het loopt vanzelf door. Stoppen? Zeg het 24 uur voor het einde op in {OPZEG_PLEK}.
            </div>
          </>
        )}

        {melding && (
          <div style={{ marginTop: 12, padding: '0.7rem 0.9rem', borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', fontSize: '1rem', fontWeight: 900, lineHeight: 1.4 }}>
            {melding}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 14 }}>
          <button onClick={herstelAankopen} disabled={bezig} style={linkKnop}>
            <RotateCcw size={14} strokeWidth={2.6} /> Herstel aankopen
          </button>
          <button onClick={() => open(VOORWAARDEN_URL)} style={linkKnop}>Voorwaarden</button>
          <button onClick={() => open(PRIVACY_URL)} style={linkKnop}>Privacy</button>
        </div>

        {onLogout && (
          <button onClick={onLogout} style={{
            marginTop: 18, width: '100%', minHeight: 48, borderRadius: 14,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
            fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <LogOut size={16} strokeWidth={2.6} /> Uitloggen
          </button>
        )}
      </div>
    </div>
  )
}
