// src/modules/resource-hub/pages/CardioMenu.jsx
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Flame, Clock, Zap, Shield, Target, Activity, Heart } from 'lucide-react'

const G = { primary: '#FFD700', border: 'rgba(255, 215, 0, 0.08)', muted: 'rgba(255, 215, 0, 0.5)' }

const CARDIO_FORMS = [
  { name: 'Incline Treadmill Walking', cat: 'Steady State', diff: 1, impact: 'Laag', cal: '300-500/uur', equip: 'Loopband', desc: 'De geheime weapon voor vetverbranding. Zet de loopband op 10-15% incline en loop op 5-6 km/u.', best: ['Vetverbranding', 'Beginners', 'Gewrichtsproblemen'], tip: 'Niet vasthouden aan de handvatten — dat halveert het effect.', img: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=200&h=200&fit=crop&q=80' },
  { name: 'Fietsen', cat: 'Steady State', diff: 1, impact: 'Laag', cal: '400-600/uur', equip: 'Fiets', desc: 'Makkelijk op te bouwen, laag impact. Perfecte basiscardio die je jarenlang kunt volhouden.', best: ['Iedereen', 'Knieproblemen', 'Lange sessies'], tip: 'Buitenfietsen voelt minder als "cardio" — mentaal makkelijker.', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&h=200&fit=crop&q=80' },
  { name: 'Roeien', cat: 'Full Body', diff: 2, impact: 'Laag', cal: '500-700/uur', equip: 'Roeimachine', desc: 'Fullbody cardio die ook je rug en armen traint. Hoge calorieverbranding met minimale impact.', best: ['Spieropbouw + cardio', 'Full body', 'Knieproblemen'], tip: '80% benen, 20% armen. Focus op beendruk eerst.', img: 'https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=200&h=200&fit=crop&q=80' },
  { name: 'Zwemmen', cat: 'Full Body', diff: 2, impact: 'Zero', cal: '400-700/uur', equip: 'Zwembad', desc: 'Absolute zero impact. Perfect voor herstel en blessures.', best: ['Blessures', 'Recovery', 'Bovenlichaam'], tip: 'Wisselslag is de beste alleskunner.', img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=200&h=200&fit=crop&q=80' },
  { name: 'Wandelen', cat: 'Low Intensity', diff: 1, impact: 'Zero', cal: '200-350/uur', equip: 'Geen', desc: '10.000 stappen per dag verbrandt meer dan 3x per week hardlopen. Nul blessurerisico.', best: ['Beginners', 'Dagelijkse activiteit', 'Mentale gezondheid'], tip: 'Bouw het in je dag in. Bellen? Loop. Meeting? Walk and talk.', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=200&fit=crop&q=80' },
  { name: 'HIIT Sprints', cat: 'High Intensity', diff: 3, impact: 'Hoog/Laag', cal: '400-600/30min', equip: 'Fiets of baan', desc: '20-30 sec all-out, 60-90 sec rust. 15-20 min en je bent klaar.', best: ['Weinig tijd', 'Maximale verbranding', 'Atletisch'], tip: 'Op de fiets = zelfde effect, nul impact.', img: 'https://images.unsplash.com/photo-1461896836934-bd45ba0fcf7a?w=200&h=200&fit=crop&q=80' },
  { name: 'Touwtje Springen', cat: 'High Intensity', diff: 2, impact: 'Middel', cal: '500-800/uur', equip: 'Springtouw', desc: 'Goedkoop, effectief, overal te doen. Verbetert coordinatie en voetwerk.', best: ['Thuis', 'Coordinatie', 'Korte sessies'], tip: 'Begin 30 sec springen, 30 sec rust. Bouw op naar 2 min.', img: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=200&h=200&fit=crop&q=80' },
  { name: 'Battle Ropes', cat: 'High Intensity', diff: 2, impact: 'Laag', cal: '400-600/30min', equip: 'Battle ropes', desc: 'Armen, core en cardio in een. Voelt als een workout, niet als saai cardio.', best: ['Core', 'Armen + cardio', 'Afwisseling'], tip: '20 sec waves, 10 sec rust (Tabata). 8 rondes = killer.', img: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=200&h=200&fit=crop&q=80' },
  { name: 'Traplopen', cat: 'Steady State', diff: 2, impact: 'Middel', cal: '400-600/uur', equip: 'Trap/StairMaster', desc: 'Activeert bilspieren en hamstrings meer dan lopen.', best: ['Bilspieren', 'Benen + cardio', 'Geen apparatuur'], tip: 'Niet leunen op de machine. Rechtop, volledige stappen.', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop&q=80' },
  { name: 'Sled Push/Pull', cat: 'Functional', diff: 3, impact: 'Laag', cal: '500-800/30min', equip: 'Sled', desc: 'Nul excentrische belasting = minimale spierpijn. Kun je zwaar of licht laden.', best: ['Kracht + cardio', 'Benen', 'Minimale spierpijn'], tip: 'Licht + lang = cardio. Zwaar + kort = kracht.', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&q=80' },
  { name: 'Boksen / Shadowboxing', cat: 'High Intensity', diff: 2, impact: 'Laag', cal: '400-700/uur', equip: 'Geen', desc: 'Stress kwijtraken en fit worden tegelijk.', best: ['Stressverlichting', 'Coordinatie', 'Thuis'], tip: '3 min boksen, 1 min rust. 6-8 rondes is genoeg.', img: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop&q=80' },
  { name: 'Kettlebell Swings', cat: 'Functional', diff: 2, impact: 'Laag', cal: '400-600/30min', equip: 'Kettlebell', desc: 'Kracht en cardio in een beweging. Traint posterior chain.', best: ['Kracht + cardio', 'Posterior chain', 'Efficient'], tip: '10 swings/min, 10 min. Simpel maar dodelijk.', img: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=200&h=200&fit=crop&q=80' },
  { name: 'Hiking / Trail Walking', cat: 'Low Intensity', diff: 1, impact: 'Laag', cal: '300-500/uur', equip: 'Geen', desc: 'Cardio die niet voelt als cardio. Natuur en frisse lucht.', best: ['Mentale gezondheid', 'Weekenden', 'Sociaal'], tip: 'Voeg een rugzak met gewicht toe (rucking).', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop&q=80' },
  { name: 'Skierg / Versa Climber', cat: 'Full Body', diff: 3, impact: 'Laag', cal: '600-900/uur', equip: 'Skierg', desc: 'De machines die niemand gebruikt maar killer zijn. Fullbody.', best: ['Maximale verbranding', 'Full body', 'Gevorderden'], tip: '30 sec on, 30 sec off. Werk naar langere intervallen.', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&q=80' },
  { name: 'Dans / Zumba', cat: 'Fun', diff: 1, impact: 'Middel', cal: '300-600/uur', equip: 'Geen', desc: 'Fun factor hoog. Verbrandt meer dan je denkt.', best: ['Fun factor', 'Sociaal', 'Als je cardio haat'], tip: 'Zet een YouTube video op thuis. Niemand kijkt, ga los.', img: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=200&h=200&fit=crop&q=80' }
]

const DIFF = ['', 'Beginner', 'Gemiddeld', 'Gevorderd']
const DIFF_C = ['', '#10b981', '#f97316', '#ef4444']
const CAT_C = { 'Steady State': '#3b82f6', 'Full Body': '#a855f7', 'Low Intensity': '#10b981', 'High Intensity': '#ef4444', 'Functional': '#f97316', 'Fun': '#ec4899' }

export default function CardioMenu({ db, bundel, user, client, isMember, navigate }) {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const isMobile = window.innerWidth <= 768

  const cats = ['all', ...new Set(CARDIO_FORMS.map(f => f.cat))]
  const filtered = filter === 'all' ? CARDIO_FORMS : CARDIO_FORMS.filter(f => f.cat === filter)

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem', borderBottom: `1px solid ${G.border}` }}>
        <button onClick={() => navigate(`/hub/${bundel.slug}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '0.5rem 0', marginBottom: '0.5rem', touchAction: 'manipulation' }}>
          <ArrowLeft size={14} /> Terug
        </button>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: '900', color: '#fff' }}>Cardio Menu</h1>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{CARDIO_FORMS.length} cardiovormen</div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0.625rem 1rem', display: 'flex', gap: '0.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderBottom: `1px solid ${G.border}` }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '0.3rem 0.6rem', background: filter === c ? 'rgba(255,215,0,0.1)' : 'transparent',
            border: `1px solid ${filter === c ? G.muted : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '6px', color: filter === c ? G.primary : 'rgba(255,255,255,0.3)',
            fontSize: '0.68rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation'
          }}>{c === 'all' ? 'Alles' : c}</button>
        ))}
      </div>

      {/* Cards — TodaysWorkoutCard pattern */}
      <div>
        {filtered.map((form, idx) => {
          const isExp = expanded === idx
          const cc = CAT_C[form.cat] || G.primary

          return (
            <div key={idx}>
              {/* Card row */}
              <div onClick={() => setExpanded(isExp ? null : idx)} style={{
                display: 'flex', alignItems: 'stretch',
                borderBottom: `1px solid ${G.border}`,
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: isMobile ? '80px' : '90px'
              }}>
                {/* Image */}
                <div style={{ width: isMobile ? '80px' : '90px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${form.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.85 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.05))' }} />
                  <div style={{
                    position: 'absolute', top: '5px', left: '5px',
                    padding: '2px 5px', borderRadius: '4px',
                    background: 'rgba(0,0,0,0.7)', border: `1px solid ${cc}40`,
                    fontSize: '0.5rem', fontWeight: '700', color: cc, letterSpacing: '0.03em'
                  }}>{form.cat}</div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', gap: '0.25rem' }}>
                  <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>{form.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '600', color: DIFF_C[form.diff] }}>{DIFF[form.diff]}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>·</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{form.impact} impact</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>·</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{form.cal}</span>
                  </div>
                </div>

                {/* Expand */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', color: 'rgba(255,255,255,0.15)' }}>
                  {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded details */}
              {isExp && (
                <div style={{ padding: isMobile ? '1rem' : '1.25rem', background: 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${G.border}` }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{form.desc}</p>
                  
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[['Impact', form.impact, form.impact === 'Zero' ? '#10b981' : form.impact === 'Laag' ? '#3b82f6' : '#f97316'], ['Niveau', DIFF[form.diff], DIFF_C[form.diff]], ['Nodig', form.equip, 'rgba(255,255,255,0.5)']].map(([l, v, c], i) => (
                      <div key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${G.border}`, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{l}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Best for */}
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {form.best.map((t, i) => (
                      <span key={i} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,215,0,0.04)', border: `1px solid ${G.border}` }}>{t}</span>
                    ))}
                  </div>

                  {/* Pro tip */}
                  <div style={{ padding: '0.75rem', borderLeft: `2px solid ${G.primary}`, background: 'rgba(255,215,0,0.02)' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: '700', color: G.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Pro Tip</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{form.tip}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
