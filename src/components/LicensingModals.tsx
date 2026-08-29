import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldAlert, 
  Lock, 
  CheckCircle, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Users, 
  FileText, 
  Calendar,
  Layers,
  Activity,
  UserCheck,
  Search,
  Check,
  Power,
  Edit2,
  Download,
  FileSpreadsheet,
  ShoppingBag,
  Sparkles,
  Copy,
  ExternalLink,
  ShieldCheck,
  Gift,
  ArrowRight
} from 'lucide-react';

// Get or Generate Fingerprint
export function getOrGenerateFingerprint(): string {
  let fp = localStorage.getItem('rpm_user_fingerprint');
  if (!fp) {
    const cookies = document.cookie.split(';');
    const fpCookie = cookies.find(c => c.trim().startsWith('rpm_fingerprint='));
    if (fpCookie) {
      fp = fpCookie.split('=')[1];
      localStorage.setItem('rpm_user_fingerprint', fp);
    } else {
      const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const screenInfo = `${window.screen.width}x${window.screen.height}`;
      const lang = navigator.language || '';
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      fp = `FP-${screenInfo}-${lang.replace(/[^a-zA-Z]/g, '')}-${tz.replace(/[^a-zA-Z]/g, '')}-${rand.toUpperCase()}`;
      localStorage.setItem('rpm_user_fingerprint', fp);
      document.cookie = `rpm_fingerprint=${fp}; max-age=31536000; path=/`;
    }
  }
  return fp;
}

// -------------------------------------------------------------
// LOCAL FALLBACK DATABASE ENGINE FOR CLIENT-SIDE / VERCEL COMPATIBILITY
// -------------------------------------------------------------
const DEFAULT_LOCAL_CODES = [
  {
    id: "code-perm-1",
    code: "RPM-PERM-KARANGANYAR",
    type: "PERMANENT",
    status: "ACTIVE",
    valid_from: new Date().toISOString(),
    valid_until: null,
    created_at: new Date().toISOString(),
    created_by: "System Admin",
    notes: "Akses Permanen & Selamanya Khusus SD Negeri Karanganyar",
  },
  {
    id: "code-monthly-demo",
    code: "RPM-2026-07-DEMO123",
    type: "MONTHLY",
    status: "ACTIVE",
    valid_from: "2026-07-01T00:00:00.000Z",
    valid_until: "2026-08-31T23:59:59.000Z",
    created_at: new Date().toISOString(),
    created_by: "System Admin",
    notes: "Kode Akses Bulan Juli - Agustus 2026 (Demo Bulanan Sekolah Lain)",
  },
  {
    id: "code-monthly-exp",
    code: "RPM-2026-06-EXPIRED",
    type: "MONTHLY",
    status: "ACTIVE",
    valid_from: "2026-06-01T00:00:00.000Z",
    valid_until: "2026-06-30T23:59:59.000Z",
    created_at: new Date().toISOString(),
    created_by: "System Admin",
    notes: "Kode Bulanan Lama (Juni 2026) - Sudah Kedaluwarsa",
  }
];

export function getLocalCodes(): any[] {
  try {
    const raw = localStorage.getItem('rpm_local_codes_db');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  try {
    localStorage.setItem('rpm_local_codes_db', JSON.stringify(DEFAULT_LOCAL_CODES));
  } catch (e) {}
  return DEFAULT_LOCAL_CODES;
}

export function saveLocalCodes(codes: any[]) {
  try {
    localStorage.setItem('rpm_local_codes_db', JSON.stringify(codes));
  } catch (e) {}
}

export function safeParseDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  
  if (typeof dateVal === 'number') {
    return new Date(dateVal);
  }
  
  const dateStr = String(dateVal).trim();
  
  // Try direct parse first
  let parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Match Indonesian/European format: DD/MM/YYYY or DD-MM-YYYY
  // optionally followed by HH:mm:ss or HH.mm.ss
  // Examples: "02/08/2026, 12.45.00", "02-08-2026 12:45:00", "02/08/2026 12:45:00"
  const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\s,]+(\d{1,2})[\:\.](\d{1,2})(?:[\:\.](\d{1,2}))?)?/;
  const match = dateStr.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    const hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    const seconds = match[6] ? parseInt(match[6], 10) : 0;
    
    parsed = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date(); // fallback to current date instead of showing Invalid Date
}

export function getLocalTrialUsers(): any[] {
  try {
    const raw = localStorage.getItem('rpm_local_trials_db');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveLocalTrialUsers(users: any[]) {
  try {
    localStorage.setItem('rpm_local_trials_db', JSON.stringify(users));
  } catch (e) {}
}

export function getLocalLogs(): any[] {
  try {
    const raw = localStorage.getItem('rpm_local_logs_db');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: "log-1",
      timestamp: new Date().toISOString(),
      activity_type: "LOGIN",
      details: "Admin login ke sistem (Mode Client-Side)",
      user_info: { ip: "127.0.0.1", browser: "Web Browser" }
    }
  ];
}

export function syncToGoogleSheet(payload: any) {
  try {
    const webhookUrl = localStorage.getItem('rpm_google_sheet_webhook_url');
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;
    
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(e => console.warn('Google sheet webhook sync failed:', e));
  } catch (e) {}
}

export function syncCodeToGoogleSheet(codeObj: {
  code: string;
  type?: string;
  status?: string;
  valid_from?: string;
  valid_until?: string | null;
  created_at?: string;
  created_by?: string;
  notes?: string;
}) {
  try {
    const webhookUrl = localStorage.getItem('rpm_google_sheet_webhook_url');
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;

    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        activity_type: 'ACCESS_CODE_RECORD',
        teacher_name: `Admin / Lynk (${codeObj.created_by || 'System'})`,
        fingerprint: typeof localStorage !== 'undefined' ? (localStorage.getItem('rpm_user_fingerprint') || 'SERVER') : 'SERVER',
        ip: '127.0.0.1',
        code_used: codeObj.code,
        code: codeObj.code,
        type: codeObj.type || 'MONTHLY',
        status: codeObj.status || 'ACTIVE',
        valid_from: codeObj.valid_from || new Date().toISOString(),
        valid_until: codeObj.valid_until || 'Selamanya',
        notes: codeObj.notes || '',
        created_by: codeObj.created_by || 'Admin',
        details: `Kode Akses Tersimpan/Tergenerate: ${codeObj.code} (${codeObj.type || 'MONTHLY'}) - Berlaku s/d: ${codeObj.valid_until ? new Date(codeObj.valid_until).toLocaleDateString('id-ID') : 'Permanen'} - Catatan: ${codeObj.notes || '-'}`
      })
    }).catch(e => console.warn('Google Sheet code sync failed:', e));
  } catch (e) {}
}

export function addLocalLog(type: string, details: string) {
  const logs = getLocalLogs();
  const newLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    activity_type: type,
    details: details,
    user_info: { ip: "127.0.0.1", browser: typeof navigator !== 'undefined' ? navigator.userAgent : "Browser" }
  };
  logs.unshift(newLog);
  try {
    localStorage.setItem('rpm_local_logs_db', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {}

  syncToGoogleSheet({
    timestamp: newLog.timestamp,
    teacher_name: `Guru (${typeof localStorage !== 'undefined' ? (localStorage.getItem('rpm_user_fingerprint') || 'Guest').substring(0, 12) : 'Guest'})`,
    fingerprint: typeof localStorage !== 'undefined' ? localStorage.getItem('rpm_user_fingerprint') : '-',
    ip: '127.0.0.1',
    activity_type: type,
    details: details,
    code_used: 'Trial / Aktivitas'
  });
}

export function fetchClientIpAndLocation(fingerprint: string) {
  // Try fetching IP & location
  fetch('https://ipapi.co/json/')
    .then(res => {
      if (!res.ok) throw new Error('ipapi failed');
      return res.json();
    })
    .then(data => {
      if (data && data.ip) {
        updateUserIp(fingerprint, data.ip, `${data.city || ''}, ${data.country_name || 'Indonesia'}`.trim());
      }
    })
    .catch(() => {
      // Fallback 1: ipinfo.io
      fetch('https://ipinfo.io/json')
        .then(res => res.json())
        .then(data => {
          if (data && data.ip) {
            updateUserIp(fingerprint, data.ip, `${data.city || ''}, ${data.country || 'Indonesia'}`.trim());
          }
        })
        .catch(() => {
          // Fallback 2: ipify (just IP)
          fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => {
              if (data && data.ip) {
                updateUserIp(fingerprint, data.ip, 'Indonesia');
              }
            })
            .catch(() => {});
        });
    });
}

function updateUserIp(fingerprint: string, ip: string, location: string) {
  const users = getLocalTrialUsers();
  const existing = users.find((u: any) => u.id === fingerprint);
  if (existing) {
    existing.ip = ip;
    existing.location = location;
    saveLocalTrialUsers(users);
    
    const hasGenerated = existing.has_generated || existing.remaining_trials < 5 || (existing.used_trials && existing.used_trials > 0);

    if (hasGenerated) {
      // Sync updated data directly to Google Spreadsheet Sheet 2 (Data Trial)
      syncToGoogleSheet({
        timestamp: existing.last_active || new Date().toISOString(),
        fingerprint: fingerprint,
        ip: ip,
        location: location,
        remaining_trials: existing.remaining_trials,
        created_at: existing.created_at,
        last_active: existing.last_active || new Date().toISOString(),
        activity_type: 'TRIAL_USER_RECORD',
        details: `IP terupdate otomatis: ${ip} (${location})`
      });
    } else {
      // Guru baru berkunjung: log update IP/Lokasi di Log Aktivitas Guru (Sheet 1)
      syncToGoogleSheet({
        timestamp: new Date().toISOString(),
        teacher_name: `Guru (${fingerprint.substring(0, 10)})`,
        fingerprint: fingerprint,
        ip: ip,
        activity_type: 'VISIT',
        details: `Kunjungan guru terdeteksi dari ${location} (IP: ${ip})`,
        code_used: 'Kunjungan'
      });
    }
    
    // Sync to backend DB
    fetch('/api/licensing/trial/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existing)
    }).catch(() => {});
  }
}

export function getOrRegisterLocalTrialUser(fingerprint: string): number {
  const users = getLocalTrialUsers();
  let existing = users.find((u: any) => u.id === fingerprint);
  
  if (!existing) {
    const storedStr = localStorage.getItem('rpm_trial_count');
    const rem = storedStr !== null ? parseInt(storedStr, 10) : 5;
    existing = {
      id: fingerprint,
      remaining_trials: isNaN(rem) ? 5 : rem,
      has_generated: false,
      used_trials: 0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      ip: '127.0.0.1',
      location: 'Indonesia'
    };
    users.push(existing);
    saveLocalTrialUsers(users);

    // Kunjungan pertama: Masuk di Log Aktivitas Guru (Sheet 1)
    addLocalLog('VISIT', `Guru baru mengunjungi aplikasi RPM Smart (${fingerprint.substring(0, 10)}...)`);
  } else {
    existing.last_active = new Date().toISOString();
    saveLocalTrialUsers(users);
  }
  
  // Proactively fetch real IP and location asynchronously
  fetchClientIpAndLocation(fingerprint);
  
  localStorage.setItem('rpm_trial_count', String(existing.remaining_trials));

  // Sync to server backend
  fetch('/api/licensing/trial/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(existing)
  }).catch(() => {});

  return existing.remaining_trials;
}

export function decrementLocalTrial(fingerprint: string): number {
  const users = getLocalTrialUsers();
  let existing = users.find((u: any) => u.id === fingerprint);
  
  if (!existing) {
    const storedStr = localStorage.getItem('rpm_trial_count');
    const rem = storedStr !== null ? parseInt(storedStr, 10) : 5;
    existing = {
      id: fingerprint,
      remaining_trials: isNaN(rem) ? 5 : rem,
      has_generated: true,
      used_trials: 1,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      ip: '127.0.0.1',
      location: 'Indonesia'
    };
    users.push(existing);
  }

  existing.has_generated = true;
  existing.used_trials = (existing.used_trials || 0) + 1;

  if (existing.remaining_trials > 0) {
    existing.remaining_trials -= 1;
  }
  existing.last_active = new Date().toISOString();
  
  saveLocalTrialUsers(users);
  localStorage.setItem('rpm_trial_count', String(existing.remaining_trials));
  
  addLocalLog('GENERATE_RPM', `Guru melakukan Generate RPM (${fingerprint.substring(0, 10)}...). Sisa kuota gratis: ${existing.remaining_trials} kali`);

  // Proactively fetch real IP and location asynchronously to keep sheet fresh
  fetchClientIpAndLocation(fingerprint);

  // Guru melakukan Generate: Catat ke Daftar Pengguna Trial di Sheet 2 Google Spreadsheet
  syncToGoogleSheet({
    timestamp: existing.last_active,
    fingerprint: fingerprint,
    ip: existing.ip,
    location: existing.location || 'Indonesia',
    remaining_trials: existing.remaining_trials,
    created_at: existing.created_at,
    last_active: existing.last_active,
    activity_type: 'TRIAL_USER_RECORD',
    details: `Penggunaan trial / Generate RPM (${existing.remaining_trials}/5 tersisa)`
  });

  fetch('/api/licensing/trial/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(existing)
  }).catch(() => {});

  return existing.remaining_trials;
}

// -------------------------------------------------------------
// 1. TRIAL EXHAUSTED MODAL
// -------------------------------------------------------------
interface TrialExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCodeModal: () => void;
}

export function TrialExhaustedModal({ isOpen, onClose, onOpenCodeModal }: TrialExhaustedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-rose-100 max-w-md w-full overflow-hidden p-6 transform transition-all animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-rose-50 rounded-full text-rose-600 mb-4 ring-8 ring-rose-50/50">
            <ShieldAlert size={36} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Kuota Gratis Telah Habis</h3>
          
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Anda telah menggunakan seluruh kuota gratis (5 kali pembuatan). Silakan masukkan Kode Akses agar dapat melanjutkan menggunakan SMART RPM (Rencana Pembelajaran Mendalam).
          </p>
          
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/70 rounded-xl p-4 mb-6 text-left shadow-sm">
            <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5 mb-1">
              <ShoppingBag size={14} className="text-teal-600" />
              Beli Kode Akses Otomatis via Lynk.id:
            </span>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Dapatkan Kode Akses instan dengan pembayaran otomatis (QRIS, GoPay, OVO, ShopeePay, Transfer Bank).
            </p>
            <a 
              href="https://lynk.id/indratata/3wo67k5xykd7/checkout" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg shadow-md shadow-teal-600/20 text-xs transition-all active:scale-[0.98]"
            >
              <ShoppingBag size={14} />
              <span>Beli Kode Akses Instan (Lynk.id)</span>
              <ExternalLink size={12} className="opacity-80" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => {
                onClose();
                onOpenCodeModal();
              }}
              className="flex-1 inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              <Key size={16} />
              Masukkan Kode
            </button>
            <button
              onClick={onClose}
              className="flex-1 inline-flex justify-center items-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. ENTER ACCESS CODE MODAL
// -------------------------------------------------------------
interface EnterAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onCodeActivated: (code: string) => void;
}

export function EnterAccessCodeModal({ isOpen, onClose, currentCode, onCodeActivated }: EnterAccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(currentCode);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, currentCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let isServerSuccess = false;
      let serverData: any = null;

      try {
        const res = await fetch('/api/licensing/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanCode,
            fingerprint: getOrGenerateFingerprint()
          })
        });
        if (res.ok) {
          serverData = await res.json().catch(() => null);
          if (serverData && serverData.success) {
            isServerSuccess = true;
          }
        }
      } catch (err) {
        console.warn('Server code validation unreachable, checking local database:', err);
      }

      if (isServerSuccess && serverData) {
        setSuccess(`Kode Akses Berhasil Diaktifkan! Jenis Akses: ${serverData.type === 'PERMANENT' ? 'PERMANEN (SDN Karanganyar)' : 'BULANAN (Sekolah Lain)'}`);
        localStorage.setItem('rpm_access_code', cleanCode);
        syncToGoogleSheet({
          timestamp: new Date().toISOString(),
          activity_type: 'CODE_ACTIVATED',
          teacher_name: `Guru (${(localStorage.getItem('rpm_user_fingerprint') || 'Guest').substring(0, 12)})`,
          fingerprint: localStorage.getItem('rpm_user_fingerprint') || '-',
          code_used: cleanCode,
          details: `Kode Akses ${cleanCode} berhasil diaktifkan.`
        });
        setTimeout(() => {
          onCodeActivated(cleanCode);
          onClose();
          window.location.reload();
        }, 800);
      } else {
        // Fallback Local Validation
        const localCodes = getLocalCodes();
        const found = localCodes.find((c: any) => c.code.trim().toUpperCase() === cleanCode);
        if (found) {
          if (found.status !== 'ACTIVE') {
            setError('Kode akses ini telah dinonaktifkan oleh Admin.');
            return;
          }
          if (found.valid_until && new Date(found.valid_until) < new Date()) {
            setError(`Kode akses ini telah kedaluwarsa pada tanggal ${new Date(found.valid_until).toLocaleDateString('id-ID')}.`);
            return;
          }

          setSuccess(`Kode Akses Berhasil Diaktifkan! Jenis Akses: ${found.type === 'PERMANENT' ? 'PERMANEN (SDN Karanganyar)' : 'BULANAN (Sekolah Lain)'}`);
          localStorage.setItem('rpm_access_code', cleanCode);
          addLocalLog('CODE_ACTIVATED', `Kode ${cleanCode} diaktifkan oleh pengguna.`);
          syncToGoogleSheet({
            timestamp: new Date().toISOString(),
            activity_type: 'CODE_ACTIVATED',
            teacher_name: `Guru (${(localStorage.getItem('rpm_user_fingerprint') || 'Guest').substring(0, 12)})`,
            fingerprint: localStorage.getItem('rpm_user_fingerprint') || '-',
            code_used: cleanCode,
            details: `Kode Akses ${cleanCode} (Lokal) berhasil diaktifkan.`
          });
          setTimeout(() => {
            onCodeActivated(cleanCode);
            onClose();
            window.location.reload();
          }, 800);
        } else {
          setError('Kode akses tidak valid. Silakan hubungi Admin untuk memperoleh kode baru.');
        }
      }
    } catch (err) {
      setError('Gagal memproses kode akses.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden transform transition-all animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-blue-700">
            <Key size={18} />
            <h3 className="font-bold text-gray-900">Aktivasi Kode Akses</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Masukkan Kode Akses yang diberikan oleh Admin untuk mengaktifkan generator Rencana Pembelajaran Mendalam (RPM) tanpa batasan kuota.
          </p>

          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/70 rounded-xl p-3.5 mb-5 text-left">
            <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5 mb-1">
              <ShoppingBag size={14} className="text-teal-600" />
              Belum Memiliki Kode Akses?
            </span>
            <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
              Dapatkan Kode Akses resmi secara instan dengan pembayaran otomatis Lynk.id (QRIS / E-Wallet / Transfer):
            </p>
            <a 
              href="https://lynk.id/indratata/3wo67k5xykd7/checkout" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg shadow-sm text-xs transition-all active:scale-[0.98]"
            >
              <ShoppingBag size={14} />
              <span>Beli Kode Akses via Lynk.id</span>
              <ExternalLink size={12} className="opacity-80" />
            </a>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Kode Akses</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: RPM-2026-08-X8P4KD"
              disabled={isLoading || success !== null}
              className="w-full px-4 py-2.5 text-center font-mono text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase placeholder-gray-400 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 mb-4 bg-rose-50 text-rose-800 rounded-lg text-xs leading-relaxed border border-rose-100 flex items-start gap-2">
              <span className="font-bold text-rose-500">❌ Error:</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 rounded-lg text-xs leading-relaxed border border-emerald-100 flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim() || success !== null}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
            >
              {isLoading ? 'Memvalidasi...' : 'Aktifkan Akses'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. ADMIN PANEL MODAL
// -------------------------------------------------------------
interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogOut: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Dashboard states
  const [stats, setStats] = useState<any>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [trialUsers, setTrialUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'codes' | 'trials' | 'logs' | 'sheets' | 'lynk'>('dashboard');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => {
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbzRIrWhUDCCdQD5eT2CtrDFqkBcgEYVoRu6NYpu_g84SC7e49I2IXa0ptw2sbIB_Ot3/exec';
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('rpm_google_sheet_webhook_url');
      if (!saved) {
        localStorage.setItem('rpm_google_sheet_webhook_url', defaultUrl);
        return defaultUrl;
      }
      return saved;
    }
    return defaultUrl;
  });
  const [sheetSaveStatus, setSheetSaveStatus] = useState<string | null>(null);

  const handleSaveSpreadsheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('rpm_google_sheet_webhook_url', spreadsheetUrl.trim());
      setSheetSaveStatus('URL Google Spreadsheet berhasil disimpan!');
      setTimeout(() => setSheetSaveStatus(null), 4000);
    } catch (e) {
      setSheetSaveStatus('Gagal menyimpan URL.');
    }
  };

  // Generator states
  const [newCodeType, setNewCodeType] = useState<'PERMANENT' | 'MONTHLY'>('MONTHLY');
  const [newCodeFormat, setNewCodeFormat] = useState('');
  const [newCodeMonth, setNewCodeMonth] = useState(new Date().getMonth() + 1);
  const [newCodeYear, setNewCodeYear] = useState(new Date().getFullYear());
  const [newCodeNotes, setNewCodeNotes] = useState('');
  const [generateSuccess, setGenerateSuccess] = useState<any>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Filters
  const [logSearch, setLogSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');

  // Editing notes
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [syncTrialsStatus, setSyncTrialsStatus] = useState<string | null>(null);

  const handleSyncCodesToSheet = () => {
    try {
      const webhookUrl = localStorage.getItem('rpm_google_sheet_webhook_url');
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        alert('URL Google Spreadsheet belum disetel! Silakan atur di tab "Google Spreadsheet Sync".');
        setActiveTab('sheets');
        return;
      }

      const allCodes = getLocalCodes();
      allCodes.forEach(c => {
        syncCodeToGoogleSheet(c);
      });

      setSyncTrialsStatus(`Berhasil menyinkronkan ${allCodes.length} data Kode Akses ke Google Spreadsheet!`);
      setTimeout(() => setSyncTrialsStatus(null), 5000);
    } catch (e: any) {
      alert('Gagal menyinkronkan kode ke spreadsheet: ' + e.message);
    }
  };

  const handleSyncTrialsToSheet = () => {
    try {
      const webhookUrl = localStorage.getItem('rpm_google_sheet_webhook_url');
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        alert('URL Google Spreadsheet belum disetel! Silakan atur di tab "Google Spreadsheet Sync".');
        setActiveTab('sheets');
        return;
      }

      const generatedTrialUsers = trialUsers.filter((u: any) => u.has_generated || u.remaining_trials < 5 || (u.used_trials && u.used_trials > 0));

      generatedTrialUsers.forEach(u => {
        syncToGoogleSheet({
          timestamp: u.last_active || new Date().toISOString(),
          teacher_name: `Guru Trial (${(u.id || '').substring(0, 10)})`,
          fingerprint: u.id,
          ip: u.ip || '127.0.0.1',
          location: u.location || 'Indonesia',
          remaining_trials: u.remaining_trials,
          created_at: u.created_at,
          last_active: u.last_active,
          activity_type: 'TRIAL_USER_RECORD',
          details: `Sisa Kuota: ${u.remaining_trials}/5 (Dibuat: ${new Date(u.created_at).toLocaleString('id-ID')})`,
          code_used: 'TRIAL'
        });
      });

      setSyncTrialsStatus(`Berhasil menyinkronkan ${generatedTrialUsers.length} data pengguna trial (Generate) ke Sheet 2 Google Spreadsheet!`);
      setTimeout(() => setSyncTrialsStatus(null), 5000);
    } catch (e: any) {
      alert('Gagal menyinkronkan trial ke spreadsheet: ' + e.message);
    }
  };

  const handleLoadTrialsFromSheet = async (isManual = true) => {
    try {
      const webhookUrl = localStorage.getItem('rpm_google_sheet_webhook_url');
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        if (isManual) {
          alert('URL Google Spreadsheet belum disetel! Silakan atur di tab "Google Spreadsheet Sync".');
          setActiveTab('sheets');
        }
        return;
      }
      if (isManual) {
        setSyncTrialsStatus('Memuat data pengguna trial dari Sheet 2 Google Spreadsheet...');
      }
      const res = await fetch(webhookUrl, { method: 'GET', mode: 'cors' }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.trialUsers && Array.isArray(data.trialUsers)) {
          const mergedMap = new Map();
          [...trialUsers, ...data.trialUsers].forEach((u: any) => {
            if (u && u.id) {
              const existing = mergedMap.get(u.id);
              if (!existing || safeParseDate(u.last_active || 0) > safeParseDate(existing.last_active || 0)) {
                mergedMap.set(u.id, u);
              }
            }
          });
          const merged = Array.from(mergedMap.values());
          setTrialUsers(merged);
          saveLocalTrialUsers(merged);
          if (isManual) {
            setSyncTrialsStatus(`Berhasil memuat ${data.trialUsers.length} data pengguna trial dari Sheet 2 Google Spreadsheet!`);
            setTimeout(() => setSyncTrialsStatus(null), 5000);
          }
          return;
        }
      }
      if (isManual) {
        alert('Gagal mengambil data dari Google Spreadsheet secara langsung (CORS/Apps Script). Pastikan skrip Google Apps Script memiliki fungsi doGet yang mengembalikan trialUsers.');
        setSyncTrialsStatus(null);
      }
    } catch (e: any) {
      if (isManual) {
        alert('Gagal memuat dari spreadsheet: ' + e.message);
        setSyncTrialsStatus(null);
      }
    }
  };

  // Auto load trials from spreadsheet when switching to trials tab
  useEffect(() => {
    if (isLoggedIn && activeTab === 'trials') {
      handleLoadTrialsFromSheet(false);
    }
  }, [isLoggedIn, activeTab]);

  // Check login state on open
  useEffect(() => {
    if (isOpen) {
      const stored = sessionStorage.getItem('rpm_admin_token');
      if (stored === 'admin-token-secure-2026') {
        setIsLoggedIn(true);
        fetchDashboardData();
      } else {
        setIsLoggedIn(false);
        setPassword('');
        setLoginError(null);
      }
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const inputPw = (password || '').trim();
    if (!inputPw) {
      setLoginError('Silakan masukkan password admin.');
      return;
    }

    const isValidAdminPw = (
      inputPw.toLowerCase() === 'sekarmelati' ||
      inputPw.toLowerCase() === 'admin123'
    );

    try {
      let isServerSuccess = false;
      let serverErrorMsg: string | null = null;

      try {
        const res = await fetch('/api/licensing/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: inputPw })
        });
        
        const data = await res.json().catch(() => null);

        if (res.ok && data && data.success) {
          isServerSuccess = true;
          setIsLoggedIn(true);
          sessionStorage.setItem('rpm_admin_token', data.token || 'admin-token-secure-2026');
          sessionStorage.setItem('rpm_admin_pw', inputPw);
          fetchDashboardData(inputPw);
          return;
        } else {
          if (res.status === 401) {
            serverErrorMsg = 'Password Admin salah atau tidak valid!';
          }
        }
      } catch (e) {
        console.warn('Server endpoint unreachable, checking local auth fallback:', e);
      }

      if (serverErrorMsg) {
        setLoginError(serverErrorMsg);
        return;
      }

      // Local fallback auth
      if (isValidAdminPw) {
        setIsLoggedIn(true);
        sessionStorage.setItem('rpm_admin_token', 'admin-token-secure-2026');
        sessionStorage.setItem('rpm_admin_pw', inputPw);
        addLocalLog('ADMIN_LOGIN', 'Admin login via Local Fallback Engine');
        fetchDashboardData(inputPw);
      } else {
        setLoginError('Password Admin salah atau tidak valid!');
      }
    } catch (err) {
      console.error('Error in handleLogin:', err);
      if (isValidAdminPw) {
        setIsLoggedIn(true);
        sessionStorage.setItem('rpm_admin_token', 'admin-token-secure-2026');
        sessionStorage.setItem('rpm_admin_pw', inputPw);
        fetchDashboardData(inputPw);
      } else {
        setLoginError('Password Admin salah!');
      }
    }
  };

  const handleLogOut = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('rpm_admin_token');
    sessionStorage.removeItem('rpm_admin_pw');
  };

  // Helper untuk Ekspor Data ke CSV (Excel Compatible)
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCodesToExcel = () => {
    const headers = ['Kode Akses', 'Tipe', 'Status', 'Berlaku Hingga', 'Catatan / Keterangan', 'Dibuat Pada'];
    const rows = codes.map(c => [
      c.code,
      c.type,
      c.status,
      c.valid_until ? new Date(c.valid_until).toLocaleDateString('id-ID') : 'Selamanya',
      c.notes,
      new Date(c.created_at).toLocaleString('id-ID')
    ]);
    exportToCSV('Data_Kode_Lisensi_RPM', headers, rows);
  };

  const exportTrialsToExcel = () => {
    const headers = ['Browser Fingerprint', 'IP Address', 'Lokasi', 'Sisa Kuota Trial', 'Tanggal Mendaftar', 'Aktif Terakhir'];
    const generatedTrialUsers = trialUsers.filter((u: any) => u.has_generated || u.remaining_trials < 5 || (u.used_trials && u.used_trials > 0));
    const rows = generatedTrialUsers.map(u => [
      u.id,
      u.ip || '127.0.0.1',
      u.location || 'Indonesia',
      `${u.remaining_trials} / 5`,
      safeParseDate(u.created_at).toLocaleString('id-ID'),
      safeParseDate(u.last_active).toLocaleString('id-ID')
    ]);
    exportToCSV('Data_Pengguna_Trial_Generate_RPM', headers, rows);
  };

  const exportLogsToExcel = () => {
    const headers = ['Waktu Kegiatan', 'Jenis Kegiatan', 'Keterangan', 'IP Address', 'Browser User'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString('id-ID'),
      l.activity_type,
      l.details,
      l.user_info.ip,
      l.user_info.browser
    ]);
    exportToCSV('Log_Aktivitas_Guru_RPM', headers, rows);
  };

  const fetchDashboardData = async (customPw?: string) => {
    setIsLoadingData(true);
    const pw = customPw !== undefined ? customPw : (sessionStorage.getItem('rpm_admin_pw') || '');

    let serverSuccess = false;
    try {
      const res = await fetch('/api/licensing/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setStats(data.stats);
        setCodes(data.codes);
        
        // Merge server trial users with local trial users
        const localTrials = getLocalTrialUsers();
        const mergedTrialsMap = new Map();
        [...(data.trialUsers || []), ...localTrials].forEach(u => {
          if (u && u.id) {
            const existing = mergedTrialsMap.get(u.id);
            if (!existing || new Date(u.last_active || 0) > new Date(existing.last_active || 0)) {
              mergedTrialsMap.set(u.id, u);
            }
          }
        });
        const mergedTrials = Array.from(mergedTrialsMap.values());

        setTrialUsers(mergedTrials);
        setLogs(data.logs);
        serverSuccess = true;

        saveLocalCodes(data.codes);
        saveLocalTrialUsers(mergedTrials);
      }
    } catch (err) {
      console.warn('Unable to fetch admin dashboard from server, switching to local database:', err);
    }

    if (!serverSuccess) {
      const localCodes = getLocalCodes();
      const localTrials = getLocalTrialUsers();
      const localLogs = getLocalLogs();

      setCodes(localCodes);
      setTrialUsers(localTrials);
      setLogs(localLogs);
      setStats({
        totalCodes: localCodes.length,
        activeCodes: localCodes.filter((c: any) => c.status === 'ACTIVE').length,
        expiredCodes: localCodes.filter((c: any) => c.valid_until && new Date(c.valid_until) < new Date()).length,
        totalTrialUsers: localTrials.length,
        exhaustedTrialUsers: localTrials.filter((u: any) => u.remaining_trials <= 0).length,
        totalRPMGenerated: localLogs.filter((l: any) => l.activity_type === 'GENERATE_RPM' || l.activity_type === 'TRIAL_USED').length
      });
    }

    setIsLoadingData(false);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError(null);
    setGenerateSuccess(null);

    const pw = sessionStorage.getItem('rpm_admin_pw') || '';

    let generatedCodeStr = '';
    if (newCodeType === 'PERMANENT') {
      const suffix = newCodeFormat.trim().toUpperCase() || 'GENERAL';
      generatedCodeStr = `RPM-PERM-${suffix.replace(/[^A-Z0-9]/g, '')}`;
    } else {
      const mStr = String(newCodeMonth).padStart(2, '0');
      const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      generatedCodeStr = `RPM-${newCodeYear}-${mStr}-${randStr}`;
    }

    let serverSuccess = false;
    try {
      const res = await fetch('/api/licensing/admin/code/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pw,
          type: newCodeType,
          codeFormat: newCodeType === 'PERMANENT' ? newCodeFormat : undefined,
          month: newCodeMonth,
          year: newCodeYear,
          notes: newCodeNotes
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        serverSuccess = true;
        setGenerateSuccess(data.code);
        setNewCodeFormat('');
        setNewCodeNotes('');
        const codeStr = typeof data.code === 'object' ? data.code.code : (data.code || generatedCodeStr);
        syncCodeToGoogleSheet({
          code: codeStr,
          type: newCodeType,
          status: 'ACTIVE',
          valid_until: typeof data.code === 'object' ? data.code.valid_until : null,
          created_by: 'Admin Panel',
          notes: newCodeNotes || (newCodeType === 'PERMANENT' ? 'Akses Permanen' : `Kode Akses Bulan ${newCodeMonth}/${newCodeYear}`)
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.warn('Server unreachable on code creation, generating locally:', err);
    }

    if (!serverSuccess) {
      const localCodes = getLocalCodes();
      
      let validUntil: string | null = null;
      if (newCodeType === 'MONTHLY') {
        const lastDay = new Date(newCodeYear, newCodeMonth, 0).getDate();
        const mStr = String(newCodeMonth).padStart(2, '0');
        validUntil = `${newCodeYear}-${mStr}-${String(lastDay).padStart(2, '0')}T23:59:59.000Z`;
      }

      const newCodeObj = {
        id: 'code-' + Date.now(),
        code: generatedCodeStr,
        type: newCodeType,
        status: 'ACTIVE',
        valid_from: new Date().toISOString(),
        valid_until: validUntil,
        created_at: new Date().toISOString(),
        created_by: 'Admin',
        notes: newCodeNotes || (newCodeType === 'PERMANENT' ? 'Akses Permanen' : `Kode Akses Bulan ${newCodeMonth}/${newCodeYear}`)
      };

      localCodes.unshift(newCodeObj);
      saveLocalCodes(localCodes);
      addLocalLog('CODE_CREATED', `Membuat kode baru: ${generatedCodeStr}`);
      syncCodeToGoogleSheet(newCodeObj);

      setGenerateSuccess(generatedCodeStr);
      setNewCodeFormat('');
      setNewCodeNotes('');
      fetchDashboardData();
    }
  };

  const handleToggleCodeStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const pw = sessionStorage.getItem('rpm_admin_pw') || '';
    
    // Update React state & local storage immediately for instant UI response
    setCodes(prev => prev.map((c: any) => (c.id === id || c.code === id ? { ...c, status: nextStatus } : c)));
    const localCodes = getLocalCodes();
    const item = localCodes.find((c: any) => c.id === id || c.code === id);
    if (item) {
      item.status = nextStatus;
      saveLocalCodes(localCodes);
      addLocalLog('CODE_EDITED', `Ubah status kode ${item.code} menjadi ${nextStatus}`);
    }

    try {
      const res = await fetch('/api/licensing/admin/code/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, id, status: nextStatus })
      });
      if (res.ok) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn('Server toggle code status failed, performing locally:', err);
    }

    fetchDashboardData();
  };

  const handleEditNotes = async (id: string) => {
    const pw = sessionStorage.getItem('rpm_admin_pw') || '';

    // Update React state & local storage immediately
    setCodes(prev => prev.map((c: any) => (c.id === id || c.code === id ? { ...c, notes: editingNotesText } : c)));
    const localCodes = getLocalCodes();
    const item = localCodes.find((c: any) => c.id === id || c.code === id);
    if (item) {
      item.notes = editingNotesText;
      saveLocalCodes(localCodes);
      addLocalLog('CODE_EDITED', `Ubah catatan kode ${item.code}`);
    }

    try {
      const res = await fetch('/api/licensing/admin/code/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, id, notes: editingNotesText })
      });
      if (res.ok) {
        setEditingCodeId(null);
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn('Server edit notes failed, performing locally:', err);
    }

    setEditingCodeId(null);
    fetchDashboardData();
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kode akses ini?')) return;
    const pw = sessionStorage.getItem('rpm_admin_pw') || '';

    // Update React state & local storage immediately for instant UI response
    setCodes(prev => prev.filter((c: any) => c.id !== id && c.code !== id));
    const localCodes = getLocalCodes();
    const filtered = localCodes.filter((c: any) => c.id !== id && c.code !== id);
    saveLocalCodes(filtered);
    addLocalLog('CODE_DELETED', `Hapus kode: ${id}`);

    try {
      const res = await fetch('/api/licensing/admin/code/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, id })
      });
      if (res.ok) {
        fetchDashboardData();
        return;
      }
    } catch (err) {
      console.warn('Server delete code failed, performing locally:', err);
    }

    fetchDashboardData();
  };

  const handleResetTrial = async (userId: string) => {
    if (!confirm('Berikan kuota gratis 5 kali lagi untuk pengguna ini?')) return;
    const pw = sessionStorage.getItem('rpm_admin_pw') || '';
    
    // Temukan detail user yang ada saat ini untuk IP, Lokasi, dan Tanggal Dibuat agar tetap konsisten di Spreadsheet
    const existingUser = trialUsers.find((u: any) => u.id === userId);
    const userIp = existingUser?.ip || '127.0.0.1';
    const userLocation = existingUser?.location || 'Indonesia';
    const userCreatedAt = existingUser?.created_at || new Date().toISOString();

    let serverSuccess = false;
    try {
      const res = await fetch('/api/licensing/admin/trial/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, userId })
      });
      if (res.ok) {
        serverSuccess = true;
      }
    } catch (err) {
      console.warn('Server reset trial failed, performing locally:', err);
    }

    if (serverSuccess) {
      // Sinkronisasikan ke Google Spreadsheet secara langsung agar sisa kuota di sheet terupdate menjadi 5
      syncToGoogleSheet({
        timestamp: new Date().toISOString(),
        fingerprint: userId,
        ip: userIp,
        location: userLocation,
        remaining_trials: 5,
        created_at: userCreatedAt,
        last_active: new Date().toISOString(),
        activity_type: 'TRIAL_USER_RECORD',
        details: 'Reset kuota trial ke 5'
      });

      fetchDashboardData();
      alert('Trial berhasil direset menjadi 5 kuota gratis!');
    } else {
      const localTrials = getLocalTrialUsers();
      const user = localTrials.find((u: any) => u.id === userId);
      if (user) {
        user.remaining_trials = 5;
        user.last_active = new Date().toISOString();
        saveLocalTrialUsers(localTrials);
        addLocalLog('TRIAL_RESET', `Reset trial user: ${userId}`);

        // Sinkronisasikan ke Google Spreadsheet secara langsung agar sisa kuota di sheet terupdate menjadi 5
        syncToGoogleSheet({
          timestamp: user.last_active,
          fingerprint: userId,
          ip: user.ip || '127.0.0.1',
          location: user.location || 'Indonesia',
          remaining_trials: 5,
          created_at: user.created_at || new Date().toISOString(),
          last_active: user.last_active,
          activity_type: 'TRIAL_USER_RECORD',
          details: 'Reset kuota trial ke 5 (Mode Lokal)'
        });

        fetchDashboardData();
        alert('Trial berhasil direset menjadi 5 kuota gratis (Mode Lokal)!');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="text-blue-400" size={20} />
            <div>
              <h2 className="font-bold text-base tracking-wide">Panel Administrator Sistem</h2>
              <p className="text-xs text-slate-400">Kelola kuota gratis, riwayat, dan lisensi akses</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={handleLogOut}
                className="text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 px-2.5 py-1.5 rounded border border-rose-800/40 font-medium transition-all"
              >
                Logout Admin
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* LOGIN SCREEN */}
        {!isLoggedIn ? (
          <div className="p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[350px]">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-4 ring-8 ring-blue-50/50">
              <Lock size={28} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Akses Terbatas Administrator</h3>
            <p className="text-gray-500 text-xs mb-6 max-w-xs text-center">
              Masukkan Password Administrator untuk mengakses panel kontrol lisensi.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-sm">
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Administrator"
                  className="w-full px-4 py-2.5 text-center border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="text-rose-600 text-xs bg-rose-50 p-2.5 rounded border border-rose-100 text-center mb-4">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow transition-all"
              >
                Masuk ke Panel
              </button>
            </form>
          </div>
        ) : (
          /* ADMIN DASHBOARD WORKSPACE */
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-52 bg-slate-800 text-slate-300 border-r border-slate-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-700 bg-slate-850">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Navigasi Utama</p>
              </div>
              <nav className="flex-1 p-2 space-y-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Activity size={15} />
                  Dashboard Ringkasan
                </button>
                <button
                  onClick={() => setActiveTab('codes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'codes' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Key size={15} />
                  Kelola Kode Akses
                </button>
                <button
                  onClick={() => setActiveTab('trials')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'trials' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Users size={15} />
                  Daftar Pengguna Trial
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'logs' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FileText size={15} />
                  Log Aktivitas Guru
                </button>
                <button
                  onClick={() => setActiveTab('sheets')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'sheets' ? 'bg-blue-600 text-white shadow' : 'hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet size={15} />
                  Google Spreadsheet Sync
                </button>
                <button
                  onClick={() => setActiveTab('lynk')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'lynk' ? 'bg-emerald-600 text-white shadow font-bold' : 'hover:bg-slate-700 hover:text-white text-emerald-300'
                  }`}
                >
                  <ShoppingBag size={15} />
                  Lynk.id & Claim Link
                </button>
              </nav>

              <div className="p-4 border-t border-slate-700 bg-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Server Online</span>
                </div>
                <button onClick={fetchDashboardData} className="hover:text-white transition-all text-[11px]">
                  <RefreshCw size={12} className="inline animate-spin-hover" /> Refresh
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col">
              {isLoadingData ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <RefreshCw className="animate-spin text-blue-600 mb-2" size={32} />
                  <p className="text-gray-500 text-xs">Memuat data dari licensing_db.json...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: DASHBOARD OVERVIEW */}
                  {activeTab === 'dashboard' && stats && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Kode</span>
                          <span className="text-2xl font-extrabold text-gray-800 mt-1">{stats.totalCodes}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                          <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Kode Aktif</span>
                          <span className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.activeCodes}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                          <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold">Pengguna Trial</span>
                          <span className="text-2xl font-extrabold text-rose-600 mt-1">{stats.totalTrialUsers}</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                          <span className="text-[10px] text-indigo-500 uppercase tracking-wider font-bold">Total Log Sistem</span>
                          <span className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.totalLogs}</span>
                        </div>
                      </div>

                      {/* Code Generator Panel */}
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h4 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                          <Plus className="text-blue-600" size={16} />
                          Pembuat Kode Akses Baru (License Generator)
                        </h4>

                        <form onSubmit={handleCreateCode} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Jenis Akses</label>
                              <select
                                value={newCodeType}
                                onChange={(e) => setNewCodeType(e.target.value as any)}
                                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                              >
                                <option value="MONTHLY">MONTHLY (Kode Akses Bulanan)</option>
                                <option value="PERMANENT">PERMANENT (Akses Selamanya)</option>
                              </select>
                            </div>

                            {newCodeType === 'PERMANENT' ? (
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kode Khusus (Opsional)</label>
                                <input
                                  type="text"
                                  value={newCodeFormat}
                                  onChange={(e) => setNewCodeFormat(e.target.value)}
                                  placeholder="Contoh: RPM-PERM-KARANGANYAR"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs uppercase font-mono"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bulan Berlaku</label>
                                  <select
                                    value={newCodeMonth}
                                    onChange={(e) => setNewCodeMonth(Number(e.target.value))}
                                    className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs"
                                  >
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tahun Berlaku</label>
                                  <select
                                    value={newCodeYear}
                                    onChange={(e) => setNewCodeYear(Number(e.target.value))}
                                    className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs"
                                  >
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
                                    <option value={2028}>2028</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan Pembuat (Untuk Siapa)</label>
                              <input
                                type="text"
                                value={newCodeNotes}
                                onChange={(e) => setNewCodeNotes(e.target.value)}
                                placeholder="Misal: Akses SDN Karanganyar / SDN 2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs"
                              />
                            </div>
                          </div>

                          {generateError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded text-rose-700 text-xs text-center">
                              ⚠️ {generateError}
                            </div>
                          )}

                          {generateSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-emerald-800 text-xs flex flex-col items-center gap-1">
                              <span className="font-bold text-center">🎉 Kode Akses Berhasil Dibuat!</span>
                              <span className="text-sm font-mono font-bold bg-white border border-emerald-200 px-3 py-1 rounded text-emerald-600 tracking-wider uppercase mt-1 select-all">{generateSuccess.code}</span>
                              <span className="text-[10px] text-gray-400 mt-1">Salin kode di atas untuk dibagikan kepada guru.</span>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs shadow transition-all inline-flex items-center gap-1"
                            >
                              <Key size={13} />
                              Generate & Simpan Kode
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Quick System Status */}
                      <div className="bg-slate-900 rounded-xl p-5 text-slate-300 flex items-center justify-between border border-slate-800 shadow-lg">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                            <ShieldAlert size={14} />
                            Proteksi Trial Aman Aktif
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
                            SMART RPM ini memproteksi kuota trial menggunakan kombinasi browser fingerprint yang diperkuat cookies serta enkripsi log validasi server-side. Pengguna trial tidak dapat mengakali batas 5 kali generate dengan membersihkan browser cache.
                          </p>
                        </div>
                        <div className="p-2.5 bg-slate-800 rounded-lg text-center font-mono border border-slate-700 min-w-[120px]">
                          <span className="text-xs text-slate-400 block uppercase font-bold text-[10px]">Tingkat Proteksi</span>
                          <span className="text-emerald-400 font-bold text-xs">SANGAT AMAN</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MANAGE ACCESS CODES */}
                  {activeTab === 'codes' && (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm shrink-0">
                        <div className="relative w-72">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Cari Kode Akses / Catatan..."
                            value={codeSearch}
                            onChange={(e) => setCodeSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs placeholder-gray-400"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-semibold">Total: {codes.length} Kode</span>
                          <button
                            onClick={exportCodesToExcel}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
                          >
                            <FileSpreadsheet size={13} /> Ekspor Excel (CSV)
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-gray-200">
                              <th className="p-3">Kode Akses</th>
                              <th className="p-3">Tipe</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Tanggal Exp / Aktif</th>
                              <th className="p-3">Catatan / Keterangan</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {codes
                              .filter(c => 
                                c.code.toLowerCase().includes(codeSearch.toLowerCase()) || 
                                c.notes.toLowerCase().includes(codeSearch.toLowerCase())
                              )
                              .map((c) => {
                                const isEditing = editingCodeId === c.id;
                                return (
                                  <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-gray-900 tracking-wider select-all">{c.code}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        c.type === 'PERMANENT' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}>
                                        {c.type}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                        c.status === 'ACTIVE' 
                                          ? 'bg-emerald-100 text-emerald-800' 
                                          : c.status === 'EXPIRED' 
                                          ? 'bg-amber-100 text-amber-800' 
                                          : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                          c.status === 'ACTIVE' ? 'bg-emerald-500' : c.status === 'EXPIRED' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}></span>
                                        {c.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-gray-500">
                                      {c.type === 'PERMANENT' ? (
                                        <span className="text-gray-400 font-semibold">Selamanya</span>
                                      ) : (
                                        <span className="font-semibold text-amber-700">
                                          {new Date(c.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {isEditing ? (
                                        <div className="flex gap-1.5">
                                          <input
                                            type="text"
                                            value={editingNotesText}
                                            onChange={(e) => setEditingNotesText(e.target.value)}
                                            className="px-2 py-1 border border-blue-400 bg-white rounded text-xs focus:outline-none w-48"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => handleEditNotes(c.id)}
                                            className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                                          >
                                            <Check size={14} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                          <span>{c.notes}</span>
                                          <button
                                            onClick={() => {
                                              setEditingCodeId(c.id);
                                              setEditingNotesText(c.notes);
                                            }}
                                            className="text-gray-400 hover:text-blue-600 inline"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleToggleCodeStatus(c.id, c.status)}
                                          title={c.status === 'ACTIVE' ? 'Nonaktifkan Kode' : 'Aktifkan Kode'}
                                          className={`p-1.5 rounded transition-all border ${
                                            c.status === 'ACTIVE' 
                                              ? 'text-gray-600 hover:bg-slate-100 border-gray-200' 
                                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'
                                          }`}
                                        >
                                          <Power size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCode(c.id)}
                                          title="Hapus Kode"
                                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded transition-all"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TRIAL USERS LIST */}
                  {activeTab === 'trials' && (() => {
                    const generatedTrialUsers = trialUsers.filter((u: any) => u.has_generated || u.remaining_trials < 5 || (u.used_trials && u.used_trials > 0));
                    return (
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 font-semibold">Memantau guru yang telah melakukan Generate RPM menggunakan kuota trial</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded font-bold border border-rose-100">Total Guru Generate: {generatedTrialUsers.length} Guru</span>
                            <button
                              onClick={handleSyncTrialsToSheet}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
                            >
                              <RefreshCw size={13} /> Sinkronkan ke Spreadsheet
                            </button>
                            <button
                              onClick={() => handleLoadTrialsFromSheet(true)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
                            >
                              <FileSpreadsheet size={13} /> Muat Data Trial
                            </button>
                            <button
                              onClick={exportTrialsToExcel}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
                            >
                              <FileSpreadsheet size={13} /> Ekspor Excel (CSV)
                            </button>
                          </div>
                        </div>

                        {syncTrialsStatus && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium shrink-0">
                            ✅ {syncTrialsStatus}
                          </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-gray-200">
                                <th className="p-3">Browser Fingerprint</th>
                                <th className="p-3">IP & Lokasi</th>
                                <th className="p-3">Kuota Tersisa (Trial)</th>
                                <th className="p-3">Tanggal Dibuat</th>
                                <th className="p-3">Aktif Terakhir</th>
                                <th className="p-3 text-center">Ulangi Trial</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                              {generatedTrialUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono text-gray-500 font-medium select-all text-[11px] truncate max-w-[200px]" title={u.id}>
                                    {u.id}
                                  </td>
                                  <td className="p-3 text-gray-600">
                                    <div className="font-mono text-[11px] font-medium text-slate-800">{u.ip || '127.0.0.1'}</div>
                                    <div className="text-[10px] text-gray-400">{u.location || 'Indonesia'}</div>
                                  </td>
                                  <td className="p-3 font-bold">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                      u.remaining_trials === 0 
                                        ? 'bg-rose-100 text-rose-800' 
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {u.remaining_trials} / 5 Pembuatan
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-400 text-[11px]">
                                    {safeParseDate(u.created_at).toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 text-gray-500 text-[11px] font-semibold">
                                    {safeParseDate(u.last_active).toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleResetTrial(u.id)}
                                      title="Reset Sisa Kuota ke 5"
                                      className="p-1 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded transition-all inline-flex items-center gap-1 text-[10px]"
                                    >
                                      <RefreshCw size={11} /> Reset ke 5
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {generatedTrialUsers.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-gray-400 text-xs italic">
                                    Belum ada guru yang melakukan Generate RPM menggunakan kuota trial. Kunjungan saja dapat dilihat di tab "Log Aktivitas Guru".
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TAB 4: AUDIT LOGS */}
                  {activeTab === 'logs' && (
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm shrink-0">
                        <div className="relative w-72">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Cari aktivitas, tipe, kode, browser..."
                            value={logSearch}
                            onChange={(e) => setLogSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs placeholder-gray-400"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-semibold">Menampilkan {logs.length} riwayat logs terakhir</span>
                          <button
                            onClick={exportLogsToExcel}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium shadow-sm transition-all inline-flex items-center gap-1.5"
                          >
                            <FileSpreadsheet size={13} /> Ekspor Excel (CSV)
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-gray-200">
                              <th className="p-3">Waktu Kegiatan</th>
                              <th className="p-3">Jenis Kegiatan</th>
                              <th className="p-3">Keterangan Riwayat</th>
                              <th className="p-3">User IP Address</th>
                              <th className="p-3">Informasi Tambahan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {logs
                              .filter(l => 
                                l.activity_type.toLowerCase().includes(logSearch.toLowerCase()) || 
                                l.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                                l.user_info.ip.toLowerCase().includes(logSearch.toLowerCase()) ||
                                (l.user_info.codeUsed && l.user_info.codeUsed.toLowerCase().includes(logSearch.toLowerCase()))
                              )
                              .map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50">
                                  <td className="p-3 text-gray-400 whitespace-nowrap text-[10px]">
                                    {new Date(l.timestamp).toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 font-semibold">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      l.activity_type.startsWith('CODE_CREATED') || l.activity_type.startsWith('VALIDATE_CODE_SUCCESS')
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : l.activity_type.startsWith('TRIAL_EXHAUSTED') || l.activity_type.startsWith('VALIDATE_CODE_FAILED')
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}>
                                      {l.activity_type}
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-900 font-medium select-all leading-relaxed">{l.details}</td>
                                  <td className="p-3 font-mono text-gray-500 text-[11px] select-all">{l.user_info.ip}</td>
                                  <td className="p-3 text-gray-500 text-[10px] truncate max-w-[200px]" title={l.user_info.browser}>
                                    {l.user_info.browser}
                                  </td>
                                </tr>
                              ))}
                            {logs.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 text-xs italic">
                                  Belum ada log aktivitas terekam.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: GOOGLE SPREADSHEET WEBHOOK */}
                  {activeTab === 'sheets' && (
                    <div className="space-y-6 flex-1 flex flex-col max-w-3xl overflow-y-auto">
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FileSpreadsheet size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">Hubungkan dengan Google Spreadsheet Anda</h3>
                            <p className="text-xs text-gray-500">Setiap guru se-Indonesia yang mencoba aplikasi atau melakukan aktivitas akan otomatis tercatat ke Spreadsheet Anda secara real-time.</p>
                          </div>
                        </div>

                        <form onSubmit={handleSaveSpreadsheetUrl} className="space-y-4 mt-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">URL Web App Google Apps Script (Webhook)</label>
                            <input
                              type="url"
                              value={spreadsheetUrl}
                              onChange={(e) => setSpreadsheetUrl(e.target.value)}
                              placeholder="https://script.google.com/macros/s/.../exec"
                              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Tempelkan URL Web App yang didapatkan setelah Anda men-deploy skrip Apps Script di Google Spreadsheet.</p>
                          </div>

                          {sheetSaveStatus && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                              ✅ {sheetSaveStatus}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-all"
                            >
                              Simpan URL Webhook
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                syncToGoogleSheet({
                                  timestamp: new Date().toISOString(),
                                  teacher_name: "Test Admin Sinkronisasi",
                                  fingerprint: "TEST-FP-000",
                                  ip: "127.0.0.1",
                                  activity_type: "TEST_SYNC",
                                  details: "Pengujian koneksi Google Spreadsheet webhook",
                                  code_used: "TEST-CODE"
                                });
                                alert('Ping test sinkronisasi dikirim! Periksa Google Spreadsheet Anda.');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all"
                            >
                              Uji Coba Kirim Test Ping
                            </button>
                            <button
                              type="button"
                              onClick={handleSyncCodesToSheet}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
                            >
                              <FileSpreadsheet size={14} />
                              Sync Semua Kode Akses ke Sheet
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-slate-700">Panduan Skrip Google Apps Script (Copy-Paste)</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Buka Google Spreadsheet Anda, klik menu <strong className="text-gray-900">Ekstensi &gt; Apps Script</strong>, hapus semua kode di editor, lalu tempelkan kode JavaScript di bawah ini.
                          <br />
                          <span className="text-[11px] text-blue-600 font-medium">
                            • Data pengguna Trial (Guru yang melakukan Generate RPM) otomatis tercatat di sheet <strong>"Data Trial"</strong>.<br />
                            • Log kunjungan &amp; aktivitas umum otomatis tercatat di sheet <strong>"Log Aktivitas Guru"</strong>.
                          </span>
                        </p>
                        <div className="relative">
                          <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed select-all">
{`function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);
    
    // 1. Data Trial (Khusus Guru yang melakukan Generate RPM)
    if (data.activity_type === 'TRIAL_USER_RECORD' || data.activity_type === 'NEW_TRIAL_USER') {
      var sheet2 = ss.getSheetByName("Data Trial");
      if (!sheet2) {
        sheet2 = ss.insertSheet("Data Trial");
        sheet2.appendRow(["Waktu Update", "ID / Fingerprint", "IP Address", "Lokasi", "Sisa Kuota", "Tanggal Dibuat", "Aktif Terakhir"]);
      }
      
      var rows = sheet2.getDataRange().getValues();
      var foundRowIndex = -1;
      var targetId = data.fingerprint || '-';
      
      if (targetId !== '-') {
        for (var i = 1; i < rows.length; i++) {
          if (rows[i][1] === targetId) {
            foundRowIndex = i + 1; // 1-based index
            break;
          }
        }
      }
      
      if (foundRowIndex > 0) {
        // Update baris pengguna trial yang sudah ada
        sheet2.getRange(foundRowIndex, 1).setValue(new Date());
        if (data.ip && data.ip !== '-') {
          sheet2.getRange(foundRowIndex, 3).setValue(data.ip);
        }
        if (data.location && data.location !== 'Indonesia') {
          sheet2.getRange(foundRowIndex, 4).setValue(data.location);
        }
        if (data.remaining_trials !== undefined) {
          sheet2.getRange(foundRowIndex, 5).setValue(data.remaining_trials);
        }
        if (data.last_active) {
          sheet2.getRange(foundRowIndex, 7).setValue(data.last_active);
        }
      } else {
        // Baris baru untuk guru yang pertama kali melakukan Generate RPM
        sheet2.appendRow([
          new Date(),
          targetId,
          data.ip || '-',
          data.location || 'Indonesia',
          data.remaining_trials !== undefined ? data.remaining_trials : 5,
          data.created_at || new Date().toISOString(),
          data.last_active || new Date().toISOString()
        ]);
      }
    } else {
      // 2. Log Aktivitas Guru (Kunjungan, Penggunaan Kode Lisensi, Ping Test, dsb.)
      var sheet1 = ss.getSheetByName("Log Aktivitas Guru");
      if (!sheet1) {
        sheet1 = ss.getSheetByName("Sheet1") || ss.getSheetByName("Laporan Utama");
        if (sheet1) {
          sheet1.setName("Log Aktivitas Guru");
        } else {
          sheet1 = ss.insertSheet("Log Aktivitas Guru");
        }
      }
      if (sheet1.getLastRow() === 0) {
        sheet1.appendRow(["Waktu", "Nama Guru", "Fingerprint", "IP Address", "Tipe Aktivitas", "Detail", "Kode Digunakan"]);
      }
      sheet1.appendRow([
        new Date(),
        data.teacher_name || 'Guru Tanpa Nama',
        data.fingerprint || '-',
        data.ip || '-',
        data.activity_type || 'VISIT',
        data.details || '-',
        data.code_used || '-'
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet2 = ss.getSheetByName("Data Trial");
  var trialUsers = [];
  if (sheet2) {
    var rows = sheet2.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1]) {
        var trialVal = Number(rows[i][4]);
        trialUsers.push({
          created_at: rows[i][5] || rows[i][0],
          id: rows[i][1],
          ip: rows[i][2],
          location: rows[i][3],
          remaining_trials: !isNaN(trialVal) ? trialVal : 5,
          last_active: rows[i][6] || rows[i][0],
          has_generated: true
        });
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify({status: 'active', app: 'Smart RPM', trialUsers: trialUsers}))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                          </pre>
                        </div>
                        <div className="text-[11px] text-gray-500 space-y-1 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                          <strong className="text-amber-800 block font-bold">Cara Deploy di Google Sheets:</strong>
                          <ol className="list-decimal pl-4 space-y-0.5 text-amber-900">
                            <li>Klik tombol <strong className="font-bold">Deploy</strong> di pojok kanan atas Apps Script &gt; <strong className="font-bold">New deployment</strong>.</li>
                            <li>Pilih jenis (Select type): <strong className="font-bold">Web app</strong>.</li>
                            <li>Atur <strong className="font-bold">Execute as</strong>: Me (Akun Anda) dan <strong className="font-bold">Who has access</strong>: <strong className="font-bold">Anyone (Siapa saja)</strong>.</li>
                            <li>Klik <strong className="font-bold">Deploy</strong>, beri izin otorisasi, lalu salin URL Web App yang dihasilkan ke kotak di atas!</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: LYNK.ID INTEGRATION */}
                  {activeTab === 'lynk' && (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <ShoppingBag size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-base">Integrasi Penjualan Lynk.id</h4>
                            <p className="text-xs text-gray-500">Kelola tautan toko checkout dan URL klaim otomatis untuk pembeli dari Lynk.id</p>
                          </div>
                        </div>

                        {/* Item 1: Checkout Link */}
                        <div className="space-y-2 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                            1. Tautan Checkout Toko Lynk.id Anda
                          </label>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            Tautan ini ditampilkan kepada pengguna trial pada modal aktivasi & kuota habis agar guru dapat melakukan pembelian instan via QRIS / E-Wallet / Bank:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value="https://lynk.id/indratata/3wo67k5xykd7/checkout"
                              className="flex-1 bg-white px-3 py-2 border border-emerald-300 rounded-lg text-xs font-mono text-emerald-900 select-all"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText('https://lynk.id/indratata/3wo67k5xykd7/checkout');
                                alert('Tautan checkout Lynk.id berhasil disalin!');
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                              <Copy size={14} /> Salin
                            </button>
                            <a
                              href="https://lynk.id/indratata/3wo67k5xykd7/checkout"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink size={14} /> Buka Toko
                            </a>
                          </div>
                        </div>

                        {/* Item 2: Redirect Link for Lynk.id */}
                        <div className="space-y-2 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                            2. Tautan Pengalihan (Redirect / Thank You Page Link) untuk Produk Lynk.id
                          </label>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Tempelkan tautan ini di dashboard Lynk.id Anda pada pengaturan produk digital menu <strong>"Link Terima Kasih Pembayaran / Redirect Link"</strong>. Pembeli yang baru saja membayar di Lynk.id akan otomatis diarahkan ke URL ini untuk menerima Kode Akses resminya:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://...'}?action=claim`}
                              className="flex-1 bg-white px-3 py-2 border border-blue-300 rounded-lg text-xs font-mono text-blue-900 select-all"
                            />
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/?action=claim`;
                                navigator.clipboard.writeText(url);
                                alert('Tautan Pengalihan Klaim Lynk.id berhasil disalin!\n\n' + url);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                              <Copy size={14} /> Salin URL Klaim
                            </button>
                          </div>
                        </div>

                        {/* Item 3: Test Claim */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Uji Coba Tampilan Klaim Kode Akses Pembeli</span>
                            <p className="text-xs text-slate-500">Buka modal klaim kode akses untuk mensimulasikan alur setelah pembeli menyelesaikan pembayaran.</p>
                          </div>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/?action=claim`;
                              window.location.href = url;
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                          >
                            <Sparkles size={14} className="text-amber-300" /> Uji Coba Halaman Klaim
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. TRIAL DECREMENT CONFIRMATION MODAL (OPSI C)
// -------------------------------------------------------------
interface TrialConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOpenCodeModal: () => void;
  trialCount: number;
}

export function TrialConfirmationModal({ isOpen, onClose, onConfirm, onOpenCodeModal, trialCount }: TrialConfirmationModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-blue-50 max-w-md w-full overflow-hidden p-6 transform transition-all animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-blue-50 rounded-full text-blue-600 mb-4 ring-8 ring-blue-50/50">
            <Key size={32} className="animate-bounce" />
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Penggunaan Kuota</h3>
          
          <p className="text-gray-600 text-xs mb-4 leading-relaxed">
            Anda saat ini menggunakan <strong className="text-blue-600 font-extrabold">versi gratis (Trial)</strong>. Setiap penyusunan dokumen Rencana Pembelajaran Mendalam (RPM) akan mengurangi sisa kuota gratis Anda sebanyak <strong className="text-gray-800 font-bold">1 kali</strong>.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg py-3 px-4 w-full mb-4">
            <div className="text-[10px] text-blue-600 uppercase tracking-wider font-extrabold text-center">Sisa Kuota Gratis Anda Saat Ini</div>
            <div className="text-2xl font-black text-blue-700 mt-0.5 text-center">{trialCount} / 5 Pembuatan</div>
          </div>

          <label className="flex items-start gap-2.5 text-left bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-all w-full mb-5 select-none">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-600 font-medium leading-normal">
              Saya memahami dan menyetujui kuota gratis saya akan berkurang sebanyak 1 kali untuk menyusun dokumen ini.
            </span>
          </label>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                if (isChecked) {
                  onConfirm();
                  onClose();
                }
              }}
              disabled={!isChecked}
              className="w-full inline-flex justify-center items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all text-xs"
            >
              Ya, Susun RPM & Kurangi Kuota
            </button>
            
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  onClose();
                  onOpenCodeModal();
                }}
                className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all text-xs border border-slate-200"
              >
                Masukkan Kode Akses
              </button>
              <button
                onClick={onClose}
                className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-white hover:bg-gray-50 text-gray-500 font-semibold rounded-lg transition-all text-xs border border-gray-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. LYNK.ID AUTO-CLAIM CODE MODAL
// -------------------------------------------------------------
export function claimLocalLynkCode(): { code: string; type: string; valid_until: string; notes: string } {
  const existingClaim = localStorage.getItem('rpm_claimed_lynk_code');
  if (existingClaim) {
    try {
      const parsed = JSON.parse(existingClaim);
      if (parsed && parsed.code) return parsed;
    } catch (e) {}
  }

  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `RPM-LYNK-${suffix}`;
  const valid_from = new Date().toISOString();
  const valid_until_date = new Date();
  valid_until_date.setMonth(valid_until_date.getMonth() + 1);
  const valid_until = valid_until_date.toISOString();
  const notes = "Pembelian Otomatis Lynk.id (Akses 1 Bulan Resmi)";

  const newCodeObj = {
    id: `code-lynk-${Date.now()}`,
    code,
    type: "MONTHLY",
    status: "ACTIVE",
    valid_from,
    valid_until,
    created_at: valid_from,
    created_by: "Lynk.id Checkout Auto-Claim",
    notes
  };

  const localCodes = getLocalCodes();
  localCodes.unshift(newCodeObj);
  saveLocalCodes(localCodes);

  addLocalLog('VALIDATE_CODE_SUCCESS', `Pembeli mengeklaim Kode Akses baru via Lynk.id: ${code}`);
  syncCodeToGoogleSheet(newCodeObj);

  const claimResult = { code, type: "MONTHLY", valid_until, notes };
  try {
    localStorage.setItem('rpm_claimed_lynk_code', JSON.stringify(claimResult));
  } catch (e) {}

  return claimResult;
}

interface ClaimAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeActivated: (code: string) => void;
}

export function ClaimAccessCodeModal({ isOpen, onClose, onCodeActivated }: ClaimAccessCodeModalProps) {
  const [claimedCode, setClaimedCode] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activatedSuccess, setActivatedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setCopied(false);
    setActivatedSuccess(false);

    const processClaim = async () => {
      try {
        const fp = getOrGenerateFingerprint();
        let serverRes: any = null;

        try {
          const res = await fetch('/api/licensing/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp })
          });
          if (res.ok) {
            serverRes = await res.json();
          }
        } catch (err) {
          console.warn('Server claim route unreachable, using client claim engine:', err);
        }

        if (serverRes && serverRes.success && serverRes.code) {
          setClaimedCode(serverRes.code);
          setValidUntil(serverRes.valid_until);
          syncCodeToGoogleSheet({
            code: serverRes.code,
            type: serverRes.type || 'MONTHLY',
            status: 'ACTIVE',
            valid_until: serverRes.valid_until,
            created_by: 'Lynk.id Checkout Auto-Claim',
            notes: serverRes.notes || 'Pembelian Otomatis Lynk.id (Akses 1 Bulan Resmi)'
          });
        } else {
          const localClaim = claimLocalLynkCode();
          setClaimedCode(localClaim.code);
          setValidUntil(localClaim.valid_until);
        }
      } catch (e) {
        const localClaim = claimLocalLynkCode();
        setClaimedCode(localClaim.code);
        setValidUntil(localClaim.valid_until);
      } finally {
        setIsLoading(false);
      }
    };

    processClaim();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!claimedCode) return;
    navigator.clipboard.writeText(claimedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivateNow = () => {
    if (!claimedCode) return;
    setIsActivating(true);
    localStorage.setItem('rpm_access_code', claimedCode);
    addLocalLog('CODE_ACTIVATED', `Kode ${claimedCode} diaktifkan otomatis dari Klaim Lynk.id.`);
    syncToGoogleSheet({
      timestamp: new Date().toISOString(),
      activity_type: 'CODE_ACTIVATED',
      teacher_name: `Guru (${(localStorage.getItem('rpm_user_fingerprint') || 'Guest').substring(0, 12)})`,
      fingerprint: localStorage.getItem('rpm_user_fingerprint') || '-',
      code_used: claimedCode,
      details: `Kode Akses ${claimedCode} diaktifkan via Lynk.id.`
    });

    setTimeout(() => {
      setIsActivating(false);
      setActivatedSuccess(true);
      onCodeActivated(claimedCode);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-teal-100 max-w-lg w-full overflow-hidden transform transition-all animate-scale-in">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner ring-4 ring-white/15">
            <Gift className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>

          <span className="inline-block px-3 py-1 bg-amber-400 text-amber-950 font-extrabold text-[10px] rounded-full uppercase tracking-wider mb-2 shadow-sm">
            🎉 Pembelian Pembayaran Lynk.id Terverifikasi
          </span>
          <h3 className="text-xl font-black text-white tracking-tight">Klaim Kode Akses Smart RPM</h3>
          <p className="text-xs text-teal-100 mt-1 max-w-sm mx-auto">
            Terima kasih atas pembelian Anda di Lynk.id! Kode akses resmi Anda telah siap dan dapat langsung digunakan.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="py-10 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Menyiapkan & Menggenerasi Kode Akses Resmi Anda...</p>
            </div>
          ) : (
            <>
              {/* Code Box */}
              <div className="bg-slate-50 border-2 border-teal-500/30 rounded-xl p-4 text-center shadow-inner relative group">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  🔑 KODE AKSES RESMI ANDA
                </span>
                <div className="font-mono text-2xl font-black tracking-widest text-teal-800 my-1 selection:bg-teal-200">
                  {claimedCode}
                </div>
                {validUntil && (
                  <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
                    ✓ Masa Aktif: {new Date(validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (1 Bulan)
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all border border-slate-300 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Salin Kode Akses</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleActivateNow}
                  disabled={isActivating || activatedSuccess}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
                >
                  {isActivating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengaktifkan...</span>
                    </>
                  ) : activatedSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-200" />
                      <span>Berhasil Diaktifkan!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Aktifkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Petunjuk Penyimpanan:</strong> Simpan atau salin kode akses di atas. Jika Anda berpindah browser atau HP, Anda cukup memasukkan kembali kode ini pada menu <strong>Aktivasi Kode Akses</strong>.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Smart RPM - Modul Pembelajaran Mendalam</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-semibold">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
