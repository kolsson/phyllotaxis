import "./style.css";
import p5 from "p5";
import * as Tone from "tone";
import * as Voronoi from "voronoi/rhill-voronoi-core";

import tweakpane from "./tweakpane";
import prim from "./prim";

const sketch = window;
window.p5 = p5;

// canvas size
let xl, xr, yt, yb;

// cells
let cellPoints, vCells;
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

  // shrink the circle and filter again
  carr = car - params.cellClipR;

  const tvc = vCells.filter((vc) =>
    vc.points.every((p) => dist(0, 0, p.x, p.y) < carr)
  );

  // find another circle B that encompasses remaining cells
  cbr = furthestDistofCells(tvc, 0, 0);

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

  // run prim's algorithm starting at ?? (closest cell to center)

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
  strokeWeight(1 / params.scale);

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
    // site

    const { x, y } = vc.site;

    if (params.showCellSites) {
      ellipse(x, y, params.cellSize, params.cellSize);
    }

    if (params.showCellText) {
      text(i, x, y - textMiddle);
    }

    // voronoi boundaries

    if (params.showCells) {
      beginShape();
      for (const p of vc.points) {
        vertex(p.x, p.y);
      }
      endShape(CLOSE);
    }

    // prim tree

    if (params.showPrimMst && primMst?.length > 0) {
      primMst.forEach((e) => {
        const { x: sx, y: sy } = vCells[e[0]].site;
        const { x: ex, y: ey } = vCells[e[1]].site;
        line(sx, sy, ex, ey);
      });
    }
  });

  // debug clip circles
  if (params.showCellClipCircles) {
    ellipse(0, 0, car * 2);
    ellipse(0, 0, carr * 2);
    ellipse(0, 0, cbr * 2);
  }
};

// ----------------------------------------------------------------------------
// tweakpane
// ----------------------------------------------------------------------------

const _redraw = () => {
  redraw();
};

const pane = tweakpane(params, _redraw);

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
