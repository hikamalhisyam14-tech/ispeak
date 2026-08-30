import React from 'react';
import { Sparkles, Flame, Calendar as CalendarIcon, History, Settings, Sun, Moon, User as UserIcon, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NavTab } from '../types';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenVipModal: () => void;
  onOpenSettingsModal: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenVipModal,
  onOpenSettingsModal,
}: NavbarProps) {
  const { user, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-100 dark:border-stone-800/80 bg-white/90 dark:bg-[#1A1817]/90 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Name */}
        <div className="flex items-center gap-8">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 bg-[#F27D26] rounded-lg flex items-center justify-center shadow-xs group-hover:bg-[#D96A1C] transition-colors">
              <div className="w-3.5 h-3.5 bg-white rounded-xs"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk']">
              JUST SPEAK
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100/70 dark:bg-stone-800/60 p-1 rounded-xl">
            <button
              id="nav-tab-generator"
              onClick={() => setActiveTab('generator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-white dark:bg-[#2A2624] text-[#F27D26] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Practice
            </button>
            <button
              id="nav-tab-challenge"
              onClick={() => setActiveTab('challenge')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'challenge'
                  ? 'bg-white dark:bg-[#2A2624] text-[#F27D26] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Challenge
            </button>
            <button
              id="nav-tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-[#2A2624] text-[#F27D26] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              id="nav-tab-recent"
              onClick={() => setActiveTab('recent')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-[#2A2624] text-[#F27D26] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Recent
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* VIP status / Upgrade button */}
          {user?.isVip ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FFF5ED] dark:bg-[#F27D26]/20 border border-[#F27D26] text-[#F27D26] text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-xs">
              <Crown className="w-3 h-3 fill-[#F27D26]" />
              VIP Member
            </div>
          ) : (
            <button
              id="unlock-vip-btn-nav"
              onClick={onOpenVipModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-xs font-bold tracking-tight shadow-sm shadow-[#F27D26]/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlock VIP</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-600" />
            )}
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <button
              id="account-btn"
              onClick={onOpenSettingsModal}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600 transition-colors text-sm font-medium cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#FFF5ED] dark:bg-stone-700 text-[#F27D26] dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              <span className="hidden sm:inline max-w-[110px] truncate text-xs font-semibold">{user.displayName}</span>
              <Settings className="w-3.5 h-3.5 text-stone-400" />
            </button>
          ) : (
            <button
              id="sign-in-btn"
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-bold tracking-wide transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="flex md:hidden border-t border-gray-100 dark:border-stone-800/80 px-3 py-2 justify-around bg-white dark:bg-[#1A1817]">
        <button
          id="mobile-nav-generator"
          onClick={() => setActiveTab('generator')}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
            activeTab === 'generator'
              ? 'bg-[#FFF5ED] dark:bg-stone-800 text-[#F27D26]'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          Practice
        </button>
        <button
          id="mobile-nav-challenge"
          onClick={() => setActiveTab('challenge')}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
            activeTab === 'challenge'
              ? 'bg-[#FFF5ED] dark:bg-stone-800 text-[#F27D26]'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          Challenge
        </button>
        <button
          id="mobile-nav-calendar"
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
            activeTab === 'calendar'
              ? 'bg-[#FFF5ED] dark:bg-stone-800 text-[#F27D26]'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <CalendarIcon className="w-3 h-3" />
          Calendar
        </button>
        <button
          id="mobile-nav-recent"
          onClick={() => setActiveTab('recent')}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
            activeTab === 'recent'
              ? 'bg-[#FFF5ED] dark:bg-stone-800 text-[#F27D26]'
              : 'text-stone-500 dark:text-stone-400'
          }`}
        >
          <History className="w-3 h-3" />
          Recent
        </button>
      </div>
    </header>
  );
}
