import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { Navbar, type NavTab } from './components/Navbar';
import { ExamScreen } from './components/ExamScreen';
import { TopicsScreen } from './components/TopicsScreen';
import { MistakesScreen } from './components/MistakesScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsModal } from './components/SettingsModal';
import { Download, AlertTriangle } from 'lucide-react';
import { voiceService } from './services/voiceService';

function AppContent() {
  const { isExamRunning, setIsExamRunning } = useQuiz();
  const [activeTab, setActiveTab] = useState<NavTab>('exam');
  const [pendingTab, setPendingTab] = useState<NavTab | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Protezione prima della chiusura/ricaricamento pagina se c'è un esame attivo
  useEffect(() => {
    if (!isExamRunning) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamRunning]);

  // Intercetta l'evento di installazione PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Intercetta la navigazione se c'è un esame attivo per evitare perdita di progresso
  const handleSelectTab = (tab: NavTab) => {
    if (tab === activeTab) return;
    if (isExamRunning) {
      setPendingTab(tab);
      return;
    }
    voiceService.stop();
    setActiveTab(tab);
  };

  const confirmAbandonAndNavigate = () => {
    if (pendingTab) {
      setIsExamRunning(false);
      voiceService.stop();
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelNavigation = () => {
    setPendingTab(null);
  };

  const getTabLabel = (tab: NavTab | null) => {
    switch (tab) {
      case 'exam': return 'Esame';
      case 'topics': return 'Materie';
      case 'mistakes': return 'Errori';
      case 'archive': return 'Archivio';
      case 'stats': return 'Stats';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors pb-20">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Banner Installa PWA se disponibile */}
      {deferredPrompt && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="p-3 bg-sky-950/60 border border-sky-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="text-sky-200">
              Installa l'app per usarla offline sul campo di volo.
            </div>
            <button
              onClick={handleInstallPWA}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installa</span>
            </button>
          </div>
        </div>
      )}

      {/* Schermata Attiva */}
      <main>
        {activeTab === 'exam' && <ExamScreen />}
        {activeTab === 'topics' && <TopicsScreen />}
        {activeTab === 'mistakes' && <MistakesScreen />}
        {activeTab === 'archive' && <ArchiveScreen />}
        {activeTab === 'stats' && <StatsScreen />}
      </main>

      {/* Modal Impostazioni */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Modal di Avviso Cambio Pagina durante Esame Attivo */}
      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-400 light:text-amber-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base text-slate-100 dark:text-slate-100 light:text-slate-900">
                Simulazione in Corso
              </h3>
            </div>

            <div className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 space-y-2">
              <p>
                Hai una sessione d'esame attiva. Se ti sposti alla sezione{' '}
                <strong className="text-sky-400 light:text-sky-700 font-bold">
                  "{getTabLabel(pendingTab)}"
                </strong>
                , la simulazione in corso verrà interrotta e tutti i progressi andranno persi.
              </p>
              <p className="text-rose-400 light:text-rose-600 font-semibold">
                Vuoi davvero abbandonare l'esame?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={cancelNavigation}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Rimani nell'Esame
              </button>
              <button
                onClick={confirmAbandonAndNavigate}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/60 text-rose-400 hover:bg-rose-500/10 light:text-rose-600 light:border-rose-300 text-xs font-medium transition-colors"
              >
                Abbandona ed Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QuizProvider>
        <AppContent />
      </QuizProvider>
    </ThemeProvider>
  );
}

export default App;
