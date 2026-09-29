import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuestionNavigator } from './QuestionNavigator';
import type { Question } from '../types/quiz';

const mockQuestions: Question[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  subjectId: 1,
  subjectName: 'Normativa',
  discipline: 'paraglider',
  question: `Question ${i + 1}`,
  options: ['Option 1', 'Option 2', 'Option 3'] as [string, string, string],
  correctAnswer: 1 as const,
  explanation: {
    rule: 'Rule explanation',
    trap: 'Trap explanation'
  }
}));

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('QuestionNavigator Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders correctly in expanded mode by default', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 0,
        answers: {},
        flags: {},
        examMode: 'official',
        onSelectIndex: () => {},
        defaultCompressed: false
      })
    );

    expect(html).toContain('data-testid="navigator-expanded-grid"');
    expect(html).toContain('bubble-q-1');
    expect(html).toContain('bubble-q-30');
    expect(html).toContain('1 / 30');
    expect(html).toContain('Comprimi');
    expect(html).toContain('aria-expanded="true"');
  });

  it('renders correctly in compressed mode when defaultCompressed is true', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 4,
        answers: {},
        flags: {},
        examMode: 'official',
        onSelectIndex: () => {},
        defaultCompressed: true
      })
    );

    expect(html).toContain('data-testid="navigator-compressed-row"');
    expect(html).toContain('bubble-q-5');
    expect(html).toContain('5 / 30');
    expect(html).toContain('Espandi');
    expect(html).toContain('aria-expanded="false"');
  });

  it('respects stored user preference from localStorage', () => {
    localStorageMock.setItem('vds_exam_nav_compressed', 'true');

    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 0,
        answers: {},
        flags: {},
        examMode: 'official',
        onSelectIndex: () => {},
        defaultCompressed: false // should be overridden by localStorage
      })
    );

    expect(html).toContain('data-testid="navigator-compressed-row"');
    expect(html).toContain('Espandi');
  });

  it('displays correct color indicators in tutor mode for answered questions', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 2,
        answers: {
          1: 1, // Correct (question 1 correctAnswer is 1)
          2: 2  // Wrong
        },
        flags: { 3: true },
        examMode: 'tutor',
        onSelectIndex: () => {},
        defaultCompressed: false
      })
    );

    // Question 1 correct should have emerald classes
    expect(html).toContain('border-emerald-500');
    // Question 2 wrong should have rose classes
    expect(html).toContain('border-rose-500');
    // Flagged count should be shown
    expect(html).toContain('(1 ⚑)');
  });

  it('displays amber indicator for answered questions in official exam mode', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 0,
        answers: { 1: 2 },
        flags: {},
        examMode: 'official',
        onSelectIndex: () => {},
        defaultCompressed: false
      })
    );

    // In official mode, answers are marked as answered in amber, not revealing correct/wrong
    expect(html).toContain('bg-amber-500 text-zinc-950');
  });

  it('renders active question dot and ring in compressed mode', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 7,
        answers: {},
        flags: {},
        examMode: 'tutor',
        onSelectIndex: () => {},
        defaultCompressed: true
      })
    );

    expect(html).toContain('data-testid="navigator-compressed-row"');
    expect(html).toContain('ring-2 ring-amber-400');
    expect(html).toContain('rounded-full bg-amber-400');
    expect(html).toContain('8 / 30');
  });

  it('includes proper aria labels for accessibility', () => {
    const html = renderToString(
      React.createElement(QuestionNavigator, {
        questions: mockQuestions,
        currentIndex: 0,
        answers: {},
        flags: {},
        examMode: 'official',
        onSelectIndex: () => {},
        defaultCompressed: false
      })
    );

    expect(html).toContain('aria-label="Quesito 1"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('aria-label="Comprimi navigatore quiz"');
  });
});
