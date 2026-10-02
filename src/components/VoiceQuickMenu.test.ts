// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot } from 'react-dom/client';

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

  it('renders flyout panel with header title "Impostazioni Voce" when opened', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(VoiceQuickMenu, { id: 'btn-voice-quick-menu' }));
    });

    const triggerBtn = container.querySelector('#btn-voice-quick-menu') as HTMLButtonElement;
    expect(triggerBtn).not.toBeNull();

    act(() => {
      triggerBtn.click();
    });

    const popover = container.querySelector('[data-testid="voice-quick-popover"]');
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('Impostazioni Voce');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('clamps popover right offset so it stays within screen bounds when close to left edge', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    Object.defineProperty(window, 'innerWidth', { value: 360, configurable: true, writable: true });

    act(() => {
      root.render(React.createElement(VoiceQuickMenu, { id: 'btn-voice-quick-menu', align: 'right' }));
    });

    const triggerContainer = container.querySelector('#btn-voice-quick-menu')?.parentElement as HTMLElement;
    vi.spyOn(triggerContainer, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      bottom: 46,
      left: 200,
      right: 240,
      width: 40,
      height: 36,
      x: 200,
      y: 10,
      toJSON: () => {}
    });

    const triggerBtn = container.querySelector('#btn-voice-quick-menu') as HTMLButtonElement;
    act(() => {
      triggerBtn.click();
    });

    const popover = container.querySelector('[data-testid="voice-quick-popover"]') as HTMLElement;
    expect(popover).not.toBeNull();

    // Check style.right has a negative offset (shifted to the right)
    expect(popover.style.right).toMatch(/^-\d+px$/);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
