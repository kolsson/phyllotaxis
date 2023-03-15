// ----------------------------------------------------------------------------
// sample strokeWeights for FancyLine
// ----------------------------------------------------------------------------

// basic
// const mstLineStrokeWeight = () => 1.5 / params.scale;

// random
// const mstLineStrokeWeight = () => (1 + 4 * Math.random()) / params.scale;

// time based
// const mstLineStrokeWeight = (m) => (1 + (1 + sin(m / 10))) / params.scale;

// time and index based
// const mstLineStrokeWeight = (m, i) =>
//   (1 + (1 + sin(m / 4 + i * 100))) / params.scale;

// ----------------------------------------------------------------------------
// sample arrowStrokes for FancyLine
// ----------------------------------------------------------------------------

// const arrowColor = [92, 92, 92];

// basic
// const mstLineArrowStroke = arrowColor;

// t based (easing)
// const mstLineArrowStroke = (m, i, d, t) =>
//   color([...arrowColor, E.easeOutQuint(t > 0.5 ? 1 - t : t) * 255]);

// t and distance based (easing)
// const mstLineArrowStroke = (m, i, d, t) =>
//   color([
//     ...arrowColor,
//     E.easeOutQuint(((t > 0.5 ? 1 - t : t) * d) / 15) * 255,
//   ]);

// index based
// const startArrowColor = [128, 0, 128];
// const endArrowColor = [0, 0, 255];

// const mstLineArrowStroke = (m, i) =>
//   lerpColor(
//     color(startArrowColor),
//     color(endArrowColor),
//     i / (params.actualCellCount || 1)
//   );

// ----------------------------------------------------------------------------
// sample arrowInterps for FancyLine
// ----------------------------------------------------------------------------

// basic
// const mstLineArrowInterp = 1;

// time based (back and forth)
// const mstLineArrowInterp = (m) => (1 - cos(m / 10)) / 2;

// time based (forward)
// const mstLineArrowInterp = (m) => m / 1500;

// time and index based (forward)
// const mstLineArrowInterp = (m, i) => (m + i * 100) / 1500;

// distance based
// const mstLineArrowInterp = (m, i, d) => m / (100 * d);

// distance based staggered by index
// const mstLineArrowInterp = (m, i, d) => (m + i * 1000) / (100 * d);

// ----------------------------------------------------------------------------
// sample arrowBezierSwings for FancyLine
// ----------------------------------------------------------------------------

// animated swing
// const mstLineArrowBezierSwing = (m, i) =>
//   noise(i) * 30 * Math.sin((m + i * 1000) / 100 + 200 * noise(i));
