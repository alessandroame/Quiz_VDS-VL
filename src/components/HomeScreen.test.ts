// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot } from 'react-dom/client';

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
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockUseQuiz.mockReturnValue({
      readinessScore: 82,
      mistakesCount: 3,
      totalSeen: 210,
      questions: mockQuestions,
      activeSession: null,
      openDriveMode: vi.fn(),
      dismissActiveSession: vi.fn()
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render all 6 core scenario macro-buttons with unique IDs', () => {
    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('id="btn-home-tutor"');
    expect(html).toContain('Tutor');
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
        examMode: 'official',
        questionIds: [1, 2, 3],
        currentIndex: 1,
        answers: { 1: 2 },
        flags: {},
        startTime: Date.now(),
        lastActiveTime: Date.now()
      },
      openDriveMode: vi.fn(),
      dismissActiveSession: vi.fn()
    });

    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('Sessione in Corso');
    expect(html).toContain('Domanda');
    expect(html).toContain('Simulazione Esame');
    expect(html).toContain('risposte date');
    expect(html).toContain('Riprendi');
    expect(html).toContain('id="btn-home-resume-session"');
    expect(html).toContain('id="btn-home-discard-session"');
  });

  it('should display In Pausa badge in banner when activeSession has isPaused true', () => {
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
        isPaused: true,
        flags: {},
        startTime: Date.now(),
        lastActiveTime: Date.now()
      },
      openDriveMode: vi.fn(),
      dismissActiveSession: vi.fn()
    });

    const html = renderToString(
      React.createElement(HomeScreen, { onSelectTab: () => {} })
    );

    expect(html).toContain('In Pausa');
    expect(html).toContain('Sessione in Corso');
  });

  it('allows discarding an active session via the trash icon and confirmation dialog', async () => {
    const mockDismiss = vi.fn();
    mockUseQuiz.mockReturnValue({
      readinessScore: 82,
      mistakesCount: 3,
      totalSeen: 210,
      questions: mockQuestions,
      activeSession: {
        id: 'topic-1',
        type: 'topic',
        subjectId: 1,
        subjectName: 'Normativa',
        questionIds: [1, 2, 3],
        currentIndex: 0,
        answers: {},
        updatedAt: Date.now()
      },
      openDriveMode: vi.fn(),
      dismissActiveSession: mockDismiss
    });

    act(() => {
      root.render(React.createElement(HomeScreen, { onSelectTab: () => {} }));
    });

    const discardBtn = container.querySelector('#btn-home-discard-session') as HTMLButtonElement;
    expect(discardBtn).not.toBeNull();

    await act(async () => {
      discardBtn.click();
    });

    // Confirmation dialog should be displayed
    expect(container.textContent).toContain('Elimina Sessione');
    const confirmBtn = container.querySelector('#btn-home-confirm-discard') as HTMLButtonElement;
    expect(confirmBtn).not.toBeNull();

    await act(async () => {
      confirmBtn.click();
    });

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('prompts SessionConflictModal when student launches a conflicting scenario while another session is in progress', async () => {
    const mockSelectTab = vi.fn();
    mockUseQuiz.mockReturnValue({
      readinessScore: 82,
      mistakesCount: 3,
      totalSeen: 210,
      questions: mockQuestions,
      activeSession: {
        id: 'topic-1',
        type: 'topic',
        subjectId: 1,
        subjectName: 'Normativa',
        questionIds: [1, 2, 3],
        currentIndex: 0,
        answers: {},
        updatedAt: Date.now()
      },
      openDriveMode: vi.fn(),
      dismissActiveSession: vi.fn()
    });

    act(() => {
      root.render(React.createElement(HomeScreen, { onSelectTab: mockSelectTab }));
    });

    // Click on Esame Ufficiale (which conflicts with active topic session)
    const examBtn = container.querySelector('#btn-home-exam') as HTMLButtonElement;
    expect(examBtn).not.toBeNull();

    await act(async () => {
      examBtn.click();
    });

    // SessionConflictModal should open
    expect(container.textContent).toContain('Sessione in Sospeso');
    expect(container.textContent).toContain('Normativa');
    expect(container.textContent).toContain('Esame Ufficiale');

    // Clicking resume resumes the existing topic session
    const resumeBtn = container.querySelector('#btn-conflict-resume') as HTMLButtonElement;
    expect(resumeBtn).not.toBeNull();

    await act(async () => {
      resumeBtn.click();
    });

    expect(mockSelectTab).toHaveBeenCalledWith('topics');
  });
});
