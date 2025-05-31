import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ProjectFormData {
  id?: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  planned_budget: number;
  actual_budget: number;
  owner_id: string;
  team_id: string;
  progress: number;
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<ProjectFormData>;
  isEditing: boolean;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  resources: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  formError: string | null;
  loading: boolean;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  isEditing,
  onSubmit,
  resources,
  teams,
  formError,
  loading,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    planned_budget: 0,
    actual_budget: 0,
    owner_id: '',
    team_id: '',
    progress: 0,
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || 'Not Started',
        priority: initialData.priority || 'Medium',
        start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        planned_budget: initialData.planned_budget || 0,
        actual_budget: initialData.actual_budget || 0,
        owner_id: initialData.owner_id || '',
        team_id: initialData.team_id || '',
        progress: initialData.progress || 0,
        ...(isEditing && initialData.id && { id: initialData.id }), // Only add ID if editing
      } as ProjectFormData);
    } else if (isOpen && !isEditing) {
      // Reset form for new project
      setFormData({
        name: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        planned_budget: 0,
        actual_budget: 0,
        owner_id: '',
        team_id: '',
        progress: 0,
      });
    }
  }, [isOpen, initialData, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'planned_budget' || id === 'actual_budget' || id === 'progress' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="col-span-full">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              id="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {['Critical', 'High', 'Medium', 'Low'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              id="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              id="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="planned_budget" className="block text-sm font-medium text-gray-700 mb-1">Planned Budget</label>
            <input
              type="number"
              id="planned_budget"
              value={formData.planned_budget}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="actual_budget" className="block text-sm font-medium text-gray-700 mb-1">Actual Budget</label>
            <input
              type="number"
              id="actual_budget"
              value={formData.actual_budget}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
            <input
              type="number"
              id="progress"
              value={formData.progress}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700 mb-1">Project Owner</label>
            <select
              id="owner_id"
              value={formData.owner_id}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an owner</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              id="team_id"
              value={formData.team_id}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          {formError && (
            <div className="col-span-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {formError}</span>
            </div>
          )}
          <div className="col-span-full flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
