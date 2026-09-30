// src/modules/steps/StappenUitlegModal.jsx
//
// Waar dat calorie-getal vandaan komt, en waarom je het met een korrel zout
// moet nemen. Opent vanaf het informatie-icoontje naast de schatting.
//
// De toon is bewust nuchter: een schatting die zich voordoet als meting is
// erger dan geen schatting. Daarom staat de bandbreedte er groot bij en zijn
// de bronnen aanklikbaar — wie het wil nakijken, moet dat kunnen.

import Modal from '../../ui/Modal'
import { colors, radius, space } from '../../ui/tokens'
import { AANNAMES, MARGE, BRONNEN } from './stappenEnergie'

export default function StappenUitlegModal({ isOpen, onClose, isMobile }) {
  const m = isMobile

  const kop = {
    fontSize: m ? '0.95rem' : '1rem', fontWeight: 900,
    letterSpacing: '-0.01em',
    color: colors.textPrimary, marginBottom: space[2],
  }
  const tekst = {
    fontSize: m ? '0.9rem' : '0.94rem', lineHeight: 1.6,
    color: 'rgba(255,255,255,0.7)', margin: 0,
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Over deze schatting" isMobile={isMobile} maxWidth={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: space[6] }}>

        <section>
          <div style={kop}>Hoe het berekend wordt</div>
          <p style={tekst}>
            Je stappen worden eerst omgerekend naar looptijd: bij ongeveer{' '}
            <strong style={{ color: colors.textPrimary }}>{AANNAMES.stappenPerMinuut} stappen per minuut</strong>{' '}
            loop je op matige intensiteit. Dat tempo staat gelijk aan{' '}
            <strong style={{ color: colors.textPrimary }}>{AANNAMES.metWandelen} MET</strong>, drie keer je
            verbruik in rust. Daar gaat vervolgens {AANNAMES.metRust} MET vanaf, want dat had je op de bank
            ook verbrand.
          </p>
          <div style={{
            marginTop: space[3], padding: space[3],
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: radius.btn,
            fontSize: m ? '0.82rem' : '0.86rem', color: colors.textPrimary,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}>
            kcal ≈ stappen × gewicht(kg) × 0,00035
          </div>
          <p style={{ ...tekst, marginTop: space[2], fontSize: m ? '0.8rem' : '0.84rem' }}>
            Wat je ziet is dus de <strong style={{ color: colors.textPrimary }}>extra</strong> verbranding
            door te lopen. Een horloge toont meestal het totaal inclusief rustverbruik, en komt daardoor
            hoger uit.
          </p>
        </section>

        <section>
          <div style={kop}>Hoe nauwkeurig is het?</div>
          <p style={tekst}>
            Het is een schatting, geen meting. Reken op een marge van ongeveer{' '}
            <strong style={{ color: colors.textPrimary }}>{Math.round(MARGE * 100)}% naar boven of beneden</strong>.
            Wat de uitkomst verschuift:
          </p>
          <ul style={{ ...tekst, paddingLeft: '1.1rem', marginTop: space[2] }}>
            <li><strong style={{ color: colors.textPrimary }}>Tempo.</strong> Stevig doorstappen op 130 stappen per minuut kost al snel het dubbele van slenteren.</li>
            <li><strong style={{ color: colors.textPrimary }}>Hellingen en ondergrond.</strong> Bergop of door zand kost fors meer dan een vlakke stoep.</li>
            <li><strong style={{ color: colors.textPrimary }}>Je bouw.</strong> Beenlengte en pasgrootte bepalen hoeveel meters één stap oplevert.</li>
            <li><strong style={{ color: colors.textPrimary }}>Getraindheid.</strong> Wie veel loopt doet het efficiënter en verbrandt bij hetzelfde tempo iets minder.</li>
          </ul>
          <p style={{ ...tekst, marginTop: space[3] }}>
            Gebruik het dus voor de lijn over weken, niet om één dag mee dicht te rekenen.
          </p>
        </section>

        <section>
          <div style={kop}>Waar het op gebaseerd is</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
            {BRONNEN.map((b) => (
              <a
                key={b.url}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', paddingBottom: space[3],
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: m ? '0.86rem' : '0.9rem', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.35 }}>
                  {b.titel}
                </div>
                <div style={{ fontSize: m ? '0.78rem' : '0.81rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                  {b.auteurs} · {b.waar}
                </div>
                <div style={{ fontSize: m ? '0.83rem' : '0.86rem', color: 'rgba(255,255,255,0.65)', marginTop: 6, lineHeight: 1.45 }}>
                  {b.waarvoor}
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </Modal>
  )
}
