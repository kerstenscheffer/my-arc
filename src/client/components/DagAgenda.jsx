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
import { createPortal } from 'react-dom'
import {
  Calendar, ChevronLeft, ChevronRight, ChevronRight as Pijl, Check, Play, List,
  CalendarClock, Maximize2, X, Utensils, Dumbbell, Moon, Briefcase, Pill,
} from 'lucide-react'
import {
  ClientAgendaService, DAYS, DAY_LABELS_NL_LONG, getMondayOf, dateForDay, toIsoDate,
} from '../../modules/client-agenda/ClientAgendaService'
import { resolveFoodImage, foodImageFallback } from '../../modules/meal-plan/foodImageFallback'
import { workoutFoto } from './workoutFoto'
import { verzetDag as verzetDagHelper } from './dagNavigatie'
import MacroBoxes from './MacroBoxes'

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

export default function DagAgenda({
  client, db, isMobile = false, hoogte, onOpen,
  // Van buitenaf gestuurd: staan de pijltjes elders op de pagina (bij de
  // begroeting), dan houdt die de dag bij en toont de agenda zijn eigen kop
  // niet. Zonder deze props stuurt hij zichzelf.
  dag: dagProp = null,
  weekAnker: weekAnkerProp = null,
  onVerzetDag = null,
  toonKop = true,
}) {
  const service = useMemo(() => new ClientAgendaService(db?.supabase || db), [db])
  const [eigenWeekAnker, setEigenWeekAnker] = useState(() => getMondayOf(new Date()))
  const [eigenDag, setEigenDag] = useState(() => dagSleutelVan(new Date()))
  const gestuurd = !!dagProp && !!weekAnkerProp
  const weekAnker = gestuurd ? weekAnkerProp : eigenWeekAnker
  const dag = gestuurd ? dagProp : eigenDag
  const setWeekAnker = setEigenWeekAnker
  const setDag = setEigenDag
  const [data, setData] = useState(null)
  const [laden, setLaden] = useState(true)
  const [nu, setNu] = useState(() => new Date())
  // Wat er op de getoonde dag al is afgevinkt (sleutel = slot), plus de
  // dagtotalen. Beide uit consumed_meals: dat is wat de maaltijdpagina ook
  // optelt, dus de ringen hier en daar zeggen hetzelfde.
  const [gelogd, setGelogd] = useState({})
  const [verbruikt, setVerbruikt] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [doelen, setDoelen] = useState(null)
  // Twee manieren om dezelfde dag te lezen. De lijst is de standaard: die
  // beantwoordt "wat moet ik vandaag" zonder scrollen. Het rooster laat zien
  // hoe de dag verdeeld is, en dat is pas nuttig op een heel scherm.
  const [weergave, setWeergave] = useState('lijst')
  const [volledig, setVolledig] = useState(false)
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

  // Doelen staan op de klant en veranderen niet per dag.
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase
      .from('clients')
      .select('target_calories, target_protein, target_carbs, target_fat')
      .eq('id', client.id)
      .single()
      .then(({ data }) => {
        if (weg || !data) return
        setDoelen({
          calories: data.target_calories || 0,
          protein: data.target_protein || 0,
          carbs: data.target_carbs || 0,
          fat: data.target_fat || 0,
        })
      })
    return () => { weg = true }
  }, [db, client?.id])

  useEffect(() => {
    if (!volledig) return
    const opToets = (e) => { if (e.key === 'Escape') setVolledig(false) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [volledig])

  // De nu-lijn hoeft niet op de seconde te kloppen; elke minuut is genoeg.
  useEffect(() => {
    const t = setInterval(() => setNu(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const blokken = useMemo(
    () => verdeelInKolommen((data?.blocksByDay?.[dag] || [])),
    [data, dag]
  )
  // Voor de lijst: gewoon op tijd, zonder kolomverdeling.
  const lijstBlokken = useMemo(
    () => [...(data?.blocksByDay?.[dag] || [])].sort((a, b) => (a.start - b.start) || (a.end - b.end)),
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

  // Bij binnenkomst meteen op het juiste moment staan: is het vandaag, dan
  // staat de nu-lijn een derde vanaf de bovenkant in beeld; anders begint de
  // dag bij het eerste blok. Zonder dit kijk je 's avonds naar je ontbijt.
  useEffect(() => {
    if (laden) return
    const el = roosterRef.current
    if (!el) return
    const doel = toonNuLijn
      ? pxVan(nuMin) - el.clientHeight * 0.33
      : (blokken.length ? pxVan(Math.min(...blokken.map(b => b.start))) - 12 : 0)
    // Na het renderen van het rooster, anders is scrollHeight nog de oude.
    const id = requestAnimationFrame(() => {
      el.scrollTop = Math.max(0, doel)
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laden, dag, weekAnker, roosterHoogte])

  // Wat er op deze dag is gelogd. Eén query per dag; bij het afvinken werken
  // we de lijst hier lokaal bij, zodat de ringen meteen meebewegen.
  const dagIso = datum ? toIsoDate(datum) : null
  useEffect(() => {
    if (!client?.id || !db?.supabase || !dagIso) return
    let weg = false
    db.supabase
      .from('consumed_meals')
      .select('id, meal_id, meal_type, meal_name, calories, protein, carbs, fat, source')
      .eq('client_id', client.id)
      .gte('consumed_at', `${dagIso}T00:00:00`)
      .lt('consumed_at', `${dagIso}T23:59:59`)
      .then(({ data, error }) => {
        if (weg || error) return
        zetGelogd(data || [])
      })
    return () => { weg = true }
  }, [db, client?.id, dagIso])

  const zetGelogd = (rijen) => {
    const som = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const perSlot = {}
    rijen.forEach(r => {
      som.calories += Number(r.calories) || 0
      som.protein += parseFloat(r.protein) || 0
      som.carbs += parseFloat(r.carbs) || 0
      som.fat += parseFloat(r.fat) || 0
      // Een plan-maaltijd herkennen we aan het meal_id; is dat leeg, dan aan
      // het type (ontbijt, lunch). Losse logs vallen hierbuiten en tellen
      // alleen in de totalen mee.
      if (r.source === 'plan_check') perSlot[r.meal_id || `type:${r.meal_type}`] = r.id
    })
    setVerbruikt({
      calories: Math.round(som.calories), protein: Math.round(som.protein),
      carbs: Math.round(som.carbs), fat: Math.round(som.fat),
    })
    setGelogd(perSlot)
  }

  const sleutelVan = (blok) => blok.sourceId || `type:${String(blok.meta?.slot || '').replace(/\d+$/, '')}`

  // Afvinken vanuit de agenda schrijft dezelfde rij als de maaltijdpagina:
  // consumed_meals met source 'plan_check'. Anders zou het vinkje hier niet
  // meetellen in de macro's daar, en andersom.
  const wisselAfgerond = async (blok) => {
    if (!client?.id || !db?.supabase || !dagIso) return
    const sleutel = sleutelVan(blok)
    const bestaandeId = gelogd[sleutel]
    const macro = {
      calories: Math.round(Number(blok.meta?.kcal) || 0),
      protein: Math.round(Number(blok.meta?.protein) || 0),
      carbs: Math.round(Number(blok.meta?.carbs) || 0),
      fat: Math.round(Number(blok.meta?.fat) || 0),
    }

    if (bestaandeId) {
      setGelogd(prev => { const kopie = { ...prev }; delete kopie[sleutel]; return kopie })
      setVerbruikt(prev => ({
        calories: prev.calories - macro.calories, protein: prev.protein - macro.protein,
        carbs: prev.carbs - macro.carbs, fat: prev.fat - macro.fat,
      }))
      const { error } = await db.supabase.from('consumed_meals').delete().eq('id', bestaandeId)
      if (error) console.error('Afvinken ongedaan maken mislukt:', error)
      return
    }

    setGelogd(prev => ({ ...prev, [sleutel]: 'bezig' }))
    setVerbruikt(prev => ({
      calories: prev.calories + macro.calories, protein: prev.protein + macro.protein,
      carbs: prev.carbs + macro.carbs, fat: prev.fat + macro.fat,
    }))
    const nuIso = toIsoDate(new Date()) === dagIso ? new Date() : new Date(`${dagIso}T12:00:00`)
    const { data, error } = await db.supabase.from('consumed_meals').insert({
      client_id: client.id,
      meal_name: blok.sublabel || blok.label || 'Maaltijd',
      meal_id: blok.sourceId || null,
      meal_type: String(blok.meta?.slot || '').replace(/\d+$/, '') || null,
      ...macro,
      amount: 1,
      per_unit: 'portion',
      consumed_at: nuIso.toISOString(),
      source: 'plan_check',
      log_count: 1,
    }).select().single()
    if (error) {
      console.error('Afvinken mislukt:', error)
      setGelogd(prev => { const kopie = { ...prev }; delete kopie[sleutel]; return kopie })
      setVerbruikt(prev => ({
        calories: prev.calories - macro.calories, protein: prev.protein - macro.protein,
        carbs: prev.carbs - macro.carbs, fat: prev.fat - macro.fat,
      }))
      return
    }
    setGelogd(prev => ({ ...prev, [sleutel]: data.id }))
  }

  const verzet = (richting) => {
    if (onVerzetDag) { onVerzetDag(richting); return }
    const volgende = verzetDagHelper({ dag, weekAnker }, richting)
    setWeekAnker(volgende.weekAnker)
    setDag(volgende.dag)
  }

  const naarVandaag = () => {
    if (onVerzetDag) { onVerzetDag(0); return }
    setWeekAnker(getMondayOf(new Date()))
    setDag(dagSleutelVan(new Date()))
  }

  const inhoud = (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      // De lijst groeit mee met de dag; het rooster krijgt een vaste hoogte en
      // scrolt intern, anders wordt de pagina een tijdbalk van twee meter.
      height: volledig ? '100%' : (weergave === 'rooster' ? (hoogte || '100%') : 'auto'),
    }}>
      {/* Kop: pijltjes om de dag heen. Staan die elders op de pagina, dan
          slaat de agenda zijn eigen kop over. */}
      {toonKop && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        paddingBottom: isMobile ? 8 : 10,
      }}>
        <button onClick={() => verzet(-1)} aria-label="Vorige dag" style={pijlKnop}>
          <ChevronLeft size={18} strokeWidth={3} />
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
        <button onClick={() => verzet(1)} aria-label="Volgende dag" style={pijlKnop}>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
      )}

      {/* Schakelaar tussen lijst en rooster, met rechts de knop om het op het
          hele scherm te zetten. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        paddingBottom: isMobile ? 10 : 12,
      }}>
        <div style={{
          position: 'relative', display: 'flex', flex: 1, height: 30, padding: 3,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`, borderRadius: 10,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3, width: 'calc(50% - 3px)',
            left: weergave === 'lijst' ? 3 : '50%', borderRadius: 8, background: '#fff',
            transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
          }} />
          {[
            { id: 'lijst', label: 'Lijst', Icoon: List },
            { id: 'rooster', label: 'Rooster', Icoon: CalendarClock },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setWeergave(v.id)}
              style={{
                position: 'relative', flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 900,
                color: weergave === v.id ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <v.Icoon size={12} strokeWidth={2.8} />
              {v.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setVolledig(v => !v)}
          title={volledig ? 'Sluiten' : 'Op het hele scherm'}
          aria-label={volledig ? 'Sluiten' : 'Op het hele scherm'}
          style={{ ...pijlKnop, width: 28, height: 28 }}
        >
          {volledig ? <X size={17} strokeWidth={3} /> : <Maximize2 size={15} strokeWidth={3} />}
        </button>
      </div>

      {/* De dagtotalen horen bij de dag die je bekijkt, dus staan ze onder de
          datum en niet los boven de agenda. */}
      {doelen && doelen.calories > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: isMobile ? 10 : 12 }}>
          <MacroBoxes kaal consumed={verbruikt} targets={doelen} />
        </div>
      )}

      {/* Lijst: wat er vandaag staat, van vroeg naar laat. Eén regel per
          blok, met de tijden rechts — zoals de dagweergave van een
          agenda-app. Beantwoordt "wat moet ik vandaag" zonder scrollen. */}
      {weergave === 'lijst' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: `1px solid ${LIJN}` }}>
          {laden && (
            <div style={{ padding: '1.2rem 0', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
              Dag laden…
            </div>
          )}
          {!laden && lijstBlokken.length === 0 && (
            <div style={{
              padding: '1.6rem 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)',
            }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Niets gepland op deze dag</span>
            </div>
          )}
          {lijstBlokken.map(b => (
            <LijstRegel
              key={b.id}
              blok={b}
              isMobile={isMobile}
              onOpen={onOpen}
              afgerond={b.type === 'meal' && !!gelogd[sleutelVan(b)]}
              onAfronden={b.type === 'meal' ? () => wisselAfgerond(b) : null}
              bezig={toonNuLijn && nuMin >= b.start && nuMin < b.end}
            />
          ))}
        </div>
      )}

      {/* Rooster */}
      {weergave === 'rooster' && (
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
            <Blok
              key={b.id}
              blok={b}
              isMobile={isMobile}
              pxVan={pxVan}
              uurHoogte={uurHoogte}
              onOpen={onOpen}
              afgerond={b.type === 'meal' && !!gelogd[sleutelVan(b)]}
              onAfronden={b.type === 'meal' ? () => wisselAfgerond(b) : null}
            />
          ))}
        </div>
      </div>
      )}

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

  // Op het hele scherm: dezelfde inhoud, alleen zonder de pagina eromheen.
  // Handig voor het rooster, waar je de hele dag in één keer wil zien.
  if (volledig) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        background: '#0a0a0a',
        padding: isMobile
          ? 'calc(env(safe-area-inset-top, 0px) + 0.75rem) 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
          : '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column',
      }}>
        {inhoud}
      </div>,
      document.body
    )
  }

  return inhoud
}

// Eén blok. Maaltijden en trainingen krijgen hun eigen kaart — dezelfde vorm
// als op de maaltijd- en workout-pagina — zodat de agenda niet een rooster met
// tekstregels is maar hetzelfde spul op een tijdlijn. De rest (slaap, werk,
// supplementen) blijft een rustige regel: dat hoef je alleen te zien, niet te
// lezen.
function Blok({ blok, isMobile, pxVan, uurHoogte, onOpen, afgerond = false, onAfronden = null }) {
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
  // De kaarten zijn zelf geen knop: er zitten handelingen op (afronden,
  // starten, openen), en dan is "ergens op de kaart tikken" een gok.
  const klikbaar = false

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
    // Eén kleur voor alles: wit. De blokken verschilden per soort van kleur
    // (blauw voor slaap, groen voor eten, rood voor training) en daarmee las
    // een dag als een kleurenkaart in plaats van als een dag. Wat het is, zegt
    // het icoon en het label al.
    background: achter ? 'rgba(255,255,255,0.05)' : '#141414',
    border: `1px solid ${achter ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
    borderLeft: '3px solid rgba(255,255,255,0.85)',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: achter ? 0 : 2,
    opacity: blok.meta?.placeholder ? 0.6 : (afgerond ? 0.72 : 1),
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.8rem' : '0.86rem', fontWeight: 900,
              color: afgerond ? 'rgba(255,255,255,0.45)' : '#fff',
              textDecoration: afgerond ? 'line-through' : 'none',
              letterSpacing: '-0.015em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {naam || soort}
            </span>
            <span style={tijdStempel}>{tijd(blok.start)}</span>
            {onAfronden && (
              <button
                onClick={(e) => { e.stopPropagation(); onAfronden() }}
                title={afgerond ? 'Toch niet gegeten' : 'Afronden'}
                aria-label={afgerond ? 'Afvinken ongedaan maken' : 'Afronden'}
                style={{ ...kaartKnop, color: afgerond ? '#10b981' : '#fff' }}
              >
                <Check size={14} strokeWidth={3.2} />
              </button>
            )}
            {onOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                title="Open in je maaltijdplan"
                aria-label="Open in je maaltijdplan"
                style={kaartKnop}
              >
                <Pijl size={14} strokeWidth={3.2} />
              </button>
            )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            {onOpen && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                  title="Start je training"
                  aria-label="Start je training"
                  style={kaartKnop}
                >
                  <Play size={14} strokeWidth={3.2} fill="#fff" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(blok) }}
                  title="Open je schema"
                  aria-label="Open je schema"
                  style={kaartKnop}
                >
                  <Pijl size={14} strokeWidth={3.2} />
                </button>
              </>
            )}
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

// Eén regel in de lijst: streep, naam, tijden rechts. Loopt het blok nu, dan
// is de streep vol wit in plaats van doorzichtig — dat is het enige verschil
// dat je nodig hebt om te zien waar je bent.
function LijstRegel({ blok, isMobile, onOpen, afgerond, onAfronden, bezig }) {
  const isMaaltijd = blok.type === 'meal'
  const isTraining = blok.type === 'training'
  const Icoon = ICOON[blok.type] || Calendar
  const soort = isMaaltijd ? (blok.label || 'Maaltijd') : (TYPE_LABEL[blok.type] || blok.label || '')
  const naam = blok.sublabel || (isMaaltijd ? null : blok.label)
  const foto = isMaaltijd
    ? (resolveFoodImage({ image_url: blok.meta?.image_url, name: naam }) || foodImageFallback(naam, blok.meta?.slot, 200))
    : isTraining ? workoutFoto(naam || soort)
    : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: isMobile ? '0.55rem 0' : '0.65rem 0',
      borderBottom: `1px solid ${LIJN_ZACHT}`,
      opacity: afgerond ? 0.6 : 1,
    }}>
      <span style={{
        width: 3, alignSelf: 'stretch', flexShrink: 0, borderRadius: 2,
        background: bezig ? '#fff' : 'rgba(255,255,255,0.3)',
        minHeight: 26,
      }} />

      {/* Maaltijd en training krijgen hun foto mee; de rest een icoon. Een
          regel met een bord eten ernaast herken je sneller dan een regel met
          een vorkje. */}
      {foto ? (
        <span style={{
          width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, flexShrink: 0,
          borderRadius: 8, overflow: 'hidden',
          background: `url(${foto}) center/cover`,
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
      ) : (
        <Icoon size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 800,
          color: afgerond ? 'rgba(255,255,255,0.45)' : '#fff',
          textDecoration: afgerond ? 'line-through' : 'none',
          letterSpacing: '-0.015em', lineHeight: 1.25,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {naam || soort}
        </div>
        {naam && soort && (
          <div style={{
            fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {soort}
          </div>
        )}
      </div>

      {/* Vaste breedte voor de tijden, en daarnaast een vast vak voor de
          knoppen. Zonder dat schoven de tijden per regel op: een blok zonder
          knoppen duwde ze naar rechts en een maaltijd met twee knoppen naar
          links, en dan staat er geen kolom meer. */}
      <div style={{ flexShrink: 0, width: 44, textAlign: 'right', lineHeight: 1.25 }}>
        <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {tijd(blok.start)}
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
          {tijd(blok.end)}
        </div>
      </div>

      <div style={{
        flexShrink: 0, width: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
      }}>
        {onAfronden && (
          <button
            onClick={onAfronden}
            title={afgerond ? 'Toch niet gegeten' : 'Afronden'}
            aria-label={afgerond ? 'Afvinken ongedaan maken' : 'Afronden'}
            style={{ ...kaartKnop, color: afgerond ? '#10b981' : '#fff' }}
          >
            <Check size={15} strokeWidth={3.2} />
          </button>
        )}
        {onOpen && (isMaaltijd || isTraining) && (
          <button
            onClick={() => onOpen(blok)}
            title={isTraining ? 'Open je schema' : 'Open in je maaltijdplan'}
            aria-label={isTraining ? 'Open je schema' : 'Open in je maaltijdplan'}
            style={kaartKnop}
          >
            {isTraining ? <Play size={14} strokeWidth={3.2} fill="#fff" /> : <Pijl size={15} strokeWidth={3.2} />}
          </button>
        )}
      </div>
    </div>
  )
}

const kaartKnop = {
  width: 22, height: 22, padding: 0, flexShrink: 0,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const tijdStempel = {
  flexShrink: 0, fontSize: '0.58rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums',
}

// Kale iconen: een vakje eromheen maakte er drie knoppen van naast een kop
// die zelf al een kop is.
const pijlKnop = {
  width: 30, height: 30, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none',
  color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
