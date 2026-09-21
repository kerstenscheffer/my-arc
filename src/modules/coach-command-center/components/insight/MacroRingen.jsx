// src/modules/coach-command-center/components/insight/MacroRingen.jsx
//
// Wat er nu op het bord van de klant staat: de macro's die hij volgt, als
// ringen. Zelfde vorm als op zijn eigen maaltijdpagina, zodat jullie naar
// hetzelfde plaatje kijken als je hem aan de telefoon hebt.
//
// De ring vult zich met het aandeel in de totale calorieën, niet met een
// voortgang: eiwit 170 g is 680 kcal en dus 21% van 3165. Zo zie je in één
// oogopslag of de verdeling klopt — een bulk met 12% eiwit springt eruit zonder
// dat je hoeft te rekenen.
//
// Tik op een getal en er komt een wiel onder: scrollen in stappen van vijftig
// kcal of vijf gram. Zo doe je "iets minder" in één beweging, zonder het hele
// getal opnieuw te typen.
//
// Wijzigingen blijven eerst staan als concept; pas de opslaan-knop schrijft ze
// weg, in één keer. Bewust geen herberekening van de rest — verander je de
// kcal, dan blijven de grammen staan tot je ze zelf bijwerkt of het paneel
// hieronder laat doorrekenen. Automatisch meerekenen zet drie getallen op het
// bord van de klant terwijl je er één aanraakte.

import { useState } from 'react'
import { Flame, Egg, Wheat, Droplet, Check, X } from 'lucide-react'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'
import GetalWiel from './GetalWiel'

const RINGEN = [
  {
    veld: 'target_calories', label: 'Kcal', kleur: '#fff', kcalPerGram: 0,
    eenheid: 'kcal', stap: 50, min: 800, max: 6000,
    icoon: <Flame size={10} color="#fff" strokeWidth={2.8} />,
  },
  {
    veld: 'target_protein', label: 'Eiwit', kleur: '#ef4444', kcalPerGram: 4,
    eenheid: 'gram', stap: 5, min: 40, max: 400, icoon: <Egg size={10} color="#ef4444" strokeWidth={2.8} />,
  },
  {
    veld: 'target_carbs', label: 'Koolh', kleur: '#f59e0b', kcalPerGram: 4,
    eenheid: 'gram', stap: 5, min: 0, max: 800, icoon: <Wheat size={10} color="#f59e0b" strokeWidth={2.8} />,
  },
  {
    veld: 'target_fat', label: 'Vet', kleur: '#3b82f6', kcalPerGram: 9,
    eenheid: 'gram', stap: 5, min: 20, max: 250, icoon: <Droplet size={10} color="#3b82f6" strokeWidth={2.8} />,
  },
]

function Ring({ label, kleur, waarde, eenheid, aandeel, icoon, isMobile, gewijzigd, open, onOpen }) {
  const maat = isMobile ? 54 : 60
  const dikte = 5
  const r = (maat - dikte) / 2
  const omtrek = 2 * Math.PI * r
  const vol = omtrek - (Math.min(100, aandeel ?? 100) / 100) * omtrek

  return (
    <button
      onClick={onOpen}
      title="Aanpassen"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative', width: maat, height: maat }}>
        <svg width={maat} height={maat} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={maat / 2} cy={maat / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={dikte} fill="none" />
          <circle
            cx={maat / 2} cy={maat / 2} r={r} stroke={kleur} strokeWidth={dikte} fill="none"
            strokeDasharray={omtrek} strokeDashoffset={vol} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Open of gewijzigd: een dunne buitenring, zodat je ziet welke je
              aan het draaien bent en wat er nog niet is opgeslagen. */}
          {(open || gewijzigd) && (
            <circle
              cx={maat / 2} cy={maat / 2} r={r + 3.5} fill="none"
              stroke={open ? '#fff' : '#f59e0b'} strokeWidth={1.5}
              strokeDasharray={gewijzigd && !open ? '3 3' : undefined}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
            {Math.round(waarde || 0)}
          </span>
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
            {eenheid}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {icoon}
        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff' }}>{label}</span>
        {aandeel != null && (
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{aandeel}%</span>
        )}
      </div>
    </button>
  )
}

export default function MacroRingen({ client, db, onClientUpdate, isMobile }) {
  const [fout, setFout] = useState(null)
  const [zojuist, setZojuist] = useState(false)
  const [bezig, setBezig] = useState(false)
  // Concept: wat je hebt gedraaid maar nog niet opgeslagen. Leeg = wat er op de
  // klant staat.
  const [concept, setConcept] = useState({})
  const [openVeld, setOpenVeld] = useState(null)

  const opKlant = Object.fromEntries(RINGEN.map(r => [r.veld, Math.round(Number(client?.[r.veld]) || 0)]))
  const waarden = { ...opKlant, ...concept }
  const gewijzigd = RINGEN.filter(r => concept[r.veld] != null && concept[r.veld] !== opKlant[r.veld])

  const kcal = waarden.target_calories
  const somKcal = RINGEN
    .filter(r => r.kcalPerGram > 0)
    .reduce((s, r) => s + waarden[r.veld] * r.kcalPerGram, 0)
  const verschil = kcal - somKcal
  // Het aandeel rekenen we over de som van de macro's, niet over het kcal-doel:
  // die twee lopen vaak een paar procent uiteen door afronden, en dan telt de
  // verdeling niet op tot honderd.
  const basis = somKcal > 0 ? somKcal : (kcal || 1)

  const bewaar = async () => {
    if (!db?.supabase || !client?.id || gewijzigd.length === 0) return
    setBezig(true); setFout(null)
    const patch = Object.fromEntries(gewijzigd.map(r => [r.veld, waarden[r.veld]]))
    try {
      const before = pickTrackedFields(client)
      const { error } = await db.supabase.from('clients').update(patch).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.(patch)
      await logClientChanges({ db, clientId: client.id, before, after: patch, source: 'macro_ringen' })
      setConcept({})
      setOpenVeld(null)
      setZojuist(true)
      setTimeout(() => setZojuist(false), 1600)
    } catch (e) {
      console.error('Macro\'s opslaan mislukt:', e)
      setFout('Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  if (!kcal && !somKcal) return null

  const open = RINGEN.find(r => r.veld === openVeld)

  return (
    <div style={{
      padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Wat hij nu volgt
        </span>
        <span style={{ flex: 1 }} />
        {zojuist && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, color: '#10b981' }}>
            <Check size={11} strokeWidth={3.4} /> bewaard
          </span>
        )}
        {fout && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, color: '#ef4444' }}>
            <X size={11} strokeWidth={3.4} /> {fout}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
        {RINGEN.map(r => (
          <Ring
            key={r.veld}
            label={r.label} kleur={r.kleur} icoon={r.icoon} eenheid={r.eenheid}
            waarde={waarden[r.veld]}
            aandeel={r.kcalPerGram > 0 ? Math.round((waarden[r.veld] * r.kcalPerGram / basis) * 100) : null}
            isMobile={isMobile}
            gewijzigd={concept[r.veld] != null && concept[r.veld] !== opKlant[r.veld]}
            open={openVeld === r.veld}
            onOpen={() => setOpenVeld(v => (v === r.veld ? null : r.veld))}
          />
        ))}
      </div>

      {/* Het wiel van de ring die je aantikte. Stappen van vijftig kcal of vijf
          gram: fijner afstellen doe je toch niet. */}
      {open && (
        <div style={{
          marginTop: 10, padding: '0.5rem 0.6rem', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)',
          }}>
            {open.label}
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>
              stappen van {open.stap} {open.eenheid === 'kcal' ? 'kcal' : 'g'}
            </span>
            <span style={{ flex: 1 }} />
            {concept[open.veld] != null && concept[open.veld] !== opKlant[open.veld] && (
              <span style={{ color: '#f59e0b' }}>
                was {opKlant[open.veld]}
              </span>
            )}
          </div>
          <GetalWiel
            waarde={waarden[open.veld]}
            min={open.min} max={open.max} stap={open.stap}
            eenheid={open.eenheid === 'kcal' ? 'kcal' : 'g'}
            kleur={open.kleur}
            onKies={(v) => setConcept(c => ({ ...c, [open.veld]: v }))}
          />
        </div>
      )}

      {/* Opslaan verschijnt pas als er iets te bewaren valt. */}
      {gewijzigd.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={bewaar} disabled={bezig} style={{
            flex: 1, minHeight: 38, borderRadius: 10, border: 'none',
            background: '#fff', color: '#0a0a0a',
            fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: bezig ? 'default' : 'pointer', opacity: bezig ? 0.6 : 1,
          }}>
            {bezig ? 'Opslaan…' : `Opslaan · ${gewijzigd.length} ${gewijzigd.length === 1 ? 'wijziging' : 'wijzigingen'}`}
          </button>
          <button onClick={() => { setConcept({}); setOpenVeld(null) }} disabled={bezig} style={{
            minWidth: 80, minHeight: 38, borderRadius: 10,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem', fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            Terug
          </button>
        </div>
      )}

      {/* Tellen de macro's niet op tot het kcal-doel, dan klopt er iets niet —
          meestal een getal dat met de hand is aangepast zonder de rest door te
          rekenen. Geen foutmelding: het mag, je moet het alleen weten. */}
      {Math.abs(verschil) > 50 && (
        <div style={{ marginTop: 8, fontSize: '0.66rem', fontWeight: 800, color: '#f59e0b' }}>
          De macro's tellen op tot {somKcal.toLocaleString('nl-NL')} kcal — {Math.abs(verschil)} {verschil > 0 ? 'minder' : 'meer'} dan het doel van {kcal.toLocaleString('nl-NL')}.
        </div>
      )}
    </div>
  )
}
