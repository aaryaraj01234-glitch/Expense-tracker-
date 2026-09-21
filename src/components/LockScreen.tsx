import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Delete,
  ShieldCheck,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

export const LockScreen: React.FC = () => {
  const { isAppLocked, unlockApp, settings, resetPasswordEmergency } = useExpense();

  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showText, setShowText] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showEmergencyResetModal, setShowEmergencyResetModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAppLocked) {
      setInputVal('');
      setErrorMsg('');
      setShowHint(false);
      // Auto-focus text input if in keyboard mode
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAppLocked, isKeyboardMode]);

  // Handle hardware keyboard typing when in PIN mode
  useEffect(() => {
    if (!isAppLocked || isKeyboardMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setInputVal((prev) => (prev.length < 8 ? prev + e.key : prev));
        setErrorMsg('');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setInputVal((prev) => prev.slice(0, -1));
        setErrorMsg('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputVal('');
        setErrorMsg('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAppLocked, isKeyboardMode, inputVal]);

  if (!isAppLocked) return null;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal || isVerifying) return;

    setIsVerifying(true);
    const success = await unlockApp(inputVal);
    setIsVerifying(false);

    if (!success) {
      setErrorMsg('Incorrect passcode or password. Please try again.');
      triggerShake();
      setInputVal('');
    }
  };

  const handleDigitClick = (digit: string) => {
    setErrorMsg('');
    setInputVal((prev) => {
      const next = prev.length < 8 ? prev + digit : prev;
      return next;
    });
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setInputVal((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setInputVal('');
  };

  return (
    <div
      id="app-lock-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/95 dark:bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 p-7 flex flex-col items-center text-center transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* App Logo & Lock Badge */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-md">
            <Lock className="w-8 h-8 text-white dark:text-neutral-900" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-white">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
          Universal Expense Tracker
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-6">
          App locked for your financial privacy
        </p>

        {/* Input representation */}
        {isKeyboardMode ? (
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                id="lock-password-input"
                type={showText ? 'text' : 'password'}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowText(!showText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputVal || isVerifying}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock'}</span>
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 mb-6 h-8">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = inputVal.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-neutral-900 dark:bg-white scale-110'
                        : 'border-2 border-neutral-300 dark:border-neutral-700'
                    }`}
                  />
                );
              })}
              {inputVal.length > 4 && (
                <span className="text-xs font-semibold text-neutral-400">+{inputVal.length - 4}</span>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mb-4 px-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="w-16 h-14 mx-auto rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="w-16 h-14 mx-auto rounded-2xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center justify-center cursor-pointer"
                title="Clear"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="w-16 h-14 mx-auto rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-semibold text-lg transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="w-16 h-14 mx-auto rounded-2xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title="Delete"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Unlock button */}
            <button
              id="lock-screen-unlock-btn"
              type="button"
              onClick={() => handleSubmit()}
              disabled={!inputVal || isVerifying}
              className="w-full max-w-[260px] py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold text-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mb-3 shadow-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock App'}</span>
            </button>
          </div>
        )}

        {/* Mode Switcher & Hints */}
        <div className="w-full pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => {
              setIsKeyboardMode(!isKeyboardMode);
              setErrorMsg('');
              setInputVal('');
            }}
            className="hover:text-neutral-900 dark:hover:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-700 cursor-pointer"
          >
            {isKeyboardMode ? 'Use PIN Keypad' : 'Enter Text Password'}
          </button>

          <div className="flex items-center gap-2">
            {settings.passwordHint && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Hint</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowEmergencyResetModal(true)}
              className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            >
              Forgot?
            </button>
          </div>
        </div>

        {showHint && settings.passwordHint && (
          <div className="w-full mt-3 p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 text-left">
            <span className="font-semibold">Hint:</span> {settings.passwordHint}
          </div>
        )}
      </div>

      {/* Emergency Reset Confirmation Modal */}
      {showEmergencyResetModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 text-left space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Reset App Password
              </h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              If you have forgotten your password or PIN, you can reset the password protection lock. Your saved transactions, categories, and budgets will remain completely safe.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmergencyResetModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPasswordEmergency();
                  setShowEmergencyResetModal(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Reset & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
