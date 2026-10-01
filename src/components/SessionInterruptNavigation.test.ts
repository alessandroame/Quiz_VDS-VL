// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = [
  {
    id: 201,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Qual è la quota massima consentita?',
    options: ['500 piedi', '1000 piedi', '1500 piedi'],
    correctAnswer: 2,
    explanation: {
      rule: 'Normativa VDS AeCI',
      trap: 'Non confondere piedi con metri'
    }
  },
  {
    id: 202,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Quale distanza minima dalle nubi?',
    options: ['150m orizzontale', '1.5km orizzontale', '300m orizzontale'],
    correctAnswer: 2,
    explanation: {
      rule: 'VFR visibilità e distanze',
      trap: 'Ricorda il fattore 1.5km'
    }
  }
];

const mockRecordAnswer = vi.fn().mockResolvedValue(undefined);
const mockPersistActiveSession = vi.fn().mockResolvedValue(undefined);
const mockDismissActiveSession = vi.fn().mockResolvedValue(undefined);
const mockRegisterAudioSessionContext = vi.fn();
const mockSaveExam = vi.fn().mockResolvedValue(undefined);
const mockSetIsExamRunning = vi.fn();

let mockActiveSession: any = null;

vi.mock('../utils/fairRandomizer', () => ({
  generateExamQuestions: () => mockQuestions
}));

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    filteredQuestions: mockQuestions,
    statsMap: new Map([[201, { timesWrong: 1, consecutiveCorrect: 0, lastSeenAt: Date.now(), isMistake: true }]]),
    mistakesCount: 1,
    settings: {
      autoAdvanceOnCorrect: false,
      soundEnabled: false,
      hapticEnabled: false
    },
    recordAnswer: mockRecordAnswer,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession,
    registerAudioSessionContext: mockRegisterAudioSessionContext,
    saveExam: mockSaveExam,
    setIsExamRunning: mockSetIsExamRunning,
    activeSession: mockActiveSession,
    subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 2, seen: 1, correct: 1, wrong: 1 }]
  })
}));

vi.mock('../services/voiceService', () => ({
  voiceService: {
    stop: vi.fn(),
    speak: vi.fn(),
    setVoice: vi.fn(),
    setPlaybackRate: vi.fn(),
    getState: vi.fn().mockReturnValue({ isPlaying: false, isPaused: false, currentPart: null, activeQuestionId: null }),
    subscribe: vi.fn().mockReturnValue(() => {})
  }
}));

vi.mock('../utils/soundEffects', () => ({
  soundFX: {
    playClick: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn()
  }
}));

vi.mock('../utils/haptics', () => ({
  triggerHapticFeedback: vi.fn()
}));

import { ExamScreen } from './ExamScreen';
import { TopicsScreen } from './TopicsScreen';
import { MistakesScreen } from './MistakesScreen';

describe('Single-Click Session Pause & Interruption Navigation Contract', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveSession = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('ExamScreen pauses on single click of Metti in Pausa and navigates home immediately', async () => {
    const mockNavigateHome = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(ExamScreen, {
          initialMode: 'tutor',
          onNavigateHome: mockNavigateHome
        })
      );
    });

    // Start tutor exam
    const startBtn = container.querySelector('#btn-start-tutor-exam') as HTMLButtonElement;
    expect(startBtn).not.toBeNull();
    await act(async () => {
      startBtn.click();
    });

    // Interrupt button should be visible in running exam
    const interruptBtn = container.querySelector('#btn-abandon-exam') as HTMLButtonElement;
    expect(interruptBtn).not.toBeNull();

    await act(async () => {
      interruptBtn.click();
    });

    // Dialog should be open
    const pauseBtn = container.querySelector('#btn-interrupt-pause') as HTMLButtonElement;
    expect(pauseBtn).not.toBeNull();

    // Click Metti in Pausa ONCE
    await act(async () => {
      pauseBtn.click();
    });

    // Verify onNavigateHome was invoked on the very first click
    expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'exam',
        isPaused: true
      })
    );
    expect(mockSetIsExamRunning).toHaveBeenCalledWith(false);
  });

  it('ExamScreen terminates on single click of Termina ed Elimina and navigates home immediately', async () => {
    const mockNavigateHome = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(ExamScreen, {
          initialMode: 'tutor',
          onNavigateHome: mockNavigateHome
        })
      );
    });

    // Start exam
    const startBtn = container.querySelector('#btn-start-tutor-exam') as HTMLButtonElement;
    await act(async () => {
      startBtn.click();
    });

    // Open interrupt dialog
    const interruptBtn = container.querySelector('#btn-abandon-exam') as HTMLButtonElement;
    await act(async () => {
      interruptBtn.click();
    });

    const terminateBtn = container.querySelector('#btn-interrupt-terminate') as HTMLButtonElement;
    expect(terminateBtn).not.toBeNull();

    // Click Termina ed Elimina ONCE
    await act(async () => {
      terminateBtn.click();
    });

    // Verify dismissActiveSession and onNavigateHome are invoked on first click
    expect(mockDismissActiveSession).toHaveBeenCalledTimes(1);
    expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    expect(mockSetIsExamRunning).toHaveBeenCalledWith(false);
  });

  it('TopicsScreen pauses on single click and calls onNavigateHome', async () => {
    const mockNavigateHome = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(TopicsScreen, {
          onNavigateHome: mockNavigateHome
        })
      );
    });

    // Start topic session
    const startTopicBtn = container.querySelector('#btn-topic-all-1') as HTMLButtonElement;
    expect(startTopicBtn).not.toBeNull();
    await act(async () => {
      startTopicBtn.click();
    });

    // Open interrupt dialog
    const interruptBtn = container.querySelector('#btn-topics-interrupt') as HTMLButtonElement;
    expect(interruptBtn).not.toBeNull();
    await act(async () => {
      interruptBtn.click();
    });

    const pauseBtn = container.querySelector('#btn-interrupt-pause') as HTMLButtonElement;
    expect(pauseBtn).not.toBeNull();

    await act(async () => {
      pauseBtn.click();
    });

    expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'topic',
        isPaused: true
      })
    );
  });

  it('MistakesScreen pauses on single click and calls onNavigateHome', async () => {
    const mockNavigateHome = vi.fn();

    await act(async () => {
      root.render(
        React.createElement(MistakesScreen, {
          onNavigateHome: mockNavigateHome
        })
      );
    });

    // Start mistakes review
    const startReviewBtn = container.querySelector('#btn-start-mistakes-review') as HTMLButtonElement;
    expect(startReviewBtn).not.toBeNull();
    await act(async () => {
      startReviewBtn.click();
    });

    // Open interrupt dialog
    const interruptBtn = container.querySelector('#btn-mistakes-interrupt') as HTMLButtonElement;
    expect(interruptBtn).not.toBeNull();
    await act(async () => {
      interruptBtn.click();
    });

    const pauseBtn = container.querySelector('#btn-interrupt-pause') as HTMLButtonElement;
    expect(pauseBtn).not.toBeNull();

    await act(async () => {
      pauseBtn.click();
    });

    expect(mockNavigateHome).toHaveBeenCalledTimes(1);
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mistakes',
        isPaused: true
      })
    );
  });
});
