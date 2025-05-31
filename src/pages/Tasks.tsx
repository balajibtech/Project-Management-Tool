import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, List, Edit, Trash2, Kanban } from 'lucide-react'; // Added LayoutKanban
import TaskCard from '../components/TaskCard'; // Import the new TaskCard component

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
  priority: string; // Added for Kanban view
  completed_checklist_items: number; // Added for Kanban view
  total_checklist_items: number; // Added for Kanban view
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [resources, setResources] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [filterAssignedTo, setFilterAssignedTo] = useState('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban'); // New state for view mode

  const taskStatuses = ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done'];
  const taskPriorities = ['Low', 'Medium', 'High', 'Critical']; // New: Task Priorities

  useEffect(() => {
    fetchTasks();
    fetchResources();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
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
        .order('due_date', { ascending: true });

      if (error) throw error;

      const tasksWithDetails = data.map(t => ({
        ...t,
        project_name: t.project ? t.project.name : 'N/A',
        assigned_resource_name: t.assigned_resource ? t.assigned_resource.name : 'Unassigned',
        priority: t.priority || 'Medium', // Ensure priority is set
        completed_checklist_items: t.completed_checklist_items || 0,
        total_checklist_items: t.total_checklist_items || 0,
      }));
      setTasks(tasksWithDetails as Task[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase.from('resources').select('id, name');
      if (error) throw error;
      setResources(data);
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      setProjects(data);
    } catch (err: any) {
      console.error('Error fetching projects:', err.message);
    }
  };

  const handleCreateTask = () => {
    setIsEditing(false);
    setCurrentTask({
      title: '',
      description: '',
      estimated_effort: 0,
      actual_effort: 0,
      assigned_to: '',
      due_date: new Date().toISOString().split('T')[0],
      status: 'To Do',
      project_id: '',
      priority: 'Medium', // Default priority
      completed_checklist_items: 0,
      total_checklist_items: 0,
    });
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setIsEditing(true);
    setCurrentTask({
      ...task,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTasks(); // Refresh list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting task:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const taskData = {
        title: currentTask.title,
        description: currentTask.description,
        estimated_effort: currentTask.estimated_effort,
        actual_effort: currentTask.actual_effort,
        assigned_to: currentTask.assigned_to || null,
        due_date: currentTask.due_date,
        status: currentTask.status,
        project_id: currentTask.project_id || null,
        priority: currentTask.priority || 'Medium',
        completed_checklist_items: currentTask.completed_checklist_items || 0,
        total_checklist_items: currentTask.total_checklist_items || 0,
      };

      if (isEditing && currentTask.id) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', currentTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskData);
        if (error) throw error;
      }
      setShowModal(false);
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating task status:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.assigned_resource_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesProject = filterProject === 'All' || task.project_id === filterProject;
    const matchesAssignedTo = filterAssignedTo === 'All' || task.assigned_to === filterAssignedTo;
    return matchesSearch && matchesStatus && matchesProject && matchesAssignedTo;
  });

  const tasksByStatus = taskStatuses.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading tasks...</p>
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-300">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors duration-200`}
              title="Kanban View"
            >
              <Kanban size={30} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors duration-200`}
              title="List View"
            >
              <List size={20} />
            </button>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="mr-2" size={20} /> New Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          >
            <option value="All">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          >
            <option value="All">All Statuses</option>
            {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <select
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          >
            <option value="All">All Resources</option>
            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-3 text-gray-600">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No tasks found matching your criteria.</p>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-x-auto pb-4">
              {taskStatuses.map(status => (
                <div key={status} className="flex-shrink-0 w-full max-w-xs bg-gray-100 rounded-lg p-4 shadow-inner">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center">
                    {status}
                    <span className="text-sm font-normal text-gray-500">{tasksByStatus[status].length}</span>
                  </h2>
                  <div className="min-h-[100px]"> {/* Minimum height for columns */}
                    {tasksByStatus[status].length > 0 ? (
                      tasksByStatus[status].map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">No tasks</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th> {/* New column */}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/tasks/${task.id}`} className="text-blue-600 hover:underline">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.project_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.assigned_resource_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(task.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            task.status === 'Done' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'In Review' ? 'bg-purple-100 text-purple-800' :
                            task.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          } focus:ring-blue-500 focus:border-blue-500`}
                        >
                          {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          task.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                            title="Edit Task"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  id="taskTitle"
                  value={currentTask.title || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="col-span-full">
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="taskDescription"
                  value={currentTask.description || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="estimatedEffort" className="block text-sm font-medium text-gray-700 mb-1">Estimated Effort (hours)</label>
                <input
                  type="number"
                  id="estimatedEffort"
                  value={currentTask.estimated_effort || 0}
                  onChange={(e) => setCurrentTask({ ...currentTask, estimated_effort: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="actualEffort" className="block text-sm font-medium text-gray-700 mb-1">Actual Effort (hours)</label>
                <input
                  type="number"
                  id="actualEffort"
                  value={currentTask.actual_effort || 0}
                  onChange={(e) => setCurrentTask({ ...currentTask, actual_effort: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  id="assignedTo"
                  value={currentTask.assigned_to || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, assigned_to: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>{resource.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  id="taskDueDate"
                  value={currentTask.due_date || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, due_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="taskStatus"
                  value={currentTask.status || 'To Do'}
                  onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="taskProject" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  id="taskProject"
                  value={currentTask.project_id || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, project_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  id="taskPriority"
                  value={currentTask.priority || 'Medium'}
                  onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {taskPriorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex space-x-4">
                <div>
                  <label htmlFor="completedChecklistItems" className="block text-sm font-medium text-gray-700 mb-1">Completed Checklist Items</label>
                  <input
                    type="number"
                    id="completedChecklistItems"
                    value={currentTask.completed_checklist_items || 0}
                    onChange={(e) => setCurrentTask({ ...currentTask, completed_checklist_items: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="totalChecklistItems" className="block text-sm font-medium text-gray-700 mb-1">Total Checklist Items</label>
                  <input
                    type="number"
                    id="totalChecklistItems"
                    value={currentTask.total_checklist_items || 0}
                    onChange={(e) => setCurrentTask({ ...currentTask, total_checklist_items: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>
              {error && (
                <div className="col-span-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}
              <div className="col-span-full flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
