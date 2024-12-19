import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const AdminApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<PrivateRoute isAuthenticated={isAuthenticated}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute isAuthenticated={isAuthenticated}><UserManagement /></PrivateRoute>} />
          <Route path="/admin/products" element={<PrivateRoute isAuthenticated={isAuthenticated}><ProductManagement /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute isAuthenticated={isAuthenticated}><OrderManagement /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute isAuthenticated={isAuthenticated}><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AdminApp; 