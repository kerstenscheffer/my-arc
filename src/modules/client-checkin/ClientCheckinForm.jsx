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
        id: 'hoe_gaat_het', type: 'tekst',
        // {naam} wordt bij het renderen vervangen door de voornaam. Staat
        // bewust vóór de cijfers: eerst even mens, dan pas de week doorrekenen.
        vraag: 'Hoe gaat het met je, {naam}?',
        hulp: 'We gaan straks in op de cijfers, maar eerst even dit.',
        placeholder: 'Hoe zit je erbij deze week?',
      },
    ],
  },
  {
    kop: 'Je week in cijfers',
    velden: [
      {
        id: 'training_gedaan', type: 'aantal-van',
        vraag: 'Hoeveel trainingen heb je gedaan?',
        tweedeId: 'training_gepland', na: 'van', slot: 'gepland', max: 14,
      },
      {
        id: 'training_gelogd', type: 'keuze',
        vraag: 'Heb je je trainingen gelogd in de app?',
        opties: ['Alle', 'Meeste', 'Enkele', 'Geen'],
      },
      {
        id: 'training_falen', type: 'keuze',
        vraag: 'Heb je je sets tot falen gebracht?',
        hulp: 'Tot falen betekent: geen herhaling meer met goede techniek.',
        opties: ['Elke set', 'Meeste sets', 'Soms', 'Niet'],
      },
      {
        id: 'dagen_gewogen', type: 'aantal',
        vraag: 'Hoeveel dagen heb je jezelf gewogen?', slot: 'van 7', max: 7,
      },
      {
        id: 'dagen_voeding', type: 'aantal',
        vraag: 'Hoeveel dagen heb je volgens je voedingsplan gegeten?', slot: 'van 7', max: 7,
      },
      {
        id: 'alcohol_aantal', type: 'aantal',
        vraag: 'Hoeveel alcoholische drankjes heb je gehad?', slot: 'deze week',
      },
      {
        id: 'slaap_uren_gem', type: 'aantal',
        vraag: 'Hoeveel uur sliep je gemiddeld per nacht?', slot: 'uur', max: 14, step: 0.5,
      },
    ],
  },
  {
    kop: 'Wat in de weg zat',
    velden: [
      {
        id: 'struggles', type: 'tekst',
        vraag: 'Wat kostte je deze week de meeste moeite?',
        hulp: 'Waar je tegenop zag, wat je bleef uitstellen, wat gedoe opleverde.',
        placeholder: 'Schrijf op wat als eerste in je opkomt.',
      },
      {
        id: 'vastgelopen', type: 'tekst',
        vraag: 'Waar ben je op vastgelopen?',
        hulp: 'Iets wat niet lukte of niet duidelijk was.',
        placeholder: 'Ook als je denkt dat het onbelangrijk is.',
      },
    ],
  },
  {
    kop: 'Wat goed ging',
    velden: [
      {
        id: 'wins', type: 'tekst',
        vraag: 'Wat ging er deze week beter dan je had verwacht?',
        hulp: 'Groot of klein, alles telt.',
        placeholder: 'In je eigen woorden.',
      },
    ],
  },
  {
    kop: 'Energie',
    velden: [
      {
        id: 'energie_score', type: 'schaal',
        vraag: 'Hoeveel energie had je deze week?',
        hulp: '1 is uitgeput, 10 is topfit.',
      },
    ],
  },
]

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
const VRAGEN = SECTIES.flatMap(sec => sec.velden.map(v => ({ ...v, kop: sec.kop })))

// Hoeveel trainingen staan er gepland? Eerst het toegewezen schema (dat is
// wat de klant daadwerkelijk voor zich ziet), anders wat er in de intake is
// opgegeven. Zo hoeft de klant dit niet zelf op te zoeken.
const geplandeTrainingen = (client) => {
  const ws = client?.workout_schedule
  if (ws && typeof ws === 'object') {
    const n = Object.values(ws).filter(Boolean).length
    if (n > 0) return n
  }
  const alt = [client?.workout_days_per_week, client?.days_per_week, client?.training_days]
    .map(v => parseInt(v, 10)).find(n => Number.isFinite(n) && n > 0)
  return alt || null
}

export default function ClientCheckinForm({ db, client, onSubmitted, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({})
  const [stap, setStap] = useState(0)

  const service = new CheckinService(db)

  useEffect(() => {
    if (client?.id) checkExistingCheckin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  const checkExistingCheckin = async () => {
    setLoading(true)
    try {
      // Nooit voorvullen met een vorige check-in — het formulier hoort vers te
      // openen. We kijken of er sinds de laatste vrijdag al een is ingediend;
      // zo ja, dan het succes-scherm in plaats van het formulier. De cyclus
      // reset elke vrijdag.
      const hasCheckin = await service.hasCheckinSinceLastFriday(client.id)
      setSubmitted(hasCheckin)
    } catch (error) {
      console.error('Error checking existing check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  // Aantal geplande trainingen alvast invullen zodra de klant bekend is.
  // De klant kan het overschrijven als het die week anders lag.
  useEffect(() => {
    const n = geplandeTrainingen(client)
    if (n) setFormData(prev => (prev.training_gepland == null ? { ...prev, training_gepland: n } : prev))
  }, [client])

  const updateField = (id, value) => setFormData(prev => ({ ...prev, [id]: value }))

  const buildPayload = () => ({
    coach_id: client.coach_id || client.trainer_id || null,
    // Zodat de coach-weergave weet welke vragen bij deze check-in hoorden.
    formulier_versie: 2,
    ...formData,
  })

  const handleSubmit = async () => {
    // Alleen de energiescore is verplicht. De rest mag leeg: een half
    // ingevulde check-in zegt meer dan geen check-in, en de oude versie
    // blokkeerde op zes verplichte scores.
    if (!formData.energie_score) {
      alert('Geef nog even aan hoeveel energie je had deze week.')
      return
    }

    setSubmitting(true)

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
    const vraagTekst = v.vraag.includes('{naam}')
      ? (voornaam ? v.vraag.replace('{naam}', voornaam) : v.vraag.replace(', {naam}', ''))
      : v.vraag
    return (
      <div key={v.id} style={{ marginBottom: '3vh' }}>
        <div style={{ fontSize: isMobile ? 17 : 21, fontWeight: 800, color: '#fff' }}>
          {vraagTekst}
        </div>
        {v.hulp && (
          <div style={{ color: GRIJS, fontSize: 14, fontWeight: 700, marginTop: '0.6vh' }}>
            {v.hulp}
          </div>
        )}

        {(v.type === 'aantal' || v.type === 'aantal-van') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.4vh', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: '1.4vh' }}>
            {v.opties.map(o => (
              <button key={o} type="button" onClick={() => updateField(v.id, waarde === o ? null : o)}
                style={keuzeStijl(waarde === o)}>
                {o}
              </button>
            ))}
          </div>
        )}

        {v.type === 'schaal' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '1.4vh' }}>
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
              padding: 14, width: '100%', minHeight: 110, marginTop: '1.4vh',
              resize: 'vertical', lineHeight: 1.5, outline: 'none',
            }}
          />
        )}
      </div>
    )
  }

  // ── Laden ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
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
      <div style={{ padding: isMobile ? '2.5rem 1rem' : '3rem', textAlign: 'center' }}>
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
  const vraag = VRAGEN[stap]
  const laatste = stap === VRAGEN.length - 1
  // Voortgang telt de vraag waar je nu op staat mee, zodat de balk direct
  // beweegt als je begint in plaats van pas na de eerste stap.
  const voortgang = ((stap + 1) / VRAGEN.length) * 100

  return (
    <div style={{
      color: '#fff', fontWeight: 700, lineHeight: 1.4,
      padding: isMobile ? '1.25rem 1rem 2rem' : '1.5rem 1.5rem 2rem',
      maxWidth: 820, margin: '0 auto',
      display: 'flex', flexDirection: 'column', minHeight: isMobile ? '60vh' : 420,
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
          <span>{stap + 1} / {VRAGEN.length}</span>
        </div>
      </div>

      {/* De vraag */}
      <div style={{ flex: 1 }}>
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
