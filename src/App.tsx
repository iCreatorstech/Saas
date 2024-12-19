import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ClientOnboarding from './pages/ClientOnboarding';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import OnboardingSuccess from './pages/OnboardingSuccess';
import Dashboard from './pages/Dashboard';
import ClientManagement from './pages/ClientManagement';
import SiteManagement from './pages/SiteManagement';
import HostingManagement from './pages/HostingManagement';
import MobileApps from './pages/MobileApps';
import DeveloperAccounts from './pages/DeveloperAccounts';
import Notifications from './pages/Notifications';
import Tasks from './pages/Tasks';
import TaskCalendar from './pages/TaskCalendar';
import TaskReports from './pages/TaskReports';
import Teams from './pages/Teams';
import TeamCommunication from './pages/TeamCommunication';
import TeamCalendar from './pages/TeamCalendar';
import TeamReports from './pages/TeamReports';
import Reports from './pages/Reports';
import Support from './pages/Support';
import Billing from './pages/Billing';
import SystemStatus from './pages/SystemStatus';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import { Alert, useAlert } from './components/Alert';

function App() {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const { alert, showAlert } = useAlert();
  const { logout, startAutoLogoutTimer } = useAuth();

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Check for inactivity every minute
    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
        logout();
      }
    }, 60000);

    return () => {
      // Cleanup event listeners and interval
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity, logout]);

  useEffect(() => {
    startAutoLogoutTimer();
  }, []); // Only run once on mount

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login showAlert={showAlert} />} />
          <Route path="/register" element={<Register showAlert={showAlert} />} />
          <Route path="/onboarding-success" element={<OnboardingSuccess />} />
          <Route path="/onboard/:userId" element={<ClientOnboarding />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/onboard/:userId" element={<ClientOnboarding />} />
          <Route path="/onboarding-success" element={<OnboardingSuccess />} />
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientManagement showAlert={showAlert} />} />
            <Route path="sites" element={<SiteManagement showAlert={showAlert} />} />
            <Route path="hosting" element={<HostingManagement showAlert={showAlert} />} />
            <Route path="mobile-apps" element={<MobileApps showAlert={showAlert} />} />
            <Route path="developer-accounts" element={<DeveloperAccounts showAlert={showAlert} />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="task-calendar" element={<TaskCalendar />} />
            <Route path="task-reports" element={<TaskReports />} />
            <Route path="teams" element={<Teams showAlert={showAlert} />} />
            <Route path="team-communication" element={<TeamCommunication />} />
            <Route path="team-calendar" element={<TeamCalendar />} />
            <Route path="team-reports" element={<TeamReports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="support" element={<Support />} />
            <Route path="billing" element={<Billing />} />
            <Route path="system-status" element={<SystemStatus />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        {alert && (
          <Alert 
            message={alert.message} 
            type={alert.type} 
            onClose={alert.onClose} 
          />
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;
