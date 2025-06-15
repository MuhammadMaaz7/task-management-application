import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, BarChart3 } from 'lucide-react';
import Header from '../components/Header';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import TaskFilters from '../components/TaskFilters';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTask } from '../contexts/TaskContext';
import { Task } from '../types';

const Dashboard: React.FC = () => {
  const { tasks, stats, loading, deleteTask, toggleTaskStatus, fetchTasks } = useTask();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Fetch tasks when filters change
  useEffect(() => {
    const params: any = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (searchTerm) params.search = searchTerm;
    
    const debounceTimer = setTimeout(() => {
      fetchTasks(params);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [statusFilter, priorityFilter, searchTerm, fetchTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowTaskForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <TaskFilters
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
            />
          </div>

          {/* Tasks List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'No tasks match your filters' 
                    : 'No tasks yet'
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first task!'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create Your First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleStatus={toggleTaskStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Dashboard;