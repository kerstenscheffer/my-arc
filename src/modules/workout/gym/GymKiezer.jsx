// src/modules/workout/gym/GymKiezer.jsx
//
// Waar train je vandaag? Staat in de kop van de training, naast "% klaar".
//
// Dicht is het één woord: de naam van de sportschool waar je nu staat. Klik je
// erop, dan klap je je lijst open en wissel je met één tik. Beheren gebeurt in
// een eigen venster, zodat de lijst zelf kort blijft.
//
// Waarom hier en niet in de instellingen: je merkt pas dat je ergens anders
// staat op het moment dat je het eerste gewicht invult.

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Check, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { haalGyms, kiesGym, bewaarGym, verwijderGym, eenheidLabel } from './GymService'

const LIJN = 'rgba(255,255,255,0.12)'

export default function GymKiezer({ db, client, isMobile }) {
  const [gyms, setGyms] = useState([])
  const [actiefId, setActiefId] = useState(null)
  const [open, setOpen] = useState(false)
  const [beheer, setBeheer] = useState(false)

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id) return
    const { gyms: lijst, actiefId: id } = await haalGyms(db, client.id)
    setGyms(lijst)
    setActiefId(id)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  const actief = gyms.find(g => g.id === actiefId) || null

  const wissel = async (gym) => {
    setActiefId(gym.id)
    setOpen(false)
    const { error } = await kiesGym(db, client.id, gym.id)
    if (error) { alert(`Wisselen mislukt: ${error}`); laad() }
  }

  // Niets ingesteld: één zachte uitnodiging in plaats van een lege dropdown.
  if (gyms.length === 0) {
    return (
      <>
        <Knop onClick={() => setBeheer(true)} isMobile={isMobile}>
          Sportschool
        </Knop>
        {beheer && (
          <GymBeheer
            db={db} client={client} gyms={gyms} isMobile={isMobile}
            onSluit={() => setBeheer(false)} onGewijzigd={laad}
          />
        )}
      </>
    )
  }

  return (
    <>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <Knop onClick={() => setOpen(v => !v)} isMobile={isMobile} aan={open}>
          {actief?.naam || 'Sportschool'}
          {actief?.eenheid === 'lb' && (
            <span style={{ opacity: 0.6, fontWeight: 800 }}> · lb</span>
          )}
        </Knop>

        {open && (
          <>
            {/* Klik ernaast sluit; zonder dit blijft hij openstaan zodra je
                ergens anders in de kop tikt. */}
            <span
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            />
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 41,
              minWidth: 190, background: '#111', border: `1px solid ${LIJN}`,
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            }}>
              {gyms.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => wissel(g)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '0.6rem 0.75rem', textAlign: 'left',
                    background: g.id === actiefId ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: 'none', borderTop: i > 0 ? `1px solid ${LIJN}` : 'none',
                    color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.naam}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                    {eenheidLabel(g.eenheid)}
                  </span>
                  {g.id === actiefId && <Check size={14} strokeWidth={3} color="#10b981" style={{ flexShrink: 0 }} />}
                </button>
              ))}
              <button
                onClick={() => { setOpen(false); setBeheer(true) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  padding: '0.6rem 0.75rem', textAlign: 'left',
                  background: 'transparent', border: 'none', borderTop: `1px solid ${LIJN}`,
                  color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 800,
                  fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={14} strokeWidth={2.8} /> Beheren
              </button>
            </div>
          </>
        )}
      </span>

      {beheer && (
        <GymBeheer
          db={db} client={client} gyms={gyms} isMobile={isMobile}
          onSluit={() => setBeheer(false)} onGewijzigd={laad}
        />
      )}
    </>
  )
}

function Knop(props) {
  const { children, onClick, isMobile, aan } = props
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 7px', borderRadius: 7,
        background: aan ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${aan ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
        color: '#fff', fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 800,
        fontFamily: 'inherit', cursor: 'pointer', maxWidth: 170,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        textShadow: 'none',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MapPin size={11} strokeWidth={2.8} style={{ flexShrink: 0, opacity: 0.7 }} />
      {children}
    </button>
  )
}

// ── Beheren ───────────────────────────────────────────────────────────────

function GymBeheer({ db, client, gyms, isMobile, onSluit, onGewijzigd }) {
  const [naam, setNaam] = useState('')
  const [eenheid, setEenheid] = useState('kg')
  const [bewerkt, setBewerkt] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const leeg = () => { setNaam(''); setEenheid('kg'); setBewerkt(null); setFout(null) }

  const bewaar = async () => {
    setBezig(true); setFout(null)
    const { error } = await bewaarGym(db, { id: bewerkt, clientId: client.id, naam, eenheid })
    setBezig(false)
    if (error) { setFout(error); return }
    leeg()
    await onGewijzigd()
  }

  const wis = async (gym) => {
    if (!window.confirm(`${gym.naam} verwijderen?`)) return
    const { error } = await verwijderGym(db, gym.id)
    if (error) { setFout(error); return }
    if (bewerkt === gym.id) leeg()
    await onGewijzigd()
  }

  const veld = {
    width: '100%', minHeight: 44, padding: '0 0.75rem',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`, borderRadius: 10,
    color: '#fff', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 10060, background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto',
        background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: 16,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem', borderBottom: `1px solid ${LIJN}`,
        }}>
          <MapPin size={15} color="#fff" strokeWidth={2.6} />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Sportscholen
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>

        {gyms.length > 0 && (
          <div>
            {gyms.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: isMobile ? '0.7rem 1rem' : '0.75rem 1.25rem',
                borderBottom: `1px solid ${LIJN}`,
              }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.naam}
                </span>
                <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>
                  {eenheidLabel(g.eenheid)}
                </span>
                <button
                  onClick={() => { setBewerkt(g.id); setNaam(g.naam); setEenheid(g.eenheid); setFout(null) }}
                  aria-label={`${g.naam} aanpassen`}
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Pencil size={14} strokeWidth={2.6} />
                </button>
                <button
                  onClick={() => wis(g)}
                  aria-label={`${g.naam} verwijderen`}
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Trash2 size={14} strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: isMobile ? '1rem' : '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {bewerkt ? 'Aanpassen' : 'Nieuwe sportschool'}
          </div>

          <input
            value={naam}
            onChange={e => setNaam(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') bewaar() }}
            placeholder="Naam, bijvoorbeeld Basic-Fit Centrum"
            style={veld}
          />

          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
              Gewichten in
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['kg', 'lb'].map(e => (
                <button
                  key={e}
                  onClick={() => setEenheid(e)}
                  style={{
                    flex: 1, minHeight: 42, borderRadius: 10,
                    background: eenheid === e ? '#fff' : 'transparent',
                    border: `1px solid ${eenheid === e ? '#fff' : LIJN}`,
                    color: eenheid === e ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {e === 'kg' ? 'Kilo' : 'Pond (lb)'}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              Je voert in en leest terug in deze eenheid. Opgeslagen wordt altijd in kilo, zodat je
              grafieken kloppen als je wisselt.
            </div>
          </div>

          {fout && <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>{fout}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            {bewerkt && (
              <button onClick={leeg} style={{
                flex: 1, minHeight: 44, borderRadius: 10, background: 'transparent',
                border: `1px solid ${LIJN}`, color: 'rgba(255,255,255,0.6)',
                fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
              }}>
                Annuleren
              </button>
            )}
            <button onClick={bewaar} disabled={bezig || !naam.trim()} style={{
              flex: 2, minHeight: 44, borderRadius: 10, border: 'none',
              background: (bezig || !naam.trim()) ? 'rgba(255,255,255,0.1)' : '#fff',
              color: (bezig || !naam.trim()) ? 'rgba(255,255,255,0.4)' : '#0a0a0a',
              fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: (bezig || !naam.trim()) ? 'default' : 'pointer',
            }}>
              {bezig ? 'Opslaan…' : bewerkt ? 'Bewaren' : 'Toevoegen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
