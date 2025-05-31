import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit, Trash2, Users, CalendarDays, DollarSign, Info, CheckCircle, AlertTriangle, Clock, User } from 'lucide-react';
import ProjectFormModal from '../components/ProjectFormModal'; // Import ProjectFormModal

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string | null;
  start_date: string;
  end_date: string;
  planned_budget: number;
  actual_budget: number;
  owner_id: string;
  owner_name?: string;
  team_id?: string;
  team_name?: string;
  progress: number;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [resources, setResources] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  const fetchProject = async () => {
    if (!id) {
      setError('Project ID is missing.');
      setLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      setError('Invalid project ID format. Redirecting to projects list...');
      setLoading(false);
      setTimeout(() => navigate('/projects'), 1500);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:resources(name),
          team:teams(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        setError('Project not found. Redirecting to projects list...');
        setTimeout(() => navigate('/projects'), 1500);
        return;
      }

      setProject({
        ...data,
        owner_name: data.owner ? data.owner.name : 'N/A',
        team_name: data.team ? data.team.name : 'N/A',
        priority: data.priority || 'Medium',
      } as Project);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching project details:', err);
      setTimeout(() => navigate('/projects'), 1500);
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

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase.from('teams').select('id, name');
      if (error) throw error;
      setTeams(data);
    } catch (err: any) {
      console.error('Error fetching teams:', err.message);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchResources();
    fetchTeams();
  }, [id, navigate]);

  const handleEditProject = () => {
    if (project) {
      setShowEditModal(true);
      setEditModalError(null); // Clear previous errors
    }
  };

  const handleModalSubmit = async (formData: Partial<Project>) => {
    setLoading(true); // Set loading for the detail page
    setEditModalError(null);

    try {
      if (!formData.id) {
        throw new Error('Project ID is missing for update.');
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          start_date: formData.start_date,
          end_date: formData.end_date,
          planned_budget: formData.planned_budget,
          actual_budget: formData.actual_budget,
          owner_id: formData.owner_id || null,
          team_id: formData.team_id || null,
          progress: formData.progress,
        })
        .eq('id', formData.id);

      if (updateError) throw updateError;

      setShowEditModal(false);
      await fetchProject(); // Re-fetch the updated project details
    } catch (err: any) {
      setEditModalError(err.message);
      console.error('Error updating project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      setLoading(true);
      setError(null);
      try {
        // First, delete associated tasks
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('project_id', project.id);
        if (tasksError) throw tasksError;

        // Then, delete the project
        const { error: projectError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (projectError) throw projectError;

        navigate('/projects'); // Redirect to projects list after successful deletion
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting project:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityClass = (priority: string | null) => {
    const safePriority = priority ?? 'Medium';
    switch (safePriority) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading project details...</p>
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

  if (!project) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
        <p className="text-lg font-medium">Project not found.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 mr-3"
          title="Back to Projects"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center text-gray-700">
            <Info size={20} className="mr-3 text-blue-500" />
            <p><strong>Description:</strong> {project.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <CheckCircle size={20} className="mr-3 text-green-500" />
            <p><strong>Status:</strong> <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${getStatusClass(project.status)}`}>{project.status}</span></p>
          </div>
          <div className="flex items-center text-gray-700">
            <AlertTriangle size={20} className="mr-3 text-yellow-500" />
            <p><strong>Priority:</strong> <span className={`font-medium ${getPriorityClass(project.priority)}`}>{project.priority || 'N/A'}</span></p>
          </div>
          <div className="flex items-center text-gray-700">
            <User size={20} className="mr-3 text-purple-500" />
            <p><strong>Owner:</strong> {project.owner_name}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <Users size={20} className="mr-3 text-teal-500" />
            <p><strong>Team:</strong> {project.team_name}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock size={20} className="mr-3 text-indigo-500" />
            <p><strong>Progress:</strong> {project.progress}%</p>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays size={20} className="mr-3 text-orange-500" />
            <p><strong>Start Date:</strong> {new Date(project.start_date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays size={20} className="mr-3 text-red-500" />
            <p><strong>End Date:</strong> {new Date(project.end_date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign size={20} className="mr-3 text-green-600" />
            <p><strong>Planned Budget:</strong> ${project.planned_budget?.toLocaleString()}</p>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign size={20} className="mr-3 text-red-600" />
            <p><strong>Actual Budget:</strong> ${project.actual_budget?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 border-t pt-6">
          <button
            onClick={handleEditProject}
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200"
          >
            <Edit size={18} className="mr-2" /> Edit Project
          </button>
          <button
            onClick={handleDeleteProject}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            <Trash2 size={18} className="mr-2" /> Delete Project
          </button>
        </div>
      </div>

      {project && (
        <ProjectFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={project}
          isEditing={true}
          onSubmit={handleModalSubmit}
          resources={resources}
          teams={teams}
          formError={editModalError}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
