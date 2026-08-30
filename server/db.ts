import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  isVip: boolean;
  vipPurchasedAt?: string;
  vipOrderId?: string;
  createdAt: string;
  resetToken?: string;
  resetTokenExpires?: number;
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

export interface RecentTopicRecord {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  category: string;
  generatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  orderId: string;
  grossAmount: number;
  status: 'pending' | 'settlement' | 'capture' | 'deny' | 'cancel' | 'expire';
  snapToken?: string;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  practices: PracticeRecord[];
  recentTopics: RecentTopicRecord[];
  payments: PaymentRecord[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'just_speak_db.json');

// Ensure DB directory and file exist
function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      practices: [],
      recentTopics: [],
      payments: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse database file, re-initializing:', err);
    const initialData: DatabaseSchema = {
      users: [],
      practices: [],
      recentTopics: [],
      payments: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

let dbCache: DatabaseSchema = initDb();

function saveDb() {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export const db = {
  // USER OPERATIONS
  findUserByEmail(email: string): UserRecord | undefined {
    return dbCache.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  findUserById(id: string): UserRecord | undefined {
    return dbCache.users.find((u) => u.id === id);
  },

  findUserByResetToken(token: string): UserRecord | undefined {
    const now = Date.now();
    return dbCache.users.find(
      (u) => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > now
    );
  },

  createUser(user: UserRecord): UserRecord {
    dbCache.users.push(user);
    saveDb();
    return user;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const index = dbCache.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    dbCache.users[index] = { ...dbCache.users[index], ...updates };
    saveDb();
    return dbCache.users[index];
  },

  // PRACTICE OPERATIONS
  getPracticesByUser(userId: string): PracticeRecord[] {
    return dbCache.practices.filter((p) => p.userId === userId);
  },

  addPractice(record: PracticeRecord): PracticeRecord {
    dbCache.practices.push(record);
    saveDb();
    return record;
  },

  // RECENT TOPICS OPERATIONS (STRICTLY ISOLATED PER USER ACCOUNT)
  getRecentTopicsByUser(userId: string, limit = 20): RecentTopicRecord[] {
    return dbCache.recentTopics
      .filter((rt) => rt.userId === userId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, limit);
  },

  addRecentTopic(record: RecentTopicRecord): RecentTopicRecord {
    // Keep max 50 recent topics per user
    dbCache.recentTopics.unshift(record);
    const userTopics = dbCache.recentTopics.filter((rt) => rt.userId === record.userId);
    if (userTopics.length > 50) {
      const oldest = userTopics[userTopics.length - 1];
      dbCache.recentTopics = dbCache.recentTopics.filter((rt) => rt.id !== oldest.id);
    }
    saveDb();
    return record;
  },

  // PAYMENT OPERATIONS
  getPaymentByOrderId(orderId: string): PaymentRecord | undefined {
    return dbCache.payments.find((p) => p.orderId === orderId);
  },

  getPaymentsByUser(userId: string): PaymentRecord[] {
    return dbCache.payments.filter((p) => p.userId === userId);
  },

  createPayment(payment: PaymentRecord): PaymentRecord {
    dbCache.payments.push(payment);
    saveDb();
    return payment;
  },

  updatePayment(orderId: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const index = dbCache.payments.findIndex((p) => p.orderId === orderId);
    if (index === -1) return undefined;
    dbCache.payments[index] = { ...dbCache.payments[index], ...updates, updatedAt: new Date().toISOString() };
    saveDb();
    return dbCache.payments[index];
  },
};
