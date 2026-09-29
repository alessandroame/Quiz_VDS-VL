/**
 * Aviation Haptics Utility
 * Provides tactile vibration feedback for high-vibration outdoor environments
 * (e.g. bicycle handlebars, running, bumpy cockpits).
 */

export type HapticType = 'tap' | 'success' | 'error' | 'warning';

/**
 * Triggers haptic vibration pattern based on action type.
 * Returns true if vibration was accepted, false otherwise.
 */
export const triggerHapticFeedback = (type: HapticType = 'tap'): boolean => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    switch (type) {
      case 'tap':
        return navigator.vibrate(20);
      case 'success':
        return navigator.vibrate([25, 60, 40]);
      case 'error':
        return navigator.vibrate([50, 80, 50, 80, 50]);
      case 'warning':
        return navigator.vibrate([35, 50, 35]);
      default:
        return false;
    }
  } catch {
    return false;
  }
};
