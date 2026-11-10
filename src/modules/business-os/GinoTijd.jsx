// src/modules/business-os/GinoTijd.jsx
//
// Waar Kerstens tijd achter de Mac heen gaat (2 nov 2026), in de stijl van
// Gino's bol. Gino meet elke minuut welke app/site voorop staat
// (scripts/gino-tijd.mjs → business_os_tijd); business_os_tijd_overzicht deelt
// in, met Gino's eigen regels voorrang.
//
//   ┌ geldtijd-ring ┐ ┌ per categorie ┐ ┌ grootste tijdvreters ┐
//   └──────────── per dag van de week, gestapeld ─────────────┘
//
// Geldtijd = sales + calls + coaching + content: tijd die omzet oplevert.
// focus (van Gino): een categorie en/of een datum licht op, de rest dimt.
//
// Dag openen (5 nov 2026): klik op een staaf, of Gino's focus op een datum. Dan
// toont het hele scherm die dag: dezelfde RPC met van = tot, plus een tijdlijn
// per uur (veld uren) met de afspraken uit agenda_events ernaast.
//
// Schakelaar Agenda | Staven (10 nov 2026): Agenda (standaard) = weekrooster
// 06-23 uur, per dag de RPC met van = tot (veld uren); klik op een dagkop opent
// de dag. Staven = het oude overzicht.

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const TIJD_SOORTEN = [
  ['sales', 'Sales', true],
  ['calls', 'Calls', true],
  ['coaching', 'Coaching', true],
  ['content', 'Content', true],
  ['bouwen', 'Bouwen', false],
  ['admin', 'Admin', false],
  ['social', 'Social', false],
  ['afleiding', 'Afleiding', false],
  ['overig', 'Overig', false],
]
const GELD = new Set(TIJD_SOORTEN.filter(s => s[2]).map(s => s[0]))
const LABEL = Object.fromEntries(TIJD_SOORTEN.map(([k, l]) => [k, l]))
// Geld in groentinten, de rest in grijzen: in één oogopslag wat iets oplevert.
const KLEUR = {
  sales: G, calls: '#4ade80', coaching: '#16a34a', content: '#86efac',
  bouwen: 'rgba(255,255,255,0.55)', admin: 'rgba(255,255,255,0.38)', social: 'rgba(255,255,255,0.26)',
  afleiding: 'rgba(255,255,255,0.18)', overig: 'rgba(255,255,255,0.12)',
}
const WEEKDAG = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const uren = (min) => (min >= 60 ? `${Math.floor(min / 60)}u${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}` : `${min}m`)

const nlDag = (ts) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const nlTijd = (ts) => new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })
const nlMin = (ts) => { const [h, m] = nlTijd(ts).split(':').map(Number); return h * 60 + m }
// Het UTC-moment van 00:00 in NL: de RPC knipt de dag ook op Europe/Amsterdam.
const nlMiddernacht = (dag) => {
  const u = new Date(`${dag}T00:00:00Z`)
  return new Date(u.getTime() - (nlMin(u) / 60) * 3600000)
}
const volgendeDag = (dag) => new Date(new Date(`${dag}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10)
const IS_CALL = new Set(['salescall', 'klantcall', 'opstartcall'])
const STIJL = `
  @keyframes gt-draai { to { transform: rotate(360deg) } }
  @keyframes gt-groei { from { transform: scaleY(0) } to { transform: scaleY(1) } }
  @keyframes gt-breed { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  .gt-dag { transition: background .15s, opacity .3s }
  .gt-dag:hover { background: rgba(255,255,255,0.07) }
`

function maakSom(data) {
  const perSoort = {}, perDag = {}
  for (const r of data?.dagen || []) {
    perSoort[r.categorie] = (perSoort[r.categorie] || 0) + r.minuten
    ;(perDag[r.dag] ||= {})[r.categorie] = r.minuten
  }
  const totaal = data?.totaal || 0
  const geld = Object.entries(perSoort).filter(([k]) => GELD.has(k)).reduce((a, [, v]) => a + v, 0)
  const maxDag = Math.max(60, ...Object.values(perDag).map(d => Object.values(d).reduce((a, b) => a + b, 0)))
  const vreters = (data?.bronnen || []).filter(b => !GELD.has(b.categorie)).slice(0, 6)
  return { perSoort, perDag, totaal, geld, maxDag, vreters }
}

function GeldRing({ geld, totaal }) {
  const deel = totaal ? geld / totaal : 0
  const R = 58, C = 72, omtrek = 2 * Math.PI * R
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="144" height="144" viewBox="0 0 144 144" style={{ flexShrink: 0, overflow: 'visible' }}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle cx={C} cy={C} r={R} fill="none" stroke={G} strokeWidth="6" strokeLinecap="round" transform={`rotate(-90 ${C} ${C})`}
          strokeDasharray={omtrek} style={{ strokeDashoffset: omtrek * (1 - deel), transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)', filter: `drop-shadow(0 0 6px ${G})` }} />
        <circle cx={C} cy={C} r="50" fill="none" stroke={`${G}55`} strokeWidth="1" strokeDasharray="3 6" style={{ transformOrigin: `${C}px ${C}px`, animation: 'gt-draai 14s linear infinite' }} />
        <text x={C} y={C + 8} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="900">{Math.round(deel * 100)}%</text>
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: `0 0 24px ${G}44` }}>{uren(geld)}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>
          geldtijd van {uren(totaal)}<br />achter de Mac
        </div>
      </div>
    </div>
  )
}

// Geldtijd-ring, categorieën en tijdvreters: zelfde blok voor week en dag.
function TijdStats({ som, focusSoort, isMobile }) {
  const soorten = TIJD_SOORTEN.filter(([k]) => som.perSoort[k])
  const maxSoort = Math.max(...soorten.map(([k]) => som.perSoort[k]))
  const dim = (soort) => (focusSoort && soort !== focusSoort ? 0.22 : 1)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr', gap: isMobile ? 20 : 36, alignItems: 'start' }}>
      <GeldRing geld={som.geld} totaal={som.totaal} />

      {/* Per categorie */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        {soorten.map(([k, l], i) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '78px 1fr 52px', alignItems: 'center', gap: 10, opacity: dim(k), transition: 'opacity .3s' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: GELD.has(k) ? '#fff' : 'rgba(255,255,255,0.6)' }}>{l}</span>
            <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <span style={{
                display: 'block', height: '100%', width: `${(som.perSoort[k] / maxSoort) * 100}%`, borderRadius: 3, background: KLEUR[k],
                boxShadow: GELD.has(k) ? `0 0 8px ${G}88` : 'none', transformOrigin: 'left', animation: `gt-breed .7s cubic-bezier(.2,.8,.2,1) ${i * 60}ms both`,
              }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{uren(som.perSoort[k])}</span>
          </div>
        ))}
      </div>

      {/* Grootste tijdvreters: waar de winst zit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Grootste tijdvreters</div>
        {som.vreters.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Alles was geldtijd.</div>}
        {som.vreters.map(b => (
          <div key={`${b.bron}|${b.categorie}`} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: dim(b.categorie), transition: 'opacity .3s' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: KLEUR[b.categorie], flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.bron}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{uren(b.minuten)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Eén afspraak: tijd en titel, call met groene stip.
function Afspraak({ e }) {
  const tijd = e.hele_dag ? 'Hele dag' : `${nlTijd(e.start_at)}${e.end_at ? `–${nlTijd(e.end_at)}` : ''}`
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, alignSelf: 'center', background: IS_CALL.has(e.soort) ? G : 'rgba(255,255,255,0.35)' }} />
      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{tijd}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)', minWidth: 0, overflowWrap: 'anywhere' }}>{e.titel || 'Afspraak'}</span>
    </div>
  )
}

// Tijdlijn: één rij per uur, gestapeld per categorie, afspraken op hun startuur.
function Tijdlijn({ dag, urenData, agenda, totaal, focusSoort }) {
  const { rijen, heleDag, schaal } = useMemo(() => {
    const perUur = {}
    for (const r of urenData) (perUur[r.uur] ||= {})[r.categorie] = r.minuten
    const heleDag = agenda.filter(e => e.hele_dag)
    const blokken = agenda.filter(e => !e.hele_dag).map(e => {
      const startMin = nlDag(e.start_at) === dag ? nlMin(e.start_at) : 0
      const eindMin = !e.end_at ? startMin + 30 : nlDag(e.end_at) === dag ? nlMin(e.end_at) : 24 * 60
      return { e, startUur: Math.floor(startMin / 60), eindUur: Math.max(Math.ceil(eindMin / 60), Math.floor(startMin / 60) + 1) }
    })
    const gemeten = Object.keys(perUur).map(Number)
    const eerste = Math.min(...gemeten, ...blokken.map(b => b.startUur))
    const laatste = Math.min(23, Math.max(...gemeten, ...blokken.map(b => b.eindUur - 1)))
    const rijen = []
    for (let u = eerste; u <= laatste; u++) {
      const soorten = perUur[u] || {}
      rijen.push({
        uur: u, soorten,
        tot: Object.values(soorten).reduce((a, b) => a + b, 0),
        starten: blokken.filter(b => b.startUur === u).map(b => b.e),
        // Leeg uur: welke afspraak verklaart het gat?
        loopt: blokken.find(b => b.startUur <= u && u < b.eindUur)?.e || null,
      })
    }
    return { rijen, heleDag, schaal: Math.max(60, ...rijen.map(r => r.tot)) }
  }, [dag, urenData, agenda])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Tijdlijn per uur</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{uren(totaal)}</span>
      </div>
      {heleDag.map(e => <Afspraak key={e.id} e={e} />)}
      {rijen.map(r => (
        <div key={r.uur} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 46px', columnGap: 10, rowGap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: r.tot ? '#fff' : 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>{String(r.uur).padStart(2, '0')}</span>
          <div style={{ position: 'relative', height: 16, display: 'flex', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
            {TIJD_SOORTEN.filter(([c]) => r.soorten[c]).map(([c, l]) => (
              <span key={c} title={`${l} ${uren(r.soorten[c])}`} style={{ width: `${(r.soorten[c] / schaal) * 100}%`, background: KLEUR[c], opacity: focusSoort && c !== focusSoort ? 0.25 : 1 }} />
            ))}
            {!r.tot && r.loopt && (
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.loopt.titel || 'Afspraak'}</span>
            )}
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: r.tot ? '#fff' : 'rgba(255,255,255,0.3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.tot ? uren(r.tot) : '–'}</span>
          {r.starten.length > 0 && (
            <div style={{ gridColumn: '2 / 4', display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 3 }}>
              {r.starten.map(e => <Afspraak key={e.id} e={e} />)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Eén dag op het hele scherm. Remount per dag (key), dus geen oude cijfers.
function TijdDag({ dag, focusSoort, isMobile, onTerug }) {
  const [stand, setStand] = useState(null)
  useEffect(() => {
    let weg = false
    const start = nlMiddernacht(dag).toISOString()
    const eind = nlMiddernacht(volgendeDag(dag)).toISOString()
    Promise.all([
      supabase.rpc('business_os_tijd_overzicht', { van: dag, tot: dag }).then(r => r, e => ({ error: e })),
      // Ook wat vóór deze dag begon en er nog doorheen loopt.
      supabase.from('agenda_events').select('id, titel, start_at, end_at, hele_dag, soort')
        .lt('start_at', eind).or(`end_at.gt.${start},and(end_at.is.null,start_at.gte.${start})`)
        .order('start_at').limit(100).then(r => r, e => ({ error: e })),
    ]).then(([tijd, agenda]) => {
      if (weg) return
      setStand({ tijd: tijd.data || null, tijdFout: !!tijd.error, agenda: agenda.data || [], agendaFout: !!agenda.error })
    })
    return () => { weg = true }
  }, [dag])

  const som = useMemo(() => maakSom(stand?.tijd), [stand])
  const titel = new Date(`${dag}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  const rustig = { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }

  return (
    <div className="gk-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22, padding: '6px 4px 4px' }}>
      <style>{STIJL}</style>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 10 : 16, flexShrink: 0 }}>
        <button type="button" onClick={onTerug} style={{
          display: 'flex', alignItems: 'center', gap: 7, minHeight: 40, padding: '0 14px', cursor: 'pointer', borderRadius: 10,
          background: `${G}1f`, border: `1.5px solid ${G}`, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap',
        }}>
          <ArrowLeft size={15} strokeWidth={2.8} color={G} /> Terug naar de week
        </button>
        <span style={{ fontSize: isMobile ? 17 : 19, fontWeight: 900, color: '#fff' }}>{titel.charAt(0).toUpperCase() + titel.slice(1)}</span>
      </div>

      {!stand ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gt-draai 1.2s linear infinite' }} />
        </div>
      ) : som.totaal > 0 ? (
        <>
          <TijdStats som={som} focusSoort={focusSoort} isMobile={isMobile} />
          <Tijdlijn dag={dag} urenData={stand.tijd.uren || []} agenda={stand.agenda} totaal={som.totaal} focusSoort={focusSoort} />
          {stand.agendaFout && <div style={rustig}>De agenda kon niet laden.</div>}
          {!stand.agendaFout && stand.agenda.length === 0 && <div style={rustig}>Geen afspraken in de agenda.</div>}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <div style={rustig}>{stand.tijdFout ? 'De gemeten tijd van deze dag kon niet laden.' : 'Geen gemeten tijd op deze dag.'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>Agenda</span>
            {stand.agenda.map(e => <Afspraak key={e.id} e={e} />)}
            {stand.agendaFout && <div style={rustig}>De agenda kon niet laden.</div>}
            {!stand.agendaFout && stand.agenda.length === 0 && <div style={rustig}>Geen afspraken in de agenda.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// Weekagenda (10 nov 2026): rooster als een agenda-app, 06:00-23:00. Per uur
// een vak dat vult met de gemeten minuten per categorie (60 min = vol), geld
// onderin; afspraken als omlijning met titel over de uren heen.
const AG_VAN = 6, AG_TOT = 23
const UUR_H = 34
const AG_UREN = Array.from({ length: AG_TOT - AG_VAN }, (_, i) => AG_VAN + i)
const AG_VOLGORDE = [...TIJD_SOORTEN.filter(s => s[2]), ...TIJD_SOORTEN.filter(s => !s[2])].map(s => s[0])

function WeekAgenda({ dagen, focusSoort, focusDag, isMobile, onKiesDag }) {
  const keys = useMemo(() => dagen.map(iso), [dagen])
  const [stand, setStand] = useState(null)
  useEffect(() => {
    let weg = false
    const start = nlMiddernacht(keys[0]).toISOString()
    const eind = nlMiddernacht(volgendeDag(keys[keys.length - 1])).toISOString()
    Promise.all([
      ...keys.map(k => supabase.rpc('business_os_tijd_overzicht', { van: k, tot: k }).then(r => r, e => ({ error: e }))),
      supabase.from('agenda_events').select('id, titel, start_at, end_at, hele_dag, soort')
        .lt('start_at', eind).or(`end_at.gt.${start},and(end_at.is.null,start_at.gte.${start})`)
        .order('start_at').limit(300).then(r => r, e => ({ error: e })),
    ]).then((res) => {
      if (weg) return
      const agenda = res.pop()
      setStand({ dagen: res.map(r => r.data?.uren || []), agenda: agenda.data || [], fout: res.some(r => r.error) || !!agenda.error })
    })
    return () => { weg = true }
  }, [keys])

  const kolommen = useMemo(() => {
    if (!stand) return []
    return keys.map((k, i) => {
      const perUur = {}
      let geld = 0
      for (const r of stand.dagen[i]) {
        ;(perUur[r.uur] ||= {})[r.categorie] = r.minuten
        if (GELD.has(r.categorie)) geld += r.minuten
      }
      const d0 = nlMiddernacht(k).getTime(), d1 = nlMiddernacht(volgendeDag(k)).getTime()
      const heleDag = [], blokken = []
      for (const e of stand.agenda) {
        const s = new Date(e.start_at).getTime()
        const t = e.end_at ? new Date(e.end_at).getTime() : s + 30 * 60000
        if (t <= d0 || s >= d1) continue
        if (e.hele_dag) { heleDag.push(e); continue }
        const a = Math.max(AG_VAN * 60, (Math.max(s, d0) - d0) / 60000)
        const b = Math.min(AG_TOT * 60, (Math.min(t, d1) - d0) / 60000)
        if (b > a) blokken.push({ e, a, b })
      }
      // Overlap: elke volgende afspraak een baan naar rechts.
      const banen = []
      for (const bl of blokken) {
        let baan = banen.findIndex(eind => eind <= bl.a)
        if (baan < 0) { baan = banen.length; banen.push(0) }
        banen[baan] = bl.b
        bl.baan = baan
      }
      return { k, perUur, geld, heleDag, blokken }
    })
  }, [stand, keys])

  const vandaag = iso(new Date())
  const minKol = isMobile ? 86 : 92
  const raster = { display: 'grid', gridTemplateColumns: `44px repeat(${keys.length}, minmax(${minKol}px, 1fr))`, columnGap: 6, minWidth: 44 + keys.length * (minKol + 6) }
  const links = { position: 'sticky', left: 0, zIndex: 2, background: '#000' }

  if (!stand) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gt-draai 1.2s linear infinite' }} />
    </div>
  )

  return (
    <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <div style={raster}>
        {/* Kop: dag + geldtijd, vast bovenin */}
        <div style={{ ...links, top: 0, zIndex: 4 }} />
        {kolommen.map((c, i) => {
          const d = dagen[i]
          return (
            <button key={c.k} type="button" className="gt-dag" onClick={() => onKiesDag(c.k)} aria-label={`${WEEKDAG[i]} ${d.getDate()}: ${uren(c.geld)} geldtijd`} style={{
              position: 'sticky', top: 0, zIndex: 3, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 0 8px', margin: 0, border: 'none', borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit', minWidth: 0,
            }}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, maxWidth: '100%', opacity: focusDag && focusDag !== c.k ? 0.3 : 1 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: c.k === vandaag ? G : 'rgba(255,255,255,0.55)' }}>{WEEKDAG[i]} {d.getDate()}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: c.geld ? '#fff' : 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
                {c.geld ? (c.geld / 60).toLocaleString('nl-NL', { maximumFractionDigits: 1 }) + 'u' : '–'}
              </span>
              {c.heleDag.map(e => (
                <span key={e.id} title={e.titel || 'Afspraak'} style={{ maxWidth: '100%', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titel || 'Afspraak'}</span>
              ))}
              </span>
            </button>
          )
        })}

        {/* Uurlabels vast links */}
        <div style={{ ...links, height: AG_UREN.length * UUR_H }}>
          {AG_UREN.map(u => (
            <div key={u} style={{ height: UUR_H, fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, transform: 'translateY(-5px)' }}>
              {String(u).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Per dag een kolom: uurvakken + afspraken eroverheen */}
        {kolommen.map(c => (
          <div key={c.k} style={{ position: 'relative', height: AG_UREN.length * UUR_H, opacity: focusDag && focusDag !== c.k ? 0.3 : 1, transition: 'opacity .3s' }}>
            {AG_UREN.map(u => {
              const soorten = c.perUur[u] || {}
              const tot = Object.values(soorten).reduce((a, b) => a + b, 0)
              const schaal = Math.max(60, tot)
              return (
                <div key={u} style={{ height: UUR_H, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '2px 0', boxSizing: 'border-box' }}>
                  <div title={tot ? AG_VOLGORDE.filter(s => soorten[s]).map(s => `${LABEL[s]} ${uren(soorten[s])}`).join(' · ') : undefined}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' }}>
                    {AG_VOLGORDE.filter(s => soorten[s]).map(s => (
                      <span key={s} style={{ height: `${(soorten[s] / schaal) * 100}%`, flexShrink: 0, background: KLEUR[s], opacity: focusSoort && s !== focusSoort ? 0.22 : 1, transition: 'opacity .3s' }} />
                    ))}
                  </div>
                </div>
              )
            })}
            {c.blokken.map(({ e, a, b, baan }) => {
              const call = IS_CALL.has(e.soort)
              const hoog = ((b - a) / 60) * UUR_H
              return (
                <div key={e.id} title={`${nlTijd(e.start_at)}${e.end_at ? `–${nlTijd(e.end_at)}` : ''} ${e.titel || 'Afspraak'}`} style={{
                  position: 'absolute', top: ((a - AG_VAN * 60) / 60) * UUR_H, height: Math.max(hoog, 6), left: baan * 8, right: 0, zIndex: 1 + baan,
                  border: `1.5px solid ${call ? G : 'rgba(255,255,255,0.75)'}`, borderRadius: 5, boxSizing: 'border-box', pointerEvents: 'none',
                  padding: '1px 5px', overflow: 'hidden',
                }}>
                  {hoog >= 14 && (
                    <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, lineHeight: 1.25, color: '#fff', textShadow: '0 1px 3px #000, 0 0 2px #000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.titel || 'Afspraak'}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {stand.fout && <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', padding: '12px 4px' }}>Niet alles kon laden.</div>}
    </div>
  )
}

function Schakelaar({ vorm, onVorm }) {
  return (
    <div role="group" aria-label="Weergave" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      {[['agenda', 'Agenda'], ['staven', 'Staven']].map(([id, l]) => {
        const aan = vorm === id
        return (
          <button key={id} type="button" onClick={() => onVorm(id)} aria-pressed={aan} style={{
            minHeight: 34, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
            border: 'none', background: aan ? colors.surface : 'transparent', color: aan ? G : 'rgba(255,255,255,0.6)',
            boxShadow: aan ? `inset 0 0 0 1.5px ${G}` : `inset 0 0 0 1px ${colors.borderSubtle}`,
          }}>{l}</button>
        )
      })}
    </div>
  )
}

export default function GinoTijd({ dagen, focus, isMobile = false }) {
  const [vorm, setVorm] = useState('agenda')
  const [data, setData] = useState(null)
  const van = iso(dagen[0]), tot = iso(dagen[dagen.length - 1])
  useEffect(() => {
    let weg = false
    setData(null)
    supabase.rpc('business_os_tijd_overzicht', { van, tot })
      .then(({ data: d }) => { if (!weg) setData(d || { dagen: [], bronnen: [], totaal: 0 }) }, () => { if (!weg) setData({ dagen: [], bronnen: [], totaal: 0 }) })
    return () => { weg = true }
  }, [van, tot])

  const f = useMemo(() => {
    const fs = focus ? [...focus] : []
    return { soort: fs.find(x => LABEL[x]) || null, dag: fs.find(x => /^\d{4}-\d{2}-\d{2}$/.test(x)) || null }
  }, [focus])

  // Geopende dag hoort bij de week van dat moment: bladeren gaat terug naar de week.
  const [keuze, setKeuze] = useState(null)
  const gekozen = keuze?.week === van ? keuze.dag : null
  // Elke nieuwe focus van Gino op een datum opent die dag, ook na Terug.
  useEffect(() => {
    if (f.dag) setKeuze({ dag: f.dag, week: van })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alleen bij een nieuwe focus, niet bij bladeren
  }, [f])

  const som = useMemo(() => maakSom(data), [data])

  const dim = (soort, dag) => (f.soort && soort && soort !== f.soort) || (f.dag && dag && dag !== f.dag) ? 0.22 : 1
  const vandaag = iso(new Date())

  if (gekozen) return <TijdDag key={gekozen} dag={gekozen} focusSoort={f.soort} isMobile={isMobile} onTerug={() => setKeuze(null)} />

  const stavenInhoud = !data ? (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gt-draai 1.2s linear infinite' }} />
    </div>
  ) : !som.totaal ? (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Gino meet vanaf nu elke minuut waar je tijd achter de Mac heen gaat.<br />
        <span style={{ color: '#fff' }}>Zodra er een paar uur in staat, zie je hier waar de winst zit.</span>
      </div>
    </div>
  ) : (
    <div className="gk-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22, padding: '2px 0 0' }}>
      <TijdStats som={som} focusSoort={f.soort} isMobile={isMobile} />

      {/* Per dag, gestapeld: geld onderin */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dagen.length}, 1fr)`, gap: isMobile ? 6 : 14, alignItems: 'end', minHeight: 150, flex: 1 }}>
        {dagen.map((d, i) => {
          const k = iso(d)
          const dag = som.perDag[k] || {}
          const tot = Object.values(dag).reduce((a, b) => a + b, 0)
          const geld = Object.entries(dag).filter(([c]) => GELD.has(c)).reduce((a, [, v]) => a + v, 0)
          return (
            <button key={k} type="button" className="gt-dag" onClick={() => setKeuze({ dag: k, week: van })} aria-label={`${WEEKDAG[i]} ${d.getDate()}: ${tot ? uren(tot) : 'geen data'}`} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', width: '100%', justifyContent: 'flex-end', opacity: dim(null, k),
              padding: '4px 0', margin: 0, background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', minWidth: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: tot ? '#fff' : 'rgba(255,255,255,0.3)' }}>{tot ? uren(tot) : '–'}</span>
              <div title={tot ? `${uren(geld)} geldtijd` : ''} style={{
                width: '100%', maxWidth: 46, height: `${(tot / som.maxDag) * 120}px`, minHeight: tot ? 3 : 0, display: 'flex', flexDirection: 'column-reverse',
                borderRadius: 6, overflow: 'hidden', transformOrigin: 'bottom', animation: `gt-groei .7s cubic-bezier(.2,.8,.2,1) ${i * 50}ms both`,
              }}>
                {TIJD_SOORTEN.filter(([c]) => dag[c]).map(([c]) => (
                  <span key={c} style={{ flex: dag[c], background: KLEUR[c], opacity: f.soort && c !== f.soort ? 0.25 : 1 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: k === vandaag ? G : 'rgba(255,255,255,0.55)' }}>{WEEKDAG[i]} {d.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Schakelaar bovenin; daaronder agenda of staven.
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '6px 4px 4px' }}>
      <style>{STIJL}</style>
      <Schakelaar vorm={vorm} onVorm={setVorm} />
      {vorm === 'agenda' ? (
        <WeekAgenda key={van} dagen={dagen} focusSoort={f.soort} focusDag={f.dag} isMobile={isMobile} onKiesDag={(k) => setKeuze({ dag: k, week: van })} />
      ) : (
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>{stavenInhoud}</div>
      )}
    </div>
  )
}
