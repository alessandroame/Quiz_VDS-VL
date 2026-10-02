import { describe, it, expect } from 'vitest';
import { getNextQuestionIndex } from './quizNavigation';

describe('quizNavigation - getNextQuestionIndex', () => {
  const mockQuestions = [
    { id: 101 },
    { id: 102 },
    { id: 103 },
    { id: 104 },
    { id: 105 },
    { id: 106 },
    { id: 107 },
    { id: 108 },
    { id: 109 },
    { id: 110 }
  ];

  it('NAV-01: handles edge cases (empty or single-element list)', () => {
    expect(getNextQuestionIndex(0, [], {})).toBe(0);
    expect(getNextQuestionIndex(0, [{ id: 1 }], {})).toBe(0);
    expect(getNextQuestionIndex(-5, mockQuestions, {})).toBe(1);
    expect(getNextQuestionIndex(99, mockQuestions, {})).toBe(0);
  });

  it('NAV-02: advances sequentially by 1 when no questions were skipped', () => {
    // Starting at 0, no answers yet -> next unanswered is index 1
    expect(getNextQuestionIndex(0, mockQuestions, { 101: 1 })).toBe(1);
    // At index 1, questions 0 and 1 answered -> next unanswered is index 2
    expect(getNextQuestionIndex(1, mockQuestions, { 101: 1, 102: 2 })).toBe(2);
  });

  it('NAV-03: jumps directly to the first unanswered question when student went back to answer a skipped question', () => {
    // Scenario: Student answered 101, skipped 102, answered 103, 104, 105.
    // Student goes back to question 102 (index 1).
    // Now question 102 is answered.
    // 101, 102, 103, 104, 105 are all answered.
    // 106 (index 5) is the first unanswered question!
    const answers = {
      101: 1,
      102: 2, // just answered!
      103: 3,
      104: 1,
      105: 2
    };

    // Advancing from index 1 should SKIP index 2, 3, 4 and land on index 5!
    const targetIndex = getNextQuestionIndex(1, mockQuestions, answers);
    expect(targetIndex).toBe(5);
  });

  it('NAV-04: jumps to the next skipped question if multiple skips exist ahead', () => {
    // Scenario: Questions 101 answered, 102 skipped, 103 answered, 104 skipped, 105 answered, 106..110 unanswered.
    // Student is at index 1 (102). Answers 102.
    const answers = {
      101: 1,
      102: 2,
      103: 3,
      // 104 is skipped!
      105: 1
    };

    // Advancing from index 1 should land on index 3 (104, the next skipped question)
    expect(getNextQuestionIndex(1, mockQuestions, answers)).toBe(3);
  });

  it('NAV-05: advances past answered questions even if current question is left unanswered (re-skipped)', () => {
    // Scenario: Student goes back to index 1 (102, still unanswered).
    // 103 and 104 are answered. 105 is unanswered.
    // Student clicks Next without answering 102.
    const answers = {
      101: 1,
      // 102 is unanswered
      103: 2,
      104: 3
      // 105 is unanswered
    };

    // Should skip 103 and 104 and jump to 105 (index 4)
    expect(getNextQuestionIndex(1, mockQuestions, answers)).toBe(4);
  });

  it('NAV-06: wraps around to earlier unanswered questions if all forward questions are answered', () => {
    // Scenario: Student reached index 9.
    // 102 (index 1) was skipped earlier.
    // Questions 101, 103..110 are answered.
    const answers = {
      101: 1,
      // 102 missing!
      103: 2,
      104: 3,
      105: 1,
      106: 2,
      107: 3,
      108: 1,
      109: 2,
      110: 3
    };

    // Advancing from index 8 or 9 wraps around and returns index 1
    expect(getNextQuestionIndex(8, mockQuestions, answers)).toBe(1);
    expect(getNextQuestionIndex(9, mockQuestions, answers)).toBe(1);
  });

  it('NAV-07: steps sequentially by 1 when reviewing a 100% completed quiz (fallbackToEndIfComplete: false)', () => {
    // All 10 questions answered
    const answers: Record<number, number> = {};
    mockQuestions.forEach((q, i) => {
      answers[q.id] = (i % 3) + 1;
    });

    // Student reviews at index 2, clicks next -> should go to index 3
    expect(getNextQuestionIndex(2, mockQuestions, answers, { fallbackToEndIfComplete: false })).toBe(3);
    // Student at index 9 (last), clicks next -> stays at index 9
    expect(getNextQuestionIndex(9, mockQuestions, answers, { fallbackToEndIfComplete: false })).toBe(9);
  });

  it('NAV-08: navigates to the final question when all are complete if fallbackToEndIfComplete: true', () => {
    // All 10 questions answered
    const answers: Record<number, number> = {};
    mockQuestions.forEach((q, i) => {
      answers[q.id] = (i % 3) + 1;
    });

    // In auto-advance or tutor completion, after answering the last missing question from index 2,
    // it jumps straight to the end (index 9) to display the completion action
    expect(getNextQuestionIndex(2, mockQuestions, answers, { fallbackToEndIfComplete: true })).toBe(9);
    expect(getNextQuestionIndex(9, mockQuestions, answers, { fallbackToEndIfComplete: true })).toBe(9);
  });
});
