import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  backNavigation,
  executeBackAction,
  triggerGraphicBack,
  type BackNavigationContext
} from './backNavigation';

describe('Suite 21: Hardware and Graphic Back Navigation Synchronization', () => {
  let context: BackNavigationContext;
  let onCloseSettings = vi.fn<() => void>();
  let onCloseDriveMode = vi.fn<() => void>();
  let onCancelPendingTab = vi.fn<() => void>();
  let onNavigateHome = vi.fn<() => void>();
  let onInterceptExamLeave = vi.fn<() => void>();
  const originalWindow = (globalThis as any).window;
  let mockHistoryBack = vi.fn<() => void>();
  let mockHistoryPushState = vi.fn<(...args: any[]) => void>();

  beforeEach(() => {
    backNavigation.resetDepth();
    onCloseSettings = vi.fn<() => void>();
    onCloseDriveMode = vi.fn<() => void>();
    onCancelPendingTab = vi.fn<() => void>();
    onNavigateHome = vi.fn<() => void>();
    onInterceptExamLeave = vi.fn<() => void>();

    mockHistoryBack = vi.fn<() => void>();
    mockHistoryPushState = vi.fn<(...args: any[]) => void>();

    Object.defineProperty(globalThis, 'window', {
      value: {
        history: {
          back: mockHistoryBack,
          pushState: mockHistoryPushState
        }
      },
      writable: true,
      configurable: true
    });

    context = {
      activeTab: 'home',
      isExamRunning: false,
      isSettingsOpen: false,
      isDriveModeOpen: false,
      pendingTab: null,
      onCloseSettings,
      onCloseDriveMode,
      onCancelPendingTab,
      onNavigateHome,
      onInterceptExamLeave
    };
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true
    });
  });

  it('BACK-01: da Home senza overlay non esegue azioni e permette l\'uscita nativa', () => {
    const result = executeBackAction(context);
    expect(result).toBe('none');
    expect(onCloseSettings).not.toHaveBeenCalled();
    expect(onCloseDriveMode).not.toHaveBeenCalled();
    expect(onCancelPendingTab).not.toHaveBeenCalled();
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it('BACK-02: da una schermata interna (tutor, topics, mistakes, archive, stats) torna a Home', () => {
    context.activeTab = 'tutor';
    const resultTutor = executeBackAction(context);
    expect(resultTutor).toBe('home');
    expect(onNavigateHome).toHaveBeenCalledTimes(1);

    // Rule 2 verification: inside topics quiz it goes to Home, not topics list
    context.activeTab = 'topics';
    const resultTopics = executeBackAction(context);
    expect(resultTopics).toBe('home');
    expect(onNavigateHome).toHaveBeenCalledTimes(2);

    context.activeTab = 'archive';
    const resultArchive = executeBackAction(context);
    expect(resultArchive).toBe('home');
    expect(onNavigateHome).toHaveBeenCalledTimes(3);
  });

  it('BACK-03: se l\'esame è in corso, non esce subito ma intercetta mostrando il prompt di abbandono', () => {
    context.activeTab = 'exam';
    context.isExamRunning = true;

    const result = executeBackAction(context);
    expect(result).toBe('examIntercept');
    expect(onInterceptExamLeave).toHaveBeenCalledTimes(1);
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it('BACK-04: se le Impostazioni sono aperte, chiude le Impostazioni', () => {
    context.activeTab = 'tutor';
    context.isSettingsOpen = true;

    const result = executeBackAction(context);
    expect(result).toBe('settings');
    expect(onCloseSettings).toHaveBeenCalledTimes(1);
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it('BACK-05: se la Modalità Audio (DriveMode) è aperta, chiude la Modalità Audio', () => {
    context.activeTab = 'topics';
    context.isDriveModeOpen = true;

    const result = executeBackAction(context);
    expect(result).toBe('drive');
    expect(onCloseDriveMode).toHaveBeenCalledTimes(1);
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it('BACK-06: se la modale di conferma abbandono esame (pendingTab) è aperta, annulla la modale e rimane nell\'esame', () => {
    context.activeTab = 'exam';
    context.isExamRunning = true;
    context.pendingTab = 'home';

    const result = executeBackAction(context);
    expect(result).toBe('pendingTab');
    expect(onCancelPendingTab).toHaveBeenCalledTimes(1);
    expect(onNavigateHome).not.toHaveBeenCalled();
  });

  it('BACK-07: se è registrata una sub-modale interna (es. tastierino #ID o help comandi vocali), chiude la sub-modale prima di chiudere la schermata', () => {
    const subModalClose = vi.fn();
    const unregister = backNavigation.registerSubModal('test-keypad', subModalClose);

    context.activeTab = 'archive';

    const result = executeBackAction(context);
    expect(result).toBe('submodal');
    expect(subModalClose).toHaveBeenCalledTimes(1);
    expect(onNavigateHome).not.toHaveBeenCalled();

    // Now that submodal was popped, next back goes to home
    const nextResult = executeBackAction(context);
    expect(nextResult).toBe('home');
    expect(onNavigateHome).toHaveBeenCalledTimes(1);

    unregister();
  });

  it('BACK-08: triggerGraphicBack invoca window.history.back se depth > 0, o il fallback se depth è 0', () => {
    // Case 1: depth is 0, uses fallback
    backNavigation.setDepth(0);
    const fallbackFn = vi.fn();
    triggerGraphicBack(context, fallbackFn);
    expect(fallbackFn).toHaveBeenCalledTimes(1);
    expect(mockHistoryBack).not.toHaveBeenCalled();

    // Case 2: depth > 0, triggers window.history.back
    backNavigation.setDepth(2);
    triggerGraphicBack(context, fallbackFn);
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });
});
