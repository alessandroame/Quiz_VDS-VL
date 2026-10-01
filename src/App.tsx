import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { Navbar, type NavTab } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ExamScreen } from './components/ExamScreen';
import { OfflineBanner } from './components/OfflineIndicator';
import { Download, Play, ArrowRight, X } from 'lucide-react';
import { voiceService } from './services/voiceService';
import { audioDownloadManager } from './services/audioDownloadManager';
import { telemetry } from './services/telemetry';
import { appTimeTracker } from './services/appTimeTracker';
import { applyFontSizePreference } from './utils/fontSize';
import { SessionInterruptModal } from './components/SessionInterruptModal';
import {
  backNavigation,
  executeBackAction,
  type BackNavigationContext
} from './utils/backNavigation';

// Lazy-loaded secondary screens for code-splitting and bundle reduction
const TopicsScreen = lazy(() => import('./components/TopicsScreen').then(m => ({ default: m.TopicsScreen })));
const MistakesScreen = lazy(() => import('./components/MistakesScreen').then(m => ({ default: m.MistakesScreen })));
const ArchiveScreen = lazy(() => import('./components/ArchiveScreen').then(m => ({ default: m.ArchiveScreen })));
const StatsScreen = lazy(() => import('./components/StatsScreen').then(m => ({ default: m.StatsScreen })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const DriveModeScreen = lazy(() => import('./components/DriveModeScreen').then(m => ({ default: m.DriveModeScreen })));
import type { SettingsTab } from './components/SettingsModal';

const ScreenFallback = () => (
  <div className="flex items-center justify-center p-16 text-zinc-500 text-xs">
    <div className="w-5 h-5 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const {
    isExamRunning,
    setIsExamRunning,
    isDriveModeOpen,
    closeDriveMode,
    driveSessionContext,
    activeSession,
    dismissActiveSession,
    persistActiveSession,
    settings,
    isSettingsLoaded,
    readinessScore
  } = useQuiz();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [pendingTab, setPendingTab] = useState<NavTab | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<SettingsTab | null>(null);
  const [selectedTopicSubjectId, setSelectedTopicSubjectId] = useState<number | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAudioDownloading, setIsAudioDownloading] = useState(
    audioDownloadManager.isAnyDownloading()
  );

  // Synchronous ref to prevent stale closures in popstate event listener
  const navigationContextRef = useRef<BackNavigationContext>({
    activeTab,
    isExamRunning,
    isSettingsOpen,
    isDriveModeOpen,
    pendingTab,
    onCloseSettings: () => {
      setIsSettingsOpen(false);
      setSettingsDefaultTab(null);
    },
    onCloseDriveMode: () => closeDriveMode(),
    onCancelPendingTab: () => setPendingTab(null),
    onNavigateHome: () => {
      voiceService.stop();
      setActiveTab('home');
    },
    onInterceptExamLeave: () => {
      voiceService.stop();
      if (typeof window !== 'undefined' && window.history) {
        backNavigation.incrementDepth();
        window.history.pushState({ appDepth: backNavigation.getDepth(), tab: 'exam' }, '');
      }
      setPendingTab('home');
    }
  });

  // Keep navigationContextRef updated on every render
  useEffect(() => {
    navigationContextRef.current = {
      activeTab,
      isExamRunning,
      isSettingsOpen,
      isDriveModeOpen,
      pendingTab,
      onCloseSettings: () => {
        setIsSettingsOpen(false);
        setSettingsDefaultTab(null);
      },
      onCloseDriveMode: () => closeDriveMode(),
      onCancelPendingTab: () => setPendingTab(null),
      onNavigateHome: () => {
        voiceService.stop();
        setActiveTab('home');
      },
      onInterceptExamLeave: () => {
        voiceService.stop();
        if (typeof window !== 'undefined' && window.history) {
          backNavigation.incrementDepth();
          window.history.pushState({ appDepth: backNavigation.getDepth(), tab: 'exam' }, '');
        }
        setPendingTab('home');
      }
    };
  });

  // Popstate event listener for phone hardware back button & Android/iOS back gestures
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.replaceState({ appDepth: 0 }, '');

    const handlePopState = () => {
      voiceService.stop();
      backNavigation.decrementDepth();
      executeBackAction(navigationContextRef.current);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Monitor DriveMode opening to push history entry
  const prevDriveModeOpenRef = useRef(isDriveModeOpen);
  useEffect(() => {
    if (!prevDriveModeOpenRef.current && isDriveModeOpen) {
      if (typeof window !== 'undefined' && window.history) {
        backNavigation.incrementDepth();
        window.history.pushState({ appDepth: backNavigation.getDepth(), modal: 'drive' }, '');
      }
    }
    prevDriveModeOpenRef.current = isDriveModeOpen;
  }, [isDriveModeOpen]);

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

  // Applica reattivamente la scala caratteri (Compatto / Normale / Grande)
  useEffect(() => {
    if (isSettingsLoaded) {
      applyFontSizePreference(settings.fontSizePreference || 'normal');
    }
  }, [isSettingsLoaded, settings.fontSizePreference]);

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

  // Initialize anonymous telemetry with opt-out respect once settings are loaded
  useEffect(() => {
    if (!isSettingsLoaded) return;
    const isPwa = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
    telemetry
      .init({
        enabled: settings.telemetryEnabled ?? true,
      })
      .then(() => {
        telemetry.trackAppSessionStarted({
          version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
          build_number: typeof __APP_BUILD_NUMBER__ !== 'undefined' ? __APP_BUILD_NUMBER__ : '0',
          is_standalone_pwa: isPwa,
          theme: settings.theme,
          font_scale: settings.fontSizePreference,
          readiness_score: readinessScore,
        });

        // Start active usage time tracking
        appTimeTracker.start({
          getScreen: () => {
            if (isDriveModeOpen) return 'drive_mode';
            if (isSettingsOpen) return 'settings';
            return activeTab;
          },
          getReadinessScore: () => readinessScore,
          isStandalonePwa: () => isPwa,
          isAudioActive: () => voiceService.isPlaying(),
        });
      })
      .catch(() => {});

    return () => {
      appTimeTracker.stop();
    };
  }, [isSettingsLoaded]);

  // Synchronize screen transitions in appTimeTracker
  useEffect(() => {
    let currentScreen = activeTab as string;
    if (isDriveModeOpen) {
      currentScreen = 'drive_mode';
    } else if (isSettingsOpen) {
      currentScreen = 'settings';
    }
    appTimeTracker.setScreen(currentScreen);
  }, [activeTab, isDriveModeOpen, isSettingsOpen]);

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
    telemetry.trackPwaInstallPrompt({ outcome });
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleOpenSettings = (defaultTab?: SettingsTab | null) => {
    setSettingsDefaultTab(defaultTab ?? null);
    setIsSettingsOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      backNavigation.incrementDepth();
      window.history.pushState({ appDepth: backNavigation.getDepth(), modal: 'settings' }, '');
    }
  };

  const handleCloseSettings = () => {
    if (typeof window !== 'undefined' && window.history && backNavigation.getDepth() > 0) {
      window.history.back();
    } else {
      setIsSettingsOpen(false);
      setSettingsDefaultTab(null);
    }
  };

  const handleCloseDriveMode = () => {
    if (typeof window !== 'undefined' && window.history && backNavigation.getDepth() > 0) {
      window.history.back();
    } else {
      closeDriveMode();
    }
  };

  // Intercetta la navigazione se c'è un esame attivo per evitare perdita di progresso
  const handleSelectTab = (tab: NavTab) => {
    if (tab === activeTab) return;
    voiceService.stop();
    if (isExamRunning) {
      setPendingTab(tab);
      if (typeof window !== 'undefined' && window.history) {
        backNavigation.incrementDepth();
        window.history.pushState({ appDepth: backNavigation.getDepth(), modal: 'pendingTab' }, '');
      }
      return;
    }

    if (tab !== 'home' && activeTab === 'home') {
      if (typeof window !== 'undefined' && window.history) {
        backNavigation.incrementDepth();
        window.history.pushState({ appDepth: backNavigation.getDepth(), tab }, '');
      }
    } else if (tab === 'home' && activeTab !== 'home') {
      if (typeof window !== 'undefined' && window.history && backNavigation.getDepth() > 0) {
        window.history.back();
        return;
      }
    }
    setActiveTab(tab);
  };

  // Navigazione diretta alla Home per azioni confermate di interruzione/fine esame (senza re-intercettazione)
  const handleDirectNavigateHome = () => {
    setIsExamRunning(false);
    voiceService.stop();
    setPendingTab(null);
    backNavigation.resetDepth();
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({ appDepth: 0 }, '');
    }
    setActiveTab('home');
  };

  const pauseAndNavigate = async () => {
    if (pendingTab) {
      const destTab = pendingTab;
      setPendingTab(null);
      setIsExamRunning(false);
      voiceService.stop();
      if (activeSession) {
        await persistActiveSession({
          ...activeSession,
          isPaused: true,
          pausedAt: Date.now()
        });
      }
      setActiveTab(destTab);
      backNavigation.resetDepth();
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({ appDepth: 0 }, '');
      }
    }
  };

  const confirmAbandonAndNavigate = async () => {
    if (pendingTab) {
      const destTab = pendingTab;
      setPendingTab(null);
      setIsExamRunning(false);
      voiceService.stop();
      await dismissActiveSession();
      setActiveTab(destTab);
      backNavigation.resetDepth();
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState({ appDepth: 0 }, '');
      }
    }
  };

  const cancelNavigation = () => {
    if (typeof window !== 'undefined' && window.history && backNavigation.getDepth() > 0) {
      window.history.back();
    } else {
      setPendingTab(null);
    }
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
        openSettings={handleOpenSettings}
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
        <Suspense fallback={<ScreenFallback />}>
          {activeTab === 'home' && <HomeScreen onSelectTab={handleSelectTab} />}
          {activeTab === 'tutor' && (
            <ExamScreen
              key="tutor"
              initialMode="tutor"
              onNavigateHome={handleDirectNavigateHome}
              onSwitchMode={(mode) => handleSelectTab(mode === 'tutor' ? 'tutor' : 'exam')}
            />
          )}
          {activeTab === 'exam' && (
            <ExamScreen
              key="exam"
              initialMode="official"
              onNavigateHome={handleDirectNavigateHome}
              onSwitchMode={(mode) => handleSelectTab(mode === 'tutor' ? 'tutor' : 'exam')}
            />
          )}
          {activeTab === 'topics' && (
            <TopicsScreen
              initialSubjectId={selectedTopicSubjectId}
              onClearInitialSubjectId={() => setSelectedTopicSubjectId(null)}
              onNavigateHome={handleDirectNavigateHome}
            />
          )}
          {activeTab === 'mistakes' && (
            <MistakesScreen onNavigateHome={handleDirectNavigateHome} />
          )}
          {activeTab === 'archive' && <ArchiveScreen />}
          {activeTab === 'stats' && (
            <StatsScreen
              onTrainSubject={(subjectId) => {
                setSelectedTopicSubjectId(subjectId);
                handleSelectTab('topics');
              }}
            />
          )}
        </Suspense>
      </main>

      {/* Schermata Impostazioni Fullscreen */}
      {isSettingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={handleCloseSettings}
            defaultTab={settingsDefaultTab}
          />
        </Suspense>
      )}

      {/* Modalità Audio Fullscreen */}
      {isDriveModeOpen && (
        <Suspense fallback={null}>
          <DriveModeScreen
            isOpen={isDriveModeOpen}
            onClose={handleCloseDriveMode}
            sessionContext={driveSessionContext || undefined}
          />
        </Suspense>
      )}

      {/* Modal di Avviso Cambio Pagina durante Esame Attivo */}
      {pendingTab && (
        <SessionInterruptModal
          isOpen={Boolean(pendingTab)}
          onClose={cancelNavigation}
          onPause={pauseAndNavigate}
          onTerminate={confirmAbandonAndNavigate}
          sessionTitle={
            activeSession?.subjectName ||
            (activeSession?.type === 'exam'
              ? (activeSession.examMode === 'tutor' ? 'Tutor Didattico' : 'Simulazione Esame')
              : 'Quaderno Errori')
          }
          currentIndex={activeSession?.currentIndex || 0}
          totalQuestions={activeSession?.questionIds?.length || 30}
          answeredCount={activeSession?.answers ? Object.keys(activeSession.answers).length : 0}
        />
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
