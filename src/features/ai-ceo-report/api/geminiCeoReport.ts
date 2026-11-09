import apiClient from "@/services/apiClient";
import { fetchMeetingById } from "@/services/meetingService";
import type { AttachmentDto } from "@/types/api";
import {
  buildCeoPrompt,
  type MeetingReportBundle,
  voiceTranscriptsFromAttachments,
} from "../lib/buildCeoPrompt";

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
}

/** Free-tier kotası dolunca 3.5-flash 429 veriyor; lite aynı anahtarla stabil. */
const GEMINI_MODEL = "gemini-3.5-flash-lite";

export function getGeminiApiKey(): string | undefined {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
}

function formatGeminiAuthError(message: string | undefined, status: number): string {
  const raw = message?.trim() || `Gemini isteği başarısız (${status}).`;
  const lower = raw.toLowerCase();
  if (
    status === 401 ||
    lower.includes("api key not valid") ||
    lower.includes("access_token_type_unsupported") ||
    lower.includes("unauthenticated")
  ) {
    return (
      "Gemini API anahtarı geçersiz veya bu uç noktada kabul edilmiyor. " +
      "https://aistudio.google.com/apikey adresinden yeni bir anahtar oluşturup " +
      ".env içindeki VITE_GEMINI_API_KEY değerini güncelleyin; ardından Vite sunucusunu yeniden başlatın."
    );
  }
  return raw;
}

async function fetchVoiceAttachments(meetingId: number): Promise<AttachmentDto[]> {
  const { data } = await apiClient.get<AttachmentDto[]>(
    `/meetings/${meetingId}/attachments?category=VOICE_NOTE`,
  );
  return data;
}

export async function collectMeetingBundles(meetingIds: number[]): Promise<MeetingReportBundle[]> {
  const uniqueIds = [...new Set(meetingIds)];
  const bundles: MeetingReportBundle[] = [];

  for (const id of uniqueIds) {
    const [detail, attachments] = await Promise.all([
      fetchMeetingById(id),
      fetchVoiceAttachments(id).catch(() => [] as AttachmentDto[]),
    ]);
    bundles.push({
      detail,
      voiceTranscripts: voiceTranscriptsFromAttachments(attachments),
    });
  }

  return bundles;
}

export async function generateCeoReportMarkdown(meetingIds: number[]): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY tanımlı değil.");
  }

  const bundles = await collectMeetingBundles(meetingIds);
  if (bundles.length === 0) {
    throw new Error("Rapor için seçili toplantı bulunamadı.");
  }

  const prompt = buildCeoPrompt(bundles);
  // Yeni AI Studio anahtarları (AQ.*) query ?key= ile reddedilir; x-goog-api-key kullan.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    }),
  });

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    throw new Error(formatGeminiAuthError(payload.error?.message, response.status));
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini boş yanıt döndürdü.");
  }

  return text;
}
