// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { useAviationVoice } from './useAviationVoice';
import { voiceService } from '../services/voiceService';
import { renderHook } from '../test/hookHarness';
import type { VoicePlaybackState } from '../types/audio';

describe('useAviationVoice Hook', () => {
  const defaultState: VoicePlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentQuestionId: null,
    activePart: null,
    isSequencePlaying: false,
    isDriveIntroPlaying: false
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(voiceService, 'getState').mockReturnValue(defaultState);
  });

  it('should initialize with voiceService state and subscribe to changes', () => {
    let subscriber: ((state: VoicePlaybackState) => void) | null = null;
    vi.spyOn(voiceService, 'subscribe').mockImplementation((cb) => {
      subscriber = cb;
      return () => {
        subscriber = null;
      };
    });

    const { result, unmount } = renderHook(() => useAviationVoice(101));

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isThisQuestionActive).toBe(false);

    // Simulate state update from voiceService
    const newState: VoicePlaybackState = {
      ...defaultState,
      isPlaying: true,
      currentQuestionId: 101,
      activePart: 'question'
    };

    act(() => {
      subscriber?.(newState);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isThisQuestionActive).toBe(true);
    expect(result.current.isPartPlaying('question')).toBe(true);
    expect(result.current.isPartPlaying('opt1')).toBe(false);
    expect(result.current.isPartActive('question')).toBe(true);
    expect(result.current.isPartPaused('question')).toBe(false);

    unmount();
    expect(subscriber).toBeNull();
  });

  it('should compute part status correctly when paused', () => {
    const pausedState: VoicePlaybackState = {
      ...defaultState,
      isPlaying: false,
      isPaused: true,
      currentQuestionId: 101,
      activePart: 'opt2'
    };

    vi.spyOn(voiceService, 'getState').mockReturnValue(pausedState);

    const { result, unmount } = renderHook(() => useAviationVoice(101));

    expect(result.current.isThisQuestionActive).toBe(true);
    expect(result.current.isPartPlaying('opt2')).toBe(false);
    expect(result.current.isPartPaused('opt2')).toBe(true);
    expect(result.current.isPartActive('opt2')).toBe(true);

    unmount();
  });

  it('should forward playback commands to voiceService with questionId', () => {
    const toggleSpy = vi.spyOn(voiceService, 'togglePlayPause').mockResolvedValue(undefined);
    const restartSeqSpy = vi.spyOn(voiceService, 'restartFullSequence').mockResolvedValue(undefined);
    const restartCurSpy = vi.spyOn(voiceService, 'restartCurrentOrSequence').mockResolvedValue(undefined);
    const playSeqSpy = vi.spyOn(voiceService, 'playFullSequence').mockResolvedValue(undefined);
    const playPartSpy = vi.spyOn(voiceService, 'playSinglePart').mockResolvedValue(undefined);
    const restartPartSpy = vi.spyOn(voiceService, 'restartSinglePart').mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() => useAviationVoice(202));

    result.current.togglePlayPause();
    expect(toggleSpy).toHaveBeenCalledWith(202);

    result.current.restartFullSequence();
    expect(restartSeqSpy).toHaveBeenCalledWith(202);

    result.current.restartCurrentOrSequence();
    expect(restartCurSpy).toHaveBeenCalledWith(202);

    result.current.playFullSequence();
    expect(playSeqSpy).toHaveBeenCalledWith(202);

    result.current.playQuestion();
    expect(playPartSpy).toHaveBeenCalledWith(202, 'question');

    result.current.restartQuestion();
    expect(restartPartSpy).toHaveBeenCalledWith(202, 'question');

    result.current.playOption(1);
    expect(playPartSpy).toHaveBeenCalledWith(202, 'opt1');

    result.current.playOption(2);
    expect(playPartSpy).toHaveBeenCalledWith(202, 'opt2');

    result.current.playOption(3);
    expect(playPartSpy).toHaveBeenCalledWith(202, 'opt3');

    result.current.restartOption(2);
    expect(restartPartSpy).toHaveBeenCalledWith(202, 'opt2');

    result.current.playExplanation();
    expect(playPartSpy).toHaveBeenCalledWith(202, 'explanation');

    result.current.restartExplanation();
    expect(restartPartSpy).toHaveBeenCalledWith(202, 'explanation');

    unmount();
  });

  it('should forward global playback controls', () => {
    const pauseSpy = vi.spyOn(voiceService, 'pause').mockImplementation(() => {});
    const resumeSpy = vi.spyOn(voiceService, 'resume').mockResolvedValue(undefined);
    const stopSpy = vi.spyOn(voiceService, 'stop').mockImplementation(() => {});
    const playIntroSpy = vi.spyOn(voiceService, 'playDriveIntro').mockResolvedValue(undefined);
    const stopIntroSpy = vi.spyOn(voiceService, 'stopDriveIntro').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useAviationVoice());

    result.current.pause();
    expect(pauseSpy).toHaveBeenCalled();

    result.current.resume();
    expect(resumeSpy).toHaveBeenCalled();

    result.current.stop();
    expect(stopSpy).toHaveBeenCalled();

    result.current.playDriveIntro();
    expect(playIntroSpy).toHaveBeenCalled();

    result.current.stopDriveIntro();
    expect(stopIntroSpy).toHaveBeenCalled();

    unmount();
  });

  it('should safely do nothing when questionId is undefined on question-scoped actions', () => {
    const toggleSpy = vi.spyOn(voiceService, 'togglePlayPause');
    const playPartSpy = vi.spyOn(voiceService, 'playSinglePart');

    const { result, unmount } = renderHook(() => useAviationVoice(undefined));

    result.current.togglePlayPause();
    result.current.playOption(1);
    result.current.restartOption(1);
    result.current.playExplanation();
    result.current.restartExplanation();

    expect(toggleSpy).not.toHaveBeenCalled();
    expect(playPartSpy).not.toHaveBeenCalled();

    unmount();
  });
});
