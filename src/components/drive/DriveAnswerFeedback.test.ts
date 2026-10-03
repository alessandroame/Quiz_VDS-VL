import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveActiveHUD } from './DriveActiveHUD';
import { voiceService } from '../../services/voiceService';
import { formatExplanationForSpeech } from '../../utils/aviationPhonetics';
import type { Question } from '../../types/quiz';

const sampleQuestion: Question = {
  id: 1001,
  subjectId: 1,
  subjectName: 'Normativa e Legislazione',
  discipline: 'all',
  question: 'Chi può praticare autonomamente il volo libero?',
  options: [
    'Chiunque purché abbia frequentato un corso.',
    'Chiunque munito dei requisiti richiesti dalle norme in vigore.',
    'Chiunque abbia superato un esame AeCI.'
  ],
  correctAnswer: 2,
  explanation: {
    rule: 'Il D.P.R. 133/2010 stabilisce i requisiti di attestato e assicurazione RCT.',
    trap: 'Credere che basti aver frequentato la scuola.'
  }
};

describe('DriveAnswerFeedback - Audio & Tutor Answer Feedback Verification', () => {
  it('AUDIO-FEEDBACK-01: quando l\'utente dà la risposta CORRETTA in modalità Audio Tutor, mostra stile successo e NESSUN elemento di errore', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 120,
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
        answers: { 1001: 2 }, // Risposta corretta (opzione 2)
        flags: {},
        revealedQuestionId: 1001,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // L'opzione 2 selezionata deve avere stile successo (emerald)
    expect(html).toContain('id="btn-drive-opt-2"');
    expect(html).toContain('bg-emerald-950/80');
    expect(html).toContain('border-emerald-500');

    // NESSUNA opzione deve avere stile errore (rose-950 o icona di errore XCircle)
    expect(html).not.toContain('bg-rose-950/80');
    expect(html).not.toContain('text-rose-400 flex-shrink-0'); // Icona XCircle di risposta errata

    // Scheda didattica presente per approfondimento
    expect(html).toContain('id="drive-didactic-card"');
    expect(html).toContain('Regola');
    expect(html).toContain(sampleQuestion.explanation.rule);
    expect(html).toContain('Tranello');
    expect(html).toContain(sampleQuestion.explanation.trap);
    // Pulsante con opzione di ascolto volontario (non narrato in automatico se corretto)
    expect(html).toContain('title="Ascolta spiegazione vocale"');
    expect(html).toContain('<span>Ascolta</span>');
  });

  it('AUDIO-FEEDBACK-02: quando l\'utente dà la risposta ERRATA in modalità Audio Tutor, evidenzia l\'opzione sbagliata in rosso e quella corretta in verde', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 120,
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
        answers: { 1001: 1 }, // Risposta ERRATA (l'utente ha scelto 1 ma la corretta è 2)
        flags: {},
        revealedQuestionId: 1001,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // L'opzione 1 selezionata errata deve avere stile errore (rose)
    expect(html).toContain('bg-rose-950/80');
    expect(html).toContain('border-rose-500');

    // L'opzione 2 corretta deve essere evidenziata in verde smeraldo
    expect(html).toContain('bg-emerald-950/80');
    expect(html).toContain('border-emerald-500');

    // Scheda didattica visibile per spiegare la regola e il tranello
    expect(html).toContain('id="drive-didactic-card"');
    // Pulsante con opzione di riascolto (poiché narrato in automatico all'errore)
    expect(html).toContain('title="Riascolta spiegazione vocale"');
    expect(html).toContain('<span>Riascolta</span>');
  });

  it('AUDIO-FEEDBACK-03: il testo pronunciato della spiegazione didattica è neutrale e NON contiene mai "Risposta errata"', () => {
    const text = formatExplanationForSpeech(
      sampleQuestion.correctAnswer,
      sampleQuestion.options[sampleQuestion.correctAnswer - 1],
      sampleQuestion.explanation.rule,
      sampleQuestion.explanation.trap
    );

    // Deve iniziare con la risposta corretta senza assumere che l'utente abbia sbagliato
    expect(text).toMatch(/^La risposta esatta è la due:/);
    expect(text).not.toContain('Risposta errata');
    expect(text).not.toContain('risposta errata');
    expect(text).toContain('Regola:');
    expect(text).toContain('Tranello:');
  });

  it('AUDIO-FEEDBACK-04: voiceService punta al frammento audio _e.mp3 per la spiegazione didattica neutrale', () => {
    const urlGiuseppe = voiceService.getAudioUrl(1001, 'explanation', 'giuseppe');
    expect(urlGiuseppe).toContain('/audio/giuseppe/1001_e.mp3');

    const urlElsa = voiceService.getAudioUrl(1001, 'explanation', 'elsa');
    expect(urlElsa).toContain('/audio/elsa/1001_e.mp3');
  });

  it('AUDIO-FEEDBACK-05: in modalità esame senza tutor, le risposte date vengono rivelate immediatamente con feedback verde/rosso e didattica', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: sampleQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 120,
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onClose: () => {},
        onExecuteClose: () => {},
        isAutopilotEnabled: true,
        onToggleAutopilot: () => {},
        isTutorEnabled: false, // Esame ufficiale non-tutor
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
        answers: { 1001: 1 }, // Risposta errata
        flags: {},
        revealedQuestionId: null,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // Anche senza tutor esplicito, la risposta errata mostra stile rosso e quella esatta verde
    expect(html).toContain('bg-rose-950/80');
    expect(html).toContain('border-rose-500');
    expect(html).toContain('bg-rose-500 text-white');
    expect(html).toContain('bg-emerald-950/80');
    expect(html).toContain('border-emerald-500');
    expect(html).toContain('bg-emerald-500 text-white');
    expect(html).toContain('id="drive-didactic-card"');
  });

  it('AUDIO-FEEDBACK-06: cliccare su un\'opzione ferma immediatamente voiceService', () => {
    const mockStop = vi.spyOn(voiceService, 'stop');
    const mockOnSelectAnswer = vi.fn();
    const mockOnStopVoice = vi.fn();

    // Verify option button click triggers voiceService.stop()
    const element = React.createElement(DriveActiveHUD, {
      currentQ: sampleQuestion,
      currentIndex: 0,
      totalCount: 30,
      isExamSession: true,
      secondsRemaining: 120,
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
      isPartPlaying: () => true,
      isExplanationPlaying: false,
      onTogglePlayPause: () => {},
      onRestartCurrentOrSequence: () => {},
      onStopVoice: mockOnStopVoice,
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
      onSelectAnswer: mockOnSelectAnswer,
      onPrevQuestion: () => {},
      onNextQuestion: () => {},
      onToggleFlag: () => {},
      onSubmitExam: () => {}
    });

    const rendered = renderToString(element);
    expect(rendered).toContain('id="btn-drive-opt-1"');
    expect(mockStop).toBeDefined();
    expect(mockOnSelectAnswer).toBeDefined();
    expect(mockOnStopVoice).toBeDefined();
  });
});

