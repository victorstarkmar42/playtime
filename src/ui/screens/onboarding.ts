import { LANG_NAME } from '../../core/lang';
import { settings, updateSettings } from '../../core/settings';
import { AGES, LANG_MODES, type Age } from '../../core/types';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';

const AGE_LABEL: Record<Age, string> = { '3-4': '3–4 años', '5-6': '5–6 años', '7-9': '7–9 años' };

/** First launch, for the adult: age and language. */
export function onboardingScreen(ctx: Ctx): Screen {
  const ages = h('div', { class: 'onb-ages' });
  const langs = h('div', { class: 'seg big' });
  const paint = () => {
    ages.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.age === settings.age)));
    langs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === settings.lang)));
  };
  for (const a of AGES) ages.append(h('button', { class: 'tile', dataset: { age: a }, onClick: () => (updateSettings({ age: a }), paint()) }, AGE_LABEL[a]));
  for (const l of LANG_MODES) langs.append(h('button', { dataset: { lang: l }, onClick: () => (updateSettings({ lang: l }), paint(), ctx.sayPair('Hola', 'Hello')) }, LANG_NAME[l]));
  paint();

  const el = h(
    'div',
    { class: 'view onboarding' },
    h('div', { class: 'onb' },
      h('h1', null, 'Punto y Magia'),
      h('p', { class: 'onb-lede' }, 'Para el adulto: ¿cuántos años tiene quien va a jugar?'),
      ages,
      h('p', { class: 'onb-lede' }, '¿Cómo quieres que suene la voz?'),
      langs,
      h('button', { class: 'bigbtn', onClick: () => (updateSettings({ onboarded: true }), ctx.show('home')) }, 'Empezar'),
      h('p', { class: 'onb-note' }, 'Sin anuncios ni cuentas. Todo se guarda sólo en este dispositivo. Puedes cambiar la edad y el idioma después, desde Inicio.'),
    ),
  );
  return { el };
}
