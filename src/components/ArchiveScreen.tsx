import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Square,
  Edit3,
  Trash2,
  Plus,
  Hash,
  Delete,
  CornerDownLeft,
  X,
  Sparkles
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { useAviationVoice } from '../hooks/useAviationVoice';
import { voiceService } from '../services/voiceService';
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

interface ArchiveItemExpandedContentProps {
  question: Question;
}

interface ArchiveItemProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
}

const ArchiveItemExpandedContent: React.FC<ArchiveItemExpandedContentProps> = ({ question: q }) => {
  const { statsMap, settings, saveNote } = useQuiz();
  const stat = statsMap.get(q.id);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(stat?.userNote || '');

  useEffect(() => {
    setIsEditingNote(false);
    setNoteText(stat?.userNote || '');
  }, [q.id, stat?.userNote]);

  const {
    isPlaying,
    isPaused,
    isThisQuestionActive,
    isPartPlaying,
    isPartPaused,
    isPartActive,
    togglePlayPause,
    restartFullSequence,
    playQuestion,
    restartQuestion,
    playOption,
    restartOption,
    playExplanation,
    restartExplanation,
    stop
  } = useAviationVoice(q.id);

  return (
    <div className="p-3.5 border-t border-zinc-700/80 light:border-slate-200 bg-zinc-950/60 light:bg-slate-50 space-y-3">
      {/* Barra comandi vocali rapidi */}
          {settings.ttsEnabled && (
            <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60 light:border-slate-200 text-xs">
              <span className="text-[11px] text-zinc-400 light:text-slate-600 font-medium">
                Ascolto Vocale
              </span>
              <div className="flex items-center gap-1.5">
                {isPartActive('question') ? (
                  <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[11px] animate-in fade-in duration-150">
                    <button
                      onClick={() => playQuestion()}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                        isPartPlaying('question')
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                          : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                      }`}
                      title={isPartPlaying('question') ? 'Metti in pausa la lettura della domanda' : 'Riprendi lettura della domanda'}
                    >
                      {isPartPlaying('question') ? (
                        <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" />
                      ) : (
                        <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />
                      )}
                      <span>Domanda</span>
                    </button>
                    <button
                      onClick={() => restartQuestion()}
                      className="p-1 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 transition-colors"
                      title="Ricomincia lettura domanda dall'inizio"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => playQuestion()}
                    className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 shadow-sm"
                    title="Ascolta solo la domanda"
                  >
                    <Volume2 className="w-3 h-3 text-zinc-400 light:text-slate-500" />
                    <span>Domanda</span>
                  </button>
                )}

                {isThisQuestionActive && (isPlaying || isPaused) ? (
                  <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[11px] animate-in fade-in duration-150">
                    <button
                      onClick={togglePlayPause}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                        isPlaying
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                          : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                      }`}
                      title={isPlaying ? 'Metti in pausa (Tasto V)' : 'Riprendi ascolto (Tasto V)'}
                    >
                      {isPlaying ? <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" /> : <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />}
                      <span>{isPlaying ? 'Pausa' : 'Riprendi'}</span>
                    </button>
                    <button
                      onClick={restartFullSequence}
                      className="px-1.5 py-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black flex items-center gap-1 transition-colors"
                      title="Ricomincia da capo dall'inizio"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Da capo</span>
                    </button>
                    <button
                      onClick={stop}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                      title="Interrompi ascolto (Esc)"
                    >
                      <Square className="w-2 h-2 fill-current" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={togglePlayPause}
                    className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 shadow-sm"
                    title="Ascolta sequenza completa"
                  >
                    <Volume2 className="w-3 h-3 text-zinc-400 light:text-slate-500" />
                    <span>Tutto</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3 Opzioni con audio discreto */}
          <div className="space-y-1.5">
            {q.options.map((opt, idx) => {
              const optNum = (idx + 1) as 1 | 2 | 3;
              const isCorrect = q.correctAnswer === optNum;
              const isOptPlaying = isPartPlaying(`opt${optNum}` as any);
              const isOptPaused = isPartPaused(`opt${optNum}` as any);
              const isOptActive = isPartActive(`opt${optNum}` as any);

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900 font-medium'
                      : 'bg-zinc-900/60 border-zinc-700/80 text-zinc-300 light:bg-white light:border-slate-300 light:text-slate-700'
                  } ${isOptPlaying ? 'ring-1 ring-amber-400' : isOptPaused ? 'ring-1 ring-amber-400/50' : ''}`}
                >
                  <span className="font-bold">{optNum}.</span>
                  <span className="flex-1">{opt}</span>

                  {settings.ttsEnabled && (
                    isOptActive ? (
                      <span className="inline-flex items-center bg-zinc-800/90 light:bg-slate-200 border border-zinc-700/90 light:border-slate-300 rounded p-0.5 gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => playOption(optNum)}
                          className={`p-0.5 rounded transition-colors ${
                            isOptPlaying
                              ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                              : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-100 light:text-slate-700'
                          }`}
                          title={isOptPlaying ? `Metti in pausa opzione ${optNum}` : `Riprendi ascolto opzione ${optNum}`}
                        >
                          {isOptPlaying ? (
                            <Pause className="w-3 h-3 text-amber-400 light:text-amber-700 animate-pulse" />
                          ) : (
                            <Play className="w-3 h-3 text-amber-400 light:text-amber-700" />
                          )}
                        </button>
                        <button
                          onClick={() => restartOption(optNum)}
                          className="p-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-300 transition-colors"
                          title={`Ricomincia opzione ${optNum} da capo`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => playOption(optNum)}
                        className="p-0.5 rounded transition-colors text-zinc-500 hover:text-zinc-300 light:text-slate-500 light:hover:text-slate-700"
                        title={`Ascolta opzione ${optNum}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Spiegazione Sintetica con tasto ascolto */}
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 light:bg-white light:border-slate-300 text-xs space-y-1 text-zinc-300 light:text-slate-700">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-700/60 light:border-slate-200">
              <span className="font-bold text-[11px] text-zinc-400 light:text-slate-600">Spiegazione Didattica</span>
              {settings.ttsEnabled && (
                isPartActive('explanation') ? (
                  <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[10px] animate-in fade-in duration-150">
                    <button
                      onClick={() => playExplanation()}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                        isPartPlaying('explanation')
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                          : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                      }`}
                      title={isPartPlaying('explanation') ? 'Metti in pausa la spiegazione' : 'Riprendi spiegazione'}
                    >
                      {isPartPlaying('explanation') ? (
                        <>
                          <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" />
                          <span>Pausa</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />
                          <span>Riprendi</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => restartExplanation()}
                      className="px-1 py-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 flex items-center gap-0.5 transition-colors"
                      title="Ricomincia spiegazione da capo"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Da capo</span>
                    </button>
                    <button
                      onClick={stop}
                      className="p-0.5 rounded text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                      title="Interrompi spiegazione (Esc)"
                    >
                      <Square className="w-2 h-2 fill-current" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => playExplanation()}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 transition-colors shadow-sm"
                    title="Ascolta spiegazione didattica"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-zinc-400 light:text-slate-500" />
                    <span>Ascolta Spiegazione</span>
                  </button>
                )
              )}
            </div>
            <div>
              <strong className="text-emerald-400 light:text-emerald-600">Regola: </strong>
              <span>{q.explanation.rule}</span>
            </div>
            <div>
              <strong className="text-amber-400 light:text-amber-600">Tranello: </strong>
              <span>{q.explanation.trap}</span>
            </div>
          </div>

          {/* Sezione Nota Personale */}
          {stat?.userNote && !isEditingNote && (
            <div className="p-3 rounded-xl border bg-amber-950/40 border-amber-700/60 dark:bg-amber-950/40 dark:border-amber-700/60 dark:text-zinc-100 light:bg-amber-50 light:border-amber-300 light:text-amber-950 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-700/60 light:border-amber-300/80 pb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  Nota Personale
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNoteText(stat.userNote || '');
                      setIsEditingNote(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-200 light:text-amber-700 light:hover:text-amber-950 flex items-center gap-1 font-medium"
                    title="Modifica nota"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Modifica</span>
                  </button>
                  <button
                    onClick={async () => {
                      await saveNote(q.id, '');
                      setNoteText('');
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 light:hover:text-rose-900 flex items-center gap-1 font-medium"
                    title="Elimina nota"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Elimina</span>
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-200 dark:text-zinc-200 light:text-slate-800 text-xs font-normal">
                {stat.userNote}
              </p>
            </div>
          )}

          {isEditingNote && (
            <div className="p-3 rounded-xl border bg-zinc-950/90 border-zinc-700 dark:bg-zinc-950/90 dark:border-zinc-700 light:bg-slate-50 light:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" />
                  {stat?.userNote ? 'Modifica Nota Personale' : 'Aggiungi Nota Personale'}
                </span>
                {stat?.userNote && (
                  <button
                    onClick={async () => {
                      await saveNote(q.id, '');
                      setNoteText('');
                      setIsEditingNote(false);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 flex items-center gap-1"
                    title="Elimina nota esistente"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Elimina</span>
                  </button>
                )}
              </div>
              <textarea
                id={`textarea-note-${q.id}`}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Scrivi qui la tua nota personale per questo quesito..."
                className="w-full bg-zinc-900 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 dark:text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-900 resize-none outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 dark:border-zinc-700 text-zinc-300 hover:text-white light:border-slate-300 light:text-slate-700 hover:bg-zinc-800/40 light:hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  id={`btn-save-note-${q.id}`}
                  onClick={async () => {
                    await saveNote(q.id, noteText);
                    setIsEditingNote(false);
                  }}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm transition-all"
                >
                  Salva Nota
                </button>
              </div>
            </div>
          )}

          {!stat?.userNote && !isEditingNote && (
            <button
              id={`btn-add-note-${q.id}`}
              onClick={() => {
                setNoteText('');
                setIsEditingNote(true);
              }}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-zinc-700 dark:border-zinc-700 hover:border-amber-500/60 light:border-slate-300 light:hover:border-amber-600 text-zinc-300 hover:text-amber-400 light:text-slate-600 light:hover:text-amber-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi una nota personale sulla domanda #{q.id}</span>
            </button>
          )}
    </div>
  );
};

const ArchiveItem: React.FC<ArchiveItemProps> = ({ question: q, isExpanded, onToggle }) => {
  const { statsMap } = useQuiz();
  const stat = statsMap.get(q.id);

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50 light:bg-white light:border-slate-300 light:shadow-sm">
      <div
        id={`archive-item-${q.id}`}
        onClick={onToggle}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-zinc-800/40 light:hover:bg-slate-50 transition-colors"
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400 light:text-amber-800 text-xs">
              #{q.id}
            </span>
            <span className="text-[11px] text-zinc-400 light:text-slate-600 font-medium">
              {q.subjectName}
            </span>
            {stat?.isBookmarked && (
              <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
            {stat?.userNote && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 font-medium">
                <FileText className="w-3 h-3" />
                <span>Nota</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-200 light:text-slate-800 font-medium line-clamp-2">
            {q.question}
          </p>
          {stat?.userNote && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 light:text-amber-800 bg-amber-950/50 light:bg-amber-50 px-2 py-0.5 rounded border border-amber-700/50 light:border-amber-300 w-fit max-w-full">
              <FileText className="w-3 h-3 flex-shrink-0 text-amber-400 light:text-amber-600" />
              <span className="truncate italic font-normal">"{stat.userNote}"</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-zinc-400 flex-shrink-0 mt-1">
          {stat?.lastResult && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                stat.lastResult === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {stat.lastResult === 'correct' ? 'OK' : 'ERR'}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && <ArchiveItemExpandedContent question={q} />}
    </div>
  );
};

export const ArchiveScreen: React.FC = () => {
  const { questions, statsMap, subjectsAnalytics } = useQuiz();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ArchiveStatusFilter>('all');
  const [activeConceptChipId, setActiveConceptChipId] = useState<string | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [numericBuffer, setNumericBuffer] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const INITIAL_PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);

  // Stop any ongoing voice playback on unmount
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto px-2.5 sm:px-4 py-3 sm:py-5 space-y-3 sm:space-y-4 pb-20 sm:pb-24">
      {/* Header Catalogo */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Archivio Completo</h1>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            Catalogo 474 quiz: Parapendio e teoria comune AeCI
          </p>
        </div>
        <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-400 light:bg-white light:border-slate-300 light:text-amber-700 shrink-0">
          {filteredQuestions.length} / {questions.length}
        </div>
      </div>

      {/* Barra di Ricerca & Tasto Pad Numerico */}
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

        {/* Pulsante Tastierino #ID No-Keyboard */}
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

      {/* Tastierino Numerico Rapido (#ID Jump) */}
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

          {/* Griglia Pad 4x3 */}
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

      {/* 1. Barra Rapida Materie (01..09 + TUTTE) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 light:text-slate-600 font-medium px-0.5">
          <span>Filtro Materia</span>
          {selectedSubject !== 'all' && (
            <button
              onClick={() => {
                setSelectedSubject('all');
                triggerHapticFeedback('tap');
              }}
              className="text-amber-400 hover:underline"
            >
              Mostra tutte
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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
      </div>

      {/* 2. Filtri di Stato a Tocco Singolo */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {(
          [
            { id: 'all', label: 'Tutte', count: statusCounts.all },
            { id: 'unseen', label: 'Non viste', count: statusCounts.unseen },
            { id: 'incorrect', label: 'Errate', count: statusCounts.incorrect },
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

      {/* 3. Quick Chips Concetti Frequenti */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
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

      {/* Reset filtri attivi */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs pt-1 px-0.5">
          <span className="text-zinc-400 light:text-slate-600 text-[11px]">
            Filtri applicati ({filteredQuestions.length} risultati)
          </span>
          <button
            onClick={handleResetAllFilters}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            Azzera tutti i filtri
          </button>
        </div>
      )}

      {/* Lista Domande */}
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
    </div>
  );
};
