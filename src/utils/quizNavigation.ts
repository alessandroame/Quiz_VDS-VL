/**
 * Options for calculating the next question index in a quiz session.
 */
export interface NextQuestionOptions {
  /**
   * If true and all questions in the quiz have been answered,
   * navigate directly to the last question (totalCount - 1)
   * where completion / submission controls are located.
   * If false (default), step forward by 1 (clamped to totalCount - 1)
   * so the student can review questions sequentially.
   */
  fallbackToEndIfComplete?: boolean;
}

/**
 * Calculates the next question index when advancing in a quiz session.
 *
 * Core behavior (smart skip-ahead):
 * If the student went back to answer or review a question they previously skipped,
 * advancing forward prioritizes the first unanswered question instead of forcing
 * them to step through questions they already answered:
 *
 * 1. Forward search: checks questions from currentIndex + 1 to totalCount - 1.
 *    If an unanswered question is found, returns its index.
 * 2. Wrap-around search: checks questions from 0 to currentIndex - 1.
 *    If an unanswered question is found, returns its index.
 * 3. All answered fallback:
 *    - If fallbackToEndIfComplete is true: returns totalCount - 1.
 *    - If false: returns Math.min(totalCount - 1, safeIndex + 1).
 *
 * @param currentIndex The current question index (0-based)
 * @param questions The list of questions in the active session
 * @param answers Map/Record of questionId -> answer
 * @param options Navigation options
 * @returns The target index to navigate to
 */
export function getNextQuestionIndex(
  currentIndex: number,
  questions: { id: number }[],
  answers: Record<number, any>,
  options: NextQuestionOptions = {}
): number {
  const totalCount = questions.length;
  if (totalCount <= 1) return 0;

  const safeIndex = Math.max(0, Math.min(totalCount - 1, currentIndex));

  // 1. Forward search from currentIndex + 1 to totalCount - 1
  for (let i = safeIndex + 1; i < totalCount; i++) {
    const q = questions[i];
    if (q && answers[q.id] === undefined) {
      return i;
    }
  }

  // 2. Wrap-around search from 0 to currentIndex - 1
  for (let i = 0; i < safeIndex; i++) {
    const q = questions[i];
    if (q && answers[q.id] === undefined) {
      return i;
    }
  }

  // 3. All questions in the quiz have been answered
  if (options.fallbackToEndIfComplete) {
    return totalCount - 1;
  }

  return Math.min(totalCount - 1, safeIndex + 1);
}
