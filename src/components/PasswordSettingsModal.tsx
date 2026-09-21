import React, { useState } from 'react';
import { X, Lock, KeyRound, Check, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

interface PasswordSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordSettingsModal: React.FC<PasswordSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, enablePassword, disablePassword, changePassword, updateSettings } = useExpense();

  const isEnabled = Boolean(settings.isPasswordEnabled && settings.passwordHash);

  const [mode, setMode] = useState<'status' | 'setup' | 'change' | 'disable'>('status');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState(settings.passwordHint || '');
  const [autoLockMin, setAutoLockMin] = useState(settings.autoLockMinutes ?? 5);
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleOpenSetup = () => {
    setMode('setup');
    setNewPassword('');
    setConfirmPassword('');
    setHint(settings.passwordHint || '');
    setError('');
  };

  const handleOpenChange = () => {
    setMode('change');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setHint(settings.passwordHint || '');
    setError('');
  };

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Please enter a password or PIN');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    await enablePassword(newPassword, hint, autoLockMin);
    setIsSubmitting(false);
    onClose();
  };

  const handleSaveChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password or PIN');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const success = await changePassword(currentPassword, newPassword, hint);
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setError('Current password is incorrect');
    }
  };

  const handleDisableConfirm = () => {
    disablePassword();
    onClose();
  };

  return (
    <div
      id="password-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="password-settings-modal"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Password & PIN Protection (PWD)
              </h3>
              <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                Secure your transactions and financial budgets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status / Management Overview Mode */}
        {mode === 'status' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Password Protection Status
                </div>
                <div className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                  {isEnabled
                    ? 'Active — PIN/Password required to access tracker'
                    : 'Disabled — App opens without lock screen'}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {isEnabled ? (
              <div className="space-y-3">
                {/* Auto-lock option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Auto-Lock Inactivity Period
                  </label>
                  <select
                    value={autoLockMin}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAutoLockMin(val);
                      updateSettings({ autoLockMinutes: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                  >
                    <option value={0}>Immediately on tab switch or minimize</option>
                    <option value={1}>After 1 minute of inactivity</option>
                    <option value={5}>After 5 minutes of inactivity (Recommended)</option>
                    <option value={15}>After 15 minutes of inactivity</option>
                    <option value={-1}>Manual lock only</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleOpenChange}
                    className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Change Password / PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('disable')}
                    className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Disable Lock
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Protect your sensitive income, salary records, and day-to-day expenditure with a secure PIN (e.g. 4-digit) or full password.
                </p>
                <button
                  id="enable-password-btn"
                  type="button"
                  onClick={handleOpenSetup}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Set Passcode / Password</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Setup New Password Mode */}
        {mode === 'setup' && (
          <form onSubmit={handleSaveSetup} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                New Password or 4-Digit PIN
              </label>
              <div className="relative">
                <input
                  type={showText ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter 4-digit PIN or password"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 pr-9 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowText(!showText)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Confirm Password or PIN
              </label>
              <input
                type={showText ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter to confirm"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password Hint <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g. Favorite number or graduation year"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Auto-Lock Timeout
              </label>
              <select
                value={autoLockMin}
                onChange={(e) => setAutoLockMin(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              >
                <option value={0}>Immediately when minimizing or closing</option>
                <option value={1}>After 1 minute of inactivity</option>
                <option value={5}>After 5 minutes of inactivity</option>
                <option value={15}>After 15 minutes of inactivity</option>
                <option value={-1}>Manual lock only</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('status')}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Activate Password Lock'}
              </button>
            </div>
          </form>
        )}

        {/* Change Password Mode */}
        {mode === 'change' && (
          <form onSubmit={handleSaveChange} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Current Password or PIN
              </label>
              <input
                type={showText ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                New Password or PIN
              </label>
              <input
                type={showText ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Confirm New Password
              </label>
              <input
                type={showText ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Hint <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Password reminder hint"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode('status')}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {/* Disable Confirmation Mode */}
        {mode === 'disable' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Are you sure you want to remove the password lock? Anyone using this browser will be able to view your financial transactions and budgets without entering a PIN.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('status')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisableConfirm}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Disable Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
