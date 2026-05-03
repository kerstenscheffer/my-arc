// supabase/functions/fatsecret-oauth1/index.ts
// 🎯 FatSecret OAuth 1.0 - PRODUCTION
// Consumer Key = OAuth 2.0 Client ID (same)
// Consumer Secret = OAuth 1.0 specific (DIFFERENT from OAuth 2.0)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as b64encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const CONSUMER_KEY = '3219624960404ea9affae876eceaba44'
const CONSUMER_SECRET = '5757525107364785b886f10fc7fc37f9'
const API_URL = 'https://platform.fatsecret.com/rest/server.api'

async function hmacSha1(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: { name: 'SHA-1' } }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg))
  return b64encode(sig)
}

function rfc3986(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')
}

function nonce(): string {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let r = ''
  for (let i = 0; i < 32; i++) r += c[Math.floor(Math.random() * c.length)]
  return r
}

async function fatsecretCall(methodParams: Record<string, string>): Promise<any> {
  const params: Record<string, string> = {
    format: 'json',
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: nonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...methodParams
  }

  const sorted = Object.keys(params).sort()
  const normParams = sorted.map(k => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&')
  const baseStr = `POST&${rfc3986(API_URL)}&${rfc3986(normParams)}`
  const sig = await hmacSha1(`${CONSUMER_SECRET}&`, baseStr)

  const allParams = { ...params, oauth_signature: sig }
  const postBody = Object.keys(allParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: postBody
  })

  const text = await resp.text()
  try {
    const json = JSON.parse(text)
    if (json.error) throw new Error(`FatSecret: ${json.error.message} (code ${json.error.code})`)
    return json
  } catch (e) {
    if (e.message?.startsWith('FatSecret:')) throw e
    throw new Error(`FatSecret invalid response: ${text.substring(0, 200)}`)
  }
}

// Parse "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
function parseDescription(desc: string) {
  const r = { calories: 0, protein: 0, carbs: 0, fat: 0, serving: '' }
  if (!desc) return r
  const servMatch = desc.match(/^Per (.+?) -/)
  if (servMatch) r.serving = servMatch[1]
  const cal = desc.match(/Calories:\s*([\d.]+)/); if (cal) r.calories = parseFloat(cal[1])
  const fat = desc.match(/Fat:\s*([\d.]+)/); if (fat) r.fat = parseFloat(fat[1])
  const carb = desc.match(/Carbs:\s*([\d.]+)/); if (carb) r.carbs = parseFloat(carb[1])
  const prot = desc.match(/Protein:\s*([\d.]+)/); if (prot) r.protein = parseFloat(prot[1])
  return r
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }})
  }

  try {
    const { action, query, barcode, food_id, page, region, language } = await req.json()

    // ═══ SEARCH ═══
    if (action === 'search' && query) {
      const params: Record<string, string> = {
        method: 'foods.search',
        search_expression: query,
        max_results: '20',
        page_number: (page || 0).toString()
      }
      if (region) params.region = region
      if (language) params.language = language

      const result = await fatsecretCall(params)
      const foods = result?.foods?.food
      if (!foods) return json({ foods: [], total: 0 })

      const foodArray = Array.isArray(foods) ? foods : [foods]
      return json({
        foods: foodArray.map(f => {
          const macros = parseDescription(f.food_description)
          return {
            food_id: f.food_id,
            name: f.food_name || '',
            brand: f.brand_name || null,
            type: f.food_type || 'Generic',
            serving: macros.serving,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            url: f.food_url || null
          }
        }),
        total: parseInt(result?.foods?.total_results) || foodArray.length,
        page: parseInt(result?.foods?.page_number) || 0
      })
    }

    // ═══ BARCODE ═══
    if (action === 'barcode' && barcode) {
      // Step 1: Find food_id for barcode
      let barcodeResult
      try {
        barcodeResult = await fatsecretCall({
          method: 'food.find_id_for_barcode',
          barcode: barcode
        })
      } catch {
        return json({ food: null, error: 'Barcode not found' })
      }

      const foodId = barcodeResult?.food_id?.value
      if (!foodId) return json({ food: null, error: 'Barcode not found' })

      // Step 2: Get full food details
      const foodResult = await fatsecretCall({
        method: 'food.get.v4',
        food_id: foodId
      })

      const food = foodResult?.food
      if (!food) return json({ food: null, error: 'Food details not found' })

      const servings = food.servings?.serving
      const servingArray = Array.isArray(servings) ? servings : servings ? [servings] : []

      // Find per 100g or default serving
      const per100g = servingArray.find((s: any) =>
        s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g'
      )
      const defaultServing = per100g || servingArray[0]

      return json({
        food: {
          food_id: food.food_id,
          name: food.food_name || '',
          brand: food.brand_name || null,
          barcode: barcode,
          calories_per_100g: defaultServing ? parseFloat(defaultServing.calories) || 0 : 0,
          protein_per_100g: defaultServing ? parseFloat(defaultServing.protein) || 0 : 0,
          carbs_per_100g: defaultServing ? parseFloat(defaultServing.carbohydrate) || 0 : 0,
          fat_per_100g: defaultServing ? parseFloat(defaultServing.fat) || 0 : 0,
          fiber_per_100g: defaultServing ? parseFloat(defaultServing.fiber) || 0 : 0,
          sugar_per_100g: defaultServing ? parseFloat(defaultServing.sugar) || 0 : 0,
          saturated_fat_per_100g: defaultServing ? parseFloat(defaultServing.saturated_fat) || 0 : 0,
          sodium_per_100g: defaultServing ? parseFloat(defaultServing.sodium) || 0 : 0,
          serving_description: defaultServing?.serving_description || null,
          is_per_100g: !!per100g,
          servings: servingArray.map((s: any) => ({
            description: s.serving_description || '',
            metric_amount: parseFloat(s.metric_serving_amount) || 0,
            metric_unit: s.metric_serving_unit || 'g',
            calories: parseFloat(s.calories) || 0,
            protein: parseFloat(s.protein) || 0,
            carbs: parseFloat(s.carbohydrate) || 0,
            fat: parseFloat(s.fat) || 0
          }))
        }
      })
    }

    // ═══ GET FOOD BY ID ═══
    if (action === 'get' && food_id) {
      const foodResult = await fatsecretCall({
        method: 'food.get.v4',
        food_id: food_id
      })

      const food = foodResult?.food
      if (!food) return json({ food: null, error: 'Food not found' })

      const servings = food.servings?.serving
      const servingArray = Array.isArray(servings) ? servings : servings ? [servings] : []
      const per100g = servingArray.find((s: any) =>
        s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g'
      )
      const defaultServing = per100g || servingArray[0]

      return json({
        food: {
          food_id: food.food_id,
          name: food.food_name || '',
          brand: food.brand_name || null,
          calories_per_100g: defaultServing ? parseFloat(defaultServing.calories) || 0 : 0,
          protein_per_100g: defaultServing ? parseFloat(defaultServing.protein) || 0 : 0,
          carbs_per_100g: defaultServing ? parseFloat(defaultServing.carbohydrate) || 0 : 0,
          fat_per_100g: defaultServing ? parseFloat(defaultServing.fat) || 0 : 0,
          fiber_per_100g: defaultServing ? parseFloat(defaultServing.fiber) || 0 : 0,
          sugar_per_100g: defaultServing ? parseFloat(defaultServing.sugar) || 0 : 0,
          saturated_fat_per_100g: defaultServing ? parseFloat(defaultServing.saturated_fat) || 0 : 0,
          sodium_per_100g: defaultServing ? parseFloat(defaultServing.sodium) || 0 : 0,
          serving_description: defaultServing?.serving_description || null,
          is_per_100g: !!per100g,
          servings: servingArray.map((s: any) => ({
            description: s.serving_description || '',
            metric_amount: parseFloat(s.metric_serving_amount) || 0,
            metric_unit: s.metric_serving_unit || 'g',
            calories: parseFloat(s.calories) || 0,
            protein: parseFloat(s.protein) || 0,
            carbs: parseFloat(s.carbohydrate) || 0,
            fat: parseFloat(s.fat) || 0
          }))
        }
      })
    }

    return json({ error: 'Invalid action. Use: search, barcode, or get' }, 400)

  } catch (err) {
    return json({ error: err.message || 'Unknown error' }, 500)
  }
})
