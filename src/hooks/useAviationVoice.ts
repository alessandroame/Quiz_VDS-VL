import { useState, useEffect, useCallback } from 'react';
import { voiceService } from '../services/voiceService';
import type { AudioPart, VoicePlaybackState } from '../types/audio';

export function useAviationVoice(questionId?: number) {
  const [state, setState] = useState<VoicePlaybackState>(voiceService.getState());

  useEffect(() => {
    return voiceService.subscribe(setState);
  }, []);

  useEffect(() => {
    return () => {
      if (questionId !== undefined && voiceService.getState().currentQuestionId === questionId) {
        voiceService.stop();
      }
    };
  }, [questionId]);

  const isThisQuestionActive = questionId !== undefined && state.currentQuestionId === questionId;
  const isPartPlaying = useCallback(
    (part: AudioPart) => isThisQuestionActive && state.activePart === part && state.isPlaying,
    [isThisQuestionActive, state.activePart, state.isPlaying]
  );
  const isPartPaused = useCallback(
    (part: AudioPart) => isThisQuestionActive && state.activePart === part && state.isPaused,
    [isThisQuestionActive, state.activePart, state.isPaused]
  );
  const isPartActive = useCallback(
    (part: AudioPart) => isThisQuestionActive && state.activePart === part && (state.isPlaying || state.isPaused),
    [isThisQuestionActive, state.activePart, state.isPlaying, state.isPaused]
  );

  const togglePlayPause = useCallback(() => {
    if (questionId) voiceService.togglePlayPause(questionId);
  }, [questionId]);

  const restartFullSequence = useCallback(() => {
    if (questionId) voiceService.restartFullSequence(questionId);
  }, [questionId]);

  const restartCurrentOrSequence = useCallback(() => {
    if (questionId) voiceService.restartCurrentOrSequence(questionId);
  }, [questionId]);

  const playFullSequence = useCallback(() => {
    if (questionId) voiceService.playFullSequence(questionId);
  }, [questionId]);

  const playQuestion = useCallback(() => {
    if (questionId) voiceService.playSinglePart(questionId, 'question');
  }, [questionId]);

  const restartQuestion = useCallback(() => {
    if (questionId) voiceService.restartSinglePart(questionId, 'question');
  }, [questionId]);

  const playOption = useCallback((index: 1 | 2 | 3) => {
    if (!questionId) return;
    const partMap: Record<1 | 2 | 3, AudioPart> = { 1: 'opt1', 2: 'opt2', 3: 'opt3' };
    voiceService.playSinglePart(questionId, partMap[index]);
  }, [questionId]);

  const restartOption = useCallback((index: 1 | 2 | 3) => {
    if (!questionId) return;
    const partMap: Record<1 | 2 | 3, AudioPart> = { 1: 'opt1', 2: 'opt2', 3: 'opt3' };
    voiceService.restartSinglePart(questionId, partMap[index]);
  }, [questionId]);

  const playExplanation = useCallback(() => {
    if (questionId) voiceService.playSinglePart(questionId, 'explanation');
  }, [questionId]);

  const restartExplanation = useCallback(() => {
    if (questionId) voiceService.restartSinglePart(questionId, 'explanation');
  }, [questionId]);

  const pause = useCallback(() => voiceService.pause(), []);
  const resume = useCallback(() => voiceService.resume(), []);
  const stop = useCallback(() => voiceService.stop(), []);
  const playDriveIntro = useCallback(() => voiceService.playDriveIntro(), []);
  const stopDriveIntro = useCallback(() => voiceService.stopDriveIntro(), []);

  return {
    ...state,
    isThisQuestionActive,
    isPartPlaying,
    isPartPaused,
    isPartActive,
    togglePlayPause,
    restartFullSequence,
    restartCurrentOrSequence,
    playFullSequence,
    playQuestion,
    restartQuestion,
    playOption,
    restartOption,
    playExplanation,
    restartExplanation,
    pause,
    resume,
    stop,
    playDriveIntro,
    stopDriveIntro
  };
}
