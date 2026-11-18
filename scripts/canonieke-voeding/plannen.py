# Canonieke voedingsplannen (18 nov 2026). Rekent per kcal-trede de porties uit
# en schrijft regels.txt; bouw.sql zet ze in meal_plan_templates (uitvoeren via
# de Supabase SQL-editor). Regels: docs/regels-canonieke-voedingsplannen.md.
# De kcal-trede is de trainingsdag, mét banaan als pre-workout.
import json, itertools
# ingredient: id -> (naam, kcal, eiwit, koolh, vet) per 100 g
I = {
 'hav': ('66666666-6666-6666-6666-666666666666','Havermout',389,16.9,66.3,6.9),
 'kwa': ('1e447c05-f252-4d23-9774-6896247bd707','Magere Kwark',52,9,4,0.2),
 'bos': ('556dacd8-4454-488d-838f-e9ea363d73ba','Bosvruchten',45,0.9,10,0.4),
 'kom': ('77fab789-9042-40b0-a09d-8b7038718e69','Komkommer',16,0.7,3.6,0.1),
 'ban': ('11111111-1111-1111-1111-111111111124','Banaan',89,1.1,22.8,0.3),
 'ei8': ('88888888-8888-8888-8888-888888888888','Eieren',155,13,1.1,11),
 'bro': ('141c2042-ecd2-445f-a296-c071455c3e8e','Volkoren Brood',247,9,41,3.2),
 'kpl': ('cf31f399-a6d8-408c-94d3-2a06cb8be6f3','Kip plakjes',110,22,0,2),
 'bes': ('e510b132-eb21-4a88-a765-eff9f330ad5c','Blauwe bessen',57,0.7,14,0.3),
 'wra': ('14cdc6ec-056c-4b2e-a0d7-ed1b40cf4761','Volkoren Wrap',300,8,55,5),
 'eic': ('cfd7cdcd-7c1d-4fe3-81f1-a1f786eb82de','Eieren',144,12.5,1.1,10),
 'tom': ('1816463d-a34f-4a27-b6b7-6f952abe429e','Tomaat',18,0.9,3,0.2),
 'sla': ('b06f7b66-7636-43bb-9618-7c4b0261ce3a','Sla',14,0.9,3,0.1),
 'ol5': ('55555555-5555-5555-5555-555555555555','Olijfolie',884,0,0,100),
 'che': ('fc4ebc2f-a3f1-434e-8a38-cea308b41836','Cherry Tomaten',18,0.9,3.9,0.2),
 'kip': ('11111111-1111-1111-1111-111111111111','Kipfilet (rauw)',109,23,0,1.8),
 'ol7': ('11111111-1111-1111-1111-111111111137','Olijfolie',884,0,0,100),
 'pas': ('6e6242de-3bf7-4c6b-a329-e2075c52ee08','Volkoren Pasta',348,13.4,66.2,2.5),
 'zaa': ('e592db1b-4d2c-426c-a913-38c1468c62db','Zoete Aardappel',86,1.6,20.1,0.1),
 'brc': ('33333333-3333-3333-3333-333333333333','Broccoli',34,2.8,6.6,0.4),
 'avo': ('44444444-4444-4444-4444-444444444444','Avocado',160,2,8.5,14.7),
 'ole': ('52479aac-a04a-4da9-866b-87f1dc3deb96','Olijfolie (Extra Vierge)',884,0,0,100),
 'spi': ('28875a9b-bf47-4196-a5b6-d9b993a69932','Spinazie',23,2.9,3.6,0.4),
 'rij': ('cb041c9c-dd96-452d-bf56-bf17fb00c6c1','Zilvervliesrijst',370,7.9,77.2,2.9),
 'ter': ('11111111-1111-1111-1111-111111111135','Teriyaki Saus',89,5.9,15.5,0),
 'kri': ('7810fc8c-60b3-45bd-b450-ebf95977c6b1','Krieltjes',77,2,17,0.1),
 'app': ('0f90db53-8fbe-4255-914f-7b603e248986','Appel',52,0.3,13.8,0.2),
 'cra': ('3d262a7c-903d-4908-bbba-286e857ba949','Crackers',425,11,70,12),
 'cot': ('83908cb6-0f0b-48ff-b376-8cd9b1df6cd4','Cottage Cheese',98,11.1,3.4,4.3),
}
# rol: P eiwitbron, C koolhydraatbron, F vetbron, X vast. (stap, min, max)
STAP = {'hav':(5,20,150),'kwa':(50,250,500),'bro':(35,35,210),'kpl':(15,30,150),'wra':(60,60,240),'eic':(60,60,300),'ei8':(60,60,240),
        'kip':(10,100,240),'pas':(5,40,170),'zaa':(25,100,700),'rij':(5,30,170),'kri':(25,100,700),'avo':(25,0,75),
        'ole':(5,0,15),'ol5':(5,0,20),'ol7':(5,0,15)}
M = {
 'ontA': dict(id='15891a4b-44f4-4159-b607-e210f9f6a609', naam='Kwark met havermout en bosvruchten', ing=[('hav',60,'C'),('kwa',500,'P'),('bos',100,'X')]),
 'ontB': dict(id='16c6a9b4-8b65-4e56-a8a2-fd8fdff59dcc', naam='Ei met volkoren brood, kipfilet en fruit', ing=[('kom',40,'X'),('ban',120,'X'),('ei8',60,'F'),('bro',140,'C'),('kpl',100,'P'),('bes',60,'X')]),
 'lunA': dict(id='d67221a8-5fe9-4b83-a906-84bee3fe53d7', naam='Volkoren wrap met Ei & Kipfilet', ing=[('wra',120,'C'),('eic',240,'F'),('tom',40,'X'),('sla',30,'X'),('ol5',5,'X'),('kpl',50,'P')]),
 'lunB': dict(id='58c542cf-2739-45a3-bd02-a12de4c7a2ea', naam='Koude Pasta Salade met Kip', ing=[('che',110,'X'),('kom',90,'X'),('kip',120,'P'),('ol7',15,'O'),('pas',80,'C')]),
 'din1': dict(id='16c5791c-1744-4432-932a-eeae608a7015', naam='Kip met zoete aardappel en broccoli', ing=[('zaa',350,'C'),('brc',200,'X'),('kip',190,'P'),('avo',50,'F'),('ole',10,'O')]),
 'din2': dict(id='9227633a-2797-42af-9f59-e0840010868b', naam='Kip Rijst Spinazie Zoete Aardappel', ing=[('spi',200,'X'),('zaa',100,'X'),('kip',100,'P'),('ol7',5,'O'),('rij',70,'C')]),
 'din3': dict(id='126d7991-8f4a-4cd5-bd82-e9f65b48b0eb', naam='Kip Teriyaki', ing=[('brc',200,'X'),('ter',40,'X'),('kip',150,'P'),('rij',85,'C'),('ole',5,'O')]),
 'din4': dict(id='2d0acd81-2c46-4630-95e9-4a3bed85af2a', naam='Kip met Krieltjes uit de Oven', ing=[('spi',100,'X'),('kip',150,'P'),('kri',250,'C'),('ole',5,'O')]),
 'appel': dict(id='b99dcfd4-0d71-465c-bcb9-f37eaba89556', naam='Appel', ing=[('app',180,'X')]),
 'cot': dict(id='35172aeb-7e2d-483a-a430-27c42330ac8e', naam='Cottage cheese met cracker', ing=[('cra',25,'X'),('cot',200,'X')]),
}
BAN = (89,1.1,22.8,0.3)
def mac(k,g):
    _,_,c,p,kh,f = I[k]; return (c*g/100,p*g/100,kh*g/100,f*g/100)
def som(regels):
    t=[0,0,0,0]
    for k,g,_ in regels:
        m=mac(k,g)
        for i in range(4): t[i]+=m[i]
    return t
def rond(k,g):
    if k not in STAP: return g
    st,mn,mx = STAP[k]; return max(mn,min(mx,round(g/st)*st))

def bouw_dag(sleutels, kcal, eiwit, vet, bulk):
    """sleutels: lijst (slot, mealkey). kcal/eiwit/vet = doel van de maaltijden samen (zonder banaan)."""
    dag = {s:[list(x) for x in M[mk]['ing']] for s,mk in sleutels}
    # vetbronnen naar fase
    for s,r in dag.items():
        for x in r:
            if x[2]=='F':
                if x[0]=='avo': x[1] = 50 if bulk else 0
                elif x[0]=='eic': x[1] = 240 if bulk else 120
                elif x[0]=='ei8': x[1] = 120 if bulk else 60
    basis = {s:[list(x) for x in r] for s,r in dag.items()}
    def alles(): return [x for r in dag.values() for x in r]
    for _ in range(12):
        # eiwit
        t=som(alles()); P=[x for x in alles() if x[2]=='P']; pb=som(P)[1]
        if pb>0:
            f=(eiwit-(t[1]-pb))/pb
            for x in P: x[1]=rond(x[0], x[1]*f)
        # vet via olie
        t=som(alles()); O=[x for x in alles() if x[2]=='O']
        if O:
            tekort=vet-t[3]
            per=tekort/len(O)
            for x in O: x[1]=rond(x[0], x[1]+per)
        # olie zit aan zijn maximum en er is nog vet tekort: een ei erbij
        t=som(alles()); tekort=vet-t[3]
        if tekort>5:
            for x in alles():
                if x[2]=='F' and x[0] in ('eic','ei8') and x[1]+60<=STAP[x[0]][2]:
                    x[1]+=60; break
        # koolhydraten
        t=som(alles()); C=[x for x in alles() if x[2]=='C']; cb=som(C)[0]
        f=(kcal-(t[0]-cb))/cb
        for x in C: x[1]=rond(x[0], x[1]*f)
    # rest wegwerken met de fijnste koolhydraatbron (kleinste kcal per stap)
    for _ in range(40):
        t=som(alles()); d=kcal-t[0]
        if abs(d)<=20: break
        C=sorted([x for x in alles() if x[2]=='C'], key=lambda x: I[x[0]][2]*STAP[x[0]][0])
        gedaan=False
        for x in C:
            st,mn,mx=STAP[x[0]]; n=x[1]+(st if d>0 else -st)
            stapk=I[x[0]][2]*st/100
            if mn<=n<=mx and stapk<=abs(d)*1.6:
                x[1]=n; gedaan=True; break
        if not gedaan: break
    return dag

def tot(dag): return [round(v,1) for v in som([x for r in dag.values() for x in r])]

# treden: (groep, kcal trainingsdag, eiwit, vet, bulk)
TREDEN = [('Man',2000,170,62,False),('Man',2200,175,64,False),('Man',2400,180,68,False),
          ('Man',2600,170,78,True),('Man',2800,175,84,True),('Man',3000,180,90,True),
          ('Vrouw',1600,130,50,False),('Vrouw',1800,135,54,False),('Vrouw',2000,140,60,False),('Vrouw',2200,140,66,False)]
TIJD = {'breakfast':('07:30','Ontbijt'),'lunch':('12:30','Lunch'),'snack1':('15:30','Snack'),'dinner':('18:30','Diner'),'snack2':('21:00','Snack')}
DAGEN = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
uit=[]; rapport=[]
for groep,kc,ei,ve,bulk in TREDEN:
    for soort in ('Vast','Vast 3 maaltijden','Afwisselen'):
        dagen={}
        for di,dn in enumerate(DAGEN):
            if soort=='Afwisselen':
                o=['ontA','ontB'][di%2]; l=['lunA','lunB'][di%2]; d=['din1','din2','din3','din4'][di%4]
            else: o,l,d='ontA','lunA','din1'
            sl=[('breakfast',o),('lunch',l),('dinner',d)]
            if soort!='Vast 3 maaltijden':
                sl.insert(2,('snack1','appel'))
                if bulk: sl.append(('snack2','cot'))
            dag=bouw_dag(sl, kc-BAN[0], ei-BAN[1], ve-BAN[3], bulk)
            dagen[dn]=(sl,dag)
        tots=[tot(d) for _,d in dagen.values()]
        gem=[round(sum(t[i] for t in tots)/7) for i in range(4)]
        naam=f"{groep} | {kc} | {soort}"
        rapport.append((naam, gem[0]+89, gem[1]+1, gem[2]+23, gem[3], min(t[0] for t in tots)+89, max(t[0] for t in tots)+89, min(t[1] for t in tots), min(t[3] for t in tots)))
        uit.append(dict(naam=naam, groep=groep.lower(), n=len(dagen['monday'][0]),
            dagen={dn:[dict(slot=s, meal=M[mk]['id'], tijd=TIJD[s][0], label=TIJD[s][1], g={I[k][0]:g for k,g,_ in dag[s] if g>0}) for s,mk in sl] for dn,(sl,dag) in dagen.items()}))
print(f"{'plan':34} {'kcal':>5} {'E':>4} {'K':>4} {'V':>4} | kcal min-max | E min | V min")
for r in rapport: print(f"{r[0]:34} {r[1]:5} {r[2]:4} {r[3]:4} {r[4]:4} | {round(r[5])}-{round(r[6])} | {round(r[7])} | {round(r[8])}")
json.dump(uit, open('plannen.json','w'))
import os; print(len(uit), 'plannen,', os.path.getsize('plannen.json'), 'bytes')
# voorbeeld
for p in uit:
    if p['naam'] in ('Man | 2200 | Vast','Vrouw | 1600 | Vast','Man | 3000 | Vast 3 maaltijden'):
        print(p['naam']); 
        for m_ in p['dagen']['monday']:
            print('  ', m_['slot'], {next(v[1] for v in I.values() if v[0]==k):g for k,g in m_['g'].items()})

CODE={v[0]:k for k,v in I.items()}
MK={v['id']:k for k,v in M.items()}
regels=[]
for p in uit:
    dagen=p['dagen']
    def dagtekst(d): return ';'.join(f"{m_['slot']}={MK[m_['meal']]}:" + ','.join(f"{CODE[k]}{int(g)}" for k,g in m_['g'].items()) for m_ in d)
    teksten=[dagtekst(dagen[dn]) for dn in DAGEN]
    if len(set(teksten))==1: teksten=teksten[:1]
    regels.append(p['naam']+'|'+p['groep']+'|'+'/'.join(teksten))
open('regels.txt','w').write('\n'.join(regels))
print(sum(len(r) for r in regels),'tekens')
open('codes.sql','w').write(',\n'.join(f"('{k}','{v[0]}')" for k,v in I.items()))
open('meals.sql','w').write(',\n'.join(f"('{k}','{v['id']}')" for k,v in M.items()))
