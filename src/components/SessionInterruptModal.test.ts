// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionInterruptModal } from './SessionInterruptModal';
import { backNavigation } from '../utils/backNavigation';

describe('SessionInterruptModal Component', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders nothing when isOpen is false', () => {
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: false,
          onClose: vi.fn(),
          onPause: vi.fn(),
          onTerminate: vi.fn(),
          sessionTitle: 'Simulazione Esame',
          currentIndex: 5,
          totalQuestions: 30,
          answeredCount: 4
        })
      );
    });

    expect(container.children.length).toBe(0);
  });

  it('renders session info and action buttons when isOpen is true', () => {
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPause: vi.fn(),
          onTerminate: vi.fn(),
          sessionTitle: 'Simulazione Esame AeCI',
          currentIndex: 9,
          totalQuestions: 30,
          answeredCount: 8,
          timeDisplay: '35:20'
        })
      );
    });

    expect(container.textContent).toContain('Interrompi Sessione');
    expect(container.textContent).toContain('Simulazione Esame AeCI');
    expect(container.textContent).toContain('Domanda 10 di 30 • 8 risposte fornite');
    expect(container.textContent).toContain('⏱️ 35:20');

    expect(container.querySelector('#btn-interrupt-pause')).not.toBeNull();
    expect(container.querySelector('#btn-interrupt-terminate')).not.toBeNull();
    expect(container.querySelector('#btn-interrupt-resume')).not.toBeNull();
  });

  it('triggers onPause when clicking Metti in Pausa button', async () => {
    const mockPause = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPause: mockPause,
          onTerminate: vi.fn(),
          sessionTitle: 'Test Session',
          currentIndex: 2,
          totalQuestions: 10,
          answeredCount: 2
        })
      );
    });

    const pauseBtn = container.querySelector('#btn-interrupt-pause') as HTMLButtonElement;
    await act(async () => {
      pauseBtn.click();
    });

    expect(mockPause).toHaveBeenCalledTimes(1);
  });

  it('triggers onTerminate when clicking Termina ed Elimina button', async () => {
    const mockTerminate = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: true,
          onClose: vi.fn(),
          onPause: vi.fn(),
          onTerminate: mockTerminate,
          sessionTitle: 'Test Session',
          currentIndex: 2,
          totalQuestions: 10,
          answeredCount: 2
        })
      );
    });

    const terminateBtn = container.querySelector('#btn-interrupt-terminate') as HTMLButtonElement;
    await act(async () => {
      terminateBtn.click();
    });

    expect(mockTerminate).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking Continua button or pressing Escape', async () => {
    const mockClose = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: true,
          onClose: mockClose,
          onPause: vi.fn(),
          onTerminate: vi.fn(),
          sessionTitle: 'Test Session',
          currentIndex: 2,
          totalQuestions: 10,
          answeredCount: 2
        })
      );
    });

    const resumeBtn = container.querySelector('#btn-interrupt-resume') as HTMLButtonElement;
    await act(async () => {
      resumeBtn.click();
    });
    expect(mockClose).toHaveBeenCalledTimes(1);

    // Escape key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });

  it('registers with backNavigation coordinator and closes on submodal back', () => {
    const mockClose = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionInterruptModal, {
          isOpen: true,
          onClose: mockClose,
          onPause: vi.fn(),
          onTerminate: vi.fn(),
          sessionTitle: 'Test Session',
          currentIndex: 0,
          totalQuestions: 10,
          answeredCount: 0
        })
      );
    });

    const closer = backNavigation.popTopSubModal();
    expect(closer).toBeDefined();
    closer?.();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
