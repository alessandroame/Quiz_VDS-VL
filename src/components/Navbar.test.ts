// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

const mockUseTheme = vi.fn();
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => mockUseTheme()
}));

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

vi.mock('./VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

vi.mock('./OfflineIndicator', () => ({
  OfflineIndicator: () => React.createElement('div', { 'data-testid': 'offline-indicator' })
}));

vi.mock('./AudioDownloadBanner', () => ({
  AudioDownloadBanner: () => React.createElement('div', { 'data-testid': 'audio-download-banner' })
}));

vi.mock('./BuildInfoModal', () => ({
  BuildInfoModal: () => React.createElement('div', { 'data-testid': 'build-info-modal' })
}));

import { Navbar } from './Navbar';

describe('Navbar Component (Top Bar & Mini-Header Disambiguation)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      cycleTheme: vi.fn(),
      resolvedTheme: 'dark'
    });
    mockUseQuiz.mockReturnValue({
      readinessScore: 85,
      isExamRunning: false,
      activeSession: null,
      openDriveMode: vi.fn(),
      settings: {
        autoSyncDrive: false
      },
      syncState: {
        status: 'synced'
      }
    });
  });

  describe('Mini-Header (activeTab !== "home")', () => {
    it('renders btn-mini-audio with neutral styling instead of amber toggle', () => {
      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'exam',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('id="btn-mini-audio"');
      expect(html).toContain('border-zinc-800');
      expect(html).toContain('bg-zinc-900/60');
      expect(html).not.toContain('bg-amber-500/10');
      expect(html).not.toContain('border-amber-500/30');
    });

    it('renders btn-nav-back-home with neutral chevron icon', () => {
      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'topics',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('id="btn-nav-back-home"');
      expect(html).toContain('text-zinc-400 group-hover:text-white');
      expect(html).not.toContain('text-amber-400 light:text-amber-600');
    });
  });

  describe('Home Header (activeTab === "home")', () => {
    it('renders btn-drive-mode with neutral styling instead of amber toggle', () => {
      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'home',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('id="btn-drive-mode"');
      expect(html).toContain('border-zinc-800');
      expect(html).toContain('bg-zinc-900/60');
      expect(html).not.toContain('bg-amber-500/10');
      expect(html).not.toContain('border-amber-500/40');
    });

    it('renders 2017 edition badge with neutral styling', () => {
      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'home',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('2017');
      expect(html).toContain('bg-zinc-800/80 text-zinc-400');
      expect(html).not.toContain('bg-amber-500/20 text-amber-400 font-mono');
    });
  });
});
