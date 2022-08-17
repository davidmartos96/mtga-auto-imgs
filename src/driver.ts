import { findMTGAProfileRegion } from "./finder";
import { mtgaTemplatePositions } from "./template_positions";
import { relativePosToGamePos, gamePosToScreenPos, Position } from "./util";

import {
  Region,
  screen,
  mouse,
  Button,
  keyboard,
  Key,
  sleep,
  FileType,
} from "@nut-tree/nut-js";
import { OUT_CARDS_IMGS_DIR } from "./config";

export class Driver {
  async searchForCard(cardName: string, mtgaRegion: Region) {
    await this.focusCardSearch(mtgaRegion);

    // On focus, text is already selected
    await keyboard.type(Key.Backspace);

    await sleep(200);

    await keyboard.type("NAME");

    // Double colon
    await keyboard.type(Key.LeftShift, Key.Period);

    await typeDoubleQuotes();
    await keyboard.type(cardName);
    await typeDoubleQuotes();

    await keyboard.type(Key.Enter);
  }

  async goToDecks(mtgaRegion: Region) {
    console.log("Go to 'Decks'");
    await this.goToRelativePosition(mtgaTemplatePositions.decks, mtgaRegion);
  }

  async goToCollection(mtgaRegion: Region) {
    console.log("Go to 'Collection'");
    await this.goToRelativePosition(
      mtgaTemplatePositions.collection,
      mtgaRegion
    );
  }

  async showNotCollectedCards(mtgaRegion: Region) {
    console.log("Show not collected cards");
    await this.goToRelativePosition(mtgaTemplatePositions.craft, mtgaRegion);
  }

  async focusCardSearch(mtgaRegion: Region) {
    console.log("Focus search");
    await this.goToRelativePosition(mtgaTemplatePositions.search, mtgaRegion);
  }

  async focusFirstCardResult(mtgaRegion: Region) {
    await this.goToRelativePosition(
      mtgaTemplatePositions.firstGridCard,
      mtgaRegion
    );
  }

  async capturePreviewedCard(id: number, mtgaRegion: Region) {
    const cardCornerGamePos = relativePosToGamePos(
      mtgaTemplatePositions.cardPreviewTL,
      mtgaRegion
    );

    await sleep(500);

    const cardRelWidth = 0.179;
    const cardPixWidth = cardRelWidth * mtgaRegion.width;
    const cardPixHeight = cardPixWidth / 0.716;

    const cardCornerScreenPos = gamePosToScreenPos(
      cardCornerGamePos,
      mtgaRegion
    );

    const cardRegion = new Region(
      cardCornerScreenPos.x,
      cardCornerScreenPos.y,
      cardPixWidth,
      cardPixHeight
    );

    const outFileName = `card_${id}.png`;
    const outFolder = OUT_CARDS_IMGS_DIR;

    const outPath = await screen.captureRegion(
      outFileName,
      cardRegion,
      FileType.PNG,
      outFolder
    );

    console.log("Captured card image: ", outPath);
  }

  private async goToRelativePosition(relPos: Position, mtgaRegion: Region) {
    const gamePos = relativePosToGamePos(relPos, mtgaRegion);
    const screenPos = gamePosToScreenPos(gamePos, mtgaRegion);

    await mouse.move([screenPos]);
    await sleep(200);

    await mouse.pressButton(Button.LEFT);
    await sleep(50);
    await mouse.releaseButton(Button.LEFT);
  }

  async checkIfFoundCardAfterSearch(mtgaRegion: Region) {
    // Try to focus in the first card result.
    // If after the focus the profile tab is not found it means we successfully previewd the card
    // aka, it was found
    await this.focusFirstCardResult(mtgaRegion);
    await sleep(500);

    const topLeftAreaMtga = new Region(
      mtgaRegion.left,
      mtgaRegion.top,
      mtgaRegion.width * 0.5,
      mtgaRegion.height * 0.2
    );
    const mtgaProfileRegion = await findMTGAProfileRegion(topLeftAreaMtga);
    return mtgaProfileRegion == null;
  }
}

async function typeDoubleQuotes() {
  await keyboard.type(Key.LeftShift, Key.Num2);
}
