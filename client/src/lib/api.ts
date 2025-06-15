import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  register: (userData: { email: string; password: string; name?: string }) => api.post("/auth/register", userData),

  login: (credentials: { email: string; password: string }) => api.post("/auth/login", credentials),

  getProfile: () => api.get("/auth/profile"),

  updateProfile: (data: { name: string }) => api.put("/auth/profile", data),

  logout: () => api.post("/auth/logout"),
}

// Tasks API
export const tasksAPI = {
  getTasks: (params?: {
    status?: string
    priority?: string
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: string
  }) => api.get("/tasks", { params }),

  getTask: (id: string) => api.get(`/tasks/${id}`),

  createTask: (taskData: {
    title: string
    description?: string
    priority?: "low" | "medium" | "high"
    dueDate?: string
    tags?: string[]
    assignedTo?: string
    shareWith?: Array<{ email: string; permission: "view" | "edit" }>
  }) => api.post("/tasks", taskData),

  updateTask: (
    id: string,
    taskData: {
      title?: string
      description?: string
      status?: "pending" | "completed"
      priority?: "low" | "medium" | "high"
      dueDate?: string
      tags?: string[]
      assignedTo?: string
    },
  ) => api.put(`/tasks/${id}`, taskData),

  deleteTask: (id: string) => api.delete(`/tasks/${id}`),

  toggleTask: (id: string) => api.patch(`/tasks/${id}/toggle`),

  getStats: () => api.get("/tasks/stats"),

  // Reordering
  reorderTasks: (taskIds: string[]) => api.post("/tasks/reorder", { taskIds }),

  // Sharing
  shareTask: (id: string, userEmails: string[], permission: "view" | "edit" = "view") =>
    api.post(`/tasks/${id}/share`, { userEmails, permission }),

  unshareTask: (id: string, userEmail: string) => api.delete(`/tasks/${id}/share`, { data: { userEmail } }),

  // Activity and comments
  getTaskActivity: (id: string) => api.get(`/tasks/${id}/activity`),

  addTaskComment: (id: string, comment: string) => api.post(`/tasks/${id}/comments`, { comment }),

  // Export functions
  exportCSV: (params?: {
    status?: string
    priority?: string
    search?: string
  }) => api.get("/tasks/export/csv", { params, responseType: "blob" }),

  exportPDF: (params?: {
    status?: string
    priority?: string
    search?: string
  }) => api.get("/tasks/export/pdf", { params, responseType: "blob" }),
}

export default api
