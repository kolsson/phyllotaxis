// ----------------------------------------------------------------------------
// define parameters
// ----------------------------------------------------------------------------

const params = {
  // monitors
  actualCellCount: 300,
  actualPrimLinesCount: 300,

  // ui
  scale: 1,
  canvasX: 0,
  canvasY: 0,

  // core params
  cellCount: 300,
  startCell: 1,

  cellAngle: 137,
  cellAngleFrac: 0.5,
  cellSize: 24,
  cellPaddingType: "linear", // linear, exponential
  cellPaddingAmount: 0,
  cellPaddingCurvePower: 1,
  cellPaddingCurveMult: 1,
  cellPaddingCenterPush: 0,

  cellSiteCircleRMult: 0.5,

  cellClipMult: 1,
  cellTrimR: 0,

  cellDropOutType: "none", // none, perlin, distance, mod
  cellDropOutPercMin: 0.4,
  cellDropOutPercMax: 0.4,
  cellDropOutNoisePosMult: 1,
  cellDropOutMod: 10,
  cellReorderAfterDropOut: true,

  mstLineIsBezierDistSwing: true,
  mstLineBezierSwingStart: 2,
  mstLineBezierSwingEnd: 2,
  mstLineBezierSwingSensitivity: 1,
  mstLineShowArrows: true,
  mstLineArrowDist: 9,
  mstLineArrowWidth: 2,
  mstLineArrowHeight: 2,
  mstLineArrowSpeed: 1,

  // debugging
  showCells: true,
  showPrimLines: true,
  highlightMstLineIndex: -1,
  showCellSites: false,
  showCellText: false,
  textSize: 10,
};

export default params;
