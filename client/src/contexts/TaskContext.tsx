import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tasksAPI } from '../lib/api';
import { Task, TaskStats } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface TaskContextType {
  tasks: Task[];
  stats: TaskStats | null;
  loading: boolean;
  pagination: any;
  createTask: (task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => Promise<void>;
  updateTask: (id: string, updates: {
    title?: string;
    description?: string;
    status?: 'pending' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  fetchTasks: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchStats: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await tasksAPI.getTasks(params);
      const { tasks: taskData, pagination: paginationData } = response.data.data;

      setTasks(taskData);
      setPagination(paginationData);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    try {
      const response = await tasksAPI.getStats();
      setStats(response.data.data.stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }, [user]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user) {
        await fetchTasks();
        await fetchStats();
      } else {
        setTasks([]);
        setStats(null);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, fetchTasks, fetchStats]);

  const createTask = async (taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => {
    try {
      await tasksAPI.createTask(taskData);
      toast.success('Task created successfully!');
      await fetchTasks();
      await fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: {
    title?: string;
    description?: string;
    status?: 'pending' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags?: string[];
  }) => {
    try {
      await tasksAPI.updateTask(id, updates);
      toast.success('Task updated successfully!');
      await fetchTasks();
      await fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.deleteTask(id);
      toast.success('Task deleted successfully!');
      await fetchTasks();
      await fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
      throw error;
    }
  };

  const toggleTaskStatus = async (id: string) => {
    try {
      await tasksAPI.toggleTask(id);
      await fetchTasks();
      await fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update task status';
      toast.error(message);
      throw error;
    }
  };

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
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};