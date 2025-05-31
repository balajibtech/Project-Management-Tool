import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit, Trash2, Users, User } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  members?: { id: string; name: string; role_in_team: string }[];
}

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id) {
        setError('Team ID is missing.');
        setLoading(false);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(id)) {
        setError('Invalid team ID format. Redirecting to teams list...');
        setLoading(false);
        setTimeout(() => navigate('/teams'), 1500);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            team_members(
              resource_id,
              role_in_team,
              resource:resources(name)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Team not found. Redirecting to teams list...');
          setTimeout(() => navigate('/teams'), 1500);
          return;
        }

        setTeam({
          ...data,
          members: data.team_members.map(tm => ({
            id: tm.resource_id,
            name: tm.resource?.name || 'Unknown',
            role_in_team: tm.role_in_team
          }))
        } as Team);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching team details:', err);
        setTimeout(() => navigate('/teams'), 1500); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading team details...</p>
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

  if (!team) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
        <p className="text-lg font-medium">Team not found.</p>
        <button
          onClick={() => navigate('/teams')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          Go to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 mr-3"
          title="Back to Teams"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{team.name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><Users size={20} className="mr-2 text-blue-500" /> Team Members</h2>
          {team.members && team.members.length > 0 ? (
            <ul className="space-y-3">
              {team.members.map(member => (
                <li key={member.id} className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <User size={18} className="mr-3 text-purple-500" />
                  <p className="text-gray-700">
                    <strong>{member.name}</strong> (<span className="font-medium text-gray-600">{member.role_in_team || 'N/A'}</span>)
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No members assigned to this team.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 border-t pt-6">
          <button
            // onClick={() => handleEditTeam(team)} // Assuming an edit modal/page
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200"
          >
            <Edit size={18} className="mr-2" /> Edit Team
          </button>
          <button
            // onClick={() => handleDeleteTeam(team.id)} // Assuming a delete function
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            <Trash2 size={18} className="mr-2" /> Delete Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
