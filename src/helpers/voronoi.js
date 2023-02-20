import { raycast } from "./intersect";

// ----------------------------------------------------------------------------
// given a cell / cells find the furthest distance from a given point
// ----------------------------------------------------------------------------

const furthestDistOfCell = (vc, x, y) =>
  vc.points.reduce((prev, curr) => max(prev, dist(x, y, curr.x, curr.y)), 0);

const furthestDistOfCells = (vcs, x, y) =>
  vcs.reduce((prev, vc) => max(prev, furthestDistOfCell(vc, x, y)), 0);

// ----------------------------------------------------------------------------
// get voronoi site given x and y coordinates
// ----------------------------------------------------------------------------

const voronoiGetSite = (vc, x, y) => {
  for (let i = 0; i < vc.length; i++) {
    if (raycast(x, y, vc[i].points)) return i;
  }

  return -1;
};

export { furthestDistOfCell, furthestDistOfCells, voronoiGetSite };
