import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
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
  created_by: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectData, setCurrentProjectData] = useState<Partial<Project>>({}); // Data for the modal
  const [resources, setResources] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  useEffect(() => {
    fetchProjects();
    fetchResources();
    fetchTeams();
  }, [activeFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          owner:resources(name),
          team:teams(name)
        `)
        .order('created_at', { ascending: false });

      if (activeFilter !== 'All') {
        query = query.eq('status', activeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const projectsWithDetails = data.map(p => ({
        ...p,
        owner_name: p.owner ? p.owner.name : 'N/A',
        team_name: p.team ? p.team.name : 'N/A',
        priority: p.priority || 'Medium'
      }));
      setProjects(projectsWithDetails as Project[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching projects:', err);
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

  const handleCreateProject = () => {
    setIsEditing(false);
    setCurrentProjectData({
      name: '',
      description: '',
      status: 'Not Started',
      priority: 'Medium',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      planned_budget: 0,
      actual_budget: 0,
      owner_id: '',
      team_id: '',
      progress: 0,
    });
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setIsEditing(true);
    setCurrentProjectData({
      ...project,
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setLoading(true);
      try {
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('project_id', id);
        if (tasksError) throw tasksError;

        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchProjects();
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting project:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleModalSubmit = async (formData: Partial<Project>) => {
    setLoading(true);
    setError(null);

    try {
      if (isEditing && formData.id) {
        const { error } = await supabase
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
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated. Please log in to create a project.');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('projects')
          .insert({
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
            created_by: user.id,
          });
        if (error) throw error;
      }
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving project:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.team_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filterOptions = ['All', 'In Progress', 'On Hold', 'Completed', 'Not Started', 'Cancelled'];

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading projects...</p>
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
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={handleCreateProject}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="mr-2" size={20} /> New Project
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-600 font-medium">Filter:</span>
          {filterOptions.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No projects found. Start by creating a new one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={currentProjectData}
        isEditing={isEditing}
        onSubmit={handleModalSubmit}
        resources={resources}
        teams={teams}
        formError={error}
        loading={loading}
      />
    </div>
  );
};

export default Projects;
