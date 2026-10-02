// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Question } from '../types/quiz';

const mockPlayExplanation = vi.fn();
const mockPlayQuestion = vi.fn();
const mockPlayOption = vi.fn();
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
      ttsAutoExplainOnMistake: true,
      driveModeIntroPlayed: true,
      audioOfflinePromptDismissed: true
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

  it('DRIVE-SELECTIVE-01: toccare il pulsante audio della domanda avvia la lettura isolata della domanda', async () => {
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
            onNavigateIndex: vi.fn()
          }
        })
      );
    });

    const questionAudioBtn = container.querySelector('#btn-drive-play-question') as HTMLButtonElement;
    expect(questionAudioBtn).not.toBeNull();

    await act(async () => {
      questionAudioBtn.click();
    });

    expect(mockPlayQuestion).toHaveBeenCalledTimes(1);
  });

  it('DRIVE-SELECTIVE-02: toccare il pulsante audio dell\'opzione 1 avvia solo l\'opzione 1 e NON sottomette la risposta', async () => {
    const handleAnswer = vi.fn();

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
            onAnswer: handleAnswer,
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn()
          }
        })
      );
    });

    const optAudioBtn = container.querySelector('#btn-drive-opt-audio-1') as HTMLButtonElement;
    expect(optAudioBtn).not.toBeNull();

    await act(async () => {
      optAudioBtn.click();
    });

    // Deve aver chiamato playOption(1)
    expect(mockPlayOption).toHaveBeenCalledWith(1);
    // NON deve aver selezionato/sottomesso la risposta
    expect(handleAnswer).not.toHaveBeenCalled();
  });

  it('DRIVE-SELECTIVE-03: le scorciatoie da tastiera Q e Alt+2 avviano la lettura isolata', async () => {
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
            onNavigateIndex: vi.fn()
          }
        })
      );
    });

    // Tasto Q per domanda
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
    });
    expect(mockPlayQuestion).toHaveBeenCalled();

    // Tasto Alt+2 per opzione 2
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', altKey: true }));
    });
    expect(mockPlayOption).toHaveBeenCalledWith(2);
  });

  it('DRIVE-VOICE-STOP-01: submitting an exam calls stopVoice and invokes sessionContext.onSubmitExam', async () => {
    const handleSubmit = vi.fn();
    await act(async () => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: vi.fn(),
          sessionContext: {
            questions: [sampleQuestion],
            currentIndex: 0,
            answers: { 1001: 2 },
            flags: {},
            onAnswer: vi.fn(),
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn(),
            isExam: true,
            onSubmitExam: handleSubmit
          }
        })
      );
    });

    const submitBtn = container.querySelector('#btn-drive-submit') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();

    mockStopVoice.mockClear();
    await act(async () => {
      submitBtn.click();
    });

    expect(mockStopVoice).toHaveBeenCalled();
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('DRIVE-VOICE-STOP-02: exiting hands-free view immediately returns to normal quiz, stops voice, and does not abandon exam session', async () => {
    const handleAbandon = vi.fn();
    const handleClose = vi.fn();
    await act(async () => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: handleClose,
          sessionContext: {
            questions: [sampleQuestion],
            currentIndex: 0,
            answers: {},
            flags: {},
            onAnswer: vi.fn(),
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn(),
            isExam: true,
            onAbandonSession: handleAbandon
          }
        })
      );
    });

    // Find and click exit button ("Vista Normale")
    const exitBtn = container.querySelector('#btn-drive-exit') as HTMLButtonElement;
    expect(exitBtn).not.toBeNull();

    mockStopVoice.mockClear();
    await act(async () => {
      exitBtn.click();
    });

    // Exiting hands-free mode stops voice and triggers close without opening any abandon modal
    expect(mockStopVoice).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
    expect(handleAbandon).not.toHaveBeenCalled();
    expect(container.querySelector('#btn-drive-confirm-abandon')).toBeNull();
  });

  it('DRIVE-UNHURRIED-01: does NOT start a countdown or auto-advance when thinking (unhurried study)', async () => {
    const handleAnswer = vi.fn();
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
            onAnswer: handleAnswer,
            onToggleFlag: vi.fn(),
            onNavigateIndex: vi.fn()
          }
        })
      );
    });

    // Advance timers by 10 seconds (way past old 3s/5s/8s limits)
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    // Must NOT have answered or auto-advanced
    expect(handleAnswer).not.toHaveBeenCalled();
    expect(mockPlayExplanation).not.toHaveBeenCalled();
  });

  it('DRIVE-COOLDOWN-01: prevents accidental answer clicks during the 250ms transition cooldown when switching to a new question', async () => {
    const handleAnswer = vi.fn();
    const question1: Question = { ...sampleQuestion, id: 1001 };
    const question2: Question = { ...sampleQuestion, id: 1002, question: 'Seconda domanda di prova' };

    const handleNavigate = vi.fn();

    const renderWithIndex = (idx: number) => {
      root.render(
        React.createElement(DriveModeScreen, {
          isOpen: true,
          onClose: vi.fn(),
          sessionContext: {
            questions: [question1, question2],
            currentIndex: idx,
            answers: {},
            flags: {},
            onAnswer: handleAnswer,
            onToggleFlag: vi.fn(),
            onNavigateIndex: handleNavigate,
            isTutor: true
          }
        })
      );
    };

    await act(async () => {
      renderWithIndex(0);
    });

    // Transition to question 2
    await act(async () => {
      renderWithIndex(1);
    });

    // Click immediately within the 250ms cooldown window on Question 2
    const opt2Btn = container.querySelector('#btn-drive-opt-2') as HTMLButtonElement;
    expect(opt2Btn).not.toBeNull();

    await act(async () => {
      opt2Btn.click();
    });

    // Click was ignored because cooldown is active
    expect(handleAnswer).not.toHaveBeenCalled();

    // Advance past the 250ms cooldown
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Click again after cooldown expired
    await act(async () => {
      opt2Btn.click();
    });

    // Answer is now successfully submitted
    expect(handleAnswer).toHaveBeenCalledWith(1002, 2);
  });
});

