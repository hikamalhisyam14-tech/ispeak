import { Topic, TopicCategory } from '../data/topics';

export type { Topic, TopicCategory };

export interface User {
  id: string;
  email: string;
  displayName: string;
  isVip: boolean;
  vipPurchasedAt?: string;
  vipOrderId?: string;
  createdAt: string;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  topicId?: string;
  topicTitle: string;
  category: string;
  durationSeconds: number;
  completedAt: string;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  totalPracticeDays: number;
  practiceDates: string[];
}

export interface RecentTopic {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  category: string;
  generatedAt: string;
}

export type TimerDuration = 60 | 90 | 120 | 180; // in seconds (1:00, 1:30, 2:00, 3:00)

export type NavTab = 'generator' | 'challenge' | 'calendar' | 'recent' | 'settings';
