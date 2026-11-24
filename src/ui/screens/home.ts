import { charOf } from '../../content/characters';
import { LANG_HINT, LANG_NAME } from '../../core/lang';
import { settings, updateSettings } from '../../core/settings';
import { AGES, LANG_MODES, type Age } from '../../core/types';
import { saveSession } from '../../game/session';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';
import { renderInstall } from '../pwa';

const DOTS_ICON = '<svg viewBox="0 0 100 100"><g fill="#F2672E"><circle cx="50" cy="12" r="6"/><circle cx="61" cy="38" r="6"/><circle cx="90" cy="40" r="6"/><circle cx="67" cy="60" r="6"/><circle cx="76" cy="88" r="6"/><circle cx="50" cy="72" r="6"/><circle cx="24" cy="88" r="6"/><circle cx="33" cy="60" r="6"/></g><path d="M50 12L61 38 90 40 67 60 76 88 50 72" fill="none" stroke="#22304F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const COLOR_ICON = '<svg viewBox="0 0 100 100"><path d="M22 78c10-4 18-14 28-30s22-24 30-22" fill="none" stroke="#3FA35B" stroke-width="12" stroke-linecap="round"/><path d="M64 14l22 22-38 38-26 4 4-26z" fill="#FFD54A" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/></svg>';
const ALBUM_ICON = '<svg viewBox="0 0 100 100"><rect x="14" y="20" width="72" height="60" rx="10" fill="#fff" stroke="#22304F" stroke-width="4"/><circle cx="36" cy="42" r="8" fill="#F2B91C"/><path d="M18 76l22-20 14 12 12-10 18 18" fill="#B9A8FF" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/></svg>';
const WORDS_ICON = '<svg viewBox="0 0 100 100"><rect x="8" y="16" width="52" height="40" rx="12" fill="#fff" stroke="#22304F" stroke-width="4"/><path d="M20 56l-4 14 16-14" fill="#fff" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><text x="34" y="44" font-size="22" font-weight="800" text-anchor="middle" fill="#F2672E" font-family="sans-serif">ES</text><rect x="42" y="42" width="50" height="38" rx="12" fill="#B9A8FF" stroke="#22304F" stroke-width="4"/><path d="M80 80l4 12-14-12" fill="#B9A8FF" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><text x="67" y="69" font-size="22" font-weight="800" text-anchor="middle" fill="#22304F" font-family="sans-serif">EN</text></svg>';

const GAMES_ICON = '<svg viewBox="0 0 100 100"><rect x="8" y="28" width="84" height="50" rx="25" fill="#B9A8FF" stroke="#22304F" stroke-width="5"/><path d="M30 42v22M19 53h22" stroke="#22304F" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="46" r="6" fill="#F2672E"/><circle cx="77" cy="58" r="6" fill="#3FA35B"/></svg>';

const AGE_LABEL: Record<Age, string> = { '3-4': '3–4 años', '5-6': '5–6 años', '7-9': '7–9 años' };

export function homeScreen(ctx: Ctx): Screen {
  const tile = (cls: string, icon: string, es: string, en: string, onClick: () => void) =>
    h('button', { class: `tile ${cls}`, onClick: () => (ctx.sayPair(es, en), onClick()) }, h('span', { class: 'tile-ico', html: icon }), es, h('small', null, en));

  const g = ctx.state.game;
  let cont: HTMLElement | null = null;
  if (g && !g.game.done && g.game.connected > 0) {
    const th = canvas(240, 180);
    drawThumb(th, g.key, 'silhouette');
    cont = h('button', { class: 'continue', onClick: () => ctx.show('dots') }, th, h('div', null, h('b', null, 'Continuar · Continue'), h('span', null, `${g.game.connected} de ${g.game.dots.length} puntos · ${['Personajes', 'Concierto'].includes(charOf(g.key).group) ? 'personaje misterioso' : 'dibujo misterioso'}`)));
  }

  // --- age and language, always visible for the adult ---
  const agePicker = h('div', { class: 'agepick', hidden: true },
    ...AGES.map((a) => h('button', {
      'aria-pressed': String(a === settings.age),
      onClick: () => {
        if (a !== settings.age) {
          updateSettings({ age: a });
          ctx.state.game = null; // dot counts and operations change with age
          saveSession(null);
          ctx.toast(`Edad: ${AGE_LABEL[a]}`);
        }
        ctx.show('home');
      },
    }, AGE_LABEL[a])),
    g ? h('small', null, 'Al cambiar la edad, el dibujo a medias empieza de nuevo.') : null,
  );
  const ageBtn = h('button', { class: 'hchip', 'aria-expanded': 'false', onClick: () => {
    agePicker.hidden = !agePicker.hidden;
    ageBtn.setAttribute('aria-expanded', String(!agePicker.hidden));
  } }, h('small', null, 'Edad'), AGE_LABEL[settings.age], h('i', null, 'cambiar'));

  const langBtn = h('button', { class: 'hchip', onClick: () => {
    const next = LANG_MODES[(LANG_MODES.indexOf(settings.lang) + 1) % LANG_MODES.length];
    updateSettings({ lang: next });
    ctx.sayPair('Hola', 'Hello');
    ctx.show('home');
  } }, h('small', null, 'Voz'), LANG_NAME[settings.lang], h('i', null, 'cambiar'));

  const prefs = h('div', { class: 'homeprefs' },
    ageBtn,
    langBtn,
    h('p', null, LANG_HINT[settings.lang], ' En ', h('b', null, 'Palabras'), ' puedes oír cada palabra en español o en inglés.'),
    agePicker,
  );

  const install = h('div', { class: 'install', hidden: true });
  renderInstall(install);

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'home' },
      tile('main', DOTS_ICON, 'Unir puntos', 'Connect the dots', () => ((ctx.state.pickFor = 'dots'), ctx.show('pick'))),
      tile('c2', COLOR_ICON, 'Colorear', 'Color', () => ((ctx.state.pickFor = 'color'), ctx.show('pick'))),
      tile('c3', ALBUM_ICON, 'Mi álbum', 'My album', () => ctx.show('album')),
      tile('c4', WORDS_ICON, 'Palabras', 'Words', () => ctx.show('words')),
      tile('c5', GAMES_ICON, 'Juegos', 'Games', () => ctx.show('games')),
      cont,
      install,
      prefs,
    ),
  );
  return { el };
}
