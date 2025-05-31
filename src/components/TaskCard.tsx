import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, ListChecks } from 'lucide-react'; // Removed unused Tag, UserCircle

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_effort: number;
  actual_effort: number;
  assigned_to: string;
  due_date: string;
  status: string;
  project_id: string;
  project_name?: string;
  assigned_resource_name?: string;
  priority: string;
  completed_checklist_items: number;
  total_checklist_items: number;
}

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-gray-200 text-gray-700';
      case 'In Progress': return 'bg-blue-200 text-blue-700';
      case 'In Review': return 'bg-purple-200 text-purple-700';
      case 'Blocked': return 'bg-red-200 text-red-700';
      case 'Done': return 'bg-green-200 text-green-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceInitials = (name?: string) => {
    if (!name) return 'UN';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const progressPercentage = task.total_checklist_items > 0
    ? (task.completed_checklist_items / task.total_checklist_items) * 100
    : 0;

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 mb-4 border border-gray-200 relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 leading-tight pr-10">{task.title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(task.status)}`}>
            {task.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description || 'No description provided.'}</p>

        {task.total_checklist_items > 0 && (
          <div className="mb-3">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <ListChecks size={14} className="mr-1" />
              Checklist {task.completed_checklist_items}/{task.total_checklist_items}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-700 mt-3">
          <div className="flex items-center">
            <CalendarDays size={16} className="mr-1 text-gray-500" />
            <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-gray-500" />
            <span>{task.estimated_effort}h</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityBadgeClass(task.priority)}`}>
            {task.priority}
          </span>
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold uppercase mr-2">
              {getResourceInitials(task.assigned_resource_name)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;
