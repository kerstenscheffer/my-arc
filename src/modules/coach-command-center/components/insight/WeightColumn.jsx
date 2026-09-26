// ============================================
// 📁 FILE: src/modules/coach-command-center/components/insight/WeightColumn.jsx
// Gewicht + statistiekbalk + Metingen + before/after per hoek
// Props: { client, weightData, circumData, photos, coachingPlan, isMobile, onOpenGallery }
// ============================================
import React from 'react'
import { Ruler, Camera, Download, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import WeightStatsGrid from '../../../weight-tracker/components/WeightStatsGrid'
import BeforeAfterCard from '../../../progress/components/BeforeAfterCard'
import FasePaneel from './FasePaneel'
import DoelModal from './DoelModal'
import GewichtBandGrafiek from './GewichtBandGrafiek'
import MetingenTabel from './MetingenTabel'
import DoelenMacrosPaneel from './DoelenMacrosPaneel'
import SlaapInsight from './SlaapInsight'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

// Eén regel die een blok open- en dichtklapt. Zelfde vorm voor elk blok, zodat
// je aan de rand van de kolom ziet wat er nog meer is zonder dat het in beeld
// staat.
function Uitklap({ label, extra, open, onKlik, isMobile }) {
  return (
    <button
      onClick={onKlik}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 1rem',
        background: 'transparent', border: 'none',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
        {label}
      </span>
      {extra && (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{extra}</span>
      )}
      {open
        ? <ChevronUp size={15} strokeWidth={3} color="#fff" />
        : <ChevronDown size={15} strokeWidth={3} color="#fff" />}
    </button>
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
  const [toonVerloop, setToonVerloop] = React.useState(false)
  // Teller: gaat omhoog als je in de fase-dropdown '+ Nieuwe fase' kiest. Het
  // formulier zelf blijft in FasePaneel wonen.
  const [nieuweFase, setNieuweFase] = React.useState(0)
  // Doel en macro's: dicht bij binnenkomst, want je opent deze kolom om te
  // kijken. Pas als de band zegt dat er iets moet veranderen klap je 'm open.
  const [toonDoelen, setToonDoelen] = React.useState(false)
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* De kop 'Gewicht & Body' stond boven een kolom waar alles al over
          gewicht gaat, en het doelgewicht ernaast stuurde niets — dat is nu de
          horizon in de band. Allebei weg: de fase-regel is de eerste regel. */}
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
            uitklap. Geen toonHuidig meer: het huidige gewicht staat in de
            kopregel naast de naam, en twee keer hetzelfde getal is er één te
            veel. */}
        {history.length > 0 && (
          <WeightStatsGrid
            stats={weightData?.stats || {}} client={client}
            fridayData={{ friday_count: weightData?.fridayCount || 0, total_fridays: 8 }}
            history={history} isMobile={isMobile} coachingPlan={coachingPlan}
            fase={actieveFase} volleBreedte toonGrafiek={toonVerloop}
            onBewerkDoel={() => setDoelOpen(true)}
            grafiekKnop={(
              <Uitklap
                label="Verloop"
                extra={`${history.length} metingen`}
                open={toonVerloop}
                onKlik={() => setToonVerloop(v => !v)}
                isMobile={isMobile}
              />
            )}
          />
        )}
        {/* De band: waar het gewicht hoort te lopen, en of dat gebeurt. */}
        {history.length > 0 && (
          <GewichtBandGrafiek
            client={client} history={history} fase={actieveFase} fases={alleFases}
            onNieuweFase={() => setNieuweFase(n => n + 1)}
            onBijsturen={(kcal) => { setVoorstel(kcal); setToonDoelen(true) }}
            isMobile={isMobile}
          />
        )}
        {/* Bijsturen. Staat direct onder het oordeel, want dat is de zin waar
            je op handelt: 'twee weken te snel → 100-200 kcal eraf'. */}
        <Uitklap
          label="Doelen & macro's"
          extra={client?.target_calories ? `${Math.round(client.target_calories)} kcal` : 'nog niet gezet'}
          open={toonDoelen}
          onKlik={() => setToonDoelen(v => !v)}
          isMobile={isMobile}
        />
        {toonDoelen && (
          <DoelenMacrosPaneel
            client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile}
            fase={actieveFase}
            voorstel={voorstel} onVoorstelWeg={() => setVoorstel(null)}
          />
        )}

        {/* Slaap hoort bij gewicht: een week slecht slapen laat de weegschaal
            stijgen zonder dat er aan het eten iets veranderd is, en dan zoek je
            in de verkeerde hoek. Verschijnt alleen als de klant logt. */}
        <SlaapInsight db={db} client={client} isMobile={isMobile} />

        {/* De cijfers achter de grafiek. Eén tabel met eigen knoppen voor
            week/dag en de periode — de uitklapper 'Alle metingen' met zijn
            eigen week/dag-knop is daarin opgegaan. */}
        {history.length > 0 && (
          <MetingenTabel client={client} history={history} fase={actieveFase} isMobile={isMobile} />
        )}
        {circumData?.latest && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
        )}
        {photos.length > 0 && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Camera size={12} color="rgba(168,85,247,0.5)" /><span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(168,85,247,0.4)', letterSpacing: '-0.01em' }}>Foto's</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{photos.length}</span>
                {onOpenGallery && (
                  <button onClick={onOpenGallery} title="Alle foto's — vergroot overzicht" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 26, padding: '0 0.5rem', borderRadius: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Maximize2 size={11} /> Overzicht
                  </button>
                )}
              </div>
            </div>
            {/* Drie hoeken naast elkaar, elk eerste foto tegen laatste met de
                MA-overlay — hetzelfde beeld als op de trackingpagina. Stond
                eerder als strip miniaturen van 52 bij 52 pixels; daar zie je
                geen verschil op. */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '0.3rem' : '0.5rem',
              // Zonder bovengrens rekken ze mee met het paneel: met één sectie
              // open werd elk vak ruim 400px. Dit is een preview, geen galerij.
              maxWidth: isMobile ? '100%' : 520,
            }}>
              {[
                { hoek: 'front', label: 'Voor' },
                { hoek: 'side',  label: 'Zij' },
                { hoek: 'back',  label: 'Achter' },
              ].map(v => (
                <BeforeAfterCard
                  key={v.hoek}
                  client={client}
                  isMobile={isMobile}
                  bare
                  hoek={v.hoek}
                  bijschrift={v.label}
                  fotos={photos}
                />
              ))}
            </div>

            {/* De losse miniaturen blijven bereikbaar via Overzicht hierboven;
                een aparte strip eronder zou dezelfde foto's dubbel tonen. */}
          </div>
        )}
        {!history.length && !circumData?.latest && photos.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>Geen data</div>
        )}
      </div>

      {/* Het weekdoel en het goede-tempo-bereik. Opent vanaf het potlood bij
          'Doel per week' in de cijferbalk. */}
      {doelOpen && (
        <DoelModal
          client={client}
          db={db}
          fase={actieveFase}
          history={history}
          isMobile={isMobile}
          onSluit={() => setDoelOpen(false)}
          onKlaar={() => { setFaseVersie(v => v + 1); onClientUpdate?.() }}
          onNieuweFase={() => setNieuweFase(n => n + 1)}
        />
      )}
    </div>
  )
}
