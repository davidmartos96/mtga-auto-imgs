import { Position } from "./util";

export type MTGATemplate =
  | "home"
  | "profile"
  | "decks"
  | "collection"
  | "craft"
  | "search"
  | "firstGridCard"
  | "cardPreviewTL";

export const mtgaTemplatePositions: Record<MTGATemplate, Position> = {
  home: {
    x: 0.023,
    y: 0.002,
  },
  profile: {
    x: 0.073,
    y: 0.004,
  },
  decks: {
    x: 0.137,
    y: 0.025,
  },
  collection: {
    x: 0.133,
    y: 0.92,
  },
  craft: {
    x: 0.9,
    y: 0.105,
  },
  search: {
    x: 0.06,
    y: 0.11,
  },
  firstGridCard: {
    x: 0.06,
    y: 0.25,
  },
  cardPreviewTL: {
    x: 0.4118,
    y: 0.2680,
  },
};
