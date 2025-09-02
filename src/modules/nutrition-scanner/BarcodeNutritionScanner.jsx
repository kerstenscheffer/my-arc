// src/modules/nutrition-scanner/BarcodeNutritionScanner.jsx
import { useState, useRef } from 'react'
import { Camera, Search, Save, Check, AlertCircle, Upload } from 'lucide-react'
// html5-qrcode wordt dynamisch geïmporteerd in de functie

export default function BarcodeNutritionScanner({ db }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [mode, setMode] = useState('scan') // 'scan', 'manual', 'verify'
  const [barcode, setBarcode] = useState('')
  const [productData, setProductData] = useState(null)
  const [nutritionData, setNutritionData] = useState({
    name: '',
    brand: '',
    barcode: '',
    per_100g_kcal: '',
    per_100g_protein: '',
    per_100g_carbs: '',
    per_100g_fat: '',
    per_100g_fiber: '',
    per_100g_sugar: '',
    per_100g_salt: '',
    package_size: '',
    supermarket: ''
  })
  const [photoUrl, setPhotoUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verificationScore, setVerificationScore] = useState(0)
  
  const fileInputRef = useRef(null)
  
  // Check if product exists by barcode
  const checkBarcode = async (code) => {
    setLoading(true)
    try {
      // Check in product_variants table
      const { data: existing, error } = await db.supabase
        .from('product_variants')
        .select('*')
        .eq('ean_code', code)
        .single()
      
      if (existing) {
        setProductData(existing)
        setMode('verify')
        console.log('✅ Product gevonden:', existing.full_name)
      } else {
        // Check Open Food Facts API (free barcode database)
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
        const data = await response.json()
        
        if (data.status === 1) {
          // Product found in Open Food Facts
          const product = data.product
          setNutritionData({
            ...nutritionData,
            name: product.product_name || '',
            brand: product.brands || '',
            barcode: code,
            per_100g_kcal: product.nutriments?.['energy-kcal_100g'] || '',
            per_100g_protein: product.nutriments?.proteins_100g || '',
            per_100g_carbs: product.nutriments?.carbohydrates_100g || '',
            per_100g_fat: product.nutriments?.fat_100g || '',
            per_100g_fiber: product.nutriments?.fiber_100g || '',
            per_100g_sugar: product.nutriments?.sugars_100g || '',
            per_100g_salt: product.nutriments?.salt_100g || ''
          })
          setMode('manual')
          console.log('📦 Product van Open Food Facts:', product.product_name)
        } else {
          // New product - manual entry
          setNutritionData({ ...nutritionData, barcode: code })
          setMode('manual')
          console.log('🆕 Nieuw product - voer data in')
        }
      }
    } catch (error) {
      console.error('Error checking barcode:', error)
      setMode('manual')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle barcode scan with html5-qrcode
  const startBarcodeScanner = async () => {
    // Create modal for scanner
    const scannerModal = document.createElement('div')
    scannerModal.id = 'barcode-scanner-modal'
    scannerModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.95);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    `
    
    scannerModal.innerHTML = `
      <div style="width: 100%; max-width: 500px;">
        <h3 style="color: white; margin-bottom: 20px;">Scan Barcode</h3>
        <div id="reader" style="width: 100%;"></div>
        <button id="close-scanner" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #ef4444;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        ">Sluiten</button>
      </div>
    `
    
    document.body.appendChild(scannerModal)
    
    // Initialize scanner
    const { Html5Qrcode } = await import('html5-qrcode')
    const html5QrCode = new Html5Qrcode("reader")
    
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.7777778
    }
    
    const onScanSuccess = (decodedText) => {
      console.log(`Barcode detected: ${decodedText}`)
      setBarcode(decodedText)
      checkBarcode(decodedText)
      
      // Stop scanning and close modal
      html5QrCode.stop().then(() => {
        document.body.removeChild(scannerModal)
      }).catch(err => console.error('Stop error:', err))
    }
    
    const onScanError = (err) => {
      // Ignore continuous scan errors
    }
    
    // Start scanning
    html5QrCode.start(
      { facingMode: "environment" }, // Use back camera
      config,
      onScanSuccess,
      onScanError
    ).catch(err => {
      console.error(`Unable to start scanning: ${err}`)
      alert('Camera toegang geweigerd of niet beschikbaar')
      document.body.removeChild(scannerModal)
    })
    
    // Close button handler
    document.getElementById('close-scanner').onclick = () => {
      html5QrCode.stop().then(() => {
        document.body.removeChild(scannerModal)
      }).catch(err => console.error('Stop error:', err))
    }
  }
  
  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // Upload to Supabase Storage
      const fileName = `nutrition-labels/${Date.now()}-${file.name}`
      
      try {
        const { data, error } = await db.supabase.storage
          .from('nutrition-photos')
          .upload(fileName, file)
        
        if (!error) {
          const { data: { publicUrl } } = db.supabase.storage
            .from('nutrition-photos')
            .getPublicUrl(fileName)
          
          setPhotoUrl(publicUrl)
          console.log('📸 Photo uploaded:', publicUrl)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }
  
  // Save product to database
  const saveProduct = async () => {
    setLoading(true)
    try {
      const productToSave = {
        full_name: nutritionData.name,
        brand: nutritionData.brand,
        ean_code: nutritionData.barcode,
        per_100g_kcal: parseInt(nutritionData.per_100g_kcal) || 0,
        per_100g_protein: parseFloat(nutritionData.per_100g_protein) || 0,
        per_100g_carbs: parseFloat(nutritionData.per_100g_carbs) || 0,
        per_100g_fat: parseFloat(nutritionData.per_100g_fat) || 0,
        per_100g_fiber: parseFloat(nutritionData.per_100g_fiber) || 0,
        per_100g_sugar: parseFloat(nutritionData.per_100g_sugar) || 0,
        per_100g_salt: parseFloat(nutritionData.per_100g_salt) || 0,
        package_size: parseInt(nutritionData.package_size) || null,
        supermarket: nutritionData.supermarket,
        data_source: 'user_contribution',
        last_verified: new Date()
      }
      
      // Save to product_variants
      const { data, error } = await db.supabase
        .from('product_variants')
        .insert(productToSave)
        .select()
        .single()
      
      if (!error) {
        // Save verification if photo provided
        if (photoUrl) {
          await db.supabase
            .from('nutrition_verifications')
            .insert({
              product_variant_id: data.id,
              verification_method: 'photo',
              photo_url: photoUrl,
              verified_kcal: productToSave.per_100g_kcal,
              verified_protein: productToSave.per_100g_protein,
              verified_carbs: productToSave.per_100g_carbs,
              verified_fat: productToSave.per_100g_fat,
              confidence_score: 90
            })
        }
        
        alert(`✅ Product opgeslagen: ${nutritionData.name}`)
        
        // Reset form
        setNutritionData({
          name: '',
          brand: '',
          barcode: '',
          per_100g_kcal: '',
          per_100g_protein: '',
          per_100g_carbs: '',
          per_100g_fat: '',
          per_100g_fiber: '',
          per_100g_sugar: '',
          per_100g_salt: '',
          package_size: '',
          supermarket: ''
        })
        setPhotoUrl(null)
        setMode('scan')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Error bij opslaan')
    } finally {
      setLoading(false)
    }
  }
  
  // Verify existing product
  const verifyProduct = async () => {
    if (!productData) return
    
    setLoading(true)
    try {
      // Increment verification count
      await db.supabase
        .from('nutrition_verifications')
        .insert({
          product_variant_id: productData.id,
          verification_method: 'confirmation',
          confidence_score: verificationScore,
          notes: 'User confirmed nutrition values are correct'
        })
      
      alert('✅ Bedankt voor de verificatie!')
      setMode('scan')
      setProductData(null)
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{
      background: '#111',
      borderRadius: isMobile ? '12px' : '16px',
      border: '1px solid #333',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderBottom: '1px solid #333',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.2rem' : '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          margin: 0
        }}>
          📱 Nutrition Scanner
        </h3>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.9)',
          marginTop: '0.5rem'
        }}>
          Scan barcode of voer nutrition data in
        </p>
      </div>
      
      {/* Mode Tabs */}
      <div style={{
        display: 'flex',
        padding: '0.5rem',
        borderBottom: '1px solid #333',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setMode('scan')}
          style={{
            flex: 1,
            padding: isMobile ? '0.5rem' : '0.75rem',
            background: mode === 'scan' ? '#10b981' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: mode === 'scan' ? '#fff' : 'rgba(255,255,255,0.7)',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          style={{
            flex: 1,
            padding: isMobile ? '0.5rem' : '0.75rem',
            background: mode === 'manual' ? '#10b981' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: mode === 'manual' ? '#fff' : 'rgba(255,255,255,0.7)',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          Manual
        </button>
      </div>
      
      {/* Content based on mode */}
      <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
        {mode === 'scan' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <button
              onClick={startBarcodeScanner}
              style={{
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <Camera size={24} />
              Start Barcode Scanner
            </button>
            
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <p style={{
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '1rem'
              }}>
                Of voer barcode handmatig in:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="8710400022220"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
                <button
                  onClick={() => checkBarcode(barcode)}
                  disabled={!barcode || loading}
                  style={{
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: barcode ? '#10b981' : '#333',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: barcode ? 'pointer' : 'not-allowed',
                    opacity: barcode ? 1 : 0.5,
                    touchAction: 'manipulation'
                  }}
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'manual' && (
          <div>
            {/* Product Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Product Naam *
                </label>
                <input
                  type="text"
                  value={nutritionData.name}
                  onChange={(e) => setNutritionData({...nutritionData, name: e.target.value})}
                  placeholder="bijv. AH Magere Kwark"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Merk
                </label>
                <input
                  type="text"
                  value={nutritionData.brand}
                  onChange={(e) => setNutritionData({...nutritionData, brand: e.target.value})}
                  placeholder="bijv. AH, Milbona, Arla"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
            </div>
            
            {/* Nutrition Values */}
            <h4 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              Voedingswaarden per 100g
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Calorieën (kcal) *
                </label>
                <input
                  type="number"
                  value={nutritionData.per_100g_kcal}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_kcal: e.target.value})}
                  placeholder="67"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Eiwit (g) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nutritionData.per_100g_protein}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_protein: e.target.value})}
                  placeholder="9.0"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Koolhydraten (g) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nutritionData.per_100g_carbs}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_carbs: e.target.value})}
                  placeholder="4.8"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Vet (g) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nutritionData.per_100g_fat}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_fat: e.target.value})}
                  placeholder="0.2"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Vezels (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nutritionData.per_100g_fiber}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_fiber: e.target.value})}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem'
                }}>
                  Waarvan suikers (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nutritionData.per_100g_sugar}
                  onChange={(e) => setNutritionData({...nutritionData, per_100g_sugar: e.target.value})}
                  placeholder="4.8"
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    touchAction: 'manipulation'
                  }}
                />
              </div>
            </div>
            
            {/* Photo Upload */}
            <div style={{
              padding: '1rem',
              background: '#1a1a1a',
              borderRadius: '8px',
              border: '1px solid #333',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.75rem'
              }}>
                📸 Upload Foto van Label (optioneel)
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  touchAction: 'manipulation'
                }}
              >
                <Upload size={20} />
                Selecteer Foto
              </button>
              {photoUrl && (
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#10b981'
                }}>
                  <Check size={20} />
                  Foto geüpload
                </div>
              )}
            </div>
            
            {/* Save Button */}
            <button
              onClick={saveProduct}
              disabled={loading || !nutritionData.name || !nutritionData.per_100g_kcal}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '1rem',
                background: nutritionData.name && nutritionData.per_100g_kcal
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : '#333',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                cursor: nutritionData.name && nutritionData.per_100g_kcal ? 'pointer' : 'not-allowed',
                opacity: nutritionData.name && nutritionData.per_100g_kcal ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Product Opslaan
                </>
              )}
            </button>
          </div>
        )}
        
        {mode === 'verify' && productData && (
          <div style={{
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <h4 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '1rem'
            }}>
              Product Gevonden!
            </h4>
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              {productData.full_name}
            </p>
            <div style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '1rem'
            }}>
              <div>Eiwit: {productData.per_100g_protein}g</div>
              <div>Koolhydraten: {productData.per_100g_carbs}g</div>
              <div>Vet: {productData.per_100g_fat}g</div>
              <div>Calorieën: {productData.per_100g_kcal} kcal</div>
            </div>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '1rem'
            }}>
              Klopt deze informatie?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={verifyProduct}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                ✓ Klopt
              </button>
              <button
                onClick={() => setMode('manual')}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Aanpassen
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
