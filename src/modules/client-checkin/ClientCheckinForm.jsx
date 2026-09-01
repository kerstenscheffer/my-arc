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

const GOUD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)',
}

const KAART = '#161616'
const RAND = '#2a2a2a'
const GRIJS = '#8a8a8a'

// Eén beschrijving van het formulier; de render leest hieruit. Zo staat de
// vraagtekst op één plek en kan er niets uit de pas lopen met de opslag.
const SECTIES = [
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

export default function ClientCheckinForm({ db, client, onSubmitted, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({})

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
    background: KAART,
    border: `1px solid ${aan ? GOUD.primary : RAND}`,
    borderRadius: 999, padding: vast ? '10px 0' : '10px 18px',
    width: vast || undefined, textAlign: vast ? 'center' : undefined,
    fontSize: 15, fontWeight: 800, color: aan ? GOUD.primary : '#fff',
    cursor: 'pointer', fontFamily: 'inherit',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  const renderVeld = (v) => {
    const waarde = formData[v.id]
    return (
      <div key={v.id} style={{ marginBottom: '3vh' }}>
        <div style={{ fontSize: isMobile ? 17 : 21, fontWeight: 800, color: '#fff' }}>
          {v.vraag}
        </div>
        {v.hulp && (
          <div style={{ color: GRIJS, fontSize: 14, fontWeight: 700, marginTop: '0.6vh' }}>
            {v.hulp}
          </div>
        )}

        {(v.type === 'aantal' || v.type === 'aantal-van') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.4vh', flexWrap: 'wrap' }}>
            <input
              type="number" inputMode="decimal" min={0} max={v.max} step={v.step || 1}
              placeholder="0" value={waarde ?? ''}
              onChange={e => updateField(v.id, e.target.value === '' ? null : Number(e.target.value))}
              style={invoerStijl(false)}
            />
            {v.type === 'aantal-van' && (
              <>
                <span style={{ color: GRIJS, fontSize: 16, fontWeight: 800 }}>{v.na}</span>
                <input
                  type="number" inputMode="numeric" min={0} max={v.max}
                  placeholder="0" value={formData[v.tweedeId] ?? ''}
                  onChange={e => updateField(v.tweedeId, e.target.value === '' ? null : Number(e.target.value))}
                  style={invoerStijl(false)}
                />
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
          border: `3px solid ${GOUD.border}`, borderTopColor: GOUD.primary,
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  // ── Al ingevuld deze week ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ padding: isMobile ? '2rem 1rem' : '3rem', textAlign: 'center' }}>
        <div style={{
          width: isMobile ? 100 : 120, height: isMobile ? 100 : 120,
          borderRadius: 24,
          background: `linear-gradient(135deg, ${GOUD.background} 0%, rgba(0,0,0,0.3) 100%)`,
          border: `1px solid ${GOUD.border}`,
          boxShadow: `0 8px 32px ${GOUD.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle size={isMobile ? 48 : 56} color={GOUD.primary} />
        </div>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, color: GOUD.primary, marginBottom: '0.75rem' }}>
          Check-in verstuurd
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.95rem' : '1rem' }}>
          Je hoort binnen 24 uur van me met feedback en eventuele bijsturing.
        </p>
      </div>
    )
  }

  // ── Formulier ─────────────────────────────────────────────────────────
  return (
    <div style={{
      color: '#fff', fontWeight: 700, lineHeight: 1.4,
      padding: isMobile ? '2vh 1rem 4vh' : '2vh 1.5rem 4vh',
      maxWidth: 820, margin: '0 auto',
    }}>
      <header style={{ marginBottom: '5vh' }}>
        <h1 style={{ fontSize: isMobile ? 26 : 42, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Je wekelijkse check-in
        </h1>
        <p style={{ color: GRIJS, fontSize: 16, marginTop: '1.5vh', fontWeight: 700 }}>
          Kost je nog geen 2 minuten. Vul hem eerlijk in, dan kan ik je gericht bijsturen.
        </p>
      </header>

      {SECTIES.map(sec => (
        <section key={sec.kop} style={{ marginBottom: '5vh' }}>
          <div style={{
            fontSize: 12, fontWeight: 800, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: '#fff',
            paddingBottom: '1.2vh', borderBottom: `1px solid ${RAND}`, marginBottom: '3vh',
          }}>
            {sec.kop}
          </div>
          {sec.velden.map(renderVeld)}
        </section>
      ))}

      <button
        type="button" onClick={handleSubmit} disabled={submitting}
        style={{
          background: GOUD.primary, color: '#0A0A0A',
          border: 'none', borderRadius: 12, padding: '16px 34px',
          fontFamily: 'inherit', fontSize: 17, fontWeight: 800,
          cursor: submitting ? 'wait' : 'pointer', marginTop: '3vh',
          opacity: submitting ? 0.6 : 1,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {submitting ? 'Versturen…' : 'Check-in versturen'}
      </button>

      <footer style={{
        marginTop: '7vh', paddingTop: '3vh', borderTop: `1px solid ${RAND}`,
        color: GRIJS, fontSize: 14, fontWeight: 700,
      }}>
        Je hoort binnen 24 uur van me met feedback en eventuele bijsturing.
      </footer>
    </div>
  )
}
