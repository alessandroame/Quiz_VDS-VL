// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExamScreen } from './ExamScreen';
import type { Question } from '../types/quiz';
import type { InProgressSession } from '../types/database';

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

const mockQuestions: Question[] = [
  {
    id: 201,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Domanda 1 Normativa',
    options: ['Opzione 1 corretta', 'Opzione 2 errata', 'Opzione 3 errata'],
    correctAnswer: 1,
    explanation: { rule: 'Regola segreta 201', trap: 'Tranello segreto 201' }
  },
  {
    id: 202,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Domanda 2 Aerodinamica',
    options: ['Opzione 1', 'Opzione 2 corretta', 'Opzione 3'],
    correctAnswer: 2,
    explanation: { rule: 'Regola segreta 202', trap: 'Tranello segreto 202' }
  },
  {
    id: 203,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Domanda 3 Aerodinamica',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3 corretta'],
    correctAnswer: 3,
    explanation: { rule: 'Regola segreta 203', trap: 'Tranello segreto 203' }
  }
];

const mockStatsMap = new Map();
const mockSaveExam = vi.fn().mockResolvedValue(1);
const mockRecordAnswer = vi.fn().mockResolvedValue(undefined);
const mockPersistActiveSession = vi.fn().mockResolvedValue(undefined);
const mockDismissActiveSession = vi.fn().mockResolvedValue(undefined);
let mockActiveSession: InProgressSession | null = null;

vi.mock('../utils/fairRandomizer', () => ({
  generateExamQuestions: () => [...mockQuestions],
  generateFlashTutorQuestions: () => [...mockQuestions]
}));

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    filteredQuestions: mockQuestions,
    statsMap: mockStatsMap,
    saveExam: mockSaveExam,
    recordAnswer: mockRecordAnswer,
    settings: {
      examTimerMinutes: 45,
      autoAdvanceOnCorrect: true
    },
    setIsExamRunning: vi.fn(),
    registerAudioSessionContext: vi.fn(),
    activeSession: mockActiveSession,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession
  })
}));

describe('ExamScreen Blind Official Simulation Mode', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockActiveSession = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('hides immediate correctness feedback, allows revising answers, and defers recordAnswer until submission', async () => {
    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'official' }));
    });

    const startOfficialBtn = container.querySelector('#btn-start-exam');
    expect(startOfficialBtn).not.toBeNull();

    await act(async () => {
      startOfficialBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Select wrong option (#2) on Question 201 (correctAnswer is 1)
    const option2Btn = container.querySelector('#btn-option-2');
    expect(option2Btn).not.toBeNull();

    await act(async () => {
      option2Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Blind mode: zero didactic leak, zero green/red border classes, zero DB answer recording yet
    expect(container.textContent).not.toContain('Regola:');
    expect(container.textContent).not.toContain('Tranello:');
    expect(container.textContent).not.toContain('Regola segreta 201');
    expect(option2Btn?.className).not.toContain('border-emerald-500');
    expect(option2Btn?.className).not.toContain('border-rose-500');
    expect(mockRecordAnswer).not.toHaveBeenCalled();

    // Advance past the 500ms first-answer auto-advance to Question 202, then navigate back to Question 201
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(container.textContent).toContain('Domanda 2 Aerodinamica');

    const prevBtn = container.querySelector('#btn-prev-question');
    expect(prevBtn).not.toBeNull();
    await act(async () => {
      prevBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Domanda 1 Normativa');

    // Revise answer on Question 201 from wrong (#2) to right (#1) before submitting
    const option1Btn = container.querySelector('#btn-option-1');
    await act(async () => {
      option1Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Revising an already-answered question must NOT trigger auto-advance
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(container.textContent).toContain('Domanda 1 Normativa');
    expect(mockRecordAnswer).not.toHaveBeenCalled();

    // Submit exam and confirm
    const submitTopBtn = container.querySelector('#btn-submit-exam-top');
    await act(async () => {
      submitTopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const confirmBtn = container.querySelector('#btn-confirm-submit-exam');
    expect(confirmBtn).not.toBeNull();
    await act(async () => {
      confirmBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Full debriefing unlocked and deferred recordAnswer invoked with revised correct choice
    expect(container.textContent).toContain('Revisione Quesiti');
    expect(mockRecordAnswer).toHaveBeenCalledWith(201, true);
    expect(mockSaveExam).toHaveBeenCalledWith(
      expect.objectContaining({
        correctAnswers: 1,
        wrongAnswers: 2,
        snapshots: expect.arrayContaining([
          expect.objectContaining({ questionId: 201, userAnswer: 1, isCorrect: true })
        ])
      })
    );
  });

  it('records pre-pause answers upon final submission when resuming an official blind exam session', async () => {
    mockActiveSession = {
      type: 'exam',
      examMode: 'official',
      questionIds: [201, 202, 203],
      currentIndex: 1,
      answers: { 201: 1 },
      flags: {},
      secondsRemaining: 1800,
      startTime: Date.now() - 60000,
      updatedAt: Date.now()
    };

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'official' }));
    });

    // Auto-resumed directly into running state at index 1 (Question 202)
    expect(container.textContent).toContain('Domanda 2 Aerodinamica');
    expect(mockRecordAnswer).not.toHaveBeenCalled();

    // Submit resumed exam immediately
    const submitTopBtn = container.querySelector('#btn-submit-exam-top');
    await act(async () => {
      submitTopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const confirmBtn = container.querySelector('#btn-confirm-submit-exam');
    await act(async () => {
      confirmBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Pre-pause answer on Q201 must be persisted to stats on submission
    expect(mockRecordAnswer).toHaveBeenCalledWith(201, true);
  });
});
