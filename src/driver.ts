import { findMTGAProfileRegion } from "./finder";
import { mtgaTemplatePositions } from "./template_positions";
import {
  relativePosToGamePos,
  gamePosToScreenPos,
  Position,
  getOutCardImagesDir,
} from "./util";

import {
  Region,
  screen,
  mouse,
  Button,
  keyboard,
  Key,
  sleep,
  FileType,
} from "@nut-tree-fork/nut-js";
import { cropCardRect } from "./image-process";
import { join } from "path";
import os from "os";

export class Driver {
  async searchForCard(cardName: string, setCode: string, mtgaRegion: Region) {
    await this.focusCardSearch(mtgaRegion);

    // On focus, text is already selected
    await keyboard.type(Key.Backspace);

    await sleep(200);

    // Type Name filter
    await keyboard.type("NAME");
    await typeDoubleColon();
    await typeDoubleQuotes();
    await keyboard.type(cardName);
    await typeDoubleQuotes();

    if (setCode != "") {
      // Type Set filter
      await keyboard.type(" E");
      await typeDoubleColon();
      await keyboard.type(setCode);
    }

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

    const cardRelWidth = 0.186;
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

    // This will first get an over optimistic area of the card to then crop the card borders
    const tmpDir = os.tmpdir();
    const tmpCardRegionFileName = `card_region_${id}.png`;
    const cardRegionFile = await screen.captureRegion(
      tmpCardRegionFileName,
      cardRegion,
      FileType.PNG,
      tmpDir
    );

    const outPath = join(getOutCardImagesDir(), `card_${id}.png`);
    await cropCardRect(cardRegionFile, outPath);

    console.log("Captured card image: ", outPath);
  }

  async goToRelativePosition(
    relPos: Position,
    mtgaRegion: Region,
    click = true
  ) {
    const gamePos = relativePosToGamePos(relPos, mtgaRegion);
    const screenPos = gamePosToScreenPos(gamePos, mtgaRegion);

    await mouse.move([screenPos]);
    await sleep(200);

    if (click) {
      await mouse.pressButton(Button.LEFT);
      await sleep(50);
      await mouse.releaseButton(Button.LEFT);
    }
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

async function typeDoubleColon() {
  await keyboard.type(Key.LeftShift, Key.Period);
}
