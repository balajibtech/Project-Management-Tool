import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Edit, Trash2, Users, PlusCircle, X } from 'lucide-react';

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

interface Resource {
  id: string;
  name: string;
}

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({});
  const [isEditingMember, setIsEditingMember] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Team ID is missing.');
      setLoading(false);
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid team ID format. Redirecting to teams list...');
      navigate('/teams', { replace: true });
      return;
    }

    fetchTeamDetails();
    fetchTeamMembers();
    fetchResources();
  }, [id, navigate]);

  const fetchTeamDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          setError('Team not found.');
        } else {
          throw error;
        }
      } else {
        setTeam(data as Team);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching team details:', err);
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
        `)
        .eq('team_id', id)
        .order('role_in_team', { ascending: true });

      if (error) throw error;
      setTeamMembers(data as TeamMember[]);
    } catch (err: any) {
      console.error('Error fetching team members:', err.message);
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

  const handleEditTeam = () => {
    setShowEditModal(true);
  };

  const handleDeleteTeam = async () => {
    if (window.confirm('Are you sure you want to delete this team? This will also remove all associated team members.')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) throw error;

        alert('Team deleted successfully!');
        navigate('/teams'); // Redirect to teams list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting team:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTeamUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: team.name })
        .eq('id', team.id);

      if (error) throw error;
      setShowEditModal(false);
      fetchTeamDetails(); // Refresh team name
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setIsEditingMember(false);
    setCurrentMember({ team_id: id, resource_id: '', role_in_team: '' });
    setShowAddMemberModal(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setIsEditingMember(true);
    setCurrentMember(member);
    setShowAddMemberModal(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId);

        if (error) throw error;
        fetchTeamMembers(); // Refresh members list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting team member:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditingMember && currentMember.id) {
        const { error } = await supabase
          .from('team_members')
          .update(currentMember)
          .eq('id', currentMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert(currentMember);
        if (error) throw error;
      }
      setShowAddMemberModal(false);
      fetchTeamMembers(); // Refresh members list
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving team member:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Teams
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-gray-600 bg-gray-100 p-4 rounded-lg">
        <p>Team not found.</p>
        <button onClick={() => navigate('/teams')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{team.name}</h1>
            <p className="text-gray-600 text-lg">Team Details</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleEditTeam}
              className="p-3 rounded-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors duration-200 shadow-sm"
              title="Edit Team"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleDeleteTeam}
              disabled={loading}
              className="p-3 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Team"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Users className="mr-2" size={24} /> Team Members
        </h2>
        <div className="mb-4">
          <button
            onClick={handleAddMember}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            <PlusCircle className="mr-2" size={20} /> Add Member
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600 border border-gray-200">
            <p className="text-lg font-medium">No members in this team yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role in Team</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.resource?.[0]?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{member.role_in_team}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                          title="Edit Member"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                          title="Remove Member"
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
      </div>

      {/* Edit Team Modal */}
      {showEditModal && team && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">Edit Team</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleTeamUpdateSubmit} className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  value={team.name}
                  onChange={(e) => setTeam({ ...team, name: e.target.value })}
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
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Update Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingMember ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label htmlFor="memberResource" className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <select
                  id="memberResource"
                  value={currentMember.resource_id || ''}
                  onChange={(e) => setCurrentMember({ ...currentMember, resource_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a resource</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>{resource.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="memberRole" className="block text-sm font-medium text-gray-700 mb-1">Role in Team</label>
                <input
                  type="text"
                  id="memberRole"
                  value={currentMember.role_in_team || ''}
                  onChange={(e) => setCurrentMember({ ...currentMember, role_in_team: e.target.value })}
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
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
