// src/modules/meal-plan/components/SupplementInfoModal.jsx
//
// Wat staat er over dit supplement in het plan van de klant?
//
// Alles komt uit supplement_plans.supplements — dus uit wat de coach heeft
// toegewezen, niet uit een algemene database. Wat hij aanpast, leest de
// klant. Ontbreekt een onderdeel, dan blijft dat blok gewoon weg in plaats
// van een lege kop te tonen.

import React, { useState, useEffect } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, Check, AlertTriangle, Clock, ExternalLink, BookOpen, ShoppingCart, Info, ChevronDown } from 'lucide-react'
import { supplementFoto } from '../../supplements/utils/supplementFoto'
import { useProductFotos } from '../../supplements/utils/productFoto'
import { winkelUrl, winkelCode, winkelProcent, winkelVanCoach } from '../../supplements/utils/winkelKorting'

export default function SupplementInfoModal({ supplement, isMobile, onClose, db }) {
  const m = isMobile
  const sp = supplement

  // Bronnen komen uit supplement_templates en niet uit het plan van de klant.
  // Het plan draagt een momentopname; werk je een bron bij, dan zou die daar
  // niet in meekomen. Zo leest iedereen meteen de bijgewerkte versie.
  const [sjabloon, setSjabloon] = useState(null)   // null = laden
  useEffect(() => {
    if (!db?.supabase || !sp?.id) { setSjabloon({ sources: [], benefits: null }); return }
    let leeft = true
    db.supabase
      .from('supplement_templates').select('sources, benefits')
      .eq('supplement_id', sp.id).maybeSingle()
      .then(({ data }) => { if (leeft) setSjabloon(data || { sources: [], benefits: null }) },
            () => { if (leeft) setSjabloon({ sources: [], benefits: null }) })
    return () => { leeft = false }
  }, [db, sp?.id])

  // Waar koop je het: producten uit de catalogus (supplement_products) van
  // dezelfde soort, bij verschillende winkels. Live uit de tabel en niet uit
  // het plan: prijzen en links veranderen, het plan is een momentopname.
  // Dode links vallen weg; 'geblokkeerd' betekent alleen dat de winkel onze
  // prijscheck weert, de link zelf werkt dan gewoon.
  const [producten, setProducten] = useState([])
  useEffect(() => {
    if (!db?.supabase || !sp?.id) { setProducten([]); return }
    let leeft = true
    db.supabase
      .from('supplement_products')
      .select('id, product_name, brand, store, price, url, image_url, link_status, last_checked_at, in_stock')
      .eq('category', sp.id).eq('active', true)
      .order('priority', { ascending: false })
      .then(({ data }) => { if (leeft) setProducten((data || []).filter(p => p.url && p.link_status !== 'dood')) },
            () => { if (leeft) setProducten([]) })
    return () => { leeft = false }
  }, [db, sp?.id])
  const productFoto = useProductFotos()[sp?.id] || null
  // Uitleg (hoe, waarvoor, let op, bronnen) zit achter één knop: bovenaan
  // staat alleen wat je nodig hebt om het te nemen en te kopen.
  const [infoOpen, setInfoOpen] = useState(false)
  const prijsTekst = (p) => p == null ? null : `€${Number(p).toFixed(2).replace('.', ',')}`
  // Eerst wat de coach zelf aanraadt (met kortingscode), daaronder de rest.
  // Zijn die allemaal goedkoper dan de goedkoopste aanrader (na korting), dan
  // heet het kopje ook zo.
  const coachProducten = producten.filter(p => winkelVanCoach(p.url))
  const overigeProducten = producten.filter(p => !winkelVanCoach(p.url))
  const naKorting = (p) => p.price == null ? null : Number(p.price) * (1 - (winkelProcent(p.url) || 0) / 100)
  const goedkoopsteCoach = Math.min(...coachProducten.map(naKorting).filter(v => v != null))
  const overigGoedkoper = overigeProducten.length > 0 &&
    overigeProducten.every(p => p.price != null && Number(p.price) < goedkoopsteCoach)
  const productRegel = (p) => (
                <a key={p.id} href={winkelUrl(p.url)} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 10, minHeight: 56,
                  padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none', color: 'inherit',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {/* Productfoto's zijn vrijwel altijd op wit geschoten. */}
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fff', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: 18 }}>{sp.emoji || '💊'}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {winkelVanCoach(p.url) && (
                      <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#FFD700', marginBottom: 1 }}>
                        Aangeraden door Kersten
                      </div>
                    )}
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.product_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {[...new Set([p.brand, p.store].filter(Boolean))].join(' · ')}{p.in_stock === false ? ' · uitverkocht' : ''}
                    </div>
                    {winkelCode(p.url) && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {winkelProcent(p.url) ? `${winkelProcent(p.url)}% korting · ` : ''}{winkelCode(p.url)}
                      </div>
                    )}
                  </div>
                  {prijsTekst(p.price) && (winkelProcent(p.url) ? (
                    // Met korting: de prijs die de klant via deze link betaalt,
                    // met de gewone prijs doorgestreept erboven.
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, lineHeight: 1.15 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{prijsTekst(p.price)}</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#10b981' }}>{prijsTekst(p.price * (1 - winkelProcent(p.url) / 100))}</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{prijsTekst(p.price)}</span>
                  ))}
                  <ExternalLink size={15} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
                </a>
  )
  const laatstGecontroleerd = producten.reduce((max, p) => (p.last_checked_at && (!max || p.last_checked_at > max) ? p.last_checked_at : max), null)

  const bronnen = sjabloon ? (Array.isArray(sjabloon.sources) ? sjabloon.sources : []) : null

  // Wat de klant leest komt bij voorkeur uit het sjabloon, niet uit het plan.
  //
  // Het plan draagt een momentopname van het moment dat het supplement werd
  // toegewezen. Corrigeer je een claim in het sjabloon — zoals de
  // testosteron-bewering bij magnesium — dan zou die correctie in bestaande
  // plannen blijven hangen. Dat is precies verkeerd om: een claim die je
  // hebt teruggenomen mag nergens meer staan.
  //
  // Heeft het sjabloon niets, dan valt hij terug op wat er in het plan staat.
  const voordelen = (Array.isArray(sjabloon?.benefits) && sjabloon.benefits.length > 0)
    ? sjabloon.benefits
    : (sp.voordelen || [])

  // Pas hierna afhaken. Een vroege return bóven de hooks laat het aantal
  // hooks tussen renders verschillen, en dan gooit React
  // "Rendered more hooks than during the previous render".
  if (!supplement) return null

  const veiligheid = sp.veiligheid || {}
  const waarschuwingen = Array.isArray(veiligheid.warnings) ? veiligheid.warnings : []
  const interacties = Array.isArray(veiligheid.interactions) ? veiligheid.interactions : []

  const kop = (tekst, icoon) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
      marginBottom: 5,
    }}>
      {icoon}{tekst}
    </div>
  )

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10520,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center',
        padding: m ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: m ? 'none' : 460,
          maxHeight: m ? '85vh' : '80vh',
          background: '#0f0f0f',
          borderRadius: m ? '16px 16px 0 0' : 14,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Foto met de naam eroverheen — zelfde beeldtaal als de kaart. Is er
            een product in de catalogus (Big Buffalo eerst), dan dat potje op
            zwart; anders de stockfoto. */}
        <div style={{
          position: 'relative', height: productFoto ? 190 : 120, flexShrink: 0,
          background: productFoto
            ? `url(${productFoto}) center 28% / auto 70% no-repeat, radial-gradient(circle at 50% 35%, #3a3a3a 0%, #0f0f0f 70%)`
            : `url(${supplementFoto(sp, 480)}) center/cover`,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: productFoto
              ? 'linear-gradient(to top, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0) 45%)'
              : 'linear-gradient(to top, rgba(15,15,15,0.95), rgba(15,15,15,0.2))',
          }} />
          <button onClick={onClose} aria-label="Sluiten" style={{
            position: 'absolute', right: 10, top: 10, zIndex: 2,
            width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}><X size={20} strokeWidth={2.8} /></button>
          <div style={{ position: 'absolute', left: 14, bottom: 6, right: 50 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Supplement
            </div>
            <div style={{ fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff' }}>
              {sp.naam}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.15rem 0.875rem 1.1rem' }}>
          {/* Wat moet ik nu doen: dosering en moment op één regel. */}
          {(sp.dosering || sp.tijdNotitie) && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
              {sp.dosering && (
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{sp.dosering}</span>
              )}
              {sp.tijdNotitie && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                  <Clock size={12} style={{ flexShrink: 0 }} />{sp.tijdNotitie}
                </span>
              )}
            </div>
          )}

          {producten.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Waar koop je het', <ShoppingCart size={11} />)}
              {coachProducten.map(productRegel)}
              {overigeProducten.length > 0 && coachProducten.length > 0 && (
                <div style={{ marginTop: 12, marginBottom: 2, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  {overigGoedkoper ? 'Goedkopere opties' : 'Andere opties'}
                </div>
              )}
              {overigeProducten.map(productRegel)}
              <div style={{ marginTop: 6, fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                Prijzen{laatstGecontroleerd ? ` van ${new Date(laatstGecontroleerd).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}, de winkel kan afwijken.
              </div>
            </div>
          )}

          {(sp.instructies || sp.doseringNotitie || voordelen.length > 0 || veiligheid.max_dose || waarschuwingen.length > 0 || interacties.length > 0 || (bronnen && bronnen.length > 0)) && (
            <div style={{ marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setInfoOpen(o => !o)} aria-expanded={infoOpen} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '0.8rem 0', background: 'none', border: 'none', cursor: 'pointer',
                color: '#fff', fontFamily: 'inherit', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <Info size={15} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 900 }}>
                  Info
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    hoe te nemen, waarvoor{(veiligheid.max_dose || waarschuwingen.length > 0 || interacties.length > 0) ? ', let op' : ''}
                  </span>
                </span>
                <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.6)', transform: infoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {infoOpen && (
                <div style={{ paddingBottom: '0.25rem' }}>
          {sp.doseringNotitie && (
            <div style={{ marginBottom: '0.9rem', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              {sp.doseringNotitie}
            </div>
          )}

          {sp.instructies && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Hoe te nemen')}
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {sp.instructies}
              </div>
            </div>
          )}

          {voordelen.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {kop('Waarvoor')}
              {voordelen.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 4 }}>
                  <Check size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Veiligheid onderaan maar wel volledig. Een maximale dosering of
              een waarschuwing weglaten omdat het niet mooi staat is precies
              het verkeerde compromis. */}
          {(veiligheid.max_dose || waarschuwingen.length > 0 || interacties.length > 0) && (
            <div style={{
              padding: '0.7rem 0.8rem', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}>
              {kop('Let op', <AlertTriangle size={11} style={{ color: '#f59e0b' }} />)}
              {veiligheid.max_dose && (
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
                  Maximaal {veiligheid.max_dose} per dag
                </div>
              )}
              {[...waarschuwingen, ...interacties].map((w, i) => (
                <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                  · {w}
                </div>
              ))}
            </div>
          )}

          {/* Bronnen. Onderaan, want je leest ze niet altijd — maar wel
              volledig, met de kanttekening erbij. Een claim zonder bron en
              een claim met één kleine studie zien er anders identiek uit. */}
          {bronnen && bronnen.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {kop('Waar dit op gebaseerd is', <BookOpen size={11} />)}
              {bronnen.map((b, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <a href={b.url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 5,
                    fontSize: '0.74rem', fontWeight: 700, color: '#6366f1',
                    textDecoration: 'none', lineHeight: 1.4,
                  }}>
                    <ExternalLink size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{b.titel}</span>
                  </a>
                  {b.soort && (
                    <span style={{
                      display: 'inline-block', marginTop: 3, padding: '1px 6px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)', fontSize: '0.55rem', fontWeight: 800,
                      color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{b.soort}</span>
                  )}
                  {b.kanttekening && (
                    <div style={{ marginTop: 2, fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                      {b.kanttekening}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Geen bronnen betekent "nog niet nagezocht", niet "geen bewijs".
              Dat verschil hoort er te staan. */}
          {bronnen && bronnen.length === 0 && voordelen.length > 0 && (
            <div style={{
              marginTop: '0.9rem', padding: '0.55rem 0.7rem', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4,
            }}>
              Bij dit supplement zijn nog geen bronnen vastgelegd. De punten
              hierboven komen uit het plan van je coach.
            </div>
          )}

                </div>
              )}
            </div>
          )}

          {!sp.instructies && voordelen.length === 0 && !veiligheid.max_dose && (
            <div style={{ padding: '1rem 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              Er is verder geen informatie bij dit supplement vastgelegd.
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body)
}
