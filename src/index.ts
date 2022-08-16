import {
  getWindows,
  imageResource,
  Region,
  screen,
  mouse,
} from "@nut-tree/nut-js";
import "@nut-tree/template-matcher";
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

function configureHighlighter() {
  screen.config.highlightOpacity = 0.9;
  screen.config.highlightDurationMs = 1000;
  screen.config.confidence = 0.9;
}

async function main() {
  configureHighlighter();

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
  await showNotCollectedCards(mtgaRegion);

  await screen.captureRegion("out/screenshot.png", mtgaRegion);
}

async function goToDecks(mtgaRegion: Region) {
  const mtgaDecksPos = relativePosToGamePos(
    mtgaTemplatePositions.decks,
    GAME_RES
  );
  mouse.move([gamePosToScreenPos(mtgaDecksPos, mtgaRegion)]);
}

async function goToCollection(mtgaRegion: Region) {
  const mtgaDecksPos = relativePosToGamePos(
    mtgaTemplatePositions.collection,
    GAME_RES
  );
  mouse.move([gamePosToScreenPos(mtgaDecksPos, mtgaRegion)]);
}

async function showNotCollectedCards(mtgaRegion: Region) {
  const mtgaDecksPos = relativePosToGamePos(
    mtgaTemplatePositions.craft,
    GAME_RES
  );
  mouse.move([gamePosToScreenPos(mtgaDecksPos, mtgaRegion)]);
}

(async () => {
  main();
})();
