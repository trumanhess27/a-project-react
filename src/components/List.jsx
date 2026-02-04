import { useState, useRef, useEffect } from 'react'
import { updateList, deleteList } from '../lib/ListApi'
import { createTask } from '../lib/TaskApi'
import Card from './Card'

export default function List({ list, tasks, allLists, boards, activeBoard, listIndex, listCount, onListUpdate, onListDelete, onListReorder, onListMigrate, onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const titleRef = useRef(null)
  const newCardRef = useRef(null)
  const newCardInputRef = useRef(null)

  // sync title if parent updates
  useEffect(() => {
    setTitle(list.title)
  }, [list.title])

  // close dropdown menu on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // close add card menu on outside click
  useEffect(() => {
    function handler(e) {
      if (newCardRef.current && !newCardRef.current.contains(e.target)) {
        setNewCardTitle('')
        setIsAddingCard(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // auto focus title edit input if triggered
  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus()
  }, [isEditingTitle])

  // auto focus card edit input if triggered
  useEffect(() => {
    if (isAddingCard && newCardInputRef.current) newCardInputRef.current.focus()
  }, [isAddingCard])

  async function handleTitleSave() {
    setIsEditingTitle(false)
    if (title.trim() !== list.title) {
      try {
        await updateList(list.id, { title: title.trim() })
        onListUpdate({ ...list, title: title.trim() })
      } catch (e) {
        console.error('Failed to update list title', e)
        setTitle(list.title)
      }
    }
  }

  async function handleDeleteList() {
    setShowMenu(false)
    if (!confirm(`Delete list "${list.title}" and all its cards?`)) return
    try {
      await deleteList(list.id)
      onListDelete(list.id)
    } catch (e) {
      console.error('Failed to delete list', e)
    }
  }

  function handleMoveList(direction) {
    const swapIndex = direction === 'left' ? listIndex - 1 : listIndex + 1
    const newLists = [...allLists];
    [newLists[listIndex], newLists[swapIndex]] = [newLists[swapIndex], newLists[listIndex]]
    onListReorder(newLists)
  }

  async function handleMigrateList(targetBoardId) {
    setShowMenu(false)
    onListMigrate(list.id, targetBoardId)
  }

  async function handleAddCard() {
    if (!newCardTitle.trim()) return
    try {
      const task = await createTask(list.id, newCardTitle.trim())
      onTaskCreate(task)
      setNewCardTitle('')
      setIsAddingCard(false)
    } catch (e) {
      console.error('Failed to create task', e)
    }
  }

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl flex flex-col max-h-full">
      {/* list header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleTitleSave() }
              if (e.key === 'Escape') { setTitle(list.title); setIsEditingTitle(false); }
            }}
            className="text-sm font-bold text-gray-700 bg-white border border-emerald-400 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            onKeyDown={(e) => {
              if (e.key == 'Enter') { e.preventDefault(); setIsEditingTitle(true); }
            }}
            tabIndex="0"
            className="text-sm font-bold text-gray-700 cursor-pointer hover:text-emerald-600 select-none"
          >
            {list.title}
          </h2>
        )}

        {/* list menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            aria-label="List options"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-lg px-2 py-2 shadow-lg w-40 py-1">
              <button
                onClick={() => { setShowMenu(false); setIsEditingTitle(true) }}
                className="block w-full text-left text-sm text-gray-700 px-3 py-1.5 mb-1 rounded hover:bg-gray-100 transition-colors"
              >
                Rename
              </button>

              {listCount > 1 && (
                <div>
                  <button
                    onClick={() => { setShowMenu(false); handleMoveList('left') }}
                    disabled={listIndex === 0}
                    className="block w-full text-left text-sm text-gray-700 px-3 py-1.5 mb-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Move left
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleMoveList('right') }}
                    disabled={listIndex === listCount - 1}
                    className="block w-full text-left text-sm text-gray-700 px-3 py-1.5 mb-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Move right
                  </button>
                </div>
              )}

              {boards?.filter((b) => b.id !== activeBoard?.id).length > 0 && (
                <div className="border-y border-gray-100 my-1 py-1 px-3">
                  <p className="text-sm text-emerald-900 font-semibold mb-1">
                    Move to board
                  </p>
                  {boards
                    .filter((b) => b.id !== activeBoard?.id)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleMigrateList(b.id)}
                        className="block w-full text-left text-sm text-gray-700 px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {b.title}
                      </button>
                    ))}
                </div>
              )}

              <button
                onClick={handleDeleteList}
                className="block w-full text-left text-sm text-red-600 px-3 py-1.5 mt-1 rounded hover:bg-red-50 transition-colors"
              >
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* cards (scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 pb-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {tasks.map((task, index) => (
          <Card
            key={task.id}
            task={task}
            taskIndex={index}
            taskCount={tasks.length}
            lists={allLists}
            onUpdate={onTaskUpdate}
            onDelete={onTaskDelete}
            onReorder={(direction) => {
              const newTasks = [...tasks];
              const swapIndex = direction === 'up' ? index - 1 : index + 1;
              [newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]];
              onTaskReorder(list.id, newTasks)
            }}
          />
        ))}
      </div>

      {/* add card area */}
      <div className="px-2 pb-2 pt-1">
        {isAddingCard ? (
          <div ref={newCardRef} className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
            <textarea
              ref={newCardInputRef}
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() }
                if (e.key === 'Escape') { setNewCardTitle(''); setIsAddingCard(false) }
              }}
              placeholder="Enter a title"
              className="w-full text-sm text-gray-800 border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddCard}
                className="text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setNewCardTitle(''); setIsAddingCard(false) }}
                className="text-sm text-gray-500 px-3 py-1 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="2" x2="7" y2="12" />
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  )
}
