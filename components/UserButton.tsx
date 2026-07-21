"use client";

import type { User } from "@/app/data/types";
import { Button } from "./Button";

export function UserButton({ user, onLogin, onLogout }: {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  if (user) {
    return <Button variant="ghost" className="auth-btn" onClick={onLogout}>{user.name} ▾</Button>;
  }
  return <Button className="auth-btn" onClick={onLogin}>Iniciar Sesión</Button>;
}
