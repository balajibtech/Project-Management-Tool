import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, CalendarDays, Users, DollarSign, TrendingUp, Info, CheckCircle, XCircle, Clock, ListChecks } from 'lucide-react';
import ProjectFormModal from '../components/ProjectFormModal'; // Import the modal component

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string; // Ensure this is string
  start_date: string;
  end_date: string;
  planned_budget: number;
  actual_budget: number;
  owner_id: string;
  team_id: string;
  progress: number;
  created_at: string;
  created_by: string;
  owner: { name: string } | null;
  team: { name: string }[] | null; // Changed to array
}

interface Resource {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Project ID is missing.');
      setLoading(false);
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid project ID format. Redirecting to projects list...');
      navigate('/projects', { replace: true });
      return;
    }

    fetchProjectDetails();
    fetchResources();
    fetchTeams();
  }, [id, navigate]);

  const fetchProjectDetails = async () => {
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

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          setError('Project not found.');
        } else {
          throw error;
        }
      } else {
        setProject(data as Project);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching project details:', err);
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

  const handleEditProject = () => {
    setShowModal(true);
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setIsSubmitting(true);
      setError(null);
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;

        alert('Project deleted successfully!');
        navigate('/projects'); // Redirect to projects list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting project:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleModalSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const { error } = await supabase
        .from('projects')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      setShowModal(false);
      fetchProjectDetails(); // Refresh data
    } catch (err: any) {
      setFormError(err.message);
      console.error('Error updating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-100 text-gray-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'On Hold': return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-gray-600 bg-gray-100 p-4 rounded-lg">
        <p>Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Projects
        </button>
      </div>
    );
  }

  const progressColor = project.progress < 25 ? 'bg-red-500' :
                        project.progress < 75 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center space-x-3 text-sm">
              <span className={`px-3 py-1 rounded-full font-semibold ${getStatusClass(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full font-semibold ${getPriorityClass(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleEditProject}
              className="p-3 rounded-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors duration-200 shadow-sm"
              title="Edit Project"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleDeleteProject}
              disabled={isSubmitting}
              className="p-3 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Project"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mb-6">{project.description || 'No description provided for this project.'}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center text-gray-700">
            <CalendarDays size={20} className="mr-3 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p className="font-semibold">{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-700">
            <CalendarDays size={20} className="mr-3 text-blue-500" />
            <div>
              <p className="text-sm font-medium">End Date</p>
              <p className="font-semibold">{new Date(project.end_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-700">
            <Users size={20} className="mr-3 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Project Owner</p>
              <p className="font-semibold">{project.owner?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-700">
            <Users size={20} className="mr-3 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Team</p>
              <p className="font-semibold">{project.team?.[0]?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign size={20} className="mr-3 text-green-500" />
            <div>
              <p className="text-sm font-medium">Planned Budget</p>
              <p className="font-semibold">${project.planned_budget?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-700">
            <DollarSign size={20} className="mr-3 text-red-500" />
            <div>
              <p className="text-sm font-medium">Actual Budget</p>
              <p className="font-semibold">${project.actual_budget?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-800">Progress</span>
            <span className="text-lg font-bold text-blue-600">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${progressColor} h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 text-sm">
          <p className="flex items-center"><Info size={16} className="mr-2 text-gray-500" /> Created At: {new Date(project.created_at).toLocaleString()}</p>
          <p className="flex items-center"><Info size={16} className="mr-2 text-gray-500" /> Created By: {project.created_by}</p>
        </div>
      </div>

      {/* Related Tasks Section (Placeholder) */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">Related Tasks</h2>
        <div className="text-gray-600">
          <p>Tasks related to this project will be displayed here.</p>
          <Link to="/tasks" className="text-blue-600 hover:underline flex items-center mt-2">
            <ListChecks size={18} className="mr-2" /> View All Tasks
          </Link>
        </div>
      </div>

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={{ ...project, priority: project.priority || 'Medium' }} // Ensure priority is string
        isEditing={true}
        onSubmit={handleModalSubmit}
        resources={resources}
        teams={teams}
        formError={formError}
        loading={isSubmitting}
      />
    </div>
  );
};

export default ProjectDetail;
