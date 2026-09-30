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

import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
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
        id: 'cijfers_toelichting', type: 'tekst',
        vraag: 'Wil je hier iets over kwijt?',
        hulp: 'Alleen als er iets bij hoort. Anders overslaan.',
        placeholder: 'Bijvoorbeeld: dinsdag ziek geweest.',
      },
    ],
  },
  {
    // Blok 3 wordt bij het renderen gevuld: staan er doelen van vorige week,
    // dan komt de terugkoppeling; zo niet, dan één open vraag.
    kop: 'Je doelen van afgelopen week',
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
    kop: 'Terugblik',
    velden: [
      {
        id: 'trots_op', type: 'tekst',
        vraag: 'Wat ging er goed, waar ben je trots op?',
        hulp: 'Groot of klein, alles telt.',
        placeholder: 'In je eigen woorden.',
      },
      {
        id: 'kon_beter', type: 'tekst',
        vraag: 'Wat kon er beter?',
        hulp: 'Waar je tegenop zag, wat je bleef uitstellen, wat gedoe opleverde.',
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
      {
        id: 'traject_score', type: 'schaal',
        vraag: 'Hoe voel je je over je hele traject tot nu toe?',
        hulp: '1 is slecht, 10 is uitstekend.',
      },
      {
        id: 'traject_toelichting', type: 'tekst',
        vraag: 'Wil je dat cijfer toelichten?',
        hulp: 'Alleen als je er iets bij wilt zeggen.',
        placeholder: 'Optioneel.',
      },
    ],
  },
  {
    kop: 'Focus voor komende week',
    velden: [
      {
        id: 'doelen_komende_week', type: 'doelen-stellen',
        vraag: 'Wat zijn je doelen voor komende week?',
        hulp: 'Maak ze specifiek en meetbaar. Eén tot drie doelen.',
      },
      {
        id: 'volgende_week_beter', type: 'tekst',
        vraag: 'Wat ga je deze week anders doen zodat je je doelen wél haalt?',
        hulp: 'Eén ding dat je echt gaat doen is meer waard dan een lijstje goede voornemens.',
        placeholder: 'Bijvoorbeeld: zondagavond mijn eten voorbereiden.',
      },
      {
        id: 'hulp_van_coach', type: 'tekst',
        vraag: 'Wat kan ik als coach doen om je te helpen je doelen te halen?',
        hulp: 'Een aanpassing in je plan, uitleg, of gewoon dat ik je eraan herinner.',
        placeholder: 'Zeg het gerust rechtstreeks.',
      },
      {
        id: 'komende_week', type: 'tekst',
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
// Twee losse vragen en geen cijfer: een 8 vertelt je niet wat je moet houden
// of veranderen.
const COACHING_SECTIE = {
  kop: 'Over de coaching',
  velden: [
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
const platteVragen = (secties) => secties.flatMap(sec => sec.velden.map(v => ({ ...v, kop: sec.kop })))
const VRAGEN_BASIS = platteVragen(SECTIES)
const VRAGEN_MET_COACHING = platteVragen([...SECTIES, COACHING_SECTIE])

export default function ClientCheckinForm({ db, client, onSubmitted, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({})
  const [stap, setStap] = useState(0)
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
  const invoerStijl = (breed) => ({
    background: KAART, border: `1px solid ${RAND}`, borderRadius: 10,
    color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 18,
    padding: '12px 14px', width: breed ? '100%' : 90, outline: 'none',
  })

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
      <div key={v.id} style={{ width: '100%', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {aanhef && (
          <div style={{ fontSize: 15, lineHeight: 1.5, color: '#9ca3af', marginBottom: 8 }}>
            {aanhef}
          </div>
        )}
        <div style={{
          fontSize: v.kopRechts ? 22 : (isMobile ? 19 : 23),
          fontWeight: 800,
          color: '#fff',
          textAlign: v.kopRechts ? 'right' : 'center',
        }}>
          {vraagTekst}
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
          // Geen doelen van vorige week: dan één open vraag, zodat de klant
          // toch kan vertellen waar hij op mikte.
          if (lijst.length === 0) {
            return (
              <div style={{ marginTop: '2.2vh' }}>
                <textarea
                  value={formData.doelen_vrij || ''}
                  onChange={e => updateField('doelen_vrij', e.target.value)}
                  placeholder="Wat waren je doelen voor afgelopen week?"
                  rows={4}
                  style={{ ...invoerStijl(true), resize: 'vertical' }}
                />
                <div style={{ color: GRIJS, fontSize: 12.5, fontWeight: 700, marginTop: 8, lineHeight: 1.5 }}>
                  Vanaf nu kies je aan het eind van deze check-in je doelen, en komen ze
                  hier volgende week vanzelf terug.
                </div>
              </div>
            )
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
        {v.type === 'doelen-stellen' && (() => {
          const lijst = formData.doelen_komende_week || []
          return (
            <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>
              {lijst.map((d, i) => {
                const t = typeVan(d.type)
                return (
                  <div key={i} style={{
                    padding: '12px 14px', marginBottom: 8,
                    background: KAART, border: `1px solid ${RAND}`, borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 900, color: GRIJS, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Doel {i + 1}
                      </span>
                      {lijst.length > 1 && (
                        <button type="button" onClick={() => verwijderDoel(i)} style={{
                          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                        }}>verwijder</button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                      {DOEL_TYPES.map(dt => {
                        const aan = d.type === dt.key
                        return (
                          <button
                            key={dt.key}
                            type="button"
                            onClick={() => zetDoel(i, { type: dt.key, doel_getal: dt.standaard, tekst: '' })}
                            style={{
                              minHeight: 34, padding: '0 12px', borderRadius: 999,
                              background: aan ? '#fff' : 'transparent',
                              border: `1px solid ${aan ? '#fff' : RAND}`,
                              color: aan ? '#0A0A0A' : 'rgba(255,255,255,0.6)',
                              fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
                              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {dt.label}
                          </button>
                        )
                      })}
                    </div>

                    {d.type === 'eigen' ? (
                      <input
                        value={d.tekst || ''}
                        onChange={e => zetDoel(i, { tekst: e.target.value })}
                        placeholder="Bijvoorbeeld: om 23:00 in bed"
                        style={invoerStijl(true)}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={d.doel_getal ?? ''}
                          min={1}
                          max={t?.max || 99}
                          step={t?.stap || 1}
                          onChange={e => zetDoel(i, { doel_getal: e.target.value === '' ? null : Number(e.target.value) })}
                          style={{ ...invoerStijl(false), width: 110, textAlign: 'center' }}
                        />
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
                          {t?.eenheid}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {lijst.length < 3 && (
                <button type="button" onClick={voegDoelToe} style={{
                  width: '100%', minHeight: 44, borderRadius: 12,
                  background: 'transparent', border: `1px dashed ${RAND}`,
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 800,
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
          )
        })()}

        {v.type === 'progressie' && <ProgressieScherm progressie={progressie} />}

        {(v.type === 'aantal' || v.type === 'aantal-van') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: '2.2vh', flexWrap: 'wrap' }}>
            <select
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

        {v.type === 'keuze' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: '2.2vh' }}>
            {v.opties.map(o => (
              <button key={o} type="button" onClick={() => updateField(v.id, waarde === o ? null : o)}
                style={keuzeStijl(waarde === o)}>
                {o}
              </button>
            ))}
          </div>
        )}

        {v.type === 'schaal' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: '2.2vh' }}>
            {SCHAAL.map(n => (
              <button key={n} type="button" onClick={() => updateField(v.id, n)}
                style={keuzeStijl(waarde === n, 52)}>
                {n}
              </button>
            ))}
          </div>
        )}

        {v.type === 'tekst' && (
          <textarea
            placeholder={v.placeholder} value={waarde ?? ''}
            onChange={e => updateField(v.id, e.target.value)}
            style={{
              background: KAART, border: `1px solid ${RAND}`, borderRadius: 10,
              color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 16,
              padding: 14, width: '100%', minHeight: 110, marginTop: '2.2vh',
              resize: 'vertical', lineHeight: 1.5, outline: 'none', textAlign: 'left',
            }}
          />
        )}
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
  const vragen = coachingRonde ? VRAGEN_MET_COACHING : VRAGEN_BASIS
  const vraag = vragen[stap]
  const laatste = stap === vragen.length - 1
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
      display: 'flex', flexDirection: 'column',
      minHeight: isMobile ? '100%' : 'max(100%, 420px)',
    }}>
      {/* Voortgang */}
      <div style={{ marginBottom: '2.5vh' }}>
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

      {/* De vraag — midden op de pagina */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2vh 0',
      }}>
        {renderVeld(vraag)}
      </div>

      {/* Navigatie */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '3vh' }}>
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
          <button type="button" onClick={() => setStap(s => s + 1)}
            style={{
              background: '#fff', color: '#0A0A0A', border: 'none', borderRadius: 12,
              padding: '15px 30px', fontFamily: 'inherit', fontSize: 16, fontWeight: 900,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            Volgende
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            style={{
              background: '#fff', color: '#0A0A0A', border: 'none', borderRadius: 12,
              padding: '15px 30px', fontFamily: 'inherit', fontSize: 16, fontWeight: 900,
              cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            {submitting ? 'Versturen…' : 'Versturen'}
          </button>
        )}
      </div>
    </div>
  )
}
