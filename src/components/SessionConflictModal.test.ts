// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionConflictModal } from './SessionConflictModal';
import { backNavigation } from '../utils/backNavigation';

describe('SessionConflictModal Component', () => {
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
        React.createElement(SessionConflictModal, {
          isOpen: false,
          onClose: vi.fn(),
          onResumeExisting: vi.fn(),
          onDiscardAndStartNew: vi.fn(),
          existingTitle: 'Simulazione Esame',
          existingProgress: 'Domanda 5 di 30 • 4 risposte date',
          newSessionTitle: 'Studio Materia: Meteorologia'
        })
      );
    });

    expect(container.children.length).toBe(0);
  });

  it('renders details of existing session and new session title when isOpen is true', () => {
    act(() => {
      root.render(
        React.createElement(SessionConflictModal, {
          isOpen: true,
          onClose: vi.fn(),
          onResumeExisting: vi.fn(),
          onDiscardAndStartNew: vi.fn(),
          existingTitle: 'Simulazione Esame AeCI',
          existingProgress: 'Domanda 12 di 30 • 10 risposte date',
          newSessionTitle: 'Studio Materia: Normativa'
        })
      );
    });

    expect(container.textContent).toContain('Sessione in Sospeso');
    expect(container.textContent).toContain('Simulazione Esame AeCI');
    expect(container.textContent).toContain('Domanda 12 di 30 • 10 risposte date');
    expect(container.textContent).toContain('Studio Materia: Normativa');

    expect(container.querySelector('#btn-conflict-resume')).not.toBeNull();
    expect(container.querySelector('#btn-conflict-discard-start')).not.toBeNull();
    expect(container.querySelector('#btn-conflict-cancel')).not.toBeNull();
  });

  it('triggers onResumeExisting when clicking resume button', async () => {
    const mockResume = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionConflictModal, {
          isOpen: true,
          onClose: vi.fn(),
          onResumeExisting: mockResume,
          onDiscardAndStartNew: vi.fn(),
          existingTitle: 'Test Session',
          existingProgress: 'Progress',
          newSessionTitle: 'New Session'
        })
      );
    });

    const resumeBtn = container.querySelector('#btn-conflict-resume') as HTMLButtonElement;
    await act(async () => {
      resumeBtn.click();
    });

    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it('triggers onDiscardAndStartNew when clicking discard & start new button', async () => {
    const mockDiscard = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionConflictModal, {
          isOpen: true,
          onClose: vi.fn(),
          onResumeExisting: vi.fn(),
          onDiscardAndStartNew: mockDiscard,
          existingTitle: 'Test Session',
          existingProgress: 'Progress',
          newSessionTitle: 'New Session'
        })
      );
    });

    const discardBtn = container.querySelector('#btn-conflict-discard-start') as HTMLButtonElement;
    await act(async () => {
      discardBtn.click();
    });

    expect(mockDiscard).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking cancel button or pressing Escape', async () => {
    const mockClose = vi.fn();
    act(() => {
      root.render(
        React.createElement(SessionConflictModal, {
          isOpen: true,
          onClose: mockClose,
          onResumeExisting: vi.fn(),
          onDiscardAndStartNew: vi.fn(),
          existingTitle: 'Test Session',
          existingProgress: 'Progress',
          newSessionTitle: 'New Session'
        })
      );
    });

    const cancelBtn = container.querySelector('#btn-conflict-cancel') as HTMLButtonElement;
    await act(async () => {
      cancelBtn.click();
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
        React.createElement(SessionConflictModal, {
          isOpen: true,
          onClose: mockClose,
          onResumeExisting: vi.fn(),
          onDiscardAndStartNew: vi.fn(),
          existingTitle: 'Test Session',
          existingProgress: 'Progress',
          newSessionTitle: 'New Session'
        })
      );
    });

    const closer = backNavigation.popTopSubModal();
    expect(closer).toBeDefined();
    closer?.();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
