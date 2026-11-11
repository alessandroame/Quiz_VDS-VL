// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ArchiveScreen } from './ArchiveScreen';
import type { Question } from '../types/quiz';
import type { QuestionStat, InProgressSession } from '../types/database';

const mockQuestions: Question[] = [
  {
    id: 2047,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Qual è la formula della resistenza?',
    options: ['R = 1/2 ρ S Cᵣ V²', 'R = 1/2 ρ S² Cᵣ V', 'R = 1/2 ρ S Cᵣ V'],
    correctAnswer: 1,
    explanation: { rule: 'Regola resistenza', trap: 'Tranello resistenza' }
  },
  {
    id: 7039,
    subjectId: 7,
    subjectName: 'Tecnica di Pilotaggio',
    discipline: 'paraglider',
    question: 'Regolazione selletta e targhetta omologazione',
    options: ['Opzione A', 'Opzione B', 'Opzione C corretta'],
    correctAnswer: 3,
    explanation: { rule: 'Targhetta selletta', trap: 'Tranello selletta' }
  }
];

const mockStatsMap = new Map<number, QuestionStat>([
  [
    2047,
    {
      questionId: 2047,
      timesSeen: 1,
      timesCorrect: 1,
      timesWrong: 0,
      consecutiveCorrect: 1,
      isBookmarked: false,
      userNote: 'Pedice r corretto'
    }
  ]
]);

const mockRecordAnswer = vi.fn().mockResolvedValue(undefined);
const mockPersistActiveSession = vi.fn().mockResolvedValue(undefined);
const mockDismissActiveSession = vi.fn().mockResolvedValue(undefined);
const mockSetIsExamRunning = vi.fn();
const mockRegisterAudioSessionContext = vi.fn();
let mockActiveSession: InProgressSession | null = null;

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    statsMap: mockStatsMap,
    subjectsAnalytics: [
      { id: 2, name: 'Aerodinamica', totalQuestions: 1, seenCount: 1, accuracy: 100 },
      { id: 7, name: 'Tecnica di Pilotaggio', totalQuestions: 1, seenCount: 0, accuracy: 0 }
    ],
    settings: {
      immediateFeedbackInTopics: true,
      autoAdvanceOnCorrect: false
    },
    recordAnswer: mockRecordAnswer,
    toggleBookmark: vi.fn(),
    updateNote: vi.fn(),
    activeSession: mockActiveSession,
    persistActiveSession: mockPersistActiveSession,
    dismissActiveSession: mockDismissActiveSession,
    setIsExamRunning: mockSetIsExamRunning,
    registerAudioSessionContext: mockRegisterAudioSessionContext
  })
}));

describe('ArchiveScreen Filtered Quiz Runner', () => {
  let container: HTMLDivElement;
  let root: Root;

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

  it('updates Inizia Quiz (N) count dynamically with filters and disables when 0 results match', async () => {
    await act(async () => {
      root.render(React.createElement(ArchiveScreen));
    });

    const startBtn = container.querySelector('#btn-archive-start-quiz') as HTMLButtonElement;
    expect(startBtn).not.toBeNull();
    expect(startBtn.textContent).toContain('Inizia Quiz (2)');
    expect(startBtn.disabled).toBe(false);

    // Switch to Status tab and filter by personal notes (only #2047 has a note)
    const statusTab = container.querySelector('#archive-tab-status');
    await act(async () => {
      statusTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const notesFilterBtn = container.querySelector('#btn-filter-notes');
    await act(async () => {
      notesFilterBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(startBtn.textContent).toContain('Inizia Quiz (1)');
    expect(startBtn.disabled).toBe(false);

    // Type non-matching search query -> 0 results -> disabled
    const searchInput = container.querySelector('#archive-search-input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(searchInput, 'zzz_inesistente');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(startBtn.textContent).toContain('Inizia Quiz (0)');
    expect(startBtn.disabled).toBe(true);
  });

  it('launches interactive quiz on filtered subset, records answers with archive source, and completes cleanly', async () => {
    await act(async () => {
      root.render(React.createElement(ArchiveScreen));
    });

    // Filter to Note (1 question: #2047)
    const statusTab = container.querySelector('#archive-tab-status');
    await act(async () => {
      statusTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const notesFilterBtn = container.querySelector('#btn-filter-notes');
    await act(async () => {
      notesFilterBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const startBtn = container.querySelector('#btn-archive-start-quiz');
    await act(async () => {
      startBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // ArchiveQuizSessionView mounted
    const sessionTitleEl = container.querySelector('#archive-quiz-session-title');
    expect(sessionTitleEl).not.toBeNull();
    expect(sessionTitleEl?.textContent).toContain('Archivio: Note');
    expect(mockPersistActiveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'archive',
        questionIds: [2047]
      })
    );

    // Select option 1 (correct)
    const option1Btn = container.querySelector('#btn-option-1');
    expect(option1Btn).not.toBeNull();
    await act(async () => {
      option1Btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockRecordAnswer).toHaveBeenCalledWith(2047, true, 1, 'archive');

    // Since there is 1 question in the filtered pool, we are on the last question -> Complete button visible
    const completeBtn = container.querySelector('#btn-archive-quiz-complete');
    expect(completeBtn).not.toBeNull();
    await act(async () => {
      completeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockDismissActiveSession).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#btn-archive-start-quiz')).not.toBeNull();
  });

  it('opens SessionConflictModal instead of overwriting an existing suspended exam session', async () => {
    mockActiveSession = {
      type: 'exam',
      examMode: 'official',
      questionIds: [2047, 7039],
      currentIndex: 0,
      answers: { 2047: 1 },
      flags: {},
      updatedAt: Date.now()
    };

    await act(async () => {
      root.render(React.createElement(ArchiveScreen));
    });

    const startBtn = container.querySelector('#btn-archive-start-quiz');
    await act(async () => {
      startBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // SessionConflictModal is rendered and active session was NOT overwritten
    expect(container.querySelector('#conflict-modal-title')?.textContent).toContain('Sessione in Sospeso');
    expect(mockPersistActiveSession).not.toHaveBeenCalled();
  });
});
