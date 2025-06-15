export interface User {
    _id?: string           // From Mongoose documents
    id?: string            // API-consumed user identifier
    name: string
    email: string
    createdAt: string
    updatedAt?: string     // Added from first
    lastLogin?: string
  }
  
  export interface Task {
    _id: string
    title: string
    description?: string
    status: "pending" | "completed"
    priority: "low" | "medium" | "high"
    dueDate?: string
    tags?: string[]
    userId: string | User
    position?: number
  
    isShared?: boolean
    sharedWith?: Array<{
      userId: User
      permission: "view" | "edit"
      sharedAt: string
      sharedBy: User
    }>
  
    assignedTo?: User
    assignedBy?: User
    assignedAt?: string
  
    userPermission?: "owner" | "view" | "edit" | "none"
    isOwner?: boolean
  
    completedAt?: string
    isOverdue?: boolean
  
    createdAt: string
    updatedAt: string
  }
  
  export interface TaskStats {
    total: number
    completed: number
    pending: number
    overdue: number
    highPriority: number
    mediumPriority: number
    lowPriority: number
    shared?: number
    assigned?: number
  }
  
  export interface TaskActivity {
    _id: string
    taskId: string
    userId: User
    action: string
    details: any
    comment?: string
    createdAt: string
  }
  
  export interface ApiResponse<T> {
    success: boolean
    message?: string
    data?: T
    errors?: Array<{
      field: string
      message: string
      value: any
    }>
  }
  
  export interface PaginationInfo {
    currentPage: number
    totalPages: number
    totalTasks: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
  
  export interface TasksResponse {
    tasks: Task[]
    pagination: PaginationInfo
  }
  