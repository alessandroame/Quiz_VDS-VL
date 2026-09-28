import { useState, useEffect } from 'react';
import { networkStatus, type NetworkState } from '../services/networkStatus';

export type OnlineStatus = NetworkState;

/**
 * Custom React hook that monitors network online/offline state.
 * Re-renders components immediately on status changes and handles cleanup.
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => networkStatus.getState());

  useEffect(() => {
    return networkStatus.subscribe(setStatus);
  }, []);

  return status;
}
