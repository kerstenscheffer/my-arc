// src/modules/progress/SlaapKnop.jsx
//
// Zwevende knop links op de tracking-pagina waarmee je je nacht logt. Tikken
// opent een blad dat van onderen omhoog schuift.
//
// Waarom een zwevende knop en niet een blok in de pagina: je logt je nacht
// 's ochtends, meteen als je de app opent. Moet je daar eerst een halve pagina
// voor scrollen, dan gebeurt het één keer en daarna niet meer. Zelfde gedachte
// als de waterfles op de maaltijdpagina.
//
// Wat we vragen en waarom in deze volgorde: eerst hoe laat je naar bed ging en
// hoe laat je opstond — dat weet je nog. De uren rekenen we daaruit voor (je
// mag ze overschrijven, want wakker liggen telt niet mee). Daarna het cijfer,
// want dat is het getal waar de coach op stuurt: acht uur slecht slapen zegt
// meer dan zeven uur goed.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Moon, X, Check, Trash2, Lightbulb, ChevronLeft, Scale } from 'lucide-react'
import WeightTrackerService from '../weight-tracker/WeightTrackerService'
import HorizontaleSlider from '../../client/components/HorizontaleSlider'

// Overgenomen uit het oude slaapblok op de pagina. Dat blok is weg; deze tips
// waren het enige eraan dat niet in dit blad zat.
const TIPS = [
  'Ga elke dag op dezelfde tijd naar bed én sta op dezelfde tijd op — ook in het weekend.',
  'Houd je slaapkamer koel: 17–19 °C is ideaal voor diepe slaap.',
  'Zorg voor volledige duisternis. Gebruik een slaapmasker of verduisteringsgordijnen.',
  'Geen schermen binnen 45 minuten voor bedtijd — blauw licht remt melatonine.',
  "Neem 's avonds een warme douche: de afkoeling daarna versnelt het inslapen.",
  'Eet je laatste maaltijd 2–3 uur voor bedtijd.',
  'Kom zodra je wekker gaat meteen uit bed — snoozen verstoort je ritme.',
  'Ga binnen 30 minuten na het opstaan naar buiten voor daglicht.',
]

// Gewichten voor de slider: 30,0 t/m 200,0 kg per 0,1.
const GEWICHTEN = Array.from({ length: 1701 }, (_, i) => Math.round((300 + i)) / 10)

const vandaagIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Uren tussen twee kloktijden, over middernacht heen.
const urenTussen = (bed, op) => {
  if (!bed || !op) return null
  const [bu, bm] = bed.split(':').map(Number)
  const [ou, om] = op.split(':').map(Number)
  if ([bu, bm, ou, om].some(n => !Number.isFinite(n))) return null
  let minuten = (ou * 60 + om) - (bu * 60 + bm)
  if (minuten <= 0) minuten += 24 * 60
  return Math.round((minuten / 60) * 10) / 10
}

const veld = {
  width: '100%', minHeight: 46, padding: '0 0.75rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 12, color: '#fff', fontSize: '0.95rem', fontWeight: 800,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const linkKnop = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.45)',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}


// Het blad 'Je nacht', los te openen voor elke nacht. `datum` is de dag
// waarop je wakker werd (log_date). Gebruikt door de zwevende knop op de
// trackingpagina en door het slaapblok in de agenda op home. Eén tabel
// (sleep_logs), dus de coach ziet het in coach-insight, waar je ook logt.
// `alleenGewicht`: alleen de weegstap, als los scherm (regel 'Wegen' in de
// agenda). Opslaan of overslaan sluit het blad.
export function SlaapLogBlad({ open, onClose, client, db, datum = null, voorBed = null, voorOpstaan = null, onOpgeslagen, onStatus, alleenGewicht = false, onGewicht }) {
  const logDatum = datum || vandaagIso()
  const setOpen = (v) => { if (!v) onClose?.() }
  const [bed, setBed] = useState(voorBed || '23:00')
  const [opstaan, setOpstaan] = useState(voorOpstaan || '07:00')
  // De geplande nacht uit de intake (clients.work_schedule, type 'slaap'):
  // de nacht die op logDatum eindigt, begon de avond ervoor.
  const [gepland, setGepland] = useState(null) // { bed, op }
  // Gewicht na het opstaan: laatste weging als startpunt, en of deze ochtend
  // al gewogen is.
  const [gewicht, setGewicht] = useState(null)
  const [gewogen, setGewogen] = useState(false)
  const [gewichtBezig, setGewichtBezig] = useState(false)
  const [uren, setUren] = useState('')
  const [urenAangeraakt, setUrenAangeraakt] = useState(false)
  const [kwaliteit, setKwaliteit] = useState(null)
  const [struggles, setStruggles] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [alGelogd, setAlGelogd] = useState(false)
  // Eerdere nachten, in hetzelfde blad. Het losse slaapblok op de pagina is
  // weg; terugkijken hoort bij hetzelfde moment als loggen.
  const [eerdere, setEerdere] = useState([])
  const [toonEerdere, setToonEerdere] = useState(false)
  const [toonTips, setToonTips] = useState(false)
  // Klik-door zoals het oefening- en cardio-logscherm: één vraag per stap.
  const [stap, setStap] = useState(1)

  // Al gelogd die nacht? Dan vult het blad zich met wat er staat, zodat je 'm
  // bijwerkt in plaats van er een tweede naast te zetten. Bij het openen
  // opnieuw, want de nacht kan intussen ergens anders gelogd zijn.
  useEffect(() => {
    if (!open || !client?.id || !db?.supabase) return
    let weg = false
    setBed(voorBed || '23:00'); setOpstaan(voorOpstaan || '07:00'); setUren(''); setUrenAangeraakt(false)
    setGepland(null); setGewicht(null); setGewogen(false)
    // Intake-planning: toon hem, en gebruik hem als startwaarde als de
    // aanroeper (bv. de maan-knop op tracking) zelf geen tijden meegaf.
    db.supabase.from('clients').select('work_schedule').eq('id', client.id).maybeSingle()
      .then(({ data }) => {
        if (weg) return
        const ws = data?.work_schedule || {}
        const vorige = new Date(`${logDatum}T12:00:00`); vorige.setDate(vorige.getDate() - 1)
        const sleutel = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][vorige.getDay()]
        const slaap = (Array.isArray(ws[sleutel]) ? ws[sleutel] : []).find(b => b?.type === 'slaap')
        if (slaap?.start && slaap?.end) {
          const g = { bed: String(slaap.start).slice(0, 5), op: String(slaap.end).slice(0, 5) }
          setGepland(g)
          if (!voorBed) setBed(g.bed)
          if (!voorOpstaan) setOpstaan(g.op)
        }
      }, () => {})
    // Laatste weging tot en met deze ochtend.
    db.supabase.from('weight_challenge_logs').select('date, weight').eq('client_id', client.id)
      .lte('date', logDatum).order('date', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (weg) return
        const r = data?.[0]
        if (r?.weight) { setGewicht(Number(r.weight)); setGewogen(String(r.date).slice(0, 10) === logDatum) }
        else setGewicht(80)
      }, () => { if (!weg) setGewicht(80) })
    setKwaliteit(null); setStruggles(''); setAlGelogd(false); setFout(null); setStap(alleenGewicht ? 3 : 1); setToonEerdere(false); setToonTips(false)
    db.supabase
      .from('sleep_logs')
      .select('id, bedtime, wake_time, hours_slept, quality, struggles')
      .eq('client_id', client.id)
      .eq('log_date', logDatum)
      .maybeSingle()
      .then(({ data }) => {
        if (weg || !data) return
        setAlGelogd(true)
        if (data.bedtime) setBed(String(data.bedtime).slice(0, 5))
        if (data.wake_time) setOpstaan(String(data.wake_time).slice(0, 5))
        if (data.hours_slept != null) { setUren(String(data.hours_slept)); setUrenAangeraakt(true) }
        if (data.quality != null) setKwaliteit(Number(data.quality))
        if (data.struggles) setStruggles(data.struggles)
      })
    return () => { weg = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, db, client?.id, logDatum])

  // De lijst halen we pas op als je hem opent: meestal kom je hier om te
  // loggen, niet om terug te kijken.
  useEffect(() => {
    if (!toonEerdere || !client?.id || !db?.supabase) return
    let weg = false
    db.supabase
      .from('sleep_logs')
      .select('id, log_date, bedtime, wake_time, hours_slept, quality, struggles')
      .eq('client_id', client.id)
      .order('log_date', { ascending: false })
      .limit(30)
      .then(({ data }) => { if (!weg) setEerdere(data || []) })
    return () => { weg = true }
  }, [toonEerdere, db, client?.id])

  const verwijder = async (id) => {
    const vorige = eerdere
    setEerdere(e => e.filter(x => x.id !== id))
    const { error } = await db.supabase.from('sleep_logs').delete().eq('id', id)
    if (error) { setEerdere(vorige); return }
    if (id && logDatum === vorige.find(x => x.id === id)?.log_date) { setAlGelogd(false); onStatus?.(false) }
    onOpgeslagen?.()
  }

  const berekend = useMemo(() => urenTussen(bed, opstaan), [bed, opstaan])
  const urenWaarde = urenAangeraakt && uren !== '' ? parseFloat(String(uren).replace(',', '.')) : berekend

  const bewaar = async () => {
    if (!db?.supabase || !client?.id) return
    setBezig(true); setFout(null)
    try {
      const rij = {
        client_id: client.id,
        log_date: logDatum,
        bedtime: bed || null,
        wake_time: opstaan || null,
        hours_slept: Number.isFinite(urenWaarde) ? urenWaarde : null,
        quality: kwaliteit,
        struggles: struggles.trim() || null,
      }
      // Eén nacht per dag: bestaat er al een rij van vandaag, dan werken we die
      // bij in plaats van er een tweede naast te zetten.
      const { data: bestaand } = await db.supabase
        .from('sleep_logs').select('id')
        .eq('client_id', client.id).eq('log_date', rij.log_date).maybeSingle()

      const { error } = bestaand?.id
        ? await db.supabase.from('sleep_logs').update(rij).eq('id', bestaand.id)
        : await db.supabase.from('sleep_logs').insert(rij)
      if (error) throw error

      setAlGelogd(true)
      onStatus?.(true)
      setOpen(false)
      onOpgeslagen?.({ datum: logDatum, uren: rij.hours_slept, kwaliteit: rij.quality })
    } catch (e) {
      console.error('Slaap opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  if (!client?.id || !open) return null

  const urenNu = Number.isFinite(urenWaarde) ? urenWaarde : 0
  const zetUren = (v) => { setUren(String(Math.max(0, Math.min(16, Math.round(v * 2) / 2)))); setUrenAangeraakt(true) }
  const nlUren = (n) => String(n).replace('.', ',')
  const kwaliteitKleur = (n) => (n >= 7 ? '#10b981' : n >= 5 ? '#f59e0b' : '#ef4444')

  const rondKnop = {
    width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    fontFamily: 'inherit', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const kleinKnop = { ...rondKnop, width: 40, height: 40, borderRadius: 12, fontSize: '1rem' }
  const primair = {
    width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
    fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer',
    opacity: bezig ? 0.6 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const vraag = (tekst) => (
    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 16, letterSpacing: '-0.015em' }}>{tekst}</div>
  )
  // Tijden als slider in stappen van 5 minuten, zoals de gewichtsslider.
  // Bedtijd loopt van 12:00 via middernacht door (avond → nacht zonder
  // sprong); opstaan gewoon van 00:00 tot 23:55.
  const tijdLijst = (vanaf) => Array.from({ length: 288 }, (_, i) => {
    const m = (vanaf + i * 5) % 1440
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  })
  const BEDTIJDEN = tijdLijst(12 * 60)
  const OPSTAATIJDEN = tijdLijst(0)
  const opVijf = (t) => { const [h, m] = String(t || '00:00').split(':').map(Number); const tot = Math.round((h * 60 + m) / 5) * 5 % 1440; return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}` }
  const klok = (waarde, zet, lijst) => (
    <div style={{ marginBottom: 18 }}>
      <HorizontaleSlider waarden={lijst} waarde={opVijf(waarde)} onChange={zet} itemBreedte={84} />
    </div>
  )
  const bewaarGewicht = async (verder) => {
    if (gewichtBezig) return
    if (verder && gewicht) {
      setGewichtBezig(true)
      const r = await new WeightTrackerService(db).saveWeight(client.id, Math.round(gewicht * 10) / 10, logDatum)
      setGewichtBezig(false)
      if (!r?.success) { setFout('Gewicht opslaan mislukt'); return }
      setGewogen(true)
      onGewicht?.({ datum: logDatum, gewicht: Math.round(gewicht * 10) / 10 })
      window.dispatchEvent(new CustomEvent('myarc:gewicht-gelogd'))
    }
    setFout(null)
    if (alleenGewicht) { setOpen(false); return }
    setStap(4)
  }
  const datumTekst = logDatum !== vandaagIso()
    ? new Date(`${logDatum}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  return createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Kop: terug, titel met stap, sluiten */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {stap > 1 && !alleenGewicht
            ? <button onClick={() => setStap(n => n - 1)} aria-label="Vorige stap" style={kleinKnop}><ChevronLeft size={18} strokeWidth={2.8} /></button>
            : <div style={{ width: 40 }} />}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {alleenGewicht ? 'Gewicht loggen' : `Ochtend loggen · stap ${stap} van 5`}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {alleenGewicht
                ? <><Scale size={15} strokeWidth={2.6} /> Je weging</>
                : <><Moon size={15} strokeWidth={2.6} /> Je nacht</>}
              {datumTekst && <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}> · {datumTekst}</span>}
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Sluiten" style={kleinKnop}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {stap === 1 && (
          <>
            {vraag('Hoe laat ging je naar bed?')}
            {klok(bed, setBed, BEDTIJDEN)}
            <button onClick={() => setStap(2)} style={primair}>Volgende</button>
          </>
        )}

        {stap === 2 && (
          <>
            {vraag('Hoe laat stond je op?')}
            {klok(opstaan, setOpstaan, OPSTAATIJDEN)}
            <button onClick={() => setStap(3)} style={primair}>Volgende</button>
          </>
        )}

        {/* Na het opstaan: weeg je even. Zelfde opslag als de gewichtstracker,
            dus het telt ook voor je challenge. */}
        {stap === 3 && (
          <>
            {vraag('Weeg je even?')}
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
              {gewogen ? 'Deze ochtend al gewogen; pas aan als het anders was.' : 'Direct na het opstaan, na het plassen, vóór eten en drinken.'}
            </div>
            <div style={{ marginBottom: 6 }}>
              {gewicht != null ? (
                <HorizontaleSlider
                  waarden={GEWICHTEN}
                  waarde={Math.round(gewicht * 10) / 10}
                  onChange={setGewicht}
                  toon={(v) => v.toFixed(1).replace('.', ',')}
                  itemBreedte={72}
                />
              ) : <div style={{ height: 86 }} />}
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Scale size={12} strokeWidth={2.6} /> kg
            </div>
            {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{fout}</div>}
            <button onClick={() => bewaarGewicht(true)} disabled={gewichtBezig || gewicht == null} style={primair}>
              <Check size={16} strokeWidth={3} /> {gewichtBezig ? 'Opslaan…' : 'Gewicht opslaan'}
            </button>
            <button onClick={() => bewaarGewicht(false)} style={{ ...primair, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', minHeight: 40, marginTop: 4 }}>
              Overslaan
            </button>
          </>
        )}

        {stap === 4 && (
          <>
            {vraag('Hoeveel uur heb je echt geslapen?')}
            <div style={{ marginBottom: 4 }}>
              <HorizontaleSlider
                waarden={Array.from({ length: 33 }, (_, i) => i / 2)}
                waarde={Math.round(urenNu * 2) / 2}
                onChange={zetUren}
                toon={(v) => `${nlUren(v)}u`}
                itemBreedte={72}
              />
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 18, lineHeight: 1.4 }}>
              {berekend != null ? `Tussen ${bed} en ${opstaan} zit ${nlUren(berekend)} uur. Lag je wakker, haal het eraf.` : 'Pas aan als je wakker lag.'}
            </div>
            <button onClick={() => setStap(5)} style={primair}>Volgende</button>
          </>
        )}

        {stap === 5 && (
          <>
            {vraag('Hoe voelde je nacht?')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const aan = kwaliteit === n
                return (
                  <button key={n} onClick={() => { setKwaliteit(aan ? null : n); if (navigator.vibrate) navigator.vibrate(10) }} style={{
                    minHeight: 48, borderRadius: 12, padding: 0,
                    background: aan ? kwaliteitKleur(n) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${aan ? kwaliteitKleur(n) : 'rgba(255,255,255,0.12)'}`,
                    color: aan ? '#0a0a0a' : '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit',
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{n}</button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
              <span>slecht</span><span>top</span>
            </div>
            <textarea
              value={struggles}
              onChange={e => setStruggles(e.target.value)}
              placeholder="Wat ging er mis of juist goed? (mag leeg)"
              rows={2}
              style={{ ...veld, minHeight: 60, padding: '0.6rem 0.75rem', fontSize: '0.85rem', fontWeight: 600, resize: 'none', marginBottom: 14 }}
            />
            {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10 }}>{fout}</div>}
            <button onClick={bewaar} disabled={bezig} style={primair}>
              <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : alGelogd ? 'Bijwerken' : 'Opslaan'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
              <button onClick={() => { setToonEerdere(v => !v); setToonTips(false) }} style={linkKnop}>
                {toonEerdere ? 'Verberg nachten' : 'Eerdere nachten'}
              </button>
              <button onClick={() => { setToonTips(v => !v); setToonEerdere(false) }} style={linkKnop}>
                <Lightbulb size={12} strokeWidth={2.8} /> Beter slapen
              </button>
            </div>

            {toonTips && (
              <ul style={{ margin: '10px 0 0', padding: '0 0 0 1rem', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {TIPS.map(t => <li key={t} style={{ marginBottom: 3 }}>{t}</li>)}
              </ul>
            )}

            {toonEerdere && (
              <div style={{ marginTop: 10 }}>
                {eerdere.length === 0 ? (
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '0.5rem 0' }}>Nog geen nachten gelogd.</div>
                ) : eerdere.map(n => (
                  <div key={n.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '0.45rem 0', borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.74rem', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums',
                  }}>
                    <span style={{ width: 62, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                      {new Date(`${n.log_date}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ width: 52 }}>{n.hours_slept != null ? `${nlUren(n.hours_slept)} u` : '—'}</span>
                    <span style={{ flex: 1, minWidth: 0, color: 'rgba(255,255,255,0.35)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.bedtime ? `${String(n.bedtime).slice(0, 5)} → ${String(n.wake_time || '').slice(0, 5)}` : ''}{n.struggles ? ` · ${n.struggles}` : ''}
                    </span>
                    {n.quality != null && <span style={{ flexShrink: 0, fontWeight: 900, color: kwaliteitKleur(n.quality) }}>{n.quality}</span>}
                    <button onClick={() => verwijder(n.id)} aria-label="Verwijderen" style={{
                      width: 26, height: 26, flexShrink: 0, padding: 0, borderRadius: 7, background: 'transparent', border: 'none',
                      color: 'rgba(239,68,68,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

// Zwevende knop links op de trackingpagina. Groen als je vannacht al logde.
export default function SlaapKnop({ client, db, isMobile = false, onderMarge = 96, onOpgeslagen }) {
  const [open, setOpen] = useState(false)
  const [alGelogd, setAlGelogd] = useState(false)
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase.from('sleep_logs').select('id').eq('client_id', client.id).eq('log_date', vandaagIso()).maybeSingle()
      .then(({ data }) => { if (!weg) setAlGelogd(!!data) }, () => {})
    return () => { weg = true }
  }, [db, client?.id])

  if (!client?.id) return null
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Slaap loggen"
        aria-label="Slaap loggen"
        style={{
          position: 'fixed',
          left: isMobile ? 10 : 16,
          bottom: `calc(${onderMarge}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 95,
          width: 48, height: 48, padding: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${alGelogd ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.14)'}`,
          color: alGelogd ? '#10b981' : '#fff',
          cursor: 'pointer',
          boxShadow: '0 10px 28px rgba(0,0,0,0.55)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Moon size={20} strokeWidth={2.4} />
      </button>
      <SlaapLogBlad
        open={open} onClose={() => setOpen(false)} client={client} db={db}
        onStatus={setAlGelogd} onOpgeslagen={onOpgeslagen}
      />
    </>
  )
}
