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
