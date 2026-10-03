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

  it('HUD-EXPAND-02: dynamically unclamps the spoken option while speaking so long text is fully visible', () => {
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

    // Option 2 is speaking -> styled with amber active ring and pulse
    expect(html).toContain('ring-amber-400');
    expect(html).toContain('animate-pulse');

    // Spoken option 2 is unclasped to line-clamp-none so text is fully expanded
    expect(html).toContain('line-clamp-none');
    expect(html).toContain('Riduci');

    // Other options remain clamped to line-clamp-2
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

  it('HUD-EXPAND-04: does NOT render expand badges when option texts fit normally without truncation', () => {
    const sampleShortQuestion: Question = {
      id: 5051,
      subjectId: 5,
      subjectName: 'Meteorologia e Aerologia',
      discipline: 'all',
      question: "Quale effetto produce la presenza di rotori sottovento?",
      options: [
        "la curva o diagramma di stato dell'atmosfera di quella località a quell'ora.",
        "l'adiabatica secca dell'atmosfera di quella località a quell'ora.",
        "l'isoterma di quella località a quell'ora."
      ],
      correctAnswer: 1,
      explanation: {
        rule: "Riportando su un grafico cartesiano i valori di temperatura ambiente rilevati a varie quote si ottiene la curva o diagramma di stato dell'atmosfera locale.",
        trap: "L'adiabatica è una curva teorica di raffreddamento di una particella in ascesa, non il rilievo effettivo dell'atmosfera reale."
      }
    };

    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleShortQuestion,
        currentIndex: 0,
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

    // No expand buttons for these options because they fit without truncation
    expect(html).not.toContain('id="btn-drive-opt-expand-1"');
    expect(html).not.toContain('id="btn-drive-opt-expand-2"');
    expect(html).not.toContain('id="btn-drive-opt-expand-3"');
    expect(html).not.toContain('Leggi tutto');
  });

  it('HUD-EXPAND-06: renders expand badge for question 7006 long option 3 in SSR fallback', () => {
    const question7006: Question = {
      id: 7006,
      subjectId: 7,
      subjectName: 'Tecnica di Pilotaggio',
      discipline: 'all',
      question: 'Come è possibile ottenere, a prescindere da altre condizioni, il minor tasso di caduta possibile con deltaplano e parapendio?',
      options: [
        "Volando in linea retta ed all'incidenza massima consentita.",
        "Volando comunque al regime di massima efficienza in aria calma.",
        "Volando in linea retta ad una incidenza compresa tra quella di massima efficienza in aria calma e quella di stallo."
      ],
      correctAnswer: 3,
      explanation: {
        rule: 'Il regime di minimo tasso di caduta si ottiene volando a velocità inferiore e incidenza maggiore rispetto alla massima efficienza.',
        trap: "All'incidenza massima consentita l'ala è prossima allo stallo."
      }
    };

    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: question7006,
        currentIndex: 5,
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

    // Option 3 (115 chars > 80) has expand button in SSR
    expect(html).toContain('id="btn-drive-opt-expand-3"');
    expect(html).toContain('Leggi tutto');
    // Question itself (125 chars > 80) has expand button
    expect(html).toContain('id="btn-drive-question-expand"');
  });

  it('HUD-TOPBAR-01: does not render the tutor toggle button or icon in the top bar header to keep it uncluttered on mobile', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 0,
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
        isTutorEnabled: true,
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

    expect(html).not.toContain('id="btn-drive-tutor-toggle"');
    expect(html).not.toContain('Tutor ON');
  });

  it('HUD-EXPAND-05: gives flex-1 to the expanded option and flex-none to collapsed options so the expanded option occupies maximum available space', () => {
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

    // Option 2 is speaking -> expanded -> flex-1
    // Options 1 and 3 are collapsed -> flex-none
    expect(html).toContain('id="btn-drive-opt-2"');
    const opt2Match = html.match(/id="btn-drive-opt-2"[^>]*class="([^"]*)"/);
    const opt1Match = html.match(/id="btn-drive-opt-1"[^>]*class="([^"]*)"/);
    const opt3Match = html.match(/id="btn-drive-opt-3"[^>]*class="([^"]*)"/);

    expect(opt2Match?.[1]).toContain('flex-1');
    expect(opt1Match?.[1]).toContain('flex-none');
    expect(opt3Match?.[1]).toContain('flex-none');
  });

  it('HUD-COOLDOWN-01: disables option buttons and sets pointer-events-none when isCooldownActive is true', () => {
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
        onSubmitExam: () => {},
        isCooldownActive: true
      })
    );

    expect(html).toContain('pointer-events-none');
    expect(html).toContain('disabled=""');
  });

  it('HUD-RESPONSIVE-TOPBAR-01: renders #btn-drive-exit with responsive text (hidden sm:inline) to prevent top bar overflow on mobile', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: false,
        secondsRemaining: 0,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: false,
        onToggleAutopilot: () => {},
        isTutorEnabled: false,
        onToggleTutor: () => {},
        isVoiceSupported: true,
        isVoiceCommandsEnabled: true,
        voiceError: null,
        isVoiceReceiving: false,
        isVoiceListening: true,
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

    expect(html).toContain('id="btn-drive-exit"');
    expect(html).toContain('class="hidden sm:inline">Vista Normale</span>');
    expect(html).toContain('p-1.5 sm:px-3 sm:py-1.5');
  });

  it('HUD-TOPBAR-SPATIAL-01: renders #btn-drive-exit in the right cluster alongside voice menu for spatial consistency with Navbar', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleLongQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: false,
        secondsRemaining: 0,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: false,
        onToggleAutopilot: () => {},
        isTutorEnabled: false,
        onToggleTutor: () => {},
        isVoiceSupported: true,
        isVoiceCommandsEnabled: true,
        voiceError: null,
        isVoiceReceiving: false,
        isVoiceListening: true,
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

    // The question counter must appear before #btn-drive-exit in DOM order (left to right)
    const counterIndex = html.indexOf('text-amber-400 light:text-amber-600');
    const exitBtnIndex = html.indexOf('id="btn-drive-exit"');
    const voiceMenuIndex = html.indexOf('data-testid="voice-quick-menu"');

    expect(counterIndex).toBeGreaterThan(-1);
    expect(exitBtnIndex).toBeGreaterThan(counterIndex);
    expect(voiceMenuIndex).toBeGreaterThan(exitBtnIndex);
  });
});


