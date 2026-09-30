// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BuildInfoModal } from './BuildInfoModal';

describe('BuildInfoModal Component (Diagnostic & PWA Reload)', () => {
  it('should not render anything when isOpen is false', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(BuildInfoModal, { isOpen: false, onClose: () => {} }));
    });

    expect(container.innerHTML).toBe('');
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('should render dialog with build details and action buttons when open', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const onClose = vi.fn();
    act(() => {
      root.render(React.createElement(BuildInfoModal, { isOpen: true, onClose }));
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    // Check title and labels
    expect(container.textContent).toContain('Versione e Build');
    expect(container.textContent).toContain('Numero Build');
    expect(container.textContent).toContain('Commit Git');
    expect(container.textContent).toContain('Forza Aggiornamento PWA');
    expect(container.textContent).toContain('Copia Dettagli Build');

    // Test close button
    const closeBtn = container.querySelector('button[aria-label="Chiudi"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    act(() => {
      closeBtn.click();
    });
    expect(onClose).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
