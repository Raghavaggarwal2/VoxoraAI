import React, { useState } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import FormField from '../common/FormField';
import PasswordInput from '../common/PasswordInput';
import Button from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';

/**
 * Modal dialog for changing workspace password securely.
 * Rewraps the master key with a newly derived KEK without re-encrypting existing database records.
 */
export default function PasswordChangeModal({ isOpen, onClose }) {
  const { changePassword } = useWorkspace();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Enter current password';
    }
    if (!newPassword || newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters long';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to change password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
              Change Workspace Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Derives a fresh key envelope for your workspace master key.
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Password successfully updated!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400">
                {errors.form}
              </div>
            )}

            <FormField label="Current Password" id="curr-pass" error={errors.currentPassword} required>
              <PasswordInput
                id="curr-pass"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={Boolean(errors.currentPassword)}
              />
            </FormField>

            <FormField label="New Password" id="new-pass" error={errors.newPassword} required helperText="Minimum 8 characters">
              <PasswordInput
                id="new-pass"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={Boolean(errors.newPassword)}
              />
            </FormField>

            <FormField label="Confirm New Password" id="confirm-new-pass" error={errors.confirmPassword} required>
              <PasswordInput
                id="confirm-new-pass"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={Boolean(errors.confirmPassword)}
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

