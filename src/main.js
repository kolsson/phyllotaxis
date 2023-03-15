import "./style.css";
import p5 from "p5";

import params from "./params";

import PCellController from "./helpers/pCell/pCellController";

import tweakpane from "./helpers/tweakpane";

import * as easing from "./helpers/easing";
import * as audio from "./audio";

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
const _didLoadPreset = () => {
  selectedCellIndex = -1;
  computeScene();
  redraw();
};

// ----------------------------------------------------------------------------
// sketch: setup
// ----------------------------------------------------------------------------

let pane;

sketch.setup = () => {
  createCanvas(800, 800);

  // canvas
  xl = -width / 2;
  xr = width / 2;
  yt = -height / 2;
  yb = height / 2;

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
  pane = tweakpane(params, _compute, _redraw, _didLoadPreset);

  // start
  computeScene();
};

// ----------------------------------------------------------------------------
// sketch: draw
// ----------------------------------------------------------------------------

sketch.draw = () => {
  background(255);

  // make our canvas center our origin
  translate(width / 2, height / 2);

  // draw our scene
  drawScene();

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

  // scaled / translated space
  scale(params.scale);
  translate(params.canvasX, params.canvasY);

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
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
      selectedCellIndex = cellController.checkMouseCell(
        selectedCellIndex,
        "selected"
      );
    }
  } else if (mouseX < width && mouseY < height) {
    startedDragOnCanvas = true;
  }

  // record where we clicked for later
  mousePressedX = mouseX;
  mousePressedY = mouseY;

  startCanvasX = params.canvasX;
  startCanvasY = params.canvasY;
};

sketch.mouseReleased = () => {
  startedDragOnCanvas = false;
};

sketch.mouseDragged = () => {
  if (draggingModifier && startedDragOnCanvas) {
    params.canvasX = startCanvasX + (mouseX - mousePressedX) / params.scale;
    params.canvasY = startCanvasY + (mouseY - mousePressedY) / params.scale;
  }
};

sketch.mouseWheel = (e) => {
  // scale range is 0.1 - 4 (also defined in tweakpane)

  params.scale = constrain(
    Math.round((params.scale + e.delta / 128) * 10) / 10,
    0.1,
    4
  );

  // update our tweakpane
  pane?.refresh();
};
