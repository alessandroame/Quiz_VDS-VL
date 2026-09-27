import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, startExamTimer } from './timer';

describe('Suite 5: Cockpit Timer & Auto-Consegna (src/utils/timer.ts)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TIME-01: formatTime converte deterministicamente i secondi in formato aeronautico MM:SS', () => {
    expect(formatTime(2700)).toBe('45:00');
    expect(formatTime(2699)).toBe('44:59');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-10)).toBe('00:00');
  });

  it('TIME-02: startExamTimer decrementa di 1 secondo ad ogni tick di 1000ms', () => {
    const onTick = vi.fn();
    const onExpire = vi.fn();

    const timer = startExamTimer({ minutes: 1, onTick, onExpire });
    expect(timer.getSecondsRemaining()).toBe(60);

    vi.advanceTimersByTime(1000);
    expect(timer.getSecondsRemaining()).toBe(59);
    expect(onTick).toHaveBeenCalledWith(59);

    vi.advanceTimersByTime(2000);
    expect(timer.getSecondsRemaining()).toBe(57);
    expect(onTick).toHaveBeenCalledWith(57);

    timer.stop();
  });

  it('TIME-03: scade e innesca la consegna automatica dopo esattamente 45 minuti', () => {
    const onExpire = vi.fn();

    startExamTimer({ minutes: 45, onExpire });

    // Avanziamo fino a 1 secondo prima della scadenza (44m 59s = 2699s)
    vi.advanceTimersByTime(2699 * 1000);
    expect(onExpire).not.toHaveBeenCalled();

    // Avanziamo l'ultimo secondo
    vi.advanceTimersByTime(1000);
    expect(onExpire).toHaveBeenCalledTimes(1);

    // Ulteriore tempo non deve provocare ulteriori invocazioni
    vi.advanceTimersByTime(5000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('TIME-04: timer.stop() interrompe immediatamente il countdown prevenendo leak e auto-consegna', () => {
    const onTick = vi.fn();
    const onExpire = vi.fn();

    const timer = startExamTimer({ minutes: 10, onTick, onExpire });
    vi.advanceTimersByTime(5000);
    expect(onTick).toHaveBeenCalledTimes(5);

    // Stop manuale
    timer.stop();

    // Avanziamo per 1 ora
    vi.advanceTimersByTime(3600 * 1000);
    expect(onTick).toHaveBeenCalledTimes(5);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
