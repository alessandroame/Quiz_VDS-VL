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

  return {
    ...state,
    isThisQuestionActive,
    isPartPlaying,
    playFullSequence: () => {
      if (questionId) voiceService.playFullSequence(questionId);
    },
    playQuestion: () => {
      if (questionId) voiceService.playSinglePart(questionId, 'question');
    },
    playOption: (index: 1 | 2 | 3) => {
      if (!questionId) return;
      const partMap: Record<1 | 2 | 3, AudioPart> = { 1: 'opt1', 2: 'opt2', 3: 'opt3' };
      voiceService.playSinglePart(questionId, partMap[index]);
    },
    playExplanation: () => {
      if (questionId) voiceService.playSinglePart(questionId, 'explanation');
    },
    stop: () => voiceService.stop()
  };
}
