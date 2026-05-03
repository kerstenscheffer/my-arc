// src/modules/faq/FAQService.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const FAQService = {}

// ─── Laad alle nodes en bouw er een boom van ─────────────────────────────────
FAQService.getTree = async function () {
  try {
    const { data, error } = await supabase
      .from('faq_nodes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    // Bouw boom: maak een map van id → node, koppel children
    const map = {}
    const roots = []

    data.forEach(n => { map[n.id] = { ...n, children: [] } })
    data.forEach(n => {
      if (n.parent_id && map[n.parent_id]) {
        map[n.parent_id].children.push(map[n.id])
      } else if (!n.parent_id) {
        roots.push(map[n.id])
      }
    })

    return roots
  } catch (e) {
    console.error('❌ FAQService.getTree failed:', e)
    return []
  }
}

// ─── Laad flat lijst van alle eindknopen (voor zoeken) ───────────────────────
FAQService.getLeaves = async function () {
  try {
    const { data, error } = await supabase
      .from('faq_nodes')
      .select('*')
      .eq('is_active', true)
      .not('answer', 'is', null)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (e) {
    console.error('❌ FAQService.getLeaves failed:', e)
    return []
  }
}

// ─── CRUD voor CoachFAQManager ────────────────────────────────────────────────
FAQService.createNode = async function (nodeData) {
  try {
    const { data, error } = await supabase
      .from('faq_nodes')
      .insert([{
        parent_id:  nodeData.parent_id || null,
        label:      nodeData.label,
        answer:     nodeData.answer || null,
        deeplink:   nodeData.deeplink || null,
        hint:       nodeData.hint || null,
        whatsapp:   nodeData.whatsapp || null,
        icon:       nodeData.icon || 'HelpCircle',
        sort_order: nodeData.sort_order || 99,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (e) {
    console.error('❌ FAQService.createNode failed:', e)
    return null
  }
}

FAQService.updateNode = async function (id, updates) {
  try {
    const { data, error } = await supabase
      .from('faq_nodes')
      .update({
        label:     updates.label,
        answer:    updates.answer || null,
        deeplink:  updates.deeplink || null,
        hint:      updates.hint || null,
        whatsapp:  updates.whatsapp || null,
        icon:      updates.icon || 'HelpCircle',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (e) {
    console.error('❌ FAQService.updateNode failed:', e)
    return null
  }
}

FAQService.deleteNode = async function (id) {
  try {
    const { error } = await supabase
      .from('faq_nodes')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return true
  } catch (e) {
    console.error('❌ FAQService.deleteNode failed:', e)
    return false
  }
}

FAQService.getAllNodes = async function () {
  try {
    const { data, error } = await supabase
      .from('faq_nodes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (e) {
    console.error('❌ FAQService.getAllNodes failed:', e)
    return []
  }
}

export default FAQService
