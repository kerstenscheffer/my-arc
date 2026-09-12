// src/coach/pages/CoachChallengeHub.jsx
//
// Eén scherm om alle challenge-deelnemers tegelijk te zien: een dichte tabel
// met per persoon de zes eisen en of het geld terugkomt. Klik een rij aan voor
// de details van die persoon.
//
// Verving een scherm dat één klant tegelijk toonde: een rode kiezer, een rij
// emoji-tabs en een banner die dezelfde zes getallen nog eens herhaalde. Met
// twintig deelnemers moest je twintig keer klikken om te zien wie achterloopt.
//
// De tabs Goals en Adjust zijn weg. Beide hingen aan challenge_assignment_goals
// (drie rijen uit oktober 2025) en Adjust liet je tellers met de hand bijstellen
// — een tweede waarheid naast get_challenge_stand, precies waar dit systeem aan
// kapot ging.

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, X, Pause, Play, AlertTriangle, Check, Search, Info } from 'lucide-react'
import WorkoutProgressView from './challenge-monitor/WorkoutProgressView'
import MealProgressView from './challenge-monitor/MealProgressView'
import WeightProgressView from './challenge-monitor/WeightProgressView'
import PhotoProgressView from './challenge-monitor/PhotoProgressView'
import LastActivityView from './challenge-monitor/LastActivityView'
import {
  EISEN, SOORTEN, ALGEMENE_UITLEG, waardenUit, allesGehaald, naloopGrens, tijdlijn,
} from '../../modules/challenge-monitor/challengeEisen'

const GROEN = '#10b981'
const ROOD = '#ef4444'
const LIJN = '1px solid rgba(255,255,255,0.07)'

const TABS = [
  { id: 'workouts', label: 'Workouts' },
  { id: 'voeding',  label: 'Voeding' },
  { id: 'gewicht',  label: 'Gewicht' },
  { id: 'fotos',    label: "Foto's" },
  { id: 'activiteit', label: 'Activiteit' },
]

export default function CoachChallengeHub({ db, clients }) {
  const isMobile = window.innerWidth <= 768

  const [rijen, setRijen] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)

  // Eigen klantenlijst: de clients-prop komt van CoachHub, die hem één keer
  // ophaalt en vijf minuten cachet — een net aangemaakte klant stond er niet in.
  const [klanten, setKlanten] = useState(clients || [])
  const [toonToewijzen, setToonToewijzen] = useState(false)
  const [soort, setSoort] = useState(SOORTEN[0].key)
  const [startDatum, setStartDatum] = useState(() => new Date().toISOString().split('T')[0])
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)
  const [bevestigStop, setBevestigStop] = useState(null)
  const [zoek, setZoek] = useState('')
  const [toonUitleg, setToonUitleg] = useState(false)

  const [open, setOpen] = useState(null)      // client_id van de opengeklapte rij
  const [tab, setTab] = useState('workouts')
  const [pauzeBezig, setPauzeBezig] = useState(false)

  useEffect(() => { laadKlanten(); laadRijen() }, [])
  useEffect(() => { if (toonToewijzen) laadKlanten() }, [toonToewijzen])

  async function laadKlanten() {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const { data, error } = await db.supabase
        .from('clients')
        .select('id, first_name, last_name, email, status')
        .eq('trainer_id', user.id)
        .eq('status', 'active')
        .order('first_name', { ascending: true })
      if (error) throw error
      setKlanten(data || [])
    } catch (e) {
      console.error('Klanten laden mislukt:', e)
    }
  }

  async function laadRijen() {
    setLaden(true); setFout(null)
    try {
      const { data: deelnames, error } = await db.supabase
        .from('challenge_assignments')
        .select('id, client_id, challenge_type, start_date, end_date, is_paused, pause_reason, clients(first_name, last_name)')
        .eq('is_active', true)
        .gte('end_date', naloopGrens())
        .order('start_date', { ascending: false })
      if (error) throw error

      // Per deelnemer de stand over zíjn eigen periode: mensen starten niet op
      // dezelfde dag, en bij een pauze schuift de einddatum op.
      const uit = []
      for (const d of deelnames || []) {
        const { data: stand } = await db.supabase.rpc('get_challenge_stand', {
          p_client_id: d.client_id, p_start: d.start_date, p_eind: d.end_date,
        })
        uit.push({ ...d, naam: `${d.clients?.first_name || ''} ${d.clients?.last_name || ''}`.trim() || 'Onbekend', stand: stand || null })
      }
      setRijen(uit)
    } catch (e) {
      console.error('Challenge-standen laden mislukt:', e)
      setFout(e.message || String(e))
    }
    setLaden(false)
  }

  async function wijsToe(clientId) {
    if (bezig) return
    setMelding(null); setBezig(true)
    try {
      const gekozen = SOORTEN.find(s => s.key === soort) || SOORTEN[0]
      // Einddatum uit de looptijd, op middernacht lokaal gerekend: met een
      // tijdstip erin verspringt de datum bij het omzetten naar ISO.
      const eind = new Date(`${startDatum}T00:00:00`)
      eind.setDate(eind.getDate() + gekozen.dagen - 1)
      const user = await db.getCurrentUser()

      const { error } = await db.supabase.from('challenge_assignments').insert({
        client_id: clientId,
        coach_id: user?.id,
        challenge_type: gekozen.key,
        start_date: startDatum,
        end_date: `${eind.getFullYear()}-${String(eind.getMonth() + 1).padStart(2, '0')}-${String(eind.getDate()).padStart(2, '0')}`,
        is_active: true,
      })
      if (error) throw error
      setMelding({ goed: true, tekst: 'Toegewezen.' })
      await laadRijen()
    } catch (e) {
      console.error('Toewijzen mislukt:', e)
      setMelding({ goed: false, tekst: `Toewijzen mislukt — ${e.message}` })
    }
    setBezig(false)
  }

  async function stopDeelname(deelnameId) {
    // Twee klikken in de knop zelf in plaats van confirm(): een browserdialoog
    // legt het hele tabblad stil tot iemand klikt.
    if (bevestigStop !== deelnameId) { setBevestigStop(deelnameId); return }
    setBevestigStop(null); setMelding(null); setBezig(true)
    try {
      // .select() erbij en tellen wat er terugkomt: een update die door RLS
      // wordt tegengehouden komt terug als 204 zonder fout.
      const { data, error } = await db.supabase
        .from('challenge_assignments')
        .update({ is_active: false })
        .eq('id', deelnameId)
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        setMelding({ goed: false, tekst: 'Niet gestopt — er is niets aangepast. Waarschijnlijk mag je deze deelname niet wijzigen.' })
      } else {
        setMelding({ goed: true, tekst: 'Deelname gestopt.' })
        setOpen(null)
        await laadRijen()
      }
    } catch (e) {
      console.error('Stoppen mislukt:', e)
      setMelding({ goed: false, tekst: `Stoppen mislukt — ${e.message}` })
    }
    setBezig(false)
  }

  async function wisselPauze(rij) {
    if (pauzeBezig) return
    setPauzeBezig(true)
    try {
      if (rij.is_paused) {
        await db.resumeChallenge(rij.id)
      } else {
        const user = await db.getCurrentUser()
        await db.pauseChallenge(rij.id, 'Gepauzeerd door coach', user?.email || 'Coach')
      }
      await laadRijen()
    } catch (e) {
      console.error('Pauze wisselen mislukt:', e)
      setMelding({ goed: false, tekst: `Pauzeren mislukt — ${e.message}` })
    }
    setPauzeBezig(false)
  }

  const meedoen = new Set(rijen.map(r => r.client_id))
  const zoekterm = zoek.trim().toLowerCase()
  const gevonden = zoekterm
    ? klanten.filter(k => `${k.first_name} ${k.last_name} ${k.email}`.toLowerCase().includes(zoekterm))
    : klanten
  const halenHet = rijen.filter(r => allesGehaald(r.stand)).length
  const geopend = rijen.find(r => r.client_id === open) || null

  const kop = {
    padding: isMobile ? '0.5rem 0.45rem' : '0.55rem 0.7rem',
    textAlign: 'center', color: 'rgba(255,255,255,0.5)',
    fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  }
  const cel = {
    padding: isMobile ? '0.6rem 0.45rem' : '0.7rem',
    textAlign: 'center', fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem', paddingBottom: isMobile ? 100 : 40 }}>

      {/* Kop: titel, stand in één regel, en de enige primaire actie */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Challenge
          </div>
          {/* Zelfde gebaar als bij de lead-stats: tik op ⓘ en de uitleg klapt
              open. De klant ziet dezelfde teksten bij zijn eigen stand, zodat
              jullie hetzelfde verhaal hebben als iemand belt over een getal. */}
          <button onClick={() => setToonUitleg(v => !v)} title="Hoe worden deze getallen geteld?"
            aria-label="Uitleg" aria-expanded={toonUitleg}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, padding: 0, background: 'none', border: 'none',
              cursor: 'pointer', color: toonUitleg ? '#FFD700' : 'rgba(255,255,255,0.35)',
            }}>
            <Info size={15} />
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
          {rijen.length} {rijen.length === 1 ? 'deelnemer' : 'deelnemers'}
          {rijen.length > 0 && <> · <span style={{ color: halenHet > 0 ? GROEN : 'rgba(255,255,255,0.45)' }}>{halenHet} haalt alles</span></>}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={laadRijen} title="Standen opnieuw ophalen" style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: LIJN, borderRadius: 10,
          color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
        }}>
          <RefreshCw size={15} />
        </button>
        <button onClick={() => setToonToewijzen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 0.9rem',
          background: toonToewijzen ? 'transparent' : '#fff',
          border: toonToewijzen ? LIJN : '1px solid #fff', borderRadius: 10,
          color: toonToewijzen ? 'rgba(255,255,255,0.7)' : '#000',
          fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {toonToewijzen ? <X size={15} /> : <Plus size={15} />}
          {toonToewijzen ? 'Sluiten' : 'Toewijzen'}
        </button>
      </div>

      {toonUitleg && (
        <div style={{
          borderTop: LIJN, borderBottom: LIJN, padding: '0.9rem 0', marginBottom: '1.1rem',
        }}>
          <div style={{
            fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.5, marginBottom: '0.9rem', maxWidth: 720,
          }}>
            {ALGEMENE_UITLEG}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '0.8rem 1.6rem',
          }}>
            {EISEN.map(e => (
              <div key={e.key}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                  {e.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>{e.nodig}/{e.van}</span>
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>
                  {e.info}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {melding && (
        <div style={{
          marginBottom: '0.8rem', fontSize: '0.85rem', fontWeight: 800,
          color: melding.goed ? GROEN : ROOD,
        }}>
          {melding.tekst}
        </div>
      )}

      {/* Toewijzen. Geen kader: een haarlijn boven en onder houdt het blok bij
          elkaar zonder er een doos van te maken. */}
      {toonToewijzen && (
        <div style={{ borderTop: LIJN, borderBottom: LIJN, padding: '0.9rem 0', marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <select value={soort} onChange={e => setSoort(e.target.value)} style={{
              flex: isMobile ? '1 1 100%' : '0 1 280px', height: 38, padding: '0 0.7rem',
              background: 'rgba(255,255,255,0.05)', border: LIJN, borderRadius: 10,
              color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              {SOORTEN.map(s => <option key={s.key} value={s.key} style={{ background: '#0a0a0a' }}>{s.naam} · {s.dagen} dagen</option>)}
            </select>
            <input type="date" value={startDatum} onChange={e => setStartDatum(e.target.value)}
              title="Startdatum — de einddatum volgt uit de looptijd"
              style={{
                flex: isMobile ? '1 1 100%' : '0 0 165px', height: 38, padding: '0 0.7rem',
                background: 'rgba(255,255,255,0.05)', border: LIJN, borderRadius: 10,
                color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit',
              }} />

            {/* Zoeken op naam of e-mail. Met vijftig klanten in vijf kolommen is
                scannen trager dan drie letters typen. */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              flex: isMobile ? '1 1 100%' : '1 1 200px', height: 38, padding: '0 0.7rem',
              background: 'rgba(255,255,255,0.05)', border: LIJN, borderRadius: 10,
            }}>
              <Search size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
              <input
                value={zoek}
                onChange={e => setZoek(e.target.value)}
                placeholder="Zoek klant"
                style={{
                  flex: 1, minWidth: 0, height: '100%',
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit',
                }} />
              {zoek && (
                <button onClick={() => setZoek('')} title="Wissen" style={{
                  background: 'transparent', border: 'none', padding: 0, display: 'flex',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0,
                }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '0 1.6rem',
          }}>
            {gevonden.map(k => {
              const doetMee = meedoen.has(k.id)
              return (
                <div key={k.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem',
                  padding: '0.5rem 0', borderBottom: LIJN, minWidth: 0,
                }}>
                  <div style={{
                    flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 800,
                    color: doetMee ? 'rgba(255,255,255,0.35)' : '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {k.first_name} {k.last_name}
                  </div>
                  {doetMee ? (
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: GROEN, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={13} strokeWidth={3} /> Doet mee
                    </span>
                  ) : (
                    <button onClick={() => wijsToe(k.id)} disabled={bezig} style={{
                      background: 'transparent', border: 'none', padding: '4px 0',
                      color: '#fff', fontSize: '0.82rem', fontWeight: 800,
                      cursor: bezig ? 'wait' : 'pointer', fontFamily: 'inherit',
                      textDecoration: 'underline', textUnderlineOffset: 3,
                    }}>
                      Toewijzen
                    </button>
                  )}
                </div>
              )
            })}
            {gevonden.length === 0 && (
              <div style={{ padding: '0.6rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                Geen klant gevonden voor "{zoek}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deelnemers */}
      {laden ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 700 }}>
          Standen ophalen…
        </div>
      ) : fout ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: ROOD, fontSize: '0.9rem', fontWeight: 700 }}>
          Laden mislukt — {fout}
        </div>
      ) : rijen.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 700 }}>
          Nog niemand doet mee. Klik op Toewijzen.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: LIJN }}>
                <th style={{ ...kop, textAlign: 'left' }}>Deelnemer</th>
                <th style={kop}>Dag</th>
                {EISEN.map(e => <th key={e.key} style={kop} title={e.uitleg}>{e.label}</th>)}
                <th style={{ ...kop, textAlign: 'right' }}>Geld terug</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map(r => {
                const w = waardenUit(r.stand)
                const gehaald = allesGehaald(r.stand)
                const onbepaald = r.stand?.workouts?.onbepaald || 0
                const t = tijdlijn(r)
                const isOpen = open === r.client_id
                return (
                  <tr key={r.id}
                      onClick={() => { setOpen(isOpen ? null : r.client_id); setTab('workouts') }}
                      style={{
                        borderBottom: LIJN, cursor: 'pointer',
                        background: isOpen ? 'rgba(255,255,255,0.045)' : 'transparent',
                      }}>
                    <td style={{ ...cel, textAlign: 'left', color: '#fff', fontWeight: 800 }}>
                      {r.naam}
                      {r.is_paused && <span style={{ color: '#f97316', fontSize: '0.7rem', marginLeft: 7 }}>PAUZE</span>}
                      {onbepaald > 0 && (
                        <span title={`${onbepaald} workout(s) zonder herleidbaar schema — niet meegeteld`}
                              style={{ marginLeft: 6, color: '#f59e0b', display: 'inline-flex', verticalAlign: 'middle' }}>
                          <AlertTriangle size={12} />
                        </span>
                      )}
                    </td>
                    <td style={{ ...cel, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                      {t.dag}<span style={{ color: 'rgba(255,255,255,0.22)' }}>/{t.totaal}</span>
                    </td>
                    {EISEN.map(e => {
                      const ok = w[e.key] >= e.nodig
                      return (
                        <td key={e.key} style={{ ...cel, color: ok ? GROEN : '#fff' }}>
                          {w[e.key]}<span style={{ color: 'rgba(255,255,255,0.25)' }}>/{e.nodig}</span>
                        </td>
                      )
                    })}
                    <td style={{ ...cel, textAlign: 'right', color: gehaald ? GROEN : 'rgba(255,255,255,0.35)' }}>
                      {gehaald ? 'JA' : 'NEE'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rijen.length > 0 && (
        <div style={{ marginTop: '0.7rem', fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
          Klik een rij aan voor de details. De telregels staan achter de ⓘ bovenaan.
        </div>
      )}

      {/* Detail van één deelnemer, onder de tabel */}
      {geopend && (
        <div style={{ marginTop: isMobile ? '1.4rem' : '1.8rem', borderTop: LIJN, paddingTop: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
              {geopend.naam}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              dag {tijdlijn(geopend).dag} van {tijdlijn(geopend).totaal}
              {geopend.is_paused && <span style={{ color: '#f97316' }}> · gepauzeerd{geopend.pause_reason ? ` (${geopend.pause_reason})` : ''}</span>}
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => wisselPauze(geopend)} disabled={pauzeBezig} style={{
              display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 0.7rem',
              background: 'transparent', border: LIJN, borderRadius: 9,
              color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 800,
              cursor: pauzeBezig ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>
              {geopend.is_paused ? <Play size={13} /> : <Pause size={13} />}
              {geopend.is_paused ? 'Hervatten' : 'Pauzeren'}
            </button>
            <button onClick={() => stopDeelname(geopend.id)} disabled={bezig}
              onBlur={() => setBevestigStop(v => (v === geopend.id ? null : v))}
              style={{
                height: 32, padding: '0 0.7rem',
                background: bevestigStop === geopend.id ? ROOD : 'transparent',
                border: bevestigStop === geopend.id ? `1px solid ${ROOD}` : LIJN, borderRadius: 9,
                color: bevestigStop === geopend.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '0.78rem', fontWeight: 800,
                cursor: bezig ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}>
              {bevestigStop === geopend.id ? 'Zeker weten?' : 'Stoppen'}
            </button>
            <button onClick={() => setOpen(null)} title="Sluiten" style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: LIJN, borderRadius: 9,
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Tabs als platte tekst met een onderstreping. Geen gekleurde
              knoppenrij: die nam een hele band in beslag voor navigatie. */}
          <div style={{ display: 'flex', gap: isMobile ? '1rem' : '1.4rem', overflowX: 'auto', marginBottom: '1.1rem' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: 'transparent', border: 'none', padding: '0 0 7px', flexShrink: 0,
                borderBottom: tab === t.id ? '2px solid #fff' : '2px solid transparent',
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '0.86rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'workouts'   && <WorkoutProgressView client={{ id: geopend.client_id }} db={db} challengeData={geopend} />}
          {tab === 'voeding'    && <MealProgressView    client={{ id: geopend.client_id }} db={db} challengeData={geopend} />}
          {tab === 'gewicht'    && <WeightProgressView  client={{ id: geopend.client_id }} db={db} challengeData={{ ...geopend, totalWeeks: Math.ceil(tijdlijn(geopend).totaal / 7), currentWeek: Math.ceil(tijdlijn(geopend).dag / 7) }} />}
          {tab === 'fotos'      && <PhotoProgressView   client={{ id: geopend.client_id }} db={db} challengeData={{ ...geopend, totalWeeks: Math.ceil(tijdlijn(geopend).totaal / 7) }} />}
          {tab === 'activiteit' && <LastActivityView    client={{ id: geopend.client_id }} db={db} challengeData={geopend} />}
        </div>
      )}
    </div>
  )
}
