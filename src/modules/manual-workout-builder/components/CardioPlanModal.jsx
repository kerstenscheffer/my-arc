// src/modules/manual-workout-builder/components/CardioPlanModal.jsx
//
// Cardio inplannen voor een klant vanuit de Workout Builder, los van het
// krachtschema. Schrijft precies wat de klant zelf via "Training toevoegen"
// schrijft (CardioService.planBlokken): een blok per dag in zijn agenda met
// sport, tijd en duur, dat hij in zijn weekrooster ziet en logt op duur,
// intensiteit en afstand. Hyrox en CrossFit zitten in dezelfde lijst: een
// training als blok, zonder losse oefeningen (8 okt 2026).
//
// Eerder bewaarde dit venster alleen "x keer per week" in client_cardio_plan;
// dat plan wordt nu afgeleid van de vaste blokken.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Heart, Check, CalendarDays, Repeat } from 'lucide-react'
import CardioService from '../../workout/services/CardioService'
import { CARDIO_SOORTEN, DAGEN_WEEK } from '../../workout/cardioSoorten'
import { cardioFoto } from '../../workout/utils/workoutFoto'

const DAG_KORT = Object.fromEntries(DAGEN_WEEK.map(d => [d.id.toLowerCase(), d.kort]))
const DAG_VOLGORDE = DAGEN_WEEK.map(d => d.id.toLowerCase())

export default function CardioPlanModal({ client, db, isMobile, onClose }) {
  const m = isMobile
  const [blokken, setBlokken] = useState([])
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [nieuwOpen, setNieuwOpen] = useState(false)
  const [soort, setSoort] = useState(null)
  const [dagen, setDagen] = useState([])
  const [tijd, setTijd] = useState('18:00')
  const [duur, setDuur] = useState(30)
  const [bereik, setBereik] = useState('standaard')
  const [notitie, setNotitie] = useState('')
  // Dieper plannen (9 okt 2026): eigen sport, tijd per dag, intensiteit, afstand.
  const [eigenSoort, setEigenSoort] = useState('')
  const [tijdPerDag, setTijdPerDag] = useState({})
  const [intensiteit, setIntensiteit] = useState(null)
  const [afstand, setAfstand] = useState('')
  const INTENSITEITEN = [{ id: 'rustig', label: 'Rustig', sub: 'zone 2, praten kan' }, { id: 'gemiddeld', label: 'Gemiddeld', sub: 'stevig, korte zinnen' }, { id: 'pittig', label: 'Pittig', sub: 'intervallen, buiten adem' }, { id: 'vol_gas', label: 'Vol gas', sub: 'maximaal' }]
  const gekozenSoort = soort === '__eigen' ? eigenSoort.trim() : soort
  const dezeWeek = CardioService.maandagIso()

  const laad = async () => {
    setLaden(true)
    const lijst = await CardioService.getBlokken(client?.id, db, dezeWeek)
    setBlokken(lijst.sort((a, b) => DAG_VOLGORDE.indexOf(a.day) - DAG_VOLGORDE.indexOf(b.day) || String(a.tijd).localeCompare(String(b.tijd))))
    setLaden(false)
  }
  useEffect(() => { laad() }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const bewaar = async () => {
    if (!gekozenSoort || dagen.length === 0 || bezig) return
    setBezig(true)
    try {
      await CardioService.planBlokken({
        clientId: client.id, soort: gekozenSoort, duur: Number(duur) || 30, tijd, dagen, bereik, weekSleutel: dezeWeek,
        notitie: notitie.trim() || null, tijdPerDag, intensiteit, afstandKm: afstand ? Number(String(afstand).replace(',', '.')) || null : null,
      }, db)
      setNieuwOpen(false); setSoort(null); setEigenSoort(''); setDagen([]); setNotitie(''); setTijdPerDag({}); setIntensiteit(null); setAfstand('')
      await laad()
    } catch (e) { alert('Opslaan mislukt: ' + (e?.message || 'onbekende fout')) }
    finally { setBezig(false) }
  }

  const weg = async (blok) => {
    setBlokken(prev => prev.filter(b => b.id !== blok.id))
    const ok = await CardioService.verwijderBlok(client.id, blok, db)
    if (!ok) await laad()
  }

  // Vaste blokken per sport bij elkaar: één regel met de dagen als chips.
  const vast = blokken.filter(b => !b.week_start)
  const eenmalig = blokken.filter(b => !!b.week_start)
  const perSoort = [...new Set(vast.map(b => b.soort))].map(s => ({ soort: s, blokken: vast.filter(b => b.soort === s) }))

  const chip = (aan, extra = {}) => ({
    padding: '0.4rem 0.7rem', borderRadius: 9, border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
    background: aan ? '#fff' : 'rgba(255,255,255,0.04)', color: aan ? '#0a0a0a' : '#fff',
    fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...extra,
  })

  const Regel = ({ titel, sub, foto, dagenChips, onWeg, eenmaligWeek }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titel}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{sub}</div>
        {dagenChips && <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>{dagenChips}</div>}
        {eenmaligWeek && <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#06b6d4', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alleen week van {eenmaligWeek}</div>}
      </div>
      {onWeg && (
        <button onClick={onWeg} aria-label="Verwijder" style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 9, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )

  const fmtWeek = (iso) => { try { return new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return iso } }

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div style={{
        background: '#0a0a0a', width: '100%', maxWidth: 600, maxHeight: '90vh',
        borderRadius: m ? '16px 16px 0 0' : 14, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Heart size={16} color="#f87171" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>Cardio inplannen</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {`${client?.first_name || ''} ${client?.last_name || ''}`.trim() || 'Klant'} · komt in zijn weekrooster
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {laden ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
          ) : (
            <>
              {blokken.length === 0 && !nieuwOpen && (
                <div style={{ padding: '1.25rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                  Nog geen cardio ingepland. Wat je hier zet, staat bij de klant op de dag in zijn weekrooster, met een logknop.
                </div>
              )}

              {perSoort.length > 0 && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elke week</div>}
              {perSoort.map(g => (
                <Regel key={g.soort} titel={g.soort} foto={cardioFoto(g.soort)}
                  sub={[`${g.blokken.length}× per week · ${g.blokken[0]?.duur || '–'} min`, g.blokken.find(b => b.sublabel)?.sublabel].filter(Boolean).join(' · ')}
                  dagenChips={g.blokken.map(b => (
                    <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.66rem', fontWeight: 900, color: '#fff' }}>
                      {DAG_KORT[b.day] || b.day} {b.tijd}
                      <button onClick={() => weg(b)} aria-label={`${DAG_KORT[b.day]} weghalen`} style={{ padding: 0, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}><X size={11} strokeWidth={3} /></button>
                    </span>
                  ))}
                />
              ))}

              {eenmalig.length > 0 && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>Eenmalig</div>}
              {eenmalig.map(b => (
                <Regel key={b.id} titel={b.soort} foto={cardioFoto(b.soort)}
                  sub={[`${DAG_KORT[b.day] || b.day} · ${b.tijd}${b.duur ? ` · ${b.duur} min` : ''}`, b.sublabel].filter(Boolean).join(' · ')}
                  eenmaligWeek={fmtWeek(b.week_start)} onWeg={() => weg(b)} />
              ))}

              {nieuwOpen ? (
                <div style={{ marginTop: 6, padding: '0.85rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={labelStijl}>Sport</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {CARDIO_SOORTEN.map(s => {
                        const Icoon = s.icoon
                        return <button key={s.id} onClick={() => setSoort(s.id)} style={chip(soort === s.id)}><Icoon size={14} strokeWidth={2.4} />{s.id}</button>
                      })}
                      <button onClick={() => setSoort('__eigen')} style={chip(soort === '__eigen')}><Plus size={14} strokeWidth={2.6} />Eigen…</button>
                    </div>
                    {soort === '__eigen' && (
                      <input autoFocus value={eigenSoort} onChange={e => setEigenSoort(e.target.value)} placeholder="Naam van de sport, bv. Boksen of Tennis" style={{ ...veld, marginTop: 8 }} />
                    )}
                  </div>
                  <div>
                    <div style={labelStijl}>Dagen</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                      {DAGEN_WEEK.map(d => {
                        const aan = dagen.includes(d.id)
                        return <button key={d.id} onClick={() => setDagen(l => aan ? l.filter(x => x !== d.id) : [...l, d.id])} style={chip(aan, { justifyContent: 'center', padding: '0.5rem 0' })}>{d.kort}</button>
                      })}
                    </div>
                    {/* Per gekozen dag een eigen tijd; leeg = de tijd hieronder. */}
                    {dagen.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {DAGEN_WEEK.filter(d => dagen.includes(d.id)).map(d => (
                          <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.3rem 0.25rem 0.6rem', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', fontWeight: 900, color: '#fff' }}>
                            {d.kort}
                            <input type="time" value={tijdPerDag[d.id.toLowerCase()] || tijd} onChange={e => setTijdPerDag(m => ({ ...m, [d.id.toLowerCase()]: e.target.value }))} style={{ ...veld, width: 96, padding: '0.3rem 0.4rem', fontSize: '0.78rem' }} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={labelStijl}>Tijd</div>
                      <input type="time" value={tijd} onChange={e => setTijd(e.target.value)} style={veld} />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={labelStijl}>Duur (min)</div>
                      <input type="number" inputMode="numeric" min={5} step={5} value={duur} onChange={e => setDuur(e.target.value)} style={veld} />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={labelStijl}>Afstand (km, optioneel)</div>
                      <input type="text" inputMode="decimal" value={afstand} onChange={e => setAfstand(e.target.value)} placeholder="bv. 5" style={veld} />
                    </div>
                  </div>
                  <div>
                    <div style={labelStijl}>Intensiteit</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {INTENSITEITEN.map(i => (
                        <button key={i.id} onClick={() => setIntensiteit(intensiteit === i.id ? null : i.id)} style={chip(intensiteit === i.id, { flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '0.45rem 0.6rem' })}>
                          <span>{i.label}</span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.6 }}>{i.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelStijl}>Waar geldt dit</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button onClick={() => setBereik('standaard')} style={chip(bereik === 'standaard', { justifyContent: 'center', padding: '0.6rem' })}><Repeat size={14} strokeWidth={2.4} /> Elke week</button>
                      <button onClick={() => setBereik('eenmalig')} style={chip(bereik === 'eenmalig', { justifyContent: 'center', padding: '0.6rem' })}><CalendarDays size={14} strokeWidth={2.4} /> Alleen deze week</button>
                    </div>
                  </div>
                  <input value={notitie} onChange={e => setNotitie(e.target.value)} placeholder="Notitie voor de klant (optioneel, bv. zone 2)" style={veld} />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button onClick={() => setNieuwOpen(false)} style={{ ...knop, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>Annuleren</button>
                    <button onClick={bewaar} disabled={bezig || !gekozenSoort || dagen.length === 0} style={{ ...knop, opacity: (bezig || !gekozenSoort || dagen.length === 0) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} strokeWidth={3} /> {bezig ? 'Opslaan…' : `Inplannen${dagen.length ? ` (${dagen.length}×)` : ''}`}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setNieuwOpen(true)} style={{ ...knop, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.65rem', marginTop: 6 }}>
                  <Plus size={15} strokeWidth={2.8} /> Cardio inplannen
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

const labelStijl = { fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

const veld = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 700,
  fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
}

const knop = {
  padding: '0.45rem 0.9rem', borderRadius: 8, border: 'none',
  background: '#fff', color: '#0a0a0a',
  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
