// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = [
  {
    id: 101,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda 1?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 1,
    explanation: { rule: 'R1', trap: 'T1' }
  },
  {
    id: 102,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda 2 (saltata)?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 2,
    explanation: { rule: 'R2', trap: 'T2' }
  },
  {
    id: 103,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda 3?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 3,
    explanation: { rule: 'R3', trap: 'T3' }
  },
  {
    id: 104,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda 4 (prossima non risposta)?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 1,
    explanation: { rule: 'R4', trap: 'T4' }
  }
];

const mockRecordAnswer = vi.fn();
const mockPersistActiveSession = vi.fn();
const mockDismissActiveSession = vi.fn();
const mockRegisterAudioSessionContext = vi.fn();
const mockSaveExam = vi.fn();
const mockSetIsExamRunning = vi.fn();

let mockSettings: Record<string, any> = {
  autoAdvanceOnCorrect: true,
  immediateFeedbackInTopics: true,
  soundEnabled: false,
  hapticEnabled: false
};

// Initial session: 101 answered, 102 was skipped, 103 answered, currently on 102 (index 1)
let mockActiveSession: any = {
  type: 'exam',
  examMode: 'tutor',
  questionIds: [101, 102, 103, 104],
  currentIndex: 1, // Student navigated back to Question 2
  answers: {
    101: 1,
    // 102 is skipped / not answered yet
    103: 3
  },
  flags: {},
  secondsRemaining: 2700,
  startTime: Date.now()
};

vi.mock('../utils/fairRandomizer', () => ({
  generateExamQuestions: () => mockQuestions
}));

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    filteredQuestions: mockQuestions,
    statsMap: new Map(),
    settings: mockSettings,
    recordAnswer: mockRecordAnswer,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession,
    registerAudioSessionContext: mockRegisterAudioSessionContext,
    saveExam: mockSaveExam,
    setIsExamRunning: mockSetIsExamRunning,
    activeSession: mockActiveSession,
    subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 4, seen: 2, correct: 2, wrong: 0 }]
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

describe('Smart Advance on Skipped Question Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSettings = {
      autoAdvanceOnCorrect: true,
      immediateFeedbackInTopics: true,
      soundEnabled: false,
      hapticEnabled: false
    };
    mockActiveSession = {
      type: 'exam',
      examMode: 'tutor',
      questionIds: [101, 102, 103, 104],
      currentIndex: 1, // On skipped question 102
      answers: {
        101: 1,
        103: 3
      },
      flags: {},
      secondsRemaining: 2700,
      startTime: Date.now()
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SMART-ADV-01: Auto-advance jumps over already-answered questions directly to the first unanswered question', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(ExamScreen, {
          initialMode: 'tutor',
          onNavigateHome: () => {},
          onSwitchMode: () => {}
        })
      );
    });

    // We resume at question 2 (index 1)
    expect(container.textContent).toContain('2 / 4');

    // Answer question 2 correctly (option 2)
    const opt2Btn = container.querySelector('#btn-option-2') as HTMLButtonElement;
    expect(opt2Btn).not.toBeNull();

    await act(async () => {
      opt2Btn.click();
    });

    expect(mockRecordAnswer).toHaveBeenCalledWith(102, true);

    // Before 900ms, still on question 2
    expect(container.textContent).toContain('2 / 4');

    // Fast-forward by 900ms for autoAdvance
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Must jump over question 3 (which was already answered) and land on question 4 (first unanswered)!
    expect(container.textContent).toContain('4 / 4');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('SMART-ADV-02: Clicking Successiva in QuizBottomBar jumps over already-answered questions to first unanswered question', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(ExamScreen, {
          initialMode: 'tutor',
          onNavigateHome: () => {},
          onSwitchMode: () => {}
        })
      );
    });

    expect(container.textContent).toContain('2 / 4');

    // Click next without answering or after answering
    const nextBtn = container.querySelector('#btn-next-question') as HTMLButtonElement;
    expect(nextBtn).not.toBeNull();

    act(() => {
      nextBtn.click();
    });

    // Should skip question 3 (answered) and land on question 4 (unanswered)
    expect(container.textContent).toContain('4 / 4');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('SMART-ADV-03: Keyboard ArrowRight jumps over already-answered questions to first unanswered question', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        React.createElement(ExamScreen, {
          initialMode: 'tutor',
          onNavigateHome: () => {},
          onSwitchMode: () => {}
        })
      );
    });

    expect(container.textContent).toContain('2 / 4');

    // Press ArrowRight
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });

    // Must jump to question 4 (first unanswered)
    expect(container.textContent).toContain('4 / 4');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
