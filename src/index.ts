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
} from "@nut-tree/nut-js";
import "@nut-tree/template-matcher";
import { config } from "process";
import { ReplOptions } from "repl";
import { mtgaTemplatePositions } from "./template_positions";
import { Position, relativePosToGamePos, Size } from "./types";

const GAME_RES: Size = {
  width: 2560,
  height: 1440,
};

async function findMTGAWindowRegion(): Promise<Region> {
  // Search only in a top left corner of the screen
  const searchRegion = new Region(0, 0, 1000, 1000);

  const mtgaHomeImgRes = await imageResource(
    "res/templates/mtga_home_logo.png"
  );

  const mtgaHomeRegion = await screen.find(mtgaHomeImgRes, {
    searchRegion: searchRegion,
  });

  //await screen.highlight(mtgaHomeRegion);

  const mtgaHomePos = relativePosToGamePos(
    mtgaTemplatePositions.home,
    GAME_RES
  );

  const gameRegion = new Region(
    Math.max(0, mtgaHomeRegion.left - mtgaHomePos.x),
    Math.max(0, mtgaHomeRegion.top - mtgaHomePos.y),
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
  screen.config.highlightDurationMs = 1000;
  screen.config.confidence = 0.9;

  keyboard.config.autoDelayMs = 20;
}

async function main() {
  configureAutomation();

  let mtgaRegion: Region;
  const fixedMTGARegion = new Region(125.12, 172.12, 2560, 1440);
  //const fixedMTGARegion: Region | null = null;

  if (fixedMTGARegion) {
    console.log("Using fixed MTGA region");
    mtgaRegion = fixedMTGARegion;
  } else {
    console.log("Searching for MTGA region");
    mtgaRegion = await findMTGAWindowRegion();
  }

  //await goToDecks(mtgaRegion);
  //await goToCollection(mtgaRegion);
  // await showNotCollectedCards(mtgaRegion);
  // await searchForCard("Alley Evasion", mtgaRegion);
  // await focusFirstCardResult(mtgaRegion);

  await capturePreviewedCard(mtgaRegion);

  await screen.captureRegion("screenshot.png", mtgaRegion, undefined, "out");
}

async function searchForCard(cardName: string, mtgaRegion: Region) {
  await focusCardSearch(mtgaRegion);

  // On focus, text is already selected
  await keyboard.type(Key.Backspace);

  await sleep(400);
  await keyboard.type(cardName);

  await keyboard.type(Key.Enter);
}

async function goToDecks(mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(mtgaTemplatePositions.decks, GAME_RES);
  mouse.move([gamePosToScreenPos(gamepos, mtgaRegion)]);
}

async function goToCollection(mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(
    mtgaTemplatePositions.collection,
    GAME_RES
  );
  mouse.move([gamePosToScreenPos(gamepos, mtgaRegion)]);
}

async function showNotCollectedCards(mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(mtgaTemplatePositions.craft, GAME_RES);
  mouse.move([gamePosToScreenPos(gamepos, mtgaRegion)]);
}

async function focusCardSearch(mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(mtgaTemplatePositions.search, GAME_RES);
  mouse.move([gamePosToScreenPos(gamepos, mtgaRegion)]);

  mouse.click(Button.LEFT);
}

async function focusFirstCardResult(mtgaRegion: Region) {
  await goToRelativePosition(mtgaTemplatePositions.firstGridCard, mtgaRegion);
}

async function capturePreviewedCard(mtgaRegion: Region) {
  const cardCorner = relativePosToGamePos(
    mtgaTemplatePositions.cardPreviewTL,
    mtgaRegion
  );

  const cardRelWidth = 0.178;
  const cardPixWidth = cardRelWidth * mtgaRegion.width;
  const cardPixHeight = cardPixWidth / 0.716;

  const cardRegion = new Region(
    cardCorner.x,
    cardCorner.y,
    cardPixWidth,
    cardPixHeight
  );

  await screen.captureRegion("previewCard.png", cardRegion, undefined, "out");
}

async function goToRelativePosition(relPos: Position, mtgaRegion: Region) {
  const gamepos = relativePosToGamePos(
    mtgaTemplatePositions.firstGridCard,
    GAME_RES
  );
  mouse.move([gamePosToScreenPos(gamepos, mtgaRegion)]);

  mouse.click(Button.LEFT);
}

(async () => {
  main();
})();
