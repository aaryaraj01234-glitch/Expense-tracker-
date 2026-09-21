import React from 'react';
import {
  X,
  Download,
  Laptop,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Layers,
  Zap,
  Globe,
  MonitorDown,
  Compass,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ChromeInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeInstallModal: React.FC<ChromeInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isChrome, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        onClose();
      }
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="chrome-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="chrome-install-modal"
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 p-6 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-xs">
              <MonitorDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Install on Google Chrome</span>
                {isInstalled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Installed
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                PWA installation guide for desktop & mobile
              </p>
            </div>
          </div>

          <button
            id="close-chrome-install-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1">
          {/* Quick Install Banner if browser has prompt ready */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 dark:text-neutral-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  Direct One-Click Install Ready
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/10 font-semibold">
                  Chrome Detected
                </span>
              </div>
              <p className="text-xs text-neutral-200 dark:text-neutral-700">
                Google Chrome is ready to install Universal Expense Tracker directly to your desktop or mobile home screen.
              </p>
              <button
                id="chrome-direct-install-btn"
                type="button"
                onClick={handleInstallClick}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Install Now to Chrome</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold">You are running the installed application</p>
                <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                  This app is running in standalone desktop mode with offline caching enabled.
                </p>
              </div>
            </div>
          )}

          {/* Benefits Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <Zap className="w-4 h-4 mx-auto text-amber-500" />
              <div className="text-[11.5px] font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                Offline Ready
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Loads without internet</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <Layers className="w-4 h-4 mx-auto text-blue-500" />
              <div className="text-[11.5px] font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                No Browser Bar
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Full native window</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-center">
              <Laptop className="w-4 h-4 mx-auto text-emerald-500" />
              <div className="text-[11.5px] font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                Dock & Launcher
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Opens like an app</div>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              How to Install on Your Device
            </h4>

            {/* Desktop Chrome */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Laptop className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Google Chrome (Desktop — Mac, Windows, Linux)</span>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 pl-5 list-decimal">
                <li>
                  Look at the right side of Chrome's address bar (URL bar) for the{' '}
                  <strong>Install icon</strong> (a computer monitor with down arrow ⭳).
                </li>
                <li>
                  Or click Chrome's <strong>Three Dots menu (⋮)</strong> at the top-right corner.
                </li>
                <li>
                  Select <strong>"Save and share"</strong> → Click <strong>"Install Universal Expense Tracker"</strong>.
                </li>
                <li>Click <strong>Install</strong> in the dialog to confirm.</li>
              </ol>
            </div>

            {/* Android Chrome */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Smartphone className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Google Chrome (Android Phone / Tablet)</span>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 pl-5 list-decimal">
                <li>Tap the <strong>three dots (⋮)</strong> in the top right of Chrome.</li>
                <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Tap <strong>Install</strong>. The icon will appear on your device home screen!</li>
              </ol>
            </div>

            {/* iOS Safari */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                <Compass className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Safari on iPhone & iPad</span>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 pl-5 list-decimal">
                <li>Tap the <strong>Share button</strong> (square with arrow pointing up) at the bottom.</li>
                <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right.</li>
              </ol>
            </div>
          </div>

          {/* Preview / iFrame Notice */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span>Preview Mode Installation</span>
              </span>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>Open in Full Tab</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              If running inside an embedded preview iframe, Chrome requires opening in a full standalone browser tab before showing the native address bar install icon.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Open in Full Chrome Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
