# Het slider-patroon van de 6-weken challenge

Hoe de schermvullende sliders op `/6weekchallenge`, `/6week-checkout`, `/16week`
en `/16-week-checkout` werken: de fotobanners, de lucide-iconen en de manier
waarop het beeld wordt bijgesneden. Gebruik dit document als opdracht wanneer
je (of een AI) een nieuwe slider in dezelfde stijl moet bouwen.

Bron: `src/pages/SixWeekChallengePage.jsx` → `MethodeSlider` en
`VoorwaardenVenster`. Die twee zijn het sjabloon; de andere pagina's zijn
kopieën.

---

## 1. De bouwstenen

Een slider bestaat uit drie lagen, van boven naar beneden:

1. **Banner** — een foto over de volle breedte waar de titel al ín staat.
2. **Tekstblok** — vier kolommen met een lucide-icoon, een bold wit woord en
   één zin eronder.
3. **Knop** — de betaal- of doe-mee-knop, zwevend onderaan.

Meer niet. Geen kaders, geen kaarten, geen tweede kleur.

---

## 2. Tokens

```js
const BG   = '#000000'   // puur zwart: de fades lopen naar #000, elke andere
                         // tint geeft een zichtbare rand rond het beeld
const GOLD = '#ffba09'   // alleen voor labels en de huidige stap, nooit vlakken
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
```

Animaties (één keer in een `<style>` op de pagina):

```css
@keyframes bladWaas  { from { opacity: 0 } to { opacity: 1 } }
@keyframes pijlerIn  { from { opacity: 0; transform: scale(1.03) } to { opacity: 1; transform: none } }
```

De slider zelf: `position: fixed; inset: 0; z-index: 300; background: BG;`
`display: flex; flex-direction: column;` met `animation: bladWaas 0.2s ease`.

---

## 3. De banner — hier gaat het meestal mis

De foto's zijn **1960 × 600** (verhouding 49:15) en dragen de titel zelf. Twee
regels die je niet mag breken:

**A. Het vak krijgt de verhouding van de foto, niet een vaste hoogte.**

```js
style={{
  position: 'relative', width: '100%', flexShrink: 0,
  aspectRatio: '49 / 15',           // NIET height: '34vh'
}}
```

Zet je er een vaste hoogte op en vul je met `backgroundSize: cover`, dan wordt
het beeld opgeblazen om dat vak te vullen en valt de titel links en rechts
buiten beeld. Op een telefoon is dat meteen dramatisch: een vak van 34vh is bij
390px breed bijna vierkant, terwijl de foto drie keer zo breed is.

**B. De fade mag nooit over de titel lopen.**

```js
// Beeld dat zelf tekst draagt: alleen de onderste 14% naar zwart.
background: `linear-gradient(180deg, rgba(0,0,0,0) 86%, ${BG} 100%)`

// Beeld zonder tekst: dan mag de kop er wél overheen.
background: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%,
             rgba(0,0,0,0.8) 72%, ${BG} 100%)`
```

De foto zelf:

```js
backgroundSize: 'cover',
backgroundPosition: 'center bottom',   // de titel staat onderin: die houden we vast
backgroundRepeat: 'no-repeat',
animation: 'pijlerIn 0.35s ease',
key: foto.src                          // key forceert de animatie bij elke slide
```

**Telefoonversie (optioneel).** Naast elke foto mag een staande versie staan met
`-mobile` achter de naam (`voeding-slide-mobile.jpg`, 1080 × 1080). De hook
`useFoto(pad, isMobile)` probeert die te laden en valt terug op de brede versie
als hij er niet is; staat hij er wel, dan wordt de verhouding `1 / 1`.

---

## 4. Het tekstblok

```js
{
  flex: 1, minHeight: 0, overflowY: 'auto',
  padding: isMobile ? '0 1.25rem 6rem' : '0 2rem 6.5rem',   // ruimte voor de knop
}
```

Binnenin een kolom van `maxWidth: 1100`, met `marginTop: isMobile ? '2.5rem' : '4.5rem'`
als de titel in het beeld staat (anders `-18 / -28`, zodat de kop over de foto
schuift).

Wat je weglaat als het beeld de titel al draagt (`titelInBeeld`):

- het label `PIJLER 2 VAN 3` (goud, 0,6–0,7rem, `letter-spacing: 0.16em`)
- de `<h1>` met het volgnummer in goud
- de introzin

Anders staat alles er twee keer.

---

## 5. Het icoon-raster

Vier lucide-iconen naast elkaar, op telefoon twee kolommen:

```js
display: 'grid',
gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${p.doen.length}, 1fr)`,
gap: isMobile ? '1.75rem 1rem' : '3.5rem',
maxWidth: isMobile ? '100%' : 1250,
```

Per cel, gecentreerd, in deze volgorde:

| Onderdeel | Telefoon | Desktop |
|---|---|---|
| `<Icon strokeWidth={2.6} color="#fff" />` | 32px | 60px |
| Woord (`fontWeight: 900`, `letter-spacing: -0.02em`) | 0,95rem | 1,45rem |
| Zin (`fontWeight: 700`, `rgba(255,255,255,0.55)`) | 0,82rem | 1,05rem |

Regels: één woord als kop (geen zin), één korte zin eronder (max ~5 woorden),
altijd wit — geen gekleurde iconen. Niets onder 0,7rem.

---

## 6. Navigatie

| Handeling | Gedrag |
|---|---|
| Klik in het venster | volgende slide; op de laatste: sluiten |
| Klik op een knop | wordt genegeerd door de slider (`e.target.closest('button')`) |
| Swipe | drempel 50px, links = verder, rechts = terug |
| `→` of `Enter` | volgende; op de laatste: sluiten |
| `←` | terug |
| `Escape` | sluiten |

Geen knoppenbalk, geen bolletjes: het scherm zelf is de knop. De enige echte
knoppen zijn de sluit-X rechtsboven (40 × 40, `rgba(0,0,0,0.5)`, rand
`rgba(255,255,255,0.2)`, `border-radius: 12`, `backdrop-filter: blur(6px)`, met
`top: calc(env(safe-area-inset-top, 0px) + 12px)`) en de betaalknop onderin
(witte pil, `border-radius: 999`, `bottom: calc(env(safe-area-inset-bottom, 0px) + 1.25rem)`,
`position: absolute`, `z-index: 5`).

---

## 7. De data

```js
const PIJLERS = [
  {
    foto: '/methode/voeding-slide.jpg',
    beeldVult: true,        // foto in eigen verhouding, geen fade over de tekst
    titelInBeeld: true,     // titel staat op de foto → niet herhalen in de pagina
    kop: 'Weet wat je eet',
    zin: 'Vaste structuur in de app, zonder rekenen. Etentjes bouwen we in.',
    doen: [
      { Icon: ClipboardList, kop: 'Structuur',     tekst: 'Plan staat klaar. Nul denkwerk.' },
      { Icon: Utensils,      kop: 'Keuze',         tekst: '500 gerechten in jouw plan.' },
      { Icon: PartyPopper,   kop: 'Flexibiliteit', tekst: 'Etentjes leren we mee omgaan.' },
      { Icon: ShieldCheck,   kop: 'Zekerheid',     tekst: 'Weten dat het klopt.' },
    ],
  },
]
```

`kop` en `zin` blijven staan ook als ze niet getoond worden: ze zijn de bron
voor de PDF-export en voor het beeld dat je laat maken.

---

## 8. Wat de fotograaf of ontwerper moet weten

- Formaat **1960 × 600** (49:15), of **1080 × 1080** voor de `-mobile`-versie.
- De titel staat **onderin** en in hoofdletters, links uitgelijnd met een marge
  van ongeveer 4% van de breedte.
- Houd de onderste **14%** vrij van belangrijke beeldinhoud: daar loopt de fade
  naar zwart.
- De rechterbovenhoek blijft vrij: daar staat de sluitknop.
- Op de mobiele versie wordt niets bijgesneden, maar het vak is vierkant — een
  brede titel past daar niet, zet die dan over twee regels.

---

## 9. Checklist voor een nieuwe slider

1. Vak met `aspectRatio`, nooit met een vaste hoogte + `cover`.
2. Fade over maximaal de onderste 14% als de foto tekst draagt.
3. `backgroundPosition: center bottom` bij beeld met tekst.
4. `key` op de fotolaag, anders animeert hij niet bij het wisselen.
5. Titel niet twee keer (in het beeld én eronder).
6. Vier iconen, wit, `strokeWidth 2.6`, één woord + één zin.
7. Onderaan ruimte reserveren voor de knop (`padding-bottom: 6rem`).
8. Klik, swipe, pijltjes, Enter en Escape allemaal aansluiten.
9. Niets kleiner dan 0,7rem, niets in grijs onder 45% wit.
10. Laatste slide sluit het venster in plaats van te blijven hangen.

---

## 10. Kant-en-klare opdracht voor een AI

> Bouw een schermvullende slider in React (inline styles, geen CSS-bestanden)
> volgens dit patroon: zwarte achtergrond `#000000`, DM Sans, bovenaan een
> fotobanner in verhouding 49:15 met `backgroundSize: cover` en
> `backgroundPosition: center bottom`, met alleen over de onderste 14% een
> `linear-gradient` naar zwart. De titel staat in de foto, dus herhaal hem niet
> in de pagina. Daaronder een raster van vier lucide-iconen (wit,
> `strokeWidth 2.6`, 60px op desktop en 32px op telefoon, twee kolommen op
> telefoon), elk met een bold wit woord van 1,45rem en één zin van 1,05rem op
> `rgba(255,255,255,0.55)`. Onderin een witte pil-knop met
> `border-radius: 999` die de safe-area respecteert, en rechtsboven een
> sluitknop van 40 × 40 met `backdrop-filter: blur(6px)`. Navigeren gaat met een
> klik in het venster, swipe (drempel 50px), pijltjestoetsen, Enter en Escape;
> op de laatste slide sluit het venster. Gebruik geen kaders, geen kaarten en
> geen tweede accentkleur; goud `#ffba09` alleen voor een klein label. De
> inhoud komt uit een array met per slide: `foto`, `kop`, `zin` en vier items
> met `Icon`, `kop` en `tekst`.
