import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Clock, CheckCircle2, AlertTriangle, RefreshCw, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { quizBank } from '../../data/quizBank';
import type { QuizQuestion } from '../../types';

export default function ExamModePage() {
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes (900 seconds)

  const startExam = () => {
    // Pick 15 random questions from quizBank
    const shuffled = [...quizBank].sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setTimeLeft(900);
    setExamFinished(false);
    setExamStarted(true);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (examStarted && !examFinished && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && examStarted) {
      setExamFinished(true);
    }
    return () => clearInterval(timer);
  }, [examStarted, examFinished, timeLeft]);

  const selectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correctOption = q.options.find((o) => o.isCorrect);
      if (selected && correctOption && selected === correctOption.id) {
        correct += 1;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQuestion = questions[currentIndex];
  const score = examFinished ? calculateScore() : { correct: 0, total: 0, percentage: 0 };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      {/* Title Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Award size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Networking Certification Practice Exam</h1>
            <p className="text-sm text-slate-500 mt-0.5">Timed 15-Question Technical Assessment Simulator</p>
          </div>
          <span className="ml-auto badge-amber">Exam Simulator</span>
        </div>
      </div>

      {/* Start Exam Screen */}
      {!examStarted && (
        <div className="glass rounded-2xl p-8 text-center space-y-6 border border-white/[0.08]">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Award size={32} className="text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Ready for your Networking Evaluation?</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Test your mastery across L2-L7 Protocols, Subnetting, TCP/IP, Cloud VPCs, eBPF, and SRE Linux Kernel Tuning.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-xs">
            <div className="glass p-3 rounded-xl border border-white/10">
              <div className="text-slate-400 font-mono">Questions</div>
              <div className="text-base font-bold text-white mt-0.5">15 MCQs</div>
            </div>
            <div className="glass p-3 rounded-xl border border-white/10">
              <div className="text-slate-400 font-mono">Time Limit</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">15 Mins</div>
            </div>
            <div className="glass p-3 rounded-xl border border-white/10">
              <div className="text-slate-400 font-mono">Passing Score</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">75%</div>
            </div>
          </div>

          <button
            onClick={startExam}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 transition-all"
          >
            Start Exam Now
          </button>
        </div>
      )}

      {/* Active Exam Interface */}
      {examStarted && !examFinished && (
        <div className="space-y-6">
          {/* Status Top Bar */}
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
              <Clock size={14} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setExamFinished(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Submit Exam
            </button>
          </div>

          {/* Question Palette */}
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-amber-500 text-white ring-2 ring-amber-400/50'
                      : isAnswered
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'glass border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Box */}
          {currentQuestion && (
            <div className="glass rounded-2xl p-6 space-y-5 border border-white/[0.08]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono uppercase">{currentQuestion.topicId}</span>
                <span className="badge-blue capitalize">{currentQuestion.difficulty}</span>
              </div>

              <h3 className="text-base font-bold text-white leading-snug">{currentQuestion.question}</h3>

              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                      className={`w-full text-left glass rounded-xl p-4 border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/10 text-white font-medium shadow-lg shadow-amber-500/5'
                          : 'border-white/[0.06] text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm">{opt.text}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${isSelected ? 'border-amber-400 bg-amber-400 text-black font-bold' : 'border-slate-500'}`}>
                        {opt.id.toUpperCase()}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 disabled:opacity-30 hover:text-white"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    Next Question <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setExamFinished(true)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20"
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exam Results / Certificate Screen */}
      {examFinished && (
        <div className="glass rounded-2xl p-8 space-y-6 border border-white/[0.08] text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${score.percentage >= 75 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {score.percentage >= 75 ? <Award size={40} className="text-emerald-400" /> : <AlertTriangle size={40} className="text-red-400" />}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">{score.percentage >= 75 ? 'Congratulations! Exam Passed 🎉' : 'Assessment Completed'}</h2>
            <p className="text-sm text-slate-400">
              {score.percentage >= 75 ? 'You passed the NetVerse Technical Networking Exam!' : 'Review weak areas and retry to earn your completion badge.'}
            </p>
          </div>

          <div className="glass rounded-xl p-6 max-w-md mx-auto space-y-3 border border-white/10">
            <div className="text-3xl font-mono font-bold" style={{ color: score.percentage >= 75 ? '#10b981' : '#f43f5e' }}>
              {score.percentage}%
            </div>
            <div className="text-xs text-slate-400">
              Score: {score.correct} / {score.total} Correct Answers
            </div>
          </div>

          <button
            onClick={startExam}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold mx-auto shadow-lg shadow-amber-500/20 hover:brightness-110"
          >
            <RefreshCw size={14} /> Retry Exam
          </button>
        </div>
      )}
    </div>
  );
}
