// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Question } from '../types/quiz';

const mockPlayExplanation = vi.fn();
const mockStopVoice = vi.fn();
const mockRecordAnswer = vi.fn();
const mockUpdateSetting = vi.fn();

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: [],
    statsMap: {},
    saveExam: vi.fn(),
    recordAnswer: mockRecordAnswer,
    settings: {
      soundEnabled: false,
      driveModeAutopilot: true,
      driveModeVoiceCommands: false,
      driveModeTutor: true,
      driveModeAutoAdvanceSeconds: 5,
      ttsAutoExplainOnMistake: true,
      driveModeIntroPlayed: true
    },
    updateSetting: mockUpdateSetting,
    dismissActiveSession: vi.fn()
  })
}));

vi.mock('../hooks/useAviationVoice', () => ({
  useAviationVoice: () => ({
    isThisQuestionActive: false,
    isPlaying: false,
    isPaused: false,
    isSequencePlaying: false,
    isPartPlaying: () => false,
    isDriveIntroPlaying: false,
    togglePlayPause: vi.fn(),
    restartCurrentOrSequence: vi.fn(),
    playFullSequence: vi.fn(),
    playExplanation: mockPlayExplanation,
    playDriveIntro: vi.fn(),
    stopDriveIntro: vi.fn(),
    stop: mockStopVoice,
    pause: vi.fn(),
    resume: vi.fn()
  })
}));

vi.mock('../hooks/useWakeLock', () => ({
  useWakeLock: () => ({ isActive: true, isSupported: true, request: vi.fn(), release: vi.fn() })
}));

vi.mock('../hooks/useDriveVoiceCommands', () => ({
  useDriveVoiceCommands: () => ({
    isSupported: true,
    isListening: false,
    isReceivingSpeech: false,
    interimTranscript: '',
    lastTranscript: '',
    error: null,
    start: vi.fn(),
    stop: vi.fn()
  })
}));

vi.mock('../utils/haptics', () => ({
  triggerHapticFeedback: vi.fn()
}));

vi.mock('../utils/audio', () => ({
  soundFX: { playClick: vi.fn(), playCorrect: vi.fn(), playWrong: vi.fn() },
  shouldSuspendVoiceMic: () => false
}));

vi.mock('./VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveModeScreen } from './DriveModeScreen';

const sampleQuestion: Question = {
  id: 1001,
  subjectId: 1,
  subjectName: 'Normativa',
  discipline: 'all',
  question: 'Chi può volare in VDS?',
  options: ['Opzione A errata', 'Opzione B corretta', 'Opzione C errata'],
  correctAnswer: 2,
  explanation: {
    rule: 'Regola di volo',
    trap: 'Tranello comune'
  }
};

describe('DriveModeScreen - Tutor Mode Explanation Playback Contract', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('DRIVE-TUTOR-01: in modalità tutor, se la risposta è CORRETTA, NON avvia la riproduzione vocale della spiegazione', async () => {
    const handleAnswer = vi.fn();

    act(() => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: () => {},
          sessionContext: {
            questions: [sampleQuestion],
            currentIndex: 0,
            answers: {},
            flags: {},
            onAnswer: handleAnswer,
            onToggleFlag: () => {},
            onNavigateIndex: () => {},
            isTutor: true
          }
        })
      );
    });

    // Trova e clicca l'opzione 2 (quella corretta)
    const opt2Button = container.querySelector('#btn-drive-opt-2') as HTMLButtonElement;
    expect(opt2Button).not.toBeNull();

    await act(async () => {
      opt2Button.click();
      vi.advanceTimersByTime(500);
    });

    expect(handleAnswer).toHaveBeenCalledWith(1001, 2);
    // Non deve MAI aver chiamato playExplanation
    expect(mockPlayExplanation).not.toHaveBeenCalled();
  });

  it('DRIVE-TUTOR-02: in modalità tutor, se la risposta è ERRATA, AVVIA la riproduzione vocale della spiegazione (risposta esatta, regola e tranello)', async () => {
    const handleAnswer = vi.fn();

    act(() => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: () => {},
          sessionContext: {
            questions: [sampleQuestion],
            currentIndex: 0,
            answers: {},
            flags: {},
            onAnswer: handleAnswer,
            onToggleFlag: () => {},
            onNavigateIndex: () => {},
            isTutor: true
          }
        })
      );
    });

    // Trova e clicca l'opzione 1 (quella ERRATA, la corretta è 2)
    const opt1Button = container.querySelector('#btn-drive-opt-1') as HTMLButtonElement;
    expect(opt1Button).not.toBeNull();

    await act(async () => {
      opt1Button.click();
    });

    // Prima del timeout di 300ms playExplanation non è ancora chiamata
    expect(mockPlayExplanation).not.toHaveBeenCalled();

    // Avanza i timer di 400ms per attivare il timeout di lettura spiegazione
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(handleAnswer).toHaveBeenCalledWith(1001, 1);
    // Poiché errata, playExplanation DEVE essere stata chiamata
    expect(mockPlayExplanation).toHaveBeenCalledTimes(1);
  });
});
