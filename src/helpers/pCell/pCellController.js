import p5 from "p5";
import * as Voronoi from "voronoi/rhill-voronoi-core";
import hull from "hull.js";

import globals from "../../globals";

import PCell from "./pCell";
import FancyLine from "../fancyline/fancyline";

import { lineSegmentCircleIntersect, raycast } from "../intersect";
import { calcCentroid } from "../polygons";
import prim from "../prim";
import chaikin from "../chaikin";

export default class PCellController {
  constructor({ xl, xr, yt, yb }) {
    // our canvas dimensions
    this.xl = xl;
    this.xr = xr;
    this.yt = yt;
    this.yb = yb;

    // voronoi
    this.v = new Voronoi();

    // cells
    this.cells = [];

    // mst lines
    this.mstLines = [];

    // our connecting lines
    this.longestMstLineLength = Number.MIN_SAFE_INTEGER;
    this.shortestMstLineLength = Number.MAX_SAFE_INTEGER;
  }

  // ----------------------------------------------------------------------------
  // private voronoi utility methods
  // ----------------------------------------------------------------------------

  furthestDistOfCell(cell, x, y) {
    return cell.points.reduce(
      (prev, curr) => max(prev, dist(x, y, curr.x, curr.y)),
      0
    );
  }

  furthestDistOfCells(x, y) {
    return this.cells.reduce(
      (prev, cell) => max(prev, this.furthestDistOfCell(cell, x, y)),
      0
    );
  }

  getVoronoiSite = (x, y) => {
    for (let i = 0; i < this.cells.length; i++) {
      if (raycast(x, y, this.cells[i].points)) return this.cells[i].index;
    }

    return -1;
  };

  // ----------------------------------------------------------------------------
  // private culling and dropOut methods
  // ----------------------------------------------------------------------------

  cullCellsUsingCanvasDimensions() {
    // rectangle approach: remove cells that touch our diagram edges
    this.cells = this.cells.filter((c) =>
      c.points.every(
        (p) =>
          p.x > this.xl * globals.cells.cellClipMult &&
          p.x < this.xr * globals.cells.cellClipMult &&
          p.y > this.yt * globals.cells.cellClipMult &&
          p.y < this.yb * globals.cells.cellClipMult
      )
    );
  }

  cullCellsUsingCircleRadius(_r) {
    // remove cells outside a circle with radius = width / 2 or height / 2,
    // whichever is smaller

    const r = _r ?? Math.min(xr - xl, yb - yt) / 2;
    this.cells = this.cells.filter((c) => shouldNotCullUsingCircle(c, r));
  }

  shouldNotCullUsingCircle(c, _r) {
    return (
      dist(0, 0, c.site.x, c.site.y) < r * globals.cells.cellClipMult &&
      c.points.every(
        (p) => dist(0, 0, p.x, p.y) < r * globals.cells.cellClipMult
      )
    );
  }

  dropOutCells(furthestCell) {
    if (globals.cells.cellDropOutType === "perlin") {
      // perlin noise drop out
      //
      // doesn't matter if we reorder before or after

      this.cells = this.cells.filter(
        (c) =>
          noise(
            c.site.x * globals.cells.cellDropOutNoisePosMult,
            c.site.y * globals.cells.cellDropOutNoisePosMult
          ) >
          random(
            globals.cells.cellDropOutPercMin,
            globals.cells.cellDropOutPercMax
          )
      );
    } else if (globals.cells.cellDropOutType === "mod") {
      // mod drop out

      this.cells = this.cells.filter(
        (c, i) => i % globals.cells.cellDropOutMod !== 0
      );
    } else if (globals.cells.cellDropOutType === "distance") {
      // distance adjusted perlin noise drop out

      this.cells = this.cells.filter((c) => {
        const t = c.site.zerod / furthestCell.site.zerod;
        const perc = lerp(
          globals.cells.cellDropOutPercMin,
          globals.cells.cellDropOutPercMax,
          t
        );

        return (
          noise(
            c.site.x * globals.cells.cellDropOutNoisePosMult,
            c.site.y * globals.cells.cellDropOutNoisePosMult
          ) > perc
        );
      });
    }
  }

  // ----------------------------------------------------------------------------
  // private reorderCells method
  // ----------------------------------------------------------------------------

  reorderCells() {
    // reorder by distance from (0, 0)

    this.cells = [...this.cells].sort((a, b) =>
      a.site.zerod < b.site.zerod ? -1 : 1
    );

    // update indices
    this.cells.forEach((c, i) => (c.index = i));
  }

  // ----------------------------------------------------------------------------
  // private spaceOutCells method
  // ----------------------------------------------------------------------------

  spaceOutCells(furthestCell) {
    this.cells.forEach((c, i) => {
      const centroid = calcCentroid(c.points);
      const d = dist(0, 0, centroid.x, centroid.y);
      const unit = { x: centroid.x / d, y: centroid.y / d };
      const theta = Math.atan2(centroid.y, centroid.x);

      let cp;
      if (globals.cells.cellPaddingType === "linear") {
        // linear
        cp = globals.cells.cellPaddingAmount + 1;
      } else if (globals.cells.cellPaddingType === "exponential") {
        // exponential
        cp = Math.max(
          1,
          map(
            d,
            0,
            furthestCell.site.zerod,
            1,
            Math.pow(
              globals.cells.cellPaddingAmount + 1,
              globals.cells.cellPaddingCurvePower
            )
          ) * globals.cells.cellPaddingCurveMult
        );
      }

      const newCentroid = {
        x:
          d * cp * Math.cos(theta) +
          globals.cells.cellPaddingCenterPush * unit.x,
        y:
          d * cp * Math.sin(theta) +
          globals.cells.cellPaddingCenterPush * unit.y,
      };

      // site
      c.site.x = c.site.x - centroid.x + newCentroid.x;
      c.site.y = c.site.y - centroid.y + newCentroid.y;

      // update dist
      c.site.zerod = dist(0, 0, c.site.x, c.site.y);

      // points
      c.points.forEach((p) => {
        p.x = p.x - centroid.x + newCentroid.x;
        p.y = p.y - centroid.y + newCentroid.y;
      });
    });
  }

  // ----------------------------------------------------------------------------
  // private drawCells method
  // ----------------------------------------------------------------------------

  drawCells() {
    const ts = globals.debug.textSize / globals.canvas.scale;
    textSize(ts);
    const textMiddle = ts / 2 - textAscent() * 0.8; // magic number, font specific

    // draw cells
    this.cells.forEach((c, i) => c.draw({ textMiddle }));
  }

  // ----------------------------------------------------------------------------
  // private mst line methods
  // ----------------------------------------------------------------------------

  createMstLines(mst) {
    const extend =
      -(globals.cells.cellSize * globals.cells.cellSiteCircleRMult) / 2;

    return mst.map(
      (e, index) =>
        new FancyLine({
          type: "bezier",
          sp: this.cells[e[0]].site,
          ep: this.cells[e[1]].site,
          index, // each line has a unique index
          // index: e[0], // set our index to our site
          stroke: this.mstLineStroke.bind(this),
          strokeWeight: this.mstLineStrokeWeight.bind(this),
          extendStart: extend,
          extendEnd: extend,
          bezierSwing: globals.mstLines.mstLineIsBezierDistSwing
            ? this.mstLineArrowBezierDistSwing.bind(this)
            : this.mstLineArrowBezierSwing.bind(this),
          showArrows: globals.mstLines.mstLineShowArrows,
          arrowDistance: globals.mstLines.mstLineArrowDist,
          arrowWidth: globals.mstLines.mstLineArrowWidth,
          arrowHeight: globals.mstLines.mstLineArrowHeight,
          arrowStroke: this.mstLineArrowStroke.bind(this),
          arrowInterp: this.mstLineArrowInterp.bind(this),
        })
    );
  }

  computePrimMst() {
    const graph = [];
    const clen = this.cells.length;

    for (let i = 0; i < clen - 1; i++) {
      const { x: sx, y: sy } = this.cells[i].site;
      for (let j = i + 1; j < clen; j++) {
        const { x: ex, y: ey } = this.cells[j].site;
        graph.push([i, j, dist(sx, sy, ex, ey)]);
      }
    }

    return prim(graph, clen);
  }

  computeLongestShortestMstLines() {
    // straight point-to-point distance

    this.longestMstLineLength = this.mstLines.reduce(
      (acc, p) => Math.max(acc, p.lined),
      Number.MIN_SAFE_INTEGER
    );

    this.shortestMstLineLength = this.mstLines.reduce(
      (acc, p) => Math.min(acc, p.lined),
      Number.MAX_SAFE_INTEGER
    );
  }

  drawMstLines(m) {
    push();

    this.mstLines.forEach((line) => {
      // pre-draw updates
      line.showArrows = globals.mstLines.mstLineShowArrows;

      if (globals.mstLines.mstLineShowArrows) {
        if (globals.mstLines.mstLineArrowDist !== line.arrowDistance)
          line.setArrowDistance(globals.mstLines.mstLineArrowDist);

        line.arrowWidth = globals.mstLines.mstLineArrowWidth;
        line.arrowHeight = globals.mstLines.mstLineArrowHeight;
      }

      // draw line
      line.draw(m);
    });

    pop();
  }

  // ----------------------------------------------------------------------------
  // private fancyline callbacks (all bound to this)
  // ----------------------------------------------------------------------------

  mstLineStrokeWeight() {
    return 1 / globals.canvas.scale;
  }

  mstLineStroke(m, i) {
    if (i === globals.debug.highlightMstLineIndex) return color(255, 0, 0);
    return color(92, 92, 92);
  }

  mstLineArrowStroke(m, i, d, t) {
    // adjust 8 multiplier to speed up or slow down fade in / out
    const a = Math.min(1, (((t > 0.5 ? 1 - t : t) * d) / 15) * 8);

    if (i === globals.debug.highlightMstLineIndex)
      return color(255, 0, 0, a * 255);
    return color(92, 92, 92, a * 255);
  }

  // use i to stagger things a bit
  mstLineArrowInterp(m, i, d) {
    return (m * globals.mstLines.mstLineArrowSpeed + i * 1000) / (100 * d);
  }

  // randomly pick a positive or negative sign
  mstLineArrowBezierSwing(m, i) {
    return (
      globals.mstLines.mstLineBezierSwingStart * Math.sign(1 - 2 * noise(i))
    );
  }

  mstLineArrowBezierDistSwing(m, i, lined) {
    // lined is our straight point-to-point distance,
    // not our curve distance (we don't know our curve yet
    // because we are defining the swing here)
    let t =
      (lined - this.shortestMstLineLength) /
      (this.longestMstLineLength - this.shortestMstLineLength);
    t = constrain(t * globals.mstLines.mstLineBezierSwingSensitivity, 0, 1);

    const swing =
      lerp(
        globals.mstLines.mstLineBezierSwingStart,
        globals.mstLines.mstLineBezierSwingEnd,
        t
      ) * Math.sign(1 - 2 * noise(i));

    return swing;
  }

  // ----------------------------------------------------------------------------
  // public compute method
  // ----------------------------------------------------------------------------

  compute() {
    // reset our random seed so our cells are consistent
    noiseSeed(420);

    // place our initial phyllotaxis sites
    const p = [];
    const thetam =
      (globals.cells.cellAngle + globals.cells.cellAngleFrac) * (Math.PI / 180);

    for (let i = globals.cells.startCell; i < globals.cells.cellCount; i++) {
      const theta = i * thetam;
      const r = globals.cells.cellSize * Math.sqrt(i);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      p.push({ x, y });
    }

    // compute our voronoi diagram
    if (this.vd?.length > 0) v.recycle(vd); // if we have an existing diagram, recycle
    this.vd = this.v.compute(p, {
      xl: this.xl * globals.cells.cellClipMult,
      xr: this.xr * globals.cells.cellClipMult,
      yt: this.yt * globals.cells.cellClipMult,
      yb: this.yb * globals.cells.cellClipMult,
    });

    // get our voronoi cells and create new pCells
    // at the same time cull cells outside our bounds circle
    this.cells = [];
    const r = Math.min(this.xr - this.xl, this.yb - this.yt) / 2;
    const rccm = r * globals.cells.cellClipMult;
    let index = 0;

    for (let i = 0; i < this.vd.cells.length; i++) {
      const site = { ...this.vd.cells[i].site };

      if (dist(0, 0, site.x, site.y) < rccm) {
        // our site is within our bounds circle
        const points = [];
        for (let j = 0; j < this.vd.cells[i].halfedges.length; j++) {
          points.push({ ...this.vd.cells[i].halfedges[j].getStartpoint() });
        }

        // now check if our points are inside our bounds circle
        if (points.every((p) => dist(0, 0, p.x, p.y) < rccm)) {
          this.cells.push(new PCell({ index, site, points }));
          index++;
        }
      }
    }

    // find a circle that encompasses the remaining cells
    // shrink the circle to create our clip circle
    const clipr = this.furthestDistOfCells(0, 0) - globals.cells.cellTrimR;

    // clip cells using clip circle
    this.cells.forEach((c) => {
      const plen = c.points.length;
      const points = [];

      // iterate through each point pair
      c.points.forEach((ep, i) => {
        const sp = i === 0 ? c.points[plen - 1] : c.points[i - 1];

        if (dist(0, 0, ep.x, ep.y) < clipr) {
          // we are in the clip circle

          points.push(ep);
        } else {
          // we intersect the clip circle so generate two points
          //
          // this is very naive and assumes each cell always has 2 points of
          // intersection with the circle
          //
          // may result in weird balloon knots (probably ordering issue)!
          // we clean this up by making convex hulls later

          points.push(lineSegmentCircleIntersect(sp, ep, clipr));

          const np = i === plen - 1 ? c.points[0] : c.points[i + 1];
          points.push(lineSegmentCircleIntersect(np, ep, clipr));
        }
      });

      c.points = points;
    });

    // store cell distances and find our cell furthest from the center
    const furthestCell = this.cells.reduce((acc, c, i) => {
      c.site.zerod = dist(0, 0, c.site.x, c.site.y);

      if (i === 0) return c;
      return acc.site.zerod > acc, c.site.zerod ? acc : c;
    }, 0);

    // reorder cells now?
    if (!globals.cells.cellReorderAfterDropOut) this.reorderCells();

    // drop out!
    this.dropOutCells(furthestCell);

    // or reorder cells now?
    if (globals.cells.cellReorderAfterDropOut) this.reorderCells();

    // run prim's algorithm
    const mst = this.computePrimMst();

    // smooth our cells with chaikin curves, then generate an optimized hull to remove balloon knots
    this.cells.forEach((c) => {
      const points = chaikin(c.points, 0.2, 4, true);
      c.points = hull(points, Infinity, [".x", ".y"]);
    });

    // space out our cells
    this.spaceOutCells(furthestCell);

    // create our mst lines
    this.mstLines = this.createMstLines(mst);

    // get our longest and shortest mst lines
    this.computeLongestShortestMstLines();

    // update our monitors
    globals.monitors.actualCellCount = this.cells.length;
    globals.monitors.actualMstLinesCount = this.mstLines.length;
  }

  // ----------------------------------------------------------------------------
  // public checkMouseCell method
  // ----------------------------------------------------------------------------

  checkMouseCell(currIndex, prop) {
    // handle over or selected cells

    let index = currIndex;

    const x = (mouseX + this.xl) / globals.canvas.scale - globals.canvas.x;
    const y = (mouseY + this.yt) / globals.canvas.scale - globals.canvas.y;
    const i = this.getVoronoiSite(x, y);

    if (i !== currIndex) {
      this.cells.forEach((c) => {
        c[prop] = c.index === i;
      });

      index = i;
    }

    return index;
  }

  // ----------------------------------------------------------------------------
  // public draw method
  // ----------------------------------------------------------------------------

  draw(_m) {
    // our millis()
    const m = _m ?? millis();

    // draw cells
    this.drawCells();

    // draw mst lines
    if (globals.debug.showMstLines) this.drawMstLines(m);
  }
}
