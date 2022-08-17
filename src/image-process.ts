import { Region } from "@nut-tree/nut-js";
import * as cv from "opencv4nodejs-prebuilt";
import { CV_16S } from "opencv4nodejs-prebuilt";
import { exit } from "process";

export async function cropCardRect(
  inputImgPath: string,
  outputImgPath: string
): Promise<void> {
  const image = await loadImage(inputImgPath);

  console.log(image.sizes, image.elemSize);

  const hsv = image.cvtColor(cv.COLOR_BGR2HSV);

  const splitted = hsv.splitChannels();

  await cv.imwriteAsync("./out/v.png", splitted[2]);

  const lower = new cv.Vec3(0, 0, 0);
  const upper = new cv.Vec3(0, 0, 50);
  const mask = hsv.inRange(lower, upper);

  //console.log(mask.sizes, mask.elemSize);

  //await cv.imwriteAsync("./out/mask.png", mask);

  const contours = mask
    .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    .filter((c) => c.area > 100);
  const effectiveContours = [contours[0]];
  const cardRect = effectiveContours[0].boundingRect();

  const debugOut = image.copy();

  debugOut.drawRectangle(cardRect, new cv.Vec3(0, 255, 0));

  const croppedCard = image.getRegion(cardRect);

  //cv.imwrite("./out/test_out_debug.png", debugOut);
  cv.imwrite(outputImgPath, croppedCard);
  //cv.imwrite("./out/test_out.png", croppedCard);

  //cv.imshow("cropped", image);
}

async function loadImage(path: string): Promise<cv.Mat> {
  return cv.imreadAsync(path);
}
