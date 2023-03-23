// ----------------------------------------------------------------------------
// global variables
// ----------------------------------------------------------------------------

const globals = {
  monitors: {
    actualCellCount: 300,
    actualMstLinesCount: 300,
  },

  canvas: {
    scale: 1,
    x: 0,
    y: 0,
    scaleToFit: 1, // scale at which all elements fit on screen
  },

  cells: {
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
  },

  mstLines: {
    mstLineIsBezierDistSwing: true,
    mstLineBezierSwingStart: 2,
    mstLineBezierSwingEnd: 2,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },

  debug: {
    showCells: true,
    showMstLines: true,
    highlightMstLineIndex: -1,
    showCellSites: false,
    showCellText: false,
    textSize: 10,
  },
};

export default globals;
