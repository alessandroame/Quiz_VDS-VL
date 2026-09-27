/**
 * Formatta un totale di secondi nel formato standard aeronautico MM:SS
 * Es: 2700 -> "45:00", 65 -> "01:05", 9 -> "00:09", 0 -> "00:00"
 */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export interface ExamTimerOptions {
  minutes: number;
  onTick?: (secondsRemaining: number) => void;
  onExpire: () => void;
}

export interface ExamTimerController {
  start: () => void;
  stop: () => void;
  getSecondsRemaining: () => number;
}

/**
 * Controller timer esame deterministico con callback di tick e scadenza.
 */
export function startExamTimer({ minutes, onTick, onExpire }: ExamTimerOptions): ExamTimerController {
  let secondsRemaining = Math.max(1, Math.round(minutes * 60));
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  const tick = () => {
    secondsRemaining -= 1;
    if (onTick) {
      onTick(secondsRemaining);
    }
    if (secondsRemaining <= 0) {
      stop();
      onExpire();
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    intervalId = setInterval(tick, 1000);
  };

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  };

  start();

  return {
    start,
    stop,
    getSecondsRemaining: () => secondsRemaining,
  };
}
