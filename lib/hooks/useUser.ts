"use client";

import { useSyncExternalStore, useCallback } from "react";
import { readUser, writeUser, subscribe } from "@/lib/storage";
import type { User } from "@/app/data/types";

let userCache: User | null | undefined;

function getSnapshot() {
  if (userCache === undefined) {
    userCache = readUser();
  }
  return userCache;
}

const getServerSnapshot = () => null;

function subscribeWithCache(cb: () => void) {
  return subscribe(() => {
    userCache = readUser();
    cb();
  });
}

export function useUser() {
  const user = useSyncExternalStore(subscribeWithCache, getSnapshot, getServerSnapshot);

  const setUser = useCallback((u: User | null) => {
    writeUser(u);
  }, []);

  return { user, setUser };
}
