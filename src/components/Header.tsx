import React from 'react';
import { Search, Bell, HelpCircle, UserCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between border-b border-gray-200">
      <div className="relative flex-1 max-w-md mr-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search projects, tasks, resources..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 text-gray-700"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200" aria-label="Help">
          <HelpCircle size={20} />
        </button>
        <button className="p-1 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200" aria-label="User Profile">
          <UserCircle size={32} />
        </button>
      </div>
    </header>
  );
};

export default Header;
