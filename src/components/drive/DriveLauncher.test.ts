import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveLauncher } from './DriveLauncher';

describe('DriveLauncher Unified Voice Settings', () => {
  const defaultProps = {
    isAutopilotEnabled: true,
    onToggleAutopilot: vi.fn(),
    isVoiceCommandsEnabled: false,
    isVoiceSupported: true,
    onToggleVoiceCommands: vi.fn(),
    audioOutputMode: 'speaker' as const,
    onToggleAudioOutput: vi.fn(),
    onSetAudioOutputMode: vi.fn(),
    isTutorEnabled: true,
    onToggleTutor: vi.fn(),
    isIntroActive: false,
    onDismissIntro: vi.fn(),
    onReplayIntro: vi.fn(),
    onOpenVoiceGuide: vi.fn(),
    setIsVoiceMenuOpen: vi.fn(),
    onStartExam: vi.fn(),
    onStartTutorExam: vi.fn(),
    onStartRadioQuiz: vi.fn(),
    onStartMistakesQuiz: vi.fn(),
    isWakeLockActive: true,
    onClose: vi.fn()
  };

  it('renders unified voice card in disabled state when voice commands are off', () => {
    const html = renderToString(
      React.createElement(DriveLauncher, {
        ...defaultProps,
        isVoiceCommandsEnabled: false
      })
    );

    expect(html).toContain('Comandi Vocali &amp; Microfono');
    expect(html).toContain('Microfono Disattivato');
    expect(html).toContain('SPENTO');

    // Sub-settings for speaker / headphones must be hidden when voice is off
    expect(html).not.toContain('Modalità di Ascolto:');
    expect(html).not.toContain('id="btn-drive-toggle-audio-output"');
    expect(html).not.toContain('id="btn-drive-toggle-audio-output-headphones"');
  });

  it('expands unified voice card to show listening mode selection when voice commands are on', () => {
    const html = renderToString(
      React.createElement(DriveLauncher, {
        ...defaultProps,
        isVoiceCommandsEnabled: true,
        audioOutputMode: 'speaker'
      })
    );

    expect(html).toContain('Comandi Vocali &amp; Microfono');
    expect(html).toContain('ATTIVO (in sessione)');
    expect(html).toContain('VOCE ON');

    // Sub-settings for speaker / headphones must be rendered
    expect(html).toContain('Modalità di Ascolto:');
    expect(html).toContain('id="btn-drive-toggle-audio-output"');
    expect(html).toContain('id="btn-drive-toggle-audio-output-headphones"');
    expect(html).toContain('Altoparlante');
    expect(html).toContain('Anti-eco: mic attivo a fine lettura o in pausa');
    expect(html).toContain('Cuffie con Mic');
    expect(html).toContain('Ascolto continuo: puoi interrompere a voce');
  });

  it('correctly displays headphone mode when selected', () => {
    const html = renderToString(
      React.createElement(DriveLauncher, {
        ...defaultProps,
        isVoiceCommandsEnabled: true,
        audioOutputMode: 'headphones'
      })
    );

    expect(html).toContain('CUFFIE');
    expect(html).toContain('id="btn-drive-toggle-audio-output-headphones"');
  });
});
