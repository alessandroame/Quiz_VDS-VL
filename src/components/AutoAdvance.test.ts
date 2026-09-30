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
    question: 'Domanda di test 1?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 1,
    explanation: {
      rule: 'Regola 1',
      trap: 'Tranello 1'
    }
  },
  {
    id: 102,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda di test 2?',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 2,
    explanation: {
      rule: 'Regola 2',
      trap: 'Tranello 2'
    }
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
    activeSession: null,
    subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 2, seen: 1, correct: 1, wrong: 0 }]
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

describe('Visual Auto-Advance on Correct Answer Contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSettings = {
      autoAdvanceOnCorrect: true,
      immediateFeedbackInTopics: true,
      soundEnabled: false,
      hapticEnabled: false
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AA-01: ExamScreen in tutor mode auto-advances to next question after 900ms on correct answer', async () => {
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

    // Start tutor exam from idle card
    const startBtn = container.querySelector('#btn-start-tutor-exam') as HTMLButtonElement;
    expect(startBtn).not.toBeNull();
    act(() => {
      startBtn.click();
    });

    // Verify first question is rendered
    expect(container.textContent).toContain('1 / 2');

    // Answer 1 is correct for mock question
    // Find answer button 1 on QuestionCard
    const ans1Btn = container.querySelector('#btn-option-1') as HTMLButtonElement;
    expect(ans1Btn).not.toBeNull();

    await act(async () => {
      ans1Btn.click();
    });

    expect(mockRecordAnswer).toHaveBeenCalled();

    // Still on question 1 before 900ms
    expect(container.textContent).toContain('1 / 2');

    // Advance timers by 900ms
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Now advanced to question 2
    expect(container.textContent).toContain('2 / 2');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('AA-02: ExamScreen does NOT auto-advance on wrong answer, allowing student to study explanation', async () => {
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

    const startBtn = container.querySelector('#btn-start-tutor-exam') as HTMLButtonElement;
    act(() => {
      startBtn.click();
    });

    expect(container.textContent).toContain('1 / 2');

    // Answer 2 is WRONG for question 1 (correct is 1)
    const ans2Btn = container.querySelector('#btn-option-2') as HTMLButtonElement;
    expect(ans2Btn).not.toBeNull();

    await act(async () => {
      ans2Btn.click();
    });

    // Fast-forward timer by 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Must still remain on question 1
    expect(container.textContent).toContain('1 / 2');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('AA-03: ExamScreen does NOT auto-advance when autoAdvanceOnCorrect setting is false', async () => {
    mockSettings.autoAdvanceOnCorrect = false;

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

    const startBtn = container.querySelector('#btn-start-tutor-exam') as HTMLButtonElement;
    act(() => {
      startBtn.click();
    });

    expect(container.textContent).toContain('1 / 2');

    const ans1Btn = container.querySelector('#btn-option-1') as HTMLButtonElement;
    await act(async () => {
      ans1Btn.click();
    });

    // Fast-forward by 1500ms
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Must still be on question 1 because auto-advance is disabled
    expect(container.textContent).toContain('1 / 2');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('AA-04: TopicsScreen auto-advances on correct answer after 900ms', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(TopicsScreen));
    });

    // Start topic session
    const startTopicBtn = container.querySelector('#btn-topic-all-1') as HTMLButtonElement;
    expect(startTopicBtn).not.toBeNull();
    act(() => {
      startTopicBtn.click();
    });

    expect(container.textContent).toContain('1/2');

    const ans1Btn = container.querySelector('#btn-option-1') as HTMLButtonElement;
    expect(ans1Btn).not.toBeNull();

    await act(async () => {
      ans1Btn.click();
    });

    expect(mockRecordAnswer).toHaveBeenCalledWith(101, true);

    // Before 900ms
    expect(container.textContent).toContain('1/2');

    // Advance 900ms
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Advanced to 2/2
    expect(container.textContent).toContain('2/2');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('AA-05: MistakesScreen auto-advances on correct answer after 900ms during review', async () => {
    // Setup a mistake in statsMap
    const mistakeMap = new Map();
    mistakeMap.set(101, { questionId: 101, timesWrong: 1, consecutiveCorrect: 0 });
    mistakeMap.set(102, { questionId: 102, timesWrong: 1, consecutiveCorrect: 0 });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    // Mock useQuiz with mistakeMap
    const originalUseQuiz = vi.fn().mockReturnValue({
      questions: mockQuestions,
      filteredQuestions: mockQuestions,
      statsMap: mistakeMap,
      settings: mockSettings,
      recordAnswer: mockRecordAnswer,
      persistActiveSession: mockPersistActiveSession,
      dismissActiveSession: mockDismissActiveSession,
      registerAudioSessionContext: mockRegisterAudioSessionContext,
      saveExam: mockSaveExam,
      setIsExamRunning: mockSetIsExamRunning,
      activeSession: null,
      subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 2, seen: 1, correct: 1, wrong: 0 }]
    });

    const quizContext = await import('../context/QuizContext');
    vi.spyOn(quizContext, 'useQuiz').mockImplementation(originalUseQuiz as any);

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    // Start mistakes review session
    const startReviewBtn = container.querySelector('button.bg-rose-600') as HTMLButtonElement;
    expect(startReviewBtn).not.toBeNull();
    act(() => {
      startReviewBtn.click();
    });

    expect(container.textContent).toContain('1/2');

    const ans1Btn = container.querySelector('#btn-option-1') as HTMLButtonElement;
    expect(ans1Btn).not.toBeNull();

    await act(async () => {
      ans1Btn.click();
    });

    expect(mockRecordAnswer).toHaveBeenCalledWith(101, true);

    // Before 900ms
    expect(container.textContent).toContain('1/2');

    // Advance 900ms
    act(() => {
      vi.advanceTimersByTime(900);
    });

    // Advanced to 2/2
    expect(container.textContent).toContain('2/2');

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
