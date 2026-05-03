import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

const CLIENT_ID = '3219624960404ea9affae876eceaba44'
const CLIENT_SECRET = 'c92b95cbdecc43b79884e2065f0b4606'
const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token'
const API_URL = 'https://platform.fatsecret.com/rest/server.api'

let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=basic'
  })

  const data = await resp.json()
  if (!data.access_token) throw new Error('No token received')

  cachedToken = data.access_token
  tokenExpiry = Date.now() + 82800000
  return cachedToken!
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const { action, query, barcode, food_id } = body

    const token = await getToken()

    // === SEARCH ===
    if (action === 'search' && query) {
      const params = new URLSearchParams({
        method: 'foods.search',
        search_expression: query,
        format: 'json',
        max_results: '15'
      })

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      const data = await resp.json()
      return new Response(JSON.stringify(data), { headers: CORS_HEADERS })
    }

    // === BARCODE ===
    if (action === 'barcode' && barcode) {
      const params = new URLSearchParams({
        method: 'food.find_id_for_barcode',
        barcode: barcode,
        format: 'json'
      })

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      const data = await resp.json()

      // If found, get full details
      const foundId = data?.food_id?.value
      if (foundId) {
        const detailParams = new URLSearchParams({
          method: 'food.get.v4',
          food_id: foundId,
          format: 'json'
        })

        const detailResp = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: detailParams.toString()
        })

        const detailData = await detailResp.json()
        return new Response(JSON.stringify(detailData), { headers: CORS_HEADERS })
      }

      return new Response(JSON.stringify({ error: 'not_found' }), { headers: CORS_HEADERS })
    }

    // === GET FOOD BY ID ===
    if (action === 'get' && food_id) {
      const params = new URLSearchParams({
        method: 'food.get.v4',
        food_id: food_id,
        format: 'json'
      })

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      const data = await resp.json()
      return new Response(JSON.stringify(data), { headers: CORS_HEADERS })
    }

    // === TOKEN ONLY (legacy) ===
    return new Response(JSON.stringify({ access_token: token }), { headers: CORS_HEADERS })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS
    })
  }
})
