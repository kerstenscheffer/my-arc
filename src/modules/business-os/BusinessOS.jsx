// src/modules/business-os/BusinessOS.jsx
//
// Business OS (30 okt 2026): het ene scherm waar alles samenkomt. Bovenaan het
// maanddoel, dan de keten content → lead → reactie → call → sale met de
// zwakste schakel, acties en de terugrekensom, daaronder calls, laatste sales
// en de agents (pg_cron-jobs). MY ARC-stijl: tokens uit src/ui/tokens, accent
// groen (Kersten, zie Coach Inzicht). Data: RPC get_business_os (business-os.sql).

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { colors, radius, space } from '../../ui/tokens'

const ACCENT = colors.success
const ORANJE = '#f59e0b'
// Drie tekstgroottes op dit scherm: label, body, waarde.
const F = { label: 12, body: 15, waarde: 26 }
const DOEL_KEY = 'business_os_doel'
const PRIJS_KEY = 'business_os_prijs'

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

const label = { fontSize: F.label, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textSecondary }
const waarde = { fontSize: F.waarde, fontWeight: 900, color: colors.textPrimary, letterSpacing: '-0.02em' }

function Kaart({ titel, children, style }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.card, padding: space[4], ...style }}>
      {titel && <div style={{ fontSize: F.body, fontWeight: 800, color: colors.textPrimary, marginBottom: space[3] }}>{titel}</div>}
      {children}
    </div>
  )
}

function Ring({ pct }) {
  const r = 34, omtrek = 2 * Math.PI * r
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
      <circle cx="42" cy="42" r={r} fill="none" stroke={colors.borderSubtle} strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={ACCENT} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - pct / 100)} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" fill={colors.textPrimary} fontSize={F.body} fontWeight="900">{Math.round(pct)}%</text>
    </svg>
  )
}

function Invoer({ titel, waarde: w, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: space[1], flex: 1, ...label }}>
      {titel}
      <input
        type="number" inputMode="numeric" value={w}
        onChange={e => onChange(Math.max(1, Number(e.target.value) || 0))}
        style={{
          background: colors.bg, border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.btn,
          color: colors.textPrimary, fontSize: F.body, fontWeight: 800, padding: `${space[2]}px ${space[3]}px`, minHeight: 44,
        }}
      />
    </label>
  )
}

function Rij({ links, rechts, sub, kleur }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space[3], padding: `${space[2]}px 0`, borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: F.body, fontWeight: 700, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{links}</div>
        {sub && <div style={{ fontSize: F.label, color: colors.textSecondary }}>{sub}</div>}
      </div>
      <div style={{ fontSize: F.body, fontWeight: 800, color: kleur || colors.textPrimary, flexShrink: 0 }}>{rechts}</div>
    </div>
  )
}

export default function BusinessOS({ isMobile }) {
  const [data, setData] = useState(null)
  const [fout, setFout] = useState(null)
  const [doel, setDoel] = useState(() => lees(DOEL_KEY, 10000))
  const [prijs, setPrijs] = useState(() => lees(PRIJS_KEY, 0))

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

    if (fout) return <div style={{ background: colors.bg, color: colors.danger, padding: space[4] }}>Business OS laadt niet: {fout}</div>
  if (!a) return <div style={{ background: colors.bg, color: colors.textSecondary, padding: space[4], minHeight: '60vh' }}>Laden…</div>

  const pctDoel = Math.min(100, a.omzet / doel * 100)
  const uur = nu.getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'
  const nodigPerDag = Math.max(0, doel - a.omzet) / Math.max(1, dagenInMaand - dagenVoorbij)
  const opKoers = a.prognose >= doel
  const zw = a.zwakste[0]
  const acties = a.zwakste.filter(s => s.verschil < -0.05).slice(0, 3)
  const kleurVan = (v) => v <= -0.25 ? colors.danger : v < -0.05 ? ORANJE : ACCENT
  const pct = (v) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', padding: isMobile ? space[4] : space[6] }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: space[4] }}>

        {/* ── Highlight: maanddoel ── */}
        <div style={{ background: colors.surface, borderRadius: radius.card, padding: space[4], borderLeft: `4px solid ${ACCENT}`, display: 'flex', alignItems: 'center', gap: space[4] }}>
          <Ring pct={pctDoel} />
          <div style={{ minWidth: 0 }}>
            <div style={label}>Omzet deze maand · doel {euro(doel)}</div>
            <div style={waarde}>{euro(a.omzet)}</div>
            <div style={{ fontSize: F.body, color: colors.textSecondary }}>
              {groet} Kersten. Prognose <b style={{ color: opKoers ? ACCENT : ORANJE }}>{euro(a.prognose)}</b>
              {!opKoers && <> · nodig {euro(nodigPerDag)} per dag</>}
            </div>
          </div>
        </div>

        {/* ── Kerncijfers ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: space[3] }}>
          {[['Views', getal(data.nu.views)], ['Leads', getal(data.nu.leads)], ['Calls', getal(data.nu.calls)], ['Actieve klanten', data.klanten?.actief ?? 0]].map(([l, w]) => (
            <Kaart key={l}><div style={label}>{l}</div><div style={waarde}>{w}</div></Kaart>
          ))}
        </div>

        {/* ── Keten ── */}
        <Kaart titel="De keten deze maand">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: space[3] }}>
            {a.schakels.map(s => (
              <div key={s.key}>
                <div style={label}>{s.label}</div>
                <div style={{ fontSize: F.body, fontWeight: 900, color: colors.textPrimary }}>{s.toon}</div>
                <div style={{ fontSize: F.label, fontWeight: 800, color: kleurVan(s.verschil) }}>{pct(s.verschil)}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: F.label, color: colors.textSecondary, marginTop: space[3] }}>
            Tegenover je gemiddelde van de 3 maanden ervoor. Views en leads per dag; reactie, call en sale als omzetting van de stap ervoor.
          </div>
        </Kaart>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: space[4] }}>
          {/* ── Acties ── */}
          <Kaart titel={`Zwakste schakel: ${zw.label} (${pct(zw.verschil)})`}>
            {acties.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', gap: space[3], padding: `${space[2]}px 0`, fontSize: F.body, lineHeight: 1.5, color: colors.textPrimary }}>
                <span style={{ fontWeight: 900, color: ACCENT }}>{i + 1}</span>
                <span>{ACTIES[s.key]}</span>
              </div>
            ))}
            {acties.length === 0 && (
              <div style={{ fontSize: F.body, color: colors.textPrimary }}>Alle schakels draaien op of boven je gemiddelde. Schaal het volume op: meer magnets en meer outreach.</div>
            )}
          </Kaart>

          {/* ── Terugrekensom ── */}
          <Kaart titel="Wat is er nodig">
            <div style={{ display: 'flex', gap: space[3], marginBottom: space[4] }}>
              <Invoer titel="Doel / maand" waarde={doel} onChange={v => { setDoel(v); bewaar(DOEL_KEY, v) }} />
              <Invoer titel="Prijs / sale" waarde={prijs || a.p} onChange={v => { setPrijs(v); bewaar(PRIJS_KEY, v) }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: space[2] }}>
              {[['Sales', a.som.sales], ['Calls', a.som.calls], ['Reacties', a.som.reacties], ['Leads', a.som.leads]].map(([l, w]) => (
                <div key={l}>
                  <div style={label}>{l}</div>
                  <div style={{ fontSize: F.body, fontWeight: 900, color: colors.textPrimary }}>{getal(w)} / mnd</div>
                  <div style={{ fontSize: F.label, fontWeight: 700, color: ACCENT }}>{getal(w / 4.33)} / week</div>
                </div>
              ))}
            </div>
          </Kaart>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: space[4] }}>
          <Kaart titel="Calls komende 3 dagen">
            {(data.calls || []).length === 0 && <div style={{ fontSize: F.body, color: colors.textSecondary }}>Geen calls ingepland. Stel er een voor aan je warmste reacties.</div>}
            {(data.calls || []).map((c, i) => (
              <Rij key={i} links={c.naam} rechts={`${new Date(c.datum).toLocaleDateString('nl-NL', { weekday: 'short' })} ${c.tijd || ''}`} />
            ))}
          </Kaart>
          <Kaart titel="Laatste sales">
            {(data.sales || []).map((s, i) => (
              <Rij key={i} links={s.naam} sub={new Date(s.at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} rechts={euro(s.bedrag)} kleur={ACCENT} />
            ))}
          </Kaart>
          <Kaart titel="Agents">
            {(data.agents || []).map(ag => {
              const ok = ag.actief && ag.status === 'succeeded'
              const kleur = !ag.actief ? colors.textSecondary : ok ? ACCENT : colors.danger
              const tijd = ag.laatst ? new Date(ag.laatst).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'nog niet'
              return (
                <Rij key={ag.naam} links={AGENTS[ag.naam] || ag.naam} kleur={kleur}
                  rechts={!ag.actief ? 'uit' : ok ? tijd : (ag.status || 'fout')} />
              )
            })}
          </Kaart>
        </div>
      </div>
    </div>
  )
}
