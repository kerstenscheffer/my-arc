#!/usr/bin/env python3
"""Reel-variant B-roll (19 nov 2026): slide-tekst in dik wit over eigen B-roll, met muziek. Geen stem, geen ondertitels.
Staat naast reel_edit.py (praatreel) en raakt die niet. Aanroep via scripts/reel-gino.mjs (draait in ~/Gino/reel-venv).

  reel_broll.py monteer <map> <config.json>    render naar <map>/<uit>/
  reel_broll.py blad <uit-map>                 overzichtsbladen van alle clips in ~/Gino/reel-assets/broll en van de mascottes

Config (docs/reel-werkwijze.md): shots = [{tekst, mascotte?, broll: "map/clip.mp4" of een lijst, duur?}], muziek, caption.
tekst = één blok of een lijst blokken. Een blok is 2 tot 3 regels groot wit, met precies één kernwoord tussen *sterretjes*:
dat woord wordt geel. De blokken van een shot komen na elkaar; de B-roll loopt eronder door en de mascotte blijft staan.
Stijl (Kersten, 19 nov 2026): Poppins Bold wit met donkere rand, één kernwoord geel, mascotte boven de tekst waar hij past.
"""
import itertools, json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FPS = 30
W, H = 1080, 1920
FONT = os.path.expanduser('~/Gino/reel-assets/fonts/Poppins-Bold.ttf')
BROLL = os.path.expanduser('~/Gino/reel-assets/broll')
# Gym-B-roll uit Drive 'B-ROLL  MAP' (20 nov 2026) staat in een eigen map; in de config als "broll-gym/<map>/<clip>".
BROLL_GYM, GYM_VOOR = os.path.expanduser('~/Gino/reel-assets/broll-gym'), 'broll-gym/'
MASCOTTES = os.path.expanduser('~/Gino/reel-assets/mascottes')
TEKST_MAX, TEKST_MIN = 96, 80            # lettergrootte: groot zoals Kerstens voorbeeld, krimpt per shot tot elk blok in 3 regels past
MAX_B, MAX_REGELS, REGEL = 950, 3, 1.16  # breedte van een regel, regels per blok, regelafstand
TEKST_Y = 800                            # bovenkant van de eerste regel, in elk shot gelijk: de tekst springt niet en de mascotte past erboven
WIT, GEEL = (255, 255, 255), (255, 198, 41)   # geel = #FFC629, alleen voor het kernwoord
RAND, SCHADUW = 3, 9                     # donkere rand om de letters plus een zachte schaduw: leesbaar op licht eten
DIM = 60                                 # zwart over de B-roll (0-255); de rand doet de rest
MASCOTTE_H, MASCOTTE_B, MASCOTTE_LUCHT = 300, 430, 14   # hoogte, grootste breedte, ruimte tot de tekst (nooit eroverheen)
MASCOTTE_IN = 0.45                       # rustig binnenkomen: in 0,45 s zichtbaar en iets groter, onderkant blijft staan
MASCOTTE_PLEK = {'midden': 0, 'links': -260, 'rechts': 260}   # opzij als hij anders over Kerstens gezicht staat
FADE = 0.15                              # zachte overgang tussen clips (briefing punt 6)
ZOOM = 0.045                             # rustige schaalbeweging per clip: 100% naar 104,5%
TEMPO, BASIS, MIN_SHOT = 0.28, 0.7, 2.5  # leestijd per shot: BASIS + TEMPO per woord, nooit korter dan MIN_SHOT
BLOK_VAST, MIN_BLOK = 1.0, 0.9           # elk tekstblok krijgt een vaste seconde, de rest van het shot gaat naar rato van de woorden

snap = lambda t: round(t * FPS) / FPS


def run(a):
    subprocess.run(a, check=True)


def duur_van(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def clip_pad(rel):
    """Pad van een clip uit de config: 'broll-gym/…' komt uit de gym-map, de rest uit de gewone B-roll-map. None als hij daar niet staat."""
    wortel, r = (BROLL_GYM, rel[len(GYM_VOOR):]) if rel.startswith(GYM_VOOR) else (BROLL, rel)
    pad = os.path.realpath(os.path.join(wortel, r))
    return pad if pad.startswith(os.path.realpath(wortel) + os.sep) and os.path.isfile(pad) else None


def clips():
    uit = []
    for wortel, voor in ((BROLL, ''), (BROLL_GYM, GYM_VOOR)):
        for basis, _, namen in os.walk(wortel):
            for n in namen:
                if n.lower().endswith(('.mp4', '.mov', '.m4v')) and not n.startswith('.'):
                    uit.append(voor + os.path.relpath(os.path.join(basis, n), wortel))
    return sorted(uit)


def mascottes():
    if not os.path.isdir(MASCOTTES):
        return []
    return sorted(n[:-4] for n in os.listdir(MASCOTTES) if n.endswith('.png') and not n.startswith(('.', '_')))


def blad(uit):
    """Eén beeld uit het midden van elke clip, met naam eronder: kijken wat er echt in zit voor je kiest."""
    os.makedirs(uit, exist_ok=True)
    ft = ImageFont.truetype(FONT, 15)
    tw, th, lh, kol, rij = 180, 320, 44, 8, 5
    lijst, bladen, tmp = clips(), [], os.path.join(uit, '_t.jpg')
    for b in range(0, len(lijst), kol * rij):
        deel = lijst[b:b + kol * rij]
        im = Image.new('RGB', (kol * tw, math.ceil(len(deel) / kol) * (th + lh)), 'black')
        d = ImageDraw.Draw(im)
        for i, rel in enumerate(deel):
            p = clip_pad(rel)
            run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{duur_van(p) / 2:.2f}', '-i', p, '-frames:v', '1',
                 '-vf', f'scale={tw}:{th}:force_original_aspect_ratio=increase,crop={tw}:{th}', tmp])
            x, y = (i % kol) * tw, (i // kol) * (th + lh)
            im.paste(Image.open(tmp), (x, y))
            naam, regels = os.path.splitext(os.path.basename(rel))[0], ['']
            for w in naam.split():
                proef = (regels[-1] + ' ' + w).strip()
                if regels[-1] and ft.getlength(proef) > tw - 8:
                    regels.append(w)
                else:
                    regels[-1] = proef
            for n, r in enumerate(regels[:2]):
                d.text((x + 4, y + th + 3 + n * 19), r, font=ft, fill='white')
        pad = os.path.join(uit, f'blad-{b // (kol * rij) + 1}.jpg')
        im.save(pad, quality=88)
        bladen.append(pad)
    if os.path.exists(tmp):
        os.remove(tmp)
    # Mascottes: één blad met de naam eronder. Die naam zet je in de config.
    namen, mblad = mascottes(), None
    if namen:
        mk = 6
        im = Image.new('RGB', (mk * 200, math.ceil(len(namen) / mk) * 230), (40, 40, 40))
        d = ImageDraw.Draw(im)
        for i, n in enumerate(namen):
            m = Image.open(os.path.join(MASCOTTES, f'{n}.png')).convert('RGBA').resize((190, 190))
            im.paste(m, ((i % mk) * 200 + 5, (i // mk) * 230 + 5), m)
            d.text(((i % mk) * 200 + 8, (i // mk) * 230 + 202), n, font=ft, fill='white')
        mblad = os.path.join(uit, 'mascottes.jpg')
        im.save(mblad, quality=88)
    print(json.dumps({'map': BROLL, 'gym_map': BROLL_GYM, 'clips': [{'clip': c, 's': round(duur_van(clip_pad(c)), 1)} for c in lijst],
                      'bladen': bladen, 'mascottes': namen, 'mascotte_blad': mblad}, ensure_ascii=False))


def ontleed(blok):
    """'Niet gokken, maar *uitrekenen*' wordt per vaste regel een lijst (woord, geel). Precies één kernwoord per blok."""
    stukken, geel = [], 0
    for alinea in blok.split('\n'):
        woorden = []
        for w in alinea.split():
            g = len(w) > 2 and w.startswith('*') and w.endswith('*')
            if g:
                w = w[1:-1]
            if '*' in w:
                sys.exit(f'Sterretjes horen om één heel woord, leestekens erbij (*uitrekenen.*): {blok}')
            geel += g
            woorden.append((w, g))
        if woorden:
            stukken.append(woorden)
    if geel != 1:
        sys.exit(f'Elk tekstblok heeft precies één kernwoord tussen *sterretjes* (nu {geel}): {blok}')
    return stukken


def verdeel(woorden, ft, minimaal):
    """Beste verdeling over hoogstens 3 regels binnen MAX_B: gelijkmatig gevuld, liever breken na een leesteken,
    en het kernwoord mag alleen op de laatste regel staan (zoals in Kerstens voorbeeld). None als het niet past.
    Bevalt de uitkomst niet, zet dan zelf een regeleinde in de tekst."""
    n, beste = len(woorden), None
    for regels in range(min(minimaal, n), min(MAX_REGELS, n) + 1):
        for sneden in itertools.combinations(range(1, n), regels - 1):
            grenzen = [0, *sneden, n]
            delen = [woorden[grenzen[i]:grenzen[i + 1]] for i in range(regels)]
            breed = [ft.getlength(' '.join(w for w, _ in d)) for d in delen]
            if max(breed) > MAX_B:
                continue
            kost = (max(breed) - min(breed)) / 2 + 60 * regels
            kost -= sum(90 if woorden[x - 1][0][-1] in '.!?:' else 60 if woorden[x - 1][0][-1] in ',;' else 0 for x in sneden)
            kost -= 80 * (regels > 1 and len(delen[-1]) == 1 and delen[-1][0][1])
            if beste is None or kost < beste[0]:
                beste = (kost, delen)
    return beste[1] if beste else None


def zet_shot(blokken, waar):
    """Eén lettergrootte per shot: de grootste waarbij elk blok in hoogstens 3 regels past. Een eigen regeleinde blijft staan."""
    for grootte in range(TEKST_MAX, TEKST_MIN - 1, -4):
        ft = ImageFont.truetype(FONT, grootte)
        gezet = []
        for stukken in blokken:
            regels = []
            for woorden in stukken:
                r = verdeel(woorden, ft, 2 if len(stukken) == 1 and len(woorden) >= 3 else 1)
                regels = None if r is None or regels is None else regels + r
            gezet.append(regels if regels and len(regels) <= MAX_REGELS else None)
        if all(gezet):
            return ft, grootte, gezet
    sys.exit(f'{waar}: een tekstblok past niet in {MAX_REGELS} regels. Verdeel de tekst over meer blokken (woordelijk, niets schrappen).')


def tekstlaag(regels, ft, grootte):
    """Doorzichtige laag met één tekstblok: wit, kernwoord geel, donkere rand en zachte schaduw."""
    stap, kap = round(grootte * REGEL), -ft.getbbox('Hkdl', anchor='ls')[1]
    plek = []
    for i, regel in enumerate(regels):
        x = (W - ft.getlength(' '.join(w for w, _ in regel))) / 2
        for j, (w, g) in enumerate(regel):
            voor = ft.getlength(' '.join(v for v, _ in regel[:j]) + ' ') if j else 0
            plek.append((x + voor, TEKST_Y + kap + i * stap, w, g))

    def masker(kies, rand=0, dy=0):
        m = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(m)
        for x, y, w, g in plek:
            if kies is None or g == kies:
                d.text((x, y + dy), w, font=ft, fill=255, anchor='ls', stroke_width=rand, stroke_fill=255)
        return m

    def kleur(rgb, m):
        laag = Image.new('RGBA', (W, H), rgb + (0,))
        laag.putalpha(m)
        return laag

    schaduw = masker(None, RAND + 2, 6).filter(ImageFilter.GaussianBlur(SCHADUW)).point(lambda v: min(255, int(v * 1.7)))
    img = kleur((0, 0, 0), schaduw)
    for laag in (kleur((10, 10, 10), masker(None, RAND).point(lambda v: v * 235 // 255)), kleur(WIT, masker(False)), kleur(GEEL, masker(True))):
        img = Image.alpha_composite(img, laag)
    return img


def mascotte(naam, plek='midden'):
    """Mascotte op maat met een zachte schaduw eromheen. Alleen PNG's met een transparante achtergrond."""
    pad = os.path.join(MASCOTTES, f'{naam}.png')
    if naam not in mascottes():
        sys.exit(f"Mascotte niet gevonden: {naam}. Kies uit: {', '.join(mascottes())}. Past er geen, laat \"mascotte\" dan weg.")
    if plek not in MASCOTTE_PLEK:
        sys.exit(f'"mascotte_plek" is midden, links of rechts (nu: {plek}).')
    im = Image.open(pad).convert('RGBA')
    a = im.getchannel('A').point(lambda v: 0 if v < 24 else 255 if v > 240 else v)
    if a.histogram()[0] < 0.1 * im.width * im.height:
        sys.exit(f'Mascotte {naam} heeft geen transparante achtergrond. Maak hem vrij of laat hem weg.')
    im.putalpha(a)
    im = im.crop(a.getbbox())
    s = min(MASCOTTE_H / im.height, MASCOTTE_B / im.width)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    r = 30  # ruimte om de mascotte voor de schaduw: witte mascottes (kwark, rijst) vallen anders weg op licht eten
    sch = Image.new('L', (im.width + 2 * r, im.height + 2 * r), 0)
    sch.paste(im.getchannel('A'), (r, r + 6))
    doek = Image.new('RGBA', sch.size, (0, 0, 0, 0))
    doek.putalpha(sch.filter(ImageFilter.GaussianBlur(12)).point(lambda v: v * 150 // 255))
    doek.alpha_composite(im, (r, r))
    return doek, r, MASCOTTE_PLEK[plek]


def kader(tekst, sprite, p):
    """Eén beeld van de laag over de B-roll: zwart waas, mascotte (p = hoe ver hij binnen is, 0-1) en daaroverheen de tekst."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, DIM))
    if sprite:
        doek, r, dx = sprite
        s = 0.88 + 0.12 * p
        m = doek if p >= 1 else doek.resize((round(doek.width * s), round(doek.height * s)), Image.BILINEAR)
        if p < 1:
            m.putalpha(m.getchannel('A').point(lambda v: int(v * p)))
        # De onderkant van de mascotte staat vast boven de tekst; groeien doet hij naar boven.
        img.alpha_composite(m, (round((W - m.width) / 2) + dx, round(TEKST_Y - MASCOTTE_LUCHT + r * s - m.height)))
    img.alpha_composite(tekst)
    return img


def monteer(map_, cfg_pad):
    os.chdir(map_)
    cfg = json.load(open(cfg_pad))
    uit = cfg['uit']
    os.makedirs(f'{uit}/lagen', exist_ok=True)
    tempo = float(cfg.get('tempo', TEMPO))
    zoom = float(cfg.get('zoom', ZOOM))

    # 1. Shots en de clips eronder. Elke clip krijgt FADE extra aan het eind voor de overgang naar de volgende.
    shots, delen = [], []
    for n, s in enumerate(cfg['shots']):
        ruw = [b.strip() for b in (s['tekst'] if isinstance(s['tekst'], list) else [s['tekst']])]
        blokken = [ontleed(b) for b in ruw]
        woorden = [sum(len(r) for r in b) for b in blokken]
        d = snap(float(s.get('duur') or max(MIN_SHOT, BASIS + tempo * sum(woorden))))
        # Elk blok een vaste seconde, de rest naar rato van het aantal woorden: een kort blok flitst niet weg.
        vast = min(BLOK_VAST, d / len(woorden) / 2)
        duren = [snap(vast + (d - vast * len(woorden)) * w / sum(woorden)) for w in woorden[:-1]]
        duren.append(snap(d - sum(duren)))
        if min(duren) < MIN_BLOK:
            sys.exit(f'Shot {n + 1}: een tekstblok staat korter dan {MIN_BLOK} s. Geef het shot een langere "duur" of minder blokken.')
        bron = s['broll'] if isinstance(s['broll'], list) else [s['broll']]
        per = snap(d / len(bron))
        for i, rel in enumerate(bron):
            pad = clip_pad(rel)
            if not pad:
                sys.exit(f'B-roll niet gevonden in {BROLL} of {BROLL_GYM}: {rel}. Alleen Kerstens eigen beelden uit die mappen, geen stock.')
            delen.append({'shot': n, 'clip': rel, 'pad': pad, 'duur': per if i < len(bron) - 1 else snap(d - per * (len(bron) - 1))})
        shots.append({'tekst': [b.replace('*', '') for b in ruw], 'duur': d, 'clips': bron, 'mascotte': s.get('mascotte') or None,
                      'mascotte_plek': s.get('mascotte_plek') or 'midden', '_blokken': blokken, '_duren': duren})
    totaal = snap(sum(s['duur'] for s in shots))
    for i, x in enumerate(delen):
        x['nodig'] = x['duur'] + (FADE if i < len(delen) - 1 else 0)
        beschikbaar = duur_van(x['pad'])
        if x['nodig'] > beschikbaar + 0.02:
            sys.exit(f"Shot {x['shot'] + 1}: clip {x['clip']} duurt {beschikbaar:.1f} s en er is {x['nodig']:.1f} s nodig. "
                     'Geef dit shot een lijst met een extra clip.')
        x['van'] = round(max(0, (beschikbaar - x['nodig']) / 2), 3)  # midden van de clip: begin en eind zijn vaak onrustig
    gebruikt = [x['clip'] for x in delen]
    dubbel = sorted({c for c in gebruikt if gebruikt.count(c) > 1})

    # 2. Lagen: één doorzichtig beeld per tekstblok, hard gewisseld. Alleen het binnenkomen van de mascotte is beeld voor beeld.
    regels, kijk, t = [], [], 0.0

    def beeld(img, naam, duur):
        p = f'{uit}/lagen/{naam}.png'
        img.save(p, compress_level=1)
        regels.append(f"file '{os.path.abspath(p)}'\nduration {duur:.6f}")

    for n, s in enumerate(shots):
        ft, grootte, gezet = zet_shot(s.pop('_blokken'), f'Shot {n + 1}')
        sprite = mascotte(s['mascotte'], s['mascotte_plek']) if s['mascotte'] else None
        s.update(van=round(t, 2), tot=round(t + s['duur'], 2), lettergrootte=grootte, blokken=[])
        for j, (blok, duur) in enumerate(zip(gezet, s.pop('_duren'))):
            tekst, rest = tekstlaag(blok, ft, grootte), duur
            if sprite and j == 0:
                stappen = round(MASCOTTE_IN * FPS)
                for i in range(stappen):
                    beeld(kader(tekst, sprite, 1 - (1 - (i + 1) / (stappen + 1)) ** 3), f'{n:02d}-{j}-{i:02d}', 1 / FPS)
                rest -= stappen / FPS
            beeld(kader(tekst, sprite, 1), f'{n:02d}-{j}', rest)
            s['blokken'].append({'regels': [' '.join(w for w, _ in r) for r in blok], 'geel': next(w for r in blok for w, g in r if g),
                                 'van': round(t, 2), 'tot': round(t + duur, 2)})
            kijk.append(t + duur * 0.7)
            t += duur
    regels.append(regels[-1].split('\n')[0])
    open(f'{uit}/lagen.txt', 'w').write('\n'.join(regels) + '\n')

    # 3. Beeld: clips op 9:16, rustige zoom (op dubbele grootte berekend, anders schokt hij), zachte overgang ertussen.
    invoer, fc = [], ''
    for i, x in enumerate(delen):
        invoer += ['-ss', f"{x['van']:.3f}", '-t', f"{x['nodig'] + 0.2:.3f}", '-i', x['pad']]
        beelden = round(x['nodig'] * FPS)
        beweging = (f"scale={W * 2}:{H * 2}:flags=bicubic,zoompan=z='1+{zoom}*on/{beelden}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
                    f':d=1:s={W}x{H}:fps={FPS},') if zoom else ''
        fc += (f'[{i}:v]fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,{beweging}'
               f"trim=duration={x['nodig']:.4f},setpts=PTS-STARTPTS,format=yuv420p[s{i}];")
    vorige, start = '[s0]', 0.0
    for i in range(1, len(delen)):
        start += delen[i - 1]['duur']
        fc += f'{vorige}[s{i}]xfade=transition=fade:duration={FADE}:offset={start:.4f}[x{i}];'
        vorige = f'[x{i}]'
    n_laag, n_geluid = len(delen), len(delen) + 1
    fc += f'[{n_laag}:v]fps={FPS},format=rgba[o];{vorige}[o]overlay=0:0:eof_action=pass:format=auto,format=yuv420p[v];'
    # 4. Geluid: alleen muziek, op vaste luidheid, met een rustig einde. Zonder muziek een stil spoor.
    if cfg.get('muziek'):
        invoer += ['-f', 'concat', '-safe', '0', '-i', f'{uit}/lagen.txt', '-stream_loop', '-1', '-i', cfg['muziek']]
        fc += (f'[{n_geluid}:a]atrim=0:{totaal:.3f},asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,'
               f'afade=t=in:d=0.3,afade=t=out:st={max(0, totaal - 1.2):.2f}:d=1.2[a]')
    else:
        invoer += ['-f', 'concat', '-safe', '0', '-i', f'{uit}/lagen.txt', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
        fc += f'[{n_geluid}:a]atrim=0:{totaal:.3f}[a]'
    open(f'{uit}/filter.txt', 'w').write(fc)
    mp4 = f"{uit}/{cfg['naam']}.mp4"
    # Bitrate begrensd: boven ~30 MB breekt de upload naar de bucket af (zie reel-gino.mjs).
    run(['ffmpeg', '-y', '-loglevel', 'error', *invoer, '-filter_complex_script', f'{uit}/filter.txt', '-map', '[v]', '-map', '[a]',
         '-t', f'{totaal:.3f}', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '3800k', '-bufsize', '7600k',
         '-pix_fmt', 'yuv420p', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-threads', '4', mp4])

    # 5. Omslag = het eerste tekstblok van de hook met de mascotte erbij, plus de uitsneden zoals Instagram ze toont (feed 4:5, grid 1:1).
    eerste = shots[0]['blokken'][0]['tot']
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{max(MASCOTTE_IN + 0.1, min(1.0, eerste - 0.2)):.2f}', '-i', mp4, '-frames:v', '1', '-q:v', '2',
         f'{uit}/omslag.jpg'])
    g = Image.open(f'{uit}/omslag.jpg').convert('RGB')
    o = Image.new('RGB', (680, 384), 'black')
    o.paste(g.resize((216, 384)), (0, 0))
    o.paste(g.crop((0, 285, 1080, 1635)).resize((216, 270)), (232, 0))
    o.paste(g.crop((0, 420, 1080, 1500)).resize((216, 216)), (464, 0))
    o.save(f'{uit}/omslag_check.jpg')

    # 6. Controleblad: elk tekstblok (met de mascotte) en elke clip is minstens één keer te zien.
    t = 0.0
    for x in delen:
        if not any(t <= k < t + x['duur'] for k in kijk):
            kijk.append(t + x['duur'] / 2)
        t += x['duur']
    kijk.sort()
    kol, tw, th = min(7, len(kijk)), 240, 426
    cb = Image.new('RGB', (kol * tw, math.ceil(len(kijk) / kol) * th), 'black')
    tmp = f'{uit}/_c.jpg'
    for i, k in enumerate(kijk):
        run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{k:.2f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={tw}:{th}', tmp])
        cb.paste(Image.open(tmp), ((i % kol) * tw, (i // kol) * th))
    os.remove(tmp)
    cb.save(f'{uit}/controle.jpg', quality=90)

    json.dump({'soort': 'broll', 'uit_duur': totaal, 'shots': shots, 'clips': [{k: x[k] for k in ('shot', 'clip', 'van', 'duur')} for x in delen],
               'dubbele_clips': dubbel}, open(f'{uit}/montage.json', 'w'), ensure_ascii=False, indent=1)
    import shutil
    shutil.rmtree(f'{uit}/lagen', ignore_errors=True)
    print('uit', totaal, 'shots', len(shots), 'blokken', sum(len(s['blokken']) for s in shots), 'clips', len(delen), 'dubbel', len(dubbel))


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == 'monteer':
        monteer(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 3 and sys.argv[1] == 'blad':
        blad(sys.argv[2])
    else:
        sys.exit('Gebruik: reel_broll.py monteer <map> <config.json> | blad <uit-map>')
