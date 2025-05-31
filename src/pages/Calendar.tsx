import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const Calendar: React.FC = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dummyDates = Array.from({ length: 30 }, (_, i) => i + 1); // Days 1-30 for a month

  const dummyEvents = [
    { date: 5, title: 'Project Alpha Review', project: 'Website Redesign', type: 'meeting' },
    { date: 10, title: 'Task: Implement Auth', project: 'Mobile App Dev', type: 'task' },
    { date: 15, title: 'Team Sync', project: 'General', type: 'meeting' },
    { date: 22, title: 'Deadline: Feature X', project: 'Website Redesign', type: 'deadline' },
    { date: 25, title: 'Client Demo Prep', project: 'Mobile App Dev', type: 'task' },
  ];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-200 text-blue-800';
      case 'task': return 'bg-green-200 text-green-800';
      case 'deadline': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
          <Plus size={20} className="mr-2" /> Add Event
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">March 2025</h2>
        <button className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ChevronRight size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-blue-50 text-blue-700 font-semibold text-center py-3 text-sm border-b border-gray-200">
            {day}
          </div>
        ))}
        {dummyDates.map(date => (
          <div key={date} className="min-h-[120px] bg-white p-2 border-r border-b border-gray-200 last:border-r-0">
            <p className="text-sm font-medium text-gray-700 mb-2">{date}</p>
            <div className="space-y-1">
              {dummyEvents.filter(event => event.date === date).map((event, index) => (
                <div key={index} className={`text-xs px-2 py-1 rounded-md truncate ${getEventColor(event.type)}`}>
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Events List */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
        <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
          {dummyEvents.length > 0 ? (
            <ul className="space-y-3">
              {dummyEvents.map((event, index) => (
                <li key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getEventColor(event.type)}`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                    <span className="font-medium text-gray-700">{event.title}</span>
                    <span className="text-sm text-gray-500">- {event.project}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    March {event.date}, 2025
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
