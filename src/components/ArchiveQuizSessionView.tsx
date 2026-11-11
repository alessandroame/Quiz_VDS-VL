import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause } from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { QuestionCard } from './QuestionCard';
import { QuizBottomBar } from './QuizBottomBar';
import { SessionInterruptModal } from './SessionInterruptModal';
import { voiceService } from '../services/voiceService';
import { getNextQuestionIndex } from '../utils/quizNavigation';

export interface ArchiveQuizSessionViewProps {
  sessionQuestions: Question[];
  sessionTitle: string;
  currentIndex: number;
  sessionAnswers: Record<number, 1 | 2 | 3>;
  sessionFlags: Record<number, boolean>;
  onChangeIndex: (nextIndex: number) => void;
  onSelectAnswer: (ans: 1 | 2 | 3, qid?: number) => void;
  onToggleFlag: (qid?: number) => void;
  onPauseSession: () => void;
  onCompleteOrTerminateSession: (navigateHome?: boolean) => void;
}

export const ArchiveQuizSessionView: React.FC<ArchiveQuizSessionViewProps> = ({
  sessionQuestions,
  sessionTitle,
  currentIndex,
  sessionAnswers,
  sessionFlags,
  onChangeIndex,
  onSelectAnswer,
  onToggleFlag,
  onPauseSession,
  onCompleteOrTerminateSession
}) => {
  const { settings, registerAudioSessionContext } = useQuiz();
  const [showInterruptModal, setShowInterruptModal] = useState(false);

  const answersRef = useRef(sessionAnswers);
  const flagsRef = useRef(sessionFlags);
  useEffect(() => {
    answersRef.current = sessionAnswers;
  }, [sessionAnswers]);
  useEffect(() => {
    flagsRef.current = sessionFlags;
  }, [sessionFlags]);

  // Register Hands-Free audio session context for seamless universal switch
  useEffect(() => {
    if (sessionQuestions.length === 0) {
      registerAudioSessionContext(null);
      return;
    }

    registerAudioSessionContext({
      questions: sessionQuestions,
      currentIndex,
      answers: answersRef.current,
      flags: flagsRef.current,
      onAnswer: (qid: number, ans: 1 | 2 | 3) => onSelectAnswer(ans, qid),
      onToggleFlag: (qid: number) => onToggleFlag(qid),
      onNavigateIndex: (idx: number) => onChangeIndex(idx),
      isExam: false,
      isTutor: settings.immediateFeedbackInTopics,
      onAbandonSession: () => {
        voiceService.stop();
        onCompleteOrTerminateSession(false);
      },
      title: sessionTitle
    });

    return () => {
      registerAudioSessionContext(null);
    };
  }, [
    sessionQuestions,
    currentIndex,
    sessionAnswers,
    sessionFlags,
    sessionTitle,
    settings.immediateFeedbackInTopics,
    registerAudioSessionContext,
    onSelectAnswer,
    onToggleFlag,
    onChangeIndex,
    onCompleteOrTerminateSession
  ]);

  const currentQ = sessionQuestions[currentIndex];
  if (!currentQ) return null;

  const answeredCount = Object.keys(sessionAnswers).length;

  return (
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2.5 sm:space-y-3 pb-28 sm:pb-32">
      {/* Top session control bar */}
      <div className="flex items-center justify-between p-2 sm:p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl light:bg-white light:border-slate-300 light:shadow-sm">
        <button
          id="btn-archive-quiz-interrupt"
          onClick={() => {
            voiceService.stop();
            setShowInterruptModal(true);
          }}
          className="text-xs text-zinc-400 hover:text-zinc-200 light:text-slate-600 flex items-center gap-1 font-medium px-1.5 py-1 rounded-lg"
        >
          <Pause className="w-4 h-4" />
          <span>Pausa</span>
        </button>

        <div
          id="archive-quiz-session-title"
          className="text-xs font-bold text-zinc-200 light:text-slate-800 truncate max-w-[190px] sm:max-w-xs"
        >
          {sessionTitle}
        </div>

        <div className="text-xs font-mono text-amber-400 light:text-amber-800 font-semibold whitespace-nowrap">
          {currentIndex + 1}/{sessionQuestions.length}
        </div>
      </div>

      {/* Active Question Card */}
      <QuestionCard
        question={currentQ}
        selectedAnswer={sessionAnswers[currentQ.id]}
        onSelectAnswer={onSelectAnswer}
        showFeedback={settings.immediateFeedbackInTopics}
        isFlagged={sessionFlags[currentQ.id] === true}
        onToggleFlag={() => onToggleFlag(currentQ.id)}
        indexNumber={currentIndex + 1}
        totalNumber={sessionQuestions.length}
      />

      {/* Sticky Bottom Quiz Bar */}
      <QuizBottomBar
        currentIndex={currentIndex}
        totalCount={sessionQuestions.length}
        onPrevious={() => onChangeIndex(Math.max(0, currentIndex - 1))}
        onNext={() =>
          onChangeIndex(getNextQuestionIndex(currentIndex, sessionQuestions, sessionAnswers))
        }
        isPreviousDisabled={currentIndex === 0}
        isNextDisabled={currentIndex === sessionQuestions.length - 1}
        previousId="btn-archive-prev-question"
        nextId="btn-archive-next-question"
        flagAction={{
          id: 'btn-archive-flag-question',
          isFlagged: sessionFlags[currentQ.id] === true,
          onToggle: () => onToggleFlag(currentQ.id)
        }}
        centerContent={
          <span className="font-mono text-zinc-400 light:text-slate-600 font-semibold whitespace-nowrap">
            {currentIndex + 1} / {sessionQuestions.length}
          </span>
        }
        primaryAction={
          currentIndex === sessionQuestions.length - 1
            ? {
                id: 'btn-archive-quiz-complete',
                label: `Concludi (${answeredCount})`,
                variant: 'emerald',
                icon: <CheckCircle2 className="w-4 h-4" />,
                onClick: () => {
                  voiceService.stop();
                  onCompleteOrTerminateSession(false);
                }
              }
            : undefined
        }
      />

      {/* Session Interrupt Modal */}
      <SessionInterruptModal
        isOpen={showInterruptModal}
        onClose={() => setShowInterruptModal(false)}
        onPause={() => {
          setShowInterruptModal(false);
          onPauseSession();
        }}
        onTerminate={() => {
          setShowInterruptModal(false);
          onCompleteOrTerminateSession(true);
        }}
        sessionTitle={sessionTitle}
        currentIndex={currentIndex}
        totalQuestions={sessionQuestions.length}
        answeredCount={answeredCount}
      />
    </div>
  );
};
