import p5 from "p5";

import params from "../../params";

export default class PCell {
  constructor({ index, site = { x: 0, y: 0, zerod: 0 }, points = [] }) {
    // our index
    this.index = index;

    // our site object:
    //
    // x, y: point
    // zerod: distance from 0,0
    this.site = { ...site };

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
    if (params.showCells) {
      push();
      stroke(92);
      strokeWeight(1 / params.scale);
      fill(this.selected || this.over ? 220 : 255);

      beginShape();
      this.points.forEach((p) => vertex(p.x, p.y));
      endShape(CLOSE);
      pop();
    }

    // cell site
    const { x, y } = this.site;

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
      text(this.index, x, y - textMiddle);
      pop();
    }
  }
}
