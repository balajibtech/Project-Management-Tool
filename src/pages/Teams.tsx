import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PlusCircle, Edit, Trash2, Search, Users, Eye } from 'lucide-react'; // Added Eye, removed unused User
import { Link } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  resource_id: string;
  role_in_team: string;
  resource: { name: string }[] | null; // Changed to array
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchTeamMembers();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data as Team[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          resource:resources(name)
        `);
      if (error) throw error;
      setTeamMembers(data as TeamMember[]);
    } catch (err: any) {
      console.error('Error fetching team members:', err.message);
    }
  };

  const handleCreateTeam = () => {
    setIsEditing(false);
    setCurrentTeam({ name: '' });
    setShowModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setIsEditing(true);
    setCurrentTeam(team);
    setShowModal(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will also remove associated team members.')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTeams(); // Refresh list
        fetchTeamMembers(); // Refresh members as well
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting team:', err);
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
      if (isEditing && currentTeam.id) {
        const { error } = await supabase
          .from('teams')
          .update({ name: currentTeam.name })
          .eq('id', currentTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teams')
          .insert({ name: currentTeam.name });
        if (error) throw error;
      }
      setShowModal(false);
      fetchTeams();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving team:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamMemberCount = (teamId: string) => {
    return teamMembers.filter(member => member.team_id === teamId).length;
  };

  const getTeamMembersList = (teamId: string) => {
    const members = teamMembers.filter(member => member.team_id === teamId);
    return members.map(tm => tm.resource?.[0]?.name || 'Unknown').join(', ');
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTeamMembersList(team.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && teams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading teams...</p>
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
        <h1 className="text-3xl font-bold text-gray-800">Teams</h1>
        <button
          onClick={handleCreateTeam}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-0.5"
        >
          <PlusCircle className="mr-2" size={20} /> New Team
        </button>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search teams..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {filteredTeams.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No teams found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Names</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTeamMemberCount(team.id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getTeamMembersList(team.id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/teams/${team.id}`}
                        className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                        title="Edit Team"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Team"
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

      {/* Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditing ? 'Edit Team' : 'Create New Team'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  value={currentTeam.name || ''}
                  onChange={(e) => setCurrentTeam({ ...currentTeam, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-4">
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
                  {loading ? 'Saving...' : (isEditing ? 'Update Team' : 'Create Team')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
