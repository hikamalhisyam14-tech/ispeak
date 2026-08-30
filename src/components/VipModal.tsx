import React, { useState, useEffect } from 'react';
import { Crown, Check, X, Sparkles, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VipModal({ isOpen, onClose }: VipModalProps) {
  const { user, updateUserVip, openAuthModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'created' | 'verifying' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartPurchase = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.createPayment();

      if (res.alreadyVip) {
        updateUserVip(true);
        setPaymentStatus('success');
        return;
      }

      setOrderId(res.orderId);
      setPaymentStatus('created');

      // Open Midtrans payment in a new browser tab/window while keeping Just Speak tab open
      window.open(res.redirectUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setErrorMessage(err.message || 'Failed to start payment. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.verifyPayment(orderId);
      if (res.success && res.isVip) {
        updateUserVip(true);
        setPaymentStatus('success');
      } else {
        setErrorMessage(`Payment status: ${res.status}. If you just completed it, wait a few seconds and try again.`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Could not verify payment status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#201C19] border border-gray-100 dark:border-stone-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          id="close-vip-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        {user?.isVip || paymentStatus === 'success' ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF5ED] dark:bg-[#F27D26]/20 text-[#F27D26] mx-auto flex items-center justify-center">
              <Crown className="w-8 h-8 fill-[#F27D26]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk']">
                Lifetime VIP Active!
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                You have permanent access to all 378+ topics across every category.
              </p>
            </div>
            <button
              id="vip-modal-done-btn"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-sm font-bold shadow-lg shadow-[#F27D26]/20 cursor-pointer transition-all"
            >
              Start Practicing
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF5ED] dark:bg-[#F27D26]/20 text-[#F27D26] flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 fill-[#F27D26]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk']">
                  Unlock Lifetime VIP
                </h3>
                <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                  One-time payment • No subscription
                </span>
              </div>
            </div>

            {/* Price Badge */}
            <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 dark:text-stone-500 block font-medium">Single Lifetime Unlock</span>
                <span className="text-2xl font-bold text-[#2D2926] dark:text-[#F5F5F4] font-['Space_Grotesk']">
                  Rp 99.000 <span className="text-xs font-normal text-stone-400">(~$6.50 USD)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#F27D26] block">Permanent Access</span>
                <span className="text-[11px] text-stone-400">Never pay again</span>
              </div>
            </div>

            {/* Feature List */}
            <ul className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>All 378+ topics</strong> across 9 human-curated categories</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Psychology, Weird, Science, History & Challenges</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Permanent database record</strong> tied directly to your account</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span><strong>Midtrans Payment Gateway</strong> (GoPay, QRIS, Credit Card, Bank)</span>
              </li>
            </ul>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Action State */}
            {paymentStatus === 'created' ? (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-[#FFF5ED] dark:bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-2xl text-xs text-stone-700 dark:text-stone-300 space-y-1.5">
                  <p className="font-semibold text-[#F27D26] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Midtrans payment page opened in a new tab.
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Complete your payment in the other tab, then click the button below to verify.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="verify-payment-btn"
                    onClick={handleVerifyPayment}
                    disabled={isLoading}
                    className="flex-1 py-3.5 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#F27D26]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>I Have Completed Payment</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-2">
                <button
                  id="start-vip-purchase-btn"
                  onClick={handleStartPurchase}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#F27D26] hover:bg-[#D96A1C] text-white text-sm font-bold shadow-lg shadow-[#F27D26]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Preparing Payment...' : 'Unlock VIP Lifetime'}</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Secure checkout via Midtrans</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
