import supabase from './supabase'

/**
 * Fetch default board or create a board if one does not exist
 */
export async function initBoard(): Promise<Board> {
  const { data: boards, error: fetchErr } = await supabase
    .from('board')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)

  if (fetchErr) throw fetchErr
  if (boards && boards.length > 0) return boards[0] as Board

  // if no boards exist then create one
  return await createBoard('Default', 'Track Items')
}


/**
 * Fetch all boards
 */
export async function getAllBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('board')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Board[]
}

/**
 * Delete a board and its lists and tasks
 */
export async function deleteBoard(boardId: number): Promise<void> {
  // fetch list ids for this board
  const { data: lists, error: listErr } = await supabase
    .from('list')
    .select('id')
    .eq('board_id', boardId)

  if (listErr) throw listErr

  if (lists && lists.length > 0) {
    const listIds = lists.map((l: { id: number }) => l.id)
    // delete tasks first (foreign-key constraint)
    await supabase.from('task').delete().in('list_id', listIds)
    // then delete lists
    await supabase.from('list').delete().in('id', listIds)
  }

  const { error } = await supabase.from('board').delete().eq('id', boardId)
  if (error) throw error
}

/**
 * Create a board
 */
export async function createBoard(title, description): Promise<Board> {
  const { data, error } = await supabase
    .from('board')
    .insert({ title, description })
    .select()
    .single()

  if (error) throw error
  return data as Board
}