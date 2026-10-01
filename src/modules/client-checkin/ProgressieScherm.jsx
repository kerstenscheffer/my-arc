// src/modules/client-checkin/ProgressieScherm.jsx
//
// Slide 2 van de check-in: "Je progressie afgelopen week."
//
// De ene vraag die dit scherm beantwoordt (wet 7 uit DESIGN-CONTRACT.md):
// ging het de goede kant op? Alles wat die vraag niet dient is kleiner
// gemaakt, ingeklapt of weggelaten.
//
// Opbouw volgens het contract:
//   · Drie tekstgroottes, niet meer: het hero-getal, de sectiekop (title),
//     en body. Daarnaast het stat-label van 11px, dat is een eigen rol.
//   · Geen dividers tussen secties, maar 32px lucht (wet 4).
//   · Eén surface-niveau: de uitlegblokken zijn --surface, verder niets
//     geneste (wet 2).
//   · Geel komt hier niet voor. Kleur is groen voor behaald en rood voor de
//     verkeerde kant op, en dat is semantiek, geen decoratie (wet 1).
//   · Wat secundair is zit achter een accordion of een info-knop (wet 5).

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import { colors, radius, space } from '../../ui/tokens'
import SterkerKaart from './SterkerKaart'

// Oordeelkleuren. Groen en rood komen uit de tokens; oranje bestaat daar niet
// en is hier "net niet", tussen behaald en misgegaan in.
const OORDEEL_KLEUR = { goed: colors.success, bijna: '#f59e0b', niet: colors.danger }

const nl = (n, cijfers = 0) =>
  new Intl.NumberFormat('nl-NL', { minimumFractionDigits: cijfers, maximumFractionDigits: cijfers }).format(n)

const metTeken = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${nl(Math.abs(n), 1)}`

const kortDatum = (iso) => {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

// ── De drie tekstrollen ───────────────────────────────────────────────────
// Geen groot hero-getal: alle regels dezelfde maat, dik en wit. Een 38px
// cijfer naast een 15px zin oogde als twee schermen door elkaar.
const TITEL = { fontSize: 18, fontWeight: 800, color: colors.textPrimary, lineHeight: 1.25 }
const BODY = { fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: colors.textPrimary }
const BODY_ZACHT = { ...BODY, color: colors.textSecondary }
const LABEL = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: colors.textMuted,
}

// Sectie als band: de foto staat links tégen de schermrand, even hoog als
// de sectie, en loopt naar rechts weg in zwart. De tekst begint al over dat
// zwarte deel, zodat foto en tekst één blok vormen in plaats van twee
// kolommen. Geen rand, geen divider: de 32px lucht ertussen doet het werk.
//
// De negatieve linkermarge is precies de zijpadding van het formulier
// (16px mobiel, 24px desktop): anders blijft er een streepje zwart tussen
// foto en rand staan.
const FOTO_BREEDTE = 140
const ZIJPADDING = { mobiel: 16, desktop: 24 }

function Sectie({ titel, foto, rechts, eerste, isMobile, children }) {
  const rand = isMobile ? ZIJPADDING.mobiel : ZIJPADDING.desktop
  return (
    <div style={{
      position: 'relative',
      // De drie banden sluiten op elkaar aan: geen ruimte en geen lijn
      // ertussen. De foto's vormen samen één strook aan de linkerkant.
      marginTop: eerste ? space[4] : 0,
      marginLeft: -rand,
      // Verticale padding op de band, niet op de tekst: de foto zit op de
      // padding-box en steekt daardoor 8px boven en onder de tekst uit.
      padding: `${space[2]}px 0 ${space[2]}px ${rand + Math.round(FOTO_BREEDTE * 0.55)}px`,
      minHeight: 88,
    }}>
      {/* Klein streepje als overgang tussen de banden: kort, bij de tekst,
          niet over de hele breedte en niet door de foto. */}
      {!eerste && (
        <span aria-hidden style={{
          position: 'absolute', top: 0,
          left: rand + Math.round(FOTO_BREEDTE * 0.55),
          width: 24, height: 1, background: 'rgba(255,255,255,0.35)',
        }} />
      )}
      {foto && (
        <img
          src={foto}
          alt=""
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: FOTO_BREEDTE, height: '100%', objectFit: 'cover',
            // Gedimd én weglopend: de foto is sfeer, de tekst is de inhoud.
            // De fade zit in de foto zelf (masker), niet als laagje erover:
            // dat kan niet verkeerd stapelen en werkt ook in Safari.
            filter: 'brightness(0.55)',
            WebkitMaskImage: 'linear-gradient(90deg, #000 15%, transparent 92%)',
            maskImage: 'linear-gradient(90deg, #000 15%, transparent 92%)',
          }}
        />
      )}
      <div style={{ position: 'relative', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2], marginBottom: 0 }}>
          <div style={{ ...TITEL, flex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}>{titel}</div>
          {rechts}
        </div>
        {children}
      </div>
    </div>
  )
}

// Rond knopje van 44px, de minimale tap-target uit het contract.
function InfoKnop({ open, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, padding: 0, flexShrink: 0,
        borderRadius: radius.pill, cursor: 'pointer',
        background: open ? colors.surfaceHover : 'transparent',
        border: 'none',
        color: open ? colors.textPrimary : colors.textSecondary,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Info size={16} strokeWidth={2.2} />
    </button>
  )
}

// Uitlegblok: één surface-niveau, dus --surface en verder niets erin.
function Uitleg({ children }) {
  return (
    <div style={{
      marginTop: space[3], padding: space[4],
      background: colors.surface, borderRadius: radius.card,
      border: `1px solid ${colors.borderSubtle}`,
      ...BODY_ZACHT,
    }}>
      {children}
    </div>
  )
}

function WeekRegel({ tot, gemiddelde, lijst }) {
  return (
    <div style={{ marginTop: space[2], ...BODY_ZACHT }}>
      <strong style={{ color: colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
        {nl(gemiddelde, 1)} kg
      </strong>
      {` tot ${kortDatum(tot)}`}
      {lijst?.length > 0 && (
        <span style={{ color: colors.textMuted }}>
          {' · '}{lijst.map(w => nl(w.kg, 1)).join(' · ')}
        </span>
      )}
    </div>
  )
}

export default function ProgressieScherm({ progressie, isMobile, db, clientId }) {
  const [gewichtUit, setGewichtUit] = useState(false)
  const [sterkerUit, setSterkerUit] = useState(false)
  const [voedingUit, setVoedingUit] = useState(false)
  const [trainingUit, setTrainingUit] = useState(false)

  if (!progressie) {
    return <div style={{ ...BODY, marginTop: space[4] }}>Je week wordt opgehaald…</div>
  }

  const { gewicht, training, voeding, wegingen } = progressie
  const heeftIets = gewicht || training?.sessies > 0 || voeding?.bijgehouden > 0

  // Empty state is een uitnodiging, geen leeg vlak (wet 6).
  if (!heeftIets) {
    return (
      <div style={{ marginTop: space[4], textAlign: 'left' }}>
        <div style={TITEL}>Deze week staat er nog niets geregistreerd.</div>
        <div style={{ ...BODY, marginTop: space[2] }}>
          Vul de check-in gewoon in. Vanaf de week dat je je trainingen en wegingen
          bijhoudt, laat dit scherm je vooruitgang zien.
        </div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'left' }}>

      {/* Elke sectie heeft hetzelfde skelet: kop met info-knop, regel A in
          wit met het kerncijfer, regel B zacht met één regel context. Wat
          daaronder uitklapt verschilt, het zichtbare deel niet. */}

      {/* ── Gewicht ── */}
      {gewicht && (
        <Sectie
          titel="Gewicht" foto="/checkin/gewicht.jpg" eerste isMobile={isMobile}
          rechts={<InfoKnop open={gewichtUit} onClick={() => setGewichtUit(v => !v)} label="Hoe is dit berekend?" />}
        >
          <div style={BODY}>
            <span style={{ color: gewicht.oordeel ? OORDEEL_KLEUR[gewicht.oordeel] : colors.textPrimary }}>
              {metTeken(gewicht.verschil)} kg
            </span>
            {gewicht.doelBereik && <span style={BODY_ZACHT}>{' · doel '}{gewicht.doelBereik}</span>}
          </div>
          {wegingen?.dezeWeek != null && (
            <div style={{ ...BODY_ZACHT, marginTop: 2 }}>
              {wegingen.dezeWeek} van {wegingen.van} dagen gewogen
            </div>
          )}

          {gewichtUit && (
            <Uitleg>
              <strong style={{ color: colors.textPrimary }}>
                {gewicht.soort === 'week'
                  ? `Sinds vorige zaterdag: ${nl(gewicht.eerder, 1)} naar ${nl(gewicht.nu, 1)} kg`
                  : `Sinds je start: ${nl(gewicht.eerder, 1)} naar ${nl(gewicht.nu, 1)} kg`}
                {gewicht.doelBereik && `. Goed tempo is ${gewicht.doelBereik} kg per week`}
              </strong>
              {gewicht.soort === 'week' ? (
                <>
                  <div style={{ marginTop: space[2] }}>
                    Het gemiddelde van de week tot zaterdag, tegen dat van de week ervoor.
                    Twee losse wegingen schelen een kilo of twee per ochtend.
                  </div>
                  <WeekRegel tot={gewicht.zaterdag} gemiddelde={gewicht.nu} lijst={gewicht.wegingenNu} />
                  <WeekRegel tot={gewicht.vorigeZaterdag} gemiddelde={gewicht.eerder} lijst={gewicht.wegingenEerder} />
                </>
              ) : (
                <div style={{ marginTop: space[2] }}>
                  Nog geen twee volle weken om te vergelijken, dus dit is je gemiddelde
                  van nu tegenover je startgewicht.
                </div>
              )}
            </Uitleg>
          )}
        </Sectie>
      )}

      {/* ── Training ── */}
      {training?.sessies > 0 && (
        <Sectie
          titel="Training" foto="/checkin/training.jpg" isMobile={isMobile}
          rechts={<InfoKnop open={trainingUit} onClick={() => setTrainingUit(v => !v)} label="Hoe wordt sterker gemeten?" />}
        >
          <div style={BODY}>
            {training.sessies} {training.sessies === 1 ? 'training' : 'trainingen'}
            {training.oefeningen > 0 && ` · ${training.oefeningen} oefeningen`}
            {training.sets > 0 && ` · ${training.sets} sets`}
          </div>

          {training.sterker?.length > 0 ? (
            <button
              type="button"
              onClick={() => setSterkerUit(v => !v)}
              aria-expanded={sterkerUit}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: space[1],
                padding: 0, marginTop: 2, background: 'transparent', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                ...BODY,
              }}
            >
              <span>
                Sterker geworden op {training.sterker.length + training.meerOefeningen}
                {training.sterker.length + training.meerOefeningen === 1 ? ' oefening' : ' oefeningen'}
              </span>
              <span style={{
                width: 20, height: 20, borderRadius: radius.pill, background: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transform: sterkerUit ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
              }}>
                <ChevronDown size={14} strokeWidth={3} color={colors.bg} />
              </span>
            </button>
          ) : (
            <div style={{ ...BODY_ZACHT, marginTop: 2 }}>Geen oefening zwaarder dan vorige week</div>
          )}

          {trainingUit && (
            <Uitleg>
              Vergeleken op je zwaarste set, omgerekend naar wat je voor 8 herhalingen
              zou kunnen. Zo telt 100 kg voor 5 net zo goed mee als 80 kg voor 12.
              Alles onder 3% verschil laten we weg: dat is ruis van een andere dag.
            </Uitleg>
          )}

          {sterkerUit && training.sterker?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: space[2], marginTop: space[2] }}>
              {training.sterker.map(s => (
                <SterkerKaart
                  key={s.oefening}
                  oefening={s.oefening} vorig={s.vorig} nu={s.nu} pct={s.pct}
                  db={db} clientId={clientId} isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </Sectie>
      )}

      {/* ── Voeding ── */}
      {voeding?.bijgehouden > 0 && (
        <Sectie
          titel="Voeding" foto="/checkin/voeding.jpg" isMobile={isMobile}
          rechts={<InfoKnop open={voedingUit} onClick={() => setVoedingUit(v => !v)} label="Wat telt hier mee?" />}
        >
          <div style={BODY}>
            Bijgehouden op {voeding.bijgehouden} van {voeding.van} dagen
          </div>
          {voeding.gemKcal != null && (
            <div style={{ ...BODY_ZACHT, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {nl(voeding.gemKcal)}{voeding.doelKcal ? ` / ${nl(voeding.doelKcal)}` : ''} kcal
              {voeding.gemEiwit != null && (
                <>{' · '}{nl(voeding.gemEiwit)}{voeding.doelEiwit ? ` / ${nl(voeding.doelEiwit)}` : ''} g eiwit</>
              )}
            </div>
          )}

          {voedingUit && (
            <Uitleg>
              <strong style={{ color: colors.textPrimary }}>
                Gemiddelde van je {voeding.compleet} complete {voeding.compleet === 1 ? 'dag' : 'dagen'}, tegen je dagdoel.
              </strong>
              <div style={{ marginTop: space[2] }}>
                Dit telt wat je in de app hebt afgevinkt, niet wat je hebt gegeten. Een dag
                heet compleet zodra je minstens 70% van je geplande maaltijden hebt
                aangetikt. Eet je goed maar vink je niets af, dan blijft het hier leeg.
              </div>
            </Uitleg>
          )}
        </Sectie>
      )}
    </div>
  )
}
