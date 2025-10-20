// Utility component voor correcte prijs weergave
export const PriceDisplay = ({ price, unitType, amount = 100 }) => {
  const isMobile = window.innerWidth <= 768
  
  // Fix common database errors
  const normalizePrice = (price, unit) => {
    if (!price || price === 0) return null
    
    // Convert alles naar prijs per kg voor consistency
    let pricePerKg = price
    
    switch(unit?.toLowerCase()) {
      case '100kg':
        // Database fout - waarschijnlijk bedoeld als per kg
        pricePerKg = price * 10 // Assuming it's actually per 10kg
        break
      case '10kg':
        pricePerKg = price / 10
        break
      case 'kg':
        pricePerKg = price
        break
      case '500g':
        pricePerKg = price * 2
        break
      case '100g':
        pricePerKg = price * 10
        break
      case 'gram':
      case 'g':
        pricePerKg = price * 1000
        break
      default:
        // Assume per kg if no unit specified
        pricePerKg = price
    }
    
    // Sanity check - if price per kg is less than €1 or more than €100, it's probably wrong
    if (pricePerKg < 1) {
      console.warn(`Price seems too low: €${pricePerKg}/kg for unit ${unit}`)
      // Multiply by 10 as correction
      pricePerKg = pricePerKg * 10
    }
    
    if (pricePerKg > 100) {
      console.warn(`Price seems too high: €${pricePerKg}/kg for unit ${unit}`)
      // Divide by 10 as correction
      pricePerKg = pricePerKg / 10
    }
    
    return pricePerKg
  }
  
  const pricePerKg = normalizePrice(price, unitType)
  if (!pricePerKg) return <span style={{ color: 'rgba(255,255,255,0.4)' }}>-</span>
  
  // Calculate price for the requested amount
  const calculatedPrice = (pricePerKg * amount) / 1000
  
  return (
    <span style={{
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      color: '#10b981'
    }}>
      €{calculatedPrice.toFixed(2)}
      <span style={{ 
        color: 'rgba(255,255,255,0.4)', 
        fontSize: '0.7rem',
        marginLeft: '0.25rem'
      }}>
        /{amount}g
      </span>
    </span>
  )
}

// Enhanced display for AdvancedMealSelector
export const IngredientPriceInfo = ({ item }) => {
  const isMobile = window.innerWidth <= 768
  
  if (item.type !== 'ingredient') return null
  
  // Show multiple common portions
  const portions = [
    { amount: 100, label: '100g' },
    { amount: item.default_portion_gram || 150, label: 'Standaard' },
    { amount: 500, label: '500g' }
  ]
  
  return (
    <div style={{
      marginTop: '0.5rem',
      padding: '0.5rem',
      background: 'rgba(16, 185, 129, 0.05)',
      borderRadius: '6px',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '0.25rem'
      }}>
        💰 Prijzen:
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        fontSize: isMobile ? '0.65rem' : '0.7rem'
      }}>
        {portions.map(p => (
          <div key={p.amount}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{p.label}:</span>
            <br />
            <PriceDisplay 
              price={item.price_per_unit} 
              unitType={item.unit_type}
              amount={p.amount}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Database fix queries om uit te voeren
export const DATABASE_FIX_QUERIES = `
-- Fix voor verkeerde unit types
UPDATE ai_ingredients
SET 
  unit_type = CASE
    WHEN unit_type = '100kg' THEN 'kg'
    WHEN unit_type = '100g' THEN 'kg'
    ELSE unit_type
  END,
  price_per_unit = CASE
    WHEN unit_type = '100kg' AND price_per_unit < 1 THEN price_per_unit * 100
    WHEN unit_type = '100g' AND price_per_unit > 50 THEN price_per_unit / 10
    ELSE price_per_unit
  END
WHERE unit_type IN ('100kg', '100g');

-- Sanity check: flag suspicious prices
SELECT 
  name,
  price_per_unit,
  unit_type,
  CASE
    WHEN unit_type = 'kg' AND price_per_unit < 0.5 THEN 'TOO_CHEAP'
    WHEN unit_type = 'kg' AND price_per_unit > 100 THEN 'TOO_EXPENSIVE'
    ELSE 'OK'
  END as price_check
FROM ai_ingredients
WHERE price_per_unit IS NOT NULL
ORDER BY price_check DESC, name;
`
