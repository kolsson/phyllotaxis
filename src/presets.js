export const presets = [
  {
    // preset 1: 168 cells
    scale: 1.35,

    cellCount: 300,
    startCell: 19,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 12,
    cellPaddingType: "exponential",
    cellPaddingAmount: 0.3,
    cellPaddingCurvePower: 1.65,
    cellPaddingCurveMult: 1,
    cellPaddingCenterPush: 7.5,

    cellSiteCircleRMult: 0.5,

    cellClipMult: 1,
    cellTrimR: 165,

    cellDropOutType: "perlin",
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1.0,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 2,
    primMstShowArrows: true,
    primMstArrowDist: 9,
    primMstArrowWidth: 2,
    primMstArrowHeight: 2,
    primMstArrowSpeed: 1,
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
    cellDropOutPerc: 0,
    cellDropOutMult: 1,
    cellDropOutMod: 5,
    cellReorderAfterDropOut: true,

    primMstBezierSwingMult: 2,
    primMstShowArrows: true,
    primMstArrowDist: 9,
    primMstArrowWidth: 2,
    primMstArrowHeight: 2,
    primMstArrowSpeed: 1,
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
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1.5,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 3,
    primMstShowArrows: true,
    primMstArrowDist: 9,
    primMstArrowWidth: 2,
    primMstArrowHeight: 2,
    primMstArrowSpeed: 1,
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
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 3.5,
    primMstShowArrows: true,
    primMstArrowDist: 9,
    primMstArrowWidth: 2,
    primMstArrowHeight: 2,
    primMstArrowSpeed: 1,
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
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 2.5,
    primMstShowArrows: true,
    primMstArrowDist: 9,
    primMstArrowWidth: 2,
    primMstArrowHeight: 2,
    primMstArrowSpeed: 1,
  },
  {
    // preset 6: 314 cells
    scale: 0.55,

    cellCount: 401,
    startCell: 3,

    cellAngle: 137,
    cellAngleFrac: 0.5,
    cellSize: 20,
    cellPaddingType: "exponential",
    cellPaddingAmount: 0.72,
    cellPaddingCurvePower: 0.95,
    cellPaddingCurveMult: 1.05,
    cellPaddingCenterPush: 0,

    cellSiteCircleRMult: 1,

    cellClipMult: 1.1,
    cellTrimR: 0,

    cellDropOutType: "mod",
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 5,
    primMstShowArrows: true,
    primMstArrowDist: 22,
    primMstArrowWidth: 3.5,
    primMstArrowHeight: 3.5,
    primMstArrowSpeed: 1.5,
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
    cellDropOutPerc: 0.4,
    cellDropOutMult: 1,
    cellDropOutMod: 10,
    cellReorderAfterDropOut: false,

    primMstBezierSwingMult: 7.5,
    primMstShowArrows: true,
    primMstArrowDist: 28,
    primMstArrowWidth: 5,
    primMstArrowHeight: 5,
    primMstArrowSpeed: 2,
  },
];
