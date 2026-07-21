export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

export type User = {
  name: string;
  loggedAt: number;
};

export type ScoreEntry = {
  game: string;
  name: string;
  score: number;
  at: number;
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

export type Route =
  | { name: "biblioteca" }
  | { name: "detalle"; id: string }
  | { name: "player"; id: string }
  | { name: "auth" }
  | { name: "salon" };
