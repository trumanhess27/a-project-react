import supabase from './supabase'

/**
 * Get all tasks by board and list association
 */
export async function getTasksByBoard(boardId: number): Promise<Task[]> {
  // first get all list IDs for this board
  const { data: boardLists, error: listErr } = await supabase
    .from('list')
    .select('id')
    .eq('board_id', boardId)

  if (listErr) throw listErr
  if (!boardLists || boardLists.length === 0) return []

  const listIds = boardLists.map((l: { id: number }) => l.id)

  const { data, error } = await supabase
    .from('task')
    .select('*')
    .in('list_id', listIds)
    .order('order', { ascending: true })

  if (error) throw error
  return data as Task[]
}

/**
 * Create a task, connected to a list
 */
export async function createTask(listId: number, title: string): Promise<Task> {
  // gets the max order for the list this task is being created in
  const { data: maxRow } = await supabase
    .from('task')
    .select('order')
    .eq('list_id', listId)
    .order('order', { ascending: false })
    .limit(1)

  const newOrder = maxRow?.length ? maxRow[0].order + 1 : 0
  
  const { data, error } = await supabase
    .from('task')
    .insert({ list_id: listId, title, status: false })
    .select()
    .single()

  if (error) throw error
  return data as Task
}

/**
 * Update a task
 */
export async function updateTask(taskId: number, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
  const { data, error } = await supabase
    .from('task')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<void> {
  const { error } = await supabase.from('task').delete().eq('id', taskId)
  if (error) throw error
}

/**
 * Reorder all tasks
 */
export async function reorderTasks(tasks: { id: number; order: number }[]): Promise<void> {
  const { error } = await supabase
    .from('task')
    .upsert(tasks, { onConflict: 'id' })

  if (error) throw error
}