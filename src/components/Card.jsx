import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { updateTask, deleteTask, moveTask } from '../lib/TaskApi'

export default function Card({ task, taskIndex, taskCount, lists, onUpdate, onDelete, onReorder }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [dueDate, setDueDate] = useState(task.due ? new Date(task.due) : null)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const cardEditRef = useRef(null)
  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)
  const titleRef = useRef(null)

  // keep local state in sync if parent updates the task
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setDueDate(task.due ? new Date(task.due) : null)
  }, [task.title, task.description, task.due])

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

  // close card edit on outside click and attempt to save
  useEffect(() => {
    function handler(e) {
      if (cardEditRef.current && !cardEditRef.current.contains(e.target)) {
        handleSave()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // focus title input when editing starts
  useEffect(() => {
    if (isEditing && titleRef.current) titleRef.current.focus()
  }, [isEditing])

  async function handleSave() {
    setIsEditing(false)
    const due = dueDate ? dueDate.toISOString().split('T')[0] : null
    const updates = { title, description, due }
    try {
      await updateTask(task.id, updates)
      onUpdate({ ...task, ...updates })
    } catch (e) {
      console.error('Failed to save task', e)
      // revert changes
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.due ? new Date(task.due) : null)
    }
  }

  async function handleDelete() {
    setShowMenu(false)
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await deleteTask(task.id)
      onDelete(task.id)
    } catch (e) {
      console.error('Failed to delete task', e)
    }
  }

  async function handleMove(newListId) {
    setShowMenu(false)
    if (String(newListId) === String(task.list_id)) return
    try {
      const moved = await moveTask(task.id, Number(newListId))
      onUpdate(moved)
    } catch (e) {
      console.error('Failed to move task', e)
    }
  }

  async function handleToggleComplete() {
    const newStatus = !task.status
    try {
      await updateTask(task.id, { status: newStatus })
      onUpdate({ ...task, status: newStatus })
    } catch (e) {
      console.error('Failed to update status', e)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-2 group">
      {isEditing ? (
        <div ref={cardEditRef}>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSave()
              }
              if (e.key === 'Escape') {
                setTitle(task.title)
                setDescription(task.description || '')
                setDueDate(task.due ? new Date(task.due) : null)
                setIsEditing(false)
              }
            }}
            placeholder="Add a title"
            className="w-full text-sm font-semibold text-gray-800 rounded px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
            rows={2}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setTitle(task.title)
                setDescription(task.description || '')
                setDueDate(task.due ? new Date(task.due) : null)
                setIsEditing(false)
              }
            }}
            placeholder="Add a description"
            className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
            rows={3}
          />
          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            placeholderText="Set a due date"
            isClearable
            dateFormat="MMM d, yyyy"
            className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTitle(task.title)
                setDescription(task.description || '')
                setDueDate(task.due ? new Date(task.due) : null)
                setIsEditing(false)
              }}
              className="text-xs text-gray-500 px-3 py-1 rounded hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* header row with checkbox, title, context menu toggle */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 pr-2">
              <input
                type="checkbox"
                checked={task.status}
                onChange={handleToggleComplete}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 cursor-pointer accent-emerald-600 flex-shrink-0"
              />
              <p
                onClick={() => setIsEditing(true)}
                className={` font-semibold leading-snug cursor-pointer hover:text-emerald-600 transition-colors ${task.status ? 'line-through text-gray-400' : 'text-gray-800'}`}
              >
                {task.title}
              </p>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                ref={menuBtnRef}
                onClick={() => {
                  if (!showMenu) {
                    const rect = menuBtnRef.current.getBoundingClientRect()
                    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                  }
                  setShowMenu(!showMenu)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-0.5 rounded"
                aria-label="Card options"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="3" cy="8" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="13" cy="8" r="1.5" />
                </svg>
              </button>
              {/* card context menu */}
              {showMenu && (
                <div className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-44 py-2 px-2" style={{ top: menuPos.top, right: menuPos.right }}>
                  <button
                    onClick={() => { setShowMenu(false); setIsEditing(true) }}
                    className="block w-full text-left text-sm text-gray-700 mb-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>

                  {taskCount > 1 && (
                    <div>
                      <button
                        onClick={() => { setShowMenu(false); onReorder('up') }}
                        disabled={taskIndex === 0}
                        className="block w-full text-left text-sm text-gray-700 px-3 py-1.5 mb-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Move up
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onReorder('down') }}
                        disabled={taskIndex === taskCount - 1}
                        className="block w-full text-left text-sm text-gray-700 px-3 py-1.5 mb-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        Move down
                      </button>
                    </div>
                  )}

                  {lists?.filter((l) => String(l.id) !== String(task.list_id)).length > 0 && (
                    <div className="border-y border-gray-100 mb-1 py-1 px-3">
                      <p className="text-sm text-emerald-900 font-semibold mb-1">
                        Move to list
                      </p>
                      {lists
                        .filter((l) => String(l.id) !== String(task.list_id))
                        .map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handleMove(l.id)}
                            className="block w-full text-left text-sm text-gray-700 px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            {l.title}
                          </button>
                        ))}
                    </div>
                  )}

                  <div>
                    <button
                      onClick={handleDelete}
                      className="block w-full text-left text-sm text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* description preview */}
          {task.description && (
            <p className={`text-sm mt-1 leading-relaxed line-clamp-2 ${task.status ? 'line-through text-gray-400' : 'text-gray-500'}`}>
              {task.description}
            </p>
          )}

          {/* due date */}
          {task.due && (
            <p className={`text-sm ${task.status ? 'line-through text-gray-400' : 'text-gray-500'}`}>Due: {task.due}</p>
          )}

        </>
      )}
    </div>
  )
}
