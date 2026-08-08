import React, { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Link as LinkIcon, Globe, Activity, Code2,
  Server, Cloud, ChevronDown, ChevronRight, Zap,
  BarChart2, Lock, Cpu
} from 'lucide-react';
import { NAV_SECTIONS } from '../../data/navigation';
import { useProgress } from '../../stores';
import { cn } from '../../utils/helpers';
import type { NavSection } from '../../types';

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen:  <BookOpen  size={15} />,
  Link:      <LinkIcon  size={15} />,
  Globe:     <Globe     size={15} />,
  Activity:  <Activity  size={15} />,
  Code2:     <Code2     size={15} />,
  Server:    <Server    size={15} />,
  Cloud:     <Cloud     size={15} />,
  BarChart2: <BarChart2 size={15} />,
  Lock:      <Lock      size={15} />,
  Cpu:       <Cpu       size={15} />,
};

interface SidebarSectionProps {
  section: NavSection;
  defaultOpen?: boolean;
}

function SidebarSection({ section, defaultOpen = false }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const { topics, bookmarks } = useProgress();

  const isActiveSection = section.items.some(
    (item) => location.pathname === item.path
  );

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150',
          isActiveSection
            ? 'text-white bg-white/[0.06]'
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
        )}
        style={{ color: isActiveSection ? section.color : undefined }}
      >
        <span className="flex items-center gap-2">
          <span style={{ color: section.color }}>{ICON_MAP[section.icon]}</span>
          {section.title}
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden ml-2 mt-0.5 space-y-0.5"
          >
            {section.items.map((item) => {
              const progress = item.topicId ? topics[item.topicId] : undefined;
              const viewed = progress?.viewed ?? false;
              const hasScore = progress?.quizScore !== undefined;
              const isSoon = item.badge === 'Soon';
              const isBookmarked = (bookmarks || []).includes(item.topicId || item.id);

              return (
                <li key={item.id}>
                  {isSoon ? (
                    <div
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-slate-600 cursor-not-allowed select-none"
                      title="Coming soon"
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] badge-slate ml-1 shrink-0">Soon</span>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'nav-item group',
                          isActive && 'active',
                          !isActive && viewed && 'text-slate-300'
                        )
                      }
                    >
                      <span className="flex-1 truncate">{item.title}</span>
                      {isBookmarked && (
                        <span className="text-amber-400 text-xs shrink-0" title="Bookmarked">
                          ★
                        </span>
                      )}
                      {hasScore && (
                        <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                          {progress!.quizScore}%
                        </span>
                      )}
                      {viewed && !hasScore && !isBookmarked && (
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-500/60 shrink-0" />
                      )}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}


interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { topics } = useProgress();
  const totalViewed = Object.values(topics).filter((t) => t.viewed).length;
  const totalTopics = NAV_SECTIONS.flatMap((s) =>
    s.items.filter((i) => i.badge !== 'Soon')
  ).length;

  return (
    <motion.aside
      animate={{ width: collapsed ? 0 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="h-full overflow-hidden shrink-0 border-r border-white/[0.06] flex flex-col"
      style={{ background: 'rgba(8, 12, 35, 0.95)' }}
    >
      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-20">
        {/* Logo area */}
        <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-cyan-500 flex items-center justify-center glow-blue">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">NetVerse</div>
            <div className="text-[10px] text-slate-500">Networking Academy</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-3 mb-4 glass rounded-lg p-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Progress</span>
            <span className="text-electric-400 font-medium">{totalViewed}/{totalTopics}</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-500"
              animate={{ width: `${totalTopics > 0 ? (totalViewed / totalTopics) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Navigation sections */}
        {NAV_SECTIONS.map((section, idx) => (
          <SidebarSection
            key={section.id}
            section={section}
            defaultOpen={idx < 2}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06] bg-navy-950/80 backdrop-blur-sm">
        <div className="text-[10px] text-slate-600 text-center">
          Every concept grounded in RFCs &amp; official docs
        </div>
      </div>
    </motion.aside>
  );
}
