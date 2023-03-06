// ----------------------------------------------------------------------------
// calculae centroid of polygon
// ----------------------------------------------------------------------------

export const calcCentroid = (points) => {
  const x = points.reduce((acc, p) => acc + p.x, 0) / points.length;
  const y = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  return { x, y };
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
