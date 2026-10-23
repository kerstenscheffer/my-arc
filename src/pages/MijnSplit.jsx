// src/pages/MijnSplit.jsx
// Lead magnet /mijn-split: vier vragen (dagen, waar, doel, ervaring), daarna
// naam + e-mail, en dan de split uit de MY ARC-bibliotheek als PDF. Geen
// mail: de lead komt op het bord in de kolom "🧲 Mijn split" (RPC
// submit_mijn_split).
//
// Zelfde huisstijl als /challenge (23 okt 2026): vaste balk met logo en witte
// pil, kop, video op de overgang zwart/wit, groene knop, en de vragen in een
// modal midden in beeld, één vraag per scherm met de groene voortgangsbalk.
// Meting met dezelfde meet() als /challenge (challenge_events, pad
// /mijn-split). Het Ads-scherm filtert sinds 23 okt 2026 per pagina, dus dit
// komt niet tussen de challenge-cijfers. Zelfde gebeurtenissen: bezoek, tijd,
// video_*, knop, form_start, form_vraag/form_stap per vraag, form_klaar, en
// eigen: pdf_download.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Loader2, X, RefreshCw, Undo2 } from 'lucide-react'
import db from '../services/DatabaseService'
import { herkomst, meet } from './challengeTracking'
import { Optie, LeadMagnetPagina } from './leadmagnet/Bouwstenen'
import { CTA_GROEN, WIT, ZWAK, FONT, emailOk, knopWit, invoer } from './leadmagnet/stijl'
import { SPLITS, DAG_NAAM, WEEK, DOELEN, NIVEAUS, LOCATIES, tips } from './mijn-split/splitRegels'
import { downloadSplitPdf, fotoVoor, duur, totaalSets } from './mijn-split/splitPdf'
import { BEPERKINGEN, beperkingenVoor, pasBeperkingenToe, suggestiesVoor } from './mijn-split/oefeningWissel'

// YouTube-id van de uitlegvideo. Leeg = stilstaand beeld zonder afspeelknop.
const VIDEO_ID = ''
const POSTER = '/mijn-split/push.jpg'
const CTA_TEKST = 'Maak mijn split'

const STAPPEN = ['dagen', 'locatie', 'doel', 'niveau', 'beperkingen', 'gegevens']
const TOTAAL = STAPPEN.length
const DAGEN_KEUZE = [
  { key: 2, label: '2 dagen' },
  { key: 3, label: '3 dagen' },
  { key: 4, label: '4 dagen' },
  { key: 5, label: '5 dagen' },
  { key: 6, label: '6 dagen' },
]
const VRAGEN = {
  dagen: { titel: 'Hoeveel dagen per week kun je trainen?', lijst: DAGEN_KEUZE },
  locatie: { titel: 'Waar train je?', lijst: LOCATIES },
  doel: { titel: 'Wat is je doel?', lijst: DOELEN },
  niveau: { titel: 'Hoe lang train je al?', lijst: NIVEAUS },
  beperkingen: { titel: 'Is er iets wat je niet kunt of wilt?' },
  gegevens: { titel: 'Waar mag je split heen?' },
}

// De teksten van de pagina (opbouw: LeadMagnetPagina in leadmagnet/Bouwstenen).
const PAGINA = {
  pil: 'Gratis trainingssplit',
  kop: 'Welke trainingssplit past bij jou?',
  sub: 'Beantwoord 5 vragen en krijg de split waar mijn klanten mee trainen.',
  videoId: VIDEO_ID, poster: POSTER, cta: CTA_TEKST,
  // Drie stappen onder de bovenste knop, zelfde vorm als op /challenge.
  stappen: [
    { kop: 'Vragen', sub: '5 korte vragen' },
    { kop: 'Split', sub: 'op jouw dagen' },
    { kop: 'Uitvoeren', sub: 'met logboek' },
  ],
  inhoud: [
    'Een split op jouw aantal dagen, in de gym of thuis.',
    'Alle oefeningen met sets, reps en rust.',
    'Een logboek per set voor 4 weken.',
    'Hoe je opwarmt, hoe zwaar je gaat en hoe lang je rust.',
  ],
  voorbeeldTekst: "Een PDF van 6 à 8 pagina's, gemaakt op jouw antwoorden.",
  voorbeelden: [
    { src: '/mijn-split/voorbeeld-1.jpg', label: 'Jouw split' },
    { src: '/mijn-split/voorbeeld-2.jpg', label: 'Je week' },
    { src: '/mijn-split/voorbeeld-3.jpg', label: 'Elke training + logboek' },
    { src: '/mijn-split/voorbeeld-4.jpg', label: 'Uitvoering en progressie' },
  ],
  coachKort: 'En dit is hoe mijn klanten trainen.',
  coachSlot: 'Deze splits zijn dezelfde waar mijn klanten mee trainen. Zo zie je hoe ik het aanpak, en kun je er vandaag mee beginnen.',
  slotKop: 'Klaar voor je split?',
  slotTekst: 'Vijf vragen, dan staat hij voor je klaar.',
  // Onderaan de knop naar de 6 Weken Challenge (zelfde modal als /challenge):
  // in de video verwijst Kersten naar deze knop (23 okt 2026).
  challengeSlot: {
    kop: 'Doe mee met de 6 Weken Challenge',
    tekst: 'Plan je vrijblijvende kennismaking. We kijken samen naar je situatie, je doelen en of de challenge bij jou past.',
  },
}

function SplitFlow({ m }) {
  const [stap, setStap] = useState(0)            // index in STAPPEN, TOTAAL = klaar
  const [antw, setAntw] = useState({ dagen: null, locatie: null, doel: null, niveau: null, beperkingen: [], beperking_eigen: '', voornaam: '', email: '' })
  const [dagen, setDagen] = useState(null)        // { code: { focus, oefeningen } }
  const [bezig, setBezig] = useState(false)
  const [pdfBezig, setPdfBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef(herkomst())
  const doorTimer = useRef(null)
  const bovenRef = useRef(null)

  useEffect(() => () => clearTimeout(doorTimer.current), [])
  useEffect(() => { bovenRef.current?.scrollIntoView?.({ block: 'start' }) }, [stap])
  // Elke vraag die in beeld komt: "gezien"; beantwoord = form_stap. Zo ziet
  // het Ads-scherm per vraag hoeveel mensen afhaken.
  const gezien = useRef(new Set())
  useEffect(() => {
    const vraag = STAPPEN[stap]
    if (!vraag || gezien.current.has(vraag)) return
    gezien.current.add(vraag)
    meet('form_vraag', { meta: { stap: stap + 1, vraag } })
  }, [stap])

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

  // De split zoals hij wordt: eerst de vervangingen uit de beperkingen, dan
  // wat iemand op het laatste scherm zelf wisselde (sleutel code:plek).
  const [wissels, setWissels] = useState({})
  const mijnDagen = useMemo(() => {
    const basis = pasBeperkingenToe(dagen, antw.beperkingen)
    if (!basis) return basis
    return Object.fromEntries(Object.entries(basis).map(([code, dag]) => [code, {
      ...dag,
      oefeningen: dag.oefeningen.map((o, i) => {
        const n = wissels[`${code}:${i}`]
        if (!n || n === o.naam) return o
        const bron = o.origineel || o.naam
        if (n === bron) return { ...o, naam: n, origineel: undefined, reden: undefined }
        return { ...o, naam: n, origineel: bron, reden: 'Zelf gewisseld' }
      }),
    }]))
  }, [dagen, antw.beperkingen, wissels])
  const wissel = (code, i, van, naar) => {
    setWissels(w => ({ ...w, [`${code}:${i}`]: naar }))
    meet('oefening_wissel', { meta: { van, naar } })
  }

  const split = antw.dagen ? SPLITS[antw.dagen] : null
  const huidig = STAPPEN[stap]
  const gegevensOk = antw.voornaam.trim().length > 0 && emailOk(antw.email)

  const kies = (veld, waarde) => {
    meet('form_stap', { meta: { stap: stap + 1, vraag: veld } })
    setAntw(a => ({ ...a, [veld]: waarde }))
    clearTimeout(doorTimer.current)
    doorTimer.current = setTimeout(() => setStap(s => s + 1), 220)
  }
  const terug = () => { clearTimeout(doorTimer.current); if (stap > 0) setStap(stap - 1) }

  const verstuur = async () => {
    if (!gegevensOk || bezig) return
    setBezig(true); setFout('')
    try {
      const doelLabel = DOELEN.find(d => d.key === antw.doel)?.label
      const niveauLabel = NIVEAUS.find(n => n.key === antw.niveau)?.label
      const locLabel = LOCATIES.find(l => l.key === antw.locatie)?.label
      const kanNiet = BEPERKINGEN.filter(b => antw.beperkingen.includes(b.key)).map(b => b.label).join(', ')
      const eigen = antw.beperking_eigen.trim()
      const u = utm.current || {}
      const { data: leadId, error } = await db.supabase.rpc('submit_mijn_split', { p: {
        voornaam: antw.voornaam.trim(),
        email: antw.email.trim(),
        doel: doelLabel,
        samenvatting: `Mijn split: ${split.naam} (${antw.dagen} dagen, ${locLabel?.toLowerCase()}). Doel: ${doelLabel}. Traint: ${niveauLabel?.toLowerCase()}.${kanNiet ? ` Kan/wil niet: ${kanNiet}.` : ''}${eigen ? ` Anders: ${eigen}` : ''}`,
        antwoorden: [
          { vraag: 'Dagen per week', antwoord: String(antw.dagen) },
          { vraag: 'Waar', antwoord: locLabel },
          { vraag: 'Doel', antwoord: doelLabel },
          { vraag: 'Traint al', antwoord: niveauLabel },
          { vraag: 'Kan of wil niet', antwoord: kanNiet || 'Alles kan' },
          ...(eigen ? [{ vraag: 'Iets anders', antwoord: eigen }] : []),
          { vraag: 'Split', antwoord: split.naam },
        ],
        utm_source: u.utm_source, utm_medium: u.utm_medium, utm_campaign: u.utm_campaign,
        utm_content: u.utm_content, referrer: u.referrer,
      } })
      if (error) throw error
      meet('form_stap', { meta: { stap: TOTAAL, vraag: 'gegevens' } })
      meet('form_klaar', { meta: { uitkomst: 'A', vraag: 'gegevens' }, lead_id: leadId || null })
      setStap(TOTAAL)
    } catch (e) {
      console.error('mijn-split opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Controleer je e-mail en probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const download = async () => {
    if (pdfBezig || !mijnDagen) return
    setPdfBezig(true); setFout('')
    try {
      await downloadSplitPdf({ voornaam: antw.voornaam.trim(), split, locatie: antw.locatie, dagen: mijnDagen, tips: tips(antw), doel: antw.doel })
      meet('pdf_download', { meta: { split: split.naam } })
    } catch (e) {
      console.error('PDF mislukt:', e)
      setFout('Downloaden lukte niet. Probeer het nog een keer.')
    } finally { setPdfBezig(false) }
  }

  const kop = (tekst) => (
    <h2 style={{ margin: 0, fontSize: m ? '1.6rem' : '2rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', color: WIT, textAlign: 'center' }}>{tekst}</h2>
  )
  const sub = (tekst) => (
    <p style={{ margin: '0.7rem 0 0', fontSize: m ? '0.98rem' : '1.05rem', fontWeight: 700, color: ZWAK, lineHeight: 1.5, textAlign: 'center' }}>{tekst}</p>
  )
  const buitenkant = {
    maxWidth: 560, margin: '0 auto', width: '100%', boxSizing: 'border-box',
    padding: m ? '4.4rem 1.1rem 1.3rem' : '5.2rem 1.6rem 1.6rem', color: WIT, fontFamily: FONT,
  }

  // ── Klaar: download en de split zelf ──
  if (stap >= TOTAAL) {
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} style={{ scrollMarginTop: m ? 64 : 80 }} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
          <Check size={34} strokeWidth={3.2} color="#000" />
        </div>
        {kop(`${antw.voornaam.trim()}, je split staat klaar.`)}
        {sub(`${split.naam}: ${split.dagen.length} dagen per week, ${antw.locatie === 'thuis' ? 'thuis' : 'in de gym'}.`)}
        <button onClick={download} disabled={!dagen || pdfBezig} style={{ ...knopWit(m, !dagen || pdfBezig), marginTop: '1.4rem', background: dagen ? CTA_GROEN : 'rgba(255,255,255,0.12)', color: WIT }}>
          {pdfBezig ? <Loader2 size={22} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={22} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download je split (PDF)'}
        </button>
        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
        <SplitOverzicht split={split} dagen={mijnDagen} locatie={antw.locatie} keuzes={antw.beperkingen} onWissel={wissel} m={m} onDownload={download} pdfBezig={pdfBezig} />
      </div>
    )
  }

  // ── Vraag ──
  const v = VRAGEN[huidig]
  const isGegevens = huidig === 'gegevens'
  const isBeperkingen = huidig === 'beperkingen'
  const zetBeperking = (key) => setAntw(a => ({ ...a, beperkingen: a.beperkingen.includes(key) ? a.beperkingen.filter(k => k !== key) : [...a.beperkingen, key] }))
  const beperkingenDoor = () => {
    meet('form_stap', { meta: { stap: stap + 1, vraag: 'beperkingen' } })
    setStap(s => s + 1)
  }
  const nummer = stap + 1
  const deel = TOTAAL > 1 ? (nummer - 1) / (TOTAAL - 1) : 1
  const voortgangKleur = `hsl(${Math.round(110 + deel * 32)}, ${Math.round(50 + deel * 30)}%, ${Math.round(64 - deel * 20)}%)`

  return (
    <div style={buitenkant}>
      <div ref={bovenRef} style={{ scrollMarginTop: m ? 64 : 80 }} />
      <div style={{ marginBottom: m ? '1.4rem' : '1.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <button onClick={terug} aria-label="Vorige vraag" style={{ display: stap === 0 ? 'none' : 'inline-flex', alignItems: 'center', padding: '4px 4px 4px 0', background: 'none', border: 'none', color: WIT, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <ArrowLeft size={17} strokeWidth={2.8} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap' }}>Gratis trainingssplit</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: voortgangKleur, fontVariantNumeric: 'tabular-nums', transition: 'color 0.35s ease' }}>
            Stap {nummer} van {TOTAAL}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ width: `${(nummer / TOTAAL) * 100}%`, height: '100%', background: voortgangKleur, borderRadius: 4, transition: 'width 0.35s ease, background-color 0.35s ease' }} />
        </div>
      </div>

      <div key={huidig} style={{ animation: 'vraagIn 0.25s ease' }}>
        {kop(v.titel)}
        <div style={{ marginTop: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {isBeperkingen && (
            <>
              <Optie label="Nee, alles kan" m={m} aan={false} onClick={() => { setAntw(a => ({ ...a, beperkingen: [], beperking_eigen: '' })); beperkingenDoor() }} />
              {beperkingenVoor(antw.locatie).map(b => (
                <Optie key={b.key} label={b.label} m={m} meer aan={antw.beperkingen.includes(b.key)} onClick={() => zetBeperking(b.key)} />
              ))}
              <input value={antw.beperking_eigen} onChange={e => setAntw(a => ({ ...a, beperking_eigen: e.target.value }))}
                placeholder="Iets anders? (mag leeg)" style={{ ...invoer(m), minHeight: m ? 54 : 58, borderRadius: 14 }} />
            </>
          )}
          {!isGegevens && !isBeperkingen && v.lijst.map(o => (
            <Optie key={o.key} label={o.label} m={m} aan={antw[huidig] === o.key} onClick={() => kies(huidig, o.key)} />
          ))}
          {isGegevens && (
            <>
              <input value={antw.voornaam} onChange={e => setAntw(a => ({ ...a, voornaam: e.target.value }))}
                placeholder="Je voornaam*" autoComplete="given-name" style={invoer(m)} />
              <input value={antw.email} onChange={e => setAntw(a => ({ ...a, email: e.target.value.trim() }))}
                onKeyDown={e => e.key === 'Enter' && verstuur()}
                placeholder="jouw@email.nl*" type="email" inputMode="email" autoComplete="email" style={invoer(m)} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45, textAlign: 'center', marginTop: '0.2rem' }}>
                Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: WIT }}>privacyverklaring</a>.
              </div>
            </>
          )}
        </div>
        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
        {isBeperkingen && (
          <button onClick={beperkingenDoor} style={{ ...knopWit(m), marginTop: '1.4rem' }}>
            Volgende <ArrowRight size={22} strokeWidth={2.6} />
          </button>
        )}
        {isGegevens && (
          <button onClick={verstuur} disabled={!gegevensOk || bezig} style={{ ...knopWit(m, !gegevensOk || bezig), marginTop: '1.4rem' }}>
            {bezig ? 'Even geduld…' : 'Laat mijn split zien'}
            {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
          </button>
        )}
      </div>
    </div>
  )
}

const chip = (terug) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.5rem 0.75rem', borderRadius: 999, cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, textAlign: 'left',
  border: `1px solid ${terug ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.16)'}`,
  background: terug ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', color: WIT,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

// De split zelf onder de downloadknop, in de stijl van de PDF: de week als
// fotokaartjes, een wisselaar per training en per training een kaart met
// foto, kerncijfers en de oefeningen.
const ANTON = "'Anton', 'DM Sans', sans-serif"

function SplitOverzicht({ split, dagen, locatie, keuzes, onWissel, m, onDownload, pdfBezig }) {
  const uniek = [...new Set(split.dagen)]
  const [actief, setActief] = useState(uniek[0])
  // Welke oefening zijn wissellijst open heeft (plek in de training), of null.
  const [open, setOpen] = useState(null)
  useEffect(() => { setOpen(null) }, [actief])
  const dag = dagen?.[actief]
  const nr = uniek.indexOf(actief) + 1
  const wanneer = split.week.filter((_, k) => split.dagen[k] === actief).join(' + ')
  const twee = (n) => String(n).padStart(2, '0')
  const klein = { fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ZWAK }

  return (
    <div style={{ marginTop: '1.8rem' }}>
      {/* De week: trainingsdagen met hun foto, rustdagen leeg. Tik = die training. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: m ? 5 : 6 }}>
        {WEEK.map(d => {
          const idx = split.week.indexOf(d)
          const code = idx >= 0 ? split.dagen[idx] : null
          const aan = code === actief
          return (
            <button key={d} onClick={() => code && setActief(code)} disabled={!code} aria-label={code ? `${d}: ${DAG_NAAM[code]}` : `${d}: rust`} style={{
              position: 'relative', aspectRatio: '1', borderRadius: 10, padding: 0, overflow: 'hidden', fontFamily: 'inherit',
              border: code ? `1.5px solid ${aan ? WIT : 'rgba(255,255,255,0.18)'}` : '1px solid rgba(255,255,255,0.1)',
              background: code ? `url(/mijn-split/klein-${fotoVoor(code, locatie)}.jpg) center / cover` : 'transparent',
              cursor: code ? 'pointer' : 'default', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: ANTON, fontSize: m ? '0.95rem' : '1.1rem', color: code ? WIT : 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>{d.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Wisselaar tussen de trainingen. */}
      {uniek.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: '0.9rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {uniek.map(c => (
            <button key={c} onClick={() => setActief(c)} style={{
              flexShrink: 0, padding: '0.55rem 0.9rem', borderRadius: 999, fontFamily: 'inherit', cursor: 'pointer',
              border: `1.5px solid ${c === actief ? WIT : 'rgba(255,255,255,0.18)'}`,
              background: c === actief ? WIT : 'transparent', color: c === actief ? '#000' : WIT,
              fontSize: '0.85rem', fontWeight: 900, whiteSpace: 'nowrap',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{DAG_NAAM[c]}</button>
          ))}
        </div>
      )}

      {!dag && <div style={{ padding: '1.4rem 0', fontSize: '0.88rem', color: ZWAK, textAlign: 'center', fontWeight: 700 }}>Oefeningen laden…</div>}
      {dag && (
        <div key={actief} style={{ marginTop: '0.9rem', borderRadius: 16, overflow: 'hidden', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', animation: 'vraagIn 0.25s ease' }}>
          <div style={{ position: 'relative', aspectRatio: '1240 / 640', background: `url(/mijn-split/${fotoVoor(actief, locatie)}.jpg) center / cover` }}>
            <div style={{ position: 'absolute', left: m ? 14 : 18, bottom: m ? 12 : 16 }}>
              <div style={{ ...klein, color: WIT }}>Training {twee(nr)} · {wanneer}</div>
              <div style={{ fontFamily: ANTON, fontSize: m ? '2.1rem' : '2.6rem', lineHeight: 1, color: WIT, marginTop: 6, textTransform: 'uppercase' }}>{DAG_NAAM[actief]}</div>
            </div>
          </div>
          <div style={{ padding: m ? '0.2rem 1rem 1rem' : '0.3rem 1.2rem 1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem 0' }}>
              {[['Per training', `${dag.oefeningen.length} oef. · ${totaalSets(dag.oefeningen)} sets`], ['Tijd', `± ${duur(dag.oefeningen)} min`], ['Elke werkset', 'Tot falen']].map(([l, w], k) => (
                <div key={l} style={{ paddingLeft: k ? 10 : 0, borderLeft: k ? '1px solid rgba(255,255,255,0.08)' : 'none', minWidth: 0 }}>
                  <div style={{ ...klein, fontSize: '0.56rem' }}>{l}</div>
                  <div style={{ fontSize: m ? '0.86rem' : '0.95rem', fontWeight: 900, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, padding: '0.7rem 0 0.2rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} strokeWidth={2.6} style={{ flexShrink: 0 }} /> Kun of wil je een oefening niet? Tik op het pijltje om te wisselen.
            </div>
            {dag.oefeningen.map((o, j) => {
              const isOpen = open === j
              const opDag = dag.oefeningen.map(x => x.naam)
              const suggesties = isOpen ? suggestiesVoor(o, opDag, keuzes) : []
              const terugMag = o.origineel && !BEPERKINGEN.some(b => keuzes.includes(b.key) && b.verboden.includes(o.origineel)) && !opDag.includes(o.origineel)
              return (
                <div key={j} style={{ borderBottom: j === dag.oefeningen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0' }}>
                    <span style={{ width: 18, flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{twee(j + 1)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3 }}>{o.naam}</span>
                      {o.origineel && (
                        <span style={{ display: 'block', marginTop: 2, fontSize: '0.7rem', fontWeight: 800, color: '#86efac' }}>
                          {o.reden === 'Zelf gewisseld' ? `Gewisseld · was ${o.origineel}` : `Aangepast: ${o.reden.toLowerCase()}`}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, whiteSpace: 'nowrap' }}>{o.sets} × {o.reps}</span>
                    <button onClick={() => setOpen(isOpen ? null : j)} aria-label={`Wissel ${o.naam}`} aria-expanded={isOpen} style={{
                      width: 32, height: 32, flexShrink: 0, borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${isOpen ? WIT : 'rgba(255,255,255,0.16)'}`, background: isOpen ? WIT : 'transparent', color: isOpen ? '#000' : WIT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {isOpen ? <X size={16} strokeWidth={2.8} /> : <RefreshCw size={15} strokeWidth={2.6} />}
                    </button>
                  </div>
                  {isOpen && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 0 0.8rem 28px', animation: 'vraagIn 0.2s ease' }}>
                      {terugMag && (
                        <button onClick={() => { onWissel(actief, j, o.naam, o.origineel); setOpen(null) }} style={chip(true)}>
                          <Undo2 size={13} strokeWidth={2.8} /> {o.origineel}
                        </button>
                      )}
                      {suggesties.map(n => (
                        <button key={n} onClick={() => { onWissel(actief, j, o.naam, n); setOpen(null) }} style={chip(false)}>{n}</button>
                      ))}
                      {!terugMag && !suggesties.length && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK }}>Geen alternatief voor deze oefening.</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wat de PDF extra heeft, met nog een downloadknop. */}
      <div style={{ marginTop: '1.2rem', padding: m ? '1rem' : '1.1rem 1.2rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: '0.98rem', fontWeight: 900 }}>In de PDF staat ook</div>
        {['Een logboek per set voor 4 weken', 'Hoe je opwarmt en hoe lang je rust', 'Hoe je progressie bijhoudt'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} /> {t}
          </div>
        ))}
        <button onClick={onDownload} disabled={!dagen || pdfBezig} style={{ ...knopWit(m, !dagen || pdfBezig), marginTop: '1rem', minHeight: m ? 52 : 56, fontSize: '1rem' }}>
          {pdfBezig ? <Loader2 size={20} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={20} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download de PDF'}
        </button>
      </div>
    </div>
  )
}

export default function MijnSplit() {
  return <LeadMagnetPagina cfg={PAGINA}>{(m) => <SplitFlow m={m} />}</LeadMagnetPagina>
}
