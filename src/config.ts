import { keyboard, screen } from "@nut-tree/nut-js";
import { Size } from "./util";

export const OUT_DIR = "out";
export const OUT_CARDS_IMGS_DIR = OUT_DIR + "/cards";

// export const GAME_RES: Size = {
//   width: 2560,
//   height: 1440,
// };

export const GAME_RES: Size = {
  width: 1920,
  height: 1080,
};

// export const GAME_RES: Size = {
//   width: 3840,
//   height: 2160,
// };

export function configureAutomation() {
  screen.config.highlightOpacity = 0.9;
  screen.config.highlightDurationMs = 300;
  screen.config.confidence = 0.8;

  keyboard.config.autoDelayMs = 50;
}
