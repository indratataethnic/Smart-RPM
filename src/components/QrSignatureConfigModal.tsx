import React, { useState } from 'react';
import { QrCode, CheckCircle2, ShieldCheck, Calendar, MapPin, Sparkles, X, Info, ExternalLink, Copy, Check, Smartphone, Maximize2, Zap, HelpCircle } from 'lucide-react';
import { QrSignatureOptions } from '../lib/qrUtils';
import { QRCode } from './QRCodeDisplay';

interface QrSignatureConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: QrSignatureOptions;
  onChangeOptions: (options: QrSignatureOptions) => void;
  qrContent?: string;
  previewQrDataUrl?: string;
  verificationUrl?: string;
}

export const QrSignatureConfigModal: React.FC<QrSignatureConfigModalProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions,
  qrContent = '',
  previewQrDataUrl,
  verificationUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (verificationUrl) {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                <QrCode className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-bold">Pengaturan Tanda Tangan QR Code Digital (TTE)</h2>
                <p className="text-xs text-teal-200">Optimalisasi Pemindaian Kamera Ponsel (High-Scan Reliability)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Form */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
            {/* Main Switch / Toggle */}
            <div className="p-4 rounded-xl border-2 border-teal-500/30 bg-teal-50/50 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-teal-950 block text-xs sm:text-sm">
                  Aktifkan Tanda Tangan QR Code Resmi
                </span>
                <p className="text-[11px] text-teal-800/80 leading-relaxed">
                  Tampilkan QR Code verifikasi digital di lembar pengesahan (Cetak, PDF & Word).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={options.enabled}
                  onChange={(e) => onChangeOptions({ ...options, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {options.enabled && (
              <div className="space-y-4 pt-1">
                {/* Jenis Output QR Saat Discan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                    Format Respon Saat Discan Kamera HP:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeOptions({ ...options, qrType: 'URL' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        options.qrType === 'URL'
                          ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="block text-xs font-bold">1. Portal e-Verification (Web)</span>
                        {options.qrType === 'URL' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                        Membuka sertifikat verifikasi resmi dokumen Kemdikbud.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onChangeOptions({ ...options, qrType: 'TEXT' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        options.qrType === 'TEXT'
                          ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="block text-xs font-bold">2. Teks Ringkasan Langsung</span>
                        {options.qrType === 'TEXT' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                        Langsung muncul teks pengesahan (100% offline tanpa internet).
                      </span>
                    </button>
                  </div>
                </div>

                {/* Signer Mode Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Terapkan QR Code Untuk:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'BOTH', label: 'Keduanya', desc: 'Kepsek & Guru' },
                      { id: 'GURU', label: 'Guru Saja', desc: 'Penyusun RPM' },
                      { id: 'KEPSEK', label: 'Kepsek Saja', desc: 'Pengesahan' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => onChangeOptions({ ...options, signerMode: mode.id as any })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          options.signerMode === mode.id
                            ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <span className="block text-xs font-semibold">{mode.label}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Tampilan QR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ukuran Tampilan QR pada Dokumen:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeOptions({ ...options, qrSize: 'NORMAL' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        options.qrSize === 'NORMAL'
                          ? 'border-teal-600 bg-teal-50/80 font-bold text-teal-950 ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs">Standar (112px)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeOptions({ ...options, qrSize: 'LARGE' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        options.qrSize === 'LARGE'
                          ? 'border-teal-600 bg-teal-50/80 font-bold text-teal-950 ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">Besar & Ekstra Jelas (136px)</span>
                    </button>
                  </div>
                </div>

                {/* Kota & Tanggal Pengesahan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-700" />
                      Kota / Wilayah Pengesahan
                    </label>
                    <input
                      type="text"
                      value={options.locationCity}
                      onChange={(e) => onChangeOptions({ ...options, locationCity: e.target.value })}
                      placeholder="Contoh: Karanganyar / Surakarta"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-600 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Otomatis tersinkron dari data kota/sekolah awal, dapat diubah manual.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      Tanggal Pengesahan
                    </label>
                    <input
                      type="text"
                      value={options.customDate}
                      onChange={(e) => onChangeOptions({ ...options, customDate: e.target.value })}
                      placeholder="Contoh: 28 Agustus 2026"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-600 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Format tanggal resmi penandatanganan dokumen RPM.
                    </p>
                  </div>
                </div>

                {/* QR Preview Card with Direct Test Button */}
                {qrContent && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative group bg-white p-3 rounded-2xl border-2 border-slate-300 shrink-0 shadow-sm flex flex-col items-center justify-center">
                      <QRCode
                        value={qrContent}
                        renderAs="svg"
                        level="M"
                        size={108}
                        marginSize={3}
                        className="rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setIsZoomed(true)}
                        className="mt-2 inline-flex items-center gap-1 text-[10px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        title="Klik untuk memperbesar QR"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Perbesar QR</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Pola Modul QR Tajam (Level M):</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Siap Pindai HP
                        </span>
                      </div>

                      <p className="text-[11px] leading-tight text-slate-600">
                        {options.qrType === 'URL'
                          ? 'Arahkan kamera HP / Google Lens ke kotak QR di samping untuk menguji sertifikat verifikasi.'
                          : 'Kamera HP akan langsung menampilkan teks ringkasan pengesahan secara instan.'}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsZoomed(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Uji Pindai Kamera HP</span>
                        </button>

                        {options.qrType === 'URL' && verificationUrl && (
                          <>
                            <a
                              href={verificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka di Tab Baru</span>
                            </a>
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-all"
                            >
                              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Petunjuk Pemindaian */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Panduan Pemindaian Kamera HP:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px]">
                    <li>Gunakan aplikasi <strong>Kamera Bawaan HP</strong> (iPhone Camera / Samsung / Xiaomi / Oppo / Vivo) atau <strong>Google Lens</strong> / <strong>WhatsApp Scanner</strong>.</li>
                    <li>Jaga jarak kamera sekitar <strong>15 – 30 cm</strong> dari layar monitor agar fokus kamera stabil dan tidak terkena pantulan cahaya.</li>
                    <li>Jika memindai langsung dari layar monitor terasa silau, klik tombol <strong>"Uji Pindai Kamera HP"</strong> di atas untuk memperbesar ukuran QR Code.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              Selesai & Terapkan
            </button>
          </div>
        </div>
      </div>

      {/* Modal Zoom QR untuk Uji Coba Pindai Langsung di Layar Komputer */}
      {isZoomed && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-teal-800 uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Uji Pindai Kamera Ponsel
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border-4 border-teal-600 shadow-md inline-block">
              <QRCode
                value={qrContent}
                renderAs="svg"
                level="M"
                size={220}
                marginSize={4}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Arahkan Kamera HP ke Kotak QR di Atas
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {options.qrType === 'URL'
                  ? 'Kamera HP akan mendeteksi tautan resmi dan menampilkan tombol notifikasi untuk membuka halaman verifikasi.'
                  : 'Kamera HP akan langsung membaca data ringkasan pengesahan resmi dokumen.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </>
  );
};


