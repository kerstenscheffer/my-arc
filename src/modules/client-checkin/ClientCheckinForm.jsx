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
import { CheckCircle, ChevronDown, Check, Smile, Meh, Frown, Info, Pencil, Trash2, Plus, X } from 'lucide-react'
import CheckinService from './CheckinService'
import { laadWeekCijfers } from './weekCijfers'
import { laadProgressie, haalFase } from './progressieWeek'
import ProgressieScherm from './ProgressieScherm'
import DoelIcoon from './DoelIcoon'
import { TEVREDEN_OPTIES, SECTIES, COACHING_SECTIE } from './checkinVragen'
import {
  DOEL_TYPES, typeVan, doelTekst, bereidTerugkoppelingVoor, gemetenRegel, kleurVoorBehaald,
  BEHAALD_OPTIES, leegDoel, voorstelBehaald, MAX_DOELEN, VOORSTEL_VOLGORDE,
} from './doelen'

// Reviewvraag in de coachingronde (eens per 4 weken): geeft de klant een 7 of
// hoger voor het traject, dan komt direct na de toelichting een eigen scherm
// met deze tekst en de Trustpilot-knop. Daarna gaat het formulier gewoon verder.
const TRUSTPILOT_REVIEW_URL = 'https://nl.trustpilot.com/review/myarcfitness.com'
const REVIEW_TEKST = (naam) => `Hey${naam ? ` ${naam}` : ''}, Het zou enorm veel voor mij betekenen als je een review zou willen achterlaten. Het kost 1 minuut. Gewoon over waar je tegen aanliep, en hoe dit traject je geholpen heeft. Misschien helpt het iemand anders ook.`
const REVIEW_SCHERM = { id: '_review', type: 'review', optioneel: true }
// Vanaf welk cijfer voor het traject de reviewvraag komt (was 8 tot 18 nov 2026).
const REVIEW_VANAF = 7

// Eén woord per suggestie; het aantal stel je in zodra hij in de lijst staat.
const KORT = { trainen: 'Trainen', wegen: 'Wegen', voeding: 'Voeding', stappen: 'Stappen', slaap: 'Slaap', mealprep: 'Meal prep' }

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
  // Onderin het scherm (de doelen-sheet) valt een lijstje dat naar beneden
  // uitklapt buiten beeld; dan klapt het naar boven.
  const [naarBoven, setNaarBoven] = useState(false)
  const ref = useRef(null)
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      const nodig = opties.length * 44 + 16
      setNaarBoven(window.innerHeight - r.bottom < nodig && r.top > nodig)
    }
    setOpen(o => !o)
  }
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
        onClick={toggle}
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
          position: 'absolute', left: 0, right: 0, zIndex: 20,
          ...(naarBoven ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }),
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

// Getal kiezen door te schuiven. Dicht is het alleen het getal op de lijn;
// tik erop en op die plek klapt een rol open met het gekozen getal groot in
// het midden, twee getallen erboven en twee eronder. Scrollen snapt per
// getal; tikken op een getal kiest het en sluit de rol. Buiten tikken sluit
// ook.
const ROL_HOOGTE = 32
const ROL_ZICHTBAAR = 5
function GetalRol({ value, min = 1, max = 99, stap = 1, onChange, style }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const rol = useRef(null)
  const timer = useRef(null)
  const waarden = []
  for (let n = min; n <= max; n += stap) waarden.push(n)
  const rand = ROL_HOOGTE * Math.floor(ROL_ZICHTBAAR / 2)

  useEffect(() => {
    if (!open) return
    // Op het huidige getal beginnen.
    const idx = Math.max(0, waarden.findIndex(n => n === value))
    if (rol.current) rol.current.scrollTop = idx * ROL_HOOGTE
    const dicht = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', dicht)
    document.addEventListener('touchstart', dicht)
    return () => { document.removeEventListener('mousedown', dicht); document.removeEventListener('touchstart', dicht) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const bijScroll = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!rol.current) return
      const idx = Math.round(rol.current.scrollTop / ROL_HOOGTE)
      const n = waarden[Math.min(waarden.length - 1, Math.max(0, idx))]
      if (n !== undefined && n !== value) onChange(n)
    }, 80)
  }

  const stijlVoor = (n) => {
    const afstand = Math.abs(waarden.indexOf(n) - waarden.indexOf(value))
    if (afstand === 0) return { fontSize: 20, fontWeight: 800, color: '#fff' }
    if (afstand === 1) return { fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }
    return { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.28)' }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        style={{
          ...LIJN, textAlign: 'center', fontWeight: 800, cursor: 'pointer',
          color: value == null ? 'rgba(255,255,255,0.3)' : '#fff',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          ...style,
        }}
      >
        {value ?? '—'}
      </button>
    )
  }

  return (
    <div ref={wrap} style={{ position: 'relative', height: ROL_HOOGTE * ROL_ZICHTBAAR, ...style }}>
      {/* Het venster in het midden: dit getal telt. */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, right: 0, top: rand, height: ROL_HOOGTE,
        borderTop: '1px solid rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.25)',
        pointerEvents: 'none',
      }} />
      <div
        ref={rol}
        role="listbox"
        onScroll={bijScroll}
        style={{
          height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory',
          padding: `${rand}px 0`, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          maskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
        }}
      >
        {waarden.map(n => (
          <button
            key={n}
            type="button"
            role="option"
            aria-selected={n === value}
            onClick={() => { onChange(n); setOpen(false) }}
            style={{
              display: 'block', width: '100%', height: ROL_HOOGTE, scrollSnapAlign: 'center',
              background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums', cursor: 'pointer', transition: 'font-size 0.12s, color 0.12s',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              ...stijlVoor(n),
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

const isVerplicht = (v) => !!v && (v.verplicht ?? (v.type === 'tekst' && !v.optioneel))

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

export default function ClientCheckinForm({ db, client, onSubmitted, onClose, titel, altijdFormulier = false }) {
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
  // Welk doel heeft zijn uitleg open (de i achter het doel): index of null.
  const [doelInfo, setDoelInfo] = useState(null)
  // Eigen doelen die met het vinkje zijn vastgezet (index in de lijst).
  const [eigenKlaar, setEigenKlaar] = useState(() => new Set())
  // De lopende fase, voor de aanloopzin op het eerste scherm. Apart opgehaald
  // omdat dat scherm meteen in beeld staat.
  const [fase, setFase] = useState(null)
  // De doelen die de klant vorige keer stelde, met de terugkoppeling erbij.
  // null = nog aan het laden, [] = die zijn er niet (eerste keer, of de vorige
  // check-in was nog het oude formulier).
  const [vorigeDoelen, setVorigeDoelen] = useState(null)
  // Wat de klant vorige week opschreef bij "wat ga je anders doen": komt
  // terug op de terugkoppeling-slide, boven zijn doelen.
  const [vorigeAnders, setVorigeAnders] = useState('')

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
      setVorigeAnders(String(vorige?.volgende_week_beter || '').trim())
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
      // altijdFormulier: lokaal bekijken van het formulier, ook als er al een check-in is.
      setSubmitted(altijdFormulier ? false : hasCheckin)
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
  // Zonder soort: de eerste die er nog niet staat (slaap voorop), zodat je niet
  // twee keer 'Trainen' krijgt.
  const voegDoelToe = (soort = null) => setFormData(prev => {
    const lijst = [...(prev.doelen_komende_week || [])]
    if (lijst.length >= MAX_DOELEN) return prev
    const al = new Set(lijst.map(d => d.type))
    const kies = (typeof soort === 'string' && soort) || VOORSTEL_VOLGORDE.find(k => !al.has(k)) || 'eigen'
    return { ...prev, doelen_komende_week: [...lijst, leegDoel(kies)] }
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
    // De terugblik van slide "Je progressie afgelopen week", precies zoals
    // de klant hem zag. De coach kan hem erbij pakken bij het lezen.
    progressie: progressie || null,
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
      // Oudere app-versies kennen het slaap- en mealprepdoel niet en tonen dan `tekst`. Die
      // vullen we hier, zodat er daar geen lege regel staat.
      .map(d => (d.type === 'slaap' || d.type === 'mealprep' ? { ...d, tekst: doelTekst(d) } : d))
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
    if (v.type === 'review') {
      const naam = (client?.first_name || '').trim()
      return (
        <div key={v.id} style={{ width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: '#fff', lineHeight: 1.45 }}>
            {REVIEW_TEKST(naam)}
          </div>
          <a href={TRUSTPILOT_REVIEW_URL} target="_blank" rel="noopener noreferrer" style={{
            display: 'block', marginTop: '3vh', background: '#fff', color: '#0A0A0A', textAlign: 'center',
            borderRadius: 999, padding: '15px 18px', fontSize: 16, fontWeight: 900, textDecoration: 'none',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Review achterlaten
          </a>
          <div style={{ color: GRIJS, fontSize: 14, fontWeight: 700, marginTop: 12, textAlign: 'center' }}>
            Daarna kun je hier gewoon verder met de check-in.
          </div>
        </div>
      )
    }
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
            <div style={{ marginTop: 10, textAlign: 'left' }}>
              {vorigeAnders && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: GRIJS, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Dit ging je anders doen</div>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{vorigeAnders}</div>
                </div>
              )}
              {/* Geen kaarten: per doel één regel met een lijn eronder. Links het doel
                  en wat de app mat, rechts de keuze als dropdown in zijn eigen kleur,
                  zonder kader en met een smiley ervoor. */}
              {lijst.map((d, i) => {
                // De gemeten regel kleurt op wat er gemeten is (5 van 5 = groen), niet
                // op wat er in de dropdown staat.
                const gemetenKleur = d.gemeten != null ? kleurVoorBehaald(voorstelBehaald(d, d.gemeten)) : GRIJS
                const keuzeKleur = d.behaald ? kleurVoorBehaald(d.behaald) : 'rgba(255,255,255,0.5)'
                return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '7px 0', borderBottom: `1px solid ${RAND}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 15, fontWeight: 900, color: '#fff' }}>
                      <DoelIcoon type={d.type} size={17} />
                      <span style={{ minWidth: 0, marginLeft: 6 }}>{doelTekst(d)}</span>
                      {/* De i: hoe de app dit doel heeft gemeten. */}
                      {typeVan(d.type)?.info && (
                        <button type="button" onClick={() => setDoelInfo(doelInfo === i ? null : i)} aria-expanded={doelInfo === i} aria-label="Hoe is dit gemeten?"
                          style={{ flexShrink: 0, width: 30, height: 26, padding: 0, background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                          <Info size={15} strokeWidth={2.6} color={doelInfo === i ? '#fff' : 'rgba(255,255,255,0.45)'} />
                        </button>
                      )}
                    </div>
                    {gemetenRegel(d) && (
                      <div style={{ marginTop: 1, fontSize: 13.5, fontWeight: 800, color: gemetenKleur, fontVariantNumeric: 'tabular-nums' }}>
                        {gemetenRegel(d)}
                      </div>
                    )}
                    {doelInfo === i && (
                      <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
                        {typeVan(d.type).info}
                      </div>
                    )}
                  </div>
                  {/* Geen kader: een smiley in de kleur van de keuze, het woord en een pijltje. */}
                  <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {(() => { const Smiley = d.behaald === 'ja' ? Smile : d.behaald === 'deels' ? Meh : d.behaald === 'nee' ? Frown : Meh
                      return <Smiley size={22} strokeWidth={2.6} color={keuzeKleur} style={{ position: 'absolute', left: 0, top: '50%', marginTop: -11, pointerEvents: 'none' }} /> })()}
                    <select
                      className="ci-lijn"
                      value={d.behaald || ''}
                      onChange={e => zetBehaald(i, e.target.value)}
                      aria-label={`${doelTekst(d)}: gelukt?`}
                      style={{
                        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                        height: 38, minWidth: 108, padding: '0 22px 0 30px', borderRadius: 0,
                        background: 'transparent', border: 'none', color: keuzeKleur,
                        fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {!d.behaald && <option value="" disabled>Kies</option>}
                      {BEHAALD_OPTIES.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={3} color={keuzeKleur} style={{ position: 'absolute', right: 0, top: '50%', marginTop: -8, pointerEvents: 'none' }} />
                  </div>
                </div>
                )
              })}
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginTop: 18 }}>{v.uitlegLabel}{isVerplicht(v) ? ' *' : ''}</div>
              <LijnTekst
                placeholder={v.placeholder} value={formData[v.uitlegId]}
                onChange={val => updateField(v.uitlegId, val)}
                style={{ marginTop: 4 }}
              />
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

              {/* Op de pagina zelf de gekozen doelen, elk met een potlood (aanpassen in
                  de sheet onderaan) en een prullenbak; daaronder een plus voor een
                  nieuw doel. De losse knop 'Doelen aanpassen' is daarmee vervallen. */}
              {(() => {
                const icoonKnop = { flexShrink: 0, width: 40, height: 40, padding: 0, background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
                const zichtbaar = lijst.map((d, i) => ({ d, i })).filter(x => geldigDoel(x.d))
                return (
                  <div style={{ marginTop: 6 }}>
                    {zichtbaar.map(({ d, i }) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${RAND}` }}>
                        <DoelIcoon type={d.type} />
                        <span style={{ flex: 1, minWidth: 0, marginLeft: 8, fontSize: 15, fontWeight: 800, color: '#fff', padding: '6px 0' }}>{doelTekst(d)}</span>
                        <button type="button" onClick={() => setDoelenOpen(true)} aria-label={`${doelTekst(d)} aanpassen`} title="Aanpassen" style={icoonKnop}>
                          <Pencil size={17} strokeWidth={2.6} color="#fff" />
                        </button>
                        <button type="button" onClick={() => verwijderDoel(i)} aria-label={`${doelTekst(d)} verwijderen`} title="Verwijderen" style={icoonKnop}>
                          <Trash2 size={17} strokeWidth={2.6} color="rgba(255,255,255,0.55)" />
                        </button>
                      </div>
                    ))}
                    {/* Uitnodigend: een witte knop over de volle breedte, met eronder een
                        zetje in de goede richting. */}
                    {lijst.length < MAX_DOELEN && (
                      <>
                        <button type="button" onClick={() => setDoelenOpen(true)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 46, padding: 0, marginTop: 12, borderRadius: 12, background: '#fff', border: 'none', color: '#0a0a0a', fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                          <Plus size={18} strokeWidth={3.2} />
                          {zichtbaar.length > 0 ? 'Nog een doel toevoegen' : 'Stel je eerste doel'}
                        </button>
                        <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: GRIJS, lineHeight: 1.45, textAlign: 'center' }}>
                          {zichtbaar.length > 0 ? 'Bijvoorbeeld een slaapdoel. Eén extra doel maakt je week concreter.' : 'Schrijf op wat je deze week wilt halen; volgende week kijken we samen terug.'}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Sheet van onderaf. */}
              {doelenOpen && (
                <div
                  onClick={() => setDoelenOpen(false)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    animation: 'checkinFadeIn 0.15s ease',
                  }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-label="Doelen voor komende week"
                    style={{
                      width: '100%', maxWidth: 560, boxSizing: 'border-box',
                      background: '#141414', borderRadius: '16px 16px 0 0',
                      // Met meer doelen moet het venster kunnen scrollen.
                      maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                      padding: '16px 16px max(16px, env(safe-area-inset-bottom))',
                      animation: 'checkinSheetUp 0.2s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                      Doelen voor komende week
                    </div>
                    {/* Eén regel per doel: soort (dropdown), dan het aantal. Een eigen doel
                        heeft een tweede regel: je tekst, eventueel hoe vaak, en een vinkje
                        om hem vast te zetten. Daarna staat hij als één regel in de lijst. */}
                    {lijst.map((d, i) => {
                      const t = typeVan(d.type)
                      const weg = lijst.length > 1 && (
                        <button type="button" onClick={() => { verwijderDoel(i); setEigenKlaar(new Set()) }} aria-label="Doel verwijderen" style={{
                          flexShrink: 0, width: 32, height: 36, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}><X size={17} strokeWidth={2.8} /></button>
                      )
                      if (d.type === 'eigen' && eigenKlaar.has(i) && String(d.tekst || '').trim()) {
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 40 }}>
                            <DoelIcoon type="eigen" size={20} />
                            <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{doelTekst(d)}</span>
                            <button type="button" onClick={() => setEigenKlaar(prev => { const n = new Set(prev); n.delete(i); return n })} aria-label="Aanpassen" style={{ flexShrink: 0, width: 32, height: 36, padding: 0, background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Pencil size={16} strokeWidth={2.6} color="#fff" />
                            </button>
                            {weg}
                          </div>
                        )
                      }
                      return (
                        <div key={i} style={{ marginBottom: d.type === 'eigen' ? 12 : 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DoelIcoon type={d.type || 'trainen'} size={20} />
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
                            {d.type !== 'eigen' && (
                              <>
                                <GetalRol
                                  value={d.doel_getal ?? null}
                                  min={t?.min ?? (t?.stap || 1)}
                                  max={t?.max || 99}
                                  stap={t?.stap || 1}
                                  onChange={n => zetDoel(i, { doel_getal: n })}
                                  style={{ width: 72, flex: 'none' }}
                                />
                                <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', minWidth: 42 }}>
                                  {t?.eenheid}
                                </span>
                              </>
                            )}
                            {weg}
                          </div>
                          {d.type === 'eigen' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 28 }}>
                              <input
                                className="ci-lijn"
                                value={d.tekst || ''}
                                onChange={e => zetDoel(i, { tekst: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter' && String(d.tekst || '').trim()) { e.currentTarget.blur(); setEigenKlaar(prev => new Set(prev).add(i)) } }}
                                placeholder="Bijvoorbeeld: om 23:00 in bed"
                                style={{ ...rij, flex: 1, minWidth: 0 }}
                              />
                              {/* Hoe vaak: mag leeg blijven. */}
                              <GetalRol
                                value={d.doel_getal ?? null}
                                min={1} max={7} stap={1}
                                onChange={n => zetDoel(i, { doel_getal: n })}
                                style={{ width: 56, flex: 'none' }}
                              />
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>keer</span>
                              <button type="button" disabled={!String(d.tekst || '').trim()} onClick={() => setEigenKlaar(prev => new Set(prev).add(i))} aria-label="Doel opslaan" title="Opslaan"
                                style={{ flexShrink: 0, width: 38, height: 38, padding: 0, borderRadius: '50%', border: 'none', background: String(d.tekst || '').trim() ? '#10b981' : 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Check size={18} strokeWidth={3.2} color={String(d.tekst || '').trim() ? '#0a0a0a' : 'rgba(255,255,255,0.4)'} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Suggesties: wat er nog niet staat, met één tik erbij. Slaap voorop. */}
                    {lijst.length < MAX_DOELEN && (() => {
                      const al = new Set(lijst.map(d => d.type))
                      const nog = VOORSTEL_VOLGORDE.filter(k => !al.has(k))
                      const chip = { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 10px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
                      return (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                            {nog.length ? 'Suggesties' : 'Nog een doel'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {nog.map(k => {
                              const dt = typeVan(k)
                              return (
                                <button key={k} type="button" onClick={() => voegDoelToe(k)} style={chip}>
                                  <DoelIcoon type={k} size={16} />
                                  {KORT[k] || dt.label}
                                  <Plus size={14} strokeWidth={3} color="rgba(255,255,255,0.6)" />
                                </button>
                              )
                            })}
                            <button type="button" onClick={() => voegDoelToe('eigen')} style={chip}>
                              <DoelIcoon type="eigen" size={16} />
                              Eigen
                              <Plus size={14} strokeWidth={3} color="rgba(255,255,255,0.6)" />
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                    <div style={{ color: GRIJS, fontSize: 12.5, fontWeight: 700, marginTop: 8, lineHeight: 1.5 }}>
                      Deze doelen komen volgende week terug in je check-in.
                    </div>
                    <button
                      type="button"
                      onClick={() => setDoelenOpen(false)}
                      style={{
                        width: '100%', minHeight: 48, marginTop: 16, borderRadius: 12,
                        background: '#fff', border: 'none', color: '#0A0A0A',
                        fontSize: 16, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      Klaar
                    </button>
                  </div>
                  <style>{'@keyframes checkinSheetUp { from { transform: translateY(100%); } to { transform: none; } }'}</style>
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
    .flatMap(v => v.id === 'traject_toelichting' && Number(formData.traject_score) >= REVIEW_VANAF ? [v, REVIEW_SCHERM] : [v])
  const vraag = vragen[stap]
  const laatste = stap === vragen.length - 1
  // Een verplichte slide is pas klaar als alles erop is ingevuld. Tekstvelden
  // zijn standaard verplicht; alleen velden met optioneel: true niet.
  const ingevuld = (v) => {
    if (!isVerplicht(v)) return true
    if (v.type === 'keuze-uitleg') return !!formData[v.id] && !!String(formData[v.uitlegId] || '').trim()
    if (v.type === 'tekst-lijst') return String(formData[v.id] || '').split('\n').some(r => r.trim())
    if (v.type === 'doelen-terugkoppeling') {
      const lijst = formData.doelen_vorige_week || []
      return lijst.every(d => d.behaald) && !!String(formData[v.uitlegId] || '').trim()
    }
    const w = formData[v.id]
    return w != null && String(w).trim() !== ''
  }
  const magVerder = ingevuld(vraag)
  // Voortgang telt de vraag waar je nu op staat mee, zodat de balk direct
  // beweegt als je begint in plaats van pas na de eerste stap.
  // De balk begint al op 15%: je bent begonnen, dus er staat iets. De rest
  // verdeelt zich over de vragen tot 100% bij de laatste.
  const voortgang = vragen.length > 1 ? 15 + (stap / (vragen.length - 1)) * 85 : 100

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
      {/* De titel in vet wit, met de voortgangsband eronder. */}
      {titel && (
        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', marginBottom: 8 }}>
          {titel}
        </div>
      )}
      {/* Voortgang in dezelfde vorm als de slaap- en stappenbalk op Home: een
          gevulde band met een ring op het eind van de vulling, hier met een vinkje. */}
      {(() => {
        const HOOG = 30, R = HOOG - 2
        const plek = `clamp(${R / 2 + 2}px, ${voortgang}%, calc(100% - ${R / 2 + 2}px))`
        const links = voortgang > 60
        const klaar = stap + 1 >= vragen.length
        return (
          <div role="progressbar" aria-valuemin={1} aria-valuemax={vragen.length} aria-valuenow={stap + 1}
            // Van rand tot rand van het scherm, zoals de balken op Home. Alleen de
            // vulling is zichtbaar; het stuk dat nog komt heeft geen eigen baan.
            style={{ position: 'relative', height: HOOG, marginBottom: 28, width: '100vw', maxWidth: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
            <div style={{ position: 'absolute', left: 0, top: 3, bottom: 3, width: `max(${voortgang}%, ${R / 2 + 2}px)`, background: 'linear-gradient(90deg, #047857 0%, #10b981 55%, #34d399 100%)', boxShadow: '0 0 14px rgba(16,185,129,0.35)', transition: 'width 0.3s ease' }} />
            <span style={{
              position: 'absolute', top: 1, left: plek, width: R, height: R, marginLeft: -R / 2, boxSizing: 'border-box',
              borderRadius: '50%', border: '2px solid #34d399', background: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: klaar ? '0 0 12px rgba(16,185,129,0.7)' : 'none', transition: 'left 0.3s ease',
            }}>
              <Check size={14} strokeWidth={3.2} color={klaar ? '#10b981' : '#fff'} />
            </span>
            <span style={{
              position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center',
              fontSize: 12, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              transition: 'left 0.3s ease, right 0.3s ease',
              ...(links ? { right: `calc(100% - ${plek} + ${R / 2 + 6}px)` } : { left: `calc(${plek} + ${R / 2 + 6}px)` }),
            }}>
              {stap + 1} / {vragen.length}
            </span>
          </div>
        )
      })()}

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
