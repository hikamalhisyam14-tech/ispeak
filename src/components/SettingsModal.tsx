import React from 'react';
import { X, Sun, Moon, LogOut, Crown, User as UserIcon, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVipModal: () => void;
}

export function SettingsModal({ isOpen, onClose, onOpenVipModal }: SettingsModalProps) {
  const { user, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Close Button */}
        <button
          id="close-settings-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F27D26]">
            Preferences
          </span>
          <h3 className="text-2xl font-bold text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk'] mt-0.5">
            Settings & Account
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage your interface theme and account status.
          </p>
        </div>

        <div className="space-y-4">
          
          {/* Theme Selector */}
          <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5 text-[11px]">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="theme-select-light"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-[#2D2926] shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:bg-stone-200/40 dark:hover:bg-stone-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                id="theme-select-dark"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1A1817] text-white shadow-xs border border-stone-700'
                    : 'text-stone-500 hover:bg-stone-200/40 dark:hover:bg-stone-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Account Details */}
          {user ? (
            <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 text-[11px]">
                  Account Details
                </label>
                {user.isVip ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-[#FFF5ED] dark:bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/30">
                    <Crown className="w-3 h-3 fill-current" />
                    VIP
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">
                    Free Tier
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-200/60 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400">Name</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{user.displayName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200/60 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400">Email</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[180px]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-stone-500 dark:text-stone-400">Member since</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!user.isVip && (
                <button
                  id="settings-upgrade-vip-btn"
                  onClick={() => {
                    onClose();
                    onOpenVipModal();
                  }}
                  className="w-full mt-2 py-3 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#F27D26]/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Unlock VIP (One-Time)</span>
                </button>
              )}

              <button
                id="logout-btn"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4 text-center space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                You are practicing as a guest. Sign in to permanently save your streak and recent topics.
              </p>
              <button
                id="settings-sign-in-btn"
                onClick={() => {
                  onClose();
                  openAuthModal('login');
                }}
                className="w-full py-3 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-xs font-bold shadow-lg shadow-[#F27D26]/20 transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
