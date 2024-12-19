import React from 'react';
import { Route, Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated, children }) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

export default PrivateRoute; 