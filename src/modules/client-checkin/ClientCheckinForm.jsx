// src/modules/client-checkin/ClientCheckinForm.jsx
// Wekelijkse check-in van de client — één doorlopende pagina.
//
// Vervangt de wizard van vijf schermen met negentien vragen (scores per
// onderdeel + notities). Die vroeg vooral om zelfbeoordeling: "geef je voeding
// een cijfer". Dit formulier vraagt om harde cijfers — hoeveel trainingen,
// hoeveel dagen gewogen, hoeveel drankjes — plus drie open vragen. Dat is
// makkelijker eerlijk te beantwoorden en beter te vergelijken tussen weken.
//
// De oude check-ins blijven bestaan: hun kolommen zijn niet verwijderd en
// client_checkins.formulier_versie zegt welk formulier is gebruikt (1 = oud,
// 2 = dit). De coach-weergave leest dat om te weten welke velden gevuld zijn.

import { useState, useEffect, useRef } from 'react'
import { CheckCircle, ChevronDown } from 'lucide-react'
import CheckinService from './CheckinService'
import { laadWeekCijfers } from './weekCijfers'
import { laadProgressie, haalFase } from './progressieWeek'
import ProgressieScherm from './ProgressieScherm'
import {
  DOEL_TYPES, typeVan, doelTekst, bereidTerugkoppelingVoor,
  BEHAALD_OPTIES, leegDoel,
} from './doelen'

const KAART = '#161616'
const RAND = '#2a2a2a'
const GRIJS = '#8a8a8a'

// Eén beschrijving van het formulier; de render leest hieruit. Zo staat de
// vraagtekst op één plek en kan er niets uit de pas lopen met de opslag.
// Invoer is een schrijfblok met een witte lijn eronder, geen kader.
const LIJN_CSS = `
  .ci-lijn::placeholder { color: rgba(255,255,255,0.3); }
  .ci-lijn option { background: #1a1a1a; }
`
const LIJN = {
  background: 'transparent', border: 'none', borderBottom: '1.5px solid #fff', borderRadius: 0,
  color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 16,
  padding: '10px 0', width: '100%', outline: 'none', textAlign: 'left',
}

// Eén regel met een witte lijn eronder, direct onder de placeholder. Je typt
// op die lijn; loopt de tekst om, dan zakt de lijn mee. Geen sleepgreep.
function LijnTekst({ value, onChange, placeholder, style }) {
  const groei = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
  return (
    <textarea
      className="ci-lijn"
      ref={groei}
      rows={1}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => { groei(e.target); onChange(e.target.value) }}
      style={{ ...LIJN, lineHeight: 1.5, padding: '6px 0', resize: 'none', overflow: 'hidden', display: 'block', ...style }}
    />
  )
}

// Eigen dropdown in plaats van <select>: de native popup gaat in deze
// full-screen overlay op desktop op de verkeerde plek open. Deze klapt
// gewoon onder de lijn uit en ziet er op elk apparaat hetzelfde uit.
function LijnDropdown({ value, opties, placeholder, onChange, style }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const dicht = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', dicht)
    document.addEventListener('touchstart', dicht)
    return () => { document.removeEventListener('mousedown', dicht); document.removeEventListener('touchstart', dicht) }
  }, [open])
  const gekozen = opties.find(o => o.key === value)
  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          ...LIJN, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          color: gekozen ? '#fff' : 'rgba(255,255,255,0.3)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{gekozen ? gekozen.label : placeholder}</span>
        <ChevronDown size={18} strokeWidth={2.4} color="#fff"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20, marginTop: 4,
          background: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          padding: 4, boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}>
          {opties.map(o => {
            const aan = o.key === value
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={aan}
                onClick={() => { onChange(o.key); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: aan ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderRadius: 8,
                  padding: '12px 12px', color: '#fff', fontFamily: 'inherit',
                  fontSize: 15, fontWeight: aan ? 800 : 700, cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const isVerplicht = (v) => !!v && (v.verplicht ?? (v.type === 'tekst' && !v.optioneel))

const TEVREDEN_OPTIES = ['Heel erg tevreden', 'Een beetje tevreden', 'Niet tevreden']

const SECTIES = [
  {
    kop: 'Even bijpraten',
    velden: [
      {
        // Bewust zonder cijfers: die komen op het volgende scherm. Eerst hoe
        // iemand erin zit, want dat antwoord kleurt anders zodra je er een
        // gewicht of een aantal trainingen naast legt.
        id: 'hoe_gaat_het', type: 'tekst',
        toonFase: true,
        vraag: 'Hoe gaat het met je?',
        hulp: null,
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
    ],
  },
  {
    kop: 'Je progressie',
    velden: [
      {
        // Geen vraag maar een terugblik: dit is er gebeurd. Hier stonden vijf
        // vragen die de klant uit zijn hoofd moest beantwoorden terwijl de app
        // het precies wist.
        id: 'week_cijfers_scherm', type: 'progressie',
        vraag: 'Je progressie afgelopen week',
        hulp: null,
        // Deze kop hoort bij het blok eronder, niet midden op het scherm als
        // vraag: er valt niets te beantwoorden.
        kopRechts: true,
      },
      {
        // Eerst kiezen, dan uitleggen. De keuze komt verderop terug in de
        // vraag wat de klant komende week anders gaat doen.
        id: 'progressie_tevreden', type: 'keuze-uitleg',
        vraag: 'Ben je tevreden met de progressie die je afgelopen week hebt gemaakt?',
        hulp: null,
        // Zonder keuze en uitleg kun je niet verder: de rest van het formulier
        // bouwt hierop voort.
        verplicht: true,
        opties: TEVREDEN_OPTIES,
        uitlegId: 'cijfers_toelichting',
        uitlegLabel: 'Leg uit waarom',
        placeholder: 'In je eigen woorden.',
      },
    ],
  },
  {
    kop: 'Terugblik',
    velden: [
      {
        // Meerdere regels: elk ding dat goed ging op een eigen lijn. Wordt
        // als één tekst met regeleinden opgeslagen in trots_op.
        id: 'trots_op', type: 'tekst-lijst', verplicht: true,
        vraag: 'Wat ging er goed, waar ben je trots op?',
        hulp: 'Meerdere dingen? Druk op de + voor een extra regel.',
        placeholder: 'In je eigen woorden.',
      },
      {
        id: 'kon_beter', type: 'tekst-lijst', verplicht: true,
        vraag: 'Wat vond je lastig?',
        hulp: 'Meerdere dingen? Druk op de + voor een extra regel.',
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
      {
        // Grijpt terug op de keuze van slide 3. Wie al heel erg tevreden is,
        // hoeft niets "anders" te doen; die vragen we wat hij vasthoudt.
        id: 'volgende_week_beter', type: 'tekst',
        vraag: 'Je gaf aan dat je {tevreden} was over je progressie, wat ga je komende week anders doen om te zorgen dat je wel tevreden bent over je progressie?',
        vraagTevreden: 'Je gaf aan dat je heel erg tevreden was over je progressie, wat ga je komende week doen om dat vast te houden?',
        vraagZonderKeuze: 'Wat ga je komende week anders doen om tevreden te zijn over je progressie?',
        hulp: null,
        placeholder: 'Bijvoorbeeld: zondagavond mijn eten voorbereiden.',
        // Het doelen-blok staat compact onder dit antwoord: wie net heeft
        // opgeschreven wat hij anders gaat doen, kan het meteen meetbaar maken.
        metDoelen: true,
      },
    ],
  },
  {
    // Komt alleen in het formulier als er doelen van vorige week zijn om af
    // te vinken. Zonder doelen is er niets terug te koppelen.
    kop: 'Je doelen van afgelopen week',
    alleenMetDoelen: true,
    velden: [
      {
        id: 'doelen_vorige_week', type: 'doelen-terugkoppeling',
        vraag: 'Heb je je doelen gehaald?',
        hulp: 'We hebben alvast ingevuld wat de app ervan meet. Klopt het niet, zet het om.',
      },
      {
        id: 'doelen_toelichting', type: 'tekst',
        vraag: 'Waarom wel of waarom niet?',
        hulp: 'Wat hielp, en wat zat in de weg.',
        placeholder: 'In je eigen woorden.',
      },
    ],
  },
  {
    kop: 'Focus voor komende week',
    velden: [
      {
        id: 'hulp_van_coach', type: 'tekst',
        vraag: 'Wat kan ik als coach doen om je te helpen je doelen te halen?',
        hulp: 'Een aanpassing in je plan, uitleg, of gewoon dat ik je eraan herinner.',
        placeholder: 'Zeg het gerust rechtstreeks.',
      },
      {
        id: 'komende_week', type: 'tekst', optioneel: true,
        vraag: 'Is er komende week iets waardoor je het plan niet kan volgen?',
        hulp: 'Bijvoorbeeld een bruiloft, weekend weg, drukke werkweek of vakantie.',
        placeholder: 'Zo niet, laat leeg.',
      },
    ],
  },
]

// Elke vierde check-in erbij: hoe bevalt de coaching zelf. Niet elke week —
// dan wordt het een formaliteit en krijg je "gaat goed" terug. Eens per vier
// weken heeft iemand genoeg meegemaakt om er iets zinnigs over te zeggen.
//
// Eerst het cijfer voor het hele traject, dan twee open vragen over de
// coaching: een 8 alleen vertelt je niet wat je moet houden of veranderen.
const COACHING_SECTIE = {
  kop: 'Over de coaching',
  velden: [
    {
      id: 'traject_score', type: 'schaal',
      vraag: 'Hoe voel je je over je hele traject tot nu toe?',
      hulp: '1 is slecht, 10 is uitstekend.',
    },
    {
      id: 'traject_toelichting', type: 'tekst', optioneel: true,
      vraag: 'Wil je dat cijfer toelichten?',
      hulp: 'Alleen als je er iets bij wilt zeggen.',
      placeholder: 'Optioneel.',
    },
    {
      id: 'coaching_fijnste', type: 'tekst',
      vraag: 'Wat vind je tot nu toe het fijnste aan de coaching?',
      hulp: 'Eens per vier weken vraag ik dit even — zo weet ik wat ik moet blijven doen.',
      placeholder: 'Waar heb je het meeste aan gehad?',
    },
    {
      id: 'coaching_verbeterpunt', type: 'tekst',
      vraag: 'En wat kan er beter?',
      hulp: 'Eerlijk mag, daar heb ik het meeste aan.',
      placeholder: 'Wat je mist, wat onduidelijk is, wat anders zou moeten.',
    },
  ],
}

const SCHAAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// De keuzes achter een getalvraag. Uit app_issues: "in het checkin formulier
// moeten het ipv vrije invul opties, dropdowns worden."
//
// De reeks komt uit de vraag zelf (max en step), dus er valt niets te
// verzinnen: 'van 7' geeft 0 t/m 7, uren slaap met step 0.5 geeft halve uren.
// Zonder max — alcohol — een ruime bovengrens; wie daarboven zit heeft een
// ander gesprek nodig dan een invulveld.
//
// De open vragen blijven tekst. Een dropdown bij "Hoe gaat het met je?" zou
// precies het antwoord weghalen waar een check-in voor bestaat.
const reeksVoor = (v) => {
  const stap = v.step || 1
  const max = v.max ?? 20
  const uit = []
  for (let n = 0; n <= max + 1e-9; n += stap) {
    uit.push(Number(n.toFixed(1)))
  }
  return uit
}

// Eén vraag per scherm. De secties blijven als kopje boven de vraag staan,
// zodat je weet in welk deel je zit, maar er is geen scherm meer met zeven
// vragen tegelijk.
const platteVragen = (secties) => secties.flatMap(sec => sec.velden.map(v => ({ ...v, kop: sec.kop, alleenMetDoelen: !!sec.alleenMetDoelen })))
const VRAGEN_BASIS = platteVragen(SECTIES)
const VRAGEN_MET_COACHING = platteVragen([...SECTIES, COACHING_SECTIE])

export default function ClientCheckinForm({ db, client, onSubmitted, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({})
  const [stap, setStap] = useState(0)
  // Het doelen-blok onder "wat ga je anders doen" staat dicht tot de klant op
  // "Stel doel" tikt.
  const [doelenOpen, setDoelenOpen] = useState(false)
  // Is het vier weken geleden dat de coaching-vragen gesteld zijn? Dan komen
  // ze er deze keer bij. De service rekent op de kalender vanaf de start van
  // het traject, niet op het aantal check-ins.
  const [coachingRonde, setCoachingRonde] = useState(false)
  // De gemeten week. Null zolang hij laadt; het scherm toont dan een regel dat
  // de cijfers worden opgehaald in plaats van lege streepjes.
  const [cijfers, setCijfers] = useState(null)
  // De terugblik van slide 2. Apart van `cijfers`: die telt wat er gebeurd is
  // (vier trainingen), dit laat zien waar het heen beweegt (sterker geworden).
  const [progressie, setProgressie] = useState(null)
  // De lopende fase, voor de aanloopzin op het eerste scherm. Apart opgehaald
  // omdat dat scherm meteen in beeld staat.
  const [fase, setFase] = useState(null)
  // De doelen die de klant vorige keer stelde, met de terugkoppeling erbij.
  // null = nog aan het laden, [] = die zijn er niet (eerste keer, of de vorige
  // check-in was nog het oude formulier).
  const [vorigeDoelen, setVorigeDoelen] = useState(null)

  const service = new CheckinService(db)

  useEffect(() => {
    if (client?.id) checkExistingCheckin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  useEffect(() => {
    let weg = false
    if (!client?.id) return undefined
    haalFase(db, client.id).then(f => { if (!weg) setFase(f) })
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  // De cijfers van de afgelopen zeven dagen. Mislukt dit, dan blijft het bij
  // een lege kaart — nooit een blokkade, want de open vragen zijn het echte
  // doel van de check-in.
  //
  // De doelen van vorige week hangen hieraan: pas als de cijfers er zijn kun je
  // een voorstel doen voor "heb je dit gehaald".
  useEffect(() => {
    let weg = false
    if (!client?.id) return undefined
    ;(async () => {
      let c = null
      try { c = await laadWeekCijfers(db, client) } catch (e) { console.error('Weekcijfers laden mislukt:', e) }
      if (weg) return
      setCijfers(c)

      // Los van de weekcijfers: mislukt de terugblik, dan blijft slide 2 leeg
      // maar loopt de rest van de check-in gewoon door.
      try {
        const pr = await laadProgressie(db, client)
        if (!weg) setProgressie(pr)
      } catch (e) { console.error('Progressie laden mislukt:', e) }

      const vorige = await service.getLaatsteMetDoelen(client.id)
      if (weg) return
      const klaar = bereidTerugkoppelingVoor(vorige?.doelen_komende_week, c)
      setVorigeDoelen(klaar)
      // Het formulier begint met wat er al ingevuld is: de terugkoppeling met
      // het voorstel, en de nieuwe doelen met die van vorige week als start.
      setFormData(prev => ({
        ...prev,
        doelen_vorige_week: klaar,
        doelen_komende_week: prev.doelen_komende_week
          ?? (klaar.length ? klaar.map(d => ({ type: d.type, doel_getal: d.doel_getal, tekst: d.tekst })) : [leegDoel()]),
      }))
    })()
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, client?.id])

  const checkExistingCheckin = async () => {
    setLoading(true)
    try {
      // Nooit voorvullen met een vorige check-in — het formulier hoort vers te
      // openen. We kijken of er sinds de laatste vrijdag al een is ingediend;
      // zo ja, dan het succes-scherm in plaats van het formulier. De cyclus
      // reset elke vrijdag.
      const [hasCheckin, coachingBeurt] = await Promise.all([
        service.hasCheckinSinceLastFriday(client.id),
        service.coachingVraagAanDeBeurt(client.id, client.coaching_start_date),
      ])
      setSubmitted(hasCheckin)
      setCoachingRonde(coachingBeurt)
    } catch (error) {
      console.error('Error checking existing check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (id, value) => setFormData(prev => ({ ...prev, [id]: value }))

  // Een doel telt mee als er iets in staat: een getal bij de meetbare soorten,
  // of tekst bij een eigen doel.
  const geldigDoel = (d) => {
    if (!d?.type) return false
    if (d.type === 'eigen') return !!String(d.tekst || '').trim()
    return Number(d.doel_getal) > 0
  }

  const zetDoel = (i, patch) => setFormData(prev => {
    const lijst = [...(prev.doelen_komende_week || [])]
    lijst[i] = { ...lijst[i], ...patch }
    return { ...prev, doelen_komende_week: lijst }
  })
  const voegDoelToe = () => setFormData(prev => {
    const lijst = [...(prev.doelen_komende_week || [])]
    if (lijst.length >= 3) return prev
    return { ...prev, doelen_komende_week: [...lijst, leegDoel()] }
  })
  const verwijderDoel = (i) => setFormData(prev => ({
    ...prev,
    doelen_komende_week: (prev.doelen_komende_week || []).filter((_, n) => n !== i),
  }))
  const zetBehaald = (i, waarde) => setFormData(prev => {
    const lijst = [...(prev.doelen_vorige_week || [])]
    lijst[i] = { ...lijst[i], behaald: waarde }
    return { ...prev, doelen_vorige_week: lijst }
  })

  const buildPayload = () => ({
    coach_id: client.coach_id || client.trainer_id || null,
    // Zodat de coach-weergave weet welke vragen bij deze check-in hoorden.
    // 4 = dit formulier: de klant stelt eigen weekdoelen en koppelt de week
    // erna terug of hij ze gehaald heeft.
    formulier_versie: 4,
    // De stand zoals de klant hem zag toen hij dit invulde. Wordt later niet
    // meer herrekend, ook niet als er nog wordt nagelogd.
    week_cijfers: cijfers || null,
    // Waren de coaching-vragen deze keer aan de beurt, dan gaan ze altijd mee
    // — desnoods leeg. Zo is "gesteld maar niet beantwoord" te onderscheiden
    // van "niet gesteld", en komt de vraag niet de week erna meteen terug.
    ...(coachingRonde ? { coaching_fijnste: '', coaching_verbeterpunt: '' } : {}),
    ...formData,
  })

  const handleSubmit = async () => {
    // Alleen de energiescore is verplicht. De rest mag leeg: een half
    // ingevulde check-in zegt meer dan geen check-in, en de oude versie
    // blokkeerde op zes verplichte scores.
    // Eén ding is verplicht: minstens één doel voor komende week. Zonder doel
    // heeft de volgende check-in niets om op terug te komen, en dan valt het
    // hele idee om.
    const doelen = (formData.doelen_komende_week || []).filter(d => geldigDoel(d))
    if (doelen.length === 0) {
      alert('Kies minstens één doel voor komende week.')
      return
    }

    setSubmitting(true)
    // Alleen doelen met inhoud opslaan; een lege derde regel is geen doel.
    formData.doelen_komende_week = doelen

    // Stap 1 — alléén de daadwerkelijke opslag. Alleen híer mag een fout als
    // "versturen mislukt" getoond worden.
    try {
      await service.createCheckin({ client_id: client.id, ...buildPayload() })
    } catch (error) {
      console.error('Checkin submit failed:', error)
      alert('Fout bij versturen: ' + (error?.message || error?.details || JSON.stringify(error)))
      setSubmitting(false)
      return
    }

    // Stap 2 — vanaf hier ís de check-in opgeslagen. Een fout in het
    // UI-vervolg mag NOOIT als "versturen mislukt" verschijnen.
    setSubmitted(true)
    try { onSubmitted?.() }
    catch (cbErr) { console.error('onSubmitted-callback faalde (check-in is wel opgeslagen):', cbErr) }
    setSubmitting(false)
    setTimeout(() => { try { onClose?.() } catch { /* modal al weg */ } }, 2400)
  }

  // ── Bouwstenen ────────────────────────────────────────────────────────
  const invoerStijl = (breed) => ({ ...LIJN, fontWeight: 800, width: breed ? '100%' : 90 })

  const keuzeStijl = (aan, vast) => ({
    border: `1px solid ${aan ? '#fff' : RAND}`,
    borderRadius: 999, padding: vast ? '10px 0' : '10px 18px',
    width: vast || undefined, textAlign: vast ? 'center' : undefined,
    background: aan ? '#fff' : KAART,
    fontSize: 15, fontWeight: 800, color: aan ? '#0A0A0A' : '#fff',
    cursor: 'pointer', fontFamily: 'inherit',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  const renderVeld = (v) => {
    const waarde = formData[v.id]
    // Zonder bekende voornaam wordt "Hoe gaat het met je, {naam}?" netjes
    // "Hoe gaat het met je?" in plaats van een lege komma.
    const voornaam = (client?.first_name || '').trim()
    let vraagTekst = v.vraag.includes('{naam}')
      ? (voornaam ? v.vraag.replace('{naam}', voornaam) : v.vraag.replace(', {naam}', ''))
      : v.vraag
    if (v.vraag.includes('{tevreden}')) {
      const keuze = formData.progressie_tevreden
      vraagTekst = !keuze ? v.vraagZonderKeuze
        : keuze === TEVREDEN_OPTIES[0] ? v.vraagTevreden
        : v.vraag.replace('{tevreden}', keuze.toLowerCase())
    }

    // Aanloop op het eerste scherm: waar in de fase zit je. Pas zodra de fase
    // bekend is, anders zou er even een andere zin staan die daarna verspringt.
    // Geen fase ingesteld betekent gewoon de kale vraag.
    // De aanhef staat als eigen regel boven de vraag. Zonder ingestelde fase
    // blijft het bij de begroeting; een weeknummer verzinnen we niet.
    const aanhef = v.toonFase && voornaam
      ? (fase
          ? `Heyy ${voornaam}, we zitten nu in week ${fase.weken} ${fase.naam}fase.`
          : `Heyy ${voornaam}.`)
      : null
    return (
      // Eén vraag per scherm, dus die hoort in het midden te staan en niet
      // tegen de bovenrand met een half scherm leegte eronder. Het blok blijft
      // smal (560px) zodat een vraag van twee regels leesbaar blijft.
      <div key={v.id} style={{ width: '100%', textAlign: 'left' }}>
        <style>{LIJN_CSS}</style>
        {aanhef && (
          <div style={{ fontSize: 15, lineHeight: 1.5, color: '#9ca3af', marginBottom: 8 }}>
            {aanhef}
          </div>
        )}
        <div style={{
          fontSize: v.kopRechts ? 18 : (isMobile ? 19 : 22),
          fontWeight: 800,
          color: '#fff',
          textAlign: 'left',
        }}>
          {vraagTekst}{isVerplicht(v) ? ' *' : ''}
        </div>
        {v.hulp && (
          <div style={{ color: GRIJS, fontSize: 14, fontWeight: 700, marginTop: '0.8vh' }}>
            {v.hulp}
          </div>
        )}

        {/* ── Terugkoppeling op de doelen van vorige week ── */}
        {v.type === 'doelen-terugkoppeling' && (() => {
          const lijst = formData.doelen_vorige_week || []
          if (vorigeDoelen === null) {
            return <div style={{ marginTop: '2.2vh', color: GRIJS, fontSize: 14, fontWeight: 700 }}>Je doelen worden opgehaald…</div>
          }
          return (
            <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>
              {lijst.map((d, i) => (
                <div key={i} style={{
                  padding: '12px 14px', marginBottom: 8,
                  background: KAART, border: `1px solid ${RAND}`, borderRadius: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#fff' }}>
                      {doelTekst(d)}
                    </span>
                    {d.gemeten != null && (
                      <span style={{ fontSize: 13, fontWeight: 800, color: GRIJS, fontVariantNumeric: 'tabular-nums' }}>
                        gemeten: {d.gemeten}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {BEHAALD_OPTIES.map(o => {
                      const aan = d.behaald === o.key
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => zetBehaald(i, o.key)}
                          style={{
                            flex: 1, minHeight: 40, borderRadius: 10,
                            background: aan ? o.kleur : 'transparent',
                            border: `1px solid ${aan ? o.kleur : RAND}`,
                            color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                            fontSize: 14, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div style={{ color: GRIJS, fontSize: 12.5, fontWeight: 700, marginTop: 6, lineHeight: 1.5 }}>
                Wat de app kon meten staat al ingevuld. Klopt het niet met hoe jouw week
                ging, zet het gerust om.
              </div>
            </div>
          )
        })()}

        {/* ── Doelen kiezen voor komende week ── */}
        {v.type === 'progressie' && <ProgressieScherm progressie={progressie} isMobile={isMobile} db={db} clientId={client?.id} />}

        {(v.type === 'aantal' || v.type === 'aantal-van') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, marginTop: '2.2vh', flexWrap: 'wrap' }}>
            <select
              className="ci-lijn"
              value={waarde ?? ''}
              onChange={e => updateField(v.id, e.target.value === '' ? null : Number(e.target.value))}
              style={invoerStijl(false)}
            >
              <option value="" style={{ background: '#1a1a1a' }}>—</option>
              {reeksVoor(v).map(n => (
                <option key={n} value={n} style={{ background: '#1a1a1a' }}>{n}</option>
              ))}
            </select>
            {v.type === 'aantal-van' && (
              <>
                <span style={{ color: GRIJS, fontSize: 16, fontWeight: 800 }}>{v.na}</span>
                <select
                  className="ci-lijn"
                  value={formData[v.tweedeId] ?? ''}
                  onChange={e => updateField(v.tweedeId, e.target.value === '' ? null : Number(e.target.value))}
                  style={invoerStijl(false)}
                >
                  <option value="" style={{ background: '#1a1a1a' }}>—</option>
                  {reeksVoor(v).map(n => (
                    <option key={n} value={n} style={{ background: '#1a1a1a' }}>{n}</option>
                  ))}
                </select>
              </>
            )}
            <span style={{ color: GRIJS, fontSize: 16, fontWeight: 800 }}>{v.slot}</span>
          </div>
        )}

        {v.type === 'keuze-uitleg' && (
          <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>
            <LijnDropdown
              value={waarde ?? null}
              opties={v.opties.map(o => ({ key: o, label: o }))}
              placeholder="Maak een keuze"
              onChange={val => updateField(v.id, val)}
            />
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginTop: 32 }}>{v.uitlegLabel}{isVerplicht(v) ? ' *' : ''}</div>
            <LijnTekst
              placeholder={v.placeholder} value={formData[v.uitlegId]}
              onChange={val => updateField(v.uitlegId, val)}
              style={{ marginTop: 4 }}
            />
          </div>
        )}

        {v.type === 'keuze' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10, marginTop: '2.2vh' }}>
            {v.opties.map(o => (
              <button key={o} type="button" onClick={() => updateField(v.id, waarde === o ? null : o)}
                style={keuzeStijl(waarde === o)}>
                {o}
              </button>
            ))}
          </div>
        )}

        {v.type === 'schaal' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8, marginTop: '2.2vh' }}>
            {SCHAAL.map(n => (
              <button key={n} type="button" onClick={() => updateField(v.id, n)}
                style={keuzeStijl(waarde === n, 52)}>
                {n}
              </button>
            ))}
          </div>
        )}

        {v.type === 'tekst-lijst' && (() => {
          const regels = String(waarde ?? '').split('\n')
          const zet = (lijst) => updateField(v.id, lijst.join('\n'))
          return (
            <div style={{ marginTop: '2.2vh' }}>
              {regels.map((regel, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < regels.length - 1 ? 8 : 0 }}>
                  <input
                    className="ci-lijn"
                    value={regel}
                    placeholder={i === 0 ? v.placeholder : 'Nog iets?'}
                    autoFocus={i > 0 && regel === ''}
                    onChange={e => { const l = [...regels]; l[i] = e.target.value.replace(/\n/g, ' '); zet(l) }}
                    onKeyDown={e => {
                      // Enter op de laatste regel = nieuwe regel; backspace op een
                      // lege regel haalt hem weg.
                      if (e.key === 'Enter') { e.preventDefault(); if (i === regels.length - 1) zet([...regels, '']) }
                      if (e.key === 'Backspace' && regel === '' && regels.length > 1) { e.preventDefault(); zet(regels.filter((_, n) => n !== i)) }
                    }}
                    style={{ ...LIJN, padding: '6px 0', flex: 1, minWidth: 0 }}
                  />
                  {i === regels.length - 1 && (
                    <button
                      type="button"
                      onClick={() => zet([...regels, ''])}
                      aria-label="Regel toevoegen"
                      style={{
                        width: 28, height: 28, borderRadius: 999, background: '#fff', border: 'none',
                        color: '#0A0A0A', fontSize: 20, fontWeight: 800, lineHeight: 1, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })()}

        {v.type === 'tekst' && (
          <LijnTekst
            placeholder={v.placeholder} value={waarde}
            onChange={val => updateField(v.id, val)}
            style={{ marginTop: '2.2vh' }}
          />
        )}

        {v.metDoelen && (() => {
          const lijst = formData.doelen_komende_week || []
          const rij = { ...invoerStijl(true), width: 'auto', minWidth: 0, fontSize: 15 }
          return (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>
                Doelen stellen voor jezelf kan het makkelijker maken.
              </div>

              {!doelenOpen ? (
                <button
                  type="button"
                  onClick={() => { setDoelenOpen(true); if (lijst.length === 0) voegDoelToe() }}
                  style={{
                    marginTop: 10, minHeight: 44, padding: '0 20px', borderRadius: 12,
                    background: '#fff', border: 'none', color: '#0A0A0A',
                    fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  Stel doel
                </button>
              ) : (
                <div style={{ marginTop: 10 }}>
                  {/* Eén regel per doel: soort (dropdown), dan het aantal. */}
                  {lijst.map((d, i) => {
                    const t = typeVan(d.type)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <LijnDropdown
                          value={d.type || 'trainen'}
                          opties={DOEL_TYPES.map(dt => ({ key: dt.key, label: dt.label }))}
                          placeholder="Soort doel"
                          onChange={key => {
                            const dt = typeVan(key)
                            zetDoel(i, { type: key, doel_getal: dt?.standaard ?? null, tekst: '' })
                          }}
                          style={{ flex: 1, minWidth: 0 }}
                        />
                        {d.type === 'eigen' ? (
                          <input
                            className="ci-lijn"
                            value={d.tekst || ''}
                            onChange={e => zetDoel(i, { tekst: e.target.value })}
                            placeholder="Bijvoorbeeld: om 23:00 in bed"
                            style={{ ...rij, flex: 2 }}
                          />
                        ) : (
                          <>
                            <input
                              className="ci-lijn"
                              type="number"
                              inputMode="numeric"
                              value={d.doel_getal ?? ''}
                              min={1}
                              max={t?.max || 99}
                              step={t?.stap || 1}
                              onChange={e => zetDoel(i, { doel_getal: e.target.value === '' ? null : Number(e.target.value) })}
                              style={{ ...rij, width: 64, flex: 'none', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', minWidth: 42 }}>
                              {t?.eenheid}
                            </span>
                          </>
                        )}
                        {lijst.length > 1 && (
                          <button type="button" onClick={() => verwijderDoel(i)} aria-label="Doel verwijderen" style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                            fontSize: 20, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                            padding: '0 4px', lineHeight: 1,
                          }}>×</button>
                        )}
                      </div>
                    )
                  })}

                  {lijst.length < 3 && (
                    <button type="button" onClick={voegDoelToe} style={{
                      background: 'none', border: 'none', padding: 0,
                      color: '#fff', fontSize: 14, fontWeight: 800,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                      + Doel erbij
                    </button>
                  )}
                  <div style={{ color: GRIJS, fontSize: 12.5, fontWeight: 700, marginTop: 8, lineHeight: 1.5 }}>
                    Deze doelen komen volgende week terug in je check-in, en staan tot die tijd
                    op je startscherm.
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  // ── Laden ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100%', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 44, height: 44,
          border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#fff',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  // ── Al ingevuld deze week ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: '100%', boxSizing: 'border-box',
        padding: isMobile ? '2.5rem 1rem' : '3rem', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={isMobile ? 48 : 56} color="#fff" style={{ marginBottom: '1.25rem' }} />
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Check-in verstuurd
        </h2>
        <p style={{ color: GRIJS, fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 700 }}>
          Je hoort binnen 24 uur van me met feedback en eventuele bijsturing.
        </p>
      </div>
    )
  }

  // ── Formulier — één vraag per scherm ──────────────────────────────────
  // Zolang de doelen laden (vorigeDoelen === null) blijft het blok staan,
  // anders springt het aantal schermen tijdens het invullen.
  const geenDoelen = Array.isArray(vorigeDoelen) && vorigeDoelen.length === 0
  const vragen = (coachingRonde ? VRAGEN_MET_COACHING : VRAGEN_BASIS)
    .filter(v => !(v.alleenMetDoelen && geenDoelen))
  const vraag = vragen[stap]
  const laatste = stap === vragen.length - 1
  // Een verplichte slide is pas klaar als alles erop is ingevuld. Tekstvelden
  // zijn standaard verplicht; alleen velden met optioneel: true niet.
  const ingevuld = (v) => {
    if (!isVerplicht(v)) return true
    if (v.type === 'keuze-uitleg') return !!formData[v.id] && !!String(formData[v.uitlegId] || '').trim()
    if (v.type === 'tekst-lijst') return String(formData[v.id] || '').split('\n').some(r => r.trim())
    const w = formData[v.id]
    return w != null && String(w).trim() !== ''
  }
  const magVerder = ingevuld(vraag)
  // Voortgang telt de vraag waar je nu op staat mee, zodat de balk direct
  // beweegt als je begint in plaats van pas na de eerste stap.
  const voortgang = ((stap + 1) / vragen.length) * 100

  return (
    <div style={{
      color: '#fff', fontWeight: 700, lineHeight: 1.4,
      padding: isMobile ? '1.25rem 1rem 2rem' : '1.5rem 1.5rem 2rem',
      maxWidth: 820, margin: '0 auto', boxSizing: 'border-box',
      // Vult de hoogte van de modal, zodat de vraag in het midden kan staan en
      // de knoppen onderaan. Zonder dit zakte alles naar de bovenrand.
      display: 'flex', flexDirection: 'column', flex: 1, width: '100%',
      minHeight: isMobile ? '100%' : 'max(100%, 420px)',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        width: '100%', maxWidth: 560, margin: '0 auto', padding: '2vh 0',
      }}>
      {/* Voortgang */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${voortgang}%`, height: '100%', background: '#fff', transition: 'width 0.25s ease' }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginTop: '1vh', fontSize: 12, fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: GRIJS,
        }}>
          <span style={{ color: '#fff' }}>{vraag.kop}</span>
          <span>{stap + 1} / {vragen.length}</span>
        </div>
      </div>

      {/* De vraag */}
      {renderVeld(vraag)}

      {/* Navigatie */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32 }}>
        {stap > 0 && (
          <button type="button" onClick={() => setStap(s => s - 1)}
            style={{
              background: 'none', border: 'none', color: GRIJS,
              fontFamily: 'inherit', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              padding: '14px 4px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            Terug
          </button>
        )}
        <div style={{ flex: 1 }} />
        {!laatste ? (
          <button type="button" onClick={() => { if (magVerder) setStap(s => s + 1) }} disabled={!magVerder}
            style={{
              background: '#fff', color: '#0A0A0A', border: 'none', borderRadius: 12,
              padding: '15px 30px', fontFamily: 'inherit', fontSize: 16, fontWeight: 900,
              cursor: magVerder ? 'pointer' : 'default', opacity: magVerder ? 1 : 0.4,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            Volgende
          </button>
        ) : (
          <button type="button" onClick={() => { if (magVerder) handleSubmit() }} disabled={submitting || !magVerder}
            style={{
              background: '#fff', color: '#0A0A0A', border: 'none', borderRadius: 12,
              padding: '15px 30px', fontFamily: 'inherit', fontSize: 16, fontWeight: 900,
              cursor: submitting ? 'wait' : magVerder ? 'pointer' : 'default',
              opacity: submitting ? 0.6 : magVerder ? 1 : 0.4,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            {submitting ? 'Versturen…' : 'Versturen'}
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
