import React from 'react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  colorClass: string;
  bgColorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, colorClass, bgColorClass }) => {
  return (
    <div className={`rounded-xl shadow-md p-6 flex items-center space-x-4 ${bgColorClass} transform transition-transform duration-300 hover:scale-[1.01] border border-gray-200`}>
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
        <Icon size={28} className={colorClass} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
