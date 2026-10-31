// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Question } from '../../types/quiz';

const mockPlayExplanation = vi.fn();
const mockPlayQuestion = vi.fn();
const mockPlayOption = vi.fn();
const mockStopVoice = vi.fn();
const mockRecordAnswer = vi.fn();
const mockUpdateSetting = vi.fn();
const mockToggleBookmark = vi.fn();

let mockVoiceAliases: Record<string, any> = {};

vi.mock('../../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: [],
    statsMap: new Map(),
    saveExam: vi.fn(),
    recordAnswer: mockRecordAnswer,
    toggleBookmark: mockToggleBookmark,
    settings: {
      soundEnabled: false,
      driveModeAutopilot: false,
      driveModeVoiceCommands: true,
      driveModeAudioOutput: 'headphones',
      driveModeTutor: true,
      ttsAutoExplainOnMistake: false,
      driveModeIntroPlayed: true,
      audioOfflinePromptDismissed: true,
      voiceAdaptiveAliases: mockVoiceAliases
    },
    updateSetting: (key: string, val: any) => {
      if (key === 'voiceAdaptiveAliases') {
        mockVoiceAliases = val;
      }
      mockUpdateSetting(key, val);
    },
    dismissActiveSession: vi.fn()
  })
}));

vi.mock('../../hooks/useAviationVoice', () => ({
  useAviationVoice: () => ({
    isThisQuestionActive: false,
    isPlaying: false,
    isPaused: false,
    isSequencePlaying: false,
    isPartPlaying: () => false,
    isDriveIntroPlaying: false,
    activePart: null,
    togglePlayPause: vi.fn(),
    restartCurrentOrSequence: vi.fn(),
    playFullSequence: vi.fn(),
    playQuestion: mockPlayQuestion,
    playOption: mockPlayOption,
    playExplanation: mockPlayExplanation,
    playDriveIntro: vi.fn(),
    stopDriveIntro: vi.fn(),
    stop: mockStopVoice,
    pause: vi.fn(),
    resume: vi.fn()
  })
}));

vi.mock('../../hooks/useWakeLock', () => ({
  useWakeLock: () => ({ isActive: true, isSupported: true, request: vi.fn(), release: vi.fn() })
}));

vi.mock('../../utils/haptics', () => ({
  triggerHapticFeedback: vi.fn()
}));

vi.mock('../../utils/audio', () => ({
  soundFX: { playClick: vi.fn(), playCorrect: vi.fn(), playWrong: vi.fn() },
  shouldSuspendVoiceMic: () => false
}));

vi.mock('../VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveModeScreen } from '../DriveModeScreen';

class MockSpeechRecognition {
  static latestInstance: MockSpeechRecognition | null = null;
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;
  onsoundstart: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  onsoundend: (() => void) | null = null;
  onaudioend: (() => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    MockSpeechRecognition.latestInstance = this;
  }

  start = vi.fn(() => {
    this.onstart?.();
  });

  stop = vi.fn(() => {
    this.onend?.();
  });

  abort = vi.fn(() => {
    this.onend?.();
  });
}

const sampleQuestion: Question = {
  id: 7006,
  subjectId: 7,
  subjectName: 'Tecnica di Pilotaggio',
  discipline: 'all',
  question: 'Come ottenere il minor tasso di caduta possibile?',
  options: [
    "Volando in linea retta ed all'incidenza massima consentita.",
    'Volando comunque al regime di massima efficienza in aria calma.',
    'Volando in linea retta ad una incidenza compresa tra massima efficienza e quella di stallo.'
  ],
  correctAnswer: 3,
  explanation: {
    rule: 'Il minimo tasso di caduta si ottiene tra massima efficienza e stallo.',
    trap: 'Confondere massima efficienza con minimo tasso di caduta.'
  }
};

describe('DriveModeScreen + useDriveVoiceCommands Progressive Refinement Integration', () => {
  let container: HTMLDivElement;
  let root: any;
  let originalSpeechRecognition: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockVoiceAliases = {};
    MockSpeechRecognition.latestInstance = null;
    originalSpeechRecognition = (window as any).SpeechRecognition;
    (window as any).SpeechRecognition = MockSpeechRecognition;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    if (originalSpeechRecognition) {
      (window as any).SpeechRecognition = originalSpeechRecognition;
    } else {
      delete (window as any).SpeechRecognition;
    }
    vi.useRealTimers();
  });

  it('DRIVE-REFINE-E2E-01: displays live refining transcript + intent preview without premature firing, then dispatches refined command once settled', async () => {
    await act(async () => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: vi.fn(),
          sessionContext: {
            questions: [sampleQuestion],
            currentIndex: 0,
            answers: {},
            flags: {},
            onAnswer: vi.fn(),
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn(),
            isTutor: true
          }
        })
      );
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const rec = MockSpeechRecognition.latestInstance;
    expect(rec).not.toBeNull();
    expect(rec?.maxAlternatives).toBe(5);

    // Step 1: interim "ripeti" arrives -> must NOT trigger repeat yet, shows preview badge
    await act(async () => {
      rec?.onresult?.({
        results: [Object.assign([{ transcript: 'ripeti' }], { isFinal: false })]
      });
    });

    expect(mockPlayOption).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="voice-live-refinement"]')?.textContent).toContain('ripeti');
    expect(container.querySelector('[data-testid="voice-pending-intent"]')?.textContent).toContain('Ripeti');

    // Step 2: 180ms later interim refines to "ripeti la due" -> preview updates to "Ripeti Due"
    await act(async () => {
      vi.advanceTimersByTime(180);
      rec?.onresult?.({
        results: [Object.assign([{ transcript: 'ripeti la due' }], { isFinal: false })]
      });
    });

    expect(mockPlayOption).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="voice-pending-intent"]')?.textContent).toContain('Ripeti Due');

    // Step 3: speech settles after 340ms -> executes only playOption(2)
    await act(async () => {
      vi.advanceTimersByTime(360);
    });

    expect(mockPlayOption).toHaveBeenCalledTimes(1);
    expect(mockPlayOption).toHaveBeenCalledWith(2);
  });

  it('DRIVE-REFINE-E2E-02: selects answer by spoken option keyword ("quella di stallo") and passively learns unrecognized user pronunciations on manual tap', async () => {
    const handleAnswer = vi.fn();
    const secondQuestion: Question = {
      ...sampleQuestion,
      id: 7007
    };

    const renderScreen = (currentIndex: number, answers: Record<number, 1 | 2 | 3> = {}) =>
      React.createElement(DriveModeScreen, {
        isOpen: true,
        onClose: vi.fn(),
        sessionContext: {
          questions: [sampleQuestion, secondQuestion],
          currentIndex,
          answers,
          flags: {},
          onAnswer: handleAnswer,
          onToggleFlag: vi.fn(),
          onNavigateIndex: vi.fn(),
          isTutor: true
        }
      });

    await act(async () => {
      root.render(renderScreen(0));
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const rec = MockSpeechRecognition.latestInstance;
    expect(rec).not.toBeNull();

    // Part A: Unrecognized distorted pronunciation "dura" followed within 4.5s by manual tap on Option 2
    await act(async () => {
      rec?.onresult?.({
        results: [Object.assign([{ transcript: 'dura' }], { isFinal: true })]
      });
    });

    expect(container.textContent).toContain('non riconosciuto');

    const opt2Btn = container.querySelector('#btn-drive-opt-2') as HTMLButtonElement;
    await act(async () => {
      opt2Btn.click();
    });

    expect(handleAnswer).toHaveBeenCalledWith(7006, 2);
    expect(mockUpdateSetting).toHaveBeenCalledWith(
      'voiceAdaptiveAliases',
      expect.objectContaining({
        dura: expect.objectContaining({
          phrase: 'dura',
          command: 'opt2',
          occurrences: 1
        })
      })
    );

    // Part B: Navigate to Question 2 (id 7007) via #btn-drive-next and answer by speaking distinctive option keywords
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    const nextBtn = container.querySelector('#btn-drive-next') as HTMLButtonElement;
    await act(async () => {
      nextBtn.click();
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    const activeRec = MockSpeechRecognition.latestInstance;
    await act(async () => {
      activeRec?.onresult?.({
        results: [
          Object.assign([{ transcript: 'dura' }], { isFinal: true }),
          Object.assign([{ transcript: 'quella di stallo' }], { isFinal: true })
        ]
      });
    });
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(handleAnswer).toHaveBeenCalledWith(7007, 3);
  });

  it('DRIVE-REFINE-E2E-03: reliably selects Option 2 without recognition errors when mobile STT writes "due" in letters followed by no-match or empty final', async () => {
    const handleAnswer = vi.fn();
    const secondQuestion: Question = {
      ...sampleQuestion,
      id: 7007
    };

    await act(async () => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: vi.fn(),
          sessionContext: {
            questions: [sampleQuestion, secondQuestion],
            currentIndex: 0,
            answers: {},
            flags: {},
            onAnswer: handleAnswer,
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn(),
            isTutor: true
          }
        })
      );
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const rec = MockSpeechRecognition.latestInstance;
    expect(rec).not.toBeNull();

    // Question 1: mobile STT writes "due" in letters (interim) and then emits transient 'no-match'
    await act(async () => {
      rec?.onresult?.({
        results: [Object.assign([{ transcript: 'due' }], { isFinal: false })]
      });
    });
    expect(container.querySelector('[data-testid="voice-live-refinement"]')?.textContent).toContain('due');

    await act(async () => {
      vi.advanceTimersByTime(140);
      rec?.onerror?.({ error: 'no-match' });
    });

    expect(handleAnswer).toHaveBeenCalledWith(7006, 2);
    expect(container.textContent).not.toContain('non riconosciuto');
    expect(container.textContent).not.toContain('Mic:');

    // Navigate to Question 2 and speak "il due" in letters followed by empty finalization packet
    const nextBtn = container.querySelector('#btn-drive-next') as HTMLButtonElement;
    await act(async () => {
      nextBtn.click();
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    const activeRec = MockSpeechRecognition.latestInstance;
    await act(async () => {
      activeRec?.onresult?.({
        results: [
          Object.assign([{ transcript: 'due' }], { isFinal: true }),
          Object.assign([{ transcript: 'il due' }], { isFinal: false })
        ]
      });
      vi.advanceTimersByTime(120);
      activeRec?.onresult?.({
        results: [
          Object.assign([{ transcript: 'due' }], { isFinal: true }),
          Object.assign([{ transcript: '' }], { isFinal: true })
        ]
      });
    });

    expect(handleAnswer).toHaveBeenCalledWith(7007, 2);
    expect(container.textContent).not.toContain('non riconosciuto');
    expect(container.textContent).not.toContain('Mic:');
  });
});
