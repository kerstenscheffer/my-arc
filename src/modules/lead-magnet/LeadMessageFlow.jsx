import React, { useState } from 'react'

export default function LeadMessageFlow() {
  const [copiedId, setCopiedId] = useState(null)
  const [activeFlow, setActiveFlow] = useState('bulk') // Updated default
  const isMobile = window.innerWidth <= 768

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      alert('Kon niet kopiëren')
    })
  }

  const MessageCard = ({ step, title, text, id, color = '#10b981', note }) => (
    <div
      onClick={() => copyMessage(text, id)}
      style={{
        background: '#111',
        border: `2px solid ${color}`,
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1rem',
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        minHeight: '44px',
        transition: 'all 0.2s ease',
        transform: copiedId === id ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      {step && (
        <div style={{
          background: color,
          color: '#000',
          fontWeight: 'bold',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          display: 'inline-block',
          marginBottom: '0.5rem'
        }}>
          {step}
        </div>
      )}
      
      <div style={{
        color: color,
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: 'bold',
        marginBottom: '0.75rem'
      }}>
        {title}
      </div>

      <div style={{
        color: '#fff',
        fontSize: isMobile ? '0.9rem' : '1rem',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.6
      }}>
        {text}
      </div>

      {note && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderLeft: '3px solid #10b981',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#34d399',
          fontStyle: 'italic'
        }}>
          💡 {note}
        </div>
      )}

      <div style={{
        fontSize: '0.75rem',
        color: '#666',
        marginTop: '0.75rem',
        textAlign: 'right'
      }}>
        {copiedId === id ? '✓ Gekopieerd!' : '👆 Tap om te kopiëren'}
      </div>
    </div>
  )

  return (
    <div style={{
      background: '#000',
      color: '#fff',
      minHeight: '100vh',
      padding: isMobile ? '1rem' : '1.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '1.5rem 1rem' : '2rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          marginBottom: '2rem',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            💬 Natural DM Flow
          </h1>
          <p style={{ fontSize: isMobile ? '0.9rem' : '1rem', opacity: 0.95 }}>
            4 Berichten → Free Call (Geen Sales Talk)
          </p>
        </div>

        {/* Toggle Buttons - Persona's */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
          background: '#111',
          padding: '0.5rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <button
            onClick={() => setActiveFlow('bulk')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'bulk' ? '#10b981' : 'transparent',
              color: activeFlow === 'bulk' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            💪 Bulk
          </button>
          <button
            onClick={() => setActiveFlow('cut')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'cut' ? '#10b981' : 'transparent',
              color: activeFlow === 'cut' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            🔥 Cut
          </button>
          <button
            onClick={() => setActiveFlow('consistency')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'consistency' ? '#10b981' : 'transparent',
              color: activeFlow === 'consistency' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            📆 Consistency
          </button>
          <button
            onClick={() => setActiveFlow('plateau')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'plateau' ? '#10b981' : 'transparent',
              color: activeFlow === 'plateau' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            📊 Plateau
          </button>
        </div>

        {/* Secondary Toggle - Old Flows */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
          background: '#111',
          padding: '0.5rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <button
            onClick={() => setActiveFlow('pdf')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'pdf' ? '#3b82f6' : 'transparent',
              color: activeFlow === 'pdf' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            📄 PDF Flow
          </button>
          <button
            onClick={() => setActiveFlow('engagement')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'engagement' ? '#3b82f6' : 'transparent',
              color: activeFlow === 'engagement' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            💬 Engagement
          </button>
          <button
            onClick={() => setActiveFlow('follower')}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              background: activeFlow === 'follower' ? '#3b82f6' : 'transparent',
              color: activeFlow === 'follower' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.2s ease'
            }}
          >
            👋 New Follower
          </button>
        </div>

        {/* BULK STRUGGLER FLOW */}
        {activeFlow === 'bulk' && (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                💪 PERSONA: Bulk Struggler
              </h3>
              <p style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem', margin: 0 }}>
                Traint al, wil spieren aankomen, lukt niet goed. Eet niet genoeg of geen progressie.
              </p>
            </div>

            <MessageCard
              step="BERICHT 1"
              title="Start (Story Reply)"
              text="Yo! Zag je poll - lekker aan het trainen?"
              id="bulk1"
              note="Wacht op 'ja' - houd het simpel"
            />

            <MessageCard
              step="BERICHT 2"
              title="Doel Achterhalen"
              text="Nice man! Waar train je voor op het moment?
Ben je aan het bulken of cutten ofzo?"
              id="bulk2"
              note="Ze zeggen: 'probeer wat massa op te bouwen' of 'wil aankomen'"
            />

            <MessageCard
              step="BERICHT 3"
              title="Confronterende Vraag"
              text="Ah bulken, sick. Hoeveel kilo ben je de afgelopen maand aangekomen eigenlijk?

En waar zou je over 3 maanden willen staan?"
              id="bulk3"
              note="Ze realiseren: 'eigenlijk weinig' of 'stagneer beetje'"
            />

            <MessageCard
              step="BERICHT 4"
              title="The Offer"
              text="Herkenbaar man, bulken is lastig.

Ik heb ff tijd dit weekend - zal ik je gewoon helpen met een compleet plan opstellen?

45 min call waar ik voor je maak:
- 7-daags voedingsplan (op jouw cals voor bulken)
- Workout schema die past bij jouw schema
- Boodschappenlijst + macro targets
- Strategie hoe je consistent blijft eten

Gewoon gratis, zodat je komende 3 maanden echt vooruit gaat. Down?"
              id="bulk4"
              note="Geen 'limited spots' eerste gesprek - dat komt later bij twijfel"
            />
          </div>
        )}

        {/* CUT STRUGGLER FLOW */}
        {activeFlow === 'cut' && (
          <div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                🔥 PERSONA: Cut Struggler
              </h3>
              <p style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem', margin: 0 }}>
                Traint al, wil vet verliezen, ziet weinig resultaat. Te hoog cal deficit of inconsistent.
              </p>
            </div>

            <MessageCard
              step="BERICHT 1"
              title="Start (Story Reply)"
              text="Yo! Zag je poll - lekker aan het trainen?"
              id="cut1"
              color="#ef4444"
              note="Wacht op 'ja'"
            />

            <MessageCard
              step="BERICHT 2"
              title="Doel Achterhalen"
              text="Mooi man! Waar ben je voor aan het trainen?
Cut of gewoon maintain ofzo?"
              id="cut2"
              color="#ef4444"
              note="Ze zeggen: 'probeer wat te cutten' of 'wil droger worden'"
            />

            <MessageCard
              step="BERICHT 3"
              title="Confronterende Vraag"
              text="Ah vet! Hoe gaat de cut tot nu toe?
Hoeveel kilo ben je al kwijt de laatste weken?

En waar zou je graag over 3 maanden staan?"
              id="cut3"
              color="#ef4444"
              note="Ze realiseren: 'gaat eigenlijk traag' of 'val niet echt af'"
            />

            <MessageCard
              step="BERICHT 4"
              title="The Offer"
              text="Snap hem. Cutten is fokking moeilijk zonder goed plan.

Ik kan je ff helpen dit weekend als je wil?

45 min call waar we samen maken:
- 7-daags voedingsplan (cut cals maar wel vol)
- Training schema voor vet verbranden
- Boodschappenlijst met satiating foods
- Strategie om honger te managen

Zodat je komende 3 maanden echt ziet wat je wil zien. 100% gratis. Zullen we doen?"
              id="cut4"
              color="#ef4444"
            />
          </div>
        )}

        {/* CONSISTENCY STRUGGLER FLOW */}
        {activeFlow === 'consistency' && (
          <div>
            <div style={{
              background: 'rgba(251, 146, 60, 0.1)',
              border: '1px solid #fb923c',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#fb923c', marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                📆 PERSONA: Inconsistent Trainer
              </h3>
              <p style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem', margin: 0 }}>
                Traint wel, maar niet consistent. Ziet daardoor geen resultaat. Motivatie fluctueert.
              </p>
            </div>

            <MessageCard
              step="BERICHT 1"
              title="Start (Story Reply)"
              text="Yo! Zag je poll - lekker aan het trainen?"
              id="cons1"
              color="#fb923c"
              note="Wacht op 'ja'"
            />

            <MessageCard
              step="BERICHT 2"
              title="Doel Achterhalen"
              text="Goed bezig! Hoe vaak train je per week ongeveer?
En waar train je voor op het moment?"
              id="cons2"
              color="#fb923c"
              note="Ze zeggen: '3-4x' of 'probeer 4x maar lukt niet altijd'"
            />

            <MessageCard
              step="BERICHT 3"
              title="Confronterende Vraag"
              text="Ah oké. Is dat consistent die 3-4x of heb je wel eens weken dat het er maar 1-2x van komt?

Want waar zou je over 3 maanden willen staan met je lichaam?"
              id="cons3"
              color="#fb923c"
              note="Ze realiseren: 'ja klopt, soms is het lastig consistent te blijven'"
            />

            <MessageCard
              step="BERICHT 4"
              title="The Offer"
              text="Snap ik man. Consistency is letterlijk alles.

Zal ik je ff helpen met een plan dat wel bij je leven past?

45 min call waar we kijken naar:
- Hoeveel dagen je realistisch kunt trainen
- Voedingsplan die je echt kan volhouden
- Workout schema die past in jouw week
- Strategie om consistent te blijven

Zodat je komende 3 maanden geen excuses meer hebt. Gratis gewoon. Zullen we inplannen?"
              id="cons4"
              color="#fb923c"
            />
          </div>
        )}

        {/* PLATEAU FLOW */}
        {activeFlow === 'plateau' && (
          <div>
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid #a855f7',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                📊 PERSONA: Plateau Persoon
              </h3>
              <p style={{ color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem', margin: 0 }}>
                Traint al langer, zag eerst resultaat, nu niet meer. Zit vast op zelfde gewicht/kracht.
              </p>
            </div>

            <MessageCard
              step="BERICHT 1"
              title="Start (Story Reply)"
              text="Yo! Zag je poll - lekker aan het trainen?"
              id="plat1"
              color="#a855f7"
              note="Wacht op 'ja'"
            />

            <MessageCard
              step="BERICHT 2"
              title="Doel Achterhalen"
              text="Nice! Hoe lang train je al?
En zie je nog vooruitgang of zit je beetje vast?"
              id="plat2"
              color="#a855f7"
              note="Ze zeggen: 'paar maanden/jaar, gaat nu wat minder'"
            />

            <MessageCard
              step="BERICHT 3"
              title="Confronterende Vraag"
              text="Herkenbaar. Hoelang zit je al op hetzelfde gewicht/kracht ongeveer?

En waar zou je over 3 maanden willen staan als je wel blijft groeien?"
              id="plat3"
              color="#a855f7"
              note="Ze realiseren: 'al paar maanden eigenlijk hetzelfde'"
            />

            <MessageCard
              step="BERICHT 4"
              title="The Offer"
              text="Classic plateau man. Je hebt gewoon nieuwe stimulus nodig.

Laat ik je ff helpen dit weekend?

45 min call waar we samen kijken naar:
- Waar je vast zit (voeding/training/recovery)
- Nieuw voedingsplan met andere macro split
- Fresh workout schema met progressie plan
- Strategie om door plateau heen te breken

Zodat je komende 3 maanden weer echt groeit. Niks gekker dan dit gratis te doen. Down?"
              id="plat4"
              color="#a855f7"
            />
          </div>
        )}

        {/* OLD PDF FLOW */}
        {activeFlow === 'pdf' && (
          <div>
            <MessageCard
              step="STAP 1"
              title="Bedankt + PDF Aanbod"
              text="Hee! Leuk dat je op m'n verhaal had gereageerd, thanks! 🙏

Ik heb dit onderwerp toevallig deze week in m'n gratis community behandeld. Zou ik die PDF gratis naar je opsturen? Er zit best veel waardevolle info in waar je veel aan kunt hebben! 🙃"
              id="step1"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 2"
              title="PDF Verzenden"
              text="Top! Hier is 'ie 👇

[PDF VERSTUREN]

Deze aanpak heeft al veel mensen geholpen die vastliepen bij vetverlies. Ik ben benieuwd wat je ervan vindt. Laat me weten wat je er uithaalt! 💪"
              id="step2"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 3"
              title="Struggle Identificeren"
              text="Nice dat je dat herkent! Veel mensen lopen daar tegenaan.

Mag ik vragen - wat is op dit moment je grootste struggle als het gaat om afvallen/fitter worden? Want iedereen heeft zo z'n eigen obstakels 🤔"
              id="step3"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 4"
              title="Goal Discovery"
              text="Oke, dat geeft me een goed beeld!

Als je vooruit kijkt - hoe zou je ideale situatie eruitzien over pakweg 3 maanden? Waar zou je dan willen staan qua gewicht/fitheid/energie?

Gewoon nieuwsgierig naar waar je naartoe wilt 😊"
              id="step4"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 5"
              title="Gap Analysis"
              text="Vet dat je daar zo duidelijk over bent! 💪

Als ik het goed begrijp: je wilt [DOEL], maar je loopt vooral tegen [STRUGGLE] aan. Herken je dat als je er zo over nadenkt?

En voel je dat dit iets is waar je op eigen houtje uitkomt, of zou wat begeleiding/structuur je helpen om daar sneller te komen?"
              id="step5"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 6"
              title="Call Voorstel"
              text="Snap ik helemaal!

Kijk, ik help mensen om precies dit soort obstakels op te lossen. Meestal begint dat met een 1-op-1 gesprek waarin we kijken naar jouw specifieke situatie - wat wel/niet werkt, waar je tegenaan loopt, en hoe we dat praktisch kunnen aanpakken.

Geen verplichtingen ofzo, gewoon een gesprek om te kijken of ik je überhaupt kan helpen en hoe dat eruit zou zien.

Lijkt je dat wat? Dan kunnen we gewoon een keer 30 minuutjes bellen 📞"
              id="step6"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 7"
              title="Call Booking"
              text="Top! 🔥

Ik heb [DEZE WEEK] nog ruimte op [OPTIES: bijv. woensdag 14:00 of donderdag 19:00].

Past een van die momenten? Anders kunnen we ook kijken naar volgende week!

Oh en stuur me ff je telefoonnummer, dan bel ik je 📞"
              id="step7"
              color="#3b82f6"
            />
          </div>
        )}

        {/* Engagement Flow */}
        {activeFlow === 'engagement' && (
          <div>
            <MessageCard
              step="STAP 1"
              title="Reactie + Compliment"
              text="Nice! [HUN ANTWOORD herformuleren] 💪

Hoe gaat het tot nu toe met je doelen? Zie je al resultaat?"
              id="engage1"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 2"
              title="Validatie + Struggle Discovery"
              text="Snap ik! Dat is herkenbaar.

Wat vind je zelf het lastigste aan consistent blijven/resultaat zien?"
              id="engage2"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 3"
              title="Dieper Graven"
              text="Ah oke, dat hoor ik vaker!

Denk je dat het komt door [VERMOEDEN: bijv. gebrek aan plan/onzekerheid over of je het goed doet/geen structuur]?"
              id="engage3"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 4"
              title="Gap + Hulp Intro"
              text="Snap ik helemaal. Meestal is het niet dat mensen niet hard werken, maar gewoon geen duidelijke route hebben snap je?

Zou het helpen als iemand je daar even mee helpt - gewoon kijken wat er beter kan?"
              id="engage4"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 5"
              title="Call Voorstel"
              text="Lijkt het je wat om gewoon een keer 30 minuutjes te bellen? Dan kan ik je situatie checken en kijken waar je tegenaan loopt. Geen verplichtingen, gewoon sparren 😊"
              id="engage5"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 6"
              title="Call Booking"
              text="Top! 🔥

Ik heb [DEZE WEEK] nog ruimte op [OPTIES: bijv. woensdag 14:00 of donderdag 19:00].

Past een van die momenten? Anders kunnen we ook kijken naar volgende week!

Oh en stuur me ff je telefoonnummer, dan bel ik je 📞"
              id="engage6"
              color="#3b82f6"
            />
          </div>
        )}

        {/* New Follower Flow */}
        {activeFlow === 'follower' && (
          <div>
            <MessageCard
              step="STAP 1"
              title="Welkom + Interest Check"
              text="Hee! Thanks voor de follow! 🙏

Mag ik vragen waar je me van kent? Of wat je aanspreekt in m'n content?"
              id="follower1"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 2"
              title="Situatie Peilen"
              text="Ah nice! Blij dat je het waardevol vindt 😊

Ben je zelf ook bezig met fitness/afvallen? Of ben je vooral aan het rondkijken?"
              id="follower2"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 3"
              title="Struggle Discovery"
              text="Vet dat je ermee bezig bent! 💪

Waar loop je op dit moment vooral tegenaan? Want vaak zie ik dat mensen wel gemotiveerd zijn, maar ergens vastlopen snap je?"
              id="follower3"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 4"
              title="Waarde Bieden"
              text="Herkenbaar! Dat hoor ik vaker.

Ik post regelmatig tips over [HUN STRUGGLE] in m'n stories. En ik heb ook een gratis community waar ik dit soort dingen uitleg. Zou je dat interessant vinden?"
              id="follower4"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 5"
              title="Dieper Interesse"
              text="Top! Ik stuur je zo de link.

Even nieuwsgierig - wat zou voor jou de ideale situatie zijn over 3 maanden? Waar wil je staan?"
              id="follower5"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 6"
              title="Gap + Hulp Suggestie"
              text="Nice doel! 💪

Als je merkt dat je er zelf niet uitkomt of sneller vooruitgang wilt - ik help mensen hiermee. Meestal begint dat met een kort gesprek om te kijken waar je tegenaan loopt en hoe ik je kan helpen.

Zou je dat interessant vinden? Dan kunnen we gewoon een keer 30 minuutjes bellen, zonder verplichtingen 😊"
              id="follower6"
              color="#3b82f6"
            />

            <MessageCard
              step="STAP 7"
              title="Call Booking"
              text="Top! 🔥

Ik heb [DEZE WEEK] nog ruimte op [OPTIES: bijv. woensdag 14:00 of donderdag 19:00].

Past een van die momenten? Anders kunnen we ook kijken naar volgende week!

Oh en stuur me ff je telefoonnummer, dan bel ik je 📞"
              id="follower7"
              color="#3b82f6"
            />
          </div>
        )}

        {/* Divider */}
        <div style={{
          height: '2px',
          background: '#333',
          margin: '2rem 0'
        }} />

        {/* Adaptive Responses Section */}
        <div style={{
          color: '#10b981',
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          🎯 Adaptive Responses
        </div>

        <MessageCard
          title="Als ze vragen: 'Waarom gratis?'"
          text="Eerlijk? Ik wil meer mensen helpen die echt vastzitten. En ik weet dat als je ziet wat ik kan doen in 45 min, dat je mij wil als coach.

Dus win-win: jij hebt een compleet plan, ik help iemand verder. No strings attached."
          id="why_free"
          color="#f59e0b"
        />

        <MessageCard
          title="Als ze zeggen: 'Ik denk erover na'"
          text="Sure man! Maar ik doe dit weekend maar 10 calls, dus als je het wil moet je ff snel zijn. Laat me weten!"
          id="thinking"
          color="#f59e0b"
        />

        <MessageCard
          title="Als ze zeggen: 'Wat is de catch?'"
          text="Geen catch. Op de call krijg je letterlijk alles wat je nodig hebt. Als je daarna wil dat ik je help met uitvoeren, kunnen we praten. Maar eerst gewoon waarde geven."
          id="catch"
          color="#f59e0b"
        />

        {/* Divider */}
        <div style={{
          height: '2px',
          background: '#333',
          margin: '2rem 0'
        }} />

        {/* Extra Messages */}
        <div style={{
          color: '#10b981',
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          📝 Extra Berichten
        </div>

        <MessageCard
          title="Confirmation"
          text="Perfect! Dan spreken we elkaar [DAG] om [TIJD] 📞

Ik bel je op [NUMMER].

Tot dan! En mocht er iets tussen komen, geef me even een seintje 😊"
          id="confirmation"
          color="#3b82f6"
        />

        <MessageCard
          title="24u Reminder"
          text="Hee! Reminder dat we morgen om [TIJD] bellen 📞 Zorg dat je er bent! 😊"
          id="reminder"
          color="#3b82f6"
        />

        <MessageCard
          title="Follow-up PDF"
          text="Hee! Heb je de PDF kunnen checken? Benieuwd of het aansluit bij wat jij zoekt 🙌"
          id="followup"
          color="#666"
        />

        <MessageCard
          title="Prijs Vraag"
          text="Goeie vraag! Ik vind het altijd fijn om eerst even te sparren - dan kan ik je ook beter vertellen wat ik voor jou kan betekenen en of het überhaupt bij je past. Dan kunnen we daarna kijken naar investering en opties. Scheelt ons allebei tijd 😊"
          id="price"
          color="#f59e0b"
        />

        <MessageCard
          title="Twijfel"
          text="Helemaal goed! Neem de tijd. Als je vragen hebt of je bent eruit, laat maar weten 😊"
          id="doubt"
          color="#666"
        />

        <MessageCard
          title="Exit"
          text="Helemaal goed! Succes met je doelen, en als je in de toekomst toch wilt sparren, je weet me te vinden 💪"
          id="exit"
          color="#666"
        />

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          padding: '1.5rem',
          color: '#666',
          fontSize: '0.85rem'
        }}>
          <p>💬 Natural DM Flow - Kersten</p>
          <p style={{ marginTop: '0.5rem' }}>4 Berichten → Free Call → €300 Close</p>
        </div>
      </div>

      {/* Toast */}
      {copiedId && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: '#000',
          padding: '12px 24px',
          borderRadius: '24px',
          fontWeight: 'bold',
          zIndex: 1000,
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)'
        }}>
          ✓ Gekopieerd!
        </div>
      )}
    </div>
  )
}
