// src/modules/productivity/AgendaBlocksService.js
// CRUD for agenda_blocks (lunch, coaching, custom recurring blocks the
// coach pins to their weekly grid). Replaces the hardcoded PAUZE_BLOCKS
// and COACHING_BLOCKS that used to live in agendaConstants.js.

export default class AgendaBlocksService {
  constructor(db) {
    this.db = db
    this.supabase = db?.supabase || db
  }

  async listForCoach(coachId) {
    try {
      const { data, error } = await this.supabase
        .from('agenda_blocks')
        .select('*')
        .eq('coach_id', coachId)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('listForCoach failed:', e)
      return []
    }
  }

  async create(coachId, block) {
    const payload = {
      coach_id: coachId,
      day: block.day,
      start_time: block.start_time,
      end_time: block.end_time,
      label: block.label || 'Blok',
      type: block.type === 'coaching' ? 'coaching' : 'pauze',
      color: block.color || (block.type === 'coaching' ? '#0ea5e9' : '#64748b'),
      position: block.position ?? 0,
    }
    const { data, error } = await this.supabase
      .from('agenda_blocks').insert(payload).select().single()
    if (error) throw error
    return data
  }

  async update(blockId, updates) {
    const { error } = await this.supabase
      .from('agenda_blocks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', blockId)
    if (error) throw error
  }

  async remove(blockId) {
    const { error } = await this.supabase
      .from('agenda_blocks').delete().eq('id', blockId)
    if (error) throw error
  }
}
