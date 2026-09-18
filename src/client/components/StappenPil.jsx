// src/client/components/StappenPil.jsx
//
// Stappen van vandaag naast de begroeting, en de week erachter.
//
// Waarom zo klein: het is één getal dat je in het voorbijgaan wilt zien, geen
// kaart die een halve schermhoogte opeist. Wil je weten hoe de week loopt, dan
// tik je erop — daar staan de totalen, de dagen en het veld om je stand bij te
// werken.
//
// Telt de telefoon mee, dan vult hij zichzelf (zie telefoonStappen.js); anders
// tik je hem in. Voor de klant is het één getal, niet twee systemen.

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Footprints, X, Pencil, Smartphone, Check } from 'lucide-react'
import StappenService, { STANDAARD_DOEL, vandaagIso } from '../../modules/steps/StappenService'
import {
  heeftTelefoonBron, isGekoppeld, koppel, stappenVanVandaag,
} from '../../modules/steps/telefoonStappen'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kort = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : nl(n))

export default function StappenPil({ client, db, isMobile = false }) {
  const [week, setWeek] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [open, setOpen] = useState(false)
  const [klaar, setKlaar] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const [dagen, d] = await Promise.all([
      StappenService.haalWeek(db, client.id),
      StappenService.haalDoel(db, client.id),
    ])
    setWeek(dagen)
    setDoel(d)
    setKlaar(true)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  // Is Apple Health gekoppeld, dan is zijn stand de waarheid van vandaag.
  // Zonder koppeling gebeurt hier niets — geen popup bij het opstarten.
  useEffect(() => {
    if (!client?.id || !isGekoppeld()) return
    let weg = false
    ;(async () => {
      if (!(await heeftTelefoonBron()) || weg) return
      const n = await stappenVanVandaag()
      if (weg || n == null) return
      await StappenService.bewaar(db, client.id, n, { source: 'telefoon' })
        .catch(e => console.error('Stappen van telefoon opslaan mislukt:', e))
      if (!weg) laad()
    })()
    return () => { weg = true }
  }, [db, client?.id, laad])

  // Kan er gekoppeld worden op dit toestel? Alleen dan tonen we de knop.
  const [bron, setBron] = useState(false)
  useEffect(() => {
    let weg = false
    heeftTelefoonBron().then(b => { if (!weg) setBron(b) })
    return () => { weg = true }
  }, [])

  const koppelNu = async () => {
    const n = await koppel()
    if (n == null) return false
    await StappenService.bewaar(db, client.id, n, { source: 'telefoon' })
      .catch(e => console.error('Stappen van telefoon opslaan mislukt:', e))
    laad()
    return true
  }

  if (!klaar || !client?.id) return null

  const vandaag = week.find(d => d.isVandaag)
  const stand = vandaag?.steps || 0
  const pct = doel > 0 ? Math.min(100, (stand / doel) * 100) : 0
  const gehaald = stand >= doel && doel > 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Stappen van deze week"
        aria-label={`Stappen vandaag: ${nl(stand)}. Bekijk je week.`}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.6rem',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${gehaald ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Footprints size={13} strokeWidth={2.6} color={gehaald ? '#10b981' : 'rgba(255,255,255,0.55)'} />
        <span style={{
          fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 900,
          letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
        }}>
          {kort(stand)}
        </span>
        {/* Streepje van hoever je bent: net genoeg om te zien of je op koers
            ligt zonder het getal te lezen. */}
        <span style={{
          width: 18, height: 3, borderRadius: 2, flexShrink: 0,
          background: 'rgba(255,255,255,0.14)', overflow: 'hidden',
        }}>
          <span style={{
            display: 'block', width: `${pct}%`, height: '100%',
            background: gehaald ? '#10b981' : '#fff',
          }} />
        </span>
      </button>

      {open && (
        <WeekModal
          week={week}
          doel={doel}
          isMobile={isMobile}
          bron={bron}
          onKoppel={koppelNu}
          onSluit={() => setOpen(false)}
          onBewaar={async (n, iso) => {
            setWeek(w => w.map(d => d.iso === iso ? { ...d, steps: n, source: 'handmatig' } : d))
            try {
              await StappenService.bewaar(db, client.id, n, { datum: iso, source: 'handmatig' })
            } catch (e) {
              console.error('Stappen opslaan mislukt:', e)
            }
            laad()
          }}
        />
      )}
    </>
  )
}

// De week: wat er staat, en de mogelijkheid om een dag bij te werken. Ook
// gisteren, want je vult je stappen zelden op tijd in.
function WeekModal({ week, doel, isMobile, bron, onKoppel, onSluit, onBewaar }) {
  const [bewerk, setBewerk] = useState(null)   // { iso, tekst }
  const [koppelen, setKoppelen] = useState(false)
  const [gekoppeld, setGekoppeld] = useState(() => isGekoppeld())

  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') (bewerk ? setBewerk(null) : onSluit()) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [bewerk, onSluit])

  const geweest = week.filter(d => !d.toekomst)
  const totaal = geweest.reduce((s, d) => s + d.steps, 0)
  const gemiddeld = geweest.length ? Math.round(totaal / geweest.length) : 0
  const gehaaldeDagen = geweest.filter(d => doel > 0 && d.steps >= doel).length
  const beste = geweest.reduce((b, d) => (d.steps > (b?.steps || 0) ? d : b), null)
  const hoogste = Math.max(doel, ...week.map(d => d.steps), 1)

  return createPortal(
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'min(420px, 100%)',
          maxHeight: isMobile ? '92dvh' : '90vh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '18px 18px 0 0' : 18,
          padding: isMobile
            ? '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
            : '1.1rem 1.25rem 1.25rem',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Deze week
            </div>
            <div style={{
              fontSize: '1.05rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em', marginTop: 2,
            }}>
              Stappen
            </div>
          </div>
          <button onClick={onSluit} aria-label="Sluiten" style={kaal}>
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Vier getallen die samen de week vertellen. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: '1rem' }}>
          <Stat label="Totaal" waarde={nl(totaal)} />
          <Stat label="Gemiddeld per dag" waarde={nl(gemiddeld)} />
          <Stat label="Doel gehaald" waarde={`${gehaaldeDagen} van ${geweest.length}`} />
          <Stat label="Beste dag" waarde={beste?.steps ? `${nl(beste.steps)}` : '—'} onder={beste?.steps ? beste.dag : null} />
        </div>

        {/* De dagen zelf. Tik een dag aan om hem bij te werken — ook gisteren,
            want je vult je stappen zelden op tijd in. */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', marginBottom: '0.8rem' }}>
          {week.map(d => {
            const h = Math.min(100, (d.steps / hoogste) * 100)
            const raak = doel > 0 && d.steps >= doel
            return (
              <button
                key={d.iso}
                onClick={() => !d.toekomst && setBewerk({ iso: d.iso, tekst: String(d.steps || '') })}
                disabled={d.toekomst}
                title={d.toekomst ? 'Komt nog' : `${d.iso}: ${nl(d.steps)} stappen${d.source ? ` (${d.source})` : ''}`}
                style={{
                  flex: 1, padding: 0, background: 'transparent', border: 'none',
                  cursor: d.toekomst ? 'default' : 'pointer', fontFamily: 'inherit',
                  opacity: d.toekomst ? 0.35 : 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  height: 68, borderRadius: 6, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  border: d.isVandaag ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  display: 'flex', alignItems: 'flex-end',
                }}>
                  <div style={{
                    width: '100%', height: `${h}%`,
                    background: raak ? '#10b981' : d.isVandaag ? '#fff' : 'rgba(255,255,255,0.3)',
                    transition: 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  }} />
                </div>
                <div style={{
                  marginTop: 3, fontSize: '0.54rem', fontWeight: 900,
                  color: d.isVandaag ? '#fff' : 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                }}>
                  {d.dag}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{
          fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
          marginBottom: '0.9rem', lineHeight: 1.4,
        }}>
          Doel {nl(doel)} per dag · tik een dag aan om hem bij te werken
        </div>

        <button onClick={() => {
          const v = week.find(d => d.isVandaag)
          setBewerk({ iso: v?.iso || vandaagIso(), tekst: String(v?.steps || '') })
        }} style={{
          width: '100%', minHeight: 46, borderRadius: 12, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: '#fff', color: '#0a0a0a',
          fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <Pencil size={14} strokeWidth={3} />
          Stappen van vandaag invullen
        </button>

        {/* Apple Health. Pas hier vragen we toestemming: op de homepagina zou
            dat een popup zijn die uit de lucht komt vallen. */}
        {bron && (
          <button
            onClick={async () => {
              if (gekoppeld) return
              setKoppelen(true)
              const ok = await onKoppel()
              setKoppelen(false)
              setGekoppeld(ok)
            }}
            disabled={gekoppeld || koppelen}
            style={{
              width: '100%', minHeight: 40, marginTop: 8, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'transparent',
              border: `1px solid ${gekoppeld ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: gekoppeld ? '#10b981' : 'rgba(255,255,255,0.6)',
              fontSize: '0.72rem', fontWeight: 800, fontFamily: 'inherit',
              cursor: gekoppeld ? 'default' : 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {gekoppeld ? <Check size={13} strokeWidth={3} /> : <Smartphone size={13} strokeWidth={2.8} />}
            {koppelen ? 'Bezig…' : gekoppeld ? 'Apple Health is gekoppeld' : 'Automatisch uit Apple Health'}
          </button>
        )}

        {bewerk && (
          <Invoer
            waarde={bewerk.tekst}
            datum={bewerk.iso}
            isMobile={isMobile}
            onWijzig={(t) => setBewerk(b => ({ ...b, tekst: t }))}
            onSluit={() => setBewerk(null)}
            onBewaar={() => {
              const n = Math.max(0, Math.min(200000, parseInt(bewerk.tekst.replace(/\D/g, ''), 10) || 0))
              setBewerk(null)
              onBewaar(n, bewerk.iso)
            }}
          />
        )}
      </div>
    </div>,
    document.body
  )
}

function Stat({ label, waarde, onder = null }) {
  return (
    <div style={{
      padding: '0.6rem 0.7rem', borderRadius: 12,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        fontSize: '0.54rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.09em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.05rem', fontWeight: 900, color: '#fff',
        letterSpacing: '-0.02em', marginTop: 2, fontVariantNumeric: 'tabular-nums',
      }}>
        {waarde}
        {onder && (
          <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginLeft: 5 }}>
            {onder}
          </span>
        )}
      </div>
    </div>
  )
}

// Je stand intikken. Geen plusknopjes van duizend: je leest het getal van je
// telefoon af en typt het over.
function Invoer({ waarde, datum, isMobile, onWijzig, onSluit, onBewaar }) {
  const dagLabel = (() => {
    try {
      return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })
    } catch { return datum }
  })()

  return createPortal(
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483120,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'min(360px, 100%)',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: isMobile ? '18px 18px 0 0' : 18,
          padding: isMobile
            ? '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
            : '1.1rem 1.25rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
          <span style={{
            flex: 1, fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
            textTransform: 'capitalize',
          }}>
            {dagLabel}
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={kaal}>
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <input
          autoFocus
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={waarde}
          onChange={(e) => onWijzig(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => { if (e.key === 'Enter') onBewaar() }}
          placeholder="0"
          style={{
            width: '100%', minHeight: 62, padding: '0 0.9rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: '#fff', fontFamily: 'inherit', outline: 'none',
            fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.03em',
            textAlign: 'center', fontVariantNumeric: 'tabular-nums',
          }}
        />

        <button onClick={onBewaar} style={{
          width: '100%', minHeight: 46, marginTop: '0.9rem', borderRadius: 12, border: 'none',
          background: '#fff', color: '#0a0a0a',
          fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          Opslaan
        </button>
      </div>
    </div>,
    document.body
  )
}

const kaal = {
  width: 30, height: 30, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
