// src/modules/workout/bouwfase/FaseStarter.jsx
//
// Workout Builder → Mesocyclus (heette Trainingsfase): per klant een
// mesocyclus starten, de deload starten of beëindigen, en de gemeten TDEE
// naast de formule zien. Gekoppeld aan het plan dat openstaat.
//
// Eén compact blok: links de stand (meso, week, dagen tot deload), in het
// midden de TDEE, rechts de knoppen. Een reden om eerder te deloaden komt als
// rij met een oranje streep eronder. De tabel heet nog training_fases; een rij
// zonder `nummer` is een oude bouwfase en houdt zijn oude gedrag.

import { useCallback, useEffect, useState } from 'react'
import { faseStand, leesActieveFase, vandaagIso } from './bouwfaseData'
import { berekenGemetenTdee, getMesoStatus, startMesocyclus, startDeload, eindDeload, neemTdeeOver, checkDeloadSignalen } from './mesocyclus'

const knop = (vol, uit = false) => ({
  height: 32, padding: '0 0.8rem', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: uit ? 'default' : 'pointer',
  background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff', border: vol ? 'none' : '1px solid rgba(255,255,255,0.2)',
  opacity: uit ? 0.4 : 1, whiteSpace: 'nowrap',
})
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

function Cijfer({ kop, waarde, onder, kleur = '#fff' }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{kop}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: kleur, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{waarde}</div>
      {onder && <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{onder}</div>}
    </div>
  )
}

export default function FaseStarter({ db, client, schemaId, plannen = [], onGewijzigd = null }) {
  const [fase, setFase] = useState(undefined) // undefined = laden
  const [start, setStart] = useState(vandaagIso)
  const [weken, setWeken] = useState(4)
  const [bezig, setBezig] = useState(null)
  const [fout, setFout] = useState(null)
  const [tdee, setTdee] = useState(null)
  const [signalen, setSignalen] = useState([])
  const [nieuwOpen, setNieuwOpen] = useState(false)
  // Wat de klant vond van de oefeningen die hij mocht proberen, en de laatst
  // afgeronde mesocyclus (om de volgende te starten).
  const [geprobeerd, setGeprobeerd] = useState([])
  const [vorige, setVorige] = useState(null)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const f = await leesActieveFase(db.supabase, client.id)
    setFase(f)
    berekenGemetenTdee(db, client.id).then(setTdee, () => setTdee(null))
    checkDeloadSignalen(db, client.id, f).then(setSignalen, () => setSignalen([]))
    const sinds = new Date(); sinds.setDate(sinds.getDate() - 60)
    db.supabase.from('training_feedback').select('oefening, gevoel, datum')
      .eq('client_id', client.id).eq('soort', 'oefening').in('gevoel', ['probeer_ja', 'probeer_nee'])
      .gte('datum', sinds.toISOString().slice(0, 10)).order('datum', { ascending: false })
      .then(({ data }) => {
        // Per oefening het laatste antwoord.
        const per = new Map()
        for (const r of data || []) if (r.oefening && !per.has(r.oefening)) per.set(r.oefening, r.gevoel)
        setGeprobeerd([...per.entries()].map(([naam, gevoel]) => ({ naam, wil: gevoel === 'probeer_ja' })))
      }, () => setGeprobeerd([]))
    if (!f) {
      db.supabase.from('training_fases').select('nummer, afgerond_op, bouw_weken')
        .eq('client_id', client.id).not('nummer', 'is', null).not('afgerond_op', 'is', null)
        .order('afgerond_op', { ascending: false }).limit(1)
        .then(({ data }) => setVorige(data?.[0] || null), () => setVorige(null))
    } else setVorige(null)
  }, [client?.id, db])
  useEffect(() => { laad() }, [laad])

  // Eén plek voor elke knop: bezig-stand, foutmelding (ook de bekende
  // "ingelogd als klant"), en daarna alles opnieuw ophalen.
  const doe = async (naam, werk) => {
    setBezig(naam); setFout(null)
    try {
      const res = await werk()
      if (res?.error) throw new Error(res.error)
      await laad()
      onGewijzigd?.()
    } catch (e) {
      setFout(/row-level security|geen toegang/i.test(e.message || '')
        ? 'Je bent in deze browser nu als klant ingelogd. Wissel terug naar je coachaccount en probeer opnieuw.'
        : (e.message || 'Mislukt'))
    }
    setBezig(null)
  }

  const starten = () => doe('start', async () => {
    const res = await startMesocyclus(db, client.id, { schemaId, startDatum: start, bouwWeken: weken, deloadDagen: 7 })
    if (!res.error) setNieuwOpen(false)
    return res
  })
  const stoppen = () => {
    if (!window.confirm('Mesocyclus stoppen? De feedback die er al is blijft bewaard.')) return
    doe('stop', async () => {
      // Loopt de deload, dan eerst plan en macro's terugzetten.
      if (fase.nummer != null && fase.deload_gestart_op && !fase.afgerond_op) return eindDeload(db, fase.id)
      const { error } = await db.supabase.from('training_fases').update({ actief: false, updated_at: new Date().toISOString() }).eq('id', fase.id)
      return { error: error?.message || null }
    })
  }

  if (fase === undefined) return null
  const stand = faseStand(fase)
  const meso = fase ? getMesoStatus(fase) : null
  const nieuweStijl = fase?.nummer != null
  const planNaam = plannen.find(p => p.id === fase?.schema_id)?.name
  const deloadNaam = plannen.find(p => p.id === fase?.deload_schema_id)?.name
  const inDeload = stand?.soort === 'deload'
  const BETROUW = { hoog: '#10b981', middel: '#f59e0b' }

  const startRij = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <input type="date" value={start} onChange={e => setStart(e.target.value)} aria-label="Startdatum"
        style={{ height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9, color: '#fff', padding: '0 0.5rem', fontFamily: 'inherit', fontWeight: 800, colorScheme: 'dark' }} />
      {[4, 5, 6].map(w => <button key={w} onClick={() => setWeken(w)} style={knop(weken === w)}>{w} weken</button>)}
      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>+ deload 7 dagen</span>
      <button onClick={starten} disabled={!!bezig || !start} style={knop(true, !!bezig)}>{bezig === 'start' ? 'Bezig…' : 'Start mesocyclus'}</button>
      {fase && <button onClick={() => setNieuwOpen(false)} style={knop(false)}>Annuleren</button>}
    </div>
  )

  return (
    <div style={{ marginTop: '0.6rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.7rem 1.4rem', padding: '0.75rem 0.85rem' }}>
        {fase ? (<>
          <Cijfer kop={nieuweStijl ? `Mesocyclus ${fase.nummer}` : 'Bouwfase'}
            waarde={inDeload ? `Deload dag ${stand.dag} van ${stand.dagen}` : `Week ${stand?.week || 1} van ${stand?.weken || fase.bouw_weken}`}
            kleur={inDeload ? '#f59e0b' : '#fff'}
            onder={`Start ${kort(fase.start_datum)}${planNaam ? ` · ${planNaam}` : ''}`} />
          {!inDeload && meso && (
            <Cijfer kop="Tot deload" waarde={meso.deloadTeLaat ? 'Nu' : `${meso.dagenTotDeload} dagen`}
              onder={`${fase.deload_dagen} dagen deload${nieuweStijl ? '' : ' · oude stijl'}`} />
          )}
        </>) : (
          <Cijfer kop="Mesocyclus"
            waarde={vorige ? `Start mesocyclus ${Number(vorige.nummer) + 1}` : 'Niet gestart'}
            onder={vorige ? `Mesocyclus ${vorige.nummer} is afgerond op ${kort(vorige.afgerond_op)}` : '4 weken bouwen, 7 dagen deload'} />
        )}

        {/* Gemeten TDEE naast de formule. Alleen een getal bij genoeg data. */}
        {tdee && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <Cijfer kop="TDEE gemeten"
              waarde={tdee.tdee_gemeten ? `${nl(tdee.tdee_gemeten)} kcal` : 'Te weinig data'}
              kleur={tdee.tdee_gemeten ? '#fff' : 'rgba(255,255,255,0.5)'}
              onder={tdee.tdee_gemeten
                ? <span><span style={{ color: BETROUW[tdee.betrouwbaarheid] || '#fff' }}>{tdee.betrouwbaarheid}</span> · {tdee.logdagen} logdagen, {tdee.weegdagen} wegingen</span>
                : `${tdee.logdagen} van 10 logdagen, ${tdee.weegdagen} van 8 wegingen`} />
            <Cijfer kop="Formule" waarde={tdee.tdee_formule ? `${nl(tdee.tdee_formule)} kcal` : 'Niet ingesteld'}
              onder={tdee.verschil != null ? `${tdee.verschil > 0 ? '+' : ''}${nl(tdee.verschil)} verschil` : null} />
            {tdee.tdee_gemeten && tdee.tdee_gemeten !== tdee.tdee_formule && (
              <button onClick={() => { if (window.confirm(`TDEE van deze klant op ${nl(tdee.tdee_gemeten)} kcal zetten? De macrodoelen veranderen hier niet mee.`)) doe('tdee', () => neemTdeeOver(db, client.id, tdee.tdee_gemeten)) }}
                disabled={!!bezig} style={knop(false, !!bezig)}>{bezig === 'tdee' ? 'Bezig…' : 'TDEE overnemen'}</button>
            )}
          </div>
        )}

        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fase && nieuweStijl && !inDeload && (
            <button onClick={() => { if (window.confirm('Deload nu starten? Het deload-schema wordt het actieve plan; in een cut gaan de kcal naar onderhoud.')) doe('deload', () => startDeload(db, fase, { reden: meso?.dagenTotDeload > 0 ? 'eerder: coach' : 'gepland' })) }}
              disabled={!!bezig} style={knop(false, !!bezig)}>{bezig === 'deload' ? 'Bezig…' : 'Start deload'}</button>
          )}
          {fase && nieuweStijl && inDeload && (
            <button onClick={() => { if (window.confirm('Deload beëindigen? Plan, weekindeling en macro\'s gaan terug en de mesocyclus sluit.')) doe('einde', () => eindDeload(db, fase.id)) }}
              disabled={!!bezig} style={knop(true, !!bezig)}>{bezig === 'einde' ? 'Bezig…' : 'Einde deload'}</button>
          )}
          {fase && !nieuwOpen && <button onClick={() => setNieuwOpen(true)} disabled={!!bezig} style={knop(!nieuweStijl, !!bezig)}>Nieuwe mesocyclus</button>}
          {fase && <button onClick={stoppen} disabled={!!bezig} style={knop(false, !!bezig)}>Stoppen</button>}
        </div>
      </div>

      {(!fase || nieuwOpen) && <div style={{ padding: '0 0.85rem 0.75rem' }}>{startRij}</div>}

      {/* In de deload: welk schema loopt er, en wat is er met de kcal gebeurd. */}
      {fase && nieuweStijl && (
        <div style={{ padding: '0 0.85rem 0.7rem', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>
          {inDeload
            ? `Deload loopt sinds ${kort(fase.deload_gestart_op)}${fase.deload_reden ? ` (${fase.deload_reden})` : ''}. Actief plan: ${deloadNaam || 'het deload-schema'}. Eindigt vanzelf na ${fase.deload_dagen} dagen.`
            : `Het deload-schema staat klaar${deloadNaam ? `: ${deloadNaam}` : ''}. Open het via de planlijst om oefeningen "Proberen" toe te voegen. De deload start vanzelf op ${meso ? kort(meso.deloadStart) : 'de geplande dag'}.`}
        </div>
      )}

      {/* Wat de klant koos bij de oefeningen die hij mocht proberen. */}
      {geprobeerd.length > 0 && (
        <div style={{ padding: '0.55rem 0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>Geprobeerd door de klant</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            {geprobeerd.map(g => (
              <span key={g.naam} style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                {g.naam} <span style={{ fontWeight: 700, color: g.wil ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{g.wil ? '· wil hij erin' : '· liever niet'}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Redenen om (eerder) te deloaden: alleen een suggestie. */}
      {fase && !inDeload && signalen.map(s => (
        <div key={s.soort} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #f59e0b' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>{s.tekst}</span>
          {nieuweStijl && (
            <button onClick={() => { if (window.confirm('Deload nu starten?')) doe('deload', () => startDeload(db, fase, { reden: s.reden })) }} disabled={!!bezig} style={knop(false, !!bezig)}>Start deload</button>
          )}
        </div>
      ))}

      {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', padding: '0 0.85rem 0.6rem' }}>{fout}</div>}
    </div>
  )
}
