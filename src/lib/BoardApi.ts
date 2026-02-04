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
  const { data, error } = await createBoard('Default', 'Track Items')

  if (error) throw error
  return data as Board
}


/**
 * Create a board
 */
export async function createBoard(title, description): Promise<Board> {
  const { data, error } = await supabase
    .from('board')
    .insert({ board_id: boardId, title })
    .select()
    .single()

  if (error) throw error
  return data as Board
}