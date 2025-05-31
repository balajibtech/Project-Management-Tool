import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    progress: number;
    end_date: string;
    status: string; // e.g., 'In Progress', 'Completed', 'On Hold'
    priority: string | null; // Allow null for robustness
    team_name?: string;
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityTagColor = (priority: string | null) => { // Accept string | null
    const safePriority = priority ?? ''; // Provide a default empty string if null/undefined
    switch (safePriority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusTagColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'on hold': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'not started': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Link to={`/projects/${project.id}`} className="block"> {/* Make the whole card a link */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-lg">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityTagColor(project.priority)}`}>
            {project.priority || 'N/A'} {/* Display 'N/A' if priority is null */}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description || 'No description provided.'}</p>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{project.progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`${getProgressBarColor(project.progress)} h-2.5 rounded-full`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <span>{new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          {project.team_name && (
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-gray-400" />
              <span>{project.team_name}</span>
            </div>
          )}
        </div>
        <div className="flex justify-start mt-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusTagColor(project.status)}`}>
            {project.status}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
