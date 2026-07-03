// src/modules/meal-plan/foodImageFallback.js
// Generiek foto-fallback systeem. Geen eigen image_url? Dan kiezen we een VASTE,
// passende foto op basis van de titel (kwark -> kwarkfoto, kip -> kip, enz.).
// PRIMAIR: lokale voedingfoto's in /public/food (echte, kloppende beelden,
// aangeleverd door de coach). SECUNDAIR: een set gecureerde Unsplash-foto's per
// categorie voor wat lokaal (nog) niet bestaat. Bewust GEEN random/keyword-
// image-service (gaf irrelevante foto's).

// ── Lokale foto's (/public/food) — NL-keyword(s) -> bestandsnaam.
// Volgorde = prioriteit: specifiek boven generiek (bv. "zoete aardappel" vóór
// "aardappel", "magere kwark" matcht op "kwark").
const LOCAL = [
  { m: ['magere kwark'], f: 'magere-kwark.png' },
  { m: ['kwark'], f: 'kwark-met-fruit.jpg' },
  { m: ['skyr'], f: 'skyr.png' },
  { m: ['hutten', 'huttenkase', 'huttekase', 'cottage'], f: 'magere-huttekase.png' },
  { m: ['kaas 48', 'jong belegen', 'belegen'], f: 'kaas-48.png' },
  { m: ['kaas', 'cheese'], f: 'kaas.png' },
  { m: ['melk', 'milk'], f: 'melk.png' },
  { m: ['ei', 'eieren', 'egg', 'omelet'], f: 'eieren.png' },
  { m: ['plakjes kip', 'kipfilet plakjes'], f: 'plakjes-kipfilet.png' },
  { m: ['kip', 'chicken'], f: 'kipfilet.png' },
  { m: ['kalkoen', 'turkey'], f: 'kalkoenfilet.png' },
  { m: ['rookvlees'], f: 'rookvlees-mager.jpeg' },
  { m: ['gehakt', 'rundergehakt'], f: 'rundergehakt.png' },
  { m: ['biefstuk', 'steak', 'rund', 'beef', 'vlees'], f: 'biefstuk.png' },
  { m: ['zalm', 'salmon'], f: 'zalm.png' },
  { m: ['makreel'], f: 'makreel.png' },
  { m: ['kabeljauw', 'kabeljouw', 'witvis'], f: 'kabeljouw.png' },
  { m: ['tilapia'], f: 'tilapia.png' },
  { m: ['tonijn', 'tuna'], f: 'tonijninblik.png' },
  { m: ['garnaal', 'garnalen', 'shrimp'], f: 'garnalen.png' },
  { m: ['sardine', 'sardientjes', 'sardintjes'], f: 'sardintjes.png' },
  { m: ['vis', 'fish'], f: 'zalm.png' },
  { m: ['cream of rice'], f: 'cream-of-rice.jpg' },
  { m: ['havermout', 'oat', 'oatmeal', 'porridge'], f: 'havermout.png' },
  { m: ['chia'], f: 'chiazaad.png' },
  { m: ['zilvervliesrijst', 'bruine rijst'], f: 'zilvervliesrijst.png' },
  { m: ['rijst', 'rice'], f: 'witte-rijst.png' },
  { m: ['quinoa'], f: 'quinoa.png' },
  { m: ['couscous'], f: 'couscous.png' },
  { m: ['spelt'], f: 'spelt.png' },
  { m: ['volkoren pasta'], f: 'volkoren-pasta.png' },
  { m: ['witte pasta', 'pasta', 'spaghetti', 'macaroni', 'penne'], f: 'witte-pasta.jpg' },
  { m: ['volkoren wrap', 'wrap', 'tortilla'], f: 'volkoren-wraps.png' },
  { m: ['volkoren brood', 'volkorenbrood', 'bruin brood'], f: 'volkoren-brood.png' },
  { m: ['wit brood', 'witbrood', 'brood', 'boterham', 'broodje'], f: 'wit-brood.jpg' },
  { m: ['bagel'], f: 'bagels.png' },
  { m: ['pistolet'], f: 'pistolet.png' },
  { m: ['rijstwafel', 'rijst wafel'], f: 'rijst-wafels.png' },
  { m: ['appel', 'apple'], f: 'appel.png' },
  { m: ['peer'], f: 'peer.png' },
  { m: ['druif', 'druiven', 'grape'], f: 'druiven.png' },
  { m: ['kiwi'], f: 'kiwi.png' },
  { m: ['mango'], f: 'mango.png' },
  { m: ['meloen', 'melon'], f: 'meloen.png' },
  { m: ['ananas', 'pineapple'], f: 'ananas.png' },
  { m: ['aardbei', 'strawberry'], f: 'aarbeien.png' },
  { m: ['framboos', 'raspberry'], f: 'frambozen.png' },
  { m: ['blauwe bes', 'bosbes', 'blueberry', 'bes ', 'bessen'], f: 'blauwe-bessen.png' },
  { m: ['pindakaas', 'peanut butter'], f: 'pindakaas.png' },
  { m: ['amandel', 'noot', 'noten', 'pinda', 'nut', 'cashew', 'walnoot'], f: 'amandelen.png' },
  { m: ['hummus'], f: 'hummus.png' },
  { m: ['peulvrucht', 'linzen', 'kikkererwt', 'bonen', 'lentils', 'beans'], f: 'peulvruchten.png' },
  { m: ['sperzieboon', 'sperziebonen', 'green bean'], f: 'sperziebonen.png' },
  { m: ['broccoli'], f: 'broccoli.png' },
  { m: ['bloemkool', 'cauliflower'], f: 'bloemkool.png' },
  { m: ['spinazie', 'spinach'], f: 'spinazie.png' },
  { m: ['courgette', 'zucchini'], f: 'courgette.png' },
  { m: ['paprika', 'pepper'], f: 'paprika.png' },
  { m: ['komkommer', 'cucumber'], f: 'komkommer.jpeg' },
  { m: ['wortel', 'carrot'], f: 'wortel.png' },
  { m: ['asperge', 'asparagus'], f: 'asperges.png' },
  { m: ['zoete aardappel', 'sweet potato'], f: 'zoete-aardappel.jpeg' },
  { m: ['aardappel', 'potato'], f: 'zoete-aardappel.jpeg' },
  { m: ['groente', 'vegetable', 'veggie'], f: 'broccoli.png' },
  { m: ['avocado', 'avocado'], f: 'avovado.png' },
  { m: ['olijfolie', 'olive oil'], f: 'olijfolie.png' },
  { m: ['kokosolie', 'coconut oil'], f: 'kokosolie.jpeg' },
  { m: ['roomboter', 'boter', 'butter'], f: 'roomboter.jpeg' },
  { m: ['honing', 'honey'], f: 'honing.jpg' },
  { m: ['jam'], f: 'aarbeienjam.png' },
  { m: ['hagelslag'], f: 'hagelslag.png' },
  { m: ['schenkstroop', 'stroop', 'syrup'], f: 'schenkstroop.png' },
  { m: ['suiker', 'sugar'], f: 'suikerklont.jpeg' },
  { m: ['ontbijtkoek'], f: 'ontbijtkoek.png' },
  { m: ['whey', 'eiwitpoeder', 'proteine poeder', 'protein powder', 'isolaat'], f: 'whey-poeder.png' },
  { m: ['smoothie', 'shake', 'proteine', 'protein', 'eiwit', 'gainer'], f: 'smoothies.jpeg' },
  { m: ['pizza'], f: 'pizza.png' },
  { m: ['croissant'], f: 'croissant.png' },
  { m: ['slagroomtaart'], f: 'slagroomtaart.png' },
  { m: ['taart', 'cake', 'gebak'], f: 'taart.avif' },
  { m: ['chips', 'crisps'], f: 'chips.jpeg' },
  { m: ['cola'], f: 'cola.png' },
  { m: ['bier', 'beer'], f: 'bier.jpeg' },
  { m: ['wijn', 'wine'], f: 'wijn.jpeg' },
  { m: ['cappucc', 'cappuch', 'latte'], f: 'cappuchino.jpeg' },
  { m: ['koffie', 'coffee', 'espresso'], f: 'kop-koffie.png' },
  { m: ['thee', 'tea'], f: 'kop-thee.png' },
  { m: ['jus', 'sinaasappelsap', 'orange juice'], f: 'ju-s-dorange.jpeg' },
  { m: ['water'], f: 'glas-wat.png' },
  { m: ['kinderbueno', 'reep', 'candybar', 'snickers', 'mars'], f: 'kinderbueno.jpeg' },
  { m: ['fastfood', 'mcdonald', 'burger king', 'friet', 'patat'], f: 'fastfood.jpeg' },
  { m: ['saus', 'sauzen', 'ketchup', 'mayo'], f: 'sauzen.png' },
]

// ── Secundaire Unsplash-fallback (bewezen foto-ID's) per categorie.
const U = (id, size) => `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&q=80`
const UNS = {
  dairy: '1488477304112-4944851de03d', chicken: '1532550907401-a500c9a57435',
  fish: '1467003909585-2f8a72700288', pasta: '1621996346565-e3dbc646d9a9',
  oats: '1517673400267-0251440c45dc', salad: '1512621776951-a57141f2eefd',
  bread: '1528735602780-2552fd46c7af', smoothie: '1502767089025-6572583495f9',
  fruit: '1490474504059-bf2db5ab2348', dinner: '1555939594-58d7cb561ad1',
  lunch: '1547592166-23ac45744acd', breakfast: '1525351484163-7529414344d8',
  snack: '1490474504059-bf2db5ab2348', default: '1546069901-ba9599a7e63c',
}

// Volledige fallback-foto-URL. `size` alleen relevant voor de Unsplash-achtervang.
export function foodImageFallback(title, slot, size = 200) {
  const t = (title || '').toLowerCase()
  for (const g of LOCAL) {
    if (g.m.some(w => t.includes(w))) return `/food/${g.f}`
  }
  // Geen lokale match → gecureerde Unsplash o.b.v. slot, anders generiek.
  const s = slot === 'snack1' || slot === 'snack2' ? 'snack' : slot
  return U(UNS[s] || UNS.default, size)
}

export function resolveFoodImage(item, { size = 200 } = {}) {
  if (item?.image_url) return item.image_url
  return foodImageFallback(item?.name || item?.title || item?.product_name, item?.slot, size)
}
