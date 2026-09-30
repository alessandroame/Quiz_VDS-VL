import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

export interface RenderHookResult<T> {
  result: { current: T };
  rerender: (props?: any) => void;
  unmount: () => void;
}

/**
 * Lightweight test utility for testing React hooks in a DOM environment (happy-dom).
 * Compliant with React 19 root and act lifecycle.
 */
export function renderHook<T, P = any>(hookFn: (props?: P) => T, initialProps?: P): RenderHookResult<T> {
  const result = { current: undefined as unknown as T };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  let currentProps = initialProps;

  function TestComponent() {
    result.current = hookFn(currentProps);
    return null;
  }

  act(() => {
    root.render(React.createElement(TestComponent));
  });

  return {
    result,
    rerender: (newProps?: P) => {
      currentProps = newProps;
      act(() => {
        root.render(React.createElement(TestComponent));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    }
  };
}
