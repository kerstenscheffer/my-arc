// src/modules/lead-management/components/OmzetScherm.jsx
//
// Omzet & uitbetalen op één scherm (14 okt 2026; was drie tabbladen).
// Van boven naar beneden, in volgorde van belang:
//   1. Omzet van de gekozen maand — één groot getal.
//   2. Waar komt het vandaan: coaching / verlenging / vervolg / challenge.
//      Elk vak is klikbaar: challenge opent de challenges, de rest de
//      transacties van die soort.
//   3. Verdeling: wat er naar de partner (Marcel) gaat en wat jij houdt, in
//      eigen kleuren, met de Betaald-knop in het vak van de partner.
//   4. De maandgrafiek, gestapeld per bron, met het bedrag boven elke balk.
//      Klik een balk en het hele scherm springt naar die maand.
//   5. Alle transacties, met een filter op soort en maand.
//
// Twee bronnen, bewust naast elkaar:
//   omzet (getRevenueProjection) is per kalendermaand en telt al het geld dat
//   binnenkwam, ook challenge-geld dat nog terug kan.
//   verdeling (getPartnerPayouts) loopt per uitbetaalperiode van de 26e t/m
//   de 25e en telt alleen geld waar een percentage over gaat. Daarom staat de
//   periode erbij.

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, X, Target, List, Check } from 'lucide-react'
import ChallengePaneel from './ChallengePaneel'

const BRONNEN = [
  { id: 'coaching', label: 'Coaching', kleur: '#22d3ee' },
  { id: 'verlenging', label: 'Verlenging', kleur: '#a855f7' },
  { id: 'vervolg', label: 'Vervolgtraject', kleur: '#f472b6' },
  { id: 'challenge', label: 'Challenge', kleur: '#f59e0b' },
]
const BRON = Object.fromEntries(BRONNEN.map(b => [b.id, b]))
const KLEUR_JIJ = '#10b981'
const KLEUR_PARTNER = '#3b82f6'
const KLEUR_LASTEN = '#6b7280'

const eur = (n) => '€' + Math.round(n || 0).toLocaleString('nl-NL')
const kort = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k` : String(Math.round(n)))
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const maandNaam = (key, metJaar = true) => {
  const [j, m] = key.split('-').map(Number)
  return new Date(j, m - 1, 1).toLocaleDateString('nl-NL', metJaar ? { month: 'long', year: 'numeric' } : { month: 'long' })
}
const datumKort = (iso) => { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' } }
const periodeTekst = (key) => {
  const [j, m] = key.split('-').map(Number)
  const van = new Date(j, m - 2, 26)
  const tot = new Date(j, m - 1, 25)
  return `${datumKort(van.toISOString())} t/m ${datumKort(tot.toISOString())}`
}
// Maand, kwartaal of jaar: elke maand-sleutel (2026-10) hoort bij precies één
// periode-sleutel van de gekozen stand.
const MODI = [{ id: 'maand', label: 'Maand' }, { id: 'kwartaal', label: 'Kwartaal' }, { id: 'jaar', label: 'Jaar' }]
const periodeVan = (key, modus) => {
  const [j, m] = key.split('-').map(Number)
  if (modus === 'jaar') return String(j)
  if (modus === 'kwartaal') return `${j}-Q${Math.ceil(m / 3)}`
  return key
}
const periodeNaam = (key, modus) => {
  if (modus === 'jaar') return key
  if (modus === 'kwartaal') { const [j, q] = key.split('-'); return `${q} ${j}` }
  return maandNaam(key)
}
const periodeKort = (key, modus) => {
  if (modus === 'jaar') return key
  if (modus === 'kwartaal') { const [j, q] = key.split('-'); return `${q} '${j.slice(2)}` }
  return maandNaam(key, false).slice(0, 3)
}
const tik = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit', cursor: 'pointer' }

export default function OmzetScherm({
  revenue, payouts, isOwner = true, partnerName = 'Marcel', maandDoel = null,
  onDoel, onSettle, payoutBusy, leadService, coachId, onHerlaad, isMobile,
}) {
  const maanden = useMemo(() => revenue?.months || [], [revenue])
  const huidigeMaand = maanden.find(m => m.isCurrent)?.key || maanden[0]?.key
  const [modus, setModus] = useState('maand')
  const [gekozen, setGekozen] = useState(huidigeMaand)
  const [paneel, setPaneel] = useState(null) // 'partner' | 'jij' | null
  const [lijst, setLijst] = useState(null)   // { bron, maanden, label } → transactie-scherm
  const [challengesOpen, setChallengesOpen] = useState(false)

  // De maanden samengevoegd tot perioden van de gekozen stand.
  const perioden = useMemo(() => {
    const per = new Map()
    for (const m of maanden) {
      const k = periodeVan(m.key, modus)
      let p = per.get(k)
      if (!p) { p = { key: k, maanden: [], amount: 0, binnen: 0, pendingAmount: 0, perBron: {}, isPast: true, isCurrent: false }; per.set(k, p) }
      p.maanden.push(m.key)
      p.amount += m.amount || 0
      if (m.isPast || m.isCurrent) p.binnen += m.amount || 0
      p.pendingAmount += m.pendingAmount || 0
      for (const [b, v] of Object.entries(m.perBron || {})) p.perBron[b] = (p.perBron[b] || 0) + v
      if (m.isCurrent) p.isCurrent = true
      if (!m.isPast) p.isPast = false
    }
    return [...per.values()]
  }, [maanden, modus])
  const huidig = periodeVan(huidigeMaand || '2000-01', modus)
  const kiesModus = (m) => { setModus(m); setGekozen(periodeVan(huidigeMaand, m)); setPaneel(null) }

  const idx = Math.max(0, perioden.findIndex(p => p.key === gekozen))
  const maand = perioden[idx] || null
  const isHuidig = maand?.isCurrent
  // Uitbetaling: in de maandstand de maand zelf (met Betaald-knop), anders
  // de som van de maanden in de periode.
  const vMaanden = (payouts?.months || []).filter(m => maand?.maanden.includes(m.key))
  const losseMaand = modus === 'maand' ? vMaanden[0] || null : null
  const verdeling = !vMaanden.length ? null : losseMaand || {
    revenue: vMaanden.reduce((t, m) => t + (m.revenue || 0), 0),
    fixedCosts: vMaanden.reduce((t, m) => t + (m.fixedCosts || 0), 0),
    earned: vMaanden.reduce((t, m) => t + (m.earned ?? m.owed ?? 0), 0),
    netRevenue: vMaanden.reduce((t, m) => t + (m.netRevenue || 0), 0),
    outstanding: vMaanden.reduce((t, m) => t + Math.max(0, m.outstanding || 0), 0),
    settled: vMaanden.every(m => m.settled || (m.owed || 0) <= 0),
    paidAt: null,
    ontvangsten: vMaanden.flatMap(m => m.ontvangsten || []),
  }
  const doel = maandDoel ? maandDoel * (maand?.maanden.length || 1) : null

  if (!maand) {
    return <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Nog geen omzet vastgelegd.</div>
  }

  const perBron = maand.perBron || {}
  const bronnen = BRONNEN.map(b => ({ ...b, bedrag: perBron[b.id] || 0 }))
  const aantal = (bron) => (revenue?.boekingen || []).filter(x => maand.maanden.includes(x.maand) && x.bron === bron && !x.toegezegd).length
  const lijstVan = (bron) => ({ bron, maanden: maand.maanden, label: cap(periodeNaam(maand.key, modus)) })

  // Verdeling van deze periode.
  const ontvangen = verdeling?.revenue || 0
  const lasten = verdeling?.fixedCosts || 0
  const partner = verdeling ? (verdeling.earned ?? verdeling.owed ?? 0) : 0
  const jij = Math.max(0, (verdeling?.netRevenue || 0) - partner)
  const verdeelTotaal = Math.max(1, lasten + partner + jij)

  // Geen kaders: secties staan los op de achtergrond, gescheiden door een
  // haarlijn (14 okt 2026, op verzoek: minder containers, alles hoger).
  const kaart = { padding: '1.25rem 0 0.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }
  const kop = { fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── 1. Omzet links, waar het vandaan komt rechts ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.25rem' : '2.5rem', alignItems: 'stretch' }}>
        <div style={{ flex: isMobile ? 'none' : '0 0 320px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            {MODI.map(m => (
              <button key={m.id} onClick={() => kiesModus(m.id)} style={{
                ...tik, padding: '2px 0', background: 'none', border: 'none',
                borderBottom: `2px solid ${modus === m.id ? '#fff' : 'transparent'}`,
                color: modus === m.id ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 900,
              }}>{m.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'rgba(255,255,255,0.65)', marginRight: 6 }}>
              Omzet {periodeNaam(gekozen, modus)}
            </span>
            <NavKnop richting="links" uit={idx <= 0} onClick={() => setGekozen(perioden[idx - 1].key)} />
            <NavKnop richting="rechts" uit={idx >= perioden.length - 1} onClick={() => setGekozen(perioden[idx + 1].key)} />
          </div>
          <div style={{
            fontSize: isMobile ? '2.9rem' : '3.4rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.04em', lineHeight: 1.05, marginTop: 10, fontVariantNumeric: 'tabular-nums',
          }}>
            {eur(maand.amount)}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {maand.isPast ? 'binnengekomen'
              : isHuidig && maand.binnen < maand.amount ? `${eur(maand.binnen)} binnen, ${eur(maand.amount - maand.binnen)} verwacht`
              : isHuidig ? `binnengekomen deze ${modus}` : 'verwacht op basis van termijnen'}
            {maand.pendingAmount > 0 && <> · <span style={{ color: '#fff' }}>+{eur(maand.pendingAmount)}</span> toegezegd</>}
          </div>
          {!isHuidig && (
            <button onClick={() => setGekozen(huidig)} style={{ ...tik, background: 'none', border: 'none', padding: 0, marginTop: 8, color: KLEUR_JIJ, fontWeight: 900, fontSize: '0.82rem' }}>
              Terug naar nu
            </button>
          )}
          {/* Doel als voortgangsbalk */}
          <div style={{ marginTop: 14 }}>
            {doel ? (
              <>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((maand.amount / doel) * 100))}%`, height: '100%', background: KLEUR_JIJ, borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                  <span>{Math.round((maand.amount / doel) * 100)}% van je doel</span>
                  <button onClick={onDoel} style={{ ...tik, background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', fontWeight: 800, fontSize: '0.78rem' }}>
                    Doel {eur(doel)}
                  </button>
                </div>
              </>
            ) : (
              <button onClick={onDoel} style={{ ...tik, display: 'flex', alignItems: 'center', gap: 6, padding: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontWeight: 800, fontSize: '0.82rem' }}>
                <Target size={14} strokeWidth={2.6} /> Maanddoel instellen
              </button>
            )}
          </div>
        </div>

        {/* Waar komt het vandaan: rijen, geen vakken. */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={kop}>Waar komt het vandaan</div>
          <StapelBalk delen={bronnen.map(b => ({ kleur: b.kleur, waarde: b.bedrag }))} />
          <div style={{ marginTop: 6 }}>
            {bronnen.map((b, i) => (
              <button
                key={b.id}
                onClick={() => (b.id === 'challenge' ? setChallengesOpen(true) : setLijst(lijstVan(b.id)))}
                style={{
                  ...tik, width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 48,
                  padding: '0.5rem 0', background: 'none', border: 'none', textAlign: 'left',
                  borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 3, background: b.kleur, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>{b.label}</span>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                    {b.id === 'challenge' ? 'deelnemers bekijken' : `${aantal(b.id)} betaling${aantal(b.id) === 1 ? '' : 'en'}`}
                  </span>
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: b.bedrag > 0 ? '#fff' : 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                  {eur(b.bedrag)}
                </span>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Verdeling ── */}
      <div style={kaart}>
        <div style={{ ...kop, marginBottom: 2 }}>{isOwner ? `Verdeling jij en ${partnerName}` : 'Jouw aandeel'}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          {modus === 'maand' ? `Uitbetaalperiode ${periodeTekst(gekozen)}` : `${maand.maanden.length} uitbetaalperiodes (26e t/m 25e)`} · ontvangen {eur(ontvangen)}
        </div>
        {!verdeling ? (
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Nog niets te verdelen in deze periode.</div>
        ) : (
          <>
            <StapelBalk hoog delen={[
              ...(isOwner ? [{ kleur: KLEUR_JIJ, waarde: jij }] : []),
              { kleur: KLEUR_PARTNER, waarde: partner },
              { kleur: KLEUR_LASTEN, waarde: lasten },
            ]} totaal={verdeelTotaal} />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isOwner ? 3 : 2}, minmax(0, 1fr))`, gap: isMobile ? 10 : 24, marginTop: 12 }}>
              {isOwner && (
                <VerdeelVak kleur={KLEUR_JIJ} titel="Jij houdt" bedrag={jij} sub={`na ${eur(lasten)} vaste lasten`}
                  aan={paneel === 'jij'} onClick={() => setPaneel(p => (p === 'jij' ? null : 'jij'))} />
              )}
              <VerdeelVak kleur={KLEUR_PARTNER} titel={isOwner ? `Naar ${partnerName}` : 'Jij ontvangt'} bedrag={partner}
                status={verdeling.settled ? { betaald: true, tekst: 'Betaald' } : verdeling.outstanding > 0 ? { betaald: false, tekst: 'Open' } : null}
                sub={verdeling.settled ? `op ${verdeling.paidAt ? datumKort(verdeling.paidAt) : 'tijd'}` : verdeling.outstanding > 0 && verdeling.outstanding < partner ? `${eur(verdeling.outstanding)} nog over te maken` : 'klik voor details'}
                aan={paneel === 'partner'} onClick={() => setPaneel(p => (p === 'partner' ? null : 'partner'))} />
              {/* Het grijze stuk van de balk. */}
              <VerdeelVak kleur={KLEUR_LASTEN} titel="Vaste lasten" bedrag={lasten} sub="gaat eerst van de omzet af" />
            </div>

            {paneel === 'jij' && (
              <div style={{ marginTop: 12 }}>
                <Regel label="Ontvangen deze periode" bedrag={ontvangen} />
                <Regel label="Vaste lasten" bedrag={-lasten} />
                <Regel label={`Naar ${partnerName}`} bedrag={-partner} />
                <Regel label="Jij houdt" bedrag={jij} dik />
              </div>
            )}

            {paneel === 'partner' && (
              <div style={{ marginTop: 12 }}>
                {(verdeling.ontvangsten || []).map((o, i) => (
                  <Regel key={i} label={<>{o.naam}<span style={{ color: 'rgba(255,255,255,0.4)' }}>{o.soort ? ` · ${o.soort}` : ''}</span></>} bedrag={o.bedrag} klein />
                ))}
                {isOwner && losseMaand && (
                  <button
                    onClick={() => onSettle?.(verdeling)}
                    disabled={payoutBusy === verdeling.key}
                    style={{
                      ...tik, width: '100%', minHeight: 46, marginTop: 10, borderRadius: 12,
                      border: verdeling.settled ? `1px solid ${KLEUR_PARTNER}` : 'none',
                      background: verdeling.settled ? 'transparent' : KLEUR_PARTNER, color: '#fff',
                      fontSize: '0.92rem', fontWeight: 900, opacity: payoutBusy === verdeling.key ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    {verdeling.settled ? <><Check size={16} strokeWidth={3} /> Betaald · ongedaan maken</> : `Markeer ${eur(verdeling.outstanding)} als betaald`}
                  </button>
                )}
                <Openstaand payouts={payouts} isOwner={isOwner} partnerName={partnerName} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 4. Per maand ── */}
      <div style={kaart}>
        <div style={kop}>Per {modus}</div>
        <MaandGrafiek
          // Maandstand: twaalf balken rond de gekozen maand; de rest past niet.
          maanden={modus === 'maand' ? perioden.slice(Math.max(0, Math.min(idx - 6, perioden.length - 12)), Math.max(0, Math.min(idx - 6, perioden.length - 12)) + 12)
            : modus === 'kwartaal' ? perioden.slice(Math.max(0, Math.min(idx - 4, perioden.length - 8)), Math.max(0, Math.min(idx - 4, perioden.length - 8)) + 8)
            : perioden}
          label={(k) => periodeKort(k, modus)} naam={(k) => periodeNaam(k, modus)}
          gekozen={gekozen} onKies={setGekozen} doel={maandDoel && modus === 'maand' ? maandDoel : null} isMobile={isMobile} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
          {BRONNEN.map(b => (
            <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: b.kleur }} />{b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 5. Alle transacties ── */}
      <button
        onClick={() => setLijst(lijstVan('alle'))}
        style={{
          ...tik, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', width: '100%',
          minHeight: 52, padding: '0.9rem 0', background: 'none', border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.95rem', fontWeight: 900, textAlign: 'left',
        }}
      >
        <List size={18} strokeWidth={2.6} />
        <span style={{ flex: 1 }}>Alle transacties</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{(revenue?.boekingen || []).length}</span>
        <ChevronRight size={17} style={{ opacity: 0.5 }} />
      </button>

      {lijst && (
        <Transacties
          boekingen={revenue?.boekingen || []}
          maanden={maanden}
          start={lijst}
          isMobile={isMobile}
          onClose={() => setLijst(null)}
        />
      )}

      {challengesOpen && (
        <Blad titel="Challenges" isMobile={isMobile} onClose={() => setChallengesOpen(false)}>
          <ChallengePaneel leadService={leadService} coachId={coachId} onGewijzigd={onHerlaad} />
        </Blad>
      )}
    </div>
  )
}

function NavKnop({ richting, uit, onClick }) {
  const Icon = richting === 'links' ? ChevronLeft : ChevronRight
  return (
    <button onClick={onClick} disabled={uit} aria-label={richting === 'links' ? 'Vorige maand' : 'Volgende maand'} style={{
      ...tik, width: 32, height: 32, padding: 0, border: 'none',
      background: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: uit ? 0.25 : 1, cursor: uit ? 'default' : 'pointer',
    }}>
      <Icon size={18} strokeWidth={2.8} />
    </button>
  )
}

function StapelBalk({ delen, totaal, hoog = false }) {
  const som = totaal || delen.reduce((t, d) => t + d.waarde, 0)
  return (
    <div style={{ display: 'flex', height: hoog ? 14 : 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', gap: 2 }}>
      {som > 0 && delen.filter(d => d.waarde > 0).map((d, i) => (
        <div key={i} style={{ width: `${(d.waarde / som) * 100}%`, background: d.kleur, transition: 'width 0.4s ease' }} />
      ))}
    </div>
  )
}

function VerdeelVak({ kleur, titel, bedrag, sub, aan, onClick, status = null }) {
  const klikbaar = !!onClick
  return (
    <button onClick={onClick} disabled={!klikbaar} style={{
      ...tik, cursor: klikbaar ? 'pointer' : 'default', textAlign: 'left', padding: 0, minWidth: 0,
      background: 'none', border: 'none', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: kleur, flexShrink: 0 }} />{titel}
        {klikbaar && <ChevronDown size={14} style={{ opacity: 0.6, transform: aan ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{eur(bedrag)}</span>
        {status && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: 999,
            color: status.betaald ? '#10b981' : '#f59e0b',
            background: status.betaald ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)',
          }}>{status.tekst}</span>
        )}
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{sub}</span>
    </button>
  )
}

function Regel({ label, bedrag, dik = false, klein = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
      padding: klein ? '0.35rem 0' : '0.55rem 0', borderTop: dik ? '1px solid rgba(255,255,255,0.15)' : 'none',
    }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: klein ? '0.84rem' : '0.9rem', fontWeight: dik ? 900 : 700, color: dik ? '#fff' : 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flexShrink: 0, fontSize: dik ? '1.05rem' : '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
        {bedrag < 0 ? `− ${eur(-bedrag)}` : eur(bedrag)}
      </span>
    </div>
  )
}

// Eerdere periodes waar nog iets open staat, zodat een vergeten maand niet
// wegvalt nu er geen aparte uitbetaal-lijst meer is.
function Openstaand({ payouts, isOwner, partnerName }) {
  const open = (payouts?.months || []).filter(m => (m.isPast || m.isCurrent) && m.outstanding > 0.005)
  const totaal = payouts?.totalOutstanding || 0
  if (!open.length) return null
  return (
    <div style={{ marginTop: 12, padding: '0.7rem 0.85rem', borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
        {isOwner ? `In totaal nog over te maken aan ${partnerName}: ${eur(totaal)}` : `In totaal nog te ontvangen: ${eur(totaal)}`}
      </div>
      {open.map(m => (
        <div key={m.key} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
          {cap(m.label)}: {eur(m.outstanding)}
        </div>
      ))}
    </div>
  )
}

function MaandGrafiek({ maanden, gekozen, onKies, doel, isMobile, label, naam }) {
  const H = isMobile ? 130 : 160
  const max = Math.max(1, doel || 0, ...maanden.map(m => (m.amount || 0) + (m.pendingAmount || 0)))
  return (
    <div style={{ position: 'relative', paddingTop: 18 }}>
      {doel > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 18 + H - (doel / max) * H, borderTop: '1.5px dashed rgba(239,68,68,0.7)', pointerEvents: 'none' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 3 : 6, height: H }}>
        {maanden.map(m => {
          const aan = m.key === gekozen
          const delen = BRONNEN.map(b => ({ kleur: b.kleur, waarde: m.perBron?.[b.id] || 0 })).filter(d => d.waarde > 0)
          const hoogte = ((m.amount || 0) / max) * H
          const pending = ((m.pendingAmount || 0) / max) * H
          return (
            <button key={m.key} onClick={() => onKies(m.key)} aria-label={naam(m.key)} style={{
              ...tik, flex: 1, minWidth: 0, height: '100%', padding: 0, border: 'none', background: 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', position: 'relative',
            }}>
              <span style={{
                fontSize: isMobile ? '0.58rem' : '0.68rem', fontWeight: 900, textAlign: 'center', whiteSpace: 'nowrap',
                color: aan ? '#fff' : 'rgba(255,255,255,0.5)', marginBottom: 3,
              }}>
                {m.amount > 0 ? kort(m.amount) : ''}
              </span>
              {pending > 0 && (
                <div style={{ height: pending, border: '1.5px dashed rgba(255,255,255,0.35)', borderBottom: 'none', borderRadius: '4px 4px 0 0' }} />
              )}
              <div style={{
                height: Math.max(m.amount > 0 ? 3 : 0, hoogte), display: 'flex', flexDirection: 'column-reverse',
                borderRadius: pending > 0 ? 0 : '4px 4px 0 0', overflow: 'hidden',
                outline: aan ? '2px solid #fff' : 'none', outlineOffset: 1,
                opacity: m.isPast || m.isCurrent ? 1 : 0.55,
              }}>
                {delen.map((d, i) => <div key={i} style={{ flex: d.waarde, background: d.kleur }} />)}
              </div>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 3 : 6, marginTop: 6 }}>
        {maanden.map(m => (
          <span key={m.key} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontSize: isMobile ? '0.55rem' : '0.66rem',
            fontWeight: m.key === gekozen ? 900 : 700, color: m.key === gekozen ? '#fff' : 'rgba(255,255,255,0.4)',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            {label(m.key)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Blad({ titel, isMobile, onClose, kop, children }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 680, maxHeight: isMobile ? '92vh' : '88vh', background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '18px 18px 0 0' : 18,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 1rem 0.75rem' }}>
          <div style={{ flex: 1, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>{titel}</div>
          <button onClick={onClose} aria-label="Sluiten" style={{
            ...tik, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} strokeWidth={2.8} /></button>
        </div>
        {kop}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Transacties({ boekingen, maanden, start, isMobile, onClose }) {
  const [bron, setBron] = useState(start.bron || 'alle')
  const meer = (start.maanden || []).length > 1
  const [maand, setMaand] = useState(meer ? 'periode' : start.maanden?.[0] || 'alle')
  const zichtbaar = boekingen.filter(b =>
    (maand === 'alle' || (maand === 'periode' ? start.maanden.includes(b.maand) : b.maand === maand)) &&
    (bron === 'alle' ? !b.toegezegd : bron === 'toegezegd' ? b.toegezegd : (b.bron === bron && !b.toegezegd)))
  const totaal = zichtbaar.reduce((t, b) => t + b.bedrag, 0)
  const nu = new Date()
  const select = {
    flex: 1, minWidth: 0, minHeight: 42, padding: '0 0.7rem', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', fontSize: '0.88rem', fontWeight: 800, fontFamily: 'inherit',
  }
  return (
    <Blad titel="Transacties" isMobile={isMobile} onClose={onClose} kop={
      <div style={{ flexShrink: 0, padding: '0 1rem 0.75rem' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={bron} onChange={e => setBron(e.target.value)} style={select}>
            <option value="alle">Alle soorten</option>
            {BRONNEN.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            <option value="toegezegd">Toegezegd (nog niet betaald)</option>
          </select>
          <select value={maand} onChange={e => setMaand(e.target.value)} style={select}>
            <option value="alle">Alle maanden</option>
            {meer && <option value="periode">{start.label}</option>}
            {maanden.map(m => <option key={m.key} value={m.key}>{cap(maandNaam(m.key))}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
          <span>{zichtbaar.length} transactie{zichtbaar.length === 1 ? '' : 's'}</span>
          <span style={{ color: '#fff', fontWeight: 900 }}>{eur(totaal)}</span>
        </div>
      </div>
    }>
      {zichtbaar.length === 0 ? (
        <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Geen transacties met dit filter.</div>
      ) : zichtbaar.map((b, i) => {
        const soort = BRON[b.bron] || BRON.coaching
        const gepland = new Date(b.datum) > nu
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: soort.kleur, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.naam}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                <span style={{ color: soort.kleur }}>{soort.label}</span> · {b.termijn} · {datumKort(b.datum)}
                {b.toegezegd ? ' · nog niet betaald' : gepland ? ' · gepland' : ''}
              </div>
            </div>
            <span style={{ flexShrink: 0, fontSize: '0.98rem', fontWeight: 900, color: b.toegezegd || gepland ? 'rgba(255,255,255,0.55)' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {eur(b.bedrag)}
            </span>
          </div>
        )
      })}
    </Blad>
  )
}
