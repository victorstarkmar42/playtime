import { charOf } from '../../content/characters';
import { LANG_NAME } from '../../core/lang';
import { settings, updateSettings } from '../../core/settings';
import { AGES, LANG_MODES, type Age } from '../../core/types';
import { saveSession } from '../../game/session';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';
import { renderInstall } from '../pwa';
import { GAME_CATS, gamesForAge, lastGame, openGame } from './games';
import { listAlbum } from '../../core/album';

const GLOBE_ICON = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#3B8FD9" stroke="#22304F" stroke-width="4"/><path d="M24 30c8-6 18-4 20 4s-6 10-4 18-8 12-14 6-10-22-2-28zM56 22c10 0 20 6 22 14-6 2-10-2-16 2s-2 12-8 14-10-8-8-16 2-14 10-14zM60 62c6-2 14 0 14 6s-6 12-12 10-8-14-2-16z" fill="#5DBB63" stroke="#22304F" stroke-width="3" stroke-linejoin="round"/><ellipse cx="38" cy="30" rx="12" ry="6" fill="#fff" opacity=".25"/></svg>';
const COLOR_ICON = '<svg viewBox="0 0 100 100"><path d="M22 78c10-4 18-14 28-30s22-24 30-22" fill="none" stroke="#3FA35B" stroke-width="12" stroke-linecap="round"/><path d="M64 14l22 22-38 38-26 4 4-26z" fill="#FFD54A" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/></svg>';
const ALBUM_ICON = '<svg viewBox="0 0 100 100"><rect x="14" y="20" width="72" height="60" rx="10" fill="#fff" stroke="#22304F" stroke-width="4"/><circle cx="36" cy="42" r="8" fill="#F2B91C"/><path d="M18 76l22-20 14 12 12-10 18 18" fill="#B9A8FF" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/></svg>';
const WORDS_ICON = '<svg viewBox="0 0 100 100"><rect x="8" y="16" width="52" height="40" rx="12" fill="#fff" stroke="#22304F" stroke-width="4"/><path d="M20 56l-4 14 16-14" fill="#fff" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><text x="34" y="44" font-size="22" font-weight="800" text-anchor="middle" fill="#F2672E" font-family="sans-serif">ES</text><rect x="42" y="42" width="50" height="38" rx="12" fill="#B9A8FF" stroke="#22304F" stroke-width="4"/><path d="M80 80l4 12-14-12" fill="#B9A8FF" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><text x="67" y="69" font-size="22" font-weight="800" text-anchor="middle" fill="#22304F" font-family="sans-serif">EN</text></svg>';

const GAMES_ICON = '<svg viewBox="0 0 100 100"><rect x="8" y="28" width="84" height="50" rx="25" fill="#B9A8FF" stroke="#22304F" stroke-width="5"/><path d="M30 42v22M19 53h22" stroke="#22304F" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="46" r="6" fill="#F2672E"/><circle cx="77" cy="58" r="6" fill="#3FA35B"/></svg>';
const GEAR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>';

const AGE_LABEL: Record<Age, string> = { '3-4': '3–4 años', '5-6': '5–6 años', '7-9': '7–9 años' };

/** An original mystery figure (a fish), half-joined; the next dot is the one that shines. */
const HERO_DOTS = (() => {
  const P = [[20, 62], [52, 32], [92, 20], [132, 28], [162, 50], [194, 30], [188, 62], [194, 94], [162, 76], [132, 98], [92, 106], [52, 94]];
  const NUM = [[14, 52], [48, 22], [92, 10], [136, 18], [170, 44], [203, 24], [200, 64], [208, 100], [168, 90], [134, 114], [92, 119], [46, 108]];
  const done = 7;
  const line = P.slice(0, done).map((p) => p.join(',')).join(' ');
  const dots = P.map(([x, y], i) => (i === done
    ? `<circle class="hhero-next" cx="${x}" cy="${y}" r="11" fill="#FFE53D" opacity=".6"/><circle cx="${x}" cy="${y}" r="6.5" fill="#F2672E" stroke="#22304F" stroke-width="2"/>`
    : `<circle cx="${x}" cy="${y}" r="5" fill="#F2672E"/>`)).join('');
  const nums = NUM.map(([x, y], i) => `<text x="${x}" y="${y}"${i === done ? ' font-weight="800" font-size="11"' : ''}>${i + 1}</text>`).join('');
  return `<svg viewBox="0 0 220 124"><polyline points="${line}" fill="none" stroke="#22304F" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>${dots}<g font-family="Lexend, sans-serif" font-size="9" font-weight="500" fill="#22304F" text-anchor="middle">${nums}</g></svg>`;
})();

export function homeScreen(ctx: Ctx): Screen {

  const g = ctx.state.game;
  const play = () => h('span', { class: 'hcont-go', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>' });
  let cont: HTMLElement | null = null;
  if (g && !g.game.done && g.game.connected > 0) {
    // a drawing left half-way comes first
    const th = canvas(240, 180);
    drawThumb(th, g.key, 'silhouette');
    cont = h('button', { class: 'continue', onClick: () => ctx.show('dots') }, th, h('div', null, h('b', null, 'Continuar · Continue'), h('span', null, `${g.game.connected} de ${g.game.dots.length} puntos · ${['Personajes', 'Concierto'].includes(charOf(g.key).group) ? 'personaje misterioso' : 'dibujo misterioso'}`)));
  } else {
    const last = lastGame();
    if (last)
      cont = h('button', { class: `hcont cat-${last.cat}`, 'aria-label': `Seguir jugando: ${last.es}`, onClick: () => openGame(ctx, last) },
        h('span', { class: 'hcont-ico', html: last.icon }),
        h('span', { class: 'hcont-txt' }, h('small', null, 'Seguir jugando'), h('b', null, last.es)),
        play());
  }

  // --- age and language: one quiet line for the adult; the explanation lives in Padres ---
  const agePicker = h('div', { class: 'agepick' },
    h('small', { class: 'hset-label' }, 'Edad'),
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
  const langRow = h('div', { class: 'agepick' },
    h('small', { class: 'hset-label' }, 'Voz'),
    ...LANG_MODES.map((l) => h('button', {
      'aria-pressed': String(l === settings.lang),
      onClick: () => {
        updateSettings({ lang: l });
        ctx.sayPair('Hola', 'Hello');
        ctx.show('home', 'none');
      },
    }, LANG_NAME[l])),
  );
  const panel = h('div', { class: 'hset-panel', hidden: true }, agePicker, langRow);
  const setBtn = h('button', { class: 'hset', 'aria-expanded': 'false', 'aria-label': `Ajustes: ${AGE_LABEL[settings.age]}, voz ${LANG_NAME[settings.lang]}`, onClick: () => {
    panel.hidden = !panel.hidden;
    setBtn.setAttribute('aria-expanded', String(!panel.hidden));
  } }, h('span', { 'aria-hidden': 'true', html: GEAR_ICON }), `${AGE_LABEL[settings.age]} · ${LANG_NAME[settings.lang]}`);

  const prefs = h('div', { class: 'homeprefs' }, setBtn, panel);

  const install = h('div', { class: 'install', hidden: true });
  renderInstall(install);

  // "Unir puntos" is the cover: a mystery drawing half-joined, the next number shining
  const hero = h('button', { class: 'tile main hhero', 'aria-label': 'Unir puntos: jugar', onClick: () => (ctx.sayPair('Unir puntos', 'Connect the dots'), (ctx.state.pickFor = 'dots'), ctx.show('pick')) },
    h('span', { class: 'hhero-head' }, h('b', null, 'Unir puntos'), h('small', null, 'Connect the dots')),
    h('span', { class: 'hhero-ask' }, '¿Qué dibujo se esconde hoy?'),
    h('span', { class: 'hhero-art', html: HERO_DOTS }),
    h('span', { class: 'hhero-go' }, h('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>' }), 'Jugar'));

  const quad = (cls: string, icon: string, es: string, en: string, onClick: () => void, extra?: HTMLElement) =>
    h('button', { class: `tile hq ${cls}`, onClick: () => (ctx.sayPair(es, en), onClick()) },
      h('span', { class: 'hq-top' }, h('span', { class: 'tile-ico', html: icon }), extra ?? null),
      h('span', { class: 'hq-name' }, es, h('small', null, en)));
  const catDots = h('span', { class: 'hq-cats', 'aria-hidden': 'true' }, ...GAME_CATS.map((c) => h('i', { class: `cat-${c.id}` })));

  const albumCount = h('small', null);
  void listAlbum().then((items) => (albumCount.textContent = items.length ? ` · ${items.length} ${items.length === 1 ? 'dibujo' : 'dibujos'}` : '')).catch(() => {});
  const album = h('button', { class: 'tile halbum', onClick: () => (ctx.sayPair('Mi álbum', 'My album'), ctx.show('album')) },
    h('span', { class: 'tile-ico', html: ALBUM_ICON }),
    h('span', { class: 'halbum-name' }, 'Mi álbum', albumCount),
    h('span', { class: 'halbum-go', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' }));

  const el = h(
    'div',
    { class: 'view homeview' },
    h('div', { class: 'home' },
      hero,
      h('div', { class: 'hside' },
        cont,
        h('div', { class: 'hquad' },
          quad('c2', COLOR_ICON, 'Colorear', 'Color', () => ((ctx.state.pickFor = 'color'), ctx.show('pick'))),
          quad('c4', WORDS_ICON, 'Palabras', 'Words', () => ctx.show('words')),
          quad('c5', GAMES_ICON, 'Juegos', `${gamesForAge().length} juegos · Games`, () => ctx.show('games'), catDots),
          quad('c6', GLOBE_ICON, 'Países', 'Countries', () => ctx.show('globe')),
        ),
        album,
      ),
      install,
      prefs,
    ),
  );
  return {
    el,
    onHelp: () => ctx.sayPair(
      'Toca Unir puntos para descubrir el dibujo escondido. También puedes colorear, oír palabras, jugar o conocer países.',
      'Touch Connect the dots to find the hidden drawing. You can also color, hear words, play games or visit countries.',
    ),
  };
}
