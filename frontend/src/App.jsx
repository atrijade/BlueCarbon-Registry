import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import AdminDashboard from './pages/AdminDashboard';
import PublicProjectVerification from './pages/PublicProjectVerification';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/project/:id" element={<PublicProjectVerification />} />

          {/* Protected Main routes, wrapped in Layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/my" 
            element={
              <ProtectedRoute allowedRoles={['ngo', 'community', 'admin']}>
                <Layout>
                  <MyProjects />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/create" 
            element={
              <ProtectedRoute allowedRoles={['ngo', 'community', 'admin']}>
                <Layout>
                  <CreateProject />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'auditor']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />

          {/* Catch-all redirect to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
