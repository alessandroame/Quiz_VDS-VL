// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { voiceService } from '../services/voiceService';
import type { Question } from '../types/quiz';

const mockStop = vi.spyOn(voiceService, 'stop').mockImplementation(() => {});

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

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

vi.mock('../services/examEvaluator', () => ({
  evaluateExam: () => ({
    id: 'test-session',
    date: Date.now(),
    score: 28,
    totalQuestions: 30,
    wrongAnswers: 2,
    isPassed: true,
    durationSeconds: 120,
    examMode: 'tutor',
    snapshots: []
  })
}));

import { ExamScreen } from './ExamScreen';
import { TopicsScreen } from './TopicsScreen';
import { MistakesScreen } from './MistakesScreen';

describe('Voice Auto-Stop on Back & Quiz Termination Contracts', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockUseQuiz.mockReturnValue({
      questions: [sampleQuestion],
      filteredQuestions: [sampleQuestion],
      statsMap: new Map([[1001, { timesSeen: 1, timesWrong: 1, consecutiveCorrect: 0 }]]),
      subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 1, seen: 1, wrong: 1, masteryScore: 50 }],
      mistakesCount: 1,
      settings: {
        ttsEnabled: true,
        ttsAutoPlayQuestion: false,
        ttsAutoExplainOnMistake: true,
        immediateFeedbackInTopics: true
      },
      saveExam: vi.fn(),
      recordAnswer: vi.fn(),
      setIsExamRunning: vi.fn(),
      registerAudioSessionContext: vi.fn(),
      activeSession: null,
      persistActiveSession: vi.fn(),
      dismissActiveSession: vi.fn()
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('VOICE-STOP-01: unmounting ExamScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-02: clicking abandon (Interrompi) or submit (Concludi) in ExamScreen stops voice immediately', async () => {
    // Render ExamScreen with an active session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1001],
        currentIndex: 0,
        answers: {},
        flags: {},
        startTime: Date.now()
      }
    });

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    // Check Interrompi button
    const abandonBtn = container.querySelector('#btn-abandon-exam') as HTMLButtonElement;
    expect(abandonBtn).not.toBeNull();

    mockStop.mockClear();
    await act(async () => {
      abandonBtn.click();
    });
    expect(mockStop).toHaveBeenCalled();

    // Check Submit button
    const submitBtn = container.querySelector('#btn-submit-exam-top') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();

    mockStop.mockClear();
    await act(async () => {
      submitBtn.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-03: unmounting TopicsScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(TopicsScreen));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-04: clicking Esci or Concludi in TopicsScreen session stops voiceService', async () => {
    // Provide active topic session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'topic',
        subjectId: 1,
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(TopicsScreen));
    });

    // Look for Esci button
    const buttons = Array.from(container.querySelectorAll('button'));
    const esciBtn = buttons.find(b => b.textContent?.includes('Esci') || b.textContent?.includes('Interrompi'));
    expect(esciBtn).toBeDefined();

    mockStop.mockClear();
    await act(async () => {
      esciBtn?.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-05: unmounting MistakesScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(MistakesScreen));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-06: clicking Esci in MistakesScreen review session stops voiceService', async () => {
    // Provide active mistake review session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'mistakes',
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(MistakesScreen));
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const esciBtn = buttons.find(b => b.textContent?.includes('Esci') || b.textContent?.includes('Interrompi'));
    expect(esciBtn).toBeDefined();

    mockStop.mockClear();
    await act(async () => {
      esciBtn?.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });
});
