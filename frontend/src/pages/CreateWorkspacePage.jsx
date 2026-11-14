import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  FolderLock,
  User,
  Mail,
  AlertCircle,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import FormField from '../components/common/FormField';
import Input from '../components/common/Input';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import PrivacyNotice from '../components/common/PrivacyNotice';
import SetupRecoveryStep from '../components/workspace/SetupRecoveryStep';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Screen 3 — Create Workspace
 * Form for setting up a local, encrypted workspace with client-side validation,
 * cryptographic key derivation, envelope wrapping, and BIP-39 recovery phrase setup.
 */
export default function CreateWorkspacePage() {
  const navigate = useNavigate();
  const { createWorkspace } = useWorkspace();

  // Form states
  const [formData, setFormData] = useState({
    workspaceName: 'My Voxora',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.form) {
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace Name is required';
    } else if (formData.workspaceName.trim().length < 2) {
      newErrors.workspaceName = 'Workspace Name must be at least 2 characters';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display Name is required';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address (or leave empty)';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required to encrypt your workspace';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await createWorkspace({
        workspaceName: formData.workspaceName,
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
      });

      // Transition to Recovery Key display step
      setCreatedResult(result);
    } catch (err) {
      setErrors({ form: err.message || 'Failed to create local workspace.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecoveryConfirmation = () => {
    // Navigate to unlocked dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 transition-colors duration-150">
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link
          to="/get-started"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selection
        </Link>
        <Logo size="sm" showText={false} />
      </div>

      {/* Main Grid: Left Trust Checklist + Right Form */}
      <main className="w-full max-w-5xl mx-auto my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Visual Emblem & Trust Guarantees */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-6 pt-2">
            <div>
              <div className="mb-6">
                <Logo size="md" />
              </div>

              {/* Security Emblem Graphic */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-ocean-50/70 dark:bg-navy-800 border border-ocean-100 dark:border-navy-700 flex items-center justify-center text-ocean-600 dark:text-ocean-400 shadow-sm mb-6">
                <Shield className="w-12 h-12" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display mb-2">
                Private &amp; Self-Contained
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Voxora keeps your data safely on your computer. All cryptographic keys are derived locally using PBKDF2-HMAC-SHA-256 (600,000 iterations) with envelope encryption.
              </p>

              {/* Trust Checklist */}
              <PrivacyNotice variant="checklist" className="mb-6" />
            </div>

            {/* Permanent Loss Warning */}
            <PrivacyNotice variant="warning" />
          </div>

          {/* Right Column: Creation Form or Recovery Key Setup */}
          <div className="md:col-span-7 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 sm:p-8 shadow-sm">
            {!createdResult ? (
              <>
                <div className="space-y-1 mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
                    Create Your Workspace
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    A local, encrypted workspace on your device.
                  </p>
                </div>

                {errors.form && (
                  <div className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errors.form}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Workspace Name */}
                  <FormField
                    label="Workspace Name"
                    id="workspace-name"
                    required
                    error={errors.workspaceName}
                  >
                    <Input
                      id="workspace-name"
                      placeholder="My Voxora"
                      value={formData.workspaceName}
                      onChange={(e) => handleChange('workspaceName', e.target.value)}
                      error={Boolean(errors.workspaceName)}
                      leftIcon={<FolderLock className="w-4 h-4" />}
                    />
                  </FormField>

                  {/* Display Name */}
                  <FormField
                    label="Display Name"
                    id="display-name"
                    required
                    error={errors.displayName}
                  >
                    <Input
                      id="display-name"
                      placeholder="e.g. Raghav"
                      value={formData.displayName}
                      onChange={(e) => handleChange('displayName', e.target.value)}
                      error={Boolean(errors.displayName)}
                      leftIcon={<User className="w-4 h-4" />}
                    />
                  </FormField>

                  {/* Email Address (Optional) */}
                  <FormField
                    label="Email (Optional)"
                    id="email"
                    error={errors.email}
                    helperText="Used only for local identification — encrypted at rest and never shared."
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="raghav@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      error={Boolean(errors.email)}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                  </FormField>

                  {/* Password */}
                  <FormField
                    label="Password"
                    id="password"
                    required
                    error={errors.password}
                    helperText="Minimum 8 characters. Derives your AES-256-GCM master key encryption envelope."
                  >
                    <PasswordInput
                      id="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      error={Boolean(errors.password)}
                    />
                  </FormField>

                  {/* Confirm Password */}
                  <FormField
                    label="Confirm Password"
                    id="confirm-password"
                    required
                    error={errors.confirmPassword}
                  >
                    <PasswordInput
                      id="confirm-password"
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      error={Boolean(errors.confirmPassword)}
                    />
                  </FormField>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      className="w-full text-base"
                    >
                      {isSubmitting ? 'Deriving Keys & Encrypting...' : 'Create Workspace'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: Recovery Key Display & Safeguard Confirmation */
              <SetupRecoveryStep
                recoveryKey={createdResult.recoveryKey}
                workspaceName={createdResult.workspace.workspaceName}
                onComplete={handleRecoveryConfirmation}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer minimal info */}
      <div className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Voxora AI &bull; End-to-end client-side privacy architecture
      </div>
    </div>
  );
}
