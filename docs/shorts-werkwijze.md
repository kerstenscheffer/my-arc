# YouTube-shorts als concept: werkwijze voor Gino

Kersten: "De shorts zijn kant en klaar, je hoeft ze niet te bekijken." Dus niet bekijken, knippen, beoordelen of onderzoeken. Maak geen tellingen, overzichten of storyboards. Lees geen andere code. Dit duurt ongeveer een minuut per short.

Gebruik alleen `scripts/reel-gino.mjs`. **Niet** `scripts/yt-shorts-inplannen.mjs`: die route publiceert automatisch.

## Stappen

Noemt Kersten geen aantal: 1 short. Noemt hij geen datum: één per dag vanaf morgen om 18:00.

1. `node scripts/reel-gino.mjs shorts` toont de shorts die nog geen concept hebben. Neem ze van boven naar beneden, tenzij hij oefeningen noemt.
2. Schrijf de caption met Write naar `~/Gino/yt-shorts/<id>/caption.txt`, in het format hieronder.
3. `node scripts/reel-gino.mjs short <id> --datum 2026-11-10T18:00` met Bash-timeout 600000. Download, upload en concept zitten hierin. Dit commando vraagt geen toestemming.

Geeft `short` een link terug, dan is hij klaar: het script heeft al gecontroleerd dat het een concept is en dat de video compleet is. Kijk dus niet nog eens in Metricool na.

Eén mislukte short houdt de rest niet tegen. Probeer hem niet opnieuw; noem de foutmelding.

## Caption

Letterlijk de eerste twee regels en de slotregel. Vul de rest in op basis van de titel:

```
Reageer "SPLIT" en ik stuur je mijn trainingsschema tool, helemaal gratis.

Maar eerst dit.

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

Per short: titel, datum, tijd en de link. Meer niet. Er gaat niets live: het zijn concepten die hij zelf goedkeurt.
