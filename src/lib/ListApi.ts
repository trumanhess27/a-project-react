import supabase from './supabase'

/**
 * Returns all lists associated with a board
 */
export async function getLists(boardId: number): Promise<List[]> {
  const { data, error } = await supabase
    .from('list')
    .select('*')
    .eq('board_id', boardId)
    .order('id', { ascending: true })

  if (error) throw error
  return data as List[]
}

/**
 * Create a list
 */
export async function createList(boardId: number, title: string): Promise<List> {
  const { data, error } = await supabase
    .from('list')
    .insert({ board_id: boardId, title })
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