import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { Navbar, type NavTab } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { getTabLabel } from './utils/navigation';
import { ExamScreen } from './components/ExamScreen';
import { TopicsScreen } from './components/TopicsScreen';
import { MistakesScreen } from './components/MistakesScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsModal } from './components/SettingsModal';
import { DriveModeScreen } from './components/DriveModeScreen';
import { OfflineBanner } from './components/OfflineIndicator';
import { Download, AlertTriangle, Play, ArrowRight, X } from 'lucide-react';
import { voiceService } from './services/voiceService';
import { audioDownloadManager } from './services/audioDownloadManager';

function AppContent() {
  const {
    isExamRunning,
    setIsExamRunning,
    isDriveModeOpen,
    closeDriveMode,
    driveSessionContext,
    activeSession,
    dismissActiveSession,
    settings,
    isSettingsLoaded
  } = useQuiz();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [pendingTab, setPendingTab] = useState<NavTab | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(
    audioDownloadManager.isAnyDownloading()
  );

  // Monitora download audio in background per padding layout
  useEffect(() => {
    return audioDownloadManager.subscribe(statuses => {
      const isDownloading = Object.values(statuses).some(s => s.isDownloading);
      setIsAudioDownloading(isDownloading);
    });
  }, []);

  // Controllo automatico aggiornamenti audio in background all'avvio (se online e abilitato)
  useEffect(() => {
    if (isSettingsLoaded && settings.audioAutoUpdateOnline !== false) {
      const timer = setTimeout(() => {
        audioDownloadManager.autoCheckAndSyncOnStartup().catch(() => {});
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSettingsLoaded, settings.audioAutoUpdateOnline]);

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
      dismissActiveSession();
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelNavigation = () => {
    setPendingTab(null);
  };

  const handleResumeActiveSession = () => {
    if (!activeSession) return;
    if (activeSession.type === 'exam') {
      handleSelectTab(activeSession.examMode === 'tutor' ? 'tutor' : 'exam');
    } else if (activeSession.type === 'topic') {
      handleSelectTab('topics');
    } else if (activeSession.type === 'mistakes') {
      handleSelectTab('mistakes');
    }
  };

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 light:bg-slate-50 light:text-slate-900 transition-colors ${
        activeTab === 'home' ? 'pt-16 sm:pt-[70px]' : 'pt-14 sm:pt-[58px]'
      } ${
        isAudioDownloading ? 'pb-28' : 'pb-8'
      }`}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Avviso Notifica Stato Offline */}
      <OfflineBanner />

      {/* Banner Ripresa Rapida Sessione Cross-Device (se fuori da Home) */}
      {activeSession && !isExamRunning && activeTab !== 'home' && activeTab !== activeSession.type && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in light:bg-amber-50 light:border-amber-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-600 flex-shrink-0">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-amber-100 light:text-amber-900 truncate">
                  Riprendi: {activeSession.subjectName || (activeSession.type === 'exam' ? 'Simulazione Esame' : 'Quaderno Errori')}
                </div>
                <div className="text-[11px] text-amber-300/80 light:text-amber-700 truncate">
                  Domanda {activeSession.currentIndex + 1} di {activeSession.questionIds.length} • {activeSession.answers ? Object.keys(activeSession.answers).length : 0} risposte date
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                id="btn-resume-session"
                onClick={handleResumeActiveSession}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1 shadow-sm transition-colors"
              >
                <span>Riprendi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-dismiss-session"
                onClick={() => dismissActiveSession()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 light:text-slate-500 light:hover:text-slate-800"
                title="Ignora sessione"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Installa PWA se disponibile */}
      {deferredPrompt && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="text-zinc-200">
              Installa l'app per usarla offline sul campo di volo.
            </div>
            <button
              onClick={handleInstallPWA}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installa</span>
            </button>
          </div>
        </div>
      )}

      {/* Schermata Attiva */}
      <main>
        {activeTab === 'home' && <HomeScreen onSelectTab={handleSelectTab} />}
        {activeTab === 'tutor' && <ExamScreen initialMode="tutor" onNavigateHome={() => handleSelectTab('home')} />}
        {activeTab === 'exam' && <ExamScreen initialMode="official" onNavigateHome={() => handleSelectTab('home')} />}
        {activeTab === 'topics' && <TopicsScreen />}
        {activeTab === 'mistakes' && <MistakesScreen />}
        {activeTab === 'archive' && <ArchiveScreen />}
        {activeTab === 'stats' && <StatsScreen />}
      </main>

      {/* Schermata Impostazioni Fullscreen */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Modalità Alla Guida Fullscreen */}
      <DriveModeScreen
        isOpen={isDriveModeOpen}
        onClose={closeDriveMode}
        sessionContext={driveSessionContext || undefined}
      />

      {/* Modal di Avviso Cambio Pagina durante Esame Attivo */}
      {pendingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200">
            <div className="flex items-center gap-2.5 text-amber-400 light:text-amber-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-base text-zinc-100 dark:text-zinc-100 light:text-slate-900">
                Simulazione in Corso
              </h3>
            </div>

            <div className="text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600 space-y-2">
              <p>
                Hai una sessione d'esame attiva. Se ti sposti alla sezione{' '}
                <strong className="text-amber-400 light:text-amber-700 font-bold">
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
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Rimani nell'Esame
              </button>
              <button
                onClick={confirmAbandonAndNavigate}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/60 text-rose-400 hover:bg-rose-500/10 light:text-rose-600 light:border-rose-300 text-xs font-medium transition-colors"
              >
                Interrompi ed Esci
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
