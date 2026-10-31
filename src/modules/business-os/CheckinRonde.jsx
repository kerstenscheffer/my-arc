// src/modules/business-os/CheckinRonde.jsx
//
// Check-in ronde bovenaan het Klanten-tabje. Woensdag en zaterdag loopt
// Kersten al zijn klanten langs en stuurt per klant zelf een WhatsApp-appje.
// Per klant: live data (business_os_ronde_data), Gino's suggesties en een
// bewerkbaar bericht uit checkin_ronde_items (SQL: checkin-ronde.sql).
// Er gaat NOOIT iets naar de klant: alleen kopiëren, Kersten verstuurt zelf.

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

export const RONDE_OPDRACHT = 'Zet de check-in ronde van vandaag klaar'

const GROEPEN = [
  { id: 'aandacht', label: 'Aandacht', kleur: colors.danger },
  { id: 'vervolg', label: 'Vervolg bespreken', kleur: '#f59e0b' },
  { id: 'goed', label: 'Goed bezig', kleur: colors.success },
  { id: 'zonder', label: 'Zonder bericht', kleur: colors.textMuted },
  { id: 'gepauzeerd', label: 'Gepauzeerd', kleur: colors.textMuted, dicht: true },
]

const ITEM_KOLOMMEN = 'id, coach_id, client_id, ronde_datum, groep, suggesties, bericht, bewerkt_bericht, verstuurd_at'

const datumKort = (d) => d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
const kg = (n) => n == null ? '–' : `${Number(n).toFixed(1).replace('.', ',')} kg`
const verschil = (a, b) => {
  if (a == null || b == null) return null
  const v = Math.round((Number(a) - Number(b)) * 10) / 10
  return `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}`
}
const vandaagNL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

async function kopieer(tekst) {
  try { await navigator.clipboard.writeText(tekst); return true } catch { /* val terug */ }
  try {
    const t = document.createElement('textarea')
    t.value = tekst; t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  } catch { return false }
}

const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 4 }
const REGEL = { fontSize: '0.8rem', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.45 }
const KNOPJE = {
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 999,
  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 800,
}

const CHECKIN_VELDEN = [
  ['hoe_gaat_het', 'Hoe gaat het'], ['wins', 'Wins'], ['trots_op', 'Trots op'], ['struggles', 'Struggles'],
  ['kon_beter', 'Kon beter'], ['vastgelopen', 'Vastgelopen'], ['hulp_van_coach', 'Hulp van coach'], ['komende_week', 'Komende week'],
]

function UitDeData({ k }) {
  const ci = k.checkins || []
  const stappen = k.stappen_gem_7d != null ? `${Math.round(k.stappen_gem_7d).toLocaleString('nl-NL')}${k.stappendoel ? ` / ${Number(k.stappendoel).toLocaleString('nl-NL')}` : ''}` : '–'
  return (
    <div>
      <div style={LABEL}>Uit de data</div>
      <div style={REGEL}>
        Gewicht {kg(k.gewicht_gem_7d)} <span style={{ color: colors.textSecondary }}>vs {kg(k.gewicht_gem_vorige_7d)}</span>
        {verschil(k.gewicht_gem_7d, k.gewicht_gem_vorige_7d) && <span style={{ color: colors.success }}> ({verschil(k.gewicht_gem_7d, k.gewicht_gem_vorige_7d)})</span>}
      </div>
      {k.gewicht_start != null && (
        <div style={REGEL}>Sinds start {verschil(k.gewicht_gem_7d, k.gewicht_start) ?? '–'} kg <span style={{ color: colors.textSecondary }}>(start {kg(k.gewicht_start)}, {datumKort(k.gewicht_start_datum)})</span></div>
      )}
      <div style={REGEL}>Gewogen {k.gewogen_7d ?? 0}/7 · Trainingen {k.trainingen_7d ?? 0} · Stappen {stappen}</div>
      <div style={{ ...REGEL, color: colors.textSecondary }}>
        Laatste contact: {k.laatste_contact ? datumKort(k.laatste_contact) : 'onbekend'}
        {k.dagen_tot_einde != null && ` · nog ${k.dagen_tot_einde} dagen traject`}
      </div>
      {ci.map((c, i) => (
        <div key={i} style={{ marginTop: 8 }}>
          <div style={{ ...REGEL, color: colors.textSecondary }}>Check-in {datumKort(c.checkin_date)}</div>
          {CHECKIN_VELDEN.filter(([v]) => c[v] && String(c[v]).trim()).map(([v, l]) => (
            <div key={v} style={{ ...REGEL, fontWeight: 600, borderLeft: `2px solid ${colors.borderSubtle}`, paddingLeft: 8, marginTop: 3 }}>
              <span style={{ color: colors.textSecondary }}>{l}: </span>“{String(c[v]).trim().slice(0, 240)}”
            </div>
          ))}
        </div>
      ))}
      {!ci.length && <div style={{ ...REGEL, color: colors.textSecondary }}>Nog geen check-in.</div>}
      {(k.oefening_opmerkingen || []).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ ...REGEL, color: colors.textSecondary }}>Oefening-opmerkingen</div>
          {k.oefening_opmerkingen.map((o, i) => (
            <div key={i} style={{ ...REGEL, fontWeight: 600 }}>
              <span style={{ color: colors.textSecondary }}>{datumKort(o.datum)} {o.oefening}: </span>“{o.opmerking}”
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Suggesties({ s }) {
  if (!s || typeof s !== 'object') return null
  const signalen = Array.isArray(s.signalen) ? s.signalen : []
  if (!s.compliment && !s.verbeterpunt && !signalen.length) return null
  return (
    <div>
      <div style={LABEL}>Suggesties van Gino</div>
      {s.compliment && <div style={REGEL}><span style={{ color: colors.success }}>Compliment: </span>{s.compliment}</div>}
      {s.verbeterpunt && <div style={REGEL}><span style={{ color: colors.success }}>Verbeterpunt: </span>{s.verbeterpunt}</div>}
      {signalen.map((x, i) => <div key={i} style={{ ...REGEL, color: colors.textSecondary }}>· {typeof x === 'string' ? x : JSON.stringify(x)}</div>)}
    </div>
  )
}

function KlantKaart({ k, item, kleur, ronde, onItem }) {
  const [open, setOpen] = useState(false)
  const [tekst, setTekst] = useState(item?.bewerkt_bericht ?? item?.bericht ?? '')
  const [gekopieerd, setGekopieerd] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const timer = useRef(null)
  const wacht = useRef(null)
  const serverTekst = item?.bewerkt_bericht ?? item?.bericht ?? ''

  // Nieuwe tekst van de server (Gino) overnemen zolang er niets openstaat.
  useEffect(() => { if (!timer.current) setTekst(serverTekst) }, [serverTekst])

  // Item ophalen of aanmaken (klant zonder bericht in deze ronde).
  const zorgVoorItem = useCallback(async () => {
    if (item?.id) return item
    const { data, error } = await supabase.from('checkin_ronde_items')
      .upsert({ client_id: k.id, ronde_datum: ronde }, { onConflict: 'client_id,ronde_datum' })
      .select(ITEM_KOLOMMEN).single()
    if (error) throw error
    onItem(data)
    return data
  }, [item, k.id, ronde, onItem])

  const bewaar = useCallback(async (waarde) => {
    timer.current = null
    try {
      const it = await zorgVoorItem()
      const { data, error } = await supabase.from('checkin_ronde_items')
        .update({ bewerkt_bericht: waarde }).eq('id', it.id).select(ITEM_KOLOMMEN).single()
      if (error) throw error
      onItem(data); setFout(null)
    } catch (e) { setFout(`Opslaan mislukt: ${e.message}`) }
  }, [zorgVoorItem, onItem])

  const wijzig = (v) => {
    setTekst(v)
    wacht.current = v
    clearTimeout(timer.current)
    timer.current = setTimeout(() => bewaarRef.current(v), 800)
  }
  // Bij sluiten of wegklikken een openstaande wijziging nog bewaren.
  const bewaarRef = useRef(bewaar)
  useEffect(() => { bewaarRef.current = bewaar }, [bewaar])
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); bewaarRef.current(wacht.current) } }, [])

  const verstuurd = !!item?.verstuurd_at

  const wisselVerstuurd = async () => {
    if (bezig) return
    setBezig(true)
    try {
      if (timer.current) { clearTimeout(timer.current); await bewaar(wacht.current) }
      const it = await zorgVoorItem()
      const nieuw = verstuurd ? null : new Date().toISOString()
      const { data, error } = await supabase.from('checkin_ronde_items')
        .update({ verstuurd_at: nieuw }).eq('id', it.id).select(ITEM_KOLOMMEN).single()
      if (error) throw error
      onItem(data)
      if (nieuw) {
        let coach = data.coach_id
        if (!coach) coach = (await supabase.auth.getSession()).data.session?.user?.id
        const s = data.suggesties || {}
        const { error: nf } = await supabase.from('client_notes').insert({
          client_id: k.id, coach_id: coach, title: `Check-in ronde ${datumKort(data.ronde_datum)}`,
          // 'session': client_notes.category heeft een vaste lijst (check-constraint)
          category: 'session', note_date: vandaagNL(),
          content: { bericht: tekst, compliment: s.compliment ?? null, verbeterpunt: s.verbeterpunt ?? null },
        })
        if (nf) setFout(`Verstuurd gezet, notitie mislukt: ${nf.message}`)
        else setFout(null)
      }
    } catch (e) { setFout(e.message) }
    setBezig(false)
  }

  const kopieerKlik = async () => {
    if (await kopieer(tekst)) { setGekopieerd(true); setTimeout(() => setGekopieerd(false), 1500) }
    else setFout('Kopiëren lukte niet, selecteer de tekst zelf.')
  }

  return (
    <div style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '0 2px',
        background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem', fontWeight: 800, color: colors.textPrimary }}>
          {k.naam || 'Onbekend'}
        </span>
        {k.week != null && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary, flexShrink: 0 }}>wk {k.week}{k.weken_totaal ? `/${k.weken_totaal}` : ''}</span>}
        {verstuurd && <Check size={15} strokeWidth={3} color={colors.success} style={{ flexShrink: 0 }} />}
        {open ? <ChevronDown size={15} color={colors.textMuted} /> : <ChevronRight size={15} color={colors.textMuted} />}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 16px' }}>
          <UitDeData k={k} />
          <Suggesties s={item?.suggesties} />
          <div>
            <div style={LABEL}>Bericht</div>
            <textarea value={tekst} onChange={e => wijzig(e.target.value)} rows={6}
              placeholder="Nog geen bericht van Gino. Typ hier zelf."
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical', background: colors.surface, color: colors.textPrimary,
                border: 'none', borderRadius: 12, padding: 10, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.45,
                fontFamily: 'inherit', outline: 'none',
              }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={kopieerKlik} disabled={!tekst.trim()} style={{
                ...KNOPJE, background: colors.textPrimary, color: colors.onAccent, opacity: tekst.trim() ? 1 : 0.4,
              }}>
                {gekopieerd ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
                {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
              </button>
              <button type="button" onClick={wisselVerstuurd} disabled={bezig} style={{
                ...KNOPJE, background: verstuurd ? colors.success : 'transparent',
                color: verstuurd ? colors.onAccent : colors.textPrimary,
                boxShadow: verstuurd ? 'none' : `inset 0 0 0 1.5px ${colors.success}`, opacity: bezig ? 0.6 : 1,
              }}>
                <Check size={14} strokeWidth={3} /> {verstuurd ? 'Verstuurd' : 'Markeer verstuurd'}
              </button>
            </div>
            {fout && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: colors.danger, marginTop: 6 }}>{fout}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckinRonde({ onVraagGino, bezig = false }) {
  const [open, setOpen] = useState(true)
  const [klanten, setKlanten] = useState(null)
  const [items, setItems] = useState([])
  const [ronde, setRonde] = useState(null)
  const [fout, setFout] = useState(null)
  const [dichtGroep, setDichtGroep] = useState({ gepauzeerd: true })

  const laad = useCallback(async () => {
    const [data, laatste] = await Promise.all([
      supabase.rpc('business_os_ronde_data').then(r => r, e => ({ error: e })),
      supabase.from('checkin_ronde_items').select('ronde_datum').order('ronde_datum', { ascending: false }).limit(1)
        .then(r => r, e => ({ error: e })),
    ])
    if (data.error || laatste.error) {
      setFout(`Check-in ronde laden mislukt: ${(data.error || laatste.error)?.message || 'onbekende fout'}`)
      setKlanten([])
      return
    }
    setFout(null)
    setKlanten(data.data?.klanten || [])
    const datum = laatste.data?.[0]?.ronde_datum || null
    setRonde(datum)
    if (datum) {
      const { data: rij } = await supabase.from('checkin_ronde_items').select(ITEM_KOLOMMEN).eq('ronde_datum', datum)
        .then(r => r, () => ({ data: null }))
      if (rij) setItems(rij)
    } else setItems([])
  }, [])

  useEffect(() => { laad() }, [laad])
  // Gino zet de ronde klaar terwijl het paneel open staat: elke 30 s verversen.
  useEffect(() => {
    if (!open) return
    const t = setInterval(laad, 30000)
    return () => clearInterval(t)
  }, [open, laad])

  const opItem = useCallback((it) => {
    setItems(l => l.some(x => x.id === it.id) ? l.map(x => (x.id === it.id ? it : x)) : [...l, it])
    if (!ronde) setRonde(it.ronde_datum)
  }, [ronde])

  const perKlant = Object.fromEntries(items.map(i => [i.client_id, i]))
  const lijst = (klanten || []).map(k => {
    const item = perKlant[k.id]
    const groep = item?.groep || (k.gepauzeerd ? 'gepauzeerd' : 'zonder')
    return { k, item, groep }
  })
  const telbaar = lijst.filter(x => x.groep !== 'gepauzeerd')
  const metItem = telbaar.filter(x => x.item)
  const noemer = metItem.length ? metItem : telbaar
  const verstuurd = noemer.filter(x => x.item?.verstuurd_at).length

  return (
    <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: 'inherit', color: colors.textPrimary, fontSize: '0.95rem', fontWeight: 900,
        }}>
          {open ? <ChevronDown size={16} strokeWidth={2.5} /> : <ChevronRight size={16} strokeWidth={2.5} />}
          Check-in ronde
        </button>
        {ronde && <span style={{ fontSize: '0.74rem', fontWeight: 800, color: colors.textSecondary }}>{datumKort(ronde)}</span>}
        {klanten && !fout && (
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: verstuurd && verstuurd === noemer.length ? colors.success : colors.textSecondary }}>
            {verstuurd} van {noemer.length} verstuurd
          </span>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => onVraagGino?.(RONDE_OPDRACHT)} disabled={bezig} style={{
          ...KNOPJE, minHeight: 28, background: 'transparent', color: colors.success,
          boxShadow: `inset 0 0 0 1.5px ${colors.success}`, opacity: bezig ? 0.5 : 1,
        }}>
          Gino, zet de ronde klaar
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 6 }}>
          {fout && <div style={{ ...REGEL, color: colors.textSecondary }}>{fout}</div>}
          {!klanten && <div style={{ ...REGEL, color: colors.textSecondary }}>Laden…</div>}
          {klanten && !fout && !ronde && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '14px 0 6px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: colors.textPrimary }}>Nog geen ronde klaargezet</div>
              <button type="button" onClick={() => onVraagGino?.(RONDE_OPDRACHT)} disabled={bezig} style={{
                ...KNOPJE, background: colors.success, color: colors.onAccent, opacity: bezig ? 0.5 : 1,
              }}>
                Gino, zet de ronde klaar
              </button>
            </div>
          )}
          {GROEPEN.map(g => {
            const rij = lijst.filter(x => x.groep === g.id)
            if (!rij.length) return null
            const dicht = dichtGroep[g.id]
            return (
              <div key={g.id} style={{ marginTop: 10 }}>
                <button type="button" onClick={() => setDichtGroep(d => ({ ...d, [g.id]: !d[g.id] }))} style={{
                  ...LABEL, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none',
                  padding: 0, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 0,
                }}>
                  {dicht ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                  {g.label} · {rij.length}
                </button>
                {!dicht && rij.map(x => (
                  <KlantKaart key={x.k.id} k={x.k} item={x.item} kleur={g.kleur} ronde={ronde || vandaagNL()} onItem={opItem} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
