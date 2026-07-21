import type { User, ScoreEntry } from "@/app/data/types";

const KEYS = {
  user: "av_user",
  scores: "av_scores",
} as const;

export function readUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(KEYS.user) || "null");
  } catch {
    return null;
  }
}

export function writeUser(u: User | null): void {
  if (u === null) {
    localStorage.removeItem(KEYS.user);
  } else {
    localStorage.setItem(KEYS.user, JSON.stringify(u));
  }
}

export function readScores(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.scores) || "[]");
  } catch {
    return [];
  }
}

export function appendScore(entry: Omit<ScoreEntry, "at">): void {
  try {
    const all: ScoreEntry[] = JSON.parse(localStorage.getItem(KEYS.scores) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(KEYS.scores, JSON.stringify(all));
  } catch {
    return;
  }
}
