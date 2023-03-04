// reference: https://sighack.com/post/chaikin-curves

function chaikinCut(a, b, ratio) {
  /*
   * If ratio is greater than 0.5 flip it so we avoid cutting across
   * the midpoint of the line.
   */
  if (ratio > 0.5) ratio = 1 - ratio;

  /* Find point at a given ratio going from A to B */
  const x1 = lerp(a.x, b.x, ratio);
  const y1 = lerp(a.y, b.y, ratio);
  const p1 = { x: x1, y: y1 };

  /* Find point at a given ratio going from B to A */
  const x2 = lerp(b.x, a.x, ratio);
  const y2 = lerp(b.y, a.y, ratio);
  const p2 = { x: x2, y: y2 };

  return [p1, p2];
}

export default function chaikin(points, ratio, iterations, close) {
  // If the number of iterations is zero, return shape as is
  if (iterations == 0) return points;

  const out = [];

  /*
   * Step 1: Figure out how many corners the shape has
   *         depending on whether it's open or closed.
   */
  const numPoints = !close ? points.length - 1 : points.length;

  /*
   * Step 2: Do a pairwise iteration over vertices.
   */
  for (let i = 0; i < numPoints; i++) {
    // Get the i'th and (i+1)'th vertex to work on that edge.
    const a = points[i];
    const b = points[(i + 1) % points.length];

    // Step 3: Cut it using our chaikinCut() function
    const [n0, n1] = chaikinCut(a, b, ratio);

    /*
     * Now we have to deal with one corner case. In the case
     * of open shapes, the first and last endpoints shouldn't
     * be moved. However, in the case of closed shapes, we
     * cut all edges on both ends.
     */
    if (!close && i == 0) {
      // For the first point of open shapes, ignore vertex A
      out.push({ x: a.x, y: a.y });
      out.push({ x: n1.x, y: n1.y });
    } else if (!close && i == num_corners - 1) {
      // For the last point of open shapes, ignore vertex B
      out.push({ x: n0.x, y: n0.y });
      out.push({ x: b.x, y: b.y });
    } else {
      // For all other cases (i.e. interior edges of open
      // shapes or edges of closed shapes), add both vertices
      // returned by our chaikin_break() method
      out.push({ x: n0.x, y: n0.y });
      out.push({ x: n1.x, y: n1.y });
    }
  }

  return chaikin(out, ratio, iterations - 1, close);
}
