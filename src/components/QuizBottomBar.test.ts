import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuizBottomBar } from './QuizBottomBar';

describe('QuizBottomBar Component (Mobile Ergonomics)', () => {
  it('should render fixed bottom navigation with safe-area padding', () => {
    const html = renderToString(
      React.createElement(QuizBottomBar, {
        currentIndex: 0,
        totalCount: 30,
        onPrevious: () => {},
        onNext: () => {}
      })
    );

    expect(html).toContain('id="quiz-bottom-bar"');
    expect(html).toContain('fixed bottom-0 left-0 right-0 z-30');
    expect(html).toContain('safe-area-inset-bottom');
    expect(html).toContain('aria-label="Navigazione quiz: quesito 1 di 30"');
    expect(html).toContain('id="btn-prev-question"');
    expect(html).toContain('id="btn-next-question"');
  });

  it('should disable previous button on first question', () => {
    const html = renderToString(
      React.createElement(QuizBottomBar, {
        currentIndex: 0,
        totalCount: 30,
        isPreviousDisabled: true,
        onPrevious: () => {},
        onNext: () => {}
      })
    );

    expect(html).toContain('disabled=""');
  });

  it('should render flag button with active amber style when question is flagged', () => {
    const html = renderToString(
      React.createElement(QuizBottomBar, {
        currentIndex: 4,
        totalCount: 30,
        onPrevious: () => {},
        onNext: () => {},
        flagAction: {
          isFlagged: true,
          onToggle: () => {},
          id: 'btn-flag-bottom'
        }
      })
    );

    expect(html).toContain('id="btn-flag-bottom"');
    expect(html).toContain('border-amber-500/60');
    expect(html).toContain('text-amber-300');
    expect(html).toContain('fill-current');
  });

  it('should render primary action taking precedence over default next button', () => {
    const html = renderToString(
      React.createElement(QuizBottomBar, {
        currentIndex: 2,
        totalCount: 30,
        onPrevious: () => {},
        primaryAction: {
          label: 'Prossima Domanda',
          onClick: () => {},
          id: 'btn-next-didactic',
          variant: 'emerald'
        }
      })
    );

    expect(html).toContain('id="btn-next-didactic"');
    expect(html).toContain('Prossima Domanda');
    expect(html).toContain('bg-emerald-600');
    expect(html).not.toContain('id="btn-next-question"');
    // Ensure counter remains visible with primary action
    expect(html).toContain('3 / 30');
  });

  it('should maintain stable center counter and overflow protection classes', () => {
    const html = renderToString(
      React.createElement(QuizBottomBar, {
        currentIndex: 5,
        totalCount: 30,
        onPrevious: () => {},
        primaryAction: {
          label: 'Successiva',
          onClick: () => {},
          id: 'btn-tutor-next-question',
          variant: 'amber'
        }
      })
    );

    // Center counter
    expect(html).toContain('6 / 30');
    // Primary action
    expect(html).toContain('id="btn-tutor-next-question"');
    expect(html).toContain('Successiva');
    expect(html).toContain('bg-amber-600');
    // Anti-overflow classes
    expect(html).toContain('min-w-0');
    expect(html).toContain('truncate');
    expect(html).toContain('shrink-0');
  });
});
