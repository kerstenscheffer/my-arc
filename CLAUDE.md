# MY ARC — Project Overview

> Auto-loaded into Claude Code each session. Edit when the structure changes.
> Last mapped: 2026-05-03.

## ⚠️ READ FIRST — Confusion warnings

The repo has **lots of legacy/backup files alongside active code**. Before assuming a file is "the one":

1. **Trace from the entry tree** (`main.jsx` → `App.jsx` → `CoachHub.jsx` / `ClientDashboard.jsx`). Only files reachable via `import` are active.
2. **`CoachHub.jsx` is active. `CoachHubV2.jsx` is disabled** via `useV2CoachHub = false` at `src/App.jsx:58`. Both are imported, only one renders.
3. **Suffixes that mean "do not touch"**: `.backup`, `.backup.*`, `.bak`, `_backup_*`, `-backup*`, `.WORKING*`, `.working`, `.test`, `.dirty`, `.old.*`. Also: `*.jsxu` is a typo extension (treat as broken).
4. **There are dead empty module directories** — see "Suspicious / orphan" below.
5. When in doubt, ask the user before deleting or "fixing" a file that looks legacy.

## Stack

- **Frontend**: React 19, Vite 7, Tailwind 4, `react-router-dom` v7 (but routing is hand-rolled by `window.location.pathname` in App.jsx, not via `<BrowserRouter>`)
- **Backend / data**: Supabase (`@supabase/supabase-js`)
- **Payments**: Stripe (`@stripe/stripe-js`, `stripe` server)
- **Mobile**: Capacitor 8 (iOS in `ios/App/`)
- **Misc**: lucide-react icons, recharts, jspdf, html2canvas, ZXing barcode scanner, puppeteer (server)

Scripts (`package.json`):
- `npm run dev` — Vite dev server
- `npm run build` — production bundle
- `npm run lint` — ESLint
- `npm run preview` — preview built bundle

## Entry tree

```
index.html
  └─ src/main.jsx              mounts <App />
      └─ src/App.jsx           hand-rolled router (pathname switch)
          ├─ public routes     marketing, funnels, checkouts, intake, lead magnets
          └─ authenticated     CoachHub (default) | ClientDashboard (if isClientMode)
```

The "isClientMode" flag is stored in `localStorage` and toggled by login type. Both hubs share login state but render entirely different UIs.

## Public route table (`src/App.jsx`)

| Path | Component | File |
|---|---|---|
| `/` `/client-login` | Login → CoachHub or ClientDashboard | App.jsx:363 |
| `/info` `/home` | InfoPage | `src/pages/InfoPage.jsx` |
| `/12-week-info` | SalesInfoPage | `src/pages/SalesInfoPage.jsx` |
| `/myarcslide` | SalesSlider | `src/pages/SalesSlider.jsx` |
| `/salepage` | SalesScrollPageClean | `src/pages/SalesScrollPageClean.jsx` |
| `/sales` | SalesCallPage | `src/sales-call/SalesCallPage.jsx` |
| `/fitworden` | Homepage | `src/pages/Homepage.jsx` |
| `/checkout` | CheckoutPage | `src/pages/CheckoutPage.jsx` |
| `/8-week-checkout` | EightWeekCheckout | `src/pages/EightWeekCheckout.jsx` |
| `/12-week-checkout` | TwelveWeekCheckout | `src/pages/TwelveWeekCheckout.jsx` |
| `/monthly-checkout` | MonthlySubscriptionCheckout | `src/pages/MonthlySubscriptionCheckout.jsx` |
| `/6month-checkout` | SixMonthSubscriptionCheckout | `src/pages/SixMonthSubscriptionCheckout.jsx` |
| `/success` | inline success page | App.jsx:143 |
| `/postmaker` | LeadPicGenerator | `src/modules/lead-pic-generator/LeadPicGenerator.jsx` |
| `/leadmessage` | LeadMessageFlow | `src/modules/lead-magnet/LeadMessageFlow.jsx` |
| `/ontdek-jouw-route` | QuizPage | `src/lead-magnet/QuizPage.jsx` |
| `/ontdek-jouw-route/resultaat` | ResultPage | `src/lead-magnet/ResultPage.jsx` |
| `/7secrets` | SevenSecretsFunnel | `src/lead-magnet/7secretsfunnel/7SecretsFunnel.jsx` |
| `/giveaway` | GiveawayPage | `src/lead-magnet/7secretsfunnel/GiveawayPage.jsx` |
| `/nutritionintake` | NutritionIntakePage | `src/modules/nutrition-intake/NutritionIntakePage.jsx` |
| `/intake` | IntakePage | `src/intake/IntakePage.jsx` |
| `/myintake` | PublicIntakePage | `src/modules/public-intake/PublicIntakePage.jsx` |
| `/bedankt` | ThankYouPage | `src/intake/ThankYouPage.jsx` |
| `/start` | QualificationFunnelPage | `src/modules/qualification-funnel/index.js` |
| `/onboarding` | ClientOnboarding | `src/client/pages/ClientOnboarding.jsx` |
| `/funnel` | FunnelPage | `src/funnel/FunnelPage.jsx` |
| `/funnel/<slug>` | FunnelViewer | `src/pages/FunnelViewer.jsx` |
| `/90days` | NinetyDaysFunnelPage | `src/funnel/90days/page.jsx` |
| `/5pilar` | FivePillarPage | `src/funnel/five-pilar/FivePillarPage.jsx` |
| `/your-arc` | YourArcFunnel | `src/modules/funnel-pages/your-arc/YourArcFunnel.jsx` |
| `/my-arc` | MyArcFunnel | `src/modules/funnel-pages/my-arc/MyArcFunnelMain.jsx` |
| `/till-the-goal` | TillTheGoalPage | `src/till-the-goal/TillTheGoalPage.jsx` |
| `/hub*` | HubRouter | `src/modules/resource-hub/HubRouter.jsx` |
| `/reset-password` | ResetPassword | `src/components/ResetPassword.jsx` |
| `/privacy` | PrivacyPolicy | `src/pages/PrivacyPolicy.jsx` |
| `/coaching-guide` | CoachingGuidePage | `src/pages/CoachingGuidePage.jsx` |
| `/myarcinfo` | MyArcInfo | `src/pages/myarcinfo/MyArcInfo.jsx` |
| `/meal-preferences` | redirect to `/meal-preferences.html` | App.jsx:213 |

> Note: the `funnel-pages` module is **not empty** despite earlier reports — it contains the active `your-arc` and `my-arc` subfolders.

## CoachHub — `src/coach/CoachHub.jsx`

Hash-routed (`window.location.hash`) tab system. Gold theme. Tabs:

**Primary (always visible):**
| Tab id | Label | Component | Module |
|---|---|---|---|
| `command` | Command | CoachCommandCenter | `modules/coach-command-center/` |
| `leads` | Leads | LeadManagement | `modules/lead-management/` |
| `output` | Output | CoachOutputDashboard | `modules/output-planning/` |

**Inside "Meer" dropdown — `MORE_CATEGORIES` at CoachHub.jsx:72:**

| Category | Tab id | Component | Module |
|---|---|---|---|
| Gameplan | `productivity` | ProductivityHub | `modules/productivity/` |
| Gameplan | `sales` | SalesSection | `modules/sales/` |
| Acquisition | `funnel` | FunnelDashboard | `modules/qualification-funnel/` |
| Clients | `client-intelligence` | ClientInfoTab | `coach/tabs/ClientInfoTab.jsx` |
| Clients | `checkins` | CoachCheckinDashboard | `modules/client-checkin/` |
| Clients | `challenge-hub` | CoachChallengeHub | `coach/pages/CoachChallengeHub.jsx` |
| Clients | `faq` | CoachFAQManager | `modules/faq/` |
| Clients | `results` | ResultsHub | `modules/results/` |
| Plan Making | `plan-wizard` | PlanWizard | `modules/plan-wizard/` |
| Plan Making | `ai-meals` | MealPlanGenerator | `modules/ai-meal-generator/` |
| Plan Making | `meal-templates` | TemplateManager | `modules/meal-templates/` |
| Plan Making | `supplements` | SupplementsTab | `modules/supplements/` |
| Plan Making | `workout-builder` | ManualWorkoutBuilder | `modules/manual-workout-builder/` |
| Plan Making | `calls` | CallPlanningTab | `modules/call-planning/` |
| Plan Making | `coachvids` | CoachVideoTab | `modules/videos/` |
| Plan Making | `workout-analytics` | CoachWorkoutAnalytics | `coach/pages/CoachWorkoutAnalytics.jsx` |
| Systeem | `spots` | SpotsManager | `modules/spots/` |

**Floating overlays in CoachHub:**
- `FloatingTaskTimer` + `StartTaskModal` (productivity timer)
- `ClientContextPanel` (meal context, when `mealPanelClientId` set)
- `WorkoutContextPanel` (workout context, when `workoutPanelClientId` set)
- `CoachNotificationBell` (header)

## ClientDashboard — `src/client/ClientDashboard.jsx`

State-based view switcher (no hash routing here). Bottom nav on mobile, side nav on desktop.

| View id | Label | Component | Location |
|---|---|---|---|
| `home` | Home | ClientHome | `client/pages/ClientHome.jsx` |
| `workout` | Workout | ClientWorkoutPlan | `client/pages/ClientWorkoutPlan.jsx` |
| `meal` | Meal | MealPlanMain | `modules/meal-plan/` |
| `boodschappen` | Boodschappen | ShoppingHub | `modules/shopping/` |
| `tracking` | Tracking | ProgressMain | `modules/progress/` |
| `calls` | Calls | ClientCalls | `modules/call-planning/ClientCalls.jsx` |
| `profile` | Profile | ClientProfile | `client/pages/ClientProfile.jsx` |

**Always-mounted on ClientDashboard:**
- `NotificationWidget` — `modules/notifications/NotificationWidget.jsx`
- `ClientFAQModal` — `modules/faq/ClientFAQModal.jsx`
- `PWAUpdateBanner` — `components/PWAUpdateBanner.jsx`

## `src/modules/` — directory of features

55 module dirs. Below: the active entry component and one-line purpose. Modules confirmed imported by CoachHub or ClientDashboard are marked **(active)**.

| Module | Entry | Purpose |
|---|---|---|
| ai-meal-generator | `MealPlanGenerator.jsx` | **(active CoachHub)** AI meal-plan generator |
| call-planning | `CallPlanningComponents.jsx` (`CallPlanningTab`), `ClientCalls.jsx` | **(active both)** call scheduling — coach + client UIs |
| client-checkin | `CoachCheckinDashboard.jsx` | **(active CoachHub)** check-in dashboard |
| coach-command-center | `CoachCommandCenter.jsx` | **(active CoachHub)** main coach overview |
| faq | `CoachFAQManager.jsx`, `ClientFAQModal.jsx` | **(active both)** FAQ management |
| lead-management | `LeadManagement.jsx` | **(active CoachHub)** leads |
| manual-workout-builder | `ManualWorkoutBuilder.jsx` | **(active CoachHub)** workout builder |
| meal-plan | `MealPlanMain.jsx` (also `AIMealDashboard.jsx`) | **(active ClientDashboard)** client meal plan view |
| meal-templates | `TemplateManager.jsx` | **(active CoachHub)** template management |
| notifications | `CoachNotificationBell.jsx`, `NotificationWidget.jsx` | **(active both)** notifications |
| output-planning | `CoachOutputDashboard.jsx` | **(active CoachHub)** output planning |
| plan-wizard | `PlanWizard.jsx` | **(active CoachHub)** plan creation wizard |
| productivity | `ProductivityHub.jsx` | **(active CoachHub)** kanban + tasks |
| progress | `ProgressMain.jsx` | **(active ClientDashboard)** progress tracking |
| qualification-funnel | `index.js` (named: `FunnelDashboard`, `QualificationFunnelPage`) | **(active CoachHub + public)** funnel analytics + lead funnel |
| results | `ResultsHub.jsx` | **(active CoachHub)** transformation results |
| sales | `SalesSection.jsx` | **(active CoachHub)** sales UI |
| shopping | `ShoppingHub.jsx` | **(active ClientDashboard)** shopping lists |
| spots | `SpotsManager.jsx` | **(active CoachHub)** spots/availability manager |
| supplements | `SupplementsTab.jsx` (+ `SupplementPlanService.js`) | **(active CoachHub)** supplements |
| videos | `CoachVideoTab.jsx`, `ClientVideoLibrary.jsx` | **(active CoachHub)** video library |
| funnel-pages | subfolders `your-arc/`, `my-arc/` | **(active public routes)** marketing funnels |
| lead-magnet | `LeadMessageFlow.jsx` | **(active /leadmessage)** message flow |
| lead-pic-generator | `LeadPicGenerator.jsx` | **(active /postmaker)** image generator |
| nutrition-intake | `NutritionIntakePage.jsx` | **(active /nutritionintake)** intake form |
| public-intake | `PublicIntakePage.jsx` | **(active /myintake)** intake form |
| resource-hub | `HubRouter.jsx` | **(active /hub*)** resource pages |
| assign-challenge | `AssignChallenge.jsx` | challenge assignment — likely indirect use |
| challenges | `ChallengeClientView.jsx` | client challenge view — likely indirect use |
| client-intelligence | `ClientIntelligenceService.js` | service — used inside ClientInfoTab |
| client-journey | `ClientJourneyTimeline.jsx` | timeline component — likely indirect |
| client-management | `ClientManagementCore.jsx` | management interface — likely indirect |
| client-meal-base | `ClientMealBase.jsx` | base meal plans |
| client-meal-builder | `ClientMealBuilder.jsx` | custom meal builder |
| content-batches | `BatchService.js` | content batching service |
| custom-meals | `CustomMealBuilder.jsx` | custom meal creation |
| database-diagnostics | `DatabaseDiagnostics.jsx` | DB debug tool |
| dm-conversation | `dmTrackingService.js` | DM tracking service |
| feedback | `CoachFeedbackInbox.jsx` | feedback inbox |
| funnel-manager | `FunnelManagerDashboard.jsx` | funnel management |
| goals | `index.js` | goals module |
| ingredient-import | `IngredientImportUI.jsx` | ingredient import |
| lead-analytics | `LeadAnalyticsDashboard.jsx` | lead analytics |
| lead-pdf-generator | `LeadPdfGenerator.jsx` | PDF generation |
| meal-logging-wizard | `MealLoggingService.js` | meal logging service |
| notes | `NotesService.js` | notes service |
| nutrition-progress | `NutritionProgressMain.jsx` | nutrition tracking |
| nutrition-scanner | `BarcodeNutritionScanner.jsx` | barcode scanner |
| photos-8ch | `Photos8CH.jsx` | 8-week challenge photos |
| progress-photos | `ProgressPhotos.jsx` | photo gallery |
| progress-widget | `ProgressWidget.jsx` | compact widget |
| video-feedback | `CoachVideoFeedback.jsx` | video feedback |
| weight-tracker | `WeightTracker.jsx` | weight tracking |
| workout | `WorkoutPlan.jsx` | workout display |
| **lead-messages** | empty | dead module dir |
| **resource-hubnano** | empty | dead module dir |
| **workouts** | empty | dead module dir (note: `workout` singular is the active one) |

> "Likely indirect use" = not imported by either hub directly, but probably used by one of the active components or a service. **Confirm before treating as dead.**

## Services — `src/services/`

| File | Status |
|---|---|
| `DatabaseService.js` | ✅ Active — imported as default `db` everywhere |
| `AIMealPlanGeneratorService.js` | ✅ Active |
| `ChallengeService.js` | ✅ Active |
| `ExerciseService.js` | ✅ Active |
| `IngredientImportService.js` | ✅ Active |
| `PasswordResetService.js` | ✅ Active |
| `PDFExportService.js` | ✅ Active |
| `SpotsService.js` | ✅ Active (imported in CoachHub) |
| `WaterService.js` | ✅ Active |
| `WorkoutService.js` | ✅ Active |
| `DatabaseServiceOptimized.js` | ❓ Unknown — verify before using |
| `DatabaseService.backup.js` | ❌ Backup |
| `DatabaseService.backup_20250904_205026.js` | ❌ Backup |
| `DatabaseService.js.backup` | ❌ Backup |
| `DatabaseService.js.backup_with_dupes` | ❌ Backup |
| `DatabaseService.` (no extension) | ❌ Garbage file |
| `AIMealPlanGeneratorService.old.js` | ❌ Old |

## Backend / API — `/api/`

Vercel-style serverless functions (assumed):

| File | Status |
|---|---|
| `create-checkout-session.js` | ✅ Stripe one-time |
| `create-subscription-session.js` | ✅ Stripe subscription |
| `create-6month-subscription.js` | ✅ Stripe 6-month |
| `calendly-webhook.js` | ✅ Calendly hook |
| `calendly-webhook-new.js` | ❓ Newer variant — verify which is wired |
| `setup-webhook.js` | ✅ Webhook setup |
| `check-webhooks.js` | ✅ Diagnostic |
| `stripe-webhook.js` | ✅ Stripe events |
| `hello.js`, `test.js` | smoke-test endpoints |
| `calendly-webhook.js.backup` | ❌ Backup |
| `stripe-webhook-complex.js` | ❓ Old variant? Verify |
| `stripe-webhook.backup.js` | ❌ Backup |

## Suspicious / orphan files (97 backups + dead code)

**Hotspots with the most backups:**
- `src/coach/` — `CoachHub.backup.jsx`, `CoachHub.jsx.backup`, `CoachHub.jsx.bak`
- `src/client/` — `ClientDashboard_backup.jsx`, `ClientDashboard.jsx.backup`, `ClientDashboard.jsx.backup-20250824-104136`, `ClientDashboard.jsx.backup.20250826_142615`
- `src/components/` — 5+ Login backups, AIGenerator backups, Dashboard backups
- `src/client/pages/` — 22 backup files (heavy meal plan / home refactors)
- `src/modules/meal-plan/` — 11 backups + 2 broken `.jsxu` files
- `src/modules/progress/` — 11 backups
- `src/services/` — multiple `DatabaseService.*` variants

**Broken extensions (probably typos):**
- `src/modules/meal-plan/Slide6MealPrep.jsxu`
- `src/pages/CheckoutPage.jsxu`
- `src/services/DatabaseService.` (no extension)
- `src/index.csst` (typo for `.css`?)

**Empty / dead module dirs:**
- `src/modules/lead-messages/`
- `src/modules/resource-hubnano/`
- `src/modules/workouts/` (note: singular `workout/` is the active one)

**Top-level oddities to verify:**
- `src/Layout.jsx` AND `src/components/Layout.jsx` — two Layouts
- `src/till-the-goal/` AND `src/tillthegoal/` — two folders, dash vs none
- `src/index.css` AND `src/index.css.backup` AND `src/index.csst`
- `src/App.jsx.backup` (App backup)

> Cleanup is a separate task — do not delete without explicit confirmation per file.

## Conventions observed in the codebase

- **Inline styles**: heavy use of inline `style={{}}` rather than CSS classes. Both hubs follow this pattern.
- **Theming**: gold (`#FFD700`) is the brand primary across CoachHub and ClientDashboard.
- **Icons**: `lucide-react`, imported per-component.
- **i18n**: `LanguageProvider` wraps authenticated views; `useLanguage()` hook gives `{ t, language, toggleLanguage }`.
- **Mobile detection**: `useIsMobile` hook in `src/hooks/useIsMobile.js` for CoachHub; `window.innerWidth <= 768` for ClientDashboard.
- **Auth pattern**: `db.getCurrentUser()` returns the auth user; for client side, a separate `db.getClientByEmail()` resolves to the client record.
- **Routing**: hand-rolled in App.jsx via `window.location.pathname`. CoachHub uses `window.location.hash` for tabs. `react-router-dom` is in deps but not used at the top level.

## How to navigate quickly

- Need a coach feature? → start at `src/coach/CoachHub.jsx`, find the tab id, jump to its component.
- Need a client feature? → start at `src/client/ClientDashboard.jsx`, find the view id, jump to its component.
- Need a public marketing page? → start at the route table above.
- Need a backend endpoint? → `/api/` (Vercel-style functions).
- Need to know what a module does? → check the module table above.
