// src/modules/challenge-monitor/ChallengeProgressTab.jsx
//
// De challenge-stand van de klant, altijd binnen handbereik: een klein
// knopje linksboven dat naar rechts uitschuift tot een paneel met de zes
// eisen.
//
// Waarom zwevend en niet op Home: het gaat over geld dat je terugkrijgt of
// niet, en dat wil je kunnen checken terwijl je in je workout of je
// maaltijdplan zit — niet alleen op het startscherm.
//
// De getallen komen uit get_challenge_stand, dezelfde bron als het
// coach-overzicht. Zelf tellen zou betekenen dat klant en coach een ander
// antwoord kunnen geven over hetzelfde geld.

import { useEffect, useState } from 'react'
import { Trophy, Activity, Utensils, Weight, Camera, Phone, ClipboardCheck, X, Info } from 'lucide-react'
import { EISEN, ALGEMENE_UITLEG, waardenUit, allesGehaald, challengeNaam, haalDeelname, haalStand, tijdlijn } from './challengeEisen'

const GOUD = '#FFD700'
const GROEN = '#10b981'

const ICONEN = {
  workouts: Activity,
  wegingen: Weight,
  voeding: Utensils,
  checkins: ClipboardCheck,
  fotos: Camera,
  calls: Phone,
}

export default function ChallengeProgressTab({ db, client, isMobile = false }) {
  const [deelname, setDeelname] = useState(null)
  const [stand, setStand] = useState(null)
  const [open, setOpen] = useState(false)
  const [fout, setFout] = useState(null)
  // Welke uitleg openstaat: de sleutel van een eis, of 'algemeen'. Eén tegelijk,
  // zodat het paneel niet uitdijt tot een lap tekst.
  const [uitleg, setUitleg] = useState(null)

  const laad = async () => {
    setFout(null)
    try {
      const d = await haalDeelname(db, client?.id)
      setDeelname(d)
      setStand(d ? await haalStand(db, d) : null)
    } catch (e) {
      console.error('Challenge-stand laden mislukt:', e)
      // Wél tonen dat het misging. Bij een stand waar geld van afhangt is
      // "helemaal niets" een slechter antwoord dan "kon niet laden": dan denkt
      // de klant dat hij niet meedoet.
      setFout(e.message || String(e))
    }
  }

  useEffect(() => { if (client?.id) laad() }, [client?.id])
  // Bij het openen opnieuw ophalen: je logt een maaltijd en kijkt meteen of
  // de dag meetelt. Een stand van een uur geleden is dan onbruikbaar.
  useEffect(() => { if (open && client?.id) laad() }, [open])

  if (fout) {
    return (
      <div style={{
        position: 'fixed',
        top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 10 : 14}px)`,
        left: 12, zIndex: 80,
        display: 'flex', alignItems: 'center', gap: 7,
        height: 40, padding: '0 12px', borderRadius: 999,
        background: 'rgba(10,10,10,0.94)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(239,68,68,0.35)',
        fontSize: '0.78rem', fontWeight: 800, color: '#ef4444',
      }} title={fout}>
        <Trophy size={15} /> Stand kon niet laden
      </div>
    )
  }

  // Geen deelname is geen storing — dan hoort er niets te zweven.
  if (!deelname || !stand) return null

  const w = waardenUit(stand)
  const gehaald = allesGehaald(stand)
  const behaald = EISEN.filter(e => w[e.key] >= e.nodig).length
  const { dag, totaal, resterend } = tijdlijn(deelname)
  const kleur = gehaald ? GROEN : GOUD

  const breedte = open ? (isMobile ? 'calc(100vw - 24px)' : 380) : (isMobile ? 74 : 80)

  return (
    <div
      style={{
        position: 'fixed',
        top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 10 : 14}px)`,
        left: 12,
        width: breedte,
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 80,
        background: 'rgba(10,10,10,0.94)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${gehaald ? 'rgba(16,185,129,0.4)' : 'rgba(255,215,0,0.3)'}`,
        borderRadius: open ? 16 : 999,
        boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), border-radius 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* De knop zelf. Ingeklapt is dit alles wat je ziet: een beker en hoeveel
          eisen je hebt. Uitgeklapt is het de kop van het paneel. */}
      <button
        onClick={() => { setOpen(o => !o); setUitleg(null) }}
        aria-expanded={open}
        aria-label={open ? 'Challenge-stand sluiten' : 'Challenge-stand openen'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', height: 40, padding: '0 12px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        <Trophy size={16} color={kleur} style={{ flexShrink: 0 }} />
        <div style={{
          fontSize: '0.85rem', fontWeight: 900, color: kleur,
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          {behaald}<span style={{ color: 'rgba(255,255,255,0.3)' }}>/{EISEN.length}</span>
        </div>
        {open && (
          <>
            <div style={{
              flex: 1, minWidth: 0, textAlign: 'left',
              fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              nog {resterend} {resterend === 1 ? 'dag' : 'dagen'}
            </div>
            <X size={15} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
          </>
        )}
      </button>

      {/* Paneelinhoud. Alleen renderen als hij open is, anders vangt hij taps
          op terwijl je hem niet ziet. */}
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10,
            fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)',
          }}>
            <span>
              {challengeNaam(deelname.challenge_type)} · dag {dag} van {totaal}
              {deelname.is_paused && <span style={{ color: '#f97316' }}> · gepauzeerd</span>}
            </span>
            <UitlegKnop aan={uitleg === 'algemeen'} onClick={() => setUitleg(u => u === 'algemeen' ? null : 'algemeen')} />
          </div>

          {uitleg === 'algemeen' && (
            <UitlegVak titel="Hoe het werkt" tekst={ALGEMENE_UITLEG} onSluit={() => setUitleg(null)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {EISEN.map(e => {
              const val = w[e.key]
              const ok = val >= e.nodig
              const Icoon = ICONEN[e.key]
              const pct = Math.min(100, (val / e.nodig) * 100)
              return (
                <div key={e.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <Icoon size={13} color={ok ? GROEN : 'rgba(255,255,255,0.4)'} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: ok ? GROEN : '#fff' }}>
                      {e.label}
                    </div>
                    <UitlegKnop aan={uitleg === e.key} onClick={() => setUitleg(u => u === e.key ? null : e.key)} />
                    <div style={{ flex: 1 }} />
                    <div style={{
                      fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                      color: ok ? GROEN : '#fff', flexShrink: 0,
                    }}>
                      {val}<span style={{ color: 'rgba(255,255,255,0.28)' }}>/{e.nodig}</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 2,
                      background: ok ? GROEN : GOUD,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  {uitleg === e.key && (
                    <UitlegVak titel={e.label} tekst={e.info} onSluit={() => setUitleg(null)} />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 11, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: '0.76rem', fontWeight: 800,
            color: gehaald ? GROEN : 'rgba(255,255,255,0.5)',
          }}>
            {gehaald
              ? 'Alles gehaald — je krijgt je inleg terug 💪'
              : `Nog ${EISEN.length - behaald} ${EISEN.length - behaald === 1 ? 'eis' : 'eisen'} te gaan voor je inleg terug.`}
          </div>
        </div>
      )}
    </div>
  )
}

// Het ⓘ-knopje: klein, grijs, goud als het openstaat. Zelfde gebaar als in de
// lead-stats — je tikt erop en de uitleg verschijnt eronder, in plaats van een
// tooltip die op een telefoon nooit verschijnt.
function UitlegKnop({ aan, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title="Hoe wordt dit geteld?"
      aria-label="Uitleg"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 16, height: 16, padding: 0, flexShrink: 0,
        background: 'none', border: 'none', cursor: 'pointer',
        color: aan ? GOUD : 'rgba(255,255,255,0.3)',
      }}
    >
      <Info size={12} />
    </button>
  )
}

function UitlegVak({ titel, tekst, onSluit }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 7,
      margin: '7px 0 3px', padding: '0.5rem 0.6rem',
      background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)',
      borderRadius: 8,
    }}>
      <Info size={12} color={GOUD} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>{titel}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45 }}>{tekst}</div>
      </div>
      <button onClick={onSluit} aria-label="Uitleg sluiten" style={{
        background: 'none', border: 'none', padding: 2, flexShrink: 0,
        color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
      }}>
        <X size={11} />
      </button>
    </div>
  )
}
