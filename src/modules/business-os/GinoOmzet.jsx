// src/modules/business-os/GinoOmzet.jsx
//
// Omzet in één beeld, in de stijl van Gino's bol (31 okt 2026). Zelfde cijfers
// als het omzetscherm in de leadbalk (OmzetScherm.jsx), want het leest dezelfde
// service: getRevenueProjection (omzet per kalendermaand, per bron) en
// getPartnerPayouts (ontvangen per uitbetaalperiode 26e t/m 25e, vaste lasten,
// adspend, deel Marcel). Plus get_payment_schedule voor wat er nog binnenkomt.
// Puur tekenwerk: GinoKalender haalt de data op.
//
//   ┌ doelwijzer ┐ ┌ waar vandaan ┐ ┌ verdeling ┐
//   └────────────── maandgrafiek met doellijn ──┘
//   komt nog binnen: chips met datum · naam · bedrag

import { useEffect, useMemo, useState } from 'react'
import { colors } from '../../ui/tokens'

const G = colors.success
const BRONNEN = [
  ['coaching', 'Coaching'],
  ['verlenging', 'Verlenging'],
  ['vervolg', 'Vervolg'],
  ['challenge', 'Challenge'],
]
const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`
const kortEuro = (n) => (Math.abs(n) >= 10000 ? `€${(n / 1000).toFixed(0)}k` : Math.abs(n) >= 1000 ? `€${(n / 1000).toFixed(1).replace('.', ',')}k` : euro(n))

// Getal telt op, zoals in Gino's beelden.
function useTel(doel, duur = 1200) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, t0
    const stap = (t) => {
      t0 ??= t
      const p = Math.min(1, (t - t0) / duur)
      setN(doel * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(stap)
    }
    raf = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(raf)
  }, [doel, duur])
  return n
}

const kop = (tekst) => (
  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.3em', color: `${G}cc`, marginBottom: 10, textTransform: 'uppercase' }}>{tekst}</div>
)

function Doelwijzer({ bedrag, doel, maandNaam, isHuidig }) {
  const geteld = useTel(bedrag)
  const deel = doel > 0 ? bedrag / doel : 0
  const R = 62, C = 80, omtrek = 2 * Math.PI * R
  const vol = Math.min(1, deel)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0, overflow: 'visible' }}>
        {Array.from({ length: 60 }, (_, i) => {
          const h = (i / 60) * Math.PI * 2
          const lang = i % 5 === 0
          const aan = i / 60 < vol
          return (
            <line key={i} x1={C + Math.sin(h) * 76} y1={C - Math.cos(h) * 76} x2={C + Math.sin(h) * (lang ? 70 : 73)} y2={C - Math.cos(h) * (lang ? 70 : 73)}
              stroke={aan ? G : 'rgba(255,255,255,0.18)'} strokeWidth={lang ? 1.6 : 1}
              style={{ animation: `go-in .3s ease-out ${i * 12}ms both` }} />
          )
        })}
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle cx={C} cy={C} r={R} fill="none" stroke={G} strokeWidth="6" strokeLinecap="round" transform={`rotate(-90 ${C} ${C})`}
          strokeDasharray={omtrek} style={{ '--go-tot': omtrek * (1 - vol), strokeDashoffset: omtrek * (1 - vol), animation: 'go-ring 1.4s cubic-bezier(.2,.8,.2,1) both', filter: `drop-shadow(0 0 6px ${G})` }} />
        <circle cx={C} cy={C} r="50" fill={`url(#go-gloed)`} />
        <circle cx={C} cy={C} r="54" fill="none" stroke={`${G}55`} strokeWidth="1" strokeDasharray="3 6" style={{ transformOrigin: `${C}px ${C}px`, animation: 'go-draai 14s linear infinite' }} />
        <defs>
          <radialGradient id="go-gloed"><stop offset="0%" stopColor={G} stopOpacity=".22" /><stop offset="100%" stopColor={G} stopOpacity="0" /></radialGradient>
        </defs>
        <text x={C} y={C - 2} textAnchor="middle" fill="#fff" fontSize="22" fontWeight="900">{Math.round(deel * 100)}%</text>
        <text x={C} y={C + 16} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9.5" fontWeight="800" letterSpacing="1.5">VAN DOEL</text>
      </svg>
      <div style={{ minWidth: 0 }}>
        {kop(`Omzet ${maandNaam}`)}
        <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 24px ${G}44` }}>{euro(geteld)}</div>
        {doel > 0 && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>
            doel {euro(doel)}<br />
            {bedrag < doel
              ? <span style={{ color: '#fff' }}>nog {euro(doel - bedrag)}{isHuidig ? ' te gaan' : ' tekort'}</span>
              : <span style={{ color: G }}>doel gehaald (+{euro(bedrag - doel)})</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// Wat Gino aanwijst licht op; de rest dimt.
const dim = (focus, sleutel) => (!focus || focus.has(sleutel) ? 1 : 0.25)

function Bronnen({ maand, toegezegd, focus }) {
  const per = maand?.perBron || {}
  const max = Math.max(1, ...BRONNEN.map(([k]) => per[k] || 0))
  const totaal = BRONNEN.reduce((t, [k]) => t + (per[k] || 0), 0)
  const bronFocus = focus && BRONNEN.some(([k]) => focus.has(k))
  return (
    <div>
      {kop('Waar komt het vandaan')}
      {BRONNEN.map(([k, label], i) => {
        const v = per[k] || 0
        return (
          <div key={k} style={{
            marginBottom: 10, opacity: bronFocus ? (focus.has(k) ? 1 : 0.25) : v ? 1 : 0.45, transition: 'opacity .4s',
            animation: `go-in .35s ease-out ${200 + i * 80}ms both`,
            ...(bronFocus && focus.has(k) ? { padding: '6px 8px', margin: '-6px -8px 4px', borderRadius: 10, boxShadow: `0 0 0 1px ${G}, 0 0 22px ${G}44`, background: `${G}0f` } : {}),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              <span>{label}{bronFocus && focus.has(k) && totaal > 0 && <span style={{ color: G, marginLeft: 8 }}>{Math.round((v / totaal) * 100)}% van je omzet</span>}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{euro(v)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(v / max) * 100}%`, borderRadius: 4, background: k === 'challenge' ? `${G}88` : G, boxShadow: v ? `0 0 10px ${G}88` : 'none', transformOrigin: 'left', animation: `go-balk .8s cubic-bezier(.2,.8,.2,1) ${300 + i * 80}ms both` }} />
            </div>
          </div>
        )
      })}
      {toegezegd?.aantal > 0 && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          Toegezegd, nog niet binnen: <span style={{ color: '#fff', fontWeight: 900 }}>{euro(toegezegd.totaal)}</span> ({toegezegd.aantal})
        </div>
      )}
    </div>
  )
}

function Verdeling({ p, partner = 'Marcel', focus }) {
  if (!p) return <div>{kop('Verdeling')}<div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>Geen gegevens voor deze periode.</div></div>
  const jij = Math.max(0, (p.netRevenue || 0) - (p.earned || 0))
  const regels = [
    ['Ontvangen', p.revenue, '#fff'],
    ['Vaste lasten', -(p.fixedCosts || 0), 'rgba(255,255,255,0.5)'],
    ['Adspend', -(p.adSpend || 0), 'rgba(255,255,255,0.5)'],
    ['Te verdelen', p.netRevenue, G],
  ]
  const totaal = Math.max(1, (p.earned || 0) + jij)
  const aan = focus && focus.has('verdeling')
  return (
    <div style={aan ? { padding: 10, margin: -10, borderRadius: 12, boxShadow: `0 0 0 1px ${G}, 0 0 22px ${G}44`, background: `${G}0f` } : null}>
      {kop(`Verdeling · ${p.label || ''}`)}
      <div style={{ position: 'relative', paddingLeft: 12 }}>
        <div style={{ position: 'absolute', left: 2, top: 6, bottom: 6, width: 1, background: `linear-gradient(to bottom, ${G}22, ${G})`, transformOrigin: 'top', animation: 'go-lijn .6s ease-out .2s both' }} />
        {regels.map(([l, v, kleur], i) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: l === 'Te verdelen' ? 900 : 700, color: kleur, padding: '2px 0', animation: `go-in .3s ease-out ${250 + i * 90}ms both` }}>
            <span>{l}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{v < 0 ? `− ${euro(-v)}` : euro(v)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', margin: '10px 0 6px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: `${(jij / totaal) * 100}%`, background: G, boxShadow: `0 0 10px ${G}`, transformOrigin: 'left', animation: 'go-balk .8s ease-out .6s both' }} />
        <div style={{ width: `${((p.earned || 0) / totaal) * 100}%`, background: 'rgba(255,255,255,0.55)', transformOrigin: 'left', animation: 'go-balk .8s ease-out .75s both' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 900 }}>
        <span style={{ color: G }}>Jij {euro(jij)}</span>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>{partner} {euro(p.earned)}</span>
      </div>
      {p.outstanding > 0.5 && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
          Nog uit te betalen aan {partner}: <span style={{ color: '#fff', fontWeight: 900 }}>{euro(p.outstanding)}</span>
        </div>
      )}
    </div>
  )
}

function Maandgrafiek({ maanden, doel, gekozen, onKies, hoogte, focus }) {
  const max = Math.max(doel || 0, ...maanden.map(m => m.amount)) * 1.12 || 1
  const H = Math.max(80, hoogte - 34)
  const yDoel = doel ? H - (doel / max) * H : null
  return (
    <div style={{ position: 'relative', height: hoogte, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 16 }}>
      {yDoel != null && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 16 + yDoel, borderTop: `1px dashed ${G}88`, pointerEvents: 'none', animation: 'go-in .5s ease-out .8s both' }}>
          <span style={{ position: 'absolute', right: 0, top: -16, fontSize: 9.5, fontWeight: 800, letterSpacing: '.2em', color: G }}>DOEL {kortEuro(doel)}</span>
        </div>
      )}
      {maanden.map((m, i) => {
        const h = Math.max(2, (m.amount / max) * H)
        const actief = m.key === gekozen
        const gedimd = focus && [...focus].some(f => /^\d{4}-\d{2}$/.test(f)) && !focus.has(m.key)
        const toekomst = !m.isPast && !m.isCurrent
        const gehaald = doel && m.amount >= doel
        return (
          <button key={m.key} type="button" onClick={() => onKies(m.key)} title={`${m.label}: ${euro(m.amount)}`} style={{
            flex: 1, minWidth: 0, height: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', opacity: gedimd ? 0.3 : 1, transition: 'opacity .4s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 900, color: actief ? G : toekomst ? 'rgba(255,255,255,0.4)' : '#fff', fontVariantNumeric: 'tabular-nums', animation: `go-in .3s ease-out ${400 + i * 50}ms both` }}>
              {m.amount ? kortEuro(m.amount) : ''}
            </span>
            <div style={{
              width: '100%', maxWidth: 46, height: h, borderRadius: '6px 6px 2px 2px',
              background: toekomst ? `${G}10` : actief || m.isCurrent ? G : gehaald ? `${G}cc` : `${G}55`,
              border: toekomst ? `1px dashed ${G}88` : 'none',
              boxShadow: actief ? `0 0 18px ${G}, 0 0 0 1px ${G}` : m.isCurrent ? `0 0 14px ${G}88` : 'none',
              transformOrigin: 'bottom', animation: `go-staaf .7s cubic-bezier(.2,.8,.2,1) ${i * 50}ms both`,
            }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: actief ? G : 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {m.label.replace(/\.? \d{4}$/, '').slice(0, 3)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// focus: Set van wat Gino aanwijst: 'coaching' | 'verlenging' | 'vervolg' | 'challenge' |
// 'verdeling' | 'doel' | 'grafiek' | 'komt' | 'YYYY-MM' (maand in de grafiek).
export default function GinoOmzet({ data, maandKey, onKiesMaand, isMobile = false, hoogte = 420, focus = null }) {
  const maanden = useMemo(() => {
    const alle = data?.revenue?.months || []
    const i = alle.findIndex(m => m.isCurrent)
    return i < 0 ? alle.slice(-12) : alle.slice(Math.max(0, i - 8), i + 4) // 8 terug, nu, 3 vooruit
  }, [data])
  const gekozen = maandKey && maanden.some(m => m.key === maandKey) ? maandKey : maanden.find(m => m.isCurrent)?.key
  const maand = maanden.find(m => m.key === gekozen)
  const periode = (data?.payouts?.months || []).find(p => p.key === gekozen)
  const doel = Number(data?.doel) || 0
  const vandaag = new Date().toISOString().slice(0, 10)
  const komt = (data?.schema || []).filter(b => b.komt_nog !== false && b.datum >= vandaag).slice(0, 8)
  const maandNaam = maand ? new Date(`${maand.key}-15T12:00:00`).toLocaleDateString('nl-NL', { month: 'long' }) : ''

  if (!data) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflowY: 'auto' }} className="gk-scroll">
      <style>{`
        @keyframes go-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes go-ring { from { stroke-dashoffset: 390 } to { stroke-dashoffset: var(--go-tot) } }
        @keyframes go-draai { to { transform: rotate(360deg) } }
        @keyframes go-balk { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes go-staaf { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes go-lijn { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      `}</style>
      <div key={gekozen} style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr)',
        gap: isMobile ? 20 : 40, alignItems: 'start', flexShrink: 0,
      }}>
        <div style={{ opacity: dim(focus, 'doel'), transition: 'opacity .4s' }}><Doelwijzer bedrag={maand?.amount || 0} doel={doel} maandNaam={maandNaam} isHuidig={!!maand?.isCurrent} /></div>
        <div style={{ opacity: focus && !BRONNEN.some(([k]) => focus.has(k)) ? 0.25 : 1, transition: 'opacity .4s' }}>
          <Bronnen maand={maand} focus={focus} toegezegd={maand?.isCurrent ? { totaal: data.revenue?.toegezegdTotaal, aantal: data.revenue?.toegezegdAantal } : null} />
        </div>
        <div style={{ opacity: dim(focus, 'verdeling'), transition: 'opacity .4s' }}><Verdeling p={periode} focus={focus} /></div>
      </div>

      <div style={{ flex: 1, minHeight: 150, marginTop: 18, opacity: focus && !focus.has('grafiek') && ![...focus].some(f => /^\d{4}-\d{2}$/.test(f)) ? 0.25 : 1, transition: 'opacity .4s' }}>
        <Maandgrafiek maanden={maanden} doel={doel} gekozen={gekozen} onKies={onKiesMaand} focus={focus} hoogte={Math.max(150, Math.min(220, hoogte - 250))} />
      </div>

      {komt.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, flexShrink: 0, opacity: dim(focus, 'komt'), transition: 'opacity .4s' }}>
          {komt.map((b, i) => (
            <span key={i} title={b.soort} style={{
              fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap',
              border: `1px solid ${b.te_laat ? '#f59e0b' : `${G}55`}`, color: '#fff', background: `${G}0d`,
              animation: `go-in .3s ease-out ${600 + i * 60}ms both`,
            }}>
              <span style={{ color: b.te_laat ? '#f59e0b' : G }}>{new Date(`${b.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
              {' · '}{String(b.lead_name || '').trim().split(/\s+/)[0]} · {euro(b.bedrag)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
