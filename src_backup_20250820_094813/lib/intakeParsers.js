// src/lib/intakeParsers.js
export function parseMealPreferences(text = ''){
  const out = {
    diet: null,            // e.g. 'normal' | 'vegetarian' | 'vegan' | 'halal' | ...
    likes: [],             // ['chicken','rice','oats']
    dislikes: [],          // ['mushrooms','tuna']
    allergies: [],         // ['lactose','nuts']
    avoid: [],             // ['pork','alcohol']
    notes: ''
  }
  if(!text) return out

  const lines = text
    .replace(/\r/g,'')
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean)

  const takeList = (s) => s
    .split(/[,;\u2022\-]/)
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)

  for(const ln of lines){
    const l = ln.toLowerCase()
    if(/diet|dieet|way of eating|voedingstype/.test(l)){
      const m = l.match(/:\s*(.*)$/)
      if(m) out.diet = m[1].trim()
      continue
    }
    if(/likes|vind.*lekker|prefer|voorkeuren/.test(l)){
      const m = l.split(/:\s*/)[1]; if(m) out.likes.push(...takeList(m))
      continue
    }
    if(/dislikes|lust.*niet|haat|vermijd/.test(l)){
      const m = l.split(/:\s*/)[1]; if(m) out.dislikes.push(...takeList(m))
      continue
    }
    if(/allerg/i.test(l)){
      const m = l.split(/:\s*/)[1]; if(m) out.allergies.push(...takeList(m))
      continue
    }
    if(/avoid|niet|geen\b/.test(l)){
      if(l.includes('geen') || l.includes('vermijd') || l.startsWith('- ')){
        out.avoid.push(...takeList(l.replace(/^(\-\s*)/,'').replace(/^(vermijd\s*:\s*)/,'').replace(/^geen\s*/,'')))
        continue
      }
    }
    // Fallback: capture free text in notes
    out.notes += (out.notes ? '\n' : '') + ln
  }

  // de-dup
  const dedup = (arr) => Array.from(new Set(arr))
  out.likes = dedup(out.likes)
  out.dislikes = dedup(out.dislikes)
  out.allergies = dedup(out.allergies)
  out.avoid = dedup(out.avoid)

  return out
}
