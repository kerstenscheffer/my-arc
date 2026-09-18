// src/client/components/StappenKaart.jsx
//
// Stappen van vandaag op de homepagina: één getal, een balk en de week eronder.
//
// Waarom hier en niet in tracking: stappen zijn een dagding waar je 's avonds
// nog iets aan kunt doen. Staat het achter een tabblad, dan kijk je er pas naar
// als de dag voorbij is.
//
// Telt de telefoon mee, dan vult hij zichzelf; anders tik je je stand in. Die
// twee staan bewust in dezelfde kaart: voor de klant is het één getal, niet
// twee systemen.

import { useCallback, useEffect, useState } from 'react'
import { Footprints, Plus, X } from 'lucide-react'
import StappenService, { STANDAARD_DOEL, vandaagIso } from '../../modules/steps/StappenService'
import { heeftTelefoonBron, stappenVanVandaag, vraagToestemming } from '../../modules/steps/telefoonStappen'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function StappenKaart({ client, db, isMobile = false }) {
  const [dagen, setDagen] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [laden, setLaden] = useState(true)
  const [invoer, setInvoer] = useState(null)   // null = dicht, anders de tekst

  const laad = useCallback(async () => {
    if (!client?.id) return
    const [rijen, d] = await Promise.all([
      StappenService.haalDagen(db, client.id, 7),
      StappenService.haalDoel(db, client.id),
    ])
    setDagen(rijen)
    setDoel(d)
    setLaden(false)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  // Telt de telefoon mee, dan is zijn stand de waarheid van vandaag: die is
  // altijd hoger of gelijk aan wat iemand zelf intikte.
  useEffect(() => {
    if (!client?.id || !heeftTelefoonBron()) return
    let weg = false
    ;(async () => {
      const ok = await vraagToestemming()
      if (!ok || weg) return
      const n = await stappenVanVandaag()
      if (weg || n == null) return
      await StappenService.bewaar(db, client.id, n, { source: 'telefoon' }).catch(e =>
        console.error('Stappen van telefoon opslaan mislukt:', e))
      if (!weg) laad()
    })()
    return () => { weg = true }
  }, [db, client?.id, laad])

  if (laden || !client?.id) return null

  const vandaag = dagen[dagen.length - 1]
  const stand = vandaag?.steps || 0
  const pct = doel > 0 ? Math.min(100, (stand / doel) * 100) : 0
  const gehaald = stand >= doel && doel > 0

  const bewaar = async (waarde) => {
    const n = Math.max(0, Math.min(200000, parseInt(String(waarde).replace(/\D/g, ''), 10) || 0))
    setInvoer(null)
    setDagen(d => d.map((x, i) => i === d.length - 1 ? { ...x, steps: n } : x))
    try {
      await StappenService.bewaar(db, client.id, n, { datum: vandaagIso(), source: 'handmatig' })
    } catch (e) {
      console.error('Stappen opslaan mislukt:', e)
      laad()
    }
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Footprints size={16} color="#0a0a0a" strokeWidth={2.6} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.56rem', fontWeight: 900, color: 'rgba(10,10,10,0.45)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Stappen vandaag
            </div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 900, color: '#0a0a0a',
              letterSpacing: '-0.03em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
            }}>
              {nl(stand)}
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(10,10,10,0.35)', marginLeft: 6 }}>
                van {nl(doel)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setInvoer(String(stand || ''))}
            title="Stappen invullen"
            aria-label="Stappen invullen"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0a0a0a', border: 'none', color: '#fff', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={17} strokeWidth={3} />
          </button>
        </div>

        {/* De balk van vandaag. */}
        <div style={{
          height: 6, borderRadius: 3, marginTop: '0.7rem',
          background: 'rgba(10,10,10,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: gehaald ? '#10b981' : '#0a0a0a',
            transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
        </div>

        {/* De week eronder: waar staat vandaag tussen de rest. */}
        <div style={{ display: 'flex', gap: 4, marginTop: '0.7rem', alignItems: 'flex-end' }}>
          {dagen.map((d, i) => {
            const h = doel > 0 ? Math.min(100, (d.steps / doel) * 100) : 0
            const laatste = i === dagen.length - 1
            return (
              <div key={d.iso} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`${d.iso}: ${nl(d.steps)} stappen`}
                  style={{
                    height: 24, borderRadius: 4, overflow: 'hidden',
                    background: 'rgba(10,10,10,0.06)',
                    display: 'flex', alignItems: 'flex-end',
                  }}
                >
                  <div style={{
                    width: '100%', height: `${h}%`,
                    background: d.steps >= doel ? '#10b981' : laatste ? '#0a0a0a' : 'rgba(10,10,10,0.35)',
                  }} />
                </div>
                <div style={{
                  marginTop: 2, fontSize: '0.5rem', fontWeight: 900,
                  color: laatste ? 'rgba(10,10,10,0.6)' : 'rgba(10,10,10,0.25)',
                  textTransform: 'uppercase',
                }}>
                  {d.dag}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {invoer !== null && (
        <Invoer
          waarde={invoer}
          isMobile={isMobile}
          onWijzig={setInvoer}
          onSluit={() => setInvoer(null)}
          onBewaar={() => bewaar(invoer)}
        />
      )}
    </div>
  )
}

// Je stand intikken. Geen plusknopjes van 1000: je leest het getal van je
// telefoon af en typt het over.
function Invoer({ waarde, isMobile, onWijzig, onSluit, onBewaar }) {
  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.72)',
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
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Stappen vandaag
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={{
            width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
          }}>
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
    </div>
  )
}
