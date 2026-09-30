// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

const mockUpdateSetting = vi.fn();
const mockSettings = {
  ttsEnabled: true,
  ttsVoice: 'giuseppe' as const,
  ttsPlaybackRate: 1.0,
  ttsAutoPlayQuestion: false,
  ttsAutoExplainOnMistake: true,
  soundEnabled: true,
  driveModeTutor: false
};

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

vi.mock('../services/voiceService', () => ({
  voiceService: {
    stop: vi.fn(),
    play: vi.fn()
  }
}));

import { VoiceQuickMenu } from './VoiceQuickMenu';

describe('VoiceQuickMenu Component (Neutral Disambiguation & Controls)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseQuiz.mockReturnValue({
      settings: { ...mockSettings },
      updateSetting: mockUpdateSetting
    });
  });

  it('renders trigger button with neutral cockpit styling when TTS is enabled', () => {
    const html = renderToString(
      React.createElement(VoiceQuickMenu, { id: 'btn-voice-quick-menu' })
    );

    // Assert neutral cockpit styling
    expect(html).toContain('id="btn-voice-quick-menu"');
    expect(html).toContain('border-zinc-800');
    expect(html).toContain('bg-zinc-900/60');
    expect(html).toContain('text-zinc-300');
    expect(html).toContain('1x');

    // Assert absence of misleading amber toggle classes on trigger button
    expect(html).not.toContain('bg-amber-500/15');
    expect(html).not.toContain('border-amber-500/30');
    expect(html).not.toContain('text-amber-400 shadow-sm');
  });

  it('renders muted state with VolumeX and neutral styling when TTS is disabled', () => {
    mockUseQuiz.mockReturnValue({
      settings: { ...mockSettings, ttsEnabled: false },
      updateSetting: mockUpdateSetting
    });

    const html = renderToString(
      React.createElement(VoiceQuickMenu, { id: 'btn-voice-quick-menu' })
    );

    expect(html).toContain('id="btn-voice-quick-menu"');
    expect(html).toContain('Muto');
    expect(html).toContain('text-zinc-500');
    expect(html).not.toContain('bg-amber-500/15');
  });

  it('renders properly when forceDark is true', () => {
    const html = renderToString(
      React.createElement(VoiceQuickMenu, {
        id: 'btn-drive-voice-quick-menu',
        forceDark: true
      })
    );

    expect(html).toContain('id="btn-drive-voice-quick-menu"');
    expect(html).toContain('border-zinc-800');
    expect(html).toContain('bg-zinc-900/60');
    expect(html).not.toContain('light:bg-amber-50');
  });
});
