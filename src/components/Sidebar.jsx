import React from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, LayoutDashboard, ShoppingCart, Package, Globe, BarChart3, Users, UserCheck, RotateCcw, FileClock, Settings, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'staff'] },
  { name: 'POS Terminal', path: '/pos', icon: ShoppingCart, roles: ['admin', 'cashier'] },
  { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'cashier', 'staff'] },
  { name: 'Online Orders', path: '/online-orders', icon: Globe, roles: ['admin', 'staff'] },
  { name: 'Sales Reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
];

const adminNavItems = [
  { name: 'Users', path: '/users', icon: Users, roles: ['admin'] },
  { name: 'User Logs', path: '/user-logs', icon: UserCheck, roles: ['admin'] },
  { name: 'Refunds', path: '/refunds', icon: RotateCcw, roles: ['admin'] },
  { name: 'System Audit Logs', path: '/audit-logs', icon: FileClock, roles: ['admin'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
];

const Sidebar = ({ isOpen, toggleSidebar, userRole }) => {
  const { user, logout, setCurrentRoute, currentRoute } = useAuth();

  const handleNavLinkClick = (name) => {
    setCurrentRoute(name);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const renderNavLink = (item) => {
    if (!item.roles.includes(userRole)) return null;
    const isActive = currentRoute === item.name || (currentRoute === 'Dashboard' && item.name === 'Dashboard' && window.location.pathname === '/');
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={() => handleNavLinkClick(item.name)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
          ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
      >
        <item.icon className="w-5 h-5" /><span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}
    >
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-japan-red p-2 rounded-lg"><CircleDot className="w-5 h-5 text-white" /></div>
          <div>
            <h2 className="font-bold text-lg tracking-wide">KINGUNAT</h2>
            <p className="text-xs text-gray-400">Store Management</p>
          </div>
        </div>
        <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map(renderNavLink)}

        {userRole === 'admin' && (
          <div id="admin-links" className="border-t border-gray-800 mt-2 pt-2">
            <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Administration</p>
            {adminNavItems.map(renderNavLink)}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-gray-300" /></div>
          <div className="overflow-hidden">
            <p id="current-user-name" className="text-sm font-medium truncate">{user?.username || 'User'}</p>
            <p id="current-user-role" className="text-xs text-gray-500 capitalize truncate">{user?.role || 'Role'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 py-2 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
