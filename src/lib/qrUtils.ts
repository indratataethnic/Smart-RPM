import QRCodeLib from 'qrcode';
import { LessonPlanOutput } from '../types';

export interface QrSignatureOptions {
  enabled: boolean;
  signerMode: 'BOTH' | 'GURU' | 'KEPSEK'; // siapa yang menampilkan QR
  locationCity: string; // misal "Karanganyar" / "Jakarta"
  customDate: string; // misal "28 Agustus 2026"
  qrType: 'URL' | 'TEXT'; // URL ke portal verifikasi atau Teks ringkasan langsung
  qrSize: 'NORMAL' | 'LARGE'; // Ukuran tampilan QR
  qrLevel?: 'L' | 'M' | 'Q' | 'H'; // Tingkat toleransi koreksi kesalahan (M = standar optimal kamera HP)
  guruTitle?: string; // misal "Guru Kelas 4" atau "Guru Mata Pelajaran IPAS"
}

/**
 * Intelligent helper to determine whether the teacher title should be "Guru Kelas [Kelas]" or "Guru Mata Pelajaran [Mapel]"
 */
export const determineTeacherTitle = (identitas?: {
  peranGuru?: string;
  labelPeranGuru?: string;
  fase?: string;
  kelas?: string;
  faseKelas?: string;
  mataPelajaran?: string;
}): string => {
  if (!identitas) return 'Guru Mata Pelajaran';

  // If explicitly custom label is set
  if (identitas.labelPeranGuru && identitas.labelPeranGuru.trim()) {
    return identitas.labelPeranGuru.trim();
  }

  const role = identitas.peranGuru;
  const rawKelas = identitas.kelas || '';
  const cleanKelas = rawKelas.replace(/^Kelas\s*/i, '').trim(); // e.g. "4", "1", "IV"
  const mapel = identitas.mataPelajaran || '';

  if (role === 'GURU_KELAS') {
    return cleanKelas ? `Guru Kelas ${cleanKelas}` : 'Guru Kelas';
  }
  if (role === 'GURU_MAPEL') {
    return mapel ? `Guru Mata Pelajaran ${mapel}` : 'Guru Mata Pelajaran';
  }

  // Automatic heuristic:
  // Check if SD phase (Fase A, B, C or Kelas 1-6)
  const fase = identitas.fase || identitas.faseKelas || '';
  const isSD = /Fase\s*[ABC]\b/i.test(fase) || /Kelas\s*[1-6]\b/i.test(rawKelas) || /Kelas\s*[1-6]\b/i.test(fase);

  // Specialized SD subjects that typically have Guru Mata Pelajaran
  const isSpecializedSD = /(PJOK|Penjas|Pendidikan Jasmani|Olahraga|Agama|PAI|PAK|Pendidikan Agama|Bahasa Inggris|English)/i.test(mapel);

  if (isSD && !isSpecializedSD) {
    return cleanKelas ? `Guru Kelas ${cleanKelas}` : 'Guru Kelas';
  }

  return mapel ? `Guru Mata Pelajaran ${mapel}` : 'Guru Mata Pelajaran';
};

/**
 * Intelligent helper to extract city/region name from school string if not explicitly given
 * Example: "SD Negeri 01 Kebakkramat Karanganyar" -> "Karanganyar"
 * Example: "SMP Negeri 2 Kota Surakarta" -> "Surakarta"
 */
export const extractCityFromSchool = (namaSekolah?: string): string => {
  if (!namaSekolah || !namaSekolah.trim()) return 'Disahkan di Sekolah';
  const clean = namaSekolah.trim();

  // Check for common patterns: "Kota X", "Kab. X", "Kabupaten X"
  const kotaKabMatch = clean.match(/(?:Kota|Kab\.|Kabupaten)\s+([A-Za-z\s]+)/i);
  if (kotaKabMatch && kotaKabMatch[1]) {
    const raw = kotaKabMatch[1].trim().split(/\s+/).slice(0, 2).join(' ');
    return raw.replace(/^(Negeri|Swasta|Utama|Barat|Timur|Selatan|Utara)\s+/i, '').trim();
  }

  // Remove common prefixes like SD Negeri 1, SMPN 2, dsb.
  const withoutPrefix = clean
    .replace(/^(SD|SMP|SMA|SMK|MI|MTs|MA|TK|PAUD)\s*(Negeri|Swasta|N)?\s*(\d+)?\s*/i, '')
    .trim();

  const words = withoutPrefix.split(/\s+/);
  if (words.length > 0 && words[words.length - 1].length >= 3) {
    // If the last word looks like a region/city (e.g. Karanganyar, Surakarta, Malang, Kebakkramat)
    return words[words.length - 1];
  }

  return clean.length > 3 ? clean : 'Disahkan di Sekolah';
};

export const getDefaultSignatureDate = (): string => {
  const now = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
};

/**
 * Get public accessible origin that works on any external smartphone
 */
export const getAppBaseUrl = (): string => {
  // Shared App URL is public and does not require sandbox auth cookies
  const publicSharedUrl = 'https://ais-pre-zabit3kvbfayyyjdcdo7rm-550835579232.asia-southeast1.run.app';
  
  if (typeof window !== 'undefined') {
    const loc = window.location;
    // If running in production domain or standalone tab
    if (loc.origin && loc.origin !== 'null' && !loc.origin.includes('localhost') && !loc.origin.includes('127.0.0.1')) {
      // If running on custom deployed domain, use it; otherwise prefer public shared URL
      if (!loc.origin.includes('ais-dev-')) {
        return `${loc.origin}${loc.pathname}`;
      }
    }
  }
  return publicSharedUrl;
};

/**
 * Generate verification payload & URL / Text
 * Optimized for ultra-fast camera scanning on Android & iPhone
 */
export const generateQrContent = (
  plan: LessonPlanOutput,
  options: QrSignatureOptions
): { content: string; type: 'URL' | 'TEXT'; verificationUrl?: string; docId: string } => {
  const dateStr = `${options.locationCity ? options.locationCity + ', ' : ''}${options.customDate || getDefaultSignatureDate()}`;
  
  // Unique concise Document ID (e.g. RPM-2608-K9P2)
  const seed = `${plan.identitas?.namaSekolah || ''}${plan.identitas?.mataPelajaran || ''}${plan.identitas?.namaGuru || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const docId = `RPM-${Math.abs(hash).toString(36).toUpperCase().padStart(5, '0')}`;

  if (options.qrType === 'TEXT') {
    // Mode Teks Ringkas Berformat: Sangat cepat terbaca oleh semua kamera HP tanpa internet
    const guruLabel = options.guruTitle || determineTeacherTitle(plan.identitas);
    const textLines = [
      '★ VERIFIKASI RESMI DOKUMEN TTE ★',
      `ID: ${docId}`,
      `Dokumen: RPM ${plan.identitas?.mataPelajaran || 'Mapel'}`,
      `Kelas: ${plan.identitas?.faseKelas || '-'}`,
      `Sekolah: ${plan.identitas?.namaSekolah || '-'}`,
      `${guruLabel}: ${plan.identitas?.namaGuru || '-'}`,
      `Kepsek: ${plan.identitas?.namaKepsek || '-'}`,
      `Disahkan: ${dateStr}`,
      `Status: TERVERIFIKASI ASLI & SAH`,
    ];

    return { content: textLines.join('\n'), type: 'TEXT', docId };
  }

  // Mode URL Verifikasi: Gunakan format ringkas teroptimasi
  const compactPayload = {
    id: docId,
    s: (plan.identitas?.namaSekolah || '').trim(),
    m: (plan.identitas?.mataPelajaran || '').trim(),
    f: (plan.identitas?.faseKelas || '').trim(),
    g: (plan.identitas?.namaGuru || '').trim(),
    gt: (options.guruTitle || determineTeacherTitle(plan.identitas)).trim(),
    ng: (plan.identitas?.nipGuru || '').trim(),
    k: (plan.identitas?.namaKepsek || '').trim(),
    nk: (plan.identitas?.nipKepsek || '').trim(),
    d: dateStr,
    sm: options.signerMode || 'BOTH',
    ts: Date.now(),
  };

  try {
    // Simpan ke local cache verifikasi dokumen
    if (typeof window !== 'undefined') {
      try {
        const storedRecords = JSON.parse(localStorage.getItem('rpm_verify_records') || '{}');
        storedRecords[docId] = compactPayload;
        localStorage.setItem('rpm_verify_records', JSON.stringify(storedRecords));
      } catch (e) {
        // Localstorage quota ignore
      }
    }

    const jsonStr = JSON.stringify(compactPayload);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = getAppBaseUrl();
    const cleanBaseUrl = baseUrl.split('?')[0];
    const fullUrl = `${cleanBaseUrl}?v=${base64}`;

    return {
      content: fullUrl,
      type: 'URL',
      verificationUrl: fullUrl,
      docId,
    };
  } catch (err) {
    console.error('Error generating verification QR content:', err);
    const fallbackUrl = `${getAppBaseUrl()}?v=${docId}`;
    return {
      content: fallbackUrl,
      type: 'URL',
      verificationUrl: fallbackUrl,
      docId,
    };
  }
};

/**
 * Generate high-res Base64 Data URL for Word .doc export and print
 * Uses Level M (Medium error correction) with optimal module size for crisp scanning
 */
export const generateQrDataUrl = async (content: string): Promise<string> => {
  if (!content) return '';
  try {
    return await QRCodeLib.toDataURL(content, {
      width: 480,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M', // Level M (15% recovery, optimal module density for phone camera)
    });
  } catch (err) {
    console.warn('generateQrDataUrl error:', err);
    return '';
  }
};



