// src/modules/coach-command-center/components/insight/SupplementTrouw.jsx
//
// Neemt deze klant zijn supplementen?
//
// Per supplement een rijtje van veertien dagen: een gevuld blokje op een dag
// dat hij het afvinkte, een leeg blokje als hij dat niet deed. Zo zie je in
// één blik het verschil tussen "vergeet het af en toe" en "is er na drie
// dagen mee gestopt" — dat zijn twee verschillende gesprekken.
//
// Bewust geen percentage als kop: 70% zegt niet of iemand de eerste tien
// dagen deed en toen stopte, of elke dag eentje overslaat.

import React, { useState, useEffect } from 'react'
import { Pill } from 'lucide-react'

const DAGEN_TERUG = 14

// Datums van vandaag terug, oudste eerst — zodat het rijtje links begint bij
// het verleden en rechts eindigt bij vandaag.
const laatsteDagen = (n) => {
  const uit = []
  const nu = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(nu)
    d.setDate(nu.getDate() - i)
    uit.push(d.toISOString().split('T')[0])
  }
  return uit
}

export default function SupplementTrouw({ db, client, isMobile }) {
  const m = isMobile
  const [supplementen, setSupplementen] = useState(null)  // null = laden
  const [logs, setLogs] = useState(new Map())             // supplement_id -> Set(datums)

  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let leeft = true
    const dagen = laatsteDagen(DAGEN_TERUG)
    const vanaf = dagen[0]

    // Twee losse queries via Promise.all. Let op de vorm van de
    // foutafhandeling: een Supabase query-builder heeft wel .then() maar geen
    // .catch(). Een .catch() erop gooit synchroon en sloopt deze hele
    // Promise.all nog voordat de queries vertrekken.
    const leeg = { data: null }
    Promise.all([
      db.supabase.from('supplement_plans')
        .select('supplements').eq('client_id', client.id).eq('status', 'active')
        .order('updated_at', { ascending: false }).limit(1)
        .then(r => r, () => leeg),
      db.supabase.from('supplement_logs')
        .select('supplement_id, log_date').eq('client_id', client.id)
        .gte('log_date', vanaf)
        .then(r => r, () => leeg),
    ]).then(([plan, gelogd]) => {
      if (!leeft) return
      const lijst = plan?.data?.[0]?.supplements
      setSupplementen(Array.isArray(lijst) ? lijst : [])
      const kaart = new Map()
      ;(gelogd?.data || []).forEach(r => {
        if (!kaart.has(r.supplement_id)) kaart.set(r.supplement_id, new Set())
        kaart.get(r.supplement_id).add(r.log_date)
      })
      setLogs(kaart)
    })
    return () => { leeft = false }
  }, [db, client?.id])

  if (supplementen === null) return null
  if (supplementen.length === 0) return null

  const dagen = laatsteDagen(DAGEN_TERUG)

  return (
    <div style={{ padding: m ? '0.75rem' : '0.9rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem' }}>
        <Pill size={13} style={{ color: '#FFD700' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff' }}>Supplementen</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          laatste {DAGEN_TERUG} dagen
        </span>
      </div>

      {supplementen.map(sp => {
        const sleutel = sp.template_id || sp.supplement_id || sp.name
        const gedaan = logs.get(sleutel) || new Set()
        const aantal = dagen.filter(d => gedaan.has(d)).length
        return (
          <div key={sleutel} style={{ marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: '0.72rem' }}>{sp.emoji || '💊'}</span>
              <span style={{
                flex: 1, minWidth: 0, fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {sp.name}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 900, flexShrink: 0,
                color: aantal === 0 ? '#ef4444' : aantal >= DAGEN_TERUG - 2 ? '#10b981' : '#f59e0b',
              }}>
                {aantal}/{DAGEN_TERUG}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {dagen.map(d => {
                const aan = gedaan.has(d)
                const isVandaag = d === dagen[dagen.length - 1]
                return (
                  <div key={d}
                    title={`${new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} — ${aan ? 'genomen' : 'niet afgevinkt'}`}
                    style={{
                      flex: 1, height: 14, borderRadius: 2,
                      background: aan ? '#10b981' : 'rgba(255,255,255,0.06)',
                      // Vandaag telt nog niet mee als gemist: de dag is bezig.
                      border: isVandaag ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                      boxSizing: 'border-box',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
        Vandaag heeft een randje — die dag is nog bezig en telt niet als gemist.
      </div>
    </div>
  )
}
