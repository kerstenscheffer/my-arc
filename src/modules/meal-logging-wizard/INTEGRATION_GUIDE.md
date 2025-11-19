# 🚀 Meal Logging Wizard - Integration Guide

## ✅ WAT ER GEBOUWD IS

### FASE 1: Database ✅
- MealLoggingService.js - Aparte service voor meal logging
- consumed_meals_schema.sql - Database schema

### FASE 2: Entry + Route Keuze ✅
- LogMealButton.jsx - Entry button
- SelectRouteModal.jsx - Route X/Y keuze

### FASE 3: Route X (Bestaande Gerechten) ✅
- ExistingMealsFlow.jsx - Custom meals grid + zoeken
- MealDetailAdjuster.jsx - Gewichten aanpassen + loggen

### FASE 4: Route Y (Nieuwe Maaltijd) ✅
- IngredientSelector.jsx - Zoeken + filters + barcode
- MealAssemblyView.jsx - Winkelwagentje + totals
- NewMealFlow.jsx - Orchestrator voor Route Y

### FASE 5: Main Orchestrator ✅
- MealLoggingWizard.jsx - Main component

---

## 📂 HUIDIGE FILE STRUCTURE

```
src/modules/meal-logging-wizard/
├── MealLoggingService.js
├── MealLoggingWizard.jsx
├── README.md
├── components/
│   ├── LogMealButton.jsx
│   ├── SelectRouteModal.jsx
│   ├── ExistingMealsFlow.jsx
│   ├── MealDetailAdjuster.jsx
│   ├── IngredientSelector.jsx
│   ├── MealAssemblyView.jsx
│   └── NewMealFlow.jsx
└── consumed_meals_schema.sql
```

---

## 🛠️ INTEGRATION STEPS

### STAP 1: Database Schema Toevoegen

**Open Supabase Dashboard:**
1. Ga naar SQL Editor
2. New Query
3. Plak inhoud van `consumed_meals_schema.sql`
4. Run

**Verify:**
```sql
SELECT * FROM consumed_meals LIMIT 1;
```

---

### STAP 2: Import in ClientDashboard.jsx

**Locatie:** `src/client/ClientDashboard.jsx`

**Add imports (top van file):**
```javascript
import MealLoggingWizard from '../modules/meal-logging-wizard/MealLoggingWizard'
import MealLoggingService from '../modules/meal-logging-wizard/MealLoggingService'
```

---

### STAP 3: Initialize Service

**In ClientDashboard component, add state:**
```javascript
const [mealLoggingService, setMealLoggingService] = useState(null)
```

**Add useEffect (na andere useEffects):**
```javascript
useEffect(() => {
  if (db?.supabase) {
    const service = new MealLoggingService(db.supabase)
    setMealLoggingService(service)
    console.log('✅ MealLoggingService initialized')
  }
}, [db])
```

---

### STAP 4: Add Wizard Component

**In ClientDashboard render, voeg toe waar je wilt (bijv. na workout section):**
```javascript
{/* Meal Logging Wizard */}
{selectedClient && mealLoggingService && (
  <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
    <MealLoggingWizard
      client={selectedClient}
      db={db}
      mealLoggingService={mealLoggingService}
      onMealLogged={(loggedData) => {
        console.log('✅ Meal logged in dashboard:', loggedData)
        // Optional: refresh data, show notification, etc.
      }}
    />
  </div>
)}
```

---

## 🎯 ALTERNATIVE INTEGRATION LOCATIONS

### Optie 1: In ClientInfoTab (meest logisch)
**Locatie:** `src/modules/client-info-tab/ClientInfoTab.jsx`

**Add na nutrition section:**
```javascript
{/* Meal Logging */}
<div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
  <h3 style={{
    fontSize: isMobile ? '1rem' : '1.125rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: isMobile ? '0.75rem' : '1rem'
  }}>
    📊 Meal Tracking
  </h3>
  
  {mealLoggingService && (
    <MealLoggingWizard
      client={client}
      db={db}
      mealLoggingService={mealLoggingService}
      onMealLogged={handleMealLogged}
    />
  )}
</div>
```

### Optie 2: Als Floating Action Button
```javascript
{/* Sticky FAB */}
<div style={{
  position: 'fixed',
  bottom: isMobile ? '80px' : '2rem',
  right: isMobile ? '1rem' : '2rem',
  zIndex: 1000
}}>
  <MealLoggingWizard
    client={selectedClient}
    db={db}
    mealLoggingService={mealLoggingService}
    onMealLogged={handleMealLogged}
  />
</div>
```

---

## 🔍 TESTING CHECKLIST

### Database Test
```javascript
// Test in browser console:
const service = new MealLoggingService(db.supabase)

// Test log meal
await service.logConsumedMeal('client-uuid', {
  name: 'Test Meal',
  calories: 500,
  protein: 30,
  carbs: 50,
  fat: 15,
  ingredients: []
}, new Date())

// Test get logs
const logs = await service.getMealLogsByDate('client-uuid', new Date())
console.log('Logs:', logs)
```

### UI Test Flow

**Route X:**
1. ✅ Click "Log wat je gegeten hebt"
2. ✅ Click "Bekijk mijn gerechten"
3. ✅ Search works
4. ✅ Click meal → adjuster opens
5. ✅ Adjust weights → totals update realtime
6. ✅ Click "Log deze maaltijd" → success
7. ✅ Check Supabase → row in consumed_meals

**Route Y:**
1. ✅ Click "Log wat je gegeten hebt"
2. ✅ Click "Nieuwe maaltijd maken"
3. ✅ Search ingredient → results show
4. ✅ Click ingredient → assembly view
5. ✅ Cart badge shows "1"
6. ✅ Click "Meer" → back to selector
7. ✅ Add more ingredients
8. ✅ Adjust weights → totals update
9. ✅ Toggle "Opslaan als gerecht"
10. ✅ Click "Log Maaltijd" → success
11. ✅ Check custom_meals (if toggled)
12. ✅ Check consumed_meals

**Barcode Scanner:**
1. ✅ Click "Snel Scannen"
2. ✅ Camera opens
3. ✅ Scan barcode
4. ✅ Product info loads
5. ✅ Added to assembly view

---

## 🐛 TROUBLESHOOTING

### "MealLoggingService is not defined"
→ Check import statement in ClientDashboard
→ Verify service file is in correct location

### "Cannot read property 'supabase' of undefined"
→ Wait for db to initialize before creating service
→ Check useEffect dependency array

### "RLS policy error"
→ Run consumed_meals_schema.sql in Supabase
→ Verify client_id matches coach's clients

### Custom meals not showing
→ Check db.getCustomMeals() returns data
→ Verify client.id is correct

### Barcode scanner not working
→ Check BarcodeScanner import path
→ Verify camera permissions
→ Test on HTTPS (required for camera access)

---

## 📊 SUPABASE QUERIES (Useful)

### View all logged meals
```sql
SELECT 
  cm.*,
  c.name as client_name
FROM consumed_meals cm
JOIN clients c ON c.id = cm.client_id
ORDER BY cm.consumed_at DESC
LIMIT 20;
```

### Daily totals per client
```sql
SELECT 
  client_id,
  DATE(consumed_at) as date,
  COUNT(*) as meal_count,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein
FROM consumed_meals
GROUP BY client_id, DATE(consumed_at)
ORDER BY date DESC;
```

### Most logged meals (last 30 days)
```sql
SELECT 
  meal_name,
  COUNT(*) as log_count,
  AVG(calories) as avg_calories
FROM consumed_meals
WHERE consumed_at > NOW() - INTERVAL '30 days'
GROUP BY meal_name
ORDER BY log_count DESC
LIMIT 10;
```

---

## 🚀 NEXT STEPS (Future Enhancements)

### v2.0 Features
- [ ] Photo upload bij meal logging
- [ ] AI meal recognition (foto → macros)
- [ ] Voice notes
- [ ] Weekly/monthly reports
- [ ] Meal timing patterns analysis
- [ ] Quick-log favorites
- [ ] Template maaltijden

### v2.1 Performance
- [ ] Pagination for large meal lists
- [ ] Cache recent searches
- [ ] Optimistic UI updates
- [ ] Background sync

### v2.2 Analytics
- [ ] Adherence tracking
- [ ] Meal pattern insights
- [ ] Compare planned vs actual
- [ ] Macro distribution charts

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Database schema applied to production Supabase
- [ ] RLS policies tested
- [ ] All imports correct
- [ ] Mobile tested on real device
- [ ] Camera permissions handled gracefully
- [ ] Error messages user-friendly
- [ ] Loading states smooth
- [ ] Animations performant
- [ ] No console errors
- [ ] TypeScript errors resolved (if using TS)

---

**Built with 💪 by Kersten**
**Mobile First. Clean Architecture. MY ARC Style.**
