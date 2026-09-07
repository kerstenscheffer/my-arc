// src/coach/tabs/ClientViewTab.jsx
//
// De app zoals de klant hem ziet, naast je eigen scherm.
//
// Bedoeld om te controleren of alles goed staat: klopt het meal-plan, staan
// de tijden goed, ziet zijn workout eruit zoals bedoeld. Zet dit paneel in
// split screen naast de Plan Analyzer en je ziet meteen wat je wijziging aan
// de andere kant doet.
//
// Let op wat dit NIET is: je logt niet in op het account van de klant en er
// komt geen wachtwoord aan te pas. Het zijn dezelfde schermen, gevuld met de
// gegevens van die klant — gegevens die je als coach toch al inziet. Je blijft
// zelf ingelogd, dus alles wat je hier zou aanklikken gebeurt onder jouw naam.
// Vandaar de balk bovenaan: zonder dat onderscheid is het te makkelijk te
// denken dat je in zijn account zit.

import React, { useState, useEffect, useMemo } from 'react'
import { Search, User, X, Eye } from 'lucide-react'
import ClientDashboard from '../../client/ClientDashboard'

export default function ClientViewTab({ db, isMobile }) {
  const [clients, setClients] = useState([])
  const [laden, setLaden] = useState(true)
  const [zoek, setZoek] = useState('')
  const [gekozen, setGekozen] = useState(null)
  const [poging, setPoging] = useState(0)

  useEffect(() => {
    let leeft = true
    setLaden(true)
    db.getAllClients()
      .then(lijst => { if (leeft) { setClients(lijst || []); setLaden(false) } })
      .catch(e => { console.error('klanten laden mislukt:', e); if (leeft) setLaden(false) })
    return () => { leeft = false }
  }, [db, poging])

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    const actief = clients.filter(c => c.status !== 'inactive')
    if (!q) return actief.slice(0, 40)
    return actief.filter(c =>
      `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''}`.toLowerCase().includes(q)
    ).slice(0, 40)
  }, [clients, zoek])

  const naam = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.email || 'Klant'

  // ── Kiezer ──
  if (!gekozen) {
    return (
      <div style={{ padding: isMobile ? '1rem' : '1.5rem', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
          <Eye size={16} style={{ color: '#FFD700' }} />
          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Meekijken met een klant</span>
        </div>
        <div style={{
          fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
          marginBottom: '1rem', lineHeight: 1.45, maxWidth: 460,
        }}>
          Zijn schermen met zijn gegevens, om te controleren of alles goed staat.
          Je logt niet in op zijn account.
        </div>

        <div style={{ position: 'relative', maxWidth: 420, marginBottom: '0.9rem' }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)',
          }} />
          <input
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder="Zoek klant…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.55rem 0.7rem 0.55rem 2rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: '#fff',
              fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {laden ? (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Laden…</div>
        ) : gefilterd.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
            {zoek.trim() ? 'Geen klant met die naam.' : (
              <>
                {/* Een lege lijst zonder zoekterm betekent bijna altijd dat de
                    query net misging — bijvoorbeeld terwijl het inlogtoken
                    ververst werd. Zonder deze knop blijft "geen klanten" staan
                    tot je de hele pagina herlaadt. */}
                Geen klanten geladen.{' '}
                <button onClick={() => setPoging(p => p + 1)} style={{
                  background: 'none', border: 'none', padding: 0,
                  color: '#FFD700', fontSize: '0.8rem', fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline',
                }}>Opnieuw proberen</button>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 8, maxWidth: 900,
          }}>
            {gefilterd.map(c => (
              <button
                key={c.id}
                onClick={() => setGekozen(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '0.6rem 0.7rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left', color: '#fff',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.55)',
                }}>
                  {(c.first_name?.[0] || '') + (c.last_name?.[0] || '') || <User size={13} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: '0.82rem', fontWeight: 800,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{naam(c)}</span>
                  <span style={{
                    display: 'block', fontSize: '0.66rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.35)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{c.email}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── De klant-weergave ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Blijft staan zolang je kijkt. Zonder deze balk is niet te zien dat
          dit iemand anders' scherm is met jouw sessie eronder. */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.45rem 0.7rem',
        background: 'rgba(255,215,0,0.08)',
        borderBottom: '1px solid rgba(255,215,0,0.2)',
      }}>
        <Eye size={13} style={{ color: '#FFD700', flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFD700' }}>
          Meekijken met {naam(gekozen)}
        </span>
        <span style={{
          fontSize: '0.64rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
        }}>
          — je bent zelf ingelogd, dus wat je aanklikt telt als jou
        </span>
        <button
          onClick={() => setGekozen(null)}
          title="Andere klant kiezen"
          style={{
            marginLeft: 'auto', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '0.25rem 0.5rem',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 7, color: 'rgba(255,255,255,0.65)',
            fontSize: '0.68rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <X size={11} /> Sluiten
        </button>
      </div>

      {/* De klant-app zelf. Eigen scroll, zodat de balk erboven blijft staan. */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        <ClientDashboard previewClientId={gekozen.id} ingebed />
      </div>
    </div>
  )
}
