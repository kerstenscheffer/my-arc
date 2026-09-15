# MY ARC modal-stijl

> Referentie-stijl, afgeleid van de oefening-log-modal en de task-modal.
> Staat ook in de tabel `style_prompts` (slug `myarc-modal`), zodat je hem in
> de issue-widget kunt aanvinken. Zeg je "upgrade de stijl van X volgens de
> geselecteerde prompt", dan geldt alles hieronder.

## Kern

Zwart vlak, wit accent, alles naast elkaar. Eén handeling springt eruit (de
witte knop), de rest is stil. Geen gradients, geen gekleurde kaders per
functie, geen emoji.

- Ondergrond `#0a0a0a`, lijnen `rgba(255,255,255,0.08)`, zachte lijn `rgba(255,255,255,0.05)`.
- Kleur betekent iets: rood = verwijderen, groen = afgerond, goud = herhaling.
  Gebruik het nooit als versiering.
- Nederlandse tekst, gewone zinnen, geen kapitalen als schreeuw, geen em-dash.

## Bouwstenen

Hergebruik `src/modules/productivity/components/ui.jsx` (+ `uiTokens.js`):
`Venster`, `VensterKop`, `VensterVoet`, `Keuzevak`, `Kopje`, `Stat`, `Punt`,
`Pil`, `Chip`, `Knop`. Bouw niets na wat daar al staat.

## Venster

- Portal over de pagina, achtergrond `rgba(0,0,0,0.82)` met `blur(4px)`.
- Mobiel plakt hij onderaan (`16px 16px 0 0`, max 92vh), desktop staat hij
  midden (radius 16, max 85vh, breedte 380–520 naar inhoud).
- Rand `1px rgba(255,255,255,0.08)`, geen schaduwrand in een accentkleur.

## Kop

- Titel 0,95–1,05rem, `fontWeight: 900`, `letterSpacing: -0.025em`.
- Optionele subregel 0,66rem, `rgba(255,255,255,0.4)`.
- Sluitknop rechts: 30×30, radius 9, `rgba(255,255,255,0.05)` met rand.

## Onderwerp en samenvatting

- Het belangrijkste veld (naam, titel, label) staat groot en zonder kader:
  1,15rem mobiel / 1,3rem desktop, weight 900, transparante achtergrond.
- Daaronder één regel met de stand van zaken: dik getal + klein woord,
  gescheiden door een `·`. Voorbeeld: `3 stappen · 30 min · Hoog`.

## Keuzevakken

Twee of drie naast elkaar, nooit onder elkaar als ze naast elkaar passen:

- Icoonbadge 28×28, radius 8, `rgba(255,255,255,0.05)`.
- Label 0,52rem, uppercase, `letterSpacing: 0.09em`, `rgba(255,255,255,0.35)`.
- Waarde 0,82rem, weight 800, wit. Chevron rechts, `rgba(255,255,255,0.3)`.
- Vak: `rgba(255,255,255,0.04)`, rand 0.08, radius 10.

## Chips en pillen

- Chip (keuze uit een rijtje, bv. duur): hoogte 30, radius 999. Actief is
  **wit** met zwarte tekst; inactief `rgba(255,255,255,0.05)` met rand 0.1.
- Pil (paneel openen of schakelaar): zelfde maat, icoon 12px ervoor. Actief:
  achtergrond 0.12, rand 0.35, witte tekst. Staat er inhoud achter, dan een
  stipje van 6px achteraan.
- Schakelaar tussen twee of vier standen: één wit blokje dat schuift
  (`transition: left 0.2s`), nooit gekleurde onderstrepingen.

## Lijsten

Rijen, geen kaartjes in kaartjes: scheidingslijn `rgba(255,255,255,0.04)`,
nummer of label links in 0,6rem grijs, tekst 0,8rem weight 600, actie-icoon
rechts in `rgba(255,255,255,0.25)`.

## Voet

- Knoppen minimaal 44 hoog, radius 10, `fontWeight: 900`.
- `primair` = wit vlak met zwarte tekst (precies één per venster).
- `stil` = `rgba(255,255,255,0.04)` met rand 0.08.
- `gevaar` = rood 0.1 met rand 0.3, `goed` = groen 0.14 met rand 0.4.
- Icoonknoppen zijn 44 breed, zodat de rij één hoogte houdt.

## Wat je weglaat

- Velden die je zelden gebruikt: achter een pil, één paneel tegelijk open.
- Collapse-balken met "Bewerk instellingen": overbodig als de pillen er zijn.
- Emoji in selects, kapitalen in hints, radii van 3–6px, dubbele kaders,
  tekst kleiner dan 0,55rem.
