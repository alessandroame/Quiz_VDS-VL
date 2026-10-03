// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { voiceService } from '../services/voiceService';
import type { Question } from '../types/quiz';

const mockStop = vi.spyOn(voiceService, 'stop').mockImplementation(() => {});

const sampleQuestion: Question = {
  id: 1001,
  subjectId: 1,
  subjectName: 'Normativa',
  discipline: 'all',
  question: 'Chi può volare in VDS?',
  options: ['Opzione A errata', 'Opzione B corretta', 'Opzione C errata'],
  correctAnswer: 2,
  explanation: {
    rule: 'Regola di volo',
    trap: 'Tranello comune'
  }
};

const mockUseQuiz = vi.fn();
vi.mock('../context/QuizContext', () => ({
  useQuiz: () => mockUseQuiz()
}));

vi.mock('../services/examEvaluator', () => ({
  evaluateExam: () => ({
    id: 'test-session',
    date: Date.now(),
    score: 28,
    totalQuestions: 30,
    wrongAnswers: 2,
    isPassed: true,
    durationSeconds: 120,
    examMode: 'tutor',
    snapshots: []
  })
}));

import { ExamScreen } from './ExamScreen';
import { TopicsScreen } from './TopicsScreen';
import { MistakesScreen } from './MistakesScreen';
import { DriveActiveHUD } from './drive/DriveActiveHUD';

describe('Voice Auto-Stop on Back & Quiz Termination Contracts', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockUseQuiz.mockReturnValue({
      questions: [sampleQuestion],
      filteredQuestions: [sampleQuestion],
      statsMap: new Map([[1001, { timesSeen: 1, timesWrong: 1, consecutiveCorrect: 0 }]]),
      subjectsAnalytics: [{ id: 1, name: 'Normativa', total: 1, seen: 1, wrong: 1, masteryScore: 50 }],
      mistakesCount: 1,
      settings: {
        ttsEnabled: true,
        ttsAutoPlayQuestion: false,
        ttsAutoExplainOnMistake: true,
        immediateFeedbackInTopics: true
      },
      saveExam: vi.fn(),
      recordAnswer: vi.fn(),
      setIsExamRunning: vi.fn(),
      registerAudioSessionContext: vi.fn(),
      activeSession: null,
      persistActiveSession: vi.fn(),
      dismissActiveSession: vi.fn()
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('VOICE-STOP-01: unmounting ExamScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-02: clicking abandon (Interrompi) or submit (Concludi) in ExamScreen stops voice immediately', async () => {
    // Render ExamScreen with an active session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1001],
        currentIndex: 0,
        answers: {},
        flags: {},
        startTime: Date.now()
      }
    });

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    // Check Interrompi button
    const abandonBtn = container.querySelector('#btn-abandon-exam') as HTMLButtonElement;
    expect(abandonBtn).not.toBeNull();

    mockStop.mockClear();
    await act(async () => {
      abandonBtn.click();
    });
    expect(mockStop).toHaveBeenCalled();

    // Check Submit button
    const submitBtn = container.querySelector('#btn-submit-exam-top') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();

    mockStop.mockClear();
    await act(async () => {
      submitBtn.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-03: unmounting TopicsScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(TopicsScreen));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-04: clicking Esci or Concludi in TopicsScreen session stops voiceService', async () => {
    // Provide active topic session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'topic',
        subjectId: 1,
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(TopicsScreen));
    });

    // Look for Esci/Interrompi/Pausa button
    const buttons = Array.from(container.querySelectorAll('button'));
    const esciBtn = buttons.find(b => b.id?.includes('interrupt') || b.textContent?.includes('Esci') || b.textContent?.includes('Interrompi') || b.textContent?.includes('Pausa'));
    expect(esciBtn).toBeDefined();

    mockStop.mockClear();
    await act(async () => {
      esciBtn?.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-05: unmounting MistakesScreen stops voiceService', () => {
    act(() => {
      root.render(React.createElement(MistakesScreen));
    });
    expect(mockStop).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-06: clicking Esci in MistakesScreen review session stops voiceService', async () => {
    // Provide active mistake review session
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'mistakes',
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(MistakesScreen));
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const esciBtn = buttons.find(b => b.id?.includes('interrupt') || b.textContent?.includes('Esci') || b.textContent?.includes('Interrompi') || b.textContent?.includes('Pausa'));
    expect(esciBtn).toBeDefined();

    mockStop.mockClear();
    await act(async () => {
      esciBtn?.click();
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-07: onAbandonSession in ExamScreen stops voice and resets state', async () => {
    let capturedCtx: any = null;
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      registerAudioSessionContext: (ctx: any) => {
        capturedCtx = ctx;
      },
      activeSession: {
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1001],
        currentIndex: 0,
        answers: {},
        flags: {},
        startTime: Date.now()
      }
    });

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    expect(capturedCtx).not.toBeNull();
    expect(typeof capturedCtx.onAbandonSession).toBe('function');

    mockStop.mockClear();
    act(() => {
      capturedCtx.onAbandonSession();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-08: onAbandonSession in TopicsScreen stops voice and resets subject', async () => {
    let capturedCtx: any = null;
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      registerAudioSessionContext: (ctx: any) => {
        capturedCtx = ctx;
      },
      activeSession: {
        type: 'topic',
        subjectId: 1,
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(TopicsScreen));
    });

    expect(capturedCtx).not.toBeNull();
    expect(typeof capturedCtx.onAbandonSession).toBe('function');

    mockStop.mockClear();
    act(() => {
      capturedCtx.onAbandonSession();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-09: onAbandonSession in MistakesScreen stops voice and resets review state', async () => {
    let capturedCtx: any = null;
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      registerAudioSessionContext: (ctx: any) => {
        capturedCtx = ctx;
      },
      activeSession: {
        type: 'mistakes',
        questionIds: [1001],
        currentIndex: 0,
        answers: {}
      }
    });

    await act(async () => {
      root.render(React.createElement(MistakesScreen));
    });

    expect(capturedCtx).not.toBeNull();
    expect(typeof capturedCtx.onAbandonSession).toBe('function');

    mockStop.mockClear();
    act(() => {
      capturedCtx.onAbandonSession();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-10: selecting an option in ExamScreen stops voiceService immediately', async () => {
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      activeSession: {
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1001],
        currentIndex: 0,
        answers: {},
        flags: {},
        startTime: Date.now()
      }
    });

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    mockStop.mockClear();

    const optionBtn = container.querySelector('#btn-option-1') as HTMLButtonElement;
    expect(optionBtn).not.toBeNull();

    await act(async () => {
      optionBtn.click();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-11: changing question in ExamScreen stops voiceService immediately', async () => {
    mockUseQuiz.mockReturnValue({
      ...mockUseQuiz(),
      questions: [sampleQuestion, { ...sampleQuestion, id: 1002 }],
      filteredQuestions: [sampleQuestion, { ...sampleQuestion, id: 1002 }],
      activeSession: {
        type: 'exam',
        examMode: 'tutor',
        questionIds: [1001, 1002],
        currentIndex: 0,
        answers: { 1001: 2 },
        flags: {},
        startTime: Date.now()
      }
    });

    await act(async () => {
      root.render(React.createElement(ExamScreen, { initialMode: 'tutor' }));
    });

    mockStop.mockClear();

    const nextBtn = container.querySelector('#btn-tutor-next-question') as HTMLButtonElement;
    expect(nextBtn).not.toBeNull();

    await act(async () => {
      nextBtn.click();
    });

    expect(mockStop).toHaveBeenCalled();
  });

  it('VOICE-STOP-12: clicking an option in DriveActiveHUD stops voiceService immediately', async () => {
    mockStop.mockClear();

    await act(async () => {
      root.render(
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
    });

    const optBtn = container.querySelector('#btn-drive-opt-1') as HTMLButtonElement;
    expect(optBtn).not.toBeNull();

    await act(async () => {
      optBtn.click();
    });

    expect(mockStop).toHaveBeenCalled();
  });
});


