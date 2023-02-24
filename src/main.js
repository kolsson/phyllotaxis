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

  // core params
  cellCount: 300,
  startCell: 1,

  cellAngle: 137,
  cellAngleFrac: 0.5,

  cellSize: 24,
  cellClipR: 0,

  // debugging
  showCellClipCircles: false,
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
  tweakpane(params, _compute, _redraw, _didLoadPreset);

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
// sample strokeWeights for FancyLine
// ----------------------------------------------------------------------------

// basic
const primStrokeWeight = () => 1.5 / params.scale;

// random
// const primStrokeWeight = () => (1 + 4 * Math.random()) / params.scale;

// time based
// const primStrokeWeight = () => (1 + (1 + sin(millis() / 10))) / params.scale;

// time and index based
// const primStrokeWeight = (i) =>
//   (1 + (1 + sin(millis() / 4 + i * 100))) / params.scale;

// ----------------------------------------------------------------------------
// sample arrowStrokes for FancyLine
// ----------------------------------------------------------------------------

const arrowColor = [92, 92, 92];

// basic
// const primArrowStroke = arrowColor;

// t based (easing)
// const primArrowStroke = (i, d, t) =>
//   color([...arrowColor, E.easeOutQuint(t > 0.5 ? 1 - t : t) * 255]);

// t / distance based (easing)
const primArrowStroke = (i, d, t) =>
  color([
    ...arrowColor,
    E.easeOutQuint(((t > 0.5 ? 1 - t : t) * d) / 20) * 255,
  ]);

// index based
// const startArrowColor = [128, 0, 128];
// const endArrowColor = [0, 0, 255];

// const primArrowStroke = (i) =>
//   lerpColor(
//     color(startArrowColor),
//     color(endArrowColor),
//     i / (params.actualCellCount || 1)
//   );

// // const alpha = Math.max(0, Math.min(255, 255 * (t * 3)));

// ----------------------------------------------------------------------------
// sample arrowInterps for FancyLine
// ----------------------------------------------------------------------------

// basic
// const primArrowInterp = 1;

// time based (back and forth)
// const primArrowInterp = () => (1 - cos(millis() / 10)) / 2;

// time based (forward)
// const primArrowInterp = () => millis() / 1500;

// time and index based (forward)
// const primArrowInterp = (i) => (millis() + i * 100) / 1500;

// distance based
const primArrowInterp = (i, d) => millis() / (100 * d);

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
  vd = v.compute(cellPoints, { xl, xr, yt, yb });

  // get voronoi cells

  vCells = [];
  for (let i = 0; i < vd.cells.length; i++) {
    const points = [];
    for (let j = 0; j < vd.cells[i].halfedges.length; j++) {
      points.push({ ...vd.cells[i].halfedges[j].getStartpoint() });
    }
    vCells.push({ site: { ...vd.cells[i].site }, points });
  }
  // filter our cells, remove cells that touch our canvas edges
  // vCells = vCells.filter((vc) =>
  //   vc.points.every((p) => p.x > xl && p.x < xr && p.y > yt && p.y < yb)
  // );

  // alternate approach: remove cells outside a circle with diameter = width
  vCells = vCells.filter((vc) =>
    vc.points.every((p) => dist(0, 0, p.x, p.y) < width / 2)
  );

  // find a circle A that encompasses remaining cells
  car = furthestDistOfCells(vCells, 0, 0);

  // shrink the circle and filter again
  carr = car - params.cellClipR;

  const tvc = vCells.filter((vc) =>
    vc.points.every((p) => dist(0, 0, p.x, p.y) < carr)
  );

  // find another circle B that encompasses remaining cells
  cbr = furthestDistOfCells(tvc, 0, 0);

  // clip cells using circleB
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

        points.push(lineSegmentCircleIntersect(sp, ep, cbr));

        const np = i === plen - 1 ? vc.points[0] : vc.points[i + 1];
        points.push(lineSegmentCircleIntersect(np, ep, cbr));
      }
    });

    return { site: vc.site, points };
  });

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
        arrowCount: 2,
        arrowStroke: primArrowStroke,
        arrowInterp: primArrowInterp,
      })
  );

  // a test fancyline
  primLines.push(
    new FancyLine({
      sp: { x: -200, y: -200 },
      ep: { x: 200, y: -200 },
      index: -1,
      stroke: [92, 92, 92],
      strokeWeight: primStrokeWeight,
      extendStart: -3,
      extendEnd: -3,
      arrowCount: 10,
      arrowStroke: primArrowStroke,
      arrowInterp: primArrowInterp,
    })
  );

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
      ellipse(x, y, params.cellSize, params.cellSize);
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
    primLines.forEach((p) => p.draw());
  }

  // debug clip circles
  if (params.showCellClipCircles) {
    ellipse(0, 0, car * 2);
    ellipse(0, 0, carr * 2);
    ellipse(0, 0, cbr * 2);
  }
};

// ----------------------------------------------------------------------------
// voronoi selection
// ----------------------------------------------------------------------------

sketch.mouseMoved = () => {
  const x = (mouseX + xl) / params.scale;
  const y = (mouseY + yt) / params.scale;

  const i = voronoiGetSite(vCells, x, y);

  if (i !== overVCellIndex) {
    overVCellIndex = voronoiGetSite(vCells, x, y);
  }
};

sketch.mousePressed = () => {
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    const x = (mouseX + xl) / params.scale;
    const y = (mouseY + yt) / params.scale;

    selectedVCellIndex = voronoiGetSite(vCells, x, y);
  }
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
