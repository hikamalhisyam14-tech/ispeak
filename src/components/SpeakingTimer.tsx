import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { TimerDuration } from '../types';

interface SpeakingTimerProps {
  duration: TimerDuration;
  onDurationChange: (duration: TimerDuration) => void;
  onCompleteSession: (durationSeconds: number) => Promise<void>;
  isCompletedToday: boolean;
  disabled?: boolean;
}

const MOTIVATION_MESSAGES = [
  'Keep going.',
  'You got this.',
  'One more day.',
  'Great session.',
  'Consistency is key.',
  'Clear and steady.',
];

export function SpeakingTimer({
  duration,
  onDurationChange,
  onCompleteSession,
  isCompletedToday,
  disabled = false,
}: SpeakingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with duration prop change
  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(false);
    setHasFinished(false);
  }, [duration]);

  // Audio completion chime using Web Audio API
  const playCompletionChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            setHasFinished(true);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
      setHasFinished(false);
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
    setHasFinished(false);
  };

  const handleMarkComplete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const elapsedSeconds = duration - timeLeft || duration;
      await onCompleteSession(elapsedSeconds > 0 ? elapsedSeconds : duration);
      
      const randomMsg = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];
      setSuccessMessage(randomMsg);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="w-full flex flex-col h-full">
      {/* Bento Timer Card */}
      <div className="w-full bg-[#1A1817] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between flex-1 border border-stone-800 min-h-[360px]">
        
        {/* Subtle Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-800">
          <div
            className="h-full bg-[#F27D26] transition-all duration-300 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Top Header: Label + Duration Pills */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">
              Timer
            </span>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#F27D26] animate-pulse' : 'bg-stone-600'}`} />
          </div>

          <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl">
            {([60, 90, 120, 180] as TimerDuration[]).map((dur) => (
              <button
                key={dur}
                id={`timer-option-${dur}`}
                onClick={() => {
                  if (!isActive) onDurationChange(dur);
                }}
                disabled={isActive}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  duration === dur
                    ? 'bg-[#F27D26] text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {dur === 60 ? '1m' : dur === 90 ? '1.5m' : dur === 120 ? '2m' : '3m'}
              </button>
            ))}
          </div>
        </div>

        {/* Massive Digits Display */}
        <div className="my-auto py-2 text-center">
          <span
            id="speaking-timer-display"
            className={`font-['Space_Grotesk'] text-6xl sm:text-7xl font-bold tracking-tight select-none transition-colors ${
              hasFinished
                ? 'text-emerald-400'
                : isActive
                ? 'text-[#F27D26]'
                : 'text-white'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
          <p className="text-xs font-medium text-stone-400 mt-2 h-4">
            {hasFinished
              ? 'Time is up! Mark complete below.'
              : isActive
              ? 'Speaking in progress...'
              : 'Take your time, speak clearly.'}
          </p>
        </div>

        {/* Controls Row */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-3">
          <button
            id="reset-timer-btn"
            onClick={resetTimer}
            disabled={timeLeft === duration && !hasFinished}
            title="Reset timer"
            className="p-3.5 rounded-2xl bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="toggle-timer-btn"
            onClick={toggleTimer}
            disabled={disabled}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isActive
                ? 'bg-stone-700 hover:bg-stone-600 text-white'
                : 'bg-[#F27D26] hover:bg-[#D96A1C] text-white shadow-[#F27D26]/20'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : timeLeft === 0 ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Start Speaking</span>
              </>
            )}
          </button>

          {/* Mark Complete Button */}
          <button
            id="complete-speaking-btn"
            onClick={handleMarkComplete}
            disabled={isSaving}
            title="Mark session completed"
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              hasFinished
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${hasFinished ? 'text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Streak Feedback Toast message */}
        {successMessage && (
          <div
            id="streak-feedback-msg"
            className="mt-3 pt-2 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Practice recorded! {successMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
