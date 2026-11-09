import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Spinner from '../components/common/Spinner';

const HomePage = lazy(() => import('../pages/HomePage'));
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" color="ocean" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Loading Voxora workspace...
          </p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="workspace/:jobId" element={<WorkspacePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
