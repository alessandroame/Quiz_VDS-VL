// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockUseTheme = vi.fn();
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => mockUseTheme()
}));

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

vi.mock('../services/audioDownloadManager', () => ({
  audioDownloadManager: {
    getAllStatuses: vi.fn().mockReturnValue({
      giuseppe: { voice: 'giuseppe', downloadedCount: 0, totalCount: 2520, percent: 0, isDownloading: false, isComplete: false, error: null },
      elsa: { voice: 'elsa', downloadedCount: 0, totalCount: 2520, percent: 0, isDownloading: false, isComplete: false, error: null }
    }),
    checkAllStatuses: vi.fn().mockResolvedValue({}),
    getVoiceProgress: vi.fn().mockResolvedValue({ downloadedCount: 0, totalCount: 2520, isComplete: false, bytesDownloaded: 0 }),
    subscribe: vi.fn().mockReturnValue(() => {}),
    checkForAudioUpdates: vi.fn().mockResolvedValue({ hasUpdates: false }),
    downloadAllAudioForVoice: vi.fn(),
    deleteVoiceCache: vi.fn()
  }
}));

import { SettingsModal } from './SettingsModal';

describe('SettingsModal Component (Accordion & Mobile Ergonomics)', () => {
  const defaultSettings = {
    theme: 'system',
    fontSizePreference: 'normal',
    ttsEnabled: true,
    ttsVoice: 'giuseppe',
    ttsSpeed: 1.0,
    ttsPronounceWrongAnswers: true,
    ttsAutoPlayQuestion: true,
    driveContinuousMode: true,
    driveTutorMode: false,
    driveVoiceCommandsEnabled: false,
    driveMicMode: 'speaker',
    driveModeIntroPlayed: true,
    soundEffects: true,
    cloudSyncAuto: false
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: vi.fn(),
      cycleTheme: vi.fn(),
      resolvedTheme: 'dark'
    });
    mockUseQuiz.mockReturnValue({
      settings: defaultSettings,
      updateSetting: vi.fn(),
      updateSettings: vi.fn(),
      syncState: { isSyncing: false, lastSyncedAt: null, error: null },
      syncNow: vi.fn(),
      resetAllStats: vi.fn(),
      resetAllData: vi.fn()
    });
  });

  it('should not render anything when isOpen is false', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: false, onClose: () => {} }));
    });

    expect(container.innerHTML).toBe('');
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render dialog with all 6 accordion section headers collapsed by default', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {} }));
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(container.textContent).toContain('Impostazioni');

    // Check all 6 accordion headers exist
    const appearanceHeader = container.querySelector('#tab-appearance');
    const voiceHeader = container.querySelector('#tab-voice');
    const driveHeader = container.querySelector('#tab-drive');
    const cloudHeader = container.querySelector('#tab-cloud');
    const dataHeader = container.querySelector('#tab-data');
    const aboutHeader = container.querySelector('#tab-about');

    expect(appearanceHeader).not.toBeNull();
    expect(voiceHeader).not.toBeNull();
    expect(driveHeader).not.toBeNull();
    expect(cloudHeader).not.toBeNull();
    expect(dataHeader).not.toBeNull();
    expect(aboutHeader).not.toBeNull();

    // Verify all are collapsed by default (aria-expanded = false)
    expect(appearanceHeader?.getAttribute('aria-expanded')).toBe('false');
    expect(voiceHeader?.getAttribute('aria-expanded')).toBe('false');
    expect(driveHeader?.getAttribute('aria-expanded')).toBe('false');
    expect(cloudHeader?.getAttribute('aria-expanded')).toBe('false');
    expect(dataHeader?.getAttribute('aria-expanded')).toBe('false');
    expect(aboutHeader?.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should expand a section on click and collapse others (mutual exclusion)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {} }));
    });

    const appearanceHeader = container.querySelector('#tab-appearance') as HTMLButtonElement;
    const voiceHeader = container.querySelector('#tab-voice') as HTMLButtonElement;

    // Click Appearance
    act(() => {
      appearanceHeader.click();
    });

    expect(appearanceHeader.getAttribute('aria-expanded')).toBe('true');
    expect(voiceHeader.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).toContain('Dimensione Caratteri');

    // Click Voice: Appearance should collapse and Voice expand
    act(() => {
      voiceHeader.click();
    });

    expect(appearanceHeader.getAttribute('aria-expanded')).toBe('false');
    expect(voiceHeader.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Voce');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should trigger onClose when close button is clicked', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const onClose = vi.fn();
    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose }));
    });

    const closeBtn = container.querySelector('#btn-close-settings-x') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    act(() => {
      closeBtn.click();
    });

    expect(onClose).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render and toggle autoAdvanceOnCorrect in Appearance section', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const mockUpdateSetting = vi.fn();
    mockUseQuiz.mockReturnValue({
      settings: { ...defaultSettings, autoAdvanceOnCorrect: true },
      updateSetting: mockUpdateSetting,
      updateSettings: vi.fn(),
      syncState: { isSyncing: false, lastSyncedAt: null, error: null },
      syncNow: vi.fn(),
      resetAllStats: vi.fn(),
      resetAllData: vi.fn()
    });

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {} }));
    });

    const appearanceHeader = container.querySelector('#tab-appearance') as HTMLButtonElement;
    act(() => {
      appearanceHeader.click();
    });

    const checkbox = container.querySelector('#setting-auto-advance-on-correct') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);

    act(() => {
      checkbox.click();
    });

    expect(mockUpdateSetting).toHaveBeenCalledWith('autoAdvanceOnCorrect', false);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render distinct icons for Voce & Audio (Speech) and Modalita Mani Libere (Headphones)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {} }));
    });

    const voiceBtn = container.querySelector('#tab-voice');
    const driveBtn = container.querySelector('#tab-drive');

    expect(voiceBtn).not.toBeNull();
    expect(driveBtn).not.toBeNull();

    // Verify icons inside the button
    const voiceSvg = voiceBtn?.querySelector('svg');
    const driveSvg = driveBtn?.querySelector('svg');

    expect(voiceSvg).not.toBeNull();
    expect(driveSvg).not.toBeNull();

    // The two SVGs must have different classes/markup (Speech vs Headphones)
    expect(voiceSvg?.classList.contains('lucide-speech')).toBe(true);
    expect(driveSvg?.classList.contains('lucide-headphones')).toBe(true);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should display light theme app logo in About section when resolvedTheme is light', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      cycleTheme: vi.fn(),
      resolvedTheme: 'light'
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {}, defaultTab: 'about' }));
    });

    const aboutLogo = container.querySelector('#settings-about-app-logo') as HTMLImageElement;
    expect(aboutLogo).not.toBeNull();
    expect(aboutLogo.src).toContain('icon-light-192x192.png');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('expands Backup Cloud accordion section when defaultTab is "cloud"', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {}, defaultTab: 'cloud' }));
    });

    const cloudCardTab = container.querySelector('#tab-cloud') as HTMLButtonElement;
    expect(cloudCardTab).not.toBeNull();
    expect(cloudCardTab.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Sincronizzazione Cloud Google');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('calls syncNow(true) when clicking #btn-sync-now in Cloud section', async () => {
    const mockSyncNow = vi.fn().mockResolvedValue({ success: true, message: 'Sincronizzazione completata' });
    mockUseQuiz.mockReturnValue({
      settings: { ...defaultSettings, autoSyncDrive: true },
      updateSetting: vi.fn(),
      updateSettings: vi.fn(),
      syncState: { status: 'error', errorDetail: 'Errore di connessione', lastSyncedAt: null, isAutoSyncEnabled: true },
      syncNow: mockSyncNow,
      resetAllStats: vi.fn(),
      resetAllData: vi.fn()
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(SettingsModal, { isOpen: true, onClose: () => {}, defaultTab: 'cloud' }));
    });

    const syncNowBtn = container.querySelector('#btn-sync-now') as HTMLButtonElement;
    expect(syncNowBtn).not.toBeNull();

    await act(async () => {
      syncNowBtn.click();
    });

    expect(mockSyncNow).toHaveBeenCalledWith(true);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
