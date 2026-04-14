import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

const Header = ({ pageTitle, toggleSidebar }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="bg-white shadow-sm px-4 md:px-8 py-3 flex justify-between items-center z-10 relative flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
          <Menu className="w-6 h-6" />
        </button>
        <h2 id="page-title" className="text-xl md:text-2xl font-bold text-gray-800 truncate">
          {pageTitle}
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs sm:text-sm text-right">
          <p id="current-date" className="font-medium text-gray-900">{currentDate}</p>
          <p id="current-time" className="text-gray-500">{currentTime}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
