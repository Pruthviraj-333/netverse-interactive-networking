import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, RefreshCw, Gauge } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface AnimationControlsProps {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onSpeedChange: (speed: number) => void;
  stepLabel?: string;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export default function AnimationControls({
  isPlaying,
  currentStep,
  totalSteps,
  speed,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBack,
  onSpeedChange,
  stepLabel,
}: AnimationControlsProps) {
  const [showSpeeds, setShowSpeeds] = useState(false);
  const progress = totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  // Keyboard shortcut listener for animation controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? onPause() : onPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep < totalSteps - 1) onStepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) onStepBack();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentStep, totalSteps, onPlay, onPause, onStepForward, onStepBack, onReset]);

  return (
    <div className="glass rounded-xl p-3 space-y-3">

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            Step <span className="text-white font-medium">{currentStep + 1}</span> of {totalSteps}
          </span>
          {stepLabel && <span className="text-electric-400 truncate max-w-[60%] text-right">{stepLabel}</span>}
        </div>
        <div
          className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden cursor-pointer"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemax={totalSteps - 1}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step dots */}
        <div className="flex gap-1 justify-center flex-wrap">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-4 h-1.5 bg-electric-400'
                  : i < currentStep
                  ? 'w-1.5 h-1.5 bg-electric-600/60'
                  : 'w-1.5 h-1.5 bg-white/10'
              )}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Reset */}
          <button
            onClick={onReset}
            className="btn-icon"
            aria-label="Reset animation"
            title="Reset"
          >
            <SkipBack size={15} />
          </button>

          {/* Step back */}
          <button
            onClick={onStepBack}
            disabled={currentStep === 0}
            className={cn('btn-icon', currentStep === 0 && 'opacity-30 cursor-not-allowed')}
            aria-label="Previous step"
          >
            <RefreshCw size={14} style={{ transform: 'scaleX(-1)' }} />
          </button>

          {/* Play / Pause */}
          <motion.button
            onClick={isPlaying ? onPause : onPlay}
            disabled={currentStep === totalSteps - 1 && !isPlaying}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              isPlaying
                ? 'bg-electric-600 text-white glow-blue'
                : 'bg-electric-600/20 text-electric-300 border border-electric-500/30 hover:bg-electric-600/30'
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.span key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Pause size={18} fill="currentColor" />
                </motion.span>
              ) : (
                <motion.span key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play size={18} fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Step forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep === totalSteps - 1}
            className={cn('btn-icon', currentStep === totalSteps - 1 && 'opacity-30 cursor-not-allowed')}
            aria-label="Next step"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Speed selector */}
        <div className="relative">
          <button
            onClick={() => setShowSpeeds((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1.5 glass rounded-lg transition-all"
            aria-label="Change speed"
          >
            <Gauge size={13} />
            <span className="font-mono">{speed}×</span>
          </button>

          <AnimatePresence>
            {showSpeeds && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-1 glass-strong rounded-lg overflow-hidden border border-white/[0.12] z-20"
              >
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onSpeedChange(s); setShowSpeeds(false); }}
                    className={cn(
                      'block w-full px-4 py-1.5 text-xs font-mono text-left hover:bg-white/[0.06] transition-colors',
                      s === speed ? 'text-electric-300' : 'text-slate-400'
                    )}
                  >
                    {s}×
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
