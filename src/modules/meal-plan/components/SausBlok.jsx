// src/modules/meal-plan/components/SausBlok.jsx
//
// Onder de ingrediënten: welke saus er bij dit bord hoort, en een knop om er
// een te kiezen.
//
// Waarom hier: op het moment dat je de ingrediënten leest bedenk je of het
// smaakt. Een lijst sauzen ergens in een menu zou je nooit opzoeken.
//
// De keuze is per saus: alleen vandaag, of voortaan bij deze maaltijd. Dezelfde
// tweedeling als bij de dagen, zodat je vaste knoflooksaus niet elke keer
// opnieuw gekozen hoeft te worden.

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Check, ChefHat, Trash2 } from 'lucide-react'
import {
  haalSausIdeeen, haalSauzenVoorMaaltijd, voegSausToe, verwijderSaus, sausMacros,
} from '../SausService'

const LIJN = 'rgba(255,255,255,0.1)'
const GOUD = '#ffba09'

const getal = (n) => Math.round((Number(n) || 0) * 10) / 10

export default function SausBlok({ db, clientId, mealId, isMobile, onGewijzigd }) {
  const [gekozen, setGekozen] = useState([])
  const [kiezer, setKiezer] = useState(false)

  const laad = useCallback(async () => {
    if (!db?.supabase || !clientId || !mealId) return
    const rijen = await haalSauzenVoorMaaltijd(db, { clientId, mealId })
    setGekozen(rijen)
    onGewijzigd?.(rijen)
  }, [db, clientId, mealId, onGewijzigd])

  useEffect(() => { laad() }, [laad])

  if (!clientId || !mealId) return null

  const extra = sausMacros(gekozen)

  const wis = async (rij) => {
    setGekozen(prev => prev.filter(r => r.id !== rij.id))
    const { error } = await verwijderSaus(db, rij.id)
    if (error) { alert(`Verwijderen mislukt: ${error}`); laad(); return }
    laad()
  }

  return (
    <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem' }}>
      <div style={{
        fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem',
      }}>
        Saus erbij
      </div>

      {gekozen.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {gekozen.map(rij => (
            <div key={rij.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.55rem 0.7rem', borderRadius: 10,
              background: 'rgba(255,186,9,0.07)', border: '1px solid rgba(255,186,9,0.22)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rij.saus.naam}
                  {rij.datum === null && (
                    <span style={{ marginLeft: 6, fontSize: '0.62rem', fontWeight: 900, color: GOUD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      altijd
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                  {rij.saus.portie} · {getal(rij.saus.kcal)} kcal · {getal(rij.saus.eiwit)}e {getal(rij.saus.koolhydraten)}k {getal(rij.saus.vet)}v
                </div>
              </div>
              <button
                onClick={() => wis(rij)}
                aria-label={`${rij.saus.naam} weghalen`}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
                  color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Trash2 size={14} strokeWidth={2.6} />
              </button>
            </div>
          ))}

          {gekozen.length > 0 && (
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
              Samen +{Math.round(extra.kcal)} kcal · {getal(extra.eiwit)}g eiwit — zit in de macro's hierboven.
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setKiezer(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%',
          minHeight: 44, padding: '0 0.85rem', borderRadius: 10,
          background: 'transparent', border: `1px dashed rgba(255,255,255,0.22)`,
          color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 800,
          fontFamily: 'inherit', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={15} strokeWidth={2.8} />
        {gekozen.length > 0 ? 'Nog een saus' : 'Kies een saus'}
      </button>

      {kiezer && (
        <SausKiezer
          db={db} clientId={clientId} mealId={mealId} isMobile={isMobile}
          alGekozen={gekozen.map(r => r.saus_id)}
          onSluit={() => setKiezer(false)}
          onToegevoegd={laad}
        />
      )}
    </div>
  )
}

// ── De keuzelijst ─────────────────────────────────────────────────────────

function SausKiezer({ db, clientId, mealId, isMobile, alGekozen, onSluit, onToegevoegd }) {
  const [ideeen, setIdeeen] = useState([])
  const [open, setOpen] = useState(null)      // welke saus staat uitgeklapt
  const [bezig, setBezig] = useState(null)

  useEffect(() => { haalSausIdeeen(db).then(setIdeeen, () => setIdeeen([])) }, [db])

  const voegToe = async (saus, altijd) => {
    setBezig(saus.id)
    const { error } = await voegSausToe(db, { clientId, mealId, sausId: saus.id, altijd })
    setBezig(null)
    if (error) { alert(`Toevoegen mislukt: ${error}`); return }
    await onToegevoegd()
    onSluit()
  }

  const groepen = [
    { soort: 'kant-en-klaar', kop: 'Uit de supermarkt' },
    { soort: 'zelfgemaakt', kop: 'Zelf maken' },
  ]

  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 10070, background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, maxHeight: '86vh', overflowY: 'auto',
        background: '#0a0a0a', border: `1px solid ${LIJN}`,
        borderRadius: '16px 16px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem',
          background: '#0a0a0a', borderBottom: `1px solid ${LIJN}`,
        }}>
          <ChefHat size={16} color={GOUD} strokeWidth={2.6} />
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Saus erbij
          </span>
          <button onClick={onSluit} aria-label="Sluiten" style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>

        {groepen.map(groep => {
          const lijst = ideeen.filter(s => s.soort === groep.soort)
          if (!lijst.length) return null
          return (
            <div key={groep.soort}>
              <div style={{
                padding: isMobile ? '0.8rem 1rem 0.35rem' : '0.9rem 1.25rem 0.4rem',
                fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {groep.kop}
              </div>
              {lijst.map(saus => {
                const staatAl = alGekozen.includes(saus.id)
                const uit = open === saus.id
                return (
                  <div key={saus.id} style={{ borderBottom: `1px solid ${LIJN}` }}>
                    <button
                      onClick={() => setOpen(uit ? null : saus.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: isMobile ? '0.7rem 1rem' : '0.75rem 1.25rem',
                        background: 'transparent', border: 'none', textAlign: 'left',
                        cursor: 'pointer', fontFamily: 'inherit',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
                          {saus.naam}
                          {staatAl && <Check size={13} strokeWidth={3} color="#10b981" style={{ marginLeft: 6, verticalAlign: -1 }} />}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.4 }}>
                          {saus.omschrijving}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                          {getal(saus.kcal)}<span style={{ fontSize: '0.6em', opacity: 0.5, marginLeft: 2 }}>kcal</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                          {saus.portie}
                        </div>
                      </div>
                    </button>

                    {uit && (
                      <div style={{ padding: isMobile ? '0 1rem 0.9rem' : '0 1.25rem 1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                          {getal(saus.eiwit)}g eiwit · {getal(saus.koolhydraten)}g koolhydraten · {getal(saus.vet)}g vet
                        </div>
                        {saus.recept && (
                          <div style={{
                            padding: '0.6rem 0.7rem', borderRadius: 10, marginBottom: 10,
                            background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
                            fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
                          }}>
                            {saus.recept}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => voegToe(saus, false)}
                            disabled={bezig === saus.id}
                            style={{
                              flex: 1, minHeight: 42, borderRadius: 10, border: 'none',
                              background: '#fff', color: '#0a0a0a',
                              fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                              touchAction: 'manipulation',
                            }}
                          >
                            Alleen vandaag
                          </button>
                          <button
                            onClick={() => voegToe(saus, true)}
                            disabled={bezig === saus.id}
                            style={{
                              flex: 1, minHeight: 42, borderRadius: 10,
                              background: 'transparent', border: `1px solid rgba(255,255,255,0.25)`,
                              color: '#fff', fontSize: '0.85rem', fontWeight: 900,
                              fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation',
                            }}
                          >
                            Altijd erbij
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
