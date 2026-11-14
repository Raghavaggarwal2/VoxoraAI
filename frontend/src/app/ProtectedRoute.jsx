import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import Spinner from '../components/common/Spinner';

/**
 * Route guard requiring an active, unlocked local workspace session.
 * If the workspace is locked or not yet selected, safely redirects to /unlock.
 */
export default function ProtectedRoute({ children }) {
  const { isUnlocked, isLoading } = useWorkspace();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" color="ocean" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          Verifying local workspace state...
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return <Navigate to="/unlock" state={{ from: location }} replace />;
  }

  return children;
}

