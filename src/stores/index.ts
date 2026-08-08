import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, TutorMessage, QuizSession, QuizQuestion } from '../types';
import type { LearningMode } from '../data/navigation';

// ─── UI / Settings Store ──────────────────────────────────────────────────────
interface SettingsStore {
  learningMode: LearningMode;
  sidebarCollapsed: boolean;
  tutorOpen: boolean;
  searchOpen: boolean;
  setLearningMode: (mode: LearningMode) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setTutorOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      learningMode: 'beginner',
      sidebarCollapsed: false,
      tutorOpen: false,
      searchOpen: false,
      setLearningMode: (learningMode) => set({ learningMode }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setTutorOpen: (tutorOpen) => set({ tutorOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    { name: 'netverse-settings' }
  )
);

// ─── Progress Store ───────────────────────────────────────────────────────────
interface ProgressStore extends UserProgress {
  bookmarks: string[];
  markTopicViewed: (topicId: string) => void;
  markAnimationCompleted: (topicId: string) => void;
  recordQuizScore: (topicId: string, score: number) => void;
  toggleBookmark: (topicId: string) => boolean;
  resetProgress: () => void;
}

const defaultProgress: UserProgress = {
  topics: {},
  totalQuizzes: 0,
  averageScore: 0,
  streak: 0,
};

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...defaultProgress,
      bookmarks: [],

      markTopicViewed: (topicId) =>
        set((state) => ({
          topics: {
            ...state.topics,
            [topicId]: {
              topicId,
              viewed: true,
              animationCompleted: state.topics[topicId]?.animationCompleted ?? false,
              quizAttempts: state.topics[topicId]?.quizAttempts ?? 0,
              lastVisited: Date.now(),
            },
          },
        })),

      markAnimationCompleted: (topicId) =>
        set((state) => ({
          topics: {
            ...state.topics,
            [topicId]: {
              ...(state.topics[topicId] ?? { topicId, viewed: true, quizAttempts: 0 }),
              animationCompleted: true,
            },
          },
        })),

      toggleBookmark: (topicId) => {
        const { bookmarks } = get();
        const exists = (bookmarks || []).includes(topicId);
        const updated = exists
          ? (bookmarks || []).filter((id) => id !== topicId)
          : [...(bookmarks || []), topicId];
        set({ bookmarks: updated });
        return !exists; // returns true if now bookmarked
      },

      recordQuizScore: (topicId, score) => {
        const { topics, totalQuizzes } = get();
        const prev = topics[topicId];
        const newAttempts = (prev?.quizAttempts ?? 0) + 1;
        const allScores = Object.values(topics)
          .filter((t) => t.quizScore !== undefined)
          .map((t) => t.quizScore as number);
        allScores.push(score);
        const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

        set((state) => ({
          totalQuizzes: totalQuizzes + 1,
          averageScore: Math.round(avgScore),
          topics: {
            ...state.topics,
            [topicId]: {
              ...(prev ?? { topicId, viewed: true, animationCompleted: false }),
              quizScore: score,
              quizAttempts: newAttempts,
            },
          },
        }));
      },

      resetProgress: () => set({ ...defaultProgress, bookmarks: [] }),
    }),
    { name: 'netverse-progress' }
  )
);


// ─── Quiz Session Store ───────────────────────────────────────────────────────
interface QuizStore {
  session: QuizSession | null;
  startSession: (session: QuizSession) => void;
  answer: (questionId: string, optionId: string) => void;
  completeSession: () => void;
  clearSession: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  session: null,

  startSession: (session) => set({ session }),

  answer: (questionId, optionId) =>
    set((state) => {
      if (!state.session) return state;
      const answers = { ...state.session.answers, [questionId]: optionId };
      const correct = state.session.questions.filter(
        (q: QuizQuestion) => q.options.find((o) => o.id === answers[q.id])?.isCorrect
      ).length;
      const score = Math.round((correct / state.session.questions.length) * 100);
      return { session: { ...state.session, answers, score } };
    }),

  completeSession: () =>
    set((state) => {
      if (!state.session) return state;
      return { session: { ...state.session, completed: true, completedAt: Date.now() } };
    }),

  clearSession: () => set({ session: null }),
}));

// ─── Tutor Store ──────────────────────────────────────────────────────────────
interface TutorStore {
  messages: TutorMessage[];
  isTyping: boolean;
  addMessage: (msg: TutorMessage) => void;
  setTyping: (v: boolean) => void;
  clearMessages: () => void;
}

export const useTutorStore = create<TutorStore>((set) => ({
  messages: [],
  isTyping: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));
