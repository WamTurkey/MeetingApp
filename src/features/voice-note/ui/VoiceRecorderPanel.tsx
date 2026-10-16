import { useState, useRef, useEffect } from "react";
import { Mic, Square, RotateCcw, Trash2, ArrowDownToLine, Check, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { toast } from "sonner";
import { useUploadAttachment } from "@/entities/meeting/api/attachments";

interface VoiceRecorderPanelProps {
  meetingId?: number;
  onTransferText?: (text: string) => void;
  onSaveAsNote?: (text: string) => Promise<void> | void;
  onSaveVoiceRecord?: (audioBlob: Blob | null, text: string) => Promise<void> | void;
  onClose?: () => void;
}

export function VoiceRecorderPanel({
  meetingId,
  onTransferText,
  onSaveAsNote,
  onSaveVoiceRecord,
  onClose,
}: VoiceRecorderPanelProps) {
  const uploadAttachment = useUploadAttachment(meetingId || 0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech Recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    }

    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setTranscript("");
      setInterimText("");
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      // 1. Microphone audio stream for MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Release mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);

      // 2. Web Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "tr-TR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalAccumulated = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              finalAccumulated += (finalAccumulated ? " " : "") + text;
            } else {
              currentInterim += text;
            }
          }

          if (finalAccumulated) {
            setTranscript((prev) => (prev ? prev + " " + finalAccumulated : finalAccumulated));
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn("[VoiceRecorder] Speech recognition error:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.error("[VoiceRecorder] Mic error:", err);
      toast.error("Mikrofon erişimi sağlanamadı. Lütfen tarayıcı izinlerini kontrol edin.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    stopRecording();
    setTranscript("");
    setInterimText("");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingSeconds(0);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fullText = (transcript + (interimText ? " " + interimText : "")).trim();

  const handleTransfer = () => {
    if (!fullText) {
      toast.error("Aktarılacak metin bulunamadı");
      return;
    }
    onTransferText?.(fullText);
    toast.success("Metin not alanına aktarıldı");
    onClose?.();
  };

  const handleSaveVoiceOnly = async () => {
    if (!fullText && !audioUrl) {
      toast.error("Kaydedilecek ses veya metin bulunamadı");
      return;
    }
    setIsSaving(true);
    try {
      if (onSaveVoiceRecord) {
        const audioBlob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: "audio/webm" })
            : null;
        await onSaveVoiceRecord(audioBlob, fullText);
      } else if (meetingId && uploadAttachment) {
        let file: File;
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          file = new File([audioBlob], `sesli_kayit_${Date.now()}.webm`, { type: "audio/webm" });
        } else {
          const blob = new Blob([fullText], { type: "text/plain" });
          file = new File([blob], `sesli_not_${Date.now()}.txt`, { type: "text/plain" });
        }
        await uploadAttachment.mutateAsync({
          file,
          category: "VOICE_NOTE",
          description: fullText || "Ses Kaydı",
        });
      }
      toast.success("Sesli not başarıyla kaydedildi");
      resetRecording();
      onClose?.();
    } catch (err) {
      console.error("Save voice error:", err);
      toast.error("Sesli not kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBoth = async () => {
    if (!fullText && !audioUrl) {
      toast.error("Kaydedilecek ses veya metin bulunamadı");
      return;
    }
    setIsSaving(true);
    try {
      // 1. Ses kaydını kaydet
      if (onSaveVoiceRecord) {
        const audioBlob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type: "audio/webm" })
            : null;
        await onSaveVoiceRecord(audioBlob, fullText);
      } else if (meetingId && uploadAttachment) {
        let file: File;
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          file = new File([audioBlob], `sesli_kayit_${Date.now()}.webm`, { type: "audio/webm" });
        } else {
          const blob = new Blob([fullText], { type: "text/plain" });
          file = new File([blob], `sesli_not_${Date.now()}.txt`, { type: "text/plain" });
        }
        await uploadAttachment.mutateAsync({
          file,
          category: "VOICE_NOTE",
          description: fullText || "Ses Kaydı",
        });
      }

      // 2. Not olarak da kaydet
      if (onSaveAsNote && fullText) {
        await onSaveAsNote(fullText);
      }

      toast.success("Ses kaydı ve not birlikte başarıyla kaydedildi");
      resetRecording();
      onClose?.();
    } catch (err) {
      console.error("Save both error:", err);
      toast.error("Kaydedilirken hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-b from-brand-50/40 to-white p-5 shadow-sm dark:border-brand-900/50 dark:from-brand-950/20 dark:to-surface-800">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-brand-100 pb-3 dark:border-brand-900/30">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-brand-500/10 p-2 text-brand-600 dark:text-brand-400">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100">
              Sesle Not & Ses Kaydı
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Konuşun; sesiniz metne dönüştürülsün ve toplantı notlarınıza aktarılsın.
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Kapat
          </Button>
        )}
      </div>

      {/* Recording Control & Visualizer */}
      <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-surface-50 p-6 text-center dark:bg-surface-900/50">
        {isRecording ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
              <button
                type="button"
                onClick={stopRecording}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-danger-600 text-white shadow-lg transition hover:bg-danger-700 active:scale-95"
                title="Kaydı Durdur"
              >
                <Square className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-danger-600 dark:text-danger-400">
              <span className="h-2.5 w-2.5 rounded-full bg-danger-500 animate-pulse" />
              {formatTimer(recordingSeconds)} (Kayıt Yapılıyor...)
            </div>
            <p className="text-xs text-surface-500">
              Konuşmayı bitirdiğinizde kırmızı kareye tıklayarak durdurabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={startRecording}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-700 hover:scale-105 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600"
              title="Ses Kaydını Başlat"
            >
              <Mic className="h-6 w-6" />
            </button>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {audioUrl ? "Yeni bir kayıt başlatmak için tıklayın" : "Ses kaydını ve konuşmayı metne çevirmeyi başlatın"}
            </p>
          </div>
        )}

        {/* Audio Player (if recorded) */}
        {audioUrl && !isRecording && (
          <div className="mt-4 flex w-full max-w-md flex-col items-center gap-2 rounded-lg border border-surface-200 bg-white p-3 shadow-xs dark:border-surface-700 dark:bg-surface-800">
            <div className="flex items-center justify-between w-full text-xs text-surface-500">
              <span className="flex items-center gap-1 font-medium">
                <Volume2 className="h-3.5 w-3.5 text-brand-600" /> Kaydedilen Ses ({formatTimer(recordingSeconds)})
              </span>
              <button
                type="button"
                onClick={resetRecording}
                className="text-danger-500 hover:text-danger-700 text-xs flex items-center gap-1"
                title="Kaydı Sil"
              >
                <Trash2 className="h-3.5 w-3.5" /> Sil
              </button>
            </div>
            <audio src={audioUrl} controls className="w-full h-9" />
          </div>
        )}
      </div>

      {/* Transcribed Text Display & Editor */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Metne Dönüştürülen Konuşma:
          </label>
          {fullText && (
            <span className="text-2xs text-surface-400">
              {fullText.split(/\s+/).filter(Boolean).length} kelime
            </span>
          )}
        </div>

        <textarea
          rows={3}
          value={fullText}
          onChange={(e) => {
            setTranscript(e.target.value);
            setInterimText("");
          }}
          placeholder={
            isRecording
              ? "Konuşmanız buraya canlı olarak aktarılıyor..."
              : "Mikrofona tıkladığınızda konuşulanlar bu alanda otomatik metne dönüştürülür..."
          }
          className="w-full rounded-lg border border-surface-200 bg-white p-3 text-sm text-surface-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
        />

        {!isSpeechSupported && (
          <p className="mt-1 text-2xs text-amber-600 dark:text-amber-400">
            * Tarayıcınız Web Speech API desteklemiyor veya izin kapalı. Yine de ses kaydı alabilir ve dinleyebilirsiniz.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {(fullText || audioUrl) && !isRecording && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-brand-100 pt-3 dark:border-brand-900/30 flex-wrap">
          {/* 1. Temizle (kalsın) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={resetRecording}
            disabled={isSaving}
          >
            Temizle
          </Button>

          {/* 2. Not Alanına Aktar (kalsın) */}
          {onTransferText && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<ArrowDownToLine className="h-4 w-4" />}
              onClick={handleTransfer}
              disabled={isSaving || !fullText}
            >
              Not Alanına Aktar
            </Button>
          )}

          {/* 3. Sesli Not Kaydet (Doğrudan not olarak ekle yerine, BEYAZ buton) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white text-surface-800 border-surface-300 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-100 dark:border-surface-600 font-medium"
            icon={<Mic className="h-4 w-4 text-rose-600" />}
            onClick={handleSaveVoiceOnly}
            disabled={isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Sesli Not Kaydet"}
          </Button>

          {/* 4. Not ve Kayıt Olarak Birlikte Kaydet (En sağda, MAVİ buton) */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Check className="h-4 w-4" />}
            onClick={handleSaveBoth}
            disabled={isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Not ve Kayıt Olarak Birlikte Kaydet"}
          </Button>
        </div>
      )}
    </div>
  );
}
