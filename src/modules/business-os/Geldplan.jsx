// src/modules/business-os/Geldplan.jsx
//
// Geldplan (1 nov 2026): 6 maanden cashflow + break-even, visueel en
// interactief. Puntjes-menu → Geldplan. Alle sommen zitten in de RPC
// get_geldplan (geldplan.sql); dit scherm rekent zelf niets, zodat Gino
// (context 'geldplan') precies dezelfde getallen noemt. Eigen instellingen
// (alleen wat Kersten verschuift) staan in business_os_geldplan; de rest komt
// uit geldplan_standaard() met echte data.

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { laadGeldplan, maandNaam } from './geldplanData'

const C = {
  wit: colors.textPrimary,
  zacht: colors.textSecondary,
  rand: colors.borderSubtle,
  groen: colors.success,
  oranje: '#f59e0b',
  rood: colors.danger,
  grijs: 'rgba(255,255,255,0.22)',
}
const NUM = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }
const LABEL = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }
const euro = (n) => (Number(n) < 0 ? '−€' : '€') + Math.abs(Math.round(Number(n) || 0)).toLocaleString('nl-NL')

// Getal dat naar zijn nieuwe waarde optelt.
function Teller({ waarde, kleur, groot }) {
  const [toon, setToon] = useState(0)
  const van = useRef(0)
  useEffect(() => {
    const begin = van.current, doel = Number(waarde) || 0, t0 = performance.now()
    let raf
    const stap = (t) => {
      const p = Math.min(1, (t - t0) / 700)
      const v = begin + (doel - begin) * (1 - Math.pow(1 - p, 3))
      setToon(v)
      van.current = v
      if (p < 1) raf = requestAnimationFrame(stap)
    }
    raf = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(raf)
  }, [waarde])
  return <span style={{ ...NUM, color: kleur, fontWeight: 900, fontSize: groot ? '1.9rem' : '1.5rem', lineHeight: 1.1 }}>{euro(toon)}</span>
}

function Uitleg({ children }) {
  return <div style={{ fontSize: '0.8rem', lineHeight: 1.5, color: C.zacht, marginTop: 6 }}>{children}</div>
}

// Hoofdgrafiek: saldo-lijn die zichzelf tekent, noodgrens, stop Paviljoen,
// per maand een staafje binnen (groen) en uit (grijs).
function Grafiek({ g, open, onMaand }) {
  const mnd = g.maanden
  const s = g.instellingen || {}
  const nood = Number(s.noodgrens) || 0
  const W = 600, H = 300, L = 12, R = 12, lijnTop = 34, lijnOnder = 168, staafTop = 196, staafOnder = 268
  const saldi = [Number(s.startsaldo) || 0, ...mnd.map(m => m.saldo_eind)]
  const lo = Math.min(nood, ...saldi), hi = Math.max(nood, ...saldi)
  const marge = Math.max(200, (hi - lo) * 0.12)
  const y = (v) => lijnOnder - ((v - (lo - marge)) / ((hi + marge) - (lo - marge))) * (lijnOnder - lijnTop)
  const kol = (W - L - R) / mnd.length
  const xEind = (i) => L + kol * (i + 1) - kol / 2
  const punten = [[L, y(saldi[0])], ...mnd.map((m, i) => [xEind(i), y(m.saldo_eind)])]
  const d = punten.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const maxStaaf = Math.max(1, ...mnd.flatMap(m => [m.binnen + m.inkomen_prive, m.uit]))
  const sh = (v) => (v / maxStaaf) * (staafOnder - staafTop)
  const stopIdx = s.paviljoen === 'aan' ? -1 : mnd.findIndex(m => m.maand >= '2027-01-01')
  // Lijn tekent zichzelf bij openen; daarna schuift hij alleen mee.
  const [getekend, setGetekend] = useState(false)
  useEffect(() => { const t = setTimeout(() => setGetekend(true), 30); return () => clearTimeout(t) }, [])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label="Saldo per maand">
      {/* noodgrens */}
      <line x1={L} x2={W - R} y1={y(nood)} y2={y(nood)} stroke={C.rood} strokeWidth={1.5} strokeDasharray="6 6" />
      <text x={W - R} y={y(nood) - 6} textAnchor="end" fill={C.rood} fontSize={12} fontWeight={800}>noodgrens {euro(nood)}</text>
      {/* stop Paviljoen */}
      {stopIdx > 0 && (
        <g>
          <line x1={L + kol * stopIdx} x2={L + kol * stopIdx} y1={lijnTop - 14} y2={staafOnder} stroke={C.zacht} strokeWidth={1} strokeDasharray="2 4" />
          <text x={L + kol * stopIdx + 6} y={lijnTop - 18} fill={C.zacht} fontSize={12} fontWeight={800}>
            {s.paviljoen === 'zondag' ? 'Paviljoen alleen zondag' : 'stop Paviljoen'}
          </text>
        </g>
      )}
      {/* saldo-lijn */}
      <path d={d} fill="none" stroke={C.wit} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={getekend ? 0 : 1}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.3,.7,.2,1)' }} />
      {mnd.map((m, i) => {
        const laag = m.saldo_eind < nood
        return (
          <g key={m.maand} onClick={() => onMaand(i)} style={{ cursor: 'pointer' }}>
            <rect x={L + kol * i} y={0} width={kol} height={H} fill={open === i ? 'rgba(255,255,255,0.05)' : 'transparent'} rx={10} />
            <circle cx={xEind(i)} cy={y(m.saldo_eind)} r={6} fill={laag ? C.rood : C.wit}
              style={{ opacity: getekend ? 1 : 0, transition: `opacity .3s ${0.25 + i * 0.2}s` }} />
            <text x={xEind(i)} y={y(m.saldo_eind) - 14} textAnchor="middle" fill={laag ? C.rood : C.wit} fontSize={14} fontWeight={900}
              style={{ ...NUM, opacity: getekend ? 1 : 0, transition: `opacity .3s ${0.25 + i * 0.2}s` }}>
              {Math.round(m.saldo_eind / 100) / 10}K
            </text>
            {/* binnen (groen) en uit (grijs) */}
            <rect x={xEind(i) - 14} y={staafOnder - sh(m.binnen + m.inkomen_prive)} width={12} height={sh(m.binnen + m.inkomen_prive)} rx={3} fill={C.groen} />
            <rect x={xEind(i) + 2} y={staafOnder - sh(m.uit)} width={12} height={sh(m.uit)} rx={3} fill={C.grijs} />
            <text x={xEind(i)} y={H - 8} textAnchor="middle" fill={open === i ? C.wit : C.zacht} fontSize={13} fontWeight={800}>{maandNaam(m.maand)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Schuif({ label, waarde, min, max, stap, fmt, onChange }) {
  return (
    <label style={{ display: 'block', padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>{label}</span>
        <span style={{ ...NUM, fontSize: '1rem', fontWeight: 900, color: C.wit }}>{fmt ? fmt(waarde) : waarde}</span>
      </div>
      <input type="range" min={min} max={max} step={stap} value={waarde}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.groen, minHeight: 28 }} />
    </label>
  )
}

function Getal({ label, waarde, onChange }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '6px 0' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>{label}</span>
      <input type="number" inputMode="numeric" value={waarde}
        onChange={e => onChange(Number(e.target.value) || 0)}
        style={{
          width: 110, textAlign: 'right', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.rand}`,
          borderRadius: 0, color: C.wit, ...NUM, fontSize: '1rem', fontWeight: 800, padding: '8px 0', minHeight: 40, outline: 'none',
        }} />
    </label>
  )
}

const PAVILJOEN = [['stop', 'Stop'], ['zondag', 'Alleen zondag'], ['aan', 'Blijf']]

export default function Geldplan() {
  const [eigen, setEigen] = useState(null)
  const [g, setG] = useState(null)
  const [fout, setFout] = useState(false)
  const [uitleg, setUitleg] = useState(null)
  const [maand, setMaand] = useState(null)
  const [meer, setMeer] = useState(false)
  const reken = useRef(null)
  const bewaarT = useRef(null)

  // Eigen instellingen ophalen, daarna rekenen.
  useEffect(() => {
    let weg = false
    supabase.from('business_os_geldplan').select('instellingen').maybeSingle()
      .then(({ data }) => data?.instellingen || {}, () => ({}))
      .then(e => { if (!weg) setEigen(e) })
    return () => { weg = true }
  }, [])
  useEffect(() => {
    if (!eigen) return
    let weg = false
    clearTimeout(reken.current)
    reken.current = setTimeout(() => {
      laadGeldplan(eigen).then(d => { if (weg) return; if (d) { setG(d); setFout(false) } else setFout(true) })
    }, 120)
    return () => { weg = true; clearTimeout(reken.current) }
  }, [eigen])
  useEffect(() => () => clearTimeout(bewaarT.current), [])

  const bewaar = useCallback((nieuw) => {
    clearTimeout(bewaarT.current)
    bewaarT.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return
      await supabase.from('business_os_geldplan')
        .upsert({ coach_id: session.user.id, instellingen: nieuw, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
        .then(() => {}, () => {})
    }, 700)
  }, [])
  const zet = (k, v) => setEigen(e => { const n = { ...e, [k]: v }; bewaar(n); return n })
  const standaard = () => { setEigen({}); bewaar({}) }

  if (fout && !g) return <div style={{ color: C.zacht, fontWeight: 700 }}>Geldplan laadt niet.</div>
  if (!g) return <div style={{ color: C.zacht, fontWeight: 700 }}>Rekenen…</div>

  const s = g.instellingen || {}
  const mnd = g.maanden || []
  const nood = Number(s.noodgrens) || 0
  const pavSs = s.paviljoen === 'aan' ? s.paviljoen_aan : s.paviljoen === 'zondag' ? s.paviljoen_zondag : 0
  const quitte = g.jij_houdt_gem + (Number(s.zorgtoeslag) || 0) + (Number(pavSs) || 0) >= g.nodig_per_maand
  const teLaag = g.laagste_saldo < nood
  const n = Number(s.klanten_per_week) || 0
  const be = Number(g.break_even_klanten_per_week) || 0
  const schaal = 8
  const pos = (v) => `${Math.min(100, Math.max(0, (v / schaal) * 100))}%`
  const eerste = mnd[0]
  const open = maand != null ? mnd[maand] : null

  const tegels = [
    {
      k: 'jij', label: 'Jij houdt per maand', waarde: g.jij_houdt_gem, kleur: quitte ? C.groen : C.oranje,
      uitleg: <>Gemiddeld jan–apr. Definitief binnen (behouden borg {euro(s.borg)} + {s.termijnen}× {euro(s.termijn)} termijnen + lopende coaching) − adspend {euro(s.adspend)} − Marcel {s.marcel_pct}%{Number(s.gedeelde_lasten) ? ` (na ${euro(s.gedeelde_lasten)} gedeelde lasten)` : ''}{s.belasting_aan ? ` − ${s.belasting_pct}% belasting` : ''}. Elke klant per week extra ≈ +{euro(g.per_extra_klant_stabiel)}/mnd.</>,
    },
    {
      k: 'nodig', label: 'Nodig per maand', waarde: g.nodig_per_maand, kleur: C.wit,
      uitleg: <>Privé {euro(s.prive)} + zakelijk {euro(s.zakelijk)}. Nov +{euro(s.zakelijk_extra_nov)} en dec +{euro(s.zakelijk_extra_dec)} businesscoach. Zorgtoeslag {euro(s.zorgtoeslag)} komt er los bij.</>,
    },
    {
      k: 'saldo', label: 'Saldo eind april', waarde: g.saldo_eind_april, kleur: teLaag ? C.rood : C.wit,
      uitleg: <>Start {euro(s.startsaldo)} + alles wat binnenkomt (borg, termijnen, Paviljoen, zorgtoeslag) − borg terug − Marcel − vaste lasten − adspend. Laagste stand {euro(g.laagste_saldo)}. Openstaande borg van lopende challengers ({euro(eerste?.openstaande_borg)} eind nov) zit in je saldo maar is nog niet van jou.</>,
    },
  ]

  return (
    <div style={{ color: C.wit }}>
      {/* ── 3 grote getallen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 8 }}>
        {tegels.map(t => (
          <button key={t.k} type="button" onClick={() => setUitleg(u => (u === t.k ? null : t.k))} style={{
            textAlign: 'left', background: 'none', border: 'none', padding: 0, color: 'inherit', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <div style={{ ...LABEL, color: C.zacht, marginBottom: 4 }}>{t.label}</div>
            <Teller waarde={t.waarde} kleur={t.kleur} groot />
          </button>
        ))}
      </div>
      {uitleg && <Uitleg>{tegels.find(t => t.k === uitleg)?.uitleg}</Uitleg>}

      {/* ── Saldo per maand ── */}
      <div style={{ marginTop: 24 }}>
        <Grafiek g={g} open={maand} onMaand={i => setMaand(x => (x === i ? null : i))} />
        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', fontWeight: 700, color: C.zacht, marginTop: 4 }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: C.groen, marginRight: 6 }} />binnen</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: C.grijs, marginRight: 6 }} />uit</span>
          <span>tik op een maand</span>
        </div>
        {open && (
          <Uitleg>
            <b style={{ color: C.wit }}>{maandNaam(open.maand)}:</b> binnen {euro(open.binnen + open.inkomen_prive)} (borg {euro(open.borg_in)}, termijnen {euro(open.termijnen + open.overig)}, Paviljoen {euro(open.paviljoen)}, zorg {euro(open.zorgtoeslag)}) · uit {euro(open.uit)} (borg terug {euro(open.borg_terug)}, Marcel {euro(open.marcel)}, lasten {euro(open.zakelijk + open.prive)}, ads {euro(open.adspend)}{open.belasting ? `, belasting ${euro(open.belasting)}` : ''}) · jij houdt {euro(open.jij_houdt)} · nog niet van jou {euro(open.openstaande_borg)}
          </Uitleg>
        )}
      </div>

      {/* ── Break-even ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>
          Je speelt quitte bij <span style={{ ...NUM, color: C.groen }}>{String(be).replace('.', ',')}</span> klanten per week
        </div>
        <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', margin: '18px 0 26px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pos(n), borderRadius: 5, background: n >= be ? C.groen : C.oranje, transition: 'width .4s' }} />
          <div style={{ position: 'absolute', left: pos(be), top: -6, bottom: -6, width: 3, borderRadius: 2, background: C.wit, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: pos(be), top: 18, transform: 'translateX(-50%)', fontSize: '0.72rem', fontWeight: 800, color: C.zacht, whiteSpace: 'nowrap' }}>quitte</div>
          <div style={{ position: 'absolute', left: pos(n), top: -24, transform: 'translateX(-50%)', ...NUM, fontSize: '0.8rem', fontWeight: 900, color: n >= be ? C.groen : C.oranje, whiteSpace: 'nowrap', transition: 'left .4s' }}>nu {String(n).replace('.', ',')}</div>
        </div>
      </div>

      {/* ── Schuifjes ── */}
      <div style={{ marginTop: 8, borderTop: `1px solid ${C.rand}`, paddingTop: 8 }}>
        <Schuif label="Nieuwe klanten per week" waarde={n} min={1} max={8} stap={0.5} fmt={v => String(v).replace('.', ',')} onChange={v => zet('klanten_per_week', v)} />
        <Schuif label="Doorstap" waarde={Number(s.doorstap_pct)} min={20} max={90} stap={5} fmt={v => `${v}%`} onChange={v => zet('doorstap_pct', v)} />
        <Schuif label="Borg terug (niet-doorstappers)" waarde={Number(s.borg_terug_pct)} min={0} max={100} stap={10} fmt={v => `${v}%`} onChange={v => zet('borg_terug_pct', v)} />
        <Schuif label="Privé per maand" waarde={Number(s.prive)} min={300} max={2000} stap={25} fmt={euro} onChange={v => zet('prive', v)} />
        <Schuif label="Zakelijk per maand" waarde={Number(s.zakelijk)} min={200} max={1500} stap={1} fmt={euro} onChange={v => zet('zakelijk', v)} />
        <div style={{ padding: '10px 0' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht, marginBottom: 8 }}>Paviljoen vanaf januari</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PAVILJOEN.map(([k, l]) => {
              const aan = (s.paviljoen || 'stop') === k
              return (
                <button key={k} type="button" onClick={() => zet('paviljoen', k)} style={{
                  flex: 1, minHeight: 44, borderRadius: 12, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                  border: `1px solid ${aan ? C.groen : C.rand}`, background: aan ? `${C.groen}1f` : 'transparent', color: aan ? C.groen : C.wit,
                }}>{l}</button>
              )
            })}
          </div>
        </div>

        <button type="button" onClick={() => setMeer(m => !m)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.zacht, fontFamily: 'inherit',
          fontSize: '0.85rem', fontWeight: 800, padding: '12px 0', minHeight: 44, cursor: 'pointer',
        }}>
          Meer instellingen <ChevronDown size={16} style={{ transform: meer ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        {meer && (
          <div style={{ paddingBottom: 8 }}>
            <Getal label="Startsaldo (31 okt)" waarde={s.startsaldo} onChange={v => zet('startsaldo', v)} />
            <Getal label="Adspend per maand" waarde={s.adspend} onChange={v => zet('adspend', v)} />
            <Getal label="Zorgtoeslag" waarde={s.zorgtoeslag} onChange={v => zet('zorgtoeslag', v)} />
            <Getal label="Paviljoen 4 nov" waarde={s.paviljoen_nov} onChange={v => zet('paviljoen_nov', v)} />
            <Getal label="Paviljoen 2 dec" waarde={s.paviljoen_dec} onChange={v => zet('paviljoen_dec', v)} />
            <Getal label="Paviljoen alleen zondag" waarde={s.paviljoen_zondag} onChange={v => zet('paviljoen_zondag', v)} />
            <Getal label="Gedeelde lasten met Marcel" waarde={s.gedeelde_lasten} onChange={v => zet('gedeelde_lasten', v)} />
            <Getal label="Noodgrens" waarde={s.noodgrens} onChange={v => zet('noodgrens', v)} />
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.zacht }}>Belasting reserveren</span>
              <input type="checkbox" checked={!!s.belasting_aan} onChange={e => zet('belasting_aan', e.target.checked)}
                style={{ width: 22, height: 22, accentColor: C.groen }} />
            </label>
            {s.belasting_aan && (
              <Schuif label="Belasting" waarde={Number(s.belasting_pct)} min={0} max={50} stap={1} fmt={v => `${v}%`} onChange={v => zet('belasting_pct', v)} />
            )}
            <button type="button" onClick={standaard} style={{
              marginTop: 8, minHeight: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${C.rand}`, background: 'transparent',
              color: C.wit, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
            }}>Terug naar standaard</button>
          </div>
        )}
      </div>
    </div>
  )
}
