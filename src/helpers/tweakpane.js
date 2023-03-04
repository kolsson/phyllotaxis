import { Pane } from "tweakpane";
import { presets } from "../presets";

// properties that need to be recomputed when updated

const computeKeys = {
  cellCount: true,
  startCell: true,
  cellAngle: true,
  cellAngleFrac: true,
  cellSize: true,
  cellPadding: true,
  cellCenterPush: true,
  cellSiteCircleRMult: true,
  cellClipMult: true,
  cellTrimR: true,
  cellDropOutType: true,
  cellDropOutPerc: true,
  cellDropOutMult: true,
  cellDropOutMod: true,
  cellReorderAfterDropOut: true,
};

export default function tp(
  params,
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
    pane.importPreset({ ...params, ...presets[e.value] });
    areUpdatesPaused = false;
    didLoadPresetCallback();
  });

  const exportButton = pane.addButton({
    title: "copy + console.log()",
    label: "",
  });

  exportButton.on("click", async () => {
    const p = JSON.stringify(pane.exportPreset());
    console.log(p);
    await navigator.clipboard.writeText(p);
  });

  pane.addSeparator();

  // ui
  const centerButton = pane.addButton({
    title: "center",
    label: "canvas",
  });

  centerButton.on("click", () => {
    params.canvasX = 0;
    params.canvasY = 0;
  });

  pane.addInput(params, "scale", {
    min: 0.1,
    max: 6,
    step: 0.1,
  });

  pane.addSeparator();

  // monitors
  pane.addMonitor(params, "actualCellCount", {});

  // core params
  const cellsF = pane.addFolder({ title: "Cells" });
  cellsF.addInput(params, "cellCount", {
    label: "count",
    min: 50,
    max: 1000,
    step: 1,
  });
  cellsF.addInput(params, "startCell", {
    label: "start",
    min: 0,
    max: 50,
    step: 1,
  });
  cellsF.addInput(params, "cellAngle", {
    label: "angle",
    min: 100,
    max: 179,
    step: 1,
  });
  cellsF.addInput(params, "cellAngleFrac", {
    label: "angleFrac",
    min: 0,
    max: 1,
    step: 0.1,
  });
  cellsF.addInput(params, "cellSize", {
    label: "size",
    min: 6,
    max: 40,
    step: 1,
  });
  cellsF.addInput(params, "cellPadding", {
    label: "padding",
    min: 0,
    max: 2,
    step: 0.01,
  });
  cellsF.addInput(params, "cellCenterPush", {
    label: "centerPush",
    min: 0,
    max: 50,
    step: 0.1,
  });

  const sitesF = pane.addFolder({ title: "Sites", expanded: false });
  sitesF.addInput(params, "cellSiteCircleRMult", {
    label: "siteCircleRMult",
    min: 0,
    max: 2,
    step: 0.05,
  });

  const clipF = pane.addFolder({ title: "Clipping", expanded: false });
  clipF.addInput(params, "cellClipMult", {
    label: "clipMult",
    min: 0.5,
    max: 4,
    step: 0.1,
  });
  clipF.addInput(params, "cellTrimR", {
    label: "trimR",
    min: 0,
    max: 200,
    step: 1,
  });

  const dropOutF = pane.addFolder({ title: "Drop Out" });

  dropOutF.addInput(params, "cellDropOutType", {
    label: "dropOutType",
    options: {
      perlin: "perlin",
      mod: "mod",
    },
  });
  dropOutF.addInput(params, "cellDropOutPerc", {
    label: "dropOutPerc",
    min: 0,
    max: 0.75,
    step: 0.05,
  });
  dropOutF.addInput(params, "cellDropOutMult", {
    label: "dropOutMult",
    min: 0.05,
    max: 5,
    step: 0.05,
  });
  dropOutF.addInput(params, "cellDropOutMod", {
    label: "dropOutMod",
    min: 1,
    max: 50,
    step: 1,
  });
  dropOutF.addInput(params, "cellReorderAfterDropOut", {
    label: "reorderAfterDropOut",
  });

  const primF = pane.addFolder({ title: "Prim MST" });
  primF.addInput(params, "primMstBezierSwingMult", {
    label: "bezierSwingMult",
    min: 0,
    max: 20,
    step: 0.25,
  });
  primF.addInput(params, "primMstShowArrows", {
    label: "showArrows",
  });
  primF.addInput(params, "primMstArrowDist", {
    label: "arrowDist",
    min: 5,
    max: 100,
    step: 1,
  });
  primF.addInput(params, "primMstArrowWidth", {
    label: "arrowWidth",
    min: 1,
    max: 20,
    step: 0.5,
  });
  primF.addInput(params, "primMstArrowHeight", {
    label: "arrowHeight",
    min: 1,
    max: 20,
    step: 0.5,
  });
  primF.addInput(params, "primMstArrowSpeed", {
    label: "arrowSpeed",
    min: 0.2,
    max: 4,
    step: 0.05,
  });

  const debugF = pane.addFolder({ title: "Debug", expanded: false });
  debugF.addInput(params, "showCellTrimCircles", {
    label: "Show Trim Circles",
  });
  debugF.addSeparator();
  debugF.addInput(params, "showCells", { label: "Show Cells" });
  debugF.addInput(params, "showCellSites", { label: "Show Cell Sites" });
  debugF.addInput(params, "showPrimMst", { label: "Show Prim MST" });
  debugF.addSeparator();
  debugF.addInput(params, "showCellText", { label: "Show Cell Text" });
  debugF.addInput(params, "textSize", {
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

  // populate with initial preset
  areUpdatesPaused = true;
  pane.importPreset({ ...params, ...presets[0] });
  areUpdatesPaused = false;
  didLoadPresetCallback();

  return pane;
}
