import type { SpeakItem } from './lang';
import type { Lang } from './types';

export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

/** Joke and robotic voices bundled with some systems: never use them for children. */
const NOVELTY =
  /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|eSpeak/i;
/** Names of known higher-quality voices (neural/online/enhanced, and well-known system voices). */
const GOOD = /Natural|Neural|Online|Enhanced|Premium|Google|Paulina|Dalia|Sabina|M[oó]nica|Samantha|Jenny|Aria|Ava/i;

const PREFERRED: Record<Lang, string[]> = {
  es: ['es-mx', 'es-us', 'es-419', 'es-es'],
  en: ['en-us', 'en-gb', 'en-au', 'en-ca'],
};

export function scoreVoice(v: VoiceLike, lang: Lang): number {
  const tag = v.lang.replace('_', '-').toLowerCase();
  let s = 0;
  const i = PREFERRED[lang].indexOf(tag);
  if (i >= 0) s += 10 - i;
  if (GOOD.test(v.name)) s += 5;
  if (v.localService) s += 1;
  return s;
}

/** Best available voice for a language, or null when the device has none. */
export function pickVoice<T extends VoiceLike>(voices: readonly T[], lang: Lang): T | null {
  const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(lang) && !NOVELTY.test(v.name));
  candidates.sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
  return candidates[0] ?? null;
}

export class Speaker {
  private voices: SpeechSynthesisVoice[] = [];
  onVoicesChanged: (() => void) | null = null;

  constructor(private readonly isEnabled: () => boolean) {
    if (!this.supported) return;
    this.load();
    try {
      speechSynthesis.addEventListener('voiceschanged', () => this.load());
    } catch {
      /* old browsers */
    }
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private load(): void {
    try {
      this.voices = speechSynthesis.getVoices() ?? [];
    } catch {
      this.voices = [];
    }
    this.onVoicesChanged?.();
  }

  voiceFor(lang: Lang): SpeechSynthesisVoice | null {
    return pickVoice(this.voices, lang);
  }

  get hasVoices(): boolean {
    return this.voices.length > 0;
  }

  /** Cancels anything playing, then speaks each item in order with the voice of its language. */
  say(items: SpeakItem[]): void {
    if (!this.supported || !this.isEnabled() || items.length === 0) return;
    try {
      speechSynthesis.cancel();
      for (const it of items) {
        const u = new SpeechSynthesisUtterance(it.t);
        const v = this.voiceFor(it.lang);
        if (v) u.voice = v;
        u.lang = v?.lang ?? (it.lang === 'es' ? 'es-MX' : 'en-US');
        u.rate = 0.9;
        u.pitch = 1.1;
        speechSynthesis.speak(u);
      }
    } catch {
      /* speech is a bonus, never a blocker */
    }
  }

  cancel(): void {
    try {
      if (this.supported) speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
