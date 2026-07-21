import type { ReactNode } from "react";

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="modal-bd">
      <div className="modal">{children}</div>
    </div>
  );
}
