# 📝 Meal Logging Wizard - Documentation

## 🎯 Doel
Client-facing wizard voor het loggen van wat ze daadwerkelijk hebben gegeten. Twee routes:
- **Route X:** Kies uit eerder gemaakte gerechten
- **Route Y:** Maak nieuwe maaltijd (barcode scan + zoeken)

---

## 🏗️ Module Structuur

```
src/modules/meal-logging-wizard/
├── MealLoggingService.js          # Database service (DONE ✅)
├── consumed_meals_schema.sql      # Database schema (DONE ✅)
├── MealLoggingWizard.jsx          # Main component (TODO)
├── components/
│   ├── LogMealButton.jsx          # Entry button (TODO)
│   ├── SelectRouteModal.jsx       # Route X/Y keuze (TODO)
│   ├── ExistingMealsFlow.jsx      # Route X complete (TODO)
│   ├── NewMealFlow.jsx            # Route Y complete (TODO)
│   ├── MealDetailAdjuster.jsx     # Gewichten aanpassen (TODO)
│   ├── IngredientSelector.jsx     # Zoeken/scannen (TODO)
│   └── MealAssemblyView.jsx       # Ingrediënten samenstellen (TODO)
└── README.md                      # Deze file
```

---

## 📊 Database Schema

### Table: `consumed_meals`
Logt wat clients daadwerkelijk hebben gegeten.

**Columns:**
- `id` - UUID primary key
- `client_id` - Link naar client (FK)
- `meal_name` - Naam van de maaltijd
- `meal_id` - Optional link naar custom_meals table
- `ingredients` - JSONB array met ingrediënten
- `calories`, `protein`, `carbs`, `fat` - Macros
- `meal_type` - breakfast/lunch/dinner/snack
- `consumed_at` - Timestamp wanneer gegeten
- `source` - custom_meal/barcode/manual/quick_log
- `notes`, `image_url` - Optional metadata

**Indexes:**
- `client_id` - Voor client queries
- `consumed_at` - Voor datum queries
- `client_id + consumed_at` - Composite voor snelle dag queries

**RLS Policies:**
- Coaches kunnen CRUD voor hun eigen clients

---

## 🔧 MealLoggingService API

### Core Methods

```javascript
// Log een maaltijd
await mealLoggingService.logConsumedMeal(clientId, mealData, consumedAt)

// Haal logs op voor een dag
const logs = await mealLoggingService.getMealLogsByDate(clientId, date)

// Haal logs op voor een range
const logs = await mealLoggingService.getMealLogsByDateRange(clientId, startDate, endDate)

// Update een log
await mealLoggingService.updateMealLog(logId, updates)

// Verwijder een log
await mealLoggingService.deleteMealLog(logId)
```

### Statistics Methods

```javascript
// Bereken dagelijkse totalen
const totals = await mealLoggingService.getDailyTotals(clientId, date)
// Returns: { calories, protein, carbs, fat, mealCount }

// Most logged meals (last 30 days)
const frequent = await mealLoggingService.getMostLoggedMeals(clientId, 30)
```

---

## 🎨 UI Flow

### Entry Point
```jsx
<LogMealButton onClick={() => setShowWizard(true)} />
```
→ Opens `SelectRouteModal`

### Route X: Bestaande Gerechten
1. `SelectRouteModal` → "Bekijk mijn gerechten"
2. `ExistingMealsFlow` (gebruikt `CustomMealsGrid`)
3. Click meal → `MealDetailAdjuster`
4. Pas gewichten aan → "Log deze maaltijd"
5. → Saved to `consumed_meals`

### Route Y: Nieuwe Maaltijd
1. `SelectRouteModal` → "Nieuwe maaltijd maken"
2. `IngredientSelector` (zoeken/scannen/filters)
3. Add ingredient → `MealAssemblyView`
4. "Terug" knop → terug naar `IngredientSelector`
5. "Winkelwagentje" badge: "X ingrediënten"
6. "Log Maaltijd" → Optional: save as custom meal
7. → Saved to `consumed_meals`

---

## 🔄 Hergebruikte Components

✅ **AlternativesModal.jsx** - UI template voor modals
✅ **CustomMealsGrid.jsx** - Voor Route X
✅ **BarcodeScanner.jsx** - Voor Route Y scanning
✅ **OpenFoodFactsService.js** - Externe meal database
✅ **ClientMealBuilder logica** - Voor ingredient flow

---

## 🚀 Integratie in ClientDashboard

### Stap 1: Import MealLoggingService
```javascript
import MealLoggingService from '../modules/meal-logging-wizard/MealLoggingService'
```

### Stap 2: Initialize Service
```javascript
const [mealLoggingService, setMealLoggingService] = useState(null)

useEffect(() => {
  if (db?.supabase) {
    setMealLoggingService(new MealLoggingService(db.supabase))
  }
}, [db])
```

### Stap 3: Add LogMealButton
```javascript
import LogMealButton from '../modules/meal-logging-wizard/components/LogMealButton'

// In render:
<LogMealButton 
  client={selectedClient}
  db={db}
  mealLoggingService={mealLoggingService}
/>
```

---

## 📱 Mobile Optimizations

**Alle components volgen MY ARC mobile-first regels:**
- `const isMobile = window.innerWidth <= 768`
- Font sizes: -10% to -30% on mobile
- Spacing: -25% to -50% on mobile
- Touch targets: minimum 44px
- `touchAction: 'manipulation'`
- `WebkitTapHighlightColor: 'transparent'`
- Hardware acceleration: `transform: translateZ(0)`

**Modal behavior:**
- Slide-up from bottom (zoals AlternativesModal)
- 85vh height
- Sticky headers/footers
- Smooth animations

---

## 🎯 Development Roadmap

### FASE 1: Database Setup ✅
- [x] MealLoggingService.js
- [x] Database schema
- [x] README documentation

### FASE 2: Entry + Route Keuze (NEXT)
- [ ] LogMealButton.jsx
- [ ] SelectRouteModal.jsx

### FASE 3: Route X (Simpelste)
- [ ] ExistingMealsFlow.jsx
- [ ] MealDetailAdjuster.jsx

### FASE 4: Route Y (Complexer)
- [ ] IngredientSelector.jsx
- [ ] MealAssemblyView.jsx
- [ ] Integreer BarcodeScanner

### FASE 5: Polish
- [ ] Animations & transitions
- [ ] Mobile optimization tweaks
- [ ] Error handling
- [ ] Loading states

---

## 🔐 Security

**RLS Policies zorgen voor:**
- Coaches zien alleen data van eigen clients
- Clients kunnen hun eigen data niet direct manipuleren (via coach interface)
- Cascade deletes bij client verwijdering

**Data validation:**
- Macros als integers/decimals
- Consumed_at als timestamp
- Client_id FK constraint

---

## 📊 Future Enhancements

**V2 Features:**
- Photo upload bij logging
- Voice notes voor maaltijden
- AI meal recognition (foto → macros)
- Weekly/monthly reports
- Meal timing patterns
- Favorite meals quick-log
- Template maaltijden (breakfast template, etc.)

---

## 🐛 Troubleshooting

**Service niet beschikbaar:**
- Check of Supabase connection active is
- Verify RLS policies in Supabase dashboard

**Logs niet zichtbaar:**
- Check client_id matches
- Verify consumed_at timestamp correct timezone
- Check RLS policies (coach moet toegang hebben)

**Performance issues:**
- Indexes aanwezig?
- Limit date range queries
- Use pagination voor grote datasets

---

**Built by Kersten 🚀**
**Mobile First. Clean Architecture. MY ARC Style.**
