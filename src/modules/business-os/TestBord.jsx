// src/modules/business-os/TestBord.jsx
//
// Eén test als horizontale kanban (fase.bord === true): zes vaste kolommen als slider, met alleen
// kaarten die van boven naar beneden lopen. Plan, meting en besluit staan in het blok Details onder de naam.
// Regels staan in testBord.js, opslaan in GinoProjecten (via projectStappen.js, opnieuw lezen vlak voor schrijven).

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Cijfer, DagInvoer, NieuweStap, OordeelPil, StapInvoer, StapKaart } from './projectKaarten'
import { useTestMeting } from './useTestMeting'
import { BESLUITEN, KOLOMMEN, PLAN_VELDEN, VOORSTEL, VRAGEN, bordStand, eerstvolgendeVanKersten, isDag, kolomVan, kolomVolgorde, komma, kortDag, laatsteDag, leesGetal, suggestieVoor, veldLeeg, volgendeKolom } from './testBord.js'
import { colors } from '../../ui/tokens'

const G = colors.success
const ORANJE = '#f59e0b'
const GRIJS = 'rgba(255,255,255,0.14)'
const MUTED = 'rgba(255,255,255,0.7)'
const KOLOM_BREED = 260
const KOLOM_GAT = 16
const KAART_GAT = 8
const LIJN_LINKS = 19 // midden van het vinkje (10 padding + 10 straal) min de halve lijndikte
const LABEL = { fontSize: 12, fontWeight: 700, color: MUTED }
const VRAAG = { fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: 'rgba(255,255,255,0.5)' }
const OORDEEL_UITLEG = 'Onder 20 posts test, 20 tot 49 indicatie. Besluit vanaf 50 posts van minstens 7 dagen oud, over minimaal 14 dagen.'

// Grijs voorstel: staat pas in het echte veld na Overnemen.
function Overnemen({ isMobile, onKlik }) {
  return (
    <button type="button" onClick={onKlik} style={{
      flexShrink: 0, minHeight: isMobile ? 44 : 20, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 800, color: G,
    }}>Overnemen</button>
  )
}

// Klik = bewerken. Leegmaken mag: dan telt het veld weer als open.
function BordVeld({ label, waarde, soort, vraag, suggestie, isMobile, onBewaar }) {
  const [open, setOpen] = useState(false)
  const leeg = veldLeeg(waarde)
  const getoond = leeg ? vraag
    : soort === 'dag' && isDag(waarde) ? kortDag(waarde)
      : soort === 'getal' && Number.isFinite(Number(waarde)) ? komma(waarde, Number.isInteger(Number(waarde)) ? 0 : 1)
        : String(waarde)
  const sluit = (t) => {
    setOpen(false)
    if (t === null) return
    if (t === '') { onBewaar(null); return }
    if (soort === 'getal') {
      const n = leesGetal(t)
      if (n != null) onBewaar(n)
      return
    }
    onBewaar(t)
  }
  return (
    <div>
      <div style={LABEL}>{label}</div>
      {/* Tijdens het typen blijft de vraag of suggestie zichtbaar. */}
      {open && leeg && <div style={VRAAG}>{suggestie?.tekst || vraag}</div>}
      {open && soort === 'dag' ? (
        <DagInvoer begin={isDag(waarde) ? waarde : ''} label={label} onKlaar={sluit} />
      ) : open ? (
        <StapInvoer begin={leeg ? '' : soort === 'getal' ? String(waarde).replace('.', ',') : String(waarde)} label={label} isMobile={isMobile}
          inputMode={soort === 'getal' ? 'decimal' : undefined} onKlaar={sluit} />
      ) : leeg && suggestie ? (
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10 }}>
          <button type="button" onClick={() => setOpen(true)} style={{ ...VRAAG, minWidth: 0, minHeight: isMobile ? 28 : 20, padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit', overflowWrap: 'anywhere' }}>{suggestie.tekst}</button>
          <Overnemen isMobile={isMobile} onKlik={() => onBewaar(suggestie.waarde)} />
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{
          display: 'block', width: '100%', minHeight: isMobile ? 28 : 20, padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit', overflowWrap: 'anywhere',
          ...(leeg ? VRAAG : { fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: '#fff' }),
        }}>{getoond}</button>
      )}
    </div>
  )
}

const Groot =({ children }) => <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{children}</div>
const GeenData = () => <Groot>Nog geen data</Groot>

function PlanBlok({ test, b, isMobile, zetVeld }) {
  return (
    <>
      <Groot>{b.planAantal} van {PLAN_VELDEN.length}</Groot>
      {PLAN_VELDEN.map(v => (
        <BordVeld key={v.id} label={v.label} soort={v.soort} waarde={test[v.id]} vraag={VRAGEN[v.id]} suggestie={suggestieVoor(test, v.id)} isMobile={isMobile} onBewaar={w => zetVeld({ [v.id]: w })} />
      ))}
    </>
  )
}

function PostenBlok({ b }) {
  if (!b.gestart) return <GeenData />
  if (b.laadt) return <Groot>…</Groot>
  if (b.mislukt || b.m?.posts == null) return <Groot>fout</Groot>
  return <Groot>{komma(b.m.posts)} van {b.doel == null ? '?' : komma(b.doel)}</Groot>
}

function MetenBlok({ b }) {
  if (!b.gestart) return <GeenData />
  if (b.laadt) return <Groot>…</Groot>
  if (b.mislukt) return <Groot>fout</Groot>
  const m = b.m
  return (
    <>
      <div><OordeelPil tekst={m.uitslag ? `${m.niveau} · ${m.uitslag}` : m.niveau} uitslag={m.uitslag} title={OORDEEL_UITLEG} /></div>
      {/* Leads zijn per woord bekend: mannen per 10 posts alleen zonder selectie van posts. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 24, rowGap: 12 }}>
        {!m.metIds && m.per10 != null && <Cijfer waarde={komma(m.per10, 1)} label="mannen per 10 posts" />}
        {!m.metIds && m.nulmeting != null && <Cijfer waarde={komma(m.nulmeting, 1)} label="nulmeting" />}
        {m.metIds && m.comments1000 != null && <Cijfer waarde={komma(m.comments1000, 1)} label="comments per 1.000 views" />}
      </div>
    </>
  )
}

function BesluitBlok({ test, b, isMobile, zetVeld }) {
  const voorstel = b.m?.uitslag ? VOORSTEL[b.m.uitslag] : null
  const voorstelNaam = BESLUITEN.find(([id]) => id === voorstel)?.[1]
  const gekozen = BESLUITEN.some(([id]) => id === test.besluit)
  const suggestie = gekozen ? null : suggestieVoor(test, 'besluit')
  return (
    <>
      {b.m && voorstelNaam && <div><OordeelPil tekst={`Voorstel: ${voorstelNaam}`} uitslag={b.m.uitslag} title={OORDEEL_UITLEG} /></div>}
      {b.m && !voorstelNaam && <div><OordeelPil tekst={b.m.niveau} title={OORDEEL_UITLEG} /></div>}
      {!gekozen && !suggestie && <div style={VRAAG}>{VRAGEN.besluit}</div>}
      {suggestie && (
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10 }}>
          <span style={VRAAG}>{suggestie.tekst}</span>
          <Overnemen isMobile={isMobile} onKlik={() => zetVeld({ besluit: suggestie.waarde })} />
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <select value={BESLUITEN.some(([id]) => id === test.besluit) ? test.besluit : ''} aria-label="Besluit"
          onChange={e => zetVeld({ besluit: e.target.value || null })}
          style={{
            appearance: 'none', WebkitAppearance: 'none', width: '100%', height: isMobile ? 44 : 32, padding: '0 12px', cursor: 'pointer',
            background: 'transparent', border: '1.5px solid #fff', borderRadius: 8, outline: 'none', color: '#fff', fontFamily: 'inherit', fontSize: isMobile ? 16 : 13, fontWeight: 800,
          }}>
          <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>Kies</option>
          {BESLUITEN.map(([id, naam]) => <option key={id} value={id} style={{ background: '#0a0a0a', color: '#fff' }}>{naam}</option>)}
        </select>
      </div>
      <BordVeld label="Les" waarde={test.les} vraag={VRAGEN.les} suggestie={suggestieVoor(test, 'les')} isMobile={isMobile} onBewaar={w => zetVeld({ les: w })} />
    </>
  )
}

export default function TestBord({ f, fi, doel, vandaag, isMobile, huidig, spotStijl, vakRef, zetStap, zetStapTekst, nieuweStap, stapWeg, verplaats, zetKaart, zetTest, hernoem, verwijder, kiezer }) {
  const test = f.test && typeof f.test === 'object' ? f.test : {}
  const stappen = f.stappen || []
  const stand = useTestMeting(test, doel)
  const b = bordStand({ stappen, test, stand, vandaag })
  const [naamOpen, setNaamOpen] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const klaarOp = laatsteDag(stappen)
  const eerstvolgende = eerstvolgendeVanKersten(stappen)
  const zetVeld = (velden) => zetTest(fi, velden)

  // ── Slider ──
  const slider = useRef(null)
  const kolomVak = useRef({})
  const snap = isMobile ? 'x mandatory' : 'x proximity'
  const [rand, setRand] = useState({ links: false, rechts: false })
  const meetRand = useCallback(() => {
    const s = slider.current
    if (!s) return
    const links = s.scrollLeft > 4, rechts = s.scrollLeft + s.clientWidth < s.scrollWidth - 4
    setRand(r => (r.links === links && r.rechts === rechts ? r : { links, rechts }))
  }, [])
  useEffect(() => {
    meetRand()
    const ro = new ResizeObserver(meetRand)
    ro.observe(slider.current)
    return () => ro.disconnect()
  }, [meetRand])
  const schuif = (richting) => slider.current?.scrollBy({ left: richting * (KOLOM_BREED + KOLOM_GAT), behavior: 'smooth' })
  // Via scrollTo op de slider zelf: scrollIntoView zou ook de pagina verticaal laten springen.
  const naarKolom = useCallback((id) => {
    const s = slider.current, k = kolomVak.current[id]
    if (s && k) s.scrollTo({ left: k.getBoundingClientRect().left - s.getBoundingClientRect().left + s.scrollLeft })
  }, [])
  // Bij openen de huidige fase in beeld, zodra de meting er is (die bepaalt mee welke dat is).
  // Heeft Kersten zelf al geschoven, dan niet meer verspringen.
  const beginGedaan = useRef(false)
  useEffect(() => {
    if (beginGedaan.current || b.laadt) return
    beginGedaan.current = true
    if (!slider.current?.scrollLeft) naarKolom(b.huidig)
  }, [b.laadt, b.huidig, naarKolom])

  const bewaarNaam = (t) => {
    setNaamOpen(false)
    if (t) hernoem(fi, t)
  }

  // ── Slepen (desktop) ──
  // Alleen binnen dit bord: de ref is leeg op de andere borden, dus die nemen niets aan.
  const gesleept = useRef(null)
  const [dropKolom, setDropKolom] = useState(null)
  const sleepEind = useCallback(() => {
    gesleept.current = null
    setDropKolom(null)
    if (slider.current) slider.current.style.scrollSnapType = snap
  }, [snap])
  const sleepStart = (id) => {
    gesleept.current = id
    // Snap vecht met automatisch doorschuiven tijdens het slepen.
    if (slider.current) slider.current.style.scrollSnapType = 'none'
  }
  const overSlider = (e) => {
    if (!gesleept.current) return
    const s = slider.current
    const r = s.getBoundingClientRect()
    if (e.clientX < r.left + 48) s.scrollLeft -= 16
    else if (e.clientX > r.right - 48) s.scrollLeft += 16
  }

  return (
    // Spotlight op de buitenste laag, de intro-animatie binnenin (zie FaseRij).
    <div ref={vakRef} style={{ minWidth: 0, ...spotStijl }}>
      <div style={{ animation: `gp-in .4s ease-out ${fi * 90}ms both`, padding: '16px 0' }}>
        {/* Naam + pijltjes + verwijderen. De naam is de testkiezer (kiezer, uit GinoProjecten): wisselen, Naam wijzigen, + Nieuwe test. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
          <div style={{ minWidth: 0, flex: 1, ...(!naamOpen ? { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 2 } : {}) }}>
            {naamOpen ? (
              <StapInvoer begin={f.naam || ''} label="Testnaam" isMobile={isMobile} fontGrootte={18} onKlaar={bewaarNaam} />
            ) : kiezer ? (
              kiezer({ onNaamWijzigen: () => setNaamOpen(true) })
            ) : (
              <button type="button" onClick={() => setNaamOpen(true)} style={{
                display: 'block', minWidth: 0, maxWidth: '100%', padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit',
                fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.25,
                overflowWrap: 'anywhere',
              }}>{f.naam}</button>
            )}
            {klaarOp && !naamOpen && (
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>Klaar op {kortDag(klaarOp)}</span>
            )}
          </div>
          {!isMobile && (rand.links || rand.rechts) && (
            <>
              <button type="button" onClick={() => schuif(-1)} disabled={!rand.links} aria-label="Naar links" style={{ ...pijl, opacity: rand.links ? 1 : 0.25 }}><ChevronLeft size={18} strokeWidth={2.8} /></button>
              <button type="button" onClick={() => schuif(1)} disabled={!rand.rechts} aria-label="Naar rechts" style={{ ...pijl, opacity: rand.rechts ? 1 : 0.25 }}><ChevronRight size={18} strokeWidth={2.8} /></button>
            </>
          )}
          {bevestig ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#fff' }}>
              Verwijderen?
              <button type="button" onClick={() => { setBevestig(false); verwijder(fi) }} style={{ ...keuze(isMobile), color: colors.danger }}>Ja</button>
              <button type="button" onClick={() => setBevestig(false)} style={keuze(isMobile)}>Nee</button>
            </span>
          ) : (
            <button type="button" onClick={() => setBevestig(true)} aria-label="Test verwijderen" style={{ ...pijl, opacity: 0.6, ...(isMobile ? { width: 44, height: 44 } : {}) }}><Trash2 size={16} strokeWidth={2.4} /></button>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <button type="button" onClick={() => setDetailsOpen(o => !o)} aria-expanded={detailsOpen} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: isMobile ? 44 : 28, padding: 0, border: 'none', background: 'none', color: '#fff', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
          }}>
            <ChevronDown size={14} strokeWidth={2.8} style={{ transform: detailsOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .2s ease' }} />
            Details
          </button>
          {detailsOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 24 : KOLOM_GAT, marginTop: 8, marginBottom: 12 }}>
              {[
                ['Plan', <PlanBlok key="plan" test={test} b={b} isMobile={isMobile} zetVeld={zetVeld} />],
                ['Posten', <PostenBlok key="posten" b={b} />],
                ['Meten', <MetenBlok key="meten" b={b} />],
                ['Besluit', <BesluitBlok key="besluit" test={test} b={b} isMobile={isMobile} zetVeld={zetVeld} />],
              ].map(([naam, blok]) => (
                <div key={naam} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                  <h5 style={{ margin: 0, fontSize: 15, fontWeight: 900, lineHeight: 1.3, color: '#fff' }}>{naam}</h5>
                  {blok}
                </div>
              ))}
            </div>
          )}
          <div ref={slider} className="gp-bord" onScroll={meetRand} onDragOver={overSlider} style={{
            display: 'flex', alignItems: 'stretch', gap: KOLOM_GAT, marginTop: 12, overflowX: 'auto', overflowY: 'hidden',
            scrollSnapType: snap, overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch',
          }}>
            {KOLOMMEN.map(k => {
              const klaar = b.klaar[k.id], nu = b.huidig === k.id
              const volgende = volgendeKolom(k.id)
              const kaarten = kolomVolgorde(stappen, k.id)
              const laatsteKlaar = kaarten.map(({ s }) => !!s.klaar).lastIndexOf(true)
              return (
                <div key={k.id} ref={el => { if (el) kolomVak.current[k.id] = el }}
                  onDragOver={e => {
                    if (!gesleept.current) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDropKolom(k.id)
                  }}
                  onDrop={e => {
                    const id = gesleept.current
                    if (!id) return
                    e.preventDefault()
                    sleepEind()
                    if (kolomVan(stappen.find(s => s.id === id)) !== k.id) verplaats(id, k.id)
                  }}
                  style={{
                    flex: '0 0 auto', display: 'flex', flexDirection: 'column', width: isMobile ? '84vw' : KOLOM_BREED, boxSizing: 'border-box', scrollSnapAlign: 'start', minHeight: 120, borderRadius: 12,
                    background: dropKolom === k.id ? `${G}14` : 'transparent', transition: 'background .15s',
                  }}>
                  {/* Kop: balk en naam horen bij elkaar. De status zit in de balkkleur, voor schermlezers in het label. */}
                  <h4 aria-label={`${k.naam}${klaar ? ', klaar' : nu ? ', huidig' : ''}`} aria-current={nu ? 'step' : undefined} style={{ margin: 0, fontSize: 15, fontWeight: 900, lineHeight: 1.3, color: '#fff' }}>
                    <span aria-hidden style={{ display: 'block', height: 6, borderRadius: 3, marginBottom: 6, background: klaar ? G : nu ? ORANJE : GRIJS, transition: 'background .3s' }} />
                    {k.naam}
                  </h4>
                  {/* Stapel direct onder de kop: eerste stap bovenaan, + Kaart onderaan.
                      De lijn staat alleen in de gaten tussen de kaarten: sommige kaarten zijn doorzichtig (vandaag),
                      en een doorlopende lijn zou daar door de kaart heen schijnen. Hij loopt op de hartlijn van het vinkje. */}
                  <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 12 }}>
                    {kaarten.map(({ s, si }, i) => (
                      <Fragment key={s.id || `plek-${si}`}>
                        {i > 0 && <span aria-hidden style={{ flexShrink: 0, width: 2, height: KAART_GAT, marginLeft: LIJN_LINKS, pointerEvents: 'none', background: i <= laatsteKlaar ? G : GRIJS }} />}
                        <StapKaart s={s} vandaag={vandaag} isMobile={isMobile} opBord witteRand={si === eerstvolgende} oplichten={huidig?.stappen?.includes(s.id)}
                          onKlaar={() => zetStap(s.id, !s.klaar)} onTekst={t => zetStapTekst(s.id, t)} onWeg={() => stapWeg(fi, si)}
                          onWie={wie => zetKaart(s.id, { wie })} onDag={dag => zetKaart(s.id, { dag })} onNotitie={notitie => zetKaart(s.id, { notitie })}
                          onVoorstelWeg={s.id ? () => zetKaart(s.id, { voorstel: null }) : null}
                          onVolgende={volgende && s.id ? () => verplaats(s.id, volgende) : null}
                          onSleepStart={!isMobile && s.id ? () => sleepStart(s.id) : null} onSleepEind={sleepEind} />
                      </Fragment>
                    ))}
                    <div style={{ marginTop: kaarten.length ? KAART_GAT : 0 }}>
                      <NieuweStap isMobile={isMobile} opBord onNieuw={t => nieuweStap(fi, t, k.id)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const pijl = {
  width: 32, height: 32, flexShrink: 0, padding: 0, border: 'none', borderRadius: 8, background: 'none', color: '#fff', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
const keuze = (isMobile) => ({
  minWidth: isMobile ? 44 : 32, minHeight: isMobile ? 44 : 32, padding: 0, border: 'none', background: 'none', color: '#fff', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 900,
})
