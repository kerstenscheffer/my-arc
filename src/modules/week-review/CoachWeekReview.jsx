// src/modules/week-review/CoachWeekReview.jsx
//
// De zaterdagronde. Eén lijst, alle lopende klanten, één week.
//
// Opzet: dichtgeklapt is een klant één regel met alleen wat er mis is. Wie niets
// mankeert kost je dus één blik. Klap je hem open, dan staat er wat er die week
// gebeurde — trainingen, kracht, gewicht, wat hij zelf schreef — en vink je hem
// af met een notitie.
//
// Wie aandacht vraagt staat bovenaan, wie je gehad hebt zakt naar beneden. Zo
// werk je van boven naar onder en zie je onderweg hoeveel er nog open staat.

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, Dumbbell, TrendingUp,
  TrendingDown, Minus, Scale, MessageSquare, ClipboardCheck, Loader2,
} from 'lucide-react'
import {
  haalWeek, zetGehad, haalGehadWeg, maandagVan, verschuifWeek, weekLabel,
} from './WeekReviewService'

const LIJN = 'rgba(255,255,255,0.1)'
const GOUD = '#ffba09'
const GROEN = '#10b981'
const ROOD = '#ef4444'

const VLAG_KLEUR = {
  rood:  { bg: 'rgba(239,68,68,0.14)',  rand: 'rgba(239,68,68,0.4)',  tekst: '#f87171' },
  geel:  { bg: 'rgba(245,158,11,0.13)', rand: 'rgba(245,158,11,0.38)', tekst: '#fbbf24' },
  blauw: { bg: 'rgba(59,130,246,0.13)', rand: 'rgba(59,130,246,0.36)', tekst: '#93c5fd' },
  grijs: { bg: 'rgba(255,255,255,0.06)', rand: LIJN, tekst: 'rgba(255,255,255,0.55)' },
}

const nl1 = (n) => (n == null ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n))

export default function CoachWeekReview({ db, isMobile }) {
  const m = isMobile
  const [coachId, setCoachId] = useState(null)
  const [maandag, setMaandag] = useState(() => maandagVan())
  const [klanten, setKlanten] = useState([])
  const [laden, setLaden] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let weg = false
    db?.getCurrentUser?.().then(u => { if (!weg) setCoachId(u?.id || null) }, () => {})
    return () => { weg = true }
  }, [db])

  const laad = useCallback(async () => {
    if (!coachId) return
    setLaden(true)
    const res = await haalWeek(db, coachId, maandag)
    setKlanten(res.klanten)
    setLaden(false)
  }, [db, coachId, maandag])

  useEffect(() => { laad() }, [laad])

  const gehadAantal = klanten.filter(k => k.gehad).length

  // Afvinken werkt meteen in beeld; loopt het opslaan mis, dan draaien we terug.
  const wissel = async (klant, notitie) => {
    const nieuw = !klant.gehad
    setKlanten(prev => prev.map(k => k.id === klant.id ? { ...k, gehad: nieuw, notitie: notitie ?? k.notitie } : k))
    const args = { coachId, clientId: klant.id, weekStart: maandag }
    const { error } = nieuw
      ? await zetGehad(db, { ...args, notitie: notitie ?? klant.notitie })
      : await haalGehadWeg(db, args)
    if (error) {
      setKlanten(prev => prev.map(k => k.id === klant.id ? { ...k, gehad: klant.gehad } : k))
      alert(`Opslaan mislukt: ${error}`)
      return
    }
    if (nieuw) setOpen(null)
  }

  const bewaarNotitie = async (klant, notitie) => {
    setKlanten(prev => prev.map(k => k.id === klant.id ? { ...k, notitie } : k))
    if (!klant.gehad) return                       // bewaren gebeurt bij het afvinken
    await zetGehad(db, { coachId, clientId: klant.id, weekStart: maandag, notitie })
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: m ? '0 0.75rem' : '0 1.5rem' }}>

      {/* Kop: welke week, hoever ben je. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: m ? 10 : 14,
        padding: m ? '1rem 0 0.9rem' : '1.25rem 0 1.1rem',
        borderBottom: `1px solid ${LIJN}`, marginBottom: m ? '0.9rem' : '1.1rem',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: m ? '1.3rem' : '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Weekreview
          </div>
          <div style={{ fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
            {weekLabel(maandag)} · {klanten.length ? `${gehadAantal} van ${klanten.length} gehad` : 'geen lopende klanten'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Pijl aria-label="Vorige week" onClick={() => setMaandag(v => verschuifWeek(v, -1))}><ChevronLeft size={18} strokeWidth={2.8} /></Pijl>
          <Pijl aria-label="Volgende week" onClick={() => setMaandag(v => verschuifWeek(v, 1))} uit={maandag >= maandagVan()}><ChevronRight size={18} strokeWidth={2.8} /></Pijl>
        </div>
      </div>

      {/* Voortgangsbalk: hoeveel van de ronde staat er nog open. */}
      {klanten.length > 0 && (
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: m ? '1rem' : '1.25rem', overflow: 'hidden' }}>
          <div style={{
            width: `${(gehadAantal / klanten.length) * 100}%`, height: '100%',
            background: gehadAantal === klanten.length ? GROEN : GOUD,
            transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      )}

      {laden ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4rem 0', color: 'rgba(255,255,255,0.45)' }}>
          <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Week ophalen…</span>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      ) : klanten.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', fontWeight: 700 }}>
          Geen klanten met een lopend traject.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {klanten.map(k => (
            <KlantRegel
              key={k.id}
              klant={k}
              isMobile={m}
              open={open === k.id}
              onOpen={() => setOpen(o => o === k.id ? null : k.id)}
              onWissel={(notitie) => wissel(k, notitie)}
              onNotitie={(n) => bewaarNotitie(k, n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Pijl({ children, onClick, uit, ...rest }) {
  return (
    <button
      onClick={uit ? undefined : onClick}
      disabled={uit}
      {...rest}
      style={{
        width: 36, height: 36, borderRadius: 10, border: `1px solid ${LIJN}`,
        background: 'transparent', color: uit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: uit ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

// ── Eén klant ─────────────────────────────────────────────────────────────

function KlantRegel({ klant, isMobile: m, open, onOpen, onWissel, onNotitie }) {
  const [notitie, setNotitie] = useState(klant.notitie || '')
  useEffect(() => { setNotitie(klant.notitie || '') }, [klant.notitie])

  const t = klant.training
  const g = klant.gewicht

  return (
    <div style={{
      borderBottom: `1px solid ${LIJN}`,
      opacity: klant.gehad && !open ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Dichtgeklapte regel */}
      <div
        onClick={onOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: m ? 10 : 12,
          padding: m ? '0.85rem 0' : '1rem 0', cursor: 'pointer',
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onWissel(notitie) }}
          aria-label={klant.gehad ? 'Weer openzetten' : 'Afvinken'}
          style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 8,
            border: klant.gehad ? 'none' : `1.5px solid rgba(255,255,255,0.28)`,
            background: klant.gehad ? GROEN : 'transparent',
            color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {klant.gehad && <Check size={15} strokeWidth={3.4} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: m ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff',
            textDecoration: klant.gehad ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {klant.naam}
          </div>

          {/* Samenvatting in cijfers, en daarnaast alleen wat mis is. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
            <span style={{ fontSize: m ? '0.76rem' : '0.79rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              {t.gedaan}{t.gepland ? `/${t.gepland}` : ''}× training · {g.dagenGewogen}× gewogen
              {g.laatste != null ? ` · ${nl1(g.laatste)} kg` : ''}
            </span>
            {klant.vlaggen.filter(v => v.soort !== 'grijs').slice(0, m ? 2 : 4).map((v, i) => (
              <Vlag key={i} vlag={v} />
            ))}
          </div>
        </div>

        <ChevronDown
          size={18} strokeWidth={2.6}
          style={{
            flexShrink: 0, color: 'rgba(255,255,255,0.35)',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}
        />
      </div>

      {/* Opengeklapt: de week zelf */}
      {open && (
        <div style={{ padding: m ? '0 0 1.1rem 36px' : '0 0 1.3rem 38px', display: 'flex', flexDirection: 'column', gap: m ? 14 : 16 }}>

          <Blok icoon={Dumbbell} titel={`Trainingen${t.schemaNaam ? ` · ${t.schemaNaam}` : ''}`}>
            {t.dagen.length === 0 ? (
              <Leeg>Niets gelogd deze week.</Leeg>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {t.dagen.map(d => (
                  <span key={d.datum} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 9px', borderRadius: 8,
                    background: d.afgerond ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${d.afgerond ? 'rgba(16,185,129,0.34)' : LIJN}`,
                    fontSize: '0.78rem', fontWeight: 800,
                    color: d.afgerond ? GROEN : 'rgba(255,255,255,0.6)',
                  }}>
                    {d.dag}
                    {d.naam ? <span style={{ fontWeight: 700, opacity: 0.75 }}>{d.naam}</span> : null}
                    {d.duur ? <span style={{ fontWeight: 700, opacity: 0.6 }}>{d.duur}m</span> : null}
                    {!d.afgerond && d.pct ? <span style={{ fontWeight: 900, color: '#fbbf24' }}>{Math.round(d.pct)}%</span> : null}
                  </span>
                ))}
              </div>
            )}
          </Blok>

          {klant.kracht.details.length > 0 && (
            <Blok icoon={TrendingUp} titel={`Kracht · ${klant.kracht.omhoog} omhoog, ${klant.kracht.omlaag} omlaag`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {klant.kracht.details.slice(0, 6).map(d => {
                  const kleur = d.richting === 'omhoog' ? GROEN : d.richting === 'omlaag' ? ROOD : 'rgba(255,255,255,0.45)'
                  const Icoon = d.richting === 'omhoog' ? TrendingUp : d.richting === 'omlaag' ? TrendingDown : Minus
                  return (
                    <div key={d.oefening} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icoon size={14} strokeWidth={2.8} color={kleur} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.oefening}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 900, color: kleur }}>
                        {d.pct > 0 ? '+' : ''}{d.pct}%
                      </span>
                      <span style={{ flexShrink: 0, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', minWidth: 76, textAlign: 'right' }}>
                        {nl1(d.vorig)} → {nl1(d.nu)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Blok>
          )}

          <Blok icoon={Scale} titel={`Gewicht · ${g.statusTekst}`}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {g.laatste != null
                ? <>Laatst <strong style={{ color: '#fff', fontWeight: 900 }}>{nl1(g.laatste)} kg</strong>
                    {g.verschil != null && <> · deze week <strong style={{ color: '#fff', fontWeight: 900 }}>{g.verschil > 0 ? '+' : ''}{nl1(g.verschil)} kg</strong></>}
                    {g.weekDoelKg != null && <> · afgesproken {nl1(g.weekDoelKg)} kg/week</>}
                  </>
                : 'Nog geen weging.'}
            </div>
            {g.advies && (
              <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: GOUD, lineHeight: 1.45 }}>
                {g.advies}
              </div>
            )}
          </Blok>

          {klant.notities.length > 0 && (
            <Blok icoon={MessageSquare} titel="Wat hij zelf schreef">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {klant.notities.map((n, i) => (
                  <div key={i} style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{n.oefening} · </span>
                    {n.tekst}
                  </div>
                ))}
              </div>
            </Blok>
          )}

          {klant.checkin && (
            <Blok icoon={ClipboardCheck} titel="Check-in">
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                {klant.checkin.energie != null && <>Energie {klant.checkin.energie}/10 · </>}
                {klant.checkin.motivatie != null && <>Motivatie {klant.checkin.motivatie}/10 · </>}
                {klant.checkin.slaap != null && <>{nl1(klant.checkin.slaap)} uur slaap</>}
              </div>
              {klant.checkin.struggles && (
                <div style={{ marginTop: 6, fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>
                  {klant.checkin.struggles}
                </div>
              )}
            </Blok>
          )}

          {/* Afvinken met wat jou opviel. */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: m ? 'wrap' : 'nowrap' }}>
            <input
              value={notitie}
              onChange={e => setNotitie(e.target.value)}
              onBlur={() => notitie !== klant.notitie && onNotitie(notitie)}
              onKeyDown={e => { if (e.key === 'Enter') onWissel(notitie) }}
              placeholder="Wat viel je op?"
              style={{
                flex: 1, minWidth: m ? '100%' : 200, minHeight: 40, padding: '0 0.8rem',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`, borderRadius: 10,
                color: '#fff', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={() => onWissel(notitie)}
              style={{
                flexShrink: 0, minHeight: 40, padding: '0 1.1rem', borderRadius: 10, border: 'none',
                background: klant.gehad ? 'rgba(255,255,255,0.1)' : '#fff',
                color: klant.gehad ? 'rgba(255,255,255,0.7)' : '#0a0a0a',
                fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {klant.gehad ? 'Weer openzetten' : 'Gehad'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Vlag({ vlag }) {
  const k = VLAG_KLEUR[vlag.soort] || VLAG_KLEUR.grijs
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 8px', borderRadius: 999,
      background: k.bg, border: `1px solid ${k.rand}`, color: k.tekst,
      fontSize: '0.72rem', fontWeight: 900, whiteSpace: 'nowrap',
    }}>
      {vlag.tekst}
    </span>
  )
}

// Icoon als losse variabele en niet als parameter: no-unused-vars telt een
// component dat alleen in JSX voorkomt niet als gebruikt, maar negeert wél
// variabelen met een hoofdletter (varsIgnorePattern in eslint.config.js).
function Blok(props) {
  const { icoon: Icoon, titel, children } = props
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <Icoon size={14} strokeWidth={2.8} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.76rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {titel}
        </span>
      </div>
      {children}
    </div>
  )
}

const Leeg = ({ children }) => (
  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{children}</div>
)
