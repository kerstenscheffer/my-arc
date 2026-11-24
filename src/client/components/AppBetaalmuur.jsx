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
import { haalAanbod, koop, herstel, VOORWAARDEN_URL, PRIVACY_URL } from '../../lib/appAbonnement'

// Kersten (24 nov 2026): groot, vet, wit, korte zinnen.
const VOORDELEN = [
  'Jouw eigen eetplan',
  'Jouw eigen training',
  'Eten loggen in een tik',
  'Zie hoe je vooruitgaat',
]

const knopWit = {
  width: '100%', minHeight: 54, borderRadius: 14, background: '#fff', border: 'none', color: '#0a0a0a',
  fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const linkKnop = {
  background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit',
  fontSize: '1rem', fontWeight: 900, cursor: 'pointer', padding: '0.6rem 0.4rem',
  display: 'inline-flex', alignItems: 'center', gap: 6, touchAction: 'manipulation',
}

export default function AppBetaalmuur({ authUserId, voornaam, titel, onGelukt, onTerug, onLogout }) {
  const [aanbod, setAanbod] = useState(null) // null = laden, [] = niets
  const [gekozen, setGekozen] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)

  useEffect(() => {
    let leeft = true
    haalAanbod(authUserId)
      .then(a => { if (!leeft) return; setAanbod(a); setGekozen(a[0]?.id || null) })
      .catch(() => { if (leeft) setAanbod([]) })
    return () => { leeft = false }
  }, [authUserId])

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

  return (
    <div style={{
      minHeight: '100dvh', background: '#0a0a0a', color: '#fff',
      display: 'flex', justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 1rem) 1rem calc(env(safe-area-inset-bottom) + 1rem)',
    }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        {onTerug && (
          <button onClick={onTerug} style={{ ...linkKnop, paddingLeft: 0 }}>
            <ArrowLeft size={16} strokeWidth={2.6} /> Terug
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: onTerug ? 4 : 16 }}>
          <img src="/mascottes/kersten-duim.webp" alt="" style={{ width: 110, height: 165, objectFit: 'contain' }} />
          <div style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: 8 }}>
            {titel || (voornaam ? `${voornaam}, ga door met MY ARC` : 'Ga door met MY ARC')}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VOORDELEN.map(v => (
            <div key={v} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: '#10b981', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} strokeWidth={3.2} />
              </span>
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
              <button key={a.id} onClick={() => setGekozen(a.id)} style={{
                width: '100%', textAlign: 'left', padding: '0.95rem 1rem', borderRadius: 16, cursor: 'pointer',
                background: actief ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${actief ? '#10b981' : 'rgba(255,255,255,0.14)'}`,
                color: '#fff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 11,
                  border: `2px solid ${actief ? '#10b981' : 'rgba(255,255,255,0.4)'}`,
                  background: actief ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {actief && <Check size={13} strokeWidth={3.4} color="#0a0a0a" />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 900 }}>
                    {a.maanden === 12 ? 'Jaar' : a.maanden === 1 ? 'Maand' : `${a.maanden} maanden`}
                    {extra && <span style={{ fontSize: '0.9rem', fontWeight: 900, background: '#10b981', color: '#0a0a0a', borderRadius: 6, padding: '2px 6px' }}>{extra}</span>}
                  </span>
                  {a.proef && <span style={{ display: 'block', fontSize: '1rem', fontWeight: 900, color: '#fff', marginTop: 2 }}>Eerste {a.proefDuur} gratis</span>}
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 900 }}>{a.prijs}</span>
                  <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>
                    {a.maanden === 12 ? (a.perMaand ? `${a.perMaand} /mnd` : 'per jaar') : a.maanden === 1 ? 'per maand' : 'per periode'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {keuze && (
          <>
            <button onClick={start} disabled={bezig} style={{ ...knopWit, marginTop: 18, opacity: bezig ? 0.6 : 1 }}>
              {bezig ? 'Even wachten…' : keuze.proef ? `Start gratis` : 'Start'}
            </button>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.45, marginTop: 12, textAlign: 'center' }}>
              {keuze.proef
                ? `Eerst ${keuze.proefDuur} gratis. Daarna ${keuze.prijs} per ${keuze.maanden === 12 ? 'jaar' : 'maand'}. `
                : `${keuze.prijs} per ${keuze.maanden === 12 ? 'jaar' : 'maand'}. `}
              Het loopt vanzelf door. Stoppen? Zeg het 24 uur voor het einde op in je Apple ID.
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
