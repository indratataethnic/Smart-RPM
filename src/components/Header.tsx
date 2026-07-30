import React from 'react';
import { BookOpen, Sparkles, History, HelpCircle, FileText } from 'lucide-react';

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenSaved: () => void;
  savedCount: number;
  onShowGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadDemo,
  onOpenSaved,
  savedCount,
  onShowGuide,
}) => {
  return (
    <header id="header-main" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-900/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
                Generator RPM <span className="text-teal-400 font-extrabold">(Rencana Pembelajaran Mendalam)</span>
              </h1>
              <span className="text-[10px] sm:text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold px-2 py-0.5 rounded-full">
                Kurikulum Merdeka
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modul Ajar Otomatis Berorientasi Kerangka <span className="text-teal-300 font-medium">Memahami, Mengaplikasi, & Merefleksi</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            id="btn-demo-preset"
            onClick={onLoadDemo}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Contoh Demo</span>
          </button>

          <button
            id="btn-saved-plans"
            onClick={onOpenSaved}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm active:scale-95 cursor-pointer relative"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Riwayat RPM</span>
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-teal-500 text-slate-950 font-bold text-[10px] rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <button
            id="btn-show-guide"
            onClick={onShowGuide}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            title="Panduan Pembelajaran Mendalam"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
