// src/ui/PaginaVangnet.jsx
//
// Vangnet om elke klantpagina. Er was nergens een error boundary: één fout
// tijdens het tekenen (een veld dat null is, een chunk die na een deploy weg
// is) haalde de hele app weg en liet een wit scherm achter. Klanten noemden
// dat "de app viel uit" (Mark Behr, okt 2026), en wij zagen niets.
//
// Nu: alleen díé pagina toont een melding met "Opnieuw proberen" (tekent de
// pagina opnieuw) en "App herladen". De fout gaat naar app_fouten, zodat we
// kunnen zien wat er misging, bij wie en op welke pagina.

import { Component } from 'react'
import { supabase } from '../lib/supabase'
import { APP_VERSIE } from '../modules/app-update/appVersie'

// Eén melding per fout per sessie; een lus van dezelfde fout vult de tabel niet.
const gemeld = new Set()

// Waar je bent en wie je bent, voor fouten die niet uit een pagina komen
// (klik, laden). ClientDashboard en CoachHub zetten dit bij elke wissel.
export const foutContext = { pagina: null, clientId: null }

// eslint-disable-next-line react-refresh/only-export-components
export function meldFout(fout, info, pagina, clientId) {
  const melding = String(fout?.message || fout || 'Onbekende fout').slice(0, 1000)
  const sleutel = `${pagina}|${melding}`
  if (gemeld.has(sleutel)) return
  gemeld.add(sleutel)
  supabase.from('app_fouten').insert({
    pagina,
    client_id: clientId || null,
    melding,
    stack: String(fout?.stack || '').slice(0, 4000),
    component_stack: String(info?.componentStack || '').slice(0, 4000),
    versie: APP_VERSIE || null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
  }).then(r => r, () => {})
}

export default class PaginaVangnet extends Component {
  constructor(props) {
    super(props)
    this.state = { fout: null, poging: 0 }
  }

  static getDerivedStateFromError(fout) {
    return { fout }
  }

  componentDidCatch(fout, info) {
    console.error(`Fout op pagina ${this.props.pagina}:`, fout, info?.componentStack)
    meldFout(fout, info, this.props.pagina, this.props.clientId)
  }

  render() {
    const { fout, poging } = this.state
    if (!fout) return <div key={poging} style={{ display: 'contents' }}>{this.props.children}</div>

    const knop = (vol) => ({
      height: 44, padding: '0 1.1rem', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: '0.92rem', fontWeight: 900,
      background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff',
      border: vol ? 'none' : '1px solid rgba(255,255,255,0.2)',
    })
    return (
      <div role="alert" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '2rem 1.25rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Hier ging iets mis</div>
        <div style={{ maxWidth: 320, fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          Probeer het opnieuw. We hebben de fout doorgekregen en gaan ermee aan de slag.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" style={knop(true)} onClick={() => this.setState({ fout: null, poging: poging + 1 })}>Opnieuw proberen</button>
          <button type="button" style={knop(false)} onClick={() => window.location.reload()}>App herladen</button>
        </div>
      </div>
    )
  }
}

// Fouten buiten het tekenen: in een klik, een timer of een mislukte belofte.
// Die geven geen foutscherm (de app draait door), maar het knopje deed dan
// niets. Ook die willen we zien. Ruis eruit: browsermeldingen zonder inhoud
// en de bekende ResizeObserver-melding.
let geinstalleerd = false
// eslint-disable-next-line react-refresh/only-export-components
export function installeerFoutvanger() {
  if (geinstalleerd || typeof window === 'undefined') return
  geinstalleerd = true
  const ruis = (m) => !m || m === 'Script error.' || /ResizeObserver loop/i.test(m)
  const meld = (fout, soort) => {
    const melding = String(fout?.message || fout || '')
    if (ruis(melding)) return
    meldFout(fout, null, `${soort}:${foutContext.pagina || window.location.pathname}`, foutContext.clientId)
  }
  window.addEventListener('error', (e) => meld(e.error || e.message, 'los'))
  window.addEventListener('unhandledrejection', (e) => meld(e.reason, 'belofte'))
}
