import React, { useState, useEffect } from 'react';
import { Bookmark, Flag, Edit3, CheckCircle2, XCircle, Volume2, Play, Pause, RotateCcw, Square, FileText, Trash2 } from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { soundFX } from '../utils/audio';
import { useAviationVoice } from '../hooks/useAviationVoice';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: 1 | 2 | 3;
  onSelectAnswer: (answer: 1 | 2 | 3) => void;
  showFeedback?: boolean; // Se true, mostra subito verde/rosso e spiegazione
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  indexNumber?: number; // es. "Domanda 4 di 30"
  totalNumber?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  showFeedback = false,
  isFlagged = false,
  onToggleFlag,
  indexNumber,
  totalNumber
}) => {
  const { statsMap, toggleBookmark, saveNote, settings } = useQuiz();
  const stat = statsMap.get(question.id);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState(stat?.userNote || '');

  // Sincronizza lo stato della nota al cambio quesito o aggiornamento DB
  useEffect(() => {
    setShowNoteEditor(false);
    setNoteText(stat?.userNote || '');
  }, [question.id, stat?.userNote]);

  const {
    isPlaying,
    isPaused,
    isThisQuestionActive,
    isPartPlaying,
    isPartPaused,
    isPartActive,
    togglePlayPause,
    restartCurrentOrSequence,
    playFullSequence,
    playQuestion,
    restartQuestion,
    playOption,
    restartOption,
    playExplanation,
    restartExplanation,
    stop
  } = useAviationVoice(question.id);

  const isBookmarked = stat?.isBookmarked || false;

  // Stops audio on question change, or starts autoplay if enabled
  useEffect(() => {
    if (settings.ttsEnabled && settings.ttsAutoPlayQuestion) {
      playFullSequence();
    }
    return () => {
      stop();
    };
  }, [question.id]);

  // Speech keyboard shortcuts (V: Play/Pause sequence, R or Shift+V: Restart sequence, Q: Question toggle, Shift+Q: Restart question, Alt+1/2/3: Option toggle, Alt+Shift+1/2/3: Restart option, E: Explanation toggle, Shift+E: Restart explanation, Esc: Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNoteEditor) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'v' || e.key === 'V') && !e.altKey && !e.ctrlKey) {
        if (e.shiftKey) {
          restartCurrentOrSequence();
        } else {
          togglePlayPause();
        }
      } else if ((e.key === 'r' || e.key === 'R') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        restartCurrentOrSequence();
      } else if ((e.key === 'q' || e.key === 'Q') && !e.altKey && !e.ctrlKey) {
        if (e.shiftKey) {
          restartQuestion();
        } else {
          playQuestion();
        }
      } else if ((e.key === 'e' || e.key === 'E') && !e.altKey && !e.ctrlKey && showFeedback && selectedAnswer) {
        if (e.shiftKey) {
          restartExplanation();
        } else {
          playExplanation();
        }
      } else if (e.key === 'Escape' && isThisQuestionActive && (isPlaying || isPaused)) {
        stop();
      } else if (e.altKey && (e.key === '1' || e.code === 'Digit1')) {
        e.preventDefault();
        if (e.shiftKey) {
          restartOption(1);
        } else {
          playOption(1);
        }
      } else if (e.altKey && (e.key === '2' || e.code === 'Digit2')) {
        e.preventDefault();
        if (e.shiftKey) {
          restartOption(2);
        } else {
          playOption(2);
        }
      } else if (e.altKey && (e.key === '3' || e.code === 'Digit3')) {
        e.preventDefault();
        if (e.shiftKey) {
          restartOption(3);
        } else {
          playOption(3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    question.id,
    isPlaying,
    isPaused,
    isThisQuestionActive,
    showNoteEditor,
    showFeedback,
    selectedAnswer,
    togglePlayPause,
    restartCurrentOrSequence,
    playQuestion,
    restartQuestion,
    playOption,
    restartOption,
    playExplanation,
    restartExplanation,
    stop
  ]);

  const handleSelect = (idx: 1 | 2 | 3) => {
    if (showFeedback && selectedAnswer) return; // Non cambiare se già verificato in modalità feedback
    onSelectAnswer(idx);

    if (settings.soundEnabled) {
      if (showFeedback) {
        if (idx === question.correctAnswer) soundFX.playCorrect();
        else soundFX.playWrong();
      } else {
        soundFX.playClick();
      }
    }

    // Spiegazione didattica vocale su errore:
    if (settings.ttsEnabled && showFeedback) {
      if (idx !== question.correctAnswer) {
        if (settings.ttsAutoExplainOnMistake) {
          playExplanation();
        }
      } else {
        stop();
      }
    }
  };

  const handleSaveNote = async () => {
    await saveNote(question.id, noteText);
    setShowNoteEditor(false);
  };

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 shadow-md dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200 light:shadow-sm transition-all">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/80 light:border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-amber-400 light:text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
            #{question.id}
          </span>
          <span className="text-zinc-400 light:text-slate-500 truncate max-w-[150px] sm:max-w-xs font-medium">
            {question.subjectName}
          </span>
          {indexNumber !== undefined && totalNumber !== undefined && (
            <span className="text-zinc-500 light:text-slate-400">
              ({indexNumber}/{totalNumber})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* TTS Audio Controls: Play, Pause, Restart, Stop */}
          {settings.ttsEnabled && (
            isThisQuestionActive && (isPlaying || isPaused) ? (
              <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded-lg p-0.5 gap-0.5 shadow-sm animate-in fade-in duration-150">
                {/* Play / Pausa */}
                <button
                  id="btn-tts-toggle-play-pause"
                  onClick={togglePlayPause}
                  className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 font-semibold transition-colors ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                      : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600'
                  }`}
                  title={isPlaying ? 'Metti in pausa (Tasto V)' : 'Riprendi ascolto (Tasto V)'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="hidden sm:inline">Pausa</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Riprendi</span>
                    </>
                  )}
                </button>

                {/* Ripeti elemento corrente */}
                <button
                  id="btn-tts-restart"
                  onClick={restartCurrentOrSequence}
                  className="px-1.5 py-1 rounded-md text-xs flex items-center gap-1 text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 transition-colors"
                  title="Ripeti elemento corrente (Tasto R o Shift+V)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ripeti</span>
                </button>

                {/* Ferma / Stop */}
                <button
                  id="btn-tts-stop"
                  onClick={stop}
                  className="p-1 rounded-md text-xs text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                  title="Interrompi ascolto (Esc)"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>
            ) : (
              <button
                id="btn-tts-play"
                onClick={togglePlayPause}
                className="p-1.5 rounded-lg text-xs flex items-center gap-1 text-zinc-400 light:text-slate-500 hover:text-zinc-200 light:hover:text-slate-800 hover:bg-zinc-800/50 light:hover:bg-slate-100 transition-colors"
                title="Ascolta domanda e opzioni in sequenza (Tasto V)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ascolta</span>
              </button>
            )
          )}

          {/* Flag button */}
          {onToggleFlag && (
            <button
              onClick={onToggleFlag}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isFlagged
                  ? 'bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 font-semibold'
                  : 'text-zinc-400 light:text-slate-500 hover:text-zinc-200 light:hover:text-slate-800'
              }`}
              title="⚑ Rivedi più tardi"
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400' : ''}`} />
              <span className="hidden sm:inline">Rivedi</span>
            </button>
          )}

          {/* Bookmark button */}
          <button
            onClick={() => toggleBookmark(question.id)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isBookmarked
                ? 'text-amber-400 fill-amber-400'
                : 'text-zinc-400 light:text-slate-500 hover:text-zinc-200'
            }`}
            title="Preferita"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Note toggle button */}
          <button
            onClick={() => {
              setNoteText(stat?.userNote || '');
              setShowNoteEditor(!showNoteEditor);
            }}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              stat?.userNote
                ? 'text-amber-400 light:text-amber-600 bg-amber-500/10'
                : 'text-zinc-400 light:text-slate-500 hover:text-zinc-200 light:hover:text-slate-800'
            }`}
            title="Nota personale"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note view if existing and editor closed */}
      {stat?.userNote && !showNoteEditor && (
        <div className="mb-4 p-3 rounded-xl border bg-amber-950/20 border-amber-800/40 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-zinc-100 light:bg-amber-50 light:border-amber-200 light:text-amber-950 text-xs shadow-sm space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-amber-800/40 dark:border-amber-800/40 light:border-amber-200/80 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Nota Personale
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setNoteText(stat.userNote || '');
                  setShowNoteEditor(true);
                }}
                className="px-2 py-0.5 rounded text-[11px] text-amber-400 hover:text-amber-200 light:text-amber-700 light:hover:text-amber-950 hover:bg-amber-900/40 light:hover:bg-amber-100 transition-colors flex items-center gap-1 font-medium"
                title="Modifica nota"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifica</span>
              </button>
              <button
                onClick={async () => {
                  await saveNote(question.id, '');
                  setNoteText('');
                }}
                className="px-2 py-0.5 rounded text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 light:hover:text-rose-900 hover:bg-rose-950/40 light:hover:bg-rose-100 transition-colors flex items-center gap-1 font-medium"
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

      {/* Note Editor */}
      {showNoteEditor && (
        <div className="mb-4 p-3 rounded-xl border bg-zinc-950/90 border-zinc-800 dark:bg-zinc-950/90 dark:border-zinc-800 light:bg-slate-50 light:border-slate-300 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              {stat?.userNote ? 'Modifica Nota Personale' : 'Nuova Nota Personale'}
            </span>
            {stat?.userNote && (
              <button
                onClick={async () => {
                  await saveNote(question.id, '');
                  setNoteText('');
                  setShowNoteEditor(false);
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
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Scrivi qui la tua nota o appunto didattico sul quesito..."
            className="w-full bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 dark:text-zinc-100 light:bg-white light:border-slate-200 light:text-slate-900 resize-none outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteEditor(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 dark:border-zinc-800 text-zinc-400 hover:text-zinc-200 light:border-slate-300 light:text-slate-700 hover:bg-zinc-800/40 light:hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveNote}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm transition-all"
            >
              Salva Nota
            </button>
          </div>
        </div>
      )}

      {/* Testo Domanda con microfono / speaker dedicato */}
      <div className="flex items-start gap-2 mb-5">
        <h3 className={`text-base sm:text-lg font-medium leading-snug flex-1 transition-colors ${
          isPartPlaying('question')
            ? 'text-amber-300 light:text-amber-700'
            : isPartPaused('question')
            ? 'text-amber-400/80 light:text-amber-800'
            : 'text-zinc-100 light:text-slate-900'
        }`}>
          {question.question}
        </h3>
        {settings.ttsEnabled && (
          isPartActive('question') ? (
            <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded-lg p-0.5 gap-0.5 shadow-sm animate-in fade-in duration-150 flex-shrink-0">
              {/* Toggle Play / Pause Domanda */}
              <button
                id="btn-tts-question-toggle"
                onClick={() => playQuestion()}
                className={`px-1.5 py-1 rounded-md text-xs flex items-center gap-1 font-semibold transition-colors ${
                  isPartPlaying('question')
                    ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                    : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600'
                }`}
                title={isPartPlaying('question') ? 'Metti in pausa la domanda (Tasto Q)' : 'Riprendi lettura domanda (Tasto Q)'}
              >
                {isPartPlaying('question') ? (
                  <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>

              {/* Ricomincia domanda da capo */}
              <button
                id="btn-tts-question-restart"
                onClick={() => restartQuestion()}
                className="p-1 rounded-md text-xs text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 transition-colors"
                title="Ricomincia domanda dall'inizio (Shift+Q)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-tts-question"
              onClick={() => playQuestion()}
              className="p-1.5 rounded-lg flex-shrink-0 text-zinc-500 hover:text-zinc-300 light:hover:text-slate-700 transition-colors"
              title="Riascolta solo la domanda (Tasto Q)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* 3 Opzioni */}
      <div className="space-y-2.5">
        {question.options.map((opt, idx) => {
          const optNum = (idx + 1) as 1 | 2 | 3;
          const isSelected = selectedAnswer === optNum;
          const isCorrectAnswer = question.correctAnswer === optNum;
          const isCurrentOptPlaying = isPartPlaying(`opt${optNum}` as any);
          const isCurrentOptPaused = isPartPaused(`opt${optNum}` as any);
          const isCurrentOptActive = isPartActive(`opt${optNum}` as any);

          // Stili in base al feedback immediato o selezione neutra
          let btnStyle = 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 light:border-slate-200 light:bg-slate-50 light:hover:bg-slate-100';

          if (showFeedback && selectedAnswer) {
            if (isCorrectAnswer) {
              btnStyle = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 light:border-emerald-600 light:bg-emerald-50 light:text-emerald-900 font-medium';
            } else if (isSelected && !isCorrectAnswer) {
              btnStyle = 'border-rose-500/80 bg-rose-950/30 text-rose-200 light:border-rose-600 light:bg-rose-50 light:text-rose-900';
            } else {
              btnStyle = 'opacity-50 border-zinc-800 bg-zinc-950/20 light:border-slate-200 light:bg-white';
            }
          } else if (isSelected) {
            btnStyle = 'border-amber-500 bg-amber-500/10 text-amber-100 light:border-amber-600 light:bg-amber-50 light:text-amber-950 font-medium ring-1 ring-amber-500';
          } else if (isCurrentOptPlaying) {
            btnStyle = 'border-amber-500/60 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30';
          } else if (isCurrentOptPaused) {
            btnStyle = 'border-amber-500/40 bg-amber-500/5 text-amber-200/80 ring-1 ring-amber-500/20';
          }

          return (
            <button
              key={optNum}
              id={`btn-option-${optNum}`}
              data-answer-option={optNum}
              onClick={() => handleSelect(optNum)}
              disabled={showFeedback && selectedAnswer !== undefined}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 text-sm leading-relaxed ${btnStyle}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 ${
                  showFeedback && selectedAnswer
                    ? isCorrectAnswer
                      ? 'bg-emerald-500 text-white'
                      : isSelected
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-800 light:bg-slate-200 text-zinc-400'
                    : isSelected
                    ? 'bg-amber-500 text-zinc-950'
                    : isCurrentOptPlaying || isCurrentOptPaused
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 light:bg-slate-200 text-zinc-300 light:text-slate-700'
                }`}
              >
                {optNum}
              </span>

              <div className="flex-1 pt-0.5">
                <span>{opt}</span>
              </div>

              {/* Controlli audio opzione: Play/Pausa e Ricomincia da capo */}
              {settings.ttsEnabled && (
                isCurrentOptActive ? (
                  <span
                    className="inline-flex items-center bg-zinc-800/90 light:bg-slate-200 border border-zinc-700/90 light:border-slate-300 rounded-md p-0.5 gap-0.5 shadow-sm flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Toggle Play / Pause Opzione */}
                    <button
                      type="button"
                      id={`btn-tts-opt-${optNum}-toggle`}
                      onClick={(e) => {
                        e.stopPropagation();
                        playOption(optNum);
                      }}
                      className={`p-1 rounded text-xs transition-colors ${
                        isCurrentOptPlaying
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                          : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600'
                      }`}
                      title={isCurrentOptPlaying ? `Metti in pausa opzione ${optNum} (Alt+${optNum})` : `Riprendi ascolto opzione ${optNum} (Alt+${optNum})`}
                    >
                      {isCurrentOptPlaying ? (
                        <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>

                    {/* Ricomincia opzione da capo */}
                    <button
                      type="button"
                      id={`btn-tts-opt-${optNum}-restart`}
                      onClick={(e) => {
                        e.stopPropagation();
                        restartOption(optNum);
                      }}
                      className="p-1 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-300 transition-colors"
                      title={`Ricomincia opzione ${optNum} da capo (Alt+Shift+${optNum})`}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    id={`btn-tts-opt-${optNum}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      playOption(optNum);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        playOption(optNum);
                      }
                    }}
                    className="p-1 rounded transition-colors flex-shrink-0 text-zinc-600 hover:text-zinc-300 light:text-slate-400 light:hover:text-slate-600"
                    title={`Ascolta opzione ${optNum} (Alt+${optNum})`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </span>
                )
              )}

              {showFeedback && selectedAnswer && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              {showFeedback && selectedAnswer && isSelected && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Spiegazione Sintetica (visibile se feedback attivo e risposta data) */}
      {showFeedback && selectedAnswer && (
        <div className="mt-4 pt-3 border-t border-zinc-800 light:border-slate-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold mb-1.5">
            <div className="flex items-center gap-1.5">
              {selectedAnswer === question.correctAnswer ? (
                <span className="text-emerald-400 light:text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Esatta
                </span>
              ) : (
                <span className="text-rose-400 light:text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Errata
                </span>
              )}
            </div>

            {settings.ttsEnabled && (
              isPartActive('explanation') ? (
                <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded-lg p-0.5 gap-0.5 text-[11px] shadow-sm animate-in fade-in duration-150">
                  {/* Play / Pausa Spiegazione */}
                  <button
                    id="btn-tts-explanation-toggle"
                    onClick={() => playExplanation()}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold transition-colors ${
                      isPartPlaying('explanation')
                        ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                        : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600'
                    }`}
                    title={isPartPlaying('explanation') ? 'Metti in pausa spiegazione (Tasto E)' : 'Riprendi spiegazione (Tasto E)'}
                  >
                    {isPartPlaying('explanation') ? (
                      <>
                        <Pause className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Pausa</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-amber-400" />
                        <span>Riprendi</span>
                      </>
                    )}
                  </button>

                  {/* Ricomincia spiegazione da capo */}
                  <button
                    id="btn-tts-explanation-restart"
                    onClick={() => restartExplanation()}
                    className="px-1.5 py-0.5 rounded-md text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 flex items-center gap-1 transition-colors"
                    title="Ricomincia spiegazione dall'inizio (Shift+E)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Da capo</span>
                  </button>

                  {/* Ferma / Stop spiegazione */}
                  <button
                    id="btn-tts-explanation-stop"
                    onClick={stop}
                    className="p-1 rounded-md text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                    title="Interrompi spiegazione (Esc)"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-tts-explanation"
                  onClick={() => playExplanation()}
                  className="px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  title="Ascolta spiegazione vocale della risposta corretta (Tasto E)"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Ascolta Spiegazione</span>
                </button>
              )
            )}
          </div>

          <div className="space-y-1.5 text-zinc-300 light:text-slate-700 bg-zinc-950/60 light:bg-slate-50 p-2.5 rounded-lg border border-zinc-800/60 light:border-slate-200">
            <div>
              <strong className="text-emerald-400 light:text-emerald-600">Regola: </strong>
              <span>{question.explanation.rule}</span>
            </div>
            <div>
              <strong className="text-amber-400 light:text-amber-600">Tranello: </strong>
              <span>{question.explanation.trap}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
