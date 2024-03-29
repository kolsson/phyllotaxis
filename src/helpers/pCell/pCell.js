import p5 from "p5";

import globals from "../../globals";

export default class PCell {
  constructor({
    index,
    site = { x: 0, y: 0, zerod: 0 },
    centroid,
    bounds,
    points = [],
  }) {
    // our index
    this.index = index;

    // our site object:
    //
    // x, y: point
    // zerod: distance from 0,0
    this.site = { ...site };

    // our centroid and rectangular bounds
    this.centroid = { ...centroid };
    this.bounds = { ...bounds };

    // our array of points
    this.points = [...points];

    // selected or rolled over
    this.selected = false;
    this.over = false;
  }

  // ----------------------------------------------------------------------------
  // public draw method
  // ----------------------------------------------------------------------------

  draw({ textMiddle }) {
    // cell boundaries
    if (globals.debug.showCells) {
      push();
      stroke(92);
      strokeWeight(1 / globals.canvas.scale);
      fill(this.selected || this.over ? 220 : 255);

      beginShape();
      this.points.forEach((p) => vertex(p.x, p.y));
      endShape(CLOSE);
      pop();
    }

    // cell site
    const { x, y } = this.site;

    // cell site: circle
    if (globals.debug.showCellSites) {
      push();
      strokeWeight(1 / globals.canvas.scale);
      circle(x, y, globals.cells.cellSize * globals.cells.cellSiteCircleRMult);
      pop();
    }

    // cell site: text
    if (globals.debug.showCellText) {
      push();
      strokeWeight(1 / globals.canvas.scale);
      text(this.index, x, y - textMiddle);
      pop();
    }

    // cell centroid
    if (this.centroid && globals.debug.showCellCentroids) {
      push();
      strokeWeight(1 / globals.canvas.scale);
      circle(
        this.centroid.x,
        this.centroid.y,
        globals.cells.cellSize * globals.cells.cellSiteCircleRMult
      );
      pop();
    }

    // cell rectangular bounds
    if (this.bounds && globals.debug.showCellBounds) {
      push();
      strokeWeight(1 / globals.canvas.scale);
      rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
      pop();
    }
  }
}
