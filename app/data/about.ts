import type { HomeFeatureColor } from "./home";

export type TipLed = "green" | "yellow" | "magenta";

export type AboutHighlight = {
  icon: "HEART" | "BROWSER" | "PLANT";
  text: string;
  color: HomeFeatureColor;
};

export type AboutTip = {
  text: string;
  led: TipLed;
};

export const MISSION: string =
  "ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar " +
  "los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar " +
  "y sin costo.";

export const HIGHLIGHTS: ReadonlyArray<AboutHighlight> = [
  { icon: "HEART",   text: "HECHO CON \u2764 PARA JUGADORES",                  color: "magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",  color: "cyan"    },
  { icon: "PLANT",   text: "PROYECTO EN CONSTANTE CRECIMIENTO",               color: "green"   },
];

export const CONTACT_TIPS: ReadonlyArray<AboutTip> = [
  { text: "RESPUESTA EN 24-48H",       led: "green"  },
  { text: "SUGERENCIAS BIENVENIDAS",  led: "yellow" },
  { text: "SIN SPAM, JAMÁS",           led: "magenta" },
];
