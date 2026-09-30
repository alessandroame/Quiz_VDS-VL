/**
 * Vitest environment setup.
 * Ensures essential browser globals are polyfilled in Node test environments.
 */

if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = {
    onLine: true,
  };
} else if (typeof (globalThis.navigator as any).onLine === 'undefined') {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true,
  });
}

// Enable React 19 act() support in happy-dom / test environments
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
