// src/modules/business-os/GinoToestemmingen.jsx
//
// Toestemmingsvragen van Gino (3 nov 2026). De PA pauzeert een opdracht en zet een
// rij in business_os_toestemmingen; hier staat de kaart met de knoppen. De PA
// luistert mee en gaat verder. De kaart toont alleen wat de PA al gemaskeerd heeft.
//
//   <ToestemmingKaarten />  open vragen + 'Geblokkeerd' boven de chatbalk
//   <ToestemmingRegels />   puntjes-menu: de lijst Altijd toestaan, per regel intrekken
//
// Bestaat de tabel nog niet (SQL niet gedraaid), dan toont dit niets.

import { useCallback, useEffect, useState } from 'react'
import { Ban, ShieldCheck, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const KNOP = {
  border: 'none', borderRadius: 10, padding: '0 14px', minHeight: 42, fontWeight: 900, fontSize: '0.84rem',
  cursor: 'pointer', fontFamily: 'inherit', flex: '1 1 auto',
}
const COMMANDO = {
  margin: '8px 0 0', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
  color: colors.textSecondary, fontSize: '0.74rem', fontWeight: 600, lineHeight: 1.4,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflowY: 'auto',
}
const OMLIJSTING = {
  padding: 14, borderRadius: 16, background: colors.surface, border: `1px solid ${colors.borderSubtle}`,
  boxSizing: 'border-box', minWidth: 0,
}

function VraagKaart({ rij, onBeslis }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const beslis = async (status) => {
    setBezig(true)
    setFout(null)
    const { data, error } = await supabase.from('business_os_toestemmingen')
      .update({ status, beslist_at: new Date().toISOString() })
      .eq('id', rij.id).eq('status', 'wacht').select('id')
    if (error) { setFout(error.message); setBezig(false); return }
    onBeslis(rij.id, data?.length ? null : 'Was al afgesloten')
  }
  return (
    <div style={OMLIJSTING}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.success, marginBottom: 4 }}>Gino vraagt toestemming</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 900, color: colors.textPrimary, lineHeight: 1.35 }}>{rij.reden}</div>
      {rij.invoer && <pre style={COMMANDO}>{rij.invoer}</pre>}
      {fout && <div style={{ marginTop: 8, fontSize: '0.74rem', fontWeight: 700, color: colors.danger }}>{fout}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" disabled={bezig} onClick={() => beslis('toegestaan')}
          style={{ ...KNOP, background: colors.success, color: '#04140a' }}>Toestaan</button>
        {rij.patroon && (
          <button type="button" disabled={bezig} onClick={() => beslis('altijd')} title={rij.patroon}
            style={{ ...KNOP, background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.borderSubtle}` }}>Altijd toestaan</button>
        )}
        <button type="button" disabled={bezig} onClick={() => beslis('afgewezen')}
          style={{ ...KNOP, background: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.borderSubtle}` }}>Afwijzen</button>
      </div>
    </div>
  )
}

function GeblokkeerdKaart({ rij, onWeg }) {
  return (
    <div style={{ ...OMLIJSTING, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Ban size={16} strokeWidth={2.6} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 900, color: colors.textPrimary }}>Geblokkeerd</div>
        <div style={{ marginTop: 2, fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary, lineHeight: 1.4 }}>{rij.reden}</div>
        {rij.invoer && <pre style={COMMANDO}>{rij.invoer}</pre>}
      </div>
      <button type="button" onClick={() => onWeg(rij.id)} aria-label="Weghalen"
        style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: colors.textMuted, flexShrink: 0 }}>
        <X size={16} strokeWidth={2.6} />
      </button>
    </div>
  )
}

export function ToestemmingKaarten({ onOpen }) {
  const [rijen, setRijen] = useState([])
  const open = rijen.filter(r => r.status === 'wacht').length
  useEffect(() => { onOpen?.(open) }, [open, onOpen])
  const laad = useCallback(async () => {
    const { data, error } = await supabase.from('business_os_toestemmingen')
      .select('id, tool, invoer, reden, patroon, status, gevraagd_at')
      .or('status.eq.wacht,and(status.eq.geblokkeerd,gezien_at.is.null)')
      .gte('gevraagd_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order('gevraagd_at').limit(10)
      .then(r => r, (e) => ({ error: e }))
    if (!error) setRijen(data || [])
    return !error
  }, [])
  useEffect(() => {
    let kanaal = null
    let tik = null
    let weg = false
    // Tabel er nog niet (SQL niet gedraaid): niet blijven vragen, dat geeft alleen 404's.
    laad().then((ok) => {
      if (!ok || weg) return
      kanaal = supabase.channel('gino-toestemmingen')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'business_os_toestemmingen' }, () => laad())
        .subscribe()
      // Vangnet naast Realtime (telefoon die sliep).
      tik = setInterval(laad, 10000)
    })
    return () => {
      weg = true
      clearInterval(tik)
      if (kanaal) supabase.removeChannel(kanaal)
    }
  }, [laad])

  const haalWeg = (id) => setRijen(l => l.filter(r => r.id !== id))
  const weg = (id) => {
    haalWeg(id)
    supabase.from('business_os_toestemmingen').update({ gezien_at: new Date().toISOString() }).eq('id', id).then(() => {}, () => {})
  }
  if (!rijen.length) return null
  return (
    // marginBottom: de werk-indicator hangt absoluut boven de chatbalk.
    <div data-toestemmingen style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36, minWidth: 0, maxHeight: '60vh', overflowY: 'auto' }}>
      {rijen.map(r => r.status === 'wacht'
        ? <VraagKaart key={r.id} rij={r} onBeslis={haalWeg} />
        : <GeblokkeerdKaart key={r.id} rij={r} onWeg={weg} />)}
    </div>
  )
}

export function ToestemmingRegels({ onSluit }) {
  const [regels, setRegels] = useState(null)
  const laad = useCallback(async () => {
    const { data, error } = await supabase.from('business_os_toestemming_regels')
      .select('id, patroon, reden, created_at, laatst_gebruikt_at').eq('actief', true).order('created_at', { ascending: false })
      .then(r => r, (e) => ({ error: e }))
    setRegels(error ? [] : data || [])
  }, [])
  useEffect(() => { laad() }, [laad])
  const intrekken = async (id) => {
    setRegels(l => l.filter(r => r.id !== id))
    await supabase.from('business_os_toestemming_regels')
      .update({ actief: false, ingetrokken_at: new Date().toISOString() }).eq('id', id).then(() => {}, () => {})
    laad()
  }
  return (
    <>
      <div onClick={onSluit} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 41,
        width: 'min(460px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto', padding: 16, boxSizing: 'border-box',
        background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={16} strokeWidth={2.6} color={colors.success} />
          <div style={{ flex: 1, fontSize: '0.92rem', fontWeight: 900, color: colors.textPrimary }}>Altijd toegestaan</div>
          <button type="button" onClick={onSluit} aria-label="Sluiten"
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: colors.textSecondary }}>
            <X size={16} strokeWidth={2.6} />
          </button>
        </div>
        {regels === null && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textMuted }}>Laden…</div>}
        {regels?.length === 0 && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textMuted }}>Nog geen regels. Ze komen hier als je Altijd toestaan kiest op een kaart.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(regels || []).map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {r.reden && <div style={{ fontSize: '0.8rem', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.35 }}>{r.reden}</div>}
                <div style={{ marginTop: 2, fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', wordBreak: 'break-word' }}>{r.patroon}</div>
              </div>
              <button type="button" onClick={() => intrekken(r.id)}
                style={{ ...KNOP, flex: '0 0 auto', minHeight: 32, padding: '0 10px', fontSize: '0.72rem', background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.borderSubtle}` }}>
                Intrekken
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
