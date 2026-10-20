// src/modules/meal-plan/components/food-log/FotoTab.jsx
//
// Maaltijd loggen met een foto (14 okt 2026). Drie stappen:
//   1. foto maken of kiezen; de app verkleint hem naar ~1024 px;
//   2. de edge function maaltijd-foto-scan laat Claude de onderdelen en
//      grammen schatten;
//   3. elk onderdeel wordt opgezocht in onze eigen database via het slimme
//      zoeken (zoek_ingredienten). De macro's komen dus uit onze data, niet
//      uit het model. De klant controleert grammen en producten en logt.
//
// Schattingen van porties op een foto zitten er vaak 20-30% naast; daarom is
// de controlestap geen bijzaak maar het hoofdscherm.
import React, { useRef, useState } from 'react'
import { Camera, Image as ImageIcon, Minus, Plus, X, RefreshCw } from 'lucide-react'
import { resolveFoodImage } from '../../foodImageFallback'
import Keuze from '../Keuze'

const MOMENTEN = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Diner' },
  { id: 'snack', label: 'Snack' },
]
const momentNu = () => {
  const u = new Date().getHours()
  return u < 11 ? 'breakfast' : u < 15 ? 'lunch' : u < 20 ? 'dinner' : 'snack'
}

// Foto verkleinen tot max 1024 px aan de lange kant, als JPEG. Scheelt
// uploadtijd en kosten; meer pixels maken de schatting niet beter.
async function verklein(bestand, max = 1024) {
  const url = URL.createObjectURL(bestand)
  try {
    const img = await new Promise((ok, fout) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = fout
      i.src = url
    })
    const schaal = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * schaal)
    c.height = Math.round(img.naturalHeight * schaal)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    const dataUrl = c.toDataURL('image/jpeg', 0.82)
    c.width = 0; c.height = 0 // canvasgeheugen meteen vrij
    return { dataUrl, base64: dataUrl.split(',')[1] }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const per = (p, gram) => (Number(p) || 0) * gram / 100

// Kandidaat uit zoek_ingredienten → wat we per onderdeel bewaren.
const naarProduct = (ing) => ({
  id: ing.id, name: ing.name, brand: ing.brand || null,
  kcal: Number(ing.calories_per_100g) || 0,
  eiwit: Number(ing.protein_per_100g) || 0,
  kh: Number(ing.carbs_per_100g) || 0,
  vet: Number(ing.fat_per_100g) || 0,
  image_url: ing.image_url || null,
  basis: !ing.barcode,
})

export default function FotoTab({ db, client, onLog, isMobile, defaultMealMoment }) {
  const cameraRef = useRef(null)
  const galerijRef = useRef(null)
  const [stap, setStap] = useState('kies') // kies | bezig | lijst
  const [foto, setFoto] = useState(null)
  const [fout, setFout] = useState(null)
  const [gerecht, setGerecht] = useState('')
  const [rijen, setRijen] = useState([])
  const [moment, setMoment] = useState(
    MOMENTEN.some(m => m.id === defaultMealMoment) ? defaultMealMoment : momentNu()
  )
  const [bezigMetLoggen, setBezigMetLoggen] = useState(false)

  const pad = isMobile ? '0 16px' : '0 24px'

  const zoekEen = async (term) => {
    const { data, error } = await db.supabase
      .rpc('zoek_ingredienten', { p_q: term, p_client: client?.id || null, p_limit: 8 })
    if (error || !Array.isArray(data)) return []
    return data.filter(d => Number(d.calories_per_100g) > 0 || Number(d.protein_per_100g) > 0).map(naarProduct)
  }

  // Zoekterm van het model → producten uit onze database. Vindt de term
  // niets ("kwarteleieren"), dan nog eens op de naam en op het laatste
  // woord ("eieren").
  const zoekProducten = async (term, naam) => {
    const pogingen = [term, naam, String(term).split(/[\s-]+/).pop()].filter((t, i, a) => t && t.length > 2 && a.indexOf(t) === i)
    let lijst = []
    for (const t of pogingen) {
      lijst = await zoekEen(t)
      if (lijst.length) break
    }
    // Volgorde voor een foto: een naam die met de term begint, en daarbinnen
    // een basisproduct (zonder barcode). Anders wint bij "lente-ui" een
    // sandwichspread met "lente ui" in de naam.
    const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const kern = norm(term)
    const punten = (p) => (norm(p.name).startsWith(kern) ? 2 : 0) + (p.basis ? 1 : 0)
    return lijst
      .map((p, i) => ({ p, i, s: punten(p) }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map(x => x.p)
      .slice(0, 6)
  }

  const verwerk = async (bestand) => {
    if (!bestand) return
    setFout(null)
    setStap('bezig')
    try {
      const { dataUrl, base64 } = await verklein(bestand)
      setFoto(dataUrl)
      const { data, error } = await db.supabase.functions.invoke('maaltijd-foto-scan', {
        body: { image: base64, media_type: 'image/jpeg' },
      })
      if (error || data?.error) throw new Error(data?.error || 'Herkennen mislukt, probeer opnieuw.')
      const onderdelen = data?.onderdelen || []
      if (onderdelen.length === 0) {
        setFout('Ik zie geen eten op deze foto. Probeer een foto van bovenaf, met het hele bord in beeld.')
        setStap('kies')
        return
      }
      const gevonden = await Promise.all(onderdelen.map(async (o, i) => {
        const opties = await zoekProducten(o.zoekterm, o.naam)
        return {
          sleutel: `${i}-${o.zoekterm}`, gezien: o.naam, zekerheid: o.zekerheid,
          gram: o.gram, opties, keuze: opties[0]?.id || null, aan: opties.length > 0,
        }
      }))
      setGerecht(data?.gerecht || '')
      setRijen(gevonden)
      setStap('lijst')
    } catch (e) {
      console.error('❌ Foto-scan mislukt:', e)
      setFout(e?.message || 'Herkennen mislukt, probeer opnieuw.')
      setStap('kies')
    }
  }

  const kiesBestand = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    verwerk(f)
  }

  const zetRij = (sleutel, wijziging) => setRijen(prev => prev.map(r => r.sleutel === sleutel ? { ...r, ...wijziging } : r))
  const productVan = (r) => r.opties.find(p => p.id === r.keuze) || null

  const actief = rijen.filter(r => r.aan && productVan(r))
  const totaal = actief.reduce((t, r) => {
    const p = productVan(r)
    return {
      kcal: t.kcal + per(p.kcal, r.gram), eiwit: t.eiwit + per(p.eiwit, r.gram),
      kh: t.kh + per(p.kh, r.gram), vet: t.vet + per(p.vet, r.gram),
    }
  }, { kcal: 0, eiwit: 0, kh: 0, vet: 0 })

  const loggen = async () => {
    if (!actief.length || bezigMetLoggen) return
    setBezigMetLoggen(true)
    try {
      const ingredients = actief.map(r => {
        const p = productVan(r)
        return {
          id: p.id, name: p.name, brand: p.brand, amount: r.gram, unit: 'g',
          calories: Math.round(per(p.kcal, r.gram)), protein: Math.round(per(p.eiwit, r.gram)),
          carbs: Math.round(per(p.kh, r.gram)), fat: Math.round(per(p.vet, r.gram)),
        }
      })
      await onLog({
        name: gerecht || ingredients.map(i => i.name).join(', '),
        type: 'custom', source: 'foto_scan',
        ingredients,
        calories: Math.round(totaal.kcal), protein: Math.round(totaal.eiwit),
        carbs: Math.round(totaal.kh), fat: Math.round(totaal.vet),
        meal_type: moment, per100g: false,
        image_url: productVan(actief[0])?.image_url || null,
      })
    } finally {
      setBezigMetLoggen(false)
    }
  }

  const opnieuw = () => { setStap('kies'); setRijen([]); setFoto(null); setFout(null) }

  const verborgenInputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={kiesBestand} style={{ display: 'none' }} />
      <input ref={galerijRef} type="file" accept="image/*" onChange={kiesBestand} style={{ display: 'none' }} />
    </>
  )

  if (stap === 'kies') {
    return (
      <div style={{ padding: pad, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {verborgenInputs}
        <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45 }}>
          Maak een foto van je bord, van bovenaf en met alles in beeld. Je controleert de grammen voordat er iets gelogd wordt.
        </div>
        {fout && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.35)' }}>
            {fout}
          </div>
        )}
        <button onClick={() => cameraRef.current?.click()} style={knop(true)}>
          <Camera size={18} strokeWidth={2.6} /> Foto maken
        </button>
        <button onClick={() => galerijRef.current?.click()} style={knop(false)}>
          <ImageIcon size={18} strokeWidth={2.6} /> Kies uit je foto's
        </button>
      </div>
    )
  }

  if (stap === 'bezig') {
    return (
      <div style={{ padding: pad, paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {foto && <img src={foto} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 16, opacity: 0.6 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#fff' }}>
          <RefreshCw size={16} strokeWidth={2.6} style={{ animation: 'ftDraai 1s linear infinite' }} />
          Je maaltijd herkennen…
        </div>
        <style>{'@keyframes ftDraai { to { transform: rotate(360deg) } }'}</style>
      </div>
    )
  }

  // stap === 'lijst'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
      {verborgenInputs}
      <div style={{ padding: pad, display: 'flex', gap: 12, alignItems: 'center' }}>
        {foto && <img src={foto} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gerecht || 'Je maaltijd'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
            Grammen zijn een schatting. Klopt het?
          </div>
        </div>
        <button onClick={opnieuw} aria-label="Nieuwe foto" style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: 'transparent',
          border: '1px solid rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {rijen.map(r => {
          const p = productVan(r)
          return (
            <div key={r.sleutel} style={{
              padding: isMobile ? '12px 16px' : '12px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              opacity: r.aan && p ? 1 : 0.45,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={p?.image_url || resolveFoodImage({ name: p?.name || r.gezien }) || ''}
                  alt=""
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                  style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#1e1e1e', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {p && r.opties.length > 1 ? (
                    <Keuze
                      waarde={r.keuze}
                      zet={(id) => zetRij(r.sleutel, { keuze: id, aan: true })}
                      isMobile={isMobile}
                      opties={r.opties.map(o => ({ id: o.id, label: o.brand && !o.name.includes(o.brand) ? `${o.name} (${o.brand})` : o.name }))}
                    />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p?.name || r.gezien}
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p
                      ? `${Math.round(per(p.kcal, r.gram))} kcal · ${Math.round(per(p.eiwit, r.gram))} g eiwit${r.zekerheid === 'laag' ? ' · twijfel' : ''}`
                      : `“${r.gezien}” niet gevonden`}
                  </div>
                </div>
                <button
                  onClick={() => zetRij(r.sleutel, { aan: !r.aan })}
                  disabled={!p}
                  aria-label={r.aan ? 'Weglaten' : 'Meenemen'}
                  style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: 'transparent',
                    border: 'none', color: 'rgba(255,255,255,0.6)', cursor: p ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {r.aan ? <X size={18} strokeWidth={2.4} /> : <Plus size={18} strokeWidth={2.4} />}
                </button>
              </div>
              {p && r.aan && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 56 }}>
                  <button onClick={() => zetRij(r.sleutel, { gram: Math.max(5, r.gram - 10) })} aria-label="Minder" style={stapKnop}>
                    <Minus size={16} strokeWidth={2.6} />
                  </button>
                  <input
                    type="number" inputMode="numeric" value={r.gram}
                    onChange={(e) => zetRij(r.sleutel, { gram: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                    style={{
                      width: 72, height: 44, textAlign: 'center', borderRadius: 12,
                      background: '#000', border: '1px solid rgba(255,255,255,0.14)',
                      color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>gram</span>
                  <button onClick={() => zetRij(r.sleutel, { gram: r.gram + 10 })} aria-label="Meer" style={stapKnop}>
                    <Plus size={16} strokeWidth={2.6} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: pad, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {MOMENTEN.map(m => {
          const aan = moment === m.id
          return (
            <button key={m.id} onClick={() => setMoment(m.id)} style={{
              minHeight: 44, borderRadius: 12,
              background: aan ? '#fff' : 'transparent',
              border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
              color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
              fontSize: 13, fontWeight: aan ? 900 : 800, fontFamily: 'inherit', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{m.label}</button>
          )
        })}
      </div>

      <div style={{ padding: pad }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 8 }}>
          {Math.round(totaal.eiwit)} g eiwit · {Math.round(totaal.kh)} g koolhydraten · {Math.round(totaal.vet)} g vet
        </div>
        <button onClick={loggen} disabled={!actief.length || bezigMetLoggen} style={{
          ...knop(true), width: '100%',
          opacity: !actief.length || bezigMetLoggen ? 0.4 : 1,
        }}>
          {bezigMetLoggen ? 'Loggen…' : `Log ${Math.round(totaal.kcal)} kcal`}
        </button>
      </div>
    </div>
  )
}

const knop = (primair) => ({
  minHeight: 52, borderRadius: 14, fontFamily: 'inherit',
  fontSize: 15, fontWeight: 900, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  ...(primair
    ? { background: '#fff', color: '#0a0a0a', border: 'none' }
    : { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }),
})

const stapKnop = {
  width: 44, height: 44, borderRadius: 12, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
