import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import { quizBank } from '../../data/quizBank';

import { useProgress } from '../../stores';
import { cn } from '../../utils/helpers';
import type { QuizQuestion } from '../../types';

interface QuizProps {
  topicId: string;
}

export default function Quiz({ topicId }: QuizProps) {
  const questions = quizBank.filter((q) => q.topicId === topicId);
  const { recordQuizScore } = useProgress();

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-slate-500 text-sm">
        No quiz questions available for this topic yet.
      </div>
    );
  }

  const q = questions[current];
  const chosenOption = q.options.find((o) => o.id === selected);
  const isCorrect = chosenOption?.isCorrect ?? false;

  const score = Object.values(answers).reduce((acc, optId, idx) => {
    const question = questions[idx];
    const opt = question?.options.find((o) => o.id === optId);
    return acc + (opt?.isCorrect ? 1 : 0);
  }, 0);

  const handleSelect = (optId: string) => {
    if (selected) return; // locked after selection
    setSelected(optId);
    setShowExplanation(true);
    setAnswers((prev) => ({ ...prev, [current]: optId }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      const finalScore = Math.round((score / questions.length) * 100);
      recordQuizScore(topicId, finalScore);
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected(null);
    setShowExplanation(false);
    setAnswers({});
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-8 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-500 to-cyan-500 flex items-center justify-center mx-auto">
          <Trophy size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">Quiz Complete!</h3>
        <div className="text-4xl font-bold text-gradient">{pct}%</div>
        <p className="text-slate-400 text-sm">
          {score} / {questions.length} correct
          {pct >= 80 ? ' — Excellent!' : pct >= 60 ? ' — Good effort!' : ' — Keep studying!'}
        </p>
        <button onClick={handleReset} className="btn-secondary mx-auto">
          <RotateCcw size={15} /> Retry Quiz
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge-blue">Quiz</span>
          <span className={cn('badge', q.difficulty === 'beginner' ? 'badge-green' : q.difficulty === 'intermediate' ? 'badge-amber' : 'badge-rose')}>
            {q.difficulty}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all',
              i < current
                ? answers[i] && questions[i].options.find((o) => o.id === answers[i])?.isCorrect
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
                : i === current
                ? 'bg-electric-400'
                : 'bg-white/10'
            )}
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {q.context && (
            <div className="glass rounded-lg px-4 py-3 text-sm text-slate-400 border-l-2 border-electric-500/40">
              <span className="text-electric-400 font-medium">Scenario: </span>
              {q.context}
            </div>
          )}

          <p className="text-base text-white font-medium leading-relaxed">{q.question}</p>

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((opt) => {
              const state = !selected
                ? 'default'
                : opt.id === selected
                ? opt.isCorrect
                  ? 'correct'
                  : 'incorrect'
                : opt.isCorrect && selected
                ? 'correct'
                : 'dim';

              return (
                <motion.button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={!!selected}
                  whileHover={!selected ? { x: 4 } : {}}
                  className={cn(
                    'quiz-option',
                    state === 'correct'   && 'correct',
                    state === 'incorrect' && 'incorrect',
                    state === 'dim'       && 'opacity-40',
                    selected && 'cursor-default'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 transition-all',
                        state === 'correct'   ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                        state === 'incorrect' ? 'border-rose-500 bg-rose-500/20 text-rose-400' :
                        'border-white/20 text-slate-400'
                      )}
                    >
                      {opt.id.toUpperCase()}
                    </span>
                    <div className="text-left">
                      <div>{opt.text}</div>
                      {(state === 'correct' || state === 'incorrect') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={cn(
                            'text-xs mt-1.5 leading-relaxed',
                            state === 'correct' ? 'text-emerald-400' : 'text-rose-400'
                          )}
                        >
                          {opt.explanation}
                        </motion.div>
                      )}
                    </div>
                    <div className="ml-auto shrink-0 mt-0.5">
                      {state === 'correct'   && <CheckCircle size={16} className="text-emerald-400" />}
                      {state === 'incorrect' && <XCircle    size={16} className="text-rose-400" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation panel */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  'rounded-xl p-4 border text-sm leading-relaxed',
                  isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                )}>
                  <div className="flex items-center gap-2 mb-2 font-medium">
                    {isCorrect
                      ? <><CheckCircle size={14} /> Correct!</>
                      : <><XCircle size={14} /> Incorrect</>}
                  </div>
                  <p className="text-slate-300">{q.explanation}</p>
                  {q.rfcNote && (
                    <p className="text-amber-400/70 text-xs mt-2">📖 {q.rfcNote}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          {selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={handleNext} className="btn-primary w-full justify-center">
                {current < questions.length - 1 ? (
                  <><ChevronRight size={16} /> Next Question</>
                ) : (
                  <><Trophy size={16} /> See Results</>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
