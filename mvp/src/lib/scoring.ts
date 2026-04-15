import type { UserPicks } from "@/lib/store";

// ─── Score rubric ─────────────────────────────────────────────────────────────
//
//  Group stage (per group):
//    3 pts  – 1st & 2nd place correct (both qualifiers right)
//    1 pt   – 1 of 2 qualifiers correct
//
//  Champion:        20 pts
//  Finalist:        10 pts
//  Golden Boot:     10 pts  (player)
//    +5 pts bonus   exact goal count
//  Assist King:     10 pts  (player)
//    +5 pts bonus   exact assist count
//  Golden Ball:     15 pts
//
//  Maximum possible: 12*3 + 20 + 10 + 15 + 15 + 15 = 36 + 75 = 111 pts

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResultData = {
  /** final group rankings: Record<groupLetter, teamId[]> */
  groupRankings:   Record<string, string[]>;
  championId:      string;
  finalistId:      string;
  topScorerId:     string;
  topScorerGoals:  number;
  topAssistId:     string;
  topAssistCount:  number;
  goldenBallId:    string;
};

export type ScoreBreakdown = {
  groups:     number;   // 0–36
  champion:   number;   // 0 or 20
  finalist:   number;   // 0 or 10
  goldenBoot: number;   // 0–15
  assistKing: number;   // 0–15
  goldenBall: number;   // 0 or 15
  total:      number;
};

// ─── Scorer ───────────────────────────────────────────────────────────────────

export function scorePicks(picks: UserPicks, result: ResultData): ScoreBreakdown {
  let groups = 0;

  for (const [g, resultOrder] of Object.entries(result.groupRankings)) {
    const userOrder = picks.groupRankings[g] ?? [];
    const resultTop2 = new Set(resultOrder.slice(0, 2));
    const userTop2   = (userOrder.slice(0, 2));

    const correctCount = userTop2.filter((id) => resultTop2.has(id)).length;

    if (correctCount === 2) {
      // Both qualifiers right — check order too for bonus
      const orderCorrect =
        userOrder[0] === resultOrder[0] && userOrder[1] === resultOrder[1];
      groups += orderCorrect ? 4 : 3;
    } else if (correctCount === 1) {
      groups += 1;
    }
  }

  const champion   = picks.championId === result.championId ? 20 : 0;
  const finalist   = picks.finalistId === result.finalistId ? 10 : 0;

  const scorerRight = picks.topScorerId === result.topScorerId;
  const goldenBoot  = scorerRight
    ? 10 + (picks.topScorerGoals === result.topScorerGoals ? 5 : 0)
    : 0;

  const assistRight = picks.topAssistId === result.topAssistId;
  const assistKing  = assistRight
    ? 10 + (picks.topAssistCount === result.topAssistCount ? 5 : 0)
    : 0;

  const goldenBall  = picks.goldenBallId === result.goldenBallId ? 15 : 0;

  const total = groups + champion + finalist + goldenBoot + assistKing + goldenBall;

  return { groups, champion, finalist, goldenBoot, assistKing, goldenBall, total };
}
