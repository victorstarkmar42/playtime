import { pop } from '../core/audio';
import { LANG_NAME, LANG_SHORT, speakOrder, type SpeakItem } from '../core/lang';
import { PlayTimer } from '../core/playtimer';
import { addMinutes } from '../core/progress';
import { activePlan, settings, updateSettings } from '../core/settings';
import { LANG_MODES } from '../core/types';
import { Speaker } from '../core/voice';
import { newSession, restoreSession, saveSession } from '../game/session';
import type { AppState, Ctx, NavDir, Screen, ScreenName } from './context';
import { h, holdToActivate, ICONS } from './dom';
import { setupFullscreen } from './fullscreen';
import { createRestBreak } from './restbreak';
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
import { lettersScreen } from './screens/letters';
import { paintnumScreen } from './screens/paintnum';
import { bastaScreen } from './screens/basta';
import { buildScreen } from './screens/build';
import { globeScreen } from './screens/globe';
import { problemsScreen } from './screens/problems';
import { storiesScreen } from './screens/stories';
import { syllablesScreen } from './screens/syllables';
import { tablesScreen } from './screens/tables';
import { revealScreen } from './screens/reveal';
import { traceScreen } from './screens/trace';
import { dotsScreen } from './screens/dots';
import { homeScreen } from './screens/home';
import { onboardingScreen } from './screens/onboarding';
import { parentsScreen } from './screens/parents';
import { pickScreen } from './screens/pick';
import { wordsScreen } from './screens/words';

const TITLES: Partial<Record<ScreenName, [string, string]>> = {
  home: ['PlayHour', ''],
  pick: ['Dibujos', 'Drawings'],
  dots: ['Unir puntos', 'Connect the dots'],
  color: ['Colorear', 'Coloring'],
  album: ['Álbum', 'Album'],
  words: ['Palabras', 'Words'],
  games: ['Juegos', 'Games'],
  globe: ['Países del mundo', 'Countries'],
  parents: ['Padres', 'Parents'],
  parentquiz: ['Evaluación', 'Parents quiz'],
};

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
  letters: lettersScreen,
  trace: traceScreen,
  reveal: revealScreen,
  paintnum: paintnumScreen,
  basta: bastaScreen,
  build: buildScreen,
  globe: globeScreen,
  stories: storiesScreen,
  syllables: syllablesScreen,
  tables: tablesScreen,
  problems: problemsScreen,
  parentquiz: parentQuizScreen,
  parents: parentsScreen,
};

export function createApp(root: HTMLElement): void {
  root.classList.add('screen');

  // Top bar, like a phone app: back arrow and title on the left; help, voice and "more" on the right.
  const btnBack = h('button', { class: 'ibtn nav', 'aria-label': 'Atrás', title: 'Atrás', 'data-nav': 'back', html: ICONS.back });
  const titleMain = h('span', { class: 't-main' });
  const titleSub = h('span', { class: 't-sub' });
  const titleEl = h('div', { class: 'apptitle' }, titleMain, titleSub);
  const btnHelp = h('button', { class: 'ibtn', 'aria-label': 'Ayuda', title: 'Ayuda', html: ICONS.help });
  const btnVoice = h('button', { class: 'ibtn', 'aria-label': 'Voz', title: 'Voz' });
  const btnMore = h('button', { class: 'ibtn', 'aria-label': 'Más opciones', title: 'Más', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'data-nav': 'more', html: ICONS.more });
  const item = (nav: string, icon: string, label: string, extra = '') =>
    h('button', { class: `mitem${extra}`, role: 'menuitem', 'data-nav': nav }, h('span', { class: 'mico', html: icon }), h('span', { class: 'mlabel' }, label));
  const btnHome = item('home', ICONS.home, 'Inicio');
  const btnPick = item('pick', ICONS.grid, 'Dibujos');
  const btnLang = item('lang', ICONS.lang, 'Idioma de la voz');
  const btnParents = item('parents', ICONS.lock, 'Padres (mantén presionado)', ' gate');
  btnParents.append(h('span', { class: 'ring' }));
  const menu = h('div', { class: 'amenu', role: 'menu', hidden: true }, btnHome, btnPick, btnLang, btnParents);
  const bar = h('header', { class: 'appbar' }, btnBack, titleEl, btnHelp, btnVoice, btnMore, menu);
  const setMenu = (open: boolean) => {
    menu.hidden = !open;
    btnMore.setAttribute('aria-expanded', String(open));
  };
  const views = h('main', { class: 'views' });
  const toastEl = h('div', { class: 'toast', hidden: true, role: 'status' });

  const nightBtn = h('button', { class: 'bigbtn alt gate' }, 'Seguir jugando (adulto: mantén presionado)', h('span', { class: 'ring' }));
  const night = h(
    'div',
    { class: 'night', hidden: true },
    h('div', { class: 'sky' }),
    h('div', null, h('div', { class: 'moon' }), h('h2', null, 'Es hora de descansar'), h('p', null, 'Time to rest · Tu dibujo está guardado'), nightBtn),
  );
  const restBreak = createRestBreak((es, en) => ctx.sayPair(es, en), () => settings.reduced);
  root.append(bar, views, restBreak.el, night, toastEl);

  let current: { name: ScreenName; screen: Screen } | null = null;
  /** Where each screen was opened from (Países from Inicio goes back to Inicio; Padres to where it was opened). */
  const openedFrom: Partial<Record<ScreenName, ScreenName>> = {};
  let toastTimer = 0;

  const speaker = new Speaker(() => settings.voice, (l) => (l === 'es' ? settings.voiceEs : settings.voiceEn));
  const timer = new PlayTimer(
    () => activePlan(),
    () => {
      if (!night.hidden) return;
      timer.pause(); // (a break already showing restarts: only possible from "Probar")
      restBreak.start(activePlan().breakSec, settings.supervised, () => {
        timer.clock.breakDone();
        timer.resume();
      });
    },
    () => {
      timer.pause();
      night.hidden = false;
      ctx.sayPair('Es hora de descansar. Tu dibujo está guardado.', 'Time to rest. Your drawing is saved.');
    },
    () => addMinutes(1),
    () => !current?.screen.busy?.(),
  );

  const state: AppState = { game: restoreSession(), colorKey: 'briz', freshColor: false, pickFor: 'dots' };

  let lastSay = -1e9;
  const say = (items: SpeakItem[]) => {
    lastSay = performance.now();
    speaker.say(items);
  };

  const ctx: Ctx = {
    state,
    speaker,
    timer,
    show(name, dir: NavDir = 'fwd') {
      // leaving a screen silences what it was saying, except words said by the tap that opened the next one
      if (performance.now() - lastSay > 400) speaker.cancel();
      setMenu(false);
      if (dir === 'fwd' && current && current.name !== name) openedFrom[name] = current.name;
      current?.screen.destroy?.();
      views.replaceChildren();
      const screen = SCREENS[name](ctx);
      if (dir !== 'none') screen.el.classList.add(dir === 'back' ? 'enter-back' : 'enter-fwd');
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
    sayPair: (es, en) => say(speakOrder(settings.lang, es, en)),
    sayOne: (t, lang) => say([{ t, lang }]),
    sayItems: (items) => say(items),
    startGame(key) {
      state.game = newSession(key);
      saveSession(state.game);
      ctx.show('dots');
    },
    refreshBar() {
      const name = current?.name;
      bar.hidden = name === 'onboarding';
      root.classList.toggle('reduced', settings.reduced);
      const to = backTarget(name);
      btnBack.hidden = !to;
      btnBack.setAttribute('aria-label', to ? `Atrás: ${TITLES[to]?.[0] ?? ''}` : 'Atrás');
      btnHome.setAttribute('aria-current', String(name === 'home'));
      btnPick.setAttribute('aria-current', String(name === 'pick'));
      btnHelp.classList.toggle('off', !current?.screen.onHelp);
      (btnLang.querySelector('.mlabel') as HTMLElement).textContent = `Idioma de la voz: ${LANG_SHORT[settings.lang]}`;
      btnVoice.innerHTML = settings.voice ? ICONS.speaker : ICONS.mute;
      btnVoice.setAttribute('aria-pressed', String(settings.voice));
      syncTitle();
    },
  };

  /** Title of the bar: the screen's own heading (kept in sync as the screen changes), or a fixed name. */
  function syncTitle(): void {
    const name = current?.name;
    const h2 = current?.screen.el.querySelector('.ghead h2');
    let main = '';
    let sub = '';
    if (h2) {
      main = [...h2.childNodes].filter((n) => !(n instanceof HTMLElement && n.tagName === 'SMALL')).map((n) => n.textContent ?? '').join('').trim();
      sub = h2.querySelector('small')?.textContent?.trim() ?? '';
    }
    if (!main && name) [main, sub] = TITLES[name] ?? ['', ''];
    if (titleMain.textContent !== main) titleMain.textContent = main;
    if (titleSub.textContent !== sub) titleSub.textContent = sub;
    titleSub.hidden = !sub;
    titleEl.classList.toggle('brand', name === 'home');
  }
  let titleQueued = false;
  new MutationObserver(() => {
    if (titleQueued) return;
    titleQueued = true;
    requestAnimationFrame(() => {
      titleQueued = false;
      syncTitle();
      const to = backTarget(current?.name);
      btnBack.hidden = !to;
    });
  }).observe(views, { childList: true, subtree: true, characterData: true });

  /** One way back for the arrow and the phone's back button: first a step inside the screen, then the previous screen. */
  function goBack(fromSystem: boolean): void {
    setMenu(false);
    if (!night.hidden || restBreak.active()) return; // rest screens: back does nothing
    if (current?.screen.back?.()) {
      speaker.cancel();
      return;
    }
    const to = backTarget(current?.name);
    if (current?.name === 'color' || current?.name === 'dots') state.pickFor = current.name;
    if (to) ctx.show(to, 'back');
    else if (fromSystem && current?.name === 'home') ctx.toast('Para salir, cierra la app desde el celular');
  }

  btnBack.onclick = () => goBack(false);
  btnMore.onclick = (e) => {
    e.stopPropagation();
    setMenu(menu.hidden === true);
  };
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !menu.contains(e.target as Node) && e.target !== btnMore && !btnMore.contains(e.target as Node)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
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
    ctx.show(current?.name ?? 'home', 'none');
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
    () => ctx.toast('Padres: mantén presionado el botón'),
  );
  holdToActivate(nightBtn, 2000, () => {
    night.hidden = true;
    timer.reset();
  });

  // --- phone back button: move back inside the app and never leave it ---
  // A spare history entry catches the back press; we put it back each time. Chrome skips entries
  // added before the first touch, so the entry is (re)added on touch as well.
  let armed = false;
  const arm = () => {
    if (armed) return;
    history.pushState({ pym: 'trap' }, '');
    armed = true;
  };
  function backTarget(name: ScreenName | undefined): ScreenName | null {
    if (!name || name === 'home' || name === 'onboarding') return null;
    if (name === 'globe' && openedFrom.globe === 'home') return 'home';
    if (name === 'parents') {
      const from = openedFrom.parents;
      return from && !['parents', 'parentquiz', 'onboarding'].includes(from) ? from : 'home';
    }
    if (['gato', 'guess', 'math', 'abacus', 'maze', 'sudoku', 'crossword', 'letters', 'trace', 'reveal', 'paintnum', 'basta', 'build', 'globe', 'stories', 'syllables', 'tables', 'problems'].includes(name)) return 'games';
    if (name === 'parentquiz') return 'parents';
    if (name === 'dots') return 'pick';
    if (name === 'color') return 'pick';
    return 'home';
  }
  window.addEventListener('popstate', () => {
    armed = false;
    arm();
    goBack(true);
  });
  let touched = false;
  const onUser = () => {
    if (!touched) {
      touched = true;
      armed = false; // the entry added at load may be skippable: add one with the touch
    }
    arm();
  };
  for (const ev of ['pointerdown', 'keydown'] as const) window.addEventListener(ev, onUser, { capture: true });
  if (history.state?.pym !== 'trap') history.replaceState({ pym: 'base' }, '');
  else armed = true;
  arm();

  if (!location.search.includes('e2e')) setupFullscreen(() => settings.fullscreen);

  if (location.search.includes('e2e')) {
    (window as unknown as { __pymShow?: (name: ScreenName, key?: string) => void }).__pymShow = (name, key) => {
      if (key && name === 'dots') return ctx.startGame(key as never);
      if (key) state.colorKey = key as never;
      ctx.show(name);
    };
  }
  ctx.show(settings.onboarded ? 'home' : 'onboarding');
}
