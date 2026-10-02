// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
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
      toggleDriveMode: vi.fn(),
      isDriveModeOpen: false,
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

    it('renders btn-mini-audio with active amber styling when isDriveModeOpen is true', () => {
      mockUseQuiz.mockReturnValueOnce({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode: vi.fn(),
        isDriveModeOpen: true,
        settings: { autoSyncDrive: false },
        syncState: { status: 'synced' }
      });

      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'exam',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('id="btn-mini-audio"');
      expect(html).toContain('border-amber-500 bg-amber-500/20 text-amber-300');
      expect(html).toContain('Torna alla vista normale');
    });

    it('calls toggleDriveMode when clicking btn-mini-audio', () => {
      const toggleDriveMode = vi.fn();
      mockUseQuiz.mockReturnValueOnce({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode,
        isDriveModeOpen: false,
        settings: { autoSyncDrive: false },
        syncState: { status: 'synced' }
      });

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(Navbar, {
            activeTab: 'exam',
            setActiveTab: () => {},
            openSettings: () => {}
          })
        );
      });

      const btn = container.querySelector('#btn-mini-audio') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      act(() => {
        btn.click();
      });

      expect(toggleDriveMode).toHaveBeenCalled();
      act(() => {
        root.unmount();
      });
      container.remove();
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

    it('renders btn-drive-mode with active amber styling when isDriveModeOpen is true', () => {
      mockUseQuiz.mockReturnValueOnce({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode: vi.fn(),
        isDriveModeOpen: true,
        settings: { autoSyncDrive: false },
        syncState: { status: 'synced' }
      });

      const html = renderToString(
        React.createElement(Navbar, {
          activeTab: 'home',
          setActiveTab: () => {},
          openSettings: () => {}
        })
      );

      expect(html).toContain('id="btn-drive-mode"');
      expect(html).toContain('border-amber-500 bg-amber-500/20 text-amber-300');
      expect(html).toContain('Torna alla vista normale');
    });

    it('calls toggleDriveMode when clicking btn-drive-mode', () => {
      const toggleDriveMode = vi.fn();
      mockUseQuiz.mockReturnValueOnce({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode,
        isDriveModeOpen: false,
        settings: { autoSyncDrive: false },
        syncState: { status: 'synced' }
      });

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(Navbar, {
            activeTab: 'home',
            setActiveTab: () => {},
            openSettings: () => {}
          })
        );
      });

      const btn = container.querySelector('#btn-drive-mode') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      act(() => {
        btn.click();
      });

      expect(toggleDriveMode).toHaveBeenCalled();
      act(() => {
        root.unmount();
      });
      container.remove();
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

  describe('Settings & Cloud Sync Navigation', () => {
    it('calls openSettings("cloud") when clicking btn-cloud-sync', () => {
      mockUseQuiz.mockReturnValue({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode: vi.fn(),
        isDriveModeOpen: false,
        settings: {
          autoSyncDrive: true
        },
        syncState: {
          status: 'needs_auth'
        }
      });

      const openSettings = vi.fn();
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(Navbar, {
            activeTab: 'home',
            setActiveTab: () => {},
            openSettings
          })
        );
      });

      const cloudBtn = container.querySelector('#btn-cloud-sync') as HTMLButtonElement;
      expect(cloudBtn).not.toBeNull();
      expect(cloudBtn.getAttribute('aria-label')).toBe('Accesso Google richiesto: tocca per ri-autorizzare');

      act(() => {
        cloudBtn.click();
      });

      expect(openSettings).toHaveBeenCalledWith('cloud');

      act(() => {
        root.unmount();
      });
      container.remove();
    });

    it('shows popup blocked tooltip on #btn-cloud-sync when isPopupBlocked is true', () => {
      mockUseQuiz.mockReturnValue({
        readinessScore: 85,
        isExamRunning: false,
        activeSession: null,
        openDriveMode: vi.fn(),
        toggleDriveMode: vi.fn(),
        isDriveModeOpen: false,
        settings: {
          autoSyncDrive: true
        },
        syncState: {
          status: 'needs_auth',
          errorDetail: 'popup_blocked_by_browser',
          isPopupBlocked: true
        }
      });

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(Navbar, {
            activeTab: 'home',
            setActiveTab: () => {},
            openSettings: () => {}
          })
        );
      });

      const cloudBtn = container.querySelector('#btn-cloud-sync') as HTMLButtonElement;
      expect(cloudBtn).not.toBeNull();
      expect(cloudBtn.getAttribute('aria-label')).toContain('Popup bloccato dal browser');

      act(() => {
        root.unmount();
      });
      container.remove();
    });

    it('calls openSettings() without tab argument when clicking regular settings button', () => {
      const openSettings = vi.fn();
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      act(() => {
        root.render(
          React.createElement(Navbar, {
            activeTab: 'home',
            setActiveTab: () => {},
            openSettings
          })
        );
      });

      const settingsBtn = container.querySelector('#btn-settings') as HTMLButtonElement;
      expect(settingsBtn).not.toBeNull();

      act(() => {
        settingsBtn.click();
      });

      expect(openSettings).toHaveBeenCalledWith();

      act(() => {
        root.unmount();
      });
      container.remove();
    });
  });
});
