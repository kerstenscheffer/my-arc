# Coaching-band: wanneer stuur je bij?

De regels waarop de gewichtsgrafiek in Coach Insight oordeelt. Dit document is
de bron; de code volgt het (`src/modules/weight-tracker/utils/coachingBand.js`),
niet andersom. Wijzigt de afspraak, wijzig dan eerst dit bestand.

## 1. Waar het oordeel over gaat

Over de **trend**: het gemiddelde van de wegingen in de laatste 7 dagen. Nooit
over een losse dag. Twee kilo verschil tussen twee ochtenden is normaal (water,
zout, glycogeen, darminhoud) en zegt niets over vet of spier.

Een week telt alleen mee als er **minstens 5 van de 7 dagen** gewogen is.
Minder is geen oordeel, maar een gesprek over wegen.

## 2. Waar de band vandaan komt

Uit de lopende fase (`client_phases`), niet uit een eindgewicht:

- `doel` → cut, build, recomp of behoud
- `week_doel_kg` → het afgesproken tempo in kilo's per week
- `start_gewicht` + `started_on` → het nulpunt van de band

De grenzen zijn een marge om dat tempo:

| | |
|---|---|
| te langzaam onder | de helft van het afgesproken tempo, min 0,1 kg |
| te snel boven | 1,75 keer het afgesproken tempo, plus 0,1 kg |

Bij een build van +0,40 kg/week is de band dus ongeveer **+0,10 tot +0,80 kg per
week**. Die 0,1 kg speling is er omdat ook een 7-daags gemiddelde nog ruis
bevat; zonder die marge wordt een rustig tempo een band waar niemand in past.

**Zelf instellen.** Wil je bij deze klant scherper sturen, of juist bewust
sneller dan de standaard toelaat, vul dan `tempo_min_kg` en `tempo_max_kg` in op
de fase (de velden "Tempo minstens/hoogstens" in het fase-formulier). Die winnen
van de berekende marge én van de veiligheidsrem hieronder — wie ze invult weet
wat hij doet, en dan hoort de app dat niet stilletjes terug te draaien. Leeg
laten = de app rekent het zelf uit.

**Veiligheidsrem bij een cut:** nooit sneller dan 1% van het lichaamsgewicht per
week, en 0,75% bij iemand die lean is (< 12% vet) of ouder dan 45. Die rem gaat
boven het afgesproken tempo: spreek je 1,2 kg per week af op 100 kg, dan legt de
band de grens alsnog op 1,0.

Een eindgewicht (`doel_gewicht`) stuurt niets. Op de weegschaal zie je niet of
+8 kg spier of vet is; alleen het tempo zegt dat. Het staat als horizon in de
grafiek en verder nergens.

## 3. Tempo of stand?

Twee verschillende vragen, en ze kunnen tegengesteld antwoorden:

- **Tempo** — hoeveel schoof de trend deze week op ten opzichte van vorige week?
  Dat is waar je op bijstuurt: te hard gegaan betekent minder eten.
- **Stand** — waar ligt de trend ten opzichte van de band? Dat zegt of de
  afspraak nog klopt.

Loopt iemand in week 1 een kilo uit, dan ligt zijn trend daarna wekenlang boven
de band terwijl hij intussen keurig op tempo zit. Dan is er niets te minderen;
hooguit schuif je de lijn bij. Het oordeel in de app gaat daarom over het tempo,
met de stand als regel eronder ("staat 0,9 kg boven de plan-lijn").

## 4. Wanneer grijp je in

> **Twee weken op rij buiten de band, met genoeg metingen. Dan pas.**

- **Eén week buiten de band** → aankijken. Dat is ruis, een weekend, een reis.
- **Twee weken dezelfde kant op** → bijsturen.
- **Terug in de band** → teller op nul.
- **Een week met te weinig metingen** telt niet mee als tweede week, maar zet de
  teller ook niet terug. Slecht wegen wist geen probleem uit.
- **De eerste week van een fase** geeft nooit een oordeel: de band is daar nog
  vrijwel een streep, dus elke afwijking van een ons valt erbuiten.

Voorbeeld: week 37 komt uit op +0,9 kg en week 38 ook, terwijl er +0,4 is
afgesproken. Dat zijn twee volle weken boven de band → bijsturen.

## 5. Wat je doet als je bijstuurt

**Te snel bij een cut** (gewicht zakt harder dan de band)
1. 150-250 kcal per dag erbij. Dit kost anders spiermassa.
2. Bij lean of ouder: eerder ingrijpen, spierbehoud weegt zwaarder.
3. Controleer de eiwitinname (richtlijn 2 gram per kg streefgewicht).

**Te langzaam bij een cut**
1. Eerst de trouw: logt hij alles, klopt de gerapporteerde intake, is er iets in
   de context (reis, ziekte, minder bewegen)?
2. Trouw slecht → geen calorie-aanpassing, stuur op gedrag.
3. Trouw goed → 100-200 kcal eraf **óf** meer stappen. Eén van de twee, niet
   allebei tegelijk: anders weet je over twee weken niet wat er werkte.

**Te snel bij een build** → 100-200 kcal eraf, of meer stappen. Wat er boven het
tempo bijkomt is vooral vet.

**Te langzaam bij een build** → eerst kijken of hij zijn calorieën haalt; zo ja,
150-250 kcal erbij.

**Recomp en behoud** → niet op de weegschaal sturen. Een strook van ±0,4% om het
startgewicht, en beoordelen op kracht, omvang en foto's.

## 6. Randgevallen

- **Sprong van meer dan 1,5 kg** in de trend week-op-week: eerst context vragen
  (zout, koolhydraten, reis, slaap, alcohol, cyclus). Verander niets op zo'n
  sprong alleen.
- **Nieuwe klant**: de eerste opgegeven weging wijkt vaak af van de
  werkelijkheid. Wijkt het opgegeven startgewicht meer dan 2 kg af van de eerste
  betrouwbare weektrend, dan herijkt de band op die trend.
- **Doeldatum wordt niet gehaald terwijl de trend netjes in de band ligt**: kies
  bewust — tempo omhoog binnen de band, of de datum opschuiven. Laat het niet
  onbesproken.

## 7. Van oordeel naar handeling

De melding onder de grafiek heeft een knop: **Macro's bijstellen · −150 kcal**.
Die opent het doelen-paneel met een voorstel — het tekort van bijvoorbeeld −600
naar −750 — en pas als je op *Tekort aanpassen* drukt verandert er iets. De
macro's zelf herbereken je daarna met de knop in dat paneel. Nergens gebeurt
iets automatisch: een wijziging die niemand heeft gezien staat wel op het bord
van de klant.

Bij het starten van een fase rekent het formulier het bijbehorende tekort voor:
een kilo lichaamsvet is ruwweg 7700 kcal, dus een kilo per week is 1100 kcal per
dag. Bij −0,5 kg/week stelt hij −550 voor. Verander je het tempo, dan schuift
dat voorstel mee — tenzij je het tekort zelf al hebt aangeraakt.

## 8. Waar dit in de app staat

| Wat | Waar |
|---|---|
| De rekenregels | `src/modules/weight-tracker/utils/coachingBand.js` |
| De grafiek met band, kleur en oordeel | `src/modules/coach-command-center/components/insight/GewichtBandGrafiek.jsx` |
| De cijferbalk (trend, tempo, op plan) | `src/modules/weight-tracker/components/WeightStatsGrid.jsx` |
| De fases zelf | `client_phases`, beheerd in `FasePaneel.jsx` |

De klant ziet op zijn tracking-pagina dezelfde trend en hetzelfde tempo, maar
geen band, geen oordeel en geen kcal-advies.
