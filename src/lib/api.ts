import { User, Topic, StreakStats, PracticeRecord, RecentTopic } from '../types';

const TOKEN_KEY = 'just_speak_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Config
  getConfig() {
    return request<{
      midtransClientKey: string;
      isProduction: boolean;
      isMidtransConfigured: boolean;
      totalTopics: number;
      freeTopicsCount: number;
    }>('/api/config');
  },

  // Auth
  register(data: { email: string; password: string; displayName?: string }) {
    return request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: { email: string; password: string }) {
    return request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  forgotPassword(email: string) {
    return request<{ message: string; resetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(data: { resetToken: string; newPassword: string }) {
    return request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Topics
  getTopics(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<{
      topics: Topic[];
      isVip: boolean;
      totalCount: number;
      availableCount: number;
    }>(`/api/topics${query}`);
  },

  generateTopic(params: { category?: string; lastTopicId?: string }) {
    return request<{
      topic: Topic;
      isVip: boolean;
      poolSize: number;
    }>('/api/topics/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getRecentTopics() {
    return request<{ recentTopics: RecentTopic[] }>('/api/recent-topics');
  },

  // Practice & Streak
  getPracticeStats() {
    return request<{
      stats: StreakStats;
      practices: PracticeRecord[];
    }>('/api/practice/stats');
  },

  completePractice(data: {
    topicId?: string;
    topicTitle: string;
    category: string;
    durationSeconds: number;
  }) {
    return request<{
      success: boolean;
      record: PracticeRecord;
      stats: StreakStats;
    }>('/api/practice/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Midtrans Payments
  createPayment() {
    return request<{
      orderId: string;
      snapToken: string;
      redirectUrl: string;
      isSimulated: boolean;
      alreadyVip?: boolean;
      message?: string;
    }>('/api/payment/create', {
      method: 'POST',
    });
  },

  verifyPayment(orderId: string) {
    return request<{
      success: boolean;
      status: string;
      isVip: boolean;
      user?: User;
    }>('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
};
