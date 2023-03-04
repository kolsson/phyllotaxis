// ----------------------------------------------------------------------------
// calculae centroid of polygon
// ----------------------------------------------------------------------------

export const calcCentroid = (points) => {
  const x = points.reduce((acc, p) => acc + p.x, 0) / points.length;
  const y = points.reduce((acc, p) => acc + p.y, 0) / points.length;
  return { x, y };
};
