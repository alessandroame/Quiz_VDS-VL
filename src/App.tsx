import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { QuizProvider } from './context/QuizContext';
import { Navbar, type NavTab } from './components/Navbar';
import { ExamScreen } from './components/ExamScreen';
import { TopicsScreen } from './components/TopicsScreen';
import { MistakesScreen } from './components/MistakesScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsModal } from './components/SettingsModal';
import { Download } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('exam');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors pb-20">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
