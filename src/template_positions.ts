import { Position } from "./util";

export type MTGATemplate =
  | "profile"
  | "decks"
  | "collection"
  | "craft"
  | "search"
  | "firstGridCard"
  | "cardPreviewTL";

export const mtgaTemplatePositions: Record<MTGATemplate, Position> = {
  profile: {
    x: 0.073,
    y: 0.004,
  },
  decks: { x: 0.16, y: 0.025 },
  collection: {
    x: 0.133,
    y: 0.92,
  },
  craft: {
    x: 0.9,
    y: 0.125,
  },
  search: {
    x: 0.06,
    y: 0.125,
  },
  firstGridCard: {
    x: 0.10,
    y: 0.4,
  },
  cardPreviewTL: {
    x: 0.408,
    y: 0.26,
  },
};
