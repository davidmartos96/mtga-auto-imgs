import * as cv from "opencv4nodejs-prebuilt-install";

export async function cropCardRect(
  inputImgPath: string,
  outputImgPath: string
): Promise<void> {
  const image = await cv.imreadAsync(inputImgPath);

  const hsv = image.cvtColor(cv.COLOR_BGR2HSV);

  const lower = new cv.Vec3(0, 0, 0);
  const upper = new cv.Vec3(0, 0, 50);
  const mask = hsv.inRange(lower, upper);

  //console.log(mask.sizes, mask.elemSize);

  // await cv.imwriteAsync("./out/mask.png", mask);

  const wholeArea = image.cols * image.rows;
  const contours = mask
    .findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    .filter((c) => {
      const r = c.boundingRect();
      const area = r.width * r.height;
      return area > wholeArea * 0.6;
    });
  const effectiveContours = [contours[0]];
  const cardRect = effectiveContours[0].boundingRect();

  const debugOut = image.copy();

  debugOut.drawRectangle(cardRect, new cv.Vec3(0, 255, 0));

  const croppedCard = image.getRegion(cardRect);
  const cornerRadius = croppedCard.cols * 0.055;
  const roundedBorders = await roundCorners(croppedCard, cornerRadius);

  // cv.imwrite("./out/test_out_debug.png", debugOut);
  cv.imwrite(outputImgPath, roundedBorders);
  //cv.imwrite("./out/test_out.png", croppedCard);

  //cv.imshow("cropped", image);
}

function applyMask(img: cv.Mat, mask: cv.Mat): cv.Mat {
  let channels = img.splitChannels();
  let maskedChannels = channels.map((c) => c.bitwiseAnd(mask));
  let output = new cv.Mat(maskedChannels);
  return output;
}

async function roundCorners(im: cv.Mat, cornerRadius: number): Promise<cv.Mat> {
  //const bgra = im.cvtColor(cv.COLOR_BGR2BGRA);

  const mask = new cv.Mat(im.rows, im.cols, cv.CV_8UC3, 0);
  //   mask.drawRectangle(
  //     new cv.Point2(50, 50),
  //     new cv.Point2(300, 300),
  //     new cv.Vec3(255, 255, 255),
  //     -1
  //   );

  drawRoundedRect(
    mask,
    new cv.Point2(0, 0),
    new cv.Point2(im.cols, im.rows),
    new cv.Vec3(255, 255, 255),
    1,
    cv.LINE_8,
    cornerRadius
  );
  const maskInverse = mask.bitwiseNot();

  //   cv.imwrite("./out/round_mask.png", mask);
  //   cv.imwrite("./out/round_mask_inv.png", maskInverse);

  const blackBackground = im.bitwiseAnd(mask);
  const whiteBackground = blackBackground.bitwiseOr(maskInverse);

  //   cv.imwrite("./out/bitwise.png", blackBackground);
  //   cv.imwrite("./out/bitwise_out.png", whiteBackground);

  // const fill_color = new cv.Vec3(255, 255, 255);
  // const [h, w] = im.sizes
  // const orig = im.copy()
  // const background = cv.Image.new('RGB', im.size, fill_color)

  return whiteBackground;
}

function drawRoundedRect(
  src: cv.Mat,
  topLeft: cv.Point2,
  bottomRight: cv.Point2,
  lineColor: cv.Vec3,
  thickness: number,
  lineType: number,
  cornerRadius: number
) {
  /* corners:
   * p1 - p2
   * |     |
   * p4 - p3
   */
  const p1: cv.Point2 = topLeft;
  const p2 = new cv.Point2(bottomRight.x, topLeft.y);
  const p3 = bottomRight;
  const p4 = new cv.Point2(topLeft.x, bottomRight.y);

  // draw straight lines
  src.drawLine(
    new cv.Point2(p1.x + cornerRadius, p1.y),
    new cv.Point2(p2.x - cornerRadius, p2.y),
    lineColor,
    thickness,
    lineType
  );
  src.drawLine(
    new cv.Point2(p2.x, p2.y + cornerRadius),
    new cv.Point2(p3.x, p3.y - cornerRadius),
    lineColor,
    thickness,
    lineType
  );
  src.drawLine(
    new cv.Point2(p4.x + cornerRadius, p4.y),
    new cv.Point2(p3.x - cornerRadius, p3.y),
    lineColor,
    thickness,
    lineType
  );
  src.drawLine(
    new cv.Point2(p1.x, p1.y + cornerRadius),
    new cv.Point2(p4.x, p4.y - cornerRadius),
    lineColor,
    thickness,
    lineType
  );

  // draw arcs
  src.drawEllipse(
    p1.add(new cv.Point2(cornerRadius, cornerRadius)) as cv.Point2,
    new cv.Size(cornerRadius, cornerRadius),
    180.0,
    0,
    90,
    lineColor,
    thickness,
    lineType
  );
  src.drawEllipse(
    p2.add(new cv.Point2(-cornerRadius, cornerRadius)) as cv.Point2,
    new cv.Size(cornerRadius, cornerRadius),
    270.0,
    0,
    90,
    lineColor,
    thickness,
    lineType
  );
  src.drawEllipse(
    p3.add(new cv.Point2(-cornerRadius, -cornerRadius)) as cv.Point2,
    new cv.Size(cornerRadius, cornerRadius),
    0.0,
    0,
    90,
    lineColor,
    thickness,
    lineType
  );
  src.drawEllipse(
    p4.add(new cv.Point2(cornerRadius, -cornerRadius)) as cv.Point2,
    new cv.Size(cornerRadius, cornerRadius),
    90.0,
    0,
    90,
    lineColor,
    thickness,
    lineType
  );

  const midX = (topLeft.x + bottomRight.x) / 2;
  const midY = (topLeft.y + bottomRight.y) / 2;
  const fillFrom = new cv.Point2(midX, midY);
  //const fillColor = new cv.Vec3(199, 120, 0);
  src.floodFill(fillFrom, lineColor);
}
