import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="py-20 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-12 h-12 mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-white">404</h1>
          <h2 className="font-sans font-semibold text-base text-slate-800 dark:text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The requested page does not exist or the active analysis job could not be found.
          </p>
        </div>
        <div>
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Ingestion
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
