// src/client/components/DagAgenda.jsx
//
// De dag van de klant, als agenda. Eigen scherm, los van ClientAgendaView.
//
// Waarom apart: die view is het gereedschap van de coach — slepen, bulk
// verzetten, blokken bijplannen, zeven kolommen naast elkaar. De klant leest
// één dag en doet er niets aan. Beide uit één component halen betekende dat
// elke verfraaiing aan de klant-kant langs het gereedschap van de coach moest,
// en andersom. De gedeelde kant zit in ClientAgendaService, en dat is precies
// de kant die hetzelfde moet blijven: dezelfde blokken, dezelfde tijden.
//
// Wat dit scherm doet dat de coach-view niet doet:
//   - het tijdvenster past zich aan de dag aan, in plaats van altijd 6:00-24:00
//   - de lopende tijd staat als lijn in het rooster
//   - blokken lezen als kaarten: bold wit, tijd rechts, kleur alleen als streep

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Utensils, Dumbbell, Moon, Briefcase, Pill } from 'lucide-react'
import {
  ClientAgendaService, DAYS, DAY_LABELS_NL_LONG, getMondayOf, dateForDay, toIsoDate,
} from '../../modules/client-agenda/ClientAgendaService'
import { resolveFoodImage, foodImageFallback } from '../../modules/meal-plan/foodImageFallback'
import { workoutFoto } from './workoutFoto'

const LIJN = 'rgba(255,255,255,0.07)'
const LIJN_ZACHT = 'rgba(255,255,255,0.04)'

// Hoogte van één uur. Google Agenda houdt op een telefoon ongeveer 48 pixels
// per uur aan; dat is de maat waar een dag in één blik op past. Wij zitten er
// iets boven omdat onze blokken kaarten zijn met een foto erin en geen kale
// balk met één regel tekst.
const UUR_HOOGTE = { mobiel: 64, desktop: 76 }

const ICOON = {
  meal: Utensils,
  training: Dumbbell,
  sleep: Moon,
  work: Briefcase,
  supplement: Pill,
}

const TYPE_LABEL = {
  training: 'Training',
  sleep: 'Slaap',
  work: 'Werk',
  supplement: 'Supplementen',
}

const dagSleutelVan = (d) => DAYS[(d.getDay() + 6) % 7]
const tijd = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`

// Overlappende blokken naast elkaar in plaats van op elkaar. Werk is de
// achtergrond van de dag en doet niet mee aan de kolomverdeling; zou het dat
// wel doen, dan wordt een werkdag een halve strook zodra er één maaltijd in
// valt. Zelfde regel als in de coach-view, want het is dezelfde werkelijkheid.
function verdeelInKolommen(blokken) {
  if (!blokken?.length) return []
  const achter = blokken.filter(b => b.type === 'work').map(b => ({ ...b, _achter: true }))
  const voor = blokken.filter(b => b.type !== 'work').map(b => ({ ...b }))
  if (!voor.length) return achter

  const gesorteerd = voor.sort((a, b) => (a.start - b.start) || (b.end - a.end))
  const uit = []
  let groep = []
  let groepEind = -Infinity

  const sluit = () => {
    if (!groep.length) return
    const kolomEind = []
    groep.forEach(b => {
      let k = kolomEind.findIndex(eind => eind <= b.start)
      if (k === -1) { k = kolomEind.length; kolomEind.push(b.end) }
      else kolomEind[k] = b.end
      b._kolom = k
    })
    groep.forEach(b => { b._kolommen = kolomEind.length })
    uit.push(...groep)
    groep = []
    groepEind = -Infinity
  }

  gesorteerd.forEach(b => {
    if (groep.length && b.start >= groepEind) sluit()
    groep.push(b)
    groepEind = Math.max(groepEind, b.end)
  })
  sluit()
  return [...achter, ...uit]
}

export default function DagAgenda({ client, db, isMobile = false, hoogte, onOpen }) {
  const service = useMemo(() => new ClientAgendaService(db?.supabase || db), [db])
  const [weekAnker, setWeekAnker] = useState(() => getMondayOf(new Date()))
  const [dag, setDag] = useState(() => dagSleutelVan(new Date()))
  const [data, setData] = useState(null)
  const [laden, setLaden] = useState(true)
  const [nu, setNu] = useState(() => new Date())
  const roosterRef = useRef(null)

  useEffect(() => {
    if (!client?.id) return
    let weg = false
    setLaden(true)
    service.loadWeek(client.id, weekAnker)
      .then(d => { if (!weg) setData(d) })
      .catch(e => console.error('Dagagenda laden mislukt:', e))
      .finally(() => { if (!weg) setLaden(false) })
    return () => { weg = true }
  }, [service, client?.id, weekAnker])

  // De nu-lijn hoeft niet op de seconde te kloppen; elke minuut is genoeg.
  useEffect(() => {
    const t = setInterval(() => setNu(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const blokken = useMemo(
    () => verdeelInKolommen((data?.blocksByDay?.[dag] || [])),
    [data, dag]
  )

  // Het venster volgt de dag: begint bij het eerste blok (afgerond naar het
  // hele uur) en eindigt bij het laatste. Een vast raster van 6:00 tot 24:00
  // gaf op de meeste dagen uren leegte boven en onder.
  const { van, tot } = useMemo(() => {
    if (!blokken.length) return { van: 7 * 60, tot: 22 * 60 }
    const start = Math.min(...blokken.map(b => b.start))
    const eind = Math.max(...blokken.map(b => b.end))
    return {
      van: Math.max(0, Math.floor(start / 60) * 60 - 30),
      tot: Math.min(24 * 60, Math.ceil(eind / 60) * 60 + 30),
    }
  }, [blokken])

  const spanMin = Math.max(60, tot - van)
  const uurHoogte = isMobile ? UUR_HOOGTE.mobiel : UUR_HOOGTE.desktop
  const roosterHoogte = (spanMin / 60) * uurHoogte
  const pxVan = (min) => ((Math.max(van, Math.min(tot, min)) - van) / 60) * uurHoogte
  const uren = []
  for (let u = Math.ceil(van / 60); u <= Math.floor(tot / 60); u++) uren.push(u)

  const datum = dateForDay(weekAnker, dag)
  const isVandaag = datum && toIsoDate(datum) === toIsoDate(nu)
  const nuMin = nu.getHours() * 60 + nu.getMinutes()
  const toonNuLijn = isVandaag && nuMin >= van && nuMin <= tot

  const verzet = (richting) => {
    const i = DAYS.indexOf(dag)
    const n = i + richting
    if (n < 0) {
      const vorige = new Date(weekAnker); vorige.setDate(vorige.getDate() - 7)
      setWeekAnker(vorige); setDag(DAYS[DAYS.length - 1]); return
    }
    if (n > DAYS.length - 1) {
      const volgende = new Date(weekAnker); volgende.setDate(volgende.getDate() + 7)
      setWeekAnker(volgende); setDag(DAYS[0]); return
    }
    setDag(DAYS[n])
  }

  const naarVandaag = () => {
    setWeekAnker(getMondayOf(new Date()))
    setDag(dagSleutelVan(new Date()))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: hoogte || '100%', minHeight: 0 }}>
      {/* Kop: pijltjes om de dag heen, en alleen een weg-terug-knop als je
          niet op vandaag staat. Een weekkiezer heeft een klant niet nodig. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        paddingBottom: isMobile ? 8 : 10,
      }}>
        <button onClick={() => verzet(-1)} aria-label="Vorige dag" style={pijl}>
          <ChevronLeft size={16} strokeWidth={2.6} />
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {isVandaag ? 'Vandaag' : DAY_LABELS_NL_LONG[dag]}
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {datum ? datum.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : ''}
          </div>
        </div>
        <button onClick={() => verzet(1)} aria-label="Volgende dag" style={pijl}>
          <ChevronRight size={16} strokeWidth={2.6} />
        </button>
      </div>

      {/* Rooster */}
      <div
        ref={roosterRef}
        style={{
          flex: 1, minHeight: 0, position: 'relative',
          display: 'flex', overflowY: 'auto',
          borderTop: `1px solid ${LIJN}`,
        }}
      >
        {/* Tijdas */}
        <div style={{ width: isMobile ? 34 : 40, flexShrink: 0, position: 'relative', height: roosterHoogte }}>
          {uren.map(u => (
            <div key={u} style={{
              position: 'absolute', top: pxVan(u * 60), left: 0, right: 4,
              transform: 'translateY(-50%)',
              fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>
              {String(u).padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Dagkolom */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height: roosterHoogte }}>
          {uren.map(u => (
            <div key={u} style={{
              position: 'absolute', top: pxVan(u * 60), left: 0, right: 0,
              borderTop: `1px solid ${LIJN_ZACHT}`,
            }} />
          ))}

          {toonNuLijn && (
            <div style={{
              position: 'absolute', top: pxVan(nuMin), left: 0, right: 0,
              height: 0, borderTop: '1px solid rgba(255,255,255,0.5)', zIndex: 6,
            }}>
              <span style={{
                position: 'absolute', left: -3, top: -3,
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
              }} />
            </div>
          )}

          {laden && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40,
              fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            }}>
              Dag laden…
            </div>
          )}

          {!laden && blokken.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-start', gap: 6, paddingTop: 40,
              color: 'rgba(255,255,255,0.3)',
            }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Niets gepland op deze dag</span>
            </div>
          )}

          {blokken.map(b => (
            <Blok key={b.id} blok={b} isMobile={isMobile} pxVan={pxVan} uurHoogte={uurHoogte} onOpen={onOpen} />
          ))}
        </div>
      </div>

      {!isVandaag && (
        <button onClick={naarVandaag} style={{
          flexShrink: 0, marginTop: 8, minHeight: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
          color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem', fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          Terug naar vandaag
        </button>
      )}
    </div>
  )
}

// Eén blok. Maaltijden en trainingen krijgen hun eigen kaart — dezelfde vorm
// als op de maaltijd- en workout-pagina — zodat de agenda niet een rooster met
// tekstregels is maar hetzelfde spul op een tijdlijn. De rest (slaap, werk,
// supplementen) blijft een rustige regel: dat hoef je alleen te zien, niet te
// lezen.
function Blok({ blok, isMobile, pxVan, uurHoogte, onOpen }) {
  const top = pxVan(blok.start)
  // Ondergrens per soort. Een maaltijd duurt in het plan een kwartier; op
  // ware grootte is dat een streepje. Hij krijgt daarom de ruimte van een half
  // uur — genoeg voor de kaart, en niet zoveel dat hij het uur erna opslokt.
  // De tijd in de kaart blijft de echte begintijd.
  const minHoogte = blok.type === 'meal' ? uurHoogte / 2
    : blok.type === 'training' ? uurHoogte * 0.75
    : 26
  const hoogte = Math.max(minHoogte, pxVan(blok.end) - top)
  const achter = !!blok._achter
  const isMaaltijd = blok.type === 'meal'
  const isTraining = blok.type === 'training'
  const Icoon = ICOON[blok.type] || Calendar

  const soort = isMaaltijd ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || '')
  const naam = blok.sublabel || (isMaaltijd ? null : blok.label)
  const klikbaar = !!onOpen && (isMaaltijd || isTraining)

  // Hoeveel past erin? De kaart met foto vanaf een halfuurhoogte, het
  // slot-label op de foto zodra daar plek voor is, de macro's pas als het blok
  // echt hoog is.
  const ruim = hoogte >= 30
  const slotOpFoto = hoogte >= 52
  const metMacros = hoogte >= 74

  const buiten = {
    position: 'absolute',
    top, height: hoogte,
    left: achter ? 0 : `calc(${((blok._kolom || 0) / (blok._kolommen || 1)) * 100}% + 4px)`,
    width: achter ? '100%' : `calc(${100 / (blok._kolommen || 1)}% - 8px)`,
    background: achter ? `${blok.color}26` : '#141414',
    border: `1px solid ${achter ? `${blok.color}59` : 'rgba(255,255,255,0.07)'}`,
    borderLeft: `3px solid ${blok.color}`,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: achter ? 0 : 2,
    opacity: blok.meta?.placeholder ? 0.6 : 1,
    cursor: klikbaar ? 'pointer' : 'default',
    textAlign: 'left',
    padding: 0,
    fontFamily: 'inherit',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  const titel = `${soort}${naam ? ` — ${naam}` : ''}\n${tijd(blok.start)}–${tijd(blok.end)}`
  const Wrapper = klikbaar ? 'button' : 'div'
  const wrapperProps = klikbaar ? { onClick: () => onOpen(blok) } : {}

  // ── Maaltijd: foto links, naam en macro's ernaast ──
  if (isMaaltijd && ruim) {
    const foto = resolveFoodImage({ image_url: blok.meta?.image_url, name: naam })
      || foodImageFallback(naam, blok.meta?.slot, 200)
    const macros = [
      { val: blok.meta?.kcal, label: 'kcal' },
      { val: blok.meta?.protein, label: 'E' },
      { val: blok.meta?.carbs, label: 'K' },
      { val: blok.meta?.fat, label: 'V' },
    ].filter(m => Number(m.val) > 0)
    return (
      <Wrapper {...wrapperProps} title={titel} style={{ ...buiten, display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          width: Math.min(92, Math.max(44, hoogte)), flexShrink: 0, alignSelf: 'stretch',
          background: foto ? `url(${foto}) center/cover` : 'rgba(255,255,255,0.05)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.75) 100%)',
          }} />
          {slotOpFoto && (
            <span style={{
              position: 'absolute', left: 6, right: 4, bottom: 4,
              fontSize: '0.56rem', fontWeight: 900, color: '#fff',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {soort}
            </span>
          )}
        </div>
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: metMacros ? (isMobile ? '6px 8px' : '8px 10px') : '3px 8px', gap: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {naam || soort}
            </span>
            <span style={tijdStempel}>{tijd(blok.start)}</span>
          </div>
          {metMacros && macros.length > 0 && (
            <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', overflow: 'hidden' }}>
              {macros.map(m => (
                <span key={m.label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{Math.round(m.val)}</span>
                  <span style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{m.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Wrapper>
    )
  }

  // ── Training: foto als achtergrond, naam eroverheen ──
  if (isTraining && ruim) {
    return (
      <Wrapper {...wrapperProps} title={titel} style={{ ...buiten, display: 'block', position: 'absolute' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${workoutFoto(naam || soort)})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.85) 100%)',
        }} />
        <div style={{
          position: 'relative', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: isMobile ? '6px 9px' : '8px 11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}>
              {naam || 'Training'}
            </span>
            <span style={{ ...tijdStempel, color: 'rgba(255,255,255,0.6)' }}>{tijd(blok.start)}</span>
          </div>
          <span style={{
            fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 2,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            Training
          </span>
        </div>
      </Wrapper>
    )
  }

  // ── De rest: één rustige regel ──
  return (
    <Wrapper {...wrapperProps} title={titel} style={{
      ...buiten,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: isMobile ? '4px 8px' : '6px 10px',
    }}>
      <Icoon size={11} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: isMobile ? '0.74rem' : '0.8rem', fontWeight: 900, color: '#fff',
        letterSpacing: '-0.015em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {naam || soort}
      </span>
      <span style={tijdStempel}>{tijd(blok.start)}</span>
    </Wrapper>
  )
}

const tijdStempel = {
  flexShrink: 0, fontSize: '0.58rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums',
}

const pijl = {
  width: 30, height: 30, padding: 0, flexShrink: 0, borderRadius: 9,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
