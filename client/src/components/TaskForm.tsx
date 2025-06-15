"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { X, Calendar, Flag, FileText, Tag, Lock, AlertTriangle, Users, Plus, Trash2 } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import type { Task } from "../types"

interface TaskFormProps {
  task?: Task
  onClose: () => void
}

interface FormData {
  title: string
  description: string
  dueDate: string
  priority: "low" | "medium" | "high"
  tags: string
}

interface ShareInfo {
  email: string
  permission: "view" | "edit"
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose }) => {
  const { createTask, updateTask } = useTask()
  const isEditing = !!task
  const isCompleted = task?.status === "completed"

  // Fix the permission check
  const isOwner = !task || task.userPermission === "owner" || task.isOwner === true
  const canEdit = isOwner || task?.userPermission === "edit"

  console.log("TaskForm Permission Debug:", {
    taskId: task?._id,
    userPermission: task?.userPermission,
    isOwner: task?.isOwner,
    calculatedIsOwner: isOwner,
    canEdit: canEdit,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCompletedWarning, setShowCompletedWarning] = useState(isCompleted)
  const [showShareSection, setShowShareSection] = useState(false)
  const [shareList, setShareList] = useState<ShareInfo[]>([])
  const [newShareEmail, setNewShareEmail] = useState("")
  const [newSharePermission, setNewSharePermission] = useState<"view" | "edit">("view")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
      priority: task?.priority || "medium",
      tags: task?.tags?.join(", ") || "",
    },
  })

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title || "",
        description: task.description || "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        priority: task.priority || "medium",
        tags: task.tags?.join(", ") || "",
      })
      setShowCompletedWarning(task.status === "completed")

      // Initialize share list for editing
      if (task.sharedWith) {
        setShareList(
          task.sharedWith.map((share) => ({
            email: share.userId.email,
            permission: share.permission,
          })),
        )
      }
    }
  }, [task, reset])

  const addToShareList = () => {
    if (!newShareEmail.trim()) return

    // Check if email already exists
    if (shareList.some((share) => share.email === newShareEmail)) {
      alert("User already in share list")
      return
    }

    setShareList([...shareList, { email: newShareEmail, permission: newSharePermission }])
    setNewShareEmail("")
    setNewSharePermission("view")
  }

  const removeFromShareList = (email: string) => {
    setShareList(shareList.filter((share) => share.email !== email))
  }

  const updateSharePermission = (email: string, permission: "view" | "edit") => {
    setShareList(shareList.map((share) => (share.email === email ? { ...share, permission } : share)))
  }

  const onSubmit = async (data: FormData) => {
    if (isCompleted && !isOwner) {
      return // Prevent submission for completed tasks by non-owners
    }

    setIsSubmitting(true)
    try {
      const taskData = {
        title: data.title,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
        priority: data.priority,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
        ...(!isEditing && shareList.length > 0 && { shareWith: shareList }),
      }

      if (isEditing) {
        await updateTask(task._id, taskData)
      } else {
        await createTask(taskData)
      }

      onClose()
    } catch (error) {
      console.error("Error saving task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            {isCompleted && <Lock className="w-5 h-5 text-gray-500" />}
            <span>{isEditing ? "Edit Task" : "Create New Task"}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Completed task warning */}
        {showCompletedWarning && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Cannot Edit Completed Task</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This task is marked as completed and cannot be edited. Please mark it as pending first if you need to
                  make changes.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Title</span>
            </label>
            <input
              type="text"
              {...register("title", { required: "Title is required" })}
              disabled={isCompleted}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isCompleted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              placeholder="Enter task title..."
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              disabled={isCompleted}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                isCompleted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              placeholder="Enter task description (optional)..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                {...register("dueDate")}
                disabled={isCompleted}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isCompleted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4" />
                <span>Priority</span>
              </label>
              <select
                {...register("priority")}
                disabled={isCompleted}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isCompleted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                }`}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              <span>Tags</span>
            </label>
            <input
              type="text"
              {...register("tags")}
              disabled={isCompleted}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isCompleted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
              }`}
              placeholder="Enter tags separated by commas..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas (e.g., work, urgent, meeting)
            </p>
          </div>

          {/* Share Section - Only for new tasks or task owners */}
          {(!isEditing || isOwner) && !isCompleted && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Share Task</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowShareSection(!showShareSection)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showShareSection ? "Hide" : "Add People"}
                </button>
              </div>

              {showShareSection && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newShareEmail}
                      onChange={(e) => setNewShareEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={newSharePermission}
                      onChange={(e) => setNewSharePermission(e.target.value as "view" | "edit")}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="view">View Only</option>
                      <option value="edit">Can Edit</option>
                    </select>
                    <button
                      type="button"
                      onClick={addToShareList}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {shareList.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Will be shared with:</p>
                      {shareList.map((share, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{share.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={share.permission}
                              onChange={(e) => updateSharePermission(share.email, e.target.value as "view" | "edit")}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="view">View Only</option>
                              <option value="edit">Can Edit</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeFromShareList(share.email)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isCompleted && !isOwner)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isCompleted && !isOwner
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              }`}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm
