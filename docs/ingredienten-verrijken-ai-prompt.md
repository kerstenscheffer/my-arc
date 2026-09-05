# Prompt: vezels en micronutriënten invullen voor de canonieke ingrediënten

Deze prompt geef je aan een AI met zoekmogelijkheid. Hij is geschreven op de
werkelijke staat van de database op 5 september 2026:

- `ai_ingredients` bevat 37.545 rijen, waarvan **347 met `source = 'coach'`** —
  dat is de canonieke set. De rest komt uit Open Food Facts (37.184) en
  FatSecret (14) en blijft buiten schot.
- Van die 347 heeft **geen enkele** micronutriënten en staat natrium overal
  op nul. Bij 151 staat ook vezels op nul.
- Van die 347 worden er **220 daadwerkelijk in maaltijden gebruikt**; die
  gaan voor. (Er zijn 231 gebruikte ingrediënten in totaal; de overige 11
  komen uit de import.)

---

## De prompt

> Je vult voedingswaarden aan voor een coachingsapp. Werk nauwkeurig; deze
> getallen bepalen straks de dagtotalen van echte klanten.
>
> **Wat je krijgt**
>
> Een lijst ingrediënten, elk met: `id`, `name`, `category` en de al bekende
> waarden per 100 gram (`calories_per_100g`, `protein_per_100g`,
> `carbs_per_100g`, `fat_per_100g`, `fiber_per_100g`, `sodium_per_100g`).
>
> **Wat je oplevert**
>
> Per ingrediënt één JSON-object:
>
> ```json
> {
>   "id": "<uuid, ongewijzigd overnemen>",
>   "name": "<naam, ter controle>",
>   "fiber_per_100g": 2.4,
>   "sodium_per_100g": 55,
>   "vitamins_minerals": { "calcium_mg": 120, "iron_mg": 0.4 },
>   "bron": "NEVO 2023 / USDA FDC 173410",
>   "zekerheid": "hoog",
>   "opmerking": "waarde voor rauw product"
> }
> ```
>
> **Eenheden en sleutels — houd je hier exact aan**
>
> Alles per 100 gram eetbaar product. `fiber_per_100g` en `sodium_per_100g`
> zijn losse velden: vezels in gram, natrium in **milligram** (niet zout, en
> niet gram).
>
> In `vitamins_minerals` gebruik je uitsluitend deze sleutels; de eenheid zit
> in de naam:
>
> ```
> calcium_mg   iron_mg      magnesium_mg  phosphorus_mg  potassium_mg
> zinc_mg      iodine_ug    selenium_ug
> vitamin_a_ug   vitamin_b1_mg  vitamin_b2_mg  vitamin_b6_mg
> vitamin_b9_ug  vitamin_b12_ug vitamin_c_mg   vitamin_d_ug   vitamin_e_mg
> ```
>
> Verzin geen nieuwe sleutels. Ken je een voedingsstof niet, laat de sleutel
> dan wég.
>
> **De belangrijkste regel: nul is geen synoniem voor onbekend**
>
> Schrijf alleen `0` als het product die stof echt niet bevat — olijfolie
> heeft geen vezels, melk heeft geen vezels, water heeft geen calorieën uit
> eiwit. Weet je het niet, laat het veld dan weg. Een nul die "onbekend"
> betekent leest in de app als een tekort, en daar worden verkeerde
> beslissingen op genomen.
>
> Precies dat is wat er nu misgaat: er staan nullen bij haver, bloemkoolrijst
> en diepvriesfruit, terwijl die alle drie vezels bevatten.
>
> **Bronnen**
>
> Gebruik voedingswaardetabellen, in deze volgorde: NEVO (Nederlands
> voedingsstoffenbestand), USDA FoodData Central, of de officiële opgave van
> de fabrikant bij een merkproduct. Noteer per ingrediënt welke je gebruikte
> in het veld `bron`. Gebruik geen blogs, receptensites of AI-samenvattingen.
>
> Zet `zekerheid` op `hoog` (directe treffer in een tabel), `midden`
> (vergelijkbaar product, bijvoorbeeld een merkloze variant) of `laag`
> (geschat). Bij `laag` schrijf je in `opmerking` waaróm.
>
> **Lastige gevallen**
>
> - *Samengestelde producten* zoals "Gemengde salade (sla, tomaat, komkommer)"
>   of "Mediterrane groentemix": reken met een aannemelijke verhouding, zet
>   `zekerheid` op `midden` en schrijf de aangenomen verhouding in
>   `opmerking`.
> - *Merkproducten* zoals "Overnight Oats (Sanday's Bakeries)": eerst de
>   opgave van de fabrikant. Niet te vinden? Neem het generieke product en
>   zeg dat in `opmerking`.
> - *Rauw of bereid*: neem de vorm zoals iemand hem eet. Rijst en pasta in
>   een maaltijdplan zijn gekookt; noteer dat in `opmerking`, want het
>   scheelt een factor drie.
> - *Supplementen en poeders* (whey, caseïne): vaak staan er wél mineralen op
>   het etiket. Neem die over; laat de rest weg.
>
> **Raak alleen aan wat je moet aanraken**
>
> Je vult uitsluitend `fiber_per_100g`, `sodium_per_100g` en
> `vitamins_minerals`. Laat calorieën, eiwit, koolhydraten en vet staan zoals
> ze zijn, ook als je denkt dat ze beter kunnen. Die getallen zitten al in
> lopende plannen van klanten; ze wijzigen verschuift stilzwijgend iedereen
> zijn dagtotaal.
>
> **Let op: de bestaande data mengt twee conventies**
>
> In Europa tellen vezels níét mee in de koolhydraten, in de Verenigde Staten
> wél. In deze database staan beide door elkaar:
>
> - Spinazie: 1,4 g koolhydraten, 2,2 g vezels — Europese conventie
> - Chiazaad: 42,1 g koolhydraten waarvan 34,4 g vezels — Amerikaanse
>
> Vezels die hoger uitkomen dan de koolhydraten zijn dus niet per se fout.
> Vul de vezels in volgens de Europese conventie (los van de koolhydraten) en
> noteer in `opmerking` als je bron de Amerikaanse gebruikte. Corrigeer de
> koolhydraten niet zelf — meld het, dan is het een aparte beslissing.
>
> **Controleer jezelf voor je iets oplevert**
>
> 1. Vezels boven 60 g per 100 gram komt alleen voor bij zemelen en psyllium.
>    Anders: nakijken.
> 2. Eiwit plus vet kan nooit boven de 100 gram per 100 gram uitkomen.
> 3. Natrium boven 2000 mg per 100 gram komt alleen voor bij zout zelf en bij
>    bouillonblokjes. Bij een gewoon product is dat een fout.
> 4. Vergelijk met een soortgelijk product uit de lijst. Wijkt het meer dan
>    een factor twee af, kijk het dan na.
> 5. Categorieën zeggen weinig: noten en zaden staan onder `fats`, bonen en
>    linzen onder `protein`. Die hebben wél vezels. Ga af op het product, niet
>    op de categorie.
>
> **Werkwijze**
>
> Verwerk in blokken van 25 ingrediënten. Lever per blok de JSON-objecten en
> daarna een korte opsomming van wat je niet zeker wist. Ga pas verder als
> dat blok is nagekeken. Verzin niets om een blok compleet te krijgen — een
> ontbrekend veld is bruikbaar, een verzonnen getal niet.

---

## De lijst eruit halen

Belangrijkste eerst: de ingrediënten die daadwerkelijk in maaltijden zitten.

```sql
with gebruikt as (
  select distinct (i->>'ingredient_id')::uuid as ing_id
  from public.ai_meals m, lateral jsonb_array_elements(m.ingredients_list) i
  where i->>'ingredient_id' is not null
)
select ai.id, ai.name, ai.category,
       ai.calories_per_100g, ai.protein_per_100g, ai.carbs_per_100g,
       ai.fat_per_100g, ai.fiber_per_100g, ai.sodium_per_100g,
       (g.ing_id is not null) as in_gebruik
from public.ai_ingredients ai
left join gebruikt g on g.ing_id = ai.id
where ai.source = 'coach'
order by (g.ing_id is not null) desc, ai.category, ai.name;
```

## Terugzetten in de database

Controleer eerst wat er zou veranderen, en pas daarna toe. `vitamins_minerals`
wordt samengevoegd met `||`, zodat een tweede ronde de eerste niet wist.

```sql
-- 1. Zet het antwoord in een tijdelijke tabel
create temp table nieuw (
  id uuid primary key,
  fiber_per_100g numeric,
  sodium_per_100g numeric,
  vitamins_minerals jsonb,
  bron text,
  zekerheid text
);
-- ... hier de rijen invoegen ...

-- 2. Kijk eerst wat er verandert (niets wijzigen)
select ai.name, ai.fiber_per_100g as vezels_nu, n.fiber_per_100g as vezels_straks,
       ai.sodium_per_100g as natrium_nu, n.sodium_per_100g as natrium_straks,
       n.zekerheid, n.bron
from nieuw n join public.ai_ingredients ai on ai.id = n.id
where n.fiber_per_100g  is distinct from ai.fiber_per_100g
   or n.sodium_per_100g is distinct from ai.sodium_per_100g
order by n.zekerheid, ai.name;

-- 3. Toepassen, alleen op de canonieke set
update public.ai_ingredients ai
set fiber_per_100g   = coalesce(n.fiber_per_100g, ai.fiber_per_100g),
    sodium_per_100g  = coalesce(n.sodium_per_100g, ai.sodium_per_100g),
    vitamins_minerals = coalesce(ai.vitamins_minerals, '{}'::jsonb)
                        || coalesce(n.vitamins_minerals, '{}'::jsonb)
from nieuw n
where ai.id = n.id and ai.source = 'coach';
```

## Daarna nakijken

```sql
-- Onmogelijk hoge vezelwaarden. Alleen zemelen en psyllium komen boven 60.
select name, category, fiber_per_100g
from public.ai_ingredients
where source = 'coach' and fiber_per_100g > 60
order by fiber_per_100g desc;

-- Onmogelijke massa: eiwit plus vet boven 100 gram per 100 gram.
select name, protein_per_100g, fat_per_100g
from public.ai_ingredients
where source = 'coach' and protein_per_100g + fat_per_100g > 100;

-- Natrium alleen plausibel hoog bij zout en bouillon.
select name, sodium_per_100g
from public.ai_ingredients
where source = 'coach' and sodium_per_100g > 2000
order by sodium_per_100g desc;

-- Hoeveel is er nu eigenlijk gevuld?
select count(*) as canoniek,
       count(*) filter (where fiber_per_100g > 0)   as met_vezels,
       count(*) filter (where sodium_per_100g > 0)  as met_natrium,
       count(*) filter (where vitamins_minerals is not null
                          and vitamins_minerals <> '{}'::jsonb) as met_micros
from public.ai_ingredients where source = 'coach';
```

> Bewust géén controle op "vezels hoger dan koolhydraten": door de twee
> conventies in de data levert die valse alarmen op bij cacaopoeder en
> spinazie, die allebei kloppen.

Zodra dit gevuld is, werkt het blok "Vezels & micro's" in de Plan Analyzer
vanzelf — daar hoeft niets aan de code te gebeuren.

## Twee losse dingen om mee te nemen

Er staan twee ingrediënten met onmogelijke waarden. Ze zitten in geen enkele
maaltijd, dus ze doen nu geen kwaad, maar ze horen gecorrigeerd of op
inactief:

- **Roma Tomato** — 3500 kcal en 700 g koolhydraten per 100 gram
- **Red Bull Sugar Free (8 oz)** — 1000 kcal en 200 g koolhydraten per 100 gram

Verder staat er in de Open Food Facts-import veel verkeerd ingedeeld:
"Banaanschuimpjes", "Peach Fizz" en "Zeeuwse bolusmix" staan als `fruits`.
Dat raakt de canonieke set niet, maar het vertekent wel elk overzicht dat op
`category` filtert.
