import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (data: { name: string }) =>
    api.put('/auth/profile', data),
  
  logout: () =>
    api.post('/auth/logout'),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/tasks', { params }),
  
  getTask: (id: string) =>
    api.get(`/tasks/${id}`),
  
  createTask: (taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => api.post('/tasks', taskData),
  
  updateTask: (id: string, taskData: {
    title?: string;
    description?: string;
    status?: 'pending' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => api.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id: string) =>
    api.delete(`/tasks/${id}`),
  
  toggleTask: (id: string) =>
    api.patch(`/tasks/${id}/toggle`),
  
  getStats: () =>
    api.get('/tasks/stats'),
};

export default api;