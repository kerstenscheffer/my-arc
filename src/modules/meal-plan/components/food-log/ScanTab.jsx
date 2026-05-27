// src/modules/meal-plan/components/food-log/ScanTab.jsx
// 🎯 v4.0 - Back button, clean manual entry, name correction
import React, { useState } from 'react'
import { Scan, Keyboard, AlertCircle, Check, X, ArrowLeft } from 'lucide-react'
import BarcodeScanner from '../../../client-meal-builder/components/BarcodeScanner'

export default function ScanTab({ db, onSelect, onBack, onClose, isMobile }) {
  const [scanning, setScanning] = useState(true)
  const [manualBarcode, setManualBarcode] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingProduct, setPendingProduct] = useState(null)
  const [editedName, setEditedName] = useState('')
  // Manual product entry when not found
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  const [manualProduct, setManualProduct] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' })

  const isNameSuspicious = (name) => {
    if (!name || name.length < 3) return true
    if (/^\d{4,}/.test(name)) return true
    if (name.includes(':') && name.length < 15) return true
    return false
  }

  const handleBarcode = async (barcode) => {
    if (!barcode) return
    setScanning(false)
    setLookupLoading(true)
    setError(null)
    setPendingProduct(null)

    try {
      console.log('🔍 Looking up barcode:', barcode)

      // 1. Check internal DB first
      const { data: existing } = await db.supabase
        .from('ai_ingredients')
        .select('*')
        .eq('barcode', barcode)
        .limit(1)
        .maybeSingle()

      if (existing) {
        console.log('✅ Found in internal DB:', existing.name)
        if (isNameSuspicious(existing.name)) {
          setPendingProduct({ ...existing, _isExisting: true, _existingId: existing.id })
          setEditedName(existing.brand || `Product ${barcode.slice(-4)}`)
          setLookupLoading(false)
          return
        }
        onSelect({
          id: existing.id, name: existing.name, brand: existing.brand || null,
          calories: existing.calories_per_100g || 0, protein: existing.protein_per_100g || 0,
          carbs: existing.carbs_per_100g || 0, fat: existing.fat_per_100g || 0,
          fiber: existing.fiber_per_100g || 0, sugar: existing.sugar_per_100g || 0,
          saturated_fat: existing.saturated_fat_per_100g || 0, sodium: existing.sodium_per_100g || 0,
          defaultPortion: existing.default_portion_gram || 100, image_url: existing.image_url,
          type: 'ingredient', source: 'myarc', per100g: true
        })
        return
      }

      // 2. Look up on Open Food Facts (8s timeout)
      let product = null
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const response = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_nl,product_name_en,generic_name,generic_name_nl,brands,nutriments,image_url,image_front_url,image_small_url,code,allergens_tags,serving_size,quantity,categories_tags`,
          { headers: { 'User-Agent': 'MyArc - Nutrition App - Version 1.0' }, signal: controller.signal }
        )
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 1 && data.product) {
            const p = data.product
            const n = p.nutriments || {}

            // ── Smart name resolution ──
            let bestName = ''
            const candidates = [
              p.product_name_nl,
              p.product_name,
              p.product_name_en,
              p.generic_name_nl,
              p.generic_name,
              p.product_name_de,
              p.product_name_fr
            ].filter(Boolean)

            for (const name of candidates) {
              const clean = name.replace(/^\d{4,}\s*/, '').replace(/[:\-,;]\s*$/, '').trim()
              if (clean.length >= 3 && !isNameSuspicious(clean)) {
                bestName = clean
                break
              }
            }

            // Fallback: brand + last category (most specific)
            if (!bestName || isNameSuspicious(bestName)) {
              const brand = (p.brands || '').split(',')[0].trim()
              const categories = (p.categories_tags || [])
                .map(c => c.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))
                .filter(c => c.length > 2 && c.length < 40)
              const category = categories.length > 0 ? categories[categories.length - 1] : ''

              if (brand && category) bestName = `${brand} ${category}`
              else if (brand) bestName = brand
              else if (category) bestName = category
              else bestName = '' // triggers name correction screen
            }

            // Add brand suffix if not already present
            const brandClean = (p.brands || '').split(',')[0].trim()
            if (bestName && brandClean && !bestName.toLowerCase().includes(brandClean.toLowerCase())) {
              bestName = `${bestName} (${brandClean})`
            }

            if (n['energy-kcal_100g'] || n.proteins_100g) {
              product = {
                name: bestName,
                name_en: p.product_name_en || bestName,
                brands: p.brands || null,
                // Always use per 100g values — most reliable
                calories_per_100g: parseFloat(n['energy-kcal_100g']) || 0,
                protein_per_100g: parseFloat(n.proteins_100g) || 0,
                carbs_per_100g: parseFloat(n.carbohydrates_100g) || 0,
                fat_per_100g: parseFloat(n.fat_100g) || 0,
                fiber_per_100g: parseFloat(n.fiber_100g) || 0,
                sugar_per_100g: parseFloat(n.sugars_100g) || 0,
                saturated_fat_per_100g: parseFloat(n['saturated-fat_100g']) || 0,
                sodium_per_100g: parseFloat(n.sodium_100g) || 0,
                image_url: p.image_front_url || p.image_url || p.image_small_url || null,
                serving_size: p.serving_size || p.quantity || null,
                barcode: barcode
              }
            }
          }
        }
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') console.warn('⏱️ OFF timeout')
        else console.warn('⚠️ OFF failed:', fetchErr)
      }

      if (!product) {
        // Show manual product entry form
        setNotFoundBarcode(barcode)
        setManualProduct({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '' })
        setLookupLoading(false)
        return
      }

      if (isNameSuspicious(product.name)) {
        setPendingProduct(product)
        setEditedName(product.brands || `Product ${barcode.slice(-4)}`)
        return
      }

      await saveAndSelect(product, barcode)
    } catch (err) {
      console.error('Barcode lookup failed:', err)
      setError('Er ging iets mis. Probeer opnieuw.')
    } finally {
      setLookupLoading(false)
    }
  }

  const saveAndSelect = async (product, barcode) => {
    try {
      await db.supabase.from('ai_ingredients').insert({
        name: product.name, name_en: product.name_en || product.name, category: 'other',
        calories_per_100g: product.calories_per_100g || 0, protein_per_100g: product.protein_per_100g || 0,
        carbs_per_100g: product.carbs_per_100g || 0, fat_per_100g: product.fat_per_100g || 0,
        fiber_per_100g: product.fiber_per_100g || 0, sugar_per_100g: product.sugar_per_100g || 0,
        saturated_fat_per_100g: product.saturated_fat_per_100g || 0, sodium_per_100g: product.sodium_per_100g || 0,
        brand: product.brands || null, serving_description: product.serving_size || null,
        barcode: barcode || product.barcode, image_url: product.image_url,
        default_portion_gram: 100, min_portion_gram: 10, max_portion_gram: 500,
        unit_type: 'gram', scalable: true, source: 'openfoodfacts', log_count: 0
      }).select().maybeSingle()
    } catch (saveErr) {
      console.warn('Could not save to DB:', saveErr)
    }
    onSelect({
      id: product._existingId || barcode, name: product.name, brand: product.brands,
      calories: product.calories_per_100g || 0, protein: product.protein_per_100g || 0,
      carbs: product.carbs_per_100g || 0, fat: product.fat_per_100g || 0,
      image_url: product.image_url, barcode: barcode || product.barcode,
      type: 'product', source: product._isExisting ? 'myarc' : 'openfoodfacts', per100g: true
    })
  }

  const handleConfirmName = async () => {
    if (!pendingProduct || !editedName.trim()) return
    setLookupLoading(true)
    const corrected = { ...pendingProduct, name: editedName.trim() }
    if (corrected._isExisting && corrected._existingId) {
      try { await db.supabase.from('ai_ingredients').update({ name: editedName.trim() }).eq('id', corrected._existingId) } catch {}
      onSelect({
        id: corrected._existingId, name: editedName.trim(), brand: corrected.brand || null,
        calories: corrected.calories_per_100g || 0, protein: corrected.protein_per_100g || 0,
        carbs: corrected.carbs_per_100g || 0, fat: corrected.fat_per_100g || 0,
        defaultPortion: corrected.default_portion_gram || 100, image_url: corrected.image_url,
        type: 'ingredient', source: 'myarc', per100g: true
      })
    } else {
      await saveAndSelect(corrected, corrected.barcode)
    }
    setPendingProduct(null)
    setLookupLoading(false)
  }

  // Handle manual product save
  const handleSaveManualProduct = async () => {
    const { name, brand, calories, protein, carbs, fat } = manualProduct
    if (!name.trim() || !calories) return

    setLookupLoading(true)
    try {
      const productData = {
        name: name.trim(),
        name_en: name.trim(),
        brands: brand.trim() || null,
        calories_per_100g: parseFloat(calories) || 0,
        protein_per_100g: parseFloat(protein) || 0,
        carbs_per_100g: parseFloat(carbs) || 0,
        fat_per_100g: parseFloat(fat) || 0,
        barcode: notFoundBarcode
      }

      await saveAndSelect(productData, notFoundBarcode)
      setNotFoundBarcode(null)
    } catch (err) {
      console.error('Save manual product failed:', err)
    } finally {
      setLookupLoading(false)
    }
  }

  // ── PRODUCT NOT FOUND — MANUAL ENTRY ──
  if (notFoundBarcode) {
    const mp = manualProduct
    const canSave = mp.name.trim().length >= 2 && mp.calories
    return (
      <div style={{ padding: isMobile ? '1.25rem 1rem' : '1.5rem', overflowY: 'auto', maxHeight: '80vh' }}>
        <div style={{
          fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255, 215, 0, 0.5)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem'
        }}>
          Product niet gevonden
        </div>

        <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '0.375rem' }}>
          Voeg dit product toe
        </div>

        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Dit product staat nog niet in onze database. Vul de gegevens in van het etiket (per 100g). Zo help je jezelf en andere gebruikers!
        </div>

        {/* Barcode display */}
        <div style={{
          padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)',
          borderRadius: '6px', marginBottom: '1rem',
          fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace'
        }}>
          Barcode: {notFoundBarcode}
        </div>

        {/* Name + Brand */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              Productnaam *
            </div>
            <input type="text" value={mp.name} onChange={e => setManualProduct(p => ({ ...p, name: e.target.value }))}
              placeholder="Bijv. Bruine Bollen" autoFocus
              style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
              Merk
            </div>
            <input type="text" value={mp.brand} onChange={e => setManualProduct(p => ({ ...p, brand: e.target.value }))}
              placeholder="Bijv. Aldi"
              style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Macro label */}
        <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem', marginTop: '0.5rem' }}>
          Voedingswaarden per 100g
        </div>

        {/* Macros grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { key: 'calories', label: 'Calorieën *', placeholder: 'kcal', unit: 'kcal' },
            { key: 'protein', label: 'Eiwit', placeholder: 'gram', unit: 'g' },
            { key: 'carbs', label: 'Koolhydraten', placeholder: 'gram', unit: 'g' },
            { key: 'fat', label: 'Vetten', placeholder: 'gram', unit: 'g' }
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                {f.label}
              </div>
              <div style={{ position: 'relative' }}>
                <input type="number" inputMode="decimal" value={mp[f.key]}
                  onChange={e => setManualProduct(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '0.6rem', paddingRight: '2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} />
                <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', fontWeight: '600' }}>
                  {f.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div style={{
          padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.04)',
          border: '1px solid rgba(16,185,129,0.1)', borderRadius: '6px',
          fontSize: '0.55rem', color: 'rgba(16,185,129,0.5)', marginBottom: '1rem', lineHeight: 1.5
        }}>
          Tip: de voedingswaarden staan op het etiket van de verpakking, meestal per 100g.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSaveManualProduct} disabled={!canSave || lookupLoading}
            style={{
              flex: 1, padding: '0.75rem', background: canSave ? '#FFD700' : 'rgba(16,185,129,0.1)',
              border: 'none', borderRadius: '6px',
              color: canSave ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem', fontWeight: '800', cursor: canSave ? 'pointer' : 'default',
              minHeight: '44px', touchAction: 'manipulation',
              opacity: lookupLoading ? 0.5 : 1
            }}>
            {lookupLoading ? 'Opslaan...' : 'Opslaan & loggen'}
          </button>
          <button onClick={() => { setNotFoundBarcode(null); setScanning(true) }}
            style={{
              padding: '0.75rem', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '600',
              cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation'
            }}>
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── NAME CORRECTION ──
  if (pendingProduct) {
    const n = pendingProduct
    return (
      <div style={{ padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>
        <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(245, 158, 11, 0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Productnaam controleren
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
          De automatische naam ziet er niet goed uit. Geef de juiste naam op:
        </div>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)', marginBottom: '0.5rem', textDecoration: 'line-through' }}>
          Origineel: {n.name || '(leeg)'}
        </div>
        <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} placeholder="Productnaam" autoFocus
          style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', color: '#fff', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', outline: 'none', marginBottom: '0.75rem' }} />
        {n.brands && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>Merk: {n.brands}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
          <span><strong style={{ color: 'rgba(255,255,255,0.6)' }}>{n.calories_per_100g?.toFixed(1)}</strong> kcal</span>
          <span><strong style={{ color: 'rgba(255,255,255,0.6)' }}>{n.protein_per_100g?.toFixed(1)}</strong>g E</span>
          <span><strong style={{ color: 'rgba(255,255,255,0.6)' }}>{n.carbs_per_100g?.toFixed(1)}</strong>g K</span>
          <span><strong style={{ color: 'rgba(255,255,255,0.6)' }}>{n.fat_per_100g?.toFixed(1)}</strong>g V</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleConfirmName} disabled={!editedName.trim() || lookupLoading}
            style={{ flex: 1, padding: '0.75rem', background: 'rgba(255, 215, 0, 0.12)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '6px', color: '#FFD700', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', touchAction: 'manipulation', opacity: (!editedName.trim() || lookupLoading) ? 0.4 : 1 }}>
            <Check size={16} strokeWidth={2.5} />
            {lookupLoading ? 'Opslaan...' : 'Bevestig'}
          </button>
          <button onClick={() => { setPendingProduct(null); setScanning(true) }}
            style={{ padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', minHeight: '44px', touchAction: 'manipulation' }}>
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── SCANNER VIEW ──
  if (scanning) {
    return (
      <div>
        <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
          <BarcodeScanner
            onScan={(code) => handleBarcode(code)}
            onClose={onClose || onBack}
            onSwitchToSearch={onBack}
            onError={(err) => { setError(err); setScanning(false) }}
          />
        </div>

        {/* Manual entry link */}
        <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
          <button onClick={() => setScanning(false)}
            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', minHeight: '36px', touchAction: 'manipulation', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Keyboard size={13} /> Barcode typen
          </button>
        </div>
      </div>
    )
  }

  // ── MANUAL ENTRY ──
  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem' : '1.5rem' }}>
      {/* Back button */}
      {onBack && (
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation', padding: 0 }}>
          <ArrowLeft size={14} /> Terug
        </button>
      )}

      {lookupLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ width: '24px', height: '24px', margin: '0 auto 0.75rem', border: '2px solid rgba(255, 215, 0, 0.15)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'stSpin 1s linear infinite' }} />
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Product ophalen...</div>
        </div>
      ) : (
        <>
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(239, 68, 68, 0.7)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' }}>
            Barcode invoeren
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="text" inputMode="numeric" value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
              placeholder="Bijv. 3017624010701"
              style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', outline: 'none', minHeight: '44px' }} />
            <button onClick={() => handleBarcode(manualBarcode)} disabled={manualBarcode.length < 8}
              style={{ padding: '0.75rem 1rem', background: manualBarcode.length >= 8 ? '#FFD700' : 'transparent', border: manualBarcode.length >= 8 ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: manualBarcode.length >= 8 ? '#000' : 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: '700', cursor: manualBarcode.length >= 8 ? 'pointer' : 'default', minHeight: '44px', touchAction: 'manipulation' }}>
              Zoek
            </button>
          </div>

          <button onClick={() => { setScanning(true); setError(null) }}
            style={{ padding: '0.625rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', minHeight: '36px', touchAction: 'manipulation', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Scan size={13} /> Camera openen
          </button>
        </>
      )}

      <style>{`@keyframes stSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
