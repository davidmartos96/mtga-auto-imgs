import { Region } from "@nut-tree/nut-js";

export type Size = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export function relativePosToGamePos(relPos: Position, gameSize: Size) {
  return {
    x: relPos.x * gameSize.width,
    y: relPos.y * gameSize.height,
  };
}

export function gamePosToScreenPos(gamePos: Position, gameRegion: Region): Position {
  return {
    x: gameRegion.left + gamePos.x,
    y: gameRegion.top + gamePos.y,
  };
}