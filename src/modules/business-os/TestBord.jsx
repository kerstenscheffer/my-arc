// src/modules/business-os/TestBord.jsx
//
// Eén test als horizontale kanban (fase.bord === true): fasebalk bovenaan en zes
// vaste kolommen als slider. Regels staan in testBord.js, opslaan in GinoProjecten
// (via projectStappen.js, opnieuw lezen vlak voor schrijven).

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Cijfer, NieuweStap, OordeelPil, StapInvoer, StapKaart } from './projectKaarten'
import { useTestMeting } from './useTestMeting'
import { BESLUITEN, KOLOMMEN, PLAN_VELDEN, VOORSTEL, bordStand, isDag, kolomVan, komma, kortDag, leesGetal, volgendeKolom } from './testBord'
import { colors } from '../../ui/tokens'

const G = colors.success
const ORANJE = '#f59e0b'
const GRIJS = 'rgba(255,255,255,0.14)'
const MUTED = 'rgba(255,255,255,0.7)'
const KOLOM_BREED = 260
const KOLOM_GAT = 16
const LABEL = { fontSize: 12, fontWeight: 700, color: MUTED }
const OORDEEL_UITLEG = 'Onder 20 posts test, 20 tot 49 indicatie. Besluit vanaf 50 posts van minstens 7 dagen oud, over minimaal 14 dagen.'

// Klik = bewerken. Leegmaken mag: dan telt het veld weer als open.
function BordVeld({ label, waarde, soort, isMobile, onBewaar }) {
  const [open, setOpen] = useState(false)
  const leeg = waarde === undefined || waarde === null || waarde === ''
  const getoond = leeg ? 'open'
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
      {open && soort === 'dag' ? (
        <DagInvoer begin={isDag(waarde) ? waarde : ''} label={label} onKlaar={sluit} />
      ) : open ? (
        <StapInvoer begin={leeg ? '' : soort === 'getal' ? String(waarde).replace('.', ',') : String(waarde)} label={label} isMobile={isMobile}
          inputMode={soort === 'getal' ? 'decimal' : undefined} onKlaar={sluit} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{
          display: 'block', width: '100%', minHeight: isMobile ? 28 : 20, padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 800, lineHeight: 1.3, overflowWrap: 'anywhere', color: leeg ? 'rgba(255,255,255,0.5)' : '#fff',
        }}>{getoond}</button>
      )}
    </div>
  )
}

function DagInvoer({ begin, label, onKlaar }) {
  const [dag, setDag] = useState(begin)
  const afgerond = useRef(false)
  const rond = (bewaren) => {
    if (afgerond.current) return
    afgerond.current = true
    onKlaar(bewaren && dag !== begin ? dag : null)
  }
  return (
    <input type="date" autoFocus value={dag} aria-label={label}
      onChange={e => setDag(e.target.value)}
      onBlur={() => rond(true)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); rond(true) }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); rond(false) }
      }}
      style={{
        display: 'block', width: '100%', boxSizing: 'border-box', padding: 0, border: 'none', borderBottom: `1.5px solid ${G}`, outline: 'none', colorScheme: 'dark',
        background: 'transparent', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
      }} />
  )
}

const Groot = ({ children }) => <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{children}</div>
const GeenData = () => <Groot>Nog geen data</Groot>

function PlanBlok({ test, b, isMobile, zetVeld }) {
  return (
    <>
      <Groot>{b.planAantal} van {PLAN_VELDEN.length}</Groot>
      {PLAN_VELDEN.map(v => (
        <BordVeld key={v.id} label={v.label} soort={v.soort} waarde={test[v.id]} isMobile={isMobile} onBewaar={w => zetVeld({ [v.id]: w })} />
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
  return (
    <>
      {b.m && voorstelNaam && <div><OordeelPil tekst={`Voorstel: ${voorstelNaam}`} uitslag={b.m.uitslag} title={OORDEEL_UITLEG} /></div>}
      {b.m && !voorstelNaam && <div><OordeelPil tekst={b.m.niveau} title={OORDEEL_UITLEG} /></div>}
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
      <BordVeld label="Les" waarde={test.les} isMobile={isMobile} onBewaar={w => zetVeld({ les: w })} />
    </>
  )
}

export default function TestBord({ f, fi, doel, vandaag, isMobile, huidig, spotStijl, vakRef, zetStap, zetStapTekst, nieuweStap, stapWeg, verplaats, zetTest, hernoem, verwijder }) {
  const test = f.test && typeof f.test === 'object' ? f.test : {}
  const stappen = f.stappen || []
  const stand = useTestMeting(test, doel)
  const b = bordStand({ stappen, test, stand, vandaag })
  const [naamOpen, setNaamOpen] = useState(false)
  const [bevestig, setBevestig] = useState(false)
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
  // Via scrollTo op de slider zelf: scrollIntoView zou ook de pagina verticaal laten springen.
  const naarKolom = useCallback((id, behavior = 'smooth') => {
    const s = slider.current, k = kolomVak.current[id]
    if (!s || !k) return
    s.scrollTo({ left: k.getBoundingClientRect().left - s.getBoundingClientRect().left + s.scrollLeft, behavior })
  }, [])
  const schuif = (richting) => slider.current?.scrollBy({ left: richting * (KOLOM_BREED + KOLOM_GAT), behavior: 'smooth' })
  // Bij openen de huidige fase in beeld, zodra de meting er is (die bepaalt mee welke dat is).
  // Heeft Kersten zelf al geschoven, dan niet meer verspringen.
  const beginGedaan = useRef(false)
  useEffect(() => {
    if (beginGedaan.current || b.laadt) return
    beginGedaan.current = true
    if (b.huidig && !slider.current?.scrollLeft) naarKolom(b.huidig, 'auto')
  }, [b.laadt, b.huidig, naarKolom])

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
        {/* Naam + pijltjes + verwijderen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {naamOpen ? (
              <StapInvoer begin={f.naam || ''} label="Testnaam" isMobile={isMobile} fontGrootte={18}
                onKlaar={t => { setNaamOpen(false); if (t) hernoem(fi, t) }} />
            ) : (
              <button type="button" onClick={() => setNaamOpen(true)} style={{
                display: 'block', maxWidth: '100%', padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit',
                fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.25, overflowWrap: 'anywhere',
              }}>{f.naam}</button>
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

        {/* Fasebalk */}
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {KOLOMMEN.map(k => {
            const klaar = b.klaar[k.id], nu = b.huidig === k.id
            return (
              <button key={k.id} type="button" onClick={() => naarKolom(k.id)} aria-label={`${k.naam}${klaar ? ', klaar' : nu ? ', huidig' : ''}`} aria-current={nu ? 'step' : undefined} style={{
                flex: 1, minWidth: 0, minHeight: isMobile ? 44 : 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
              }}>
                {!isMobile && <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: klaar ? G : nu ? ORANJE : MUTED }}>{k.naam}</span>}
                <span style={{ display: 'block', height: 6, borderRadius: 3, background: klaar ? G : nu ? ORANJE : GRIJS, transition: 'background .3s' }} />
              </button>
            )
          })}
        </div>

        {/* Kolommen */}
        <div ref={slider} className="gp-bord" onScroll={meetRand} onDragOver={overSlider} style={{
          display: 'flex', alignItems: 'flex-start', gap: KOLOM_GAT, marginTop: 12, overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: snap, overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch',
        }}>
          {KOLOMMEN.map(k => {
            const klaar = b.klaar[k.id], nu = b.huidig === k.id
            const volgende = volgendeKolom(k.id)
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
                  flex: '0 0 auto', width: isMobile ? '84vw' : KOLOM_BREED, boxSizing: 'border-box', scrollSnapAlign: 'start', minHeight: 120, borderRadius: 12,
                  background: dropKolom === k.id ? `${G}14` : 'transparent', transition: 'background .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{k.naam}</span>
                  {klaar && <Check size={15} strokeWidth={3.5} color={G} />}
                  {nu && <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: ORANJE }} />}
                </div>
                {['plan', 'posten', 'meten', 'besluit'].includes(k.id) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {k.id === 'plan' && <PlanBlok test={test} b={b} isMobile={isMobile} zetVeld={zetVeld} />}
                    {k.id === 'posten' && <PostenBlok b={b} />}
                    {k.id === 'meten' && <MetenBlok b={b} />}
                    {k.id === 'besluit' && <BesluitBlok test={test} b={b} isMobile={isMobile} zetVeld={zetVeld} />}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {stappen.map((s, si) => (kolomVan(s) !== k.id ? null : (
                    <StapKaart key={s.id || `plek-${si}`} s={s} vandaag={vandaag} isMobile={isMobile} opBord oplichten={huidig?.stappen?.includes(s.id)}
                      onKlaar={() => zetStap(s.id, !s.klaar)} onTekst={t => zetStapTekst(s.id, t)} onWeg={() => stapWeg(fi, si)}
                      onVolgende={volgende && s.id ? () => verplaats(s.id, volgende) : null}
                      onSleepStart={!isMobile && s.id ? () => sleepStart(s.id) : null} onSleepEind={sleepEind} />
                  )))}
                  <NieuweStap isMobile={isMobile} opBord onNieuw={t => nieuweStap(fi, t, k.id)} />
                </div>
              </div>
            )
          })}
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
