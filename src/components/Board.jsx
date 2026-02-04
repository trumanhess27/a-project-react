import { useState, useEffect, useRef } from 'react'
import { initBoard, getAllBoards } from '../lib/BoardApi'
import { getLists, createList, reorderLists } from '../lib/ListApi'
import { getTasksByBoard, reorderTasks } from '../lib/TaskApi'
import List from '../components/List'
import Header from '../components/Header'

export default function Board() {
  const [boards, setBoards] = useState([]) // all boards 
  const [board, setBoard] = useState(null) // currently active board
  const [lists, setLists] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const newListRef = useRef(null)

  // initial load of application, loads a default board created from database if none exist
  useEffect(() => {
    async function init() {
      try {
        const [b, all] = await Promise.all([initBoard(), getAllBoards()])
        setBoard(b)
        setBoards(all.length ? all : [b])
        const [l, t] = await Promise.all([getLists(b.id), getTasksByBoard(b.id)])
        setLists(l)
        setTasks(t)
      } catch (e) {
        console.error('Board init failed', e)
        setError('Failed to load board.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // load a board, watches for change in board id
  useEffect(() => {
    if (!board) return
    async function loadBoard() {
      try {
        setLoading(true)
        const [l, t] = await Promise.all([getLists(board.id), getTasksByBoard(board.id)])
        setLists(l)
        setTasks(t)
      } catch (e) {
        console.error('Failed to load board data', e)
        setError('Failed to load board.')
      } finally {
        setLoading(false)
      }
    }
    loadBoard()
  }, [board?.id])

  // close add new list element on outside click
  useEffect(() => {
    function handler(e) {
      if (newListRef.current && !newListRef.current.contains(e.target)) {
        setIsAddingList(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // List add callback
  async function handleAddList() {
    if (!newListTitle.trim()) return
    try {
      const list = await createList(board.id, newListTitle.trim())
      setLists((prev) => [...prev, list])
      setNewListTitle('')
      setIsAddingList(false)
    } catch (e) {
      console.error('Failed to create list', e)
    }
  }

  // List update callback
  function handleListUpdate(updated) {
    setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  // List delete callback
  function handleListDelete(listId) {
    setLists((prev) => prev.filter((l) => l.id !== listId))
    setTasks((prev) => prev.filter((t) => t.list_id !== listId))
  }

  // List reorder callback
  async function handleListReorder(reorderedLists) {
    setLists(reorderedLists)

    // persist order
    await reorderLists(reorderedLists.map((l, i) => ({ id: l.id, order: i })))
  }

  // Task create callback
  function handleTaskCreate(task) {
    setTasks((prev) => [...prev, task])
  }

  // Task update callback
  function handleTaskUpdate(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  // Task delete callback
  function handleTaskDelete(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  // Task reorder callback
  async function handleTaskReorder(listId, reorderedTasks) {
    setTasks(prev => {
      const otherTasks = prev.filter(t => t.list_id !== listId)
      return [...otherTasks, ...reorderedTasks]
    })

    // persist order
    await reorderTasks(reorderedTasks.map((t, i) => ({ id: t.id, order: i })))
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-900">
        <p className="text-white text-lg animate-pulse">Loading board…</p>
      </div>
    )
  }

  // Error Screen
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-emerald-900">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-lg font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-emerald-950">
      {/* navigation bar */}
      <header className="flex-shrink-0 px-5 py-3 bg-emerald-800 shadow-sm">
        <Header
          boards={boards}
          activeBoard={board}
          onSwitch={setBoard}
          onBoardsChange={setBoards}
        />
      </header>

      {/* horizontal scrolling list area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex gap-3 h-full items-start">
          {lists.map((list, index) => {
            const listTasks = tasks.filter((t) => t.list_id === list.id).sort((a, b) => a.order - b.order)
            return (
              <List
                key={list.id}
                list={list}
                tasks={listTasks}
                allLists={lists}
                listIndex={index}
                listCount={lists.length}
                onListUpdate={handleListUpdate}
                onListDelete={handleListDelete}
                onListReorder={handleListReorder}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskReorder={handleTaskReorder}
              />
            )
          })}

          {/* add list column */}
          <div className="flex-shrink-0 w-72">
            {isAddingList ? (
              <div ref={newListRef} className="bg-white rounded-xl shadow-sm p-3">
                <input
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddList()
                    }
                    if (e.key === 'Escape') {
                      setNewListTitle('')
                      setIsAddingList(false)
                    }
                  }}
                  placeholder="List name"
                  className="w-full text-sm font-semibold text-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddList}
                    className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                  >
                    Add list
                  </button>
                  <button
                    onClick={() => { setNewListTitle(''); setIsAddingList(false) }}
                    className="text-xs text-gray-500 px-3 py-1 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full text-left text-emerald-300 hover:text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="3" x2="8" y2="13" />
                  <line x1="3" y1="8" x2="13" y2="8" />
                </svg>
                Add list
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
