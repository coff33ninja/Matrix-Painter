
import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="w-64 bg-gray-800 p-4 shadow-lg">
      {children}
    </div>
  );
};

export default Sidebar;
