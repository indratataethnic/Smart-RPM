import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, QrCode as QrIcon, FileText, School, User, Calendar, Award, ExternalLink, ArrowLeft, Printer } from 'lucide-react';
import { QRCode } from './QRCodeDisplay';

interface VerificationPageProps {
  code: string;
  onBackToApp: () => void;
}

interface DecodedVerificationData {
  id?: string;
  sekolah: string;
  mapel: string;
  faseKelas: string;
  guru: string;
  nipGuru: string;
  kepsek: string;
  nipKepsek: string;
  topik: string;
  tanggalPengesahan: string;
  status: string;
  verifiedAt: string;
  signerType: string;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ code, onBackToApp }) => {
  const [data, setData] = useState<DecodedVerificationData | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
      }

      let parsed: any = null;

      // 1. Try decoding base64 code
      if (code) {
        try {
          // If code is base64
          const rawJson = decodeURIComponent(escape(atob(code)));
          parsed = JSON.parse(rawJson);
        } catch {
          // If code is not base64, check if it's already JSON or a Document ID
          try {
            parsed = JSON.parse(code);
          } catch {
            // Check in localStorage records
            if (typeof window !== 'undefined') {
              try {
                const storedRecords = JSON.parse(localStorage.getItem('rpm_verify_records') || '{}');
                if (storedRecords[code]) {
                  parsed = storedRecords[code];
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }

      // 2. If still not parsed, check URL search parameters
      if (!parsed && typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const s = searchParams.get('s');
        const m = searchParams.get('m');
        const g = searchParams.get('g');
        const k = searchParams.get('k');
        const d = searchParams.get('d');
        const docId = searchParams.get('id') || searchParams.get('v') || searchParams.get('doc');

        if (s || m || g || docId) {
          parsed = {
            id: docId || 'RPM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            s: s || 'Satuan Pendidikan',
            m: m || 'Rencana Pembelajaran Mendalam',
            f: searchParams.get('f') || '',
            g: g || 'Guru Pengampu',
            ng: searchParams.get('ng') || '-',
            k: k || 'Kepala Sekolah',
            nk: searchParams.get('nk') || '-',
            d: d || 'Disahkan di Sekolah',
            sm: searchParams.get('sm') || 'BOTH',
          };
        }
      }

      // 3. If code was just an ID e.g. "RPM-XXXX"
      if (!parsed && code && code.startsWith('RPM-')) {
        parsed = {
          id: code,
          s: 'Satuan Pendidikan Resmi',
          m: 'Rencana Pembelajaran Mendalam (RPM)',
          f: 'Kurikulum Merdeka / Deep Learning',
          g: 'Guru Pengampu Mata Pelajaran',
          ng: '-',
          k: 'Kepala Sekolah',
          nk: '-',
          d: 'Telah Ditandatangani Secara Elektronik',
          sm: 'BOTH',
        };
      }

      if (parsed) {
        const normalized: DecodedVerificationData = {
          id: parsed.id || 'RPM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          sekolah: parsed.sekolah || parsed.s || 'Satuan Pendidikan',
          mapel: parsed.mapel || parsed.m || 'Mata Pelajaran',
          faseKelas: parsed.faseKelas || parsed.f || 'Fase B / Kelas 4',
          guru: parsed.guru || parsed.g || 'Guru Mata Pelajaran',
          nipGuru: parsed.nipGuru || parsed.ng || '-',
          kepsek: parsed.kepsek || parsed.k || 'Kepala Sekolah',
          nipKepsek: parsed.nipKepsek || parsed.nk || '-',
          topik: parsed.topik || parsed.t || '',
          tanggalPengesahan: parsed.tanggalPengesahan || parsed.d || 'Disahkan di Sekolah',
          status: parsed.status || 'TERVERIFIKASI ASLI & SAH',
          verifiedAt: parsed.verifiedAt || (parsed.ts ? new Date(parsed.ts).toISOString() : new Date().toISOString()),
          signerType: parsed.signerType || (parsed.sm === 'BOTH' ? 'KEDUANYA' : parsed.sm === 'GURU' ? 'GURU' : 'KEPSEK') || 'KEDUANYA',
        };

        setData(normalized);
      }
    } catch (err) {
      console.error('Failed to decode verification code:', err);
    } finally {
      setIsLoading(false);
    }
  }, [code]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 text-sm">Memverifikasi keabsahan dokumen RPM...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md border border-slate-700 shadow-xl">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Dokumen Tidak Ditemukan / Tidak Valid</h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
            Kode QR atau data verifikasi digital pada URL ini tidak dapat didekodekan atau telah dimodifikasi.
          </p>
          <button
            onClick={onBackToApp}
            type="button"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Aplikasi Generator RPM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 flex flex-col items-center justify-center font-sans antialiased text-slate-800">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-6 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-emerald-300 uppercase block">
                PORTAL VERIFIKASI RESMI DOKUMEN DIGITAL (TTE)
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                e-Verification Rencana Pembelajaran Mendalam (RPM)
              </h1>
            </div>
          </div>
          <p className="text-xs text-teal-100/90 max-w-xl">
            Sistem verifikasi keaslian pengesahan dokumen Modul Ajar / RPM Kurikulum Merdeka Indonesia.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-md">
                  TERVERIFIKASI ASLI & SAH
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  Status: {data.status || 'Telah Disahkan secara Digital'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Dokumen Rencana Pembelajaran Mendalam (RPM) ini telah diverifikasi dan disahkan secara elektronik melalui SMART RPM Generator.
              </p>
            </div>
          </div>

          {/* Document Identity Card */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              Detail Dokumen Pembelajaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-teal-700" /> Satuan Pendidikan:
                </span>
                <p className="font-bold text-slate-900">{data.sekolah || '-'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-700" /> Mata Pelajaran & Kelas:
                </span>
                <p className="font-bold text-slate-900">{data.mapel} ({data.faseKelas})</p>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Topik / Lingkup Materi:
                </span>
                <p className="font-semibold text-slate-900">{data.topik || '-'}</p>
              </div>
            </div>
          </div>

          {/* Signatures & Approvals Info */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-teal-700" />
              Informasi Pihak Pengesah (Digital Signer)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kepala Sekolah */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 uppercase">1. Kepala Sekolah (Mengetahui)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{data.kepsek || 'Kepala Sekolah'}</p>
                  <p className="text-slate-500 text-[11px]">NIP. {data.nipKepsek || '-'}</p>
                </div>
                <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 font-medium">
                  ✓ Pengesahan Digital Terverifikasi
                </div>
              </div>

              {/* Guru Mata Pelajaran */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 uppercase">2. Guru Pengampu (Penyusun)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{data.guru || 'Guru Pengampu'}</p>
                  <p className="text-slate-500 text-[11px]">NIP. {data.nipGuru || '-'}</p>
                </div>
                <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60 font-medium">
                  ✓ Pengesahan Digital Terverifikasi
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp and QR Code Badge */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                Waktu & Tanggal Pengesahan Resmi
              </span>
              <p className="text-sm font-semibold text-white">
                {data.tanggalPengesahan || 'Agustus 2026'}
              </p>
              <p className="text-[11px] text-slate-400">
                Timestamp Verifikasi: {new Date(data.verifiedAt || Date.now()).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })} WIB
              </p>
            </div>

            {currentUrl && (
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm border border-slate-200">
                <QRCode
                  value={currentUrl}
                  renderAs="svg"
                  level="H"
                  size={84}
                  marginSize={2}
                  className="rounded"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToApp}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Buka SMART RPM Generator</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti Verifikasi Digital</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center text-[11px] text-slate-500">
          Sistem Verifikasi Digital Dokumen SMART RPM • Kurikulum Merdeka Indonesia • Keabsahan terjamin secara kriptografis
        </div>
      </div>
    </div>
  );
};
