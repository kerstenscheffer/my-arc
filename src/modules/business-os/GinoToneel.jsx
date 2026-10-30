// src/modules/business-os/GinoToneel.jsx
//
// Gino laat iets zien (30 okt 2026). Gino stuurt in zijn antwoord een actie
// { soort: 'visueel', titel, blokken: [...], advies } en Business OS tekent die
// rond de bol: blokken links en rechts van de middengroep (desktop) of als
// strook bovenaan (mobiel). Geen code van de AI, alleen deze beschrijving:
//
//   blok   = { icoon, titel, waarde?, tekst?, toon?, beweging?, vorige?, verschil? }
//   vorige/verschil = vergelijking, bv. "sep €4.855" en "-4%": pijltje omhoog
//   of omlaag naar het teken van verschil, kleur volgt toon
//   icoon  = naam uit ICONEN hieronder (onbekend → Sparkles)
//   toon   = 'goed' | 'let_op' | 'leeg' | 'neutraal'
//   beweging = 'zweef' | 'puls' | 'draai' | 'schud' | 'geen'
//   advies = { tekst, icoon? }  → "Ik zou dit doen", onder de rechterkolom
//
// Max 8 blokken; de skill "Visueel uitleggen" vertelt Gino wanneer en hoe.
//
// Vrij (30 okt): { soort: 'visueel', titel, links: '<html>', rechts: '<html>' }.
// Gino ontwerpt zelf in HTML/SVG/CSS; visueelHtml.js filtert het en toont het
// in een afgesloten iframe per kant. Blokken en vrij kunnen niet tegelijk:
// staat er links/rechts in, dan wint vrij.
// De structuur van de pagina verandert niet: alles staat absoluut over de lege
// ruimte naast de groep en gaat met het kruisje weer weg.

import {
  Sparkles, Calendar, CalendarCheck, CalendarX, CalendarClock, Clock, Video, Film, Camera, Mic,
  Image, PenLine, FileText, ListChecks, CheckCircle2, Circle, AlertTriangle, Target, TrendingUp,
  TrendingDown, Rocket, Flame, Zap, Lightbulb, Users, User, MessageCircle, Phone, Mail, Megaphone,
  Eye, Heart, Star, Trophy, BarChart3, LineChart, PieChart, Euro, Wallet, Repeat, ArrowRight,
  Layers, Inbox, Send, Hourglass, Coffee, Dumbbell, Brain, Search, X, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../ui/tokens'
import { schoonHtml, maakSrcdoc, MAX_HTML } from './visueelHtml'

const ICONEN = {
  Sparkles, Calendar, CalendarCheck, CalendarX, CalendarClock, Clock, Video, Film, Camera, Mic,
  Image, PenLine, FileText, ListChecks, CheckCircle2, Circle, AlertTriangle, Target, TrendingUp,
  TrendingDown, Rocket, Flame, Zap, Lightbulb, Users, User, MessageCircle, Phone, Mail, Megaphone,
  Eye, Heart, Star, Trophy, BarChart3, LineChart, PieChart, Euro, Wallet, Repeat, ArrowRight,
  Layers, Inbox, Send, Hourglass, Coffee, Dumbbell, Brain, Search,
}

const TOON = {
  goed: colors.success,
  let_op: '#f59e0b',
  leeg: colors.textMuted,
  neutraal: colors.textPrimary,
}
const BEWEGING = {
  zweef: 'gt-zweef 3.2s ease-in-out infinite',
  puls: 'gt-puls 1.8s ease-in-out infinite',
  draai: 'gt-draai 6s linear infinite',
  schud: 'gt-schud 2.6s ease-in-out infinite',
  geen: 'none',
}
const ANIMATIES = `
@keyframes gt-in { from { opacity: 0; transform: translateY(10px) scale(0.96) } to { opacity: 1; transform: none } }
@keyframes gt-zweef { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes gt-puls { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.14); opacity: 0.75 } }
@keyframes gt-draai { to { transform: rotate(360deg) } }
@keyframes gt-schud { 0%,86%,100% { transform: rotate(0) } 89% { transform: rotate(-12deg) } 93% { transform: rotate(10deg) } 97% { transform: rotate(-6deg) } }
@keyframes gt-gloed { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0) } 50% { box-shadow: 0 0 18px 0 rgba(34,197,94,0.25) } }
@media (prefers-reduced-motion: reduce) { [data-gt] * { animation: none !important } }
`

// Ruwe actie → nette beschrijving (alles wat de AI stuurt is onbetrouwbaar).
function schoonVisueel(v) {
  if (!v || typeof v !== 'object') return null
  const str = (x, n) => (typeof x === 'string' || typeof x === 'number' ? String(x).slice(0, n) : '')
  const links = str(v.links, MAX_HTML), rechts = str(v.rechts, MAX_HTML)
  if (links.trim() || rechts.trim()) return { titel: str(v.titel, 60), vrij: { links, rechts } }
  const blokken = (Array.isArray(v.blokken) ? v.blokken : []).slice(0, 8).map(b => ({
    icoon: ICONEN[b?.icoon] ? b.icoon : 'Sparkles',
    titel: str(b?.titel, 40),
    waarde: str(b?.waarde, 16),
    tekst: str(b?.tekst, 110),
    toon: TOON[b?.toon] ? b.toon : 'neutraal',
    beweging: BEWEGING[b?.beweging] ? b.beweging : 'zweef',
    vorige: str(b?.vorige, 30),
    verschil: str(b?.verschil, 10),
  })).filter(b => b.titel)
  if (!blokken.length) return null
  const advies = v.advies && str(v.advies.tekst, 220)
    ? { tekst: str(v.advies.tekst, 220), icoon: ICONEN[v.advies.icoon] ? v.advies.icoon : 'Lightbulb' }
    : null
  return { titel: str(v.titel, 60), blokken, advies }
}

function Blok({ b, i }) {
  const Icoon = ICONEN[b.icoon]
  const kleur = TOON[b.toon]
  const leeg = b.toon === 'leeg'
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: `gt-in 0.5s ${0.08 * i}s both cubic-bezier(.2,.8,.2,1)`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px ${leeg ? 'dashed' : 'solid'} ${leeg ? colors.textMuted : kleur}`,
        color: kleur, background: leeg ? 'transparent' : 'rgba(255,255,255,0.03)',
      }}>
        <span style={{ display: 'flex', animation: BEWEGING[b.beweging] }}>
          <Icoon size={19} strokeWidth={2.2} />
        </span>
      </div>
      <div style={{ minWidth: 0, paddingTop: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: leeg ? colors.textSecondary : colors.textPrimary }}>{b.titel}</span>
          {b.waarde && <span style={{ fontSize: '1.05rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums' }}>{b.waarde}</span>}
        </div>
        {(b.verschil || b.vorige) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            {b.verschil && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 999,
                fontSize: '0.72rem', fontWeight: 900, color: kleur, border: `1px solid ${kleur}`, fontVariantNumeric: 'tabular-nums',
              }}>
                {/^\s*-/.test(b.verschil) ? <TrendingDown size={12} strokeWidth={2.6} /> : /^\s*\+/.test(b.verschil) ? <TrendingUp size={12} strokeWidth={2.6} /> : null}
                {b.verschil}
              </span>
            )}
            {b.vorige && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted }}>{b.vorige}</span>}
          </div>
        )}
        {b.tekst && <div style={{ fontSize: '0.76rem', fontWeight: 600, color: colors.textSecondary, lineHeight: 1.35, marginTop: 2 }}>{b.tekst}</div>}
      </div>
    </div>
  )
}

function Advies({ a, i }) {
  const Icoon = ICONEN[a.icoon]
  return (
    <div style={{
      marginTop: 6, padding: '12px 14px', borderRadius: 14, border: `1px solid rgba(34,197,94,0.35)`,
      display: 'flex', gap: 10, alignItems: 'flex-start',
      animation: `gt-in 0.5s ${0.08 * i}s both cubic-bezier(.2,.8,.2,1), gt-gloed 3s ${0.08 * i + 0.5}s ease-in-out infinite`,
    }}>
      <span style={{ display: 'flex', color: colors.success, animation: BEWEGING.puls, marginTop: 1 }}><Icoon size={18} strokeWidth={2.4} /></span>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: colors.success, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ik zou dit doen</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.4, marginTop: 2 }}>{a.tekst}</div>
      </div>
    </div>
  )
}

// Eén afgesloten vakje met Gino's eigen HTML. De hoogte komt via postMessage
// uit het vakje (alleen van ons eigen iframe aangenomen).
function Vak({ html, maxHoogte }) {
  const ref = useRef(null)
  const [hoogte, setHoogte] = useState(120)
  const srcdoc = useMemo(() => maakSrcdoc(schoonHtml(html)), [html])
  useEffect(() => {
    const bij = (e) => {
      if (e.source !== ref.current?.contentWindow) return
      const h = Number(e.data?.gt_hoogte)
      if (h > 0) setHoogte(Math.min(h, maxHoogte))
    }
    window.addEventListener('message', bij)
    return () => window.removeEventListener('message', bij)
  }, [maxHoogte])
  if (!html.trim()) return null
  return (
    <iframe ref={ref} title="Gino laat zien" sandbox="allow-scripts" srcDoc={srcdoc}
      style={{ width: '100%', height: hoogte, border: 'none', background: 'transparent', display: 'block', colorScheme: 'dark' }} />
  )
}

// breedte = ruimte die de middengroep inneemt (px); de kolommen vullen wat over is.
// onOordeel('goed' | 'slecht'): duimpje bij het beeld (Gino leert ervan).
export default function GinoToneel({ visueel: ruw, isMobile, breedte = 680, onSluit, onOordeel }) {
  const [oordeel, setOordeel] = useState(null)
  useEffect(() => { setOordeel(null) }, [ruw])
  const visueel = schoonVisueel(ruw)
  if (!visueel) return null
  const { titel, blokken = [], advies, vrij } = visueel
  const knopStijl = {
    width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', color: colors.textSecondary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
  }
  const duim = (waarde, Icoon, titel) => onOordeel && (
    <button type="button" title={titel} disabled={!!oordeel} onClick={() => { setOordeel(waarde); onOordeel(waarde) }} style={{
      ...knopStijl, cursor: oordeel ? 'default' : 'pointer',
      color: oordeel === waarde ? (waarde === 'goed' ? colors.success : colors.danger) : colors.textSecondary,
      opacity: oordeel && oordeel !== waarde ? 0.3 : 1,
    }}><Icoon size={14} strokeWidth={2.4} /></button>
  )
  const sluit = (
    <span style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
      {duim('goed', ThumbsUp, 'Goed beeld (Gino onthoudt het)')}
      {duim('slecht', ThumbsDown, 'Niet goed (Gino onthoudt het)')}
      <button type="button" onClick={onSluit} title="Weghalen" style={knopStijl}><X size={16} strokeWidth={2.4} /></button>
    </span>
  )
  const kop = titel && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'gt-in 0.4s both' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{titel}</span>
      {sluit}
    </div>
  )

  if (vrij) {
    if (isMobile) {
      return (
        <div data-gt="" style={{ position: 'absolute', top: 56, left: 16, right: 16, zIndex: 4, maxHeight: '46%', overflowY: 'auto' }}>
          <style>{ANIMATIES}</style>
          {kop || <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{sluit}</div>}
          <Vak html={vrij.links} maxHoogte={900} />
          <Vak html={vrij.rechts} maxHoogte={900} />
        </div>
      )
    }
    const kolom = {
      position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 4,
      width: `min(320px, calc((100% - ${breedte}px) / 2 - 32px))`, maxHeight: '92%', overflowY: 'auto',
    }
    return (
      <div data-gt="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <style>{ANIMATIES}</style>
        <div style={{ ...kolom, left: 24, pointerEvents: 'auto' }}>
          {kop || <div style={{ display: 'flex' }}>{sluit}</div>}
          <Vak html={vrij.links} maxHoogte={640} />
        </div>
        <div style={{ ...kolom, right: 24, pointerEvents: 'auto' }}>
          <Vak html={vrij.rechts} maxHoogte={640} />
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div data-gt="" style={{ position: 'absolute', top: 56, left: 16, right: 16, zIndex: 4 }}>
        <style>{ANIMATIES}</style>
        {kop || <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{sluit}</div>}
        <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
          {blokken.map((b, i) => <div key={i} style={{ flex: '0 0 200px' }}><Blok b={b} i={i} /></div>)}
        </div>
        {advies && <Advies a={advies} i={blokken.length} />}
      </div>
    )
  }

  const helft = Math.ceil(blokken.length / 2)
  const kolom = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 4,
    width: `min(300px, calc((100% - ${breedte}px) / 2 - 32px))`,
    display: 'flex', flexDirection: 'column', gap: 18,
  }
  return (
    <div data-gt="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{ANIMATIES}</style>
      <div style={{ ...kolom, left: 24, pointerEvents: 'auto' }}>
        {kop || <div style={{ display: 'flex' }}>{sluit}</div>}
        {blokken.slice(0, helft).map((b, i) => <Blok key={i} b={b} i={i} />)}
      </div>
      <div style={{ ...kolom, right: 24, pointerEvents: 'auto' }}>
        {blokken.slice(helft).map((b, i) => <Blok key={i} b={b} i={helft + i} />)}
        {advies && <Advies a={advies} i={blokken.length} />}
      </div>
    </div>
  )
}
