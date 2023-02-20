// ----------------------------------------------------------------------------
// find the intersection between a line segment and a circle
// return the intersection closest to the starting point
// input order matters!
// https://stackoverflow.com/questions/23016676/line-segment-and-circle-intersection
// ----------------------------------------------------------------------------

const lineSegmentCircleIntersect = (sp, ep, r, cx = 0, cy = 0) => {
  const dx = ep.x - sp.x;
  const dy = ep.y - sp.y;

  const A = dx * dx + dy * dy;
  const B = 2 * (dx * (sp.x - cx) + dy * (sp.y - cy));
  const C = (sp.x - cx) * (sp.x - cx) + (sp.y - cy) * (sp.y - cy) - r * r;
  const det = B * B - 4 * A * C;

  const t1 = (-B + sqrt(det)) / (2 * A);
  const t2 = (-B - sqrt(det)) / (2 * A);
  const i1 = {
    x: sp.x + t1 * dx,
    y: sp.y + t1 * dy,
  };
  const i2 = {
    x: sp.x + t2 * dx,
    y: sp.y + t2 * dy,
  };

  // use intersection closest to start of line
  return dist(sp.x, sp.y, i1.x, i1.y) < dist(sp.x, sp.y, i2.x, i2.y) ? i1 : i2;
};

// ----------------------------------------------------------------------------
// test if a point is inside a polygon (cell)
// ----------------------------------------------------------------------------

const raycast = (x, y, vs) => {
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const { x: xi, y: yi } = vs[i];
    const { x: xj, y: yj } = vs[j];

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

export { lineSegmentCircleIntersect, raycast };
