import {
  imageResource,
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
import { gamePosToScreenPos, Position, relativePosToGamePos } from "./util";
import { configureAutomation } from "./config";
import {
  findMTGAProfileRegion,
  findMTGAWindowRegion,
  globalImgResources,
} from "./finder";

const OUT_CARDS_IMGS_DIR = "out/cards";

async function main() {
  configureAutomation();
  await globalImgResources.init();

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
  await screen.captureRegion(
    "mtga_game_region.png",
    mtgaRegion,
    undefined,
    "out"
  );

  await startCapturing(mtgaRegion);
}

async function startCapturing(mtgaRegion: Region) {
  if (fs.existsSync(OUT_CARDS_IMGS_DIR)) {
    fs.rmdirSync(OUT_CARDS_IMGS_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_CARDS_IMGS_DIR, { recursive: true });

  const cardNames = ["Celestial Vault", "Sanctuary Cat", "Portable Hole"];

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

  await sleep(400);

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
  const cardCorner = relativePosToGamePos(
    mtgaTemplatePositions.cardPreviewTL,
    mtgaRegion
  );

  await sleep(500);

  const cardRelWidth = 0.178;
  const cardPixWidth = cardRelWidth * mtgaRegion.width;
  const cardPixHeight = cardPixWidth / 0.716;

  const cardCornerScreenPos = gamePosToScreenPos(cardCorner, mtgaRegion);
  const cardRegion = new Region(
    cardCornerScreenPos.x,
    cardCornerScreenPos.y,
    cardPixWidth,
    cardPixHeight
  );

  await screen.captureRegion(
    `card_${id}.png`,
    cardRegion,
    FileType.PNG,
    OUT_CARDS_IMGS_DIR
  );
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
