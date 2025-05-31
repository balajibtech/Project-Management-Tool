import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit, Trash2, CalendarDays, User, Info, CheckCircle, AlertTriangle, Clock, ListChecks } from 'lucide-react';

interface Task {
  id: string;
  title: string; // Changed from 'name' to 'title' for consistency with Tasks.tsx
  description: string;
  status: string;
  priority: string;
  due_date: string;
  project_id: string;
  project_name?: string;
  assigned_to: string;
  assigned_resource_name?: string; // Changed from 'assigned_to_name' for consistency
  estimated_effort: number; // Added
  actual_effort: number; // Added
  completed_checklist_items: number; // Added
  total_checklist_items: number; // Added
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) {
        setError('Task ID is missing.');
        setLoading(false);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(id)) {
        setError('Invalid task ID format. Redirecting to tasks list...');
        setLoading(false);
        setTimeout(() => navigate('/tasks'), 1500);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(name),
            assigned_resource:resources(name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Task not found. Redirecting to tasks list...');
          setTimeout(() => navigate('/tasks'), 1500);
          return;
        }

        setTask({
          ...data,
          title: data.title, // Ensure title is mapped correctly
          project_name: data.project ? data.project.name : 'N/A',
          assigned_resource_name: data.assigned_resource ? data.assigned_resource.name : 'Unassigned',
          priority: data.priority || 'Medium', // Default if null
          estimated_effort: data.estimated_effort || 0,
          actual_effort: data.actual_effort || 0,
          completed_checklist_items: data.completed_checklist_items || 0,
          total_checklist_items: data.total_checklist_items || 0,
        } as Task);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching task details:', err);
        setTimeout(() => navigate('/tasks'), 1500); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, navigate]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'In Review': return 'bg-purple-100 text-purple-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const progressPercentage = task && task.total_checklist_items > 0
    ? (task.completed_checklist_items / task.total_checklist_items) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 p-4 rounded-lg">
        <p>Error: {error}</p>
        <p>Please ensure your Supabase tables are set up correctly and you have RLS policies that allow data access.</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
        <p className="text-lg font-medium">Task not found.</p>
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Tasks
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 mr-3"
          title="Back to Tasks"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center text-gray-700">
            <Info size={20} className="mr-3 text-blue-500" />
            <p><strong>Description:</strong> {task.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <CheckCircle size={20} className="mr-3 text-green-500" />
            <p><strong>Status:</strong> <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${getStatusClass(task.status)}`}>{task.status}</span></p>
          </div>
          <div className="flex items-center text-gray-700">
            <AlertTriangle size={20} className="mr-3 text-yellow-500" />
            <p><strong>Priority:</strong> <span className={`font-medium ${getPriorityClass(task.priority)}`}>{task.priority}</span></p>
          </div>
          <div className="flex items-center text-gray-700">
            <User size={20} className="mr-3 text-purple-500" />
            <p><strong>Assigned To:</strong> {task.assigned_resource_name}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays size={20} className="mr-3 text-orange-500" />
            <p><strong>Due Date:</strong> {new Date(task.due_date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <Info size={20} className="mr-3 text-indigo-500" />
            <p><strong>Project:</strong> {task.project_name}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock size={20} className="mr-3 text-teal-500" />
            <p><strong>Estimated Effort:</strong> {task.estimated_effort} hours</p>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock size={20} className="mr-3 text-cyan-500" />
            <p><strong>Actual Effort:</strong> {task.actual_effort} hours</p>
          </div>
          {task.total_checklist_items > 0 && (
            <div className="col-span-full">
              <div className="flex items-center text-gray-700 mb-2">
                <ListChecks size={20} className="mr-3 text-green-500" />
                <p><strong>Checklist Progress:</strong> {task.completed_checklist_items}/{task.total_checklist_items}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 border-t pt-6">
          <button
            // onClick={() => handleEditTask(task)} // Assuming an edit modal/page
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200"
          >
            <Edit size={18} className="mr-2" /> Edit Task
          </button>
          <button
            // onClick={() => handleDeleteTask(task.id)} // Assuming a delete function
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            <Trash2 size={18} className="mr-2" /> Delete Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
