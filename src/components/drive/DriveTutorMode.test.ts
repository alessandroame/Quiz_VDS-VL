import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../VoiceQuickMenu', () => ({
  VoiceQuickMenu: () => React.createElement('div', { 'data-testid': 'voice-quick-menu' })
}));

import { DriveLauncher } from './DriveLauncher';
import { DriveActiveHUD } from './DriveActiveHUD';
import { parseVoiceCommand } from '../../utils/voiceCommandParser';
import type { Question } from '../../types/quiz';

const mockQuestion: Question = {
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

describe('Drive Mode Tutor Integration', () => {
  it('renders the Tutor Didattico quick start button in DriveLauncher', () => {
    const handleStartTutor = vi.fn();
    const handleStartExam = vi.fn();

    const html = renderToString(
      React.createElement(DriveLauncher, {
        isAutopilotEnabled: true,
        onToggleAutopilot: () => {},
        isVoiceCommandsEnabled: false,
        isVoiceSupported: true,
        onToggleVoiceCommands: () => {},
        audioOutputMode: 'speaker',
        onToggleAudioOutput: () => {},
        isTutorEnabled: true,
        onToggleTutor: () => {},
        isIntroActive: false,
        onDismissIntro: () => {},
        onReplayIntro: () => {},
        onOpenVoiceGuide: () => {},
        setIsVoiceMenuOpen: () => {},
        onStartExam: handleStartExam,
        onStartTutorExam: handleStartTutor,
        onStartRadioQuiz: () => {},
        onStartMistakesQuiz: () => {},
        isWakeLockActive: true,
        onClose: () => {}
      })
    );

    expect(html).toContain('id="btn-drive-start-tutor"');
    expect(html).toContain('Tutor (30 Quiz)');
    expect(html).toContain('id="btn-drive-start-exam"');
    expect(html).toContain('Esame Ufficiale AeCI');
    expect(html).toContain('ATTIVA (Regola + Tranello su errore)');
  });

  it('renders the didactic card with Rule and Trap when answer is selected in Tutor mode', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: mockQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 42,
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
        answers: { 1001: 2 }, // User answered question 1001 correctly
        flags: {},
        revealedQuestionId: 1001,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // Scheda didattica presente
    expect(html).toContain('id="drive-didactic-card"');
    expect(html).toContain('Spiegazione Didattica');
    expect(html).toContain('Regola');
    expect(html).toContain(mockQuestion.explanation!.rule);
    expect(html).toContain('Tranello');
    expect(html).toContain(mockQuestion.explanation!.trap);

    // Timer badge indica tempo trascorso per tutor
    expect(html).toContain('title="Tempo trascorso (Tutor Didattico)"');

    // Tutor toggle button is removed from active HUD top bar to prevent clutter
    expect(html).not.toContain('id="btn-drive-tutor-toggle"');

    // On correct answer, offer voluntary listen button without repeating
    expect(html).toContain('title="Ascolta spiegazione vocale"');
    expect(html).toContain('<span>Ascolta</span>');
  });

  it('renders "Riascolta" button on didactic card when user answer is wrong in Tutor mode', () => {
    const html = renderToString(
      React.createElement(DriveActiveHUD, {
        currentQ: mockQuestion,
        currentIndex: 0,
        totalCount: 30,
        isExamSession: true,
        secondsRemaining: 42,
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
        answers: { 1001: 3 }, // User answered WRONGLY (option 3 instead of 2)
        flags: {},
        revealedQuestionId: 1001,
        onSelectAnswer: () => {},
        onPrevQuestion: () => {},
        onNextQuestion: () => {},
        onToggleFlag: () => {},
        onSubmitExam: () => {}
      })
    );

    // Scheda didattica presente con opzione di riascolto (dopo lettura automatica su errore)
    expect(html).toContain('id="drive-didactic-card"');
    expect(html).toContain('title="Riascolta spiegazione vocale"');
    expect(html).toContain('<span>Riascolta</span>');
  });

  it('correctly parses voice commands related to Tutor mode and didactics', () => {
    expect(parseVoiceCommand('attiva tutor')).toBe('tutor_on');
    expect(parseVoiceCommand('abilita tutor')).toBe('tutor_on');
    expect(parseVoiceCommand('disattiva tutor')).toBe('tutor_off');
    expect(parseVoiceCommand('spiega')).toBe('explain');
    expect(parseVoiceCommand('regola')).toBe('explain');
    expect(parseVoiceCommand('tranello')).toBe('explain');
    expect(parseVoiceCommand('tutor')).toBe('toggle_tutor');
  });
});
