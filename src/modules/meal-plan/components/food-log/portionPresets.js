// src/modules/meal-plan/components/food-log/portionPresets.js
// Common-food portion presets so users can tap "1 ei" / "1 glas melk" / "1 appel"
// instead of converting to grams in their head.
//
// Each entry:
//   - match:        regex tested against the food name
//   - displayUnit:  what to show next to numbers ('g' default, 'ml', 'stuks')
//   - presets:      tappable shortcuts. `grams` is always the underlying weight
//                   used for macro math (assume density ≈ 1 for liquids).
//
// Order matters — more specific patterns first.
// Note: grain weights (rijst, pasta) are DRY weights.

const PORTION_PRESETS = [
  { match: /^eiwit\b(?!.*(poeder|shake|reep|drank|pudding|bar))|eiwit\s*\(los\)|egg white|eiwitten\b/i, displayUnit: 'stuks', presets: [{ label: '1 eiwit', grams: 33 }] },
  { match: /\bfeta\b|geitenkaas|parmezaan|parmigiano|geraspte kaas|kaas geraspt|\bgeraspt/i, presets: [{ label: '1 eetlepel', grams: 10 }, { label: '1 portie', grams: 30 }] },
  { match: /schnitzel|cordon bleu/i, displayUnit: 'stuks', presets: [{ label: '1 schnitzel', grams: 150 }] },
  { match: /sashimi|nigiri|maki\b/i, displayUnit: 'stuks', presets: [{ label: '1 stuk', grams: 15 }, { label: '1 portie', grams: 100 }] },
  { match: /ketchup|curryketchup|(tamarinde|curry|tom yum|miso|chili)\s?pasta/i, presets: [{ label: '1 theelepel', grams: 5 }, { label: '1 eetlepel', grams: 15 }] },
  { match: /huttekase|hüttenkäse/i, presets: [{ label: '1 eetlepel', grams: 30 }, { label: '1 bakje', grams: 200 }] },
  { match: /mueslireep|granolareep|ontbijtreep|graanreep/i, displayUnit: 'stuks', presets: [{ label: '1 reep', grams: 25 }] },
  // Namen die door een woord in de naam bij de verkeerde soort belandden
  // (dekking-check 15 okt 2026): "Tonijn in water" kreeg glazen water,
  // "Chips paprika" een paprika, "Bolletje knäckebröd" een broodje.
  { match: /\btonijn\b|\btuna\b/i, presets: [{ label: '1 blikje (uitgelekt)', grams: 120 }, { label: '1 portie', grams: 100 }] },
  { match: /\b(chips|crisps|nachos|tortillachips|pringles|doritos|zoutjes)\b|\blay'?s\b/i, presets: [{ label: '1 handje', grams: 15 }, { label: '1 zakje', grams: 25 }, { label: '1 schaaltje', grams: 50 }] },
  { match: /rijstwafel|maiswafel|rice cake/i, displayUnit: 'stuks', presets: [{ label: '1 wafel', grams: 8 }] },
  { match: /rice paper|rijstpapier/i, displayUnit: 'stuks', presets: [{ label: '1 vel', grams: 9 }] },
  { match: /knäckebröd|knackebrod|knackbrod|crackers?\b|cracker|rasker|beschuit/i, displayUnit: 'stuks', presets: [{ label: '1 cracker', grams: 12 }] },
  { match: /cottage cheese|hüttenkäse|huttenkase/i, presets: [{ label: '1 eetlepel', grams: 30 }, { label: '1 bakje', grams: 200 }] },
  { match: /(kip|kalkoen)\w*.*\b(plakken|plakjes|beleg)\b|\b(plakken|plakjes)\b.*(kip|kalkoen)/i, presets: [{ label: '1 plakje', grams: 15 }] },
  { match: /\b(gel|energy gel|energiegel)\b/i, presets: [{ label: '1 gel', grams: 40 }] },
  { match: /\b(breaker|optimel|vifit|yoghurtdrink|drinkontbijt|milkshake)\b/i, displayUnit: 'ml', presets: [{ label: '1 glas', grams: 250 }, { label: '1 flesje', grams: 330 }] },
  { match: /\b(kvarg|quark)\b/i, presets: [{ label: '1 bakje', grams: 150 }, { label: '1 schaaltje', grams: 200 }] },
  { match: /\bdessert\b|toetje/i, presets: [{ label: '1 bakje', grams: 125 }] },
  { match: /\bsalade\b|salad\b/i, presets: [{ label: '1 bakje', grams: 150 }, { label: '1 portie', grams: 200 }] },
  { match: /pastasaus|pasta saus|bolognesesaus|tomatensaus|passata|pizzasaus/i, presets: [{ label: '1 eetlepel', grams: 15 }, { label: '1 portie', grams: 125 }] },
  { match: /frites\s?saus|fritessaus|frietsaus|tomato frito|tomatensaus|saus\b|sauce\b/i, presets: [{ label: '1 eetlepel', grams: 15 }, { label: '1 portie', grams: 25 }] },
  { match: /nectar\b|\bsap\b|juice/i, displayUnit: 'ml', presets: [{ label: '1 klein glas', grams: 150 }, { label: '1 glas', grams: 200 }, { label: '1 pakje', grams: 200 }] },
  { match: /à la crème|a la creme|ala creme/i, presets: [{ label: '1 portie', grams: 150 }] },
  { match: /\bolijven\b|\bolijf\b(?!olie)/i, presets: [{ label: '1 olijf', grams: 4 }, { label: '1 handje', grams: 30 }] },
  { match: /\brozijnen\b|krenten\b|cranberries gedroogd/i, presets: [{ label: '1 eetlepel', grams: 10 }, { label: '1 handje', grams: 25 }] },
  { match: /zoete aardappel|bataat|sweet potato/i, displayUnit: 'stuks', presets: [{ label: '1 zoete aardappel', grams: 250 }, { label: '1 portie', grams: 200 }] },
  { match: /^(?!.*(jam|confituur|fruitspread|yoghurt|skyr|kwark|drink|smaak|whey|shake|siroop|sap)).*\baardbei(en)?\b/i, displayUnit: 'stuks', presets: [{ label: '1 aardbei', grams: 15 }, { label: '1 handje', grams: 75 }, { label: '1 schaaltje', grams: 150 }] },
  // Specifieke namen die anders bij een algemenere soort belanden.
  { match: /citroensap|limoensap/i, displayUnit: 'ml', presets: [{ label: '1 scheutje', grams: 10 }, { label: '1 eetlepel', grams: 15 }] },
  { match: /\b(caprisun|capri-sun|wicky|appelsientje pakje)\b/i, displayUnit: 'ml', presets: [{ label: '1 pakje', grams: 200 }] },
  { match: /bananenbrood|cake\b|appeltaart|taart\b|brownie|sponge cake|muffin|cupcake|donut|vetekaka/i, displayUnit: 'stuks', presets: [{ label: '1 plak', grams: 50 }, { label: '1 punt', grams: 100 }] },
  { match: /\b(wafel|wafels|eierwafel|eierwafels)\b|eierwafel/i, displayUnit: 'stuks', presets: [{ label: '1 wafel', grams: 25 }] },
  // ═══ Bewerkte producten vóór hun grondstof ═══════════════════════════
  // Anders krijgt "Aardbeien jam" de stuks van losse aardbeien en
  // "Chocolademelk" niets. (15 okt 2026)
  { match: /\b(jam|confituur|fruitspread|marmelade)\b|jam\b/i, presets: [
    { label: '1 theelepel', grams: 7 },
    { label: '1 boterham',  grams: 15 },
    { label: '1 eetlepel',  grams: 20 },
  ]},
  { match: /\b(hagelslag|vlokken|chocoladevlokken|muisjes|gestampte muisjes)\b/i, presets: [
    { label: '1 boterham', grams: 15 },
    { label: '1 eetlepel', grams: 10 },
  ]},
  { match: /\b(chocoladepasta|chocopasta|nutella|hazelnootpasta|speculoospasta|kokosbrood)\b/i, presets: [
    { label: '1 boterham',  grams: 15 },
    { label: '1 theelepel', grams: 8 },
  ]},
  { match: /\b(honing|honey|appelstroop|stroop|agave|ahornsiroop|maple)\b/i, presets: [
    { label: '1 theelepel', grams: 7 },
    { label: '1 eetlepel',  grams: 21 },
  ]},
  { match: /\b(smeerkaas|roomkaas|cream cheese|philadelphia|zuivelspread|smeerworst|leverworst|paté|pate)\b/i, presets: [
    { label: '1 boterham', grams: 20 },
    { label: '1 eetlepel', grams: 15 },
  ]},
  { match: /\b(chocolademelk|chocomel|cacaomelk)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',    grams: 250 },
    { label: '1 pakje',   grams: 200 },
    { label: '1 flesje',  grams: 300 },
  ]},
  { match: /\b(karnemelk|buttermilk|kefir|yoghurtdrank|drinkyoghurt|ayran|lassi)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',   grams: 250 },
    { label: '1 flesje', grams: 330 },
  ]},
  { match: /\b(eiwitdrank|protein\s?drink|proteïne\s?drink|proteinedrank|eiwit\s?shake|protein\s?milk|high protein drink)\b/i, displayUnit: 'ml', presets: [
    { label: '1 flesje', grams: 330 },
    { label: '1 pakje',  grams: 250 },
  ]},
  { match: /\b(siroop|limonadesiroop|ranja|diksap)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas aangelengd (scheutje)', grams: 30 },
    { label: '1 scheutje',                  grams: 30 },
  ]},
  { match: /\b(limonade|sportdrank|isotone|aa drink|aquarius|gatorade|powerade|vitaminwater|kombucha|ijsthee|lipton)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',   grams: 250 },
    { label: '1 blikje', grams: 330 },
    { label: '1 fles',   grams: 500 },
  ]},
  { match: /\b(soep|bouillon|tomatensoep|erwtensoep|groentesoep|kippensoep|ramen)\b/i, displayUnit: 'ml', presets: [
    { label: '1 kop',  grams: 200 },
    { label: '1 kom',  grams: 300 },
    { label: '1 bord', grams: 400 },
  ]},
  { match: /\b(whey|caseïne|caseine|eiwitpoeder|protein\s?powder|proteïnepoeder|isolaat|isolate)\b/i, presets: [
    { label: '1 schep',     grams: 30 },
    { label: '1 halve schep', grams: 15 },
  ]},
  { match: /\b(eiwitreep|protein\s?bar|proteïnereep|proteinereep|barebells|grenade|quest bar)\b/i, presets: [
    { label: '1 reep', grams: 55 },
  ]},
  { match: /\b(eiwitpudding|protein\s?pudding|proteïne\s?pudding|high protein pudding|ehrmann)\b/i, presets: [
    { label: '1 bakje', grams: 200 },
  ]},
  { match: /\b(creatine)\b/i, presets: [
    { label: '1 schep', grams: 5 },
  ]},
  // ═══ Drinks (display in ml) ═══════════════════════════════════════
  { match: /\b(eiwitshake|protein.?shake|whey)\b/i, displayUnit: 'ml', presets: [
    { label: '1 shake',        grams: 300 },
    { label: '1 grote shake',  grams: 500 },
  ]},
  { match: /\b(smoothie)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas',  grams: 200 },
    { label: '1 glas',        grams: 300 },
    { label: '1 grote beker', grams: 500 },
  ]},
  { match: /\b(sap|juice|jus|sinaasappelsap|appelsap|tomatensap)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 150 },
    { label: '1 glas',       grams: 200 },
    { label: '1 grote glas', grams: 300 },
  ]},
  { match: /\b(melk|milk|sojamelk|amandelmelk|haver(melk|drink)|kokosmelk)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas',  grams: 150 },
    { label: '1 glas',        grams: 250 },
    { label: '1 grote beker', grams: 350 },
    { label: '1 mok',         grams: 300 },
  ]},
  { match: /\b(koffie|coffee|cappuccino|latte|espresso)\b/i, displayUnit: 'ml', presets: [
    // Kop eerst: zonder treffer op naam begint de kiezer op de eerste.
    { label: '1 kop',       grams: 150 },
    { label: '1 mok',       grams: 250 },
    { label: '1 grote mok', grams: 400 },
    { label: '1 espresso',  grams: 30 },
  ]},
  { match: /\b(thee|tea|kruidenthee)\b/i, displayUnit: 'ml', presets: [
    { label: '1 kop',  grams: 200 },
    { label: '1 mok',  grams: 300 },
  ]},
  { match: /\b(water|spa|spawater|bronwater)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',     grams: 250 },
    { label: '1 fles',     grams: 500 },
    { label: '1 grote fles', grams: 1000 },
  ]},
  { match: /\b(frisdrank|cola|sprite|fanta|seven.?up|7.?up|ice.?tea|iced tea|red bull|energy drink|energiedrank)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 200 },
    { label: '1 glas',       grams: 250 },
    { label: '1 blikje',     grams: 330 },
    { label: '1 fles',       grams: 500 },
  ]},
  { match: /\b(bier|beer|pils|pilsner|witbier|tripel|radler)\b/i, displayUnit: 'ml', presets: [
    { label: '1 glas',   grams: 250 },
    { label: '1 pintje', grams: 300 },
    { label: '1 fles',   grams: 330 },
  ]},
  { match: /\b(wijn|wine|rode wijn|witte wijn|rosé)\b/i, displayUnit: 'ml', presets: [
    { label: '1 klein glas', grams: 100 },
    { label: '1 glas',       grams: 150 },
    { label: '1 fles',       grams: 750 },
  ]},
  { match: /\b(gin|wodka|vodka|whisky|whiskey|rum|tequila|likeur)\b/i, displayUnit: 'ml', presets: [
    { label: '1 shotje',  grams: 25 },
    { label: '1 borrel',  grams: 50 },
    { label: '1 long drink', grams: 200 },
  ]},

  // ═══ Whole-unit foods (display in stuks where natural) ════════════
  // Dooier en eiwit hebben een eigen `override` met de per-100g macros van
  // dat specifieke deel — zonder override zou het systeem het gemiddelde
  // hele-ei-profiel toepassen (~155 kcal/100g) en zo bij eiwit fout fat
  // doorrekenen. Het eigeel bevat alle vetten van het ei.
  { match: /\b(eier|eieren|egg|eggs)\b|^ei$|\bei\s/i, displayUnit: 'stuks', presets: [
    { label: '1 ei',           grams: 60 },
    { label: '2 eieren',       grams: 120 },
    { label: '3 eieren',       grams: 180 },
    { label: '5 eieren',       grams: 300 },
    {
      label: '1 dooier', grams: 20,
      // Per 100g eigeel: USDA referentiewaarden.
      override: { calories: 322, protein: 16, carbs: 3.6, fat: 27 },
    },
    {
      label: '1 eiwit (los)', grams: 33,
      // Per 100g eiwit: bijna alleen eiwit, nauwelijks koolhydraten, géén vet.
      override: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
    },
  ]},
  { match: /\b(banaan|banana)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ banaan',       grams: 60 },
    { label: '1 banaan',       grams: 120 },
    { label: '1 grote banaan', grams: 150 },
  ]},
  { match: /\b(appel|apple)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ appel', grams: 90 },
    { label: '1 appel', grams: 180 },
    { label: '2 appels', grams: 360 },
  ]},
  { match: /\b(sinaasappel|orange)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 sinaasappel', grams: 150 },
    { label: '2 sinaasappels', grams: 300 },
  ]},
  { match: /\b(mandarijn|mandarin)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 mandarijn',   grams: 70 },
    { label: '2 mandarijnen', grams: 140 },
    { label: '3 mandarijnen', grams: 210 },
  ]},
  { match: /\b(peer|pear)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 peer',  grams: 175 },
    { label: '2 peren', grams: 350 },
  ]},
  { match: /\b(avocado)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ avocado', grams: 100 },
    { label: '1 avocado', grams: 200 },
  ]},
  { match: /\b(kiwi)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kiwi',  grams: 75 },
    { label: '2 kiwis', grams: 150 },
  ]},
  { match: /\b(perzik|nectarine|pruim|plum)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 stuk',  grams: 130 },
    { label: '2 stuks', grams: 260 },
  ]},

  // ═══ Whole-unit veggies ═══════════════════════════════════════════
  { match: /\b(tomaat|tomato)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 cherry-tomaat',   grams: 15 },
    { label: '5 cherry-tomaten',  grams: 75 },
    { label: '1 tomaat',          grams: 100 },
    { label: '1 vleestomaat',     grams: 200 },
  ]},
  { match: /\bkomkommer\b/i, displayUnit: 'stuks', presets: [
    { label: '¼ komkommer', grams: 100 },
    { label: '½ komkommer', grams: 200 },
    { label: '1 komkommer', grams: 400 },
  ]},
  { match: /\b(paprika|bell pepper)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ paprika', grams: 75 },
    { label: '1 paprika', grams: 150 },
  ]},
  { match: /\b(wortel|wortels|carrot)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 wortel',     grams: 80 },
    { label: '2 wortels',    grams: 160 },
    { label: '1 portie',     grams: 100 },
  ]},
  { match: /\b(aardappel|aardappels|potato)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kleine aardappel',  grams: 75 },
    { label: '1 aardappel',          grams: 150 },
    { label: '2 aardappels',         grams: 300 },
    { label: 'normale portie',       grams: 200 },
  ]},

  // ═══ Bread / grains (gram) ════════════════════════════════════════
  { match: /\b(boterham|boterhammen|sneetje|sneetjes)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 boterham',     grams: 35 },
    { label: '2 boterhammen',  grams: 70 },
    { label: '3 boterhammen',  grams: 105 },
    { label: '4 boterhammen',  grams: 140 },
  ]},
  { match: /\b(broodje|kadetje|bolletje|baguette)\b/i, displayUnit: 'stuks', presets: [
    { label: '½ broodje', grams: 30 },
    { label: '1 broodje', grams: 60 },
  ]},
  { match: /\bbrood\b/i, presets: [
    { label: '1 snee',  grams: 35 },
    { label: '2 sneeën', grams: 70 },
  ]},
  { match: /\b(crackers?|knäckebröd)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 cracker',  grams: 8 },
    { label: '3 crackers', grams: 24 },
    { label: '5 crackers', grams: 40 },
  ]},
  // Wraps — kleine wrap ≈ 40g, grote wrap ≈ 60g (snel-kies opties).
  { match: /\b(wrap|wraps|tortilla|tortillawrap|tortilla.?wrap)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 kleine wrap', grams: 40 },
    { label: '1 grote wrap',  grams: 60 },
    { label: '2 kleine wraps', grams: 80 },
    { label: '2 grote wraps',  grams: 120 },
  ]},
  { match: /\b(rijst|rice)\b/i, presets: [
    { label: '½ portie (droog)',     grams: 60 },
    { label: '1 portie (droog)',     grams: 75 },
    { label: 'grote portie (droog)', grams: 100 },
  ]},
  { match: /\bpasta\b/i, presets: [
    { label: '½ portie (droog)',     grams: 75 },
    { label: '1 portie (droog)',     grams: 100 },
    { label: 'grote portie (droog)', grams: 125 },
  ]},
  { match: /\b(havermout|oatmeal|haver)\b/i, presets: [
    { label: '½ portie',     grams: 30 },
    { label: '1 portie',     grams: 60 },
    { label: 'grote portie', grams: 90 },
  ]},

  // ═══ Protein (gram) ═══════════════════════════════════════════════
  // Specific eerst: gesneden / plakjes / ham — dunne plakjes (~15g)
  // Vleeswaren als beleg: een plakje is zo'n 15 g.
  { match: /\b(ham|achterham|schouderham|beenham|rookvlees|rosbief|fricandeau|pastrami|cervelaat|salami|boterhamworst|kipfilet\s*beleg)\b|\bkip\b.*\(beleg\)/i, presets: [
    { label: '1 plakje',  grams: 15 },
    { label: '2 plakjes', grams: 30 },
    { label: '4 plakjes', grams: 60 },
  ]},
  { match: /\b(kip|kalkoen)(filet)?\s*(plakjes|plakje|gesneden|sneetjes|sneetje)\b/i, presets: [
    { label: '1 plakje',  grams: 15 },
    { label: '3 plakjes', grams: 45 },
    { label: '5 plakjes', grams: 75 },
  ]},
  { match: /\b(kipham|kalkoenham|chicken\s?ham)\b/i, presets: [
    { label: '1 plakje',  grams: 15 },
    { label: '3 plakjes', grams: 45 },
    { label: '5 plakjes', grams: 75 },
  ]},
  // Generiek: hele filet/stuk
  { match: /\b(kipfilet|kalkoenfilet|chicken\s?filet)\b/i, presets: [
    { label: '½ filet',   grams: 75 },
    { label: '1 filet',   grams: 150 },
    { label: '1½ filet',  grams: 225 },
  ]},
  { match: /\b(rundergehakt|gehakt)\b/i, presets: [
    { label: 'kleine portie',  grams: 80 },
    { label: 'normale portie', grams: 120 },
    { label: 'grote portie',   grams: 160 },
  ]},
  { match: /\b(zalm|zalmfilet|salmon)\b/i, presets: [
    { label: 'kleine moot', grams: 100 },
    { label: 'normale moot', grams: 150 },
    { label: 'grote moot',   grams: 200 },
  ]},
  { match: /\btonijn\b/i, presets: [
    { label: '½ blikje',  grams: 40 },
    { label: '1 blikje',  grams: 80 },
    { label: '2 blikjes', grams: 160 },
  ]},
  { match: /\b(broccoli)\b/i, presets: [
    { label: 'kleine portie',  grams: 100 },
    { label: 'normale portie', grams: 150 },
    { label: 'grote portie',   grams: 200 },
  ]},

  // ═══ Dairy (gram for solid, ml-flagged ones above for liquid) ═════
  { match: /\b(kaas|cheese|gouda|cheddar|brie|edammer|leerdammer|maaslander|jong belegen|oude kaas)\b/i, presets: [
    { label: '1 plak',    grams: 20 },
    { label: '2 plakken', grams: 40 },
    { label: '3 plakken', grams: 60 },
    { label: '1 blokje',  grams: 10 },
  ]},
  { match: /\b(yoghurt|yogurt|griekse yoghurt|skyr)\b/i, presets: [
    { label: '1 schaaltje',     grams: 150 },
    { label: '1 grote schaal',  grams: 250 },
    { label: '1 beker',         grams: 200 },
  ]},
  { match: /\bkwark\b/i, presets: [
    { label: '1 schaaltje',    grams: 150 },
    { label: '1 grote schaal', grams: 250 },
    { label: '1 beker',        grams: 500 },
  ]},

  // ═══ Berries / handful items ══════════════════════════════════════
  { match: /\b(aardbei|aardbeien|strawberry|strawberries)\b/i, displayUnit: 'stuks', presets: [
    { label: '5 stuks',  grams: 75 },
    { label: '10 stuks', grams: 150 },
  ]},
  { match: /\b(blauwe bes|blauwe bessen|bosbes|bosbessen|blueberr)\b/i, presets: [
    { label: '1 handje',     grams: 50 },
    { label: '1 schaaltje',  grams: 125 },
  ]},

  // ═══ Nuts / spreads (gram) ════════════════════════════════════════
  { match: /\b(noten|walnoot|walnoten|amandelen|pistache|pistaches|cashew|cashew(noot|noten))\b/i, presets: [
    { label: '1 handje (kl)',  grams: 15 },
    { label: '1 handje',       grams: 25 },
    { label: '1 handje (gr)',  grams: 35 },
  ]},
  { match: /\b(pindakaas|peanut butter)\b/i, presets: [
    { label: '1 theelepel',  grams: 5 },
    { label: '1 eetlepel',   grams: 16 },
    { label: '2 eetlepels',  grams: 32 },
  ]},
  { match: /\b(hummus|tapenade)\b/i, presets: [
    { label: '1 eetlepel',  grams: 15 },
    { label: '2 eetlepels', grams: 30 },
  ]},

  // ═══ Oils / butter ═══════════════════════════════════════════════
  { match: /\b(olie|oil|olijfolie|zonnebloem(olie)?)\b/i, presets: [
    { label: '1 theelepel',  grams: 5 },
    { label: '1 eetlepel',   grams: 13 },
    { label: '2 eetlepels',  grams: 26 },
  ]},
  { match: /\b(boter|butter|margarine)\b/i, presets: [
    { label: '1 mesje',     grams: 5 },
    { label: '1 eetlepel',  grams: 14 },
  ]},
  // ═══ Uitbreiding 15 okt 2026 ════════════════════════════════════════
  // Zuivel en toetjes
  { match: /\b(vla|pudding|griesmeelpudding|rijstpudding|custard)\b/i, presets: [
    { label: '1 schaaltje', grams: 150 },
    { label: '1 bakje',     grams: 200 },
  ]},
  { match: /\b(cottage cheese|hüttenkäse|huttenkase)\b/i, presets: [
    { label: '1 eetlepel', grams: 30 },
    { label: '1 bakje',    grams: 200 },
  ]},
  { match: /\b(ijs|roomijs|schepijs|ice cream|magnum|raket|cornetto)\b/i, presets: [
    { label: '1 bolletje', grams: 50 },
    { label: '1 ijsje',    grams: 70 },
  ]},
  { match: /\b(slagroom|kookroom|room|crème fraîche|creme fraiche|zure room)\b/i, presets: [
    { label: '1 eetlepel', grams: 15 },
    { label: '1 toef',     grams: 20 },
  ]},
  // Sauzen en smaakmakers
  { match: /\b(mayonaise|mayo|fritessaus|knoflooksaus|cocktailsaus|joppiesaus|remoulade|tartaar)\b/i, presets: [
    { label: '1 eetlepel', grams: 15 },
    { label: '1 portie',   grams: 25 },
  ]},
  { match: /\b(ketchup|curryketchup|barbecuesaus|bbq\s?saus|sriracha|sweet chili|chilisaus)\b/i, presets: [
    { label: '1 eetlepel', grams: 15 },
    { label: '1 portie',   grams: 25 },
  ]},
  { match: /\b(mosterd|mustard|sambal|harissa|pesto)\b/i, presets: [
    { label: '1 theelepel', grams: 5 },
    { label: '1 eetlepel',  grams: 15 },
  ]},
  { match: /\b(sojasaus|ketjap|soy sauce|vissaus|worcester|teriyaki)\b/i, displayUnit: 'ml', presets: [
    { label: '1 theelepel', grams: 5 },
    { label: '1 eetlepel',  grams: 15 },
  ]},
  { match: /\b(pindasaus|satésaus|satesaus|dressing|vinaigrette|slasaus|caesar)\b/i, presets: [
    { label: '1 eetlepel', grams: 15 },
    { label: '1 portie',   grams: 40 },
  ]},
  { match: /\b(pastasaus|tomatensaus|passata|bolognesesaus|tomatenpuree)\b/i, presets: [
    { label: '1 eetlepel', grams: 15 },
    { label: '1 portie',   grams: 125 },
  ]},
  { match: /\b(suiker|sugar|kristalsuiker|basterdsuiker|poedersuiker|zoetstof)\b/i, presets: [
    { label: '1 klontje',   grams: 4 },
    { label: '1 theelepel', grams: 4 },
    { label: '1 eetlepel',  grams: 12 },
  ]},
  { match: /\b(cacaopoeder|cacao poeder|kaneel|paprikapoeder|kruiden)\b/i, presets: [
    { label: '1 theelepel', grams: 3 },
  ]},
  // Zaden en ontbijtgranen
  { match: /\b(chiazaad|chia|lijnzaad|zonnebloempitten|pompoenpitten|sesamzaad|hennepzaad|zaden|pitten)\b/i, presets: [
    { label: '1 theelepel', grams: 5 },
    { label: '1 eetlepel',  grams: 10 },
  ]},
  { match: /\b(granola|muesli|cruesli|krokante muesli)\b/i, presets: [
    { label: '1 eetlepel', grams: 10 },
    { label: '1 kom',      grams: 50 },
  ]},
  { match: /\b(cornflakes|corn flakes|ontbijtgranen|cereal|special k|brinta|rice krispies|cheerios)\b/i, presets: [
    { label: '1 kom', grams: 30 },
    { label: '1 grote kom', grams: 45 },
  ]},
  // Brood en bakkerij
  { match: /\b(beschuit|beschuiten)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 beschuit', grams: 10 },
  ]},
  { match: /\b(rijstwafel|rijstwafels|maiswafel|maiswafels|rice cake)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 rijstwafel', grams: 8 },
  ]},
  { match: /\b(ontbijtkoek|peperkoek)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 plak', grams: 25 },
  ]},
  { match: /\b(krentenbol|krentenbollen|rozijnenbol|muesli\s?bol)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 bol', grams: 55 },
  ]},
  { match: /\b(croissant|croissants|pain au chocolat|chocoladebroodje)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 croissant', grams: 50 },
  ]},
  { match: /\b(bagel|bagels)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 bagel', grams: 85 },
  ]},
  { match: /\b(pistolet|pistolets|stokbrood|ciabatta)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 broodje', grams: 60 },
  ]},
  { match: /\b(pannenkoek|pannenkoeken|pancake|pancakes|poffertjes)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 pannenkoek', grams: 75 },
    { label: '1 kleine pancake', grams: 40 },
  ]},
  { match: /\b(pizza)\b/i, presets: [
    { label: '1 punt',       grams: 100 },
    { label: '1 hele pizza', grams: 400 },
  ]},
  // Koek, snoep en snacks
  { match: /\b(stroopwafel|stroopwafels)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 stroopwafel', grams: 30 },
  ]},
  { match: /\b(koek|koekje|koekjes|biscuit|biscuits|cookie|cookies|speculaas|bastogne|liga|evergreen|sultana|mariakaakje)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 koekje', grams: 10 },
    { label: '1 pakje',  grams: 30 },
  ]},
  { match: /\b(reep|mars|snickers|twix|bounty|kitkat|kit kat|lion|m&m|milky way)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 reep', grams: 50 },
  ]},
  { match: /\b(chocolade|chocolate|tony chocolonely|pure chocolade|melkchocolade)\b/i, presets: [
    { label: '1 blokje', grams: 5 },
    { label: '1 rij',    grams: 20 },
    { label: '1 reep',   grams: 100 },
  ]},
  { match: /\b(chips|crisps|nachos|tortillachips|pringles|doritos|lays|zoutjes)\b/i, presets: [
    { label: '1 handje', grams: 15 },
    { label: '1 zakje',  grams: 25 },
    { label: '1 schaaltje', grams: 50 },
  ]},
  { match: /\b(popcorn)\b/i, presets: [
    { label: '1 schaaltje', grams: 20 },
    { label: '1 bak (bios)', grams: 75 },
  ]},
  { match: /\b(snoep|winegums|drop|zuurtjes|haribo|spekjes|marshmallow)\b/i, presets: [
    { label: '1 snoepje', grams: 5 },
    { label: '1 handje',  grams: 25 },
  ]},
  { match: /\b(gedroogde\s?\w+|rozijnen|dadels|dadel|vijgen|abrikozen gedroogd|cranberries gedroogd)\b/i, presets: [
    { label: '1 stuk',   grams: 8 },
    { label: '1 handje', grams: 25 },
  ]},
  // Snacks van de snackbar
  { match: /\b(friet|patat|frites|fries)\b/i, presets: [
    { label: '1 kleine portie', grams: 100 },
    { label: '1 middel portie', grams: 150 },
    { label: '1 grote portie',  grams: 200 },
  ]},
  { match: /\b(bitterbal|bitterballen)\b/i, displayUnit: 'stuks', presets: [{ label: '1 bitterbal', grams: 25 }] },
  { match: /\b(frikandel|frikandellen)\b/i, displayUnit: 'stuks', presets: [{ label: '1 frikandel', grams: 50 }] },
  { match: /\b(kroket|kroketten)\b/i, displayUnit: 'stuks', presets: [{ label: '1 kroket', grams: 70 }] },
  { match: /\b(kaassoufflé|kaassouffle|kipcorn|bamischijf|nasischijf)\b/i, displayUnit: 'stuks', presets: [{ label: '1 stuk', grams: 75 }] },
  { match: /\b(loempia)\b/i, displayUnit: 'stuks', presets: [{ label: '1 loempia', grams: 150 }, { label: '1 mini loempia', grams: 20 }] },
  // Fruit
  { match: /\b(druif|druiven|grape|grapes)\b/i, presets: [
    { label: '1 druif',  grams: 5 },
    { label: '1 handje', grams: 75 },
    { label: '1 tros',   grams: 150 },
  ]},
  { match: /\b(mango)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 mango', grams: 200 },
    { label: '1 schaaltje', grams: 125 },
  ]},
  { match: /\b(ananas|pineapple)\b/i, presets: [
    { label: '1 schijf',    grams: 80 },
    { label: '1 schaaltje', grams: 125 },
  ]},
  { match: /\b(meloen|watermeloen|honingmeloen|galia|cantaloupe)\b/i, presets: [
    { label: '1 part',   grams: 150 },
    { label: '1 schaaltje', grams: 200 },
  ]},
  { match: /\b(framboos|frambozen|braam|bramen|bessen|rode bessen|kersen|kers|cranberry|cranberries)\b/i, presets: [
    { label: '1 handje',    grams: 50 },
    { label: '1 schaaltje', grams: 125 },
  ]},
  { match: /\b(citroen|limoen|lemon|lime)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 citroen', grams: 100 },
    { label: '1 scheutje sap', grams: 10 },
  ]},
  { match: /\b(grapefruit|pompelmoes)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 grapefruit', grams: 250 },
  ]},
  // Groente
  { match: /\b(ui|uien|onion|rode ui|sjalot|sjalotten)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 ui',      grams: 100 },
    { label: '1 sjalot', grams: 25 },
  ]},
  { match: /\b(knoflook|garlic)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 teentje', grams: 4 },
  ]},
  { match: /\b(champignon|champignons|paddenstoel|paddenstoelen|mushroom)\b/i, presets: [
    { label: '1 champignon', grams: 15 },
    { label: '1 bakje',      grams: 250 },
  ]},
  { match: /\b(courgette|zucchini|aubergine)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 courgette', grams: 300 },
    { label: '1 portie',    grams: 150 },
  ]},
  { match: /\b(sla|ijsbergsla|rucola|veldsla|spinazie|andijvie|boerenkool|slamix)\b/i, presets: [
    { label: '1 handje', grams: 25 },
    { label: '1 portie', grams: 75 },
    { label: '1 zak',    grams: 200 },
  ]},
  { match: /\b(sperziebonen|boontjes|bloemkool|spruitjes|doperwten|erwten|wortelen|bospeen|groente|groenten|roerbakgroente|wokgroente|prei|snijbonen|asperges)\b/i, presets: [
    { label: '1 opscheplepel', grams: 50 },
    { label: '1 portie',       grams: 150 },
    { label: '1 zak',          grams: 400 },
  ]},
  { match: /\b(mais|maïs|corn)\b/i, presets: [
    { label: '1 eetlepel',  grams: 15 },
    { label: '1 klein blik', grams: 140 },
    { label: '1 kolf',      grams: 150 },
  ]},
  { match: /\b(kidneybonen|kikkererwten|linzen|witte bonen|zwarte bonen|bruine bonen|peulvruchten|edamame)\b/i, presets: [
    { label: '1 eetlepel', grams: 20 },
    { label: '1 portie',   grams: 100 },
    { label: '1 blik (uitgelekt)', grams: 265 },
  ]},
  { match: /\b(olijven|olijf|olives)\b(?!.*olie)/i, presets: [
    { label: '1 olijf',  grams: 4 },
    { label: '1 handje', grams: 30 },
  ]},
  // Graan en aardappel
  { match: /\b(quinoa|couscous|bulgur|parelcouscous|gierst)\b/i, presets: [
    { label: '1 portie (droog)', grams: 75 },
  ]},
  { match: /\b(noedels|noodles|mie|bami|udon|rijstnoedels|mihoen)\b/i, presets: [
    { label: '1 nestje', grams: 65 },
    { label: '1 portie (droog)', grams: 85 },
  ]},
  { match: /\b(zoete aardappel|bataat|sweet potato)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 zoete aardappel', grams: 250 },
  ]},
  { match: /\b(gnocchi)\b/i, presets: [
    { label: '1 portie', grams: 200 },
  ]},
  // Vlees, vis en vega
  { match: /\b(kippendij|kippendijen|dijfilet|kippenpoot|drumstick|kippenvleugel|kippenvleugels)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 dijfilet',   grams: 100 },
    { label: '1 drumstick',  grams: 90 },
    { label: '1 vleugel',    grams: 40 },
  ]},
  { match: /\b(gehaktbal|gehaktballen|balletjes|köttbullar)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 gehaktbal', grams: 90 },
    { label: '1 balletje',  grams: 15 },
  ]},
  { match: /\b(hamburger|burger|smashburger|beefburger)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 burger', grams: 110 },
  ]},
  { match: /\b(rookworst|worst|braadworst|knakworst|knakworstjes|chipolata|hotdog|frankfurter)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 knakworstje', grams: 30 },
    { label: '1 braadworst',  grams: 100 },
    { label: '1 rookworst',   grams: 275 },
  ]},
  { match: /\b(bacon|ontbijtspek|spekreepjes|spekjes|spek)\b/i, presets: [
    { label: '1 plakje',  grams: 10 },
    { label: '1 bakje',   grams: 125 },
  ]},
  { match: /\b(biefstuk|steak|entrecote|ribeye|varkenshaas|schnitzel|karbonade|speklap|lamskotelet|tartaar)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 stuk', grams: 150 },
  ]},
  { match: /\b(kabeljauw|koolvis|tilapia|pangasius|witvis|vis(sen)?filet|forel|makreel|haring|kibbeling|lekkerbekje|vissticks)\b/i, presets: [
    { label: '1 filet', grams: 125 },
    { label: '1 portie', grams: 150 },
  ]},
  { match: /\b(garnalen|gamba|gambas|shrimp|scampi|mosselen)\b/i, presets: [
    { label: '1 portie', grams: 100 },
    { label: '1 bakje',  grams: 150 },
  ]},
  { match: /\b(tofu|tempeh|seitan)\b/i, presets: [
    { label: '1 portie', grams: 100 },
    { label: '1 blok',   grams: 200 },
  ]},
  { match: /\b(vegaburger|vegetarische burger|beyond|vegaschijf|kipstuckjes|vegetarische kip|vegakip|vivera|garden gourmet)\b/i, presets: [
    { label: '1 stuk',   grams: 100 },
    { label: '1 portie', grams: 125 },
  ]},
  // Kaas extra
  { match: /\b(mozzarella|burrata)\b/i, displayUnit: 'stuks', presets: [
    { label: '1 bol', grams: 125 },
  ]},
  { match: /\b(feta|geitenkaas|parmezaan|parmigiano|geraspte kaas|kaas geraspt)\b/i, presets: [
    { label: '1 eetlepel', grams: 10 },
    { label: '1 portie',   grams: 30 },
  ]},
  // ═══ Aanvullingen na dekking-check op echte logs (15 okt 2026) ════════
  { match: /\bkip\b.*\bfilet\b|kip - filet|gerookte.*kip|rökt (kalkon|kylling)|rookvlees|runderrookvlees/i, presets: [
    { label: '1 plakje', grams: 15 },
    { label: '1 filet',  grams: 150 },
  ]},
  { match: /\b(pink lady|elstar|jonagold|granny smith|braeburn|gala|apples)\b/i, displayUnit: 'stuks', presets: [{ label: '1 appel', grams: 180 }] },
  { match: /\bmandarijnen\b/i, displayUnit: 'stuks', presets: [{ label: '1 mandarijn', grams: 70 }] },
  { match: /\bbananen\b/i, displayUnit: 'stuks', presets: [{ label: '1 banaan', grams: 120 }] },
  { match: /\baardappelen\b/i, displayUnit: 'stuks', presets: [{ label: '1 aardappel', grams: 100 }, { label: '1 portie', grams: 250 }] },
  { match: /brood\b/i, presets: [{ label: '1 snee', grams: 35 }] },
  { match: /triangel|triangles|puntjes|\bbollen\b|\bbol\b|pita|turkse broodjes|turks brood|flatbread|focaccia|foccacia/i, displayUnit: 'stuks', presets: [{ label: '1 broodje', grams: 60 }] },
  { match: /tortilla/i, displayUnit: 'stuks', presets: [{ label: '1 wrap', grams: 60 }] },
  { match: /knäckebröd|knackbrod|rasker|fullkorn|crackers?\b/i, displayUnit: 'stuks', presets: [{ label: '1 cracker', grams: 12 }] },
  { match: /\b(emmental|emmentaler|gouda|edam|jong|belegen|oud)\b.*\d{2}\s?\+|\d{2}\s?\+/i, presets: [{ label: '1 plak', grams: 20 }, { label: '1 blokje', grams: 10 }] },
  { match: /\b(fusilli|penne|spaghetti|macaroni|tagliatelle|farfalle|rigatoni|linguine|orzo)\b/i, presets: [{ label: '1 portie (droog)', grams: 75 }] },
  { match: /\b(nootjes|borrelnootjes|pinda's|pindas|pinda)\b/i, presets: [{ label: '1 handje', grams: 25 }] },
  { match: /friet|patat/i, presets: [{ label: '1 portie', grams: 150 }] },
  { match: /kidney\s?bonen|kikkererwten|linzen|bonen\b/i, presets: [{ label: '1 eetlepel', grams: 20 }, { label: '1 portie', grams: 100 }] },
  { match: /\b(pinot|chardonnay|merlot|sauvignon|cabernet|prosecco|cava|champagne|rosé|rose wijn)\b/i, displayUnit: 'ml', presets: [{ label: '1 glas', grams: 125 }, { label: '1 fles', grams: 750 }] },
  { match: /tripel|trappist|dubbel\b|ipa\b|weizen|westmalle|leffe|hertog jan|heineken|grolsch|amstel|bavaria/i, displayUnit: 'ml', presets: [{ label: '1 glas', grams: 250 }, { label: '1 flesje', grams: 330 }, { label: '1 blikje', grams: 330 }] },
  { match: /crème fraiche|creme fraiche|crème fraîche/i, presets: [{ label: '1 eetlepel', grams: 15 }] },
  { match: /\bkvarg\b|\bquark\b/i, presets: [{ label: '1 bakje', grams: 150 }, { label: '1 schaaltje', grams: 200 }] },
  { match: /\baugurk|augurken|augurkjes|dwarsliggers/i, displayUnit: 'stuks', presets: [{ label: '1 augurk', grams: 20 }] },
  { match: /bleekselderij|selderij/i, displayUnit: 'stuks', presets: [{ label: '1 stengel', grams: 40 }] },
  { match: /\bsushi\b/i, displayUnit: 'stuks', presets: [{ label: '1 stuk', grams: 30 }] },
  { match: /\blay'?s\b|\bchips\b/i, presets: [{ label: '1 handje', grams: 15 }, { label: '1 zakje', grams: 25 }] },
  { match: /\bbar\b|\breep\b/i, displayUnit: 'stuks', presets: [{ label: '1 reep', grams: 50 }] },
  { match: /groente|groenten/i, presets: [{ label: '1 portie', grams: 150 }] },
  { match: /avoine|havervlokken|oats\b/i, presets: [{ label: '1 portie', grams: 40 }, { label: '1 eetlepel', grams: 10 }] },
  { match: /\b(soupe|zuppa)\b/i, displayUnit: 'ml', presets: [{ label: '1 kom', grams: 300 }] },
  { match: /\btomaten\b|cherry\s?tomaten|cherrytomaten|trostomaten/i, displayUnit: 'stuks', presets: [{ label: '1 tomaat', grams: 100 }, { label: '1 cherrytomaatje', grams: 15 }] },
  { match: /blueberr|bosbes/i, presets: [{ label: '1 handje', grams: 50 }, { label: '1 schaaltje', grams: 125 }] },
  { match: /pecan|macadamia|hazelno|paranoten|walno/i, presets: [{ label: '1 handje', grams: 25 }] },
  { match: /olie\b|\boil\b/i, presets: [{ label: '1 theelepel', grams: 5 }, { label: '1 eetlepel', grams: 13 }] },
  { match: /kookspray|bakspray|cooking spray/i, presets: [{ label: '1 spray', grams: 1 }, { label: '1 seconde spuiten', grams: 2 }] },
  { match: /\bpapaja\b|\bpapaya\b/i, displayUnit: 'stuks', presets: [{ label: '1 halve papaya', grams: 150 }] },
  { match: /krieltjes|krielaardappel/i, presets: [{ label: '1 portie', grams: 200 }] },
  { match: /gegrilde kip|kip \(winkel\)|grillkip|rotisserie/i, presets: [{ label: '1 portie', grams: 150 }, { label: '1 poot', grams: 250 }] },
  { match: /falafel/i, displayUnit: 'stuks', presets: [{ label: '1 balletje', grams: 20 }] },
  { match: /bloemkoolrijst|broccolirijst|groenterijst/i, presets: [{ label: '1 portie', grams: 150 }] },
  { match: /taugé|tauge|taugeh/i, presets: [{ label: '1 handje', grams: 25 }, { label: '1 portie', grams: 100 }] },
  { match: /peterselie|munt|basilicum|koriander|bieslook|dille|verse kruiden/i, presets: [{ label: '1 eetlepel', grams: 3 }, { label: '1 handje', grams: 10 }] },
  { match: /kappertjes/i, presets: [{ label: '1 theelepel', grams: 5 }, { label: '1 eetlepel', grams: 15 }] },
  { match: /ricotta|mascarpone/i, presets: [{ label: '1 eetlepel', grams: 30 }] },
  { match: /mass gainer|gainer/i, presets: [{ label: '1 schep', grams: 100 }] },
  { match: /electrolyte|elektrolyt|glutamine|zma|bcaa|eaa|pre.?workout|collageen|collagen|flavor powder|smaakpoeder/i, presets: [{ label: '1 schep', grams: 5 }, { label: '1 portie', grams: 10 }] },
  { match: /plant.?based protein|vegan protein|erwteneiwit|pea protein|soja eiwit/i, presets: [{ label: '1 schep', grams: 30 }] },
  { match: /\bfruit\b|fruitmix|fruitsalade/i, presets: [{ label: '1 schaaltje', grams: 125 }, { label: '1 portie', grams: 150 }] },
]

// Generic gram fallback shown for any food that has no specific category
// match (the long list of presets above). Keeps the quick-pick row visible
// at all times so the coach/client never has to type a value from scratch.
const DEFAULT_GRAM_PRESETS = {
  presets: [
    { label: '1 g',   grams: 1 },
    { label: '30 g',  grams: 30 },
    { label: '100 g', grams: 100 },
  ],
  displayUnit: 'g',
}

/**
 * Find the matching portion-config entry for a food name.
 * Falls back to a generic 1g / 30g / 100g row when no category matches so
 * the quick-pick row is always visible.
 *
 * Shape: { presets: [...], displayUnit: 'g' | 'ml' | 'stuks' }
 */
export const findPortionConfig = (foodName) => {
  if (!foodName || typeof foodName !== 'string') return DEFAULT_GRAM_PRESETS
  const name = foodName.trim()
  if (!name) return DEFAULT_GRAM_PRESETS
  for (const entry of PORTION_PRESETS) {
    if (entry.match.test(name)) {
      return {
        presets: entry.presets,
        displayUnit: entry.displayUnit || 'g',
      }
    }
  }
  return DEFAULT_GRAM_PRESETS
}

/**
 * Backward-compat wrapper — returns just the presets array.
 */
export const findPortionPresets = (foodName) => {
  const cfg = findPortionConfig(foodName)
  return cfg ? cfg.presets : []
}

// Eén herkenbare eenheid voor een ingrediënt, om naast de grammen te tonen
// ("175 g · 5 sneetjes") en om per stuk te verspringen. Alleen als er een
// natuurlijke eenheid is; anders null en blijft het bij grammen.
const MEERVOUD = {
  plakje: 'plakjes', plak: 'plakken', sneetje: 'sneetjes', boterham: 'boterhammen',
  broodje: 'broodjes', ei: 'eieren', banaan: 'bananen', appel: 'appels', peer: 'peren',
  sinaasappel: 'sinaasappels', mandarijn: 'mandarijnen', kiwi: "kiwi's", avocado: "avocado's",
  tomaat: 'tomaten', 'cherry-tomaat': 'cherrytomaatjes', paprika: "paprika's", wortel: 'wortels',
  aardappel: 'aardappels', cracker: 'crackers', wrap: 'wraps', 'kleine wrap': 'kleine wraps',
  filet: 'filets', blikje: 'blikjes', schaaltje: 'schaaltjes', handje: 'handjes',
  theelepel: 'theelepels', eetlepel: 'eetlepels', mesje: 'mesjes', glas: 'glazen',
  'klein glas': 'kleine glazen', kop: 'koppen', mok: 'mokken', stuk: 'stuks', portie: 'porties',
  komkommer: 'komkommers', blokje: 'blokjes', aardbei: 'aardbeien', snee: 'sneeën', stengel: 'stengels', schnitzel: 'schnitzels', cherrytomaatje: 'cherrytomaatjes', balletje: 'balletjes', spray: 'sprays', poot: 'poten', vel: 'vellen', augurk: 'augurken', wafel: 'wafels',
  schep: 'scheppen', reep: 'repen', bol: 'bollen', beschuit: 'beschuiten', rijstwafel: 'rijstwafels',
  croissant: 'croissants', bagel: 'bagels', pannenkoek: 'pannenkoeken', stroopwafel: 'stroopwafels',
  koekje: 'koekjes', druif: 'druiven', teentje: 'teentjes', champignon: 'champignons', ui: 'uien',
  olijf: 'olijven', burger: 'burgers', gehaktbal: 'gehaktballen', kroket: 'kroketten',
  frikandel: 'frikandellen', bitterbal: 'bitterballen', flesje: 'flesjes', pakje: 'pakjes', fles: 'flessen',
  kom: 'kommen', bakje: 'bakjes', bolletje: 'bolletjes', punt: 'punten',
  klontje: 'klontjes', nestje: 'nestjes', dijfilet: 'dijfilets', part: 'parten', beker: 'bekers', dooier: 'dooiers', vleestomaat: 'vleestomaten',
  moot: 'moten', zak: 'zakken', zakje: 'zakjes', schaal: 'schalen', schijf: 'schijven', tros: 'trossen',
  opscheplepel: 'opscheplepels', toef: 'toeven', scheutje: 'scheutjes', rij: 'rijen', snoepje: 'snoepjes',
}
export const meervoud = (enkel) => {
  if (!enkel) return enkel
  if (MEERVOUD[enkel]) return MEERVOUD[enkel]
  // "eetlepel" -> "eetlepels", "kleine portie" -> "kleine porties",
  // "portie (droog)" -> "porties (droog)"
  const m = String(enkel).match(/^(.*?)(\s*\(.*\))?$/)
  const delen = m[1].split(' ')
  const laatste = delen.pop()
  return [...delen, MEERVOUD[laatste] || laatste].join(' ') + (m[2] || '')
}

export const stukVan = (foodName) => {
  const cfg = findPortionConfig(foodName)
  if (!cfg || cfg === DEFAULT_GRAM_PRESETS) return null
  const enkele = (cfg.presets || []).filter(x => /^1 /.test(x.label) && !/\(/.test(x.label) && x.grams > 0)
  // Liefst de eenheid die in de naam zelf staat ("Tomaat" -> 1 tomaat, niet
  // 1 cherry-tomaat); anders de eerste.
  const naam = String(foodName).toLowerCase()
  const p = enkele.find(x => naam.includes(x.label.slice(2).trim().toLowerCase())) || enkele[0]
  if (!p) return null
  let enkel = p.label.slice(2).trim()
  // Brood tel je in sneetjes, niet in plakjes.
  if (/\bbrood\b/i.test(foodName) && (enkel === 'plakje' || enkel === 'snee')) enkel = 'snee'
  return { grams: p.grams, enkel, meer: MEERVOUD[enkel] || enkel }
}

// "5 sneetjes", "1 plak", "1,5 schaaltje". Halve stuks waar het past.
export const stukTekst = (gram, stuk) => {
  if (!stuk || !(gram > 0)) return null
  const n = Math.round((gram / stuk.grams) * 2) / 2
  if (n <= 0) return null
  const tal = String(n).replace('.', ',')
  // ~ : het aantal is geschat uit een gemiddeld gewicht per stuk; de grammen
  // zijn leidend (Kersten, 27 okt 2026).
  return `~${tal} ${n === 1 ? stuk.enkel : stuk.meer}`
}

export default PORTION_PRESETS
