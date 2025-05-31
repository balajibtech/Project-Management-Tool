import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings as SettingsIcon, PlusCircle, Trash2, Edit } from 'lucide-react';

interface WorkflowState {
  id: string;
  name: string;
  type: 'project' | 'task';
}

interface WorkflowTransition {
  id: string;
  from_state_id: string;
  to_state_id: string;
  rule_description: string;
  from_state_name?: string;
  to_state_name?: string;
}

const Settings: React.FC = () => {
  const [projectStates, setProjectStates] = useState<WorkflowState[]>([]);
  const [taskStates, setTaskStates] = useState<WorkflowState[]>([]);
  const [projectTransitions, setProjectTransitions] = useState<WorkflowTransition[]>([]);
  const [taskTransitions, setTaskTransitions] = useState<WorkflowTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showStateModal, setShowStateModal] = useState(false);
  const [isEditingState, setIsEditingState] = useState(false);
  const [currentState, setCurrentState] = useState<Partial<WorkflowState>>({ name: '', type: 'task' });

  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [isEditingTransition, setIsEditingTransition] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<Partial<WorkflowTransition>>({ from_state_id: '', to_state_id: '', rule_description: '' });
  const [availableStatesForTransition, setAvailableStatesForTransition] = useState<WorkflowState[]>([]);

  useEffect(() => {
    fetchWorkflowData();
  }, []);

  const fetchWorkflowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: states, error: statesError } = await supabase
        .from('workflow_states')
        .select('*')
        .order('name', { ascending: true });
      if (statesError) throw statesError;

      setProjectStates(states.filter(s => s.type === 'project'));
      setTaskStates(states.filter(s => s.type === 'task'));

      const { data: transitions, error: transitionsError } = await supabase
        .from('workflow_transitions')
        .select(`
          *,
          from_state:workflow_states!from_state_id(name, type),
          to_state:workflow_states!to_state_id(name, type)
        `);
      if (transitionsError) throw transitionsError;

      const formattedTransitions = transitions.map(t => ({
        ...t,
        from_state_name: t.from_state?.name || 'N/A',
        to_state_name: t.to_state?.name || 'N/A',
        type: t.from_state?.type || 'task' // Infer type from from_state
      }));

      setProjectTransitions(formattedTransitions.filter(t => t.type === 'project'));
      setTaskTransitions(formattedTransitions.filter(t => t.type === 'task'));

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- State Management ---
  const handleCreateState = (type: 'project' | 'task') => {
    setIsEditingState(false);
    setCurrentState({ name: '', type });
    setShowStateModal(true);
  };

  const handleEditState = (state: WorkflowState) => {
    setIsEditingState(true);
    setCurrentState(state);
    setShowStateModal(true);
  };

  const handleDeleteState = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this state? This will also delete any transitions associated with it.')) {
      setLoading(true);
      try {
        // Delete associated transitions first
        await supabase.from('workflow_transitions').delete().or(`from_state_id.eq.${id},to_state_id.eq.${id}`);

        // Then delete the state
        const { error } = await supabase.from('workflow_states').delete().eq('id', id);
        if (error) throw error;
        fetchWorkflowData();
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting state:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditingState && currentState.id) {
        const { error } = await supabase
          .from('workflow_states')
          .update({ name: currentState.name, type: currentState.type })
          .eq('id', currentState.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflow_states')
          .insert({ name: currentState.name, type: currentState.type });
        if (error) throw error;
      }
      setShowStateModal(false);
      fetchWorkflowData();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving state:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Transition Management ---
  const handleCreateTransition = (type: 'project' | 'task') => {
    setIsEditingTransition(false);
    setCurrentTransition({ from_state_id: '', to_state_id: '', rule_description: '' });
    setAvailableStatesForTransition(type === 'project' ? projectStates : taskStates);
    setShowTransitionModal(true);
  };

  const handleEditTransition = (transition: WorkflowTransition) => {
    setIsEditingTransition(true);
    setCurrentTransition(transition);
    setAvailableStatesForTransition(transition.type === 'project' ? projectStates : taskStates);
    setShowTransitionModal(true);
  };

  const handleDeleteTransition = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transition?')) {
      setLoading(true);
      try {
        const { error } = await supabase.from('workflow_transitions').delete().eq('id', id);
        if (error) throw error;
        fetchWorkflowData();
      } catch (err: any) {
        setError(err.message);
        console.error('Error deleting transition:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditingTransition && currentTransition.id) {
        const { error } = await supabase
          .from('workflow_transitions')
          .update({
            from_state_id: currentTransition.from_state_id,
            to_state_id: currentTransition.to_state_id,
            rule_description: currentTransition.rule_description,
          })
          .eq('id', currentTransition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflow_transitions')
          .insert({
            from_state_id: currentTransition.from_state_id,
            to_state_id: currentTransition.to_state_id,
            rule_description: currentTransition.rule_description,
          });
        if (error) throw error;
      }
      setShowTransitionModal(false);
      fetchWorkflowData();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving transition:', err);
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
        <p className="ml-3 text-gray-600">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 p-4 rounded-lg">
        <p>Error: {error}</p>
        <p>Please ensure your Supabase tables are set up correctly and you have RLS policies that allow data access.</p>
      </div >
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <SettingsIcon className="mr-3" size={32} /> Application Settings
      </h1>

      {/* Workflow States Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">Workflow States</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project States */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-medium text-gray-800">Project States</h3>
              <button
                onClick={() => handleCreateState('project')}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <PlusCircle className="mr-2" size={16} /> Add State
              </button>
            </div>
            {projectStates.length === 0 ? (
              <p className="text-gray-500">No project states defined.</p>
            ) : (
              <ul className="space-y-2">
                {projectStates.map(state => (
                  <li key={state.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">{state.name}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditState(state)} className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteState(state.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Task States */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-medium text-gray-800">Task States</h3>
              <button
                onClick={() => handleCreateState('task')}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <PlusCircle className="mr-2" size={16} /> Add State
              </button>
            </div>
            {taskStates.length === 0 ? (
              <p className="text-gray-500">No task states defined.</p>
            ) : (
              <ul className="space-y-2">
                {taskStates.map(state => (
                  <li key={state.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">{state.name}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditState(state)} className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteState(state.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Transitions Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">Workflow Transitions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Transitions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-medium text-gray-800">Project Transitions</h3>
              <button
                onClick={() => handleCreateTransition('project')}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <PlusCircle className="mr-2" size={16} /> Add Transition
              </button>
            </div>
            {projectTransitions.length === 0 ? (
              <p className="text-gray-500">No project transitions defined.</p>
            ) : (
              <ul className="space-y-2">
                {projectTransitions.map(transition => (
                  <li key={transition.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{transition.from_state_name} &rarr; {transition.to_state_name}</span>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditTransition(transition)} className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteTransition(transition.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Rule: {transition.rule_description || 'No specific rule'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Task Transitions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-medium text-gray-800">Task Transitions</h3>
              <button
                onClick={() => handleCreateTransition('task')}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <PlusCircle className="mr-2" size={16} /> Add Transition
              </button>
            </div>
            {taskTransitions.length === 0 ? (
              <p className="text-gray-500">No task transitions defined.</p>
            ) : (
              <ul className="space-y-2">
                {taskTransitions.map(transition => (
                  <li key={transition.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">{transition.from_state_name} &rarr; {transition.to_state_name}</span>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditTransition(transition)} className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteTransition(transition.id)} className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Rule: {transition.rule_description || 'No specific rule'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* State Modal */}
      {showStateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditingState ? 'Edit Workflow State' : 'Create New Workflow State'}
            </h2>
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
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowStateModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (isEditingState ? 'Update State' : 'Create State')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              {isEditingTransition ? 'Edit Workflow Transition' : 'Create New Workflow Transition'}
            </h2>
            <form onSubmit={handleTransitionSubmit} className="space-y-4">
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
              <div>
                <label htmlFor="ruleDescription" className="block text-sm font-medium text-gray-700 mb-1">Rule Description (Optional)</label>
                <textarea
                  id="ruleDescription"
                  value={currentTransition.rule_description || ''}
                  onChange={(e) => setCurrentTransition({ ...currentTransition, rule_description: e.target.value })}
                  rows={2}
                  placeholder="e.g., 'Only Project Manager can close'"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (isEditingTransition ? 'Update Transition' : 'Create Transition')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
