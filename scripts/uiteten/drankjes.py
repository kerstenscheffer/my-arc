# scripts/uiteten/drankjes.py
#
# De drankjes van de tab Uiteten (18 nov 2026). Vervangt alle drankjes onder
# soort 'alle' in data.json en zet per drankje één onderdeel in delen.json
# (bestaande opbouw met meerdere onderdelen, zoals aperol spritz, blijft staan).
#
#   python3 drankjes.py   (schrijft data.json, delen.json en de twee bestanden bij de component)
#
# Rij: (groep, naam, portie, ml, kcal, eiwit, koolh, vet, keuze, zoekwoorden, kort)
#   kort = staat ook onderaan elk etentje; de rest vind je onder de tegel Drinken of via zoeken.
#   zoekwoorden = merken en andere namen waarop je het wilt vinden.
import json

D = [
 # ── Bier ──
 ('Bier', 'Bier', '1 fluitje of vaasje, 25 cl', 250, 110, 1, 8, 0, 'kan', 'pils biertje tap heineken amstel grolsch hertog jan jupiler bavaria brand fluitje vaasje', 1),
 ('Bier', 'Bier flesje', '1 flesje, 30 cl', 300, 130, 1, 10, 0, 'kan', 'pils pijpje flesje heineken amstel grolsch hertog jan', 0),
 ('Bier', 'Bier groot', '0,5 l', 500, 215, 2, 16, 0, 'zwaar', 'pils pint halve liter grote', 0),
 ('Bier', 'Alcoholvrij bier', '30 cl', 300, 70, 1, 15, 0, 'top', '0.0 nul heineken amstel malt alcoholvrij', 1),
 ('Bier', 'Weizen of witbier', '30 cl', 300, 135, 1.5, 11, 0, 'kan', 'weizen weissbier witbier hoegaarden erdinger paulaner wit', 0),
 ('Bier', 'Weizen of witbier groot', '0,5 l', 500, 225, 2.5, 18, 0, 'zwaar', 'weizen weissbier witbier hoegaarden erdinger paulaner halve liter', 0),
 ('Bier', 'Speciaalbier', '33 cl', 330, 210, 2, 16, 0, 'zwaar', 'speciaal bokbier herfstbok amber', 0),
 ('Bier', 'IPA of blond bier', '33 cl', 330, 185, 2, 14, 0, 'zwaar', 'ipa blond leffe affligem brand punk', 0),
 ('Bier', 'Tripel of dubbel', '33 cl', 330, 250, 2, 16, 0, 'zwaar', 'tripel dubbel quadrupel duvel la chouffe karmeliet westmalle chimay', 0),
 ('Bier', 'Corona of Desperados', '33 cl', 330, 150, 1, 12, 0, 'kan', 'corona desperados sol mexicaans bier', 0),
 ('Bier', 'Radler', '30 cl', 300, 120, 0.5, 21, 0, 'kan', 'radler citroen amstel', 0),
 ('Bier', 'Radler 0.0', '30 cl', 300, 70, 0.5, 16, 0, 'top', 'radler alcoholvrij nul', 0),
 ('Bier', 'Cider', '33 cl', 330, 165, 0, 20, 0, 'zwaar', 'cider apple bandit strongbow jillz', 0),
 # ── Wijn ──
 ('Wijn', 'Wijn rood of wit', '1 glas, 15 cl', 150, 125, 0, 3, 0, 'kan', 'wijntje rode witte chardonnay merlot sauvignon pinot grigio huiswijn', 1),
 ('Wijn', 'Rosé', '1 glas, 15 cl', 150, 120, 0, 4, 0, 'kan', 'rose roze wijn', 0),
 ('Wijn', 'Zoete witte wijn', '1 glas, 15 cl', 150, 150, 0, 12, 0, 'zwaar', 'zoet moezel moscato dessertwijn', 0),
 ('Wijn', 'Prosecco of cava', '1 glas', 120, 90, 0, 2, 0, 'kan', 'bubbels champagne mousserend cava prosecco', 0),
 ('Wijn', 'Fles wijn gedeeld, jouw helft', '37,5 cl', 375, 310, 0, 8, 0, 'zwaar', 'fles halve fles', 0),
 ('Wijn', 'Port of sherry', '1 glas, 6 cl', 60, 95, 0, 7, 0, 'kan', 'port sherry versterkte wijn', 0),
 ('Wijn', 'Glühwein', '1 mok, 20 cl', 200, 190, 0, 22, 0, 'zwaar', 'gluhwein warme wijn kerstmarkt', 0),
 ('Wijn', 'Sangria', '1 glas, 20 cl', 200, 160, 0, 16, 0, 'zwaar', 'sangria spaans', 0),
 # ── Cocktails ──
 ('Cocktails', 'Gin tonic', '1 glas', 250, 180, 0, 16, 0, 'zwaar', 'gin tonic gt g&t hendricks', 1),
 ('Cocktails', 'Gin tonic met light tonic', '1 glas', 250, 105, 0, 1, 0, 'kan', 'gin tonic light slimline zero', 0),
 ('Cocktails', 'Aperol spritz', '1 glas', 180, 160, 0, 18, 0, 'zwaar', 'aperol spritz', 0),
 ('Cocktails', 'Mojito', '1 glas', 250, 200, 0, 20, 0, 'zwaar', 'mojito rum munt', 0),
 ('Cocktails', 'Espresso martini', '1 glas', 110, 220, 0, 16, 0, 'zwaar', 'espresso martini', 0),
 ('Cocktails', 'Pornstar martini', '1 glas', 150, 230, 0, 22, 0, 'zwaar', 'pornstar passion fruit martini', 0),
 ('Cocktails', 'Moscow mule', '1 glas', 250, 190, 0, 18, 0, 'zwaar', 'moscow mule ginger beer wodka', 0),
 ('Cocktails', 'Piña colada', '1 glas', 250, 320, 1, 34, 9, 'zwaar', 'pina colada kokos', 0),
 ('Cocktails', 'Cosmopolitan', '1 glas', 120, 190, 0, 12, 0, 'zwaar', 'cosmopolitan cosmo', 0),
 ('Cocktails', 'Long Island iced tea', '1 glas', 300, 290, 0, 22, 0, 'zwaar', 'long island ice tea', 0),
 ('Cocktails', 'Negroni', '1 glas', 90, 200, 0, 12, 0, 'zwaar', 'negroni campari', 0),
 ('Cocktails', 'Whiskey sour', '1 glas', 120, 190, 0, 14, 0, 'zwaar', 'whiskey sour amaretto sour', 0),
 ('Cocktails', 'Hugo', '1 glas', 200, 170, 0, 16, 0, 'zwaar', 'hugo vlierbloesem spritz', 0),
 ('Cocktails', 'Cocktail (mojito, aperol spritz)', '1 glas, als je niet weet welke', 250, 200, 0, 18, 0, 'zwaar', 'cocktail mixdrankje', 0),
 ('Cocktails', 'Mocktail of virgin mojito', '1 glas', 250, 110, 0, 27, 0, 'kan', 'mocktail virgin alcoholvrije cocktail', 0),
 # ── Sterk en mix ──
 ('Sterk en mix', 'Whisky, rum of wodka puur', '1 glas, 4 cl', 40, 95, 0, 0, 0, 'kan', 'whisky whiskey rum wodka vodka cognac gin puur on the rocks', 0),
 ('Sterk en mix', 'Shotje (sterke drank)', '3 cl', 30, 70, 0, 1, 0, 'kan', 'shot shotje tequila sambuca', 0),
 ('Sterk en mix', 'Jägermeister of likeurshot', '3 cl', 30, 75, 0, 4, 0, 'kan', 'jagermeister jager shot flugel', 0),
 ('Sterk en mix', 'Jenever of vieux', '1 glaasje, 3,5 cl', 35, 75, 0, 0, 0, 'kan', 'jenever vieux borrel jonge oude', 0),
 ('Sterk en mix', 'Likeur (Licor 43, Baileys)', '1 glas, 4 cl', 40, 130, 0.5, 12, 3, 'zwaar', 'likeur licor 43 baileys amaretto limoncello', 0),
 ('Sterk en mix', 'Rum of wodka cola', '1 glas', 210, 170, 0, 18, 0, 'zwaar', 'baco bacardi cola rum cola wodka cola mix', 0),
 ('Sterk en mix', 'Rum of wodka cola zero', '1 glas', 210, 95, 0, 0, 0, 'kan', 'baco zero bacardi cola light', 0),
 ('Sterk en mix', 'Wodka met energydrink', '1 glas', 290, 190, 0, 22, 0, 'zwaar', 'wodka redbull vodka red bull', 0),
 ('Sterk en mix', 'Irish coffee', '1 glas', 200, 210, 1, 12, 10, 'zwaar', 'irish coffee koffie met whisky spaanse koffie', 0),
 # ── Fris en water ──
 ('Fris en water', 'Frisdrank', '1 glas, 25 cl', 250, 105, 0, 26, 0, 'zwaar', 'cola fanta sprite sinas cassis 7up pepsi fris', 1),
 ('Fris en water', 'Frisdrank zero of light', '1 glas', 250, 2, 0, 0, 0, 'top', 'cola zero light pepsi max sprite zero fanta zero', 1),
 ('Fris en water', 'Water of spa rood', '1 glas', 250, 0, 0, 0, 0, 'top', 'water spa blauw rood bruis plat kraanwater', 1),
 ('Fris en water', 'IJsthee of appelsap', '1 glas, 25 cl', 250, 100, 0, 24, 0, 'zwaar', 'ice tea ijsthee lipton fuze appelsap', 0),
 ('Fris en water', 'Tonic of bitter lemon', '1 flesje, 20 cl', 200, 75, 0, 18, 0, 'kan', 'tonic bitter lemon', 0),
 ('Fris en water', 'Ginger beer of ginger ale', '1 flesje, 20 cl', 200, 80, 0, 20, 0, 'kan', 'ginger beer ale gember', 0),
 ('Fris en water', 'Energydrink', '1 blikje, 25 cl', 250, 115, 0, 28, 0, 'zwaar', 'red bull redbull monster energy', 0),
 ('Fris en water', 'Energydrink zero', '1 blikje, 25 cl', 250, 5, 0, 0, 0, 'top', 'red bull zero sugarfree monster zero', 0),
 ('Fris en water', 'Sportdrank', '1 flesje, 33 cl', 330, 85, 0, 21, 0, 'kan', 'aa drink aquarius isostar sportdrank', 0),
 ('Fris en water', 'Chocomel', '1 glas, 25 cl', 250, 210, 8, 30, 6.5, 'zwaar', 'chocomel chocolademelk koud', 0),
 ('Fris en water', 'Fristi', '1 glas, 25 cl', 250, 150, 7, 26, 1.5, 'kan', 'fristi drinkyoghurt', 0),
 # ── Koffie en thee ──
 ('Koffie en thee', 'Koffie of thee zwart', '1 kop', 150, 2, 0, 0, 0, 'top', 'koffie espresso americano lungo thee zwart filter', 1),
 ('Koffie en thee', 'Cappuccino', '1 kop', 180, 80, 4, 6, 4, 'kan', 'cappuccino cappucino', 1),
 ('Koffie en thee', 'Cappuccino met havermelk', '1 kop', 180, 90, 2, 12, 4, 'kan', 'cappuccino havermelk oat sojamelk plantaardig', 0),
 ('Koffie en thee', 'Latte macchiato', '1 glas', 250, 130, 7, 10, 7, 'kan', 'latte macchiato koffie verkeerd', 0),
 ('Koffie en thee', 'Flat white', '1 kop', 180, 110, 6, 9, 6, 'kan', 'flat white', 0),
 ('Koffie en thee', 'IJskoffie of iced latte', '1 glas', 300, 150, 6, 18, 6, 'kan', 'ijskoffie iced latte iced coffee', 0),
 ('Koffie en thee', 'Frappuccino of ijskoffie met slagroom', '1 groot glas', 400, 350, 5, 50, 14, 'zwaar', 'frappuccino starbucks ijskoffie slagroom karamel', 0),
 ('Koffie en thee', 'Chai latte', '1 glas', 300, 190, 6, 30, 5, 'zwaar', 'chai latte', 0),
 ('Koffie en thee', 'Warme chocolademelk', '1 mok', 250, 190, 8, 28, 5, 'zwaar', 'warme chocomel chocolademelk', 0),
 ('Koffie en thee', 'Warme chocolademelk met slagroom', '1 mok', 275, 290, 8, 34, 13, 'zwaar', 'warme chocomel met slagroom', 0),
 ('Koffie en thee', 'Verse muntthee met honing', '1 glas', 260, 40, 0, 10, 0, 'top', 'muntthee verse munt gemberthee', 0),
 ('Koffie en thee', 'Thee met suiker', '1 kop', 200, 20, 0, 5, 0, 'top', 'thee suiker', 0),
 # ── Sap en shakes ──
 ('Sap en shakes', 'Verse jus d\'orange', '1 glas', 250, 110, 2, 24, 0, 'kan', 'jus sinaasappelsap verse sap', 0),
 ('Sap en shakes', 'Appelsap of ander vruchtensap', '1 glas, 25 cl', 250, 115, 0, 28, 0, 'zwaar', 'appelsap vruchtensap multivitamine', 0),
 ('Sap en shakes', 'Tomatensap', '1 flesje, 20 cl', 200, 35, 1.5, 7, 0, 'top', 'tomatensap', 0),
 ('Sap en shakes', 'Smoothie', '1 glas', 300, 220, 4, 46, 2, 'kan', 'smoothie fruit', 0),
 ('Sap en shakes', 'Milkshake', '1 middel', 375, 480, 11, 72, 16, 'zwaar', 'milkshake', 0),
 ('Sap en shakes', 'Proteïneshake met water', '1 shake', 330, 120, 24, 3, 1.5, 'top', 'eiwitshake proteine shake whey', 0),
 ('Sap en shakes', 'Kokoswater', '1 pakje, 33 cl', 330, 65, 0, 15, 0, 'kan', 'kokoswater', 0),
]

ALCOHOL = {'Bier', 'Wijn', 'Cocktails', 'Sterk en mix'}
GEEN_ALCOHOL = {'Alcoholvrij bier', 'Radler 0.0', 'Mocktail of virgin mojito'}

d = json.load(open('data.json'))
alle = [x for x in d if x[0] == 'alle'][0][1]
rest = [r for r in alle if r[0] != 'drank']
nieuw = [['drank', naam, portie, kcal, e, kh, v, keuze, zoek, groep, kort] for (groep, naam, portie, ml, kcal, e, kh, v, keuze, zoek, kort) in D]
alle[:] = nieuw + rest
t = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
open('data.json', 'w').write(t)
open('../../src/modules/meal-plan/components/food-log/uitetenGerechten.json', 'w').write(t)

for pad, kw in [('../../src/modules/meal-plan/components/food-log/uitetenDelen.json', dict(separators=(',', ':'))), ('delen.json', dict(indent=1))]:
    o = json.load(open(pad))
    for (groep, naam, portie, ml, kcal, e, kh, v, keuze, zoek, kort) in D:
        sleutel = f'alle|drank|{naam}'
        bestaand = o.get(sleutel)
        if bestaand and len(bestaand) > 1:
            continue  # opbouw met losse onderdelen laten staan
        f = 100 / ml
        deel = {'n': naam, 'g': ml, 'k': round(kcal * f, 1), 'e': round(e * f, 2), 'kh': round(kh * f, 2), 'v': round(v * f, 2), 'st': ['glas', ml]}
        if groep in ALCOHOL and naam not in GEEN_ALCOHOL:
            deel['alcohol'] = True
        o[sleutel] = [deel]
    json.dump(o, open(pad, 'w'), ensure_ascii=False, **kw)
print(len(D), 'drankjes')
