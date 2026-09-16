// src/modules/challenge-monitor/ChallengeProgressTab.jsx
//
// De challenge-stand van de klant, altijd binnen handbereik: een klein
// knopje linksboven dat naar rechts uitschuift tot een paneel.
//
// Waarom zwevend en niet op Home: het gaat over geld dat je terugkrijgt of
// niet, en dat wil je kunnen checken terwijl je in je workout of je
// maaltijdplan zit — niet alleen op het startscherm.
//
// Standaard staat hij op déze week. "14 van de 18 workouts" is de stand aan
// het eind van de rit, maar zegt niets over wat je vandaag moet doen; de
// weekregels wel. De totalen staan één tik verderop achter de schakelaar.
//
// De getallen komen uit get_challenge_stand, dezelfde bron als het
// coach-overzicht. Zelf tellen zou betekenen dat klant en coach een ander
// antwoord kunnen geven over hetzelfde geld.

import { useEffect, useState } from 'react'
import { Trophy, Activity, Utensils, Weight, Camera, Phone, ClipboardCheck, X, Info } from 'lucide-react'
import {
  EISEN, WEEK_EISEN, WEEK_LOOPT_DOOR, ALGEMENE_UITLEG,
  waardenUit, weekWaardenUit, challengeWeek, allesGehaald, challengeNaam,
  haalDeelname, haalStand, tijdlijn,
} from './challengeEisen'
import { LIJN, LIJN_ZACHT, ZWART } from '../../components/arc-tokens'

const GROEN = '#10b981'
const WIT_ZACHT = 'rgba(255,255,255,0.4)'

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
  // 'week' is de stand die je kunt beïnvloeden, dus die staat voor.
  const [weergave, setWeergave] = useState('week')
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
        border: '1px solid rgba(239,68,68,0.3)',
        fontSize: '0.78rem', fontWeight: 800, color: '#fca5a5',
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

  const venster = challengeWeek(deelname)
  const ww = weekWaardenUit(stand, venster)
  const weekBehaald = WEEK_EISEN.filter(e => ww[e.key] >= e.nodig).length
  const weekOpen = WEEK_EISEN.length - weekBehaald

  const isWeek = weergave === 'week'
  const kleur = gehaald ? GROEN : '#fff'
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
        background: `${ZWART}f0`,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${gehaald ? 'rgba(16,185,129,0.35)' : LIJN}`,
        borderRadius: open ? 16 : 999,
        boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), border-radius 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* De knop zelf. Ingeklapt is dit alles wat je ziet: een beker en hoeveel
          eisen je binnen hebt. Uitgeklapt is het de kop van het paneel. */}
      <button
        onClick={() => { setOpen(o => !o); setUitleg(null) }}
        aria-expanded={open}
        aria-label={open ? 'Challenge-stand sluiten' : 'Challenge-stand openen'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', height: open ? 46 : 40, padding: open ? '0 10px 0 12px' : '0 12px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        <Trophy size={16} color={kleur} style={{ flexShrink: 0 }} />
        {open ? (
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{
              fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {challengeNaam(deelname.challenge_type)}
            </div>
            <div style={{
              fontSize: '0.66rem', fontWeight: 700, color: WIT_ZACHT, marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              week {venster.nummer} van {venster.totaal} · dag {dag} van {totaal} · nog {resterend} {resterend === 1 ? 'dag' : 'dagen'}
              {deelname.is_paused && ' · gepauzeerd'}
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: '0.85rem', fontWeight: 900, color: kleur,
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {behaald}<span style={{ color: 'rgba(255,255,255,0.3)' }}>/{EISEN.length}</span>
          </div>
        )}
        {open && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: LIJN_ZACHT, border: `1px solid ${LIJN}`,
          }}>
            <X size={14} color="rgba(255,255,255,0.5)" />
          </span>
        )}
      </button>

      {/* Paneelinhoud. Alleen renderen als hij open is, anders vangt hij taps
          op terwijl je hem niet ziet. */}
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          <Schakelaar
            weergave={weergave}
            onKies={(v) => { setWeergave(v); setUitleg(null) }}
            weekBehaald={weekBehaald}
            weekTotaal={WEEK_EISEN.length}
            behaald={behaald}
            totaal={EISEN.length}
          />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, margin: '10px 0 9px',
            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
          }}>
            <span>{isWeek ? `Deze week · t/m ${kortDatum(venster.eind)}` : 'Hele challenge'}</span>
            <UitlegKnop aan={uitleg === 'algemeen'} onClick={() => setUitleg(u => u === 'algemeen' ? null : 'algemeen')} />
          </div>

          {uitleg === 'algemeen' && (
            <UitlegVak titel="Hoe het werkt" tekst={ALGEMENE_UITLEG} onSluit={() => setUitleg(null)} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(isWeek ? WEEK_EISEN : EISEN).map(e => (
              <Regel
                key={e.key}
                eis={e}
                val={isWeek ? ww[e.key] : w[e.key]}
                uitlegOpen={uitleg === e.key}
                onUitleg={() => setUitleg(u => u === e.key ? null : e.key)}
                onSluitUitleg={() => setUitleg(null)}
              />
            ))}
          </div>

          {/* Foto's en calls hebben geen weekritme. Ze helemaal weglaten in de
              weekweergave zou de indruk wekken dat ze niet meer meetellen, dus
              staan ze eronder met hun stand over de hele challenge. */}
          {isWeek && (
            <>
              <div style={{
                margin: '12px 0 9px', paddingTop: 10, borderTop: `1px solid ${LIJN_ZACHT}`,
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              }}>
                Loopt over de hele challenge
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EISEN.filter(e => WEEK_LOOPT_DOOR.includes(e.key)).map(e => (
                  <Regel
                    key={e.key}
                    eis={e}
                    val={w[e.key]}
                    uitlegOpen={uitleg === e.key}
                    onUitleg={() => setUitleg(u => u === e.key ? null : e.key)}
                    onSluitUitleg={() => setUitleg(null)}
                  />
                ))}
              </div>
            </>
          )}

          <div style={{
            marginTop: 11, paddingTop: 9, borderTop: `1px solid ${LIJN}`,
            fontSize: '0.74rem', fontWeight: 800,
            color: (isWeek ? weekOpen === 0 : gehaald) ? GROEN : 'rgba(255,255,255,0.5)',
          }}>
            {isWeek
              ? (weekOpen === 0
                  ? 'Deze week is rond. Mooi werk.'
                  : `Nog ${weekOpen} ${weekOpen === 1 ? 'ding' : 'dingen'} deze week, nog ${venster.resterend} ${venster.resterend === 1 ? 'dag' : 'dagen'}.`)
              : (gehaald
                  ? 'Alles gehaald, je krijgt je inleg terug.'
                  : `Nog ${EISEN.length - behaald} ${EISEN.length - behaald === 1 ? 'eis' : 'eisen'} te gaan voor je inleg terug.`)}
          </div>
        </div>
      )}
    </div>
  )
}

// Eén wit blokje dat schuift tussen twee standen, zoals de schakelaars in de
// modals. Het aantal achter het label laat zien wat je kiest voordat je kiest.
function Schakelaar({ weergave, onKies, weekBehaald, weekTotaal, behaald, totaal }) {
  const standen = [
    { key: 'week', label: 'Deze week', val: weekBehaald, van: weekTotaal },
    { key: 'totaal', label: 'Totaal', val: behaald, van: totaal },
  ]
  const index = standen.findIndex(s => s.key === weergave)
  return (
    <div style={{
      position: 'relative', display: 'flex', height: 34, padding: 3,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`, borderRadius: 10,
    }}>
      <div style={{
        position: 'absolute', top: 3, bottom: 3, width: 'calc(50% - 3px)',
        left: index === 0 ? 3 : '50%', borderRadius: 8, background: '#fff',
        transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
      }} />
      {standen.map(s => {
        const aan = s.key === weergave
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onKies(s.key)}
            style={{
              position: 'relative', flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 900,
              color: aan ? ZWART : 'rgba(255,255,255,0.5)',
              WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
            }}
          >
            {s.label}
            <span style={{
              fontVariantNumeric: 'tabular-nums',
              color: aan ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.3)',
            }}>
              {s.val}/{s.van}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Eén eis: icoon, naam, stand en een dunne balk. Een rij, geen kaartje —
// zes kaders onder elkaar leest als een formulier in plaats van een stand.
function Regel({ eis, val, uitlegOpen, onUitleg, onSluitUitleg }) {
  const ok = val >= eis.nodig
  const Icoon = ICONEN[eis.key]
  const pct = Math.min(100, (val / eis.nodig) * 100)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <Icoon size={13} color={ok ? GROEN : WIT_ZACHT} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: ok ? GROEN : '#fff' }}>
          {eis.label}
        </div>
        <UitlegKnop aan={uitlegOpen} onClick={onUitleg} />
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: ok ? GROEN : '#fff', flexShrink: 0,
        }}>
          {val}<span style={{ color: 'rgba(255,255,255,0.28)' }}>/{eis.nodig}</span>
        </div>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2,
          background: ok ? GROEN : '#fff',
          transition: 'width 0.3s ease',
        }} />
      </div>
      {uitlegOpen && <UitlegVak titel={eis.label} tekst={eis.info} onSluit={onSluitUitleg} />}
    </div>
  )
}

// Het ⓘ-knopje: klein en grijs, wit als het openstaat. Zelfde gebaar als in de
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
        color: aan ? '#fff' : 'rgba(255,255,255,0.3)',
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
      margin: '8px 0 2px', padding: '0.55rem 0.65rem',
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
      borderRadius: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>{titel}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>{tekst}</div>
      </div>
      <button onClick={onSluit} aria-label="Uitleg sluiten" style={{
        background: 'none', border: 'none', padding: 2, flexShrink: 0,
        color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
      }}>
        <X size={11} />
      </button>
    </div>
  )
}

// "16 sep" — de einddatum van de week, zonder jaartal dat toch altijd nu is.
function kortDatum(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
