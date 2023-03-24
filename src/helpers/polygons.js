// ----------------------------------------------------------------------------
// calculate centroid of polygon
// ----------------------------------------------------------------------------

export const calcCentroid = (points) => {
  const x = points.reduce((acc, p) => acc + p.x, 0) / points.length;
  const y = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  return { x, y };
};

// ----------------------------------------------------------------------------
// calculate rectangular bounds of polygon
// ----------------------------------------------------------------------------

export const calcRectBounds = (points) => {
  const x = points.reduce(
    (acc, p) => Math.min(acc, p.x),
    Number.MAX_SAFE_INTEGER
  );
  const y = points.reduce(
    (acc, p) => Math.min(acc, p.y),
    Number.MAX_SAFE_INTEGER
  );

  const maxX = points.reduce(
    (acc, p) => Math.max(acc, p.x),
    Number.MIN_SAFE_INTEGER
  );
  const maxY = points.reduce(
    (acc, p) => Math.max(acc, p.y),
    Number.MIN_SAFE_INTEGER
  );

  return { x, y, width: maxX - x, height: maxY - y };
};

// ----------------------------------------------------------------------------
// remove close vertices
// ----------------------------------------------------------------------------

export const removeCloseVertices = (points, d) => {
  return points.filter(
    (p, i, arr) =>
      // check if this point close to the previous point
      i === 0 || dist(p.x, p.y, arr[i - 1].x, arr[i - 1].y) >= d
  );
};
