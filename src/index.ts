import { Region, screen, keyboard, Key, sleep } from "@nut-tree/nut-js";
import fs from "fs";
import "@nut-tree/template-matcher";
import { getOutCardImagesDir, Size } from "./util";
import { APP_CONFIG } from "./config/config";
import { findMTGAWindowRegion, globalImgResources } from "./finder";
import { INPUT_CARDS } from "./config/input_cards";
import { exit } from "process";
import { Driver } from "./driver";

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

function configureAutomation() {
  screen.config.highlightOpacity = 0.9;
  screen.config.highlightDurationMs = 600;
  screen.config.confidence = 0.8;

  keyboard.config.autoDelayMs = 50;
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

  // Highlight the game region for debugging purposes
  await screen.highlight(mtgaRegion);
  await sleep(500);

  return mtgaRegion;
}

async function startCapturing(screenSize: Size, mtgaRegion: Region) {
  const outDir = APP_CONFIG.outDir;
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(getOutCardImagesDir());

  await captureMTGARegion(screenSize, mtgaRegion);

  //return;

  const inputCards = INPUT_CARDS;

  const driver = new Driver();

  await driver.goToDecks(mtgaRegion);
  await sleep(2000);
  await driver.goToCollection(mtgaRegion);
  await sleep(4000);

  await driver.showNotCollectedCards(mtgaRegion);
  await sleep(500);

  console.log("");

  let i = 0;
  for (const inputCard of inputCards) {
    const cardName = inputCard[0];
    const setCode = inputCard[1];

    console.log(`------ ${cardName} SET='${setCode}' ------`);

    await driver.searchForCard(cardName, setCode, mtgaRegion);
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

  console.log("Finished!!");
  
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
