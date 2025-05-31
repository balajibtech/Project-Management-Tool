import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface TimeEntry {
  id: number;
  date: string;
  project: string;
  task: string;
  hours: number;
  description: string;
}

const Timesheet: React.FC = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: 1, date: '2025-03-25', project: 'Website Redesign', task: 'Frontend Development', hours: 4.5, description: 'Worked on header and navigation' },
    { id: 2, date: '2025-03-25', project: 'Mobile App Dev', task: 'API Integration', hours: 3.0, description: 'Integrated user authentication API' },
    { id: 3, date: '2025-03-24', project: 'Website Redesign', task: 'Design Review', hours: 2.0, description: 'Reviewed new design mockups with team' },
  ]);

  const [newEntry, setNewEntry] = useState({
    date: '',
    project: '',
    task: '',
    hours: '',
    description: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntry.date && newEntry.project && newEntry.task && newEntry.hours) {
      const entry: TimeEntry = {
        id: timeEntries.length + 1,
        date: newEntry.date,
        project: newEntry.project,
        task: newEntry.task,
        hours: parseFloat(newEntry.hours),
        description: newEntry.description,
      };
      setTimeEntries(prev => [...prev, entry]);
      setNewEntry({ date: '', project: '', task: '', hours: '', description: '' });
    }
  };

  const handleDeleteEntry = (id: number) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="container mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Timesheet</h1>
        <div className="text-xl font-semibold text-gray-700">Total Hours Logged: <span className="text-blue-600">{totalHours.toFixed(1)}</span></div>
      </div>

      {/* Add New Entry Form */}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Log New Time Entry</h2>
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={newEntry.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <input
              type="text"
              id="project"
              name="project"
              value={newEntry.project}
              onChange={handleInputChange}
              placeholder="e.g., Website Redesign"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <input
              type="text"
              id="task"
              name="task"
              value={newEntry.task}
              onChange={handleInputChange}
              placeholder="e.g., Implement Auth"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
            <input
              type="number"
              id="hours"
              name="hours"
              value={newEntry.hours}
              onChange={handleInputChange}
              step="0.5"
              min="0.5"
              placeholder="e.g., 7.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={newEntry.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Brief description of work done..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus size={20} className="mr-2" /> Add Entry
            </button>
          </div>
        </form>
      </div>

      {/* Time Entries Table */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Time Entries</h2>
      <div className="overflow-x-auto bg-gray-50 rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeEntries.length > 0 ? (
              timeEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.task}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.hours.toFixed(1)}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{entry.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      aria-label={`Delete entry for ${entry.task}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No time entries logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timesheet;
