import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div id="login-screen" className="fixed inset-0 z-[800] flex items-center justify-center bg-gray-900 bg-opacity-95 transition-all duration-300">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md m-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-japan-red mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kingunat POS</h1>
          <p className="text-sm text-gray-500">Unified Inventory System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-japan-red hover:bg-[#a10026] text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400 border-t pt-4">
          <p>Default Logins (User / Pass):</p>
          <p>admin / password | cashier / password | staff / password</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
