// Bijsturingsbalk bovenin Coach Inzicht (24 nov 2026, Kersten).
// Zelfde werkwijze als "Wat speelde er vannacht?" bij slaap (NachtOpmerking):
// tik erop en je ziet de opties die vaak terugkomen, typ en de best passende
// staat bovenaan, ook met typefouten. Eerst het laatste punt, dan de
// bijsturing. Opslaan = een 'bijsturing'-rij in het logboek, en die staat
// direct als label op de klantkaart in Command.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { schrijfBijsturing, STATUS_KLEUR, STATUS_NAAM, BIJSTURING } from '../bijsturing'

const PUNTEN = [
  'Goed bezig', 'Weekend uit de bocht', 'Uit eten / feestje', 'Alcohol', 'Snacken in de avond',
  'Eiwit te laag', 'Kcal te hoog', 'Kcal te laag', 'Stappen te laag', 'Training gemist',
  'Kracht omhoog', 'Gewicht stagneert', 'Gewicht gaat te snel', 'Slecht geslapen', 'Stress / druk',
  'Motivatie laag', 'Weinig gelogd', 'Ziek', 'Blessure / pijn', 'Vakantie', 'Honger',
]
const STUREN = [
  'Geen aanpassing', 'Stappen omhoog', 'Kcal omlaag', 'Kcal omhoog', 'Eiwit omhoog',
  'Weekendplan maken', 'Avondsnack inplannen', 'Meer loggen', 'Volume omhoog', 'Volume omlaag',
  'Deload', 'Diet break', 'Slaaproutine', 'Extra check donderdag', 'Call inplannen', 'Oefening wisselen',
]
const STATUSSEN = ['crushing_it', 'on_track', 'needs_attention', 'off_track']

const woordjes = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean)
// Getypte woorden die passen bij een optie; begin van een woord telt (4 letters).
const score = (zoek, optie) => {
  const doel = woordjes(optie)
  return zoek.reduce((n, w) => n + (doel.some(d => d.startsWith(w.slice(0, Math.min(4, w.length)))) ? 1 : 0), 0)
}

export default function BijsturingBalk({ client, db, coachId }) {
  const [laatste, setLaatste] = useState(null)
  const [eerder, setEerder] = useState({ punten: [], sturen: [] })
  const [status, setStatus] = useState('on_track')
  const [punt, setPunt] = useState('')
  const [tekst, setTekst] = useState('')
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const invoer = useRef(null)

  // Laatste bijsturing van deze klant + wat je vaker gebruikt (alle klanten).
  useEffect(() => {
    let weg = false
    setPunt(''); setTekst(''); setLaatste(null)
    db.supabase.from('client_coaching_logs').select('client_id, status, data, created_at')
      .eq('category', BIJSTURING).order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => {
        if (weg) return
        const rijen = data || []
        const eigen = rijen.find(r => r.client_id === client.id)
        if (eigen) { setLaatste(eigen); setStatus(eigen.status || 'on_track') }
        const tel = (veld) => {
          const n = new Map()
          for (const r of rijen) { const v = (r.data?.[veld] || '').trim(); if (v) n.set(v, (n.get(v) || 0) + 1) }
          return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
        }
        setEerder({ punten: tel('punt'), sturen: tel('bijsturing') })
      }, () => null)
    return () => { weg = true }
  }, [client.id, db])

  const stap = punt ? 'sturen' : 'punt'
  const opties = useMemo(() => {
    const basis = stap === 'punt' ? [...eerder.punten, ...PUNTEN] : [...eerder.sturen, ...STUREN]
    const gezien = new Set()
    const uniek = basis.filter(o => { const k = o.toLowerCase(); if (gezien.has(k)) return false; gezien.add(k); return true })
    const zw = woordjes(tekst).filter(w => w.length >= 2)
    if (!zw.length) return uniek.slice(0, 14)
    return uniek.map((o, i) => ({ o, i, s: score(zw, o) })).filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 10).map(r => r.o)
  }, [stap, eerder, tekst])

  const opslaan = async (bijsturing) => {
    const p = punt || tekst.trim()
    if (!p || bezig) return
    setBezig(true)
    try {
      const data = await schrijfBijsturing(db.supabase, { clientId: client.id, coachId, status, punt: p, bijsturing })
      setLaatste(data); setPunt(''); setTekst(''); setOpen(false); invoer.current?.blur()
      setKlaar(true); setTimeout(() => setKlaar(false), 1500)
    } catch (e) { console.error('Bijsturing opslaan mislukt:', e) }
    setBezig(false)
  }

  const kies = (waarde) => {
    if (stap === 'punt') { setPunt(waarde); setTekst(''); invoer.current?.focus() }
    else opslaan(waarde)
  }
  const enter = () => {
    const t = tekst.trim()
    if (stap === 'punt') { if (t) { setPunt(t); setTekst('') } }
    else opslaan(t)
  }

  const kleur = STATUS_KLEUR[status] || '#fff'
  const laatsteTekst = laatste ? [laatste.data?.punt, laatste.data?.bijsturing].filter(Boolean).join(' → ') : ''
  const volgendeStatus = () => setStatus(s => STATUSSEN[(STATUSSEN.indexOf(s) + 1) % STATUSSEN.length])

  return (
    <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 520, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 6px 0 10px', borderRadius: 12,
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${open ? `${kleur}99` : 'rgba(255,255,255,0.12)'}`,
      }}>
        {/* Hoe het gaat: tik = volgende kleur. */}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={volgendeStatus}
          title={`${STATUS_NAAM[status]} (tik om te wisselen)`} aria-label={`Status: ${STATUS_NAAM[status]}`}
          style={{ width: 28, height: 28, flexShrink: 0, padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: kleur }} />
        </button>
        {punt && (
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setPunt(''); invoer.current?.focus() }}
            aria-label={`${punt} weghalen`}
            style={{ flexShrink: 0, maxWidth: '45%', display: 'flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'none', color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{punt}</span>
            <X size={13} strokeWidth={3} color={kleur} style={{ flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>→</span>
          </button>
        )}
        <input ref={invoer} value={tekst}
          onChange={e => { setTekst(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); enter() }
            if (e.key === 'Escape') { setOpen(false); invoer.current?.blur() }
            if (e.key === 'Backspace' && !tekst && punt) setPunt('')
          }}
          placeholder={klaar ? 'Opgeslagen ✓' : punt ? 'Bijsturing: kies of typ' : (laatsteTekst || 'Laatste punt: kies of typ')}
          aria-label={punt ? 'Bijsturing' : 'Laatste punt'}
          style={{ flex: 1, minWidth: 0, height: 38, background: 'none', border: 'none', outline: 'none', padding: 0, color: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800 }} />
        {punt && (
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => opslaan(tekst.trim())} disabled={bezig}
            title="Opslaan" aria-label="Bijsturing opslaan"
            style={{ width: 30, height: 30, flexShrink: 0, padding: 0, borderRadius: '50%', border: 'none', background: kleur, color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: bezig ? 0.5 : 1 }}>
            <Check size={17} strokeWidth={3.2} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 50, maxHeight: 340, overflowY: 'auto', borderRadius: 12, background: '#121212', border: `1px solid ${kleur}66`, boxShadow: '0 12px 32px rgba(0,0,0,0.7)' }}>
          <div style={{ padding: '0.55rem 0.85rem 0.3rem', fontSize: '0.78rem', fontWeight: 900, color: kleur }}>
            {stap === 'punt' ? 'Laatste punt' : `Bijsturing voor "${punt}"`}
          </div>
          {opties.map((o, n) => (
            <button key={o} type="button" onMouseDown={e => e.preventDefault()} onClick={() => kies(o)} style={{
              width: '100%', display: 'block', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none',
              borderTop: n ? '1px solid rgba(255,255,255,0.06)' : 'none', color: '#fff',
              fontFamily: 'inherit', fontSize: '0.86rem', fontWeight: 800, textAlign: 'left', cursor: 'pointer',
            }}>{o}</button>
          ))}
          {tekst.trim() && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={enter} style={{
              width: '100%', display: 'block', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none',
              borderTop: opties.length ? '1px solid rgba(255,255,255,0.06)' : 'none',
              fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textAlign: 'left', cursor: 'pointer',
            }}>
              Eigen tekst: <span style={{ color: '#fff', fontWeight: 900 }}>“{tekst.trim()}”</span>
            </button>
          )}
          {stap === 'sturen' && !tekst.trim() && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => opslaan('')} style={{
              width: '100%', display: 'block', padding: '0.6rem 0.85rem', background: 'transparent', border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 800,
              color: 'rgba(255,255,255,0.7)', textAlign: 'left', cursor: 'pointer',
            }}>Alleen het punt opslaan</button>
          )}
        </div>
      )}
    </div>
  )
}
