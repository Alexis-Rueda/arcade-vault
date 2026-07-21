import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "default" | "ghost" | "magenta" | "yellow";
type Size = "default" | "lg" | "xl";

export function Button({
  children, variant = "default", size = "default", className = "", ...props
}: {
  children: ReactNode; variant?: Variant; size?: Size; className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = [
    "btn",
    variant === "ghost" ? "ghost" : variant === "magenta" ? "magenta" : variant === "yellow" ? "yellow" : "",
    size === "lg" ? "lg" : size === "xl" ? "xl" : "",
    className,
  ].filter(Boolean).join(" ");
  return <button className={cls} {...props}>{children}</button>;
}
