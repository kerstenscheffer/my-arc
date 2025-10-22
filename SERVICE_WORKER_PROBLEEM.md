# 🎯 PROBLEEM GEVONDEN: SERVICE WORKER CACHE

## Het Probleem

Je app heeft een **Service Worker** die oude JavaScript cache't:
- **File:** `public/service-worker.js`
- **Geregistreerd in:** `src/main.jsx`

De MealSetupWizard.jsx in de repo is **CORRECT** (VERSION 2.0.0), maar de service worker serveert de oude cached versie!

---

## ✅ OPLOSSING: Service Worker Cache Wissen

### Optie 1: Via Browser DevTools (AANBEVOLEN)

1. **Open de app** in Chrome/Edge
2. **Open DevTools** (F12)
3. **Ga naar Application tab**
4. **Links in sidebar:**
   - Klik op "Service Workers"
   - Zie je een worker? → Klik "Unregister"
   - Klik op "Cache Storage"
   - Rechtsklik elke cache → Delete
5. **Klik "Clear site data" button** (bovenaan in Application tab)
6. **Hard refresh:** `Cmd+Shift+R`

### Optie 2: Incognito Mode (SNELSTE TEST)

Service workers werken NIET in incognito:
1. Open nieuwe incognito window (`Cmd+Shift+N`)
2. Ga naar `http://localhost:5173`
3. Open console
4. Check of je de VERSION banner ziet!

### Optie 3: Via JavaScript Console

Type dit in console:
```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
  console.log('✅ All service workers unregistered')
})

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
  console.log('✅ All caches cleared')
})

// Hard reload
setTimeout(() => location.reload(true), 1000)
```

### Optie 4: Disable Service Worker (Development)

In `src/main.jsx`, comment out de service worker registratie:
```javascript
// navigator.serviceWorker.register('/service-worker.js')  // DISABLED FOR DEV
```

Dan:
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

---

## Verificatie

Na één van bovenstaande stappen, open de wizard en check console.

### ✅ Je MOET zien:

```
================================================================================
🔍 [WIZARD] MealSetupWizard.jsx VERSION 2.0.0 LOADED
📅 [WIZARD] File loaded at: 2025-10-22T...
✅ [WIZARD] AI Generation: ENABLED
✅ [WIZARD] AIMealPlanningService: IMPORTED
================================================================================
```

Dan bij "Genereer Mijn Week!" klik:
```
🖱️  [WIZARD] "Genereer Mijn Week!" button clicked
================================================================================
🚀 [WIZARD] ===== STARTING MEAL PLAN GENERATION =====
================================================================================
```

### ❌ Als je NIET de VERSION banner ziet:

Service worker cache is NOG NIET gecleared!

---

## Waarom Gebeurt Dit?

**Progressive Web Apps (PWA)** gebruiken service workers om:
- Offline functionaliteit
- Snellere laadtijden
- JavaScript caching

**Nadeel:** Bij development krijg je oude cached code!

**Best Practice:** Disable service worker tijdens development.

---

## Quick Fix Command

Run dit in browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister())); caches.keys().then(k => k.forEach(key => caches.delete(key))); setTimeout(() => location.reload(true), 500);
```

Dit:
1. Unregistered alle service workers
2. Wist alle caches
3. Hard reload na 500ms

---

## TL;DR

1. Open DevTools → Application tab
2. Service Workers → Unregister
3. Cache Storage → Delete all
4. Clear site data
5. `Cmd+Shift+R` (hard refresh)
6. Check console voor VERSION banner

**OF gewoon gebruik Incognito mode om te testen!**
