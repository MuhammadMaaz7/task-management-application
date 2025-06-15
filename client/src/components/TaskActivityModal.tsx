"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  X,
  MessageSquare,
  Activity,
  Send,
  User,
  Clock,
  Edit,
  Share2,
  Trash2,
  CheckCircle,
  RotateCcw,
} from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import type { Task } from "../types"

interface TaskActivityModalProps {
  task: Task
  onClose: () => void
}

interface ActivityItem {
  _id: string
  action: string
  userId: {
    _id: string
    name: string
    email: string
  }
  details: any
  comment?: string
  createdAt: string
}

const TaskActivityModal: React.FC<TaskActivityModalProps> = ({ task, onClose }) => {
  const { getTaskActivity, addTaskComment } = useTask()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const activityData = await getTaskActivity(task._id)
        setActivities(activityData)
      } catch (error) {
        console.error("Failed to fetch activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [task._id, getTaskActivity])

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setIsAddingComment(true)
    try {
      await addTaskComment(task._id, comment)
      setComment("")
      // Refresh activities
      const activityData = await getTaskActivity(task._id)
      setActivities(activityData)
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "updated":
        return <Edit className="w-4 h-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case "reopened":
        return <RotateCcw className="w-4 h-4 text-orange-600" />
      case "shared":
        return <Share2 className="w-4 h-4 text-purple-600" />
      case "commented":
        return <MessageSquare className="w-4 h-4 text-indigo-600" />
      case "deleted":
        return <Trash2 className="w-4 h-4 text-red-600" />
      case "reordered":
        return <Activity className="w-4 h-4 text-gray-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionText = (activity: ActivityItem) => {
    const { action, details, userId } = activity
    const userName = userId.name

    switch (action) {
      case "created":
        return `${userName} created this task`
      case "updated":
        const changes = Object.keys(details).map((key) => {
          if (key === "status") {
            return `status from ${details[key].from} to ${details[key].to}`
          }
          return `${key} from "${details[key].from}" to "${details[key].to}"`
        })
        return `${userName} updated ${changes.join(", ")}`
      case "completed":
        return `${userName} marked this task as completed`
      case "reopened":
        return `${userName} reopened this task`
      case "shared":
        if (details.sharedWith && details.sharedWith.length > 0) {
          const sharedWith = details.sharedWith.map((user: any) => user.email || user.name).join(", ")
          const permission = details.permission || details.sharedWith[0]?.permission || "view"
          return `${userName} shared this task with ${sharedWith} (${permission} permission)`
        }
        return `${userName} shared this task`
      case "commented":
        return `${userName} added a comment`
      case "deleted":
        return `${userName} deleted this task`
      case "reordered":
        return `${userName} reordered ${details.taskCount} tasks`
      default:
        return `${userName} performed an action`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Task Activity</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
          {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
        </div>

        {/* Activity feed */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActionIcon(activity.action)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{getActionText(activity)}</p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(activity.createdAt), "MMM dd, yyyy at h:mm a")}</span>
                      </div>
                    </div>
                    {activity.comment && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                        <p className="text-sm text-gray-700">{activity.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add comment - Allow owner and users with edit permission */}
        {(task.userPermission === "owner" || task.userPermission === "edit") && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={isAddingComment || !comment.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    {isAddingComment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Add Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskActivityModal
