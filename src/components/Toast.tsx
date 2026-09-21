import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

export const Toast: React.FC = () => {
  const { toast } = useExpense();

  if (!toast) return null;

  return (
    <div
      id="toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-3"
    >
      {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 shrink-0" />}
      {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 dark:text-sky-600 shrink-0" />}
      <span>{toast.message}</span>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  requireTypingWord?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  requireTypingWord,
}) => {
  const [typedValue, setTypedValue] = React.useState('');

  if (!isOpen) return null;

  const canConfirm = !requireTypingWord || typedValue.trim().toUpperCase() === requireTypingWord.toUpperCase();

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in"
      onClick={onCancel}
    >
      <div
        id="confirm-modal-content"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          <button
            id="close-confirm-modal-btn"
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{description}</p>

        {requireTypingWord && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Type <strong className="font-bold text-neutral-900 dark:text-neutral-100">{requireTypingWord}</strong> to confirm:
            </label>
            <input
              id="confirm-modal-input"
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTypingWord}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              autoFocus
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            id="confirm-modal-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (canConfirm) {
                onConfirm();
                setTypedValue('');
              }
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
