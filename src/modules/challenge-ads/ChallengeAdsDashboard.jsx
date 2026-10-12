// src/modules/challenge-ads/ChallengeAdsDashboard.jsx
//
// Coachscherm "Ads": wat de Meta-advertenties voor de 6 Weken Challenge
// opleveren, per hook (utm_content). Bron: challenge_events (gemeten op de
// pagina) en call_leads (aanmeldingen en geplande calls), via de
// database-functie get_challenge_ad_stats.
//
// Opgezet zodat je in tien seconden snapt hoe het gaat (Kersten, 12 okt 2026:
// "een kind van 10 moet het begrijpen"):
//   1. Eén cijfer: calls per 100 bezoekers, met een stempel goed/matig/slecht.
//   2. De trechter: per stap hoeveel er doorgaan, tegen een richtwaarde.
//   3. Wat je kunt verbeteren: de zwakste stappen, met een concrete tip.
//   4. Welke advertentie werkt: hooks samengevoegd en gerangschikt.
//
// De richtwaarden zijn vuistregels voor koud verkeer uit Meta naar een
// aanmeldpagina met formulier, geen wet. Ze staan bovenaan in RICHT.
//
// CTR en kosten staan hier niet: die zitten in Meta Ads Manager.

import { useEffect, useState } from 'react'
import { RefreshCw, Copy, Check, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'

const PERIODES = [
  { id: '7', label: '7 dagen', dagen: 7 },
  { id: '14', label: '14 dagen', dagen: 14 },
  { id: '30', label: '30 dagen', dagen: 30 },
  { id: '90', label: '90 dagen', dagen: 90 },
]

const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'
const GRIJS = 'rgba(255,255,255,0.4)'

// Onder dit aantal mensen bij de stap ervoor zeggen percentages niets.
const MIN_BASIS = 10
// Een hook beoordelen we pas vanaf zoveel bezoekers.
const MIN_HOOK = 20

// Richtwaarden per stap: `goed` en `matig` als fractie van de stap ervoor.
const RICHT = {
  video: {
    goed: 0.30, matig: 0.15, goedTekst: '3 op de 10',
    tipKop: 'Laat meer mensen je video starten',
    tip: 'Zet de video bovenaan, groot, met een thumbnail met jouw gezicht en één pakkende zin erop. Een video die je pas na scrollen ziet, start bijna niemand.',
  },
  fstart: {
    goed: 0.15, matig: 0.08, goedTekst: '15 van de 100',
    tipKop: 'Laat meer mensen aan het formulier beginnen',
    tip: 'Zet de knop direct onder de video én bovenaan, en zeg op de knop wat ze krijgen ("Check of je mee kunt doen"). Sluit aan op de belofte uit de advertentie, anders voelen ze zich op de verkeerde plek.',
  },
  fklaar: {
    goed: 0.60, matig: 0.40, goedTekst: '6 op de 10',
    tipKop: 'Laat meer mensen het formulier afmaken',
    tip: 'Haal vragen weg die je niet echt nodig hebt, zet de makkelijkste vragen eerst en laat zien hoe ver ze zijn. Elke extra vraag kost mensen.',
  },
  geschikt: {
    goed: 0.60, matig: 0.40, goedTekst: '6 op de 10',
    tipKop: 'Trek de juiste mensen aan',
    tip: 'Veel invullers zijn (nog) niet geschikt. Zeg in de advertentie zelf duidelijker voor wie het is: leeftijd, doel, en dat het een betaald traject is.',
  },
  call: {
    goed: 0.50, matig: 0.30, goedTekst: 'de helft',
    tipKop: 'Zorg dat geschikte mensen ook een call plannen',
    tip: 'Laat de agenda direct na het formulier zien, en stuur geschikte mensen die niet plannen binnen een uur een appje. Daar laat je nu calls liggen.',
  },
  totaal: { goed: 0.03, matig: 0.01, goedTekst: '3 calls per 100 bezoekers' },
}

const OORDELEN = {
  goed: { id: 'goed', tekst: 'Goed', kleur: GROEN },
  matig: { id: 'matig', tekst: 'Kan beter', kleur: ORANJE },
  slecht: { id: 'slecht', tekst: 'Slecht', kleur: ROOD },
  weinig: { id: 'weinig', tekst: 'Te weinig data', kleur: GRIJS },
}

const oordeelVan = (deel, basis, richt) => {
  if (deel == null || !basis || basis < MIN_BASIS || !richt) return OORDELEN.weinig
  if (deel >= richt.goed) return OORDELEN.goed
  if (deel >= richt.matig) return OORDELEN.matig
  return OORDELEN.slecht
}

// "13 van de 100 mensen" of "2 van de 4" — bij weinig mensen geen procenten,
// want "50%" van twee mensen klinkt groter dan het is.
const zin = (st) => {
  if (st.basis >= 20) return `${Math.round(st.deel * 100)} van de 100 doen dit`
  return `${st.aantal} van de ${st.basis} doen dit`
}

const fmtTijd = (s) => {
  const n = Math.round(Number(s) || 0)
  if (n < 60) return `${n}s`
  return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`
}
const komma = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',')

// utm_content komt soms nog gecodeerd binnen ('strakker%2C+maar+uiteten'),
// soms als placeholder ('{{ad.name}}') of door Meta weggepoetst
// ('--sanitized--'). Netjes maken en samenvoegen, anders staat dezelfde
// advertentie er drie keer in.
const schoon = (naam) => {
  let v = String(naam || '')
  try { v = decodeURIComponent(v.replace(/\+/g, ' ')) } catch { v = v.replace(/\+/g, ' ') }
  v = v.trim()
  if (!v || v === '(geen)' || /^\{\{.*\}\}$/.test(v) || /sanitized/i.test(v)) return null
  return v
}

function groepeerHooks(rijen) {
  const map = new Map()
  for (const r of rijen) {
    const naam = schoon(r.hook)
    const sleutel = naam ? naam.toLowerCase() : '__onbekend'
    const g = map.get(sleutel) || {
      naam: naam || 'Onbekend (geen advertentienaam)', onbekend: !naam,
      sessies: 0, tijdSom: 0, form_klaar: 0, geschikt: 0, calls: 0,
    }
    const ses = Number(r.sessies) || 0
    g.sessies += ses
    g.tijdSom += (Number(r.tijd_gem) || 0) * ses
    g.form_klaar += Number(r.form_klaar) || 0
    g.geschikt += Number(r.geschikt) || 0
    g.calls += Number(r.calls_gepland) || 0
    map.set(sleutel, g)
  }
  return [...map.values()]
    .map(g => ({ ...g, tijd: g.sessies ? g.tijdSom / g.sessies : 0 }))
    .sort((a, b) => (a.onbekend - b.onbekend)
      || (b.calls - a.calls)
      || (b.geschikt - a.geschikt)
      || ((b.form_klaar / Math.max(1, b.sessies)) - (a.form_klaar / Math.max(1, a.sessies)))
      || (b.sessies - a.sessies))
}

// Per advertentie: levert hij calls of in elk geval formulieren op?
const hookOordeel = (h) => {
  if (h.onbekend) return { id: 'weinig', tekst: 'Niet te koppelen', kleur: GRIJS }
  if (h.calls > 0) return { id: 'goed', tekst: 'Winnaar', kleur: GROEN }
  if (h.sessies < MIN_HOOK) return OORDELEN.weinig
  const f = h.form_klaar / h.sessies
  if (f >= 0.05) return { id: 'matig', tekst: 'Belooft wat', kleur: ORANJE }
  return { id: 'slecht', tekst: 'Werkt niet', kleur: ROOD }
}

const LINK_VOORBEELD = 'https://www.myarcfitness.com/challenge?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}'

const pil = (aan) => ({
  padding: '0.45rem 0.8rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  background: aan ? '#fff' : 'rgba(255,255,255,0.06)', color: aan ? '#000' : 'rgba(255,255,255,0.75)',
  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
})

function Stempel({ oordeel, klein }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      fontSize: klein ? '0.7rem' : '0.8rem', fontWeight: 900, color: oordeel.kleur, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: klein ? 7 : 9, height: klein ? 7 : 9, borderRadius: '50%', background: oordeel.kleur }} />
      {oordeel.tekst}
    </span>
  )
}

function Kop({ children }) {
  return <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>{children}</div>
}

function Getal({ label, waarde, dik }) {
  return (
    <div style={{ minWidth: 44 }}>
      <div style={{ fontSize: dik ? '1.2rem' : '1.05rem', fontWeight: 900, color: dik && waarde > 0 ? GROEN : '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{waarde}</div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  )
}

export default function ChallengeAdsDashboard({ db, isMobile }) {
  const m = isMobile
  // Gekozen periode onthouden, ook 'vanaf' (Kersten, 12 okt 2026).
  const [periode, setPeriodeState] = useState(() => {
    try {
      const p = localStorage.getItem('arc_ads_periode')
      if (p === 'vanaf') return localStorage.getItem('arc_ads_vanaf') ? 'vanaf' : '14'
      return PERIODES.some(x => x.id === p) ? p : '14'
    } catch { return '14' }
  })
  const setPeriode = (p) => {
    setPeriodeState(p)
    try { localStorage.setItem('arc_ads_periode', p) } catch { /* geen opslag */ }
  }
  // Eigen startdatum ('vanaf'): bijv. de dag dat een nieuwe campagne live ging.
  const [vanafDatum, setVanafDatum] = useState(() => {
    try { return localStorage.getItem('arc_ads_vanaf') || '' } catch { return '' }
  })
  const kiesVanaf = (iso) => {
    setVanafDatum(iso)
    try { if (iso) localStorage.setItem('arc_ads_vanaf', iso); else localStorage.removeItem('arc_ads_vanaf') } catch { /* geen opslag */ }
    setPeriode(iso ? 'vanaf' : '14')
  }
  const [rijen, setRijen] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)
  const [toonDetails, setToonDetails] = useState(false)

  const laad = async () => {
    setLaden(true); setFout('')
    try {
      const dagen = PERIODES.find(p => p.id === periode)?.dagen || 14
      const tot = new Date(); tot.setHours(23, 59, 59, 999)
      const van = (periode === 'vanaf' && vanafDatum)
        ? new Date(`${vanafDatum}T00:00:00`)
        : (() => { const d = new Date(); d.setDate(d.getDate() - dagen + 1); d.setHours(0, 0, 0, 0); return d })()
      const { data, error } = await db.supabase.rpc('get_challenge_ad_stats', { p_van: van.toISOString(), p_tot: new Date(tot.getTime() + 1).toISOString() })
      if (error) throw error
      setRijen(data || [])
    } catch (e) {
      console.error('ads-stats laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally { setLaden(false) }
  }
  useEffect(() => { laad() }, [periode, vanafDatum]) // eslint-disable-line react-hooks/exhaustive-deps

  const som = (k) => rijen.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  const totaal = {
    sessies: som('sessies'),
    video_start: som('video_start'),
    form_start: som('form_start'), form_klaar: som('form_klaar'),
    geschikt: som('geschikt'), calls: som('calls_gepland'),
  }

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(LINK_VOORBEELD); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000) } catch { /* leeg */ }
  }

  // ── De trechter: elke stap tegen de stap waar hij uit komt ──
  const ruweStappen = [
    { id: 'mensen', label: 'Op je pagina', aantal: totaal.sessies, uitleg: 'mensen klikten op je advertentie' },
    { id: 'video', label: 'Video gestart', aantal: totaal.video_start, van: 'mensen', ...RICHT.video },
    { id: 'fstart', label: 'Formulier begonnen', aantal: totaal.form_start, van: 'mensen', ...RICHT.fstart },
    { id: 'fklaar', label: 'Formulier af', aantal: totaal.form_klaar, van: 'fstart', ...RICHT.fklaar },
    { id: 'geschikt', label: 'Geschikt', aantal: totaal.geschikt, van: 'fklaar', ...RICHT.geschikt },
    { id: 'call', label: 'Call gepland', aantal: totaal.calls, van: 'geschikt', ...RICHT.call },
  ]
  const stappen = ruweStappen.map(st => {
    const basis = st.van ? ruweStappen.find(x => x.id === st.van).aantal : null
    const deel = basis ? st.aantal / basis : null
    return { ...st, basis, deel, oordeel: oordeelVan(deel, basis, st) }
  })
  const perHonderd = totaal.sessies > 0 ? (totaal.calls / totaal.sessies) * 100 : null
  const totaalOordeel = oordeelVan(perHonderd != null ? perHonderd / 100 : null, totaal.sessies, RICHT.totaal)

  // Waar lekt het het meest? Stappen met genoeg data, verst onder de
  // richtwaarde eerst.
  const verbeterpunten = stappen
    .filter(st => st.tip && st.oordeel.id !== 'weinig' && st.oordeel.id !== 'goed')
    .sort((x, y) => (x.deel / x.goed) - (y.deel / y.goed))
    .slice(0, 3)

  const hooks = groepeerHooks(rijen)

  const kolommen = [
    { k: 'hook', label: 'Hook (utm_content)', links: true },
    { k: 'campagne', label: 'Campagne', links: true },
    { k: 'sessies', label: 'Bezoekers' },
    { k: 'tijd_gem', label: 'Tijd', f: fmtTijd },
    { k: 'video_start', label: 'Video' },
    { k: 'form_start', label: 'Form begonnen' },
    { k: 'form_klaar', label: 'Form af' },
    { k: 'geschikt', label: 'Geschikt' },
    { k: 'ongeschikt_tot', label: 'Ongeschikt', f: (v, r) => (Number(r.nog_niet) || 0) + (Number(r.ongeschikt) || 0) },
    { k: 'calls_gepland', label: 'Calls' },
  ]

  return (
    <div style={{ padding: m ? '1rem' : '1.5rem 2rem', color: '#fff', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Ads · 6 Weken Challenge</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Vanaf de klik op de advertentie. Kosten en CTR staan in Meta Ads Manager.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {PERIODES.map(p => (
            <button key={p.id} onClick={() => setPeriode(p.id)} style={pil(periode === p.id)}>{p.label}</button>
          ))}
          {/* Vanaf een eigen datum t/m vandaag. */}
          <label title="Vanaf een datum" style={{ ...pil(periode === 'vanaf'), position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} strokeWidth={2.6} />
            {vanafDatum
              ? `Vanaf ${new Date(`${vanafDatum}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
              : 'Vanaf…'}
            <input
              type="date"
              value={vanafDatum}
              max={new Date().toLocaleDateString('sv-SE')}
              onChange={e => kiesVanaf(e.target.value)}
              onClick={e => { if (vanafDatum && periode !== 'vanaf') { e.preventDefault(); setPeriode('vanaf') } else { try { e.currentTarget.showPicker?.() } catch { /* oudere browser */ } } }}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
          </label>
          <button onClick={laad} aria-label="Verversen" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ animation: laden ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {fout && <div style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>{fout}</div>}

      {/* ═══ HET RAPPORT: één cijfer en één zin ═══ */}
      <div style={{ paddingBottom: '1.4rem', marginBottom: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: m ? '2.8rem' : '3.6rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: totaalOordeel.kleur === GRIJS ? '#fff' : totaalOordeel.kleur, fontVariantNumeric: 'tabular-nums' }}>
            {perHonderd != null ? komma(perHonderd) : '–'}
          </span>
          <span style={{ fontSize: m ? '0.95rem' : '1.1rem', fontWeight: 900 }}>calls per 100 bezoekers</span>
          <Stempel oordeel={totaalOordeel} />
        </div>
        <div style={{ fontSize: m ? '0.9rem' : '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 1.5, maxWidth: 720 }}>
          {totaal.sessies > 0
            ? <>Van de <b style={{ color: '#fff' }}>{totaal.sessies}</b> mensen die op je advertentie klikten, vulden er <b style={{ color: '#fff' }}>{totaal.form_klaar}</b> het formulier helemaal in en {totaal.calls === 1 ? 'plande' : 'planden'} er <b style={{ color: '#fff' }}>{totaal.calls}</b> een call. Goed is {RICHT.totaal.goedTekst}.</>
            : (laden ? 'Laden…' : 'Nog geen bezoekers in deze periode.')}
        </div>
      </div>

      {/* ═══ DE TRECHTER ═══ */}
      <Kop>Waar haken mensen af?</Kop>
      <div style={{ marginBottom: '1.6rem' }}>
        {stappen.map((st, i) => {
          const breedte = totaal.sessies > 0 ? Math.max(1.5, (st.aantal / totaal.sessies) * 100) : 0
          return (
            <div key={st.id} style={{ padding: '0.7rem 0', borderBottom: i < stappen.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: m ? '1.25rem' : '1.4rem', fontWeight: 900, minWidth: m ? 44 : 56, fontVariantNumeric: 'tabular-nums' }}>{st.aantal}</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, flex: 1, minWidth: 0 }}>{st.label}</span>
                {st.basis != null && <Stempel oordeel={st.oordeel} klein />}
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', margin: '6px 0 5px', overflow: 'hidden' }}>
                <div style={{ width: `${breedte}%`, height: '100%', borderRadius: 999, background: st.basis != null ? st.oordeel.kleur : '#fff', transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>
                {st.basis == null
                  ? st.uitleg
                  : !st.basis
                    ? 'nog niemand bij de stap ervoor'
                    : <>{zin(st)} · <span style={{ color: 'rgba(255,255,255,0.4)' }}>goed is {st.goedTekst}</span></>}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ WAT KUN JE VERBETEREN ═══ */}
      {verbeterpunten.length > 0 && (
        <>
          <Kop>Wat kun je verbeteren?</Kop>
          <div style={{ marginBottom: '1.8rem' }}>
            {verbeterpunten.map((st, i) => (
              <div key={st.id} style={{ display: 'flex', gap: 12, padding: '0.65rem 0', borderBottom: i < verbeterpunten.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: st.oordeel.kleur, minWidth: 18 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900 }}>{st.tipKop}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 2 }}>{st.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ HOOKS: welke advertentie wint? ═══ */}
      <Kop>Welke advertentie werkt?</Kop>
      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
        Beste bovenaan. Pas vanaf {MIN_HOOK} bezoekers zegt een advertentie echt iets.
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        {!laden && hooks.length === 0 && (
          <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Nog geen bezoeken in deze periode.</div>
        )}
        {hooks.map((h, i) => {
          const o = hookOordeel(h)
          const formPer100 = h.sessies > 0 ? Math.round((h.form_klaar / h.sessies) * 100) : 0
          return (
            <div key={h.naam} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 0', borderBottom: i < hooks.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: h.onbekend ? 0.55 : 1 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: m ? 190 : 360 }}>{h.naam}</span>
                  <Stempel oordeel={o} klein />
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                  {h.sessies} bezoekers · {fmtTijd(h.tijd)} op pagina{h.sessies > 0 ? ` · ${formPer100} van de 100 vult in` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: m ? 12 : 22, flexShrink: 0, textAlign: 'right' }}>
                <Getal label="formulier" waarde={h.form_klaar} />
                {!m && <Getal label="geschikt" waarde={h.geschikt} />}
                <Getal label="calls" waarde={h.calls} dik />
              </div>
            </div>
          )
        })}
      </div>

      {/* Alle ruwe regels, voor wie het precies wil zien. */}
      <button onClick={() => setToonDetails(v => !v)} style={{ background: 'none', border: 'none', padding: '0.4rem 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
        {toonDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Alle cijfers per regel
      </button>
      {toonDetails && (
        <div style={{ overflowX: 'auto', marginTop: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: m ? '0.76rem' : '0.82rem', minWidth: 760 }}>
            <thead>
              <tr>
                {kolommen.map(c => (
                  <th key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.5rem 0.6rem', fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rijen.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {kolommen.map(c => {
                    const ruw = c.f ? c.f(r[c.k], r) : r[c.k]
                    return (
                      <td key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.5rem 0.6rem', fontWeight: c.links ? 800 : 700, color: c.links ? '#fff' : 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', maxWidth: c.links ? 220 : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ruw ?? '–'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link-conventie */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 6 }}>Link voor in de advertentie</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <code style={{ flex: 1, fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{LINK_VOORBEELD}</code>
          <button onClick={kopieer} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.7rem', borderRadius: 10, background: gekopieerd ? 'rgba(16,185,129,0.15)' : '#fff', color: gekopieerd ? GROEN : '#000', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {gekopieerd ? <Check size={14} /> : <Copy size={14} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.45 }}>
          Meta vult {'{{campaign.name}}'} en {'{{ad.name}}'} zelf in. Geef elke hook een eigen advertentienaam, dan staat hij hier als aparte regel.
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
