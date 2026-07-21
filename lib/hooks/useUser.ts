"use client";

import { useSyncExternalStore, useCallback } from "react";
import { readUser, writeUser, subscribe } from "@/lib/storage";
import type { User } from "@/app/data/types";

const getSnapshot = () => readUser();
const getServerSnapshot = () => null;

export function useUser() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setUser = useCallback((u: User | null) => {
    writeUser(u);
  }, []);

  return { user, setUser };
}
