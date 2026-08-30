import React, { useState } from 'react';
import { SlidersHorizontal, RefreshCw, Search, ExternalLink, Sparkles, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Topic, TimerDuration } from '../types';
import { CATEGORIES } from '../data/topics';
import { useAuth } from '../context/AuthContext';

interface TopicGeneratorProps {
  currentTopic: Topic | null;
  selectedCategory: string; // 'All' or TopicCategory
  duration: TimerDuration;
  isGenerating: boolean;
  onSelectCategory: (cat: string) => void;
  onDurationChange: (dur: TimerDuration) => void;
  onGenerate: () => void;
  onOpenVipModal: () => void;
}

export function TopicGenerator({
  currentTopic,
  selectedCategory,
  duration,
  isGenerating,
  onSelectCategory,
  onDurationChange,
  onGenerate,
  onOpenVipModal,
}: TopicGeneratorProps) {
  const { user } = useAuth();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const getGoogleSearchUrl = (query: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  const getWikipediaSearchUrl = (query: string) => {
    return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Bento Card Wrapper */}
      <div className="w-full bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between transition-colors flex-1 min-h-[380px]">
        
        {/* Subtle Orange Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#F27D26]/20">
          <div className="h-full bg-[#F27D26] w-1/3 rounded-r-full" />
        </div>

        {/* Top Header inside Card */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-[#FFF5ED] dark:bg-[#F27D26]/20 border border-[#F27D26]/30 text-[#F27D26] text-xs font-bold uppercase tracking-wider rounded-xl">
              {currentTopic?.category || selectedCategory}
            </span>

            {!user?.isVip && (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800">
                Sample
              </span>
            )}
          </div>

          <button
            id="open-filters-btn"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isFiltersOpen
                ? 'bg-[#F27D26] border-[#F27D26] text-white shadow-xs'
                : 'border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Drawer Overlay */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full overflow-hidden mb-6"
            >
              <div className="bg-stone-50 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-5 text-left">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200/60 dark:border-stone-800">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Topic Category Filter
                  </span>
                  <button
                    id="close-filters-btn"
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    id="filter-category-all"
                    onClick={() => onSelectCategory('All')}
                    className={`px-3 py-2 text-xs font-bold rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-[#F27D26] text-white shadow-xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700/60'
                    }`}
                  >
                    <span>All Topics</span>
                    {selectedCategory === 'All' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => onSelectCategory(cat)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#F27D26] text-white shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200/60 dark:border-stone-700/60'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Topic Headline */}
        <div className="my-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTopic?.id || 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {currentTopic ? (
                <h1
                  id="current-topic-title"
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#2D2926] dark:text-[#F5F5F4] tracking-tight leading-[1.2] font-['Space_Grotesk'] text-left"
                >
                  {currentTopic.title}
                </h1>
              ) : (
                <div className="py-6 text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-400 dark:text-stone-600 font-['Space_Grotesk']">
                    Click "Generate Topic" to start your practice session
                  </h1>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Actions Row: Research Links + Generate Button */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Research Quick Links */}
          {currentTopic ? (
            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Research:
              </span>
              <a
                id="google-search-topic-link"
                href={getGoogleSearchUrl(currentTopic.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-stone-600 dark:text-stone-300 hover:text-[#F27D26] dark:hover:text-[#F27D26] transition-colors"
              >
                <Search className="w-3 h-3" />
                <span>Google</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <a
                id="wiki-search-topic-link"
                href={getWikipediaSearchUrl(currentTopic.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-stone-600 dark:text-stone-300 hover:text-[#F27D26] dark:hover:text-[#F27D26] transition-colors"
              >
                <span>Wikipedia</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          ) : (
            <div className="text-xs text-stone-400">Curated speaking prompts</div>
          )}

          {/* Bold Primary Generate Button */}
          <button
            id="generate-topic-btn"
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#F27D26]/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{currentTopic ? 'Generate Another' : 'Generate Topic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
