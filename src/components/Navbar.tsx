import React from 'react';
import {
  Compass,
  BookOpen,
  AlertTriangle,
  Database,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizContext';

export type NavTab = 'exam' | 'topics' | 'mistakes' | 'archive' | 'stats';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  openSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openSettings }) => {
  const { theme, setTheme } = useTheme();
  const { mistakesCount, readinessScore } = useQuiz();

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const navItems = [
    { id: 'exam' as NavTab, label: 'Esame', icon: Compass },
    { id: 'topics' as NavTab, label: 'Materie', icon: BookOpen },
    {
      id: 'mistakes' as NavTab,
      label: 'Errori',
      icon: AlertTriangle,
      badge: mistakesCount > 0 ? mistakesCount : undefined
    },
    { id: 'archive' as NavTab, label: 'Archivio', icon: Database },
    { id: 'stats' as NavTab, label: 'Stats', icon: BarChart3 }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-slate-950/80 border-slate-800 dark:bg-slate-950/80 dark:border-slate-800 light:bg-white/80 light:border-slate-200 light:text-slate-900 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('exam')}>
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span>VDS-VL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">2017</span>
              </div>
              <div className="text-[11px] text-slate-400 light:text-slate-500">
                Prontezza: <strong className="text-sky-400 light:text-sky-600">{readinessScore}%</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme quick toggle */}
            <button
              onClick={cycleTheme}
              title={`Tema: ${theme}`}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
            >
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              onClick={openSettings}
              title="Impostazioni"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav Bar (Mobile & Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur bg-slate-950/95 border-slate-800 dark:bg-slate-950/95 dark:border-slate-800 light:bg-white/95 light:border-slate-200 transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
                  isActive
                    ? 'text-sky-400 light:text-sky-600 font-semibold'
                    : 'text-slate-400 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 min-w-4 text-[10px] font-bold rounded-full bg-rose-500 text-white text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-0.5 rounded-full bg-sky-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
