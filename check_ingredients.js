import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkIngredients() {
  console.log('🔍 Checking ai_ingredients table...\n')
  
  // Check total count
  const { count, error: countError } = await supabase
    .from('ai_ingredients')
    .select('*', { count: 'exact', head: true })
  
  console.log('Total ingredients:', count)
  if (countError) console.log('Count error:', countError)
  
  // Get sample data
  const { data: all, error: allError } = await supabase
    .from('ai_ingredients')
    .select('id, name, category')
    .limit(10)
  
  console.log('\n📦 Sample data:', all)
  if (allError) console.log('Sample error:', allError)
  
  // Check proteins specifically
  const { data: proteins, error: proteinError } = await supabase
    .from('ai_ingredients')
    .select('id, name, category')
    .eq('category', 'protein')
    .limit(5)
  
  console.log('\n🥩 Proteins found:', proteins?.length || 0)
  console.log('Sample proteins:', proteins)
  if (proteinError) console.log('Protein error:', proteinError)
  
  // Check carbs
  const { data: carbs } = await supabase
    .from('ai_ingredients')
    .select('id, name, category')
    .eq('category', 'carbs')
    .limit(5)
  
  console.log('\n🍞 Carbs found:', carbs?.length || 0)
  console.log('Sample carbs:', carbs)
}

checkIngredients()
