// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StatsScreen } from './StatsScreen';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = [
  {
    id: 101,
    subjectId: 1,
    subjectName: 'Normativa',
    discipline: 'all',
    question: 'Qual è il limite di quota VDS?',
    options: ['500 piedi', '1000 piedi', '1500 piedi'],
    correctAnswer: 1,
    explanation: { rule: 'R1', trap: 'T1' }
  },
  {
    id: 102,
    subjectId: 2,
    subjectName: 'Aerodinamica',
    discipline: 'all',
    question: 'Che cos è la portanza?',
    options: ['Forza', 'Resistenza', 'Peso'],
    correctAnswer: 1,
    explanation: { rule: 'R2', trap: 'T2' }
  }
];

const mockStatsMap = new Map([
  [101, { questionId: 101, timesSeen: 5, timesWrong: 3, consecutiveCorrect: 0, lastResult: 'wrong' }],
  [102, { questionId: 102, timesSeen: 2, timesWrong: 0, consecutiveCorrect: 2, lastResult: 'correct' }]
]);

let mockQuizSessions: any[] = [
  {
    id: 1,
    date: Date.now() - 3600000,
    mode: 'official',
    durationSeconds: 1200,
    totalQuestions: 30,
    correctAnswers: 28,
    wrongAnswers: 2,
    isPassed: true
  }
];

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    questions: mockQuestions,
    filteredQuestions: mockQuestions,
    statsMap: mockStatsMap,
    sessions: mockQuizSessions,
    totalSeen: 2,
    readinessScore: 85,
    mistakesCount: 1,
    subjectsAnalytics: [
      {
        id: 1,
        name: 'Normativa',
        total: 1,
        seen: 1,
        correct: 0,
        accuracy: 0
      },
      {
        id: 2,
        name: 'Aerodinamica',
        total: 1,
        seen: 1,
        correct: 1,
        accuracy: 100
      }
    ],
    settings: {
      ttsEnabled: false
    },
    toggleBookmark: vi.fn(),
    saveNote: vi.fn()
  })
}));

describe('StatsScreen Component Interactive Drilldown', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuizSessions = [
      {
        id: 1,
        date: Date.now() - 3600000,
        mode: 'official',
        durationSeconds: 1200,
        totalQuestions: 30,
        correctAnswers: 28,
        wrongAnswers: 2,
        isPassed: true
      }
    ];
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

  it('STS-01: renders readiness card, subjects list, sessions, and top wrong questions', () => {
    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    expect(container.textContent).toContain('I tuoi Progressi');
    expect(container.textContent).toContain('85%');
    expect(container.textContent).toContain('01 Normativa');
    expect(container.textContent).toContain('02 Aerodinamica');
    expect(container.textContent).toContain('Top 10 Domande con Più Errori');
    expect(container.textContent).toContain('#101');
    expect(container.textContent).toContain('3 errori');
  });

  it('STS-02: clicking subject row opens SubjectDetailModal with subject drilldown', () => {
    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    // SubjectDetailModal should not be visible initially
    expect(container.querySelector('#btn-close-subject-detail')).toBeNull();

    const subject1Btn = container.querySelector('#btn-stat-subject-1') as HTMLButtonElement;
    expect(subject1Btn).toBeTruthy();

    act(() => {
      subject1Btn.click();
    });

    // SubjectDetailModal is now open
    expect(container.querySelector('#btn-close-subject-detail')).toBeTruthy();
    expect(container.textContent).toContain('01');
    expect(container.textContent).toContain('Normativa');
    expect(container.textContent).toContain('Qual è il limite di quota VDS?');
  });

  it('STS-03: clicking a question in Top 10 wrong list directly opens QuestionDetailModal', () => {
    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    expect(container.querySelector('#btn-close-question-detail')).toBeNull();

    const wrongQBtn = container.querySelector('#btn-stat-wrong-q-101') as HTMLButtonElement;
    expect(wrongQBtn).toBeTruthy();

    act(() => {
      wrongQBtn.click();
    });

    // QuestionDetailModal is now open
    expect(container.querySelector('#btn-close-question-detail')).toBeTruthy();
    expect(container.textContent).toContain('#101');
    expect(container.textContent).toContain('Qual è il limite di quota VDS?');
    expect(container.textContent).toContain('500 piedi');
    expect(container.textContent).toContain('Regola Didattica');
  });

  it('STS-04: cascading drilldown from SubjectDetailModal to QuestionDetailModal', () => {
    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    // 1. Click subject 1
    const subject1Btn = container.querySelector('#btn-stat-subject-1') as HTMLButtonElement;
    act(() => {
      subject1Btn.click();
    });

    expect(container.querySelector('#btn-close-subject-detail')).toBeTruthy();

    // 2. Click question in subject modal
    const qInSubjectBtn = container.querySelector('#btn-subject-q-101') as HTMLButtonElement;
    expect(qInSubjectBtn).toBeTruthy();

    act(() => {
      qInSubjectBtn.click();
    });

    // Both modals are in the DOM, QuestionDetail is on top
    expect(container.querySelector('#btn-close-question-detail')).toBeTruthy();
    expect(container.querySelector('#btn-close-subject-detail')).toBeTruthy();

    // 3. Close question modal
    const closeQBtn = container.querySelector('#btn-close-question-detail') as HTMLButtonElement;
    act(() => {
      closeQBtn.click();
    });

    // QuestionDetail is closed, SubjectDetail is still open
    expect(container.querySelector('#btn-close-question-detail')).toBeNull();
    expect(container.querySelector('#btn-close-subject-detail')).toBeTruthy();
  });

  it('STS-05: clicking train subject inside SubjectDetailModal propagates onTrainSubject callback', () => {
    const handleTrainSubject = vi.fn();

    act(() => {
      root.render(React.createElement(StatsScreen, { onTrainSubject: handleTrainSubject }));
    });

    // Open subject 2
    const subject2Btn = container.querySelector('#btn-stat-subject-2') as HTMLButtonElement;
    act(() => {
      subject2Btn.click();
    });

    const trainBtn = container.querySelector('#btn-train-subject') as HTMLButtonElement;
    expect(trainBtn).toBeTruthy();

    act(() => {
      trainBtn.click();
    });

    expect(handleTrainSubject).toHaveBeenCalledWith(2);
    // Subject modal should be closed
    expect(container.querySelector('#btn-close-subject-detail')).toBeNull();
  });

  it('STS-06: filters out sessions where zero answers were given from the history and metric counter', () => {
    // Valid session with answers
    const validSession = {
      id: 10,
      date: Date.now() - 100000,
      mode: 'official',
      durationSeconds: 900,
      totalQuestions: 30,
      correctAnswers: 29,
      wrongAnswers: 1,
      isPassed: true,
      snapshots: [{ questionId: 1, userAnswer: 1, correctAnswer: 1, isCorrect: true, wasFlagged: false }]
    };

    // Ghost/empty session: 0 answers given, 30 unanswered
    const emptySession = {
      id: 11,
      date: Date.now() - 50000,
      mode: 'official',
      durationSeconds: 15,
      totalQuestions: 30,
      correctAnswers: 0,
      wrongAnswers: 30,
      isPassed: false,
      snapshots: Array.from({ length: 30 }, (_, idx) => ({
        questionId: idx + 1,
        userAnswer: undefined,
        correctAnswer: 1,
        isCorrect: false,
        wasFlagged: false
      }))
    };

    mockQuizSessions = [emptySession, validSession];

    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    // The valid session should appear
    expect(container.textContent).toContain('29/30 (1 err)');

    // The empty session (0/30) should NOT appear
    expect(container.textContent).not.toContain('0/30');
    expect(container.textContent).not.toContain('(30 err)');

    // When ONLY empty sessions exist:
    mockQuizSessions = [emptySession];

    act(() => {
      root.render(React.createElement(StatsScreen));
    });

    expect(container.textContent).toContain('Nessuna simulazione completata finora.');
  });
});
