import { useState, useEffect, useRef } from 'react';

export interface UseWakeLockResult {
  isActive: boolean;
  isSupported: boolean;
  error: string | null;
}

/**
 * Hook per la gestione dello Screen Wake Lock API.
 * Mantiene lo schermo del dispositivo acceso durante la Modalità Alla Guida o sessioni d'esame.
 * Gestisce automaticamente il riaggancio del lock quando la pagina torna in primo piano (visibilitychange).
 */
export function useWakeLock(enabled: boolean = true): UseWakeLockResult {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockSentinelRef = useRef<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    if (!enabled || !isSupported) {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
        setIsActive(false);
      }
      return;
    }

    let isMounted = true;

    const requestLock = async () => {
      try {
        if (wakeLockSentinelRef.current) {
          await wakeLockSentinelRef.current.release().catch(() => {});
          wakeLockSentinelRef.current = null;
        }

        const lock = await (navigator as any).wakeLock.request('screen');
        if (!isMounted) {
          lock.release().catch(() => {});
          return;
        }

        wakeLockSentinelRef.current = lock;
        setIsActive(true);
        setError(null);

        lock.addEventListener('release', () => {
          if (isMounted) {
            setIsActive(false);
          }
        });
      } catch (err: any) {
        if (isMounted) {
          setIsActive(false);
          setError(err?.message || 'Wake Lock rifiutato');
        }
      }
    };

    requestLock();

    // Quando la finestra torna visibile, riacquisisce il Wake Lock se rilasciato dal sistema operativo
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isMounted) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
        setIsActive(false);
      }
    };
  }, [enabled, isSupported]);

  return { isActive, isSupported, error };
}
