// src/pages/nieuw-home/GidsenBibliotheek.jsx (20 nov 2026)
// Alle gratis gidsen op de homepage, ingeruild voor voornaam + e-mail.
// Lead: RPC submit_gidsen → call_leads (lead_source 'gidsen'), kolom '🧲 Gidsen'.
// Elke volgende download: gids_gedownload zet hem in lead_magnets_shared.
// SQL: gidsen.sql. PDF's en omslagen: public/gratis/gidsen/ (gecomprimeerd uit
// Kerstens Drive-map). Desserts en Snacks staan er nog niet in: daar stond de
// oude handle @KERSTENVDBERG in.
// Ontgrendeld blijft ontgrendeld op dit toestel (localStorage, met try/catch).
import { useState } from 'react'
import { Download, Lock } from 'lucide-react'
import { GIDSEN } from './gidsenLijst'

const pad = (slug, ext) => `/gratis/gidsen/${slug}.${ext}`
const OPSLAG = 'nh_gidsen'

function leesOpslag() {
  try { return JSON.parse(localStorage.getItem(OPSLAG) || 'null') } catch { return null }
}
function rpc(naam, body) {
  const url = import.meta.env.VITE_SUPABASE_URL
  const sleutel = import.meta.env.VITE_SUPABASE_ANON_KEY
  return fetch(`${url}/rest/v1/rpc/${naam}`, {
    method: 'POST',
    headers: { apikey: sleutel, Authorization: `Bearer ${sleutel}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export default function GidsenBibliotheek() {
  const [toegang, setToegang] = useState(leesOpslag)
  const [gekozen, setGekozen] = useState(null) // gids waarop geklikt werd vóór het formulier
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  const verstuur = async (e) => {
    e.preventDefault()
    setFout('')
    if (!naam.trim()) return setFout('Vul je voornaam in.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFout('Vul een geldig e-mailadres in.')
    setBezig(true)
    const q = new URLSearchParams(window.location.search)
    try {
      const r = await rpc('submit_gidsen', { p: {
        voornaam: naam.trim(), email: email.trim(), gids: gekozen?.titel || null,
        utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'),
        utm_content: q.get('utm_content'), referrer: document.referrer || null,
      } })
      if (!r.ok) throw new Error('opslaan mislukt')
      const lead = await r.json()
      const nieuw = { lead, naam: naam.trim() }
      try { localStorage.setItem(OPSLAG, JSON.stringify(nieuw)) } catch { /* privémodus: alleen deze sessie */ }
      setToegang(nieuw)
      if (gekozen) window.open(pad(gekozen.slug, 'pdf'), '_blank', 'noopener')
    } catch {
      setFout('Dat lukte niet. Probeer het nog een keer.')
    } finally {
      setBezig(false)
    }
  }

  const download = (g) => {
    if (toegang?.lead) rpc('gids_gedownload', { p_lead: toegang.lead, p_gids: g.titel }).catch(() => {})
  }

  return (
    <section className="nh-bieb" id="gidsen">
      <div className="nh-bieb-kop">
        <div className="nh-kaart-label">{GIDSEN.length} gidsen · gratis</div>
        <h2>De gidsen-bibliotheek</h2>
        <p>{toegang ? `Veel plezier ${toegang.naam}! Tik op een gids om hem te downloaden.` : 'Alles wat ik mijn klanten geef over eten, uit eten, snacks en slaap. Vul je naam en e-mail in en download ze allemaal.'}</p>
      </div>

      {!toegang && (
        <form className="nh-bieb-form" id="gidsen-formulier" onSubmit={verstuur} noValidate>
          <div className="nh-bieb-form-kop">{gekozen ? <>Vul je gegevens in voor <b>{gekozen.titel}</b> en de rest.</> : 'Krijg direct toegang tot alle gidsen'}</div>
          <label><span>Voornaam</span><input value={naam} onChange={(e) => setNaam(e.target.value)} autoComplete="given-name" maxLength={80} /></label>
          <label><span>E-mail</span><input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} /></label>
          {fout && <div className="nh-bieb-fout" role="alert">{fout}</div>}
          <button type="submit" className="nh-knop is-groot" disabled={bezig}>{bezig ? 'Even geduld…' : `Download alle ${GIDSEN.length} gidsen`}</button>
          <div className="nh-bieb-klein">Geen spam. Je e-mail gebruik ik alleen voor MY ARC Coaching (zie <a href="/privacy">privacy</a>).</div>
        </form>
      )}

      <div className="nh-bieb-rij">
        {GIDSEN.map((g) => {
          const inhoud = (
            <>
              <span className="nh-bieb-omslag">
                <img src={pad(g.slug, 'jpg')} alt="" width="496" height="702" loading="lazy" />
                <span className="nh-bieb-slot" aria-hidden="true">{toegang ? <Download size={18} strokeWidth={2.6} /> : <Lock size={16} strokeWidth={2.6} />}</span>
              </span>
              <span className="nh-bieb-titel">{g.titel}</span>
              <span className="nh-bieb-sub">{g.paginas} pagina's · PDF</span>
            </>
          )
          return toegang ? (
            <a key={g.slug} className="nh-bieb-gids" href={pad(g.slug, 'pdf')} target="_blank" rel="noopener noreferrer" onClick={() => download(g)}>{inhoud}</a>
          ) : (
            <button key={g.slug} type="button" className="nh-bieb-gids" onClick={() => { setGekozen(g); document.getElementById('gidsen-formulier')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>{inhoud}</button>
          )
        })}
      </div>

    </section>
  )
}
