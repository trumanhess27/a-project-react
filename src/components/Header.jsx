import { useState, useRef, useEffect } from 'react'
import { createBoard, deleteBoard } from '../lib/BoardApi'

export default function Header({ boards, activeBoard, onSwitch, onBoardsChange }) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [createError, setCreateError] = useState(null)
  const panelRef = useRef(null)

  const hasMultipleBoards = boards.length > 1

  // close panel on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
        setIsCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // create a new board
  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreateError(null)
    try {
      const board = await createBoard(newTitle.trim(), newDesc.trim() || null)
      onBoardsChange([board, ...boards])
      onSwitch(board)
      setNewTitle('')
      setNewDesc('')
      setIsCreating(false)
      setOpen(false)
    } catch (e) {
      console.error('Failed to create board', e)
      setCreateError('Something went wrong. Try again.')
    }
  }

  // delete a board
  async function handleDelete(board) {
    if (boards.length <= 1) return
    if (!window.confirm(`Delete "${board.title}" and all its lists & tasks?`)) return
    try {
      await deleteBoard(board.id)
      const remaining = boards.filter((b) => b.id !== board.id)
      onBoardsChange(remaining)
      if (activeBoard.id === board.id) onSwitch(remaining[0])
    } catch (e) {
      console.error('Failed to delete board', e)
    }
  }

  // input component for creating a new board
  function renderCreateForm() {
    return (
      <div className="p-3">
        <input
          autoFocus
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleCreate() }
            if (e.key === 'Escape') { setNewTitle(''); setNewDesc(''); setIsCreating(false); setOpen(false) }
          }}
          placeholder="Board name"
          className="w-full text-sm font-semibold text-gray-700 rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleCreate() }
            if (e.key === 'Escape') { setNewTitle(''); setNewDesc(''); setIsCreating(false); setOpen(false) }
          }}
          placeholder="Description (optional)"
          className="w-full text-xs text-gray-600 rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
        />
        {createError && <p className="text-xs text-red-500 mb-2">{createError}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
          >
            Create
          </button>
          <button
            onClick={() => { setNewTitle(''); setNewDesc(''); setIsCreating(false); setCreateError(null); setOpen(false) }}
            className="text-xs text-gray-500 px-3 py-1 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center w-full">



      {/* title and description */}
      <div>
        <h1 className="text-white text-lg font-bold tracking-tight">
          {activeBoard?.title || 'Board'}
        </h1>
        {activeBoard?.description && (
          <p className="text-emerald-200 text-xs mt-0.5">{activeBoard.description}</p>
        )}
      </div>

     
      {/* create new board button / switch boards dropdown */}
      <div ref={panelRef} className="relative flex-shrink-0">

        {hasMultipleBoards ? (
          /* boards dropdown trigger */
          <button
            onClick={() => { setOpen(!open); setIsCreating(false) }}
            className="flex items-center gap-1.5 text-emerald-300 text-sm font-medium py-1.5 px-3 rounded-full bg-emerald-900 hover:bg-emerald-500 hover:text-emerald-950 transition-colors"
          >
            Boards
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <polyline points="4,6 8,10 12,6" />
            </svg>
          </button>
        ) : (
          /* Create New Board button */
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="text-emerald-300 text-sm font-medium py-1.5 px-3 rounded-full bg-emerald-900 hover:bg-emerald-500 hover:text-emerald-950 transition-colors"
          >
            Create New Board
          </button>
        )}

        {/* boards management dropdown */}
        {(open || (!hasMultipleBoards && isCreating)) && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-emerald-100 z-50 overflow-hidden px-2 py-2">
            {hasMultipleBoards && (
              <>
                <ul className="max-h-60 overflow-y-auto ">
                  {boards.map((board) => (
                    <li
                      key={board.id}
                      className={`flex items-center justify-between px-3 py-2 mb-1 rounded group
                        ${board.id === activeBoard?.id ? 'bg-emerald-50' : 'hover:bg-gray-100'}
                        transition-colors`}
                    >
                      <button
                        onClick={() => { onSwitch(board); setOpen(false); setIsCreating(false) }}
                        className="flex-1 text-left"
                      >
                        <span className={`text-sm font-semibold ${board.id === activeBoard?.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {board.title}
                        </span>
                        {board.description && (
                          <p className={`text-xs truncate ${board.id === activeBoard?.id ? 'text-emerald-900' : 'text-gray-600'}`}>{board.description}</p>
                        )}
                      </button>

                      {/* delete icon */}
                      <button
                        onClick={() => handleDelete(board)}
                        className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        aria-label={`Delete ${board.title}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="4" y1="4" x2="12" y2="12" />
                          <line x1="12" y1="4" x2="4" y2="12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* new board trigger */}
            {isCreating ? renderCreateForm() : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full text-left px-3 py-2.5 text-sm text-emerald-700 font-medium hover:bg-emerald-50 flex rounded items-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="3" x2="8" y2="13" />
                  <line x1="3" y1="8" x2="13" y2="8" />
                </svg>
                New board
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
