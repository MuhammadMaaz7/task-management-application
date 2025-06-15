"use client"

import type React from "react"
import { format } from "date-fns"
import { Edit2, Trash2, Calendar, Flag, Clock, Lock } from "lucide-react"
import type { Task } from "../types"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleStatus }) => {
  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }

  const statusColors = {
    pending: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === "pending"
  const isCompleted = task.status === "completed"

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
        task.status === "completed" ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 hover:border-blue-300"
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${
                task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className={`mt-2 text-sm ${task.status === "completed" ? "text-gray-400" : "text-gray-600"}`}>
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isCompleted ? (
              <div
                className="p-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                title="Cannot edit completed tasks"
              >
                <Lock className="w-4 h-4" />
              </div>
            ) : (
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(task._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}
            >
              <Flag className="w-3 h-3 mr-1" />
              {task.priority} priority
            </span>

            {task.dueDate && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  isOverdue ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {isOverdue ? <Clock className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1" />}
                {format(new Date(task.dueDate), "MMM dd, yyyy")}
                {isOverdue && <span className="ml-1 font-bold">(OVERDUE)</span>}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}
            >
              {task.status}
            </span>

            <button
              onClick={() => onToggleStatus(task._id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                task.status === "completed"
                  ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  : "text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {task.status === "completed" ? "Mark Pending" : "Mark Complete"}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          Created {format(new Date(task.createdAt), "MMM dd, yyyy at h:mm a")}
          {task.completedAt && (
            <span className="ml-4">Completed {format(new Date(task.completedAt), "MMM dd, yyyy at h:mm a")}</span>
          )}
        </div>

        {/* Completed task notice */}
        {isCompleted && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">
                This task is completed and cannot be edited.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
