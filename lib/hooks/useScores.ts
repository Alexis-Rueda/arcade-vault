"use client";

import { useSyncExternalStore, useCallback } from "react";
import { readScores, appendScore, subscribe } from "@/lib/storage";
import type { ScoreEntry } from "@/app/data/types";

let scoresCache: ScoreEntry[] | undefined;

function getSnapshot() {
  if (scoresCache === undefined) {
    scoresCache = readScores();
  }
  return scoresCache;
}

const emptyArray: ScoreEntry[] = [];
const getServerSnapshot = () => emptyArray;

function subscribeWithCache(cb: () => void) {
  return subscribe(() => {
    scoresCache = readScores();
    cb();
  });
}

export function useScores() {
  const scores = useSyncExternalStore(subscribeWithCache, getSnapshot, getServerSnapshot);

  const addScore = useCallback((entry: Omit<ScoreEntry, "at">) => {
    appendScore(entry);
  }, []);

  return { scores, addScore };
}
