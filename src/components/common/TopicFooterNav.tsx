import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { NAV_SECTIONS } from '../../data/navigation';
import { useProgress } from '../../stores';
import { useToast } from '../../stores/toastStore';

interface TopicFooterNavProps {
  currentTopicId: string;
}

export default function TopicFooterNav({ currentTopicId }: TopicFooterNavProps) {
  const { bookmarks, toggleBookmark } = useProgress();
  const { addToast } = useToast();

  const isBookmarked = (bookmarks || []).includes(currentTopicId);

  // Flatten all topic items in nav order
  const allItems = NAV_SECTIONS.flatMap((section) => section.items);

  const currentIndex = allItems.findIndex((item) => item.topicId === currentTopicId || item.id === currentTopicId);

  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  const handleBookmarkToggle = () => {
    const nowBookmarked = toggleBookmark(currentTopicId);
    if (nowBookmarked) {
      addToast('Topic added to Bookmarks! ⭐', 'success');
    } else {
      addToast('Topic removed from Bookmarks.', 'info');
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/[0.08] space-y-6">
      {/* Bookmark Action Bar */}
      <div className="flex items-center justify-between glass rounded-xl p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'glass border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Star size={14} className={isBookmarked ? 'fill-amber-400 text-amber-400' : ''} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark Topic'}</span>
          </button>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Topic {currentIndex + 1} of {allItems.length}
        </span>
      </div>

      {/* Prev / Next Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prevItem ? (
          <Link
            to={prevItem.path}
            className="group block glass rounded-xl p-4 border border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-blue-400 transition-colors mb-1">
              <ArrowLeft size={14} />
              <span>Previous Topic</span>
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
              {prevItem.title}
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextItem ? (
          <Link
            to={nextItem.path}
            className="group block glass rounded-xl p-4 border border-white/[0.08] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-right ml-auto w-full"
          >
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 group-hover:text-emerald-400 transition-colors mb-1">
              <span>Next Topic</span>
              <ArrowRight size={14} />
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
              {nextItem.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
