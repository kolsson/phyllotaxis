import "./style.css";
import p5 from "p5";
import * as Voronoi from "voronoi/rhill-voronoi-core";
import hull from "hull.js";

import FancyLine from "./helpers/fancyline";

import tweakpane from "./helpers/tweakpane";
import { lineSegmentCircleIntersect } from "./helpers/intersect";
import { calcCentroid } from "./helpers/polygons";
import { furthestDistOfCells, voronoiGetSite } from "./helpers/voronoi";
import chaikin from "./helpers/chaikin";
import prim from "./helpers/prim";
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
let cells;
let selectedCellIndex = -1;
let overCellIndex = -1;

// voronoi
const v = new Voronoi();
let vd;

// prim
let primMst;
let primLines = [];

// audio

// ----------------------------------------------------------------------------
// define parameters
// ----------------------------------------------------------------------------

const params = {
  // monitors
  actualCellCount: 300,
  actualPrimLinesCount: 300,

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
  cellPaddingType: "linear", // linear, exponential
  cellPaddingAmount: 0,
  cellPaddingCurvePower: 1,
  cellPaddingCurveMult: 1,
  cellPaddingCenterPush: 0,

  cellSiteCircleRMult: 0.5,

  cellClipMult: 1,
  cellTrimR: 0,

  cellDropOutType: "none", // none, perlin, distance, mod
  cellDropOutPercMin: 0.4,
  cellDropOutPercMax: 0.4,
  cellDropOutNoisePosMult: 1,
  cellDropOutMod: 10,
  cellReorderAfterDropOut: true,

  primMstIsBezierDistSwing: true,
  primMstBezierSwingStart: 2,
  primMstBezierSwingEnd: 2,
  primMstBezierSwingSensitivity: 1,
  primMstShowArrows: true,
  primMstArrowDist: 9,
  primMstArrowWidth: 2,
  primMstArrowHeight: 2,
  primMstArrowSpeed: 1,

  // debugging
  showCells: true,
  showPrimLines: true,
  highlightPrimMstIndex: -1,
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
  selectedCellIndex = -1;
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

  frameRate(30);

  // audio setup finished after first click
  audio.init();

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

  // center origin
  translate(width / 2, height / 2);

  drawCells();

  // global metronome
  // drawMetronome();

  // EXPERIMENTING
  drawExperimenting();
};

// ----------------------------------------------------------------------------
// fancyline callbacks
// ----------------------------------------------------------------------------

const primStrokeWeight = () => 1 / params.scale;

const primStroke = (m, i) => {
  if (i === params.highlightPrimMstIndex) return color(255, 0, 0);
  return color(92, 92, 92);
};

const primArrowStroke = (m, i, d, t) => {
  // adjust 8 multiplier to speed up or slow down fade in / out
  const a = Math.min(1, (((t > 0.5 ? 1 - t : t) * d) / 15) * 8);

  if (i === params.highlightPrimMstIndex) return color(255, 0, 0, a * 255);
  return color(92, 92, 92, a * 255);
};

// use i to stagger things a bit
const primArrowInterp = (m, i, d) =>
  (m * params.primMstArrowSpeed + i * 1000) / (100 * d);

// randomly pick a positive or negative sign
const primArrowBezierSwing = (m, i) =>
  params.primMstBezierSwingStart * Math.sign(1 - 2 * noise(i));

let longestPrimArrowLength = Number.MIN_SAFE_INTEGER;
let shortestPrimArrowLength = Number.MAX_SAFE_INTEGER;

const primArrowBezierDistSwing = (m, i, lined) => {
  // lined is our straight point-to-point distance,
  // not our curve distance (we don't know our curve yet
  // because we are defining the swing here)

  let t =
    (lined - shortestPrimArrowLength) /
    (longestPrimArrowLength - shortestPrimArrowLength);
  t = constrain(t * params.primMstBezierSwingSensitivity, 0, 1);

  const swing =
    lerp(params.primMstBezierSwingStart, params.primMstBezierSwingEnd, t) *
    Math.sign(1 - 2 * noise(i));

  return swing;
};

// animated swing
// const primArrowBezierSwing = (m, i) =>
//   noise(i) * 30 * Math.sin((m + i * 1000) / 100 + 200 * noise(i));

// ----------------------------------------------------------------------------
// reorder cells based on distance from center
// ----------------------------------------------------------------------------

const reorderCells = () => {
  cells = [...cells].sort((a, b) => (a.site.d < b.site.d ? -1 : 1));
};

// ----------------------------------------------------------------------------
// compute cells
// ----------------------------------------------------------------------------

const computeCells = () => {
  // reset our random seed
  noiseSeed(420);

  const p = [];
  const thetam = (params.cellAngle + params.cellAngleFrac) * (Math.PI / 180);

  for (let i = params.startCell; i < params.cellCount; i++) {
    const theta = i * thetam;
    const r = params.cellSize * sqrt(i);
    const x = r * cos(theta);
    const y = r * sin(theta);
    p.push({ x, y });
  }

  // compute voronoi diagram
  if (vd?.length > 0) v.recycle(vd); // if we have an existing diagram, recycle
  vd = v.compute(p, {
    xl: xl * params.cellClipMult,
    xr: xr * params.cellClipMult,
    yt: yt * params.cellClipMult,
    yb: yb * params.cellClipMult,
  });

  // get voronoi cells
  cells = [];

  for (let i = 0; i < vd.cells.length; i++) {
    const site = { ...vd.cells[i].site };

    const points = [];
    for (let j = 0; j < vd.cells[i].halfedges.length; j++) {
      points.push({ ...vd.cells[i].halfedges[j].getStartpoint() });
    }

    cells.push({ site, points });
  }

  // rectangle approach: remove cells that touch our diagram edges
  // cells = cells.filter((c) =>
  //   c.points.every(
  //     (p) =>
  //       p.x > xl * params.cellClipMult &&
  //       p.x < xr * params.cellClipMult &&
  //       p.y > yt * params.cellClipMult &&
  //       p.y < yb * params.cellClipMult
  //   )
  // );

  // circle approach: remove cells outside a circle with diameter = width
  cells = cells.filter(
    (c) =>
      dist(0, 0, c.site.x, c.site.y) < (width / 2) * params.cellClipMult &&
      c.points.every(
        (p) => dist(0, 0, p.x, p.y) < (width / 2) * params.cellClipMult
      )
  );

  // find a circle A that encompasses the remaining cells
  const car = furthestDistOfCells(cells, 0, 0);

  // shrink the circle to create circle B
  const cbr = car - params.cellTrimR;

  // clip cells using circle B
  cells = cells.map((c) => {
    const plen = c.points.length;
    const points = [];

    // iterate through each point pair
    c.points.forEach((ep, i) => {
      const sp = i === 0 ? c.points[plen - 1] : c.points[i - 1];

      if (dist(0, 0, ep.x, ep.y) < cbr) {
        // we are in the bounding circle

        points.push(ep);
      } else {
        // we intersect, generate two points -- this is very naive and assumes
        // each cell has only 2 points of intersection with the circle
        // may result in weird balloon knots! (cleaned up by making convex hulls
        // later )

        points.push(lineSegmentCircleIntersect(sp, ep, cbr));

        const np = i === plen - 1 ? c.points[0] : c.points[i + 1];
        points.push(lineSegmentCircleIntersect(np, ep, cbr));
      }
    });

    return { ...c, points };
  });

  // store cell distances and find our cell furthest from the center
  const furthestCell = cells.reduce((acc, c, i) => {
    c.site.d = dist(0, 0, c.site.x, c.site.y);

    if (i === 0) return c;
    return acc.site.d > acc, c.site.d ? acc : c;
  }, 0);

  // reorder cells?
  if (!params.cellReorderAfterDropOut) reorderCells();

  // drop out!
  if (params.cellDropOutType === "perlin") {
    // drop out cells (perlin noise)
    // doesn't matter if we reorder before or after

    cells = cells.filter(
      (c) =>
        noise(
          c.site.x * params.cellDropOutNoisePosMult,
          c.site.y * params.cellDropOutNoisePosMult
        ) > random(params.cellDropOutPercMin, params.cellDropOutPercMax)
    );
  } else if (params.cellDropOutType === "mod") {
    // drop out cells (mod)
    cells = cells.filter((c, i) => i % params.cellDropOutMod !== 0);
  } else if (params.cellDropOutType === "distance") {
    // drop out cells (distance adjusted perlin noise)
    cells = cells.filter((c) => {
      const t = c.site.d / furthestCell.site.d;
      const perc = lerp(
        params.cellDropOutPercMin,
        params.cellDropOutPercMax,
        t
      );

      return (
        noise(
          c.site.x * params.cellDropOutNoisePosMult,
          c.site.y * params.cellDropOutNoisePosMult
        ) > perc
      );
    });
  }

  // reorder cells?
  if (params.cellReorderAfterDropOut) reorderCells();

  // build our graph and run prim's algorithm
  const graph = [];
  const clen = cells.length;

  for (let i = 0; i < clen - 1; i++) {
    const { x: sx, y: sy } = cells[i].site;
    for (let j = i + 1; j < clen; j++) {
      const { x: ex, y: ey } = cells[j].site;
      graph.push([i, j, dist(sx, sy, ex, ey)]);
    }
  }

  primMst = prim(graph, clen);

  // compute chaikin curves
  cells = cells.map((c) => {
    c.vpoints = c.points; // save our voronoi points for later?
    c.points = chaikin(c.vpoints, 0.2, 4, true);

    return c;
  });

  // remove balloon knots by making convex hulls
  cells.forEach((c) => (c.points = hull(c.points, Infinity, [".x", ".y"])));

  // space our cells
  cells.forEach((c, i) => {
    const centroid = calcCentroid(c.points);
    const d = dist(0, 0, centroid.x, centroid.y);
    const unit = { x: centroid.x / d, y: centroid.y / d };
    const theta = Math.atan2(centroid.y, centroid.x);

    let cp;
    if (params.cellPaddingType === "linear") {
      // linear
      cp = params.cellPaddingAmount + 1;
    } else if (params.cellPaddingType === "exponential") {
      // exponential
      cp = Math.max(
        1,
        map(
          d,
          0,
          furthestCell.site.d,
          1,
          Math.pow(params.cellPaddingAmount + 1, params.cellPaddingCurvePower)
        ) * params.cellPaddingCurveMult
      );
    }

    const newCentroid = {
      x: d * cp * Math.cos(theta) + params.cellPaddingCenterPush * unit.x,
      y: d * cp * Math.sin(theta) + params.cellPaddingCenterPush * unit.y,
    };

    // site
    c.site.x = c.site.x - centroid.x + newCentroid.x;
    c.site.y = c.site.y - centroid.y + newCentroid.y;

    // update dist
    c.site.d = dist(0, 0, c.site.x, c.site.y);

    // points
    c.points.forEach((p) => {
      p.x = p.x - centroid.x + newCentroid.x;
      p.y = p.y - centroid.y + newCentroid.y;
    });
  });

  // create our prim lines
  const extend = -(params.cellSize * params.cellSiteCircleRMult) / 2;

  primLines = primMst.map(
    (e, index) =>
      new FancyLine({
        type: "bezier",
        sp: cells[e[0]].site, // cells[e[0]].centroid,
        ep: cells[e[1]].site, // cells[e[1]].centroid,
        index, // each line has a unique index
        // index: e[0], // set our index to our site
        stroke: primStroke,
        strokeWeight: primStrokeWeight,
        extendStart: extend,
        extendEnd: extend,
        bezierSwing: params.primMstIsBezierDistSwing
          ? primArrowBezierDistSwing
          : primArrowBezierSwing,
        showArrows: params.primMstShowArrows,
        arrowDistance: params.primMstArrowDist,
        arrowWidth: params.primMstArrowWidth,
        arrowHeight: params.primMstArrowHeight,
        arrowStroke: primArrowStroke,
        arrowInterp: primArrowInterp,
      })
  );

  // update our monitors
  params.actualCellCount = cells.length;
  params.actualPrimLinesCount = primLines.length;

  // EXPERIMENTING
  computeExperimenting();
};

// ----------------------------------------------------------------------------
// draw cells
// ----------------------------------------------------------------------------

const drawCells = () => {
  push();

  // scaled / translated space
  scale(params.scale);
  translate(params.canvasX, params.canvasY);

  // text prep
  const ts = params.textSize / params.scale;
  textSize(ts);
  const textMiddle = ts / 2 - textAscent() * 0.8; // magic number, font specific

  // get our millis
  const m = metronomeMillis();

  cells.forEach((c, i) => {
    // cell boundaries

    if (params.showCells) {
      push();
      stroke(92);
      strokeWeight(1 / params.scale);
      fill(i === selectedCellIndex || i === overCellIndex ? 220 : 255);

      beginShape();
      c.points.forEach((p) => vertex(p.x, p.y));
      endShape(CLOSE);
      pop();
    }

    // cell site
    const { x, y } = c.site;

    // cell site: circle
    if (params.showCellSites) {
      push();
      strokeWeight(1 / params.scale);
      circle(x, y, params.cellSize * params.cellSiteCircleRMult);
      pop();
    }

    // cell cite: text
    if (params.showCellText) {
      push();
      strokeWeight(1 / params.scale);
      text(i, x, y - textMiddle);
      pop();
    }
  });

  // prim tree
  if (params.showPrimLines) {
    push();

    // get our longest and shortest lines (straight point-to-point distance)

    longestPrimArrowLength = primLines.reduce(
      (acc, p) => Math.max(acc, p.lined),
      Number.MIN_SAFE_INTEGER
    );

    shortestPrimArrowLength = primLines.reduce(
      (acc, p) => Math.min(acc, p.lined),
      Number.MAX_SAFE_INTEGER
    );

    primLines.forEach((p, i) => {
      p.showArrows = params.primMstShowArrows;

      if (params.primMstShowArrows) {
        if (params.primMstArrowDist !== p.arrowDistance)
          p.setArrowDistance(params.primMstArrowDist);

        p.arrowWidth = params.primMstArrowWidth;
        p.arrowHeight = params.primMstArrowHeight;
      }

      p.draw(m);
    });
    pop();
  }

  pop();
};

// ----------------------------------------------------------------------------
// metronome
// ----------------------------------------------------------------------------

const drawMetronome = () => {
  // 60 bpm

  push();

  stroke(255, 0, 0);
  strokeWeight(1);

  rectMode(CENTER);

  // line

  const lsx = -width / 6;
  const lex = -lsx;
  const ly = height / 2 - 20;
  line(lsx, ly, lex, ly);

  // "pendulum"

  const pwidth = 10;
  const pheight = 24;

  const px = lerp(lsx + pwidth / 2, lex - pwidth / 2, metronomeT());
  rect(px, ly, pwidth, pheight);

  pop();
};

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
  // check for cell rollovers
  const x = (mouseX + xl) / params.scale - params.canvasX;
  const y = (mouseY + yt) / params.scale - params.canvasY;

  const i = voronoiGetSite(cells, x, y);

  if (i !== overCellIndex) {
    overCellIndex = voronoiGetSite(cells, x, y);
  }
};

sketch.mousePressed = async () => {
  // if we aren't dragging see if we clicked on a cell

  if (!draggingModifier) {
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
      const x = (mouseX + xl) / params.scale - params.canvasX;
      const y = (mouseY + yt) / params.scale - params.canvasY;

      selectedCellIndex = voronoiGetSite(cells, x, y);

      audio.play();
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
  // scale range is 0.5 - 10 (also defined in tweakpane)

  params.scale = constrain(
    Math.round((params.scale + e.delta / 128) * 10) / 10,
    0.5,
    10
  );

  // update our tweakpane
  pane?.refresh();
};
