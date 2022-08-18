import { Size } from "../util";
import * as Resolutions from "../game_res";

// EDIT THIS
export const APP_CONFIG: Config = {
  // This can also be "gameRes2k" or "gameRes4k"
  gameResolution: Resolutions.gameRes4k,
  // This can be tweaked for desktops that apply a scaling factor. 150% zoom would be 1.5
  desktopScale: 1,
  outDir: "out",
};

type Config = {
  gameResolution: Size;
  desktopScale: number;
  outDir: string;
};
