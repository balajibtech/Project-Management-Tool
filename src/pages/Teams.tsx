import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Search, Users, User } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  members?: { id: string; name: string; role_in_team: string }[];
}

interface Resource {
  id: string;
  name: string;
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({ name: '', members: [] });
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchAllResources();
  }, []);

  const fetchTeams = async () => {
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
        .order('name', { ascending: true });

      if (error) throw error;

      const teamsWithMembers = data.map(team => ({
        ...team,
        members: team.team_members.map(tm => ({
          id: tm.resource_id,
          name: tm.resource?.name || 'Unknown',
          role_in_team: tm.role_in_team
        }))
      }));
      setTeams(teamsWithMembers as Team[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResources = async () => {
    try {
      const { data, error } = await supabase.from('resources').select('id, name');
      if (error) throw error;
      setAllResources(data);
    } catch (err: any) {
      console.error('Error fetching all resources:', err.message);
    }
  };

  const handleCreateTeam = () => {
    setIsEditing(false);
    setCurrentTeam({ name: '', members: [] });
    setShowModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setIsEditing(true);
    setCurrentTeam(team);
    setShowModal(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will also remove all team members from it.')) {
      setLoading(true);
      try {
        // Delete associated team members first
        const { error: membersError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', id);
        if (membersError) throw membersError;

        // Then delete the team
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTeams(); // Refresh list
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting team:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updatedMembers = [...(currentTeam.members || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setCurrentTeam({ ...currentTeam, members: updatedMembers });
  };

  const handleAddMember = () => {
    setCurrentTeam({
      ...currentTeam,
      members: [...(currentTeam.members || []), { id: '', name: '', role_in_team: '' }]
    });
  };

  const handleRemoveMember = (index: number) => {
    const updatedMembers = (currentTeam.members || []).filter((_, i) => i !== index);
    setCurrentTeam({ ...currentTeam, members: updatedMembers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let teamId = currentTeam.id;
      if (isEditing && teamId) {
        const { error } = await supabase
          .from('teams')
          .update({ name: currentTeam.name })
          .eq('id', teamId);
        if (error) throw error;

        // Handle team members: delete existing, then insert new ones
        await supabase.from('team_members').delete().eq('team_id', teamId);
      } else {
        const { data, error } = await supabase
          .from('teams')
          .insert({ name: currentTeam.name })
          .select('id')
          .single();
        if (error) throw error;
        teamId = data.id;
      }

      if (currentTeam.members && currentTeam.members.length > 0) {
        const membersToInsert = currentTeam.members.map(member => ({
          team_id: teamId,
          resource_id: member.id,
          role_in_team: member.role_in_team
        }));
        const { error: membersInsertError } = await supabase
          .from('team_members')
          .insert(membersToInsert);
        if (membersInsertError) throw membersInsertError;
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

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.members?.some(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="Search teams by name or member..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {filteredTeams.length === 0 && !loading ? (
        <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-600">
          <p className="text-lg font-medium">No teams found. Start by creating a new one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex flex-col justify-between transform transition-transform duration-300 hover:scale-[1.01]">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{team.name}</h2>
                <p className="text-sm text-gray-600 mb-2 flex items-center"><Users size={16} className="mr-2" /> Team Members:</p>
                {team.members && team.members.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-700 ml-4 space-y-1">
                    {team.members.map(member => (
                      <li key={member.id}>
                        {member.name} (<span className="font-medium">{member.role_in_team || 'N/A'}</span>)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 ml-4">No members assigned.</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Link to={`/teams/${team.id}`} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors duration-200" title="View Details">
                  <Eye size={18} />
                </Link>
                <button
                  onClick={() => handleEditTeam(team)}
                  className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors duration-200"
                  title="Edit Team"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors duration-200"
                  title="Delete Team"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditing ? 'Edit Team' : 'Create New Team'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
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

              <div className="col-span-full">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Team Members</h3>
                {currentTeam.members?.map((member, index) => (
                  <div key={index} className="flex items-end space-x-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label htmlFor={`member-${index}-id`} className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                      <select
                        id={`member-${index}-id`}
                        value={member.id}
                        onChange={(e) => handleMemberChange(index, 'id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Resource</option>
                        {allResources.map(res => (
                          <option key={res.id} value={res.id}>{res.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor={`member-${index}-role`} className="block text-sm font-medium text-gray-700 mb-1">Role in Team</label>
                      <input
                        type="text"
                        id={`member-${index}-role`}
                        value={member.role_in_team}
                        onChange={(e) => handleMemberChange(index, 'role_in_team', e.target.value)}
                        placeholder="e.g., Lead Developer"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                      title="Remove Member"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 mt-2"
                >
                  <PlusCircle className="mr-2" size={20} /> Add Member
                </button>
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
