// src/modules/meal-plan/mealGuideDefaults.js
// Onderzochte standaard-keuzes per gelegenheid voor de Gelegenheden-hub.
// "good" = slimme keuze, "bad" = met mate. kcal zijn richtwaarden per gangbare
// portie (afronding). `img` = Engelse zoekterm(en) voor de foto-bron. Coach-
// items uit meal_guide_items worden hier bovenop gemerged. Bron kcal: gangbare
// voedingswaarden (NEVO / fabrikant), praktisch afgerond — geen labelwaarde.

export const DEFAULT_GUIDE_ITEMS = {
  verjaardag: [
    { title: 'Stuk fruit / fruitspies', verdict: 'good', kcal: 60, img: 'fruit,skewer' },
    { title: 'Handje ongezouten noten', verdict: 'good', kcal: 180, img: 'mixed,nuts' },
    { title: 'Rauwkost met hummus', verdict: 'good', kcal: 120, img: 'vegetables,hummus' },
    { title: 'Magere kaasblokjes', verdict: 'good', kcal: 100, img: 'cheese,cubes' },
    { title: 'Spa rood / water', verdict: 'good', kcal: 0, img: 'sparkling,water' },
    { title: 'Punt slagroomtaart', verdict: 'bad', kcal: 450, img: 'cream,cake' },
    { title: 'Stuk appeltaart', verdict: 'bad', kcal: 350, img: 'apple,pie' },
    { title: 'Gevulde koek', verdict: 'bad', kcal: 300, img: 'almond,cookie' },
    { title: 'Worstenbroodje', verdict: 'bad', kcal: 250, img: 'sausage,roll' },
    { title: 'Glas frisdrank', verdict: 'bad', kcal: 140, img: 'soda,glass' },
    { title: 'Handje chips', verdict: 'bad', kcal: 150, img: 'potato,chips' },
  ],
  uiteten: [
    { title: 'Gegrilde kip met groente', verdict: 'good', kcal: 450, img: 'grilled,chicken,vegetables' },
    { title: 'Biefstuk met salade', verdict: 'good', kcal: 500, img: 'steak,salad' },
    { title: 'Carpaccio (voorgerecht)', verdict: 'good', kcal: 250, img: 'carpaccio' },
    { title: 'Heldere soep', verdict: 'good', kcal: 150, img: 'clear,soup' },
    { title: 'Sushi (8 stuks)', verdict: 'good', kcal: 350, img: 'sushi' },
    { title: 'Gegrilde vis', verdict: 'good', kcal: 400, img: 'grilled,fish' },
    { title: 'Hele pizza', verdict: 'bad', kcal: 1200, img: 'pizza' },
    { title: 'Pasta carbonara', verdict: 'bad', kcal: 800, img: 'pasta,carbonara' },
    { title: 'Spareribs', verdict: 'bad', kcal: 900, img: 'spare,ribs' },
    { title: 'Friet met mayo', verdict: 'bad', kcal: 500, img: 'french,fries' },
    { title: 'Tiramisu', verdict: 'bad', kcal: 450, img: 'tiramisu' },
  ],
  ontbijt_buffet: [
    { title: 'Griekse yoghurt met fruit', verdict: 'good', kcal: 200, img: 'yogurt,fruit' },
    { title: 'Gekookt ei', verdict: 'good', kcal: 70, img: 'boiled,egg' },
    { title: 'Volkoren brood met kaas', verdict: 'good', kcal: 200, img: 'wholegrain,bread,cheese' },
    { title: 'Havermout', verdict: 'good', kcal: 250, img: 'oatmeal' },
    { title: 'Vers fruit', verdict: 'good', kcal: 80, img: 'fresh,fruit' },
    { title: 'Croissant', verdict: 'bad', kcal: 270, img: 'croissant' },
    { title: 'Pain au chocolat', verdict: 'bad', kcal: 300, img: 'pain,au,chocolat' },
    { title: 'Wit broodje met hagelslag', verdict: 'bad', kcal: 250, img: 'white,bread' },
    { title: 'Spek & worst', verdict: 'bad', kcal: 350, img: 'bacon,sausage' },
    { title: 'Glas jus d’orange', verdict: 'bad', kcal: 120, img: 'orange,juice' },
  ],
  lunch_buffet: [
    { title: 'Salade met kip', verdict: 'good', kcal: 350, img: 'chicken,salad' },
    { title: 'Soep', verdict: 'good', kcal: 150, img: 'soup' },
    { title: 'Volkoren wrap met groente', verdict: 'good', kcal: 300, img: 'vegetable,wrap' },
    { title: 'Omelet', verdict: 'good', kcal: 250, img: 'omelette' },
    { title: 'Gerookte zalm', verdict: 'good', kcal: 200, img: 'smoked,salmon' },
    { title: 'Quiche (punt)', verdict: 'bad', kcal: 400, img: 'quiche' },
    { title: 'Broodje kroket', verdict: 'bad', kcal: 450, img: 'croquette,sandwich' },
    { title: 'Pastasalade met mayo', verdict: 'bad', kcal: 500, img: 'pasta,salad' },
    { title: 'Stokbrood met kruidenboter', verdict: 'bad', kcal: 300, img: 'baguette,butter' },
  ],
  mcdonalds: [
    { title: 'Hamburger', verdict: 'good', kcal: 250, img: 'hamburger' },
    { title: 'Cheeseburger', verdict: 'good', kcal: 300, img: 'cheeseburger' },
    { title: 'Grilled Chicken Salad', verdict: 'good', kcal: 230, img: 'chicken,salad' },
    { title: '6 Chicken McNuggets', verdict: 'good', kcal: 250, img: 'chicken,nuggets' },
    { title: 'Big Mac', verdict: 'bad', kcal: 510, img: 'big,mac,burger' },
    { title: 'Double Quarter Pounder', verdict: 'bad', kcal: 740, img: 'double,cheeseburger' },
    { title: 'Grote friet', verdict: 'bad', kcal: 430, img: 'french,fries' },
    { title: 'McFlurry', verdict: 'bad', kcal: 340, img: 'ice,cream,sundae' },
    { title: 'Milkshake (groot)', verdict: 'bad', kcal: 570, img: 'milkshake' },
  ],
  snackbar: [
    { title: 'Broodje gezond', verdict: 'good', kcal: 350, img: 'healthy,sandwich' },
    { title: 'Gehaktbal', verdict: 'good', kcal: 230, img: 'meatball' },
    { title: 'Kleine friet', verdict: 'good', kcal: 300, img: 'french,fries' },
    { title: 'Kapsalon', verdict: 'bad', kcal: 1000, img: 'kebab,fries' },
    { title: 'Frikandel speciaal', verdict: 'bad', kcal: 350, img: 'fried,sausage,snack' },
    { title: 'Kroket', verdict: 'bad', kcal: 230, img: 'croquette' },
    { title: 'Berenhap', verdict: 'bad', kcal: 300, img: 'fried,meat,snack' },
    { title: 'Grote friet speciaal', verdict: 'bad', kcal: 600, img: 'loaded,fries' },
  ],
  festival: [
    { title: 'Wrap met kip', verdict: 'good', kcal: 350, img: 'chicken,wrap' },
    { title: 'Smoothie', verdict: 'good', kcal: 180, img: 'smoothie' },
    { title: 'Handje noten', verdict: 'good', kcal: 180, img: 'nuts' },
    { title: 'Gegrilde maïs', verdict: 'good', kcal: 150, img: 'grilled,corn' },
    { title: 'Loaded fries', verdict: 'bad', kcal: 700, img: 'loaded,fries' },
    { title: 'Festival-burger', verdict: 'bad', kcal: 600, img: 'burger' },
    { title: 'Churros', verdict: 'bad', kcal: 400, img: 'churros' },
    { title: 'Pizzapunt', verdict: 'bad', kcal: 350, img: 'pizza,slice' },
    { title: 'Bier (glas)', verdict: 'bad', kcal: 150, img: 'beer,glass' },
  ],
}

// Stabiele seed per id zodat dezelfde kaart steeds dezelfde foto toont.
const seedFromId = (s) => {
  let h = 0
  for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0
  return h % 1000
}

// Foto-URL op basis van de zoekterm (LoremFlickr — vrije CC-foto's, geen key).
// Vaste lock = deterministisch zodat de foto niet bij elke render wisselt.
export const guideImageUrl = (item) => {
  if (item.image_url) return item.image_url
  if (!item.img) return null
  return `https://loremflickr.com/320/240/${item.img}?lock=${seedFromId(item.id || item.img)}`
}

// Bouw genormaliseerde default-items voor één gelegenheid (synthetische id's).
export const defaultItemsFor = (occasionId) =>
  (DEFAULT_GUIDE_ITEMS[occasionId] || []).map((it, i) => ({
    id: `def-${occasionId}-${i}`,
    occasion: occasionId,
    title: it.title,
    verdict: it.verdict,
    kcal: it.kcal,
    note: it.note || null,
    image_url: null,
    img: it.img || null,
    _source: 'default',
  }))
