import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, CreditCard, QrCode, Building2, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

interface SandboxPaymentPageProps {
  orderId: string;
  onPaymentSettled?: () => void;
}

export function SandboxPaymentPage({ orderId, onPaymentSettled }: SandboxPaymentPageProps) {
  const [selectedMethod, setSelectedMethod] = useState<'gopay' | 'card' | 'va'>('gopay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Call backend payment verification to settle the order in the database
      const res = await api.verifyPayment(orderId);
      if (res.success && res.isVip) {
        setIsDone(true);
        if (onPaymentSettled) onPaymentSettled();
      } else {
        setError('Payment verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-[#141210] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#201C19] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden text-left">
        
        {/* Midtrans Sandbox Header Banner */}
        <div className="bg-[#1A365D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight font-['Space_Grotesk']">Midtrans</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-stone-900 uppercase">
              SANDBOX TEST
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-blue-200 block">Total Amount</span>
            <span className="font-bold text-sm">Rp 99.000</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {isDone ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Payment Successful!
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Order <strong>{orderId}</strong> has been marked as settled.
                </p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                  Your Just Speak account now has Lifetime VIP permanently activated.
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-stone-400">
                  You can now return to the original Just Speak tab.
                </p>
                <button
                  id="close-tab-btn"
                  onClick={() => window.close()}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                >
                  Close This Tab
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className="text-xs text-stone-400 block font-mono">Order ID: {orderId}</span>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  Just Speak Lifetime VIP (One-Time)
                </h4>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Select Test Payment Method
                </label>

                <button
                  id="pay-method-gopay"
                  type="button"
                  onClick={() => setSelectedMethod('gopay')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedMethod === 'gopay'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-sky-600" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">GoPay / QRIS</span>
                      <span className="text-[10px] text-stone-500">Scan QR Code or App</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Instant</span>
                </button>

                <button
                  id="pay-method-card"
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedMethod === 'card'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Credit / Debit Card</span>
                      <span className="text-[10px] text-stone-500">Visa, Mastercard, JCB</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">3D Secure</span>
                </button>

                <button
                  id="pay-method-va"
                  type="button"
                  onClick={() => setSelectedMethod('va')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedMethod === 'va'
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Bank Transfer / VA</span>
                      <span className="text-[10px] text-stone-500">BCA, Mandiri, BNI, BRI</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Auto-Check</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">
                  {error}
                </div>
              )}

              {/* Pay Button */}
              <button
                id="sandbox-complete-pay-btn"
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isProcessing ? 'Processing Transaction...' : 'Pay Rp 99.000 (Test Simulator)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Midtrans Sandbox Environment Simulator</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
