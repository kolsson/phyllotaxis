import "./style.css";
import p5 from "p5";

import globals from "./globals";

import PCellController from "./helpers/pCell/pCellController";

import {
  startCanvasAnim,
  updateCanvasTransform,
  resetCanvasAnimToCanvasPos,
  resetCanvasAnimToCanvasScale,
} from "./helpers/canvasAnimation";
import * as easing from "./helpers/easing";
import * as audio from "./audio";

import tweakpane from "./helpers/tweakpane";

// experimenting
import { computeExperimenting, drawExperimenting } from "./experimenting";

// p5
const sketch = window;
window.p5 = p5;

// canvas size
let xl, xr, yt, yb;

// cells
let cellController;

// ----------------------------------------------------------------------------
// tweakpane callbacks
// ----------------------------------------------------------------------------

const _compute = () => computeScene();
const _redraw = () => redraw();
const _didLoadPreset = (initial = false) => {
  selectedCellIndex = -1;

  computeScene();

  // set up our canvas animation
  // if this is our initial animation, delay 1 second

  startCanvasAnim({
    startScale: 1,
    startCanvasX: 0,
    startCanvasY: 0,
    endScale: globals.canvas.scaleToFit,
    delay: initial ? 500 : 0,
    duration: 600,
  });

  redraw();
};

// ----------------------------------------------------------------------------
// sketch: setup
// ----------------------------------------------------------------------------

let pane;
const canvasWidth = 800;
const canvasHeight = 800;
const uiWidth = 150;

sketch.setup = () => {
  createCanvas(canvasWidth + uiWidth, canvasHeight);

  // canvas
  xl = -canvasWidth / 2;
  xr = canvasWidth / 2;
  yt = -canvasHeight / 2;
  yb = canvasHeight / 2;

  // cell controller
  cellController = new PCellController({ xl, xr, yt, yb });

  // text (for debugging)
  textFont("Helvetica Neue Light");
  textAlign(CENTER);

  // defaults
  stroke(92);
  strokeCap(SQUARE);
  noFill();

  frameRate(30);

  // audio setup (completed after first click)
  audio.init();

  // build our tweakpane
  pane = tweakpane(_compute, _redraw, _didLoadPreset);

  // start
  computeScene();
};

// ----------------------------------------------------------------------------
// sketch: draw
// ----------------------------------------------------------------------------

sketch.draw = () => {
  background(255);

  // draw our scene
  push();
  translate(canvasWidth / 2, canvasHeight / 2);
  drawScene();
  pop();

  // draw our UI
  push();
  stroke(92);
  line(canvasWidth, 0, canvasWidth, canvasHeight);

  noStroke();
  fill(255);
  rect(canvasWidth + 1, 0, canvasWidth - 1, canvasHeight);

  pop();

  // EXPERIMENTING
  drawExperimenting();
};

// ----------------------------------------------------------------------------
// compute scene
// ----------------------------------------------------------------------------

const computeScene = () => {
  // update our cells
  cellController.compute();

  // EXPERIMENTING
  computeExperimenting();
};

// ----------------------------------------------------------------------------
// draw scene
// ----------------------------------------------------------------------------

const drawScene = () => {
  push();

  // update canvas transform
  updateCanvasTransform();

  // draw
  cellController.draw(metronomeMillis());

  pop();
};

// ----------------------------------------------------------------------------
// metronome
// ----------------------------------------------------------------------------

const metronomeMillis = () => {
  if (!Gibberish.ctx) return 1000;

  const { currentTime } = Gibberish.ctx;

  let t = currentTime - Math.floor(currentTime);
  t = (t * 2 + easing.easeOutCubic(t) * 3) / 5;

  return (Math.floor(currentTime) + t) * 1000;
};

const metronomeT = () => {
  if (!Gibberish.ctx) return 1;

  const { currentTime } = Gibberish.ctx;

  let t = currentTime - Math.floor(currentTime);
  t = (t * 2 + easing.easeOutCubic(t) * 3) / 5;

  return t;
};

// ----------------------------------------------------------------------------
// interaction
// keycodes can be looked up here: https://www.toptal.com/developers/keycode
// ----------------------------------------------------------------------------

let draggingModifier = false;
let startedDragOnCanvas = false;

let startCanvasX = 0;
let startCanvasY = 0;

let mousePressedX = 0;
let mousePressedY = 0;

let selectedCellIndex = -1;
let overCellIndex = -1;

sketch.keyPressed = () => {
  if (keyCode === 32) {
    draggingModifier = true;
    cursor("grab");
    return false;
  }
};

sketch.keyReleased = () => {
  draggingModifier = false;
  cursor(ARROW);
};

sketch.mouseMoved = () => {
  overCellIndex = cellController.checkMouseCell(overCellIndex, "over");
};

sketch.mousePressed = async () => {
  // if we aren't dragging see if we clicked on a cell

  if (!draggingModifier) {
    if (
      mouseX >= 0 &&
      mouseX < canvasWidth &&
      mouseY >= 0 &&
      mouseY < canvasHeight
    ) {
      selectedCellIndex = cellController.checkMouseCell(
        selectedCellIndex,
        "selected"
      );
    }
  } else if (mouseX < canvasWidth && mouseY < canvasHeight) {
    startedDragOnCanvas = true;
  }

  // record where we clicked for later
  mousePressedX = mouseX;
  mousePressedY = mouseY;

  startCanvasX = globals.canvas.x;
  startCanvasY = globals.canvas.y;
};

sketch.mouseReleased = () => {
  startedDragOnCanvas = false;
};

sketch.mouseDragged = () => {
  if (draggingModifier && startedDragOnCanvas) {
    globals.canvas.x =
      startCanvasX + (mouseX - mousePressedX) / globals.canvas.scale;
    globals.canvas.y =
      startCanvasY + (mouseY - mousePressedY) / globals.canvas.scale;

    resetCanvasAnimToCanvasPos();
  }
};

sketch.mouseWheel = (e) => {
  // scale range is 0.1 - 4 (also defined in tweakpane)

  globals.canvas.scale = constrain(
    Math.round((globals.canvas.scale + e.delta / 128) * 10) / 10,
    0.1,
    8
  );

  resetCanvasAnimToCanvasScale();

  // update our tweakpane
  pane?.refresh();
};
