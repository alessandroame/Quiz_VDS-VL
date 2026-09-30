import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  FileText,
  Edit3,
  Trash2,
  Check
} from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { useAviationVoice } from '../hooks/useAviationVoice';
import { backNavigation } from '../utils/backNavigation';
import { isMistakeQuestion } from '../utils/analytics';
import { formatSubjectCode } from '../utils/archiveFilters';

export interface QuestionDetailModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  isOpen,
  onClose
}) => {
  const { statsMap, settings, toggleBookmark, saveNote } = useQuiz();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const qid = question?.id ?? 0;
  const stat = question ? statsMap.get(qid) : undefined;
  const isBookmarked = stat?.isBookmarked || false;

  const {
    isPartPlaying,
    playQuestion,
    playExplanation,
    stop
  } = useAviationVoice(qid);

  // Synchronize note when question changes
  useEffect(() => {
    setIsEditingNote(false);
    setNoteText(stat?.userNote || '');
  }, [qid, stat?.userNote]);

  // Synchronize with back navigation coordinator
  useEffect(() => {
    if (!isOpen || !question) return;

    const unregister = backNavigation.registerSubModal('question-detail-modal', () => {
      stop();
      onClose();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stop();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
      stop();
    };
  }, [isOpen, question, onClose, stop]);

  if (!isOpen || !question) return null;

  const isMistake = isMistakeQuestion(stat);

  const handleSaveNote = async () => {
    await saveNote(question.id, noteText.trim());
    setIsEditingNote(false);
  };

  const handleDeleteNote = async () => {
    await saveNote(question.id, '');
    setNoteText('');
    setIsEditingNote(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-detail-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 !m-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stop();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden light:bg-white light:border-slate-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between gap-2 flex-shrink-0 light:border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs font-bold light:bg-slate-100 light:text-slate-700 flex-shrink-0">
              #{question.id}
            </span>
            <span className="text-xs text-zinc-400 light:text-slate-500 truncate">
              {formatSubjectCode(question.subjectId)} {question.subjectName}
            </span>
            {isMistake ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 light:bg-rose-100 light:text-rose-800 light:border-rose-200 flex-shrink-0">
                Quaderno Errori
              </span>
            ) : stat && stat.timesSeen > 0 && stat.timesWrong === 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 light:bg-emerald-100 light:text-emerald-800 light:border-emerald-200 flex-shrink-0">
                Corretta
              </span>
            ) : stat && stat.timesWrong > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 light:bg-amber-100 light:text-amber-800 light:border-amber-200 flex-shrink-0">
                {stat.timesWrong} {stat.timesWrong === 1 ? 'errore' : 'errori'}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500 light:bg-slate-100 light:text-slate-600 flex-shrink-0">
                Non vista
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              id="btn-bookmark-question-detail"
              onClick={() => toggleBookmark(question.id)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white light:bg-slate-100 light:border-slate-300 light:text-slate-600'
              }`}
              title={isBookmarked ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              aria-label={isBookmarked ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              id="btn-close-question-detail"
              onClick={() => {
                stop();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 hover:text-white light:bg-slate-100 light:hover:bg-slate-200 light:border-slate-300 light:text-slate-600 transition-colors"
              title="Chiudi"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
          {/* Audio Controls */}
          {settings.ttsEnabled && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 light:bg-slate-50 light:border-slate-200">
              <span className="text-[11px] text-zinc-400 font-medium">Ascolto Vocale</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-detail-play-question"
                  onClick={() => playQuestion()}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    isPartPlaying('question')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-800'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Domanda</span>
                </button>
                <button
                  type="button"
                  id="btn-detail-play-explanation"
                  onClick={() => playExplanation()}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    isPartPlaying('explanation')
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white light:bg-white light:border-slate-300 light:text-slate-800'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Spiegazione</span>
                </button>
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1">
            <h2 id="question-detail-title" className="font-semibold text-zinc-100 light:text-slate-900 leading-snug text-sm sm:text-base">
              {question.question}
            </h2>
          </div>

          {/* 3 Options */}
          <div className="space-y-2 pt-1">
            {question.options.map((opt, idx) => {
              const optNum = (idx + 1) as 1 | 2 | 3;
              const isCorrect = optNum === question.correctAnswer;

              return (
                <div
                  key={optNum}
                  className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-colors ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-950 font-medium'
                      : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-300 light:bg-slate-50 light:border-slate-200 light:text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                      isCorrect
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400 light:bg-slate-200 light:text-slate-600'
                    }`}
                  >
                    {optNum}
                  </span>
                  <div className="flex-1 leading-snug">{opt}</div>
                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Didactic Explanation */}
          {question.explanation && (
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 light:bg-slate-50 light:border-slate-200 space-y-2.5 text-xs">
              <div>
                <span className="font-bold text-emerald-400 light:text-emerald-700 uppercase tracking-wider text-[10px] block mb-0.5">
                  Regola Didattica
                </span>
                <p className="text-zinc-300 light:text-slate-700 leading-relaxed">
                  {question.explanation.rule}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 light:border-slate-200">
                <span className="font-bold text-amber-400 light:text-amber-700 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Tranello Comune</span>
                </span>
                <p className="text-zinc-300 light:text-slate-700 leading-relaxed">
                  {question.explanation.trap}
                </p>
              </div>
            </div>
          )}

          {/* Personal Note */}
          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 light:bg-slate-50 light:border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Note Personali</span>
              </span>
              {!isEditingNote && (
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{stat?.userNote ? 'Modifica' : 'Aggiungi nota'}</span>
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Scrivi un appunto personale su questo quesito..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-500 light:bg-white light:border-slate-300 light:text-slate-900"
                />
                <div className="flex items-center justify-end gap-1.5">
                  {stat?.userNote && (
                    <button
                      type="button"
                      onClick={handleDeleteNote}
                      className="px-2.5 py-1 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Elimina</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(stat?.userNote || '');
                      setIsEditingNote(false);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs font-medium light:border-slate-300"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    <span>Salva</span>
                  </button>
                </div>
              </div>
            ) : stat?.userNote ? (
              <p className="text-xs text-zinc-200 light:text-slate-800 italic bg-zinc-900/80 light:bg-white p-2.5 rounded-lg border border-zinc-800 light:border-slate-200">
                "{stat.userNote}"
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">
                Nessuna nota personale salvata per questo quesito.
              </p>
            )}
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 light:bg-slate-100 light:border-slate-200 grid grid-cols-3 gap-2 text-center text-xs flex-shrink-0">
          <div className="p-1.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200">
            <span className="text-[10px] text-zinc-500 block">Visto</span>
            <span className="font-bold text-zinc-300 light:text-slate-800">
              {stat?.timesSeen || 0} {stat?.timesSeen === 1 ? 'volta' : 'volte'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200">
            <span className="text-[10px] text-zinc-500 block">Errori</span>
            <span className={`font-bold ${stat?.timesWrong ? 'text-rose-400' : 'text-zinc-400'}`}>
              {stat?.timesWrong || 0}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-200">
            <span className="text-[10px] text-zinc-500 block">Consecutive OK</span>
            <span className={`font-bold ${(stat?.consecutiveCorrect || 0) >= 2 ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {stat?.consecutiveCorrect || 0} / 2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
