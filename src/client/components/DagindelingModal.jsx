// src/client/components/DagindelingModal.jsx
//
// Het vaste frame van je week: hoe laat je slaapt, werkt, traint en eet.
//
// Waarom los van de agenda-sheet: daar verzet je één blok op één dag ("vandaag
// eet ik later"). Hier zet je wat élke week geldt. Dat zijn twee verschillende
// vragen, en ze door elkaar halen is precies hoe je per ongeluk je hele plan
// verzet omdat het één keer anders liep.
//
// Alles op dit scherm is staand: een wijziging geldt voor alle dagen waarop
// dat blok voorkomt. De uitzondering van vandaag blijft in de agenda zelf.

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Moon, Briefcase, Dumbbell, Utensils, ChevronRight, Trash2 } from 'lucide-react'
import {
  ClientAgendaService, DAYS, DAY_LABELS_NL_LONG, getMondayOf,
} from '../../modules/client-agenda/ClientAgendaService'
import TijdWiel from './TijdWiel'
import { tijdTekst } from './tijdHelpers'

const LIJN = 'rgba(255,255,255,0.08)'
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'

const SLOT_VOLGORDE = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']
const SLOT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Avondeten',
  snack1: 'Snack 1', snack2: 'Snack 2', snack3: 'Snack 3', pre_workout: 'Pre-workout',
}

// Duur van een blok, ook als het over middernacht loopt (slaap).
const duurVan = (start, eind) => (eind >= start ? eind - start : (24 * 60 - start) + eind)

export default function DagindelingModal({ client, db, service: serviceProp, isMobile = false, onSluit, onGewijzigd }) {
  const [service] = useState(() => serviceProp || new ClientAgendaService(db?.supabase || db))
  const [data, setData] = useState(null)
  const [laden, setLaden] = useState(true)
  const [bewerk, setBewerk] = useState(null)   // { sleutel, titel, start, eind, metEind, bewaar, verwijder }
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const laad = useCallback(async () => {
    if (!client?.id) return
    setLaden(true)
    try {
      const d = await service.loadWeek(client.id, getMondayOf(new Date()))
      setData(d)
    } catch (e) {
      console.error('Dagindeling laden mislukt:', e)
      setFout('Je week kon niet worden geladen')
    } finally {
      setLaden(false)
    }
  }, [service, client?.id])

  useEffect(() => { laad() }, [laad])

  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') (bewerk ? setBewerk(null) : onSluit?.()) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [bewerk, onSluit])

  const perDag = data?.blocksByDay || {}
  const blokkenVan = (type) => DAYS
    .map(dag => ({ dag, blok: (perDag[dag] || []).find(b => b.type === type) }))
    .filter(x => !!x.blok)

  // ── Slaap: één venster voor de hele week ──
  // De agenda knipt een nacht die over middernacht loopt in twee helften; de
  // echte tijden staan in meta.fullStart/fullEnd. Daar werken we mee, anders
  // zet je "naar bed" op 00:00.
  const slaapDagen = blokkenVan('sleep')
  const slaap = slaapDagen[0]?.blok
  const slaapStart = slaap ? (slaap.meta?.fullStart ?? slaap.start) : null
  const slaapEind = slaap ? (slaap.meta?.fullEnd ?? slaap.end) : null

  const bewaarSlaap = async (start, eind) => {
    const ids = {}
    slaapDagen.forEach(({ dag, blok }) => { ids[dag] = blok.dbId || null })
    // Ook dagen zonder slaapblok krijgen er een: je slaapt zeven nachten.
    DAYS.forEach(d => { if (!(d in ids)) ids[d] = null })
    await service.zetVastBlok({
      clientId: client.id, type: 'sleep', label: 'Slaap',
      startMin: start, endMin: eind % 1440, perDag: ids,
    })
  }

  // ── Werk en training: per dag, want die verschillen per dag ──
  const werkDagen = blokkenVan('work')
  const trainingDagen = blokkenVan('training')

  const bewaarDagBlok = (type, dag, blok) => async (start, eind) => {
    await service.zetVastBlok({
      clientId: client.id, type,
      label: blok?.label || (type === 'work' ? 'Werk' : 'Training'),
      sublabel: blok?.sublabel || null,
      startMin: start, endMin: eind % 1440,
      perDag: { [dag]: blok?.dbId || null },
    })
  }

  // ── Maaltijden: één tijd per slot, voor elke dag waarop hij staat ──
  const maaltijdSlots = (() => {
    const gezien = new Map()
    DAYS.forEach(dag => {
      (perDag[dag] || []).filter(b => b.type === 'meal').forEach(b => {
        const slot = b.meta?.slot
        if (!slot || gezien.has(slot)) return
        gezien.set(slot, { slot, start: b.start, eind: b.end, label: b.label || SLOT_LABEL[slot] || 'Maaltijd' })
      })
    })
    return [...gezien.values()].sort((a, b) => {
      const ia = SLOT_VOLGORDE.indexOf(a.slot); const ib = SLOT_VOLGORDE.indexOf(b.slot)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.start - b.start
    })
  })()

  const bewaarMaaltijd = (slot) => async (start) => {
    if (!data?.mealPlan?.id) throw new Error('Je hebt nog geen actief maaltijdplan')
    const geraakt = await service.zetMaaltijdtijdAlleDagen({ mealPlanId: data.mealPlan.id, slot, newStartMin: start })
    if (!geraakt) throw new Error('Deze maaltijd staat niet in je plan; laat je coach het plan opnieuw opslaan')
  }

  const voerUit = async (fn) => {
    setBezig(true); setFout(null)
    try {
      await fn()
      setBewerk(null)
      await laad()
      onGewijzigd?.()
    } catch (e) {
      console.error('Dagindeling opslaan mislukt:', e)
      setFout(e?.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  const rij = (sleutel, Icoon, titel, onder, tijden, opener) => (
    <button key={sleutel} onClick={opener} style={rijStijl}>
      <Icoon size={15} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{
          display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#fff',
          letterSpacing: '-0.015em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {titel}
        </span>
        {onder && (
          <span style={{
            display: 'block', fontSize: '0.62rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', marginTop: 1,
          }}>
            {onder}
          </span>
        )}
      </span>
      <span style={{
        fontSize: '0.8rem', fontWeight: 900, color: '#fff',
        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
      }}>
        {tijden}
      </span>
      <ChevronRight size={15} color="rgba(255,255,255,0.25)" strokeWidth={3} style={{ flexShrink: 0 }} />
    </button>
  )

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483090,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Kop */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: isMobile
          ? 'calc(env(safe-area-inset-top, 0px) + 0.9rem) 1rem 0.8rem'
          : '1.25rem 1.5rem 1rem',
        borderBottom: `1px solid ${LIJN}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em',
          }}>
            Mijn dagindeling
          </div>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 2,
          }}>
            Deze tijden gelden elke week. Eén dag anders? Dat doe je in de agenda zelf.
          </div>
        </div>
        <button onClick={onSluit} aria-label="Sluiten" style={kaal}>
          <X size={19} strokeWidth={3} />
        </button>
      </div>

      {/* Inhoud */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: isMobile ? '0.5rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' : '0.75rem 1.5rem 1.5rem',
      }}>
        {laden && (
          <div style={{
            padding: '2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontWeight: 700,
          }}>
            Je week laden…
          </div>
        )}

        {fout && !bewerk && (
          <div style={{ padding: '0.8rem 0', fontSize: '0.74rem', fontWeight: 800, color: '#ef4444' }}>
            {fout}
          </div>
        )}

        {!laden && (
          <>
            {/* Slaap */}
            <div style={kopje}>Slaap</div>
            {slaap ? (
              rij('slaap', Moon, 'Elke nacht', 'Geldt voor alle dagen',
                `${tijdTekst(slaapStart)} – ${tijdTekst(slaapEind)}`,
                () => setBewerk({
                  sleutel: 'slaap', titel: 'Slaap', start: slaapStart, eind: slaapEind, metEind: true,
                  bewaar: bewaarSlaap,
                }))
            ) : <Leeg tekst="Nog geen slaaptijd bekend" />}

            {/* Werk */}
            <div style={kopje}>Werk</div>
            {werkDagen.length === 0 && <Leeg tekst="Geen werkuren in je week" />}
            {werkDagen.map(({ dag, blok }) => {
              const s = blok.meta?.fullStart ?? blok.start
              const e = blok.meta?.fullEnd ?? blok.end
              return rij(`werk-${dag}`, Briefcase, DAY_LABELS_NL_LONG[dag], blok.sublabel || blok.label,
                `${tijdTekst(s)} – ${tijdTekst(e)}`,
                () => setBewerk({
                  sleutel: `werk-${dag}`, titel: `Werk — ${DAY_LABELS_NL_LONG[dag].toLowerCase()}`,
                  start: s, eind: e, metEind: true,
                  bewaar: bewaarDagBlok('work', dag, blok),
                  verwijder: blok.dbId ? () => service.deleteBlock(blok.dbId) : null,
                }))
            })}

            {/* Training */}
            <div style={kopje}>Training</div>
            {trainingDagen.length === 0 && <Leeg tekst="Geen trainingen ingepland" />}
            {trainingDagen.map(({ dag, blok }) => rij(
              `training-${dag}`, Dumbbell, DAY_LABELS_NL_LONG[dag], blok.sublabel || blok.label,
              `${tijdTekst(blok.start)} – ${tijdTekst(blok.end)}`,
              () => setBewerk({
                sleutel: `training-${dag}`, titel: `Training — ${DAY_LABELS_NL_LONG[dag].toLowerCase()}`,
                start: blok.start, eind: blok.end, metEind: true,
                bewaar: bewaarDagBlok('training', dag, blok),
              })
            ))}

            {/* Maaltijden */}
            <div style={kopje}>Maaltijden</div>
            {maaltijdSlots.length === 0 && <Leeg tekst="Nog geen maaltijdplan" />}
            {maaltijdSlots.map(m => rij(
              `meal-${m.slot}`, Utensils, m.label, 'Elke dag van je plan',
              tijdTekst(m.start),
              () => setBewerk({
                sleutel: `meal-${m.slot}`, titel: m.label,
                start: m.start, eind: m.eind, metEind: false,
                bewaar: bewaarMaaltijd(m.slot),
              })
            ))}
          </>
        )}
      </div>

      {/* De editor: één wiel, en bij een blok met een eindtijd een schakelaar
          tussen begin en eind. Twee wielen naast elkaar leek compacter maar
          dan draai je er steeds één per ongeluk mee. */}
      {bewerk && (
        <TijdEditor
          {...bewerk}
          isMobile={isMobile}
          bezig={bezig}
          fout={fout}
          onSluit={() => { setBewerk(null); setFout(null) }}
          onBewaar={(start, eind) => voerUit(() => bewerk.bewaar(start, eind))}
          onVerwijder={bewerk.verwijder ? () => voerUit(bewerk.verwijder) : null}
        />
      )}
    </div>,
    document.body
  )
}

function TijdEditor({ titel, start, eind, metEind, isMobile, bezig, fout, onSluit, onBewaar, onVerwijder }) {
  const [begin, setBegin] = useState(start)
  const [einde, setEinde] = useState(eind ?? (start + 60) % 1440)
  const [kant, setKant] = useState('begin')
  const duur = duurVan(begin, einde)
  const gewijzigd = begin !== start || (metEind && einde !== eind)

  // Schuif je de begintijd op, dan schuift het einde mee: je wilt meestal een
  // blok verplaatsen, niet oprekken. Het einde zelf zetten kan daarna nog.
  const zetBegin = (m) => {
    setBegin(m)
    if (metEind) setEinde((m + duur) % 1440)
  }

  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483110,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? '100%' : 'min(400px, 100%)',
          background: '#0a0a0a', border: `1px solid ${LIJN}`,
          borderRadius: isMobile ? '18px 18px 0 0' : 18,
          padding: isMobile
            ? '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)'
            : '1.1rem 1.25rem 1.25rem',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.8rem' }}>
          <span style={{
            flex: 1, minWidth: 0, fontSize: '1rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {titel}
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={kaal}>
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {metEind ? (
          <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
            {[
              { id: 'begin', label: 'Begint', waarde: begin },
              { id: 'eind', label: 'Eindigt', waarde: einde },
            ].map(k => (
              <button
                key={k.id}
                onClick={() => setKant(k.id)}
                style={{
                  flex: 1, padding: '0.5rem 0.6rem', borderRadius: 12,
                  background: kant === k.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${kant === k.id ? 'rgba(255,255,255,0.5)' : LIJN}`,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  display: 'block', fontSize: '0.56rem', fontWeight: 900,
                  color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {k.label}
                </span>
                <span style={{
                  display: 'block', fontSize: '1.15rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 1,
                }}>
                  {tijdTekst(k.waarde)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
            <span style={{
              fontSize: '2.1rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
            }}>
              {tijdTekst(begin)}
            </span>
          </div>
        )}

        <div style={{ marginBottom: '0.9rem' }}>
          <TijdWiel
            waarde={kant === 'eind' && metEind ? einde : begin}
            onKies={(m) => (kant === 'eind' && metEind ? setEinde(m) : zetBegin(m))}
          />
        </div>

        {metEind && (
          <div style={{
            textAlign: 'center', fontSize: '0.66rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.3)', marginBottom: '0.8rem',
          }}>
            {duur >= 60 ? `${Math.floor(duur / 60)} uur${duur % 60 ? ` ${duur % 60} min` : ''}` : `${duur} min`}
          </div>
        )}

        {fout && (
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.6rem' }}>
            {fout}
          </div>
        )}

        <button
          onClick={() => onBewaar(begin, einde)}
          disabled={bezig || !gewijzigd}
          style={{
            width: '100%', minHeight: 46, borderRadius: 12, border: 'none',
            background: gewijzigd ? '#fff' : 'rgba(255,255,255,0.12)',
            color: gewijzigd ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
            fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
            cursor: gewijzigd && !bezig ? 'pointer' : 'default', fontFamily: 'inherit',
            opacity: bezig ? 0.6 : 1,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {bezig ? 'Bezig…' : gewijzigd ? 'Opslaan voor elke week' : 'Kies een andere tijd'}
        </button>

        {onVerwijder && (
          <button onClick={onVerwijder} disabled={bezig} style={{
            width: '100%', minHeight: 38, marginTop: 8, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'transparent', border: `1px solid ${LIJN}`,
            color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Trash2 size={13} strokeWidth={2.8} />
            Uit mijn week halen
          </button>
        )}
      </div>
    </div>
  )
}

function Leeg({ tekst }) {
  return (
    <div style={{
      padding: '0.7rem 0', fontSize: '0.74rem', fontWeight: 700,
      color: 'rgba(255,255,255,0.25)', borderBottom: `1px solid ${LIJN_ZACHT}`,
    }}>
      {tekst}
    </div>
  )
}

const kaal = {
  width: 30, height: 30, padding: 0, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const kopje = {
  fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  marginTop: '1.1rem', marginBottom: 2,
}

const rijStijl = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
  padding: '0.7rem 0', background: 'transparent', border: 'none',
  borderBottom: `1px solid ${LIJN_ZACHT}`,
  cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
