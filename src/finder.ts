import { imageResource, Region, screen, Image } from "@nut-tree/nut-js";
import { GAME_RES } from "./config";
import { mtgaTemplatePositions } from "./template_positions";
import { relativePosToGamePos } from "./util";

class ImageResources {
  mtgaProfileImgRes: Image | undefined;

  async init(): Promise<void> {
    this.mtgaProfileImgRes = await imageResource(
      "res/templates/mtga_profile_logo.png"
    );
  }
}
export const globalImgResources: ImageResources = new ImageResources();

export async function findMTGAWindowRegion(): Promise<Region> {
  // Search only in a top left corner of the screen
  const searchRegion = new Region(0, 0, 1000, 1000);

  const mtgaProfileRegion = await findMTGAProfileRegion(searchRegion);
  if (!mtgaProfileRegion) {
    throw new Error("MTGA profile tab not found");
  }

  await screen.highlight(mtgaProfileRegion);

  const mtgaProfilePos = relativePosToGamePos(
    mtgaTemplatePositions.profile,
    GAME_RES
  );

  const gameRegion = new Region(
    Math.max(0, mtgaProfileRegion.left - mtgaProfilePos.x),
    Math.max(0, mtgaProfileRegion.top - mtgaProfilePos.y),
    GAME_RES.width,
    GAME_RES.height
  );

  console.log(gameRegion);

  return gameRegion;
}

export async function findMTGAProfileRegion(
  searchRegion?: Region
): Promise<Region | null> {
  try {
    const mtgaProfileImgRes = globalImgResources.mtgaProfileImgRes!;

    const mtgaProfileRegion = await screen.find(mtgaProfileImgRes, {
      searchRegion: searchRegion,
    });
    return mtgaProfileRegion;
  } catch (e) {
    return null;
  }
}