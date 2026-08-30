import React, { useState } from 'react';
import { Flame, Trophy, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { StreakStats, PracticeRecord } from '../types';
import { useAuth } from '../context/AuthContext';

interface CalendarViewProps {
  stats: StreakStats;
  practices: PracticeRecord[];
  onStartPractice: () => void;
}

export function CalendarView({ stats, practices, onStartPractice }: CalendarViewProps) {
  const { user, openAuthModal } = useAuth();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  const todayStr = new Date().toISOString().split('T')[0];

  const formatDayString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-left">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F27D26]">
          Daily Tracking
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2926] dark:text-[#F5F5F4] tracking-tight font-['Space_Grotesk'] mt-1">
          Daily Speaking Streak & Calendar
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
          One short topic every day. Consistency builds spontaneous English fluency.
        </p>
      </div>

      {/* Streak Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Current Streak */}
        <div className="bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Current Streak
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#FFF5ED] dark:bg-[#F27D26]/20 text-[#F27D26] flex items-center justify-center">
              <Flame className="w-5 h-5 fill-[#F27D26]" />
            </div>
          </div>
          <div>
            <span
              id="current-streak-count"
              className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold text-[#2D2926] dark:text-[#F5F5F4] block tracking-tight"
            >
              {stats.currentStreak}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
              Consecutive active days
            </span>
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Best Streak
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span
              id="best-streak-count"
              className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold text-[#2D2926] dark:text-[#F5F5F4] block tracking-tight"
            >
              {stats.bestStreak}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
              Personal record
            </span>
          </div>
        </div>

        {/* Total Practice Days */}
        <div className="bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Total Days
            </span>
            <div className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span
              id="total-practice-days-count"
              className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold text-[#2D2926] dark:text-[#F5F5F4] block tracking-tight"
            >
              {stats.totalPracticeDays}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block">
              Total practice days
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container Bento Tile */}
      <div className="bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        
        {/* Month Header & Controls */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-stone-800/80">
          <h3 className="font-bold text-xl text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk']">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              id="calendar-prev-month-btn"
              onClick={prevMonth}
              className="p-2 rounded-xl border border-stone-200/60 dark:border-stone-700/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="calendar-next-month-btn"
              onClick={nextMonth}
              className="p-2 rounded-xl border border-stone-200/60 dark:border-stone-700/60 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Names Row */}
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-bold uppercase tracking-wider text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Day Tiles */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {leadingBlanks.map((b) => (
            <div key={`blank-${b}`} className="h-12 sm:h-14 rounded-2xl" />
          ))}

          {daysArray.map((day) => {
            const dateStr = formatDayString(day);
            const isCompleted = stats.practiceDates.includes(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative text-sm font-bold transition-all ${
                  isCompleted
                    ? 'bg-[#F27D26] text-white shadow-md shadow-[#F27D26]/20'
                    : isToday
                    ? 'bg-stone-100 dark:bg-stone-800 text-[#2D2926] dark:text-[#F5F5F4] border-2 border-[#F27D26]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40 border border-stone-100 dark:border-stone-800/60'
                }`}
              >
                <span>{day}</span>
                {isCompleted && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Encouraging footer */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-stone-800/80 flex items-center justify-between flex-wrap gap-3 text-xs">
          <p className="text-stone-500 dark:text-stone-400 font-medium">
            {stats.practiceDates.includes(todayStr)
              ? "Completed today's speaking session! Keep up the momentum."
              : 'You haven’t spoken today yet. One short topic keeps the streak alive.'}
          </p>

          {!stats.practiceDates.includes(todayStr) && (
            <button
              id="calendar-practice-now-btn"
              onClick={onStartPractice}
              className="px-4 py-2 rounded-xl bg-[#F27D26] text-white font-bold hover:bg-[#D96A1C] transition-colors cursor-pointer shadow-xs"
            >
              Practice Now →
            </button>
          )}
        </div>
      </div>

      {/* Guest notice if not signed in */}
      {!user && (
        <div className="bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-5 text-center shadow-xs">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Practicing as guest. <button
              onClick={() => openAuthModal('login')}
              className="font-bold text-[#F27D26] hover:underline cursor-pointer"
            >
              Sign in
            </button> to permanently store and sync your practice history.
          </p>
        </div>
      )}
    </div>
  );
}
