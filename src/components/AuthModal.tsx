import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'submit'>('request');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else if (authModalMode === 'register') {
        await register(email, password, displayName);
      } else if (authModalMode === 'forgot') {
        if (resetStep === 'request') {
          const res = await api.forgotPassword(email);
          setInfoMessage(res.message);
          if (res.resetToken) {
            setResetToken(res.resetToken);
            setResetStep('submit');
          }
        } else {
          const res = await api.resetPassword({ resetToken, newPassword });
          setInfoMessage(res.message);
          setTimeout(() => {
            openAuthModal('login');
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F27D26]">
            Just Speak Account
          </span>
          <h3 className="text-2xl font-bold text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk'] mt-0.5">
            {authModalMode === 'login'
              ? 'Sign in to your account'
              : authModalMode === 'register'
              ? 'Create your account'
              : 'Reset your password'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {authModalMode === 'login'
              ? 'Access your practice history, streaks & VIP status.'
              : authModalMode === 'register'
              ? 'Start tracking your daily speaking practice.'
              : 'Enter your email to reset your account password.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider text-[11px]">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-displayname-input"
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-sm text-[#2D2926] dark:text-stone-100 focus:outline-none focus:border-[#F27D26] transition-colors"
                />
              </div>
            </div>
          )}

          {authModalMode !== 'forgot' || resetStep === 'request' ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider text-[11px]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-sm text-[#2D2926] dark:text-stone-100 focus:outline-none focus:border-[#F27D26] transition-colors"
                />
              </div>
            </div>
          ) : null}

          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                  Password
                </label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    id="auth-forgot-password-link"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] font-semibold text-[#F27D26] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-sm text-[#2D2926] dark:text-stone-100 focus:outline-none focus:border-[#F27D26] transition-colors"
                />
              </div>
            </div>
          )}

          {authModalMode === 'forgot' && resetStep === 'submit' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    id="auth-reset-token-input"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-sm text-[#2D2926] dark:text-stone-100 focus:outline-none focus:border-[#F27D26] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    id="auth-new-password-input"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-sm text-[#2D2926] dark:text-stone-100 focus:outline-none focus:border-[#F27D26]"
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div id="auth-error-msg" className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {infoMessage && (
            <div id="auth-info-msg" className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs">
              {infoMessage}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-sm font-bold shadow-lg shadow-[#F27D26]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            <span>
              {isLoading
                ? 'Please wait...'
                : authModalMode === 'login'
                ? 'Sign In'
                : authModalMode === 'register'
                ? 'Create Account'
                : resetStep === 'request'
                ? 'Send Reset Link'
                : 'Update Password'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Mode Switcher Footer */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-stone-800/80 text-center text-xs text-stone-500 dark:text-stone-400">
          {authModalMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                id="switch-to-register-btn"
                onClick={() => openAuthModal('register')}
                className="font-bold text-[#F27D26] hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                id="switch-to-login-btn"
                onClick={() => openAuthModal('login')}
                className="font-bold text-[#F27D26] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
