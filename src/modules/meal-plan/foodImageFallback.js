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
  { m: ['kaas', 'cheese', 'gouda', 'goudse', 'parmigiano', 'reggiano', 'parmezaan', 'parmesan', 'feta', 'cheddar', 'brie', 'grana', 'padano', 'zaanlander', 'pecorino', 'camembert', 'emmentaler', 'fromage', 'roomkaas', 'geitenkaas', 'komijnekaas', 'leerdammer', 'old amsterdam', 'beemster', 'maasdammer', 'halloumi'], f: 'kaas.png' },
  { m: ['melk', 'milk', 'karnemelk', 'chocomel', 'chocolademelk', 'barista'], f: 'melk.png' },
  { m: ['ei', 'eieren', 'egg', 'omelet', 'roerei', 'spiegelei'], f: 'eieren.png' },
  { m: ['plakjes kip', 'kipfilet plakjes'], f: 'plakjes-kipfilet.png' },
  { m: ['kip', 'chicken', 'drumsticks', 'nuggets', 'poulet', 'kippendij', 'kippenpoten', 'kippenbouten', 'kipdij'], f: 'kipfilet.png' },
  { m: ['kalkoen', 'turkey'], f: 'kalkoenfilet.png' },
  { m: ['rookvlees'], f: 'rookvlees-mager.jpeg' },
  { m: ['gehakt', 'rundergehakt'], f: 'rundergehakt.png' },
  { m: ['biefstuk', 'steak', 'rund', 'beef', 'vlees', 'rosbief', 'entrecote', 'ribeye', 'varkenshaas', 'carpaccio', 'pastrami', 'prosciutto', 'fricandeau', 'hachee', 'karbonade', 'schouderkarbonade', 'babi', 'pork', 'varkensvlees', 'runderlappen', 'stoofvlees', 'shoarmavlees', 'spareribs', 'hamlap', 'procureur'], f: 'biefstuk.png' },
  { m: ['zalm', 'salmon'], f: 'zalm.png' },
  { m: ['makreel'], f: 'makreel.png' },
  { m: ['kabeljauw', 'kabeljouw', 'witvis'], f: 'kabeljouw.png' },
  { m: ['tilapia'], f: 'tilapia.png' },
  { m: ['tonijn', 'tuna'], f: 'tonijninblik.png' },
  { m: ['garnaal', 'garnalen', 'shrimp', 'crevettes', 'scampi', 'gamba', 'gambas'], f: 'garnalen.png' },
  { m: ['sardine', 'sardientjes', 'sardintjes'], f: 'sardintjes.png' },
  { m: ['vis', 'fish', 'vissticks', 'forel', 'zeebaars', 'dorade'], f: 'zalm.png' },
  { m: ['cream of rice'], f: 'cream-of-rice.jpg' },
  { m: ['havermout', 'oat', 'oatmeal', 'porridge', 'haver', 'havervlokken', 'vlokken', 'oats', 'overnight oats'], f: 'havermout.png' },
  { m: ['chia'], f: 'chiazaad.png' },
  { m: ['zilvervliesrijst', 'bruine rijst'], f: 'zilvervliesrijst.png' },
  { m: ['rijst', 'rice', 'risotto', 'basmati', 'pandan', 'jasmijnrijst', 'zilvervlies'], f: 'witte-rijst.png' },
  { m: ['quinoa'], f: 'quinoa.png' },
  { m: ['couscous'], f: 'couscous.png' },
  { m: ['spelt'], f: 'spelt.png' },
  { m: ['volkoren pasta'], f: 'volkoren-pasta.png' },
  { m: ['witte pasta', 'pasta', 'spaghetti', 'macaroni', 'penne', 'tagliatelle', 'fusilli', 'ravioli', 'tortellini', 'orzo', 'bami', 'bakmeel', 'bolognese', 'farfalle', 'linguine', 'gnocchi', 'macaroni', 'rigatoni'], f: 'witte-pasta.jpg' },
  { m: ['volkoren wrap', 'wrap', 'tortilla'], f: 'volkoren-wraps.png' },
  { m: ['volkoren brood', 'volkorenbrood', 'bruin brood'], f: 'volkoren-brood.png' },
  { m: ['wit brood', 'witbrood', 'brood', 'boterham', 'broodje', 'bollen', 'bolletjes', 'meergranen', 'desem', 'waldkorn', 'korenlanders', 'baguette', 'ciabatta', 'toast', 'tarwe', 'pain', 'focaccia', 'bread', 'sandwich', 'knackebrod', 'knäckebröd', 'stokbrood', 'krentenbol', 'tijgerbrood', 'casino', 'batavier', 'vloer', 'meerzaden', 'spelt brood', 'afbakbroodjes'], f: 'wit-brood.jpg' },
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
  { m: ['amandel', 'noot', 'pinda', 'nut', 'cashew', 'walnoot', 'pecan', 'pecannoten', 'pistache', 'pistachenoten', 'macadamia', 'hazelnoot', 'hazelnoten', 'paranoten', 'pijnboompitten', 'zonnebloempitten', 'pompoenpitten', 'zaden', 'pitten'], f: 'amandelen.png' },
  { m: ['hummus'], f: 'hummus.png' },
  { m: ['peulvrucht', 'linzen', 'kikkererwt', 'bonen', 'lentils', 'beans', 'kidneybonen', 'kikkererwten', 'edamame', 'sojabonen', 'bruine bonen', 'witte bonen'], f: 'peulvruchten.png' },
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
  { m: ['groente', 'vegetable', 'veggie', 'roerbakmix', 'wokgroente', 'spruitjes', 'bleekselderij', 'venkel', 'groentemix', 'soepgroente'], f: 'broccoli.png' },
  { m: ['avocado', 'avocado'], f: 'avovado.png' },
  { m: ['olijfolie', 'olive oil', 'olie', 'oil', 'zonnebloemolie', 'arachideolie', 'bakolie', 'frituurolie'], f: 'olijfolie.png' },
  { m: ['kokosolie', 'coconut oil'], f: 'kokosolie.jpeg' },
  { m: ['roomboter', 'boter', 'butter', 'margarine', 'halvarine', 'zuivelspread', 'becel', 'bakboter', 'smeerboter'], f: 'roomboter.jpeg' },
  { m: ['honing', 'honey'], f: 'honing.jpg' },
  { m: ['jam'], f: 'aarbeienjam.png' },
  { m: ['hagelslag'], f: 'hagelslag.png' },
  { m: ['schenkstroop', 'stroop', 'syrup'], f: 'schenkstroop.png' },
  { m: ['suiker', 'sugar'], f: 'suikerklont.jpeg' },
  { m: ['ontbijtkoek'], f: 'ontbijtkoek.png' },
  { m: ['whey', 'eiwitpoeder', 'proteine poeder', 'protein powder', 'isolaat', 'isolate', 'collagen', 'creatine', 'caseine', 'proteinepoeder', 'eiwit poeder'], f: 'whey-poeder.png' },
  { m: ['smoothie', 'shake', 'proteine', 'protein', 'eiwit', 'gainer'], f: 'smoothies.jpeg' },
  { m: ['pizza'], f: 'pizza.png' },
  { m: ['croissant'], f: 'croissant.png' },
  { m: ['slagroomtaart'], f: 'slagroomtaart.png' },
  { m: ['taart', 'cake', 'gebak', 'spekkoek', 'tiramisu', 'tompouce', 'mousse', 'cheesecake', 'schwarzwalder', 'appeltaart', 'gebakje', 'soesjes', 'bossche bol'], f: 'taart.avif' },
  { m: ['chips', 'crisps', 'kroepoek', 'nachos', 'tortilla chips', 'pringles', 'borrelnootjes'], f: 'chips.jpeg' },
  { m: ['cola'], f: 'cola.png' },
  { m: ['bier', 'beer'], f: 'bier.jpeg' },
  { m: ['wijn', 'wine'], f: 'wijn.jpeg' },
  { m: ['cappucc', 'cappuch', 'latte'], f: 'cappuchino.jpeg' },
  { m: ['koffie', 'coffee', 'espresso'], f: 'kop-koffie.png' },
  { m: ['thee', 'tea'], f: 'kop-thee.png' },
  { m: ['jus', 'sinaasappelsap', 'orange juice', 'sap', 'juice', 'vruchtensap'], f: 'ju-s-dorange.jpeg' },
  { m: ['water'], f: 'glas-wat.png' },
  { m: ['kinderbueno', 'reep', 'candybar', 'snickers', 'mars'], f: 'kinderbueno.jpeg' },
  { m: ['fastfood', 'mcdonald', 'burger king', 'friet', 'patat', 'snack', 'kipcorn', 'berenklauw', 'mexicano'], f: 'fastfood.jpeg' },
  { m: ['saus', 'sauzen', 'ketchup', 'mayo', 'mayonaise', 'sauce', 'sambal', 'oelek', 'ketjap', 'mosterd', 'dressing', 'dip', 'salsa', 'aioli', 'bbq', 'barbecue', 'marinade', 'teriyaki', 'pastasaus', 'satesaus', 'currysaus', 'jus de viande', 'tzatziki', 'guacamole', 'pindasaus'], f: 'sauzen.png' },
  // ── Gecureerde Unsplash-foto's voor wat lokaal (nog) ontbreekt (14 okt 2026,
  // elk gecontroleerd op 200). u = foto-id; wordt via U() op maat opgehaald.
  { m: ['sinaasappel', 'sinaasappels', 'orange'], u: '1708335008260-501cb0648576' },
  { m: ['mandarijn', 'clementine', 'mandarin'], u: '1633359333817-9765db6795d7' },
  { m: ['banaan', 'bananen', 'banana'], u: '1571771894821-ce9b6c11b08e' },
  { m: ['citroen', 'limoen', 'lemon'], u: '1572635148818-ef6fd45eb394' },
  { m: ['limonade', 'sinas', 'frisdrank', 'ranja', 'lemonade', 'soda', 'fanta', 'sprite', 'energiedrank', 'energy', 'ice tea', 'icetea', 'lipton', 'ijsthee', 'tonic', 'cassis', '7up', 'dubbelfris', 'sportdrank', 'aquarius', 'red bull', 'monster'], u: '1618225726814-ab70d87027b0' },
  { m: ['appelsap', 'apple juice'], u: '1542444459-db37a5da9d5f' },
  { m: ['vruchtensap', 'multivruchten', 'smoothie sap'], u: '1626203051568-26d377aa4710' },
  { m: ['yoghurt', 'yogurt', 'drinkyoghurt', 'vla', 'pudding', 'kwarkje'], u: '1763825613390-287a9db0803d' },
  { m: ['ijs', 'ijsje', 'roomijs', 'ice cream', 'sorbet', 'magnum'], u: '1689076758310-92b693fe6b8b' },
  { m: ['chocolade', 'chocola', 'chocolate', 'choco', 'cacao', 'nougat', 'praline', 'bonbon', 'hazelnootpasta', 'nutella'], u: '1750765239895-1702df302671' },
  { m: ['koek', 'koekje', 'koekjes', 'biscuit', 'cookie', 'stroopwafel', 'beschuit', 'crackers', 'speculaas', 'speculoos', 'biscuits', 'evergreen', 'sultana', 'liga', 'bastogne', 'kano', 'gevulde koek', 'krakeling', 'spritsen', 'amandelkoek'], u: '1590080874088-eec64895b423' },
  { m: ['muesli'], u: '1702165637233-3afe8ef1ce8f' },
  { m: ['granola', 'crunchy'], u: '1568371676223-7e6fc0fa62b1' },
  { m: ['cornflakes', 'corn flakes'], u: '1736605406266-dbb985ef3325' },
  { m: ['ontbijtgranen', 'cereal', 'cruesli', 'special k'], u: '1714686650962-c5c4d33213b8' },
  { m: ['pannenkoek', 'pannenkoeken', 'pannekoek', 'pannekoeken', 'pancake', 'poffertjes', 'flensje'], u: '1490457843367-34b21b6ccd85' },
  { m: ['tomaat', 'tomaten', 'tomato', 'cherrytomaat'], u: '1571680322279-a226e6a4cc2a' },
  { m: ['ui', 'uien', 'onion', 'sjalot'], u: '1587735243474-5426387356db' },
  { m: ['champignon', 'champignons', 'paddenstoel', 'mushroom'], u: '1623491208688-82a9b3f4e5c9' },
  { m: ['sla', 'ijsbergsla', 'rucola', 'lettuce'], u: '1645712429486-9ace28487d1c' },
  { m: ['rozijn', 'rozijnen', 'raisin'], u: '1681122449774-e8ae4bc2cd92' },
  { m: ['dadel', 'dadels', 'date'], u: '1708335008926-e8b898da2ae9' },
  { m: ['kers', 'kersen', 'cherry'], u: '1594294809831-17b41563ba09' },
  { m: ['perzik', 'nectarine', 'peach'], u: '1642372849486-f88b963cb734' },
  { m: ['pruim', 'pruimen', 'plum'], u: '1623871257016-a33f6e20334c' },
  { m: ['watermeloen', 'watermelon'], u: '1595475207225-428b62bda831' },
  { m: ['bosvruchten', 'rood fruit', 'berries', 'mixed berries'], u: '1444459094717-a39f1e3e0903' },
  { m: ['worst', 'worstjes', 'rookworst', 'knakworst', 'sausage', 'salami', 'chorizo', 'cervelaat', 'fuet', 'leverworst', 'boterhamworst', 'frankfurter', 'knakworstjes', 'chorizo', 'metworst'], u: '1691480241974-92481cef09ff' },
  { m: ['ham', 'achterham', 'schouderham'], u: '1558888565-86add11fa452' },
  { m: ['spek', 'spekjes', 'bacon'], u: '1587316925366-326c1ca7b29e' },
  { m: ['soep', 'soup', 'bouillon'], u: '1608376630927-d064ac74866e' },
  { m: ['salade', 'salad'], u: '1546069901-ba9599a7e63c' },
  { m: ['noedels', 'noodles', 'mie', 'ramen'], u: '1569718212165-3a8278d5f624' },
  { m: ['friet', 'patat', 'frites', 'french fries'], u: '1639744091981-2f826321fae6' },
  { m: ['snoep', 'winegums', 'drop', 'gummy', 'candy', 'zuurtjes', 'marshmallow', 'spekjes snoep', 'zure matten', 'haribo', 'lolly', 'pepermunt', 'kauwgom'], u: '1534119428213-bd2626145164' },
  { m: ['popcorn'], u: '1622732776612-1232b64eb1a3' },
  { m: ['eiwitreep', 'proteinereep', 'protein bar', 'proteine reep'], u: '1606502632670-d75e08d15265' },
  { m: ['pesto'], u: '1628462626251-dc8abf27ece0' },
  { m: ['olijf', 'olijven', 'olive'], u: '1671047978143-7bd53da6fbf5' },
  { m: ['kokos', 'coconut'], u: '1554444510-592779e6e009' },
  { m: ['mais', 'corn'], u: '1776765828695-ad21c7f27504' },
  { m: ['erwt', 'erwten', 'doperwten', 'peas'], u: '1657144397150-4aa8a780b37b' },
  { m: ['sushi'], u: '1625938145312-c18f06f53be0' },
  { m: ['kebab', 'shoarma', 'doner', 'gyros'], u: '1773620494884-940e0db95e46' },
  { m: ['burger', 'hamburger', 'cheeseburger'], u: '1586190848861-99aa4a171e90' },
  { m: ['tosti', 'toastie', 'grilled cheese'], u: '1765100213033-ce0f38b4f478' },
  { m: ['wafel', 'wafels', 'waffle'], u: '1459789034005-ba29c5783491' },
  { m: ['donut', 'donuts', 'oliebol'], u: '1740872569638-0bacd19ed6bc' },
  { m: ['muffin', 'muffins', 'cupcake'], u: '1727245243406-8a0551900c13' },
  { m: ['aardappel', 'aardappelen', 'potato', 'potatoes', 'krieltjes', 'minikrieltjes', 'roseval', 'rosti', 'aardappelpartjes', 'kruimige'], u: '1659177652084-c4a7c4e0bf28' },
  { m: ['stamppot', 'hutspot', 'boerenkool', 'zuurkool', 'andijvie', 'aardappelpuree', 'puree', 'mashed'], u: '1636465033521-eccfdeda796b' },
  { m: ['lasagne', 'lasagna', 'ovenschotel'], u: '1730900737654-ac6d843139da' },
  { m: ['nasi', 'nasi goreng', 'goreng', 'gebakken rijst', 'fried rice'], u: '1611506168454-656b2c960868' },
  { m: ['mozzarella', 'burrata', 'buffelmozzarella'], u: '1625944526438-34ce2d80e575' },
  { m: ['falafel'], u: '1786174045076-1cd880429ef1' },
  { m: ['tofu', 'tempeh'], u: '1668434344247-5daf7c7aff63' },
  { m: ['kruiden', 'kruidenmix', 'specerijen', 'peper', 'kaneel', 'komijn', 'kerrie', 'oregano', 'paprikapoeder', 'nootmuskaat', 'kurkuma', 'spices'], u: '1589536677029-c0aa1808fba6' },
  { m: ['knoflook', 'garlic'], u: '1713209338544-e70e73a9e2af' },
  { m: ['pompoen', 'pumpkin', 'butternut'], u: '1569976710208-b52636b52c09' },
  { m: ['biet', 'bieten', 'rode biet', 'beetroot'], u: '1587486912758-4367d2015d6c' },
  { m: ['prei', 'leek'], u: '1784043436392-528eb29a2843' },
  { m: ['kool', 'rode kool', 'witte kool', 'spitskool', 'savooiekool', 'cabbage'], u: '1583116935756-f66cd999cdbe' },
  { m: ['brownie', 'brownies'], u: '1560788843-8928d12b1600' },
  { m: ['haring', 'herring', 'maatjes'], u: '1578005981119-759395e7b328' },
  { m: ['visfilet', 'pangasius', 'pangasiusfilet', 'kibbeling', 'lekkerbek', 'koolvis', 'schelvis', 'fish fillet'], u: '1676471926534-d5c9771909fa' },
  { m: ['americain', 'filet americain', 'tartaar', 'steak tartare'], u: '1676471920041-d6face1fd9d6' },
  { m: ['schnitzel', 'kipschnitzel', 'cordon bleu', 'wienerschnitzel'], u: '1585238342070-61e1e768b1ff' },
  { m: ['augurk', 'augurken', 'zilveruitjes', 'pickles', 'zuur'], u: '1650072395437-223b4906207d' },
  { m: ['lijnzaad', 'flax'], u: '1642497393440-4b5cc5f03ff5' },
  { m: ['sesam', 'sesamzaad', 'tahin', 'tahini'], u: '1708949125682-c0cb09727101' },
  { m: ['kombucha'], u: '1764146275574-00ec68c1fe9e' },
  { m: ['havermelk', 'sojamelk', 'amandelmelk', 'haverdrink', 'sojadrink', 'amandeldrink', 'plantdrink', 'rijstdrink', 'kokosdrink', 'oat milk', 'oatly', 'alpro'], u: '1644527125380-8453796ae4bb' },
  { m: ['curry', 'masala', 'rendang', 'korma', 'tikka', 'dahl', 'dal'], u: '1708782344490-9026aaa5eec7' },
  { m: ['bitterbal', 'bitterballen', 'kroket', 'kroketten', 'kaassouffle', 'frikandel', 'frikandellen'], u: '1708818296712-dede4ec86051' },
  { m: ['loempia', 'springroll', 'spring rolls', 'gyoza', 'dumplings'], u: '1671652640587-1d302c15a89f' },
  { m: ['gehaktbal', 'gehaktballen', 'balletjes', 'meatballs', 'soepballetjes'], u: '1632071773782-f68ef6109422' },
  { m: ['pate', 'leverpastei', 'patee'], u: '1580980981132-14f7e2b5b276' },
  { m: ['caramel', 'karamel', 'toffee', 'dulce de leche'], u: '1653750660628-49a3414cf892' },
  { m: ['noten', 'notenmix', 'studentenhaver', 'mixed nuts', 'nootjes'], u: '1614061813295-0e0f82273dc3' },
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
  snack: '1490474504059-bf2db5ab2348', default: '1518510227856-30619d542ea9',
}

// ── Koppelen: welk woord in de naam bepaalt de foto?
//
// Dit zocht een stukje tekst ergens in de naam, in lijstvolgorde. Daardoor
// kreeg "sinaasappelsap" de appel (appel staat eerder in de lijst), kreeg
// "aardbeien" eieren ("ei" zit in aardbei) en "Skyr Aardbei" aardbeien.
//
// Nu per woord:
//   - het merk tussen haakjes telt niet mee, en alles na "met", "en", "&"
//     ook niet (dat is de garnering: "Kwark met bosvruchten" is kwark)
//   - een trefwoord telt als heel woord (ook meervoud), als laatste deel van
//     een samenstelling (sinaasappelSAP, aardbeienJAM: in het Nederlands staat
//     het kernwoord achteraan) of als begin van een woord (KIPfilet)
//   - korte trefwoorden (ei, ui) alleen als heel woord
//   - productvormen (sap, jam, yoghurt, skyr, reep...) gaan voor ingrediënten:
//     "Skyr Aardbei" is skyr, "Sinaas-appel Banaan Sap" is sap
//   - daarna: het eerste woord wint ("Kip Rijst" is kip), en een langer,
//     specifieker trefwoord wint van een korter ("zoete aardappel")
const norm = (t) => String(t || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\([^)]*\)/g, ' ')
  .replace(/[^a-z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const SCHEIDING = / (met|en|in|op|zonder|of|and|with|on|op) /

// Productvormen: die bepalen wat het ís, ook als er een smaak bij staat.
const VORM = new Set([
  'sap', 'jus', 'appelsap', 'sinaasappelsap', 'orange juice', 'jam', 'yoghurt', 'skyr', 'kwark', 'magere kwark', 'vla',
  'whey', 'eiwitpoeder', 'proteine poeder', 'protein powder', 'isolaat', 'reep', 'eiwitreep', 'chips', 'ijs',
  'frisdrank', 'sinas', 'cola', 'limonade', 'energiedrank', 'smoothie', 'shake', 'siroop', 'thee', 'koffie',
  'pizza', 'croissant', 'taart', 'cake', 'saus', 'soep', 'salade', 'muesli', 'granola', 'cornflakes', 'pannenkoek',
  'koek', 'koekje', 'chocolade', 'snoep', 'drop', 'burger', 'friet', 'patat', 'tosti', 'wafel', 'stroopwafel',
  'donut', 'muffin', 'pudding', 'brood', 'wrap', 'bagel', 'pistolet', 'rijstwafel', 'crackers', 'beschuit',
  'pindakaas', 'hagelslag', 'hummus', 'pesto', 'mayonaise', 'ketchup', 'noedels', 'pasta', 'spaghetti', 'sushi',
  'kebab', 'popcorn', 'stamppot', 'lasagne', 'curry', 'kombucha', 'bier', 'wijn', 'cappucc', 'latte', 'ontbijtkoek', 'ontbijtgranen',
  'drinkyoghurt', 'roomijs', 'sorbet', 'worst', 'rookworst', 'salami',
])

// Ook "volkoren brood" en "sinaasappelsap" zijn een vorm: ze eindigen op één.
const isVorm = (k) => VORM.has(k) || [...VORM].some(v => !v.includes(' ') && k.endsWith(v))

const MEERVOUD = ['', 's', 'en', 'n', 'e', 'jes', 'tjes']

function zoekTreffer(woorden, sleutel) {
  // Trefwoord met spatie ("zoete aardappel"): als losse woorden achter elkaar.
  if (sleutel.includes(' ')) {
    const delen = sleutel.split(' ')
    for (let i = 0; i + delen.length <= woorden.length; i++) {
      if (delen.every((d, j) => woorden[i + j] === d || woorden[i + j].startsWith(d))) return { soort: 3, plek: i }
    }
    return null
  }
  let beste = null
  woorden.forEach((w, i) => {
    let soort = 0
    if (MEERVOUD.some(m => w === sleutel + m)) soort = 3
    else if (sleutel.length >= 3 && MEERVOUD.some(m => w.endsWith(sleutel + m))) soort = 2
    else if (sleutel.length >= 3 && w.startsWith(sleutel)) soort = 1
    if (soort && (!beste || soort > beste.soort)) beste = { soort, plek: i }
  })
  return beste
}

// Beste lokale of gecureerde foto voor deze naam, of null als niets past.
export function matchFoodImage(title, size = 200) {
  const volledig = norm(title)
  if (!volledig) return null
  const hoofd = volledig.split(SCHEIDING)[0].trim() || volledig
  const woorden = hoofd.split(' ')
  // Eerst per woord de beste treffer: heel woord boven staart boven begin, en
  // bij gelijk het langste trefwoord. Zo is "pannenkoeken" een pannenkoek en
  // niet (via de staart "koek") een koekje.
  const perWoord = new Map()
  for (const g of LOCAL) {
    for (const sleutel of g.m) {
      const k = norm(sleutel)
      if (!k) continue
      const t = zoekTreffer(woorden, k)
      if (!t) continue
      const kwaliteit = t.soort * 100 + k.length
      const huidig = perWoord.get(t.plek)
      if (!huidig || kwaliteit > huidig.kwaliteit) perWoord.set(t.plek, { kwaliteit, g, k, plek: t.plek, soort: t.soort })
    }
  }
  // Dan tussen de woorden: een productvorm (sap, skyr, jam) gaat voor een
  // ingrediënt, daarna het eerste woord.
  let beste = null
  for (const w of perWoord.values()) {
    const score = (isVorm(w.k) ? 1000 : 0) + w.soort * 100 - w.plek * 20 + w.k.length
    if (!beste || score > beste.score) beste = { score, g: w.g }
  }
  if (!beste) return null
  return beste.g.u ? U(beste.g.u, size) : `/food/${beste.g.f}`
}

// Volledige fallback-foto-URL. `size` alleen relevant voor de Unsplash-achtervang.
export function foodImageFallback(title, slot, size = 200) {
  const lokaal = matchFoodImage(title, size)
  if (lokaal) return lokaal
  // Geen match → gecureerde Unsplash o.b.v. slot, anders generiek.
  const s = slot === 'snack1' || slot === 'snack2' ? 'snack' : slot
  return U(UNS[s] || UNS.default, size)
}

// Een opgeslagen image_url die we niet vertrouwen:
//   - een Google-zoeklink (imgres) is geen afbeelding
//   - een Open Food Facts-verpakkingsfoto op een BASISPRODUCT (geen barcode):
//     die is ooit op naam gekoppeld en hoort bij een willekeurig merk
//     ("Sinaasappel" kreeg een Almhof-yoghurt). Dan liever onze eigen foto.
const onbetrouwbaar = (item) => {
  const url = String(item?.image_url || '')
  if (!url) return true
  if (/google\.[a-z.]+\/imgres/.test(url)) return true
  if (!item?.barcode && /openfoodfacts/.test(url)) return 'zwak'
  return false
}

export function resolveFoodImage(item, { size = 200 } = {}) {
  const naam = item?.name || item?.title || item?.product_name || item?.meal_name
  const oordeel = onbetrouwbaar(item)
  if (!oordeel) return item.image_url
  if (oordeel === 'zwak') return matchFoodImage(naam, size) || item.image_url
  return foodImageFallback(naam, item?.slot, size)
}
