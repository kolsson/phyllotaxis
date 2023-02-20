import "./style.css";
import p5 from "p5";
import * as Tone from "tone";
import * as Voronoi from "voronoi/rhill-voronoi-core";

import tweakpane from "./helpers/tweakpane";
import { lineSegmentCircleIntersect } from "./helpers/intersect";
import { furthestDistOfCells, voronoiGetSite } from "./helpers/voronoi";
import prim from "./helpers/prim";

const sketch = window;
window.p5 = p5;

// canvas size
let xl, xr, yt, yb;

// cells
let cellPoints, vCells;
let selectedVCellIndex = -1;
let overVCellIndex = -1;
let primMst;

const v = new Voronoi();
let vd;

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
  noFill();
  angleMode(DEGREES);

  // build our tweakpane
  tweakpane(params, _compute, _redraw, _didLoadPreset);

  // start
  computeCells();
  noLoop();
};

// ----------------------------------------------------------------------------
// sketch: draw
// ----------------------------------------------------------------------------

sketch.draw = () => {
  background(255);
  drawCells();
};

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

  // run prim's algorithm

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

  if (params.showPrimMst && primMst?.length > 0) {
    primMst.forEach((e) => {
      const { x: sx, y: sy } = vCells[e[0]].site;
      const { x: ex, y: ey } = vCells[e[1]].site;
      line(sx, sy, ex, ey);
    });
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
    redraw();
  }
};

sketch.mousePressed = () => {
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    const x = (mouseX + xl) / params.scale;
    const y = (mouseY + yt) / params.scale;

    selectedVCellIndex = voronoiGetSite(vCells, x, y);
    redraw();
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
