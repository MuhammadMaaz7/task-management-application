"use client"

import type React from "react"
import { format } from "date-fns"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Edit2,
  Trash2,
  Calendar,
  Flag,
  Clock,
  Lock,
  Share2,
  Users,
  GripVertical,
  MessageSquare,
  User,
  Eye,
  Crown,
} from "lucide-react"
import type { Task } from "../types"

interface DraggableTaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  onShare: (task: Task) => void
  onViewActivity: (task: Task) => void
  isDragging: boolean
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  onShare,
  onViewActivity,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: task._id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }

  const statusColors = {
    pending: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }

  // Debug logging - add this right after the component props
  console.log("DraggableTaskCard Debug:", {
    taskId: task._id,
    taskTitle: task.title,
    userPermission: task.userPermission,
    isOwner: task.isOwner,
    status: task.status,
    userId: task.userId,
  })

  // Fix the permission checks
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === "pending"
  const isCompleted = task.status === "completed"

  // FIXED: Ensure owner always has full permissions
  const isOwner = task.userPermission === "owner" || task.isOwner === true
  const canEdit = isOwner || task.userPermission === "edit"
  const canDelete = isOwner // Only owner can delete
  const canShare = isOwner // Only owner can share

  console.log("Permission checks result:", {
    taskId: task._id,
    isOwner,
    canEdit,
    canDelete,
    canShare,
    userPermission: task.userPermission,
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
        isCurrentlyDragging
          ? "shadow-lg border-blue-300 rotate-2 scale-105 z-50"
          : task.status === "completed"
            ? "border-emerald-200 bg-emerald-50/30 hover:shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="p-6">
        {/* Header with drag handle and task info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            {/* Drag Handle - Show for owners */}
            {isOwner && (
              <div
                {...attributes}
                {...listeners}
                className={`mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
                  isDragging ? "cursor-grabbing" : ""
                }`}
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3
                  className={`text-lg font-semibold break-words ${
                    task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </h3>

                {/* Sharing and ownership indicators */}
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  {task.isShared && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">
                        Shared ({task.sharedWith?.length || 0})
                      </span>
                    </div>
                  )}

                  {/* Permission badge */}
                  {isOwner ? (
                    <div className="flex items-center space-x-1">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs text-yellow-600 font-medium">Owner</span>
                    </div>
                  ) : task.userPermission === "edit" ? (
                    <div className="flex items-center space-x-1">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Can Edit</span>
                    </div>
                  ) : task.userPermission === "view" ? (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600 font-medium">View Only</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {task.description && (
                <p
                  className={`mt-2 text-sm break-words ${task.status === "completed" ? "text-gray-400" : "text-gray-600"}`}
                >
                  {task.description}
                </p>
              )}

              {/* Assignment info */}
              {task.assignedTo && (
                <div className="mt-2 flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-indigo-600 font-medium">Assigned to: {task.assignedTo.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            <button
              onClick={() => onViewActivity(task)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              title="View activity"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {canShare && (
              <button
                onClick={() => onShare(task)}
                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                title="Share task"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {canEdit && !isCompleted ? (
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            ) : (
              <div
                className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
                title={isCompleted ? "Cannot edit completed tasks" : "No edit permission"}
              >
                {isCompleted ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(task._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Task metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
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

          <div className="flex items-center space-x-3 flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]}`}
            >
              {task.status}
            </span>

            {canEdit && (
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
            )}
          </div>
        </div>

        {/* Footer with timestamps and owner info */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <div>
              {!task.isOwner && task.userId && (
                <span className="mr-4">
                  Owner: {typeof task.userId === 'object' ? task.userId.name : 'Unknown'}
                </span>
              )}
              Created {format(new Date(task.createdAt), "MMM dd, yyyy at h:mm a")}
              {task.completedAt && (
                <span className="ml-4">Completed {format(new Date(task.completedAt), "MMM dd, yyyy at h:mm a")}</span>
              )}
            </div>
            {task.isShared && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{task.sharedWith?.length || 0} shared</span>
              </div>
            )}
          </div>
        </div>

        {/* Completed task notice */}
        {isCompleted && !canEdit && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">This task is completed and cannot be edited.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraggableTaskCard
