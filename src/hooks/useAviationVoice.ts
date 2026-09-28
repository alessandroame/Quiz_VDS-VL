import { useState, useEffect } from 'react';
import { voiceService } from '../services/voiceService';
import type { AudioPart, VoicePlaybackState } from '../types/audio';

export function useAviationVoice(questionId?: number) {
  const [state, setState] = useState<VoicePlaybackState>(voiceService.getState());

  useEffect(() => {
    return voiceService.subscribe(setState);
  }, []);

  const isThisQuestionActive = questionId !== undefined && state.currentQuestionId === questionId;
  const isPartPlaying = (part: AudioPart) => isThisQuestionActive && state.activePart === part && state.isPlaying;
  const isPartPaused = (part: AudioPart) => isThisQuestionActive && state.activePart === part && state.isPaused;
  const isPartActive = (part: AudioPart) => isThisQuestionActive && state.activePart === part && (state.isPlaying || state.isPaused);

  return {
    ...state,
    isThisQuestionActive,
    isPartPlaying,
    isPartPaused,
    isPartActive,
    togglePlayPause: () => {
      if (questionId) voiceService.togglePlayPause(questionId);
    },
    restartFullSequence: () => {
      if (questionId) voiceService.restartFullSequence(questionId);
    },
    restartCurrentOrSequence: () => {
      if (questionId) voiceService.restartCurrentOrSequence(questionId);
    },
    playFullSequence: () => {
      if (questionId) voiceService.playFullSequence(questionId);
    },
    playQuestion: () => {
      if (questionId) voiceService.playSinglePart(questionId, 'question');
    },
    restartQuestion: () => {
      if (questionId) voiceService.restartSinglePart(questionId, 'question');
    },
    playOption: (index: 1 | 2 | 3) => {
      if (!questionId) return;
      const partMap: Record<1 | 2 | 3, AudioPart> = { 1: 'opt1', 2: 'opt2', 3: 'opt3' };
      voiceService.playSinglePart(questionId, partMap[index]);
    },
    restartOption: (index: 1 | 2 | 3) => {
      if (!questionId) return;
      const partMap: Record<1 | 2 | 3, AudioPart> = { 1: 'opt1', 2: 'opt2', 3: 'opt3' };
      voiceService.restartSinglePart(questionId, partMap[index]);
    },
    playExplanation: () => {
      if (questionId) voiceService.playSinglePart(questionId, 'explanation');
    },
    restartExplanation: () => {
      if (questionId) voiceService.restartSinglePart(questionId, 'explanation');
    },
    pause: () => voiceService.pause(),
    resume: () => voiceService.resume(),
    stop: () => voiceService.stop(),
    playDriveIntro: () => voiceService.playDriveIntro(),
    stopDriveIntro: () => voiceService.stopDriveIntro()
  };
}
