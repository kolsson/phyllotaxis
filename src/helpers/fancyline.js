import p5 from "p5";

// requires angleMode(DEGREES)

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
    arrowCount = 0,
    arrowWidth = 2,
    arrowHeight = 2,
    arrowStroke = undefined, // can be a function
    arrowInterpIgnoreHeight = false,
    arrowInterp = 0,

    showLine = true,
    showArrows = true,
  }) {
    this.sp = { ...sp };
    this.ep = { ...ep };

    this.index = index;

    this.stroke = stroke;
    this.strokeWeight = strokeWeight;

    this.extendStart = extendStart;
    this.extendEnd = extendEnd;

    this.arrowCount = arrowCount;
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

    this.computeArrows();
  }

  computeArrows() {
    if (this.showArrows && this.arrowCount > 0) {
      // get our distance and unit x and y for our line
      // if our line is a curve we will need to change how
      // we do this

      const d = dist(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);

      const unitx = (this.fep.x - this.fsp.x) / d;
      const unity = (this.fep.y - this.fsp.y) / d;

      // get our start point for lerping
      let sx, sy;

      if (this.arrowInterpIgnoreHeight) {
        sx = this.fsp.x;
        sy = this.fsp.y;
      } else {
        // take our arrow height into account when calculating our lerpx and lerpy

        sx = this.fsp.x + unitx * this.arrowHeight;
        sy = this.fsp.y + unity * this.arrowHeight;
      }

      // get the positions for each of our arrows
      for (let i = 0; i < this.arrowCount; i++) {
        const a = {};

        let t =
          typeof this.arrowInterp === "function"
            ? this.arrowInterp(this.index, d)
            : this.arrowInterp;

        // adjust our t based on our arrow index
        t = t + i / this.arrowCount;

        // make sure our t wraps around
        t = ((t * 1000) % 1000) / 1000;

        // our arrow end
        const lerpx = lerp(sx, this.fep.x, t);
        const lerpy = lerp(sy, this.fep.y, t);

        a.end = { x: lerpx, y: lerpy };

        // our arrow base
        const bx = lerpx + unitx * -this.arrowHeight;
        const by = lerpy + unity * -this.arrowHeight;

        // angle perpendicular to our line to get our arrow left and right
        const theta = atan2(this.fep.y - this.fsp.y, this.fep.x - this.fsp.x);

        a.left = {
          x: bx + this.arrowWidth * -sin(theta),
          y: by + this.arrowWidth * cos(theta),
        };

        a.right = {
          x: bx + this.arrowWidth * sin(theta),
          y: by + this.arrowWidth * -cos(theta),
        };

        // compute our arrow stroke
        if (this.arrowStroke !== undefined) {
          a.stroke =
            typeof this.arrowStroke === "function"
              ? this.arrowStroke(this.index, d, t)
              : this.arrowStroke;
        }

        // store our arrow
        this.arrows[i] = a;
      }
    }
  }

  draw() {
    // set our strokeWeight, if needed
    if (this.strokeWeight !== undefined) {
      const sw =
        typeof this.strokeWeight === "function"
          ? this.strokeWeight(this.index)
          : this.strokeWeight;

      strokeWeight(sw);
    }

    // set our stroke, if needed
    if (this.stroke !== undefined) {
      const s =
        typeof this.stroke === "function"
          ? this.stroke(this.index)
          : this.stroke;

      stroke(s);
    }

    // draw our line
    if (this.showLine) line(this.fsp.x, this.fsp.y, this.fep.x, this.fep.y);

    // draw our arrows
    if (this.showArrows && this.arrowCount > 0) {
      // if arrowInterp is a function, compute our arrows first
      if (typeof this.arrowInterp === "function") this.computeArrows();

      this.arrows.forEach((a) => {
        if (a.stroke !== undefined) stroke(a.stroke);

        line(a.end.x, a.end.y, a.left.x, a.left.y);
        line(a.end.x, a.end.y, a.right.x, a.right.y);
      });
    }
  }
}
