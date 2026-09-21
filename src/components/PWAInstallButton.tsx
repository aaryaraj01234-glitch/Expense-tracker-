import React, { useState } from 'react';
import { Download, MonitorDown, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ChromeInstallModal } from './ChromeInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'header';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') return;
    }
    // Otherwise open the Chrome installation guide modal
    setShowModal(true);
  };

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">App Installed on Chrome (Standalone Mode)</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          id="header-chrome-install-btn"
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${className}`}
          title="Install Universal Expense Tracker on Google Chrome / PWA"
        >
          <MonitorDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          id="compact-chrome-install-btn"
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>Install</span>
        </button>
      )}

      {variant === 'full' && (
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
                <MonitorDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Google Chrome & PWA App Installation
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Install this tracker as a standalone application with offline support and desktop launching.
                </p>
              </div>
            </div>
            <button
              id="settings-install-chrome-btn"
              type="button"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Install to Chrome' : 'Installation Guide'}</span>
            </button>
          </div>
        </div>
      )}

      <ChromeInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
