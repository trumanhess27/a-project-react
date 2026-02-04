import supabase from './supabase'

/**
 * Returns all lists associated with a board
 */
export async function getLists(boardId: number): Promise<List[]> {
  const { data, error } = await supabase
    .from('list')
    .select('*')
    .eq('board_id', boardId)
    .order('order', { ascending: true })

  if (error) throw error
  return data as List[]
}

/**
 * Create a list
 */
export async function createList(boardId: number, title: string): Promise<List> {
  // get order from max existing order on this board + 1, or 0 if empty
  const { data: maxRow } = await supabase
    .from('list')
    .select('order')
    .eq('board_id', boardId)
    .order('order', { ascending: false })
    .limit(1)

  const newOrder = maxRow?.length ? maxRow[0].order + 1 : 0

  const { data, error } = await supabase
    .from('list')
    .insert({ board_id: boardId, title, order: newOrder })
    .select()
    .single()

  if (error) throw error
  return data as List
}

/**
 * Update a list
 */
export async function updateList(listId: number, updates: Partial<Omit<List, 'id' | 'created_at'>>): Promise<List> {
  const { data, error } = await supabase
    .from('list')
    .update(updates)
    .eq('id', listId)
    .select()
    .single()

  if (error) throw error
  return data as List
}

/**
 * Delete a list
 */
export async function deleteList(listId: number): Promise<void> {
  // Delete tasks belonging to this list first
  await supabase.from('task').delete().eq('list_id', listId)

  const { error } = await supabase.from('list').delete().eq('id', listId)
  if (error) throw error
}

/**
 * Persist a new list order when triggered
 */
export async function reorderLists(lists: { id: number; order: number }[]): Promise<void> {
  const { error } = await supabase
    .from('list')
    .upsert(lists, { onConflict: 'id' })

  if (error) throw error
}

/**
 * Migrate a list and all the tasks associated with it to another board
 */
export async function migrateList(listId: number, targetBoardId: number): Promise<List> {
  // find the current max order on the destination board
  const { data: maxRow } = await supabase
    .from('list')
    .select('order')
    .eq('board_id', targetBoardId)
    .order('order', { ascending: false })
    .limit(1)

  const newOrder = maxRow?.length ? maxRow[0].order + 1 : 0

  const { data, error } = await supabase
    .from('list')
    .update({ board_id: targetBoardId, order: newOrder })
    .eq('id', listId)
    .select()
    .single()

  if (error) throw error
  return data as List
}