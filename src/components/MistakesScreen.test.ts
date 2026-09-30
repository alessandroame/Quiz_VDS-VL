// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MistakesScreen } from './MistakesScreen';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = [
  {
    id: 101,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Qual è la quota limite VDS?',
    options: ['500 ft', '1000 ft', '1500 ft'],
    correctAnswer: 1,
    explanation: { rule: 'Regola 1', trap: 'Tranello 1' }
  },
  {
    id: 102,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Che cos è la portanza?',
    options: ['Una forza', 'Una resistenza', 'Un peso'],
    correctAnswer: 1,
    explanation: { rule: 'Regola 2', trap: 'Tranello 2' }
  },
  {
    id: 103,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Cosa causa lo stallo aerodinamico?',
    options: ['Angolo di incidenza critico', 'Velocità eccessiva', 'Troppa quota'],
    correctAnswer: 1,
    explanation: { rule: 'Regola 3', trap: 'Tranello 3' }
  }
];

let mockStatsMap = new Map();
let mockActiveSession: any = null;
const mockPersistActiveSession = vi.fn();
const mockDismissActiveSession = vi.fn();
const mockRecordAnswer = vi.fn();

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    statsMap: mockStatsMap,
    mistakesCount: mockStatsMap.size,
    recordAnswer: mockRecordAnswer,
    settings: {
      ttsEnabled: false,
      autoAdvanceOnCorrect: true
    },
    registerAudioSessionContext: vi.fn(),
    activeSession: mockActiveSession,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession,
    toggleBookmark: vi.fn(),
    saveNote: vi.fn()
  })
}));

describe('MistakesScreen Component', () => {
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
    mockActiveSession = null;
  });

  it('renders empty state when there are no mistakes', () => {
    mockStatsMap = new Map();

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    expect(container.textContent).toContain('Nessun errore da ripassare');
  });

  it('renders mistake list with error counts and consecutive correct indicators', () => {
    mockStatsMap = new Map([
      [101, { questionId: 101, timesWrong: 3, consecutiveCorrect: 1, userNote: 'Ricordare limite' }],
      [102, { questionId: 102, timesWrong: 1, consecutiveCorrect: 0 }]
    ]);

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    expect(container.textContent).toContain('Quaderno Errori');
    expect(container.textContent).toContain('Qual è la quota limite VDS?');
    expect(container.textContent).toContain('Che cos è la portanza?');
    expect(container.textContent).toContain('3 err');
    expect(container.textContent).toContain('1/2 ok');
    expect(container.textContent).toContain('Nota: "Ricordare limite"');
  });

  it('renders subject filter chips and filters the displayed questions', () => {
    mockStatsMap = new Map([
      [101, { questionId: 101, timesWrong: 2, consecutiveCorrect: 0 }],
      [102, { questionId: 102, timesWrong: 1, consecutiveCorrect: 1 }],
      [103, { questionId: 103, timesWrong: 3, consecutiveCorrect: 0 }]
    ]);

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    // Subject chips should be present: Tutte (3), Normativa (1), Aerodinamica (2)
    const btnAll = container.querySelector('#btn-mistakes-filter-all');
    const btnNormativa = container.querySelector('#btn-mistakes-filter-1');
    const btnAerodinamica = container.querySelector('#btn-mistakes-filter-2');

    expect(btnAll).not.toBeNull();
    expect(btnNormativa).not.toBeNull();
    expect(btnAerodinamica).not.toBeNull();

    expect(btnAll?.textContent).toContain('Tutte (3)');
    expect(btnNormativa?.textContent).toContain('Normativa');
    expect(btnAerodinamica?.textContent).toContain('Aerodinamica');

    // Click Aerodinamica filter chip
    act(() => {
      btnAerodinamica?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Normativa question (#101) should not be visible in filtered list
    expect(container.querySelector('#mistake-card-101')).toBeNull();
    expect(container.querySelector('#mistake-card-102')).not.toBeNull();
    expect(container.querySelector('#mistake-card-103')).not.toBeNull();

    // Review button should mention Aerodinamica
    const reviewBtn = container.querySelector('#btn-start-mistakes-review');
    expect(reviewBtn?.textContent).toContain('Aerodinamica');
    expect(reviewBtn?.textContent).toContain('2 Errori');
  });

  it('opens QuestionDetailModal when clicking on a mistake card', () => {
    mockStatsMap = new Map([
      [101, { questionId: 101, timesWrong: 2, consecutiveCorrect: 0 }]
    ]);

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    const mistakeCard = container.querySelector('#mistake-card-101');
    expect(mistakeCard).not.toBeNull();

    // Dialog should not be open initially
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    // Click the card
    act(() => {
      mistakeCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Dialog should now be open
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Regola 1');
    expect(dialog?.textContent).toContain('Tranello 1');
  });

  it('starts review session when clicking the review button', () => {
    mockStatsMap = new Map([
      [101, { questionId: 101, timesWrong: 1, consecutiveCorrect: 0 }]
    ]);

    act(() => {
      root.render(React.createElement(MistakesScreen));
    });

    const reviewBtn = container.querySelector('#btn-start-mistakes-review');
    expect(reviewBtn).not.toBeNull();

    act(() => {
      reviewBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Should switch to review mode and persist active session
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mistakes',
        questionIds: [101]
      })
    );
    expect(container.textContent).toContain('Ripasso Errori');
    expect(container.textContent).toContain('Qual è la quota limite VDS?');
  });
});
