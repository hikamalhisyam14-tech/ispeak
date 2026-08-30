import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TopicGenerator } from './components/TopicGenerator';
import { SpeakingTimer } from './components/SpeakingTimer';
import { CalendarView } from './components/CalendarView';
import { RecentTopicsView } from './components/RecentTopicsView';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { VipModal } from './components/VipModal';
import { SandboxPaymentPage } from './components/SandboxPaymentPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Topic, TimerDuration, NavTab, StreakStats, PracticeRecord } from './types';
import { api } from './lib/api';
import { Zap, Flame, Sparkles } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<NavTab>('generator');
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Topic & Generator State
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [duration, setDuration] = useState<TimerDuration>(60);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Practice & Streak Stats
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalPracticeDays: 0,
    practiceDates: [],
  });
  const [practiceHistory, setPracticeHistory] = useState<PracticeRecord[]>([]);

  // Check if current URL is the sandbox checkout page
  const searchParams = new URLSearchParams(window.location.search);
  const isSandboxCheckoutPath =
    window.location.pathname === '/payment/sandbox-checkout' ||
    Boolean(searchParams.get('order_id') && searchParams.get('token'));

  if (isSandboxCheckoutPath) {
    const orderId = searchParams.get('order_id') || 'JS-VIP-TEST-ORDER';
    return <SandboxPaymentPage orderId={orderId} />;
  }

  // Load initial practice stats
  const loadStats = useCallback(async () => {
    if (!user) {
      setStreakStats({
        currentStreak: 0,
        bestStreak: 0,
        totalPracticeDays: 0,
        practiceDates: [],
      });
      return;
    }

    try {
      const res = await api.getPracticeStats();
      setStreakStats(res.stats);
      setPracticeHistory(res.practices);
    } catch (err) {
      console.error('Failed to load practice stats:', err);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Generate Topic Handler
  const handleGenerate = async (forcedCategory?: string) => {
    setIsGenerating(true);
    const cat = forcedCategory || selectedCategory;

    try {
      const res = await api.generateTopic({
        category: cat,
        lastTopicId: currentTopic?.id,
      });
      setCurrentTopic(res.topic);
    } catch (err) {
      console.error('Generate topic error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initial topic generation on mount
  useEffect(() => {
    if (!currentTopic) {
      handleGenerate();
    }
  }, []);

  // Complete Practice Session Handler
  const handleCompleteSession = async (durationSeconds: number) => {
    if (!currentTopic) return;

    try {
      const res = await api.completePractice({
        topicId: currentTopic.id,
        topicTitle: currentTopic.title,
        category: currentTopic.category,
        durationSeconds,
      });

      if (res.stats) {
        setStreakStats(res.stats);
      }
      loadStats();
    } catch (err) {
      console.warn('Practice logged locally, sign in to sync:', err);
      // Fallback local visual update
      const today = new Date().toISOString().split('T')[0];
      if (!streakStats.practiceDates.includes(today)) {
        setStreakStats((prev) => ({
          ...prev,
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
          totalPracticeDays: prev.totalPracticeDays + 1,
          practiceDates: [...prev.practiceDates, today],
        }));
      }
    }
  };

  // Switch to Challenge Mode
  const handleStartChallengeMode = () => {
    setSelectedCategory('Challenge');
    setActiveTab('generator');
    handleGenerate('Challenge');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#181513] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-orange-500/20 selection:text-orange-600">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-start">
        
        {/* VIEW 1: PRACTICE / GENERATOR */}
        {activeTab === 'generator' && (
          <div className="w-full space-y-7 animate-in fade-in duration-150">
            {/* Topic Generator */}
            <TopicGenerator
              currentTopic={currentTopic}
              selectedCategory={selectedCategory}
              duration={duration}
              isGenerating={isGenerating}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                handleGenerate(cat);
              }}
              onDurationChange={setDuration}
              onGenerate={() => handleGenerate()}
              onOpenVipModal={() => setIsVipModalOpen(true)}
            />

            {/* Speaking Timer Directly Connected */}
            <SpeakingTimer
              duration={duration}
              onDurationChange={setDuration}
              onCompleteSession={handleCompleteSession}
              isCompletedToday={streakStats.practiceDates.includes(
                new Date().toISOString().split('T')[0]
              )}
              disabled={!currentTopic}
            />
          </div>
        )}

        {/* VIEW 2: CHALLENGE MODE */}
        {activeTab === 'challenge' && (
          <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-['Space_Grotesk']">
                Challenge Mode
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                Spontaneous, personal, or uncomfortable speaking prompts designed to test your confidence.
              </p>
            </div>

            <div className="bg-white dark:bg-[#201C19] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs text-center space-y-5">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                1 topic • 1 minute • No filters • Pure spontaneous speech
              </p>
              <button
                id="start-instant-challenge-btn"
                onClick={handleStartChallengeMode}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Launch Challenge Topic</span>
              </button>
            </div>

            {/* Speaking Tips */}
            <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl p-5 text-left space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <h4 className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[11px]">
                How to approach speaking:
              </h4>
              <p>1. Take 30 seconds to gather your thoughts or look up terms you don't know.</p>
              <p>2. Start the timer and speak continuously until it hits zero.</p>
              <p>3. Focus on smooth pacing rather than complex vocabulary.</p>
            </div>
          </div>
        )}

        {/* VIEW 3: CALENDAR & STREAK */}
        {activeTab === 'calendar' && (
          <div className="w-full animate-in fade-in duration-150">
            <CalendarView
              stats={streakStats}
              practices={practiceHistory}
              onStartPractice={() => setActiveTab('generator')}
            />
          </div>
        )}

        {/* VIEW 4: RECENT TOPICS (ACCOUNT ISOLATED) */}
        {activeTab === 'recent' && (
          <div className="w-full animate-in fade-in duration-150">
            <RecentTopicsView
              onSelectTopicToPractice={(topic) => {
                if (topic.id && topic.title && topic.category) {
                  setCurrentTopic({
                    id: topic.id,
                    title: topic.title,
                    category: topic.category,
                    isFree: true,
                  });
                  setSelectedCategory(topic.category);
                  setActiveTab('generator');
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
      />
      <VipModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
