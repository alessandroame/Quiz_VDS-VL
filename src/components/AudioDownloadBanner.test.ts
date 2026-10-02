// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot } from 'react-dom/client';

let mockStatuses: any = {
  giuseppe: {
    voice: 'giuseppe',
    downloadedCount: 0,
    totalCount: 2520,
    percent: 0,
    isDownloading: false,
    isComplete: false,
    error: null
  },
  elsa: {
    voice: 'elsa',
    downloadedCount: 0,
    totalCount: 2520,
    percent: 0,
    isDownloading: false,
    isComplete: false,
    error: null
  }
};

const mockCancelDownload = vi.fn();
let subscribers: Array<(statuses: any) => void> = [];

vi.mock('../services/audioDownloadManager', () => ({
  audioDownloadManager: {
    getAllStatuses: () => ({ ...mockStatuses }),
    subscribe: (cb: (statuses: any) => void) => {
      subscribers.push(cb);
      return () => {
        subscribers = subscribers.filter(s => s !== cb);
      };
    },
    cancelDownload: (...args: any[]) => mockCancelDownload(...args)
  }
}));

import { AudioDownloadBanner } from './AudioDownloadBanner';

describe('AudioDownloadBanner Component (Bottom Screen Alignment)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    subscribers = [];
    mockStatuses = {
      giuseppe: {
        voice: 'giuseppe',
        downloadedCount: 0,
        totalCount: 2520,
        percent: 0,
        isDownloading: false,
        isComplete: false,
        error: null
      },
      elsa: {
        voice: 'elsa',
        downloadedCount: 0,
        totalCount: 2520,
        percent: 0,
        isDownloading: false,
        isComplete: false,
        error: null
      }
    };
  });

  it('renders nothing when no voices are downloading', () => {
    const html = renderToString(React.createElement(AudioDownloadBanner));
    expect(html).toBe('');
  });

  it('renders docked banner aligned to the bottom of the screen when Giuseppe is downloading', () => {
    mockStatuses.giuseppe = {
      voice: 'giuseppe',
      downloadedCount: 504,
      totalCount: 2520,
      percent: 20,
      isDownloading: true,
      isComplete: false,
      error: null
    };

    const html = renderToString(React.createElement(AudioDownloadBanner));

    // Must be docked flush to the bottom of the display
    expect(html).toContain('id="audio-download-bottom-banner"');
    expect(html).toContain('fixed bottom-0 left-0 right-0');
    expect(html).toContain('z-[60]');
    expect(html).toContain('pb-[max(0.6rem,env(safe-area-inset-bottom))]');
    expect(html).toContain('Scaricamento Giuseppe');
    expect(html).toContain('20%');
    expect(html).toContain('504');
    expect(html).toMatch(/2[.,]?520\s+file/);
    expect(html).toContain('id="btn-cancel-audio-download"');
  });

  it('renders aggregated progress when both voices are downloading', () => {
    mockStatuses.giuseppe = {
      voice: 'giuseppe',
      downloadedCount: 252,
      totalCount: 2520,
      percent: 10,
      isDownloading: true,
      isComplete: false,
      error: null
    };
    mockStatuses.elsa = {
      voice: 'elsa',
      downloadedCount: 504,
      totalCount: 2520,
      percent: 20,
      isDownloading: true,
      isComplete: false,
      error: null
    };

    const html = renderToString(React.createElement(AudioDownloadBanner));

    expect(html).toContain('Scaricamento Giuseppe ed Elsa');
    // Total 756 / 5040 = 15%
    expect(html).toContain('15%');
    expect(html).toContain('756');
    expect(html).toMatch(/5[.,]?040\s+file/);
  });

  it('calls cancelDownload on button click', () => {
    mockStatuses.giuseppe = {
      voice: 'giuseppe',
      downloadedCount: 100,
      totalCount: 2520,
      percent: 4,
      isDownloading: true,
      isComplete: false,
      error: null
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(AudioDownloadBanner));
    });

    const cancelBtn = container.querySelector('#btn-cancel-audio-download') as HTMLButtonElement;
    expect(cancelBtn).not.toBeNull();

    act(() => {
      cancelBtn.click();
    });

    expect(mockCancelDownload).toHaveBeenCalledWith('giuseppe');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders elevated styling when elevated is true during active exam', () => {
    mockStatuses.elsa = {
      voice: 'elsa',
      downloadedCount: 1000,
      totalCount: 2520,
      percent: 40,
      isDownloading: true,
      isComplete: false,
      error: null
    };

    const html = renderToString(React.createElement(AudioDownloadBanner, { elevated: true }));

    // Sits above quiz bottom bar without touching screen bottom
    expect(html).toContain('bottom-[60px]');
    expect(html).toContain('z-[60]');
    expect(html).toContain('Scaricamento Elsa');
    expect(html).toContain('40%');
  });
});
