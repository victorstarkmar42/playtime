import { CHARACTERS, charOf } from '../content/characters';
import { createGame, type DotGame } from '../core/dotgame';
import { makeOps, type Op } from '../core/math';
import { settings } from '../core/settings';
import { readJSON, removeKey, writeJSON } from '../core/storage';
import type { Age, CharKey, Mode } from '../core/types';
import { toBoard } from '../render/character';

export interface GameSession {
  key: CharKey;
  age: Age;
  mode: Mode;
  /** ops[n] leads to dot n. */
  ops: Op[];
  game: DotGame;
  /** Reveal already stored in the album. */
  saved: boolean;
}

const KEY = 'pym-game';

export function newSession(key: CharKey): GameSession {
  const ch = charOf(key);
  const n = ch.counts[settings.age];
  return {
    key,
    age: settings.age,
    mode: settings.mode,
    ops: makeOps(n, settings.age),
    game: createGame(ch.dots(n).map(toBoard)),
    saved: false,
  };
}

export function saveSession(s: GameSession | null): void {
  if (!s || s.game.done) {
    removeKey(KEY);
    return;
  }
  writeJSON(KEY, { key: s.key, age: s.age, mode: s.mode, ops: s.ops, connected: s.game.connected });
}

/** The unfinished drawing from last time, if it still matches the current age and mode. */
export function restoreSession(): GameSession | null {
  const raw = readJSON<{ key?: string; age?: string; mode?: string; ops?: Op[]; connected?: number } | null>(KEY, null);
  if (!raw || !raw.key || !(raw.key in CHARACTERS)) return null;
  if (raw.age !== settings.age || raw.mode !== settings.mode || !Array.isArray(raw.ops)) return null;
  const ch = charOf(raw.key as CharKey);
  const n = ch.counts[settings.age];
  if (raw.ops.length !== n + 1) return null;
  return {
    key: ch.key,
    age: settings.age,
    mode: settings.mode,
    ops: raw.ops,
    game: createGame(ch.dots(n).map(toBoard), raw.connected ?? 0),
    saved: false,
  };
}
