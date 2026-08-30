import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, UserRecord } from './server/db';
import { authService, requireAuth, optionalAuth, AuthenticatedRequest } from './server/auth';
import { midtransService } from './server/midtrans';
import { TOPICS, CATEGORIES, TopicCategory, Topic } from './src/data/topics';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // ----------------------------------------------------
  // HEALTH CHECK
  // ----------------------------------------------------
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // PUBLIC CONFIG
  // ----------------------------------------------------
  app.get('/api/config', (req: Request, res: Response) => {
    res.json({
      midtransClientKey: midtransService.getClientKey(),
      isProduction: midtransService.isProduction(),
      isMidtransConfigured: midtransService.isConfigured(),
      totalTopics: TOPICS.length,
      freeTopicsCount: TOPICS.filter((t) => t.isFree).length,
    });
  });

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, displayName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await authService.hashPassword(password);
      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        email: email.trim().toLowerCase(),
        passwordHash,
        displayName: (displayName && displayName.trim()) || email.split('@')[0],
        isVip: false,
        createdAt: new Date().toISOString(),
      };

      db.createUser(newUser);
      const token = authService.generateToken(newUser);

      res.status(201).json({
        token,
        user: authService.sanitizeUser(newUser),
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Account not found. Please check your email or register.' });
      }

      const isMatch = await authService.comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }

      const token = authService.generateToken(user);

      res.json({
        token,
        user: authService.sanitizeUser(user),
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Failed to sign in.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    // Return latest user record from DB
    const freshUser = db.findUserById(req.user!.id);
    if (!freshUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: authService.sanitizeUser(freshUser) });
  });

  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Please enter your email.' });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        // Return friendly message even if email not found for safety
        return res.json({
          message: 'If an account exists with this email, a password reset link has been prepared.',
        });
      }

      const resetToken = crypto.randomBytes(24).toString('hex');
      const resetTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour

      db.updateUser(user.id, { resetToken, resetTokenExpires });

      res.json({
        message: 'Password reset code generated.',
        resetToken, // Provided for direct verification in secure UI
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Could not process request.' });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = db.findUserByResetToken(resetToken);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired password reset link.' });
      }

      const passwordHash = await authService.hashPassword(newPassword);
      db.updateUser(user.id, {
        passwordHash,
        resetToken: undefined,
        resetTokenExpires: undefined,
      });

      res.json({ message: 'Password has been successfully updated. You can now log in.' });
    } catch (err: any) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  });

  // ----------------------------------------------------
  // TOPICS & GENERATOR ROUTES
  // ----------------------------------------------------
  app.get('/api/topics', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const isVip = req.user?.isVip || false;
    const category = req.query.category as string | undefined;

    let available = isVip ? TOPICS : TOPICS.filter((t) => t.isFree);

    if (category && category !== 'All') {
      available = available.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    res.json({
      topics: available,
      isVip,
      totalCount: TOPICS.length,
      availableCount: available.length,
    });
  });

  app.post('/api/topics/generate', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const isVip = req.user?.isVip || false;
    const category = req.body.category as string | undefined;
    const lastTopicId = req.body.lastTopicId as string | undefined;

    let pool = isVip ? TOPICS : TOPICS.filter((t) => t.isFree);

    if (category && category !== 'All') {
      pool = pool.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    if (pool.length === 0) {
      // Fallback
      pool = isVip ? TOPICS : TOPICS.filter((t) => t.isFree);
    }

    // Pick random different topic if possible
    let filteredPool = pool.filter((t) => t.id !== lastTopicId);
    if (filteredPool.length === 0) filteredPool = pool;

    const randomIndex = Math.floor(Math.random() * filteredPool.length);
    const chosenTopic = filteredPool[randomIndex];

    // If user is authenticated, save to their account's recent topics
    if (req.user) {
      db.addRecentTopic({
        id: `rt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: req.user.id,
        topicId: chosenTopic.id,
        topicTitle: chosenTopic.title,
        category: chosenTopic.category,
        generatedAt: new Date().toISOString(),
      });
    }

    res.json({
      topic: chosenTopic,
      isVip,
      poolSize: pool.length,
    });
  });

  // ----------------------------------------------------
  // RECENT TOPICS ROUTE (ACCOUNT-SPECIFIC)
  // ----------------------------------------------------
  app.get('/api/recent-topics', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const recent = db.getRecentTopicsByUser(req.user!.id, 25);
    res.json({ recentTopics: recent });
  });

  // ----------------------------------------------------
  // PRACTICE & STREAK / CALENDAR ROUTES
  // ----------------------------------------------------
  function calculateStreakStats(practices: ReturnType<typeof db.getPracticesByUser>) {
    // Unique practice dates sorted ascending
    const uniqueDates = Array.from(new Set(practices.map((p) => p.date))).sort();

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, bestStreak: 0, totalPracticeDays: 0, practiceDates: [] };
    }

    // Get today's and yesterday's YYYY-MM-DD in local time
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Compute best streak
    let bestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    // Compute current streak
    let currentStreak = 0;
    const hasPracticedToday = uniqueDates.includes(today);
    const hasPracticedYesterday = uniqueDates.includes(yesterday);

    if (hasPracticedToday || hasPracticedYesterday) {
      currentStreak = 1;
      let checkDate = new Date(hasPracticedToday ? today : yesterday);

      for (let i = uniqueDates.length - (hasPracticedToday ? 2 : 2); i >= 0; i--) {
        const prevExpected = new Date(checkDate);
        prevExpected.setDate(prevExpected.getDate() - 1);
        const prevExpectedStr = prevExpected.toISOString().split('T')[0];

        if (uniqueDates.includes(prevExpectedStr)) {
          currentStreak++;
          checkDate = prevExpected;
        } else {
          break;
        }
      }
    }

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    return {
      currentStreak,
      bestStreak,
      totalPracticeDays: uniqueDates.length,
      practiceDates: uniqueDates,
    };
  }

  app.get('/api/practice/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const practices = db.getPracticesByUser(req.user!.id);
    const stats = calculateStreakStats(practices);
    res.json({
      stats,
      practices: practices.slice(-30), // latest 30 practices
    });
  });

  app.post('/api/practice/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { topicId, topicTitle, category, durationSeconds } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const record = {
        id: `prc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: req.user!.id,
        date: today,
        topicId: topicId || 'custom',
        topicTitle: topicTitle || 'Spontaneous Speaking Practice',
        category: category || 'Speaking',
        durationSeconds: Number(durationSeconds) || 60,
        completedAt: new Date().toISOString(),
      };

      db.addPractice(record);

      const practices = db.getPracticesByUser(req.user!.id);
      const stats = calculateStreakStats(practices);

      res.json({
        success: true,
        record,
        stats,
      });
    } catch (err: any) {
      console.error('Practice complete error:', err);
      res.status(500).json({ error: 'Failed to record practice session.' });
    }
  });

  // ----------------------------------------------------
  // MIDTRANS PAYMENT ROUTES
  // ----------------------------------------------------
  app.post('/api/payment/create', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = db.findUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.isVip) {
        return res.json({
          alreadyVip: true,
          message: 'Your account already has Lifetime VIP access!',
        });
      }

      const result = await midtransService.createTransaction({
        user,
        amount: 99000, // 99,000 IDR (approx $6.50 one-time)
      });

      res.json(result);
    } catch (err: any) {
      console.error('Payment creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to initiate Midtrans payment.' });
    }
  });

  app.post('/api/payment/verify', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required.' });
      }

      const result = await midtransService.verifyAndSettlePayment(orderId);
      const updatedUser = db.findUserById(req.user!.id);

      res.json({
        ...result,
        user: updatedUser ? authService.sanitizeUser(updatedUser) : undefined,
      });
    } catch (err: any) {
      console.error('Payment verification error:', err);
      res.status(500).json({ error: err.message || 'Failed to verify payment status.' });
    }
  });

  app.post('/api/payment/webhook', async (req: Request, res: Response) => {
    try {
      const result = await midtransService.handleWebhookNotification(req.body);
      res.json({ received: true, result });
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // ----------------------------------------------------
  // VITE & STATIC FILE MIDDLEWARE
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Just Speak server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
