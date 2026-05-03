// src/coach/tabs/client-info/components/templates/ProgressCheckTemplate.js

/**
 * PROGRESS CHECK CALL TEMPLATE
 * 
 * Template for weekly/biweekly progress review calls
 * Focuses on wins, challenges, and adjustments
 */

export const ProgressCheckTemplate = {
  sections: [
    {
      id: 'week_overview',
      type: 'text',
      title: '📊 Week Overview',
      content: `Week #: ___
Date: ${new Date().toLocaleDateString('nl-NL')}
Current weight: ___ kg (Last week: ___ kg)
Change: ___ kg

On scale 1-10:
• Energy levels this week: ___
• Motivation: ___
• Stress: ___
• Sleep quality: ___

Overall feeling about the week:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'wins_successes',
      type: 'text',
      title: '🎉 Wins & Successes',
      content: `What went REALLY WELL this week?


Biggest non-scale victory:


Training wins:
• Sessions completed: ___ / ___
• PRs or improvements:
• What felt good:

Nutrition wins:
• Days on track: ___ / 7
• Water intake consistent? Yes / No
• Meal prep done? Yes / No

Mindset/habit wins:


`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'challenges_struggles',
      type: 'text',
      title: '⚠️ Challenges & Struggles',
      content: `What was CHALLENGING this week?


Training struggles:
• Missed sessions? Why:
• Exercises that felt hard:
• Energy during workouts:

Nutrition struggles:
• Days off track: ___
• Trigger situations:
• Cravings/binges:

Life obstacles:
• Stress factors:
• Sleep issues:
• Time management:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'compliance_review',
      type: 'text',
      title: '✅ Compliance Review',
      content: `TRAINING:
Sessions completed: ___ / ___ (___%)
Skipped sessions reason:

NUTRITION:
Days following plan: ___ / 7
Protein target hit: ___ / 7 days
Calories on average: ___ kcal (Target: ___ kcal)

HABITS:
Water intake (2L+): ___ / 7 days
Steps/activity goal: Met? Yes / No
Sleep (7h+): ___ / 7 nights

ACCOUNTABILITY:
Daily check-ins: ___ / 7
Progress photos taken? Yes / No
Measurements updated? Yes / No

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'measurements_progress',
      type: 'text',
      title: '📏 Measurements & Visual Progress',
      content: `WEIGHT TREND:
Starting weight: ___ kg
Last week: ___ kg
This week: ___ kg
Total change: ___ kg

MEASUREMENTS (if taken):
Chest: ___ cm
Waist: ___ cm
Hips: ___ cm
Arms: ___ cm
Legs: ___ cm

VISUAL CHANGES:
• Photos show progress? Yes / No / Slight
• How clothes fit:
• What client notices:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'whats_working',
      type: 'text',
      title: '✨ What\'s Working',
      content: `Training elements working well:


Exercises client loves:


Nutrition approach working:


Habits that stuck:


What to KEEP doing:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'adjustments_needed',
      type: 'text',
      title: '🔧 Adjustments & Changes',
      content: `TRAINING ADJUSTMENTS:
• Intensity: Increase / Decrease / Maintain
• Volume: Add / Remove exercises
• Schedule: Changes needed?

Changes to make:


NUTRITION ADJUSTMENTS:
• Calories: ___ kcal → ___ kcal
• Protein: ___ g → ___ g
• Meal timing adjustments:

Specific changes:


HABIT ADJUSTMENTS:


`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'client_feedback',
      type: 'text',
      title: '💬 Client Feedback & Requests',
      content: `How is the program feeling overall?


Anything too hard?


Anything too easy?


Exercises to swap:


Meals to swap:


Support needed:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'motivation_mindset',
      type: 'text',
      title: '🧠 Motivation & Mindset',
      content: `Current motivation level: ___ / 10

What's keeping them motivated:


Any doubts or concerns:


Mindset wins this week:


Need motivational boost? Yes / No
If yes, approach:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'week_ahead',
      type: 'text',
      title: '📅 Week Ahead Planning',
      content: `UPCOMING CHALLENGES:
• Social events:
• Travel:
• Busy work days:
• Other obstacles:

STRATEGY FOR CHALLENGES:


GOALS FOR NEXT WEEK:
Training: 
Nutrition: 
Habits: 
Personal: 

FOCUS AREA:
What's the #1 thing to nail this week?

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'action_items',
      type: 'text',
      title: '✅ Action Items',
      content: `CLIENT TO DO:
[ ] 
[ ] 
[ ] 

COACH TO DO:
[ ] Update workout program
[ ] Adjust meal plan
[ ] Send updated materials
[ ] 

NEXT CHECK-IN: ___

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'coach_notes',
      type: 'text',
      title: '📝 Coach Notes',
      content: `OBSERVATIONS:


RED FLAGS:


AREAS TO WATCH:


COACHING ADJUSTMENTS:


FOLLOW-UP NEEDED:

`,
      timestamp: new Date().toISOString()
    }
  ]
}

export default ProgressCheckTemplate
