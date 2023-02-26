// ----------------------------------------------------------------------------
// sample strokeWeights for FancyLine
// ----------------------------------------------------------------------------

// basic
// const primStrokeWeight = () => 1.5 / params.scale;

// random
// const primStrokeWeight = () => (1 + 4 * Math.random()) / params.scale;

// time based
// const primStrokeWeight = (m) => (1 + (1 + sin(m / 10))) / params.scale;

// time and index based
// const primStrokeWeight = (m, i) =>
//   (1 + (1 + sin(m / 4 + i * 100))) / params.scale;

// ----------------------------------------------------------------------------
// sample arrowStrokes for FancyLine
// ----------------------------------------------------------------------------

// const arrowColor = [92, 92, 92];

// basic
// const primArrowStroke = arrowColor;

// t based (easing)
// const primArrowStroke = (m, i, d, t) =>
//   color([...arrowColor, E.easeOutQuint(t > 0.5 ? 1 - t : t) * 255]);

// t and distance based (easing)
// const primArrowStroke = (m, i, d, t) =>
//   color([
//     ...arrowColor,
//     E.easeOutQuint(((t > 0.5 ? 1 - t : t) * d) / 15) * 255,
//   ]);

// index based
// const startArrowColor = [128, 0, 128];
// const endArrowColor = [0, 0, 255];

// const primArrowStroke = (m, i) =>
//   lerpColor(
//     color(startArrowColor),
//     color(endArrowColor),
//     i / (params.actualCellCount || 1)
//   );

// ----------------------------------------------------------------------------
// sample arrowInterps for FancyLine
// ----------------------------------------------------------------------------

// basic
// const primArrowInterp = 1;

// time based (back and forth)
// const primArrowInterp = (m) => (1 - cos(m / 10)) / 2;

// time based (forward)
// const primArrowInterp = (m) => m / 1500;

// time and index based (forward)
// const primArrowInterp = (m, i) => (m + i * 100) / 1500;

// distance based
// const primArrowInterp = (m, i, d) => m / (100 * d);
