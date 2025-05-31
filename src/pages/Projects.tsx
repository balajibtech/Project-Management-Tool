import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ProjectCard from '../components/ProjectCard';
import { PlusCircle, Search } from 'lucide-react'; // Removed unused Link, handleEditProject, handleDeleteProject
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
  owner_name?: string;
  team_name?: string;
}

interface Resource {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Active', 'Completed', 'On Hold', 'Cancelled'
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectData, setCurrentProjectData] = useState<Partial<Project>>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectStatuses = ['All', 'Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

  useEffect(() => {
    fetchProjects();
    fetchResources();
    fetchTeams();
  }, [activeFilter]); // Re-fetch projects when filter changes

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
        team_name: p.team?.[0]?.name || 'N/A', // Access first element of teams array
        priority: p.priority || 'Medium', // Ensure priority is set
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
    setCurrentProjectData({}); // Clear previous data
    setShowModal(true);
  };

  const handleModalSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isEditing && currentProjectData.id) {
        const { error } = await supabase
          .from('projects')
          .update(formData)
          .eq('id', currentProjectData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(formData);
        if (error) throw error;
      }
      setShowModal(false);
      fetchProjects(); // Refresh list
    } catch (err: any) {
      setFormError(err.message);
      console.error('Error saving project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.team_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-1/2 lg:w-1/3">
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
          {projectStatuses.map(status => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeFilter === status
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialData={{ ...currentProjectData, priority: currentProjectData.priority || 'Medium' }} // Ensure priority is string
        isEditing={isEditing}
        onSubmit={handleModalSubmit}
        resources={resources}
        teams={teams}
        formError={formError}
        loading={isSubmitting}
      />
    </div>
  );
};

export default Projects;
