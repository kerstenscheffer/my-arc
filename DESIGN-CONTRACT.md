# DESIGN CONTRACT — MY ARC (klant-app + coachhub)

> Dit is de wet voor alle UI in dit project. Elke pagina, component en refactor
> moet hieraan voldoen. Referentie: de Workout-pagina van de klant-app.
> Bij twijfel: kijk hoe de Workout-pagina het doet.

## 1. Design tokens

Alle kleuren, spacing en radii komen uit deze tokens. Nergens losse hex-codes
of willekeurige pixel-waardes in componenten.

```css
:root {
  /* Oppervlakken */
  --bg: #000000;              /* pagina-achtergrond, puur zwart */
  --surface: #141414;         /* kaarten — één niveau, geen kaart-in-kaart */
  --surface-hover: #1e1e1e;

  /* Tekst — exact 3 niveaus */
  --text-primary: #ffffff;    /* titels, waarden */
  --text-secondary: #9ca3af;  /* subtitels, body */
  --text-muted: #6b7280;      /* empty states, timestamps, stat-labels */

  /* Accent — geel is schaars en betekent altijd iets */
  --accent: #ffd700;
  --on-accent: #000000;       /* tekst óp geel is altijd zwart */

  /* Semantisch (spaarzaam gebruiken) */
  /* Groen (--success) betekent uitsluitend succes/behaald/afgerond.
     Nooit als accent, decoratie of merk-kleur. */
  --success: #22c55e;
  --danger: #ef4444;

  /* Vorm */
  --radius-card: 16px;
  --radius-btn: 12px;
  --radius-pill: 999px;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: var(--accent);

  /* Spacing-schaal: alleen 4, 8, 12, 16, 24, 32 px */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --space-page: 16px;         /* horizontale pagina-padding (mobiel) */
  --space-section: 32px;      /* verticale ruimte tussen secties */
  --space-card: 16px;         /* padding binnen kaarten */
}
```

## 2. Typografie — 3 vaste rollen

```css
.eyebrow {                    /* sectielabels: "OP DE GOEDE WEG", "GESCHIEDENIS" */
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.title {                      /* paginatitels en kaart-titels */
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
}

.body {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Stat-patroon: dik wit getal + klein grijs caps-label */
.stat-value { font-weight: 800; color: var(--text-primary); }
.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
```

Sectiekoppen zijn sentence case, bold, wit ("Jouw week planning").
Nooit meer dan 3 tekstgroottes op één scherm.

## 3. Componentpatronen

**Kaart (standaard):**
```css
.card {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: var(--space-card);
  border: 1px solid var(--border-subtle);
}
```

**Highlight-kaart** (max één per scherm): standaardkaart + gele accent-rand
(outline of dikke linker-rand), opbouw: eyebrow → titel → subtitel → 1 actie.

**Accordion** voor secundaire content (geschiedenis, details): dichte balk met
eyebrow + chevron. Standaard ingeklapt.

**Primaire knop:** gele achtergrond, zwarte bold tekst, radius 12px,
min-hoogte 48px. Eén primaire knop per scherm.

**Secundaire knop:** transparant, gele outline of gele tekst.

**Empty state:** gedempte tekst (--text-muted) die zegt wat je kunt doen +
de actie erbij. Nooit een leeg vlak, nooit alleen "Geen data".

## 4. De 8 wetten

1. **Geel = betekenis.** Alleen voor: actieve staat, progressie, eyebrows,
   primaire actie. Nooit decoratief. Max ~10% van het scherm.
2. **Eén surface-niveau.** Zwart + één kaartkleur. Geen geneste kaarten,
   geen afwisselende grijstinten.
3. **Highlight-kaart:** belangrijke info krijgt het highlight-patroon,
   maximaal één per scherm.
4. **Sectie-patroon:** bold witte kop, content eronder, 32px tot de volgende
   sectie. Geen decoratieve dividers.
5. **Inklapbaar wat secundair is.** Het scherm toont alleen wat nú relevant is.
6. **Empty states zijn uitnodigingen.**
7. **Elke pagina beantwoordt één vraag.** Definieer die vraag; alles wat hem
   niet dient wordt kleiner, ingeklapt of verwijderd.
8. **Functioneel minimalisme.** Geen icoon, badge of vak zonder functie.
   Bij twijfel: weglaten.

## 5. Responsive (coachhub draait op mobiel én desktop)

Eén systeem, geen apart desktop-design:

- Mobile-first bouwen; baseline 390px breed.
- Desktop: content in een gecentreerde container, `max-width: 1100px`.
  Nooit full-width tekst over een 27-inch scherm.
- Vanaf `min-width: 768px` mogen kaart-grids 2–3 kolommen worden
  (`display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`).
  De kaarten zelf veranderen niet — alleen de layout eromheen.
- `--space-page` mag op desktop naar 24–32px.
- Tabellen/lijsten met veel kolommen: op mobiel omvormen naar kaarten of
  de belangrijkste 2–3 kolommen tonen; nooit horizontaal laten scrollen
  als primaire interactie.
- Touch targets (44px+) gelden overal, ook op desktop.

## 6. Werkwijze per pagina

1. Benoem de éne vraag die de pagina beantwoordt.
2. Inventariseer alle elementen; markeer wat die vraag niet dient →
   verwijderen of inklappen.
3. Herbouw met de tokens en patronen hierboven. Geen enkele nieuwe kleur,
   radius of spacing buiten het contract.
4. Verifieer op 390px én op desktop (1280px+).
5. Rapporteer per pagina: wat verwijderd, wat ingeklapt, wat gerestyled.
