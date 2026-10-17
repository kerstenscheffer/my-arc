// src/modules/steps/StappenVerzoek.jsx
//
// "Je coach wil je stappen kunnen zien." Verschijnt bij het openen van de app
// nadat de coach in Coach Inzicht op "Vraag om stappen" tikte
// (clients.stappen_verzoek_at, zie controleerVerzoek in stappenSync.js).
//
// Wat de klant moet doen hangt af van waarom het nu niet werkt, dus de sheet
// kijkt eerst zelf (stappenStatus) en toont dan één knop:
//   telefoon kan het     → toestemming opnieuw vragen
//   iOS zei eerder nee   → het systeem vraagt niet nog eens, dus naar de
//                          instellingen
//   browser / oude app   → uitleg dat het via de (bijgewerkte) app moet

import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal'
import { colors, radius, space } from '../../ui/tokens'
import StappenService from './StappenService'
import { stappenStatus, vraagOpnieuw, openStappenInstellingen, platform } from './telefoonStappen'
import { STAPPEN_VERZOEK_EVENT, STAPPEN_EVENT, markeerVerzoekGezien, meldStappenStatus, openStaandVerzoek } from './stappenSync'

const TEKST = {
  web: 'Stappen tellen werkt via de MY ARC-app op je telefoon, niet in de browser. Download de app en log daar in, dan lopen je stappen vanzelf mee.',
  oude_app: 'Je app is te oud om stappen te delen. Werk MY ARC bij via de App Store of Play Store en open de app daarna opnieuw.',
  geen_bron: 'Je telefoon heeft Health Connect nodig om stappen te delen. Installeer het en geef MY ARC daar toegang tot stappen.',
  instellingen: platform() === 'ios'
    ? 'Je telefoon vraagt het niet nog een keer. Zet het zelf aan: open de instellingen, kies Gezondheid en zet Stappen aan voor MY ARC.'
    : 'Zet het zelf aan in Health Connect: App-machtigingen → MY ARC → Stappen.',
}

export default function StappenVerzoek({ db, clientId, isMobile }) {
  const [verzoek, setVerzoek] = useState(null)
  const [status, setStatus] = useState(null)
  const [stap, setStap] = useState('vraag') // vraag | instellingen | klaar
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    const op = (e) => {
      setVerzoek(e.detail?.verzoek || new Date().toISOString())
      setStap('vraag')
      stappenStatus().then(setStatus)
    }
    window.addEventListener(STAPPEN_VERZOEK_EVENT, op)
    const al = openStaandVerzoek()
    if (al) op({ detail: { verzoek: al } })
    return () => window.removeEventListener(STAPPEN_VERZOEK_EVENT, op)
  }, [])

  const sluit = () => {
    markeerVerzoekGezien(verzoek)
    setVerzoek(null)
  }

  const deel = async () => {
    setBezig(true)
    try {
      const n = await vraagOpnieuw()
      if (n != null && n > 0) {
        await StappenService.bewaar(db, clientId, n, { source: 'telefoon' }).catch(() => {})
        window.dispatchEvent(new CustomEvent(STAPPEN_EVENT, { detail: { steps: n } }))
        setStap('klaar')
      } else {
        // Nul of niets: op iOS is dat een eerdere weigering die het systeem
        // stil herhaalt. Alleen de instellingen helpen dan.
        setStap('instellingen')
      }
      meldStappenStatus(db, clientId)
    } finally {
      setBezig(false)
    }
  }

  if (!verzoek) return null

  const kanDelen = status && !['web', 'oude_app'].includes(status)
  const tekst = stap === 'klaar'
    ? 'Gelukt. Je stappen lopen vanaf nu vanzelf mee en je coach ziet ze terug.'
    : stap === 'instellingen'
      ? TEKST.instellingen
      : status === 'web' || status === 'oude_app' || status === 'geen_bron'
        ? TEKST[status]
        : 'Je coach wil je stappen kunnen zien, zodat jullie samen naar je dagelijkse beweging kunnen kijken. Je telefoon vraagt even om toestemming.'

  const knop = {
    width: '100%', minHeight: 48, borderRadius: radius.btn, border: 'none',
    background: '#fff', color: '#0a0a0a', fontSize: 16, fontWeight: 900,
    fontFamily: 'inherit', cursor: 'pointer', opacity: bezig ? 0.6 : 1,
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const tweede = {
    ...knop, background: 'transparent', color: colors.textPrimary,
    border: '1.5px solid rgba(255,255,255,0.25)', marginTop: space[2], opacity: 1,
  }

  let actie = null
  if (stap === 'klaar') actie = <button type="button" style={knop} onClick={sluit}>Sluiten</button>
  else if (stap === 'instellingen' || status === 'geen_bron') {
    actie = <button type="button" style={knop} onClick={() => openStappenInstellingen()}>Open instellingen</button>
  } else if (kanDelen) {
    actie = <button type="button" style={knop} disabled={bezig} onClick={deel}>{bezig ? 'Even wachten…' : 'Stappen delen'}</button>
  }

  return (
    <Modal isOpen onClose={sluit} title="Deel je stappen" isMobile={isMobile} maxWidth={460}>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
        {tekst}
      </p>
      <div style={{ marginTop: space[6] }}>
        {actie}
        {stap !== 'klaar' && <button type="button" style={tweede} onClick={sluit}>Later</button>}
      </div>
    </Modal>
  )
}
