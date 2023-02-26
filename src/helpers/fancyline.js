import p5 from "p5";

export default class FancyLine {
  constructor({
    // start and end points
    sp,
    ep,

    // index, for if we have multiple lines we want to synchronize in some way
    index,

    stroke = undefined, // can be a function
    strokeWeight = undefined, // can be a function

    extendStart = 0,
    extendEnd = 0,

    // arrows
    arrowCount = 0, // if we have an arrowDistance we ignore this
    arrowDistance = undefined, // if undefined, we divide line distance by count
    arrowWidth = 2,
    arrowHeight = 2,
    arrowStroke = undefined, // can be a function
    arrowInterpIgnoreHeight = false,
    arrowInterp = 0,

    showLine = true,
    showArrows = false,
  }) {
    this.sp = { ...sp };
    this.ep = { ...ep };

    this.index = index;

    this.stroke = stroke;
    this.strokeWeight = strokeWeight;

    this.extendStart = extendStart;
    this.extendEnd = extendEnd;

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

    this.compute();
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

    // compute our arrows

    this.computeArrows();
  }

  computeArrows(m) {
    if (
      this.showArrows &&
      (this.arrowCount > 0 || this.arrowDistance !== undefined)
    ) {
      // our arrowAcount
      let ac = this.arrowCount;

      // get our distance and unit x and y for our line
      // if our line is a curve we will need to change this

      let d = dist(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);
      let based = d;

      let unitx = (this.fep.x - this.fsp.x) / d;
      let unity = (this.fep.y - this.fsp.y) / d;

      // get our start point for lerping
      let sx, sy;

      if (this.arrowInterpIgnoreHeight) {
        sx = this.fsp.x;
        sy = this.fsp.y;
      } else {
        // take our arrow height into account when calculating our lerpx and lerpy
        sx = this.fsp.x + unitx * this.arrowHeight;
        sy = this.fsp.y + unity * this.arrowHeight;

        // recalculate our distance and unitx, unity
        d = dist(sx, sy, this.fep.x, this.fep.y);
        based = d; // update our base d

        unitx = (this.fep.x - sx) / d;
        unity = (this.fep.y - sy) / d;
      }

      // get our end point for lerping
      let ex, ey;

      if (this.arrowDistance === undefined) {
        // we don't have to change anything if we don't have an arrowDistance
        ex = this.fep.x;
        ey = this.fep.y;
      } else {
        // extend our endpoint so we can cleanly divide it by our distance

        // divide d by arrowDistance, take the ceiling, multiple by arrowDistance
        // this is our desired length

        // arrowCount required to cover line
        ac = Math.ceil(d / this.arrowDistance);
        const adj = ac * this.arrowDistance - d;

        ex = this.fep.x + unitx * adj;
        ey = this.fep.y + unity * adj;

        // recalculate our distance and unitx, unity
        d = dist(sx, sy, ex, ey);
        // do NOT update our base d (of course)

        unitx = (ex - sx) / d;
        unity = (ey - sy) / d;

        // console.log(based / d, this.arrows.length);
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

        // our arrow end
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
  }

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
    if (this.showLine) line(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);

    // draw our arrows
    if (
      this.showArrows &&
      (this.arrowCount > 0 || this.arrowDistance !== undefined)
    ) {
      // if arrowInterp is a function, compute our arrows first
      if (typeof this.arrowInterp === "function") this.computeArrows(m);

      this.arrows.forEach((a) => {
        if (a.stroke !== undefined) stroke(a.stroke);

        line(a.end.x, a.end.y, a.left.x, a.left.y);
        line(a.end.x, a.end.y, a.right.x, a.right.y);
      });
    }
  }
}
