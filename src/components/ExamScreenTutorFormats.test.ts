// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ExamScreen } from './ExamScreen';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = Array.from({ length: 35 }, (_, i) => ({
  id: 100 + i,
  subjectId: (i % 9) + 1,
  subjectName: `Materia ${(i % 9) + 1}`,
  discipline: 'all',
  question: `Domanda di prova ${i + 1}?`,
  options: ['Opzione 1', 'Opzione 2', 'Opzione 3'],
  correctAnswer: 1 as const,
  explanation: {
    rule: `Regola ${i + 1}`,
    trap: `Tranello ${i + 1}`
  }
}));

const mockPersistActiveSession = vi.fn();
const mockDismissActiveSession = vi.fn();
const mockSaveExam = vi.fn();
const mockRecordAnswer = vi.fn();

vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

vi.mock('../utils/fairRandomizer', () => ({
  generateExamQuestions: () => mockQuestions.slice(0, 30),
  generateFlashTutorQuestions: (
    allQuestions: Question[],
    _statsMap: any,
    count = 10,
    excludeIds?: Set<number>
  ) => {
    return allQuestions.filter(q => !excludeIds?.has(q.id)).slice(0, count);
  }
}));

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    filteredQuestions: mockQuestions,
    statsMap: new Map(),
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

describe('ExamScreen Flexible Tutor Formats (Flash 10, Standard 30, Endless)', () => {
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

  it('renders all three tutor format buttons on the idle tutor screen', async () => {
    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    const flashBtn = container.querySelector('#btn-start-tutor-flash');
    const standardBtn = container.querySelector('#btn-start-tutor-exam');
    const endlessBtn = container.querySelector('#btn-start-tutor-endless');

    expect(flashBtn).not.toBeNull();
    expect(standardBtn).not.toBeNull();
    expect(endlessBtn).not.toBeNull();

    expect(flashBtn?.textContent).toContain('Flash (10 Quiz)');
    expect(standardBtn?.textContent).toContain('Standard (30 Quiz)');
    expect(endlessBtn?.textContent).toContain('Continuo');
  });

  it('starts a 10-question flash session and allows extending with +10 questions', async () => {
    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    const flashBtn = container.querySelector('#btn-start-tutor-flash');
    await act(async () => {
      flashBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Check top bar shows Flash (10)
    expect(container.textContent).toContain('Flash (10)');
    expect(container.textContent).toContain('0/10');

    // Open submit modal
    const submitTopBtn = container.querySelector('#btn-submit-exam-top');
    expect(submitTopBtn).not.toBeNull();

    await act(async () => {
      submitTopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Modal title should mention Flash (10 Quiz)
    expect(container.textContent).toContain('Concludi Flash (10 Quiz)');

    // Continua (+10 Quiz) button should be present
    const extendBtn = container.querySelector('#btn-extend-flash-modal');
    expect(extendBtn).not.toBeNull();

    // Click extend button
    await act(async () => {
      extendBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Modal should close and question count should now be 20
    expect(container.querySelector('#btn-extend-flash-modal')).toBeNull();
    expect(container.textContent).toContain('0/20');
  });

  it('starts an endless stream session and displays the avionics HUD', async () => {
    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    const endlessBtn = container.querySelector('#btn-start-tutor-endless');
    await act(async () => {
      endlessBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Top bar badge should show "Continuo"
    expect(container.textContent).toContain('Continuo');
    expect(container.textContent).toContain('0 risposte');

    // Bottom bar centerContent should show "Quiz #1"
    expect(container.textContent).toContain('Quiz #1');

    // Answer Question 1
    const option1Btn = container.querySelector('#btn-option-1');
    expect(option1Btn).not.toBeNull();

    await act(async () => {
      option1Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockRecordAnswer).toHaveBeenCalledWith(100, true);

    // Open submit modal
    const submitTopBtn = container.querySelector('#btn-submit-exam-top');
    await act(async () => {
      submitTopBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Modal title should mention Concludi Flusso Continuo
    expect(container.textContent).toContain('Concludi Flusso Continuo');
    expect(container.textContent).toContain('senza alcuna penalità sui quiz non visualizzati');

    // Confirm submit to view debriefing
    const confirmBtn = container.querySelector('#btn-confirm-submit-exam');
    expect(confirmBtn).not.toBeNull();

    await act(async () => {
      confirmBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Debriefing screen
    expect(container.textContent).toContain('Tutor Continuo');
    expect(container.querySelector('#btn-restart-tutor')).not.toBeNull();
  });
});
