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
import { configureAutomation } from "./config";
import {
  findMTGAProfileRegion,
  findMTGAWindowRegion,
  globalImgResources,
} from "./finder";
import { INPUT_CARD_NAMES } from "./input_card_names";
import { exit } from "process";

const OUT_DIR = "out";
const OUT_CARDS_IMGS_DIR = OUT_DIR + "/cards";

async function main() {
  configureAutomation();
  await globalImgResources.init();

  const delayMs = 2000;
  await sleep(delayMs);

  const screenSize: Size = {
    width: await screen.width(),
    height: await screen.height(),
  };
  console.log("Screen size", screenSize);

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

  await startCapturing(screenSize, mtgaRegion);
}

async function startCapturing(screenSize: Size, mtgaRegion: Region) {
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await captureMTGARegion(screenSize, mtgaRegion);

  return;

  const cardNames = INPUT_CARD_NAMES;

  await goToDecks(mtgaRegion);
  await sleep(2000);
  await goToCollection(mtgaRegion);
  await sleep(2000);

  await showNotCollectedCards(mtgaRegion);
  await sleep(500);

  console.log("");

  let i = 0;
  for (const cardName of cardNames) {
    console.log(`------ ${cardName} ------`);

    await searchForCard(cardName, mtgaRegion);
    await sleep(500);

    const wasTheCardFound = await checkIfFoundCardAfterSearch(mtgaRegion);
    if (wasTheCardFound) {
      // The card is already being previewed because of the implicit focus
      // in the check if found function

      await capturePreviewedCard(i, mtgaRegion);
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

async function checkIfFoundCardAfterSearch(mtgaRegion: Region) {
  // Try to focus in the first card result.
  // If after the focus the profile tab is not found it means we successfully previewd the card
  // aka, it was found
  await focusFirstCardResult(mtgaRegion);
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

async function typeDoubleQuotes() {
  await keyboard.type(Key.LeftShift, Key.Num2);
}

async function searchForCard(cardName: string, mtgaRegion: Region) {
  await focusCardSearch(mtgaRegion);

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

async function goToDecks(mtgaRegion: Region) {
  console.log("Go to 'Decks'");
  await goToRelativePosition(mtgaTemplatePositions.decks, mtgaRegion);
}

async function goToCollection(mtgaRegion: Region) {
  console.log("Go to 'Collection'");
  await goToRelativePosition(mtgaTemplatePositions.collection, mtgaRegion);
}

async function showNotCollectedCards(mtgaRegion: Region) {
  console.log("Show not collected cards");
  await goToRelativePosition(mtgaTemplatePositions.craft, mtgaRegion);
}

async function focusCardSearch(mtgaRegion: Region) {
  console.log("Focus search");
  await goToRelativePosition(mtgaTemplatePositions.search, mtgaRegion);
}

async function focusFirstCardResult(mtgaRegion: Region) {
  await goToRelativePosition(mtgaTemplatePositions.firstGridCard, mtgaRegion);
}

async function capturePreviewedCard(id: number, mtgaRegion: Region) {
  const cardCornerGamePos = relativePosToGamePos(
    mtgaTemplatePositions.cardPreviewTL,
    mtgaRegion
  );

  await sleep(500);

  const cardRelWidth = 0.179;
  const cardPixWidth = cardRelWidth * mtgaRegion.width;
  const cardPixHeight = cardPixWidth / 0.716;

  const cardCornerScreenPos = gamePosToScreenPos(cardCornerGamePos, mtgaRegion);

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

async function goToRelativePosition(relPos: Position, mtgaRegion: Region) {
  const gamePos = relativePosToGamePos(relPos, mtgaRegion);
  const screenPos = gamePosToScreenPos(gamePos, mtgaRegion);

  await mouse.move([screenPos]);
  await sleep(200);

  await mouse.pressButton(Button.LEFT);
  await sleep(50);
  await mouse.releaseButton(Button.LEFT);
}

(async () => {
  main();
})();
