// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExamScreen } from './ExamScreen';
import type { Question } from '../types/quiz';

// Mock confetti
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
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 1,
    explanation: { rule: 'R1', trap: 'T1' }
  },
  {
    id: 202,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Domanda 2 Aerodinamica',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 2,
    explanation: { rule: 'R2', trap: 'T2' }
  },
  {
    id: 203,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Domanda 3 Aerodinamica',
    options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
    correctAnswer: 3,
    explanation: { rule: 'R3', trap: 'T3' }
  }
];

const mockStatsMap = new Map();
const mockSaveExam = vi.fn();
const mockRecordAnswer = vi.fn();
const mockPersistActiveSession = vi.fn();
const mockDismissActiveSession = vi.fn();

// Mock generateExamQuestions to deterministically return our 3 mock questions
vi.mock('../utils/fairRandomizer', () => ({
  generateExamQuestions: () => [...mockQuestions]
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
      autoAdvanceOnCorrect: false
    },
    setIsExamRunning: vi.fn(),
    registerAudioSessionContext: vi.fn(),
    activeSession: null,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession
  })
}));

describe('ExamScreen Debriefing & Review Filters', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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
  });

  it('filters questions in debriefing and allows instant retry of mistakes in Tutor mode', async () => {
    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    // Start tutor exam
    const startTutorBtn = container.querySelector('#btn-start-tutor-exam');
    expect(startTutorBtn).not.toBeNull();

    await act(async () => {
      startTutorBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Answer Question 1 (#201) correctly: answer 1
    const option1Btn = container.querySelector('#btn-option-1');
    await act(async () => {
      option1Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Go to next question
    const clickNext = async () => {
      const next = container.querySelector('#btn-tutor-next-question') || container.querySelector('#btn-next-question');
      expect(next).not.toBeNull();
      await act(async () => {
        next?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    };

    await clickNext();

    // Answer Question 2 (#202) incorrectly: answer 1 (correct is 2)
    const optionWrongBtn = container.querySelector('#btn-option-1');
    await act(async () => {
      optionWrongBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Go to next question
    await clickNext();

    // Flag Question 3 (#203)
    const flagBtn = container.querySelector('#btn-flag-question-bottom') || container.querySelector('#btn-flag-question');
    expect(flagBtn).not.toBeNull();
    await act(async () => {
      flagBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Submit exam
    const submitTopBtn = container.querySelector('#btn-submit-exam-top');
    await act(async () => {
      submitTopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Confirm submit in modal
    const confirmBtn = container.querySelector('#btn-confirm-submit-exam');
    expect(confirmBtn).not.toBeNull();

    await act(async () => {
      confirmBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Now in review/debriefing state
    expect(container.textContent).toContain('Revisione Quesiti');

    // Filter chips should be present
    const btnFilterAll = container.querySelector('#btn-filter-review-all');
    const btnFilterWrong = container.querySelector('#btn-filter-review-wrong');
    const btnFilterCorrect = container.querySelector('#btn-filter-review-correct');
    const btnFilterFlagged = container.querySelector('#btn-filter-review-flagged');

    expect(btnFilterAll).not.toBeNull();
    expect(btnFilterWrong).not.toBeNull();
    expect(btnFilterCorrect).not.toBeNull();
    expect(btnFilterFlagged).not.toBeNull();

    // Default filter should be "wrong" because there are wrong answers (Question 2 and unanswered Question 3)
    expect(container.querySelector('#btn-retry-mistakes-now')).not.toBeNull();

    // Click "Corretti" filter
    await act(async () => {
      btnFilterCorrect?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Domanda 1 Normativa');
    expect(container.textContent).not.toContain('Domanda 2 Aerodinamica');

    // Click "⚑ Rivedi" filter
    await act(async () => {
      btnFilterFlagged?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Domanda 3 Aerodinamica');
    expect(container.textContent).not.toContain('Domanda 1 Normativa');

    // Click "Solo Errori" filter and test "Ripassa Ora in Tutor"
    await act(async () => {
      btnFilterWrong?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const retryMistakesBtn = container.querySelector('#btn-retry-mistakes-now');
    expect(retryMistakesBtn).not.toBeNull();

    await act(async () => {
      retryMistakesBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Should now be back in running state in Tutor mode with wrong questions
    expect(container.textContent).toContain('Senza limiti');
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'exam',
        examMode: 'tutor'
      })
    );
  });
});
