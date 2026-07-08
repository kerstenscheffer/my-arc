// src/ui/UiDemo.jsx
// Interne controle-pagina (route /ui-demo, niet gelinkt in menu's).
// Toont de 5 bouwstenen + kleuren + tekststijlen, zodat het fundament in één
// oogopslag te checken is tegen de workout-referentie — op telefoon én desktop.
import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { colors, radius, space, type } from './tokens'
import Card from './Card'
import Button from './Button'
import Modal from './Modal'
import Eyebrow from './Eyebrow'
import EmptyState from './EmptyState'

const SwatchGrid = () => {
  const items = [
    ['bg', colors.bg], ['surface', colors.surface], ['surfaceHover', colors.surfaceHover],
    ['textPrimary', colors.textPrimary], ['textSecondary', colors.textSecondary], ['textMuted', colors.textMuted],
    ['accent', colors.accent], ['success', colors.success], ['danger', colors.danger],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: space[3] }}>
      {items.map(([name, val]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: space[2] }}>
          <div style={{ height: 56, borderRadius: radius.btn, background: val, border: `1px solid ${colors.borderSubtle}` }} />
          <div style={{ ...type.statLabel }}>{name}</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>{val}</div>
        </div>
      ))}
    </div>
  )
}

const Section = ({ label, title, children }) => (
  <section style={{ marginBottom: space[8] }}>
    <Eyebrow>{label}</Eyebrow>
    <h2 style={{ ...type.title, margin: `${space[2]}px 0 ${space[4]}px` }}>{title}</h2>
    {children}
  </section>
)

export default function UiDemo() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: '100dvh', background: colors.bg, color: colors.textPrimary }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `${space[8]}px var(--space-page)` }}>
        <Eyebrow>Fundament</Eyebrow>
        <h1 style={{ ...type.title, fontSize: 28, margin: `${space[2]}px 0 ${space[6]}px` }}>UI-demo — design contract</h1>

        <Section label="Kleuren" title="Palet">
          <SwatchGrid />
        </Section>

        <Section label="Typografie" title="Tekstrollen">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space[3] }}>
              <Eyebrow>Eyebrow — sectielabel</Eyebrow>
              <div style={type.title}>Title — 22px bold wit</div>
              <div style={type.body}>Body — 15px grijs. Korte, leesbare regels; nooit meer dan drie tekstgroottes op één scherm.</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: space[2] }}>
                <span style={{ ...type.statValue, fontSize: 28 }}>128</span>
                <span style={type.statLabel}>Stat-label</span>
              </div>
            </div>
          </Card>
        </Section>

        <Section label="Kaarten" title="Card + highlight">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: space[4] }}>
            <Card>
              <Eyebrow>Standaard</Eyebrow>
              <div style={{ ...type.title, fontSize: 18, margin: `${space[2]}px 0` }}>Gewone kaart</div>
              <div style={type.body}>Eén surface-niveau, subtiele rand, radius 16.</div>
            </Card>
            <Card highlight>
              <Eyebrow>Highlight</Eyebrow>
              <div style={{ ...type.title, fontSize: 18, margin: `${space[2]}px 0` }}>Belangrijkste info</div>
              <div style={{ ...type.body, marginBottom: space[3] }}>Max één per scherm — gouden accent-rand.</div>
              <Button variant="primary">Actie</Button>
            </Card>
          </div>
        </Section>

        <Section label="Knoppen" title="Button-varianten">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: space[3] }}>
            <Button variant="primary">Primair</Button>
            <Button variant="secondary">Secundair</Button>
            <Button variant="primary" disabled>Uitgeschakeld</Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500) }}
            >
              {loading ? 'Bezig…' : 'Test loading'}
            </Button>
          </div>
        </Section>

        <Section label="Pop-up" title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Voorbeeld-modal"
            footer={<>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Annuleren</Button>
              <Button variant="primary" style={{ flex: 1.6 }} onClick={() => setModalOpen(false)}>Bevestigen</Button>
            </>}
          >
            <div style={type.body}>
              Donkere overlay, sluitknop rechtsboven (≥44px), sluit ook via overlay-klik of Escape.
              Op telefoon komt deze van onderen (bottom sheet), op desktop gecentreerd.
            </div>
          </Modal>
        </Section>

        <Section label="Lege staat" title="EmptyState">
          <Card>
            <EmptyState
              icon={<Inbox size={40} />}
              title="Nog niks hier"
              message="Zodra je iets toevoegt, verschijnt het op deze plek."
              actionLabel="Eerste toevoegen"
              onAction={() => {}}
            />
          </Card>
        </Section>
      </div>
    </div>
  )
}
