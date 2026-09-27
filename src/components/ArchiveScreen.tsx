import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Volume2,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { useAviationVoice } from '../hooks/useAviationVoice';
import type { Question } from '../types/quiz';

interface ArchiveItemProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
}

const ArchiveItem: React.FC<ArchiveItemProps> = ({ question: q, isExpanded, onToggle }) => {
  const { statsMap, settings, saveNote } = useQuiz();
  const stat = statsMap.get(q.id);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(stat?.userNote || '');

  useEffect(() => {
    setIsEditingNote(false);
    setNoteText(stat?.userNote || '');
  }, [q.id, stat?.userNote]);

  const {
    isSequencePlaying,
    isThisQuestionActive,
    isPartPlaying,
    playFullSequence,
    playQuestion,
    playOption,
    playExplanation,
    stop
  } = useAviationVoice(q.id);

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40 light:bg-white light:border-slate-200">
      <div
        id={`archive-item-${q.id}`}
        onClick={onToggle}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors"
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sky-400 text-xs">
              #{q.id}
            </span>
            <span className="text-[11px] text-slate-400 light:text-slate-500">
              {q.subjectName}
            </span>
            {stat?.isBookmarked && (
              <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
            {stat?.userNote && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 light:bg-sky-100 light:text-sky-800 font-medium">
                <FileText className="w-3 h-3" />
                <span>Nota</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 light:text-slate-800 font-medium line-clamp-2">
            {q.question}
          </p>
          {stat?.userNote && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-sky-400 light:text-sky-800 bg-sky-950/50 light:bg-sky-50 px-2 py-0.5 rounded border border-sky-800/40 light:border-sky-200 w-fit max-w-full">
              <FileText className="w-3 h-3 flex-shrink-0 text-sky-400 light:text-sky-600" />
              <span className="truncate italic font-normal">"{stat.userNote}"</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400 flex-shrink-0 mt-1">
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

      {/* Sezione Espansa */}
      {isExpanded && (
        <div className="p-3.5 border-t border-slate-800/80 light:border-slate-100 bg-slate-950/60 light:bg-slate-50 space-y-3">
          {/* Barra comandi vocali rapidi */}
          {settings.ttsEnabled && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 light:border-slate-200 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Ascolto Vocale Neurale
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => playQuestion()}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
                    isPartPlaying('question')
                      ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="Ascolta solo la domanda"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Domanda</span>
                </button>
                <button
                  onClick={() => isSequencePlaying && isThisQuestionActive ? stop() : playFullSequence()}
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
                    isSequencePlaying && isThisQuestionActive
                      ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                  title="Ascolta sequenza completa"
                >
                  <Volume2 className={`w-3 h-3 ${isSequencePlaying && isThisQuestionActive ? 'animate-pulse text-sky-400' : ''}`} />
                  <span>{isSequencePlaying && isThisQuestionActive ? 'Stop' : 'Tutto'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3 Opzioni con audio discreto */}
          <div className="space-y-1.5">
            {q.options.map((opt, idx) => {
              const optNum = (idx + 1) as 1 | 2 | 3;
              const isCorrect = q.correctAnswer === optNum;
              const isOptPlaying = isPartPlaying(`opt${optNum}` as any);

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900 font-medium'
                      : 'bg-slate-900/60 border-slate-800/60 text-slate-400 light:bg-white light:border-slate-200 light:text-slate-600'
                  } ${isOptPlaying ? 'ring-1 ring-sky-400' : ''}`}
                >
                  <span className="font-bold">{optNum}.</span>
                  <span className="flex-1">{opt}</span>

                  {settings.ttsEnabled && (
                    <button
                      onClick={() => playOption(optNum)}
                      className={`p-0.5 rounded transition-colors ${
                        isOptPlaying ? 'text-sky-400' : 'text-slate-600 hover:text-slate-300'
                      }`}
                      title={`Ascolta opzione ${optNum}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Spiegazione Sintetica con tasto ascolto */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 light:bg-white light:border-slate-200 text-xs space-y-1 text-slate-300 light:text-slate-700">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60 light:border-slate-100">
              <span className="font-bold text-[11px] text-slate-400">Spiegazione Didattica</span>
              {settings.ttsEnabled && (
                <button
                  onClick={() => playExplanation()}
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    isPartPlaying('explanation')
                      ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Ascolta Spiegazione</span>
                </button>
              )}
            </div>
            <div>
              <strong className="text-sky-400 light:text-sky-600">Regola: </strong>
              <span>{q.explanation.rule}</span>
            </div>
            <div>
              <strong className="text-amber-400 light:text-amber-600">Tranello: </strong>
              <span>{q.explanation.trap}</span>
            </div>
          </div>

          {/* Sezione Nota Personale */}
          {stat?.userNote && !isEditingNote && (
            <div className="p-3 rounded-xl border bg-sky-950/40 border-sky-800/60 dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-100 light:bg-sky-50 light:border-sky-200 light:text-sky-950 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-sky-800/40 light:border-sky-200/80 pb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-sky-400 light:text-sky-700 text-[11px] uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  Nota Personale
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNoteText(stat.userNote || '');
                      setIsEditingNote(true);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-200 light:text-sky-700 light:hover:text-sky-950 flex items-center gap-1 font-medium"
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
              <p className="whitespace-pre-wrap leading-relaxed text-slate-200 dark:text-slate-200 light:text-slate-800 text-xs font-normal">
                {stat.userNote}
              </p>
            </div>
          )}

          {isEditingNote && (
            <div className="p-3 rounded-xl border bg-slate-950/90 border-slate-800 dark:bg-slate-950/90 dark:border-slate-800 light:bg-slate-50 light:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-400 light:text-sky-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
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
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Scrivi qui la tua nota personale per questo quesito..."
                className="w-full bg-slate-900 dark:bg-slate-900 border border-slate-800 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 dark:text-slate-100 light:bg-white light:border-slate-200 light:text-slate-900 resize-none outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 dark:border-slate-800 text-slate-400 hover:text-slate-200 light:border-slate-300 light:text-slate-700 hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={async () => {
                    await saveNote(q.id, noteText);
                    setIsEditingNote(false);
                  }}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm transition-all"
                >
                  Salva Nota
                </button>
              </div>
            </div>
          )}

          {!stat?.userNote && !isEditingNote && (
            <button
              onClick={() => {
                setNoteText('');
                setIsEditingNote(true);
              }}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-800 dark:border-slate-800 hover:border-sky-500/60 light:border-slate-300 light:hover:border-sky-600 text-slate-400 hover:text-sky-400 light:text-slate-500 light:hover:text-sky-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi appunto personale sul quesito #{q.id}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const ArchiveScreen: React.FC = () => {
  const { questions, statsMap } = useQuiz();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<number | 'all'>('all');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const stat = statsMap.get(q.id);

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = q.id.toString().includes(query);
        const matchesText = q.question.toLowerCase().includes(query);
        const matchesOptions = q.options.some(opt => opt.toLowerCase().includes(query));
        if (!matchesId && !matchesText && !matchesOptions) return false;
      }

      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) {
        return false;
      }

      if (onlyBookmarks && !stat?.isBookmarked) {
        return false;
      }

      if (onlyWithNotes && !stat?.userNote) {
        return false;
      }

      return true;
    });
  }, [questions, statsMap, searchQuery, selectedSubject, onlyBookmarks, onlyWithNotes]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Archivio Completo</h1>
        <p className="text-xs text-slate-400 light:text-slate-600">
          504 quesiti ufficiali AeCI consultabili e ascoltabili liberamente
        </p>
      </div>

      {/* Barra di Ricerca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cerca per testo, parola chiave o #ID (es. #1001)..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 light:bg-white light:border-slate-200 light:text-slate-900 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtri Rapidi */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none light:bg-white light:border-slate-200 light:text-slate-700"
        >
          <option value="all">Tutte le materie (9)</option>
          <option value="1">Normativa e Legislazione (40)</option>
          <option value="2">Aerodinamica (150)</option>
          <option value="3">Pronto Soccorso (20)</option>
          <option value="4">Fisiopatologia (10)</option>
          <option value="5">Meteorologia (120)</option>
          <option value="6">Strumenti (20)</option>
          <option value="7">Tecnica di Pilotaggio (79)</option>
          <option value="8">Materiali (20)</option>
          <option value="9">Sicurezza del Volo (45)</option>
        </select>

        <button
          onClick={() => setOnlyBookmarks(!onlyBookmarks)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            onlyBookmarks
              ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 light:bg-white light:border-slate-200'
          }`}
        >
          <Bookmark className="w-3 h-3" />
          <span>Solo Preferiti</span>
        </button>

        <button
          onClick={() => setOnlyWithNotes(!onlyWithNotes)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            onlyWithNotes
              ? 'border-sky-500/50 bg-sky-500/20 text-sky-400'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 light:bg-white light:border-slate-200'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Con Note</span>
        </button>

        <div className="ml-auto text-xs text-slate-500">
          {filteredQuestions.length} quiz
        </div>
      </div>

      {/* Lista Domande */}
      <div className="space-y-2">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            Nessun quiz trovato con i filtri attuali
          </div>
        ) : (
          filteredQuestions.map(q => (
            <ArchiveItem
              key={q.id}
              question={q}
              isExpanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
