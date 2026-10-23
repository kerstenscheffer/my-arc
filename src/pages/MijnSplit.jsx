// src/pages/MijnSplit.jsx
// Lead magnet /mijn-split: vier vragen (dagen, waar, doel, ervaring), daarna
// naam + e-mail, en dan de split uit de MY ARC-bibliotheek op de pagina met
// een PDF om te downloaden. Geen mail: de lead komt op het bord in de kolom
// "🧲 Mijn split" (RPC submit_mijn_split), de split staat meteen in beeld.
//
// Zelfde opbouw als de calorie-calculator: één vraag per scherm, zwart met
// goud voor voortgang en keuzes, de uitkomst als wit papieren vel.
import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import db from '../services/DatabaseService'
import { herkomst } from './challengeTracking'
import { SPLITS, DAG_NAAM, WEEK, DOELEN, NIVEAUS, LOCATIES, tips } from './mijn-split/splitRegels'
import { downloadSplitPdf } from './mijn-split/splitPdf'

const GOLD = '#FFD700'
const PAPIER = '#faf9f5'
const INKT = '#111'
const LIJN = 'rgba(0,0,0,0.1)'
const isMobileNow = () => typeof window !== 'undefined' && window.innerWidth <= 768
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim())

const STAPPEN = ['dagen', 'locatie', 'doel', 'niveau', 'gegevens']
const TOTAAL = STAPPEN.length
const DAGEN_KEUZE = [
  { key: 2, label: '2 dagen', sub: 'Druk leven, toch resultaat' },
  { key: 3, label: '3 dagen', sub: 'De sweet spot voor de meesten' },
  { key: 4, label: '4 dagen', sub: 'Meer volume, kortere trainingen' },
  { key: 5, label: '5 dagen', sub: 'Serieus bezig' },
  { key: 6, label: '6 dagen', sub: 'Alles erop gericht' },
]

export default function MijnSplit() {
  const isMobile = isMobileNow()
  const [stap, setStap] = useState(-1)   // -1 = start, TOTAAL = resultaat
  const [antw, setAntw] = useState({ dagen: null, locatie: null, doel: null, niveau: null, voornaam: '', email: '' })
  const [dagen, setDagen] = useState(null)   // { code: { focus, oefeningen } }
  const [bezig, setBezig] = useState(false)
  const [pdfBezig, setPdfBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef(null)
  const doorTimer = useRef(null)

  useEffect(() => { utm.current = herkomst() }, [])
  useEffect(() => () => clearTimeout(doorTimer.current), [])
  useEffect(() => { window.scrollTo?.(0, 0) }, [stap])

  // De dagen van de gekozen locatie alvast ophalen, zodat het resultaat er
  // direct staat na het opslaan.
  useEffect(() => {
    if (!antw.locatie) return
    let weg = false
    db.supabase.rpc('get_mijn_split_dagen', { p_locatie: antw.locatie }).then(({ data, error }) => {
      if (weg || error || !Array.isArray(data)) return
      setDagen(Object.fromEntries(data.map(d => [d.code, d])))
    }, () => null)
    return () => { weg = true }
  }, [antw.locatie])

  const split = antw.dagen ? SPLITS[antw.dagen] : null
  const huidig = STAPPEN[stap]
  const gegevensOk = antw.voornaam.trim().length > 0 && emailOk(antw.email)

  const kies = (veld, waarde) => {
    setAntw(a => ({ ...a, [veld]: waarde }))
    clearTimeout(doorTimer.current)
    doorTimer.current = setTimeout(() => setStap(s => s + 1), 220)
  }

  const verstuur = async () => {
    if (!gegevensOk || bezig) return
    setBezig(true); setFout('')
    try {
      const doelLabel = DOELEN.find(d => d.key === antw.doel)?.label
      const niveauLabel = NIVEAUS.find(n => n.key === antw.niveau)?.label
      const locLabel = LOCATIES.find(l => l.key === antw.locatie)?.label
      const u = utm.current || {}
      const { error } = await db.supabase.rpc('submit_mijn_split', { p: {
        voornaam: antw.voornaam.trim(),
        email: antw.email.trim(),
        doel: doelLabel,
        samenvatting: `Mijn split: ${split.naam} (${antw.dagen} dagen, ${locLabel?.toLowerCase()}). Doel: ${doelLabel}. Traint: ${niveauLabel?.toLowerCase()}.`,
        antwoorden: [
          { vraag: 'Dagen per week', antwoord: String(antw.dagen) },
          { vraag: 'Waar', antwoord: locLabel },
          { vraag: 'Doel', antwoord: doelLabel },
          { vraag: 'Traint al', antwoord: niveauLabel },
          { vraag: 'Split', antwoord: split.naam },
        ],
        utm_source: u.utm_source, utm_medium: u.utm_medium, utm_campaign: u.utm_campaign,
        utm_content: u.utm_content, referrer: u.referrer,
      } })
      if (error) throw error
      setStap(TOTAAL)
    } catch (e) {
      console.error('mijn-split opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Controleer je e-mail en probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const download = async () => {
    if (pdfBezig || !dagen) return
    setPdfBezig(true)
    try {
      await downloadSplitPdf({ voornaam: antw.voornaam.trim(), split, locatie: antw.locatie, dagen, tips: tips(antw), doel: antw.doel })
    } catch (e) {
      console.error('PDF mislukt:', e)
      setFout('Downloaden lukte niet. Maak anders even een screenshot.')
    } finally { setPdfBezig(false) }
  }

  const wrap = {
    minHeight: '100vh', background: '#000', color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: isMobile ? '1.5rem 1rem 3rem' : '2.5rem 1rem 4rem',
  }
  const Logo = ({ vol }) => (
    <img src="/ma-logo-header.png" alt="MY ARC" style={{
      display: 'block', margin: '0 auto', height: 'auto', opacity: vol ? 1 : 0.6,
      width: vol ? (isMobile ? 104 : 132) : (isMobile ? 88 : 110),
    }} />
  )

  // ── Startscherm ──────────────────────────────────────────────────────────
  if (stap < 0) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Logo vol />
          <h1 style={{
            margin: isMobile ? '2rem 0 1.8rem' : '2.5rem 0 2rem', textAlign: 'center', color: '#fff',
            fontWeight: 900, fontSize: isMobile ? '2.1rem' : '2.6rem', lineHeight: 1.1, letterSpacing: '-0.03em',
          }}>
            Jouw trainingssplit<br />in {TOTAAL - 1} vragen
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18, marginBottom: isMobile ? '1.8rem' : '2rem' }}>
            <img src="/kersten-rond.jpg" alt="Kersten" style={{
              flexShrink: 0, width: isMobile ? 96 : 118, height: isMobile ? 96 : 118,
              borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 38%',
              border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
            }} />
            <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: isMobile ? '0.88rem' : '0.95rem', lineHeight: 1.5, fontWeight: 600, color: '#fff' }}>
              Dit zijn de splits waar mijn klanten mee trainen. Vertel hoe vaak en waar je
              traint, dan krijg je de split die bij jou past, met alle oefeningen, sets en reps.
            </p>
          </div>

          <Voorbeeld isMobile={isMobile} />

          <button onClick={() => setStap(0)} style={{
            width: '100%', marginTop: '1.5rem', padding: '1.1rem', borderRadius: 14, border: 'none',
            background: '#fff', color: '#000', fontSize: '1.05rem', fontWeight: 900, cursor: 'pointer',
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Start: {TOTAAL - 1} vragen
          </button>
        </div>
      </div>
    )
  }

  // ── Resultaat ────────────────────────────────────────────────────────────
  if (stap >= TOTAAL) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Logo />
          <h1 style={{
            margin: isMobile ? '1.5rem 0 0.4rem' : '2rem 0 0.4rem', textAlign: 'center', color: '#fff',
            fontWeight: 900, fontSize: isMobile ? '1.7rem' : '2rem', lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            {antw.voornaam.trim()}, dit is jouw split
          </h1>
          <p style={{ margin: '0 0 1.2rem', textAlign: 'center', fontSize: '0.92rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
            Download hem als PDF, dan heb je hem in de gym bij de hand.
          </p>

          <button onClick={download} disabled={!dagen || pdfBezig} style={{
            width: '100%', padding: '1.1rem', borderRadius: 14, border: 'none',
            background: dagen ? GOLD : 'rgba(255,255,255,0.07)', color: dagen ? '#000' : 'rgba(255,255,255,0.3)',
            fontSize: '1.05rem', fontWeight: 900, cursor: dagen ? 'pointer' : 'default', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: dagen ? '0 6px 18px rgba(255,215,0,0.22)' : 'none',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            {pdfBezig ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
            Download als PDF
          </button>
          {fout && <div style={{ marginTop: 10, fontSize: '0.88rem', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{fout}</div>}

          <div style={{ height: '1.2rem' }} />
          <SplitVel split={split} dagen={dagen} locatie={antw.locatie} isMobile={isMobile} />

          <div style={{ marginTop: '1.2rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', marginBottom: 10 }}>Zo voer je hem uit</div>
            {tips(antw).map(t => (
              <div key={t} style={{
                padding: '0.75rem 0.9rem', borderRadius: 12, marginBottom: '0.6rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontWeight: 500,
              }}>{t}</div>
            ))}
          </div>

          <button onClick={() => setStap(0)} style={{
            width: '100%', marginTop: '1rem', padding: '0.9rem', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ← Antwoorden aanpassen
          </button>
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    )
  }

  // ── Vraagschermen ────────────────────────────────────────────────────────
  const Opties = ({ veld, lijst }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lijst.map(o => {
        const aan = antw[veld] === o.key
        return (
          <button key={o.key} onClick={() => kies(veld, o.key)} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56,
            padding: '0.9rem 1rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
            background: aan ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${aan ? GOLD + '66' : 'rgba(255,255,255,0.1)'}`, fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${aan ? GOLD : 'rgba(255,255,255,0.25)'}`, background: aan ? GOLD : 'transparent',
            }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{o.label}</span>
              <span style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{o.sub}</span>
            </span>
          </button>
        )
      })}
    </div>
  )

  const veld = {
    width: '100%', boxSizing: 'border-box', padding: '1rem', borderRadius: 14,
    background: 'rgba(255,255,255,0.05)', border: `2px solid ${GOLD}44`, color: '#fff',
    fontSize: '1.05rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
  }

  const vragen = {
    dagen: { titel: 'Hoeveel dagen per week kun je trainen?', hint: 'Kies wat je echt volhoudt, ook in een drukke week.',
             body: <Opties veld="dagen" lijst={DAGEN_KEUZE} /> },
    locatie: { titel: 'Waar train je?', hint: 'Dan krijg je oefeningen die je daar ook echt kunt doen.',
               body: <Opties veld="locatie" lijst={LOCATIES} /> },
    doel: { titel: 'Wat is je doel?', hint: 'Dit bepaalt hoe je de split uitvoert.',
            body: <Opties veld="doel" lijst={DOELEN} /> },
    niveau: { titel: 'Hoe lang train je al?', hint: 'Eerlijk is het snelst.',
              body: <Opties veld="niveau" lijst={NIVEAUS} /> },
    gegevens: { titel: 'Waar mag je split heen?', hint: 'Je ziet hem direct hierna en kunt hem downloaden als PDF.',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={antw.voornaam} onChange={e => setAntw(a => ({ ...a, voornaam: e.target.value }))}
            placeholder="Voornaam *" autoComplete="given-name" style={veld} />
          <input value={antw.email} onChange={e => setAntw(a => ({ ...a, email: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && verstuur()}
            placeholder="E-mail *" type="email" inputMode="email" autoComplete="email" style={veld} />
          {fout && <div style={{ fontSize: '0.88rem', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>{fout}</div>}
        </div>
      ) },
  }

  const v = vragen[huidig]
  const nog = TOTAAL - stap - 1
  const isGegevens = huidig === 'gegevens'
  const knopAan = isGegevens ? gegevensOk && !bezig : antw[huidig] != null

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Logo />
        <div style={{ margin: isMobile ? '1.5rem 0 0.5rem' : '2rem 0 0.5rem' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {STAPPEN.map((naam, i) => (
              <div key={naam} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stap ? GOLD : 'rgba(255,255,255,0.12)', transition: 'background 0.2s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
              {isGegevens ? 'Laatste stap' : `Vraag ${stap + 1} van ${TOTAAL - 1}`}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
              {isGegevens ? '' : nog === 1 ? 'Laatste vraag' : `Nog ${nog - 1} te gaan`}
            </span>
          </div>
        </div>

        <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
          <h2 style={{ margin: 0, textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: isMobile ? '1.7rem' : '2rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {v.titel}
          </h2>
          <p style={{ margin: '0.7rem 0 1.6rem', textAlign: 'center', fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.65)' }}>
            {v.hint}
          </p>
          {v.body}
        </div>

        {/* Keuzevragen gaan vanzelf door; de knop is er voor wie terugkwam. */}
        <button onClick={isGegevens ? verstuur : () => knopAan && setStap(stap + 1)} disabled={!knopAan} style={{
          width: '100%', marginTop: '1.8rem', padding: '1.1rem', borderRadius: 14, border: 'none',
          background: knopAan ? GOLD : 'rgba(255,255,255,0.07)', color: knopAan ? '#000' : 'rgba(255,255,255,0.3)',
          fontSize: '1.05rem', fontWeight: 900, cursor: knopAan ? 'pointer' : 'default', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {isGegevens ? (bezig ? 'Even geduld…' : 'Laat mijn split zien') : 'Volgende'}
        </button>

        <button onClick={() => setStap(stap - 1)} style={{
          display: 'block', margin: '1rem auto 0', background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ← Terug
        </button>
      </div>
    </div>
  )
}

// De split als wit vel: week bovenaan, daarna per trainingsdag de oefeningen.
function SplitVel({ split, dagen, locatie, isMobile }) {
  return (
    <div style={{ background: PAPIER, borderRadius: 12, padding: isMobile ? '1rem' : '1.3rem 1.4rem', color: INKT }}>
      <div style={{ fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{split.naam}</div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.55)', fontWeight: 600, marginTop: 2 }}>
        {split.dagen.length} dagen per week · {locatie === 'thuis' ? 'thuis' : 'gym'}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.7)', lineHeight: 1.5, marginTop: 8 }}>{split.waarom}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, margin: '14px 0 6px' }}>
        {WEEK.map(d => {
          const idx = split.week.indexOf(d)
          const aan = idx >= 0
          return (
            <div key={d} style={{
              borderRadius: 8, padding: '6px 2px', textAlign: 'center', minWidth: 0,
              background: aan ? INKT : 'transparent', border: aan ? 'none' : `1px solid ${LIJN}`,
              color: aan ? '#fff' : 'rgba(0,0,0,0.35)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>{d}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 600, lineHeight: 1.2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {aan ? DAG_NAAM[split.dagen[idx]].replace(/ \(.*\)/, '') : 'Rust'}
              </div>
            </div>
          )
        })}
      </div>

      {!dagen && <div style={{ padding: '1rem 0', fontSize: '0.88rem', color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>Oefeningen laden…</div>}
      {dagen && split.dagen.map((code, i) => {
        const dag = dagen[code]
        if (!dag) return null
        return (
          <div key={`${code}-${i}`} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, borderBottom: `2px solid ${INKT}`, paddingBottom: 4 }}>
              <span style={{ fontSize: '1rem', fontWeight: 900 }}>{split.week[i]} · {DAG_NAAM[code]}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.55)', fontWeight: 600, textAlign: 'right' }}>{dag.focus}</span>
            </div>
            {dag.oefeningen.map((o, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0.45rem 0', borderBottom: j === dag.oefeningen.length - 1 ? 'none' : `1px solid ${LIJN}` }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 700 }}>{o.naam}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{o.sets} × {o.reps}</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', fontWeight: 600, whiteSpace: 'nowrap', width: 44, textAlign: 'right' }}>{o.rust}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// Preview op het startscherm: hoe een split eruitziet, klein en vast.
function Voorbeeld({ isMobile }) {
  const s = SPLITS[4]
  return (
    <div>
      <div style={{ fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 12, letterSpacing: '-0.02em' }}>
        Dit krijg je
      </div>
      <div style={{ background: PAPIER, borderRadius: 12, padding: isMobile ? '0.9rem 1rem' : '1.1rem 1.2rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: INKT, borderBottom: `2px solid ${INKT}`, paddingBottom: 6, marginBottom: 6 }}>
          {s.naam}
        </div>
        {s.dagen.map((code, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8rem' }}>
            <span style={{ color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>{s.week[i]}</span>
            <span style={{ color: INKT, fontWeight: 800 }}>{DAG_NAAM[code]}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.68rem', color: 'rgba(0,0,0,0.4)', marginTop: 8, fontWeight: 600 }}>
          Voorbeeld: 4 dagen in de gym. Met alle oefeningen, sets, reps en rust, als PDF.
        </div>
      </div>
    </div>
  )
}
