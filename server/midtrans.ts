import { db, UserRecord, PaymentRecord } from './db';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const SNAP_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

const STATUS_API_BASE = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

export interface CreateTransactionParams {
  user: UserRecord;
  amount?: number; // In IDR, e.g. 99000 IDR (approx $6.50 USD) for one-time VIP
  itemDetails?: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

export const midtransService = {
  getClientKey(): string {
    return MIDTRANS_CLIENT_KEY;
  },

  isProduction(): boolean {
    return IS_PRODUCTION;
  },

  isConfigured(): boolean {
    return Boolean(MIDTRANS_SERVER_KEY && MIDTRANS_SERVER_KEY.trim().length > 0);
  },

  async createTransaction({ user, amount = 99000 }: CreateTransactionParams): Promise<{
    orderId: string;
    snapToken: string;
    redirectUrl: string;
    isSimulated: boolean;
  }> {
    const orderId = `JS-VIP-${user.id.slice(0, 8)}-${Date.now()}`;
    const grossAmount = amount;

    // If real server key is provided, communicate with Midtrans API
    if (this.isConfigured()) {
      const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        customer_details: {
          first_name: user.displayName || 'Just Speak Member',
          email: user.email,
        },
        item_details: [
          {
            id: 'just-speak-vip-lifetime',
            price: grossAmount,
            quantity: 1,
            name: 'Just Speak Lifetime VIP (One-Time)',
          },
        ],
        credit_card: {
          secure: true,
        },
      };

      try {
        const res = await fetch(SNAP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${authString}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.error_messages ? data.error_messages.join(', ') : 'Failed to create Midtrans transaction');
        }

        const record: PaymentRecord = {
          id: `pay_${Date.now()}`,
          userId: user.id,
          orderId,
          grossAmount,
          status: 'pending',
          snapToken: data.token,
          redirectUrl: data.redirect_url,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.createPayment(record);

        return {
          orderId,
          snapToken: data.token,
          redirectUrl: data.redirect_url,
          isSimulated: false,
        };
      } catch (err: any) {
        console.error('Midtrans API Request error:', err);
        // Fallback gracefully in development if sandbox network error occurs
        throw new Error(err.message || 'Error communicating with Midtrans payment gateway.');
      }
    }

    // In Sandbox / Development mode without API key configured yet:
    // Generate a sandbox order record with a simulated payment gateway page
    const mockSnapToken = `SANDBOX-SNAP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const redirectUrl = `/payment/sandbox-checkout?order_id=${orderId}&token=${mockSnapToken}`;

    const record: PaymentRecord = {
      id: `pay_${Date.now()}`,
      userId: user.id,
      orderId,
      grossAmount,
      status: 'pending',
      snapToken: mockSnapToken,
      redirectUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.createPayment(record);

    return {
      orderId,
      snapToken: mockSnapToken,
      redirectUrl,
      isSimulated: true,
    };
  },

  async verifyAndSettlePayment(orderId: string): Promise<{ success: boolean; status: string; isVip: boolean }> {
    const payment = db.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new Error('Order not found');
    }

    if (payment.status === 'settlement' || payment.status === 'capture') {
      // Ensure user is marked as VIP
      db.updateUser(payment.userId, {
        isVip: true,
        vipPurchasedAt: payment.updatedAt || new Date().toISOString(),
        vipOrderId: orderId,
      });
      return { success: true, status: payment.status, isVip: true };
    }

    // Check with Midtrans server if configured
    if (this.isConfigured()) {
      const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
      try {
        const res = await fetch(`${STATUS_API_BASE}/${orderId}/status`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authString}`,
          },
        });
        const data = await res.json();
        const transactionStatus = data.transaction_status;
        const fraudStatus = data.fraud_status;

        let newStatus: PaymentRecord['status'] = 'pending';
        let isSuccess = false;

        if (transactionStatus === 'capture') {
          if (fraudStatus === 'accept') {
            newStatus = 'capture';
            isSuccess = true;
          }
        } else if (transactionStatus === 'settlement') {
          newStatus = 'settlement';
          isSuccess = true;
        } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
          newStatus = transactionStatus as any;
        }

        db.updatePayment(orderId, { status: newStatus });

        if (isSuccess) {
          db.updateUser(payment.userId, {
            isVip: true,
            vipPurchasedAt: new Date().toISOString(),
            vipOrderId: orderId,
          });
          return { success: true, status: newStatus, isVip: true };
        }

        return { success: false, status: newStatus, isVip: false };
      } catch (err: any) {
        console.error('Failed to verify Midtrans status:', err);
        throw new Error('Could not verify status with Midtrans API');
      }
    }

    // If sandbox / simulated test without API key:
    // Mark as settled
    db.updatePayment(orderId, { status: 'settlement' });
    db.updateUser(payment.userId, {
      isVip: true,
      vipPurchasedAt: new Date().toISOString(),
      vipOrderId: orderId,
    });

    return { success: true, status: 'settlement', isVip: true };
  },

  async handleWebhookNotification(body: any): Promise<{ handled: boolean }> {
    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;
    const fraudStatus = body.fraud_status;

    if (!orderId) return { handled: false };

    const payment = db.getPaymentByOrderId(orderId);
    if (!payment) return { handled: false };

    let isSuccess = false;
    let newStatus: PaymentRecord['status'] = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        newStatus = 'capture';
        isSuccess = true;
      }
    } else if (transactionStatus === 'settlement') {
      newStatus = 'settlement';
      isSuccess = true;
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = transactionStatus as any;
    }

    db.updatePayment(orderId, { status: newStatus });

    if (isSuccess) {
      db.updateUser(payment.userId, {
        isVip: true,
        vipPurchasedAt: new Date().toISOString(),
        vipOrderId: orderId,
      });
    }

    return { handled: true };
  },
};
