import "./style.css";
import p5 from "p5";
import * as Tone from "tone";
import * as Voronoi from "voronoi/rhill-voronoi-core";

import FancyLine from "./helpers/fancyline";

import tweakpane from "./helpers/tweakpane";
import { lineSegmentCircleIntersect } from "./helpers/intersect";
import { calcCentroid } from "./helpers/polygons";
import { furthestDistOfCells, voronoiGetSite } from "./helpers/voronoi";
import chaikin from "./helpers/chaikin";
import prim from "./helpers/prim";

// experimenting
import { computeExperimenting, drawExperimenting } from "./experiments";

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
  cellPaddingType: "linear", // linear, exponential
  cellPaddingAmount: 0,
  cellPaddingCurvePower: 1,
  cellPaddingCurveMult: 1,
  cellPaddingCenterPush: 0,

  cellSiteCircleRMult: 0.5,

  cellClipMult: 1,
  cellTrimR: 0,

  cellDropOutType: "perlin", // none, perlin, mod, exponential
  cellDropOutPerc: 0.4,
  cellDropOutMult: 1,
  cellDropOutMod: 10,
  cellReorderAfterDropOut: true,

  primMstBezierSwingMult: 2,
  primMstShowArrows: true,
  primMstArrowDist: 9,
  primMstArrowWidth: 2,
  primMstArrowHeight: 2,
  primMstArrowSpeed: 1,

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

const primStrokeWeight = () => 1 / params.scale;

const primArrowStroke = (m, i, d, t) => {
  // adjust 8 multiplier to speed up or slow down fade in / out
  const a = Math.min(1, (((t > 0.5 ? 1 - t : t) * d) / 15) * 8);
  return color(92, 92, 92, a * 255);
};

// use i to stagger things a bit
const primArrowInterp = (m, i, d) =>
  (m * params.primMstArrowSpeed + i * 1000) / (100 * d);

// pick a random -2 or 2 (same as random([-2, 2]))
const primArrowBezierSwing = (m, i) =>
  params.primMstBezierSwingMult * Math.sign(1 - 2 * noise(i));

// const primArrowBezierSwing = (m, i) =>
//   noise(i) * 30 * Math.sin((m + i * 1000) / 100 + 200 * noise(i));

// ----------------------------------------------------------------------------
// reorder cells based on distance from center
// ----------------------------------------------------------------------------

const reorderCells = () => {
  cells = [...cells].sort((a, b) =>
    dist(0, 0, a.site.x, a.site.y) < dist(0, 0, b.site.x, b.site.y) ? -1 : 1
  );
};

// ----------------------------------------------------------------------------
// compute cells
// ----------------------------------------------------------------------------

let car, cbr;

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
  car = furthestDistOfCells(cells, 0, 0);

  // shrink the circle to create circle B
  cbr = car - params.cellTrimR;

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
        // just used to clean up strays!

        points.push(lineSegmentCircleIntersect(sp, ep, cbr));

        const np = i === plen - 1 ? c.points[0] : c.points[i + 1];
        points.push(lineSegmentCircleIntersect(np, ep, cbr));
      }
    });

    return { ...c, points };
  });

  // reorder cells?
  if (!params.cellReorderAfterDropOut) reorderCells();

  // drop out!
  if (params.cellDropOutType === "perlin") {
    // drop out cells (perlin noise)
    // doesn't matter if we reorder before or after

    cells = cells.filter(
      (c) =>
        noise(
          c.site.x * params.cellDropOutMult,
          c.site.y * params.cellDropOutMult
        ) > params.cellDropOutPerc
    );
  } else if (params.cellDropOutType === "mod") {
    // drop out cells (mod)
    cells = cells.filter((c, i) => i % params.cellDropOutMod !== 0);
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
          400, // width / 2,
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
        stroke: [92, 92, 92],
        strokeWeight: primStrokeWeight,
        extendStart: extend,
        extendEnd: extend,
        bezierSwing: primArrowBezierSwing,
        showArrows: params.primMstShowArrows,
        arrowDistance: params.primMstArrowDist,
        arrowWidth: params.primMstArrowWidth,
        arrowHeight: params.primMstArrowHeight,
        arrowStroke: primArrowStroke,
        arrowInterp: primArrowInterp,
      })
  );

  // update our monitor
  params.actualCellCount = cells.length;

  // EXPERIMENTING
  computeExperimenting();
};

// ----------------------------------------------------------------------------
// draw cells
// ----------------------------------------------------------------------------

const drawCells = () => {
  // begin
  translate(width / 2, height / 2);
  scale(params.scale);
  translate(params.canvasX, params.canvasY);

  // text prep
  const ts = params.textSize / params.scale;
  textSize(ts);
  const textMiddle = ts / 2 - textAscent() * 0.8; // magic number, font specific

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
  if (params.showPrimMst) {
    push();
    primLines.forEach((p) => {
      if (!params.primMstShowArrows) {
        p.showArrows = false;
      } else {
        p.showArrows = true;

        if (params.primMstArrowDist !== p.arrowDistance)
          p.setArrowDistance(params.primMstArrowDist);
        p.arrowWidth = params.primMstArrowWidth;
        p.arrowHeight = params.primMstArrowHeight;
      }
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

  // EXPERIMENTING
  drawExperimenting();
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

sketch.mousePressed = () => {
  // if we aren't dragging see if we clicked on a cell

  if (!draggingModifier) {
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
      const x = (mouseX + xl) / params.scale - params.canvasX;
      const y = (mouseY + yt) / params.scale - params.canvasY;

      selectedCellIndex = voronoiGetSite(cells, x, y);
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
