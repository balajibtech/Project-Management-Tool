import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Briefcase, CalendarDays, DollarSign, Users } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  hire_date?: string;
  salary?: number;
  team_id?: string;
  team_name?: string;
}

const ResourceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) {
        setError('Resource ID is missing.');
        setLoading(false);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(id)) {
        setError('Invalid resource ID format. Redirecting to resources list...');
        setLoading(false);
        setTimeout(() => navigate('/resources'), 1500);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select(`
            *,
            team:teams(name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Resource not found. Redirecting to resources list...');
          setTimeout(() => navigate('/resources'), 1500);
          return;
        }

        setResource({
          ...data,
          team_name: data.team ? data.team.name : 'N/A',
        } as Resource);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching resource details:', err);
        setTimeout(() => navigate('/resources'), 1500); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading resource details...</p>
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

  if (!resource) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
        <p className="text-lg font-medium">Resource not found.</p>
        <button
          onClick={() => navigate('/resources')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Resources
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/resources')}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 mr-3"
          title="Back to Resources"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{resource.name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center text-gray-700">
            <Mail size={20} className="mr-3 text-blue-500" />
            <p><strong>Email:</strong> {resource.email}</p>
          </div>
          {resource.phone && (
            <div className="flex items-center text-gray-700">
              <Phone size={20} className="mr-3 text-green-500" />
              <p><strong>Phone:</strong> {resource.phone}</p>
            </div>
          )}
          <div className="flex items-center text-gray-700">
            <Briefcase size={20} className="mr-3 text-purple-500" />
            <p><strong>Role:</strong> {resource.role}</p>
          </div>
          {resource.hire_date && (
            <div className="flex items-center text-gray-700">
              <CalendarDays size={20} className="mr-3 text-orange-500" />
              <p><strong>Hire Date:</strong> {new Date(resource.hire_date).toLocaleDateString()}</p>
            </div>
          )}
          {resource.salary !== undefined && (
            <div className="flex items-center text-gray-700">
              <DollarSign size={20} className="mr-3 text-red-500" />
              <p><strong>Salary:</strong> ${resource.salary.toLocaleString()}</p>
            </div>
          )}
          {resource.team_name && (
            <div className="flex items-center text-gray-700">
              <Users size={20} className="mr-3 text-teal-500" />
              <p><strong>Team:</strong> {resource.team_name}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 border-t pt-6">
          <button
            // onClick={() => handleEditResource(resource)} // Assuming an edit modal/page
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200"
          >
            <Edit size={18} className="mr-2" /> Edit Resource
          </button>
          <button
            // onClick={() => handleDeleteResource(resource.id)} // Assuming a delete function
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            <Trash2 size={18} className="mr-2" /> Delete Resource
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
