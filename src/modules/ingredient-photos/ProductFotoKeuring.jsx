// src/modules/ingredient-photos/ProductFotoKeuring.jsx
//
// Coach keurt productfoto's die klanten na het scannen maakten (18 nov 2026).
// Goed = de foto wordt de foto van dat product voor iedereen (keur_productfoto).
// Eén tik per foto; de nieuwste staan bovenaan.
// SQL: productfotos-merk-en-klant.sql · klantkant: food-log/ScanTab.jsx

import { useCallback, useEffect, useState } from 'react'
import { Check, X, Loader } from 'lucide-react'

export default function ProductFotoKeuring({ db, isMobile }) {
  const supabase = db.supabase
  const [rijen, setRijen] = useState(null)
  const [fout, setFout] = useState(null)
  const [bezig, setBezig] = useState({})

  const laad = useCallback(async () => {
    const { data, error } = await supabase
      .from('product_foto_inzendingen')
      .select('id, foto_url, barcode, created_at, client_id, ingredient:ai_ingredients(name, brand, image_url, image_source)')
      .eq('status', 'nieuw')
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) { setFout(error.message); return }
    const ids = [...new Set((data || []).map(r => r.client_id).filter(Boolean))]
    const namen = {}
    if (ids.length) {
      const { data: kl } = await supabase.from('clients').select('id, first_name, last_name').in('id', ids)
      for (const k of kl || []) namen[k.id] = [k.first_name, k.last_name].filter(Boolean).join(' ')
    }
    setRijen((data || []).map(r => ({ ...r, klant: namen[r.client_id] || null })))
  }, [supabase])

  useEffect(() => { laad() }, [laad])

  const keur = async (id, goed) => {
    setBezig(b => ({ ...b, [id]: true }))
    const { error } = await supabase.rpc('keur_productfoto', { p_id: id, p_goed: goed })
    if (error) { setFout(error.message); setBezig(b => ({ ...b, [id]: false })); return }
    // Bij goed vervallen ook andere inzendingen voor hetzelfde product.
    await laad()
    setBezig(b => ({ ...b, [id]: false }))
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
        Productfoto's
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
        Gemaakt door klanten na het scannen. Goedgekeurd = de foto van dat product voor iedereen.
      </div>
      {fout && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{fout}</div>}
      {rijen === null && <Loader size={20} color="#fff" style={{ animation: 'pfkDraai 1s linear infinite' }} />}
      {rijen?.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', padding: '2rem 0' }}>Niets te keuren.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 200}px, 1fr))`, gap: 12 }}>
        {rijen?.map(r => (
          <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ aspectRatio: '1 / 1', background: '#111' }}>
              <img src={r.foto_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '0.6rem 0.7rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, minHeight: '2.2em' }}>
                {r.ingredient?.name || 'Onbekend product'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {r.klant || 'Coach'} · {new Date(r.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button onClick={() => keur(r.id, true)} disabled={bezig[r.id]} title="Goedkeuren" style={knop('#fff', '#0a0a0a')}>
                  <Check size={18} strokeWidth={3} />
                </button>
                <button onClick={() => keur(r.id, false)} disabled={bezig[r.id]} title="Afkeuren" style={knop('transparent', 'rgba(255,255,255,0.8)', true)}>
                  <X size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pfkDraai { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const knop = (bg, kleur, rand) => ({
  flex: 1, height: 40, borderRadius: 10, background: bg, color: kleur,
  border: rand ? '1.5px solid rgba(255,255,255,0.25)' : 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  touchAction: 'manipulation',
})

