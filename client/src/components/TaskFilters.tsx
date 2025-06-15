import React from 'react';
import { Filter, CheckCircle, Clock, Flag } from 'lucide-react';

interface TaskFiltersProps {
  statusFilter: 'all' | 'pending' | 'completed';
  priorityFilter: 'all' | 'low' | 'medium' | 'high';
  onStatusChange: (status: 'all' | 'pending' | 'completed') => void;
  onPriorityChange: (priority: 'all' | 'low' | 'medium' | 'high') => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <CheckCircle className="w-4 h-4" />
            <span>Status</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Tasks' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={statusFilter === option.value}
                  onChange={(e) => onStatusChange(e.target.value as 'all' | 'pending' | 'completed')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Flag className="w-4 h-4" />
            <span>Priority</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Priorities' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  checked={priorityFilter === option.value}
                  onChange={(e) => onPriorityChange(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;