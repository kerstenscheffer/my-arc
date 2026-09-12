# Opdracht: `ai_meals.timing` opschonen

Korte briefing voor wie deze klus oppakt. Doel: bij elke maaltijd staan de
juiste momenten, zodat het moment-filter in de app klopt.

## Waar het om gaat

- Tabel `public.ai_meals`, kolom **`timing`** — een `text[]` met de momenten
  waarop een maaltijd past. 482 rijen.
- **Niet** `meal_type`: dat veld bevat `solid` / `liquid` / `mixed` en is bij
  434 van de 482 leeg. Het klinkt als het moment, maar dat is het niet.

## Huidige stand (12 sep 2026)

| waarde | aantal |
|---|---|
| breakfast | 201 |
| lunch | 192 |
| dinner | 168 |
| snack | 163 |
| post_workout | 53 |
| pre_workout | 32 |
| brunch | 15 |
| dessert | 10 |
| before_bed | 3 |
| evening / evening_snack / diet / cheat_meal | elk 1 |

19 maaltijden hebben helemaal geen timing. Geen enkele heeft er vier of meer.

## Toegestane waarden na de klus

Alleen deze zes, want dit zijn de momenten die de app kent:

`breakfast`, `lunch`, `dinner`, `snack`, `pre_workout`, `post_workout`

De rest omzetten:

- `brunch` → `breakfast` + `lunch`
- `dessert`, `before_bed`, `evening`, `evening_snack` → `snack`
- `diet`, `cheat_meal` → weghalen; dat zijn eigenschappen van een maaltijd,
  geen moment. Hoort thuis in `labels`.

Elke maaltijd houdt **minstens één** moment over, inclusief de 19 die er nu
geen hebben.

## Waar het nu misgaat

`Griekse Yoghurt met Pindakaas en Banaan` staat als `pre_workout`: 709 kcal,
35,5 g vet. Van de 32 pre-workout maaltijden hebben er 15 meer dan 15 g vet
en is het gemiddelde 14,2 g. Vet en vezels vertragen de maaglediging, dus dat
eet niemand vlak voor een training.

## Regels per moment

Beoordeel per rij op **naam + `ingredients_list` + de macro's**, niet op de
naam alleen.

- **pre_workout** — koolhydraatrijk en licht verteerbaar. Richtlijn:
  koolhydraten ≥ 30 g, vet ≤ 12 g, vezels ≤ 6 g, ≤ 500 kcal, eiwit 15–35 g.
  Geen noten, pindakaas, gefrituurd of romig vet.
- **post_workout** — eiwit ≥ 25 g én koolhydraten ≥ 30 g, vet ≤ 15 g.
- **breakfast** — ontbijtproducten (havermout, eieren, yoghurt, brood,
  smoothie). Een pastagerecht is geen ontbijt.
- **lunch** / **dinner** — volwaardige maaltijden. Lunch mag lichter en
  koud, diner is warm/samengesteld. Veel gerechten passen bij allebei;
  dat mag.
- **snack** — ≤ ~350 kcal en op zichzelf te eten. Ook desserts en wat je
  voor het slapen neemt.

Een maaltijd mag meerdere momenten hebben, maar wees streng: alles bij alles
zetten maakt het filter weer waardeloos.

## Werkwijze

1. **Backup eerst:**
   ```sql
   create table ai_meals_timing_backup_20260912 as
   select id, name, timing from ai_meals;
   ```
2. Werk in batches (bijvoorbeeld 50 rijen) en schrijf per rij een
   `update ai_meals set timing = array[...]::text[] where id = '...';`
   Idempotent: de hele set nog eens draaien moet hetzelfde resultaat geven.
3. Laat deze velden met rust: `name`, `calories`, `protein`, `carbs`, `fat`,
   `fiber`, `meal_type`, `needs_review` (77 rijen staan daarop; dat is een
   ander probleem — de opgegeven kcal loopt daar uit de pas met de
   ingrediënten).

## Controleren

```sql
-- 1. Alleen toegestane waarden over?
select distinct unnest(timing) from ai_meals
except select unnest(array['breakfast','lunch','dinner','snack','pre_workout','post_workout']);

-- 2. Iedereen heeft een moment?
select count(*) from ai_meals where timing is null or array_length(timing,1) = 0;

-- 3. Geen zware pre-workouts meer?
select name, calories, fat, fiber from ai_meals
where 'pre_workout' = any(timing) and (fat > 12 or fiber > 6 or calories > 500)
order by fat desc;

-- 4. Post-workout haalt eiwit en koolhydraten?
select name, protein, carbs from ai_meals
where 'post_workout' = any(timing) and (protein < 25 or carbs < 30);
```

Query 1, 3 en 4 horen leeg te zijn, query 2 nul.

## Waarom het uitmaakt

Dit veld wordt op twee plekken gelezen:

- Het wisselvenster in de app filtert er de suggesties mee
  (`AIAlternativesModal`, keuzelijst "moment").
- De plan-generator zoekt maaltijden per moment op met
  `.contains('timing', [timeCategory])` (`AIMealPlanService`).

Staat er onzin in, dan krijgt de klant die onzin voorgeschoteld én
ingepland.
