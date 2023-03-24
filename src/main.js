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

// cell controller
let cc;

// ----------------------------------------------------------------------------
// tweakpane callbacks
// ----------------------------------------------------------------------------

const _compute = () => computeScene();
const _redraw = () => redraw();
const _didLoadPreset = (initial = false) => {
  cc.resetCellPosProps();

  computeScene();

  // set up our canvas animation
  // if this is our initial animation, delay 1 second

  startCanvasAnim({
    startScale: 1,
    startCanvasX: 0,
    startCanvasY: 0,
    endScale: globals.canvas.scaleToFit,
    delay: initial ? 500 : 0,
  });

  redraw();
};

// ----------------------------------------------------------------------------
// sketch: setup
// ----------------------------------------------------------------------------

let pane;
const uiWidth = 150;

sketch.setup = () => {
  createCanvas(globals.canvas.width + uiWidth, globals.canvas.height);

  // canvas
  xl = -globals.canvas.width / 2;
  xr = globals.canvas.width / 2;
  yt = -globals.canvas.height / 2;
  yb = globals.canvas.height / 2;

  // cell controller
  cc = new PCellController({ xl, xr, yt, yb });

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
  pane = tweakpane(cc, _compute, _redraw, _didLoadPreset);

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
  translate(globals.canvas.width / 2, globals.canvas.height / 2);
  drawScene();
  pop();

  // draw our UI
  push();
  stroke(92);
  line(globals.canvas.width, 0, globals.canvas.width, globals.canvas.height);

  noStroke();
  fill(255);
  rect(
    globals.canvas.width + 1,
    0,
    globals.canvas.width - 1,
    globals.canvas.height
  );
  pop();

  // EXPERIMENTING
  drawExperimenting();
};

// ----------------------------------------------------------------------------
// compute scene
// ----------------------------------------------------------------------------

const computeScene = () => {
  // update our cells
  cc.compute();

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
  cc.draw(metronomeMillis());

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
let draggingCanvas = false;

let dragStartCanvasX = 0;
let dragStartCanvasY = 0;

let dragStartX = 0;
let dragStartY = 0;

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
  if (globals.canvas.selectedCellIndex === -1) {
    // NO selected cell

    globals.canvas.overCellIndex = cc.setPropForCellAtPos(
      mouseX,
      mouseY,
      globals.canvas.overCellIndex,
      "over"
    );
  } else {
    // YES selected cell
  }
};

sketch.mousePressed = async () => {
  if (globals.canvas.selectedCellIndex === -1) {
    // NO selected cell

    if (!draggingModifier) {
      // we are not holding down our drag modifier, so see where we clicked

      if (
        mouseX >= 0 &&
        mouseX < globals.canvas.width &&
        mouseY >= 0 &&
        mouseY < globals.canvas.height
      ) {
        cc.selectCell(mouseX, mouseY);
      }
    } else if (
      mouseX < globals.canvas.width &&
      mouseY < globals.canvas.height
    ) {
      // begin dragging

      draggingCanvas = true;

      dragStartX = mouseX;
      dragStartY = mouseY;

      dragStartCanvasX = globals.canvas.x;
      dragStartCanvasY = globals.canvas.y;
    }
  } else {
    // YES selected cell
  }
};

sketch.mouseReleased = () => {
  draggingCanvas = false;
};

sketch.mouseDragged = () => {
  if (draggingModifier && draggingCanvas) {
    globals.canvas.x =
      dragStartCanvasX + (mouseX - dragStartX) / globals.canvas.scale;
    globals.canvas.y =
      dragStartCanvasY + (mouseY - dragStartY) / globals.canvas.scale;

    resetCanvasAnimToCanvasPos();
  }
};

sketch.mouseWheel = (e) => {
  // scale range is 0.1 - 8

  globals.canvas.scale = constrain(
    Math.round((globals.canvas.scale + e.delta / 128) * 10) / 10,
    0.1,
    8
  );

  resetCanvasAnimToCanvasScale();

  // update our tweakpane
  pane?.refresh();
};
