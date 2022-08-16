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
