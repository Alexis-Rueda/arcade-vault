import type { User, ScoreEntry } from "@/app/data/types";

const KEYS = {
  user: "av_user",
  scores: "av_scores",
} as const;

const listeners = new Set<() => void>();

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

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
  notify();
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
    notify();
  } catch {
    return;
  }
}
