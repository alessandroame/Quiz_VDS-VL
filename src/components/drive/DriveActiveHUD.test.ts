import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveActiveHUD } from './DriveActiveHUD';
import type { Question } from '../../types/quiz';

const sampleLongQuestion: Question = {
  id: 3003,
  subjectId: 3,
  subjectName: 'Pronto Soccorso',
  discipline: 'all',
  question: 'Come comportarsi alla presenza di un infortunato di cui si sospettano lesioni interne di entità sconosciuta?',
  options: [
    'Ispezionarlo attentamente, interrogandolo sulle parti dolenti e facendolo muovere se può, indi chiamare i mezzi di soccorso.',
    'Non muoverlo assolutamente e non consentire che egli stesso si muova, provvedere immediatamente a chiamare personale e mezzi di soccorso qualificati e attrezzati (eliambulanza, ambulanza, etc.).',
    'Cercare di metterlo in piedi, se la cosa risulta impossibile e se l\'infortunato si lamenta chiamare idonei mezzi di soccorso.'
  ],
  correctAnswer: 2,
  explanation: {
    rule: 'Qualsiasi movimento in presenza di emorragie interne o fratture instabili può scatenare shock emorragico fatale.',
    trap: 'Cercare di far alzare o muovere il ferito.'
  }
};

describe('DriveActiveHUD - Karaoke Accordion & Long Text Expansion', () => {
  it('HUD-EXPAND-01: renders long options with line-clamp-2 and manual expand badges when audio is idle', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 7,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 200,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: true,
        onToggleAutopilot: () => {},
        isTutorEnabled: false,
        onToggleTutor: () => {},
        isVoiceSupported: true,
        isVoiceCommandsEnabled: false,
        voiceError: null,
        isVoiceReceiving: false,
        isVoiceListening: false,
        onToggleVoiceCommands: () => {},
        isPlaying: false,
        isPaused: false,
        isPartPlaying: () => false,
        isExplanationPlaying: false,
        onTogglePlayPause: () => {},
        onRestartCurrentOrSequence: () => {},
        onStopVoice: () => {},
        onPlayExplanation: () => {},
        waitingCountdown: null,
        assimilationCountdown: null,
        voiceInterimTranscript: '',
        voiceLastTranscript: '',
        lastRecognizedLabel: null,
        unrecognizedSpeech: null,
        voiceHint: '',
        answers: {},
        flags: {},
        revealedQuestionId: null,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // Verify option container has safety overflow
    expect(html).toContain('overflow-y-auto custom-scrollbar');

    // Verify buttons have overflow-hidden
    expect(html).toContain('overflow-hidden');

    // All long options have line-clamp-2 in idle state
    expect(html).toContain('line-clamp-2');

    // Expand badges exist for long options
    expect(html).toContain('id="btn-drive-opt-expand-1"');
    expect(html).toContain('id="btn-drive-opt-expand-2"');
    expect(html).toContain('id="btn-drive-opt-expand-3"');
    expect(html).toContain('Leggi tutto');

    // Long question has expand badge
    expect(html).toContain('id="btn-drive-question-expand"');
  });

  it('HUD-EXPAND-02: dynamically unclamps only the option currently spoken by the voice engine (karaoke accordion)', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 7,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 200,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: true,
        onToggleAutopilot: () => {},
        isTutorEnabled: false,
        onToggleTutor: () => {},
        isVoiceSupported: true,
        isVoiceCommandsEnabled: false,
        voiceError: null,
        isVoiceReceiving: false,
        isVoiceListening: false,
        onToggleVoiceCommands: () => {},
        isPlaying: true,
        isPaused: false,
        isPartPlaying: (part: string) => part === 'opt2',
        isExplanationPlaying: false,
        onTogglePlayPause: () => {},
        onRestartCurrentOrSequence: () => {},
        onStopVoice: () => {},
        onPlayExplanation: () => {},
        waitingCountdown: null,
        assimilationCountdown: null,
        voiceInterimTranscript: '',
        voiceLastTranscript: '',
        lastRecognizedLabel: null,
        unrecognizedSpeech: null,
        voiceHint: '',
        answers: {},
        flags: {},
        revealedQuestionId: null,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // Option 2 is speaking -> expanded with line-clamp-none and Riduci button
    expect(html).toContain('line-clamp-none');
    expect(html).toContain('Riduci');

    // Options 1 and 3 are still clamped
    expect(html).toContain('line-clamp-2');
  });

  it('HUD-EXPAND-03: dynamically unclamps question heading when isPartPlaying("question") is true', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 7,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 200,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: true,
        onToggleAutopilot: () => {},
        isTutorEnabled: false,
        onToggleTutor: () => {},
        isVoiceSupported: true,
        isVoiceCommandsEnabled: false,
        voiceError: null,
        isVoiceReceiving: false,
        isVoiceListening: false,
        onToggleVoiceCommands: () => {},
        isPlaying: true,
        isPaused: false,
        isPartPlaying: (part: string) => part === 'question',
        isExplanationPlaying: false,
        onTogglePlayPause: () => {},
        onRestartCurrentOrSequence: () => {},
        onStopVoice: () => {},
        onPlayExplanation: () => {},
        waitingCountdown: null,
        assimilationCountdown: null,
        voiceInterimTranscript: '',
        voiceLastTranscript: '',
        lastRecognizedLabel: null,
        unrecognizedSpeech: null,
        voiceHint: '',
        answers: {},
        flags: {},
        revealedQuestionId: null,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // The h2 element should have line-clamp-none when question is playing
    expect(html).toContain('line-clamp-none');
    expect(html).toContain('text-amber-300');
  });
});
