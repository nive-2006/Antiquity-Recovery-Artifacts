import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingApproval from './pages/PendingApproval';
import GlobalSearch from './pages/GlobalSearch';

import CustodianDashboard from './pages/custodian/CustodianDashboard';
import RegisterArtifact from './pages/custodian/RegisterArtifact';
import MyArtifacts from './pages/custodian/MyArtifacts';
import ArtifactProfile from './pages/custodian/ArtifactProfile';
import ReportStolen from './pages/custodian/ReportStolen';

import AuthorityDashboard from './pages/authority/AuthorityDashboard';
import ReportRecovered from './pages/authority/ReportRecovered';
import MatchResults from './pages/authority/MatchResults';
import Cases from './pages/authority/Cases';

import VerificationQueue from './pages/expert/VerificationQueue';
import ReviewMatch from './pages/expert/ReviewMatch';

import UserApprovals from './pages/admin/UserApprovals';
import Users from './pages/admin/Users';
import AdminStats from './pages/admin/AdminStats';
import AuditLogView from './pages/admin/AuditLogView';

import ArtifactDetector from './components/ArtifactDetector';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/search" element={<GlobalSearch />} />
              <Route path="/detector" element={<ArtifactDetector />} />
              <Route path="/artifacts/:id" element={<ArtifactProfile />} />

              {/* Custodian Protected Routes */}
              <Route
                path="/custodian/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['custodian', 'admin']}>
                    <CustodianDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/custodian/register"
                element={
                  <ProtectedRoute allowedRoles={['custodian', 'admin']}>
                    <RegisterArtifact />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/custodian/my-artifacts"
                element={
                  <ProtectedRoute allowedRoles={['custodian', 'admin']}>
                    <MyArtifacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/custodian/report-stolen"
                element={
                  <ProtectedRoute allowedRoles={['custodian', 'admin']}>
                    <ReportStolen />
                  </ProtectedRoute>
                }
              />

              {/* Authority Protected Routes */}
              <Route
                path="/authority/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['authority', 'admin']}>
                    <AuthorityDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/report-recovered"
                element={
                  <ProtectedRoute allowedRoles={['authority', 'admin']}>
                    <ReportRecovered />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/match-results"
                element={
                  <ProtectedRoute allowedRoles={['authority', 'admin']}>
                    <MatchResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority/cases"
                element={
                  <ProtectedRoute allowedRoles={['authority', 'admin']}>
                    <Cases />
                  </ProtectedRoute>
                }
              />

              {/* Expert Protected Routes */}
              <Route
                path="/expert/verification-queue"
                element={
                  <ProtectedRoute allowedRoles={['expert', 'admin']}>
                    <VerificationQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expert/review-match"
                element={
                  <ProtectedRoute allowedRoles={['expert', 'admin']}>
                    <ReviewMatch />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin/user-approvals"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserApprovals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stats"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminStats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogView />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);
}

export default App;
