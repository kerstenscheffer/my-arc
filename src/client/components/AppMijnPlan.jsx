// src/client/components/AppMijnPlan.jsx
//
// Tabblad "Mijn plan" in Profiel, alleen voor app-gebruikers (clients.app_abonnee,
// geen coach). Coachingklanten zien hier "Coach" zoals voorheen.
// Wat een app-gebruiker zelf kan (24 nov 2026):
//   - doel en gewicht aanpassen → macro's opnieuw gerekend (RPC wijzig_app_doel);
//   - een nieuw trainingsschema laten maken (vernieuw_app_training →
//     workout-bouwer → activeer_app_plannen → macro's opnieuw);
//   - abonnement beheren (Apple/Google) en aankopen herstellen;
//   - persoonlijke coaching aanvragen.
// Stijl: groot, vet, wit; goud als accent. SQL: app-onboarding/app-zelf.sql.

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../../lib/supabase'
import { herstel } from '../../lib/appAbonnement'

const GOUD = '#FFD700'
const WHATSAPP = '31631388756'
const DOELEN = [['fat_loss', 'Vet kwijt'], ['muscle_gain', 'Meer spieren'], ['recomp', 'Strakker worden'], ['maintain', 'Fit blijven']]
const ACTIVITEIT = [['sedentary', 'Ik zit veel'], ['lightly_active', 'Ik loop soms'], ['moderately_active', 'Ik loop veel'], ['very_active', 'Ik werk met mijn lijf']]
const doelNaam = (d) => DOELEN.find(([k]) => k === d)?.[1] || ({ cut: 'Vet kwijt', bulk: 'Meer spieren' })[d] || 'Nog niet gekozen'

const kop = { fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 10px' }
const rij = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '1.02rem', fontWeight: 800, color: '#fff' }
const knopWit = { width: '100%', minHeight: 50, marginTop: 12, borderRadius: 10, border: 'none', background: '#fff', color: '#000', fontSize: '1.02rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 0 #9b9b9b' }
const knopRand = { ...knopWit, background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.25)', boxShadow: 'none' }
const veld = { width: '100%', minHeight: 48, borderRadius: 10, border: '2px solid #333', background: '#141416', color: '#fff', padding: '0 12px', fontSize: '1.02rem', fontWeight: 800, fontFamily: 'inherit', boxSizing: 'border-box' }
const label = { fontSize: '1rem', fontWeight: 900, color: '#fff', margin: '12px 0 6px' }
const blok = { padding: '14px 0', borderBottom: '2px solid rgba(255,255,255,0.08)' }

function Melding({ tekst, goed }) {
  if (!tekst) return null
  return <div style={{ marginTop: 10, fontSize: '1rem', fontWeight: 900, color: goed ? '#10b981' : '#f87171' }}>{tekst}</div>
}

export default function AppMijnPlan({ client, user, onClientUpdate }) {
  // ── Doel ──
  const [doelOpen, setDoelOpen] = useState(false)
  const [doel, setDoel] = useState({ doel: client?.primary_goal || 'fat_loss', gewicht: client?.current_weight ?? '', streefgewicht: client?.goal_weight ?? '', activiteit: client?.activity_level || 'lightly_active' })
  const [doelBezig, setDoelBezig] = useState(false)
  const [doelMelding, setDoelMelding] = useState(null)

  const bewaarDoel = async () => {
    setDoelBezig(true); setDoelMelding(null)
    const { data, error } = await supabase.rpc('wijzig_app_doel', { p: doel }).then(r => r, e => ({ error: e }))
    setDoelBezig(false)
    if (error || data?.fout) { setDoelMelding({ tekst: 'Dat lukte niet. Probeer het nog eens.' }); return }
    onClientUpdate?.({
      primary_goal: doel.doel, current_weight: Number(doel.gewicht) || client.current_weight, goal_weight: Number(doel.streefgewicht) || client.goal_weight,
      activity_level: doel.activiteit,
      target_calories: data.target_calories, target_protein: data.target_protein, target_carbs: data.target_carbs, target_fat: data.target_fat,
    })
    setDoelOpen(false)
    setDoelMelding({ tekst: `Klaar! Je eet nu ${data.target_calories} kcal per dag.`, goed: true })
  }

  // ── Training ──
  const [trainOpen, setTrainOpen] = useState(false)
  const [train, setTrain] = useState({ trainingen: '3', minuten: '60', locatie: 'gym', ervaring: client?.training_experience || 'intermediate' })
  const [trainStap, setTrainStap] = useState(null) // tekst tijdens het bouwen
  const [trainMelding, setTrainMelding] = useState(null)
  const [schemaNaam, setSchemaNaam] = useState(null)

  useEffect(() => {
    if (!client?.assigned_schema_id) return
    supabase.from('workout_schemas').select('name').eq('id', client.assigned_schema_id).maybeSingle()
      .then(({ data }) => setSchemaNaam(data?.name || null), () => null)
  }, [client?.assigned_schema_id])

  const bouwSchema = async () => {
    setTrainMelding(null); setTrainStap('Je keuzes opslaan…')
    const r1 = await supabase.rpc('vernieuw_app_training', { p: train }).then(r => r, e => ({ error: e }))
    if (r1.error || r1.data?.fout) { setTrainStap(null); setTrainMelding({ tekst: 'Dat lukte niet. Probeer het nog eens.' }); return }
    setTrainStap('Nieuw schema maken…')
    const r2 = await supabase.functions.invoke('workout-bouwer', { body: { client_id: r1.data.client_id } }).then(r => r, e => ({ error: e }))
    if (r2.error) { setTrainStap(null); setTrainMelding({ tekst: 'Je schema kon niet gemaakt worden. Probeer het over 10 minuten nog eens.' }); return }
    setTrainStap('Alles klaarzetten…')
    await supabase.rpc('activeer_app_plannen').then(r => r, () => null)
    const r4 = await supabase.rpc('wijzig_app_doel', { p: {} }).then(r => r, () => ({}))
    const { data: nieuw } = await supabase.from('clients').select('assigned_schema_id').eq('id', client.id).maybeSingle().then(r => r, () => ({}))
    onClientUpdate?.({
      ...(nieuw?.assigned_schema_id ? { assigned_schema_id: nieuw.assigned_schema_id } : {}),
      ...(r4?.data?.target_calories ? { target_calories: r4.data.target_calories, target_protein: r4.data.target_protein, target_carbs: r4.data.target_carbs, target_fat: r4.data.target_fat } : {}),
    })
    setTrainStap(null); setTrainOpen(false)
    setTrainMelding({ tekst: 'Klaar! Je nieuwe schema staat bij Workout.', goed: true })
  }

  // ── Abonnement ──
  const [abo, setAbo] = useState(null)
  const [aboMelding, setAboMelding] = useState(null)
  useEffect(() => {
    supabase.from('app_abonnementen').select('status, verloopt_op, product_id').maybeSingle()
      .then(({ data }) => setAbo(data || { status: 'geen' }), () => setAbo({ status: 'geen' }))
  }, [])
  const datum = (iso) => iso ? new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : ''
  const aboTekst = !abo ? 'Even laden…'
    : abo.status === 'proef' ? `Gratis proefmaand tot ${datum(abo.verloopt_op)}`
    : abo.status === 'actief' ? `Actief tot ${datum(abo.verloopt_op)}`
    : abo.status === 'respijt' ? 'Er is iets mis met je betaling'
    : 'Geen actief abonnement'
  const platform = Capacitor.getPlatform()
  const beheer = () => {
    const url = platform === 'android' ? 'https://play.google.com/store/account/subscriptions' : 'https://apps.apple.com/account/subscriptions'
    window.open(url, '_blank', 'noopener')
  }
  const herstelAankopen = async () => {
    setAboMelding(null)
    const r = await herstel(user?.id)
    setAboMelding(r.ok ? { tekst: 'Je abonnement is hersteld.', goed: true } : { tekst: r.fout })
  }

  return (
    <div>
      {/* Doel */}
      <div style={{ ...blok, paddingTop: 0 }}>
        <div style={kop}>Jouw doel</div>
        {[
          ['Doel', doelNaam(client?.primary_goal)],
          ['Gewicht', client?.current_weight ? `${client.current_weight} kg` : '–'],
          ['Streefgewicht', client?.goal_weight ? `${client.goal_weight} kg` : '–'],
          ['Per dag', client?.target_calories ? `${client.target_calories} kcal` : '–'],
          ['Eiwit · kh · vet', client?.target_protein ? `${client.target_protein} · ${client.target_carbs} · ${client.target_fat} g` : '–'],
        ].map(([l, w]) => <div key={l} style={rij}><span>{l}</span><span style={{ color: l === 'Per dag' ? GOUD : '#fff' }}>{w}</span></div>)}

        {!doelOpen ? (
          <button onClick={() => setDoelOpen(true)} style={knopWit}>Doel aanpassen</button>
        ) : (
          <div>
            <div style={label}>Wat wil je?</div>
            <select value={doel.doel} onChange={e => setDoel({ ...doel, doel: e.target.value })} style={veld}>
              {DOELEN.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <div style={label}>Hoe zwaar ben je nu? (kg)</div>
            <input inputMode="decimal" value={doel.gewicht} onChange={e => setDoel({ ...doel, gewicht: e.target.value.replace(',', '.') })} style={veld} />
            {doel.doel !== 'maintain' && <>
              <div style={label}>Wat wil je wegen? (kg)</div>
              <input inputMode="decimal" value={doel.streefgewicht} onChange={e => setDoel({ ...doel, streefgewicht: e.target.value.replace(',', '.') })} style={veld} />
            </>}
            <div style={label}>Hoeveel beweeg je op een dag?</div>
            <select value={doel.activiteit} onChange={e => setDoel({ ...doel, activiteit: e.target.value })} style={veld}>
              {ACTIVITEIT.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <button onClick={bewaarDoel} disabled={doelBezig} style={{ ...knopWit, opacity: doelBezig ? 0.6 : 1 }}>{doelBezig ? 'Even rekenen…' : 'Opslaan en opnieuw rekenen'}</button>
            <button onClick={() => setDoelOpen(false)} style={knopRand}>Annuleer</button>
          </div>
        )}
        <Melding {...(doelMelding || {})} />
      </div>

      {/* Training */}
      <div style={blok}>
        <div style={kop}>Jouw training</div>
        <div style={rij}><span>Schema</span><span style={{ textAlign: 'right' }}>{schemaNaam || '–'}</span></div>
        {!trainOpen ? (
          <button onClick={() => setTrainOpen(true)} style={knopWit}>Nieuw schema maken</button>
        ) : (
          <div>
            <div style={label}>Hoe vaak wil je trainen?</div>
            <select value={train.trainingen} onChange={e => setTrain({ ...train, trainingen: e.target.value })} style={veld}>
              {['2', '3', '4', '5'].map(k => <option key={k} value={k}>{k} keer per week</option>)}
            </select>
            <div style={label}>Hoe lang mag een training duren?</div>
            <select value={train.minuten} onChange={e => setTrain({ ...train, minuten: e.target.value })} style={veld}>
              {[['45', '45 minuten'], ['60', '1 uur'], ['75', '1 uur en 15 minuten'], ['90', '1,5 uur']].map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <div style={label}>Waar train je?</div>
            <select value={train.locatie} onChange={e => setTrain({ ...train, locatie: e.target.value })} style={veld}>
              {[['gym', 'In de gym'], ['home', 'Thuis'], ['both', 'Allebei']].map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <div style={label}>Hoe lang train je al?</div>
            <select value={train.ervaring} onChange={e => setTrain({ ...train, ervaring: e.target.value })} style={veld}>
              {[['beginner', 'Net begonnen'], ['intermediate', '1 tot 3 jaar'], ['advanced', 'Langer dan 3 jaar']].map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
            <button onClick={bouwSchema} disabled={!!trainStap} style={{ ...knopWit, opacity: trainStap ? 0.6 : 1 }}>{trainStap || 'Maak mijn nieuwe schema'}</button>
            {!trainStap && <button onClick={() => setTrainOpen(false)} style={knopRand}>Annuleer</button>}
          </div>
        )}
        <Melding {...(trainMelding || {})} />
      </div>

      {/* Abonnement */}
      <div style={blok}>
        <div style={kop}>Je abonnement</div>
        <div style={{ ...rij, color: abo?.status === 'respijt' ? '#fbbf24' : '#fff' }}><span>{aboTekst}</span></div>
        {Capacitor.isNativePlatform() ? (
          <>
            <button onClick={beheer} style={knopWit}>Abonnement beheren</button>
            <button onClick={herstelAankopen} style={knopRand}>Herstel aankopen</button>
          </>
        ) : (
          <div style={{ marginTop: 10, fontSize: '1rem', fontWeight: 800 }}>Je abonnement beheer je in de MY ARC app op je telefoon.</div>
        )}
        <Melding {...(aboMelding || {})} />
      </div>

      {/* Coaching */}
      <div style={{ ...blok, borderBottom: 'none' }}>
        <div style={kop}>Wil je een coach?</div>
        <div style={{ fontSize: '1.02rem', fontWeight: 800, lineHeight: 1.4 }}>Met coaching kijk ik zelf mee. Je krijgt een plan op maat, check-ins en calls.</div>
        <button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hoi Kersten, ik gebruik de MY ARC app en wil graag meer weten over coaching.${client?.first_name ? ` Groet, ${client.first_name}` : ''}`)}`, '_blank', 'noopener')}
          style={{ ...knopWit, background: GOUD, boxShadow: '0 4px 0 #9c8200' }}>Vraag coaching aan</button>
      </div>
    </div>
  )
}
