import p5 from "p5";

export default class FancyLine {
  constructor({
    // type can be "line" (default) or "bezier"
    type = "line",

    // start and end points
    sp,
    ep,

    // index, for if we have multiple lines we want to synchronize in some way
    index,

    stroke = undefined, // can be a function
    strokeWeight = undefined, // can be a function

    // extend our start and end points by a distance
    extendStart = 0,
    extendEnd = 0,

    // bezier curve swing (negative = left, positive = right; can be a function)
    bezierSwing = -2,

    // multiply our length by our bezierdivision and add to our start point;
    // subtract from our end point to get our control point positions on our line
    bezierDivision = 0.33,

    // arrows
    arrowCount = 0, // if we have an arrowDistance we ignore this
    arrowDistance = undefined, // if undefined, we divide our line distance by arrowCount
    arrowWidth = 2,
    arrowHeight = 2,
    arrowStroke = undefined, // can be a function
    arrowInterpIgnoreHeight = false,
    arrowInterp = 0,

    // visibility of our elements
    showLine = true,
    showArrows = false,
  }) {
    this.type = type;

    this.sp = { ...sp };
    this.ep = { ...ep };

    this.index = index;

    this.stroke = stroke;
    this.strokeWeight = strokeWeight;

    this.extendStart = extendStart;
    this.extendEnd = extendEnd;

    this.bezierSwing = bezierSwing;
    this.bezierDivision = bezierDivision;

    this.arrowCount = arrowCount;
    this.arrowDistance = arrowDistance;
    this.arrowWidth = arrowWidth;
    this.arrowHeight = arrowHeight;
    this.arrowStroke = arrowStroke;
    this.arrowInterpIgnoreHeight = arrowInterpIgnoreHeight;
    this.arrowInterp = arrowInterp;

    this.showLine = showLine;
    this.showArrows = showArrows;

    // arrow storage
    this.arrows = new Array(arrowCount);

    // off we go
    this.compute();
  }

  // setters and getters

  setArrowDistance(ad) {
    // reset our arrows array
    this.arrows = new Array(this.arrowCount);

    this.arrowDistance = ad;
  }

  // ----------------------------------------------------------------------------
  // private compute methods
  // ----------------------------------------------------------------------------

  computeBezierDistances(sx, sy, ex, ey, n = 20) {
    // numLengths is an arbitrary magic number; 20 should be precise enough for
    // most cases but 100 is better for detailed curves

    if (sx === undefined) sx = this.fsp.x;
    if (sy === undefined) sy = this.fsp.y;

    if (ex === undefined) ex = this.fep.x;
    if (ey === undefined) ey = this.fep.y;

    // chop our bezier curve up into pieces, add the distance of all the pieces

    const lengths = new Array(n);
    lengths[0] = 0;
    let d = 0;

    for (let i = 1; i < n; i++) {
      const cst = (i - 1) / n;
      const cet = i / n;

      const csx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, cst);
      const csy = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, cst);

      const cex = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, cet);
      const cey = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, cet);

      d += dist(csx, csy, cex, cey);
      lengths[i] = d;
    }

    return [d, lengths];
  }

  alp(t) {
    // arc length parameterization
    // https://gamedev.stackexchange.com/questions/5373/moving-ships-between-two-planets-along-a-bezier-missing-some-equations-for-acce/5427#5427

    const n = this.bezierLengths.length - 1; // important to subtract 1
    const targetLength = t * this.bezierd;

    let low = 0,
      high = n,
      index = 0;

    while (low < high) {
      index = low + (((high - low) / 2) | 0);

      if (this.bezierLengths[index] < targetLength) low = index + 1;
      else high = index;
    }

    if (this.bezierLengths[index] > targetLength) index--;

    const lengthBefore = this.bezierLengths[index];
    if (lengthBefore === targetLength) {
      return index / n;
    } else {
      return (
        (index +
          (targetLength - lengthBefore) /
            (this.bezierLengths[index + 1] - lengthBefore)) /
        n
      );
    }
  }

  compute() {
    // apply extendStart and extendEnd

    this.fsp = { ...this.sp };

    if (this.extendStart) {
      const d = dist(this.sp.x, this.sp.y, this.ep.x, this.ep.y);
      this.fsp.x =
        this.sp.x + ((this.ep.x - this.fsp.x) / d) * -this.extendStart;
      this.fsp.y =
        this.sp.y + ((this.ep.y - this.fsp.y) / d) * -this.extendStart;
    }

    this.fep = { ...this.ep };

    if (this.extendEnd) {
      const d = dist(this.fsp.x, this.fsp.y, this.ep.x, this.ep.y);
      this.fep.x = this.ep.x + ((this.ep.x - this.fsp.x) / d) * this.extendEnd;
      this.fep.y = this.ep.y + ((this.ep.y - this.fsp.y) / d) * this.extendEnd;
    }

    // store our line distance for later
    const { x: sx, y: sy } = this.fsp;
    const { x: ex, y: ey } = this.fep;

    this.lined = dist(sx, sy, ex, ey);

    // compute our bezier control points and distances
    if (this.type === "bezier") this.computeBezier(0);

    // compute our arrows
    this.computeArrows();
  }

  computeBezier(m) {
    const { x: sx, y: sy } = this.fsp;
    const { x: ex, y: ey } = this.fep;

    // get our midpoint
    const unitx = (ex - sx) / this.lined;
    const unity = (ey - sy) / this.lined;

    const bdd = this.lined * this.bezierDivision;

    const c1x = sx + unitx * bdd;
    const c1y = sy + unity * bdd;

    const c2x = ex - unitx * bdd;
    const c2y = ey - unity * bdd;

    // angle perpendicular to our line
    const theta = Math.atan2(ey - sy, ex - sx);

    let bs =
      typeof this.bezierSwing === "function"
        ? this.bezierSwing(m, this.index)
        : this.bezierSwing;

    this.bezierC1x = c1x + bs * -Math.sin(theta);
    this.bezierC1y = c1y + bs * Math.cos(theta);
    this.bezierC2x = c2x + bs * -Math.sin(theta);
    this.bezierC2y = c2y + bs * Math.cos(theta);

    // set our bezier distances
    [this.bezierd, this.bezierLengths] = this.computeBezierDistances();

    // clear our arrows
    this.arrows.fill(undefined);
  }

  computeLineArrows(m) {
    let ac = this.arrowCount;

    let { x: sx, y: sy } = this.fsp;
    let { x: ex, y: ey } = this.fep;

    const d = this.lined;
    let actuald = d;

    // our units (for drawing the arrow)

    const unitx = (ex - sx) / d;
    const unity = (ey - sy) / d;

    // our t values we want to map onto based on how we adjust our starting
    // and ending points on the curve

    let st = 0;
    let et = 1;

    // adjust our start / end t values

    if (!this.arrowInterpIgnoreHeight) {
      // take our arrow height into account when calculating our lerpx and lerpy

      st = this.arrowHeight / d;
      actuald -= this.arrowHeight;
    }

    if (this.arrowDistance !== undefined) {
      // extend our endpoint so we can cleanly divide it by our arrow distance

      // divide d by arrowDistance, take the ceiling, multiply by arrowDistance
      // this is our desired length

      // arrowCount required to cover line
      ac = Math.ceil(d / this.arrowDistance);
      const adj = ac * this.arrowDistance - d;
      et = 1 + adj / d;

      actuald += adj;
    }

    for (let i = 0; i < ac; i++) {
      const a = {};

      let t =
        typeof this.arrowInterp === "function"
          ? this.arrowInterp(m, this.index, actuald)
          : this.arrowInterp;

      // we divide line distance by count and
      // adjust our t based on our arrow index
      t = t - i / ac;

      // make sure our t wraps around
      t = ((t * 1000) % 1000) / 1000;

      // map our t onto st, et
      t = map(t, 0, 1, st, et);

      // check if arrow is beyond the end of our line
      if (t > 1) {
        this.arrows[i] = undefined; // enter an empty arrow record
        continue;
      }

      // our arrow tip

      const lerpx = lerp(sx, ex, t);
      const lerpy = lerp(sy, ey, t);

      a.end = { x: lerpx, y: lerpy };

      // our arrow base

      const bx = lerpx + unitx * -this.arrowHeight;
      const by = lerpy + unity * -this.arrowHeight;

      // angle perpendicular to our line to get our arrow left and right
      const theta = Math.atan2(ey - sy, ex - sx);

      a.left = {
        x: bx + this.arrowWidth * -Math.sin(theta),
        y: by + this.arrowWidth * Math.cos(theta),
      };

      a.right = {
        x: bx + this.arrowWidth * Math.sin(theta),
        y: by + this.arrowWidth * -Math.cos(theta),
      };

      // compute our arrow stroke
      // we map so if we've adjusted our start point (so the arrowhead doesn't
      // appear off the line) we can still fade in correctly

      if (this.arrowStroke !== undefined) {
        a.stroke =
          typeof this.arrowStroke === "function"
            ? this.arrowStroke(m, this.index, actuald, map(t, st, 1, 0, 1))
            : this.arrowStroke;
      }

      // store our arrow
      this.arrows[i] = a;
    }
  }

  computeBezierArrows(m) {
    let ac = this.arrowCount;

    let { x: sx, y: sy } = this.fsp;
    let { x: ex, y: ey } = this.fep;

    const d = this.bezierd;
    let actuald = d;

    // our t values we want to map onto based on how we adjust our starting
    // and ending points on the curve

    let st = 0;
    let et = 1;

    // adjust our start / end t values

    if (!this.arrowInterpIgnoreHeight) {
      // take our arrow height into account when calculating our lerpx and lerpy

      st = this.arrowHeight / d;
      actuald -= this.arrowHeight;
    }

    if (this.arrowDistance !== undefined) {
      // extend our endpoint so we can cleanly divide it by our arrow distance

      // divide d by arrowDistance, take the ceiling, multiply by arrowDistance
      // this is our desired length

      // arrowCount required to cover line
      ac = Math.ceil(d / this.arrowDistance);
      const adj = ac * this.arrowDistance - d;
      et = 1 + adj / d;

      actuald += adj;
    }

    for (let i = 0; i < ac; i++) {
      const a = {};

      let t =
        typeof this.arrowInterp === "function"
          ? this.arrowInterp(m, this.index, actuald)
          : this.arrowInterp;

      // we divide line distance by count and
      // adjust our t based on our arrow index
      t = t - i / ac;

      // make sure our t wraps around
      t = ((t * 1000) % 1000) / 1000;

      // apply arc length parameterization
      t = this.alp(t);

      // map our t onto st, et
      t = map(t, 0, 1, st, et);

      // check if arrow is beyond the end of our bezier
      if (t > 1) {
        this.arrows[i] = undefined; // enter an empty arrow record
        continue;
      }

      // our arrow tip

      const lerpx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, t);
      const lerpy = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, t);

      a.end = { x: lerpx, y: lerpy };

      // our arrow base

      const bt = t - this.arrowHeight / d;

      const bx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, bt);
      const by = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, bt);

      // angle perpendicular to our line to get our arrow left and right

      const tx = bezierTangent(sx, this.bezierC1x, this.bezierC2x, ex, t);
      const ty = bezierTangent(sy, this.bezierC1y, this.bezierC2y, ey, t);

      const theta = Math.atan2(ty, tx);

      a.left = {
        x: bx + this.arrowWidth * -Math.sin(theta),
        y: by + this.arrowWidth * Math.cos(theta),
      };

      a.right = {
        x: bx + this.arrowWidth * Math.sin(theta),
        y: by + this.arrowWidth * -Math.cos(theta),
      };

      // compute our arrow stroke
      // we map so if we've adjusted our start point (so the arrowhead doesn't
      // appear off the line) we can still fade in correctly

      if (this.arrowStroke !== undefined) {
        a.stroke =
          typeof this.arrowStroke === "function"
            ? this.arrowStroke(m, this.index, actuald, map(t, st, 1, 0, 1))
            : this.arrowStroke;
      }

      // store our arrow
      this.arrows[i] = a;
    }
  }

  computeArrows(m) {
    if (
      this.showArrows &&
      (this.arrowCount > 0 || this.arrowDistance !== undefined)
    ) {
      if (this.type === "line") this.computeLineArrows(m);
      else if (this.type === "bezier") this.computeBezierArrows(m);
    }
  }

  // ----------------------------------------------------------------------------
  // public draw method
  // ----------------------------------------------------------------------------

  draw() {
    // store our millis() for later
    const m = millis();

    // set our strokeWeight, if needed
    if (this.strokeWeight !== undefined) {
      const sw =
        typeof this.strokeWeight === "function"
          ? this.strokeWeight(m, this.index)
          : this.strokeWeight;

      strokeWeight(sw);
    }

    // set our stroke, if needed
    if (this.stroke !== undefined) {
      const s =
        typeof this.stroke === "function"
          ? this.stroke(m, this.index)
          : this.stroke;

      stroke(s);
    }

    // draw our line
    if (this.showLine) {
      if (this.type === "line") {
        line(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);
      } else if (this.type === "bezier") {
        if (typeof this.bezierSwing === "function") this.computeBezier(m);
        bezier(
          this.fsp.x,
          this.fsp.y,
          this.bezierC1x,
          this.bezierC1y,
          this.bezierC2x,
          this.bezierC2y,
          this.fep.x,
          this.fep.y
        );
      }
    }

    // draw our arrows
    if (
      this.showArrows &&
      (this.arrowCount > 0 || this.arrowDistance !== undefined)
    ) {
      // if type is bezier and bezierSwing is a function OR arrowInterp is a function,
      // compute our arrows first
      if (
        (this.type === "bezier" && typeof this.bezierSwing === "function") ||
        typeof this.arrowInterp === "function"
      )
        this.computeArrows(m);

      this.arrows.forEach((a) => {
        if (a) {
          if (a.stroke !== undefined) stroke(a.stroke);

          line(a.end.x, a.end.y, a.left.x, a.left.y);
          line(a.end.x, a.end.y, a.right.x, a.right.y);
        }
      });
    }
  }
}
