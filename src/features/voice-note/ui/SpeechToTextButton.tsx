import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "sm" | "md";
  title?: string;
  showLabel?: boolean;
  label?: string;
}

export function SpeechToTextButton({
  onTranscript,
  className = "",
  size = "sm",
  title = "Sesle Yazdır",
  showLabel = false,
  label = "Sesle Yazdır",
}: SpeechToTextButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tarayıcınız sesle yazmayı (Speech Recognition) desteklemiyor.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "tr-TR";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Dinleniyor... Konuşabilirsiniz.");
      };

      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        if (text) {
          onTranscript(text.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[SpeechToText] Error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("[SpeechToText] Start error:", err);
      setIsListening(false);
      toast.error("Mikrofon başlatılamadı.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`inline-flex items-center justify-center rounded-lg transition-all ${
        isListening
          ? "bg-danger-600 text-white animate-pulse shadow-md px-2.5"
          : showLabel
          ? "border border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 hover:border-rose-300 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1"
          : "text-surface-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30"
      } ${!showLabel ? (size === "sm" ? "p-1.5 h-8 w-8" : "p-2 h-9 w-9") : "h-7"} ${className}`}
      title={isListening ? "Dinlemeyi Durdur" : title}
    >
      {showLabel ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {isListening ? (
            <MicOff className="h-3.5 w-3.5 text-white" />
          ) : (
            <Mic className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
          )}
          <span>{isListening ? "Dinleniyor..." : label}</span>
        </span>
      ) : isListening ? (
        <MicOff className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Mic className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </button>
  );
}
