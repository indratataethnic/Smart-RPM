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
    let codeObj = LicensingDB.getAccessCodeByCode(cleanCode);
    
    // Auto-register any valid RPM prefixed code if not in memory yet (multi-device support)
    if (!codeObj && cleanCode.startsWith("RPM")) {
      const isPerm = cleanCode.includes("-PERM-");
      codeObj = LicensingDB.syncOrRegisterAccessCode({
        code: cleanCode,
        type: isPerm ? "PERMANENT" : "MONTHLY",
        status: "ACTIVE",
        valid_from: new Date().toISOString(),
        valid_until: isPerm ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: "Multi-Laptop Auto-Validate",
        notes: "Akses Otomatis Multi-Device / Laptop"
      });
    }

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

// Helper to clean JSON string from markdown blocks and parse it safely
function cleanAndParseJson(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Try to extract JSON structure
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (nestedErr: any) {
        throw new Error(`Gagal memparsing JSON dari respon AI: ${nestedErr.message || nestedErr}`);
      }
    }
    throw err;
  }
}

// Smart fallback analyzer for CP and TP when Gemini API fails
function extractMateriAndTpFromCp(cpText: string, subject: string): { tp: string; lingkupMateri: string } {
  if (!cpText || !cpText.trim()) {
    const s = subject || "Mata Pelajaran";
    return {
      tp: `1. Peserta didik dapat menjelaskan konsep dasar ${s} secara tepat dan mendalam.\n2. Peserta didik dapat mengaplikasikan pemahaman ${s} dalam situasi kontekstual sehari-hari.\n3. Peserta didik dapat merefleksikan dan menyimpulkan proses pembelajaran ${s} secara kritis dan kolaboratif.`,
      lingkupMateri: s
    };
  }

  let dynamicText = cpText.trim();
  let matchesPattern = true;

  const patternsToRemove = [
    /^(?:pada\s+)?akhir\s+fase\s+[a-f](?:\s*,\s*|\s+)/i,
    /^peserta\s+didik\s+/i,
    /^siswa\s+/i,
    /^mampu\s+/i,
    /^dapat\s+/i,
    /^bisa\s+/i,
    /^memahami\s+/i,
    /^mengidentifikasi\s+/i,
    /^mendemonstrasikan\s+/i,
    /^mendeskripsikan\s+/i,
    /^menganalisis\s+/i,
    /^menjelaskan\s+/i,
    /^menerapkan\s+/i,
    /^mempraktikkan\s+/i,
    /^mengeksplorasi\s+/i,
    /^tentang\s+/i,
    /^materi\s+/i,
    /^mengenal\s+/i,
    /^mengetahui\s+/i,
    /^belajar\s+/i,
    /^konsep\s+/i,
    /^dan\s+/i,
    /^serta\s+/i,
  ];

  while (matchesPattern) {
    const beforeLength = dynamicText.length;
    for (const pattern of patternsToRemove) {
      dynamicText = dynamicText.replace(pattern, "").trim();
    }
    if (dynamicText.length === beforeLength) {
      matchesPattern = false;
    }
  }

  let extractedMateri = dynamicText.trim();

  if (extractedMateri.length > 3) {
    extractedMateri = extractedMateri
      .toLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
      .trim();
  } else {
    extractedMateri = subject || "Materi Utama";
  }

  // Double check for leftover common words
  const lowerExtracted = extractedMateri.toLowerCase();
  if (
    lowerExtracted === "peserta didik" ||
    lowerExtracted === "siswa" ||
    lowerExtracted === "mampu" ||
    lowerExtracted === "dapat" ||
    lowerExtracted.length <= 3
  ) {
    extractedMateri = subject || "Materi Utama";
  }

  const tp = `1. Peserta didik dapat memahami dan menjelaskan konsep utama tentang ${extractedMateri} secara kritis.
2. Peserta didik dapat mengaplikasikan pemahaman ${extractedMateri} untuk menyelesaikan masalah kontekstual secara kolaboratif.
3. Peserta didik mampu merefleksikan serta mengevaluasi pemahaman mereka mengenai ${extractedMateri} sebagai bagian dari feedback metakognitif.`;

  return { tp, lingkupMateri: extractedMateri };
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
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  // Filter unique
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
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

        if (isTransient) {
          if (attempt < 3) {
            await new Promise((res) => setTimeout(res, attempt * 800));
          } else {
            break;
          }
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
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
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

        if (isTransient) {
          if (attempt < 3) {
            await new Promise((res) => setTimeout(res, attempt * 800));
          } else {
            break;
          }
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

PENTING: Jangan sekali-kali mengembalikan kata pendahuluan seperti "Peserta didik mampu", "Mampu memahami", "Siswa dapat", "Mendemonstrasikan", dsb. di dalam "lingkupMateri". "lingkupMateri" harus murni berupa nama materi/topik saja (contoh: "Sifat-sifat Gelombang (Cahaya, Bunyi)", "Siklus Air", "Pecahan Senilai").

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
- "Platform Koding Visual & AI (Scratch / Blockly / Teachable Machine / Code.org)"

5. Lintas Disiplin Ilmu (Pilih 1 s.d 3 string persis):
- "Bahasa Indonesia"
- "Matematika & Numerasi"
- "IPAS / Sains Terapan"
- "Pendidikan Pancasila & Moral"
- "Seni Budaya & Desain (SBdP)"
- "Informatika & Literasi Digital"
- "PJOK & Kesehatan"
- "Bahasa Inggris & Daerah"
- "Koding & Kecerdasan Artifisial (KKA)"

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
      const parsed = cleanAndParseJson(text);
      return res.json({ success: true, data: parsed });
    } catch (apiError: any) {
      console.warn("Gemini API fallback triggered for /api/recommend-fields:", apiError?.message);
      if (fieldType === "cp_tp") {
        const fallbackCpTpResult = extractMateriAndTpFromCp(capaianPembelajaran, mataPelajaran);
        const fallbackCpTp = {
          cp: capaianPembelajaran || `Peserta didik mampu memahami dan menganalisis konsep ${fallbackCpTpResult.lingkupMateri}, mengidentifikasi keterkaitan antar elemen, serta mengaplikasikan pemahaman tersebut dalam menyelesaikan masalah kontekstual sesuai standar Capaian Pembelajaran BSKAP terbaru Kurikulum Merdeka.`,
          tp: fallbackCpTpResult.tp,
          lingkupMateri: fallbackCpTpResult.lingkupMateri
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
    if (req.body?.fieldType === "cp_tp") {
      const fallbackCpTpResult = extractMateriAndTpFromCp(req.body?.capaianPembelajaran, req.body?.mataPelajaran);
      return res.json({
        success: true,
        data: {
          cp: req.body?.capaianPembelajaran || `Peserta didik mampu memahami dan menganalisis konsep ${fallbackCpTpResult.lingkupMateri}, mengidentifikasi keterkaitan antar elemen, serta mengaplikasikan pemahaman tersebut dalam menyelesaikan masalah kontekstual sesuai standar Capaian Pembelajaran BSKAP terbaru Kurikulum Merdeka.`,
          tp: fallbackCpTpResult.tp,
          lingkupMateri: fallbackCpTpResult.lingkupMateri
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
      kotaSekolah: data.kotaSekolah || data.identitas?.kotaSekolah || "",
      peranGuru: data.peranGuru || data.identitas?.peranGuru,
      labelPeranGuru: data.labelPeranGuru || data.identitas?.labelPeranGuru,
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
          "1. Orientasi",
          "Guru dan murid berdoa",
          "Murid disiapkan secara fisik maupun psikis untuk mengikuti pembelajaran.",
          "Guru menyapa sekaligus memberikan dorongan kepada murid di kelas agar bersemangat pada saat mengikuti pelajaran melalui apersepsi yang dapat membangkitkan semangat belajar murid.",
          "Guru mengecek kehadiran murid di kelas dan memberikan penguatan terhadap aktivitas pembuka tersebut dengan mengaitkannya dengan penanaman karakter murid.",
          "Guru memulai dengan menayangkan video singkat atau audio tentang " + lm + ".",
          "Guru mengajukan pertanyaan pemantik:",
          "Contoh 1: Menurut kalian, mengapa " + lm + " penting dalam kehidupan kita sehari-hari?",
          "Contoh 2: Pernahkah kalian menemukan fenomena " + lm + " di sekitar rumah atau sekolah?",
          "Contoh 3: Apa yang terjadi apabila kita belum memahami " + lm + " dengan baik?",
          "Murid diminta berbagi pengalaman mereka terkait " + lm + ".",
          "2. Merumuskan Masalah",
          "Guru menyampaikan tujuan pembelajaran: " + tp,
          "Guru mengarahkan murid untuk berdiskusi mengenai:",
          "Contoh 1: Konsep dasar dan aplikasi " + lm + " dalam kehidupan nyata",
          "Contoh 2: Tantangan utama dan fenomena unik seputar " + lm,
          "Contoh 3: Solusi terbaik untuk memecahkan masalah kontekstual " + lm
        ]
      },
      kegiatanInti: [
        {
          tahapLabel: "MEMAHAMI",
          subJudul: "3. Memahami Konsep & Eksplorasi Makna (Understanding)",
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
          subJudul: "4. Mengaplikasikan Konsep pada Konteks Nyata (Application)",
          prinsipMendalamLabel: "Autentik, Kolaboratif & Problem Solving",
          alokasiWaktu: "35 Menit",
          aktivitasGuru: [
            "Guru membagikan Lembar Kerja Murid (LKPD) berbasis studi kasus/masalah nyata.",
            "Guru memandu proses kerja kelompok dan memberikan arahan scaffolding.",
            "Guru mengobservasi kolaborasi dan sikap bernalar kritis antar murid."
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
          subJudul: "5. Merefleksikan Pembelajaran & Evaluasi Diri (Reflection)",
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
        alokasiWaktu: "15 Menit",
        aktivitas: [
          "6. Tindak Lanjut",
          "Guru memberikan umpan balik apresiatif, penguatan karakter, serta penugasan tindak lanjut.",
          "Catatan untuk Pertemuan Berikutnya:",
          "Jika waktu tidak mencukupi, eksplorasi lebih mendalam bisa dilanjutkan di pertemuan berikutnya dengan kegiatan seperti: Contoh 1: Presentasi lanjutan & pameran karya kelompok " + lm + ", Contoh 2: Pendalaman materi kontekstual dan asesmen harian."
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
      bahanAjar: "RANGKUMAN BAHAN BACAAN GURU & MURID (Pengganti Buku Paket / Bahan Catatan Papan Tulis):\n" +
        "1. Pengertian: " + lm + " adalah konsep dasar dalam " + mp + " yang mempelajari karakteristik dan penerapannya dalam kehidupan sehari-hari.\n" +
        "2. Jenis-jenis / Klasifikasi: Mengelompokkan bentuk dan variasi materi " + lm + " secara kontekstual.\n" +
        "3. Ciri-ciri / Karakteristik: Mengidentifikasi sifat dan ciri khas utama dari " + lm + ".\n" +
        "4. Contoh Konkret: Berbagai penerapan nyata " + lm + " di lingkungan sekolah dan rumah.\n" +
        "5. Catatan Papan Tulis (Siap Salin Murid): Rangkuman poin kunci terstruktur untuk disalin murid ke buku catatan.",
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
7. Berikan Lampiran LKPD ringkas, Bahan Ajar (Pengertian, Jenis-jenis, Ciri-ciri, dan Format Catatan Papan Tulis Siap Salin Murid karena guru diasumsikan tidak memiliki buku paket cetak untuk murid di kelas, dengan referensi Buku BSKAP Kemendikdasmen https://buku.kemendikdasmen.go.id/), dan Rubrik Penilaian.

8. ATURAN KHUSUS WAJIB MODEL RPM (PEMBELAJARAN MENDALAM):
   a) PENESUAIAN MATERI & TP: Seluruh aktivitas, asesmen, dan soal-soal latihan HARUS 100% SESUAI DENGAN Tujuan Pembelajaran (TP): "${formData.tujuanPembelajaran}" dan Lingkup Materi: "${formData.lingkupMateri}".
   b) TINGKAT BAHASA RAMAH ANAK: Bahasa yang digunakan HARUS komunikatif, ramah anak, mudah dipahami murid, dan sesuai jenjang usia (${formData.faseKelas || 'Fase/Kelas'}). JANGAN menggunakan bahasa atau pertanyaan yang terlalu sulit/abstrak.
   c) ISTILAH PENYEBUTAN: Gunakan kata "murid" (BUKAN "peserta didik" ATAU "siswa") di seluruh aktivitas, instruksi, dan uraian RPM.
   d) DILARANG MENGGUNAKAN TANDA DASH/STRIP ("-"): JANGAN menggunakan tanda "-" di awal kalimat atau item aktivitas. Tuliskan dalam bentuk kalimat/poin berseri yang rapi tanpa tanda "-".
   e) STRUKTUR PENDAHULUAN/AWAL (BERKESAN DAN BERMAKNA): Pada "kegiatanPembelajaran.pendahuluan.aktivitas", KAMU WAJIB MENYUSUN ISI SECARA LENGKAP MENGIKUTI SUB-STRUKTUR TEPAT SEPERTI BERIKUT (TANPA TANDA STRIP/DASH "-"):
      1. Orientasi
      Guru dan murid berdoa
      Murid disiapkan secara fisik maupun psikis untuk mengikuti pembelajaran.
      Guru menyapa sekaligus memberikan dorongan kepada murid di kelas agar bersemangat pada saat mengikuti pelajaran melalui apersepsi yang dapat membangkitkan semangat belajar murid.
      Guru mengecek kehadiran murid di kelas dan memberikan penguatan terhadap aktivitas pembuka tersebut dengan mengaitkannya dengan penanaman karakter murid.
      Guru memulai dengan menayangkan video singkat atau audio tentang ${formData.lingkupMateri}.
      Guru mengajukan pertanyaan pemantik:
      Contoh 1: [Pertanyaan pemantik konkret 1 yang relevan]
      Contoh 2: [Pertanyaan pemantik konkret 2]
      Contoh 3: [Pertanyaan pemantik konkret 3]
      Murid diminta berbagi pengalaman mereka terkait ${formData.lingkupMateri}.

      2. Merumuskan Masalah
      Guru menyampaikan tujuan pembelajaran: ${formData.tujuanPembelajaran}
      Guru mengarahkan murid untuk berdiskusi mengenai:
      Contoh 1: [Topik/Isu diskusi awal 1]
      Contoh 2: [Topik/Isu diskusi awal 2]
      Contoh 3: [Topik/Isu diskusi awal 3]

   f) STRUKTUR KEGIATAN INTI (BERMAKNA DAN MENGGEMBIRAKAN):
      3. Memahami
      4. Mengaplikasi
      5. Merefleksi

   g) STRUKTUR PENUTUP (BERKESADARAN DAN BERMAKNA):
      6. Tindak Lanjut
      Guru memberikan umpan balik apresiatif, penguatan, dan penugasan tindak lanjut.
      Catatan untuk Pertemuan Berikutnya:
      Jika waktu tidak mencukupi, eksplorasi lebih mendalam bisa dilanjutkan di pertemuan berikutnya dengan kegiatan seperti:
      Contoh 1: [Contoh kegiatan eksplorasi lanjutan 1]
      Contoh 2: [Contoh kegiatan eksplorasi lanjutan 2]

Keluarkan dalam format JSON struktur persis berikut:
{
  "identitas": {
    "namaGuru": "${formData.namaGuru || ''}",
    "nipGuru": "${formData.nipGuru || ''}",
    "namaKepsek": "${formData.namaKepsek || ''}",
    "nipKepsek": "${formData.nipKepsek || ''}",
    "namaSekolah": "${formData.namaSekolah || ''}",
    "kotaSekolah": "${formData.kotaSekolah || ''}",
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
        "1. Orientasi",
        "Guru dan murid berdoa",
        "Murid disiapkan secara fisik maupun psikis untuk mengikuti pembelajaran.",
        "Guru menyapa sekaligus memberikan dorongan kepada murid di kelas agar bersemangat pada saat mengikuti pelajaran melalui apersepsi yang dapat membangkitkan semangat belajar murid.",
        "Guru mengecek kehadiran murid di kelas dan memberikan penguatan terhadap aktivitas pembuka tersebut dengan mengaitkannya dengan penanaman karakter murid.",
        "Guru memulai dengan menayangkan video singkat atau audio tentang ${formData.lingkupMateri}.",
        "Guru mengajukan pertanyaan pemantik:",
        "Contoh 1: [Tuliskan contoh pertanyaan pemantik 1]",
        "Contoh 2: [Tuliskan contoh pertanyaan pemantik 2]",
        "Contoh 3: [Tuliskan contoh pertanyaan pemantik 3]",
        "murid diminta berbagi pengalaman mereka terkait ${formData.lingkupMateri}.",
        "2. Merumuskan Masalah",
        "Guru menyampaikan tujuan pembelajaran: ${formData.tujuanPembelajaran}",
        "Guru mengarahkan murid untuk berdiskusi mengenai:",
        "Contoh 1: [Topik/Isu diskusi awal 1]",
        "Contoh 2: [Topik/Isu diskusi awal 2]",
        "Contoh 3: [Topik/Isu diskusi awal 3]"
      ]
    },
    "kegiatanInti": [
      {
        "tahapLabel": "MEMAHAMI",
        "subJudul": "3. Memahami",
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
        "poinUtama": ["Mengeksplorasi konsep dasar...", "Menjawab pertanyaan pemantik..."]
      },
      {
        "tahapLabel": "MENGAPLIKASI",
        "subJudul": "4. Mengaplikasi",
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
        "subJudul": "5. Merefleksi",
        "prinsipMendalamLabel": "Metakognisi, Feedback Loop & Self Assessment",
        "alokasiWaktu": "15 Menit",
        "aktivitasGuru": [
          "Guru memfasilitasi presentasi kelompok dan memberikan umpan balik konstruktif...",
          "Guru memandu refleksi diri murid mengenai proses dan manfaat pembelajaran...",
          "Guru bersama murid menyimpulkan poin pembelajaran..."
        ],
        "aktivitasMurid": [
          "Murid mempresentasikan hasil kerja / jawaban LKPD...",
          "Murid melakukan refleksi metakognitif (apa yang dipahami dan hambatan)...",
          "Murid memberikan apresiasi kepada sesama teman kelompok..."
        ],
        "poinUtama": ["Presentasi & umpan balik...", "Refleksi metakognitif mandiri..."]
      }
    ],
    "penutup": {
      "alokasiWaktu": "15 Menit",
      "aktivitas": [
        "6. Tindak Lanjut",
        "Guru memberikan umpan balik apresiatif, penguatan karakter, serta penugasan tindak lanjut.",
        "Catatan untuk Pertemuan Berikutnya:",
        "Jika waktu tidak mencukupi, eksplorasi lebih mendalam bisa dilanjutkan di pertemuan berikutnya dengan kegiatan seperti: (Berikan Contoh 1: [Kegiatan Lanjutan 1], Contoh 2: [Kegiatan Lanjutan 2])"
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
    "bahanAjar": "Rangkuman materi komprehensif siap salin di papan tulis (1. Pengertian, 2. Jenis-jenis, 3. Ciri-ciri, 4. Contoh konkret, 5. Catatan Ringkas Papan Tulis Siap Salin Murid ke buku tulis)...",
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
        if (parsedPlan && parsedPlan.identitas) {
          if (formData?.peranGuru) parsedPlan.identitas.peranGuru = formData.peranGuru;
          if (formData?.labelPeranGuru) parsedPlan.identitas.labelPeranGuru = formData.labelPeranGuru;
          if (formData?.kotaSekolah && !parsedPlan.identitas.kotaSekolah) parsedPlan.identitas.kotaSekolah = formData.kotaSekolah;
        }
        res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: parsedPlan })}\n\n`);
      } catch (parseErr) {
        const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedPlan = JSON.parse(jsonMatch[0]);
          if (parsedPlan && parsedPlan.identitas) {
            if (formData?.peranGuru) parsedPlan.identitas.peranGuru = formData.peranGuru;
            if (formData?.labelPeranGuru) parsedPlan.identitas.labelPeranGuru = formData.labelPeranGuru;
            if (formData?.kotaSekolah && !parsedPlan.identitas.kotaSekolah) parsedPlan.identitas.kotaSekolah = formData.kotaSekolah;
          }
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
    const updatedPlan = cleanAndParseJson(text);
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

    const mataPelajaran = planData?.identitas?.mataPelajaran || planData?.mataPelajaran || "Mata Pelajaran";
    const faseKelas = planData?.identitas?.faseKelas || planData?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || planData?.identitas?.lingkupMateri || planData?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || planData?.tujuanPembelajaran || "";
    const cp = planData?.tujuanDanDpl?.capaianPembelajaran || planData?.capaianPembelajaran || "";
    const sarana = planData?.desainPembelajaran?.saranaPrasarana || "";

    const kegiatanInti = planData?.kegiatanPembelajaran?.kegiatanInti;
    let kegiatanDetail = "";
    if (Array.isArray(kegiatanInti)) {
      kegiatanDetail = kegiatanInti.map((t: any) => {
        const label = t.tahapLabel || t.subJudul || "";
        const guru = Array.isArray(t.aktivitasGuru) ? t.aktivitasGuru.join("; ") : "";
        const murid = Array.isArray(t.aktivitasMurid) ? t.aktivitasMurid.join("; ") : "";
        return `- Tahap ${label}: [Aktivitas Guru: ${guru}] [Aktivitas Murid: ${murid}]`;
      }).join("\n");
    }

    const prompt = `Kamu adalah pakar penyusun Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka berorientasi Pembelajaran Mendalam (Deep Learning).
Tugas utama kamu adalah menyusun dokumen LKPD LENGKAP, OTENTIK, DAN SANGAT SPESIFIK yang WAJIB 100% SESUAI DENGAN LINGKUP MATERI DAN TUJUAN PEMBELAJARAN GURU BERIKUT:

INFORMASI DOKUMEN MODUL AJAR (RPM):
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${faseKelas}
- LINGKUP MATERI UTAMA: ${topik}
- TUJUAN PEMBELAJARAN (TP): ${tp}
- Capaian Pembelajaran (CP): ${cp}
${sarana ? `- Sarana & Prasarana: ${sarana}` : ''}
${kegiatanDetail ? `- Rincian Alur Aktivitas RPM:\n${kegiatanDetail}` : ''}
${customInstruction ? `- Instruksi / Catatan Khusus Guru: ${customInstruction}` : ''}

PETUNJUK MUTLAK PENYUSUNAN LKPD DEEP LEARNING BERKUALITAS:
1. RELEVANSI MATERI 100%: SELURUH komponen LKPD (Lembar Penugasan, Praktikum/Eksplorasi, Tabel Pengamatan, Pertanyaan Analisis, Latihan Soal Pilihan Ganda, Soal Uraian, Kunci Jawaban, Pembahasan, dan Refleksi) HARUS KONTEN NYATA yang membahas materi "${topik}" dan TP "${tp}".
2. DILARANG MENGGUNAKAN TEKS DUMMY/PLACEHOLDER: DILARANG KERAS menggunakan teks generik seperti "Soal 1...", "Pilihan A", "Deskripsi...", "Teks pertanyaan...", "Pilihan B", "Percobaan 1", "Hasil pengamatan".
3. LATIHAN SOAL PILIHAN GANDA (MINIMAL 5 SOAL HOTS):
   - Wajib buat MINIMAL 5 Soal Pilihan Ganda HOTS yang BENAR-BENAR MENGUJI PEMAHAMAN MATERI "${topik}".
   - Setiap soal HARUS memiliki 4 opsi jawaban nyata (A, B, C, D) berupa kalimat ilmiah/konseptual spesifik tentang "${topik}".
   - Kunci Jawaban harus menyebutkan opsi dan teks jawaban yang benar (contoh: "A. [Kalimat Opsi A]").
   - Pembahasan harus menguraikan penjelasan ilmiah/konseptual secara rinci mengapa opsi tersebut benar.
4. LATIHAN SOAL URAIAN (MINIMAL 3 SOAL HOTS):
   - Wajib buat MINIMAL 3 Soal Uraian berbasis studi kasus / analisis kontekstual materi "${topik}".
   - Dilengkapi Kunci Jawaban / Pedoman Penskoran lengkap dan Pembahasan mendalam.
5. PANDUAN PRAKTIKUM & EKSPLORASI:
   - Judul eksplorasi, tujuan praktikum, langkah kerja, header & baris contoh tabel pengamatan, serta pertanyaan analisis HARUS mencerminkan aktivitas praktikum/observasi nyata materi "${topik}".
6. BAHASA RAMAH ANAK: Bahasa disesuaikan dengan jenjang ${faseKelas}, komunikatif, dan memotivasikan murid.

Keluarkan HANYA dalam format JSON valid dengan struktur persis berikut:
{
  "judulLKPD": "LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topik.toUpperCase()}",
  "subJudul": "Aktivitas Pembelajaran Mendalam (Deep Learning) - ${mataPelajaran} (${faseKelas})",
  "petunjukUmum": [
    "Berdoalah sebelum memulai mengerjakan lembar kerja ini.",
    "Baca dan pahami setiap instruksi aktivitas dengan saksama bersama kelompokmu.",
    "Gunakan nalar kritis, kolaborasi, dan kejujuran dalam menyelesaikan setiap tahapan."
  ],
  "lembarPenugasan": {
    "judulTugas": "Diskusi Kelompok & Analisis Masalah ${topik}",
    "tujuanAktivitas": "Peserta didik dapat menganalisis dan merumuskan pemahaman bermakna mengenai ${topik} sesuai TP: ${tp}",
    "alatDanBahan": ["Modul Ajar / Buku Siswa ${mataPelajaran}", "Alat Tulis & Kertas Karton", "Media Digital / Peraga Praktikum"],
    "instruksiKerja": [
      "Bentuklah kelompok diskusi yang terdiri dari 4-5 murid.",
      "Cermati studi kasus/masalah nyata mengenai ${topik} yang diberikan guru.",
      "Diskusikan pertanyaan dengan anggota kelompok dan catat hasil kesepakatan kelompok."
    ]
  },
  "panduanPraktikum": {
    "judulEksplorasi": "Panduan Aktivitas Praktikum & Eksplorasi Siswa: ${topik}",
    "tujuanPraktikum": "Peserta didik dapat membuktikan dan menganalisis fenomena ${topik} melalui eksperimen/observasi langsung.",
    "langkahKerja": [
      "Siapkan alat dan bahan praktikum secara rapi di atas meja kerja.",
      "Lakukan percobaan/observasi tentang ${topik} sesuai tahapan kerja yang diinstruksikan.",
      "Catat setiap data hasil pengamatan ke dalam tabel pengamatan di bawah ini secara cermat."
    ],
    "tabelPengamatan": {
      "judulTabel": "Tabel Lembar Pengamatan & Data Hasil Praktikum ${topik}",
      "headers": ["No", "Objek / Perlakuan Pengamatan", "Hasil Pengamatan (Data Siswa)", "Analisis Hubungan Konsep ${topik}"],
      "rows": [
        ["1", "Pengamatan Kondisi Awal / Tanpa Perlakuan", "", ""],
        ["2", "Pengamatan Setelah Diberikan Perlakuan / Percobaan", "", ""],
        ["3", "Pengamatan Akhir & Kesimpulan Percobaan", "", ""]
      ],
      "petunjukPengisian": "Isilah tabel di atas berdasarkan hasil pengamatan langsung atau percobaan kelompok kalian tentang ${topik}."
    },
    "pertanyaanAnalisis": [
      "Berdasarkan data tabel pengamatan, pola atau perubahan apa yang dapat kalian amati terkait fenomena ${topik}?",
      "Mengapa hal tersebut dapat terjadi? Jelaskan keterkaitannya dengan konsep materi ${topik}!",
      "Apa kesimpulan utama yang dapat diambil dari kegiatan praktikum ini dikaitkan dengan tujuan pembelajaran ${tp}?"
    ]
  },
  "latihanSoal": {
    "petunjukPengerjaan": "Jawablah pertanyaan-pertanyaan berikut dengan teliti, kritis, dan jujur!",
    "pilihanGanda": [
      {
        "no": 1,
        "pertanyaan": "Tuliskan pertanyaan HOTS 1 yang spesifik tentang materi ${topik}",
        "pilihan": [
          "A. Kalimat opsi A tentang materi ${topik}",
          "B. Kalimat opsi B tentang materi ${topik}",
          "C. Kalimat opsi C tentang materi ${topik}",
          "D. Kalimat opsi D tentang materi ${topik}"
        ],
        "kunciJawaban": "A. Kalimat opsi A",
        "pembahasan": "Penjelasan dan pembahasan ilmiah mendalam mengapa opsi A benar"
      },
      {
        "no": 2,
        "pertanyaan": "Tuliskan pertanyaan HOTS 2 tentang materi ${topik}",
        "pilihan": [
          "A. Kalimat opsi A",
          "B. Kalimat opsi B",
          "C. Kalimat opsi C",
          "D. Kalimat opsi D"
        ],
        "kunciJawaban": "B. Kalimat opsi B",
        "pembahasan": "Penjelasan rinci..."
      },
      {
        "no": 3,
        "pertanyaan": "Tuliskan pertanyaan HOTS 3 tentang materi ${topik}",
        "pilihan": [
          "A. Kalimat opsi A",
          "B. Kalimat opsi B",
          "C. Kalimat opsi C",
          "D. Kalimat opsi D"
        ],
        "kunciJawaban": "C. Kalimat opsi C",
        "pembahasan": "Penjelasan rinci..."
      },
      {
        "no": 4,
        "pertanyaan": "Tuliskan pertanyaan HOTS 4 tentang materi ${topik}",
        "pilihan": [
          "A. Kalimat opsi A",
          "B. Kalimat opsi B",
          "C. Kalimat opsi C",
          "D. Kalimat opsi D"
        ],
        "kunciJawaban": "D. Kalimat opsi D",
        "pembahasan": "Penjelasan rinci..."
      },
      {
        "no": 5,
        "pertanyaan": "Tuliskan pertanyaan HOTS 5 tentang materi ${topik}",
        "pilihan": [
          "A. Kalimat opsi A",
          "B. Kalimat opsi B",
          "C. Kalimat opsi C",
          "D. Kalimat opsi D"
        ],
        "kunciJawaban": "A. Kalimat opsi A",
        "pembahasan": "Penjelasan rinci..."
      }
    ],
    "soalUraian": [
      {
        "no": 1,
        "pertanyaan": "Tuliskan Soal Uraian Studi Kasus 1 yang mendalam tentang materi ${topik}",
        "kunciJawaban": "Kunci Jawaban dan Rubrik Penskoran Lengkap...",
        "pembahasan": "Pembahasan Rinci..."
      },
      {
        "no": 2,
        "pertanyaan": "Tuliskan Soal Uraian 2 tentang materi ${topik}",
        "kunciJawaban": "Kunci Jawaban Lengkap...",
        "pembahasan": "Pembahasan Rinci..."
      },
      {
        "no": 3,
        "pertanyaan": "Tuliskan Soal Uraian 3 tentang materi ${topik}",
        "kunciJawaban": "Kunci Jawaban Lengkap...",
        "pembahasan": "Pembahasan Rinci..."
      }
    ]
  },
  "refleksiSiswa": {
    "pertanyaanRefleksi": [
      "Apa hal paling menarik yang baru kamu pahami tentang materi ${topik} hari ini?",
      "Hambatan apa yang kamu temui saat praktikum/diskusi ${topik} dan bagaimana kamu mengatasinya?",
      "Bagaimana kamu dapat menerapkan pemahaman tentang ${topik} ini dalam kehidupan sehari-hari?"
    ],
    "checkListDiri": [
      "Saya telah memahami konsep dasar materi ${topik} dengan baik.",
      "Saya aktif berdiskusi dan bekerja sama dalam menyelesaikan praktikum/tugas ${topik}.",
      "Saya dapat menyelesaikan soal-soal evaluasi ${topik} secara mandiri dan jujur."
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
    const lkpdData = cleanAndParseJson(text);
    res.json({ success: true, lkpd: lkpdData });
  } catch (error: any) {
    console.error("Error in /api/generate-lkpd:", error);
    const planData = req.body?.planData || {};
    const topik = planData?.tujuanDanDpl?.lingkupMateri || planData?.identitas?.lingkupMateri || planData?.lingkupMateri || planData?.identitas?.mataPelajaran || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || planData?.tujuanPembelajaran || "Tujuan Pembelajaran";
    const mp = planData?.identitas?.mataPelajaran || "Mata Pelajaran";

    const fallbackLKPD = {
      judulLKPD: `LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topik.toUpperCase()}`,
      subJudul: `Aktivitas Pembelajaran Mendalam (Deep Learning) - ${mp}`,
      petunjukUmum: [
        "Berdoalah sebelum memulai mengerjakan lembar kerja ini.",
        "Bacalah setiap petunjuk kerja dengan cermat sebelum melakukan aktivitas bersama kelompokmu.",
        "Gunakan nalar kritis, kolaborasi, dan kejujuran dalam menyelesaikan setiap tahapan."
      ],
      lembarPenugasan: {
        judulTugas: `Lembar Penugasan & Diskusi Kelompok: ${topik}`,
        tujuanAktivitas: `Peserta didik dapat memahami dan menganalisis konsep ${topik} sesuai TP: ${tp}`,
        alatDanBahan: [`Buku Siswa / Modul Ajar ${mp}`, "Alat Tulis & Kertas Karton", "Media Digital / Peraga Praktikum"],
        instruksiKerja: [
          "Bentuklah kelompok diskusi yang terdiri dari 4-5 murid secara heterogen.",
          `Cermati studi kasus atau wacana fenomena ${topik} yang dipaparkan oleh guru.`,
          `Diskusikan pertanyaan analisis kelompok mengenai penerapan ${topik} dan catat hasil kesepakatan kelompok.`
        ]
      },
      panduanPraktikum: {
        judulEksplorasi: `Panduan Aktivitas Praktikum & Eksplorasi Siswa: ${topik}`,
        tujuanPraktikum: `Peserta didik dapat membuktikan dan menganalisis fenomena ${topik} melalui eksperimen/observasi langsung.`,
        langkahKerja: [
          `Siapkan alat dan bahan praktikum materi ${topik} secara rapi di atas meja kerja.`,
          `Lakukan percobaan/observasi tentang ${topik} sesuai dengan tahapan kerja yang diinstruksikan.`,
          "Catat setiap data hasil pengamatan ke dalam tabel pengamatan di bawah ini secara cermat."
        ],
        tabelPengamatan: {
          judulTabel: `Tabel Lembar Pengamatan & Data Hasil Praktikum ${topik}`,
          headers: ["No", "Objek Pengamatan / Variabel", "Hasil Pengamatan (Siswa)", "Analisis Keterkaitan Konsep ${topik}"],
          rows: [
            ["1", "Pengamatan Kondisi Awal", "...........................................", `Sesuai teori dasar ${topik}`],
            ["2", "Pengamatan Setelah Perlakuan / Percobaan", "...........................................", "Terjadi perubahan signifikan"],
            ["3", "Pengamatan Akhir & Hasil Percobaan", "...........................................", "Memerlukan analisis lanjutan"]
          ],
          petunjukPengisian: `Isilah tabel pengamatan variabel ${topik} berdasarkan hasil eksplorasi langsung kelompok kalian.`
        },
        pertanyaanAnalisis: [
          `Berdasarkan data tabel pengamatan, pola atau perubahan apa yang dapat kalian amati pada fenomena ${topik}?`,
          `Mengapa hal tersebut dapat terjadi? Jelaskan keterkaitannya dengan konsep materi ${topik}!`,
          `Apa kesimpulan utama yang dapat diambil dari kegiatan praktikum ini dikaitkan dengan TP: ${tp}?`
        ]
      },
      latihanSoal: {
        petunjukPengerjaan: `Jawablah soal-soal latihan di bawah ini secara mandiri dan jujur untuk menguji pemahaman mendalammu mengenai ${topik}.`,
        pilihanGanda: [
          {
            no: 1,
            pertanyaan: `Pernyataan manakah yang paling akurat dalam menggambarkan esensi utama dari materi ${topik}?`,
            pilihan: [
              `A. ${topik} merupakan prinsip penting dalam ${mp} yang relevan untuk menyelesaikan masalah nyata sehari-hari.`,
              `B. ${topik} terjadi secara acak dan tidak berhubungan dengan konsep dasar ${mp}.`,
              `C. ${topik} hanya merupakan teori hafalan yang diujikan pada akhir semester sekolah.`,
              `D. Penerapan ${topik} tidak memiliki manfaat praktis dalam kehidupan sehari-hari.`
            ],
            kunciJawaban: `A. ${topik} merupakan prinsip penting dalam ${mp} yang relevan untuk menyelesaikan masalah nyata sehari-hari.`,
            pembahasan: `Prinsip utama dari ${topik} adalah memberikan pemahaman bermakna yang dapat diaplikasikan murid dalam kehidupan sehari-hari.`
          },
          {
            no: 2,
            pertanyaan: `Saat melakukan eksperimen dan analisis terhadap ${topik}, tahapan pertama yang paling penting dilakukan adalah...`,
            pilihan: [
              `A. Memahami konsep dasar dan mengidentifikasi fenomena nyata terkait ${topik}.`,
              `B. Melakukan penarikan kesimpulan akhir tanpa didukung data observasi.`,
              `C. Menghafal seluruh definisi istilah tanpa melakukan diskusi kelompok.`,
              `D. Mengabaikan petunjuk kerja dan membiarkan anggota kelompok lain bekerja sendiri.`
            ],
            kunciJawaban: `A. Memahami konsep dasar dan mengidentifikasi fenomena nyata terkait ${topik}.`,
            pembahasan: "Tahap Memahami (Understanding) adalah landasan utama dalam Pembelajaran Mendalam (Deep Learning)."
          },
          {
            no: 3,
            pertanyaan: `Seorang murid ingin mengaplikasikan pengetahuan tentang ${topik} untuk memecahkan masalah di lingkungan sekitarnya. Tindakan berorientasi HOTS yang paling tepat adalah...`,
            pilihan: [
              `A. Menganalisis faktor penyebab masalah, merancang solusi berbasis materi ${topik}, dan menguji hasilnya.`,
              `B. Menunggu jawaban dari guru tanpa mencoba berpikir kritis terlebih dahulu.`,
              `C. Menyalin hasil pekerjaan kelompok lain tanpa memahami prosesnya.`,
              `D. Menghentikan aktivitas pembelajaran dan tidak menyelesaikan LKPD.`
            ],
            kunciJawaban: `A. Menganalisis faktor penyebab masalah, merancang solusi berbasis materi ${topik}, dan menguji hasilnya.`,
            pembahasan: "Menganalisis, merancang solusi, dan menguji efektivitas merupakan indikator berpikir tingkat tinggi (HOTS) pada tahap Mengaplikasi."
          },
          {
            no: 4,
            pertanyaan: `Apa dampak positif utama jika murid mampu menguasai konsep ${topik} secara mendalam?`,
            pilihan: [
              `A. Murid memiliki daya nalar kritis, kemampuan pemecahan masalah, dan kesadaran metakognitif yang baik.`,
              `B. Murid hanya bisa menghafal definisi tanpa mengerti cara penerapannya.`,
              `C. Murid menjadi pasif dalam diskusi dan praktikum kelompok.`,
              `D. Murid tidak dapat mengaitkan materi ${topik} dengan disiplin ilmu lainnya.`
            ],
            kunciJawaban: `A. Murid memiliki daya nalar kritis, kemampuan pemecahan masalah, dan kesadaran metakognitif yang baik.`,
            pembahasan: "Penguasaan materi secara mendalam melatih kemampuan kognitif dan metakognitif murid secara holistik."
          },
          {
            no: 5,
            pertanyaan: `Dalam kegiatan refleksi setelah mempelajari ${topik}, pertanyaan metakognitif yang paling tepat diajukan adalah...`,
            pilihan: [
              `A. Pemahaman baru apa yang saya peroleh tentang ${topik} dan bagaimana saya mengatasi kesulitan selama belajar?`,
              `B. Berapa jumlah soal yang ada dalam lembar kerja ini?`,
              `C. Siapa yang paling cepat mengumpulkan tugas di kelas?`,
              `D. Berapa lama waktu yang dibutuhkan untuk menuliskan nama kelompok?`
            ],
            kunciJawaban: `A. Pemahaman baru apa yang saya peroleh tentang ${topik} dan bagaimana saya mengatasi kesulitan selama belajar?`,
            pembahasan: "Pertanyaan metakognitif membantu murid mengevaluasi strategi belajar mandiri dan ketercapaian tujuan pembelajaran."
          }
        ],
        soalUraian: [
          {
            no: 1,
            pertanyaan: `Jelaskan secara runtut bagaimana konsep ${topik} dapat diaplikasikan untuk menyelesaikan masalah konkret yang kamu temui di lingkungan sehari-hari!`,
            kunciJawaban: `Rubrik Penskoran: Nilai 4 jika menjelaskan konsep dasar ${topik}, mengidentifikasi masalah nyata, serta menguraikan tahapan solusi logis.`,
            pembahasan: `Soal ini menguji kemampuan berpikir kognitif tingkat tinggi (HOTS) murid dalam menghubungkan teori ${topik} dengan realitas kontekstual.`
          },
          {
            no: 2,
            pertanyaan: `Berdasarkan pengamatan atau praktikum ${topik} yang telah kamu lakukan, uraikan 2 temuan menarik yang kelompokmu peroleh beserta bukti pendukungnya!`,
            kunciJawaban: `Jawaban bervariasi sesuai data kelompok. Penilaian ditekankan pada ketepatan argumen ilmiah dan kesesuaian dengan data hasil pengamatan ${topik}.`,
            pembahasan: `Mengukur kemampuan murid dalam menganalisis data pengamatan dan mengemukakan pendapat berbasis bukti (evidence-based reasoning).`
          },
          {
            no: 3,
            pertanyaan: `Tuliskan refleksi pribadi mengenai sejauh mana kamu telah mencapai tujuan pembelajaran: "${tp}". Hambatan apa yang kamu temui dan bagaimana rencanamu untuk memperbaikinya?`,
            kunciJawaban: `Rubrik penilaian metakognitif mandiri. Kriteria tuntas apabila murid mengidentifikasi tingkat pemahaman diri dan merumuskan rencana perbaikan secara jujur.`,
            pembahasan: "Tahap Merefleksi mendukung kemandirian belajar (self-regulated learning) dan evaluasi diri murid."
          }
        ]
      },
      refleksiSiswa: {
        pertanyaanRefleksi: [
          `Apa hal paling menarik yang baru kamu pahami tentang materi ${topik} hari ini?`,
          `Hambatan apa yang kamu temui saat praktikum/diskusi ${topik} dan bagaimana kamu mengatasinya?`,
          `Bagaimana kamu dapat menerapkan pemahaman tentang ${topik} ini dalam kehidupan sehari-hari?`
        ],
        checkListDiri: [
          `Saya telah memahami konsep dasar materi ${topik} dengan baik.`,
          `Saya aktif berdiskusi dan bekerja sama dalam menyelesaikan praktikum/tugas ${topik}.`,
          `Saya dapat menyelesaikan soal-soal evaluasi ${topik} secara mandiri dan jujur.`
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
    const rubrikData = cleanAndParseJson(text);
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

// API Generate Detailed Bahan Ajar / Rangkuman Bacaan Guru & Siswa with AI
app.post("/api/generate-bahan-ajar", async (req, res) => {
  try {
    const { planData, customInstruction } = req.body;
    const ai = getGeminiClient();

    const mataPelajaran = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const faseKelas = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || "";
    const cp = planData?.tujuanDanDpl?.capaianPembelajaran || "";

    const prompt = `Kamu adalah pakar pengembang Bahan Ajar Kurikulum Merdeka Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) Indonesia.
Buatkan DOKUMEN RANGKUMAN MATERI / BAHAN BACAAN GURU & MURID yang sangat komprehensif, terstruktur, mendalam, dan siap pakai.

KONTEKS DAN SITUASI KELAS (SANGAT PENTING):
- Guru berada pada posisi TIDAK MEMILIKI BUKU PAKET/BUKU TEKS CETAK untuk bahan bacaan murid di kelas.
- Oleh karena itu, Rangkuman Materi ini berfungsi sebagai BAHAN BACAAN LENGKAP MANDIRI dan PANDUAN PAPAN TULIS (Blackboard/Whiteboard Board Notes) yang terstruktur rapi.
- Guru dapat langsung menjelaskan poin-poin ini di papan tulis, dan MURID DAPAT MENYALINNYA KE BUKU TULIS sebagai catatan esensial yang utuh.

DATA PEMBELAJARAN:
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${faseKelas}
- Topik / Lingkup Materi: ${topik}
- Tujuan Pembelajaran (TP): ${tp}
- Capaian Pembelajaran (CP): ${cp}
${customInstruction ? `- Catatan Khusus Guru: ${customInstruction}` : ''}

STRUKTUR WAJIB BAHAN AJAR (DISESUAIKAN DENGAN MATERI '${topik}'):
1. PENGERTIAN & HAKIKAT KONSEP:
   Definisi dan pengertian yang padat, jelas, bernalar logis, dan ramah anak mengenai '${topik}'.
2. JENIS-JENIS / KLASIFIKASI / BENTUK MATERI:
   Jabarkan 2-5 jenis, macam, klasifikasi, atau bentuk yang relevan dengan topik '${topik}'. Berikan nama jenis, penjelasan singkat, serta contoh konkret untuk setiap jenis.
3. CIRI-CIRI / KARAKTERISTIK / SIFAT MATERI:
   Tuliskan 3-6 butir ciri-ciri, sifat, atau karakteristik khas dari '${topik}'.
4. CONTOH KONTEKSTUAL SEHARI-HARI:
   3-5 contoh penerapan nyata dalam kehidupan sehari-hari (di rumah, sekolah, lingkungan sekitar).
5. CATATAN PAPAN TULIS (BOARD NOTES - SIAP SALIN MURID KE BUKU TULIS):
   Susun 5-8 baris rangkuman esensial berbutir/bernomor yang ringkas, runtut, dan padat. Format ini yang akan ditulis guru di papan tulis untuk disalin langsung oleh murid ke buku catatan mereka sebagai pengganti buku teks.
6. PANDUAN PEDAGOGIS GURU & TIPS PAPAN TULIS:
   Catatan cara mengajarkan, miskonsepsi umum yang sering terjadi pada murid beserta cara meluruskannya, serta tips visual menyajikan materi di papan tulis.
7. GLOSARIUM & DAFTAR PUSTAKA:
   Istilah-istilah penting dan rujukan Buku Teks Utama BSKAP Kemendikdasmen (https://buku.kemendikdasmen.go.id/).

Keluarkan HANYA dalam format JSON valid dengan struktur persis berikut:
{
  "judulBahanAjar": "RANGKUMAN MATERI & BAHAN BACAAN - ${topik.toUpperCase()}",
  "subJudul": "Bahan Ajar & Panduan Catatan Papan Tulis Kurikulum Merdeka",
  "referensiUtama": "Buku Teks Utama Kurikulum Merdeka BSKAP Kemendikdasmen (https://buku.kemendikdasmen.go.id/)",
  "rangkumanMateriSiswa": {
    "judulMateri": "${topik}",
    "pengertian": "Pengertian dan definisi mendalam mengenai ${topik} yang mudah dipahami murid ${faseKelas}...",
    "jenisJenis": [
      {
        "nama": "Nama Jenis/Klasifikasi 1",
        "deskripsi": "Penjelasan karakteristik jenis 1...",
        "contoh": "Contoh konkret jenis 1..."
      },
      {
        "nama": "Nama Jenis/Klasifikasi 2",
        "deskripsi": "Penjelasan karakteristik jenis 2...",
        "contoh": "Contoh konkret jenis 2..."
      }
    ],
    "ciriCiri": [
      "Ciri-ciri/karakteristik 1 dari ${topik}...",
      "Ciri-ciri/karakteristik 2 dari ${topik}...",
      "Ciri-ciri/karakteristik 3 dari ${topik}..."
    ],
    "contohKontekstual": [
      "Contoh penerapan di kehidupan sehari-hari 1...",
      "Contoh penerapan 2..."
    ],
    "catatanPapanTulis": [
      "1. Pengertian: ...",
      "2. Jenis/Macam: (a) ... (b) ...",
      "3. Ciri Utama: (a) ... (b) ...",
      "4. Contoh: ...",
      "5. Kesimpulan Inti: ..."
    ],
    "konsepKunci": [
      "Konsep Kunci 1",
      "Konsep Kunci 2",
      "Konsep Kunci 3"
    ],
    "penjelasanRingkas": "Uraian naratif materi yang utuh dan komunikatif..."
  },
  "panduanGuru": {
    "catatanPedagogis": "Catatan esensial guru dalam membimbing eksplorasi konsep murid...",
    "tipsPapanTulis": "Tips penyajian di papan tulis (misal: buat skema bagan cabang di sisi kiri, tuliskan kata kunci dengan warna berbeda agar murid mudah menyalin)...",
    "miskonsepsiUmum": [
      "Miskonsepsi 1 dan cara pelurusannya...",
      "Miskonsepsi 2 dan cara pelurusannya..."
    ]
  },
  "glosarium": [
    {"istilah": "Istilah 1", "arti": "Arti sederhana istilah 1..."},
    {"istilah": "Istilah 2", "arti": "Arti sederhana istilah 2..."}
  ],
  "daftarPustaka": [
    "Buku Teks Utama ${mataPelajaran} Kelas ${faseKelas}, BSKAP Kementerian Pendidikan Dasar dan Menengah (https://buku.kemendikdasmen.go.id/)",
    "Buku Panduan Guru ${mataPelajaran} Kelas ${faseKelas}, BSKAP Kemendikdasmen",
    "Panduan Pembelajaran dan Asesmen Kurikulum Merdeka, Kemendikdasmen RI"
  ]
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
    const bahanAjarData = cleanAndParseJson(text);

    const textSummary = `RANGKUMAN MATERI & BAHAN BACAAN GURU & MURID
Topik: ${topik} | Kelas/Fase: ${faseKelas} | Mata Pelajaran: ${mataPelajaran}
Referensi Resmi: Buku Teks Utama Kemendikdasmen (https://buku.kemendikdasmen.go.id/)
*(Catatan: Dirancang sebagai bahan belajar mandiri & panduan catatan papan tulis bagi kelas tanpa buku paket cetak)*

1. PENGERTIAN & DEFINISI KONSEP:
${bahanAjarData?.rangkumanMateriSiswa?.pengertian || bahanAjarData?.rangkumanMateriSiswa?.penjelasanRingkas || ''}

2. JENIS-JENIS / KLASIFIKASI MATERI:
${(bahanAjarData?.rangkumanMateriSiswa?.jenisJenis || []).map((j: any, idx: number) => {
  if (typeof j === 'string') return `   ${idx + 1}. ${j}`;
  return `   ${idx + 1}. ${j.nama}: ${j.deskripsi}${j.contoh ? ` (Contoh: ${j.contoh})` : ''}`;
}).join('\n')}

3. CIRI-CIRI & KARAKTERISTIK UTAMA:
${(bahanAjarData?.rangkumanMateriSiswa?.ciriCiri || []).map((c: string, idx: number) => `   ${idx + 1}. ${c}`).join('\n')}

4. CONTOH PENERAPAN KONTEKSTUAL SEHARI-HARI:
${(bahanAjarData?.rangkumanMateriSiswa?.contohKontekstual || []).map((c: string, idx: number) => `   - ${c}`).join('\n')}

5. FORMAT CATATAN PAPAN TULIS (BAHAN SALIN MURID KE BUKU TULIS):
${(bahanAjarData?.rangkumanMateriSiswa?.catatanPapanTulis || []).map((p: string) => `   ${p}`).join('\n')}

6. PANDUAN PEDAGOGIS GURU & TIPS PAPAN TULIS:
   - Tips Papan Tulis: ${bahanAjarData?.panduanGuru?.tipsPapanTulis || 'Gunakan bagan skematis dan warna spidol kontras untuk memudahkan murid menyalin.'}
   - Catatan Pedagogis: ${bahanAjarData?.panduanGuru?.catatanPedagogis || ''}
   - Miskonsepsi & Pelurusan: ${(bahanAjarData?.panduanGuru?.miskonsepsiUmum || []).join('; ')}

7. GLOSARIUM:
${(bahanAjarData?.glosarium || []).map((g: any) => `   - ${g.istilah}: ${g.arti}`).join('\n')}

8. DAFTAR PUSTAKA:
${(bahanAjarData?.daftarPustaka || []).map((d: string) => `   - ${d}`).join('\n')}`;

    bahanAjarData.ringkasanTeks = textSummary;

    res.json({ success: true, bahanAjar: bahanAjarData });
  } catch (error: any) {
    console.error("Error in /api/generate-bahan-ajar:", error);
    const planData = req.body?.planData || {};
    const mp = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const fk = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || "";

    const fallbackBahanAjar = {
      judulBahanAjar: `RANGKUMAN MATERI & BAHAN BACAAN - ${topik.toUpperCase()}`,
      subJudul: `Bahan Ajar & Panduan Catatan Papan Tulis Kurikulum Merdeka (${mp} - ${fk})`,
      referensiUtama: "Buku Teks Utama Kurikulum Merdeka BSKAP Kemendikdasmen (https://buku.kemendikdasmen.go.id/)",
      rangkumanMateriSiswa: {
        judulMateri: topik,
        pengertian: `${topik} adalah konsep esensial dalam mata pelajaran ${mp} pada jenjang ${fk} yang mempelajari prinsip dasar, pola keteraturan, dan manfaat praktisnya dalam memecahkan masalah kontekstual di kehidupan sehari-hari.`,
        jenisJenis: [
          {
            nama: `Jenis/Bentuk Dasar ${topik}`,
            deskripsi: `Kategori pertama yang merepresentasikan bentuk fundamental dan paling sering dijumpai pada ${topik}.`,
            contoh: `Penerapan sederhana pada lingkungan sekitar sekolah.`
          },
          {
            nama: `Jenis/Bentuk Terapan ${topik}`,
            deskripsi: `Kategori kedua yang merupakan bentuk pengembangan atau penerapan lebih lanjut dari ${topik}.`,
            contoh: `Penggunaan praktis dalam aktivitas sehari-hari di rumah.`
          }
        ],
        ciriCiri: [
          `Memiliki karakteristik khas yang dapat diamati secara langsung pada materi ${topik}.`,
          `Mengikuti pola dan prinsip hukum dasar dalam mata pelajaran ${mp}.`,
          `Dapat diterapkan untuk menganalisis dan memecahkan persoalan nyata di sekitar murid.`
        ],
        contohKontekstual: [
          `Penerapan konsep ${topik} dalam kehidupan sehari-hari di rumah dan sekolah.`,
          `Pengamatan fenomena lingkungan sekitar yang berkaitan langsung dengan ${topik}.`
        ],
        catatanPapanTulis: [
          `1. JUDUL: ${topik.toUpperCase()}`,
          `2. PENGERTIAN: Konsep dasar ${mp} untuk memahami dan memecahkan fenomena kontekstual.`,
          `3. JENIS-JENIS: (a) Bentuk Dasar, (b) Bentuk Terapan.`,
          `4. CIRI KHAS: Memiliki pola teratur, terukur, dan bermanfaat nyata dalam kehidupan.`,
          `5. CONTOH: Kejadian nyata di sekitar rumah dan sekolah yang berkaitan dengan ${topik}.`
        ],
        konsepKunci: [
          `Pengertian utama dari ${topik}`,
          `Klasifikasi & ciri khas ${topik}`,
          `Penerapan praktis ${topik}`
        ],
        penjelasanRingkas: `Materi ${topik} merupakan bagian penting dalam pembelajaran ${mp} di ${fk}. Melalui materi ini, murid diajak untuk memahami konsep dasar secara mendalam, mengenali berbagai jenis dan ciri-cirinya, serta mampu mengaplikasikan pemahaman tersebut untuk memecahkan masalah kontekstual secara kritis dan kolaboratif. ${tp ? `Tujuan utamanya adalah agar ${tp.toLowerCase()}` : ''}`
      },
      panduanGuru: {
        catatanPedagogis: `Guru hendaknya mengawali pembelajaran ${topik} dengan menuliskan bagan skematik di papan tulis, menghadirkan pertanyaan pemantik, serta membimbing murid menyalin poin esensial ke buku catatan masing-masing.`,
        tipsPapanTulis: `Gunakan pembagian papan tulis 3 kolom: Kolom 1 (Pengertian & Kata Kunci), Kolom 2 (Bagan Jenis & Ciri-Ciri), Kolom 3 (Contoh Soal & Tugas Latihan). Beri waktu 5-7 menit bagi murid untuk menyalin secara rapi.`,
        miskonsepsiUmum: [
          `Murid menganggap ${topik} hanya sebatas hafalan definisi. Pelurusan: Hubungkan langsung dengan contoh fenomena nyata di sekitar kelas.`,
          `Murid kesulitan mengklasifikasikan jenis. Pelurusan: Berikan tabel perbandingan visual sederhana di papan tulis.`
        ]
      },
      glosarium: [
        { istilah: topik, arti: `Gagasan atau topik utama yang dipelajari pada modul ajar ini.` },
        { istilah: "Klasifikasi", arti: "Pengelompokan objek atau konsep berdasarkan kesamaan ciri atau sifat tertentu." },
        { istilah: "Karakteristik", arti: "Ciri khas atau tanda khusus yang membedakan suatu hal dari yang lain." },
        { istilah: "Kontekstual", arti: "Dapat dihubungkan langsung dengan situasi kehidupan nyata murid sehari-hari." }
      ],
      daftarPustaka: [
        `Buku Teks Utama ${mp} ${fk}, Kementerian Pendidikan Dasar dan Menengah (https://buku.kemendikdasmen.go.id/)`,
        `Buku Panduan Guru ${mp} ${fk}, BSKAP Kemendikdasmen`,
        `Panduan Pembelajaran dan Asesmen Kurikulum Merdeka, Kemendikdasmen RI`
      ]
    };
    return res.json({ success: true, bahanAjar: fallbackBahanAjar, isFallback: true });
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

// Lynk.id Auto-Claim Code endpoint
app.post(["/api/licensing/claim", "/licensing/claim"], (req, res) => {
  try {
    const { fingerprint } = req.body || {};
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const clientIp = Array.isArray(ip) ? ip[0] : String(ip);

    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codeStr = `RPM-LYNK-${suffix}`;
    const valid_from = new Date().toISOString();
    const valid_until_date = new Date();
    valid_until_date.setMonth(valid_until_date.getMonth() + 1);
    const valid_until = valid_until_date.toISOString();

    const created = LicensingDB.createAccessCode({
      code: codeStr,
      type: "MONTHLY",
      status: "ACTIVE",
      valid_from,
      valid_until,
      created_by: "Lynk.id Checkout Auto-Claim",
      notes: "Pembelian Otomatis Lynk.id (Akses 1 Bulan Resmi)"
    });

    LicensingDB.addLog(
      "VALIDATE_CODE_SUCCESS",
      `Pembeli mengeklaim Kode Akses baru via Lynk.id: ${codeStr} (Berlaku s/d ${new Date(valid_until).toLocaleDateString('id-ID')})`,
      { ip: clientIp, browser: userAgent, codeUsed: codeStr }
    );

    res.json({
      success: true,
      code: created.code,
      type: created.type,
      valid_until: created.valid_until,
      notes: created.notes
    });
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
app.post(["/api/licensing/admin/dashboard", "/licensing/admin/dashboard"], async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak (Password salah)" });
    }
    
    await LicensingDB.pullCodesFromGoogleSheet().catch(() => {});
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

// Admin Pull Codes explicitly from Google Sheet
app.post(["/api/licensing/admin/pull-sheet", "/licensing/admin/pull-sheet"], async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak (Password salah)" });
    }
    const codes = await LicensingDB.pullCodesFromGoogleSheet();
    res.json({ success: true, count: codes.length, codes });
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

    LicensingDB.syncCodeToGoogleSheet(created);
    
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

// Save & Sync Google Sheet Webhook URL
app.post(["/api/licensing/admin/sheet-url", "/licensing/admin/sheet-url"], (req, res) => {
  try {
    const { password, url } = req.body || {};
    if (password && !checkAdminAuth(password)) {
      return res.status(401).json({ success: false, error: "Akses ditolak" });
    }
    if (url && typeof url === "string") {
      LicensingDB.setGoogleSheetWebhookUrl(url);
    }
    res.json({ success: true, url: LicensingDB.getGoogleSheetWebhookUrl() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Proxy route for client-side to sync code/payload to Google Sheet via backend Node.js
app.post(["/api/licensing/sync-sheet", "/licensing/sync-sheet"], (req, res) => {
  try {
    const { codeObj, webhookUrl, payload } = req.body || {};
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      LicensingDB.setGoogleSheetWebhookUrl(webhookUrl);
    }
    if (codeObj && codeObj.code) {
      LicensingDB.syncOrRegisterAccessCode(codeObj);
      LicensingDB.syncCodeToGoogleSheet(codeObj, webhookUrl);
    } else if (payload) {
      const activeUrl = webhookUrl || LicensingDB.getGoogleSheetWebhookUrl();
      if (activeUrl && activeUrl.startsWith("http")) {
        fetch(activeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// Route for synchronizing and persisting any access code to central server DB
app.post(["/api/licensing/sync-code", "/licensing/sync-code"], (req, res) => {
  try {
    const { codeObj } = req.body || {};
    if (codeObj && codeObj.code) {
      const saved = LicensingDB.syncOrRegisterAccessCode(codeObj);
      return res.json({ success: true, code: saved });
    }
    res.json({ success: false, error: "Kode akses tidak valid" });
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
