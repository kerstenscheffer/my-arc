// src/coach/tabs/client-info/components/templates/MotivationCallTemplate.js

/**
 * MOTIVATION & SUPPORT CALL TEMPLATE
 * 
 * For when client is struggling, demotivated, or needs extra support
 * Focus on listening, understanding, and reigniting motivation
 */

export const MotivationCallTemplate = {
  sections: [
    {
      id: 'current_state',
      type: 'text',
      title: '💭 Current State Check-In',
      content: `How are you REALLY feeling right now?


On scale 1-10:
• Motivation: ___
• Energy: ___
• Confidence: ___
• Overwhelm: ___

What triggered this feeling?


How long have you felt this way?

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'whats_hard',
      type: 'text',
      title: '⚠️ What\'s Making This Hard',
      content: `What's the BIGGEST struggle right now?


Specific challenges:
Training: 
Nutrition: 
Life stress: 
Time: 
Other: 

What feels impossible right now?


What are you avoiding and why?

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'wins_remind',
      type: 'text',
      title: '🏆 Remember Your Wins',
      content: `Let's look at how far you've come:

Starting point:
• Weight: ___ kg → Now: ___ kg
• Starting energy: ___ → Now: ___
• Starting fitness: ___ → Now: ___

Non-scale victories you've had:


Habits you've built:


What you CAN do now that you couldn't before:


Progress photos comparison (show them!):

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'why_remember',
      type: 'text',
      title: '🎯 Remember Your WHY',
      content: `Why did you start this journey?


What happens if you quit now?


What happens if you keep going?


Who are you doing this for?


What will achieving this goal mean for you?


How will you FEEL when you reach your goal?

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'perfectionism_reality',
      type: 'text',
      title: '✨ Perfectionism vs Reality',
      content: `What they think they "should" be doing:


Reality check - what's ACTUALLY sustainable:


All-or-nothing thinking patterns:


Progress isn't linear - remind them:
• Bad days happen
• Setbacks are normal
• Consistency > Perfection

Reframe:


`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'simplify_reset',
      type: 'text',
      title: '🔄 Simplify & Reset',
      content: `What can we SIMPLIFY right now?


What can we REMOVE temporarily?


Back to basics approach:
Training: 
Nutrition: 
Habits: 

Minimum viable progress plan:
• Training: ___ days/week minimum
• Nutrition: Just focus on ___
• Habit: One thing - ___

Permission to be imperfect:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'support_needs',
      type: 'text',
      title: '🤝 Support & Resources',
      content: `What support do you need from me?


More check-ins? Less pressure? Different approach?


Do you need:
[ ] More accountability
[ ] Less pressure
[ ] Simpler plan
[ ] More flexibility
[ ] Just someone to listen

External support needed:
• Family understanding?
• Professional help? (therapist, doctor)
• Community support?

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'small_wins',
      type: 'text',
      title: '🎯 Small Wins Strategy',
      content: `Tiny action for TODAY that feels doable:


This week's ONLY goal (make it tiny):


Stack one small win:
Day 1: 
Day 2: 
Day 3: 

Build momentum through micro-habits:


Celebrate these small wins!

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'obstacle_solutions',
      type: 'text',
      title: '🧩 Obstacle-Specific Solutions',
      content: `MAIN OBSTACLE: ___

Practical solutions:
1. 
2. 
3. 

If-then plans:
• If ___ happens, then I will ___
• If ___ happens, then I will ___

Environment changes:


Support strategies:

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'recommitment',
      type: 'text',
      title: '💪 Recommitment Plan',
      content: `Are you ready to keep going? Yes / No / Need time

If yes - what needs to change?


New approach:


What will be DIFFERENT moving forward?


Commitment statement (have them say it):


`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'immediate_actions',
      type: 'text',
      title: '✅ Immediate Next Steps',
      content: `CLIENT ACTIONS (simple & doable):
[ ] 
[ ] 
[ ] 

COACH ACTIONS:
[ ] Adjust program to be more manageable
[ ] Increase check-in frequency
[ ] Send motivation resources
[ ] 

NEXT TOUCHPOINT: ___

EMERGENCY CONTACT:
"If you feel like giving up, text/call me BEFORE you quit"

`,
      timestamp: new Date().toISOString()
    },
    
    {
      id: 'coach_notes',
      type: 'text',
      title: '📝 Coach Observations',
      content: `UNDERLYING ISSUES:


MENTAL/EMOTIONAL STATE:


RED FLAGS TO MONITOR:


COACHING APPROACH ADJUSTMENTS:


FOLLOW-UP PRIORITY:


ADDITIONAL SUPPORT NEEDED:

`,
      timestamp: new Date().toISOString()
    }
  ]
}

export default MotivationCallTemplate
