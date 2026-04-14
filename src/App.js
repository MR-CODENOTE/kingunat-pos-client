import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import OnlineOrdersPage from './pages/OnlineOrdersPage';
import ReportsPage from './pages/ReportsPage';
import RefundsPage from './pages/RefundsPage';
import UsersPage from './pages/UsersPage';
import UserLogsPage from './pages/UserLogsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import ConfirmModal from './components/ConfirmModal';
import PromptModal from './components/PromptModal';
import { ToastProvider, useToast } from './context/ToastContext';
import { ConfirmProvider, useConfirm } from './context/ConfirmContext';
import { PromptProvider, usePrompt } from './context/PromptContext';
import AuthProvider from './context/AuthContext';


const PrivateRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  if (!isAuthenticated()) {
    toast.showToast('Please log in to access this page.', 'error');
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    toast.showToast('Access Denied: Insufficient privileges.', 'error');
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  const { user, isAuthenticated, currentRoute, setCurrentRoute, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  }, [currentRoute]);

  if (!isAuthenticated()) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} userRole={user.role} setCurrentRoute={setCurrentRoute} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity"
          onClick={toggleSidebar}
        ></div>
      )}
      <main className="flex-1 overflow-hidden bg-gray-100 relative flex flex-col">
        <Header pageTitle={currentRoute} toggleSidebar={toggleSidebar} />
        <div id="content-area" className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pos" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/online-orders" element={<PrivateRoute roles={['admin', 'staff']}><OnlineOrdersPage /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute roles={['admin']}><ReportsPage /></PrivateRoute>} />
            <Route path="/refunds" element={<PrivateRoute roles={['admin']}><RefundsPage /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
            <Route path="/user-logs" element={<PrivateRoute roles={['admin']}><UserLogsPage /></PrivateRoute>} />
            <Route path="/audit-logs" element={<PrivateRoute roles={['admin']}><AuditLogsPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute roles={['admin']}><SettingsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};



function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <PromptProvider>
          {/* AuthProvider must be inside Toast/Confirm so it can use those hooks */}
          <AuthProvider>
            <Router>
              <AppContent />
              <ToastContainer />
              <ConfirmModal />
              <PromptModal />
            </Router>
          </AuthProvider>
        </PromptProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;