import React, { useEffect, useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettings } from '../../stores';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearch from './GlobalSearch';
import AITutor from '../tutor/AITutor';
import ToastContainer from '../common/ToastContainer';
import ShortcutsModal from '../common/ShortcutsModal';

export default function Layout() {
  const { sidebarCollapsed, searchOpen, setSearchOpen, tutorOpen, setTutorOpen } = useSettings();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Global keyboard shortcuts: Ctrl+K (Search), Ctrl+T (AI Tutor), ? (Shortcuts)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTutorOpen(!tutorOpen);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    },
    [setSearchOpen, setTutorOpen, tutorOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onSearchOpen={() => setSearchOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>

        {/* AI Tutor panel */}
        {tutorOpen && <AITutor />}
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastContainer />
    </div>
  );
}
