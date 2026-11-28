import type { SpeakItem } from '../core/lang';
import type { PlayTimer } from '../core/playtimer';
import type { CharKey, Lang } from '../core/types';
import type { Speaker } from '../core/voice';
import type { GameSession } from '../game/session';
import type { PicArt } from './mypic';

export type ScreenName = 'onboarding' | 'home' | 'pick' | 'dots' | 'color' | 'album' | 'words' | 'games' | 'gato' | 'guess' | 'math' | 'abacus' | 'maze' | 'sudoku' | 'crossword' | 'letters' | 'trace' | 'reveal' | 'paintnum' | 'basta' | 'build' | 'globe' | 'stories' | 'syllables' | 'tables' | 'problems' | 'parents' | 'parentquiz' | 'mypic';

export type NavDir = 'fwd' | 'back' | 'none';

export interface Screen {
  el: HTMLElement;
  destroy?(): void;
  /** The hand button in the top bar. */
  onHelp?(): void;
  /** True while an eye break must wait (e.g. a timed round is running). */
  busy?(): boolean;
  /**
   * Back arrow / phone back button: go one step back inside the screen (questions → story → list).
   * Return false when there is no inner step left, and the app opens the previous screen.
   */
  back?(): boolean;
}

export interface AppState {
  game: GameSession | null;
  colorKey: CharKey;
  /** Start the colouring page empty next time it opens. */
  freshColor: boolean;
  /** What the gallery is choosing a drawing for. */
  pickFor: 'dots' | 'color';
  /** A picture from "Mis dibujos" to colour instead of `colorKey` (null: colour `colorKey`). */
  colorPic: PicArt | null;
  /** The photo or image a grown-up just chose in Padres, for the "Nuevo dibujo" screen. */
  newPic: File | null;
}

export interface Ctx {
  state: AppState;
  speaker: Speaker;
  timer: PlayTimer;
  /** Opens a screen. 'back' animates as a return; 'none' redraws in place (e.g. after a language change). */
  show(name: ScreenName, dir?: NavDir): void;
  toast(msg: string): void;
  /** Says a phrase in the parent's chosen language order. */
  sayPair(es: string, en: string): void;
  sayOne(t: string, lang: Lang): void;
  sayItems(items: SpeakItem[]): void;
  startGame(key: CharKey): void;
  refreshBar(): void;
}
