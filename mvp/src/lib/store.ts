"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserPicks = {
  /** userId who made these picks */
  userId: string;
  /** ISO timestamp when locked */
  lockedAt: string;
  /** group rankings: Record<groupLetter, teamId[]> */
  groupRankings: Record<string, string[]>;
  /** team id */
  championId: string;
  /** team id */
  finalistId: string;
  /** player id */
  topScorerId: string;
  topScorerGoals: number;
  /** player id */
  topAssistId: string;
  topAssistCount: number;
  /** player id */
  goldenBallId: string;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  points: number;
  /** true = seeded AI opponent, false = real user */
  isBot: boolean;
  picks?: UserPicks;
};

export type AuthUser = {
  id: string;
  displayName: string;
  createdAt: string;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  auth:        "wandx:auth",
  picks:       "wandx:picks",
  leaderboard: "wandx:leaderboard",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function getAuthUser(): AuthUser | null {
  return read<AuthUser>(KEYS.auth);
}

export function signIn(displayName: string): AuthUser {
  const id = `user-${displayName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
  const user: AuthUser = { id, displayName, createdAt: new Date().toISOString() };
  write(KEYS.auth, user);
  return user;
}

export function signOut(): void {
  remove(KEYS.auth);
}

// ─── Picks ────────────────────────────────────────────────────────────────────

export function getUserPicks(userId: string): UserPicks | null {
  const all = read<Record<string, UserPicks>>(KEYS.picks) ?? {};
  return all[userId] ?? null;
}

export function saveUserPicks(picks: UserPicks): void {
  const all = read<Record<string, UserPicks>>(KEYS.picks) ?? {};
  all[picks.userId] = picks;
  write(KEYS.picks, all);
}

export function deleteUserPicks(userId: string): void {
  const all = read<Record<string, UserPicks>>(KEYS.picks) ?? {};
  delete all[userId];
  write(KEYS.picks, all);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

/** Seeded AI opponents — shown before anyone has scored real points */
const SEED_BOTS: LeaderboardEntry[] = [
  { userId: "bot-1", displayName: "AlgoFC",       points: 0, isBot: true },
  { userId: "bot-2", displayName: "TacticAI",     points: 0, isBot: true },
  { userId: "bot-3", displayName: "xG_Master",    points: 0, isBot: true },
  { userId: "bot-4", displayName: "PressHigh99",  points: 0, isBot: true },
  { userId: "bot-5", displayName: "DeepBlocker",  points: 0, isBot: true },
  { userId: "bot-6", displayName: "ParkTheBus",   points: 0, isBot: true },
  { userId: "bot-7", displayName: "NullStriker",  points: 0, isBot: true },
  { userId: "bot-8", displayName: "OverlappingLB", points: 0, isBot: true },
];

export function getLeaderboard(): LeaderboardEntry[] {
  const stored = read<LeaderboardEntry[]>(KEYS.leaderboard);
  return stored ?? SEED_BOTS;
}

export function upsertLeaderboardEntry(entry: LeaderboardEntry): void {
  const board = getLeaderboard();
  const idx = board.findIndex((e) => e.userId === entry.userId);
  if (idx >= 0) {
    board[idx] = entry;
  } else {
    board.push(entry);
  }
  board.sort((a, b) => b.points - a.points);
  write(KEYS.leaderboard, board);
}

export function resetLeaderboard(): void {
  write(KEYS.leaderboard, SEED_BOTS);
}
