// src/modules/lead-messages/data/messages.js
// Centrale database voor alle DM berichten

export const messagesData = {
  // ==========================================
  // EERSTE BERICHTEN
  // ==========================================
  eersteBerichten: {
    title: "Eerste Berichten",
    description: "Nieuwe volgers aanschrijven",
    icon: "MessageCircle",
    color: "#10b981",
    messages: [
      {
        id: "eerste-1",
        label: "Variant A - Sport vraag (simpel)",
        text: `Heyy [NAAM]! Leuk dat je mij volgt, dankjewel daarvoor! 😊

Leuke profielfoto!

Ik was benieuwd, sport jij ook? 💪`,
        tags: ["sport", "eerste", "simpel"]
      },
      {
        id: "eerste-2",
        label: "Variant B - Keuze vraag",
        text: `Heyy [NAAM]! Top dat je mij ook bent gaan volgen! 💪

Leuke profielfoto!

Waar ligt jouw interesse meer? Is dat juist voeding en gezonder eten of juist sporten en workouts? 😊`,
        tags: ["voeding", "sport", "keuze", "eerste"]
      },
      {
        id: "eerste-3",
        label: "Variant C - Direct sportschool vraag",
        text: `Heyy [NAAM]! Leuk dat je mij volgt! 😊

Leuke profielfoto!

Ik was benieuwd, ga jij ook naar de sportschool? 💪`,
        tags: ["sportschool", "gym", "eerste"]
      },
      {
        id: "eerste-4",
        label: "Variant D - Kort & krachtig",
        text: `Heyy [NAAM]! Thanks voor het volgen! 💪

Leuke profielfoto!

Sport je veel? 😊`,
        tags: ["kort", "simpel", "eerste"]
      },
      {
        id: "eerste-5",
        label: "Variant E - Chill & casual",
        text: `Heyy [NAAM]! Leuk dat je mij volgt man! 😊

Leuke profielfoto!

Ben je ook bezig met fitness of meer voeding? 💪`,
        tags: ["casual", "fitness", "voeding", "eerste"]
      },
      {
        id: "eerste-6",
        label: "Variant F - Lifestyle focus",
        text: `Heyy [NAAM]! Thanks voor de follow! 😊

Mooie feed heb je!

Ben je bezig met een gezondere lifestyle of train je al? 💪`,
        tags: ["lifestyle", "gezond", "eerste"]
      },
      {
        id: "eerste-7",
        label: "Variant G - Goals vraag",
        text: `Heyy [NAAM]! Leuk dat je volgt! 😊

Nice profiel!

Heb je bepaalde fitness goals waar je aan werkt? 💪`,
        tags: ["goals", "doelen", "eerste"]
      }
    ],
    complimenten: [
      "Zieke [AUTO] heb je man!",
      "Leuke Insta heb je, ziet er netjes uit!",
      "Ik zie dat je [CLUB] fan bent, lekker man!",
      "Mooie foto's heb je!",
      "Ziet er professioneel uit je pagina!",
      "Ik zag dat je ook [HOBBY] doet, nice!",
      "Dikke profielfoto!",
      "Ziet eruit alsof je al bezig bent met fitness!"
    ]
  },

  // ==========================================
  // VERVOLG GESPREK
  // ==========================================
  vervolgGesprek: {
    title: "Vervolg Gesprek",
    description: "Reacties op hun antwoorden",
    icon: "Target",
    color: "#3b82f6",
    subSections: {
      sportFrequentie: {
        title: "Ze sporten X keer per week",
        messages: [
          {
            id: "sport-freq-1",
            label: "Optie A",
            text: `Kijk lekker bezig! [X] keer is prima man 💪

Train je ook ergens voor op dit moment? 😊`,
            tags: ["sport", "frequentie", "training"]
          },
          {
            id: "sport-freq-2",
            label: "Optie B",
            text: `Nice! [X] keer is lekker 💪

Waar train je voor op dit moment?`,
            tags: ["sport", "frequentie", "doel"]
          },
          {
            id: "sport-freq-3",
            label: "Optie C - Meer nieuwsgierig",
            text: `Top man! [X] keer per week is een goed ritme 💪

Ben je meer bezig met kracht opbouwen of juist conditie?`,
            tags: ["sport", "frequentie", "kracht", "conditie"]
          }
        ]
      },
      bulken: {
        title: "Ze zijn aan het BULKEN",
        color: "#10b981",
        strategy: "Vraag om specifieke nummers. 'Gaat goed' is geen antwoord - vraag door tot je een gat vindt.",
        messages: [
          {
            id: "bulk-reactie-1",
            label: "Eerste reactie A",
            text: `Kijk nice man! Bulken is de way to go 💪

Hoe lang ben je daar al mee bezig?`,
            tags: ["bulk", "eerste", "reactie"]
          },
          {
            id: "bulk-reactie-2",
            label: "Eerste reactie B",
            text: `Top! Lekker massa bouwen 💪

Kom je al goed aan in gewicht?`,
            tags: ["bulk", "gewicht", "reactie"]
          },
          {
            id: "bulk-cal",
            label: "🔢 Vraag om calorieën",
            text: `Nice man! Hoeveel calorieën zit je dagelijks ongeveer?`,
            tags: ["bulk", "calorieën", "vraag"]
          },
          {
            id: "bulk-eiwit",
            label: "🔢 Vraag om eiwitten",
            text: `Top! Hoeveel eiwitten krijg je binnen per dag denk je?`,
            tags: ["bulk", "eiwit", "protein", "vraag"]
          },
          {
            id: "bulk-gewicht",
            label: "🔢 Vraag om gewicht",
            text: `Lekker! Hoeveel ben je al aangekomen sinds je begon?`,
            tags: ["bulk", "gewicht", "progressie"]
          },
          {
            id: "bulk-doel",
            label: "🔢 Vraag om doel gewicht",
            text: `Nice man! Hoeveel kilo zit je nu en waar wil je naartoe?`,
            tags: ["bulk", "doel", "gewicht"]
          },
          {
            id: "bulk-geen-idee",
            label: "Als ze 'Geen idee' zeggen",
            text: `Ja zie je, dat is precies waar veel jongens tegenaan lopen. Zonder te weten wat je nodig hebt is het een beetje gokken 😅

Als je wil kan ik even met je meekijken. Dan reken ik uit wat jij nodig hebt en weet je precies waar je moet zitten.

Zou je dat handig vinden?`,
            tags: ["bulk", "geen idee", "call", "hulp"]
          },
          {
            id: "bulk-te-laag",
            label: "Als nummer te laag/hoog klinkt",
            text: `Ahh oke, dat zou kunnen verklaren waarom je [niet aankomt / te veel vet erbij pakt]. 

Weet je eigenlijk wat je nodig hebt voor jouw lichaam en doel?`,
            tags: ["bulk", "probleem", "doorvragen"]
          },
          {
            id: "bulk-goed",
            label: "Als ze alles op orde hebben",
            text: `Top man, dan zit je helemaal goed! Gewoon blijven doen wat je doet 💪

Ik heb trouwens een community waar ik tips deel over bulken, trainingsschema's en dat soort dingen. Helemaal gratis.

Zou je dat interessant vinden?`,
            tags: ["bulk", "community", "goed"]
          }
        ]
      },
      cutten: {
        title: "Ze zijn aan het CUTTEN",
        color: "#ef4444",
        strategy: "Vraag om specifieke nummers. 'Gaat goed' is geen antwoord - vraag door tot je een gat vindt.",
        messages: [
          {
            id: "cut-reactie-1",
            label: "Eerste reactie A",
            text: `Nice man! Cutten is keihard maar worth it 💪

Hoe lang ben je al bezig?`,
            tags: ["cut", "eerste", "reactie"]
          },
          {
            id: "cut-reactie-2",
            label: "Eerste reactie B",
            text: `Top! Lekker droog worden 🔥

Zie je het al terug in de spiegel?`,
            tags: ["cut", "resultaat", "reactie"]
          },
          {
            id: "cut-cal",
            label: "🔢 Vraag om calorieën",
            text: `Nice! Hoeveel calorieën zit je dagelijks op?`,
            tags: ["cut", "calorieën", "vraag"]
          },
          {
            id: "cut-eiwit",
            label: "🔢 Vraag om eiwitten",
            text: `Top! Hoeveel eiwitten krijg je binnen per dag? Dat is cruciaal tijdens een cut 💪`,
            tags: ["cut", "eiwit", "protein", "vraag"]
          },
          {
            id: "cut-gewicht",
            label: "🔢 Vraag om gewicht verlies",
            text: `Lekker! Hoeveel ben je al kwijtgeraakt sinds je begon?`,
            tags: ["cut", "gewicht", "progressie"]
          },
          {
            id: "cut-tempo",
            label: "🔢 Vraag om tempo",
            text: `Nice! Hoeveel verlies je per week ongeveer?`,
            tags: ["cut", "tempo", "snelheid"]
          },
          {
            id: "cut-kracht",
            label: "💪 Vraag om kracht behoud",
            text: `Top man! Behoud je je kracht nog een beetje of merk je dat het minder wordt?`,
            tags: ["cut", "kracht", "spieren"]
          },
          {
            id: "cut-geen-idee",
            label: "Als ze 'Geen idee' zeggen",
            text: `Ja zie je, dat is waar de meeste jongens vastlopen tijdens een cut. Zonder te weten wat je nodig hebt verlies je snel spiermassa 😅

Als je wil kan ik even met je meekijken. Dan reken ik uit wat jij nodig hebt om vet te verliezen zonder spieren kwijt te raken.

Zou je dat handig vinden?`,
            tags: ["cut", "geen idee", "call", "hulp"]
          },
          {
            id: "cut-te-snel",
            label: "Als ze te snel afvallen",
            text: `Ahh oke, dat klinkt alsof je misschien te weinig eet of te weinig eiwit binnenkrijgt. Dan verlies je spiermassa in plaats van alleen vet 😕

Weet je eigenlijk hoeveel je nodig hebt om goed te cutten zonder spieren te verliezen?`,
            tags: ["cut", "te snel", "probleem"]
          },
          {
            id: "cut-geen-resultaat",
            label: "Als ze geen resultaat zien",
            text: `Hmm dat is frustrerend man. Hoe lang ben je al bezig?

Vaak betekent dit dat je of te veel eet, of juist te weinig waardoor je metabolisme vertraagt.

Hou je je calorieën bij?`,
            tags: ["cut", "geen resultaat", "probleem"]
          },
          {
            id: "cut-goed",
            label: "Als ze alles op orde hebben",
            text: `Top man, klinkt alsof je precies weet wat je doet! Gewoon volhouden en je bent er zo 💪

Ik heb trouwens een community waar ik tips deel over cutten, vet verliezen en dat soort dingen. Helemaal gratis.

Zou je dat interessant vinden?`,
            tags: ["cut", "community", "goed"]
          }
        ]
      },
      doelGenoemd: {
        title: "Ze noemen een doel",
        messages: [
          {
            id: "doel-1",
            label: "Optie A",
            text: `Mooi doel man! Goed dat je weet wat je wilt 💪

Hoe pak je dat aan op dit moment?`,
            tags: ["doel", "aanpak"]
          },
          {
            id: "doel-2",
            label: "Optie B",
            text: `Top! Dat is een duidelijk doel 😊

Hoe ben je daar nu mee bezig?`,
            tags: ["doel", "bezig"]
          },
          {
            id: "doel-3",
            label: "Optie C - Specifiek",
            text: `Nice man! [DOEL] is een goed streven 💪

Heb je al een plan hoe je daar wilt komen?`,
            tags: ["doel", "plan"]
          }
        ]
      },
      gewoonBezig: {
        title: "Gewoon bezig / niks specifieks",
        messages: [
          {
            id: "bezig-1",
            label: "Optie A",
            text: `Ja chill! Maar je bent toch wel ergens mee bezig? 😊

Probeer je een beetje spieren op te bouwen of meer richting kracht?`,
            tags: ["bezig", "focus"]
          },
          {
            id: "bezig-2",
            label: "Optie B",
            text: `Oke nice! Maar waar focus je dan op als je traint?

Meer spiermassa of gewoon fit blijven? 💪`,
            tags: ["bezig", "training", "focus"]
          },
          {
            id: "bezig-3",
            label: "Optie C",
            text: `Top man! Lekker bezig blijven is ook goed 💪

Heb je wel bepaalde doelen voor jezelf of train je gewoon voor de lol?`,
            tags: ["bezig", "doelen", "motivatie"]
          }
        ]
      },
      voedingTrackt: {
        title: "Ze tracken al hun voeding",
        messages: [
          {
            id: "track-1",
            label: "Optie A - Positief",
            text: `Oh nice! Lekker man, dat doen weinig mensen 💪

Hoe lang doe je dat al? En merk je resultaat?`,
            tags: ["voeding", "tracken", "calorieën"]
          },
          {
            id: "track-2",
            label: "Optie B - Doorvragen",
            text: `Top! Goed bezig dat je het bijhoudt 😊

Zit je op een cut of bulk? Of gewoon onderhoud?`,
            tags: ["voeding", "tracken", "doel"]
          },
          {
            id: "track-3",
            label: "Optie C - Resultaat check",
            text: `Nice man! Dan ben je al verder dan de meeste 💪

Zie je ook de resultaten die je wilt of loopt het nog niet helemaal?`,
            tags: ["voeding", "tracken", "resultaat"]
          }
        ]
      },
      voedingNiet: {
        title: "Ze letten NIET op voeding",
        messages: [
          {
            id: "voeding-niet-1",
            label: "Optie A - Soft approach",
            text: `Ah oke! Dat is waar de meeste mensen tegen aan lopen eigenlijk 😅

Voeding is 80% van je resultaat. Hoe kom je er nu mee weg denk je?`,
            tags: ["voeding", "niet", "probleem"]
          },
          {
            id: "voeding-niet-2",
            label: "Optie B - Nieuwsgierig",
            text: `Hmm oke, maar je ziet toch wel resultaat of niet?

Want zonder voeding op orde is het lastig om echt progressie te maken 💪`,
            tags: ["voeding", "niet", "resultaat"]
          },
          {
            id: "voeding-niet-3",
            label: "Optie C - Reality check",
            text: `Ja snap ik, voeding is voor veel mensen het lastigste stuk 😕

Maar wist je dat je 80% van je resultaat uit je voeding komt? Training is maar een klein stukje eigenlijk.

Zou je er meer mee willen doen?`,
            tags: ["voeding", "niet", "educatie"]
          },
          {
            id: "voeding-niet-4",
            label: "Optie D - Direct hulp",
            text: `Ah dat verklaart waarschijnlijk waarom veel mensen blijven hangen 😅

Weet je wat, als je wil kan ik je even helpen uitrekenen wat je nodig hebt. Scheelt jou een hoop uitzoekwerk!

Zou je dat handig vinden?`,
            tags: ["voeding", "niet", "call", "hulp"]
          }
        ]
      },
      probleem: {
        title: "Ze noemen een probleem/struggle",
        messages: [
          {
            id: "probleem-blessure",
            label: "🤕 Blessure",
            text: `Ahh dat is echt kut man, herkenbaar ook 😕

Ik heb dit ook gehad, probeerde toen wat minder zwaar te pakken en mijn houding te verbeteren.

Hoe pak jij het aan om ervan af te komen?`,
            tags: ["probleem", "blessure", "pijn"]
          },
          {
            id: "probleem-tijd",
            label: "⏰ Geen tijd",
            text: `Ja dat ken ik man 😕

Ik had een tijdje een fulltime baan in de fabriek met wisselende tijden, toen was het ook lastig. Wat voor mij werkte was mijn workouts inkorten en de intensiteit verhogen.

Hoe pak jij het aan? Of is dat misschien ook wat voor jou?`,
            tags: ["probleem", "tijd", "druk"]
          },
          {
            id: "probleem-motivatie",
            label: "😔 Motivatie / niet consistent",
            text: `Ja herkenbaar man, dat heeft iedereen wel eens 😕

Bij mij hielp het om gewoon een vaste tijd te pakken elke week, dan hoef je niet na te denken en doe je het gewoon.

Hoe probeer jij jezelf gemotiveerd te houden?`,
            tags: ["probleem", "motivatie", "consistent"]
          },
          {
            id: "probleem-voeding",
            label: "🍔 Voeding is lastig",
            text: `Ja voeding is voor de meeste mensen het lastigste stuk 😅

Bij mij was dat ook zo, totdat ik het simpel ging houden en niet te ingewikkeld ging doen.

Waar loop je precies tegenaan? Te weinig eten of juist te veel?`,
            tags: ["probleem", "voeding", "eten"]
          },
          {
            id: "probleem-resultaat",
            label: "📉 Geen resultaat zien",
            text: `Ja dat is frustrerend man, snap ik 😕

Had ik in het begin ook, bleek dat ik gewoon niet genoeg at voor mijn doel.

Hoe lang ben je al bezig? En houd je je voeding een beetje bij?`,
            tags: ["probleem", "resultaat", "progressie"]
          }
        ]
      },
      langVerhaal: {
        title: "Ze sturen een lang verhaal",
        messages: [
          {
            id: "lang-1",
            label: "Standaard reactie",
            text: `Oké ik snap het 💪

Goed dat je [IETS POSITIEFS DAT ZE DOEN]!

Waar loop je op dit moment het meeste tegenaan?`,
            note: "Vervang [IETS POSITIEFS] met iets dat ze noemen",
            tags: ["lang", "verhaal", "samenvatten"]
          },
          {
            id: "lang-2",
            label: "Optie B - Focus",
            text: `Thanks voor het delen man! 💪

Klinkt alsof je al goed bezig bent. Wat zou je het liefste willen verbeteren op dit moment?`,
            tags: ["lang", "verhaal", "focus"]
          }
        ]
      }
    }
  },

  // ==========================================
  // SMOESJES & BEZWAREN
  // ==========================================
  smoesjes: {
    title: "Smoesjes & Bezwaren",
    description: "Omgaan met excuses",
    icon: "AlertTriangle",
    color: "#f59e0b",
    subSections: {
      geenTijd: {
        title: "Geen tijd / fulltime baan",
        messages: [
          {
            id: "tijd-1",
            label: "Optie A",
            text: `Ja snap ik man, tijd is altijd lastig 😅

Maar hoeveel tijd zou je realistisch kunnen vrijmaken per week? Ook al is het maar 2 of 3 keer een half uurtje?`,
            tags: ["tijd", "druk", "werk"]
          },
          {
            id: "tijd-2",
            label: "Optie B - Eigen ervaring",
            text: `Ja herkenbaar! Ik had ook een fulltime baan met wisselende tijden, was ook lastig in het begin 😅

Wat voor mij werkte was gewoon korte workouts van 30-45 min, 3x per week. Hoeft niet meer te zijn om resultaat te zien hoor!

Wat zou voor jou haalbaar zijn denk je?`,
            tags: ["tijd", "werk", "ervaring"]
          },
          {
            id: "tijd-3",
            label: "Optie C - Reality check",
            text: `Ja dat hoor ik vaker man! Maar eerlijk, je hebt geen 2 uur per dag nodig 😊

3x per week 45 minuten is al genoeg om serieus resultaat te boeken.

Zou dat erin passen denk je?`,
            tags: ["tijd", "realiteit", "haalbaar"]
          }
        ]
      },
      geenGeld: {
        title: "Geen geld voor sportschool",
        messages: [
          {
            id: "geld-1",
            label: "Optie A",
            text: `Ja snap ik, sportschool kan duur zijn 😅

Maar wist je dat je ook gewoon thuis kunt beginnen? Met eigen lichaamsgewicht kun je al een heel eind komen!

Heb je thuis een beetje ruimte om te trainen?`,
            tags: ["geld", "budget", "thuis"]
          },
          {
            id: "geld-2",
            label: "Optie B",
            text: `Ja begrijpelijk man! Maar je hoeft niet per se naar de gym hoor 😊

Pushups, squats, lunges... je kunt thuis al super veel doen zonder spullen.

Zou je daar interesse in hebben om zo te beginnen?`,
            tags: ["geld", "thuis", "bodyweight"]
          },
          {
            id: "geld-3",
            label: "Optie C - Eigen verhaal",
            text: `Ja dat is balen 😕

Maar eerlijk, ik ben zelf ook thuis begonnen zonder gym. Gewoon met lichaamsgewicht en een paar basic oefeningen.

Is thuis trainen een optie voor jou? Dan kan ik je misschien wat tips geven 💪`,
            tags: ["geld", "ervaring", "tips"]
          }
        ]
      },
      weetNiet: {
        title: "Weet niet waar te beginnen",
        messages: [
          {
            id: "weet-1",
            label: "Optie A",
            text: `Ja dat snap ik man, er is zoveel info online dat je door de bomen het bos niet meer ziet 😅

Wat is je doel eigenlijk? Afvallen, spieren opbouwen of gewoon fitter worden?`,
            tags: ["beginnen", "overwhelm", "doel"]
          },
          {
            id: "weet-2",
            label: "Optie B",
            text: `Ja herkenbaar! Zo voelde ik me in het begin ook, overwhelming 😅

Maar het hoeft niet ingewikkeld te zijn hoor. Wat zou jij het liefste willen bereiken?`,
            tags: ["beginnen", "simpel", "doel"]
          },
          {
            id: "weet-3",
            label: "Optie C - Hulp aanbieden",
            text: `Ja dat hoor ik vaak! Er is gewoon teveel info online, en veel ervan klopt niet eens 😅

Weet je wat, als je wil kan ik je even op weg helpen. Even kijken wat je doel is en een simpel plan maken.

Zou je dat handig vinden?`,
            tags: ["beginnen", "hulp", "call"]
          }
        ]
      },
      nietVolhouden: {
        title: "Bang dat ik het niet volhou",
        messages: [
          {
            id: "volhou-1",
            label: "Optie A",
            text: `Ja dat snap ik man, dat heeft iedereen in het begin 😊

Maar weet je wat helpt? Klein beginnen. Niet meteen 6x per week willen gaan, maar gewoon 2-3x en dat volhouden.

Heb je het al eens eerder geprobeerd?`,
            tags: ["volhouden", "consistent", "begin"]
          },
          {
            id: "volhou-2",
            label: "Optie B",
            text: `Ja herkenbaar! Maar dat hoeft geen probleem te zijn hoor 💪

De truc is om het simpel te houden en niet te veel te willen in het begin.

Wat zorgde ervoor dat je eerder stopte denk je?`,
            tags: ["volhouden", "simpel", "oorzaak"]
          },
          {
            id: "volhou-3",
            label: "Optie C - Accountability",
            text: `Ja snap ik! Daarom hebben veel mensen ook een coach of buddy nodig 😊

Iemand die je accountable houdt en helpt als het lastig wordt.

Zou zoiets voor jou helpen denk je?`,
            tags: ["volhouden", "accountability", "coach"]
          }
        ]
      },
      schaamte: {
        title: "Schaam me voor de sportschool",
        messages: [
          {
            id: "schaam-1",
            label: "Optie A",
            text: `Ja dat hoor ik vaker man, maar weet je wat? Niemand let op je daar 😊

Iedereen is met zichzelf bezig. En eerlijk, mensen hebben juist respect voor beginners die de stap zetten!

Wat houdt je precies tegen?`,
            tags: ["schaamte", "gym", "angst"]
          },
          {
            id: "schaam-2",
            label: "Optie B",
            text: `Ja snap ik, voelde ik in het begin ook 😅

Maar geloof me, niemand kijkt naar je. En anders kun je ook gewoon thuis beginnen tot je je wat zekerder voelt!

Zou dat een optie zijn?`,
            tags: ["schaamte", "thuis", "alternatief"]
          }
        ]
      },
      blessure: {
        title: "Blessure / fysieke beperking",
        messages: [
          {
            id: "blessure-1",
            label: "Standaard",
            text: `Ahh dat is balen man 😕

Maar vaak kun je wel nog trainen, alleen moet je het slim aanpakken en bepaalde oefeningen vermijden.

Wat voor blessure heb je precies? Misschien kan ik je wat tips geven 💪`,
            tags: ["blessure", "beperking", "aanpassen"]
          },
          {
            id: "blessure-2",
            label: "Optie B - Revalidatie",
            text: `Ahh kut man 😕

Heb je al fysiotherapie gehad of iets? Want vaak kun je wel trainen, maar moet je gewoon weten wat je wel en niet kunt doen.

Waar zit de blessure precies?`,
            tags: ["blessure", "fysio", "revalidatie"]
          }
        ]
      }
    }
  },

  // ==========================================
  // CALL PUSH
  // ==========================================
  callPush: {
    title: "Call Push",
    description: "Van gesprek naar booking",
    icon: "Phone",
    color: "#8b5cf6",
    subSections: {
      softIntro: {
        title: "Soft intro naar call",
        messages: [
          {
            id: "soft-1",
            label: "Optie A - Hulp aanbieden",
            text: `Nice! Als je wil kan ik je een beetje op weg helpen 😊

Ik help vaker jongens die net beginnen of vastlopen. Gewoon even kijken waar je staat en wat voor jou zou werken.

Zou je dat handig vinden? 💪`,
            tags: ["call", "soft", "hulp"]
          },
          {
            id: "soft-2",
            label: "Optie B - Direct",
            text: `Top! Weet je wat, als je wil kunnen we even kort bellen 😊

Dan kan ik je een paar vragen stellen en kijken hoe ik je het beste kan helpen. Scheelt jou een hoop uitzoekwerk!

Heb je deze week een kwartiertje?`,
            tags: ["call", "direct", "kort"]
          },
          {
            id: "soft-3",
            label: "Optie C - Waarde eerst",
            text: `Nice man! Ik heb trouwens een [PDF/video/gids] over [ONDERWERP] die je misschien kan helpen.

Zal ik die naar je sturen? Is gratis hoor 💪`,
            note: "Na PDF sturen → doorvragen → dan call aanbieden",
            tags: ["call", "waarde", "pdf"]
          }
        ]
      },
      mainPush: {
        title: "Hoofd Call Push (met tijdslots)",
        messages: [
          {
            id: "push-1",
            label: "Variant A - Afvallen focus",
            text: `Top man! Fijn dat je open staat voor hulp 💪

Laten we even bellen, dan kijk ik wat jij nodig hebt qua voeding om af te vallen én spieren te behouden. Scheelt jou het uitzoeken!

Ik kan volgende week op:
• Woensdag: 18:00 of 19:00
• Donderdag: 17:00 of 20:00
• Vrijdag: 16:00 of 18:00

Laat maar weten wat jou het beste uitkomt 😊`,
            tags: ["call", "push", "afvallen", "tijdslots"]
          },
          {
            id: "push-2",
            label: "Variant B - Spieren focus",
            text: `Nice man! Goed dat je serieus bezig wilt 💪

Laten we even bellen, dan reken ik uit wat jij nodig hebt om spieren op te bouwen. Scheelt jou het uitzoeken!

Ik kan volgende week op:
• Woensdag: 18:00 of 19:00
• Donderdag: 17:00 of 20:00
• Vrijdag: 16:00 of 18:00

Welke dag past jou het beste?`,
            tags: ["call", "push", "spieren", "tijdslots"]
          },
          {
            id: "push-3",
            label: "Variant C - Algemeen",
            text: `Top! Laten we even kort bellen dan 💪

Ik stel je een paar vragen, kijk waar je nu staat, en dan maak ik een plan voor je. Kost je niks en duurt maar 15-20 min.

Ik kan volgende week op:
• Woensdag: 18:00 of 19:00
• Donderdag: 17:00 of 20:00
• Vrijdag: 16:00 of 18:00

Wat werkt voor jou?`,
            tags: ["call", "push", "algemeen", "tijdslots"]
          },
          {
            id: "push-4",
            label: "Variant D - Kort & krachtig",
            text: `Top! Laten we bellen 😊

Ik kan:
• Wo: 18:00 / 19:00
• Do: 17:00 / 20:00
• Vr: 16:00 / 18:00

Welke past? 💪`,
            tags: ["call", "push", "kort"]
          },
          {
            id: "push-5",
            label: "Variant E - Flexibel",
            text: `Nice man! Laten we even bellen dan 💪

Wanneer zou het jou uitkomen? Ik ben redelijk flexibel, vooral 's avonds na 17:00.

Laat maar weten welke dag en tijd voor jou werkt 😊`,
            tags: ["call", "push", "flexibel"]
          }
        ]
      },
      emailVragen: {
        title: "Email vragen & bevestigen",
        messages: [
          {
            id: "email-1",
            label: "Email vragen",
            text: `Nice! Stuur even je mailadres, dan zet ik het vast via Calendly 💪`,
            tags: ["email", "calendly", "booking"]
          },
          {
            id: "email-2",
            label: "Bevestiging sturen",
            text: `Top! Ik stuur je zo de invite. Spreek je [DAG] om [TIJD]! 💪`,
            tags: ["bevestiging", "calendly", "booking"]
          },
          {
            id: "email-3",
            label: "Zonder Calendly",
            text: `Top! Dan bel ik je [DAG] om [TIJD]. Spreek je dan! 💪`,
            tags: ["bevestiging", "direct", "booking"]
          }
        ]
      },
      reminders: {
        title: "Call reminders",
        messages: [
          {
            id: "remind-1",
            label: "Dag van de call",
            text: `Heyy! Zie je vanavond om [TIJD]! 🤙`,
            tags: ["reminder", "dag", "call"]
          },
          {
            id: "remind-2",
            label: "Alternatief",
            text: `Yoo [NAAM]! Nog even checken, lukt het straks om [TIJD]? 😊`,
            tags: ["reminder", "check", "call"]
          },
          {
            id: "remind-3",
            label: "Ochtend reminder",
            text: `Goedemorgen! Even een reminder voor ons gesprek vanavond om [TIJD] 💪

Tot straks!`,
            tags: ["reminder", "ochtend", "call"]
          }
        ]
      },
      noShow: {
        title: "No-show / verzetten",
        messages: [
          {
            id: "noshow-1",
            label: "Als ze niet opnemen",
            text: `Hey [NAAM]! Ik had je net gebeld maar kreeg je niet te pakken.

Laat maar weten wanneer het beter uitkomt, dan plannen we opnieuw 😊`,
            tags: ["noshow", "gemist", "verzetten"]
          },
          {
            id: "noshow-2",
            label: "Volgende dag follow-up",
            text: `Hey [NAAM]! We hadden gisteren een call staan maar ik kon je niet bereiken.

Is alles goed? Wanneer zou je wel kunnen? 😊`,
            tags: ["noshow", "followup", "verzetten"]
          },
          {
            id: "noshow-3",
            label: "Ze willen verzetten",
            text: `Geen probleem man! Welke dag/tijd zou wel werken voor je?`,
            tags: ["verzetten", "opnieuw", "planning"]
          }
        ]
      }
    }
  },

  // ==========================================
  // CALL OBJECTIES
  // ==========================================
  callObjecties: {
    title: "Call Objecties",
    description: "Bezwaren na call push",
    icon: "AlertTriangle",
    color: "#ef4444",
    subSections: {
      isHetGratis: {
        title: '"Is het gratis?"',
        messages: [
          {
            id: "gratis-1",
            label: "Optie A - Ja bevestigen",
            text: `Ja man, het gesprek is helemaal gratis 😊

Gewoon even kijken waar je staat en wat je nodig hebt. Geen verplichtingen ofzo!

Welke dag zou kunnen?`,
            tags: ["gratis", "objectie", "call"]
          },
          {
            id: "gratis-2",
            label: "Optie B - Waarde benadrukken",
            text: `Ja hoor, kost je niks! 😊

Ik doe dit omdat ik graag mensen help. En wie weet past het en kunnen we daarna verder kijken.

Maar eerst gewoon een gratis gesprek om te kijken of ik je kan helpen 💪`,
            tags: ["gratis", "waarde", "call"]
          },
          {
            id: "gratis-3",
            label: "Optie C - Kort",
            text: `Ja gewoon gratis! Geen zorgen 😊

Welke dag werkt voor jou?`,
            tags: ["gratis", "kort", "call"]
          }
        ]
      },
      geenTijdCall: {
        title: '"Heb geen tijd deze week"',
        messages: [
          {
            id: "tijd-call-1",
            label: "Optie A - Flexibel",
            text: `Geen probleem! Wanneer zou wel kunnen?

Volgende week misschien? Ik ben redelijk flexibel 😊`,
            tags: ["tijd", "flexibel", "call"]
          },
          {
            id: "tijd-call-2",
            label: "Optie B - Specifiek",
            text: `Snap ik man! Hoe ziet volgende week eruit voor je?

Kan ook 's avonds of in het weekend hoor 😊`,
            tags: ["tijd", "avond", "weekend"]
          },
          {
            id: "tijd-call-3",
            label: "Optie C - Kort houden",
            text: `Ja is ook druk bij mij haha 😅

Maar het duurt echt maar 15-20 min. Ergens een gaatje volgende week?`,
            tags: ["tijd", "kort", "15min"]
          }
        ]
      },
      moetNadenken: {
        title: '"Moet er even over nadenken"',
        messages: [
          {
            id: "denken-1",
            label: "Optie A - Begripvol",
            text: `Ja tuurlijk, snap ik 😊

Maar waar twijfel je over? Misschien kan ik je vragen beantwoorden!`,
            tags: ["nadenken", "twijfel", "vragen"]
          },
          {
            id: "denken-2",
            label: "Optie B - Laagdrempelig",
            text: `Geen stress man! Het is maar een kort gesprekje hoor 😊

Gewoon even kijken of ik je kan helpen, geen verplichtingen.

Maar laat maar weten als je er klaar voor bent 💪`,
            tags: ["nadenken", "laagdrempelig", "call"]
          },
          {
            id: "denken-3",
            label: "Optie C - Doorvragen",
            text: `Ja is goed! Maar wat zou je willen weten?

Misschien kan ik nu al wat duidelijkheid geven 😊`,
            tags: ["nadenken", "doorvragen", "info"]
          }
        ]
      },
      watGaJeVertellen: {
        title: '"Wat ga je me dan vertellen?"',
        messages: [
          {
            id: "vertellen-1",
            label: "Optie A - Uitleg",
            text: `Ik ga even kijken waar je nu staat, wat je doel is, en dan reken ik uit wat jij nodig hebt qua voeding en training 😊

Zo weet je precies wat je moet doen in plaats van gokken. Klinkt dat goed?`,
            tags: ["uitleg", "inhoud", "call"]
          },
          {
            id: "vertellen-2",
            label: "Optie B - Kort",
            text: `Gewoon even kijken wat jij nodig hebt om je doel te bereiken 😊

Ik stel wat vragen, reken wat uit, en dan weet je precies waar je moet zitten!`,
            tags: ["uitleg", "kort", "call"]
          },
          {
            id: "vertellen-3",
            label: "Optie C - Specifiek",
            text: `Ik ga kijken naar:
• Je huidige situatie
• Je doel
• Wat je nodig hebt qua calorieën/eiwitten
• Hoe je dat het beste kunt aanpakken

Zo heb je een duidelijk plan in plaats van gokken 💪`,
            tags: ["uitleg", "specifiek", "call"]
          }
        ]
      },
      isHetSales: {
        title: '"Is dit een sales call?"',
        messages: [
          {
            id: "sales-1",
            label: "Optie A - Eerlijk",
            text: `Haha nee man, gewoon even kijken of ik je kan helpen 😊

Als het niks voor je is dan is dat ook prima. Maar de meeste jongens vinden het handig om even duidelijkheid te krijgen!`,
            tags: ["sales", "objectie", "eerlijk"]
          },
          {
            id: "sales-2",
            label: "Optie B - Waarde focus",
            text: `Nee hoor! Gewoon een gratis gesprek om te kijken waar je staat 😊

Ik vertel je wat je nodig hebt, en dan kun jij zelf beslissen of je er iets mee doet. No pressure!`,
            tags: ["sales", "waarde", "gratis"]
          },
          {
            id: "sales-3",
            label: "Optie C - Direct",
            text: `Nee man, gewoon een gesprek 😊

Ik help je even op weg, en als je daarna verder wilt kijken kan dat, maar dat is aan jou!`,
            tags: ["sales", "direct", "vrijblijvend"]
          }
        ]
      },
      nee: {
        title: "Als ze NEE zeggen",
        messages: [
          {
            id: "nee-1",
            label: "Respectvol afsluiten",
            text: `Geen probleem man! Als je ooit ergens tegenaan loopt, laat het weten 💪`,
            tags: ["nee", "afsluiten", "respect"]
          },
          {
            id: "nee-2",
            label: "Community alternatief",
            text: `Oke geen probleem! 😊

Ik heb wel een gratis community waar ik tips deel over voeding en training. Zou dat iets voor je zijn?`,
            tags: ["nee", "community", "alternatief"]
          },
          {
            id: "nee-3",
            label: "Deur open houden",
            text: `Helemaal goed man! Mocht je ooit vragen hebben, je weet me te vinden 💪`,
            tags: ["nee", "later", "contact"]
          }
        ]
      }
    }
  },

  // ==========================================
  // COMMUNITY PITCH
  // ==========================================
  communityPitch: {
    title: "Community Pitch",
    description: "WhatsApp community link",
    icon: "Users",
    color: "#25D366",
    subSections: {
      intro: {
        title: "Community introduceren",
        messages: [
          {
            id: "comm-intro-1",
            label: "Na goed gesprek",
            text: `Top man, ik zie dat je serieus bezig bent! 💪

Ik heb trouwens een gratis WhatsApp community waar ik elke week waardevolle content deel. Denk aan:

• Voedingstips & recepten
• Training tips
• PDF's over afvallen/bulken
• Motivatie & accountability

Zou je dat interessant vinden?`,
            tags: ["community", "intro", "whatsapp"]
          },
          {
            id: "comm-intro-2",
            label: "Als ze geen call willen",
            text: `Oke geen probleem met de call! 😊

Maar ik heb wel een gratis community waar ik elke week tips deel over voeding en training. Helemaal vrijblijvend.

Zou dat iets voor je zijn?`,
            tags: ["community", "alternatief", "gratis"]
          },
          {
            id: "comm-intro-3",
            label: "Kort & direct",
            text: `Ik heb trouwens een gratis WhatsApp community waar ik tips deel over [BULK/CUT/VOEDING]. 

Wil je de link? 💪`,
            tags: ["community", "kort", "link"]
          }
        ]
      },
      fullPitch: {
        title: "Volledige community pitch",
        messages: [
          {
            id: "comm-pitch-1",
            label: "Complete pitch",
            text: `Nice! Hier is de link naar de community:

[LINK]

Wat je krijgt:
✅ Wekelijkse voedingstips
✅ Gratis PDF's (calorieën berekenen, meal prep, etc.)
✅ Training tips & schema's
✅ Directe Q&A met mij
✅ Motivatie van anderen die hetzelfde doel hebben

Helemaal gratis, gewoon joinen en meelezen 💪`,
            tags: ["community", "pitch", "volledig"]
          },
          {
            id: "comm-pitch-2",
            label: "Korte pitch + link",
            text: `Top! Hier is de link:

[LINK]

Er wordt wekelijks veel gedeeld over voeding, training en mindset. Helemaal gratis!

Welkom 💪`,
            tags: ["community", "link", "kort"]
          }
        ]
      },
      afterJoin: {
        title: "Na het joinen",
        messages: [
          {
            id: "after-join-1",
            label: "Welkom bericht",
            text: `Welcome man! 🔥

Voel je vrij om vragen te stellen in de groep. Ik deel regelmatig tips en af en toe gratis PDF's.

Veel succes met je journey! 💪`,
            tags: ["community", "welkom", "join"]
          },
          {
            id: "after-join-2",
            label: "Check-in na paar dagen",
            text: `Hey [NAAM]! Alles goed?

Hoe bevalt de community? Heb je al wat nuttigs gevonden? 😊`,
            tags: ["community", "followup", "check"]
          }
        ]
      }
    }
  }
}

// Helper functie om alle messages te doorzoeken
export const searchMessages = (query) => {
  if (!query || query.length < 2) return []
  
  const results = []
  const searchTerm = query.toLowerCase()
  
  const searchInSection = (section, sectionTitle, parentTitle = null) => {
    if (section.messages) {
      section.messages.forEach(msg => {
        const matchInText = msg.text.toLowerCase().includes(searchTerm)
        const matchInLabel = msg.label?.toLowerCase().includes(searchTerm)
        const matchInTags = msg.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        
        if (matchInText || matchInLabel || matchInTags) {
          results.push({
            ...msg,
            sectionTitle: parentTitle ? `${parentTitle} → ${sectionTitle}` : sectionTitle,
            sectionColor: section.color || '#10b981'
          })
        }
      })
    }
    
    if (section.subSections) {
      Object.values(section.subSections).forEach(subSection => {
        searchInSection(subSection, subSection.title, sectionTitle)
      })
    }
  }
  
  Object.values(messagesData).forEach(section => {
    searchInSection(section, section.title)
  })
  
  return results
}

export default messagesData
