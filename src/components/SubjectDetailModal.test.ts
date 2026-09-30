// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SubjectDetailModal } from './SubjectDetailModal';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = [
  {
    id: 101,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Che cos è la portanza?',
    options: ['Una forza perpendicolare al vento relativo', 'Una resistenza', 'Il peso'],
    correctAnswer: 1,
    explanation: { rule: 'R1', trap: 'T1' }
  },
  {
    id: 102,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Cosa accade durante lo stallo?',
    options: ['Aumento di quota', 'Distacco della vena fluida e perdita di portanza', 'Aumento di velocità'],
    correctAnswer: 2,
    explanation: { rule: 'R2', trap: 'T2' }
  },
  {
    id: 103,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Cosa indica l efficienza aerodinamica?',
    options: ['Rapporto portanza / resistenza', 'Velocità massima', 'Superficie alare'],
    correctAnswer: 1,
    explanation: { rule: 'R3', trap: 'T3' }
  }
];

const mockStatsMap = new Map();

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    filteredQuestions: mockQuestions,
    statsMap: mockStatsMap,
    subjectsAnalytics: [
      {
        id: 2,
        name: 'Aerodinamica',
        total: 3,
        seen: 2,
        correct: 1,
        accuracy: 50
      }
    ]
  })
}));

describe('SubjectDetailModal Component', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStatsMap.clear();
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

  it('SDM-01: renders nothing when isOpen is false or subjectId is null', () => {
    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: 2,
          isOpen: false,
          onClose: vi.fn(),
          onSelectQuestion: vi.fn()
        })
      );
    });

    expect(container.innerHTML).toBe('');

    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: null,
          isOpen: true,
          onClose: vi.fn(),
          onSelectQuestion: vi.fn()
        })
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('SDM-02: renders subject stats, accuracy, and question list when open', () => {
    // Question 101: correct
    mockStatsMap.set(101, { questionId: 101, timesSeen: 2, timesWrong: 0, lastResult: 'correct' });
    // Question 102: in mistakes notebook
    mockStatsMap.set(102, { questionId: 102, timesSeen: 3, timesWrong: 2, consecutiveCorrect: 0, lastResult: 'wrong' });
    // Question 103: unseen (timesSeen = 0)

    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: 2,
          isOpen: true,
          onClose: vi.fn(),
          onSelectQuestion: vi.fn(),
          onTrainSubject: vi.fn()
        })
      );
    });

    expect(container.textContent).toContain('02');
    expect(container.textContent).toContain('Aerodinamica');
    expect(container.textContent).toContain('50%');
    expect(container.textContent).toContain('2 / 3 (67%)');
    expect(container.textContent).toContain('Allenati su questa materia');

    // All 3 questions are initially displayed
    expect(container.textContent).toContain('#101');
    expect(container.textContent).toContain('Che cos è la portanza?');
    expect(container.textContent).toContain('#102');
    expect(container.textContent).toContain('Cosa accade durante lo stallo?');
    expect(container.textContent).toContain('#103');
    expect(container.textContent).toContain('Cosa indica l efficienza');
  });

  it('SDM-03: filter chips filter the questions list accurately', () => {
    mockStatsMap.set(101, { questionId: 101, timesSeen: 2, timesWrong: 0, lastResult: 'correct' });
    mockStatsMap.set(102, { questionId: 102, timesSeen: 3, timesWrong: 2, consecutiveCorrect: 0, lastResult: 'wrong' });

    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: 2,
          isOpen: true,
          onClose: vi.fn(),
          onSelectQuestion: vi.fn()
        })
      );
    });

    // Click "Errori" chip
    const wrongChip = container.querySelector('#filter-chip-wrong') as HTMLButtonElement;
    act(() => {
      wrongChip.click();
    });

    expect(container.textContent).toContain('#102');
    expect(container.textContent).not.toContain('#101');
    expect(container.textContent).not.toContain('#103');

    // Click "Non viste" chip
    const unseenChip = container.querySelector('#filter-chip-unseen') as HTMLButtonElement;
    act(() => {
      unseenChip.click();
    });

    expect(container.textContent).toContain('#103');
    expect(container.textContent).not.toContain('#101');
    expect(container.textContent).not.toContain('#102');

    // Click "Corrette" chip
    const correctChip = container.querySelector('#filter-chip-correct') as HTMLButtonElement;
    act(() => {
      correctChip.click();
    });

    expect(container.textContent).toContain('#101');
    expect(container.textContent).not.toContain('#102');
    expect(container.textContent).not.toContain('#103');
  });

  it('SDM-04: clicking question item calls onSelectQuestion with question object', () => {
    const handleSelectQuestion = vi.fn();

    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: 2,
          isOpen: true,
          onClose: vi.fn(),
          onSelectQuestion: handleSelectQuestion
        })
      );
    });

    const q102Btn = container.querySelector('#btn-subject-q-102') as HTMLButtonElement;
    expect(q102Btn).toBeTruthy();

    act(() => {
      q102Btn.click();
    });

    expect(handleSelectQuestion).toHaveBeenCalledWith(mockQuestions[1]);
  });

  it('SDM-05: clicking train subject button calls onTrainSubject and onClose', () => {
    const handleTrainSubject = vi.fn();
    const handleClose = vi.fn();

    act(() => {
      root.render(
        React.createElement(SubjectDetailModal, {
          subjectId: 2,
          isOpen: true,
          onClose: handleClose,
          onSelectQuestion: vi.fn(),
          onTrainSubject: handleTrainSubject
        })
      );
    });

    const trainBtn = container.querySelector('#btn-train-subject') as HTMLButtonElement;
    expect(trainBtn).toBeTruthy();

    act(() => {
      trainBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleTrainSubject).toHaveBeenCalledWith(2);
  });
});
