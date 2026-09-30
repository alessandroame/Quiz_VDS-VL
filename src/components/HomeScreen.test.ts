// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

import { HomeScreen } from './HomeScreen';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = Array.from({ length: 474 }, (_, i) => ({
  id: i + 1,
  subjectId: 1,
  subjectName: 'Normativa',
  discipline: 'paraglider',
  question: `Domanda ${i + 1}`,
  options: ['A', 'B', 'C'] as [string, string, string],
  correctAnswer: 1,
  explanation: { rule: 'R', trap: 'T' }
}));

describe('HomeScreen Component (Home Hub Contracts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseQuiz.mockReturnValue({
      readinessScore: 82,
      mistakesCount: 3,
      totalSeen: 210,
      questions: mockQuestions,
      activeSession: null,
      openDriveMode: vi.fn()
    });
  });

  it('should render all 6 core scenario macro-buttons with unique IDs', () => {
    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('id="btn-home-tutor"');
    expect(html).toContain('Tutor Didattico');
    expect(html).toContain('Senza Limiti');

    expect(html).toContain('id="btn-home-topics"');
    expect(html).toContain('Studio Materie');

    expect(html).toContain('id="btn-home-exam"');
    expect(html).toContain('Esame Ufficiale');
    expect(html).toContain('45 Minuti');

    expect(html).toContain('id="btn-home-mistakes"');
    expect(html).toContain('Quaderno Errori');

    expect(html).toContain('id="btn-home-archive"');
    expect(html).toContain('Archivio &amp; Cerca');
    expect(html).toContain('474 Quiz');

    expect(html).toContain('id="btn-home-stats"');
    expect(html).toContain('Statistiche');
  });

  it('should display compact telemetry strip with readiness, explored questions, and mistake count', () => {
    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('Preparazione Esame');
    expect(html).not.toContain('id="btn-home-audio-quick"');
    expect(html).toContain('82');
    expect(html).toContain('210');
    expect(html).toContain('474');
    expect(html).toContain('3');
    expect(html).toContain('da rivedere');
  });

  it('should display active session resumption banner when a session is in progress', () => {
    mockUseQuiz.mockReturnValue({
      readinessScore: 82,
      mistakesCount: 3,
      totalSeen: 210,
      questions: mockQuestions,
      activeSession: {
        id: 'exam-123',
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1, 2, 3],
        currentIndex: 1,
        answers: { 1: 2 },
        flags: {},
        startTime: Date.now(),
        lastActiveTime: Date.now()
      },
      openDriveMode: vi.fn()
    });

    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('Sessione in Corso');
    expect(html).toContain('Domanda');
    expect(html).toContain('Simulazione Esame');
    expect(html).toContain('risposte date');
    expect(html).toContain('Riprendi');
  });
});
