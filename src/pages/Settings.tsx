import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PlusCircle, Edit, Trash2, Settings as SettingsIcon, Workflow, Users, LayoutGrid, List, X } from 'lucide-react';

interface WorkflowState {
  id: string;
  name: string;
  type: 'project' | 'task'; // Added type property
  is_initial: boolean;
  is_final: boolean;
}

interface WorkflowTransition {
  id: string;
  from_state_id: string;
  to_state_id: string;
  type: 'project' | 'task'; // Added type property
}

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

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow States
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [isEditingState, setIsEditingState] = useState(false);
  const [currentState, setCurrentState] = useState<Partial<WorkflowState>>({});

  // Workflow Transitions
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([]);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [isEditingTransition, setIsEditingTransition] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<Partial<WorkflowTransition>>({});
  const [availableStatesForTransition, setAvailableStatesForTransition] = useState<WorkflowState[]>([]);

  // Teams
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});

  // Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({});
  const [resources, setResources] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'workflow') {
        await fetchWorkflowStates();
        await fetchWorkflowTransitions();
      } else if (activeTab === 'teams') {
        await fetchTeams();
        await fetchTeamMembers();
        await fetchResources();
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Workflow States Functions ---
  const fetchWorkflowStates = async () => {
    const { data, error } = await supabase.from('workflow_states').select('*').order('name');
    if (error) throw error;
    setWorkflowStates(data as WorkflowState[]);
  };

  const handleCreateState = () => {
    setIsEditingState(false);
    setCurrentState({ name: '', type: 'task', is_initial: false, is_final: false });
    setShowStateModal(true);
  };

  const handleEditState = (state: WorkflowState) => {
    setIsEditingState(true);
    setCurrentState(state);
    setShowStateModal(true);
  };

  const handleDeleteState = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow state?')) {
      try {
        const { error } = await supabase.from('workflow_states').delete().eq('id', id);
        if (error) throw error;
        fetchWorkflowStates();
        fetchWorkflowTransitions(); // Transitions might be affected
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingState && currentState.id) {
        const { error } = await supabase.from('workflow_states').update(currentState).eq('id', currentState.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflow_states').insert(currentState);
        if (error) throw error;
      }
      setShowStateModal(false);
      fetchWorkflowStates();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Workflow Transitions Functions ---
  const fetchWorkflowTransitions = async () => {
    const { data, error } = await supabase
      .from('workflow_transitions')
      .select(`
        *,
        from_state:workflow_states!from_state_id(name, type),
        to_state:workflow_states!to_state_id(name, type)
      `)
      .order('from_state_id');
    if (error) throw error;
    setWorkflowTransitions(data as WorkflowTransition[]);
  };

  const handleCreateTransition = () => {
    setIsEditingTransition(false);
    setCurrentTransition({ from_state_id: '', to_state_id: '', type: 'task' });
    setAvailableStatesForTransition(workflowStates.filter(s => s.type === 'task')); // Default to task
    setShowTransitionModal(true);
  };

  const handleEditTransition = (transition: WorkflowTransition) => {
    setIsEditingTransition(true);
    setCurrentTransition(transition);
    // Filter states based on the transition's type
    const projectStates = workflowStates.filter(s => s.type === 'project');
    const taskStates = workflowStates.filter(s => s.type === 'task');
    setAvailableStatesForTransition(transition.type === 'project' ? projectStates : taskStates);
    setShowTransitionModal(true);
  };

  const handleDeleteTransition = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow transition?')) {
      try {
        const { error } = await supabase.from('workflow_transitions').delete().eq('id', id);
        if (error) throw error;
        fetchWorkflowTransitions();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingTransition && currentTransition.id) {
        const { error } = await supabase.from('workflow_transitions').update(currentTransition).eq('id', currentTransition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflow_transitions').insert(currentTransition);
        if (error) throw error;
      }
      setShowTransitionModal(false);
      fetchWorkflowTransitions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Teams Functions ---
  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (error) throw error;
    setTeams(data as Team[]);
  };

  const handleCreateTeam = () => {
    setIsEditingTeam(false);
    setCurrentTeam({ name: '' });
    setShowTeamModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setIsEditingTeam(true);
    setCurrentTeam(team);
    setShowTeamModal(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will also remove associated team members.')) {
      try {
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
        fetchTeams();
        fetchTeamMembers(); // Members might be affected
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingTeam && currentTeam.id) {
        const { error } = await supabase.from('teams').update(currentTeam).eq('id', currentTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert(currentTeam);
        if (error) throw error;
      }
      setShowTeamModal(false);
      fetchTeams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Team Members Functions ---
  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        resource:resources(name)
      `)
      .order('team_id');
    if (error) throw error;
    setTeamMembers(data as TeamMember[]);
  };

  const fetchResources = async () => {
    const { data, error } = await supabase.from('resources').select('id, name');
    if (error) throw error;
    setResources(data);
  };

  const handleCreateMember = () => {
    setIsEditingMember(false);
    setCurrentMember({ team_id: '', resource_id: '', role_in_team: '' });
    setShowMemberModal(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setIsEditingMember(true);
    setCurrentMember(member);
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        const { error } = await supabase.from('team_members').delete().eq('id', id);
        if (error) throw error;
        fetchTeamMembers();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingMember && currentMember.id) {
        const { error } = await supabase.from('team_members').update(currentMember).eq('id', currentMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert(currentMember);
        if (error) throw error;
      }
      setShowMemberModal(false);
      fetchTeamMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && workflowStates.length === 0 && teams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-3 text-gray-600">Loading settings...</p>
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 text-lg font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors duration-200`}
        >
          <SettingsIcon className="inline-block mr-2" size={20} /> General
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-6 py-3 text-lg font-medium ${activeTab === 'workflow' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors duration-200`}
        >
          <Workflow className="inline-block mr-2" size={20} /> Workflow
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-6 py-3 text-lg font-medium ${activeTab === 'teams' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'} transition-colors duration-200`}
        >
          <Users className="inline-block mr-2" size={20} /> Teams
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">General Settings</h2>
          <p className="text-gray-700">
            This section is for general application settings.
            Future features might include user profile management, notification preferences, or global display options.
          </p>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workflow States Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Workflow States</h2>
              <button
                onClick={handleCreateState}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="mr-2" size={20} /> New State
              </button>
            </div>
            {workflowStates.length === 0 ? (
              <p className="text-gray-600">No workflow states defined yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Initial</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workflowStates.map((state) => (
                      <tr key={state.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{state.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{state.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          {state.is_initial ? <CheckCircle size={18} className="text-green-500 mx-auto" /> : <XCircle size={18} className="text-red-500 mx-auto" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          {state.is_final ? <CheckCircle size={18} className="text-green-500 mx-auto" /> : <XCircle size={18} className="text-red-500 mx-auto" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditState(state)}
                              className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                              title="Edit State"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteState(state.id)}
                              className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete State"
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

          {/* Workflow Transitions Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Workflow Transitions</h2>
              <button
                onClick={handleCreateTransition}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="mr-2" size={20} /> New Transition
              </button>
            </div>
            {workflowTransitions.length === 0 ? (
              <p className="text-gray-600">No workflow transitions defined yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From State</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To State</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workflowTransitions.map((transition) => (
                      <tr key={transition.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(transition as any).from_state?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {(transition as any).to_state?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                          {transition.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditTransition(transition)}
                              className="p-2 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"
                              title="Edit Transition"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransition(transition.id)}
                              className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete Transition"
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
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Teams</h2>
              <button
                onClick={handleCreateTeam}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="mr-2" size={20} /> New Team
              </button>
            </div>
            {teams.length === 0 ? (
              <p className="text-gray-600">No teams defined yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
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
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
              <button
                onClick={handleCreateMember}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusCircle className="mr-2" size={20} /> Add Member
              </button>
            </div>
            {teamMembers.length === 0 ? (
              <p className="text-gray-600">No team members defined yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teams.find(t => t.id === member.team_id)?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                              title="Delete Member"
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
        </div>
      )}

      {/* Workflow State Modal */}
      {showStateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingState ? 'Edit Workflow State' : 'Create New Workflow State'}</h2>
              <button onClick={() => setShowStateModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleStateSubmit} className="space-y-4">
              <div>
                <label htmlFor="stateName" className="block text-sm font-medium text-gray-700 mb-1">State Name</label>
                <input
                  type="text"
                  id="stateName"
                  value={currentState.name || ''}
                  onChange={(e) => setCurrentState({ ...currentState, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="stateType" className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                <select
                  id="stateType"
                  value={currentState.type || 'task'}
                  onChange={(e) => setCurrentState({ ...currentState, type: e.target.value as 'project' | 'task' })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isInitial"
                  checked={currentState.is_initial || false}
                  onChange={(e) => setCurrentState({ ...currentState, is_initial: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isInitial" className="ml-2 block text-sm text-gray-900">Is Initial State</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFinal"
                  checked={currentState.is_final || false}
                  onChange={(e) => setCurrentState({ ...currentState, is_final: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isFinal" className="ml-2 block text-sm text-gray-900">Is Final State</label>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowStateModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save State'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingTransition ? 'Edit Workflow Transition' : 'Create New Workflow Transition'}</h2>
              <button onClick={() => setShowTransitionModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleTransitionSubmit} className="space-y-4">
              <div>
                <label htmlFor="transitionType" className="block text-sm font-medium text-gray-700 mb-1">Applies To</label>
                <select
                  id="transitionType"
                  value={currentTransition.type || 'task'}
                  onChange={(e) => {
                    const newType = e.target.value as 'project' | 'task';
                    setCurrentTransition({ ...currentTransition, type: newType, from_state_id: '', to_state_id: '' });
                    setAvailableStatesForTransition(workflowStates.filter(s => s.type === newType));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label htmlFor="fromState" className="block text-sm font-medium text-gray-700 mb-1">From State</label>
                <select
                  id="fromState"
                  value={currentTransition.from_state_id || ''}
                  onChange={(e) => setCurrentTransition({ ...currentTransition, from_state_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a state</option>
                  {availableStatesForTransition.map(state => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="toState" className="block text-sm font-medium text-gray-700 mb-1">To State</label>
                <select
                  id="toState"
                  value={currentTransition.to_state_id || ''}
                  onChange={(e) => setCurrentTransition({ ...currentTransition, to_state_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a state</option>
                  {availableStatesForTransition.map(state => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowTransitionModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Transition'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingTeam ? 'Edit Team' : 'Create New Team'}</h2>
              <button onClick={() => setShowTeamModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleTeamSubmit} className="space-y-4">
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
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowTeamModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-gray-800">{isEditingMember ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <label htmlFor="memberTeam" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  id="memberTeam"
                  value={currentMember.team_id || ''}
                  onChange={(e) => setCurrentMember({ ...currentMember, team_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
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
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
