export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLogin?: string;
  }
  
  export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
    userId: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    isOverdue?: boolean;
  }
  
  export interface TaskStats {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Array<{
      field: string;
      message: string;
      value: any;
    }>;
  }
  
  export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalTasks: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  }
  
  export interface TasksResponse {
    tasks: Task[];
    pagination: PaginationInfo;
  }