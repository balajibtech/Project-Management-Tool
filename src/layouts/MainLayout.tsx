import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Header from '../components/Header'; // Import the new Header component
import {
  Home, // Changed from LayoutDashboard
  Briefcase, // Changed from FolderKanban
  ListTodo,
  Users,
  Settings,
  LogOut,
  CalendarDays, // New icon
  BarChart2, // New icon
  Clock // New icon
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Projects', icon: Briefcase, path: '/projects' },
    { name: 'Tasks', icon: ListTodo, path: '/tasks' },
    { name: 'Resources', icon: Users, path: '/resources' },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar' }, // New
    { name: 'Reports', icon: BarChart2, path: '/reports' },     // New
    { name: 'Timesheet', icon: Clock, path: '/timesheet' },     // New
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100"> {/* Lighter background */}
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-700 flex flex-col fixed h-full z-50 shadow-lg border-r border-gray-200">
        <div className="flex items-center p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 tracking-wide">
            ProjectHub
          </h1>
        </div>

        <nav className="flex-1 mt-4 px-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-1">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center py-2.5 px-3 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 ease-in-out group
                    ${isActive ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : ''}`
                  }
                >
                  <item.icon className="mr-3" size={20} />
                  <span className="text-sm whitespace-nowrap">
                    {item.name}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center py-2.5 px-3 text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors duration-200"
          >
            <LogOut className="mr-3" size={20} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64"> {/* Adjusted margin-left for fixed sidebar */}
        <Header /> {/* New Header component */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50"> {/* Lighter background for main content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
