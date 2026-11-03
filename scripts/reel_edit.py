#!/usr/bin/env python3
"""Reel-edit: spreekmontage, labels, ondertitels, kleur, loudness, muziek, omslag.
Stijl: docs/reel-edit-briefing.md. Nog niet: B-roll, volgkaart.
Aanroep via scripts/reel-gino.mjs (draait in ~/Gino/reel-venv). Gebruik: reel_edit.py <map> <config.json>
"""
import json, math, os, subprocess, sys, wave, array
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FPS = 30
W, H = 1080, 1920
FONT = os.path.expanduser('~/Gino/reel-assets/fonts/Poppins-Bold.ttf')
CAP_SIZE, LABEL_SIZE = 92, 72
CAP_BASELINE_Y, LABEL_TOP_Y = 1500, 240
GAP_KEEP = 0.08            # lege ruimte per kant van een knip (samen ~0,16 s)
CUT_ALWAYS, CUT_MIN = 0.45, 0.28
MIN_CUT_SPACING = 2.0      # kortere pauzes alleen knippen als de vorige knip ver genoeg weg is
MAX_CAP_W = 900

map_, cfg_path = sys.argv[1], sys.argv[2]
os.chdir(map_)
cfg = json.load(open(cfg_path))
os.makedirs(cfg['uit'], exist_ok=True)
UIT = cfg['uit']
snap = lambda t: round(t * FPS) / FPS


def pauzes():
    w = wave.open('audio16k.wav')
    a = array.array('h', w.readframes(w.getnframes()))
    hop = 320
    db = []
    for i in range(0, len(a) - hop, hop):
        s = a[i:i + hop]
        db.append(20 * math.log10(math.sqrt(sum(x * x for x in s) / hop) / 32768 + 1e-6))
    sd = sorted(db)
    th = max(sd[len(sd) // 10] + 4, sd[len(sd) * 9 // 10] - 18)
    res, st = [], None
    for i, v in enumerate(db):
        if v < th:
            st = i if st is None else st
        else:
            if st is not None and (i - st) * .02 >= .12:
                res.append((st * .02, i * .02))
            st = None
    if st is not None:
        res.append((st * .02, len(db) * .02))
    return res, len(a) / 16000


def woorden(pz):
    d = json.load(open('woorden_dtw.json'))
    ws = [[s['offsets']['from'] / 1000, s['text'].strip()] for s in d['transcription'] if s['text'].strip()]
    uit = []
    i = 0
    while i < len(ws):
        t, x = ws[i]
        for van, naar, na in cfg.get('correcties', []):
            if x.strip('.,?!') == van and (na is None or (uit and uit[-1][1].strip('.,?!') == na)):
                x = x.replace(van, naar)
        for a, b in cfg.get('samenvoegen', []):
            if x == a and i + 1 < len(ws) and ws[i + 1][1].strip('.,?!') == b:
                x = a + ws[i + 1][1]
                i += 1
        for a, b in pz:          # woordstart in een pauze: naar het einde van die pauze
            if a <= t < b:
                t = b
        uit.append([t, x])
        i += 1
    return uit


def segmenten(pz, duur):
    keep, start, laatste = [], None, -9
    eerste = pz[0][1] if pz and pz[0][0] == 0 else 0
    start = snap(max(0, eerste - GAP_KEEP))
    laatste = start
    for a, b in pz:
        if a == 0:
            continue
        L = b - a
        if b >= duur - .05:      # eindstilte
            keep.append((start, snap(min(duur, a + GAP_KEEP))))
            return keep
        if L >= CUT_ALWAYS or (L >= CUT_MIN and a - laatste >= MIN_CUT_SPACING):
            keep.append((start, snap(a + GAP_KEEP)))
            start = snap(b - GAP_KEEP)
            laatste = b
    keep.append((start, snap(duur)))
    return keep


def naar_uit(t, keep):
    o = 0
    for a, b in keep:
        if t < a:
            return o
        if t <= b:
            return o + t - a
        o += b - a
    return o


ft_cap, ft_lab = ImageFont.truetype(FONT, CAP_SIZE), ImageFont.truetype(FONT, LABEL_SIZE)


def breedte(t, ft):
    return ft.getbbox(t)[2]


def groepen(ws, einde):
    res, i = [], 0
    while i < len(ws):
        t, x = ws[i]
        tekst = schoon(x)
        volg = i + 1
        if i + 1 < len(ws) and not x.endswith(('.', ',', '?', '!')):
            t2, x2 = ws[i + 1]
            samen = tekst + ' ' + schoon(x2)
            t3 = ws[i + 2][0] if i + 2 < len(ws) else einde
            if breedte(samen, ft_cap) <= MAX_CAP_W and t3 - t <= 0.8 and t2 - t < 0.42:
                tekst, volg = samen, i + 2
        res.append([t, tekst])
        i = volg
    return res


def schoon(x):
    x = x.strip('.,?!')
    return x if x in cfg.get('hoofdletters', []) else x.lower()


def laag(cap, lab):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if lab:
        x0, y0, x1, y1 = ft_lab.getbbox(lab)
        tw, th = x1 - x0, y1 - y0
        pad_x, pad_y = 38, 26
        bw, bh = tw + 2 * pad_x, th + 2 * pad_y
        bx = (W - bw) // 2
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((bx, LABEL_TOP_Y, bx + bw, LABEL_TOP_Y + bh), radius=22, fill=(255, 255, 255, 255))
        d.text((bx + pad_x - x0, LABEL_TOP_Y + pad_y - y0), lab, font=ft_lab, fill=(0, 0, 0, 255))
    if cap:
        x = (W - breedte(cap, ft_cap)) // 2
        y = CAP_BASELINE_Y - ft_cap.getmetrics()[0]
        sch = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sch).text((x, y + 3), cap, font=ft_cap, fill=(0, 0, 0, 230))
        sch = sch.filter(ImageFilter.GaussianBlur(11))
        img = Image.alpha_composite(img, sch)
        img = Image.alpha_composite(img, sch)
        ImageDraw.Draw(img).text((x, y), cap, font=ft_cap, fill=(255, 255, 255, 255))
    return img


pz, duur = pauzes()
keep = segmenten(pz, duur)
ws = woorden(pz)
totaal = sum(b - a for a, b in keep)
ws_uit = [[snap(naar_uit(t, keep)), x] for t, x in ws]
caps = groepen(ws_uit, totaal)
# geen flitsen: elke ondertitel staat minstens 0,2 s, en de volgende schuift zo nodig op
for i in range(1, len(caps)):
    caps[i][0] = snap(max(caps[i][0], caps[i - 1][0] + 0.2))
labels = [[snap(naar_uit(a, keep)), snap(naar_uit(b, keep)), t] for a, b, t in cfg['labels']]

# wisselmomenten: één transparante laag per interval
punten = sorted({0.0, snap(totaal)} | {c[0] for c in caps} | {x for l in labels for x in l[:2]})
os.makedirs(f'{UIT}/lagen', exist_ok=True)
regels = []
for n, (a, b) in enumerate(zip(punten, punten[1:])):
    if b - a < 1e-6:
        continue
    cap = next((c[1] for c in reversed(caps) if c[0] <= a + 1e-6), None)
    lab = next((l[2] for l in labels if l[0] <= a + 1e-6 and a < l[1] - 1e-6), None)
    p = f'{UIT}/lagen/{n:04d}.png'
    laag(cap, lab).save(p)
    regels.append(f"file '{os.path.abspath(p)}'\nduration {b - a:.5f}")
regels.append(regels[-1].split('\n')[0])
open(f'{UIT}/lagen.txt', 'w').write('\n'.join(regels) + '\n')

sel = '+'.join(f'between(t,{a - 1 / FPS / 2:.4f},{b - 1 / FPS / 2:.4f})' for a, b in keep)
kleur = 'eq=contrast=1.07:saturation=1.14:gamma=0.94,colorbalance=rm=0.03:bm=-0.03:rs=0.02:bs=-0.03'
af = ''
for i, (a, b) in enumerate(keep):
    af += f'[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={b - a - 0.006:.4f}:d=0.006[a{i}];'
af += ''.join(f'[a{i}]' for i in range(len(keep))) + f'concat=n={len(keep)}:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]'
fc = (f"[0:v]scale={W}:{H},fps={FPS},{kleur},select='{sel}',setpts=N/{FPS}/TB,format=yuv420p[b];"
      f"[1:v]fps={FPS},format=rgba[o];[b][o]overlay=0:0:eof_action=pass:format=auto[v];{af}")
open(f'{UIT}/filter.txt', 'w').write(fc)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', cfg['bron'], '-f', 'concat', '-safe', '0', '-i', f'{UIT}/lagen.txt',
                '-filter_complex_script', f'{UIT}/filter.txt', '-map', '[v]', '-map', '[a]', '-t', f'{totaal:.3f}',
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', str(FPS),
                '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-threads', '4', f"{UIT}/{cfg['naam']}.mp4"], check=True)

mp4 = f"{UIT}/{cfg['naam']}.mp4"
if cfg.get('muziek'):
    # Eén doorlopend bed, zachter onder de stem (sidechain), geen piek boven -1,9 dB.
    zonder = f"{UIT}/{cfg['naam']}_zonder_muziek.mp4"
    os.replace(mp4, zonder)
    fo = round(totaal - 1.5, 2)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', zonder, '-stream_loop', '-1', '-i', cfg['muziek'], '-filter_complex',
                    f'[1:a]aresample=48000,loudnorm=I=-27:TP=-6:LRA=7,atrim=0:{totaal:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st={fo}:d=1.5[m];'
                    '[0:a]asplit=2[s][sc];[m][sc]sidechaincompress=threshold=0.05:ratio=4:attack=30:release=350[md];'
                    '[s][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.8:level=false[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', mp4], check=True)
    os.remove(zonder)

omslag = cfg.get('omslag') or {}
if omslag.get('regels'):
    # Frame uit de bron met dezelfde kleur; titel binnen de feed- en gridsnede, vrij van ogen en mond.
    bron_png = f'{UIT}/_omslag.png'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(omslag.get('tijd', 12)), '-i', cfg['bron'], '-frames:v', '1',
                    '-vf', f'scale={W}:{H},{kleur}', bron_png], check=True)
    im = Image.open(bron_png).convert('RGBA')
    ft = ImageFont.truetype(FONT, omslag.get('grootte', 104))
    y = omslag.get('y', 445)
    sch = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(sch)
    pos = []
    for regel in omslag['regels']:
        x = (W - ft.getbbox(regel)[2]) // 2
        pos.append((x, y, regel))
        d.text((x, y + 4), regel, font=ft, fill=(0, 0, 0, 235))
        y += int(ft.size * 1.17)
    sch = sch.filter(ImageFilter.GaussianBlur(14))
    im = Image.alpha_composite(Image.alpha_composite(im, sch), sch)
    d = ImageDraw.Draw(im)
    for x, y, regel in pos:
        d.text((x, y), regel, font=ft, fill=(255, 255, 255, 255))
    g = im.convert('RGB')
    g.save(f'{UIT}/omslag.jpg', quality=92)
    o = Image.new('RGB', (680, 384), 'black')
    o.paste(g.resize((216, 384)), (0, 0))
    o.paste(g.crop((0, 285, 1080, 1635)).resize((216, 270)), (232, 0))
    o.paste(g.crop((0, 420, 1080, 1500)).resize((216, 216)), (464, 0))
    o.save(f'{UIT}/omslag_check.jpg')
    os.remove(bron_png)

knippen = [keep[i + 1][0] for i in range(len(keep) - 1)]
uit_knip = [round(naar_uit(k, keep), 2) for k in knippen]
kort = sum(1 for a, b in zip(uit_knip, uit_knip[1:]) if b - a < MIN_CUT_SPACING)
json.dump({'bron_duur': round(duur, 2), 'uit_duur': round(totaal, 2), 'segmenten': keep, 'knippen_uit': uit_knip,
           'knippen_binnen_2s': kort, 'labels_uit': labels, 'ondertitels': caps}, open(f'{UIT}/montage.json', 'w'), ensure_ascii=False, indent=1)
print('bron', round(duur, 2), 'uit', round(totaal, 2), 'knippen', len(knippen), 'binnen2s', kort, 'ondertitels', len(caps))
print('langste ondertitel-woorden', max(len(c[1].split()) for c in caps))
print(' | '.join(f'{c[0]:.1f}:{c[1]}' for c in caps))
import shutil
shutil.rmtree(f'{UIT}/lagen', ignore_errors=True)
