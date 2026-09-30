// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QuestionDetailModal } from './QuestionDetailModal';
import type { Question } from '../types/quiz';

const mockQuestion: Question = {
  id: 1042,
  subjectId: 5,
  subjectName: 'Meteorologia',
  discipline: 'all',
  question: 'In presenza di vento forte su un costone montuoso, sottovento si formano:',
  options: [
    'Rotori e forti turbolenze discendenti',
    'Correnti ascensionali laminari e costanti',
    'Nessuna variazione significativa del flusso'
  ],
  correctAnswer: 1,
  explanation: {
    rule: 'Il flusso d aria superando l ostacolo orografico genera vortici e rotori sottovento.',
    trap: 'Confondere il lato sopravento con il lato sottovento.'
  }
};

const mockToggleBookmark = vi.fn();
const mockSaveNote = vi.fn();
const mockStatsMap = new Map();

vi.mock('../context/QuizContext', () => ({
  useQuiz: () => ({
    statsMap: mockStatsMap,
    settings: {
      ttsEnabled: true,
      ttsPlaybackRate: 1.0,
      ttsVoice: 'giuseppe'
    },
    toggleBookmark: mockToggleBookmark,
    saveNote: mockSaveNote
  })
}));

vi.mock('../hooks/useAviationVoice', () => ({
  useAviationVoice: () => ({
    isPartPlaying: vi.fn().mockReturnValue(false),
    isPartActive: vi.fn().mockReturnValue(false),
    playQuestion: vi.fn(),
    playExplanation: vi.fn(),
    stop: vi.fn()
  })
}));

describe('QuestionDetailModal Component', () => {
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

  it('QDM-01: renders nothing when isOpen is false', () => {
    act(() => {
      root.render(
        React.createElement(QuestionDetailModal, {
          question: mockQuestion,
          isOpen: false,
          onClose: vi.fn()
        })
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('QDM-02: renders full question, options with correct answer, and explanation when open', () => {
    mockStatsMap.set(1042, {
      questionId: 1042,
      timesSeen: 4,
      timesWrong: 2,
      consecutiveCorrect: 1,
      isBookmarked: false
    });

    act(() => {
      root.render(
        React.createElement(QuestionDetailModal, {
          question: mockQuestion,
          isOpen: true,
          onClose: vi.fn()
        })
      );
    });

    expect(container.textContent).toContain('#1042');
    expect(container.textContent).toContain('05 Meteorologia');
    expect(container.textContent).toContain('In presenza di vento forte su un costone');
    expect(container.textContent).toContain('Rotori e forti turbolenze discendenti');
    expect(container.textContent).toContain('Regola Didattica');
    expect(container.textContent).toContain('Tranello Comune');
    expect(container.textContent).toContain('Quaderno Errori');
    expect(container.textContent).toContain('4 volte');
  });

  it('QDM-03: clicking bookmark button calls toggleBookmark', () => {
    act(() => {
      root.render(
        React.createElement(QuestionDetailModal, {
          question: mockQuestion,
          isOpen: true,
          onClose: vi.fn()
        })
      );
    });

    const bookmarkBtn = container.querySelector('#btn-bookmark-question-detail') as HTMLButtonElement;
    expect(bookmarkBtn).toBeTruthy();

    act(() => {
      bookmarkBtn.click();
    });

    expect(mockToggleBookmark).toHaveBeenCalledWith(1042);
  });

  it('QDM-04: clicking close button calls onClose', () => {
    const handleClose = vi.fn();

    act(() => {
      root.render(
        React.createElement(QuestionDetailModal, {
          question: mockQuestion,
          isOpen: true,
          onClose: handleClose
        })
      );
    });

    const closeBtn = container.querySelector('#btn-close-question-detail') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    act(() => {
      closeBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
