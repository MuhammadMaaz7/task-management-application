"use client"

import type React from "react"
import { useState } from "react"
import { X, Share2, Users, Eye, Edit, UserPlus, Trash2 } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import type { Task } from "../types"

interface ShareTaskModalProps {
  task: Task
  onClose: () => void
}

const ShareTaskModal: React.FC<ShareTaskModalProps> = ({ task, onClose }) => {
  const { shareTask, unshareTask } = useTask()
  const [emails, setEmails] = useState("")
  const [permission, setPermission] = useState<"view" | "edit">("view")
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (!emails.trim()) return

    setIsSharing(true)
    try {
      const emailList = emails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)

      await shareTask(task._id, emailList, permission)
      setEmails("")
      onClose()
    } catch (error) {
      console.error("Share failed:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleUnshare = async (userEmail: string) => {
    try {
      await unshareTask(task._id, userEmail)
    } catch (error) {
      console.error("Unshare failed:", error)
    }
  }

  const handleChangePermission = async (userEmail: string, newPermission: "view" | "edit") => {
    try {
      // First unshare, then reshare with new permission
      await unshareTask(task._id, userEmail)
      await shareTask(task._id, [userEmail], newPermission)
    } catch (error) {
      console.error("Failed to change permission:", error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Task</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
            {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
          </div>

          {/* Share form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Share with users</label>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Example: user1@example.com, user2@example.com</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permission</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="permission"
                      value="view"
                      checked={permission === "view"}
                      onChange={(e) => setPermission(e.target.value as "view")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">View only - Can see task details</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="permission"
                      value="edit"
                      checked={permission === "edit"}
                      onChange={(e) => setPermission(e.target.value as "edit")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Edit className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Can edit - Can modify task details</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Current shares */}
          {task.sharedWith && task.sharedWith.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Currently shared with</label>
              <div className="space-y-2">
                {task.sharedWith.map((share, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{share.userId.name}</p>
                        <p className="text-xs text-gray-500">{share.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Permission selector */}
                      <select
                        value={share.permission}
                        onChange={(e) => handleChangePermission(share.userId.email, e.target.value as "view" | "edit")}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="view">View Only</option>
                        <option value="edit">Can Edit</option>
                      </select>
                      <button
                        onClick={() => handleUnshare(share.userId.email)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing || !emails.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Share Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareTaskModal
