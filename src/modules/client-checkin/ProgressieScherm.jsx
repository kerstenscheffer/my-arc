// src/modules/client-checkin/ProgressieScherm.jsx
//
// Slide 2 van de check-in: "Dit was je progressie van afgelopen week."
//
// Geen vraag maar een terugblik. De klant hoeft hier niets in te vullen; hij
// leest wat er gebeurd is voordat hij erover gaat schrijven. Dat scheelt
// giswerk, want mensen schatten hun eigen week systematisch te rooskleurig in.
//
// Regels die de opbouw bepalen:
//   · Een regel zonder data verdwijnt. Liever drie regels die kloppen dan zes
//     met streepjes erin.
//   · Elk getal is na te rekenen. Achter het gewicht en achter de voeding zit
//     een uitlegvenster met de onderliggende metingen; een getal dat je niet
//     kunt controleren ga je op den duur wantrouwen.
//   · Dik wit. Kleur alleen waar hij betekenis draagt.

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import GewichtBandGrafiek from '../coach-command-center/components/insight/GewichtBandGrafiek'

const GROEN = '#10b981'
// Zelfde drie kleuren als het coach-overzicht: haalde je het afgesproken
// tempo, zat je er net onder, of ging het de verkeerde kant op.
const OORDEEL_KLEUR = { goed: '#10b981', bijna: '#f59e0b', niet: '#ef4444' }
const GRIJS = 'rgba(255,255,255,0.55)'
const RAND = '#2a2a2a'

const nl = (n, cijfers = 0) =>
  new Intl.NumberFormat('nl-NL', { minimumFractionDigits: cijfers, maximumFractionDigits: cijfers }).format(n)

const metTeken = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${nl(Math.abs(n), 1)}`

const kortDatum = (iso) => {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return iso }
}

function Blok({ titel, rechts, children }) {
  return (
    <div style={{ paddingTop: 14, marginTop: 14, borderTop: `1px solid ${RAND}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{titel}</div>
        {rechts}
      </div>
      {children}
    </div>
  )
}

// Een rond knopje van 32px. Groot genoeg om op een telefoon te raken zonder
// dat het naast het getal gaat staan schreeuwen.
function InfoKnop({ open, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, padding: 0, flexShrink: 0,
        borderRadius: 999, cursor: 'pointer',
        background: open ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: `1px solid ${open ? 'rgba(255,255,255,0.3)' : RAND}`,
        color: open ? '#fff' : GRIJS,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Info size={15} strokeWidth={2.4} />
    </button>
  )
}

// Uitklapbaar tekstblok onder een getal.
function Uitleg({ children }) {
  return (
    <div style={{
      marginTop: 10, padding: '10px 12px',
      background: 'rgba(255,255,255,0.04)', borderRadius: 12,
      fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

// Eén regel per week: het gemiddelde vet, de losse wegingen erachter. Twee
// koppen met daaronder een rij maakte het venster twee keer zo hoog zonder
// dat er meer in stond.
function WeekRegel({ tot, gemiddelde, lijst }) {
  return (
    <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5 }}>
      <span style={{ fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
        {nl(gemiddelde, 1)} kg
      </span>
      <span style={{ color: GRIJS, fontWeight: 700 }}> tot {kortDatum(tot)}</span>
      {lijst?.length > 0 && (
        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
          {' · '}{lijst.map(w => nl(w.kg, 1)).join(' · ')}
        </span>
      )}
    </div>
  )
}

export default function ProgressieScherm({ progressie, client, isMobile }) {
  const [gewichtUit, setGewichtUit] = useState(false)
  const [sterkerUit, setSterkerUit] = useState(false)
  const [voedingUit, setVoedingUit] = useState(false)

  if (!progressie) {
    return (
      <div style={{ marginTop: '2.2vh', color: GRIJS, fontSize: 14, fontWeight: 700 }}>
        Je week wordt opgehaald…
      </div>
    )
  }

  const { gewicht, training, voeding, wegingen, grafiek } = progressie
  const heeftIets = gewicht || training?.sessies > 0 || voeding?.bijgehouden > 0 || wegingen?.dezeWeek > 0

  if (!heeftIets) {
    return (
      <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
          Deze week staat er nog niets geregistreerd.
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: GRIJS, marginTop: 8, lineHeight: 1.55 }}>
          Geen probleem, vul de check-in gewoon in. Vanaf de week dat je logt, laat
          dit scherm je vooruitgang zien.
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>

      {/* ── Gewicht ── */}
      {gewicht && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              fontSize: 38, fontWeight: 900,
              color: gewicht.oordeel ? OORDEEL_KLEUR[gewicht.oordeel] : '#fff',
              lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
            }}>
              {metTeken(gewicht.verschil)}<span style={{ fontSize: '0.5em', marginLeft: 6, opacity: 0.6 }}>kg</span>
            </div>
            {gewicht.doelBereik && (
              <div style={{ fontSize: 13.5, fontWeight: 800, color: GRIJS, whiteSpace: 'nowrap' }}>
                doel{' '}
                <span style={{ color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums' }}>
                  {gewicht.doelBereik}
                </span>
              </div>
            )}
            <InfoKnop
              open={gewichtUit}
              onClick={() => setGewichtUit(v => !v)}
              label="Hoe is dit berekend?"
            />
          </div>

          {gewichtUit && (
            <Uitleg>
              {/* De regel die eerst onder het getal stond. Hij hoort hier: op
                  het scherm zelf telt alleen het getal en de kleur. */}
              <div style={{ fontWeight: 800, color: '#fff' }}>
                {gewicht.soort === 'week'
                  ? `Sinds vorige zaterdag: ${nl(gewicht.eerder, 1)} naar ${nl(gewicht.nu, 1)} kg`
                  : `Sinds je start: ${nl(gewicht.eerder, 1)} naar ${nl(gewicht.nu, 1)} kg`}
                {gewicht.doelBereik && `. Goed tempo is ${gewicht.doelBereik} kg per week`}
              </div>

              {gewicht.soort === 'week' ? (
                <>
                  <div style={{ marginTop: 8 }}>
                    Het gemiddelde van de week tot zaterdag, tegen dat van de week ervoor.
                    Twee losse wegingen schelen een kilo of twee per ochtend.
                  </div>
                  <WeekRegel tot={gewicht.zaterdag} gemiddelde={gewicht.nu} lijst={gewicht.wegingenNu} />
                  <WeekRegel tot={gewicht.vorigeZaterdag} gemiddelde={gewicht.eerder} lijst={gewicht.wegingenEerder} />
                </>
              ) : (
                <div style={{ marginTop: 8 }}>
                  Nog geen twee volle weken om te vergelijken, dus dit is je gemiddelde
                  van nu tegenover je startgewicht.
                </div>
              )}
            </Uitleg>
          )}

          {/* De grafiek met de band eromheen: dezelfde als in coach insight, zodat
              jij en je coach naar hetzelfde plaatje kijken. */}
          {grafiek?.history?.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <GewichtBandGrafiek
                client={client}
                history={grafiek.history}
                fase={grafiek.fase}
                fases={grafiek.fases}
                isMobile={isMobile}
                klantModus
              />
            </div>
          )}
        </div>
      )}

      {/* ── Training ── */}
      {training?.sessies > 0 && (
        <Blok titel="Training">
          <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            {training.sessies} {training.sessies === 1 ? 'training' : 'trainingen'}
            {training.oefeningen > 0 && ` · ${training.oefeningen} oefeningen`}
            {training.sets > 0 && ` · ${training.sets} sets`}
          </div>


          {training.sterker?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setSterkerUit(v => !v)}
                aria-expanded={sterkerUit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 0', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  color: '#fff', fontSize: 16, fontWeight: 900, fontFamily: 'inherit',
                  textAlign: 'left',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ flex: 1 }}>
                  Sterker geworden op {training.sterker.length + training.meerOefeningen}
                  {training.sterker.length + training.meerOefeningen === 1 ? ' oefening' : ' oefeningen'}
                </span>
                <ChevronDown
                  size={17} strokeWidth={2.6}
                  style={{ transform: sterkerUit ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </button>

              {sterkerUit && (
                <div style={{ marginTop: 8 }}>
                  {training.sterker.map(s => (
                    <div key={s.oefening} style={{
                      display: 'flex', alignItems: 'baseline', gap: 10,
                      padding: '8px 12px', borderBottom: `1px solid ${RAND}`,
                    }}>
                      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
                        {s.oefening}
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: GRIJS, marginTop: 2 }}>
                          {nl(s.vorig, 1)} naar {nl(s.nu, 1)} kg
                        </span>
                      </span>
                      <span style={{
                        fontSize: 15, fontWeight: 900, color: GROEN,
                        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                      }}>
                        +{s.pct}%
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: GRIJS, marginTop: 8, lineHeight: 1.55 }}>
                    Vergeleken op je zwaarste set, omgerekend naar wat je voor 8 herhalingen
                    zou kunnen. Zo telt 100 kg voor 5 net zo goed mee als 80 kg voor 12.
                  </div>
                </div>
              )}
            </div>
          )}
        </Blok>
      )}

      {/* ── Voeding ── */}
      {voeding && voeding.bijgehouden > 0 && (
        <Blok
          titel="Voeding"
          rechts={<InfoKnop open={voedingUit} onClick={() => setVoedingUit(v => !v)} label="Wat telt hier mee?" />}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            Bijgehouden op {voeding.bijgehouden} van {voeding.van} dagen
          </div>
          {voeding.gemKcal != null && (
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 1.5 }}>
              Op je {voeding.compleet} complete {voeding.compleet === 1 ? 'dag' : 'dagen'} gemiddeld{' '}
              <strong style={{ color: '#fff' }}>{nl(voeding.gemKcal)} kcal</strong>
              {voeding.doelKcal ? ` van je ${nl(voeding.doelKcal)}` : ''}
              {voeding.gemEiwit != null && (
                <> en <strong style={{ color: '#fff' }}>{nl(voeding.gemEiwit)}g eiwit</strong>
                {voeding.doelEiwit ? ` van je ${nl(voeding.doelEiwit)}` : ''}</>
              )}
            </div>
          )}
          {voedingUit && (
            <Uitleg>
              Dit telt wat je in de app hebt afgevinkt, niet wat je hebt gegeten. Een dag
              heet compleet zodra je minstens 70% van je geplande maaltijden hebt
              aangetikt. Eet je goed maar vink je niets af, dan blijft het hier leeg,
              en dat zegt dus niets over je week.
            </Uitleg>
          )}
        </Blok>
      )}

      {/* ── Wegen ── */}
      {wegingen?.dezeWeek != null && (
        <Blok titel="Wegen">
          <div style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
            {wegingen.dezeWeek} van {wegingen.van} dagen gewogen
          </div>
        </Blok>
      )}
    </div>
  )
}
