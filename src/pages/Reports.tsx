import React from 'react';
import { BarChart2, PieChart, TrendingUp, ListChecks, Users, Plus } from 'lucide-react'; // Added Plus

const Reports: React.FC = () => {
  const reportCards = [
    {
      title: 'Project Progress Overview',
      description: 'Visualizes the completion status of all active projects.',
      icon: BarChart2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Task Completion Rate',
      description: 'Shows the percentage of tasks completed versus total tasks.',
      icon: PieChart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Team Performance Metrics',
      description: 'Analyzes individual and team contributions to projects.',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Overdue Items Report',
      description: 'Lists all tasks and projects that have passed their deadlines.',
      icon: ListChecks,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Resource Utilization',
      description: 'Tracks how resources are allocated across different projects.',
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
          <Plus size={20} className="mr-2" /> Generate Custom Report
        </button>
      </div>

      <p className="text-gray-600 mb-8">
        Explore various reports to gain insights into your projects, tasks, and team performance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col items-start transform transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
          >
            <div className={`p-3 rounded-full ${card.bgColor} mb-4`}>
              <card.icon size={28} className={card.color} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{card.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{card.description}</p>
            <button className="mt-auto px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200">
              View Report
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Reports</h2>
        <ul className="space-y-3">
          <li className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
            <span className="font-medium text-gray-700">Q1 2025 Project Summary</span>
            <span className="text-sm text-gray-500">Generated: Mar 28, 2025</span>
            <button className="text-blue-600 hover:underline text-sm">Download</button>
          </li>
          <li className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
            <span className="font-medium text-gray-700">February Task Performance</span>
            <span className="text-sm text-gray-500">Generated: Mar 1, 2025</span>
            <button className="text-blue-600 hover:underline text-sm">Download</button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;
