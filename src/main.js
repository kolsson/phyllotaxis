import "./style.css";
import p5 from "p5";
import * as Tone from "tone";
import * as Voronoi from "voronoi/rhill-voronoi-core";

import FancyLine from "./helpers/fancyline";

import tweakpane from "./helpers/tweakpane";
import { lineSegmentCircleIntersect } from "./helpers/intersect";
import { furthestDistOfCells, voronoiGetSite } from "./helpers/voronoi";
import * as E from "./helpers/easing";
import prim from "./helpers/prim";

const sketch = window;
window.p5 = p5;

// canvas size
let xl, xr, yt, yb;

// cells
let cellPoints, vCells;
let selectedVCellIndex = -1;
let overVCellIndex = -1;

// voronoi
const v = new Voronoi();
let vd;

// prim's
let primMst;
let primLines = [];

// ----------------------------------------------------------------------------
// define parameters
// ----------------------------------------------------------------------------

const params = {
  // monitors
  actualCellCount: 300,

  // ui
  scale: 1,
  canvasX: 0,
  canvasY: 0,

  // core params
  cellCount: 300,
  startCell: 1,

  cellAngle: 137,
  cellAngleFrac: 0.5,

  cellSize: 24,
  cellClipMult: 1,
  cellTrimR: 0,

  cellDropOutType: "perlin", // 'perlin' or 'mod'

  cellDropOutPercent: 0.4,
  cellDropOutMult: 1,
  cellDropOutMod: 10,

  primMstArrowDist: 8,
  primMstArrowWidth: 2,
  primMstArrowHeight: 2,

  // debugging
  showCellTrimCircles: false,
  showCells: true,
  showPrimMst: true,
  showCellSites: false,
  showCellText: false,
  textSize: 10,
};

// ----------------------------------------------------------------------------
// tweakpane callbacks
// ----------------------------------------------------------------------------

const _compute = () => computeCells();
const _redraw = () => redraw();
const _didLoadPreset = () => {
  selectedVCellIndex = -1;
  computeCells();
  redraw();
};

// ----------------------------------------------------------------------------
// sketch: setup
// ----------------------------------------------------------------------------

let pane;

sketch.setup = () => {
  createCanvas(800, 800);

  // canvas size
  xl = -width / 2;
  xr = width / 2;
  yt = -height / 2;
  yb = height / 2;

  // text (for debugging)
  textFont("Helvetica Neue Light");
  textAlign(CENTER);

  // defaults
  stroke(92);
  strokeCap(SQUARE);
  noFill();
  angleMode(DEGREES);
  frameRate(30);

  // build our tweakpane
  pane = tweakpane(params, _compute, _redraw, _didLoadPreset);

  // start
  computeCells();
};

// ----------------------------------------------------------------------------
// sketch: draw
// ----------------------------------------------------------------------------

sketch.draw = () => {
  background(255);
  drawCells();
};

// ----------------------------------------------------------------------------
// fancyline callbacks
// ----------------------------------------------------------------------------

const primStrokeWeight = () => 1.5 / params.scale;

const arrowColor = [92, 92, 92];
const primArrowStroke = (m, i, d, t) =>
  color([
    ...arrowColor,
    E.easeOutQuint(((t > 0.5 ? 1 - t : t) * d) / 15) * 255,
  ]);
const primArrowInterp = (m, i, d) => m / (100 * d);

// ----------------------------------------------------------------------------
// compute cells
// ----------------------------------------------------------------------------

let car, carr, cbr;

const computeCells = () => {
  cellPoints = [];

  for (let i = params.startCell; i < params.cellCount; i++) {
    const a = i * (params.cellAngle + params.cellAngleFrac);
    const r = params.cellSize * sqrt(i);
    const x = r * cos(a);
    const y = r * sin(a);

    cellPoints.push({ x, y });
  }

  // compute voronoi diagram

  if (vd?.length > 0) v.recycle(vd); // if we have an existing diagram, recycle
  vd = v.compute(cellPoints, {
    xl: xl * params.cellClipMult,
    xr: xr * params.cellClipMult,
    yt: yt * params.cellClipMult,
    yb: yb * params.cellClipMult,
  });

  // get voronoi cells

  vCells = [];
  for (let i = 0; i < vd.cells.length; i++) {
    const points = [];
    for (let j = 0; j < vd.cells[i].halfedges.length; j++) {
      points.push({ ...vd.cells[i].halfedges[j].getStartpoint() });
    }
    vCells.push({ site: { ...vd.cells[i].site }, points });
  }
  // filter our cells, remove cells that touch our diagram edges
  // vCells = vCells.filter((vc) =>
  //   vc.points.every(
  //     (p) =>
  //       p.x > xl * params.cellClipMult &&
  //       p.x < xr * params.cellClipMult &&
  //       p.y > yt * params.cellClipMult &&
  //       p.y < yb * params.cellClipMult
  //   )
  // );

  // alternate approach: remove cells outside a circle with diameter = width
  vCells = vCells.filter(
    (vc) =>
      dist(0, 0, vc.site.x, vc.site.y) < (width / 2) * params.cellClipMult &&
      vc.points.every(
        (p) => dist(0, 0, p.x, p.y) < (width / 2) * params.cellClipMult
      )
  );

  // find a circle A that encompasses the remaining cells
  car = furthestDistOfCells(vCells, 0, 0);

  // shrink the circle to create circle B
  cbr = car - params.cellTrimR;

  // clip cells using circle B
  vCells = vCells.map((vc) => {
    const plen = vc.points.length;
    const points = [];

    // iterate through each point pair
    vc.points.forEach((ep, i) => {
      const sp = i === 0 ? vc.points[plen - 1] : vc.points[i - 1];

      if (dist(0, 0, ep.x, ep.y) < cbr) {
        // we are in the bounding circle

        points.push(ep);
      } else {
        // we intersect, generate two points -- this is very naive and assumes
        // each cell has only 2 points of intersection with the circle
        // just used to clean up strays!

        points.push(lineSegmentCircleIntersect(sp, ep, cbr));

        const np = i === plen - 1 ? vc.points[0] : vc.points[i + 1];
        points.push(lineSegmentCircleIntersect(np, ep, cbr));
      }
    });

    return { site: vc.site, points };
  });

  // drop out cells (perlin noise)
  if (params.cellDropOutType === "perlin") {
    noiseSeed(420);

    vCells = vCells.filter(
      (vc) =>
        noise(
          vc.site.x * params.cellDropOutMult,
          vc.site.y * params.cellDropOutMult
        ) > params.cellDropOutPercent
    );
  } else if (params.cellDropOutType === "mod") {
    // drop out cells (mod)
    vCells = vCells.filter((vc, i) => i % params.cellDropOutMod !== 0);
  }

  // build our graph and run prim's algorithm
  const graph = [];
  const vclen = vCells.length;

  for (let i = 0; i < vclen - 1; i++) {
    const { x: sx, y: sy } = vCells[i].site;
    for (let j = i + 1; j < vclen; j++) {
      const { x: ex, y: ey } = vCells[j].site;
      graph.push([i, j, dist(sx, sy, ex, ey)]);
    }
  }

  primMst = prim(graph, vclen);

  // create our prim lines
  primLines = primMst.map(
    (e, index) =>
      new FancyLine({
        sp: vCells[e[0]].site,
        ep: vCells[e[1]].site,
        index, //: e[0], // set our index to our origin site
        stroke: [92, 92, 92],
        strokeWeight: primStrokeWeight,
        extendStart: -3,
        extendEnd: -3,
        showArrows: true,
        arrowDistance: params.primMstArrowDist,
        arrowWidth: params.primMstArrowWidth,
        arrowHeight: params.primMstArrowHeight,
        arrowStroke: primArrowStroke,
        arrowInterp: primArrowInterp,
      })
  );

  // a test fancyline
  // primLines.push(
  //   new FancyLine({
  //     sp: { x: -200, y: -200 },
  //     ep: { x: 200, y: -200 },
  //     index: -1,
  //     stroke: [92, 92, 92],
  //     strokeWeight: primStrokeWeight,
  //     showArrows: true,
  //     arrowDistance: 30,
  //     arrowStroke: primArrowStroke,
  //     arrowInterp: primArrowInterp,
  //   })
  // );

  // update our monitor
  params.actualCellCount = vCells.length;
};

// ----------------------------------------------------------------------------
// draw cells
// ----------------------------------------------------------------------------

const drawCells = () => {
  // begin
  translate(width / 2, height / 2);
  scale(params.scale);
  strokeWeight(1.5 / params.scale);
  translate(params.canvasX, params.canvasY);

  // text (for debugging)
  const ts = params.textSize / params.scale;
  textSize(ts);
  const textMiddle = ts / 2 - textAscent() * 0.8; // magic number, font specific

  // all cell sites (including those removed from the voronoi diagram)
  // cellPoints.forEach((p, i) => {
  //   point(p.x, p.y);
  //   ellipse(p.x, p.y, cellSize, cellSize);
  //   text(i, p.x, p.y - textMiddle);
  // });

  vCells.forEach((vc, i) => {
    push();
    stroke(255);
    strokeWeight(2 / params.scale);

    fill(i === selectedVCellIndex || i === overVCellIndex ? 156 : 192);

    // voronoi boundary
    if (params.showCells) {
      beginShape();
      vc.points.forEach((p) => vertex(p.x, p.y));
      endShape(CLOSE);
    }
    pop();

    // site
    const { x, y } = vc.site;

    if (params.showCellSites) {
      circle(x, y, 6); // we could use params.cellSize but we want to connect with our arrow lines
    }

    if (params.showCellText) {
      push();
      strokeWeight(1 / params.scale);
      text(i, x, y - textMiddle);
      pop();
    }
  });

  // prim tree
  if (params.showPrimMst) {
    push();
    primLines.forEach((p) => {
      if (params.primMstArrowDist !== p.arrowDistance)
        p.setArrowDistance(params.primMstArrowDist);
      p.arrowWidth = params.primMstArrowWidth;
      p.arrowHeight = params.primMstArrowHeight;
      p.draw();
    });
    pop();
  }

  // debug clip circles
  if (params.showCellTrimCircles) {
    push();
    stroke(0, 0, 255);
    circle(0, 0, car * 2);

    stroke(255, 0, 0);
    circle(0, 0, cbr * 2);
    pop();
  }
};

// ----------------------------------------------------------------------------
// interaction
// keycodes can be looked up here: https://www.toptal.com/developers/keycode
// ----------------------------------------------------------------------------

let dragging = false;

let startCanvasX = 0;
let startCanvasY = 0;

let mousePressedX = 0;
let mousePressedY = 0;

sketch.keyPressed = () => {
  if (keyCode === 32) {
    dragging = true;
    cursor("grab");
    return false;
  }
};

sketch.keyReleased = () => {
  dragging = false;
  cursor(ARROW);
};

sketch.mouseMoved = () => {
  // check for cell rollovers
  const x = (mouseX + xl) / params.scale - params.canvasX;
  const y = (mouseY + yt) / params.scale - params.canvasY;

  const i = voronoiGetSite(vCells, x, y);

  if (i !== overVCellIndex) {
    overVCellIndex = voronoiGetSite(vCells, x, y);
  }
};

sketch.mousePressed = () => {
  // if we aren't dragging see if we clicked on a cell

  if (!dragging) {
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
      const x = (mouseX + xl) / params.scale - params.canvasX;
      const y = (mouseY + yt) / params.scale - params.canvasY;

      selectedVCellIndex = voronoiGetSite(vCells, x, y);
    }
  }

  // record where we clicked for later
  mousePressedX = mouseX;
  mousePressedY = mouseY;

  startCanvasX = params.canvasX;
  startCanvasY = params.canvasY;
};

sketch.mouseDragged = () => {
  if (dragging) {
    params.canvasX = startCanvasX + (mouseX - mousePressedX) / params.scale;
    params.canvasY = startCanvasY + (mouseY - mousePressedY) / params.scale;
  }
};

sketch.mouseWheel = (e) => {
  // scale range is 0.5 - 10 (also defined in tweakpane)

  params.scale = constrain(
    Math.round((params.scale + e.delta / 128) * 10) / 10,
    0.5,
    10
  );

  // update our tweakpane
  pane?.refresh();
};

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

// test synthesizer if we are using audio

// test synthesizer
// let toneStarted = false;
// let synth;

// sketch.mousePressed = async () => {
//   if (!toneStarted) {
//     await Tone.start();
//     synth = new Tone.Synth().toDestination();
//     toneStarted = true;
//   }

//   synth.triggerAttackRelease("C4", "8n");
// };
