import React, { useState, useMemo } from 'react';
import { Search, Bookmark, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

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

      // Filtro ricerca testo o numero ID
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = q.id.toString().includes(query);
        const matchesText = q.question.toLowerCase().includes(query);
        const matchesOptions = q.options.some(opt => opt.toLowerCase().includes(query));
        if (!matchesId && !matchesText && !matchesOptions) return false;
      }

      // Filtro materia
      if (selectedSubject !== 'all' && q.subjectId !== selectedSubject) {
        return false;
      }

      // Filtro preferiti
      if (onlyBookmarks && !stat?.isBookmarked) {
        return false;
      }

      // Filtro note
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
          504 quesiti ufficiali AeCI consultabili liberamente
        </p>
      </div>

      {/* Barra di Ricerca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cerca per testo o numero ID (es. 1001, stallo, altimetro)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-100 placeholder:text-slate-500 light:bg-white light:border-slate-300 light:text-slate-900 outline-none focus:ring-1 focus:ring-sky-500 transition-all"
        />
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800 outline-none"
        >
          <option value="all">Tutte le materie</option>
          <option value="1">01 Normativa</option>
          <option value="2">02 Aerodinamica</option>
          <option value="3">03 Pronto Soccorso</option>
          <option value="4">04 Fisiopatologia</option>
          <option value="5">05 Meteorologia</option>
          <option value="6">06 Strumenti</option>
          <option value="7">07 Tecnica Pilotaggio</option>
          <option value="8">08 Materiali</option>
          <option value="9">09 Sicurezza Volo</option>
        </select>

        <button
          onClick={() => setOnlyBookmarks(!onlyBookmarks)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
            onlyBookmarks
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-semibold'
              : 'border-slate-800 bg-slate-900 text-slate-400 light:bg-white light:border-slate-300 light:text-slate-600'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Preferiti</span>
        </button>

        <button
          onClick={() => setOnlyWithNotes(!onlyWithNotes)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
            onlyWithNotes
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 font-semibold'
              : 'border-slate-800 bg-slate-900 text-slate-400 light:bg-white light:border-slate-300 light:text-slate-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Con Note</span>
        </button>

        <div className="ml-auto text-[11px] text-slate-500">
          {filteredQuestions.length} risultati
        </div>
      </div>

      {/* Lista Risultati */}
      <div className="space-y-2 pt-2">
        {filteredQuestions.map(q => {
          const stat = statsMap.get(q.id);
          const isExpanded = expandedId === q.id;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 light:bg-white light:border-slate-200 overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
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
                      <FileText className="w-3 h-3 text-sky-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-200 light:text-slate-800 font-medium line-clamp-2">
                    {q.question}
                  </p>
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
                  <div className="space-y-1.5">
                    {q.options.map((opt, idx) => {
                      const isCorrect = q.correctAnswer === idx + 1;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                            isCorrect
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900 font-medium'
                              : 'bg-slate-900/60 border-slate-800/60 text-slate-400 light:bg-white light:border-slate-200 light:text-slate-600'
                          }`}
                        >
                          <span className="font-bold">{idx + 1}.</span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Spiegazione Sintetica */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 light:bg-white light:border-slate-200 text-xs space-y-1 text-slate-300 light:text-slate-700">
                    <div>
                      <strong className="text-sky-400 light:text-sky-600">Regola: </strong>
                      <span>{q.explanation.rule}</span>
                    </div>
                    <div>
                      <strong className="text-amber-400 light:text-amber-600">Tranello: </strong>
                      <span>{q.explanation.trap}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
