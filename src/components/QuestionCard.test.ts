// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QuestionCard } from './QuestionCard';
import type { Question } from '../types/quiz';

const mockQuestion: Question = {
  id: 5037,
  subjectId: 5,
  subjectName: 'Meteorologia e Aerologia',
  discipline: 'all',
  question: 'Se su una carta meteorologica si osservano isobare molto ravvicinate, si può affermare che:',
  options: [
    'esiste un gradiente barico orizzontale minimo e il vento sarà sostenuto.',
    'esiste un gradiente barico orizzontale elevato e il vento sarà sostenuto.',
    'esiste un gradiente barico verticale elevato e il vento sarà sostenuto.'
  ],
  correctAnswer: 2,
  explanation: {
    rule: 'Isobare vicine indicano un forte gradiente barico orizzontale e quindi vento forte.',
    trap: 'Confondere il gradiente orizzontale con quello verticale.'
  }
};

const mockVoiceState = {
  isPlaying: false,
  isPaused: false,
  isThisQuestionActive: false,
  playingPart: null as string | null,
  pausedPart: null as string | null,
  activePart: null as string | null
};

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    statsMap: new Map(),
    settings: {
      ttsEnabled: true,
      ttsPlaybackRate: 1.0,
      ttsVoice: 'giuseppe',
      soundEnabled: false
    },
    toggleBookmark: vi.fn(),
    saveNote: vi.fn()
  })
}));

vi.mock('../hooks/useAviationVoice', () => ({
  useAviationVoice: () => ({
    isPlaying: mockVoiceState.isPlaying,
    isPaused: mockVoiceState.isPaused,
    isThisQuestionActive: mockVoiceState.isThisQuestionActive,
    isPartPlaying: (part: string) => mockVoiceState.playingPart === part,
    isPartPaused: (part: string) => mockVoiceState.pausedPart === part,
    isPartActive: (part: string) => mockVoiceState.activePart === part || mockVoiceState.playingPart === part,
    togglePlayPause: vi.fn(),
    restartCurrentOrSequence: vi.fn(),
    playFullSequence: vi.fn(),
    playQuestion: vi.fn(),
    restartQuestion: vi.fn(),
    playOption: vi.fn(),
    restartOption: vi.fn(),
    playExplanation: vi.fn(),
    restartExplanation: vi.fn(),
    stop: vi.fn()
  })
}));

describe('QuestionCard Light Mode Contrast', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVoiceState.isPlaying = false;
    mockVoiceState.isPaused = false;
    mockVoiceState.isThisQuestionActive = false;
    mockVoiceState.playingPart = null;
    mockVoiceState.pausedPart = null;
    mockVoiceState.activePart = null;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('provides high-contrast light mode classes when an option is selected', async () => {
    await act(async () => {
      root.render(
        React.createElement(QuestionCard, {
          question: mockQuestion,
          selectedAnswer: 3,
          onSelectAnswer: vi.fn()
        })
      );
    });

    const opt3 = container.querySelector('#btn-option-3') as HTMLButtonElement;
    expect(opt3).not.toBeNull();
    // Must include high-contrast light mode text class
    expect(opt3.className).toContain('light:text-amber-950');
    expect(opt3.className).toContain('light:bg-amber-50');
  });

  it('provides high-contrast light mode classes when option 3 is actively playing in audio', async () => {
    mockVoiceState.playingPart = 'opt3';
    mockVoiceState.activePart = 'opt3';
    mockVoiceState.isPlaying = true;
    mockVoiceState.isThisQuestionActive = true;

    await act(async () => {
      root.render(
        React.createElement(QuestionCard, {
          question: mockQuestion,
          selectedAnswer: undefined,
          onSelectAnswer: vi.fn()
        })
      );
    });

    const opt3 = container.querySelector('#btn-option-3') as HTMLButtonElement;
    expect(opt3).not.toBeNull();
    // Crucial fix: Must have high-contrast light mode text class (not bare washed-out text-amber-200)
    expect(opt3.className).toContain('light:text-amber-950');
    expect(opt3.className).toContain('light:bg-amber-50');
    expect(opt3.className).toContain('light:border-amber-500');

    // Option audio toggle button must also be high-contrast in light mode
    const optToggleBtn = container.querySelector('#btn-tts-opt-3-toggle') as HTMLButtonElement;
    expect(optToggleBtn).not.toBeNull();
    expect(optToggleBtn.className).toContain('light:bg-amber-100');
    expect(optToggleBtn.className).toContain('light:text-amber-800');
  });

  it('provides high-contrast light mode classes when option is paused during audio playback', async () => {
    mockVoiceState.pausedPart = 'opt3';
    mockVoiceState.activePart = 'opt3';
    mockVoiceState.isPaused = true;
    mockVoiceState.isThisQuestionActive = true;

    await act(async () => {
      root.render(
        React.createElement(QuestionCard, {
          question: mockQuestion,
          selectedAnswer: undefined,
          onSelectAnswer: vi.fn()
        })
      );
    });

    const opt3 = container.querySelector('#btn-option-3') as HTMLButtonElement;
    expect(opt3).not.toBeNull();
    expect(opt3.className).toContain('light:text-amber-900');
    expect(opt3.className).toContain('light:bg-amber-50/60');
  });

  it('provides high-contrast light mode classes when option is both selected and playing', async () => {
    mockVoiceState.playingPart = 'opt3';
    mockVoiceState.activePart = 'opt3';
    mockVoiceState.isPlaying = true;
    mockVoiceState.isThisQuestionActive = true;

    await act(async () => {
      root.render(
        React.createElement(QuestionCard, {
          question: mockQuestion,
          selectedAnswer: 3,
          onSelectAnswer: vi.fn()
        })
      );
    });

    const opt3 = container.querySelector('#btn-option-3') as HTMLButtonElement;
    expect(opt3).not.toBeNull();
    expect(opt3.className).toContain('light:text-amber-950');
    expect(opt3.className).toContain('light:bg-amber-100');
  });

  it('renders top card audio player controls with high-contrast light mode classes', async () => {
    mockVoiceState.isPlaying = true;
    mockVoiceState.isThisQuestionActive = true;

    await act(async () => {
      root.render(
        React.createElement(QuestionCard, {
          question: mockQuestion,
          selectedAnswer: undefined,
          onSelectAnswer: vi.fn()
        })
      );
    });

    const playPauseBtn = container.querySelector('#btn-tts-toggle-play-pause') as HTMLButtonElement;
    expect(playPauseBtn).not.toBeNull();
    expect(playPauseBtn.className).toContain('light:bg-amber-100');
    expect(playPauseBtn.className).toContain('light:text-amber-800');
  });
});
