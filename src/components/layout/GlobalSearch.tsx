import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { NAV_SECTIONS } from '../../data/navigation';
import { cn } from '../../utils/helpers';

interface SearchResult {
  id: string;
  title: string;
  path: string;
  category: string;
  categoryColor: string;
  tags?: string[];
}

function buildSearchIndex(): SearchResult[] {
  return NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => item.badge !== 'Soon')
      .map((item) => ({
        id: item.id,
        title: item.title,
        path: item.path,
        category: section.title,
        categoryColor: section.color,
      }))
  );
}

const searchIndex = buildSearchIndex();

// Port and protocol quick lookup
const QUICK_REFS: SearchResult[] = [
  { id: 'port-80',  title: 'Port 80 – HTTP (TCP)',          path: '/topic/http',  category: 'Port Reference', categoryColor: '#8b5cf6' },
  { id: 'port-443', title: 'Port 443 – HTTPS/TLS (TCP)',    path: '/topic/https', category: 'Port Reference', categoryColor: '#8b5cf6' },
  { id: 'port-53',  title: 'Port 53 – DNS (TCP/UDP)',       path: '/topic/dns',   category: 'Port Reference', categoryColor: '#8b5cf6' },
  { id: 'port-22',  title: 'Port 22 – SSH (TCP)',           path: '/topic/ssh',   category: 'Port Reference', categoryColor: '#8b5cf6' },
  { id: 'rfc-826',  title: 'RFC 826 – ARP',                 path: '/topic/arp',   category: 'RFC',            categoryColor: '#f59e0b' },
  { id: 'rfc-1034', title: 'RFC 1034 – DNS',                path: '/topic/dns',   category: 'RFC',            categoryColor: '#f59e0b' },
  { id: 'rfc-9293', title: 'RFC 9293 – TCP',                path: '/topic/tcp',   category: 'RFC',            categoryColor: '#f59e0b' },
  { id: 'rfc-1918', title: 'RFC 1918 – Private IP Ranges',  path: '/topic/ip-addressing', category: 'RFC', categoryColor: '#f59e0b' },
];

const allSearchable = [...searchIndex, ...QUICK_REFS];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = query.trim().length === 0
    ? searchIndex.slice(0, 8)
    : allSearchable.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        (item.tags ?? []).some((t) => t.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) handleSelect(results[selected].path);
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/[0.12]">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search topics, protocols, RFCs, ports…"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                  aria-label="Search NetVerse"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="btn-icon">
                    <X size={14} />
                  </button>
                )}
                <kbd className="text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 font-mono">ESC</kbd>
              </div>

              {/* Results */}
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.length === 0 && (
                  <li className="px-4 py-8 text-center text-slate-500 text-sm">
                    No results for "{query}"
                  </li>
                )}
                {results.map((item, idx) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        idx === selected ? 'bg-electric-500/10' : 'hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                          style={{
                            color: item.categoryColor,
                            borderColor: `${item.categoryColor}40`,
                            backgroundColor: `${item.categoryColor}10`,
                          }}
                        >
                          {item.category}
                        </span>
                        <span className="text-sm text-slate-200">{item.title}</span>
                      </div>
                      {idx === selected && (
                        <ArrowRight size={14} className="text-electric-400 shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[11px] text-slate-600">
                <span><kbd className="border border-slate-700 rounded px-1 font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="border border-slate-700 rounded px-1 font-mono">↵</kbd> open</span>
                <span className="ml-auto">Topics, RFCs, ports</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
