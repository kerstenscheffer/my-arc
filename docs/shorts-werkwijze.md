# YouTube-shorts als concept: werkwijze voor Gino

Kersten: "De shorts zijn kant en klaar, je hoeft ze niet te bekijken." Dus niet bekijken, knippen, beoordelen of onderzoeken. Maak geen tellingen, overzichten of storyboards. Lees geen andere code. Dit duurt ongeveer een minuut per short.

Gebruik alleen `scripts/reel-gino.mjs`. **Niet** `scripts/yt-shorts-inplannen.mjs`: die route publiceert automatisch.

## Stappen

Standaard twee per week: dinsdag en donderdag om 18:00, aansluitend op het laatste concept. Het script rekent de datums uit. Noemt Kersten geen aantal: 1 short.

1. `node scripts/reel-gino.mjs shorts` toont de open shorts met hun datum. Neem ze van boven naar beneden, tenzij hij oefeningen noemt.
2. Schrijf per short de caption met Write naar `~/Gino/yt-shorts/<id>/caption.txt`, in het format hieronder.
3. **Eén of een paar shorts:** `node scripts/reel-gino.mjs short <id> --datum <datum uit stap 1>` met Bash-timeout 600000.
   **Alle of veel shorts:** schrijf 8 captions en draai `node scripts/reel-gino.mjs reeks` met Bash-timeout 600000. Die doet de volgende 8 met caption en kiest zelf de datums. Herhaal tot `nog_open` 0 is. Een lopende run die stopt, kan later gewoon verder: klare shorts slaat hij over.

Download, upload en concept zitten in deze commando's. Ze vragen geen toestemming.

Geeft een commando een link of datum terug, dan is die short klaar: het script heeft al gecontroleerd dat het een concept is en dat de video compleet is. Kijk dus niet nog eens in Metricool na.

Een mislukte short houdt de rest niet tegen. Het script herhaalt netwerkfouten zelf, dus probeer hem niet opnieuw; noem de foutmelding.

## Caption

Letterlijk zoals hieronder, inclusief de SPLIT-alinea en de slotregel. Vul alleen de delen tussen <> in op basis van de titel:

```
Hoe Je De <oefening, netjes gespeld> correct uitvoert

Reageer "SPLIT" en ik stuur je mijn trainingsschema tool, waar we samen jouw trainingschema bouwen op jouw niveau kennis en thuis of in de gym. Omdat ik graag zoveel mogelijk mannen help in top shape komen is het helemaal gratis.

Maar hier meer over de <oefening>

<De fout die veel mannen maken bij deze oefening, één zin.>

1️⃣ <uitvoeringstip>
2️⃣ <uitvoeringstip>
3️⃣ <uitvoeringstip>
4️⃣ <uitvoeringstip>

DE VERGELIJKING

<Zo doen de meesten het>: gewicht bewegen.
<Zo doe je het, tot er geen nette herhaling meer in zit>: je <spier> laten falen.

Krachttraining draait niet om gewicht bewegen. Daarom heb ik een tool gemaakt: een paar vragen en je krijgt een schema waarin elke werkset tot falen gaat, met logboek.

Reageer "SPLIT" en ik stuur hem direct. ⚜️
```

Alleen algemene, gangbare techniek. Geen verzonnen resultaten, klantverhalen of cijfers. Je ziet de video niet, dus zeg in je bericht dat de tips op de titel zijn gebaseerd.

## Je bericht aan Kersten

Draai als laatste `node scripts/reel-gino.mjs overzicht` en zet de uitvoer letterlijk in je bericht, met de kale links: zijn scherm maakt die klikbaar. Noem daarna alleen mislukte shorts met hun foutmelding. Er gaat niets live: het zijn concepten die hij zelf goedkeurt. Zeg één keer dat de tips op de titel zijn gebaseerd.
