import type { SpeakItem } from '../core/lang';
import type { PlayTimer } from '../core/playtimer';
import type { CharKey, Lang } from '../core/types';
import type { Speaker } from '../core/voice';
import type { GameSession } from '../game/session';

export type ScreenName = 'onboarding' | 'home' | 'pick' | 'dots' | 'color' | 'album' | 'words' | 'games' | 'gato' | 'guess' | 'math' | 'abacus' | 'maze' | 'sudoku' | 'crossword' | 'letters' | 'trace' | 'reveal' | 'paintnum' | 'basta' | 'build' | 'globe' | 'parents' | 'parentquiz';

export interface Screen {
  el: HTMLElement;
  destroy?(): void;
  /** The hand button in the top bar. */
  onHelp?(): void;
  /** True while an eye break must wait (e.g. a timed round is running). */
  busy?(): boolean;
}

export interface AppState {
  game: GameSession | null;
  colorKey: CharKey;
  /** Start the colouring page empty next time it opens. */
  freshColor: boolean;
  /** What the gallery is choosing a drawing for. */
  pickFor: 'dots' | 'color';
}

export interface Ctx {
  state: AppState;
  speaker: Speaker;
  timer: PlayTimer;
  show(name: ScreenName): void;
  toast(msg: string): void;
  /** Says a phrase in the parent's chosen language order. */
  sayPair(es: string, en: string): void;
  sayOne(t: string, lang: Lang): void;
  sayItems(items: SpeakItem[]): void;
  startGame(key: CharKey): void;
  refreshBar(): void;
}
