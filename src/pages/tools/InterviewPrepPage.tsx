import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { INTERVIEW_QUESTIONS, type InterviewQuestion } from '../../data/interviewQuestions';

type Track = InterviewQuestion['track'] | 'all';
type Difficulty = InterviewQuestion['difficulty'] | 'all';

const TRACKS: { id: Track; label: string; color: string; emoji: string }[] = [
  { id: 'all', label: 'All Tracks', color: '#8b5cf6', emoji: '🎯' },
  { id: 'devops', label: 'DevOps', color: '#3b82f6', emoji: '⚙️' },
  { id: 'sre', label: 'SRE', color: '#10b981', emoji: '📊' },
  { id: 'cloud', label: 'Cloud', color: '#f59e0b', emoji: '☁️' },
  { id: 'kubernetes', label: 'Kubernetes', color: '#06b6d4', emoji: '☸️' },
  { id: 'security', label: 'Security', color: '#ef4444', emoji: '🔐' },
];

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: 'all', label: 'All Levels', color: '#64748b' },
  { id: 'junior', label: 'Junior', color: '#10b981' },
  { id: 'mid', label: 'Mid', color: '#f59e0b' },
  { id: 'senior', label: 'Senior', color: '#ef4444' },
];

// Simple markdown-style bold renderer
function renderAnswer(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={j} className="text-emerald-300 bg-emerald-500/10 px-1 rounded text-[11px]">{part.slice(1, -1)}</code>;
          }
          return <span key={j}>{part}</span>;
        })}
        {i < lines.length - 1 && line.trim() === '' && <br />}
      </span>
    );
  });
}

export default function InterviewPrepPage() {
  const [track, setTrack] = useState<Track>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = INTERVIEW_QUESTIONS.filter(q =>
    (track === 'all' || q.track === track) &&
    (difficulty === 'all' || q.difficulty === difficulty)
  );

  const currentTrack = TRACKS.find(t => t.id === track)!;
  const currentDiff = DIFFICULTIES.find(d => d.id === difficulty)!;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <GraduationCap size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Interview Prep
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">DevOps · SRE · Cloud · Kubernetes · Security</p>
          </div>
          <span className="ml-auto badge-violet">Tool</span>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            Technical networking interview questions curated for DevOps, SRE, Cloud, Kubernetes, and Security engineering roles. RFC-grounded answers, from Junior to Senior level.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 space-y-3">
        {/* Track filter */}
        <div className="flex flex-wrap gap-2">
          {TRACKS.map(t => (
            <button key={t.id} onClick={() => setTrack(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${track === t.id ? 'text-white' : 'glass border-white/[0.06] text-slate-400 hover:text-slate-200'}`}
              style={track === t.id ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}50`, color: t.color } : {}}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        {/* Difficulty filter */}
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button key={d.id} onClick={() => setDifficulty(d.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${difficulty === d.id ? 'text-white' : 'glass border-white/[0.06] text-slate-400 hover:text-slate-200'}`}
              style={difficulty === d.id ? { backgroundColor: `${d.color}20`, borderColor: `${d.color}50`, color: d.color } : {}}>
              {d.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">{filtered.length} question{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map((q, idx) => {
          const isOpen = openId === q.id;
          const trackInfo = TRACKS.find(t => t.id === q.track)!;
          const diffInfo = DIFFICULTIES.find(d => d.id === q.difficulty)!;

          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className={`glass rounded-xl border transition-all ${isOpen ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/[0.06]'}`}>
              {/* Question header */}
              <button onClick={() => setOpenId(isOpen ? null : q.id)}
                className="w-full text-left p-5 flex items-start gap-3">
                <div className="flex flex-col items-center gap-1.5 shrink-0 mt-0.5">
                  <span className="text-lg">{trackInfo.emoji}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                    style={{ backgroundColor: `${diffInfo.color}15`, color: diffInfo.color }}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold text-white leading-snug">{q.question}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{q.shortAnswer}</p>
                </div>
                <div className="ml-2 mt-0.5 shrink-0 text-slate-500">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {/* Expanded answer */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
                      <div className="text-xs text-slate-300 leading-loose space-y-1 font-mono bg-slate-900/40 rounded-xl p-4">
                        {renderAnswer(q.detailedAnswer)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {q.rfcNote && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400">
                            📄 {q.rfcNote}
                          </span>
                        )}
                        {q.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-slate-500 border border-white/[0.06]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">No questions match this filter combination.</div>
          </div>
        )}
      </div>
    </div>
  );
}
