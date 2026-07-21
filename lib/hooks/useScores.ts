"use client";

import { useSyncExternalStore, useCallback } from "react";
import { readScores, appendScore, subscribe } from "@/lib/storage";
import type { ScoreEntry } from "@/app/data/types";

const getSnapshot = () => readScores();
const getServerSnapshot = (): ScoreEntry[] => [];

export function useScores() {
  const scores = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addScore = useCallback((entry: Omit<ScoreEntry, "at">) => {
    appendScore(entry);
  }, []);

  return { scores, addScore };
}
