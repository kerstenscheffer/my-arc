// src/modules/business-os/BusinessOS.jsx
//
// Business OS (30 okt 2026): het ene scherm waar alles samenkomt. Bovenaan het
// maanddoel, in het midden de keten content → lead → reactie → call → sale met
// de zwakste schakel en de terugrekensom, links de agents (pg_cron-jobs), rechts
// de calls van vandaag en de laatste sales. Indeling van het Jarvis-dashboard,
// kleuren MY ARC: zwart, dik wit, groen accent, blokken los op de pagina in
// plaats van in kaders. Data: RPC get_business_os (business-os.sql).
// Sinds 30 okt: de AI-chat staat centraal; maanddoel is één klikbare regel en
// alle panelen staan ingeklapt onder 'Cijfers' (open-stand in bos_open_secties).

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import BusinessChat from './BusinessChat'

const C = {
  bg: colors.bg,
  rand: colors.borderSubtle,
  wit: colors.textPrimary,
  gloed: 'rgba(255, 255, 255, 0.35)',
  tekst: colors.textPrimary,
  zacht: colors.textSecondary,
  groen: colors.success,
  oranje: '#f59e0b',
  rood: colors.danger,
}
const NUM = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }
const LABEL = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }
const DOEL_KEY = 'business_os_doel'
const PRIJS_KEY = 'business_os_prijs'
const OPEN_KEY = 'bos_open_secties'

// Leesbare namen voor de cron-jobs. Onbekende jobs tonen hun eigen naam.
const AGENTS = {
  'instagram-sync': 'Instagram-sync',
  'meta-ad-insights': 'Meta ads-cijfers',
  'meta-ad-spend': 'Adspend',
  'meta-capi-flush': 'Meta conversies',
  'run-notification-schedules': 'Klantmeldingen',
  'sync-calendly-bookings': 'Calendly-boekingen',
  'weekreview-herinnering': 'Weekreview-herinnering',
}

// Per schakel: wat je doet als 'ie de zwakste is.
const ACTIES = {
  views: 'Bereik zakt: post weer dagelijks een reel en 4-5 magnets, hergebruik je best bekeken hooks.',
  leads: 'Minder leads op het bord: zet elke commenter dezelfde dag op het bord en post meer magnets.',
  reactie: 'Minder reacties: herschrijf het eerste magnet-bericht en stuur de outreach-ronde van 100 per dag.',
  call: 'Reacties worden geen calls: stel in elk gesprek binnen 3 berichten een call voor.',
  sale: 'Calls worden geen sales: luister je laatste 3 calls terug op bezwaren en pas je pitch aan.',
  prijs: 'Lagere orderwaarde: verkoop vaker het 12-weken traject of verhoog je prijs.',
}

const euro = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')
const getal = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'M'
  if (v >= 1e4) return Math.round(v / 1e3) + 'K'
  return Math.round(v).toLocaleString('nl-NL')
}
const lees = (key, std) => {
  try { return Number(localStorage.getItem(key)) || std } catch { return std }
}
const bewaar = (key, v) => {
  try { localStorage.setItem(key, String(v)) } catch { /* privé-venster */ }
}

const leesOpen = () => {
  try { return JSON.parse(localStorage.getItem(OPEN_KEY)) || {} } catch { return {} }
}

// Inklapbare sectie: titel + chevron, inhoud pas zichtbaar na klik.
function Inklap({ titel, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.rand}` }}>
      <button
        type="button" onClick={onToggle} aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'none', border: 'none', color: C.wit, cursor: 'pointer', padding: '14px 0',
          minHeight: 48, fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={LABEL}>{titel}</span>
        <ChevronDown size={18} style={{ color: C.zacht, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  )
}

function Paneel({ titel, children, style }) {
  return (
    <div style={{ padding: '8px 0', ...style }}>
      {titel && (
        <div style={{ ...LABEL, color: C.wit, marginBottom: 12 }}>
          {titel}
        </div>
      )}
      {children}
    </div>
  )
}

function Invoer({ label, waarde, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: C.zacht, flex: 1 }}>
      {label}
      <input
        type="number" inputMode="numeric" value={waarde}
        onChange={e => onChange(Math.max(1, Number(e.target.value) || 0))}
        style={{
          background: 'transparent', border: 'none', borderBottom: `1px solid ${C.rand}`, borderRadius: 0,
          color: C.tekst, ...NUM, fontSize: '1rem', fontWeight: 800, padding: '8px 0', minHeight: 44, outline: 'none',
        }}
      />
    </label>
  )
}

export default function BusinessOS({ isMobile }) {
  const [data, setData] = useState(null)
  const [fout, setFout] = useState(null)
  const [doel, setDoel] = useState(() => lees(DOEL_KEY, 10000))
  const [prijs, setPrijs] = useState(() => lees(PRIJS_KEY, 0))
  const [open, setOpen] = useState(leesOpen)
  const wissel = (k) => setOpen(o => {
    const n = { ...o, [k]: !o[k] }
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(n)) } catch { /* privé-venster */ }
    return n
  })

  const nu = new Date()
  const van = new Date(nu.getFullYear(), nu.getMonth(), 1)
  const tot = new Date(nu.getFullYear(), nu.getMonth() + 1, 1)
  const dagenInMaand = Math.round((tot - van) / 864e5)
  const dagenVoorbij = Math.max(1, (nu - van) / 864e5)

  useEffect(() => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    let weg = false
    const laad = () => supabase.rpc('get_business_os', { p_van: iso(van), p_tot: iso(tot) })
      .then(({ data: d, error }) => {
        if (weg) return
        if (error) setFout(error.message)
        else { setData(d); setFout(null) }
      })
    laad()
    const t = setInterval(laad, 60000)
    return () => { weg = true; clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const a = useMemo(() => {
    if (!data?.nu) return null
    const n = data.nu, v = data.voor
    // Tempo deze maand vs. gemiddelde maand van de 3 ervoor, per dag.
    const perDagNu = (x) => (Number(n[x]) || 0) / dagenVoorbij
    const perDagVoor = (x) => (Number(v[x]) || 0) / (dagenInMaand * 3)
    const ratio = (o, x, y) => (Number(o[y]) > 0 ? Number(o[x]) / Number(o[y]) : 0)
    const schakels = [
      { key: 'views', label: 'Views', nu: perDagNu('views'), voor: perDagVoor('views'), toon: getal(n.views) },
      { key: 'leads', label: 'Leads', nu: perDagNu('leads'), voor: perDagVoor('leads'), toon: getal(n.leads) },
      { key: 'reactie', label: 'Reactie', nu: ratio(n, 'reacties', 'leads'), voor: ratio(v, 'reacties', 'leads'), toon: getal(n.reacties), pct: true },
      { key: 'call', label: 'Call', nu: ratio(n, 'calls', 'reacties'), voor: ratio(v, 'calls', 'reacties'), toon: getal(n.calls), pct: true },
      { key: 'sale', label: 'Sale', nu: ratio(n, 'sales', 'calls'), voor: ratio(v, 'sales', 'calls'), toon: getal(n.sales), pct: true },
      { key: 'prijs', label: '€ / sale', nu: ratio(n, 'omzet', 'sales'), voor: ratio(v, 'omzet', 'sales'), toon: euro(ratio(n, 'omzet', 'sales')) },
    ].map(s => ({ ...s, verschil: s.voor > 0 ? s.nu / s.voor - 1 : 0 }))
    const zwakste = [...schakels].sort((x, y) => x.verschil - y.verschil)
    const omzet = Number(n.omzet) || 0
    const prognose = omzet / dagenVoorbij * dagenInMaand
    // Terugrekensom op de omzetting van de afgelopen 3 maanden.
    const p = prijs || Math.round(ratio(v, 'omzet', 'sales')) || 297
    const sales = Math.ceil(doel / p)
    const calls = Math.ceil(sales / (ratio(v, 'sales', 'calls') || 0.3))
    const reacties = Math.ceil(calls / (ratio(v, 'calls', 'reacties') || 0.06))
    const leads = Math.ceil(reacties / (ratio(v, 'reacties', 'leads') || 0.13))
    return { schakels, zwakste, omzet, prognose, p, som: { sales, calls, reacties, leads } }
  }, [data, doel, prijs, dagenVoorbij, dagenInMaand])

  if (fout) return <div style={{ background: C.bg, color: C.rood, padding: 24 }}>Business OS laadt niet: {fout}</div>
  if (!a) return <div style={{ background: C.bg, color: C.zacht, padding: 24, minHeight: '60vh', fontWeight: 700 }}>Laden…</div>

  const pctDoel = Math.min(100, a.omzet / doel * 100)
  const uur = nu.getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'
  const nodigPerDag = Math.max(0, doel - a.omzet) / Math.max(1, dagenInMaand - dagenVoorbij)
  const opKoers = a.prognose >= doel
  const zw = a.zwakste[0]

  return (
    <div style={{
      background: C.bg,
      color: C.tekst, minHeight: '100vh', padding: isMobile ? 16 : 24,
    }}>
      {/* ── Compacte regel; klik = maanddoel + kerncijfers ── */}
      <div style={{ borderBottom: `1px solid ${C.rand}`, marginBottom: 16 }}>
        <button
          type="button" onClick={() => wissel('boven')} aria-expanded={!!open.boven}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none',
            color: C.tekst, cursor: 'pointer', padding: '12px 0', minHeight: 48, fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', fontWeight: 700, color: C.zacht, lineHeight: 1.5 }}>
            Omzet <b style={{ ...NUM, color: C.wit }}>{euro(a.omzet)}</b> van {euro(doel)}
            {' · '}prognose <b style={{ ...NUM, color: opKoers ? C.groen : C.oranje }}>{euro(a.prognose)}</b>
            {' · '}zwakste schakel: <b style={{ color: C.wit }}>{zw.label}</b>
          </span>
          <ChevronDown size={18} style={{ color: C.zacht, flexShrink: 0, transition: 'transform .2s', transform: open.boven ? 'rotate(180deg)' : 'none' }} />
        </button>
        {open.boven && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr repeat(4, 1fr)', gap: isMobile ? 16 : 24, paddingBottom: 16 }}>
            <Paneel style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ ...LABEL, color: C.zacht }}>Omzet deze maand · doel {euro(doel)}</div>
              <div style={{ ...NUM, fontSize: isMobile ? '2rem' : '2.4rem', fontWeight: 900 }}>{euro(a.omzet)}</div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${pctDoel}%`, height: '100%', background: C.wit }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: C.zacht }}>
                Prognose <b style={{ color: opKoers ? C.groen : C.oranje }}>{euro(a.prognose)}</b> · nodig {euro(nodigPerDag)} per dag
              </div>
            </Paneel>
            {[
              ['VIEWS', getal(data.nu.views)],
              ['LEADS', getal(data.nu.leads)],
              ['CALLS', getal(data.nu.calls)],
              ['KLANTEN', `${data.klanten?.actief ?? 0}`],
            ].map(([l, w]) => (
              <Paneel key={l}>
                <div style={{ ...LABEL, color: C.zacht }}>{l}</div>
                <div style={{ ...NUM, fontSize: '1.6rem', fontWeight: 900, marginTop: 4 }}>{w}</div>
              </Paneel>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* ── Chat centraal ── */}
        <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.5, marginTop: 8 }}>
          {groet} Kersten. {opKoers ? 'Je ligt op koers voor je doel.' : `Je mist ${euro(doel - a.prognose)} op je doel als dit tempo blijft.`}
        </div>
        <BusinessChat lijstHoogte={isMobile ? '55vh' : '62vh'} context={{
          omzet: Math.round(a.omzet), doel, prognose: Math.round(a.prognose), prijsPerSale: a.p,
          dezeMaand: data.nu, gemiddeldeAfgelopen3Maanden: data.voor,
          schakels: a.schakels.map(s => ({ schakel: s.label, verschilTovGemiddelde: Math.round(s.verschil * 100) + '%' })),
          zwaksteSchakel: zw.label, nodigVoorDoel: a.som, actieveKlanten: data.klanten?.actief,
        }} />

        {/* ── Cijfers: alles standaard ingeklapt ── */}
        <div style={{ ...LABEL, color: C.zacht, marginTop: 40, paddingBottom: 4, borderBottom: `1px solid ${C.rand}` }}>Cijfers</div>

        <Inklap titel="De keten · deze maand vs. gemiddelde" open={!!open.keten} onToggle={() => wissel('keten')}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 8 }}>
            {a.schakels.map(s => {
              const kleur = s.verschil <= -0.25 ? C.rood : s.verschil < -0.05 ? C.oranje : C.groen
              return (
                <div key={s.key} style={{ borderBottom: `2px solid ${s.key === zw.key ? C.rood : 'transparent'}`, padding: '8px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.zacht }}>{s.label}</div>
                  <div style={{ ...NUM, fontSize: '1.1rem', fontWeight: 900, margin: '4px 0' }}>{s.toon}</div>
                  <div style={{ ...NUM, fontSize: '0.75rem', fontWeight: 800, color: kleur }}>
                    {s.verschil >= 0 ? '+' : ''}{Math.round(s.verschil * 100)}%
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '0.75rem', color: C.zacht, marginTop: 8 }}>
            Views en leads per dag; reactie, call en sale als omzetting van de stap ervoor.
          </div>
        </Inklap>

        <Inklap titel="Acties deze week" open={!!open.acties} onToggle={() => wissel('acties')}>
          {a.zwakste.filter(s => s.verschil < -0.05).slice(0, 3).map((s, i) => (
            <div key={s.key} style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: '0.9rem', lineHeight: 1.45 }}>
              <span style={{ ...NUM, color: C.groen, fontWeight: 900 }}>{i + 1}</span>
              <span>{ACTIES[s.key]}</span>
            </div>
          ))}
          {!a.zwakste.some(s => s.verschil < -0.05) && (
            <div style={{ fontSize: '0.9rem' }}>Alle schakels draaien op of boven je gemiddelde. Schaal het volume op: meer magnets en meer outreach.</div>
          )}
        </Inklap>

        <Inklap titel="Terugrekensom · wat is er nodig" open={!!open.som} onToggle={() => wissel('som')}>
          <div style={{ display: 'flex', gap: isMobile ? 16 : 24, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.rand}` }}>
            <Invoer label="Doel per maand (€)" waarde={doel} onChange={v => { setDoel(v); bewaar(DOEL_KEY, v) }} />
            <Invoer label="Prijs per sale (€)" waarde={prijs || a.p} onChange={v => { setPrijs(v); bewaar(PRIJS_KEY, v) }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            {[['Sales', a.som.sales], ['Calls', a.som.calls], ['Reacties', a.som.reacties], ['Leads', a.som.leads]].map(([l, w]) => (
              <div key={l}>
                <div style={{ ...NUM, fontSize: '1.2rem', fontWeight: 900 }}>{getal(w)}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.zacht }}>{l} / mnd</div>
                <div style={{ ...NUM, fontSize: '0.75rem', fontWeight: 700, color: C.groen }}>{getal(w / 4.33)} / week</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: C.zacht, marginTop: 8 }}>
            Gerekend met jouw omzetting van de afgelopen 3 maanden.
          </div>
        </Inklap>

        <Inklap titel="Calls · komende 3 dagen" open={!!open.calls} onToggle={() => wissel('calls')}>
          {(data.calls || []).length === 0 && <div style={{ fontSize: '0.85rem', color: C.zacht }}>Geen calls ingepland.</div>}
          {(data.calls || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ ...NUM, fontSize: '0.8rem', fontWeight: 800, color: C.groen, minWidth: 64 }}>
                {new Date(c.datum).toLocaleDateString('nl-NL', { weekday: 'short' })} {c.tijd || ''}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.naam}</div>
            </div>
          ))}
        </Inklap>

        <Inklap titel="Laatste sales" open={!!open.sales} onToggle={() => wissel('sales')}>
          {(data.sales || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.naam}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.zacht }}>{new Date(s.at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div style={{ ...NUM, fontSize: '0.9rem', fontWeight: 900, color: C.groen }}>{euro(s.bedrag)}</div>
            </div>
          ))}
        </Inklap>

        <Inklap titel="Agents" open={!!open.agents} onToggle={() => wissel('agents')}>
          {(data.agents || []).map(ag => {
            const ok = ag.actief && ag.status === 'succeeded'
            const kleur = !ag.actief ? C.zacht : ok ? C.groen : C.rood
            return (
              <div key={ag.naam} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{AGENTS[ag.naam] || ag.naam}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.zacht }}>
                    {!ag.actief ? 'uit' : ag.laatst ? new Date(ag.laatst).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'nog niet gedraaid'}
                    {ag.actief && ag.status && ag.status !== 'succeeded' ? ` · ${ag.status}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </Inklap>
      </div>
    </div>
  )
}
