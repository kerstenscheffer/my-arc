#!/usr/bin/env python3
"""Reel-variant B-roll (19 nov 2026): slide-tekst in dik wit over eigen B-roll, met muziek. Geen stem, geen ondertitels.
Staat naast reel_edit.py (praatreel) en raakt die niet. Aanroep via scripts/reel-gino.mjs (draait in ~/Gino/reel-venv).

  reel_broll.py monteer <map> <config.json>    render naar <map>/<uit>/
  reel_broll.py blad <uit-map>                 overzichtsbladen van alle clips in ~/Gino/reel-assets/broll

Config (docs/reel-werkwijze.md): shots = [{tekst, broll: "map/clip.mp4" of een lijst, duur?}], muziek, caption.
Eén tekst per shot. Duurt een tekst langer dan één clip, dan wisselt de B-roll eronder en blijft de tekst staan.
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FPS = 30
W, H = 1080, 1920
FONT = os.path.expanduser('~/Gino/reel-assets/fonts/Poppins-Bold.ttf')
BROLL = os.path.expanduser('~/Gino/reel-assets/broll')
TEKST_MAX, TEKST_MIN = 72, 50            # lettergrootte: begint groot en krimpt tot het blok past
MAX_B, MAX_H, MIDDEN_Y = 920, 880, 900   # tekstblok blijft binnen de feed- en gridsnede van de omslag
DIM = 96                                 # zwart over de B-roll (0-255), anders valt wit weg op licht eten
FADE = 0.15                              # zachte overgang tussen clips (briefing punt 6)
ZOOM = 0.045                             # rustige schaalbeweging per clip: 100% naar 104,5%
TEMPO, BASIS, MIN_SHOT = 0.28, 0.7, 2.5  # leestijd per shot: BASIS + TEMPO per woord, nooit korter dan MIN_SHOT

snap = lambda t: round(t * FPS) / FPS


def run(a):
    subprocess.run(a, check=True)


def duur_van(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def clips():
    uit = []
    for basis, _, namen in os.walk(BROLL):
        for n in namen:
            if n.lower().endswith(('.mp4', '.mov', '.m4v')) and not n.startswith('.'):
                uit.append(os.path.relpath(os.path.join(basis, n), BROLL))
    return sorted(uit)


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
            p = os.path.join(BROLL, rel)
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
    print(json.dumps({'map': BROLL, 'clips': [{'clip': c, 's': round(duur_van(os.path.join(BROLL, c)), 1)} for c in lijst],
                      'bladen': bladen}, ensure_ascii=False))


def breek(tekst, ft):
    """Afbreken op breedte. Een regeleinde in de tekst blijft staan, een lege regel wordt witruimte."""
    regels = []
    for alinea in tekst.split('\n'):
        if not alinea.strip():
            regels.append('')
            continue
        regel = ''
        for w in alinea.split():
            proef = (regel + ' ' + w).strip()
            if regel and ft.getlength(proef) > MAX_B:
                regels.append(regel)
                regel = w
            else:
                regel = proef
        regels.append(regel)
    return regels


def tekstlaag(tekst):
    for grootte in range(TEKST_MAX, TEKST_MIN - 1, -2):
        ft = ImageFont.truetype(FONT, grootte)
        regels = breek(tekst, ft)
        stap = int(grootte * 1.24)
        hoogte = sum(stap if r else stap // 2 for r in regels)
        if hoogte <= MAX_H and all(ft.getlength(r) <= MAX_B for r in regels):
            break
    else:
        sys.exit(f'Tekst past niet in beeld, verdeel hem over twee shots: {tekst[:60]}')
    posities, y = [], MIDDEN_Y - hoogte // 2
    for r in regels:
        if r:
            posities.append((int((W - ft.getlength(r)) / 2), y, r))
        y += stap if r else stap // 2
    img = Image.new('RGBA', (W, H), (0, 0, 0, DIM))
    sch = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sch)
    for x, y, r in posities:
        d.text((x, y + 3), r, font=ft, fill=(0, 0, 0, 230))
    sch = sch.filter(ImageFilter.GaussianBlur(11))
    img = Image.alpha_composite(Image.alpha_composite(img, sch), sch)
    d = ImageDraw.Draw(img)
    for x, y, r in posities:
        d.text((x, y), r, font=ft, fill=(255, 255, 255, 255))
    return img, grootte, len(posities)


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
        tekst = s['tekst'].strip()
        d = snap(float(s.get('duur') or max(MIN_SHOT, BASIS + tempo * len(tekst.split()))))
        bron = s['broll'] if isinstance(s['broll'], list) else [s['broll']]
        per = snap(d / len(bron))
        for i, rel in enumerate(bron):
            pad = os.path.realpath(os.path.join(BROLL, rel))
            if not pad.startswith(os.path.realpath(BROLL) + os.sep) or not os.path.isfile(pad):
                sys.exit(f'B-roll niet gevonden in {BROLL}: {rel}. Alleen Kerstens eigen beelden uit die map, geen stock.')
            delen.append({'shot': n, 'clip': rel, 'pad': pad, 'duur': per if i < len(bron) - 1 else snap(d - per * (len(bron) - 1))})
        shots.append({'tekst': tekst, 'duur': d, 'clips': bron})
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

    # 2. Tekstlagen: één doorzichtige laag per shot, hard gewisseld op de shotgrens.
    regels, t = [], 0.0
    for n, s in enumerate(shots):
        img, grootte, aantal = tekstlaag(s['tekst'])
        p = f'{uit}/lagen/{n:02d}.png'
        img.save(p)
        regels.append(f"file '{os.path.abspath(p)}'\nduration {s['duur']:.5f}")
        s.update(van=round(t, 2), tot=round(t + s['duur'], 2), lettergrootte=grootte, regels=aantal)
        t += s['duur']
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

    # 5. Omslag = het eerste shot met de hook, plus de uitsneden zoals Instagram ze toont (feed 4:5, grid 1:1).
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f"{min(1.0, shots[0]['duur'] / 2):.2f}", '-i', mp4, '-frames:v', '1', '-q:v', '2',
         f'{uit}/omslag.jpg'])
    g = Image.open(f'{uit}/omslag.jpg').convert('RGB')
    o = Image.new('RGB', (680, 384), 'black')
    o.paste(g.resize((216, 384)), (0, 0))
    o.paste(g.crop((0, 285, 1080, 1635)).resize((216, 270)), (232, 0))
    o.paste(g.crop((0, 420, 1080, 1500)).resize((216, 216)), (464, 0))
    o.save(f'{uit}/omslag_check.jpg')

    # 6. Controleblad: één beeld uit het midden van elke clip, dus elke tekst en elke clip is te zien.
    kol = min(8, len(delen))
    cb = Image.new('RGB', (kol * 216, math.ceil(len(delen) / kol) * 384), 'black')
    t = 0.0
    for i, x in enumerate(delen):
        tmp = f'{uit}/_c.jpg'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f"{t + x['duur'] / 2:.2f}", '-i', mp4, '-frames:v', '1', '-vf', 'scale=216:384', tmp])
        cb.paste(Image.open(tmp), ((i % kol) * 216, (i // kol) * 384))
        t += x['duur']
    os.remove(tmp)
    cb.save(f'{uit}/controle.jpg', quality=88)

    json.dump({'soort': 'broll', 'uit_duur': totaal, 'shots': shots, 'clips': [{k: x[k] for k in ('shot', 'clip', 'van', 'duur')} for x in delen],
               'dubbele_clips': dubbel}, open(f'{uit}/montage.json', 'w'), ensure_ascii=False, indent=1)
    import shutil
    shutil.rmtree(f'{uit}/lagen', ignore_errors=True)
    print('uit', totaal, 'shots', len(shots), 'clips', len(delen), 'dubbel', len(dubbel))


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == 'monteer':
        monteer(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 3 and sys.argv[1] == 'blad':
        blad(sys.argv[2])
    else:
        sys.exit('Gebruik: reel_broll.py monteer <map> <config.json> | blad <uit-map>')
