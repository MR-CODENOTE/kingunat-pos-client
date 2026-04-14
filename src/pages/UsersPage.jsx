import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api/api';
import { Plus, Edit, Trash, X } from 'lucide-react';

const UsersPage = () => {
  const { setCurrentRoute, user: currentUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to fetch users.', 'error');
      console.error('Error fetching users:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('User Management');
    fetchUsers();
  }, [setCurrentRoute, fetchUsers]);

  const openUserModal = () => {
    setIsUserModalOpen(true);
    setIsEditing(false);
    setEditUserId(null);
    setUsername('');
    setPassword('');
    setRole('staff');
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
  };

  const editUser = (userToEdit) => {
    setIsUserModalOpen(true);
    setIsEditing(true);
    setEditUserId(userToEdit.id);
    setUsername(userToEdit.username);
    setPassword(''); // Never pre-fill password for security
    setRole(userToEdit.role);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      const userData = { username, role };
      if (password) { // Only send password if it's being updated
        userData.password = password;
      }

      if (isEditing) {
        await api.put(`/users/${editUserId}`, userData);
        toast.showToast('User updated successfully!', 'success');
      } else {
        if (!password) {
            return toast.showToast('Password is required for new users.', 'error');
        }
        await api.post('/users', userData);
        toast.showToast('User added successfully!', 'success');
      }
      closeUserModal();
      fetchUsers();
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to save user.', 'error');
      console.error('Error saving user:', error);
    }
  };

  const deleteUser = (id, usernameToDelete) => {
    if (usernameToDelete === 'admin' && currentUser.username === 'admin') {
        return toast.showToast('Cannot delete the primary admin account.', 'error');
    }
    confirm.showConfirm("Delete User", `Are you sure you want to delete user '${usernameToDelete}'?`, async () => {
      try {
        await api.delete(`/users/${id}`);
        toast.showToast(`User '${usernameToDelete}' deleted.`, 'info');
        fetchUsers();
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to delete user.', 'error');
        console.error('Error deleting user:', error);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex justify-between">
          <h3 className="font-bold text-lg">Users</h3>
          <button onClick={openUserModal} className="bg-japan-red text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Plus className="w-4 h-4"/> Add User</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Last Login</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-gray-500">No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-bold">{u.username}</td>
                    <td className="p-3 uppercase text-xs"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : (u.role === 'cashier' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}`}>{u.role}</span></td>
                    <td className="p-3 text-xs text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                    <td className="p-3">
                      <button onClick={() => editUser(u)} className="text-blue-500 mr-2 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                      {u.username !== 'admin' && ( // Prevent deleting the primary 'admin' account
                        <button onClick={() => deleteUser(u.id, u.username)} className="text-red-500 hover:text-red-700"><Trash className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeUserModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800" id="user-modal-title">{isEditing ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeUserModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className='text-xs text-gray-500'>(Leave blank to keep current)</span>}</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" { ...(!isEditing && {required: true}) } /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="staff">Staff</option>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-japan-red text-white font-bold py-2 rounded-lg hover:bg-red-800">Save User</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
