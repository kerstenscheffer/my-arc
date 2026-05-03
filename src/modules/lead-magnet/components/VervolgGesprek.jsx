// src/modules/lead-magnet/components/VervolgGesprek.jsx
import React, { useState } from 'react'
import { Target, ArrowLeft, Dumbbell, Utensils, TrendingUp, TrendingDown } from 'lucide-react'
import MessageTemplate from './MessageTemplate'

export default function VervolgGesprek({ onBack, copiedId, onCopy, isMobile }) {
  const [activeSubSection, setActiveSubSection] = useState(null)

  const BackButton = ({ onClick, label = "Terug" }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '1.5rem',
        touchAction: 'manipulation'
      }}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  )

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: `2px solid ${color}40`
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      <h2 style={{
        color: '#fff',
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        margin: 0
      }}>
        {title}
      </h2>
    </div>
  )

  const SubSectionButton = ({ label, onClick, color = '#3b82f6' }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}40`,
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '600',
        fontSize: isMobile ? '0.9rem' : '0.95rem',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
    >
      {label}
    </button>
  )

  const Divider = ({ text }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.5rem 0'
    }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600' }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  )

  // MAIN MENU
  if (!activeSubSection) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <SectionHeader icon={Target} title="Vervolg Gesprek" color="#3b82f6" />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubSectionButton 
            label="💪 Ze sporten X keer per week" 
            onClick={() => setActiveSubSection('sport-frequentie')}
          />
          <SubSectionButton 
            label="🎯 Ze noemen een doel" 
            onClick={() => setActiveSubSection('doel-genoemd')}
          />
          <SubSectionButton 
            label="🍗 Ze zijn aan het BULKEN" 
            onClick={() => setActiveSubSection('bulken')}
            color="#10b981"
          />
          <SubSectionButton 
            label="🔥 Ze zijn aan het CUTTEN" 
            onClick={() => setActiveSubSection('cutten')}
            color="#ef4444"
          />
          <SubSectionButton 
            label="📊 Ze tracken al hun voeding" 
            onClick={() => setActiveSubSection('tracken')}
          />
          <SubSectionButton 
            label="🍔 Ze letten NIET op voeding" 
            onClick={() => setActiveSubSection('geen-voeding')}
          />
          <SubSectionButton 
            label="😐 Gewoon bezig / niks specifieks" 
            onClick={() => setActiveSubSection('gewoon-bezig')}
          />
          <SubSectionButton 
            label="😕 Ze noemen een probleem/struggle" 
            onClick={() => setActiveSubSection('probleem')}
          />
          <SubSectionButton 
            label="📝 Ze sturen een lang verhaal" 
            onClick={() => setActiveSubSection('lang-verhaal')}
          />
        </div>
      </div>
    )
  }

  // SUB SECTIONS
  const subSections = {
    'sport-frequentie': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Dumbbell} title="Ze sporten X keer per week" color="#3b82f6" />

        <MessageTemplate
          id="sport-1"
          label="Variant A - Doorvragen doel"
          text={`Kijk lekker bezig! [X] keer is prima man 💪

Train je ook ergens voor op dit moment? 😊`}
          tags={['vervolg', 'sport', 'frequentie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="sport-2"
          label="Variant B - Kort"
          text={`Nice! [X] keer is lekker 💪

Waar train je voor op dit moment?`}
          tags={['vervolg', 'sport', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="sport-3"
          label="Variant C - Focus vraag"
          text={`Top man! [X] keer per week is goed te doen 💪

Waar ligt je focus nu? Meer kracht, spiermassa, of iets anders?`}
          tags={['vervolg', 'sport', 'focus']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="sport-4"
          label="Variant D - Voeding vraag"
          text={`Lekker man! [X] keer is een goeie frequentie 💪

En hoe zit je qua voeding? Let je daar ook op?`}
          tags={['vervolg', 'sport', 'voeding']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'doel-genoemd': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Target} title="Ze noemen een doel" color="#3b82f6" />

        <MessageTemplate
          id="doel-1"
          label="Variant A - Aanpak vragen"
          text={`Mooi doel man! Goed dat je weet wat je wilt 💪

Hoe pak je dat aan op dit moment?`}
          tags={['vervolg', 'doel', 'aanpak']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="doel-2"
          label="Variant B - Kort"
          text={`Top! Dat is een duidelijk doel 😊

Hoe ben je daar nu mee bezig?`}
          tags={['vervolg', 'doel', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="doel-3"
          label="Variant C - Tijdslijn"
          text={`Nice doel! 💪

Heb je een bepaalde deadline in gedachten? Of gewoon op je eigen tempo?`}
          tags={['vervolg', 'doel', 'deadline']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="doel-4"
          label="Variant D - Progressie"
          text={`Goed doel man! 💪

Hoe lang ben je daar al mee bezig? En merk je al progressie?`}
          tags={['vervolg', 'doel', 'progressie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'bulken': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={TrendingUp} title="Ze zijn aan het BULKEN" color="#10b981" />

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
            🎯 STRATEGIE: Vraag om specifieke nummers. "Gaat goed" is geen antwoord - vraag door tot je een gat vindt.
          </div>
        </div>

        <Divider text="STAP 1: EERSTE REACTIE" />

        <MessageTemplate
          id="bulk-1"
          label="Variant A"
          text={`Kijk nice man! Bulken is de way to go 💪

Hoe lang ben je daar al mee bezig?`}
          tags={['vervolg', 'bulken', 'eerste']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-2"
          label="Variant B"
          text={`Top! Lekker massa bouwen 💪

Kom je al goed aan in gewicht?`}
          tags={['vervolg', 'bulken', 'gewicht']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-3"
          label="Variant C"
          text={`Nice! Bulk season 💪

Hoe pak je het aan qua voeding?`}
          tags={['vervolg', 'bulken', 'voeding']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="STAP 2: DIEPER GRAVEN" />

        <MessageTemplate
          id="bulk-cal"
          label="🔢 Vraag om calorieën"
          text={`Nice man! Hoeveel calorieën zit je dagelijks ongeveer?`}
          tags={['vervolg', 'bulken', 'calorien']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-eiwit"
          label="🔢 Vraag om eiwitten"
          text={`Top! Hoeveel eiwitten krijg je binnen per dag denk je?`}
          tags={['vervolg', 'bulken', 'eiwit']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-gewicht"
          label="🔢 Vraag om gewicht progressie"
          text={`Lekker! Hoeveel ben je al aangekomen sinds je begon?`}
          tags={['vervolg', 'bulken', 'progressie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-doel"
          label="🔢 Vraag om doel gewicht"
          text={`Nice man! Hoeveel kilo zit je nu en waar wil je naartoe?`}
          tags={['vervolg', 'bulken', 'doel']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="STAP 3: ALS ZE HET NIET WETEN → CALL" />

        <MessageTemplate
          id="bulk-geen-idee"
          label="Als ze zeggen: 'Geen idee' / 'Weet ik niet'"
          text={`Ja zie je, dat is precies waar veel jongens tegenaan lopen. Zonder te weten wat je nodig hebt is het een beetje gokken 😅

Als je wil kan ik even met je meekijken. Dan reken ik uit wat jij nodig hebt en weet je precies waar je moet zitten.

Zou je dat handig vinden?`}
          tags={['vervolg', 'bulken', 'geen idee', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bulk-te-laag"
          label="Als hun nummer te laag/hoog klinkt"
          text={`Ahh oke, dat zou kunnen verklaren waarom je [niet aankomt / te veel vet erbij pakt]. 

Weet je eigenlijk wat je nodig hebt voor jouw lichaam en doel?`}
          tags={['vervolg', 'bulken', 'verkeerd', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="STAP 4: ALS ZE ALLES WETEN → COMMUNITY" />

        <MessageTemplate
          id="bulk-goed"
          label="Als ze alles op orde hebben"
          text={`Top man, dan zit je helemaal goed! Gewoon blijven doen wat je doet 💪

Ik heb trouwens een community waar ik tips deel over bulken, trainingsschema's en dat soort dingen. Helemaal gratis.

Zou je dat interessant vinden?`}
          tags={['vervolg', 'bulken', 'goed', 'community']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'cutten': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={TrendingDown} title="Ze zijn aan het CUTTEN" color="#ef4444" />

        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
            🎯 STRATEGIE: Vraag om specifieke nummers. Bij cutten is spierbehoud cruciaal!
          </div>
        </div>

        <Divider text="STAP 1: EERSTE REACTIE" />

        <MessageTemplate
          id="cut-1"
          label="Variant A"
          text={`Nice man! Cutten is keihard maar worth it 💪

Hoe lang ben je al bezig?`}
          tags={['vervolg', 'cutten', 'eerste']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-2"
          label="Variant B"
          text={`Top! Lekker droog worden 🔥

Zie je het al terug in de spiegel?`}
          tags={['vervolg', 'cutten', 'resultaat']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-3"
          label="Variant C"
          text={`Nice! Cut season 🔥

Hoe pak je het aan qua voeding?`}
          tags={['vervolg', 'cutten', 'voeding']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="STAP 2: DIEPER GRAVEN" />

        <MessageTemplate
          id="cut-cal"
          label="🔢 Vraag om calorieën"
          text={`Nice! Hoeveel calorieën zit je dagelijks op?`}
          tags={['vervolg', 'cutten', 'calorien']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-eiwit"
          label="🔢 Vraag om eiwitten"
          text={`Top! Hoeveel eiwitten krijg je binnen per dag? Dat is cruciaal tijdens een cut 💪`}
          tags={['vervolg', 'cutten', 'eiwit']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-gewicht"
          label="🔢 Vraag om gewicht verlies"
          text={`Lekker! Hoeveel ben je al kwijtgeraakt sinds je begon?`}
          tags={['vervolg', 'cutten', 'progressie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-kracht"
          label="💪 Vraag om kracht behoud"
          text={`Top man! Behoud je je kracht nog een beetje of merk je dat het minder wordt?`}
          tags={['vervolg', 'cutten', 'kracht']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="STAP 3: ALS ZE HET NIET WETEN → CALL" />

        <MessageTemplate
          id="cut-geen-idee"
          label="Als ze zeggen: 'Geen idee' / 'Weet ik niet'"
          text={`Ja zie je, dat is waar de meeste jongens vastlopen tijdens een cut. Zonder te weten wat je nodig hebt verlies je snel spiermassa 😅

Als je wil kan ik even met je meekijken. Dan reken ik uit wat jij nodig hebt om vet te verliezen zonder spieren kwijt te raken.

Zou je dat handig vinden?`}
          tags={['vervolg', 'cutten', 'geen idee', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="cut-geen-resultaat"
          label="Als ze geen resultaat zien"
          text={`Hmm dat is frustrerend man. Hoe lang ben je al bezig?

Vaak betekent dit dat je of te veel eet, of juist te weinig waardoor je metabolisme vertraagt.

Hou je je calorieën bij?`}
          tags={['vervolg', 'cutten', 'geen resultaat']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'tracken': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Utensils} title="Ze tracken al hun voeding" color="#3b82f6" />

        <MessageTemplate
          id="track-1"
          label="Variant A - Positief + doorvragen"
          text={`Oh nice! Top dat je dat doet, de meeste mensen doen dat niet 💪

En hoe gaat het? Zie je de resultaten die je wilt?`}
          tags={['vervolg', 'tracken', 'positief']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="track-2"
          label="Variant B - Welke app"
          text={`Nice man! Welke app gebruik je? MyFitnessPal of iets anders?`}
          tags={['vervolg', 'tracken', 'app']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="track-3"
          label="Variant C - Macro check"
          text={`Top! Dan ben je al verder dan de meeste 💪

Op hoeveel calorieën en eiwitten zit je? Past dat bij je doel?`}
          tags={['vervolg', 'tracken', 'macro']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="track-4"
          label="Variant D - Consistent?"
          text={`Ah nice! Hoe consistent ben je ermee? Elke dag of meer zo nu en dan?`}
          tags={['vervolg', 'tracken', 'consistent']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <Divider text="ALS ZE ALLES OP ORDE HEBBEN" />

        <MessageTemplate
          id="track-goed"
          label="Ze doen het goed"
          text={`Top man! Klinkt alsof je precies weet wat je doet 💪

Ik heb trouwens een gratis community waar ik tips deel. Kan altijd handig zijn om erbij te zitten!

Interesse?`}
          tags={['vervolg', 'tracken', 'goed', 'community']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'geen-voeding': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Utensils} title="Ze letten NIET op voeding" color="#3b82f6" />

        <MessageTemplate
          id="geen-voed-1"
          label="Variant A - Begrip + belang"
          text={`Ahh oke! Ja voeding is voor veel mensen het lastigste stuk 😅

Maar het is wel 80% van je resultaat eigenlijk. Zonder dat op orde te hebben is het moeilijk om echt vooruit te komen.

Waar loop je tegenaan? Geen zin om te tracken, of weet je niet zo goed wat je moet eten?`}
          tags={['vervolg', 'geen voeding', 'belang']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geen-voed-2"
          label="Variant B - Kort"
          text={`Ja snap ik, voeding is voor de meeste het lastigste 😅

Maar dat is wel waar de meeste resultaten vandaan komen eigenlijk!

Zou je daar wel meer mee willen doen?`}
          tags={['vervolg', 'geen voeding', 'kort']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geen-voed-3"
          label="Variant C - Herkenbaar"
          text={`Ja herkenbaar man! Had ik in het begin ook 😅

Maar toen ik dat eenmaal op orde had ging alles veel sneller. Hoeft ook niet super ingewikkeld te zijn hoor!

Wil je er meer mee doen of vind je het prima zo?`}
          tags={['vervolg', 'geen voeding', 'herkenbaar']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="geen-voed-4"
          label="Variant D - Direct naar call"
          text={`Ahh ja, dat is vaak waar mensen vastlopen 😅

Zonder te weten wat je eet is het lastig om resultaat te boeken. Als je wilt kan ik je even helpen uitrekenen wat jij nodig hebt?

Scheelt je een hoop uitzoekwerk!`}
          tags={['vervolg', 'geen voeding', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'gewoon-bezig': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Target} title="Gewoon bezig / niks specifieks" color="#3b82f6" />

        <MessageTemplate
          id="bezig-1"
          label="Variant A - Focus vraag"
          text={`Ja chill! Maar je bent toch wel ergens mee bezig? 😊

Probeer je een beetje spieren op te bouwen of meer richting kracht?`}
          tags={['vervolg', 'bezig', 'focus']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bezig-2"
          label="Variant B - Doel vraag"
          text={`Oke nice! Maar waar focus je dan op als je traint?

Meer spiermassa of gewoon fit blijven? 💪`}
          tags={['vervolg', 'bezig', 'doel']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="bezig-3"
          label="Variant C - Resultaat vraag"
          text={`Nice! Gewoon lekker bezig zijn is ook goed 😊

Maar als je een doel zou moeten kiezen, wat zou dat zijn? Afvallen, spieren bouwen, of sterker worden?`}
          tags={['vervolg', 'bezig', 'resultaat']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'probleem': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Target} title="Ze noemen een probleem" color="#3b82f6" />

        <MessageTemplate
          id="probleem-blessure"
          label="🤕 Blessure"
          text={`Ahh dat is echt kut man, herkenbaar ook 😕

Ik heb dit ook gehad, probeerde toen wat minder zwaar te pakken en mijn houding te verbeteren.

Hoe pak jij het aan om ervan af te komen?`}
          tags={['vervolg', 'probleem', 'blessure']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="probleem-tijd"
          label="⏰ Geen tijd"
          text={`Ja dat ken ik man 😕

Ik had een tijdje een fulltime baan met wisselende tijden, toen was het ook lastig. Wat voor mij werkte was mijn workouts inkorten en de intensiteit verhogen.

Hoe pak jij het aan? Of is dat misschien ook wat voor jou?`}
          tags={['vervolg', 'probleem', 'tijd']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="probleem-motivatie"
          label="😔 Motivatie / niet consistent"
          text={`Ja herkenbaar man, dat heeft iedereen wel eens 😕

Bij mij hielp het om gewoon een vaste tijd te pakken elke week, dan hoef je niet na te denken en doe je het gewoon.

Hoe probeer jij jezelf gemotiveerd te houden?`}
          tags={['vervolg', 'probleem', 'motivatie']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="probleem-voeding"
          label="🍔 Voeding is lastig"
          text={`Ja voeding is voor de meeste mensen het lastigste stuk 😅

Bij mij was dat ook zo, totdat ik het simpel ging houden en niet te ingewikkeld ging doen.

Waar loop je precies tegenaan? Te weinig eten of juist te veel?`}
          tags={['vervolg', 'probleem', 'voeding']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="probleem-resultaat"
          label="📉 Geen resultaat zien"
          text={`Ja dat is frustrerend man, snap ik 😕

Had ik in het begin ook, bleek dat ik gewoon niet genoeg at voor mijn doel.

Hoe lang ben je al bezig? En houd je je voeding een beetje bij?`}
          tags={['vervolg', 'probleem', 'resultaat']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="probleem-plateau"
          label="📊 Plateau / geen progressie meer"
          text={`Ahh ja, een plateau is frustrerend 😕

Dat betekent meestal dat je lichaam gewend is geraakt aan wat je doet. Je moet iets veranderen - training, voeding, of allebei.

Hoe lang zit je al vast?`}
          tags={['vervolg', 'probleem', 'plateau']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    ),

    'lang-verhaal': (
      <div>
        <BackButton onClick={() => setActiveSubSection(null)} label="Terug naar opties" />
        <SectionHeader icon={Target} title="Ze sturen een lang verhaal" color="#3b82f6" />

        <MessageTemplate
          id="lang-1"
          label="Variant A - Samenvatten + focus"
          text={`Oké ik snap het 💪

Goed dat je [IETS POSITIEFS DAT ZE DOEN]!

Waar loop je op dit moment het meeste tegenaan?`}
          tags={['vervolg', 'lang verhaal', 'focus']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
          note="Vervang [IETS POSITIEFS] met iets dat ze noemen"
        />

        <MessageTemplate
          id="lang-2"
          label="Variant B - Begrip + vraag"
          text={`Ah oke, ik snap je situatie! 😊

Klinkt alsof je serieus bezig bent. Wat is op dit moment je grootste struggle?`}
          tags={['vervolg', 'lang verhaal', 'struggle']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />

        <MessageTemplate
          id="lang-3"
          label="Variant C - Direct naar hulp"
          text={`Oke duidelijk! 💪

Klinkt alsof je wel wat hulp kunt gebruiken. Zal ik even met je meekijken? Dan kunnen we samen kijken wat het beste zou werken voor jou.`}
          tags={['vervolg', 'lang verhaal', 'hulp', 'call']}
          copiedId={copiedId}
          onCopy={onCopy}
          isMobile={isMobile}
        />
      </div>
    )
  }

  return subSections[activeSubSection] || null
}
