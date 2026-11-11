import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Play,
  Hash,
  Delete,
  CornerDownLeft,
  X,
  Sparkles
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { voiceService } from '../services/voiceService';
import { ArchiveItem } from './ArchiveItemCard';
import { ArchiveQuizSessionView } from './ArchiveQuizSessionView';
import { SessionConflictModal } from './SessionConflictModal';
import { getNextQuestionIndex } from '../utils/quizNavigation';
import {
  formatSubjectCode,
  findQuestionById,
  getArchiveStatusCounts,
  filterArchiveQuestions,
  ARCHIVE_CONCEPT_CHIPS,
  type ArchiveStatusFilter
} from '../utils/archiveFilters';
import { triggerHapticFeedback } from '../utils/haptics';
import { backNavigation } from '../utils/backNavigation';
import type { Question } from '../types/quiz';

export interface ArchiveScreenProps {
  onNavigateHome?: () => void;
}

const STATUS_LABELS: Record<ArchiveStatusFilter, string> = {
  all: 'Tutte',
  unseen: 'Non viste',
  incorrect: 'Errate',
  correct: 'Esatte',
  bookmarked: 'Preferiti',
  with_notes: 'Note'
};

export const ArchiveScreen: React.FC<ArchiveScreenProps> = ({ onNavigateHome }) => {
  const {
    questions,
    statsMap,
    subjectsAnalytics,
    settings,
    recordAnswer,
    activeSession,
    persistActiveSession,
    dismissActiveSession,
    setIsExamRunning
  } = useQuiz();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ArchiveStatusFilter>('all');
  const [activeConceptChipId, setActiveConceptChipId] = useState<string | null>(null);
  const [activeFilterCategory, setActiveFilterCategory] = useState<'subject' | 'status' | 'theme'>('subject');
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [numericBuffer, setNumericBuffer] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Interactive quiz session state over currently filtered questions
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, 1 | 2 | 3>>({});
  const [sessionFlags, setSessionFlags] = useState<Record<number, boolean>>({});
  const [sessionTitle, setSessionTitle] = useState<string>('Quiz Archivio');
  const [conflictPendingPool, setConflictPendingPool] = useState<{ questions: Question[]; title: string } | null>(null);

  const sessionAnswersRef = useRef<Record<number, 1 | 2 | 3>>(sessionAnswers);
  const sessionFlagsRef = useRef<Record<number, boolean>>(sessionFlags);
  const isDismissedRef = useRef(false);
  const autoAdvanceTimerRef = useRef<any>(null);

  useEffect(() => {
    sessionAnswersRef.current = sessionAnswers;
  }, [sessionAnswers]);

  useEffect(() => {
    sessionFlagsRef.current = sessionFlags;
  }, [sessionFlags]);

  useEffect(() => {
    setIsExamRunning(isQuizRunning);
    return () => {
      setIsExamRunning(false);
    };
  }, [isQuizRunning, setIsExamRunning]);

  const INITIAL_PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);

  // Stop any ongoing voice playback and pending auto-advance timers on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, []);

  // Auto-resume an existing Archive quiz session when entering ArchiveScreen
  useEffect(() => {
    if (!isQuizRunning && !isDismissedRef.current && activeSession?.type === 'archive' && activeSession.questionIds?.length > 0) {
      const ordered = activeSession.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => Boolean(q));

      if (ordered.length > 0) {
        const resumedAnswers = activeSession.answers || {};
        const resumedFlags = activeSession.flags || {};
        setSessionQuestions(ordered);
        setSessionTitle(activeSession.subjectName || 'Quiz Archivio');
        setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
        setSessionAnswers(resumedAnswers);
        sessionAnswersRef.current = resumedAnswers;
        setSessionFlags(resumedFlags);
        sessionFlagsRef.current = resumedFlags;
        setIsQuizRunning(true);
      }
    }
  }, [activeSession, isQuizRunning, questions]);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [searchQuery, selectedSubject, statusFilter, activeConceptChipId]);

  // Register #ID keypad as submodal so hardware back button closes it
  useEffect(() => {
    if (!isKeypadOpen) return;
    const unregister = backNavigation.registerSubModal('archive-keypad', () => {
      setIsKeypadOpen(false);
    });
    return () => unregister();
  }, [isKeypadOpen]);

  // Compute status counts dynamically based on current subject scope
  const statusCounts = useMemo(() => {
    return getArchiveStatusCounts(questions, statsMap, selectedSubject);
  }, [questions, statsMap, selectedSubject]);

  // Filter questions using pure business utility
  const filteredQuestions = useMemo(() => {
    return filterArchiveQuestions(questions, statsMap, {
      searchQuery,
      subjectId: selectedSubject,
      statusFilter,
      conceptChipId: activeConceptChipId
    });
  }, [questions, statsMap, searchQuery, selectedSubject, statusFilter, activeConceptChipId]);

  // Ensure expanded question is within visible list
  useEffect(() => {
    if (expandedId !== null) {
      const idx = filteredQuestions.findIndex(q => q.id === expandedId);
      if (idx >= visibleCount) {
        setVisibleCount(Math.max(visibleCount, idx + 20));
      }
    }
  }, [expandedId, filteredQuestions, visibleCount]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedSubject !== 'all' ||
    statusFilter !== 'all' ||
    activeConceptChipId ||
    numericBuffer
  );

  const buildArchiveSessionTitle = useCallback(() => {
    const parts: string[] = [];
    if (selectedSubject !== 'all') {
      parts.push(`Materia ${formatSubjectCode(selectedSubject)}`);
    }
    if (statusFilter !== 'all') {
      parts.push(STATUS_LABELS[statusFilter]);
    }
    if (activeConceptChipId) {
      const chip = ARCHIVE_CONCEPT_CHIPS.find(c => c.id === activeConceptChipId);
      if (chip) parts.push(chip.label);
    }
    if (searchQuery.trim()) {
      parts.push(`"${searchQuery.trim().slice(0, 18)}"`);
    }
    return parts.length > 0 ? `Archivio: ${parts.join(' · ')}` : 'Quiz Archivio Completo';
  }, [selectedSubject, statusFilter, activeConceptChipId, searchQuery]);

  const startArchiveQuiz = useCallback((pool: Question[], title: string) => {
    if (pool.length === 0) return;
    voiceService.stop();
    isDismissedRef.current = false;
    setIsKeypadOpen(false);
    setSessionQuestions(pool);
    setSessionTitle(title);
    setCurrentIndex(0);
    setSessionAnswers({});
    sessionAnswersRef.current = {};
    setSessionFlags({});
    sessionFlagsRef.current = {};
    setIsQuizRunning(true);

    persistActiveSession({
      type: 'archive',
      subjectName: title,
      questionIds: pool.map(q => q.id),
      currentIndex: 0,
      answers: {},
      flags: {},
      isPaused: false,
      updatedAt: Date.now()
    }).catch(console.error);
  }, [persistActiveSession]);

  const handleRequestStartArchiveQuiz = () => {
    if (filteredQuestions.length === 0) return;
    triggerHapticFeedback('tap');
    const title = buildArchiveSessionTitle();
    if (activeSession && activeSession.questionIds?.length > 0) {
      setConflictPendingPool({ questions: [...filteredQuestions], title });
    } else {
      startArchiveQuiz([...filteredQuestions], title);
    }
  };

  const changeIndex = useCallback((nextIndex: number) => {
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex(nextIndex);
    if (sessionQuestions.length > 0) {
      persistActiveSession({
        type: 'archive',
        subjectName: sessionTitle,
        questionIds: sessionQuestions.map(q => q.id),
        currentIndex: nextIndex,
        answers: sessionAnswersRef.current,
        flags: sessionFlagsRef.current,
        updatedAt: Date.now()
      }).catch(console.error);
    }
  }, [persistActiveSession, sessionQuestions, sessionTitle]);

  const handleSelectQuizAnswer = useCallback(async (ans: 1 | 2 | 3, qid?: number) => {
    voiceService.stop();
    const currentQ = sessionQuestions[currentIndex];
    const targetQid = qid ?? currentQ?.id;
    if (!targetQid) return;
    if (settings.immediateFeedbackInTopics && sessionAnswersRef.current[targetQid] !== undefined) {
      return;
    }

    const targetQ = sessionQuestions.find(q => q.id === targetQid) || currentQ;
    if (!targetQ) return;

    const updatedAnswers = { ...sessionAnswersRef.current, [targetQid]: ans };
    sessionAnswersRef.current = updatedAnswers;
    setSessionAnswers(updatedAnswers);

    const isCorrect = ans === targetQ.correctAnswer;
    try {
      await recordAnswer(targetQid, isCorrect, ans, 'archive');
    } catch (err) {
      console.error(err);
    }

    persistActiveSession({
      type: 'archive',
      subjectName: sessionTitle,
      questionIds: sessionQuestions.map(q => q.id),
      currentIndex,
      answers: updatedAnswers,
      flags: sessionFlagsRef.current,
      updatedAt: Date.now()
    }).catch(console.error);

    if (
      isCorrect &&
      settings.autoAdvanceOnCorrect !== false &&
      targetQid === currentQ?.id
    ) {
      const nextIdx = getNextQuestionIndex(currentIndex, sessionQuestions, updatedAnswers, { fallbackToEndIfComplete: true });
      if (nextIdx !== currentIndex) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = setTimeout(() => {
          changeIndex(nextIdx);
        }, 900);
      }
    }
  }, [sessionQuestions, currentIndex, settings.immediateFeedbackInTopics, settings.autoAdvanceOnCorrect, recordAnswer, persistActiveSession, sessionTitle, changeIndex]);

  const handleToggleQuizFlag = useCallback((qid?: number) => {
    const currentQ = sessionQuestions[currentIndex];
    const targetQid = qid ?? currentQ?.id;
    if (!targetQid) return;
    const updatedFlags = {
      ...sessionFlagsRef.current,
      [targetQid]: !sessionFlagsRef.current[targetQid]
    };
    sessionFlagsRef.current = updatedFlags;
    setSessionFlags(updatedFlags);

    persistActiveSession({
      type: 'archive',
      subjectName: sessionTitle,
      questionIds: sessionQuestions.map(q => q.id),
      currentIndex,
      answers: sessionAnswersRef.current,
      flags: updatedFlags,
      updatedAt: Date.now()
    }).catch(console.error);
  }, [sessionQuestions, currentIndex, persistActiveSession, sessionTitle]);

  const handlePauseArchiveQuiz = useCallback(() => {
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    isDismissedRef.current = true;
    persistActiveSession({
      type: 'archive',
      subjectName: sessionTitle,
      questionIds: sessionQuestions.map(q => q.id),
      currentIndex,
      answers: sessionAnswersRef.current,
      flags: sessionFlagsRef.current,
      isPaused: true,
      pausedAt: Date.now(),
      updatedAt: Date.now()
    }).catch(console.error);
    setIsQuizRunning(false);
    if (onNavigateHome) {
      onNavigateHome();
    }
  }, [persistActiveSession, sessionTitle, sessionQuestions, currentIndex, onNavigateHome]);

  const handleCompleteOrTerminateArchiveQuiz = useCallback(async (navigateHome = false) => {
    voiceService.stop();
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    isDismissedRef.current = true;
    setIsQuizRunning(false);
    await dismissActiveSession();
    if (navigateHome && onNavigateHome) {
      onNavigateHome();
    }
  }, [dismissActiveSession, onNavigateHome]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setStatusFilter('all');
    setActiveConceptChipId(null);
    setNumericBuffer('');
    setIsKeypadOpen(false);
    triggerHapticFeedback('tap');
  };

  const handleKeypadDigit = (digit: string) => {
    triggerHapticFeedback('tap');
    const nextBuf = (numericBuffer + digit).slice(0, 4);
    setNumericBuffer(nextBuf);
    setSearchQuery(nextBuf);

    if (nextBuf.length === 4) {
      const target = findQuestionById(questions, Number(nextBuf));
      if (target) {
        setExpandedId(target.id);
        triggerHapticFeedback('success');
        setTimeout(() => {
          document.getElementById(`archive-item-${target.id}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 120);
      }
    }
  };

  const handleKeypadBackspace = () => {
    triggerHapticFeedback('tap');
    const nextBuf = numericBuffer.slice(0, -1);
    setNumericBuffer(nextBuf);
    setSearchQuery(nextBuf);
  };

  const handleKeypadSubmit = () => {
    if (!numericBuffer) return;
    const target = findQuestionById(questions, Number(numericBuffer));
    if (target) {
      setExpandedId(target.id);
      setIsKeypadOpen(false);
      triggerHapticFeedback('success');
      setTimeout(() => {
        document.getElementById(`archive-item-${target.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 120);
    } else {
      triggerHapticFeedback('warning');
    }
  };

  if (isQuizRunning && sessionQuestions.length > 0) {
    return (
      <ArchiveQuizSessionView
        sessionQuestions={sessionQuestions}
        sessionTitle={sessionTitle}
        currentIndex={currentIndex}
        sessionAnswers={sessionAnswers}
        sessionFlags={sessionFlags}
        onChangeIndex={changeIndex}
        onSelectAnswer={handleSelectQuizAnswer}
        onToggleFlag={handleToggleQuizFlag}
        onPauseSession={handlePauseArchiveQuiz}
        onCompleteOrTerminateSession={handleCompleteOrTerminateArchiveQuiz}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-4 pb-20 sm:pb-24">
      {/* Catalog Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Archivio Completo</h1>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            {`Catalogo ${questions.length} quiz: Parapendio e teoria comune AeCI`}
          </p>
        </div>
        <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-400 light:bg-white light:border-slate-300 light:text-amber-700 shrink-0 whitespace-nowrap">
          {filteredQuestions.length} / {questions.length}
        </div>
      </div>

      {/* Search Bar & #ID Keypad Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="archive-search-input"
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (numericBuffer && !e.target.value) setNumericBuffer('');
            }}
            placeholder="Cerca testo, parola chiave o #ID..."
            className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-400 outline-none focus:border-amber-500 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setNumericBuffer('');
                triggerHapticFeedback('tap');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 p-0.5"
              title="Cancella ricerca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          id="btn-toggle-keypad"
          onClick={() => {
            setIsKeypadOpen(!isKeypadOpen);
            triggerHapticFeedback('tap');
          }}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 transition-all ${
            isKeypadOpen
              ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 light:bg-white light:border-slate-300 light:text-slate-700'
          }`}
          title="Apri tastierino rapido per salto a #ID"
        >
          <Hash className="w-3.5 h-3.5 text-amber-400" />
          <span>#ID</span>
        </button>
      </div>

      {/* #ID Quick Numeric Keypad */}
      {isKeypadOpen && (
        <div className="p-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-2xl space-y-2.5 light:bg-white light:border-slate-300 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-zinc-400 light:text-slate-600">
              Salto rapido a #ID:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                #{numericBuffer || '____'}
              </span>
              {numericBuffer && (
                <button
                  onClick={() => {
                    setNumericBuffer('');
                    setSearchQuery('');
                    triggerHapticFeedback('tap');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 p-0.5"
                  title="Cancella inserimento"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadDigit(num.toString())}
                className="py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-sm font-mono font-bold text-zinc-200 transition-all light:bg-slate-100 light:border-slate-300 light:text-slate-800"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleKeypadBackspace}
              className="py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-xs font-semibold text-zinc-400 flex items-center justify-center transition-all light:bg-slate-100 light:border-slate-300 light:text-slate-700"
              title="Cancella ultima cifra"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleKeypadDigit('0')}
              className="py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-sm font-mono font-bold text-zinc-200 transition-all light:bg-slate-100 light:border-slate-300 light:text-slate-800"
            >
              0
            </button>
            <button
              onClick={handleKeypadSubmit}
              className="py-2.5 rounded-xl border border-amber-600/80 bg-amber-600 hover:bg-amber-500 active:scale-95 text-xs font-bold text-white flex items-center justify-center gap-1 transition-all shadow-sm"
              title="Vai alla domanda"
            >
              <span>VAI</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Category Selector (Materie | Stato | Temi) */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-800/80 light:border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-zinc-900 border border-zinc-700/80 light:bg-slate-100 light:border-slate-200 text-xs">
            <button
              id="archive-tab-subjects"
              onClick={() => {
                setActiveFilterCategory('subject');
                triggerHapticFeedback('tap');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeFilterCategory === 'subject'
                  ? 'bg-zinc-800 text-amber-400 font-bold shadow-sm light:bg-white light:text-amber-800'
                  : 'text-zinc-400 hover:text-zinc-200 light:text-slate-600'
              }`}
            >
              Materie {selectedSubject !== 'all' && `(${formatSubjectCode(selectedSubject)})`}
            </button>
            <button
              id="archive-tab-status"
              onClick={() => {
                setActiveFilterCategory('status');
                triggerHapticFeedback('tap');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeFilterCategory === 'status'
                  ? 'bg-zinc-800 text-amber-400 font-bold shadow-sm light:bg-white light:text-amber-800'
                  : 'text-zinc-400 hover:text-zinc-200 light:text-slate-600'
              }`}
            >
              Stato {statusFilter !== 'all' && `(1)`}
            </button>
            <button
              id="archive-tab-theme"
              onClick={() => {
                setActiveFilterCategory('theme');
                triggerHapticFeedback('tap');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeFilterCategory === 'theme'
                  ? 'bg-zinc-800 text-amber-400 font-bold shadow-sm light:bg-white light:text-amber-800'
                  : 'text-zinc-400 hover:text-zinc-200 light:text-slate-600'
              }`}
            >
              Temi {activeConceptChipId && `(1)`}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              id="btn-archive-reset-filters"
              onClick={handleResetAllFilters}
              className="text-[11px] text-amber-400 hover:text-amber-300 light:text-amber-700 light:hover:text-amber-900 font-medium whitespace-nowrap"
            >
              Azzera filtri
            </button>
          )}
        </div>

        {/* Single Horizontal Scrollable Chip Row */}
        {activeFilterCategory === 'subject' && (
          <div id="archive-filter-row-subject" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setSelectedSubject('all');
                triggerHapticFeedback('tap');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 ${
                selectedSubject === 'all'
                  ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 light:bg-white light:border-slate-300 light:text-slate-700'
              }`}
            >
              TUTTE
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(id => {
              const subName = subjectsAnalytics.find(s => s.id === id)?.name || `Materia ${id}`;
              const isSelected = selectedSubject === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedSubject(id);
                    triggerHapticFeedback('tap');
                  }}
                  title={`${formatSubjectCode(id)} - ${subName}`}
                  className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 light:bg-white light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {formatSubjectCode(id)}
                </button>
              );
            })}
          </div>
        )}

        {activeFilterCategory === 'status' && (
          <div id="archive-filter-row-status" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(
              [
                { id: 'all', label: 'Tutte', count: statusCounts.all },
                { id: 'unseen', label: 'Non viste', count: statusCounts.unseen },
                { id: 'incorrect', label: 'Errate', count: statusCounts.incorrect },
                { id: 'correct', label: 'Esatte', count: statusCounts.correct },
                { id: 'bookmarked', label: 'Preferiti', count: statusCounts.bookmarked },
                { id: 'with_notes', label: 'Note', count: statusCounts.with_notes }
              ] as const
            ).map(filter => {
              const isActive = statusFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  id={filter.id === 'with_notes' ? 'btn-filter-notes' : undefined}
                  onClick={() => {
                    setStatusFilter(filter.id);
                    triggerHapticFeedback('tap');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                    isActive
                      ? 'bg-zinc-200 text-zinc-950 border-zinc-200 font-bold light:bg-zinc-800 light:text-white'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-zinc-400/40 text-zinc-950 font-bold light:bg-zinc-700 light:text-white'
                        : 'bg-zinc-800 text-zinc-300 light:bg-slate-200 light:text-slate-700'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeFilterCategory === 'theme' && (
          <div id="archive-filter-row-theme" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 light:text-slate-600 shrink-0 font-medium pl-0.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Temi:</span>
            </div>
            {ARCHIVE_CONCEPT_CHIPS.map(chip => {
              const isActive = activeConceptChipId === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveConceptChipId(isActive ? null : chip.id);
                    triggerHapticFeedback('tap');
                  }}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 ${
                    isActive
                      ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Bar: Launch Interactive Quiz on Filtered Pool */}
      <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700/80 light:bg-white light:border-slate-300 light:shadow-sm">
        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-semibold text-zinc-200 light:text-slate-800 truncate">
            {hasActiveFilters
              ? `Filtri applicati (${filteredQuestions.length} risultati)`
              : `Tutti i quesiti (${filteredQuestions.length})`}
          </span>
          {hasActiveFilters ? (
            <button
              onClick={handleResetAllFilters}
              className="text-[11px] text-amber-400 hover:text-amber-300 light:text-amber-700 light:hover:text-amber-900 font-medium text-left w-fit"
            >
              Azzera tutti i filtri
            </button>
          ) : (
            <span className="text-[11px] text-zinc-400 light:text-slate-600 truncate">
              Esercitati sulle domande elencate
            </span>
          )}
        </div>

        <button
          type="button"
          id="btn-archive-start-quiz"
          disabled={filteredQuestions.length === 0}
          onClick={handleRequestStartArchiveQuiz}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm active:scale-[0.98] transition-all"
          title={
            filteredQuestions.length > 0
              ? `Inizia un quiz sulle ${filteredQuestions.length} domande visualizzate`
              : 'Nessuna domanda disponibile con i filtri attuali'
          }
        >
          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          <span>{`Inizia Quiz (${filteredQuestions.length})`}</span>
        </button>
      </div>

      {/* Filtered Questions List */}
      <div className="space-y-2 pt-1">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 light:text-slate-600 text-xs border border-dashed border-zinc-700 light:border-slate-300 rounded-xl">
            Nessun quiz trovato con i filtri attuali
          </div>
        ) : (
          <>
            {filteredQuestions.slice(0, visibleCount).map(q => (
              <ArchiveItem
                key={q.id}
                question={q}
                isExpanded={expandedId === q.id}
                onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              />
            ))}
            {filteredQuestions.length > visibleCount && (
              <div className="pt-3 pb-2 text-center">
                <button
                  id="btn-archive-load-more"
                  onClick={() => {
                    setVisibleCount(prev => prev + 50);
                    triggerHapticFeedback('tap');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-amber-400 light:bg-white light:border-slate-300 light:text-amber-700 light:hover:bg-slate-50 transition-all shadow-sm"
                >
                  Mostra altri ({filteredQuestions.length - visibleCount} rimanenti)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Conflict Guard Modal */}
      {conflictPendingPool && activeSession && (
        <SessionConflictModal
          isOpen={Boolean(conflictPendingPool)}
          onClose={() => setConflictPendingPool(null)}
          onResumeExisting={() => {
            setConflictPendingPool(null);
            if (activeSession.type === 'archive') {
              isDismissedRef.current = false;
              const ordered = activeSession.questionIds
                .map(id => questions.find(q => q.id === id))
                .filter((q): q is Question => Boolean(q));
              if (ordered.length > 0) {
                setSessionQuestions(ordered);
                setSessionTitle(activeSession.subjectName || 'Quiz Archivio');
                setCurrentIndex(Math.min(activeSession.currentIndex || 0, ordered.length - 1));
                setSessionAnswers(activeSession.answers || {});
                setSessionFlags(activeSession.flags || {});
                setIsQuizRunning(true);
              }
            } else if (onNavigateHome) {
              onNavigateHome();
            }
          }}
          onDiscardAndStartNew={async () => {
            const pending = conflictPendingPool;
            setConflictPendingPool(null);
            await dismissActiveSession();
            if (pending) {
              startArchiveQuiz(pending.questions, pending.title);
            }
          }}
          existingTitle={
            activeSession.subjectName ||
            (activeSession.type === 'exam'
              ? (activeSession.examMode === 'tutor' ? 'Tutor' : 'Simulazione Esame')
              : activeSession.type === 'archive'
              ? 'Quiz Archivio'
              : 'Quaderno Errori')
          }
          existingProgress={`Domanda ${(activeSession.currentIndex || 0) + 1} di ${
            activeSession.questionIds?.length || 0
          } • ${Object.keys(activeSession.answers || {}).length} risposte date`}
          newSessionTitle={conflictPendingPool.title}
        />
      )}
    </div>
  );
};
