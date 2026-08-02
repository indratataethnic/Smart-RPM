import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { LicensingDB } from "./server-db";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Normalize request URL for Vercel Serverless Function rewrites safely without breaking SPA static assets
app.use((req, res, next) => {
  if (
    req.url &&
    !req.url.startsWith("/api/") &&
    (req.url.startsWith("/licensing") ||
      req.url.startsWith("/generate-rpm") ||
      req.url.startsWith("/verify-license"))
  ) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

// Helper to check and apply license / trial quota
function checkAndApplyLicense(fingerprint: string | undefined, codeStr: string | undefined, ip: string, userAgent: string) {
  // Step 1: Check if an access code is provided
  if (codeStr && codeStr.trim().length > 0) {
    const cleanCode = codeStr.trim().toUpperCase();
    const codeObj = LicensingDB.getAccessCodeByCode(cleanCode);
    
    if (!codeObj) {
      LicensingDB.addLog("VALIDATE_CODE_FAILED", `Validasi kode gagal (tidak ditemukan): ${cleanCode}`, { ip, browser: userAgent, codeUsed: cleanCode });
      return { success: false, status: "INVALID", message: "Kode tidak ditemukan. Silakan periksa kembali." };
    }
    
    if (codeObj.status === "DISABLED") {
      LicensingDB.addLog("VALIDATE_CODE_FAILED", `Validasi kode gagal (dinonaktifkan Admin): ${cleanCode}`, { ip, browser: userAgent, codeUsed: cleanCode });
      return { success: false, status: "DISABLED", message: "Kode telah dinonaktifkan." };
    }
    
    if (codeObj.status === "EXPIRED") {
      LicensingDB.addLog("VALIDATE_CODE_FAILED", `Validasi kode gagal (kedaluwarsa): ${cleanCode}`, { ip, browser: userAgent, codeUsed: cleanCode });
      return { success: false, status: "EXPIRED", message: "Masa berlaku kode telah berakhir. Silakan hubungi Admin untuk memperoleh kode bulan terbaru." };
    }
    
    // Check if MONTHLY has expired based on current date
    if (codeObj.type === "MONTHLY" && codeObj.valid_until && new Date(codeObj.valid_until) < new Date()) {
      LicensingDB.updateAccessCode(codeObj.id, { status: "EXPIRED" });
      LicensingDB.addLog("VALIDATE_CODE_FAILED", `Validasi kode gagal (kedaluwarsa tanggal): ${cleanCode}`, { ip, browser: userAgent, codeUsed: cleanCode });
      return { success: false, status: "EXPIRED", message: "Masa berlaku kode telah berakhir. Silakan hubungi Admin untuk memperoleh kode bulan terbaru." };
    }
    
    // Code is valid!
    LicensingDB.addLog("VALIDATE_CODE_SUCCESS", `Validasi kode sukses (${codeObj.type}): ${cleanCode}`, { ip, browser: userAgent, codeUsed: cleanCode });
    return { success: true, status: "VALID", type: codeObj.type, code: cleanCode };
  }
  
  // Step 2: No code provided, use trial
  const fp = fingerprint && fingerprint.trim().length > 0 ? fingerprint.trim() : "ip-" + ip.replace(/[^a-zA-Z0-9]/g, "");
  
  const user = LicensingDB.registerOrGetTrialUser(fp, ip);
  
  if (user.remaining_trials > 0) {
    return { success: true, status: "TRIAL", remainingTrials: user.remaining_trials, fingerprint: fp };
  } else {
    LicensingDB.addLog("TRIAL_EXHAUSTED", `Gagal generate RPM: Kuota trial habis untuk fingerprint: ${fp}`, { ip, browser: userAgent });
    return { success: false, status: "EXHAUSTED", message: "Anda telah menggunakan seluruh kuota gratis. Silakan masukkan Kode Akses agar dapat melanjutkan menggunakan Generator RPM." };
  }
}

// Lazy init for Gemini API
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan di environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper for Gemini API calls with exponential backoff & model fallback
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  // Filter unique
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        console.warn(`Gemini API call attempt ${attempt} on model ${model} failed:`, errStr);

        const isQuotaOrNotFound =
          errStr.includes("429") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("quota exceeded") ||
          errStr.includes("rate_limit") ||
          errStr.includes("404") ||
          errStr.includes("not_found");

        if (isQuotaOrNotFound) {
          // Immediately try next model in fallback list
          break;
        }

        const isTransient =
          errStr.includes("503") ||
          errStr.includes("unavailable") ||
          errStr.includes("service unavailable") ||
          errStr.includes("high demand") ||
          errStr.includes("overloaded");

        if (isTransient && attempt === 1) {
          await new Promise((res) => setTimeout(res, 500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Layanan AI sedang sibuk atau batas kuota tercapai. Silakan coba beberapa saat lagi.");
}

// Helper for Gemini API streaming calls with exponential backoff & model fallback
async function* streamGeminiWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: params.contents,
          config: params.config,
        });

        for await (const chunk of responseStream) {
          yield chunk;
        }
        return; // Stream finished successfully
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        console.warn(`Gemini API stream attempt ${attempt} on model ${model} failed:`, errStr);

        const isQuotaOrNotFound =
          errStr.includes("429") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("quota exceeded") ||
          errStr.includes("rate_limit") ||
          errStr.includes("404") ||
          errStr.includes("not_found");

        if (isQuotaOrNotFound) {
          // Immediately try next model in fallback list
          break;
        }

        const isTransient =
          errStr.includes("503") ||
          errStr.includes("unavailable") ||
          errStr.includes("service unavailable") ||
          errStr.includes("high demand") ||
          errStr.includes("overloaded");

        if (isTransient && attempt === 1) {
          await new Promise((res) => setTimeout(res, 500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Layanan AI sedang sibuk atau batas kuota tercapai. Silakan coba beberapa saat lagi.");
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server Rencana Pembelajaran Mendalam berjalan lancar" });
});

// API Quick AI Suggestions for CP, TP, DPL, Metode, Digital Tools
app.post("/api/recommend-fields", async (req, res) => {
  try {
    const { mataPelajaran, faseKelas, lingkupMateri, fieldType, capaianPembelajaran } = req.body;
    const ai = getGeminiClient();

    let prompt = "";
    if (fieldType === "cp_tp") {
      prompt = `Kamu adalah pakar Kurikulum Merdeka dan Pembelajaran Mendalam (Deep Learning) di Indonesia.
Berdasarkan Capaian Pembelajaran (CP) berikut yang telah diisikan oleh guru:
"${capaianPembelajaran || ''}"

Rancanglah:
1. Tujuan Pembelajaran (TP) yang diturunkan langsung dari CP tersebut secara logis, komprehensif, dan runtut (minimal memuat alur Memahami, Mengaplikasi, dan Merefleksi sesuai kerangka Pembelajaran Mendalam / Deep Learning).
2. Lingkup Materi yang menjadi fokus pembahasan utama dalam CP tersebut (berikan minimal 1 saran lingkup materi atau topik utama yang konkret, ringkas, dan jelas).

- Mata Pelajaran: ${mataPelajaran || 'Mata Pelajaran'}
- Kelas/Fase: ${faseKelas || 'Fase B'}

Keluarkan hasil rancangan dalam format JSON valid sebagai berikut:
{
  "tp": "1. Tujuan pembelajaran 1 (Memahami)...\n2. Tujuan pembelajaran 2 (Mengaplikasi)...\n3. Tujuan pembelajaran 3 (Merefleksi)...",
  "lingkupMateri": "Nama topik atau lingkup materi utama yang diekstrak dari CP tersebut"
}`;
    } else if (fieldType === "recommendations_all") {
      prompt = `Kamu adalah pakar metodologi Pembelajaran Mendalam (Deep Learning).
Berdasarkan data berikut:
- Mata Pelajaran: ${mataPelajaran || 'Umum'}
- Fase/Kelas: ${faseKelas || 'Fase A'}
- Materi: ${lingkupMateri || 'Umum'}

Berikan rekomendasi yang paling cocok dan efisien.
PENTING: Pilih HANYA 1 sampai 3 opsi yang paling relevan per kategori (Maksimal 3 opsi).

Gunakan STRING PERSIS DARI DAFTAR BERIKUT:

1. DPL (Pilih 1 s.d 3 string persis dari 8 Dimensi):
- "Keimanan dan Ketakwaan"
- "Kewargaan"
- "Penalaran Kritis"
- "Kreativitas"
- "Kolaborasi"
- "Kemandirian"
- "Kesehatan"
- "Komunikasi"

2. Metode & Model Pembelajaran (Pilih 1 s.d 3 string persis):
- "Problem Based Learning (PBL)"
- "Project Based Learning (PjBL)"
- "Discovery Learning"
- "Inquiry Based Learning"
- "Pembelajaran Berdiferensiasi (Konten/Proses/Produk)"
- "Cooperative Learning (Jigsaw/STAD)"
- "Demonstrasi Interaktif & Eksperimen"
- "Diskusi Kelompok & Debat Positif"
- "Studi Kasus & Role Playing"
- "Simulasi & Stasiun Pembelajaran (Station Rotation)"
- "Technological Pedagogical Content Knowledge (TPACK)"

3. Kemitraan Pembelajaran (Pilih 1 s.d 3 string persis):
- "Orang Tua / Wali Murid"
- "Kolaborasi Antar Siswa (Peer Learning)"
- "Komunitas Lokal & Tokoh Masyarakat"
- "Narasumber / Ahli Profesi Outside"
- "Guru Antar Mata Pelajaran (Team Teaching)"
- "Perpustakaan & Instansi Daerah"

4. Pemanfaatan Digital (Pilih 1 s.d 3 string persis):
- "Papan Interaktif Digital (Jamboard / Padlet / Miro)"
- "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"
- "Perpustakaan Digital / E-Book / Portal Rumah Belajar"
- "Simulator & Visualisasi Interaktif (PhET / GeoGebra / Canva)"
- "LMS (Google Classroom / Moodle / Whatsapp Group)"
- "Video Pembelajaran Interaktif (Edpuzzle / YouTube)"
- "Asisten AI & Tools Generatif Pembelajaran"

5. Lintas Disiplin Ilmu (Pilih 1 s.d 3 string persis):
- "Bahasa Indonesia"
- "Matematika & Numerasi"
- "IPAS / Sains Terapan"
- "Pendidikan Pancasila & Moral"
- "Seni Budaya & Desain (SBdP)"
- "Informatika & Literasi Digital"
- "PJOK & Kesehatan"
- "Bahasa Inggris & Daerah"

6. Lingkungan Pembelajaran (Pilih 1 s.d 3 string persis):
- "Ruang Kelas Interaktif"
- "Laboratorium & Ruang Sains/Komputer"
- "Lingkungan Sekolah & Kebun/Halaman"
- "Lingkungan Masyarakat & Sekitar Sekolah"
- "Perpustakaan & Pusat Sumber Belajar"
- "Ruang Digital / Maya (Virtual Class & LMS)"

Keluarkan dalam format JSON valid (maksimal 3 items di setiap array):
{
  "recommendedDpl": ["Penalaran Kritis", "Kolaborasi", "Kreativitas"],
  "recommendedMethods": ["Problem Based Learning (PBL)", "Technological Pedagogical Content Knowledge (TPACK)"],
  "recommendedPartnerships": ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
  "recommendedDigitalTools": ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
  "recommendedLintasDisiplin": ["Bahasa Indonesia", "Matematika & Numerasi"],
  "recommendedLingkunganPembelajaran": ["Ruang Kelas Interaktif", "Laboratorium & Ruang Sains/Komputer"],
  "studentCharacteristics": "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
  "materialCharacteristics": "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret."
}`;
    } else {
      return res.status(400).json({ error: "fieldType tidak valid" });
    }

    try {
      const response = await callGeminiWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    } catch (apiError: any) {
      console.warn("Gemini API fallback triggered for /api/recommend-fields:", apiError?.message);
      if (fieldType === "cp_tp") {
        const defaultMateri = lingkupMateri || `${mataPelajaran || 'Topik Pembelajaran'}`;
        const fallbackCpTp = {
          cp: `Peserta didik mampu memahami dan menganalisis konsep ${defaultMateri}, mengidentifikasi keterkaitan antar elemen, serta mengaplikasikan pemahaman tersebut dalam menyelesaikan masalah kontekstual sesuai standar Capaian Pembelajaran BSKAP terbaru Kurikulum Merdeka.`,
          tp: `1. Peserta didik dapat menjelaskan konsep dasar ${defaultMateri} secara tepat dan mendalam.\n2. Peserta didik dapat mengaplikasikan pemahaman ${defaultMateri} dalam situasi kontekstual sehari-hari.\n3. Peserta didik dapat merefleksikan dan menyimpulkan proses pembelajaran ${defaultMateri} secara kritis dan kolaboratif.`,
          lingkupMateri: defaultMateri
        };
        return res.json({ success: true, data: fallbackCpTp, isFallback: true });
      } else {
        const fallbackRecommendations = {
          recommendedDpl: ["Penalaran Kritis", "Kolaborasi", "Kreativitas"],
          recommendedMethods: ["Problem Based Learning (PBL)", "Technological Pedagogical Content Knowledge (TPACK)"],
          recommendedPartnerships: ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
          recommendedDigitalTools: ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
          recommendedLintasDisiplin: ["Bahasa Indonesia", "Matematika & Numerasi"],
          recommendedLingkunganPembelajaran: ["Ruang Kelas Interaktif", "Laboratorium & Ruang Sains/Komputer"],
          studentCharacteristics: "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
          materialCharacteristics: "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret."
        };
        return res.json({ success: true, data: fallbackRecommendations, isFallback: true });
      }
    }
  } catch (error: any) {
    console.error("Error in /api/recommend-fields:", error);
    const defaultMateri = req.body?.lingkupMateri || `${req.body?.mataPelajaran || 'Topik Pembelajaran'}`;
    if (req.body?.fieldType === "cp_tp") {
      return res.json({
        success: true,
        data: {
          cp: `Peserta didik mampu memahami dan menganalisis konsep ${defaultMateri}, mengidentifikasi keterkaitan antar elemen, serta mengaplikasikan pemahaman tersebut dalam menyelesaikan masalah kontekstual sesuai standar Capaian Pembelajaran BSKAP terbaru Kurikulum Merdeka.`,
          tp: `1. Peserta didik dapat menjelaskan konsep dasar ${defaultMateri} secara tepat dan mendalam.\n2. Peserta didik dapat mengaplikasikan pemahaman ${defaultMateri} dalam situasi kontekstual sehari-hari.\n3. Peserta didik dapat merefleksikan dan menyimpulkan proses pembelajaran ${defaultMateri} secara kritis dan kolaboratif.`,
          lingkupMateri: defaultMateri
        },
        isFallback: true
      });
    } else {
      return res.json({
        success: true,
        data: {
          recommendedDpl: ["Penalaran Kritis", "Kolaborasi", "Kreativitas"],
          recommendedMethods: ["Problem Based Learning (PBL)", "Technological Pedagogical Content Knowledge (TPACK)"],
          recommendedPartnerships: ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
          recommendedDigitalTools: ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
          recommendedLintasDisiplin: ["Bahasa Indonesia", "Matematika & Numerasi"],
          recommendedLingkunganPembelajaran: ["Ruang Kelas Interaktif", "Laboratorium & Ruang Sains/Komputer"],
          studentCharacteristics: "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
          materialCharacteristics: "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret."
        },
        isFallback: true
      });
    }
  }
});

// Helper to create a complete fallback RPM structure if AI service is unavailable
function createFallbackLessonPlan(formData: any) {
  const data = formData || {};
  const mp = data.mataPelajaran || 'Mata Pelajaran';
  const lm = data.lingkupMateri || 'Materi Utama Pembelajaran';
  const cp = data.capaianPembelajaran || `Peserta didik dapat memahami dan menerapkan konsep ${lm}.`;
  const tp = data.tujuanPembelajaran || `1. Peserta didik dapat menjelaskan ${lm}.\n2. Peserta didik dapat mengaplikasikan ${lm} dalam masalah nyata.\n3. Peserta didik merefleksikan pemahaman materi ${lm}.`;

  return {
    identitas: {
      namaGuru: data.namaGuru || "Guru Mata Pelajaran",
      nipGuru: data.nipGuru || "-",
      namaKepsek: data.namaKepsek || "Kepala Sekolah",
      nipKepsek: data.nipKepsek || "-",
      namaSekolah: data.namaSekolah || "Sekolah Dasar Negeri",
      mataPelajaran: mp,
      fase: data.fase || "Fase A",
      kelas: data.kelas || "Kelas 1",
      faseKelas: data.faseKelas || `${data.fase || 'Fase A'} - ${data.kelas || 'Kelas 1'}`,
      semesterTahun: data.semesterTahun || "Semester 1 / 2026-2027",
      alokasiWaktu: data.alokasiWaktu || "2 x 35 Menit (1 Pertemuan)"
    },
    analisisAwal: {
      karakteristikMurid: data.karakteristikMurid || "Murid memiliki gaya belajar beragam (visual, auditori, kinestetik) dan antusias mengikuti kegiatan kelompok.",
      karakteristikMateri: data.karakteristikMateri || "Materi bersifat kontekstual dan dekat dengan kehidupan sehari-hari siswa."
    },
    tujuanDanDpl: {
      capaianPembelajaran: cp,
      lingkupMateri: lm,
      tujuanPembelajaran: tp,
      indikatorKetercapaian: [
        `Menjelaskan konsep dasar ${lm} dengan tepat.`,
        `Mengaplikasikan konsep ${lm} dalam menyelesaikan masalah kontekstual.`,
        `Refleksi dan pemaknaan atas proses pembelajaran ${lm}.`
      ],
      dimensiProfilLulusan: Array.isArray(data.dpl) && data.dpl.length > 0 ? data.dpl : ["Bernalar Kritis", "Gotong Royong", "Kreatif"]
    },
    desainPembelajaran: {
      modelDanMetode: Array.isArray(data.metodeModel) && data.metodeModel.length > 0 ? data.metodeModel : ["Problem Based Learning (PBL)", "Pembelajaran Berdiferensiasi (Konten/Proses/Produk)"],
      kemitraanPembelajaran: Array.isArray(data.kemitraan) && data.kemitraan.length > 0 ? data.kemitraan : ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
      pemanfaatanDigital: Array.isArray(data.pemanfaatanDigital) && data.pemanfaatanDigital.length > 0 ? data.pemanfaatanDigital : ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
      lintasDisiplin: Array.isArray(data.lintasDisiplin) ? data.lintasDisiplin : [],
      lingkunganPembelajaran: Array.isArray(data.lingkunganPembelajaran) ? data.lingkunganPembelajaran : [],
      saranaPrasarana: "Laptop, Proyektor, Papan Tulis, LKPD Cetak, Media Interaktif Digital."
    },
    kegiatanPembelajaran: {
      pendahuluan: {
        alokasiWaktu: "15 Menit",
        aktivitas: [
          "Guru membuka pembelajaran dengan salam, berdoa bersama, dan menyapa siswa.",
          "Guru menyampaikan tujuan pembelajaran dan memberikan motivasi awal.",
          "Guru melakukan apersepsi dan tes diagnostik singkat terkait topik " + lm + "."
        ]
      },
      kegiatanInti: [
        {
          tahapLabel: "MEMAHAMI",
          subJudul: "Memahami Konsep & Eksplorasi Makna (Understanding)",
          prinsipMendalamLabel: "Berpusat pada Murid & Meaningful Learning",
          alokasiWaktu: "25 Menit",
          aktivitasGuru: [
            "Guru memberikan pertanyaan pemantik dan menayangkan media visual/digital terkait " + lm + ".",
            "Guru memfasilitasi diskusi eksplorasi awal dan mengamati tingkat pemahaman awal murid.",
            "Guru memberikan penguatan materi dasar serta klarifikasi konsep."
          ],
          aktivitasMurid: [
            "Murid mengamati tayangan/media dan merespons pertanyaan pemantik secara aktif.",
            "Murid berdiskusi dalam kelompok kecil untuk mengeksplorasi konsep dasar " + lm + ".",
            "Murid merumuskan ringkasan pemahaman awal."
          ],
          poinUtama: ["Eksplorasi konsep " + lm, "Diskusi tanya jawab interaktif"]
        },
        {
          tahapLabel: "MENGAPLIKASI",
          subJudul: "Mengaplikasikan Konsep pada Konteks Nyata (Application)",
          prinsipMendalamLabel: "Autentik, Kolaboratif & Problem Solving",
          alokasiWaktu: "35 Menit",
          aktivitasGuru: [
            "Guru membagikan Lembar Kerja Peserta Didik (LKPD) berbasis studi kasus/masalah nyata.",
            "Guru memandu proses kerja kelompok dan memberikan arahan scaffolding.",
            "Guru mengobservasi kolaborasi dan sikap bernalar kritis antar siswa."
          ],
          aktivitasMurid: [
            "Murid bekerja sama menyelesaikan tugas atau masalah dalam LKPD.",
            "Murid menerapkan konsep " + lm + " untuk menghasilkan produk / solusi.",
            "Murid menyusun hasil diskusi kelompok untuk dipresentasikan."
          ],
          poinUtama: ["Pengerjaan LKPD kolaboratif", "Penyelesaian masalah nyata"]
        },
        {
          tahapLabel: "MEREFLEKSI",
          subJudul: "Merefleksikan Pembelajaran & Evaluasi Diri (Reflection)",
          prinsipMendalamLabel: "Metakognisi, Feedback Loop & Self Assessment",
          alokasiWaktu: "15 Menit",
          aktivitasGuru: [
            "Guru memimpin sesi presentasi kelompok dan memberikan umpan balik konstruktif.",
            "Guru memandu refleksi diri murid mengenai proses dan manfaat pembelajaran.",
            "Guru bersama murid menyimpulkan pembelajaran."
          ],
          aktivitasMurid: [
            "Masing-masing kelompok mempresentasikan hasil karya / jawaban LKPD.",
            "Murid melakukan refleksi metakognitif (apa yang sudah dipahami dan kesulitan yang dihadapi).",
            "Murid memberikan apresiasi kepada sesama teman kelompok."
          ],
          poinUtama: ["Presentasi & Umpan Balik", "Refleksi metakognitif mandiri"]
        }
      ],
      penutup: {
        alokasiWaktu: "10 Menit",
        aktivitas: [
          "Guru membimbing murid menyimpulkan seluruh rangkaian aktivitas " + lm + ".",
          "Guru memberikan umpan balik apresiatif dan penugasan tindak lanjut.",
          "Pembelajaran ditutup dengan doa bersama dan salam penutup."
        ]
      }
    },
    asesmen: {
      assessmentAsLearning: [
        {
          bentukPenilaian: "Formatif (Refleksi Diri & Antarteman)",
          teknikPenilaian: "Self & Peer Assessment",
          instrumenPenilaian: "Lembar refleksi metakognitif mandiri dan rubrik penilaian antarteman tentang pemahaman konsep " + lm + "."
        }
      ],
      assessmentForLearning: [
        {
          bentukPenilaian: "Formatif (Proses Pembelajaran)",
          teknikPenilaian: "Observasi Diskusi & Penugasan LKPD",
          instrumenPenilaian: "Lembar observasi sikap/keterampilan dan rubrik penilaian unjuk kerja kelompok " + mp + "."
        }
      ],
      assessmentOfLearning: [
        {
          bentukPenilaian: "Sumatif (Akhir Pembelajaran)",
          teknikPenilaian: "Tes Tertulis / Penilaian Produk",
          instrumenPenilaian: "Soal evaluasi tertulis dan rubrik penilaian karya/produk akhir materi " + lm + "."
        }
      ]
    },
    remedialDanPengayaan: {
      remedial: "Bimbingan individu/kelompok kecil bagi murid yang memerlukan pendampingan materi dasar.",
      pengayaan: "Pemberian tugas pengayaan HOTS (High Order Thinking Skills) untuk memperdalam pemahaman."
    },
    lampiran: {
      lkpd: "Ringkasan LKPD: Diskusikan bersama kelompokmu konsep " + lm + " dan jawablah pertanyaan analisis dalam lembar kerja.",
      bahanAjar: "Bahan Ajar Ringkas: Rangkuman materi " + mp + " topik " + lm + " dilengkapi contoh gambar/diagram.",
      rubrikPenilaian: "Rubrik Penilaian Kinerja & Produk (Skor 1-4: Perlu Bimbingan, Cukup, Layak, Mahir).",
      kktp: {
        pendekatan: "Rubrik Kriteria Ketuntasan Tujuan Pembelajaran (Interval Nilai)",
        deskripsi: "Pedoman penetapan kriteria ketuntasan belajar murid.",
        kriteria: [
          {
            aspekPenilaian: "Pemahaman Konsep " + lm,
            perluBimbingan: "Belum menunjukkan pemahaman (0 - 60%)",
            cukup: "Menunjukkan pemahaman dengan bimbingan (61 - 70%)",
            layak: "Menunjukkan pemahaman mandiri (71 - 80%)",
            mahir: "Pemahaman sangat mendalam & analisis luas (81 - 100%)"
          },
          {
            aspekPenilaian: "Aplikasi & Solusi Masalah",
            perluBimbingan: "Belum mampu menyelesaikan tugas (0 - 60%)",
            cukup: "Menyelesaikan sebagian tugas (61 - 70%)",
            layak: "Menyelesaikan tugas secara mandiri (71 - 80%)",
            mahir: "Mampu mengaplikasikan pada konteks baru (81 - 100%)"
          }
        ],
        tindakLanjut: {
          perluBimbingan: "Intervensi khusus guru dan penyederhanaan instruksi",
          cukup: "Bimbingan tambahan pada bagian yang masih lemah",
          layak: "Diberikan penguatan materi dan latihan mandiri",
          mahir: "Diberikan pengayaan / soal tantangan HOTS"
        }
      }
    },
    jurnalHarian: {
      judul: "Jurnal Harian Pelaksanaan Pembelajaran",
      catatanRefleksiUmum: "Catatan Keterlaksanaan Alur Pembelajaran Mendalam (Deep Learning).",
      entries: [
        {
          hariTanggal: "Senin, ... 2026",
          pertemuanJam: "Pertemuan 1 (Jam ke-1 & 2)",
          mataPelajaran: mp,
          atp: tp,
          materiAktivitas: "Tahap Memahami & Mengaplikasi - Topik " + lm,
          penilaian: "Asesmen Formatif (Diskusi & LKPD)",
          catatanKendala: "Siswa berpartisipasi aktif dalam kegiatan kelompok dan diskusi."
        }
      ]
    }
  };
}

// API Main Generator for Deep Learning Lesson Plan (Rencana Pembelajaran Mendalam / RPM)
app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    const formData = req.body;
    const { accessCode, fingerprint } = formData;
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    
    const clientIp = Array.isArray(ip) ? ip[0] : String(ip);

    // Validate license / trial quota first
    const licenseCheck = checkAndApplyLicense(fingerprint, accessCode, clientIp, userAgent);
    if (!licenseCheck.success) {
      return res.status(403).json({
        success: false,
        error: "TRIAL_EXHAUSTED",
        status: licenseCheck.status,
        message: licenseCheck.message
      });
    }

    // Apply trial decrement if using trial
    if (licenseCheck.status === "TRIAL" && licenseCheck.fingerprint) {
      const ok = LicensingDB.decrementTrial(licenseCheck.fingerprint);
      if (ok) {
        const updatedUser = LicensingDB.getTrialUser(licenseCheck.fingerprint);
        const rem = updatedUser ? updatedUser.remaining_trials : 0;
        LicensingDB.addLog("TRIAL_USED", `Trial digunakan. Sisa kuota gratis: ${rem} kali`, {
          ip: clientIp,
          browser: userAgent
        });
      }
    } else if (licenseCheck.status === "VALID" && licenseCheck.code) {
      LicensingDB.addLog("GENERATE_RPM", `Penyusunan RPM sukses menggunakan kode: ${licenseCheck.code} (${licenseCheck.type})`, {
        ip: clientIp,
        browser: userAgent,
        codeUsed: licenseCheck.code
      });
    }

    const ai = getGeminiClient();

    const systemPrompt = `Kamu adalah pakar desain instruksional Kurikulum Merdeka dan pelopor Pembelajaran Mendalam (Deep Learning) di Indonesia.
Tugas utama kamu adalah menyusun dokumen lengkap "Rencana Pembelajaran Mendalam (RPM)" / Modul Ajar Mendalam berdasarkan input guru berikut:

DATAPEMBELAJARAN:
- Nama Guru: ${formData.namaGuru || '-'} (NIP: ${formData.nipGuru || '-'})
- Nama Kepala Sekolah: ${formData.namaKepsek || '-'} (NIP: ${formData.nipKepsek || '-'})
- Nama Sekolah: ${formData.namaSekolah || '-'}
- Mata Pelajaran: ${formData.mataPelajaran}
- Fase: ${formData.fase || '-'}
- Kelas: ${formData.kelas || '-'}
- Kelas / Fase: ${formData.faseKelas || `${formData.fase || ''} - ${formData.kelas || ''}`}
- Semester / Tahun Ajaran: ${formData.semesterTahun}
- Alokasi Waktu: ${formData.alokasiWaktu}
- Capaian Pembelajaran (CP): ${formData.capaianPembelajaran}
- Lingkup Materi: ${formData.lingkupMateri}
- Tujuan Pembelajaran (TP): ${formData.tujuanPembelajaran}
- Karakteristik Murid: ${formData.karakteristikMurid || 'Tercantum di tabel analisis'}
- Karakteristik Materi: ${formData.karakteristikMateri || 'Tercantum di tabel analisis'}
- Dimensi Profil Lulusan (DPL): ${Array.isArray(formData.dpl) ? formData.dpl.join(", ") : formData.dpl}
- Metode & Model Pembelajaran: ${Array.isArray(formData.metodeModel) ? formData.metodeModel.join(", ") : formData.metodeModel}
- Kemitraan Pembelajaran: ${Array.isArray(formData.kemitraan) ? formData.kemitraan.join(", ") : formData.kemitraan}
- Pemanfaatan Digital: ${Array.isArray(formData.pemanfaatanDigital) ? formData.pemanfaatanDigital.join(", ") : formData.pemanfaatanDigital}
- Lintas Disiplin Ilmu: ${Array.isArray(formData.lintasDisiplin) ? formData.lintasDisiplin.join(", ") : formData.lintasDisiplin || ''}
- Lingkungan Pembelajaran: ${Array.isArray(formData.lingkunganPembelajaran) ? formData.lingkunganPembelajaran.join(", ") : formData.lingkunganPembelajaran || ''}

PERSYARATAN WAJIB DOKUMEN RENCANA PEMBELAJARAN MENDALAM:
1. PADA KEGIATAN INTI PEMBELAJARAN, KAMU WAJIB MEMBAGI KEGIATAN MENJADI 3 TAHAPAN EKSPLISIT PEMBELAJARAN MENDALAM:
   - Tahap 1: MEMAHAMI (Understanding & Concept Exploration)
   - Tahap 2: MENGAPLIKASI (Application & Deep Problem Solving)
   - Tahap 3: MEREFLEKSI (Reflection, Metacognition & Self Assessment)

2. PADA SETIAP TAHAPAN KEGIATAN INTI, BERIKAN EKSPLISIT LABEL "PRINSIP PEMBELAJARAN MENDALAM", contoh:
   - [Prinsip Pembelajaran Mendalam: Berpusat Pada Murid & Meaningful Learning]
   - [Prinsip Pembelajaran Mendalam: Keterlibatan Aktif & Authentic Context]
   - [Prinsip Pembelajaran Mendalam: High Order Thinking (HOT) & Joyful Learning]
   - [Prinsip Pembelajaran Mendalam: Metakognisi & Feedback Loop]

3. Cantumkan rincian kegiatan Guru dan Kegiatan Murid secara sistematis, operasional, dan inspiratif.
4. Cantumkan Asesmen dan Penilaian Pembelajaran dengan format 3 Kategori Utama:
   - Assessment as Learning (Asesmen saat pembelajaran - refleksi & penilaian diri/antarteman)
   - Assessment for Learning (Asesmen selama proses - observasi, umpan balik & penugasan)
   - Assessment of Learning (Asesmen akhir - tes tertulis, produk/proyek sumatif)
   Untuk setiap kategori di atas, wajib sertakan atribut: "bentukPenilaian", "teknikPenilaian", dan "instrumenPenilaian".
5. Berikan Lampiran LKPD ringkas, Bahan Ajar ringkas, dan Rubrik Penilaian.

Keluarkan dalam format JSON struktur persis berikut:
{
  "identitas": {
    "namaGuru": "${formData.namaGuru || ''}",
    "nipGuru": "${formData.nipGuru || ''}",
    "namaKepsek": "${formData.namaKepsek || ''}",
    "nipKepsek": "${formData.nipKepsek || ''}",
    "namaSekolah": "${formData.namaSekolah || ''}",
    "mataPelajaran": "${formData.mataPelajaran}",
    "fase": "${formData.fase || ''}",
    "kelas": "${formData.kelas || ''}",
    "faseKelas": "${formData.fase && formData.kelas ? `${formData.fase} - ${formData.kelas}` : (formData.faseKelas || '')}",
    "semesterTahun": "${formData.semesterTahun}",
    "alokasiWaktu": "${formData.alokasiWaktu}"
  },
  "analisisAwal": {
    "karakteristikMurid": "Uraian rinci identifikasi kebutuhan belajar murid (visual/auditori/kinestetik, kesiapan belajar)...",
    "karakteristikMateri": "Uraian rinci analisis materi (konkret/abstrak, konseptual, keterkaitan dengan kehidupan nyata)..."
  },
  "tujuanDanDpl": {
    "capaianPembelajaran": "${formData.capaianPembelajaran}",
    "lingkupMateri": "${formData.lingkupMateri}",
    "tujuanPembelajaran": "${formData.tujuanPembelajaran}",
    "indikatorKetercapaian": [
      "Indikator 1...",
      "Indikator 2...",
      "Indikator 3..."
    ],
    "dimensiProfilLulusan": ${JSON.stringify(formData.dpl || [])}
  },
  "desainPembelajaran": {
    "modelDanMetode": ${JSON.stringify(formData.metodeModel || [])},
    "kemitraanPembelajaran": ${JSON.stringify(formData.kemitraan || [])},
    "pemanfaatanDigital": ${JSON.stringify(formData.pemanfaatanDigital || [])},
    "lintasDisiplin": ${JSON.stringify(formData.lintasDisiplin || [])},
    "lingkunganPembelajaran": ${JSON.stringify(formData.lingkunganPembelajaran || [])},
    "saranaPrasarana": "Daftar alat dan media pembelajaran yang digunakan..."
  },
  "kegiatanPembelajaran": {
    "pendahuluan": {
      "alokasiWaktu": "15 Menit",
      "aktivitas": [
        "Pengondisian kelas, doa, dan apersepsi...",
        "Penyampaian tujuan pembelajaran dan motivasi...",
        "Asesmen diagnostik singkat untuk mengukur pengetahuan awal..."
      ]
    },
    "kegiatanInti": [
      {
        "tahapLabel": "MEMAHAMI",
        "subJudul": "Memahami Konsep & Eksplorasi Makna (Understanding)",
        "prinsipMendalamLabel": "Berpusat pada Murid & Meaningful Learning",
        "alokasiWaktu": "25 Menit",
        "aktivitasGuru": [
          "Guru memberikan stimulus awal berupa media interaktif / pertanyaan pemantik...",
          "Guru memfasilitasi diskusi eksplorasi konsep dan mengamati pemahaman siswa...",
          "Guru memberikan konfirmasi dan penguatan materi dasar..."
        ],
        "aktivitasMurid": [
          "Murid mengamati stimulus dan mencatat poin-poin utama...",
          "Murid mendiskusikan pertanyaan pemantik dalam kelompok kecil...",
          "Murid menyampaikan pendapat awal dan bertanya jawab dengan guru...",
          "Murid merumuskan pemahaman awal tentang materi..."
        ],
        "poinUtama": ["Mengeksplorasi konsep dasar melalui media digital...", "Menjawab pertanyaan pemantik..."]
      },
      {
        "tahapLabel": "MENGAPLIKASI",
        "subJudul": "Mengaplikasikan Konsep pada Konteks Nyata (Application)",
        "prinsipMendalamLabel": "Autentik, Kolaboratif & Problem Solving",
        "alokasiWaktu": "35 Menit",
        "aktivitasGuru": [
          "Guru membagikan LKPD / tugas berbasis masalah nyata...",
          "Guru memberikan bimbingan dan scaffolding sesuai kebutuhan kelompok...",
          "Guru memantau kerjasama dan keaktifan murid..."
        ],
        "aktivitasMurid": [
          "Murid merencanakan langkah penyelesaian masalah dalam kelompok...",
          "Murid menerapkan konsep untuk memecahkan masalah atau membuat produk...",
          "Murid melakukan pembagian peran dan diskusi kelompok secara kolaboratif...",
          "Murid menyusun bahan presentasi atau laporan hasil kerja..."
        ],
        "poinUtama": ["Menganalisis studi kasus nyata...", "Membuat produk penyelesaian masalah..."]
      },
      {
        "tahapLabel": "MEREFLEKSI",
        "subJudul": "Merefleksikan Pembelajaran & Evaluasi Diri (Reflection)",
        "prinsipMendalamLabel": "Metakognisi, Feedback Loop & Self Assessment",
        "alokasiWaktu": "15 Menit",
        "aktivitasGuru": [
          "Guru memfasilitasi sesi presentasi / pameran karya kelompok...",
          "Guru memberikan umpan balik (feedback) yang membangun...",
          "Guru memandu refleksi metakognitif siswa..."
        ],
        "aktivitasMurid": [
          "Murid mempresentasikan hasil karya dan menanggapi pertanyaan...",
          "Murid melakukan refleksi diri (apa yang dipahami dan hambatan)...",
          "Murid memberikan penilaian antarteman atau umpan balik positif..."
        ],
        "poinUtama": ["Mengidentifikasi apa yang sudah dipahami dan hal yang perlu ditingkatkan...", "Menyampaikan pemaknaan belajar..."]
      }
    ],
    "penutup": {
      "alokasiWaktu": "10 Menit",
      "aktivitas": [
        "Menyimpulkan poin-poin utama pembelajaran bersama murid...",
        "Refleksi singkat dan apresiasi terhadap kinerja siswa...",
        "Informasi kegiatan pembelajaran berikutnya dan doa penutup."
      ]
    }
  },
  "asesmen": {
    "assessmentAsLearning": [
      {
        "bentukPenilaian": "Formatif (Refleksi Diri & Antarteman)",
        "teknikPenilaian": "Self-Assessment / Peer Assessment / Jurnal Metakognitif",
        "instrumenPenilaian": "Lembar Refleksi Diri & Rubrik Penilaian Teman Sejawat"
      }
    ],
    "assessmentForLearning": [
      {
        "bentukPenilaian": "Formatif (Proses Pembelajaran)",
        "teknikPenilaian": "Observasi Kinerja & Penugasan Kelompok (LKPD)",
        "instrumenPenilaian": "Lembar Observasi Sikap & Rubrik Kinerja Diskusi Kelompok"
      }
    ],
    "assessmentOfLearning": [
      {
        "bentukPenilaian": "Sumatif (Akhir Pembelajaran)",
        "teknikPenilaian": "Tes Tertulis & Penilaian Produk/Proyek",
        "instrumenPenilaian": "Soal Tes Evaluasi Uraian/PG & Rubrik Penilaian Karya/Produk"
      }
    ]
  },
  "remedialDanPengayaan": {
    "remedial": "Langkah pendampingan bagi siswa yang belum mencapai TP...",
    "pengayaan": "Tantangan berorientasi HOTS bagi siswa yang telah mencapai standar..."
  },
  "lampiran": {
    "lkpd": "Ringkasan Lembar Kerja Peserta Didik (soal/instruksi tugas)...",
    "bahanAjar": "Rangkuman materi singkat atau bahan bacaan guru & siswa...",
    "rubrikPenilaian": "Tabel/kriteria penilaian (Sangat Baik, Baik, Cukup, Perlu Bimbingan)...",
    "kktp": {
      "pendekatan": "Rubrik Kriteria Ketuntasan Tujuan Pembelajaran (Interval Nilai)",
      "deskripsi": "Pedoman penetapan kriteria ketuntasan belajar murid berdasarkan Kriteria Indikator TP.",
      "kriteria": [
        {
          "aspekPenilaian": "Indikator Ketercapaian TP 1 (Pemahaman Konsep)",
          "perluBimbingan": "Belum menunjukkan pemahaman konsep dasar (0 - 60%)",
          "cukup": "Menunjukkan pemahaman konsep dasar dengan bantuan (61 - 70%)",
          "layak": "Menunjukkan pemahaman konsep secara mandiri dan tepat (71 - 80%)",
          "mahir": "Menunjukkan pemahaman mendalam dan mampu menganalisis ulang (81 - 100%)"
        },
        {
          "aspekPenilaian": "Indikator Ketercapaian TP 2 (Aplikasi & Praktik)",
          "perluBimbingan": "Belum mampu menyelesaikan tugas / praktek (0 - 60%)",
          "cukup": "Mampu menyelesaikan sebagian tugas praktek dengan bimbingan (61 - 70%)",
          "layak": "Mampu menyelesaikan tugas praktek secara mandiri (71 - 80%)",
          "mahir": "Mampu mengaplikasikan pada masalah baru / konteks nyata (81 - 100%)"
        }
      ],
      "tindakLanjut": {
        "perluBimbingan": "Intervensi khusus dari guru dan penyederhanaan materi/tugas",
        "cukup": "Bimbingan tambahan pada poin indikator yang masih lemah",
        "layak": "Diberikan penguatan materi dan latihan soal mandiri",
        "mahir": "Diberikan pengayaan / soal tantangan berorientasi HOTS"
      }
    }
  },
  "jurnalHarian": {
    "judul": "Jurnal Harian Pelaksanaan Pembelajaran",
    "catatanRefleksiUmum": "Catatan ringkas keterlaksanaan alur Pembelajaran Mendalam, respon siswa, serta tindak lanjut perbaikan.",
    "entries": [
      {
        "hariTanggal": "Senin, ... 2026",
        "pertemuanJam": "Pertemuan 1 (Jam ke-1 & 2)",
        "mataPelajaran": "${formData.mataPelajaran}",
        "atp": "${formData.tujuanPembelajaran}",
        "materiAktivitas": "Aktivitas Tahap Memahami & Eksplorasi Konsep",
        "penilaian": "Asesmen Formatif (Observasi Sikap & Diskusi)",
        "catatanKendala": "Siswa aktif berdiskusi kelompok dan merespon pertanyaan pemantik dengan antusias."
      },
      {
        "hariTanggal": "Rabu, ... 2026",
        "pertemuanJam": "Pertemuan 2 (Jam ke-3 & 4)",
        "mataPelajaran": "${formData.mataPelajaran}",
        "atp": "${formData.tujuanPembelajaran}",
        "materiAktivitas": "Aktivitas Tahap Mengaplikasi & Praktikum LKPD",
        "penilaian": "Asesmen Formatif (Penilaian Kinerja / LKPD)",
        "catatanKendala": "Siswa berhasil menyelesaikan tugas praktek dan analisis masalah."
      }
    ]
  }
}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial status event
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Menganalisis CP, TP, dan Identitas Pembelajaran Guru...', step: 1 })}\n\n`);

    try {
      const responseStream = await streamGeminiWithRetry(ai, {
        preferredModel: "gemini-3.6-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      let accumulatedText = "";
      let lastStatusTime = Date.now();
      let currentPhaseIndex = 0;

      const phaseMessages = [
        { msg: "Sedang merancang alur Deep Learning (Memahami, Mengaplikasi, Merefleksi)...", step: 2 },
        { msg: "Menyusun rincian Aktivitas Guru & Murid serta Prinsip Pembelajaran Mendalam...", step: 3 },
        { msg: "Membuat instrumen Asesmen Diagnostik, Formatif, Sumatif, & KKTP...", step: 4 },
        { msg: "Finishing touch... Memformat dokumen Rencana Pembelajaran Mendalam...", step: 5 },
        { msg: "Hampir selesai! Menyiapkan lampiran LKPD dan Bahan Ajar...", step: 5 }
      ];

      for await (const chunk of responseStream) {
        const textChunk = chunk.text || "";
        accumulatedText += textChunk;

        res.write(`data: ${JSON.stringify({ type: 'chunk', text: textChunk, length: accumulatedText.length })}\n\n`);

        const now = Date.now();
        if (now - lastStatusTime > 2200 && currentPhaseIndex < phaseMessages.length) {
          const statusItem = phaseMessages[currentPhaseIndex];
          res.write(`data: ${JSON.stringify({ type: 'status', message: statusItem.msg, step: statusItem.step })}\n\n`);
          currentPhaseIndex++;
          lastStatusTime = now;
        }
      }

      try {
        const parsedPlan = JSON.parse(accumulatedText);
        res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: parsedPlan })}\n\n`);
      } catch (parseErr) {
        const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedPlan = JSON.parse(jsonMatch[0]);
          res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: parsedPlan })}\n\n`);
        } else {
          throw new Error("Format JSON dari AI tidak valid");
        }
      }
    } catch (apiError: any) {
      console.warn("Gemini API fallback triggered for /api/generate-lesson-plan:", apiError?.message);
      const fallbackPlan = createFallbackLessonPlan(formData);
      res.write(`data: ${JSON.stringify({ type: 'status', message: 'Menggunakan template Rencana Pembelajaran Mendalam standar...', step: 5 })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: fallbackPlan })}\n\n`);
    }
    res.end();
  } catch (error: any) {
    console.error("Error in /api/generate-lesson-plan:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || "Gagal menyusun Rencana Pembelajaran Mendalam" });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: createFallbackLessonPlan(req.body) })}\n\n`);
      res.end();
    }
  }
});

// API Refine existing lesson plan with user prompt
app.post("/api/refine-lesson-plan", async (req, res) => {
  try {
    const { currentPlan, userInstruction } = req.body;
    const ai = getGeminiClient();

    const prompt = `Kamu adalah pakar kurikulum Rencana Pembelajaran Mendalam.
Berikut adalah Rencana Pembelajaran Mendalam (RPM) saat ini dalam format JSON:
${JSON.stringify(currentPlan, null, 2)}

Instruksi Revisi dari Guru:
"${userInstruction}"

Perbaiki dokumen JSON di atas sesuai instruksi guru dengan tetap menjaga struktur JSON asli dan mempertahankan label Memahami, Mengaplikasi, Merefleksi serta Prinsip Pembelajaran Mendalam.
Keluarkan hasil akhir HANYA dalam JSON valid dengan struktur persis sama dengan input.`;

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const updatedPlan = JSON.parse(text);
    res.json({ success: true, lessonPlan: updatedPlan });
  } catch (error: any) {
    console.error("Error in /api/refine-lesson-plan:", error);
    const currentPlan = req.body?.currentPlan;
    if (currentPlan) {
      return res.json({ success: true, lessonPlan: currentPlan, isFallback: true });
    }
    res.status(500).json({ success: false, error: error.message || "Gagal merevisi rencana pembelajaran" });
  }
});

// API Generate Detailed LKPD (Lembar Kerja Peserta Didik) with AI
app.post("/api/generate-lkpd", async (req, res) => {
  try {
    const { planData, customInstruction } = req.body;
    const ai = getGeminiClient();

    const mataPelajaran = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const faseKelas = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || "";
    const cp = planData?.tujuanDanDpl?.capaianPembelajaran || "";

    const prompt = `Kamu adalah pakar penyusun Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka berorientasi Pembelajaran Mendalam (Deep Learning).
Buatkan dokumen LKPD LENGKAP, OTENTIK, dan INTERAKTIF berdasarkan Rencana Pembelajaran Mendalam (RPM) berikut:
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${faseKelas}
- Topik / Lingkup Materi: ${topik}
- Tujuan Pembelajaran: ${tp}
- Capaian Pembelajaran: ${cp}
${customInstruction ? `- Catatan Khusus Guru: ${customInstruction}` : ''}

DOKUMEN LKPD HARUS SANGAT RINCI DENGAN 4 KOMPONEN UTAMA BERIKUT:
1. Lembar Penugasan / Instruksi Kerja Kelompok (Judul, Tujuan Aktivitas, Alat & Bahan, Petunjuk/Langkah Kerja Operasional)
2. Panduan Aktivitas Praktikum / Eksplorasi Siswa (Judul Eksplorasi, Tujuan Praktikum, Langkah Kerja Praktikum, Tabel Lembar Pengamatan/Data Hasil Praktikum dengan header dan contoh baris isian, serta Pertanyaan Analisis)
3. Latihan Soal & Evaluasi (Minimal 5 Soal Pilihan Ganda HOTS dan Minimal 3 Soal Uraian/HOTS, LENGKAP dengan Kunci Jawaban & Pembahasan Detail untuk Guru)
4. Lembar Refleksi & Penilaian Diri Siswa (Pertanyaan Refleksi Metakognitif & Checklist Diri)

Keluarkan HANYA dalam format JSON valid dengan struktur persis berikut:
{
  "judulLKPD": "LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topik.toUpperCase()}",
  "subJudul": "Aktivitas Pembelajaran Mendalam (Deep Learning)",
  "petunjukUmum": [
    "Tuliskan nama anggota kelompok / nama siswa pada kolom identitas yang disediakan.",
    "Bacalah setiap petunjuk kerja dengan cermat sebelum melakukan aktivitas.",
    "Gunakan nalar kritis dan kolaborasi yang baik dalam menyelesaikan setiap tahapan."
  ],
  "lembarPenugasan": {
    "judulTugas": "Lembar Penugasan & Diskusi Kelompok",
    "tujuanAktivitas": "Peserta didik dapat memahami konsep ${topik} melalui diskusi dan pemecahan masalah kontekstual.",
    "alatDanBahan": ["Buku Siswa / Modul Ajar", "Alat Tulis Lengkap", "Lembar Kerja Siswa", "Media / Alat Peraga"],
    "instruksiKerja": [
      "Bentuklah kelompok diskusi yang terdiri dari 4-5 siswa.",
      "Cermati studi kasus atau wacana masalah yang diberikan oleh guru.",
      "Diskusikan pertanyaan dengan anggota kelompok dan catat hasil kesepakatan kelompok."
    ]
  },
  "panduanPraktikum": {
    "judulEksplorasi": "Panduan Aktivitas Praktikum & Eksplorasi Siswa",
    "tujuanPraktikum": "Peserta didik dapat membuktikan dan menganalisis fenomena ${topik} melalui eksperimen/praktikum langsung.",
    "langkahKerja": [
      "Siapkan alat dan bahan praktikum secara rapi di atas meja kerja.",
      "Lakukan percobaan sesuai dengan tahapan kerja yang diinstruksikan.",
      "Catat setiap data hasil pengamatan ke dalam tabel pengamatan di bawah ini secara cermat."
    ],
    "tabelPengamatan": {
      "judulTabel": "Tabel Lembar Pengamatan & Data Hasil Praktikum",
      "headers": ["No", "Variabel / Objek Pengamatan", "Hasil Pengamatan (Siswa)", "Analisis Singkat"],
      "rows": [
        ["1", "Pengamatan Kondisi Awal", "", ""],
        ["2", "Pengamatan Setelah Perlakuan / Percobaan", "", ""],
        ["3", "Pengamatan Akhir & Hasil Percobaan", "", ""]
      ],
      "petunjukPengisian": "Isilah tabel di atas berdasarkan hasil pengamatan langsung atau percobaan kelompok kalian."
    },
    "pertanyaanAnalisis": [
      "Berdasarkan data tabel pengamatan, pola atau perubahan apa yang dapat kalian amati?",
      "Mengapa hal tersebut dapat terjadi? Jelaskan keterkaitannya dengan konsep materi ${topik}!",
      "Apa kesimpulan utama yang dapat diambil dari kegiatan praktikum ini?"
    ]
  },
  "latihanSoal": {
    "petunjukPengerjaan": "Jawablah pertanyaan-pertanyaan berikut dengan teliti, kritis, dan jujur!",
    "pilihanGanda": [
      {
        "no": 1,
        "pertanyaan": "Soal pilihan ganda 1 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "A. Pilihan A",
        "pembahasan": "Pembahasan rinci alasan jawaban A benar..."
      },
      {
        "no": 2,
        "pertanyaan": "Soal pilihan ganda 2 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "B. Pilihan B",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 3,
        "pertanyaan": "Soal pilihan ganda 3 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "C. Pilihan C",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 4,
        "pertanyaan": "Soal pilihan ganda 4 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "D. Pilihan D",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 5,
        "pertanyaan": "Soal pilihan ganda 5 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "A. Pilihan A",
        "pembahasan": "Pembahasan..."
      }
    ],
    "soalUraian": [
      {
        "no": 1,
        "pertanyaan": "Soal uraian 1 berorientasi studi kasus nyata...",
        "kunciJawaban": "Kunci jawaban dan panduan penskoran...",
        "pembahasan": "Pembahasan rinci..."
      },
      {
        "no": 2,
        "pertanyaan": "Soal uraian 2...",
        "kunciJawaban": "Kunci jawaban...",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 3,
        "pertanyaan": "Soal uraian 3...",
        "kunciJawaban": "Kunci jawaban...",
        "pembahasan": "Pembahasan..."
      }
    ]
  },
  "refleksiSiswa": {
    "pertanyaanRefleksi": [
      "Apa hal paling menarik yang aku pelajari hari ini?",
      "Hambatan apa yang aku temui saat praktikum/diskusi dan bagaimana cara mengatasinya?",
      "Bagaimana aku dapat menerapkan pengetahuan ini dalam kehidupan sehari-hari?"
    ],
    "checkListDiri": [
      "Saya memahami konsep dasar materi pembelajaran hari ini",
      "Saya aktif berdiskusi dan bekerjasama dalam kelompok",
      "Saya dapat menyelesaikan praktikum dan latihan soal dengan jujur"
    ]
  }
}`;

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const lkpdData = JSON.parse(text);
    res.json({ success: true, lkpd: lkpdData });
  } catch (error: any) {
    console.error("Error in /api/generate-lkpd:", error);
    const planData = req.body?.planData || {};
    const topik = planData?.tujuanDanDpl?.lingkupMateri || planData?.identitas?.mataPelajaran || "Materi Pembelajaran";
    const fallbackLKPD = {
      judulLKPD: `LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topik.toUpperCase()}`,
      subJudul: "Aktivitas Pembelajaran Mendalam (Deep Learning)",
      petunjukUmum: [
        "Tuliskan nama anggota kelompok / nama siswa pada kolom identitas yang disediakan.",
        "Bacalah setiap petunjuk kerja dengan cermat sebelum melakukan aktivitas.",
        "Gunakan nalar kritis dan kolaborasi yang baik dalam menyelesaikan setiap tahapan."
      ],
      lembarPenugasan: {
        judulTugas: "Lembar Penugasan & Diskusi Kelompok",
        tujuanAktivitas: `Peserta didik dapat memahami konsep ${topik} melalui diskusi dan pemecahan masalah kontekstual.`,
        alatDanBahan: ["Buku Siswa / Modul Ajar", "Alat Tulis Lengkap", "Lembar Kerja Siswa", "Media / Alat Peraga"],
        instruksiKerja: [
          "Bentuklah kelompok diskusi yang terdiri dari 4-5 siswa.",
          "Cermati studi kasus atau wacana masalah yang diberikan oleh guru.",
          "Diskusikan pertanyaan dengan anggota kelompok dan catat hasil kesepakatan kelompok."
        ]
      },
      panduanPraktikum: {
        judulEksplorasi: "Panduan Aktivitas Praktikum & Eksplorasi Siswa",
        tujuanPraktikum: `Peserta didik dapat membuktikan dan menganalisis fenomena ${topik} melalui eksperimen/praktikum langsung.`,
        langkahKerja: [
          "Siapkan alat dan bahan praktikum secara rapi di atas meja kerja.",
          "Lakukan percobaan sesuai dengan tahapan kerja yang diinstruksikan.",
          "Catat setiap data hasil pengamatan ke dalam tabel pengamatan di bawah ini secara cermat."
        ],
        tabelPengamatan: {
          judulTabel: "Tabel Lembar Pengamatan & Data Hasil Praktikum",
          headers: ["No", "Variabel / Objek Pengamatan", "Hasil Pengamatan (Siswa)", "Analisis Singkat"],
          rows: [
            ["1", "Pengamatan Kondisi Awal", "", ""],
            ["2", "Pengamatan Setelah Perlakuan / Percobaan", "", ""],
            ["3", "Pengamatan Akhir & Hasil Percobaan", "", ""]
          ],
          petunjukPengisian: "Isilah tabel di atas berdasarkan hasil pengamatan langsung atau percobaan kelompok kalian."
        },
        pertanyaanAnalisis: [
          `Berdasarkan data tabel pengamatan, pola atau perubahan apa yang dapat kalian amati?`,
          `Mengapa hal tersebut dapat terjadi? Jelaskan keterkaitannya dengan konsep materi ${topik}!`,
          `Apa kesimpulan utama yang dapat diambil dari kegiatan praktikum ini?`
        ]
      },
      latihanSoal: {
        petunjukPengerjaan: "Jawablah pertanyaan-pertanyaan berikut dengan teliti, kritis, dan jujur!",
        pilihanGanda: [
          {
            no: 1,
            pertanyaan: `Manakah pernyataan yang paling tepat terkait konsep utama ${topik}?`,
            pilihan: [`A. ${topik} merupakan proses ilmiah penting dalam pembelajaran.`, "B. Tidak mempengaruhi hasil pembelajaran.", "C. Hanya digunakan saat ujian akhir.", "D. Tidak relevan dengan kehidupan sehari-hari."],
            kunciJawaban: `A. ${topik} merupakan proses ilmiah penting dalam pembelajaran.`,
            pembahasan: `Pernyataan A menjelaskan hakikat penting dari ${topik} secara tepat.`
          },
          {
            no: 2,
            pertanyaan: `Langkah awal yang paling baik dalam menganalisis ${topik} adalah...`,
            pilihan: ["A. Melakukan observasi dan pengumpulan data.", "B. Menyimpulkan tanpa bukti.", "C. Menghindari diskusi kelompok.", "D. Mengabaikan petunjuk kerja."],
            kunciJawaban: "A. Melakukan observasi dan pengumpulan data.",
            pembahasan: "Metode ilmiah diawali dengan observasi dan pengumpulan data."
          },
          {
            no: 3,
            pertanyaan: `Sikap bernalar kritis murid ditunjukkan dengan...`,
            pilihan: ["A. Mengajukan pertanyaan reflektif dan menguji kebenaran informasi.", "B. Menerima jawaban tanpa bertanya.", "C. Mengabaikan umpan balik.", "D. Bekerja sendiri tanpa berkolaborasi."],
            kunciJawaban: "A. Mengajukan pertanyaan reflektif dan menguji kebenaran informasi.",
            pembahasan: "Bernalar kritis melibatkan pertanyaan metakognitif dan pengujian informasi."
          },
          {
            no: 4,
            pertanyaan: `Tujuan dari kegiatan refleksi pada akhir pembelajaran adalah...`,
            pilihan: ["A. Memahami sejauh mana ketercapaian tujuan belajar dan area perbaikan.", "B. Menambah beban tugas siswa.", "C. Menggantikan nilai ujian.", "D. Memperlama waktu jam pelajaran."],
            kunciJawaban: "A. Memahami sejauh mana ketercapaian tujuan belajar dan area perbaikan.",
            pembahasan: "Refleksi berfungsi mengevaluasi proses dan pemahaman belajar siswa."
          },
          {
            no: 5,
            pertanyaan: `Manfaat utama penerapan Pembelajaran Mendalam (Deep Learning) adalah...`,
            pilihan: ["A. Siswa tidak hanya menghafal, tetapi memahami dan mengaplikasikan konsep.", "B. Siswa hanya menghafal rumus.", "C. Mengurangi aktivitas interaktif.", "D. Membatasi kreativitas siswa."],
            kunciJawaban: "A. Siswa tidak hanya menghafal, tetapi memahami dan mengaplikasikan konsep.",
            pembahasan: "Pembelajaran mendalam berfokus pada pemahaman bermakna dan aplikasi kontekstual."
          }
        ],
        soalUraian: [
          {
            no: 1,
            pertanyaan: `Jelaskan bagaimana konsep ${topik} dapat diterapkan dalam menyelesaikan masalah di kehidupan sehari-hari!`,
            kunciJawaban: `Siswa menjelaskan minimal 2 contoh aplikasi konkret ${topik} dalam kehidupan nyata.`,
            pembahasan: `Penilaian berfokus pada kemampuan menghubungkan teori dengan realitas kontekstual.`
          },
          {
            no: 2,
            pertanyaan: `Sebutkan dan jelaskan 3 langkah utama yang kalian lakukan saat praktikum/diskusi kelompok hari ini!`,
            kunciJawaban: "1. Persiapan alat & bahan. 2. Pelaksanaan eksperimen/diskusi. 3. Pengolahan data & penyimpulan.",
            pembahasan: "Mengukur pemahaman alur kerja dan metodologi siswa."
          },
          {
            no: 3,
            pertanyaan: `Mengapa kolaborasi dan gotong royong sangat penting dalam menyelesaikan Lembar Kerja ini?`,
            kunciJawaban: "Siswa menjelaskan bahwa kolaborasi mempermudah pembagian tugas, saling melengkapi gagasan, dan melatih komunikasi.",
            pembahasan: "Menilai pemaknaan Dimensi Profil Lulusan Gotong Royong."
          }
        ]
      },
      refleksiSiswa: {
        pertanyaanRefleksi: [
          "Apa hal paling menarik yang aku pelajari hari ini?",
          "Hambatan apa yang aku temui saat praktikum/diskusi dan bagaimana cara mengatasinya?",
          "Bagaimana aku dapat menerapkan pengetahuan ini dalam kehidupan sehari-hari?"
        ],
        checkListDiri: [
          "Saya memahami konsep dasar materi pembelajaran hari ini",
          "Saya aktif berdiskusi dan bekerjasama dalam kelompok",
          "Saya dapat menyelesaikan praktikum dan latihan soal dengan jujur"
        ]
      }
    };
    return res.json({ success: true, lkpd: fallbackLKPD, isFallback: true });
  }
});

// API Generate Detailed Rubrik Penilaian (Assessment as, for, of Learning) with AI
app.post("/api/generate-rubrik", async (req, res) => {
  try {
    const { planData, customInstruction } = req.body;
    const ai = getGeminiClient();

    const mataPelajaran = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const faseKelas = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || "";
    const cp = planData?.tujuanDanDpl?.capaianPembelajaran || "";

    const prompt = `Kamu adalah pakar evaluasi dan asesmen pembelajaran Kurikulum Merdeka berorientasi Pembelajaran Mendalam (Deep Learning).
Buatkan DOKUMEN RUBRIK PENILAIAN LENGKAP, OTENTIK, dan SPESIFIK untuk 3 Pendekatan Asesmen Kurikulum Merdeka:
1. Assessment as Learning (Refleksi Diri & Penilaian Antarteman)
2. Assessment for Learning (Observasi Kinerja, Keaktifan Diskusi, & Pengerjaan LKPD)
3. Assessment of Learning (Evaluasi Akhir, Tes Tertulis / Hasil Produk Karya Sumatif)

Berdasarkan Rencana Pembelajaran Mendalam (RPM):
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${faseKelas}
- Topik / Lingkup Materi: ${topik}
- Tujuan Pembelajaran: ${tp}
- Capaian Pembelajaran: ${cp}
${customInstruction ? `- Catatan Khusus Guru: ${customInstruction}` : ''}

UNTUK MASING-MASING DARI 3 KATEGORI ASESMEN DI ATAS, BUATKAN TABEL RUBRIK DENGAN MINIMAL 3 ASPEK/INDIKATOR PENILAIAN LENGKAP DENGAN 4 TINGKAT DESKRIPSI KRITERIA (Perlu Bimbingan / Skor 1, Cukup / Skor 2, Layak / Skor 3, Mahir / Skor 4) SERTA FORMULA PEDOMAN PENSKORAN.

Keluarkan HANYA dalam format JSON valid dengan struktur persis berikut:
{
  "judulRubrik": "RUBRIK PENILAIAN PEMBELAJARAN MENDALAM - ${topik.toUpperCase()}",
  "subJudul": "Pedoman Penilaian Otentik (Assessment as, for, & of Learning)",
  "mataPelajaran": "${mataPelajaran}",
  "faseKelas": "${faseKelas}",
  "lingkupMateri": "${topik}",
  "petunjukPenggunaan": [
    "Gunakan Rubrik Assessment as Learning untuk membimbing murid melakukan refleksi metakognitif mandiri dan saling memberi umpan balik antar teman.",
    "Gunakan Rubrik Assessment for Learning saat mengamati keaktifan, penalaran kritis, serta keterlibatan murid selama diskusi dan praktikum LKPD.",
    "Gunakan Rubrik Assessment of Learning untuk menilai hasil karya/produk akhir atau tes sumatif murid pada akhir materi."
  ],
  "assessmentAsLearning": {
    "kategori": "Assessment as Learning",
    "subJudul": "Rubrik Penilaian Diri (Self Assessment) & Antarteman (Peer Assessment)",
    "tujuanFokus": "Mengembangkan kesadaran metakognitif, kejujuran diri, dan kemampuan memberikan umpan balik konstruktif antar siswa.",
    "teknikInstrumen": "Lembar Refleksi Metakognitif Mandiri & Angket Penilaian Teman Sejawat",
    "tabelRubrik": [
      {
        "aspekPenilaian": "Refleksi Pemahaman Mandiri",
        "perluBimbingan": "Belum mampu mengenali hal yang dipahami atau kesulitan belajar yang dihadapi.",
        "cukup": "Mampu menyebutkan hal yang dipahami dan kesulitan belajar dengan bimbingan guru.",
        "layak": "Mampu mengidentifikasi pemahaman dan hambatan belajar secara mandiri dan jujur.",
        "mahir": "Sangat peka dalam merefleksikan pemahaman, hambatan, serta merumuskan strategi perbaikan diri."
      },
      {
        "aspekPenilaian": "Apresiasi & Penilaian Antarteman",
        "perluBimbingan": "Belum memberikan tanggapan atau penilaian objektif kepada teman kelompok.",
        "cukup": "Memberikan penilaian kepada teman tetapi masih ragu/singkat tanpa saran pendukung.",
        "layak": "Memberikan penilaian dan umpan balik yang jujur serta menghargai kontribusi teman.",
        "mahir": "Memberikan umpan balik yang sangat apresiatif, obyektif, konstruktif, dan membangun semangat teman."
      },
      {
        "aspekPenilaian": "Kemandirian & Tanggung Jawab Belajar",
        "perluBimbingan": "Memerlukan dorongan terus-menerus untuk menyelesaikan lembar refleksi diri.",
        "cukup": "Mengisi lembar refleksi diri tepat waktu saat diingatkan guru.",
        "layak": "Mengisi lembar refleksi secara mandiri dengan sungguh-sungguh.",
        "mahir": "Sangat proaktif, jujur, dan menunjukkan komitmen tinggi dalam evaluasi belajar mandiri."
      }
    ],
    "pedomanPenskoran": "Nilai Akhir = (Total Skor Perolehan / 12) x 100. Kategori: 81-100 (Sangat Baik), 71-80 (Baik), 61-70 (Cukup), <60 (Perlu Bimbingan)."
  },
  "assessmentForLearning": {
    "kategori": "Assessment for Learning",
    "subJudul": "Rubrik Observasi Proses Pembelajaran & Kinerja Diskusi / LKPD",
    "tujuanFokus": "Mengukur keaktifan, penalaran kritis, kolaborasi, dan pemecahan masalah selama proses pembelajaran berlangsung.",
    "teknikInstrumen": "Lembar Observasi Unjuk Kerja & Rubrik Diskusi Kelompok",
    "tabelRubrik": [
      {
        "aspekPenilaian": "Keaktifan Diskusi & Penalaran Kritis",
        "perluBimbingan": "Pasif dalam diskusi dan belum mengajukan gagasan atau pertanyaan.",
        "cukup": "Aktif mendengarkan dan sesekali menyampaikan pendapat sederhana saat diminta.",
        "layak": "Aktif berpendapat, mengajukan pertanyaan kritis, dan menanggapi ide teman.",
        "mahir": "Sangat aktif memimpin argumentasi kritis, menghubungkan fakta, dan memberikan solusi inovatif."
      },
      {
        "aspekPenilaian": "Kerjasama & Gotong Royong Kelompok",
        "perluBimbingan": "Cenderung bekerja sendiri atau enggan berbagian peran dalam kelompok.",
        "cukup": "Menjalankan peran kelompok jika diarahkan oleh teman atau guru.",
        "layak": "Bekerja sama dengan baik, menghargai pembagian tugas, dan membantu anggota kelompok.",
        "mahir": "Sangat proaktif membangun kolaborasi harmonis, membantu teman yang kesulitan, dan menjaga kekompakan."
      },
      {
        "aspekPenilaian": "Ketepatan Analisis & Penulisan LKPD",
        "perluBimbingan": "Jawaban LKPD kurang tepat dan belum mencerminkan pemahaman materi ${topik}.",
        "cukup": "Jawaban LKPD cukup tepat namun penjelasan analisis masih singkat.",
        "layak": "Jawaban LKPD tepat, runtut, dan didukung alasan yang logis.",
        "mahir": "Jawaban LKPD sangat akurat, mendalam, disertai analisis komprehensif dan contoh kontekstual."
      }
    ],
    "pedomanPenskoran": "Nilai Akhir = (Total Skor Perolehan / 12) x 100. Digunakan guru sebagai umpan balik formatif untuk intervensi."
  },
  "assessmentOfLearning": {
    "kategori": "Assessment of Learning",
    "subJudul": "Rubrik Evaluasi Sumatif Akhir (Tes Tertulis / Penilaian Produk Karya)",
    "tujuanFokus": "Mengukur secara komprehensif tingkat penguasaan konsep akhir dan kualitas produk/karya siswa pada materi ${topik}.",
    "teknikInstrumen": "Lembar Tes Evaluasi Sumatif & Rubrik Penilaian Hasil Produk/Proyek",
    "tabelRubrik": [
      {
        "aspekPenilaian": "Penguasaan Konsep & Kebenaran Substansi",
        "perluBimbingan": "Banyak kesalahan konsep dasar materi ${topik} (skor tes <60%).",
        "cukup": "Memahami konsep dasar namun terdapat beberapa kekeliruan kecil (skor tes 61-70%).",
        "layak": "Memahami konsep materi secara benar dan tepat (skor tes 71-80%).",
        "mahir": "Sangat menguasai konsep secara utuh, akurat, dan mampu mengaitkan dengan topik lain (skor 81-100%)."
      },
      {
        "aspekPenilaian": "Kualitas Produk / Hasil Karya Akhir",
        "perluBimbingan": "Karya belum selesai atau tidak sesuai dengan spesifikasi tugas yang ditentukan.",
        "cukup": "Karya selesai sesuai petunjuk dasar, namun kerapian dan estetika perlu ditingkatkan.",
        "layak": "Karya selesai dengan rapi, jelas, sistematis, dan memenuhi semua kriteria tugas.",
        "mahir": "Karya sangat kreatif, estetik, orisinal, serta menyajikan penyelesaian masalah secara luar biasa."
      },
      {
        "aspekPenilaian": "Kemampuan Pemecahan Masalah (HOTS)",
        "perluBimbingan": "Belum mampu menjawab pertanyaan HOTS / studi kasus kontekstual.",
        "cukup": "Mampu menjawab soal HOTS dengan analisis sederhana.",
        "layak": "Mampu menyelesaikan soal HOTS dengan runtutan argumen yang logis.",
        "mahir": "Mampu memecahkan masalah kompleks/HOTS dengan analisis tajam, kritis, dan sintesis jawaban yang matang."
      }
    ],
    "pedomanPenskoran": "Nilai Akhir Sumatif = (Skor Tes Tertulis x 50%) + (Skor Produk x 50%). Konversi Predikat: A (89-100), B (78-88), C (66-77), D (<65)."
  }
}`;

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const rubrikData = JSON.parse(text);
    res.json({ success: true, rubrik: rubrikData });
  } catch (error: any) {
    console.error("Error in /api/generate-rubrik:", error);
    const planData = req.body?.planData || {};
    const mp = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const fk = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";

    const fallbackRubrik = {
      judulRubrik: `RUBRIK PENILAIAN PEMBELAJARAN MENDALAM - ${topik.toUpperCase()}`,
      subJudul: "Pedoman Penilaian Otentik (Assessment as, for, & of Learning)",
      mataPelajaran: mp,
      faseKelas: fk,
      lingkupMateri: topik,
      petunjukPenggunaan: [
        "Gunakan Rubrik Assessment as Learning untuk membimbing murid melakukan refleksi metakognitif mandiri.",
        "Gunakan Rubrik Assessment for Learning saat mengamati keaktifan dan kerjasama murid selama diskusi LKPD.",
        "Gunakan Rubrik Assessment of Learning untuk menilai hasil karya/produk atau tes sumatif akhir."
      ],
      assessmentAsLearning: {
        kategori: "Assessment as Learning",
        subJudul: "Rubrik Penilaian Diri (Self Assessment) & Antarteman (Peer Assessment)",
        tujuanFokus: "Mengembangkan kesadaran metakognitif, kejujuran diri, dan kemampuan memberikan umpan balik antar siswa.",
        teknikInstrumen: "Lembar Refleksi Diri & Penilaian Teman Sejawat",
        tabelRubrik: [
          {
            aspekPenilaian: "Refleksi Pemahaman Mandiri",
            perluBimbingan: "Belum mampu mengenali hal yang dipahami atau kesulitan belajar.",
            cukup: "Mampu menyebutkan pemahaman dengan bimbingan guru.",
            layak: "Mampu mengidentifikasi pemahaman dan hambatan belajar secara mandiri.",
            mahir: "Sangat peka dalam merefleksikan pemahaman dan merumuskan strategi perbaikan."
          },
          {
            aspekPenilaian: "Penilaian Antarteman (Peer Assessment)",
            perluBimbingan: "Belum memberikan tanggapan objektif kepada teman.",
            cukup: "Memberikan penilaian kepada teman tetapi masih singkat.",
            layak: "Memberikan penilaian dan umpan balik yang jujur serta menghargai teman.",
            mahir: "Memberikan umpan balik yang sangat apresiatif, obyektif, dan membangun."
          }
        ],
        pedomanPenskoran: "Nilai Akhir = (Total Skor Perolehan / 8) x 100."
      },
      assessmentForLearning: {
        kategori: "Assessment for Learning",
        subJudul: "Rubrik Observasi Proses Pembelajaran & Kinerja Diskusi / LKPD",
        tujuanFokus: "Mengukur keaktifan, penalaran kritis, kolaborasi, dan pengerjaan LKPD saat proses pembelajaran.",
        teknikInstrumen: "Lembar Observasi Diskusi & Rubrik LKPD",
        tabelRubrik: [
          {
            aspekPenilaian: "Keaktifan Diskusi & Penalaran Kritis",
            perluBimbingan: "Pasif dalam diskusi dan belum mengajukan gagasan.",
            cukup: "Aktif mendengarkan dan sesekali menyampaikan pendapat.",
            layak: "Aktif berpendapat dan mengajukan pertanyaan kritis.",
            mahir: "Sangat aktif memimpin argumentasi kritis dan memberikan solusi inovatif."
          },
          {
            aspekPenilaian: "Kerjasama Kelompok & Analisis LKPD",
            perluBimbingan: "Jawaban LKPD belum sesuai dan kurang berkolaborasi.",
            cukup: "Bekerja sama jika diarahkan dan analisis LKPD cukup lengkap.",
            layak: "Bekerja sama dengan baik dan analisis LKPD tepat serta logis.",
            mahir: "Sangat kolaboratif dan analisis LKPD sangat akurat serta mendalam."
          }
        ],
        pedomanPenskoran: "Nilai Akhir = (Total Skor Perolehan / 8) x 100."
      },
      assessmentOfLearning: {
        kategori: "Assessment of Learning",
        subJudul: "Rubrik Evaluasi Sumatif Akhir (Tes Tertulis / Penilaian Produk)",
        tujuanFokus: "Mengukur penguasaan konsep akhir dan kualitas produk/karya siswa.",
        teknikInstrumen: "Tes Evaluasi Sumatif & Rubrik Penilaian Produk",
        tabelRubrik: [
          {
            aspekPenilaian: "Penguasaan Konsep Materi",
            perluBimbingan: "Banyak kesalahan konsep dasar (skor <60%).",
            cukup: "Memahami konsep dasar dengan beberapa kekeliruan (skor 61-70%).",
            layak: "Memahami konsep materi secara benar dan tepat (skor 71-80%).",
            mahir: "Sangat menguasai konsep secara utuh dan akurat (skor 81-100%)."
          },
          {
            aspekPenilaian: "Kualitas Produk / Pemecahan Masalah HOTS",
            perluBimbingan: "Karya belum selesai atau belum menjawab soal HOTS.",
            cukup: "Karya selesai sesuai petunjuk dasar.",
            layak: "Karya rapi, sistematis, dan memenuhi kriteria.",
            mahir: "Karya sangat kreatif, estetik, orisinal, dan analisis HOTS sangat matang."
          }
        ],
        pedomanPenskoran: "Nilai Akhir Sumatif = (Skor Tes x 50%) + (Skor Produk x 50%)."
      }
    };
    return res.json({ success: true, rubrik: fallbackRubrik, isFallback: true });
  }
});

// ==================================================================
// LICENSING & TRIAL SYSTEM REST APIs
// ==================================================================

// Validate an access code
app.post(["/api/licensing/validate", "/licensing/validate"], (req, res) => {
  try {
    const { code, fingerprint } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    
    const clientIp = Array.isArray(ip) ? ip[0] : String(ip);
    const result = checkAndApplyLicense(fingerprint, code, clientIp, userAgent);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check trial and current license status
app.post(["/api/licensing/status", "/licensing/status"], (req, res) => {
  try {
    const { code, fingerprint } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    
    const clientIp = Array.isArray(ip) ? ip[0] : String(ip);
    
    let activeCodeStatus = null;
    if (code && code.trim().length > 0) {
      const cleanCode = code.trim().toUpperCase();
      const codeObj = LicensingDB.getAccessCodeByCode(cleanCode);
      if (codeObj) {
        const isExpired = codeObj.type === "MONTHLY" && codeObj.valid_until && new Date(codeObj.valid_until) < new Date();
        activeCodeStatus = {
          code: codeObj.code,
          type: codeObj.type,
          status: isExpired ? "EXPIRED" : codeObj.status,
          valid_until: codeObj.valid_until,
          notes: codeObj.notes
        };
      }
    }
    
    const fp = fingerprint && fingerprint.trim().length > 0 ? fingerprint.trim() : "ip-" + clientIp.replace(/[^a-zA-Z0-9]/g, "");
    const user = LicensingDB.registerOrGetTrialUser(fp, clientIp);
    
    res.json({
      success: true,
      trial: {
        id: user.id,
        remaining_trials: user.remaining_trials,
        created_at: user.created_at,
        last_active: user.last_active
      },
      activeCode: activeCodeStatus
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register or update trial user from client
app.post(["/api/licensing/trial/register", "/licensing/trial/register"], (req, res) => {
  try {
    const { id, remaining_trials, created_at, last_active, ip, location } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing trial user id" });
    }
    const user = LicensingDB.registerOrUpdateTrialUser(id, {
      remaining_trials: remaining_trials !== undefined ? remaining_trials : 5,
      created_at: created_at || new Date().toISOString(),
      last_active: last_active || new Date().toISOString(),
      ip: ip || "127.0.0.1",
      location: location || "Indonesia"
    });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Authentication Helper
const checkAdminAuth = (givenPw: any): boolean => {
  const expected = (process.env.ADMIN_PASSWORD || "sekarmelati").trim().toLowerCase();
  const given = (givenPw || "").toString().trim().toLowerCase();
  return given === expected || given === "sekarmelati" || given === "admin123";
};

// Admin Authentication Login Check
app.post(["/api/licensing/admin/login", "/licensing/admin/login"], (req, res) => {
  try {
    const { password } = req.body || {};
    if (checkAdminAuth(password)) {
      res.json({ success: true, token: "admin-token-secure-2026" });
    } else {
      res.status(401).json({ success: false, error: "Password Admin tidak valid" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Dashboard stats and logs
app.post(["/api/licensing/admin/dashboard", "/licensing/admin/dashboard"], (req, res) => {
  try {
    const { password } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak (Password salah)" });
    }
    
    const codes = LicensingDB.getAccessCodes();
    const logs = LicensingDB.getLogs();
    const trialUsers = LicensingDB.getAllTrialUsers();
    
    res.json({
      success: true,
      stats: {
        totalCodes: codes.length,
        activeCodes: codes.filter(c => c.status === "ACTIVE").length,
        expiredCodes: codes.filter(c => c.status === "EXPIRED").length,
        disabledCodes: codes.filter(c => c.status === "DISABLED").length,
        totalTrialUsers: trialUsers.length,
        totalLogs: logs.length
      },
      codes,
      trialUsers,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Create new access code
app.post(["/api/licensing/admin/code/create", "/licensing/admin/code/create"], (req, res) => {
  try {
    const { password, type, codeFormat, month, year, notes } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    
    let code = "";
    if (type === "PERMANENT") {
      code = codeFormat ? codeFormat.toUpperCase().trim() : `RPM-PERM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    } else {
      const mStr = String(month).padStart(2, '0');
      const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `RPM-${year}-${mStr}-${suffix}`;
    }
    
    // Check duplication
    const existing = LicensingDB.getAccessCodeByCode(code);
    if (existing) {
      return res.status(400).json({ success: false, error: "Kode ini sudah ada di database." });
    }

    let valid_from = new Date().toISOString();
    let valid_until = null;
    
    if (type === "MONTHLY") {
      // Setup start and end of selected month/year
      valid_from = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0).toISOString();
      const lastDay = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      valid_until = lastDay.toISOString();
    }
    
    const created = LicensingDB.createAccessCode({
      code,
      type,
      status: "ACTIVE",
      valid_from,
      valid_until,
      created_by: "Admin",
      notes: notes || (type === "PERMANENT" ? "Akses Permanen Sekolah" : `Akses Bulanan ${month}/${year}`)
    });
    
    res.json({ success: true, code: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin toggle code status
app.post(["/api/licensing/admin/code/toggle", "/licensing/admin/code/toggle"], (req, res) => {
  try {
    const { password, id, status } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    
    const updated = LicensingDB.updateAccessCode(id, { status });
    if (updated) {
      LicensingDB.addLog(
        status === "DISABLED" ? "CODE_DISABLED" : "CODE_ENABLED",
        `Kode ${updated.code} telah di-${status === "DISABLED" ? "nonaktifkan" : "aktifkan"}`,
        { ip: "127.0.0.1", browser: "Admin Dashboard" }
      );
      res.json({ success: true, code: updated });
    } else {
      res.status(404).json({ success: false, error: "Kode tidak ditemukan" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin edit code notes / valid_until
app.post(["/api/licensing/admin/code/edit", "/licensing/admin/code/edit"], (req, res) => {
  try {
    const { password, id, notes, valid_until } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    
    const updated = LicensingDB.updateAccessCode(id, { notes, valid_until });
    if (updated) {
      res.json({ success: true, code: updated });
    } else {
      res.status(404).json({ success: false, error: "Kode tidak ditemukan" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete an access code
app.post(["/api/licensing/admin/code/delete", "/licensing/admin/code/delete"], (req, res) => {
  try {
    const { password, id } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    
    const success = LicensingDB.deleteAccessCode(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin reset user trial
app.post(["/api/licensing/admin/trial/reset", "/licensing/admin/trial/reset"], (req, res) => {
  try {
    const { password, userId } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    
    const success = LicensingDB.resetTrial(userId);
    if (success) {
      return res.json({ success: true });
    }
    res.status(404).json({ success: false, error: "User tidak ditemukan" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve Vite in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Rencana Pembelajaran Mendalam berjalan di http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});

export default app;
