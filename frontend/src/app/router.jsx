import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import ProtectedRoute from './ProtectedRoute';
import Spinner from '../components/common/Spinner';

// Phase 1 & 2 Pages (Public Landing & Workspace Onboarding)
const LandingPage = lazy(() => import('../pages/LandingPage'));
const WorkspaceSelectPage = lazy(() => import('../pages/WorkspaceSelectPage'));
const CreateWorkspacePage = lazy(() => import('../pages/CreateWorkspacePage'));
const UnlockWorkspacePage = lazy(() => import('../pages/UnlockWorkspacePage'));

// Phase 3 Authenticated Pages (Dashboard & Data Management)
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const NewAnalysisPage = lazy(() => import('../pages/NewAnalysisPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const SavedPage = lazy(() => import('../pages/SavedPage'));
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Preserved Multimedia Intelligence Workspace & Fallback
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" color="ocean" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Loading Voxora workspace...
          </p>
        </div>
      }
    >
      <Routes>
        {/* Public Landing & Onboarding Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<WorkspaceSelectPage />} />
        <Route path="/create-workspace" element={<CreateWorkspacePage />} />
        <Route path="/unlock" element={<UnlockWorkspacePage />} />

        {/* Authenticated Workspace Pages (Protected by ProtectedRoute) */}
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/new-analysis" element={<NewAnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/workspace/:jobId" element={<WorkspacePage />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
