import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-neutral-900/90 text-white dark:bg-white/90 dark:text-neutral-900 px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs border border-neutral-700 dark:border-neutral-200 animate-in slide-in-from-bottom-2"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
      <span>Offline Mode — Using local cached data</span>
    </div>
  );
};
