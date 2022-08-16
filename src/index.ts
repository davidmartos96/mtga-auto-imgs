import {
  getWindows,
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
import { Position, relativePosToGamePos, Size } from "./types";

const GAME_RES: Size = {
  width: 2560,
  height: 1440,
};

const OUT_CARDS_IMGS_DIR = "out/cards";

async function findMTGAWindowRegion(): Promise<Region> {
  // Search only in a top left corner of the screen
  const searchRegion = new Region(0, 0, 1000, 1000);

  const mtgaProfileImgRes = await imageResource(
    "res/templates/mtga_profile_logo.png"
  );

  const mtgaProfileRegion = await screen.find(mtgaProfileImgRes, {
    searchRegion: searchRegion,
  });

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

function gamePosToScreenPos(gamePos: Position, gameRegion: Region): Position {
  return {
    x: gameRegion.left + gamePos.x,
    y: gameRegion.top + gamePos.y,
  };
}

function configureAutomation() {
  screen.config.highlightOpacity = 0.9;
  screen.config.highlightDurationMs = 300;
  screen.config.confidence = 0.8;

  keyboard.config.autoDelayMs = 50;

  //mouse.config.mouseSpeed = 5;
}

async function main() {
  configureAutomation();

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
    await focusFirstCardResult(mtgaRegion);
    await sleep(500);
    await capturePreviewedCard(i, mtgaRegion);
    await keyboard.type(Key.Escape);
    await sleep(300);

    console.log("--------------------------\n");

    i++;
  }
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

function slicePointsBetween(
  p1: Position,
  p2: Position,
  numPoints: number
): Position[] {
  const points: Position[] = [];

  const stepX = (p2.x - p1.x) / numPoints;
  const stepY = (p2.y - p1.y) / numPoints;
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: p1.x + i * stepX,
      y: p1.y + i * stepY,
    });
  }
  points.push(p2);

  return points;
}

async function goToRelativePosition(relPos: Position, mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(relPos, GAME_RES);

  const startPoint = await mouse.getPosition();
  const endPoint = gamePosToScreenPos(gamepos, mtgaRegion);

  const path = slicePointsBetween(startPoint, endPoint, 10);
  // [startPoint, midPoint, endPoint];

  /* const timeSteps = calculateMovementTimesteps(path.length, 5, linear);
  console.log(path, timeSteps);

  for (let idx = 0; idx < path.length; ++idx) {
    const node = path[idx];
    const minTime = timeSteps[idx];
    console.log("Wait for ns", minTime);

    await mybusyWaitForNanoSeconds(minTime);
    await mouse.setPosition(node);
  } */

  await mouse.move([endPoint]);
  await sleep(200);

  await mouse.pressButton(Button.LEFT);
  await sleep(50);
  await mouse.releaseButton(Button.LEFT);
  //await mouse.leftClick();
}

const mybusyWaitForNanoSeconds = (duration: number) => {
  return new Promise<void>((res) => {
    const start = process.hrtime.bigint();
    console.log("Start", start);

    let isWaiting = true;
    while (isWaiting) {
      const cur = process.hrtime.bigint();
      const elapsed = cur - start;
      console.log(cur, "Elapsed", elapsed, BigInt(duration));
      if (elapsed > BigInt(duration)) {
        isWaiting = false;
      }
    }
    res();
  });
};

(async () => {
  main();
})();
