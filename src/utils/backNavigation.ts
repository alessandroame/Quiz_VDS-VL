/**
 * Back Navigation Coordinator for PWA.
 *
 * Implements deterministic synchronization between hardware/browser "Back" button
 * (Android gestures, OS Back, browser history popstate) and visible on-screen back buttons.
 *
 * Guaranteed priority hierarchy:
 * 1. Active Sub-Modals (e.g. Voice Commands sheet, #ID keypad, confirmation dialogs)
 * 2. Exam Abandon Warning Modal (pendingTab)
 * 3. Audio / Drive Mode Fullscreen (isDriveModeOpen)
 * 4. Settings Modal Fullscreen (isSettingsOpen)
 * 5. Inner Screens (tutor, exam, topics, mistakes, archive, stats):
 *    - If an exam is actively running: intercepts and prompts for confirmation
 *    - Otherwise: navigates back to Home Hub
 * 6. Home Hub: no on-screen back button; lets native OS/browser exit
 */

export type SubModalCloser = () => void;

export interface SubModalEntry {
  id: string;
  close: SubModalCloser;
}

export class BackNavigationService {
  private subModals: SubModalEntry[] = [];
  private historyDepth = 0;

  public getDepth(): number {
    return this.historyDepth;
  }

  public setDepth(depth: number): void {
    this.historyDepth = Math.max(0, depth);
  }

  public incrementDepth(): void {
    this.historyDepth++;
  }

  public decrementDepth(): void {
    this.historyDepth = Math.max(0, this.historyDepth - 1);
  }

  public resetDepth(): void {
    this.historyDepth = 0;
    this.subModals = [];
  }

  public registerSubModal(id: string, close: SubModalCloser): () => void {
    // Remove any existing entry with same id
    this.unregisterSubModal(id);
    this.subModals.push({ id, close });

    if (typeof window !== 'undefined' && window.history) {
      this.incrementDepth();
      window.history.pushState({ appDepth: this.historyDepth, subModal: id }, '');
    }

    return () => {
      this.unregisterSubModal(id);
    };
  }

  public unregisterSubModal(id: string): void {
    const index = this.subModals.findIndex(m => m.id === id);
    if (index !== -1) {
      this.subModals.splice(index, 1);
    }
  }

  public popTopSubModal(): SubModalCloser | undefined {
    const entry = this.subModals.pop();
    return entry?.close;
  }

  public hasSubModals(): boolean {
    return this.subModals.length > 0;
  }
}

export const backNavigation = new BackNavigationService();

export interface BackNavigationContext {
  activeTab: string;
  isExamRunning: boolean;
  isSettingsOpen: boolean;
  isDriveModeOpen: boolean;
  pendingTab: string | null;
  onCloseSettings: () => void;
  onCloseDriveMode: () => void;
  onCancelPendingTab: () => void;
  onNavigateHome: () => void;
  onInterceptExamLeave: () => void;
}

export type BackActionResult =
  | 'submodal'
  | 'pendingTab'
  | 'drive'
  | 'settings'
  | 'examIntercept'
  | 'home'
  | 'none';

/**
 * Pure evaluation function: determines and executes the exact topmost
 * visible back action in the application.
 */
export function executeBackAction(ctx: BackNavigationContext): BackActionResult {
  // 1. Registered sub-modal has highest priority
  const subModalClose = backNavigation.popTopSubModal();
  if (subModalClose) {
    subModalClose();
    return 'submodal';
  }

  // 2. Exam abandon warning dialog (pendingTab)
  if (ctx.pendingTab !== null) {
    ctx.onCancelPendingTab();
    return 'pendingTab';
  }

  // 3. Audio / Drive Mode overlay
  if (ctx.isDriveModeOpen) {
    ctx.onCloseDriveMode();
    return 'drive';
  }

  // 4. Settings overlay
  if (ctx.isSettingsOpen) {
    ctx.onCloseSettings();
    return 'settings';
  }

  // 5. Inner screen: returns to Home
  if (ctx.activeTab !== 'home') {
    if (ctx.isExamRunning) {
      ctx.onInterceptExamLeave();
      return 'examIntercept';
    } else {
      ctx.onNavigateHome();
      return 'home';
    }
  }

  // 6. Root Home screen: no back button
  return 'none';
}

/**
 * Triggers back navigation from a visible on-screen graphic button.
 * If history entries were pushed, calls window.history.back() to pop history.
 * Otherwise falls back to executing the action directly.
 */
export function triggerGraphicBack(
  ctx: BackNavigationContext,
  fallbackAction?: () => void
): void {
  if (typeof window !== 'undefined' && window.history && backNavigation.getDepth() > 0) {
    window.history.back();
  } else if (fallbackAction) {
    fallbackAction();
  } else {
    executeBackAction(ctx);
  }
}
