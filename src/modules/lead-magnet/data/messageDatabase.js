// src/modules/lead-magnet/data/messageDatabase.js
// COMPLETE MESSAGE DATABASE - 120+ berichten
// Alle DM berichten georganiseerd per fase

export const MESSAGE_DATABASE = {
  openers: {
    dikker: [
      { id: 'o1', label: 'Follow-back', text: 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Waar ligt jouw interesse meer, afvallen of juist fitter worden?' },
      { id: 'o2', label: 'Profiel observatie', text: 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je ook bezig bent met fitter worden. Ben je al lang bezig?' },
      { id: 'o3', label: 'Compliment A', text: 'Heyy [naam]! Ik zag dat je ook flink aan het sporten bent, lekker bezig! 💪 Train je ergens voor op dit moment?' },
      { id: 'o4', label: 'Compliment B', text: 'Heyy [naam]! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Waar werk je naartoe qua doel?' },
      { id: 'o5', label: 'Compliment C', text: 'Heyy [naam]! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Wat is je grootste uitdaging op dit moment?' },
      { id: 'o6', label: 'Fun fact hook', text: 'Heyy [naam]! Ik zag dat je ook bezig bent met je fitter worden. Snel weetje voor jou: Wist je dat het grootste deel van vetverlies in de keuken gebeurt? En dat je deze week al vet kan gaan verliezen door een paar kleine veranderingen in je eten. Wil je weten welke?' },
      { id: 'o7', label: 'Direct value', text: 'Heyy [naam]! Ik kwam je insta tegen en zag dat je ook traint, lekker bezig man. 💪 Ik (en de meeste mannen) laten jaarlijks wel 5-10 kg gratis spiergroei liggen door een fout in hun eten. Ik stuur je graag welke fout dat is.' },
      { id: 'o8', label: 'Story reply', text: 'Lekker bezig man! 🔥 Waar train je voor?' }
    ],
    dunner: [
      { id: 'o9', label: 'Follow-back', text: 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Waar ligt jouw interesse meer, sterker worden of juist meer massa opbouwen?' },
      { id: 'o10', label: 'Profiel observatie', text: 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je ook aan het trainen bent. Ben je al lang aan het trainen?' },
      { id: 'o11', label: 'Compliment A', text: 'Heyy [naam]! Ik zag dat je ook flink aan het trainen was, lekker bezig! 💪 Waar werk je naartoe, droger worden of spiermassa opbouwen?' },
      { id: 'o12', label: 'Compliment B', text: 'Heyy [naam]! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Train je al lang serieus?' },
      { id: 'o13', label: 'Compliment C', text: 'Heyy [naam]! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Ben je ook ergens naartoe aan het trainen? Een bepaald aantal kilo ofzo?' },
      { id: 'o14', label: 'Fun fact hook', text: 'Heyy [naam]! Ik zag dat je ook aan het trainen bent. Snel weetje voor jou: De meeste mannen die moeite hebben met spieropbouw eten simpelweg te weinig calorieën per dag. En dit is super makkelijk op te lossen met een paar kleine aanpassingen. Wil je weten hoe?' },
      { id: 'o15', label: 'Direct value', text: 'Heyy [naam]! Ik kwam je insta tegen en zag dat je ook traint, lekker bezig man. 💪 De meeste lichtere jongens laten jaarlijks wel 3-5 kg gratis spiergroei liggen omdat ze zo\'n 500-1000 kcal te weinig eten per dag. Wil je weten hoe je dit makkelijk kunt oplossen?' },
      { id: 'o16', label: 'Story reply', text: 'Lekker bezig man! 💪 Ben je ook aan het bulken op dit moment?' }
    ],
    sporter: [
      { id: 'o17', label: 'Follow-back', text: 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Ben je vooral bezig met voetbal of train je ook in de gym?' },
      { id: 'o18', label: 'Profiel observatie', text: 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je voetbalt. Hoe lang speel je al en op welk niveau?' },
      { id: 'o19', label: 'Compliment A', text: 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Doe je ook aan krachttraining naast je voetbal?' },
      { id: 'o20', label: 'Compliment B', text: 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Wat is je positie?' },
      { id: 'o21', label: 'Compliment C', text: 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Let je ook op je voeding of eet je gewoon wat je wilt?' },
      { id: 'o22', label: 'Sport specifiek', text: 'Heyy [naam]! Mooi om te zien dat je serieus bezig bent met je sport man. Doe je naast voetbal ook aan explosieve kracht training in de gym?' },
      { id: 'o23', label: 'Performance hook', text: 'Heyy [naam]! Ik zag dat je voetbalt. Snel weetje voor jou: De juiste voeding en krachttraining kunnen je prestaties op het veld enorm verbeteren. Dit doen topatleten anders dan de gemiddelde voetballer. Wil je weten wat precies?' },
      { id: 'o24', label: 'Story reply', text: 'Gave skills man! ⚽ Train je ook in de gym voor explosiviteit?' }
    ],
    neutral: [
      { id: 'o25', label: 'Follow-back algemeen', text: 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Wat trok je aandacht, de trainingen of juist de voeding content?' },
      { id: 'o26', label: 'Interesse check', text: 'Heyy [naam]! Leuk profiel man. Ben je naast [activiteit op profiel] ook bezig met fitness of sporten?' },
      { id: 'o27', label: 'Breed compliment', text: 'Heyy [naam]! Gave feed man. Ben je zelf ook bezig met sporten of fitter worden?' },
      { id: 'o28', label: 'Curiosity hook', text: 'Heyy [naam]! Snel weetje voor jou: 90% van de mannen haalt hun fitness doelen niet door één simpele fout in hun aanpak. En dit is super makkelijk te voorkomen als je weet welke fout dit is. Wil je weten welke?' },
      { id: 'o29', label: 'Value first', text: 'Heyy [naam]! Ik help mannen met hun fitness doelen. Snelle vraag: ben je zelf ook bezig met trainen of gezonde voeding?' },
      { id: 'o30', label: 'Fun fact algemeen', text: 'Heyy [naam]! Interessante feed man. Random vraag voor je: als je zou moeten kiezen, waar ligt je interesse meer: training of voeding?' }
    ]
  },
  
  qualify: {
    afvallen: {
      trigger: '🟡',
      triggerLabel: 'MEDIUM',
      messages: [
        { id: 'q1', label: 'Huidige gewicht', text: 'Ahh duidelijk man, top dat je ermee bezig bent. Heb je ook een streefgewicht?' },
        { id: 'q2', label: 'Hoeveel kilo', text: 'Nice dat je de stap zet man! Hoeveel kilo wil je kwijtraken?' },
        { id: 'q3', label: 'Hoe lang bezig', text: 'Nice dat je ermee bezig bent! Hoe lang ben je hier al mee bezig?' },
        { id: 'q4', label: 'Wat geprobeerd', text: 'Snap ik helemaal man. Wat heb je tot nu toe al geprobeerd om af te vallen?' },
        { id: 'q5', label: 'Grootste struggle', text: 'Herkenbaar man. Wat denk je dat je nu mist om dichter bij je doel te komen?' },
        { id: 'q6', label: 'Voeding check', text: 'Top dat je ermee aan de slag bent! Let je ook een beetje op hoeveel je eet of doe je dat nog meer op gevoel?' },
        { id: 'q7', label: 'Sport routine', text: 'Lekker bezig! Hoe vaak sport je nu ongeveer per week?' }
      ]
    },
    spieren: {
      trigger: '🟡',
      triggerLabel: 'MEDIUM',
      messages: [
        { id: 'q8', label: 'Huidige gewicht', text: 'Ahh nice man, bulken is een goeie keuze 💪 Heb je ook een streefgewicht voor ogen?' },
        { id: 'q9', label: 'Hoeveel kilo', text: 'Lekker bezig! Hoeveel kilo wil je er precies bij hebben?' },
        { id: 'q10', label: 'Training duur', text: 'Top dat je ermee bezig bent! Hoe lang train je al serieus?' },
        { id: 'q11', label: 'Schema', text: 'Nice man! Welk trainingsschema volg je op dit moment?' },
        { id: 'q12', label: 'Struggle', text: 'Snap ik helemaal. Wat denk je dat je nu mist om dichter bij je doel te komen?' },
        { id: 'q13', label: 'Calorieën', text: 'Lekker bezig! Let je ook een beetje op hoeveel calorieën je eet of doe je dat nog meer op gevoel?' },
        { id: 'q14', label: 'Eiwit check', text: 'Top man! Heb je enig idee hoeveel gram eiwit je ongeveer binnenkrijgt per dag?' }
      ]
    },
    sport: {
      trigger: '🟡',
      triggerLabel: 'MEDIUM',
      messages: [
        { id: 'q15', label: 'Niveau check', text: 'Ahh vet man! Op welk niveau speel je op dit moment?' },
        { id: 'q16', label: 'Krachttraining?', text: 'Nice! Doe je naast voetbal ook nog aan krachttraining in de gym?' },
        { id: 'q17', label: 'Voeding check', text: 'Top man! Let je ook een beetje op je voeding of eet je gewoon wat je wilt?' },
        { id: 'q18', label: 'Doelen', text: 'Gave dedication man! Waar werk je naartoe met voetbal?' },
        { id: 'q19', label: 'Performance hook', text: 'Mooi man! Wist je trouwens dat de juiste krachttraining en voeding je snelheid en explosiviteit flink kunnen verbeteren?' }
      ]
    },
    vast: {
      trigger: '🟢',
      triggerLabel: 'HOOG - PAIN!',
      messages: [
        { id: 'q20', label: 'Empathie', text: 'Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan?' },
        { id: 'q21', label: 'Wat doe je', text: 'Snap ik helemaal. Wat doe je nu eigenlijk qua training en voeding?' },
        { id: 'q22', label: 'Hoe lang vast', text: 'Frustrerend man! Hoe lang zit je al ongeveer op hetzelfde gewicht?' },
        { id: 'q23', label: 'Voeding check', text: 'Herkenbaar. Let je een beetje op hoeveel je eet of doe je dat meer op gevoel?' },
        { id: 'q24', label: 'Pain versterken', text: 'Ja dat hoor ik vaker man. Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over 6 maanden staat?' }
      ]
    },
    gevoel: {
      trigger: '🟡→🟢',
      triggerLabel: 'MEDIUM → HOOG',
      messages: [
        { id: 'q25', label: 'Werkt het?', text: 'Ahh oké snap ik! En werkt dat voor je? Zie je de resultaten die je wilt zien?' },
        { id: 'q26', label: 'Resultaten', text: 'Snap ik helemaal. Kom je wel vooruit of blijft het een beetje hetzelfde?' },
        { id: 'q27', label: 'Tracking value', text: 'Ja dat doen de meeste mensen man. Maar weet je wat? Wat je niet meet, kun je ook niet echt verbeteren. Herkenbaar?' },
        { id: 'q28', label: 'Gok vs zekerheid', text: 'Ahh oké! Maar zou je niet liever precies weten wat je moet doen in plaats van een beetje gokken?' }
      ]
    },
    trackt: {
      trigger: '🟡',
      triggerLabel: 'MEDIUM',
      messages: [
        { id: 'q29', label: 'Compliment', text: 'Ahh nice man! Top dat je dat doet, de meeste mensen doen dat niet 💪 En hoe gaat het?' },
        { id: 'q30', label: 'Resultaat?', text: 'Respect man! Zie je de resultaten die je wilt zien of loopt het ergens een beetje vast?' },
        { id: 'q31', label: 'Waar hulp', text: 'Lekker bezig! Wat denk je dat je nu mist om dichter bij je doel te komen?' },
        { id: 'q32', label: 'Optimalisatie', text: 'Top dat je zo bezig bent man! Weet je zeker dat je op de juiste hoeveelheid calorieën zit voor je doel?' }
      ]
    },
    painDeepen: {
      trigger: '🟢',
      triggerLabel: 'HOOG → CALL PUSH',
      messages: [
        { id: 'q33', label: 'Hoe lang geen resultaat', text: 'Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan zonder vooruitgang?' },
        { id: 'q34', label: 'Wat geprobeerd', text: 'Frustrerend! Wat heb je allemaal al geprobeerd om het te fixen?' },
        { id: 'q35', label: 'Frustratie schaal', text: 'Snap ik helemaal man. Op een schaal van 1-10, hoe frustrerend is dit eigenlijk voor je?' },
        { id: 'q36', label: 'Impact leven', text: 'Ja dat snap ik man. Heeft dit ook een beetje impact op hoe je je voelt over jezelf?' },
        { id: 'q37', label: 'Toekomst scenario', text: 'Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over een jaar staat? Nog steeds hetzelfde?' }
      ]
    }
  },
  
  callPush: {
    soft: [
      { id: 'cp1', label: 'Hulp aanbieden', text: 'Duidelijk, dit is precies waar ik mensen mee help man. Ik kan wel even kort meekijken op een call om te kijken wat jij nodig hebt om door te gaan naar je doel. Zou je dat handig vinden?' },
      { id: 'cp2', label: 'Als je wilt', text: 'Weet je wat, als je wilt kan ik je even op weg helpen. Ik help vaker jongens die een beetje vastlopen met dit soort dingen. Gewoon 15 minuutjes bellen, zou dat helpen denk je?' },
      { id: 'cp3', label: 'Quick call', text: 'Snap ik helemaal man. Ik kan deze week wel even 15 minuutjes op een call springen, dan wil ik je wel uitleggen wat je moet doen om vooruit te komen. Zou je dat handig vinden?' },
      { id: 'cp4', label: 'Value first', text: 'Duidelijk, ik zie denk ik waar je vast loopt. Misschien handig om deze week kort te bellen, dan leg ik je even uit wat je nodig hebt om naar je doel te komen. Vind je dat handig?' }
    ],
    direct: [
      { id: 'cp5', label: 'Laten we bellen', text: 'Weet je wat, laten we gewoon even bellen man. Dan kan ik je situatie beter begrijpen en precies kijken of en hoe ik je kan helpen. Wanneer zou je kunnen deze week?' },
      { id: 'cp6', label: 'Wanneer tijd', text: 'Dit is precies waar ik goed in ben man. Wanneer heb je deze week ongeveer 15 minuutjes? Dan bel ik je even.' },
      { id: 'cp7', label: 'Dit is wat ik doe', text: 'Oké luister, dit is letterlijk wat ik de hele dag doe man. Laten we bellen, dan leg ik je precies uit hoe we dit kunnen oplossen. Vandaag of morgen?' },
      { id: 'cp8', label: 'Situatie herkennen', text: 'Ja zie je, dit is precies waar veel jongens tegenaan lopen. Laten we even bellen, dan help ik je op weg. Welke dag zou kunnen?' }
    ],
    logical: [
      { id: 'cp9', label: '15min vs typen', text: 'Ik kan je hier uren over typen man, maar een call van 15 minuten is echt veel effectiever. Dan kan ik doorvragen en je direct op maat helpen met jouw situatie. Ben je daar voor open?' },
      { id: 'cp10', label: 'Sneller resultaat', text: 'Kijk, je kunt zelf blijven uitzoeken en hopen dat het werkt. Of je belt me even en dan weet je binnen 15 minuten precies wat je moet doen. Wat lijkt jou slimmer?' },
      { id: 'cp11', label: 'Persoonlijk vs generic', text: 'Via chat kan ik je alleen maar generic tips geven man. In een gesprek kan ik echt ingaan op jouw specifieke situatie. 15 minuutjes bellen?' }
    ],
    urgency: [
      { id: 'cp12', label: 'Beperkte plekken', text: 'Ik heb deze week nog maar een paar plekken vrij man. Als je het echt wilt fixen, laten we dan nu een moment prikken. Welke dag zou kunnen?' },
      { id: 'cp13', label: 'Agenda vol', text: 'Mijn agenda zit bijna vol deze week man. Ik kan je er nog tussen proppen op [dag] om [tijd]. Zou dat kunnen voor jou?' },
      { id: 'cp14', label: 'Langer wachten', text: 'Snap ik man. Maar wees eerlijk: hoe langer je wacht, hoe langer je zonder resultaat blijft zitten. Laten we het gewoon nu regelen?' }
    ]
  },
  
  bezwaren: {
    nadenken: [
      { id: 'b1', label: 'Waar specifiek', text: 'Snap ik helemaal man! Kun je mij vertellen waar je over na moet denken? Dan neem ik dat mee en zorg ik dat ik dat verwerk in mijn volgende dm-gesprek.' },
      { id: 'b2', label: 'Wat houdt tegen', text: 'Dat is goed man, neem rustig de tijd. Mag ik vragen waar je aan twijfelt? Dan neem ik dat mee en zorg ik dat ik dat verwerk in mijn volgende dm-gesprek.' },
      { id: 'b3', label: 'Gratis reminder', text: 'Ahh oké snap ik. Bedenk wel: Je liep tegen [probleem x] en [probleem y] aan. In de call wilde ik je uitleggen hoe je dit kunt fixen en hoe ik je hierbij zou helpen. Na het gesprek loop je weg met een plan of met de begeleiding die je naar je doel brengt. Klinkt dat fair?' },
      { id: 'b4', label: 'Respectvolle exit', text: 'Ahh oké man, snap ik. Dan laat ik het hierbij. Mocht je ooit wel bereid zijn 15 minuten te investeren om erachter te komen waar je tegenaan loopt en hoe je dit kunt fixen, kun je mij een berichtje sturen. Ik kan je hier goed bij helpen en doe het graag.' },
      { id: 'b5', label: 'Soft reminder', text: 'Helemaal goed man. Als je alsnog interesse hebt, laat het weten. De 15 minuten zijn gratis en je bent nergens toe verplicht. Gewoon kijken of ik je kan helpen.' }
    ],
    geenTijd: [
      { id: 'b6', label: '15min = Netflix', text: 'Snap ik man, iedereen is druk. Maar even eerlijk: 15 minuten is letterlijk minder dan één Netflix aflevering. Kun je dat echt niet ergens vinden?' },
      { id: 'b7', label: 'Wanneer wel', text: 'Ahh oké geen probleem man! Wanneer zou volgende week dan wel kunnen voor je? Dan plannen we hem gewoon wat later in.' },
      { id: 'b8', label: 'Prioriteit check', text: 'Snap ik helemaal. Maar is "geen tijd" niet eigenlijk "geen prioriteit"? Even eerlijk: wil je resultaat of blijf je liever bij hoe het nu gaat?' },
      { id: 'b9', label: 'Feedback loop', text: 'Oké snap ik man. Mag ik vragen: Is het echt geen tijd, of voel je je niet klaar voor een gesprek? Dan neem ik dat mee voor een volgende keer.' },
      { id: 'b10', label: 'Exit', text: 'Ahh oké man, begrijpelijk. Dan laat ik het hierbij. Als je ooit wel 15 minuten vindt om erachter te komen hoe je je doel bereikt, laat het maar weten.' }
    ],
    zelfProberen: [
      { id: 'b11', label: 'Respect + hoe lang', text: 'Respect dat je het zelf wilt proberen man. Mag ik vragen: hoe lang doe je dat nu al? En hoe gaat het tot nu toe?' },
      { id: 'b12', label: 'Tijd vs resultaat', text: 'Fair enough man! Maar even eerlijk: als het over 3 maanden nog steeds niet werkt, heb je wel 3 maanden verspild. Waarom niet eerst even 15 minuten investeren om te weten of je de juiste richting opgaat?' },
      { id: 'b13', label: 'Shortcut', text: 'Snap ik helemaal. Maar waarom trial & error doen als je in 15 minuten de shortcut kunt krijgen? Je bespaart jezelf echt maanden frustratie man.' },
      { id: 'b14', label: 'Feedback loop', text: 'Oké snap ik man. Kun je mij wel vertellen wat je precies zelf gaat proberen? Dan kan ik je alvast zeggen of je de juiste richting opgaat.' },
      { id: 'b15', label: 'Exit', text: 'Helemaal goed man, doe je ding. Mocht je er over een paar weken achter komen dat het niet werkt, laat het maar weten. Dan help ik je alsnog.' }
    ],
    teDuur: [
      { id: 'b16', label: 'Wat kost blijven', text: 'Snap ik man. Maar even eerlijk: wat kost het je eigenlijk om nog een jaar zonder resultaat te blijven? Geen vooruitgang, geen zelfvertrouwen? Dat is toch ook een prijs?' },
      { id: 'b17', label: 'Investering frame', text: 'Fair point man. Maar dit is wel een investering in je lichaam en gezondheid voor de rest van je leven. Hoeveel geef je per maand uit aan uitgaan of eten bestellen? Dit is gewoon een andere keuze.' },
      { id: 'b18', label: 'Geld isoleren', text: 'Oké snap ik helemaal. Maar stel dat geld geen issue was - zou je het dan wel doen? Want dan is geld niet het echte bezwaar.' },
      { id: 'b19', label: 'Waardevergelijking', text: 'Begrijpelijk man. Maar wat is je lichaam en gezondheid je eigenlijk waard? Dit is geen uitgave, dit is een investering die je je hele leven bij blijft.' },
      { id: 'b20', label: 'Feedback + exit', text: 'Ahh oké man, snap ik. Mag ik vragen wat voor jou wel een redelijke investering zou zijn in je gezondheid? Dan neem ik dat mee voor de toekomst.' }
    ],
    later: [
      { id: 'b21', label: 'Wanneer later', text: 'Snap ik man! Maar wanneer is "later" precies voor jou? Over een maand? Drie maanden? Eerlijk: is later niet gewoon een nette manier om nooit te zeggen?' },
      { id: 'b22', label: 'Perfect moment', text: 'Oké man. Maar wees eerlijk: komt er ooit een perfect moment? Of is het altijd wel ergens druk?' },
      { id: 'b23', label: 'Later = nooit', text: 'Respect man. Maar ik ga eerlijk zijn: "later" wordt in 90% van de gevallen gewoon nooit. Over een jaar wil je dan nog steeds hetzelfde zeggen? Of wil je dan echt resultaat zien?' },
      { id: 'b24', label: 'Momentum verlies', text: 'Snap ik helemaal. Bedenk wel: je hebt nu momentum en motivatie. Over een maand is dat waarschijnlijk weg en begin je weer vanaf nul. Weet je dat zeker?' },
      { id: 'b25', label: 'Exit', text: 'Ahh oké man, begrijpelijk. Dan laat ik het hierbij. Als "later" ooit "nu" wordt, laat het maar weten. Dan help ik je alsnog graag.' }
    ],
    viaChat: [
      { id: 'b26', label: 'Waarom call beter', text: 'Snap ik helemaal man! Maar eerlijk gezegd kan ik je via chat niet zo goed helpen. In een gesprek kan ik doorvragen, precies horen wat er speelt, en je echt op maat advies geven. Dat lukt via tekst gewoon niet goed.' },
      { id: 'b27', label: 'Tijd efficiency', text: 'Ja dat zou kunnen man, maar dan wordt het zo\'n lange lap tekst heen en weer. In 15 minuten bellen krijg je echt veel meer waarde dan 20 berichten sturen. Trust me.' },
      { id: 'b28', label: 'Persoonlijk vs generic', text: 'Via chat kan ik je alleen maar generic tips geven man. In een gesprek kan ik echt ingaan op jouw specifieke situatie en doorvragen waar nodig. Dat maakt het verschil.' },
      { id: 'b29', label: 'Complexity', text: 'Snap ik, maar wat je tegenaan loopt is te complex voor chat man. Ik moet kunnen doorvragen om te begrijpen waar het precies mis gaat. 15 minuten bellen is echt de moeite waard.' },
      { id: 'b30', label: 'Exit', text: 'Ahh oké man, snap ik. Dan laat ik het hierbij. Mocht je ooit wel 15 minuten willen investeren voor een echt op maat advies, laat het maar weten.' }
    ],
    salesPitch: [
      { id: 'b31', label: 'Transparant', text: 'Eerlijk: na de call kan ik je misschien iets aanbieden als ik denk dat ik je kan helpen. Maar de call zelf is gewoon gratis en je bent nergens toe verplicht. We kijken gewoon eerst of het past.' },
      { id: 'b32', label: 'Waarde eerst', text: 'Nee man, het is echt gewoon om te kijken of ik je kan helpen. Als het niks voor je is, prima. Als ik denk dat ik je kan helpen, vertel ik je hoe. No pressure.' },
      { id: 'b33', label: 'Feedback loop', text: 'Oké snap ik man. Mag ik vragen wat je precies verwacht van de call? Dan kan ik je nu al zeggen of het matcht met wat ik doe.' },
      { id: 'b34', label: 'Respectvol', text: 'Fair enough man. Ik push je nergens in. De meeste jongens vinden het gewoon handig om duidelijkheid te krijgen, maar als je dat niet wilt is dat ook prima.' }
    ]
  },
  
  followUp: [
    { id: 'f1', label: 'Had je gezien', text: 'Heyy [naam], had je mijn bericht gezien? 🙂', phase: 'dag1-2' },
    { id: 'f2', label: 'Benieuwd', text: 'Heyy [naam]! Ik was benieuwd of je mijn bericht nog had gelezen?', phase: 'dag1-2' },
    { id: 'f3', label: 'Reminder + waarde', text: 'Heyy [naam], weet niet of je mijn berichtje had gezien, maar hier is een snelle tip voor je: De meeste mannen eten te weinig eiwitten voor hun doel. Zit jij op minimaal 2 gram per kg lichaamsgewicht?', phase: 'dag3-5' },
    { id: 'f4', label: 'Andere vraag', text: 'Heyy [naam]! Nog even dit: Veel mannen trainen hard maar zien weinig resultaat omdat ze hun calorieën niet tracken. Ken je dat?', phase: 'dag3-5' },
    { id: 'f5', label: 'Mocht gemist', text: 'Heyy [naam], mocht je het gemist hebben - ik had je een vraag gestuurd. Laat even weten als je tijd hebt!', phase: 'dag3-5' },
    { id: 'f6', label: 'Andere hoek', text: 'Heyy [naam], andere vraag voor je: Loop jij soms ook tegen een plateau aan met je training? Veel mannen in jouw situatie hebben dat namelijk.', phase: 'dag7-14' },
    { id: 'f7', label: 'Social proof', text: 'Heyy [naam], toevallig: Ik hielp laatst iemand met exact dezelfde situatie als jou. Hij ging van 70 naar 80kg lean in 4 maanden tijd. Benieuwd hoe?', phase: 'dag7-14' },
    { id: 'f8', label: 'Case study', text: 'Heyy [naam]! Ik werk met mannen die serieus willen bouwen aan hun lichaam. Eentje kreeg laatst 6kg spiermassa erbij in 12 weken. Zou dat wat voor jou zijn?', phase: 'dag7-14' },
    { id: 'f9', label: 'Laatste soft', text: 'Heyy [naam], ik snap dat je druk bent, helemaal geen probleem. Mocht je ooit serieus willen kijken naar je fitness, dan weet je me te vinden!', phase: 'dag21+' },
    { id: 'f10', label: 'Value drop', text: 'Heyy [naam], laatste tip van mij: Focus op progressieve overload en zorg voor een calorie surplus. Dat zijn de basics die 90% van de mannen gewoon mist. Succes! 💪', phase: 'dag21+' },
    { id: 'f11', label: 'Final goodbye', text: 'Heyy [naam]! Dit is mijn laatste berichtje. Ik wens je veel succes met je fitness journey man. Als je ooit besluit dat je er serieus mee aan de slag wilt, je weet me te vinden. ✌️', phase: 'dag21+' }
  ],
  
  waarde: [
    { id: 'w1', label: 'Eiwit tip', text: 'Trouwens, snelle tip voor je: De meeste mannen eten te weinig eiwitten. Zit jij op minimaal 2 gram per kg lichaamsgewicht? Dat is echt de basis voor goede spiergroei.', type: 'tip' },
    { id: 'w2', label: 'TDEE tip', text: 'Wist je dat je TDEE (dagelijkse caloriebehoefte) bepaalt of je aankomt of afvalt? Niet hoeveel je traint. Ken je die van jou?', type: 'tip' },
    { id: 'w3', label: 'Slaap tip', text: 'Fun fact man: Slaap is net zo belangrijk als training voor je gains. 7-9 uur per nacht = optimale spiergroei en herstel.', type: 'tip' },
    { id: 'w4', label: 'Progressive overload', text: 'Grootste fout die ik zie: Mannen willen te snel te zwaar trainen. Progressive overload (beetje meer gewicht per week) werkt echt beter dan ego lifting.', type: 'tip' },
    { id: 'w5', label: 'Consistency', text: 'De waarheid: De meeste transformaties falen niet door slechte workouts, maar door gebrek aan consistentie. 80% opdagen is belangrijker dan het perfecte schema hebben.', type: 'tip' },
    { id: 'w6', label: 'Tracking tip', text: 'Pro tip: Track je workouts man. Serieus. Wat je niet meet, kun je ook niet echt verbeteren. Een simpel spreadsheetje is al genoeg.', type: 'tip' },
    { id: 'w7', label: 'Hydration', text: 'Snelle tip: De meeste mannen drinken te weinig water. 3-4 liter per dag is het minimum voor optimale prestaties en herstel.', type: 'tip' },
    { id: 'w8', label: 'Pre-workout timing', text: 'Wist je dat je 1-2 uur voor je training koolhydraten moet eten? Geeft je veel meer energie tijdens je workout.', type: 'tip' },
    { id: 'w9', label: '80% keuken', text: 'Wist je dat 80% van je resultaat in de keuken wordt bepaald? Niet in de gym. Je kunt echt niet outtrainen wat je slecht eet.', type: 'fact' },
    { id: 'w10', label: 'Te weinig eten', text: 'Snelle reality check: Als je niet groeit, eet je te weinig. Punt. De meeste "hardgainers" zijn gewoon "undereaters".', type: 'fact' },
    { id: 'w11', label: 'Slaap = gains', text: 'Crazy fact: Je spieren groeien niet in de gym, maar tijdens je slaap. Te weinig slapen = gains op tafel laten liggen letterlijk.', type: 'fact' },
    { id: 'w12', label: 'Compound ROI', text: 'Wist je dat compound oefeningen (squat, deadlift, bench) meer ROI geven dan isolation? Je traint gewoon meerdere spiergroepen tegelijk.', type: 'fact' },
    { id: 'w13', label: 'Protein timing', text: 'Fun fact: Het maakt niet uit wanneer je eiwitten eet. Totale dagelijkse inname is veel belangrijker dan timing.', type: 'fact' },
    { id: 'w14', label: 'Cardio gains', text: 'Wist je dat te veel cardio je spiergroei kan remmen? 2-3x per week 20 minuten is genoeg als je aan het bulken bent.', type: 'fact' }
  ],
  
  callAdmin: {
    bevestiging: [
      { id: 'ca1', label: 'Calendly link', text: 'Top man! Als je hem hier even kunt inplannen dan komt hij in jouw agenda en die van mij: [CALENDLY LINK]' },
      { id: 'ca2', label: 'Mail reminder', text: 'Perfect man! Als je mij even je mail kunt geven, dan stuur ik je een automatische reminder. 💪' },
      { id: 'ca3', label: 'Directe tijd', text: 'Nice! Dan zet ik je in voor [DAG] om [TIJD]. Als je mij even je mail geeft, stuur ik je een reminder.' },
      { id: 'ca4', label: 'Instagram call', text: 'Top man! Check je DM\'s [DAG] om [TIJD], dan stuur ik een belverzoek via Instagram. Zorg dat je even rustig kunt praten!' },
      { id: 'ca5', label: 'Verwachting setting', text: 'Perfect! Zet het in je agenda voor [DAG] om [TIJD]. Zorg dat je 15 minuten hebt en ergens rustig kunt zitten. Tot dan! 💪' }
    ],
    reminders: [
      { id: 'ca6', label: 'Dag van call', text: 'Heyy [naam]! Ik kijk ernaar uit om vanmiddag om [TIJD] je situatie te bespreken. Zie je dan! (Laat even weten of het je gaat lukken 💪)' },
      { id: 'ca7', label: 'Ochtend reminder', text: 'Heyy [naam]! Reminder dat we vanmiddag om [TIJD] bellen. Tot zo! 🤙' },
      { id: 'ca8', label: '1 uur voor', text: 'Heyy [naam]! Ik zag dat je het bericht wel had gelezen, maar niet had gereageerd. Kun je mij een uur van tevoren laten weten of het gaat lukken? Anders moet ik hem helaas afzeggen! 🤙' },
      { id: 'ca9', label: '30 min voor', text: 'Heyy [naam]! Over 30 minuten bellen we. Ben je er klaar voor?' },
      { id: 'ca10', label: 'Laatste check', text: 'Heyy [naam], ik heb niks gehoord. Ik ga ervan uit dat het niet doorgaat en zet hem af. Als je hem nog wilt doen, laat het snel even weten!' }
    ],
    noShow: [
      { id: 'ca11', label: 'Gemist + curiosity', text: 'Heyy [naam], ik zie dat je de call had gemist. Is alles goed? Ik had 2 enorm goede oplossingen bedacht voor jouw probleem die ik je graag zou meegeven. Laat maar weten of je de call nog wilt verplaatsen. Anders succes verder!' },
      { id: 'ca12', label: 'Gemist + waarde', text: 'Heyy [naam]! Je hebt de call gemist. Ik had voor jou uitgewerkt wat je precies moet doen om [doel] te bereiken. Wil je hem nog verzetten? Laat het maar weten, anders laat ik het hierbij.' },
      { id: 'ca13', label: 'Geen Calendly', text: 'Heyy [naam], ik zie dat je de call nog niet had ingepland via de link. Heb je nog steeds interesse? Zo ja, plan hem snel in. Zo niet, laat het even weten dan stop ik met reminders.' },
      { id: 'ca14', label: 'Laatste kans', text: 'Heyy [naam], dit is de tweede keer dat je de call mist. Ik snap dat het druk kan zijn. Als je alsnog wilt, laat het weten. Anders laat ik het hierbij en wens ik je succes!' },
      { id: 'ca15', label: 'Clean closure', text: 'Heyy [naam], ik ga ervan uit dat je geen tijd hebt of geen interesse meer. Helemaal prima man. Als je ooit toch hulp wilt, je weet me te vinden. Succes! 💪' }
    ],
    reschedule: [
      { id: 'ca16', label: 'Client vraagt', text: 'Geen probleem man! Wanneer zou het dan wel kunnen voor je?' },
      { id: 'ca17', label: 'Flexibel', text: 'Kan gebeuren man. Ik heb nog plek op [dag] om [tijd] of [dag] om [tijd]. Welke past beter?' },
      { id: 'ca18', label: 'Laatste kans', text: 'Oké snap ik. Dit is wel de laatste keer dat ik hem kan verzetten man. Wanneer weet je 100% zeker dat je tijd hebt?' },
      { id: 'ca19', label: 'Commitment check', text: 'Geen probleem. Maar even voor mij: ben je echt ready om dit aan te pakken? Of moet je nog even wachten? Wil je tijd niet verspillen.' }
    ],
    longSilence: [
      { id: 'ca20', label: 'Geboekt lang geleden', text: 'Heyy [naam]! We hadden een call staan voor [dag] om [tijd]. Klopt dat nog? Laat even weten!' },
      { id: 'ca21', label: 'Check interesse', text: 'Heyy [naam], we hadden een call gepland maar ik heb al een tijdje niks gehoord. Ben je er nog klaar voor? Laat het maar weten, anders haal ik je van de lijst.' },
      { id: 'ca22', label: 'Reconfirm + exit', text: 'Heyy [naam]! Call staat nog voor [dag]. Als het niet meer past, helemaal geen probleem. Laat het even weten dan stop ik met reminders.' }
    ]
  }
}
