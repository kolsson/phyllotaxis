import { Pane } from "tweakpane";

import { flattenObject, mergeCategoryKeyValues } from "./objects";
import { startCanvasAnim } from "./canvasAnimation";

import globals from "../globals";
import presets from "../presets";

// properties that need to be recomputed when updated
const computeKeys = {
  cellCount: true,
  startCell: true,
  cellAngle: true,
  cellAngleFrac: true,
  cellSize: true,
  cellPaddingType: true,
  cellPaddingAmount: true,
  cellPaddingCurvePower: true,
  cellPaddingCurveMult: true,
  cellPaddingCenterPush: true,
  cellSiteCircleRMult: true,
  cellClipMult: true,
  cellTrimR: true,
  cellDropOutType: true,
  cellDropOutPercMin: true,
  cellDropOutPercMax: true,
  cellDropOutNoisePosMult: true,
  cellDropOutMod: true,
  cellReorderAfterDropOut: true,
  mstLineIsBezierDistSwing: true,
};

export default function tp(
  cc, // cellController
  computeCallback,
  redrawCallback,
  didLoadPresetCallback
) {
  const pane = new Pane();
  let areUpdatesPaused = false;

  const presetOptions = presets.map((p, i) => ({
    text: `Preset ${i + 1}`,
    value: i,
  }));

  // presets and export
  const presetsList = pane.addBlade({
    view: "list",
    label: "presets",
    options: presetOptions,
    value: 0,
  });

  presetsList.on("change", (e) => {
    areUpdatesPaused = true;
    const preset = presets[e.value];
    pane.importPreset(flattenObject(preset));
    areUpdatesPaused = false;

    // manually inject all our preset properties; some may not have tweakpane inputs
    mergeCategoryKeyValues(globals, preset);

    didLoadPresetCallback(false);
  });

  const exportButton = pane.addButton({
    title: "copy + console.log()",
    label: "current",
  });

  exportButton.on("click", async () => {
    const p = JSON.stringify(pane.exportPreset());
    console.log(p);
    await navigator.clipboard.writeText(p);
  });

  pane.addSeparator();

  // ui
  const resetCanvasButton = pane.addButton({
    title: "reset",
    label: "canvas",
  });

  resetCanvasButton.on("click", () => {
    cc.resetCellPosProps();

    startCanvasAnim({
      startFromCurrScalePos: true,
      endScale: globals.canvas.scaleToFit,
      endCanvasX: 0,
      endCanvasY: 0,
    });
  });

  pane.addSeparator();

  // monitors + canvas
  pane.addMonitor(globals.canvas, "scale", {});
  pane.addMonitor(globals.canvas, "x", {});
  pane.addMonitor(globals.canvas, "y", {});
  const actualCellCountMonitor = pane.addMonitor(
    globals.monitors,
    "actualCellCount",
    {}
  );

  // core globals
  const cellsF = pane.addFolder({ title: "Cells", expanded: false });
  cellsF.addInput(globals.cells, "cellCount", {
    label: "count",
    min: 50,
    max: 1000,
    step: 1,
  });
  cellsF.addInput(globals.cells, "startCell", {
    label: "start",
    min: 0,
    max: 50,
    step: 1,
  });
  cellsF.addInput(globals.cells, "cellAngle", {
    label: "angle",
    min: 100,
    max: 179,
    step: 1,
  });
  cellsF.addInput(globals.cells, "cellAngleFrac", {
    label: "angleFrac",
    min: 0,
    max: 1,
    step: 0.1,
  });
  cellsF.addInput(globals.cells, "cellSize", {
    label: "size",
    min: 6,
    max: 40,
    step: 1,
  });

  const cellPaddingF = pane.addFolder({
    title: "Cell Padding",
    expanded: false,
  });
  cellPaddingF.addInput(globals.cells, "cellPaddingType", {
    label: "type",
    options: {
      linear: "linear",
      exponential: "exponential",
    },
  });
  cellPaddingF.addInput(globals.cells, "cellPaddingAmount", {
    label: "amount",
    min: 0,
    max: 2,
    step: 0.01,
  });
  cellPaddingF.addInput(globals.cells, "cellPaddingCurvePower", {
    label: "curvePower",
    min: 0.05,
    max: 5,
    step: 0.05,
  });
  cellPaddingF.addInput(globals.cells, "cellPaddingCurveMult", {
    label: "curveMult",
    min: 0.05,
    max: 5,
    step: 0.05,
  });
  cellPaddingF.addInput(globals.cells, "cellPaddingCenterPush", {
    label: "centerPush",
    min: 0,
    max: 100,
    step: 0.5,
  });

  const sitesF = pane.addFolder({ title: "Cell Sites", expanded: false });
  sitesF.addInput(globals.cells, "cellSiteCircleRMult", {
    label: "siteCircleRMult",
    min: 0,
    max: 2,
    step: 0.05,
  });

  const clipF = pane.addFolder({ title: "Cell Clipping", expanded: false });
  clipF.addInput(globals.cells, "cellClipMult", {
    label: "clipMult",
    min: 0.5,
    max: 4,
    step: 0.1,
  });
  clipF.addInput(globals.cells, "cellTrimR", {
    label: "trimR",
    min: 0,
    max: 200,
    step: 1,
  });

  const dropOutF = pane.addFolder({ title: "Cell Drop Out", expanded: false });

  dropOutF.addInput(globals.cells, "cellDropOutType", {
    label: "type",
    options: {
      none: "none",
      perlin: "perlin",
      distance: "distance",
      mod: "mod",
    },
  });
  dropOutF.addInput(globals.cells, "cellDropOutPercMin", {
    label: "percMin",
    min: 0,
    max: 0.75,
    step: 0.025,
  });
  dropOutF.addInput(globals.cells, "cellDropOutPercMax", {
    label: "percMax",
    min: 0,
    max: 0.75,
    step: 0.025,
  });
  dropOutF.addInput(globals.cells, "cellDropOutNoisePosMult", {
    label: "noisePosMult",
    min: 0.05,
    max: 5,
    step: 0.05,
  });
  dropOutF.addInput(globals.cells, "cellDropOutMod", {
    label: "mod",
    min: 1,
    max: 50,
    step: 1,
  });
  dropOutF.addInput(globals.cells, "cellReorderAfterDropOut", {
    label: "reorderAfter",
  });

  const mstLinesF = pane.addFolder({ title: "MST Lines", expanded: false });
  const mstLinesFTabs = mstLinesF.addTab({
    pages: [{ title: "Bezier" }, { title: "Arrows" }],
  });

  mstLinesFTabs.pages[0].addInput(
    globals.mstLines,
    "mstLineIsBezierDistSwing",
    {
      label: "isDistSwing",
    }
  );
  mstLinesFTabs.pages[0].addInput(globals.mstLines, "mstLineBezierSwingStart", {
    label: "swingStart",
    min: 0,
    max: 40,
    step: 0.25,
  });
  mstLinesFTabs.pages[0].addInput(globals.mstLines, "mstLineBezierSwingEnd", {
    label: "swingEnd",
    min: 0,
    max: 40,
    step: 0.25,
  });
  mstLinesFTabs.pages[0].addInput(
    globals.mstLines,
    "mstLineBezierSwingSensitivity",
    {
      label: "swingSensitivity",
      min: 0,
      max: 2,
      step: 0.01,
    }
  );

  mstLinesFTabs.pages[1].addInput(globals.mstLines, "mstLineShowArrows", {
    label: "show",
  });
  mstLinesFTabs.pages[1].addInput(globals.mstLines, "mstLineArrowDist", {
    label: "dist",
    min: 5,
    max: 100,
    step: 1,
  });
  mstLinesFTabs.pages[1].addInput(globals.mstLines, "mstLineArrowWidth", {
    label: "width",
    min: 1,
    max: 20,
    step: 0.5,
  });
  mstLinesFTabs.pages[1].addInput(globals.mstLines, "mstLineArrowHeight", {
    label: "height",
    min: 1,
    max: 20,
    step: 0.5,
  });
  mstLinesFTabs.pages[1].addInput(globals.mstLines, "mstLineArrowSpeed", {
    label: "speed",
    min: 0.2,
    max: 4,
    step: 0.05,
  });

  const debugF = pane.addFolder({ title: "Debug", expanded: true });
  debugF.addInput(globals.debug, "showCells", { label: "Show Cells" });
  debugF.addInput(globals.debug, "showCellSites", { label: "Show Sites" });
  debugF.addInput(globals.debug, "showCellCentroids", {
    label: "Show Centroids",
  });
  debugF.addInput(globals.debug, "showCellBounds", {
    label: "Show Bounds",
  });
  debugF.addSeparator();
  debugF.addInput(globals.debug, "showMstLines", { label: "Show MST Lines" });
  const highlightMstLineIndexInput = debugF.addInput(
    globals.debug,
    "highlightMstLineIndex",
    {
      label: "Red MST Line",
      min: -1,
      max: 400, // will be set when monitors.actualCellCountMonitor updates
      step: 1,
    }
  );
  debugF.addSeparator();
  debugF.addInput(globals.debug, "showCellText", { label: "Show Cell Text" });
  debugF.addInput(globals.debug, "textSize", {
    label: "Text Size",
    min: 8,
    max: 14,
    step: 0.25,
  });

  // updates
  pane.on("change", (e) => {
    if (!areUpdatesPaused) {
      if (computeKeys[e.presetKey]) computeCallback();
      redrawCallback();
    }
  });

  // montor updates
  let highlightMstLineIndexInputMax = 0;

  actualCellCountMonitor.on("update", (e) => {
    // unsafe: https://github.com/cocopon/tweakpane/issues/360
    const max = e.value - 1;

    if (highlightMstLineIndexInputMax !== max) {
      const stc = highlightMstLineIndexInput.controller_.valueController;
      const sc = stc.sliderController;
      sc.props.set("maxValue", max);

      // Tweakpane limits the input range, but not the value itself
      // it has to be updated manually
      if (globals.debug.highlightMstLineIndex > max) {
        globals.debug.highlightMstLineIndex = max;
        pane.refresh();
      }

      highlightMstLineIndexInputMax = max;
    }
  });

  // populate with initial preset
  areUpdatesPaused = true;
  const preset = presets[0];
  pane.importPreset(flattenObject(preset));
  areUpdatesPaused = false;

  // manually inject all our preset properties; some may not have tweakpane inputs
  mergeCategoryKeyValues(globals, preset);

  didLoadPresetCallback(true);

  return pane;
}
