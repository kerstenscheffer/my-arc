# MealSetupWizard Debug Guide

## Expected Console Logs When Generation Works

When you click "Genereer Mijn Week!" button in Step 6, you should see:

```
================================================================================
🚀 [WIZARD] ===== STARTING MEAL PLAN GENERATION =====
================================================================================
🔍 [WIZARD] Function handleGenerateWeek() called at: [timestamp]
📍 [WIZARD] Current step: 6
📍 [WIZARD] Wizard data: {...}
📊 [WIZARD] STEP 1: Extracting selected ingredients...
✅ [WIZARD] Selected ingredients extracted: {...}
🤖 [WIZARD] STEP 2: Initializing AI Meal Planning Service...
✅ [WIZARD] AI Service initialized successfully
👤 [WIZARD] STEP 3: Loading client profile...
✅ [WIZARD] Client profile loaded: {...}
🎯 [WIZARD] STEP 4: Generating AI week plan...
📋 [WIZARD] Generation options: {...}
🚀 Generating AI week plan for: [name]
📊 [number] meals passed scoring (from [total] total)
🏆 Top 5 scoring meals: [...]
✅ [WIZARD] AI Plan generated successfully: {...}
💾 [WIZARD] STEP 5: Saving plan to database...
✅ [WIZARD] Plan saved successfully with ID: [uuid]
📝 [WIZARD] STEP 6: Storing plan in wizard state...
================================================================================
🎉 [WIZARD] ===== GENERATION COMPLETE! =====
================================================================================
📍 [WIZARD] Moving to review step (Step 7)...
🏁 [WIZARD] handleGenerateWeek() completed
```

## If You See Different Logs

If you see messages like:
- "💾 Saving wizard data"
- "✅ Updated existing meal plan generation settings"

**These are NOT from the current code!** This means:

1. **Browser cache issue** - Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Old build is running** - Rebuild the app
3. **Different code path** - Check if there's another wizard file being used

## How to Verify You're Running the Latest Code

1. Open browser DevTools (F12)
2. Go to Console
3. Click "Genereer Mijn Week!" button
4. You should see the banner: `===== STARTING MEAL PLAN GENERATION =====`
5. If you don't see this, you're running old code

## Troubleshooting

### The Button Doesn't Do Anything
- Check if button onClick is firing: Add a breakpoint or check console
- Verify handleGenerateWeek function exists
- Check for JavaScript errors in console

### Button Fires But No Logs Appear
- Check console filters - make sure you're seeing all logs
- Look for any errors that might be throwing before first log

### Generation Stops Partway Through
- Check for red errors in console
- Look for network failures
- Verify database connection is working

## File Location
The code should be in:
`src/modules/meal-plan/components/MealSetupWizard.jsx`

Line ~93: `const handleGenerateWeek = async () => {`
Line ~794: `onClick={handleGenerateWeek}`
