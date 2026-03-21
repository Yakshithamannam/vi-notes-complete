import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/Auth/AuthPage';
import Dashboard from './components/Dashboard/Dashboard';
import Editor from './components/Editor/Editor';
import ReportPage from './components/Report/ReportPage';
import LandingPage from './components/Landing/LandingPage';
import EducatorDashboard from './components/Educator/EducatorDashboard';
import ProfilePage from './components/Profile/ProfilePage';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import { ForgotPassword, ResetPassword } from './components/Auth/PasswordReset';
import './styles/global.css';
import './styles/darkmode.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#aaa' }}>
      Loading…
    </div>
  );
  if (!user) {
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={sessionStorage.getItem('redirectAfterLogin') || '/dashboard'} /> : <AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/editor" element={<PrivateRoute><Editor /></PrivateRoute>} />
      <Route path="/reports/:id" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
      <Route path="/educator" element={<PrivateRoute><EducatorDashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;