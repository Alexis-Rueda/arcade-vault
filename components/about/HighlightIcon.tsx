import type { AboutHighlight } from "@/app/data/about";

type HighlightIconProps = {
  kind: AboutHighlight["icon"];
};

export function HighlightIcon({ kind }: HighlightIconProps) {
  switch (kind) {
    case "HEART":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "BROWSER":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h8v2H6v-2z" />
        </svg>
      );
    case "PLANT":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22V11m0 0c0-3.5 3-6 6-6-1 3-3 6-6 6zm0 0c0-3.5-3-6-6-6 1 3 3 6 6 6z" />
        </svg>
      );
  }
}
