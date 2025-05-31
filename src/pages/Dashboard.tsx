import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import { Briefcase, CheckSquare, Users, AlertTriangle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom'; // For the New Project button

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  end_date: string;
  progress: number;
  team_id: string | null;
  teams: { name: string } | null; // Joined team name
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string;
  progress: number;
}

const Dashboard: React.FC = () => {
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [atRiskProjectsCount, setAtRiskProjectsCount] = useState(0);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            end_date,
            progress,
            team_id,
            teams ( name )
          `);
        if (projectsError) throw projectsError;

        // Fetch Tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, description, status, due_date, progress');
        if (tasksError) throw tasksError;

        // Calculate Stats
        const activeProj = projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
        setActiveProjectsCount(activeProj.length);
        setActiveProjects(activeProj); // For the Active Projects section

        const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Done');
        setCompletedTasksCount(completedTasks.length);
        setTotalTasksCount(tasks.length);

        const atRiskProj = projects.filter(p => p.status === 'At Risk' || p.status === 'Critical');
        setAtRiskProjectsCount(atRiskProj.length);

        // Fetch Team Members Count
        const { count: membersCount, error: membersError } = await supabase
          .from('team_members')
          .select('id', { count: 'exact' });
        if (membersError) throw membersError;
        setTeamMembersCount(membersCount || 0);

        // Upcoming Tasks (next 7 days)
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const upcoming = tasks.filter(task => {
          const dueDate = new Date(task.due_date);
          return dueDate > now && dueDate <= sevenDaysFromNow && task.status !== 'Completed' && task.status !== 'Done';
        }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        setUpcomingTasks(upcoming);

      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading dashboard data...</p>
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
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/projects/new" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
          <span className="text-xl mr-2">+</span> New Project
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Briefcase}
          title="Active Projects"
          value={activeProjectsCount}
          colorClass="text-blue-500"
          bgColorClass="bg-blue-50"
        />
        <StatCard
          icon={CheckSquare}
          title="Completed Tasks"
          value={`${completedTasksCount}/${totalTasksCount}`}
          colorClass="text-green-500"
          bgColorClass="bg-green-50"
        />
        <StatCard
          icon={Users}
          title="Team Members"
          value={teamMembersCount}
          colorClass="text-purple-500"
          bgColorClass="bg-purple-50"
        />
        <StatCard
          icon={AlertTriangle}
          title="At Risk Projects"
          value={atRiskProjectsCount}
          colorClass="text-yellow-500"
          bgColorClass="bg-yellow-50"
        />
      </div>

      {/* Active Projects Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-5">Active Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {activeProjects.length > 0 ? (
          activeProjects.map((project) => (
            <ProjectCard key={project.id} project={{ ...project, team_name: project.teams?.name || 'No Team' }} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full">No active projects found.</p>
        )}
      </div>

      {/* Upcoming Tasks Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-5">Upcoming Tasks</h2>
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transform transition-transform duration-300 hover:scale-[1.01]">
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-3">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <Calendar size={20} className="text-blue-500" />
                  <span className="font-medium text-gray-700">{task.title}</span>
                </div>
                <span className="text-sm text-gray-500">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming tasks for the next 7 days.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
