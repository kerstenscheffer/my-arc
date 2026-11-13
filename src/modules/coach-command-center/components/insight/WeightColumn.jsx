// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WeightColumn.jsx
// Gewicht + statistiekbalk + Metingen + before/after per hoek
// Props: { client, weightData, circumData, photos, coachingPlan, isMobile, onOpenGallery }
// ============================================
import React from 'react'
import { Ruler, Camera, ExternalLink, Target, Table2, X } from 'lucide-react'
import { KolomKopInhoud } from './KolomKop'
import { kopKnopStijl } from './kolomKopStijl'
import WeightStatsGrid from '../../../weight-tracker/components/WeightStatsGrid'
import FasePaneel from './FasePaneel'
import DoelModal from './DoelModal'
import GewichtBandGrafiek from './GewichtBandGrafiek'
import MetingenTabel from './MetingenTabel'
import DoelenMacrosPaneel from './DoelenMacrosPaneel'
import SlaapInsight from './SlaapInsight'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

// Venster voor de drie dingen die niet altijd in beeld hoeven: doelen & macro's,
// de wegingentabel en de omtrek (13 nov 2026, Kersten). Zelfde kader als DoelModal.
function Venster({ titel, icoon, breed = 520, isMobile, onSluit, children }) {
  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onSluit() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onSluit])
  return (
    <div onClick={onSluit} style={{
      position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0.5rem' : '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: breed, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.14)',
        }}>
          {icoon}
          <span style={{ flex: 1, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{titel}</span>
          <button onClick={onSluit} aria-label="Sluiten" style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={17} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  )
}

export default function WeightColumn({ client, weightData, circumData, photos, coachingPlan, isMobile, onOpenGallery, db, onClientUpdate }) {
  const history = weightData?.history || []
  // Actieve fase, aangeleverd door FasePaneel. Bepaalt vanaf wanneer
  // "sinds start" telt.
  const [actieveFase, setActieveFase] = React.useState(null)
  // Alle fases, voor de band: daar kun je ook terugkijken naar een cut van
  // vorig kwartaal.
  const [alleFases, setAlleFases] = React.useState([])
  // Wat er standaard dicht staat. De band en de cijfers zijn waar je naar
  // kijkt; het verloop en de losse logs zijn om iets op te zoeken, en die
  // maakten de kolom onleesbaar.
  // Teller: gaat omhoog als je in de fase-dropdown '+ Nieuwe fase' kiest. Het
  // formulier zelf blijft in FasePaneel wonen.
  const [nieuweFase, setNieuweFase] = React.useState(0)
  // Doel en macro's: dicht bij binnenkomst, want je opent deze kolom om te
  // kijken. Pas als de band zegt dat er iets moet veranderen klap je 'm open.
  // Welk venster open staat: 'doelen' | 'tabel' | 'omtrek' | null.
  const [venster, setVenster] = React.useState(null)
  // Het voorstel uit de band: hoeveel kcal erbij of eraf. Wordt getoond boven
  // het macro-paneel, en pas toegepast als je erop drukt.
  const [voorstel, setVoorstel] = React.useState(null)
  // Het weekdoel en het goede-tempo-bereik instellen. Kon nergens: die velden
  // zaten alleen in het formulier voor een níeuwe fase.
  const [doelOpen, setDoelOpen] = React.useState(false)
  // Omhoog na het opslaan van een doel, zodat FasePaneel de fase opnieuw laadt.
  const [faseVersie, setFaseVersie] = React.useState(0)

  const circumFields = [
    { key: 'waist_cm', label: 'Buik' }, { key: 'bicep_cm', label: 'Arm' },
    { key: 'chest_cm', label: 'Borst' }, { key: 'thigh_cm', label: 'Bovenbeen' }
  ]

  // De grafiek 'Plan vs Werkelijkheid' stond hier: een projectie van het
  // verwachte gewichtsverloop uit het coachingplan tegen de echte metingen.
  // Verwijderd op verzoek — 'Gewicht Verloop' eronder toont dezelfde
  // metingen en de doellijn zit daar ook in.


  const kopIcoon = { ...kopKnopStijl, width: 28, padding: 0, justifyContent: 'center' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* De kop 'Gewicht & Body' stond boven een kolom waar alles al over
          gewicht gaat, en het doelgewicht ernaast stuurde niets — dat is nu de
          horizon in de band. Allebei weg: de fase-regel is de eerste regel. */}
      {/* Kolomkop: 'Plan' op dezelfde plek als bij Training en Voeding,
          hier het weekdoel en het tempo (DoelModal). */}
      <KolomKopInhoud>
        {/* Foto's: een knop in de kop in plaats van een blok onderaan (13 nov
            2026, Kersten). Opent hetzelfde overzicht als voorheen. */}
        <button onClick={() => setVenster('doelen')} title={`Doelen & macro's${client?.target_calories ? ` · ${Math.round(client.target_calories)} kcal` : ''}`} aria-label="Doelen en macro's" style={kopIcoon}><Target size={15} /></button>
        {history.length > 0 && (
          <button onClick={() => setVenster('tabel')} title="Tabel met wegingen" aria-label="Tabel met wegingen" style={kopIcoon}><Table2 size={15} /></button>
        )}
        {circumData?.latest && (
          <button onClick={() => setVenster('omtrek')} title="Omtrek" aria-label="Omtrek" style={kopIcoon}><Ruler size={15} /></button>
        )}
        {photos.length > 0 && onOpenGallery && (
          <button onClick={onOpenGallery} title="Alle foto's bekijken" style={kopKnopStijl}>
            <Camera size={12} /> Foto's <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{photos.length}</span>
          </button>
        )}
        <button onClick={() => setDoelOpen(true)} title="Weekdoel en tempo aanpassen" style={kopKnopStijl}>
          <ExternalLink size={11} /> Plan
        </button>
      </KolomKopInhoud>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Fase bovenaan: die bepaalt hoe je de cijfers eronder moet lezen.
            +0,1 kg is goed nieuws in een build en slecht in een cut. */}
        <FasePaneel
          client={client}
          db={db}
          history={history}
          isMobile={isMobile}
          onFaseChange={onClientUpdate}
          onActieveFase={setActieveFase}
          onFases={setAlleFases}
          toonOordeel={false}
          toonKop={false}
          openNieuw={nieuweFase}
          herlaad={faseVersie}
        />
        {/* De weken-strook en het doel; de cijferregel eronder zit achter een
            uitklap. Het oude 'Verloop'-lijntje eruit: de bandgrafiek hieronder
            laat hetzelfde verloop zien, mét de planlijn en de band erbij. Geen toonHuidig meer: het huidige gewicht staat in de
            kopregel naast de naam, en twee keer hetzelfde getal is er één te
            veel. */}
        {(history.length > 0 || actieveFase) && (
          <WeightStatsGrid
            stats={weightData?.stats || {}} client={client}
            fridayData={{ friday_count: weightData?.fridayCount || 0, total_fridays: 8 }}
            history={history} isMobile={isMobile} coachingPlan={coachingPlan}
            fase={actieveFase} volleBreedte toonGrafiek={false}
            onBewerkDoel={() => setDoelOpen(true)}
          />
        )}
        {/* De band: waar het gewicht hoort te lopen, en of dat gebeurt. */}
        {(history.length > 0 || actieveFase) && (
          <GewichtBandGrafiek
            client={client} history={history} fase={actieveFase} fases={alleFases}
            onNieuweFase={() => setNieuweFase(n => n + 1)}
            onBijsturen={(kcal) => { setVoorstel(kcal); setVenster('doelen') }}
            isMobile={isMobile}
            toonOordeel={false}
          />
        )}
        {/* Slaap hoort bij gewicht: een week slecht slapen laat de weegschaal
            stijgen zonder dat er aan het eten iets veranderd is, en dan zoek je
            in de verkeerde hoek. Verschijnt alleen als de klant logt. */}
        <SlaapInsight db={db} client={client} isMobile={isMobile} />

        {/* Geen fase en geen wegingen. "Geen data" was hier een doodlopende
            straat: waar dan de fase-regel en de grafiek staan, stond niets, en
            de enige knop om een fase te beginnen zit ín die grafiek. Nu staat
            er wat er ontbreekt, met de knop erbij. */}
        {!history.length && !actieveFase && (
          <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              Nog geen fase
            </div>
            <div style={{
              fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5, maxWidth: 320, margin: '0 auto 14px',
            }}>
              Zonder startgewicht en weektempo valt er niets te verwachten en niets te beoordelen.
              Zet een fase, dan tekent de grafiek meteen waar {client?.first_name || 'de klant'} heen gaat —
              ook voordat er gewogen is.
            </div>
            <button
              onClick={() => setNieuweFase(n => n + 1)}
              style={{
                minHeight: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none',
                background: '#fff', color: '#0a0a0a', fontSize: '0.88rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Fase starten
            </button>
          </div>
        )}

        {!history.length && actieveFase && !circumData?.latest && photos.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>Nog geen wegingen</div>
        )}
      </div>

      {venster === 'doelen' && (
        <Venster titel="Doelen & macro's" icoon={<Target size={15} color="#fff" strokeWidth={2.6} />} breed={640} isMobile={isMobile} onSluit={() => setVenster(null)}>
          <DoelenMacrosPaneel
            client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile}
            fase={actieveFase}
            voorstel={voorstel} onVoorstelWeg={() => setVoorstel(null)}
          />
        </Venster>
      )}
      {venster === 'tabel' && (
        <Venster titel="Wegingen" icoon={<Table2 size={15} color="#fff" strokeWidth={2.6} />} isMobile={isMobile} onSluit={() => setVenster(null)}>
          <MetingenTabel client={client} history={history} fase={actieveFase} isMobile={isMobile} />
        </Venster>
      )}
      {venster === 'omtrek' && circumData?.latest && (
        <Venster titel="Omtrek" icoon={<Ruler size={15} color="#fff" strokeWidth={2.6} />} breed={420} isMobile={isMobile} onSluit={() => setVenster(null)}>
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',  }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Ruler size={12} color="rgba(255,255,255,0.5)" /><span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>Omtrek</span></div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{formatDate(circumData.latest.measurement_date)}</span>
            </div>
            {circumFields.map(f => {
              const val = circumData.latest[f.key]; const prev = circumData.previous?.[f.key]
              if (!val) return null
              const d = prev ? parseFloat((val - prev).toFixed(1)) : null
              return (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.275rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{f.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fff' }}>{parseFloat(val).toFixed(1)}<span style={{ fontSize: '0.72rem', fontWeight: '500', opacity: 0.4 }}>cm</span></span>
                    {d !== null && d !== 0 && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: d < 0 ? '#10b981' : '#ef4444' }}>{d > 0 ? '+' : ''}{d}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Venster>
      )}

      {/* Het weekdoel en het goede-tempo-bereik. Opent vanaf het potlood bij
          'Doel per week' in de cijferbalk. */}
      {doelOpen && (
        <DoelModal
          client={client}
          db={db}
          fase={actieveFase}
          isMobile={isMobile}
          onSluit={() => setDoelOpen(false)}
          onKlaar={() => { setFaseVersie(v => v + 1); onClientUpdate?.() }}
          onNieuweFase={() => setNieuweFase(n => n + 1)}
        />
      )}
    </div>
  )
}
