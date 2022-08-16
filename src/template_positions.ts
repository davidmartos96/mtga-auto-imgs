import { Position } from "./types";

export type MTGATemplate = "home" | "decks" | "collection" | "craft";

export const mtgaTemplatePositions: Record<MTGATemplate, Position> = {
  home: {
    x: 0.023,
    y: 0.002,
  },
  decks: {
    x: 0.137,
    y: 0.025,
  },
  collection: {
    x: 0.133,
    y: 0.920,
  },
  craft: {
    x: 0.900,
    y: 0.105,
  },
};
