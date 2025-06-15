"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import DraggableTaskCard from "./DraggableTaskCard"
import type { Task } from "../types"
import { useTask } from "../contexts/TaskContext"

interface DraggableTaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  onShare: (task: Task) => void
  onViewActivity: (task: Task) => void
}

const DraggableTaskList: React.FC<DraggableTaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onShare,
  onViewActivity,
}) => {
  const { reorderTasks } = useTask()
  const [localTasks, setLocalTasks] = useState(tasks)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Keep localTasks in sync with incoming props
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = localTasks.findIndex((task) => task._id === active.id)
    const newIndex = localTasks.findIndex((task) => task._id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasks = arrayMove(localTasks, oldIndex, newIndex)
      setLocalTasks(newTasks)

      try {
        await reorderTasks(newTasks.map((task) => task._id))
      } catch (error) {
        setLocalTasks(tasks) // Revert on error
      }
    }
  }

  if (localTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
        <p className="text-gray-600">Create your first task or adjust your filters to see tasks here.</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={localTasks.map((task) => task._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={`space-y-4 ${isDragging ? "select-none" : ""}`}>
          {localTasks.map((task) => (
            <DraggableTaskCard
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onShare={onShare}
              onViewActivity={onViewActivity}
              isDragging={isDragging}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default DraggableTaskList
