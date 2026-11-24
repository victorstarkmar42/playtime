import { pop } from '../core/audio';
import { LANG_NAME, LANG_SHORT, speakOrder } from '../core/lang';
import { PlayTimer } from '../core/playtimer';
import { addMinutes } from '../core/progress';
import { settings, updateSettings } from '../core/settings';
import { LANG_MODES } from '../core/types';
import { Speaker } from '../core/voice';
import { newSession, restoreSession, saveSession } from '../game/session';
import type { AppState, Ctx, Screen, ScreenName } from './context';
import { h, holdToActivate, ICONS } from './dom';
import { albumScreen } from './screens/album';
import { colorScreen } from './screens/color';
import { gamesScreen } from './screens/games';
import { gatoScreen } from './screens/gato';
import { guessScreen } from './screens/guess';
import { abacusScreen } from './screens/abacus';
import { crosswordScreen } from './screens/crossword';
import { mathScreen } from './screens/mathgame';
import { mazeScreen } from './screens/maze';
import { parentQuizScreen } from './screens/parentquiz';
import { sudokuScreen } from './screens/sudoku';
import { dotsScreen } from './screens/dots';
import { homeScreen } from './screens/home';
import { onboardingScreen } from './screens/onboarding';
import { parentsScreen } from './screens/parents';
import { pickScreen } from './screens/pick';
import { wordsScreen } from './screens/words';

const SCREENS: Record<ScreenName, (ctx: Ctx) => Screen> = {
  onboarding: onboardingScreen,
  home: homeScreen,
  pick: pickScreen,
  dots: dotsScreen,
  color: colorScreen,
  album: albumScreen,
  words: wordsScreen,
  games: gamesScreen,
  gato: gatoScreen,
  guess: guessScreen,
  math: mathScreen,
  abacus: abacusScreen,
  maze: mazeScreen,
  sudoku: sudokuScreen,
  crossword: crosswordScreen,
  parentquiz: parentQuizScreen,
  parents: parentsScreen,
};

export function createApp(root: HTMLElement): void {
  root.classList.add('screen');

  const btnHome = h('button', { class: 'ibtn', 'aria-label': 'Inicio', title: 'Inicio', html: ICONS.home });
  const btnPick = h('button', { class: 'ibtn', 'aria-label': 'Dibujos', title: 'Dibujos', html: ICONS.grid });
  const btnLang = h('button', { class: 'langpill', title: 'Idioma de la voz' });
  const btnVoice = h('button', { class: 'ibtn', 'aria-label': 'Voz', title: 'Voz' });
  const btnHelp = h('button', { class: 'ibtn', 'aria-label': 'Ayuda', title: 'Ayuda', html: ICONS.hand });
  const btnParents = h('button', { class: 'ibtn gate', 'aria-label': 'Padres: mantén presionado', title: 'Padres: mantén presionado', html: ICONS.lock + '<span class="ring"></span>' });
  const bar = h('header', { class: 'appbar' }, btnHome, btnPick, h('span', { class: 'spacer' }), btnLang, btnVoice, btnHelp, btnParents);
  const views = h('main', { class: 'views' });
  const toastEl = h('div', { class: 'toast', hidden: true, role: 'status' });

  const nightBtn = h('button', { class: 'bigbtn alt gate' }, 'Seguir jugando (adulto: mantén presionado)', h('span', { class: 'ring' }));
  const night = h(
    'div',
    { class: 'night', hidden: true },
    h('div', { class: 'sky' }),
    h('div', null, h('div', { class: 'moon' }), h('h2', null, 'Es hora de descansar'), h('p', null, 'Time to rest · Tu dibujo está guardado'), nightBtn),
  );
  root.append(bar, views, night, toastEl);

  let current: { name: ScreenName; screen: Screen } | null = null;
  let toastTimer = 0;

  const speaker = new Speaker(() => settings.voice);
  const timer = new PlayTimer(
    () => settings.timeLimitMin,
    () => {
      night.hidden = false;
      ctx.sayPair('Es hora de descansar. Tu dibujo está guardado.', 'Time to rest. Your drawing is saved.');
    },
    () => addMinutes(1),
  );

  const state: AppState = { game: restoreSession(), colorKey: 'briz', freshColor: false, pickFor: 'dots' };

  const ctx: Ctx = {
    state,
    speaker,
    timer,
    show(name) {
      current?.screen.destroy?.();
      views.replaceChildren();
      const screen = SCREENS[name](ctx);
      views.append(screen.el);
      current = { name, screen };
      ctx.refreshBar();
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => (toastEl.hidden = true), 1800);
    },
    sayPair: (es, en) => speaker.say(speakOrder(settings.lang, es, en)),
    sayOne: (t, lang) => speaker.say([{ t, lang }]),
    sayItems: (items) => speaker.say(items),
    startGame(key) {
      state.game = newSession(key);
      saveSession(state.game);
      ctx.show('dots');
    },
    refreshBar() {
      const name = current?.name;
      bar.hidden = name === 'onboarding';
      btnHome.setAttribute('aria-pressed', String(name === 'home'));
      btnPick.setAttribute('aria-pressed', String(name === 'pick'));
      btnHelp.classList.toggle('off', !current?.screen.onHelp);
      btnLang.textContent = LANG_SHORT[settings.lang];
      btnVoice.innerHTML = settings.voice ? ICONS.speaker : ICONS.mute;
      btnVoice.setAttribute('aria-pressed', String(settings.voice));
    },
  };

  btnHome.onclick = () => ctx.show('home');
  btnPick.onclick = () => {
    state.pickFor = current?.name === 'color' ? 'color' : 'dots';
    ctx.show('pick');
  };
  btnLang.onclick = () => {
    const next = LANG_MODES[(LANG_MODES.indexOf(settings.lang) + 1) % LANG_MODES.length];
    updateSettings({ lang: next });
    ctx.toast(LANG_NAME[next]);
    ctx.sayPair('Hola', 'Hello');
    ctx.show(current?.name ?? 'home');
  };
  btnVoice.onclick = () => {
    updateSettings({ voice: !settings.voice });
    if (!settings.voice) speaker.cancel();
    ctx.refreshBar();
  };
  btnHelp.onclick = () => current?.screen.onHelp?.();
  holdToActivate(
    btnParents,
    1500,
    () => {
      pop(700, 0.2);
      ctx.show('parents');
    },
    () => ctx.toast('Padres: mantén presionado el candado'),
  );
  holdToActivate(nightBtn, 2000, () => {
    night.hidden = true;
    timer.reset();
  });

  if (location.search.includes('e2e')) {
    (window as unknown as { __pymShow?: (name: ScreenName, key?: string) => void }).__pymShow = (name, key) => {
      if (key && name === 'dots') return ctx.startGame(key as never);
      if (key) state.colorKey = key as never;
      ctx.show(name);
    };
  }
  ctx.show(settings.onboarded ? 'home' : 'onboarding');
}
