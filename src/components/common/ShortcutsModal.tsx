import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Search, Bot, Play, SkipForward, RotateCcw } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Open Global Search & Command Palette', icon: Search },
  { keys: ['Ctrl', 'T'], label: 'Toggle AI Tutor Panel', icon: Bot },
  { keys: ['?'], label: 'Toggle Keyboard Shortcuts Modal', icon: Keyboard },
  { keys: ['Space'], label: 'Play / Pause Interactive Packet Animation', icon: Play },
  { keys: ['→', '←'], label: 'Step Forward / Backward in Animation', icon: SkipForward },
  { keys: ['R'], label: 'Reset Animation to Initial State', icon: RotateCcw },
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md glass-strong border border-white/20 rounded-2xl p-6 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Keyboard size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Keyboard Shortcuts</h3>
                  <p className="text-xs text-slate-400">Master NetVerse with quick key combinations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {SHORTCUTS.map((sc, idx) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 glass rounded-xl border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Icon size={14} className="text-blue-400 shrink-0" />
                      <span>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-200 bg-white/10 border border-white/20 rounded shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-[11px] text-slate-500">
                Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded">Esc</kbd> or <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded">?</kbd> anytime to close
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
