import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, PanelLeftClose, PanelLeftOpen, Bot, Zap } from 'lucide-react';
import { useSettings } from '../../stores';
import { LEARNING_MODES } from '../../data/navigation';
import { cn } from '../../utils/helpers';

interface HeaderProps {
  onSearchOpen: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const { sidebarCollapsed, setSidebarCollapsed, tutorOpen, setTutorOpen, learningMode, setLearningMode } = useSettings();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06] bg-navy-950/80 backdrop-blur-sm shrink-0 z-30">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen size={18} />
            : <PanelLeftClose size={18} />}
        </button>

        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric-500 to-cyan-500 flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight hidden sm:block">NetVerse</span>
        </Link>
      </div>

      {/* Center: Search bar */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 glass rounded-lg text-slate-400 hover:text-white text-xs sm:text-sm hover:bg-white/[0.07] transition-all max-w-xs w-full mx-2 sm:mx-4 overflow-hidden"
        aria-label="Open search"
        title="Search (Ctrl+K)"
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left truncate text-xs sm:text-sm">Search topics, RFCs…</span>
        <kbd className="text-[10px] border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-600 hidden sm:block shrink-0">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Mode selector + AI tutor */}
      <div className="flex items-center gap-2">
        {/* Learning mode pill */}
        <div className="hidden md:flex items-center glass rounded-lg overflow-hidden divide-x divide-white/[0.06]">
          {LEARNING_MODES.slice(0, 3).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setLearningMode(mode.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-all',
                learningMode === mode.id
                  ? 'bg-electric-600/20 text-electric-300'
                  : 'text-slate-500 hover:text-slate-300'
              )}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* AI Tutor button */}
        <motion.button
          onClick={() => setTutorOpen(!tutorOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'btn-icon w-9 h-9 rounded-xl transition-all',
            tutorOpen
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-white'
          )}
          aria-label="Toggle AI Tutor"
          title="AI Tutor"
        >
          <Bot size={18} />
        </motion.button>
      </div>
    </header>
  );
}
