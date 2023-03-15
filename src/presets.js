const presets = [
  {
    // preset 1: 168 cells
    scale: 1.35,

    cellCount: 300,
    startCell: 19,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 12,
    cellPaddingType: "exponential",
    cellPaddingAmount: 0.15,
    cellPaddingCurvePower: 1.65,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 7.5,

    cellSiteCircleRMult: 0.75,

    cellClipMult: 1,
    cellTrimR: 165,

    cellDropOutType: "perlin",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1.0,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: true,
    mstLineBezierSwingStart: 2,
    mstLineBezierSwingEnd: 20,
    mstLineBezierSwingSensitivity: 0.6,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },
  {
    // preset 2: 320 cells
    scale: 1.5,

    cellCount: 453,
    startCell: 19,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 12,
    cellPaddingType: "linear",
    cellPaddingAmount: 0,
    cellPaddingCurvePower: 1,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 0.5,

    cellClipMult: 1,
    cellTrimR: 40,

    cellDropOutType: "mod",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1,
    cellDropOutMod: 5,
    cellReorderAfterDropOut: true,

    mstLineIsBezierDistSwing: false,
    mstLineBezierSwingStart: 2,
    mstLineBezierSwingEnd: 2,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },
  {
    // preset 3: 400 cells
    scale: 1.2,

    cellCount: 639,
    startCell: 16,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 12,
    cellPaddingType: "linear",
    cellPaddingAmount: 0,
    cellPaddingCurvePower: 1,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 0.5,

    cellClipMult: 4,
    cellTrimR: 85,

    cellDropOutType: "perlin",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1.5,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: false,
    mstLineBezierSwingStart: 3,
    mstLineBezierSwingEnd: 3,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },
  {
    // preset 4: 200
    scale: 1.3,

    cellCount: 300,
    startCell: 3,

    cellAngle: 105,
    cellAngleFrac: 0.5,
    cellSize: 15,
    cellPaddingType: "linear",
    cellPaddingAmount: 0,
    cellPaddingCurvePower: 1,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 0.5,

    cellClipMult: 1,
    cellTrimR: 100,

    cellDropOutType: "perlin",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: false,
    mstLineBezierSwingStart: 3.5,
    mstLineBezierSwingEnd: 3.5,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },
  {
    // preset 5: 209
    scale: 1.7,

    cellCount: 300,
    startCell: 1,

    cellAngle: 105,
    cellAngleFrac: 0.5,
    cellSize: 12,
    cellPaddingType: "linear",
    cellPaddingAmount: 0,
    cellPaddingCurvePower: 1,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 0.5,

    cellClipMult: 1,
    cellTrimR: 99,

    cellDropOutType: "perlin",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: false,
    mstLineBezierSwingStart: 2.5,
    mstLineBezierSwingEnd: 2.5,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 9,
    mstLineArrowWidth: 2,
    mstLineArrowHeight: 2,
    mstLineArrowSpeed: 1,
  },
  {
    // preset 6: 250 cells
    scale: 0.55,

    cellCount: 401,
    startCell: 3,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 20,
    cellPaddingType: "exponential",
    cellPaddingAmount: 0.8,
    cellPaddingCurvePower: 0.95,
    cellPaddingCurveMult: 1.05,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 1,

    cellClipMult: 1.0,
    cellTrimR: 0,

    cellDropOutType: "distance",
    cellDropOutPercMin: 0.25,
    cellDropOutPercMax: 0.425,
    cellDropOutNoisePosMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: true,
    mstLineBezierSwingStart: 5,
    mstLineBezierSwingEnd: 20,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 22,
    mstLineArrowWidth: 3.5,
    mstLineArrowHeight: 3.5,
    mstLineArrowSpeed: 1.5,
  },
  {
    // preset 7: 178 cells
    scale: 0.55,

    cellCount: 300,
    startCell: 1,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 40,
    cellPaddingType: "linear",
    cellPaddingAmount: 0,
    cellPaddingCurvePower: 1,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 0.9,

    cellClipMult: 1.8,
    cellTrimR: 0,

    cellDropOutType: "perlin",
    cellDropOutPercMin: 0.4,
    cellDropOutPercMax: 0.4,
    cellDropOutNoisePosMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    mstLineIsBezierDistSwing: false,
    mstLineBezierSwingStart: 7.5,
    mstLineBezierSwingEnd: 7.5,
    mstLineBezierSwingSensitivity: 1,
    mstLineShowArrows: true,
    mstLineArrowDist: 28,
    mstLineArrowWidth: 5,
    mstLineArrowHeight: 5,
    mstLineArrowSpeed: 2,
  },
];

export default presets;
