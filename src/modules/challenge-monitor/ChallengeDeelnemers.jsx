// src/modules/challenge-monitor/ChallengeDeelnemers.jsx
//
// Alle challenge-deelnemers in één tabel: per persoon de zes tellers en of het
// geld terugkomt. De bestaande hub is per klant — je moest dus zeven keer
// klikken om te zien wie achterloopt.
//
// De getallen komen uit de RPC get_challenge_stand, dezelfde functie die de
// klant straks op zijn eigen scherm ziet. Niet hier optellen: dan krijg je
// twee waarheden over geld.

import { useEffect, useState } from 'react'
import { Trophy, RefreshCw, AlertTriangle } from 'lucide-react'
import { EISEN, waardenUit, naloopGrens } from './challengeEisen'

const GOUD = '#FFD700'
const GROEN = '#10b981'
const ROOD = '#ef4444'

export default function ChallengeDeelnemers({ db, isMobile, onSelectClient }) {
  const [rijen, setRijen] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)

  const laad = async () => {
    setLaden(true); setFout(null)
    try {
      // Alleen challenges die nog lopen of net zijn afgelopen. In de tabel
      // staan nog vier deelnames uit 2025 die niemand ooit heeft afgesloten;
      // die horen niet tussen de mensen wier geld nu op het spel staat. Twee
      // weken naloop, want de uitbetaling gebeurt na de einddatum.
      const { data: deelnames, error } = await db.supabase
        .from('challenge_assignments')
        .select('id, client_id, challenge_type, start_date, end_date, is_active, is_paused, clients(first_name, last_name)')
        .eq('is_active', true)
        .gte('end_date', naloopGrens())
        .order('start_date', { ascending: false })
      if (error) throw error

      // Per deelnemer de stand ophalen over ZIJN eigen periode — mensen starten
      // niet allemaal op dezelfde dag, en bij een pauze schuift de einddatum op.
      const uit = []
      for (const d of deelnames || []) {
        const { data: stand } = await db.supabase.rpc('get_challenge_stand', {
          p_client_id: d.client_id,
          p_start: d.start_date,
          p_eind: d.end_date,
        })
        uit.push({
          id: d.id,
          clientId: d.client_id,
          naam: `${d.clients?.first_name || ''} ${d.clients?.last_name || ''}`.trim() || 'Onbekend',
          gepauzeerd: d.is_paused,
          start: d.start_date,
          eind: d.end_date,
          stand: stand || null,
        })
      }
      setRijen(uit)
    } catch (e) {
      console.error('Challenge-deelnemers laden mislukt:', e)
      setFout(e.message || String(e))
    }
    setLaden(false)
  }

  useEffect(() => { laad() }, [])

  if (laden) return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Standen ophalen…</div>
  if (fout) return <div style={{ padding: '2rem', textAlign: 'center', color: ROOD }}>Laden mislukt — {fout}</div>
  if (rijen.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Nog geen actieve deelnemers.</div>

  const cel = { padding: isMobile ? '0.5rem 0.4rem' : '0.6rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: isMobile ? '0.72rem' : '0.78rem' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
        <div style={{ width: 3, height: isMobile ? 17 : 19, background: GOUD, borderRadius: 2 }} />
        <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.015em' }}>
          Deelnemers
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>· {rijen.length}</div>
        <div style={{ flex: 1 }} />
        <button onClick={laad} title="Standen opnieuw ophalen" style={{
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
        }}><RefreshCw size={14} /></button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr>
              <th style={{ ...cel, textAlign: 'left', color: 'rgba(255,255,255,0.45)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.06em' }}>Deelnemer</th>
              {EISEN.map(e => (
                <th key={e.key} style={{ ...cel, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                  {e.label}
                </th>
              ))}
              <th style={{ ...cel, textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.06em' }}>Geld terug</th>
            </tr>
          </thead>
          <tbody>
            {rijen.map(r => {
              const w = waardenUit(r.stand)
              const allesGehaald = EISEN.every(e => w[e.key] >= e.nodig)
              // Sessies waarvan de RPC het plan niet kon herleiden. Zichtbaar
              // maken: bij geld wil je weten dat een cijfer op onvolledige
              // gegevens rust, niet stilzwijgend een lager getal krijgen.
              const onbepaald = r.stand?.workouts?.onbepaald || 0
              return (
                <tr key={r.id}
                    onClick={() => onSelectClient?.(r.clientId)}
                    style={{ cursor: onSelectClient ? 'pointer' : 'default' }}>
                  <td style={{ ...cel, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                    {r.naam}
                    {r.gepauzeerd && <span style={{ color: '#f97316', fontSize: '0.62rem', fontWeight: 800, marginLeft: 6 }}>PAUZE</span>}
                    {onbepaald > 0 && (
                      <span title={`${onbepaald} workout(s) zonder herleidbaar schema — niet meegeteld`}
                            style={{ marginLeft: 6, color: '#f59e0b', verticalAlign: 'middle', display: 'inline-flex' }}>
                        <AlertTriangle size={12} />
                      </span>
                    )}
                  </td>
                  {EISEN.map(e => {
                    const val = w[e.key]
                    const ok = val >= e.nodig
                    return (
                      <td key={e.key} style={{ ...cel, textAlign: 'center', color: ok ? GROEN : 'rgba(255,255,255,0.7)', fontWeight: ok ? 800 : 600, fontVariantNumeric: 'tabular-nums' }}>
                        {val}<span style={{ color: 'rgba(255,255,255,0.25)' }}>/{e.nodig}</span>
                      </td>
                    )
                  })}
                  <td style={{ ...cel, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      background: allesGehaald ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                      color: allesGehaald ? GROEN : ROOD,
                      fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {allesGehaald && <Trophy size={11} />} {allesGehaald ? 'Ja' : 'Nee'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '0.8rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
        Een workout telt bij 70% van de geplande sets, een voedingsdag bij 70%
        van de geplande maaltijden, en een week bij 5 geldige dagen. Klik een
        rij aan voor de details per soort.
      </div>
    </div>
  )
}
