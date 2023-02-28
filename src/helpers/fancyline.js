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

    // bezier curve swing (negative = left, positive = right)
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

    // compute our bezier control points

    if (this.type === "bezier") {
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

      this.bezierC1x = c1x + this.bezierSwing * -Math.sin(theta);
      this.bezierC1y = c1y + this.bezierSwing * Math.cos(theta);
      this.bezierC2x = c2x + this.bezierSwing * -Math.sin(theta);
      this.bezierC2y = c2y + this.bezierSwing * Math.cos(theta);
    }

    // compute our arrows

    this.computeArrows();
  }

  computeLineArrows(m) {
    let ac = this.arrowCount;

    let { x: sx, y: sy } = this.fsp;
    let { x: ex, y: ey } = this.fep;

    let d = this.lined;
    let based = d;

    let unitx = (ex - sx) / d;
    let unity = (ey - sy) / d;

    // get our start point for lerping

    if (!this.arrowInterpIgnoreHeight) {
      // take our arrow height into account when calculating our lerpx and lerpy

      sx = sx + unitx * this.arrowHeight;
      sy = sy + unity * this.arrowHeight;

      // recalculate our distance and unitx, unity
      d = dist(sx, sy, ex, ey);
      based = d; // update our base d

      unitx = (ex - sx) / d;
      unity = (ey - sy) / d;
    }

    if (this.arrowDistance !== undefined) {
      // extend our endpoint so we can cleanly divide it by our distance

      // divide d by arrowDistance, take the ceiling, multiply by arrowDistance
      // this is our desired length

      // arrowCount required to cover line
      ac = Math.ceil(d / this.arrowDistance);
      const adj = ac * this.arrowDistance - d;

      ex = ex + unitx * adj;
      ey = ey + unity * adj;

      // recalculate our distance and unitx, unity
      d = dist(sx, sy, ex, ey);
      // do NOT update our base d (of course)

      unitx = (ex - sx) / d;
      unity = (ey - sy) / d;
    }

    for (let i = 0; i < ac; i++) {
      const a = {};

      let t =
        typeof this.arrowInterp === "function"
          ? this.arrowInterp(m, this.index, d)
          : this.arrowInterp;

      // we divide line distance by count and
      // adjust our t based on our arrow index
      t = t - i / ac;

      // make sure our t wraps around
      t = ((t * 1000) % 1000) / 1000;

      // check if arrow is beyond our base d
      if (t * (d / based) > 1) {
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

      // if we've extended our d because we have an arrowDistance,
      // we will need to adjust our t based on how much we've extended our d

      if (this.arrowStroke !== undefined) {
        a.stroke =
          typeof this.arrowStroke === "function"
            ? this.arrowStroke(m, this.index, based, t * (d / based))
            : this.arrowStroke;
      }

      // store our arrow
      this.arrows[i] = a;
    }
  }

  computeBezierArrows(m) {
    // when we are a bezier we still calculate our distance as a straight line
    // the larger the curve, the more problems this may introduce
    // e.g., our distance between arrows will be closer where the curve is
    // sharper; our distance in general will not be consistent
    // WE NEED TO REWRITE OUR ARROW HANDLING CODE TO BE BEZIER SPECIFIC

    let ac = this.arrowCount;

    let { x: sx, y: sy } = this.fsp;
    let { x: ex, y: ey } = this.fep;

    let d = this.lined;
    let based = d;

    let unitx = (ex - sx) / d;
    let unity = (ey - sy) / d;

    // get our start point for lerping

    if (!this.arrowInterpIgnoreHeight) {
      // take our arrow height into account when calculating our lerpx and lerpy

      // this is not precise because we are calculating our distance as a straight line

      const et = this.arrowHeight / d;

      sx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, et);
      sy = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, et);

      // recalculate our distance and unitx, unity
      d = dist(sx, sy, ex, ey);
      based = d; // update our base d

      unitx = (ex - sx) / d;
      unity = (ey - sy) / d;
    }

    if (this.arrowDistance !== undefined) {
      // extend our endpoint so we can cleanly divide it by our distance

      // divide d by arrowDistance, take the ceiling, multiply by arrowDistance
      // this is our desired length

      // arrowCount required to cover line
      ac = Math.ceil(d / this.arrowDistance);
      const adj = ac * this.arrowDistance - d;

      // we can't really do anything here without reworking the way
      // we handle bezier distance
    }

    for (let i = 0; i < ac; i++) {
      const a = {};

      let t =
        typeof this.arrowInterp === "function"
          ? this.arrowInterp(m, this.index, d)
          : this.arrowInterp;

      // we divide line distance by count and
      // adjust our t based on our arrow index
      t = t - i / ac;

      // make sure our t wraps around
      t = ((t * 1000) % 1000) / 1000;

      // check if arrow is beyond our base d
      if (t * (d / based) > 1) {
        this.arrows[i] = undefined; // enter an empty arrow record
        continue;
      }

      // our arrow tip

      const lerpx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, t);
      const lerpy = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, t);

      a.end = { x: lerpx, y: lerpy };

      // our arrow base

      const et = t - this.arrowHeight / d;

      const bx = bezierPoint(sx, this.bezierC1x, this.bezierC2x, ex, et);
      const by = bezierPoint(sy, this.bezierC1y, this.bezierC2y, ey, et);

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

      // if we've extended our d because we have an arrowDistance,
      // we will need to adjust our t based on how much we've extended our d

      if (this.arrowStroke !== undefined) {
        a.stroke =
          typeof this.arrowStroke === "function"
            ? this.arrowStroke(m, this.index, based, t * (d / based))
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
      // if arrowInterp is a function, compute our arrows first
      if (typeof this.arrowInterp === "function") this.computeArrows(m);

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
