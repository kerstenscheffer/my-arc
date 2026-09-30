// src/modules/client-checkin/ProgressieScherm.jsx
//
// Slide 2 van de check-in: "Dit was je progressie van afgelopen week."
//
// Geen vraag maar een terugblik. De klant hoeft hier niets in te vullen; hij
// leest wat er gebeurd is voordat hij erover gaat schrijven. Dat scheelt
// giswerk — mensen schatten hun eigen week systematisch te rooskleurig in.
//
// Regels die de opbouw bepalen:
//   · Een regel zonder data verdwijnt. Liever drie regels die kloppen dan zes
//     met streepjes erin.
//   · Eén getal per blok groot, de rest eromheen klein. Wie scrollt moet in
//     één oogopslag zien of het de goede kant op ging.
//   · Dik wit. Kleur alleen waar hij betekenis draagt: groen voor een
//     vooruitgang die de klant verdiend heeft.

const GROEN = '#10b981'
const GRIJS = 'rgba(255,255,255,0.55)'
const RAND = '#2a2a2a'

const getal = (n, cijfers = 1) =>
  new Intl.NumberFormat('nl-NL', { minimumFractionDigits: cijfers, maximumFractionDigits: cijfers }).format(n)

const metTeken = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${getal(Math.abs(n))}`

function Blok({ titel, children }) {
  return (
    <div style={{ paddingTop: 14, marginTop: 14, borderTop: `1px solid ${RAND}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: GRIJS, marginBottom: 8 }}>
        {titel}
      </div>
      {children}
    </div>
  )
}

export default function ProgressieScherm({ progressie }) {
  if (!progressie) {
    return (
      <div style={{ marginTop: '2.2vh', color: GRIJS, fontSize: 14, fontWeight: 700 }}>
        Je week wordt opgehaald…
      </div>
    )
  }

  const { gewicht, training, voeding, wegingen } = progressie
  const heeftIets = gewicht || training?.sessies > 0 || voeding?.dagen > 0 || wegingen?.dezeWeek > 0

  if (!heeftIets) {
    return (
      <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
          Deze week staat er nog niets geregistreerd.
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: GRIJS, marginTop: 8, lineHeight: 1.55 }}>
          Geen probleem — vul de check-in gewoon in. Vanaf de week dat je logt, laat
          dit scherm je vooruitgang zien.
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '2.2vh', textAlign: 'left' }}>

      {/* Gewicht — het getal waar de meeste mensen als eerste naar kijken. */}
      {gewicht && (
        <div>
          <div style={{
            fontSize: 38, fontWeight: 900, color: '#fff',
            lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {metTeken(gewicht.verschil)}<span style={{ fontSize: '0.5em', marginLeft: 6, color: GRIJS }}>kg</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: GRIJS, marginTop: 7, lineHeight: 1.5 }}>
            {gewicht.soort === 'week'
              ? `sinds vorige zaterdag · ${getal(gewicht.eerder)} → ${getal(gewicht.nu)} kg`
              : `sinds je start · ${getal(gewicht.eerder)} → ${getal(gewicht.nu)} kg`}
          </div>
        </div>
      )}

      {/* Training */}
      {training?.sessies > 0 && (
        <Blok titel="Training">
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>
            {training.sessies} {training.sessies === 1 ? 'training' : 'trainingen'}
            {training.oefeningen > 0 && ` · ${training.oefeningen} oefeningen`}
            {training.sets > 0 && ` · ${training.sets} sets`}
          </div>

          {training.sterker?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GROEN, marginBottom: 6 }}>
                Sterker geworden op
              </div>
              {training.sterker.map(s => (
                <div key={s.oefening} style={{
                  display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4,
                }}>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
                    {s.oefening}
                  </span>
                  <span style={{
                    fontSize: 14.5, fontWeight: 900, color: GROEN,
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    +{s.pct}%
                  </span>
                </div>
              ))}
              {training.meerOefeningen > 0 && (
                <div style={{ fontSize: 13, fontWeight: 700, color: GRIJS, marginTop: 5 }}>
                  en op nog {training.meerOefeningen} {training.meerOefeningen === 1 ? 'oefening' : 'oefeningen'}
                </div>
              )}
            </div>
          )}
        </Blok>
      )}

      {/* Voeding */}
      {voeding?.dagen != null && (
        <Blok titel="Voeding">
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>
            {voeding.dagen} van {voeding.van} dagen op plan
          </div>
        </Blok>
      )}

      {/* Wegen */}
      {wegingen?.dezeWeek != null && (
        <Blok titel="Wegen">
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>
            {wegingen.dezeWeek} van {wegingen.van} dagen gewogen
          </div>
        </Blok>
      )}

      {gewicht && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: GRIJS, marginTop: 14, lineHeight: 1.55 }}>
          Het gewicht is het gemiddelde van je wegingen rond zaterdag, niet één losse
          meting — die schommelt te veel om er iets uit af te lezen.
        </div>
      )}
    </div>
  )
}
