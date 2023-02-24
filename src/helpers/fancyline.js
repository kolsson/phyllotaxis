import p5 from "p5";

// requires angleMode(DEGREES)

export default class FancyLine {
  constructor({
    // start and end points
    sp,
    ep,

    // index if we have multiple lines we want to synchronize in some way
    index,

    // in case we want to set our line stroke on a per-line basis
    // can be a function
    lineStroke = undefined,

    extendStart = 0,
    extendEnd = 0,

    arrow = false,
    arrowWidth = 2.5,
    arrowHeight = 2.5,
    arrowInterp = 0,
  }) {
    this.sp = { ...sp };
    this.ep = { ...ep };

    this.index = index;

    this.lineStroke = lineStroke;

    this.extendStart = extendStart;
    this.extendEnd = extendEnd;

    this.arrow = arrow;
    this.arrowWidth = arrowWidth;
    this.arrowHeight = arrowHeight;
    this.arrowInterp = arrowInterp;
    this.arrowInterpIgnoreHeight = false;

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

    this.computeArrow();
  }

  computeArrow() {
    if (this.arrow) {
      // where do we put the arrowhead on the line?
      const d = dist(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);
      const unitx = (this.fep.x - this.fsp.x) / d;
      const unity = (this.fep.y - this.fsp.y) / d;

      const t =
        typeof this.arrowInterp === "function"
          ? this.arrowInterp(this.index, d)
          : this.arrowInterp;

      let sx, sy;

      if (this.arrowInterpIgnoreHeight) {
        sx = this.fsp.x;
        sy = this.fsp.y;
      } else {
        // take our arrow height into account when calculating our lerpx and lerpy

        sx = this.fsp.x + unitx * this.arrowHeight;
        sy = this.fsp.y + unity * this.arrowHeight;
      }

      // our arrow end

      const lerpx = lerp(sx, this.fep.x, t);
      const lerpy = lerp(sy, this.fep.y, t);

      this.arrowEnd = { x: lerpx, y: lerpy };

      // our arrow base

      const bx = lerpx + unitx * -this.arrowHeight;
      const by = lerpy + unity * -this.arrowHeight;

      // angle perpendicular to our line to get our arrow left and right

      const a = atan2(this.fep.y - this.fsp.y, this.fep.x - this.fsp.x);

      this.arrowLeft = {
        x: bx + this.arrowWidth * -sin(a),
        y: by + this.arrowWidth * cos(a),
      };

      this.arrowRight = {
        x: bx + this.arrowWidth * sin(a),
        y: by + this.arrowWidth * -cos(a),
      };
    } else {
      this.arrowEnd = { ...this.fep };
      this.arrowLeft = { ...this.fep };
      this.arrowRight = { ...this.fep };
    }
  }

  draw() {
    // set our stroke, if needed
    if (this.lineStroke !== undefined) {
      const sw =
        typeof this.lineStroke === "function"
          ? this.lineStroke(this.index)
          : this.lineStroke;

      strokeWeight(sw);
    }

    // draw our line
    line(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);

    // draw our arrow
    if (this.arrow) {
      // if our arrowInterp is a function, compute our arrow first
      if (typeof this.arrowInterp === "function") this.computeArrow();

      line(
        this.arrowEnd.x,
        this.arrowEnd.y,
        this.arrowLeft.x,
        this.arrowLeft.y
      );
      line(
        this.arrowEnd.x,
        this.arrowEnd.y,
        this.arrowRight.x,
        this.arrowRight.y
      );
    }
  }
}
