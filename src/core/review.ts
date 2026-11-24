import type { Skill } from './math';
import type { SkillStat } from './progress';

/**
 * Parents' review plan, built from first-try accuracy per skill and grounded in study techniques with
 * good evidence: spaced repetition, interleaved practice and concrete → pictorial → abstract.
 * It is guidance, not a certification or a diagnosis.
 */

export type Technique = 'spaced' | 'interleaved' | 'cpa';

export interface ReviewItem {
  skill: Skill;
  accuracy: number;
  technique: Technique;
}

export interface ReviewPlan {
  review: ReviewItem[];
  mastered: Skill[];
}

/** Below this many tries there is not enough to tell. */
export const MIN_TRIES = 5;

export function reviewPlan(skills: Record<Skill, SkillStat>): ReviewPlan {
  const rows = (Object.keys(skills) as Skill[])
    .filter((k) => skills[k].tries >= MIN_TRIES)
    .map((k) => ({ skill: k, accuracy: Math.round((skills[k].right / skills[k].tries) * 100) }));
  const weak = rows.filter((r) => r.accuracy < 80).sort((a, b) => a.accuracy - b.accuracy);
  const mixPair = weak.some((r) => r.skill === 'sum') && weak.some((r) => r.skill === 'sub');
  const review = weak.slice(0, 3).map((r) => ({
    ...r,
    technique: (r.accuracy < 60 ? 'cpa' : mixPair && (r.skill === 'sum' || r.skill === 'sub') ? 'interleaved' : 'spaced') as Technique,
  }));
  const mastered = rows.filter((r) => r.accuracy >= 85).map((r) => r.skill);
  return { review, mastered };
}
