import { imageResource, Region, screen, Image } from "@nut-tree-fork/nut-js";
import { APP_CONFIG } from "./config/config";
import { mtgaTemplatePositions } from "./template_positions";
import { relativePosToGamePos, Size } from "./util";

class ImageResources {
  mtgaProfileImgRes: Image | undefined;

  async init(): Promise<void> {
    this.mtgaProfileImgRes = await imageResource(
      "res/templates/mtga_profile_logo.png"
    );
  }
}
export const globalImgResources: ImageResources = new ImageResources();


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
    console.error(e)
    return null;
  }
}
