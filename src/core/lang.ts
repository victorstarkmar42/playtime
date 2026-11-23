import type { Lang, LangMode } from './types';

export interface SpeakItem {
  t: string;
  lang: Lang;
}

export const primaryLang = (m: LangMode): Lang => (m === 'en' || m === 'en-es' ? 'en' : 'es');

export const secondaryLang = (m: LangMode): Lang | null => (m === 'es-en' ? 'en' : m === 'en-es' ? 'es' : null);

/** The language a child practises with "Dilo conmigo": the one that is not their main language. */
export const practiceLang = (m: LangMode): Lang => (primaryLang(m) === 'en' ? 'es' : 'en');

/** Text to show: main line in the primary language, small line in the second one (empty if monolingual). */
export function pickText(m: LangMode, es: string, en: string): { main: string; sub: string } {
  const t = { es, en };
  const s = secondaryLang(m);
  return { main: t[primaryLang(m)], sub: s ? t[s] : '' };
}

/** What to say, one phrase per language, primary first. Never mixes languages in one utterance. */
export function speakOrder(m: LangMode, es: string, en: string): SpeakItem[] {
  switch (m) {
    case 'es':
      return [{ t: es, lang: 'es' }];
    case 'en':
      return [{ t: en, lang: 'en' }];
    case 'es-en':
      return [{ t: es, lang: 'es' }, { t: en, lang: 'en' }];
    case 'en-es':
      return [{ t: en, lang: 'en' }, { t: es, lang: 'es' }];
  }
}

export const LANG_SHORT: Record<LangMode, string> = { es: 'ES', 'es-en': 'ES → EN', 'en-es': 'EN → ES', en: 'EN' };
export const LANG_NAME: Record<LangMode, string> = {
  es: 'Sólo español',
  'es-en': 'Español → inglés',
  'en-es': 'Inglés → español',
  en: 'Sólo inglés',
};

/** One-line explanation of what the child will hear in each mode. */
export const LANG_HINT: Record<LangMode, string> = {
  es: 'La voz habla sólo en español.',
  'es-en': 'Cada palabra se oye en español y luego en inglés.',
  'en-es': 'Cada palabra se oye en inglés y luego en español.',
  en: 'La voz habla sólo en inglés.',
};
