import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { UserCheck } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import PaginationControls from '../components/PaginationControls';

const ITEMS_PER_PAGE = 10;

const UserLogsPage = () => {
  const { setCurrentRoute } = useAuth();
  const toast = useToast();
  const [userLogs, setUserLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserLogs = useCallback(async () => {
    try {
      const response = await api.get('/logs/user-logs');
      setUserLogs(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch user logs.', 'error');
      console.error('Error fetching user logs:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('User Login History');
    fetchUserLogs();
  }, [setCurrentRoute, fetchUserLogs]);

  const handlePageChange = (page) => { setCurrentPage(page); };

  const paginatedLogs = userLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-gray-600" /> User Access Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">User</th>
                <th className="py-2 px-2">Role</th>
                <th className="py-2 px-2">Event</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-gray-500">No user logs found.</td></tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 px-2 text-xs">{formatDateTime(log.log_timestamp)}</td>
                    <td className="py-2 px-2 font-bold">{log.username}</td>
                    <td className="py-2 px-2 uppercase text-xs"><span className={`px-2 py-1 rounded text-xs font-bold ${log.user_role === 'admin' ? 'bg-red-100 text-red-700' : (log.user_role === 'cashier' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}`}>{log.user_role}</span></td>
                    <td className="py-2 px-2">{log.action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          totalItems={userLogs.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default UserLogsPage;
