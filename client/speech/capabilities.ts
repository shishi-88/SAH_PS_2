export type SpeechCapability = {
  canRecordAudio: boolean;
  hasWebSpeechRecognition: boolean;
  webSpeechLikelyNeedsNetwork: true;
  note: string;
};

export function inspectSpeechCapability(): SpeechCapability {
  const canRecordAudio =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
      : undefined;

  return {
    canRecordAudio,
    hasWebSpeechRecognition: Boolean(SpeechRecognition),
    webSpeechLikelyNeedsNetwork: true,
    note: SpeechRecognition
      ? "This browser may offer dictation. It usually needs a network connection and is not guaranteed offline. Diagnosis still works if you mark what you heard."
      : "On-device speech-to-text is not available here. Record if you wish, then mark errors by hand — that path works fully offline.",
  };
}

export interface LiveDictation {
  stop: () => void;
}

export function startOptionalWebSpeech(onText: (text: string) => void): LiveDictation | null {
  const Ctor =
    (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-IN";
  rec.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) {
      text += event.results[i][0].transcript + " ";
    }
    onText(text.trim());
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
}

export async function startAudioRecording(): Promise<{
  stop: () => Promise<{ blob: Blob; seconds: number }>;
} | null> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    return null;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  const started = Date.now();
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start();
  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve({
            blob: new Blob(chunks, { type: recorder.mimeType || "audio/webm" }),
            seconds: Math.round((Date.now() - started) / 1000),
          });
        };
        recorder.stop();
      }),
  };
}
