import React, { useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettings } from '../../stores';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearch from './GlobalSearch';
import AITutor from '../tutor/AITutor';

export default function Layout() {
  const { sidebarCollapsed, searchOpen, setSearchOpen, tutorOpen } = useSettings();

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    },
    [setSearchOpen]
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
    </div>
  );
}
