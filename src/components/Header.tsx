import React from 'react';
import { BookOpen, Sparkles, History, HelpCircle, Key, ShieldCheck, Settings } from 'lucide-react';

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenSaved: () => void;
  savedCount: number;
  onShowGuide: () => void;
  trialCount: number;
  accessType: 'TRIAL' | 'PERMANENT' | 'MONTHLY';
  onOpenCodeModal: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadDemo,
  onOpenSaved,
  savedCount,
  onShowGuide,
  trialCount,
  accessType,
  onOpenCodeModal,
  onOpenAdmin,
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

        {/* Action Buttons & Licensing Indicator */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Licensing Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 shadow-inner mr-1">
            {accessType === 'TRIAL' ? (
              <button
                onClick={onOpenCodeModal}
                className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 transition-all font-bold focus:outline-none"
                title="Masukkan Kode Akses Anda"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                <span>Trial: {trialCount} Sisa</span>
                <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 text-rose-300 ml-1 font-semibold flex items-center gap-0.5">
                  <Key size={10} /> Kode Akses
                </span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <ShieldCheck size={14} className="text-emerald-400 animate-pulse" />
                <span>{accessType === 'PERMANENT' ? 'Permanen' : 'Bulanan'}</span>
                <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300 font-semibold">Premium</span>
              </span>
            )}
          </div>

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

          <button
            onClick={onOpenAdmin}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all cursor-pointer"
            title="Akses Portal Admin"
          >
            <Settings size={14} className="text-slate-500 hover:text-slate-300" />
            <span className="hidden lg:inline">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
