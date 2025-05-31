import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Search, User, Briefcase, CalendarDays } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  role: string;
  skills: string[];
  daily_capacity: number;
  weekly_capacity: number;
  time_off: string;
  allocation_percentage: number;
}

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<Resource>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setResources(data as Resource[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = () => {
    setIsEditing(false);
    setCurrentResource({
      name: '',
      role: '',
      skills: [],
      daily_capacity: 8,
      weekly_capacity: 40,
      time_off: '',
      allocation_percentage: 0,
    });
    setShowModal(true);
  };

  const handleEditResource = (resource: Resource) => {
    setIsEditing(true);
    setCurrentResource(resource);
    setShowModal(true);
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This will also unassign them from tasks/projects.')) {
      setLoading(true);
      try {
        // First, set assigned_to to null for any tasks assigned to this resource
        const { error: updateTasksError } = await supabase
          .from('tasks')
          .update({ assigned_to: null })
          .eq('assigned_to', id);
        if (updateTasksError) throw updateTasksError;

        // Then, set owner_id to null for any projects owned by this resource
        const { error: updateProjectsError } = await supabase
          .from('projects')
          .update({ owner_id: null })
          .eq('owner_id', id);
        if (updateProjectsError) throw updateProjectsError;

        // Finally, delete the resource
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchResources(); // Refresh list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting resource:', err);
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
      const resourceData = {
        name: currentResource.name,
        role: currentResource.role,
        skills: currentResource.skills || [],
        daily_capacity: currentResource.daily_capacity,
        weekly_capacity: currentResource.weekly_capacity,
        time_off: currentResource.time_off || '',
        allocation_percentage: currentResource.allocation_percentage || 0,
      };

      if (isEditing && currentResource.id) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', currentResource.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert(resourceData);
        if (error) throw error;
      }
      setShowModal(false);
      fetchResources();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving resource:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && resources.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading resources...</p>
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
        <h1 className="text-3xl font-bold text-gray-800">Resources</h1>
        <button
          onClick={handleCreateResource}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="mr-2" size={20} /> New Resource
        </button>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search resources by name, role, or skills..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {filteredResources.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No resources found. Start by adding a new one!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity (Daily/Weekly)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/resources/${resource.id}`} className="text-blue-600 hover:underline">
                      {resource.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{resource.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {resource.skills && resource.skills.length > 0 ? resource.skills.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {resource.daily_capacity}h / {resource.weekly_capacity}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {resource.allocation_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditResource(resource)}
                        className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                        title="Edit Resource"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Resource"
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

      {/* Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditing ? 'Edit Resource' : 'Create New Resource'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                <input
                  type="text"
                  id="name"
                  value={currentResource.name || ''}
                  onChange={(e) => setCurrentResource({ ...currentResource, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  id="role"
                  value={currentResource.role || ''}
                  onChange={(e) => setCurrentResource({ ...currentResource, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  id="skills"
                  value={currentResource.skills?.join(', ') || ''}
                  onChange={(e) => setCurrentResource({ ...currentResource, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="dailyCapacity" className="block text-sm font-medium text-gray-700 mb-1">Daily Capacity (hours)</label>
                <input
                  type="number"
                  id="dailyCapacity"
                  value={currentResource.daily_capacity || 0}
                  onChange={(e) => setCurrentResource({ ...currentResource, daily_capacity: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="weeklyCapacity" className="block text-sm font-medium text-gray-700 mb-1">Weekly Capacity (hours)</label>
                <input
                  type="number"
                  id="weeklyCapacity"
                  value={currentResource.weekly_capacity || 0}
                  onChange={(e) => setCurrentResource({ ...currentResource, weekly_capacity: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div className="col-span-full">
                <label htmlFor="timeOff" className="block text-sm font-medium text-gray-700 mb-1">Time-off Tracking (e.g., "Vacation: 2024-07-01 to 2024-07-10")</label>
                <textarea
                  id="timeOff"
                  value={currentResource.time_off || ''}
                  onChange={(e) => setCurrentResource({ ...currentResource, time_off: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div>
                <label htmlFor="allocationPercentage" className="block text-sm font-medium text-gray-700 mb-1">Current Allocation Percentage</label>
                <input
                  type="number"
                  id="allocationPercentage"
                  value={currentResource.allocation_percentage || 0}
                  onChange={(e) => setCurrentResource({ ...currentResource, allocation_percentage: parseFloat(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
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
                  {loading ? 'Saving...' : (isEditing ? 'Update Resource' : 'Create Resource')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
