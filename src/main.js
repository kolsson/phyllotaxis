import "./style.css";
import p5 from "p5";
import * as Tone from "tone";
import * as Voronoi from "voronoi/rhill-voronoi-core";

import { tp } from "./tweakpane";

const sketch = window;
window.p5 = p5;

// canvas size
let xl, xr, yt, yb;

// cells
let cellPoints, vCells;

const v = new Voronoi();
let vd;

// ----------------------------------------------------------------------------
// define parameters
// ----------------------------------------------------------------------------

const params = {
  // monitors
  actualCellCount: 300,

  // core params
  cellCount: 300,
  startCell: 1,

  cellAngle: 137,
  cellAngleFrac: 0.5,

  cellSize: 24,
  cellClipR: 0,

  // debugging
  showCellSites: false,
  showCellClipCircles: false,
  showCellText: false,
  textSize: 10,
};

// ----------------------------------------------------------------------------
// tweakpane
// ----------------------------------------------------------------------------

const pane = tp(params);

pane.on("change", () => {
  redraw();
});

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

  stroke(0);
  noFill();
  // noSmooth();

  angleMode(DEGREES);

  noLoop();
};

// ----------------------------------------------------------------------------
// sketch: draw
// ----------------------------------------------------------------------------

sketch.draw = () => {
  background(245);

  computeCells();
  drawCells();
};

// ----------------------------------------------------------------------------
// given a cell / cells find the furthest distance from a given point
// ----------------------------------------------------------------------------

const furthestDistOfCell = (cell, x, y) =>
  cell.points.reduce((prev, curr) => max(prev, dist(x, y, curr.x, curr.y)), 0);

const furthestDistofCells = (cells, x, y) =>
  cells.reduce((prev, curr) => max(prev, furthestDistOfCell(curr, x, y)), 0);

// ----------------------------------------------------------------------------
// find the intersection between a line segment and a circle
// return the intersection closest to the starting point
// input order matters!
// https://stackoverflow.com/questions/23016676/line-segment-and-circle-intersection
// ----------------------------------------------------------------------------

const lineSegmentCircleIntersect = (sp, ep, r, cx = 0, cy = 0) => {
  const dx = ep.x - sp.x;
  const dy = ep.y - sp.y;

  const A = dx * dx + dy * dy;
  const B = 2 * (dx * (sp.x - cx) + dy * (sp.y - cy));
  const C = (sp.x - cx) * (sp.x - cx) + (sp.y - cy) * (sp.y - cy) - r * r;
  const det = B * B - 4 * A * C;

  const t1 = (-B + sqrt(det)) / (2 * A);
  const t2 = (-B - sqrt(det)) / (2 * A);
  const i1 = {
    x: sp.x + t1 * dx,
    y: sp.y + t1 * dy,
  };
  const i2 = {
    x: sp.x + t2 * dx,
    y: sp.y + t2 * dy,
  };

  // use intersection closest to start of line
  return dist(sp.x, sp.y, i1.x, i1.y) < dist(sp.x, sp.y, i2.x, i2.y) ? i1 : i2;
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
  car = furthestDistofCells(vCells, 0, 0);

  // shrink the circle slightly, and filter again
  carr = car - params.cellClipR; // magic number, for now

  const tvc = vCells.filter((vc) =>
    vc.points.every((p) => dist(0, 0, p.x, p.y) < carr)
  );

  // find another circle B that encompasses remaining cells
  cbr = furthestDistofCells(tvc, 0, 0);

  // clip cells using circleB (do not create additional points)
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
        // we intersect, generate two points -- this is very naive
        points.push(lineSegmentCircleIntersect(sp, ep, cbr));

        const np = i === plen - 1 ? vc.points[0] : vc.points[i + 1];
        points.push(lineSegmentCircleIntersect(np, ep, cbr));
      }
    });

    return { site: vc.site, points };
  });

  // sort cells starting at cell closest to the center, then moving clockwise to adjacent cells

  // update our monitor
  params.actualCellCount = vCells.length;
};

// ----------------------------------------------------------------------------
// draw cells
// ----------------------------------------------------------------------------

const drawCells = () => {
  // text (for debugging)
  textSize(params.textSize);
  const textMiddle = params.textSize / 2 - textAscent() * 0.8; // magic number, font specific

  // begin
  translate(width / 2, height / 2);

  // cell points (including those removed from the voronoi diagram)
  // for (const p of cellPoints) {
  //   point(p.x, p.y);
  //   ellipse(p.x, p.y, cellSize, cellSize);
  // }

  // voronoi cells
  vCells.forEach((vc, i) => {
    // site

    const { x, y } = vc.site;

    if (params.showCellSites) {
      // point(x, y);
      ellipse(x, y, params.cellSize, params.cellSize);
    }

    if (params.showCellText) {
      text(i, x, y - textMiddle);
    }

    // voronoi points

    beginShape();
    for (const p of vc.points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
  });

  // debug clip circles
  if (params.showCellClipCircles) {
    ellipse(0, 0, car * 2);
    ellipse(0, 0, carr * 2);
    ellipse(0, 0, cbr * 2);
  }
};

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

// test synthesizer if we are using audio

// test synthesizer
let toneStarted = false;
let synth;

// sketch.mousePressed = async () => {
//   if (!toneStarted) {
//     await Tone.start();
//     synth = new Tone.Synth().toDestination();
//     toneStarted = true;
//   }

//   synth.triggerAttackRelease("C4", "8n");
// };
