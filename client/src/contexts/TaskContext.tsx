"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { tasksAPI } from "../lib/api"
import type { Task, TaskStats } from "../types"
import { useAuth } from "./AuthContext"
import toast from "react-hot-toast"

interface TaskContextType {
  tasks: Task[]
  stats: TaskStats | null
  loading: boolean
  pagination: any
  createTask: (task: {
    title: string
    description?: string
    priority?: "low" | "medium" | "high"
    dueDate?: string
    tags?: string[]
    assignedTo?: string
    shareWith?: Array<{ email: string; permission: "view" | "edit" }>
  }) => Promise<void>
  updateTask: (
    id: string,
    updates: {
      title?: string
      description?: string
      status?: "pending" | "completed"
      priority?: "low" | "medium" | "high"
      dueDate?: string
      tags?: string[]
      assignedTo?: string
    },
  ) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskStatus: (id: string) => Promise<void>
  fetchTasks: (params?: {
    status?: string
    priority?: string
    search?: string
    page?: number
    limit?: number
  }) => Promise<void>
  fetchStats: () => Promise<void>
  exportTasks: (
    format: "csv" | "pdf",
    params?: {
      status?: string
      priority?: string
      search?: string
    },
  ) => Promise<void>
  reorderTasks: (taskIds: string[]) => Promise<void>
  shareTask: (id: string, userEmails: string[], permission: "view" | "edit") => Promise<void>
  unshareTask: (id: string, userEmail: string) => Promise<void>
  getTaskActivity: (id: string) => Promise<any>
  addTaskComment: (id: string, comment: string) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const useTask = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider")
  }
  return context
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const { user } = useAuth()

  // Add debug logging for current user
  console.log("TaskContext - Current user:", user)

  const fetchTasks = useCallback(
    async (params?: {
      status?: string
      priority?: string
      search?: string
      page?: number
      limit?: number
    }) => {
      if (!user) {
        setTasks([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("TaskContext - Fetching tasks for user:", user.id)
        
        const response = await tasksAPI.getTasks(params)
        const { tasks: taskData, pagination: paginationData } = response.data.data

        console.log("TaskContext - Received tasks:", taskData.map((t: Task) => ({
          id: t._id,
          title: t.title,
          isOwner: t.isOwner,
          userPermission: t.userPermission,
        })))

        setTasks(taskData)
        setPagination(paginationData)
      } catch (error: any) {
        console.error("Error fetching tasks:", error)
        toast.error("Failed to fetch tasks")
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null)
      return
    }

    try {
      const response = await tasksAPI.getStats()
      setStats(response.data.data.stats)
    } catch (error: any) {
      console.error("Error fetching stats:", error)
    }
  }, [user])

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user) {
        await fetchTasks()
        await fetchStats()
      } else {
        setTasks([])
        setStats(null)
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [user, fetchTasks, fetchStats])

  const createTask = async (taskData: {
    title: string
    description?: string
    priority?: "low" | "medium" | "high"
    dueDate?: string
    tags?: string[]
    assignedTo?: string
    shareWith?: Array<{ email: string; permission: "view" | "edit" }>
  }) => {
    try {
      console.log("TaskContext - Creating task:", taskData)
      const response = await tasksAPI.createTask(taskData)
      console.log("TaskContext - Task created:", response.data.data.task)
      
      toast.success("Task created successfully!")
      await fetchTasks()
      await fetchStats()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create task"
      toast.error(message)
      throw error
    }
  }

  const updateTask = async (
    id: string,
    updates: {
      title?: string
      description?: string
      status?: "pending" | "completed"
      priority?: "low" | "medium" | "high"
      dueDate?: string
      tags?: string[]
      assignedTo?: string
    },
  ) => {
    try {
      await tasksAPI.updateTask(id, updates)
      toast.success("Task updated successfully!")
      await fetchTasks()
      await fetchStats()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update task"
      toast.error(message)
      throw error
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.deleteTask(id)
      toast.success("Task deleted successfully!")
      await fetchTasks()
      await fetchStats()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete task"
      toast.error(message)
      throw error
    }
  }

  const toggleTaskStatus = async (id: string) => {
    try {
      await tasksAPI.toggleTask(id)
      await fetchTasks()
      await fetchStats()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update task status"
      toast.error(message)
      throw error
    }
  }

  const exportTasks = async (
    format: "csv" | "pdf",
    params?: {
      status?: string
      priority?: string
      search?: string
    },
  ) => {
    try {
      const loadingToast = toast.loading(`Exporting tasks as ${format.toUpperCase()}...`)

      if (format === "csv") {
        await tasksAPI.exportCSV(params)
      } else {
        await tasksAPI.exportPDF(params)
      }

      toast.dismiss(loadingToast)
      toast.success(`Tasks exported as ${format.toUpperCase()} successfully!`)
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to export tasks as ${format.toUpperCase()}`
      toast.error(message)
      throw error
    }
  }

  const reorderTasks = async (taskIds: string[]) => {
    try {
      await tasksAPI.reorderTasks(taskIds)
      // Update local state immediately for better UX
      const reorderedTasks = taskIds.map((id) => tasks.find((task) => task._id === id)).filter(Boolean) as Task[]
      setTasks(reorderedTasks)
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to reorder tasks"
      toast.error(message)
      // Revert to original order on error
      await fetchTasks()
      throw error
    }
  }

  const shareTask = async (id: string, userEmails: string[], permission: "view" | "edit") => {
    try {
      await tasksAPI.shareTask(id, userEmails, permission)
      toast.success("Task shared successfully!")
      await fetchTasks()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to share task"
      toast.error(message)
      throw error
    }
  }

  const unshareTask = async (id: string, userEmail: string) => {
    try {
      await tasksAPI.unshareTask(id, userEmail)
      toast.success("Task unshared successfully!")
      await fetchTasks()
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to unshare task"
      toast.error(message)
      throw error
    }
  }

  const getTaskActivity = async (id: string) => {
    try {
      const response = await tasksAPI.getTaskActivity(id)
      return response.data.data.activities
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch task activity"
      toast.error(message)
      throw error
    }
  }

  const addTaskComment = async (id: string, comment: string) => {
    try {
      await tasksAPI.addTaskComment(id, comment)
      toast.success("Comment added successfully!")
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to add comment"
      toast.error(message)
      throw error
    }
  }

  const value = {
    tasks,
    stats,
    loading,
    pagination,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    fetchTasks,
    fetchStats,
    exportTasks,
    reorderTasks,
    shareTask,
    unshareTask,
    getTaskActivity,
    addTaskComment,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
