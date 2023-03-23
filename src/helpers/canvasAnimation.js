import * as easing from "./easing";

import globals from "../globals";

// ----------------------------------------------------------------------------
// canvas animation
// ----------------------------------------------------------------------------

// canvas animation
let animStartMillis = 0;
let animStartScale = 1;
let animStartCanvasX = 0;
let animStartCanvasY = 0;

let animEndMillis = 0;
let animEndScale = 1;
let animEndCanvasX = 0;
let animEndCanvasY = 0;

export function startCanvasAnim({
  startScale = 1,
  startCanvasX = 0,
  startCanvasY = 0,
  endScale = 1,
  endCanvasX = 0,
  endCanvasY = 0,
  delay = 0,
  duration = 700,

  startFromCurrScalePos = false,
  scaleDurationByDistance = true,
}) {
  const m = millis() + delay;
  animStartMillis = m;

  if (startFromCurrScalePos) {
    animStartScale = globals.canvas.scale;
    animStartCanvasX = globals.canvas.x;
    animStartCanvasY = globals.canvas.y;
  } else {
    animStartScale = startScale;
    animStartCanvasX = startCanvasX;
    animStartCanvasY = startCanvasY;
  }

  if (scaleDurationByDistance) {
    // scale our animation duration by the x, y distance we have to travel

    const d = dist(animStartCanvasX, animStartCanvasY, endCanvasX, endCanvasY);
    animEndMillis = m + duration * Math.max(1, d / 150);
  } else {
    animEndMillis = m + duration;
  }

  animEndScale = endScale;
  animEndCanvasX = endCanvasX;
  animEndCanvasY = endCanvasY;
}

export function updateCanvasTransform() {
  // calculate our scale, canvas.x and canvas.y

  const m = millis();
  const d = animEndMillis - animStartMillis;
  const t = easing.easeInCubic(constrain((m - animStartMillis) / d, 0, 1));

  globals.canvas.scale = lerp(animStartScale, animEndScale, t);
  globals.canvas.x = lerp(animStartCanvasX, animEndCanvasX, t);
  globals.canvas.y = lerp(animStartCanvasY, animEndCanvasY, t);

  scale(globals.canvas.scale);
  translate(globals.canvas.x, globals.canvas.y);
}

export function resetCanvasAnimToCanvasPos() {
  // set our canvas animation positions to canvas.x and canvas.y

  animStartCanvasX = globals.canvas.x;
  animEndCanvasX = globals.canvas.x;
  animStartCanvasY = globals.canvas.y;
  animEndCanvasY = globals.canvas.y;
}

export function resetCanvasAnimToCanvasScale() {
  // set our canvas animation scale to canvasScale

  animStartScale = globals.canvas.scale;
  animEndScale = globals.canvas.scale;
}
