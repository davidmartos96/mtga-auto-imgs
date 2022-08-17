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
import fs from "fs";
import "@nut-tree/template-matcher";
import { mtgaTemplatePositions } from "./template_positions";
import {
  gamePosToScreenPos,
  Position,
  relativePosToGamePos,
  Size,
} from "./util";
import { configureAutomation, OUT_CARDS_IMGS_DIR, OUT_DIR } from "./config";
import {
  findMTGAProfileRegion,
  findMTGAWindowRegion,
  globalImgResources,
} from "./finder";
import { INPUT_CARD_NAMES } from "./input_card_names";
import { exit } from "process";
import { Driver } from "./driver";
import { cropCardRect } from "./image-process";

async function main() {
  configureAutomation();
  await globalImgResources.init();

  console.log("Delaying start, make sure the game is visible");
  const delayMs = 2000;
  await sleep(delayMs);
  console.log("Start!");

  const screenSize: Size = {
    width: await screen.width(),
    height: await screen.height(),
  };
  console.log("Screen size", screenSize);

  const mtgaRegion: Region = await obtainMTGARegion();
  await startCapturing(screenSize, mtgaRegion);
}

async function obtainMTGARegion() {
  let mtgaRegion: Region;
  //const fixedMTGARegion = new Region(125.12, 172.12, 2560, 1440);
  const fixedMTGARegion: Region | null = null;

  if (fixedMTGARegion) {
    console.log("Using fixed MTGA region");
    mtgaRegion = fixedMTGARegion;
  } else {
    console.log("Searching for MTGA region");
    mtgaRegion = await findMTGAWindowRegion();
  }
  return mtgaRegion;
}

async function startCapturing(screenSize: Size, mtgaRegion: Region) {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(OUT_CARDS_IMGS_DIR);

  await captureMTGARegion(screenSize, mtgaRegion);

  //return;

  const cardNames = INPUT_CARD_NAMES;

  const driver = new Driver();

  await driver.goToDecks(mtgaRegion);
  await sleep(2000);
  await driver.goToCollection(mtgaRegion);
  await sleep(2000);

  await driver.showNotCollectedCards(mtgaRegion);
  await sleep(500);

  console.log("");

  let i = 0;
  for (const cardName of cardNames) {
    console.log(`------ ${cardName} ------`);

    await driver.searchForCard(cardName, mtgaRegion);
    await sleep(500);

    const wasTheCardFound = await driver.checkIfFoundCardAfterSearch(
      mtgaRegion
    );
    if (wasTheCardFound) {
      // The card is already being previewed because of the implicit focus
      // in the check if found function

      await driver.capturePreviewedCard(i, mtgaRegion);
      await keyboard.type(Key.Escape);
      await sleep(300);
    } else {
      console.error("Card not found");
    }

    console.log("--------------------------\n");

    i++;
  }
}

async function captureMTGARegion(screenSize: Size, mtgaRegion: Region) {
  // Capture the game window as a way of debugging the mtgaRegion
  const croppedMtgaRegion = new Region(
    mtgaRegion.left,
    mtgaRegion.top,
    Math.min(mtgaRegion.width, screenSize.width - mtgaRegion.left),
    Math.min(mtgaRegion.height, screenSize.height - mtgaRegion.top)
  );
  await screen.captureRegion(
    "mtga_game_region.png",
    croppedMtgaRegion,
    undefined,
    "out"
  );

  if (
    mtgaRegion.left + mtgaRegion.width > screenSize.width ||
    mtgaRegion.top + mtgaRegion.height > screenSize.height
  ) {
    console.error(`[ERROR] MTGA region is not fully visible in the screen`);
    exit(1);
  }
}

(async () => {
  main();
})();
