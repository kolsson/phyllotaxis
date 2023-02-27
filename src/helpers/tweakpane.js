import { Pane } from "tweakpane";
import { presets } from "../presets";

// properties that need to be recomputed when updated

const computeKeys = {
  cellCount: true,
  startCell: true,
  cellAngle: true,
  cellAngleFrac: true,
  cellSize: true,
  cellClipMult: true,
  cellTrimR: true,
  cellDropOutType: true,
  cellDropOutPercent: true,
  cellDropOutMult: true,
  cellDropOutMod: true,
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
    min: 0.5,
    max: 10,
    step: 0.1,
  });

  pane.addSeparator();

  // monitors
  pane.addMonitor(params, "actualCellCount", {});
  pane.addSeparator();

  // core params
  pane.addInput(params, "cellCount", {
    min: 50,
    max: 1000,
    step: 1,
  });
  pane.addInput(params, "startCell", {
    min: 0,
    max: 50,
    step: 1,
  });
  pane.addInput(params, "cellAngle", {
    min: 100,
    max: 179,
    step: 1,
  });
  pane.addInput(params, "cellAngleFrac", {
    min: 0,
    max: 1,
    step: 0.1,
  });
  pane.addInput(params, "cellSize", {
    min: 6,
    max: 40,
    step: 1,
  });
  pane.addSeparator();
  pane.addInput(params, "cellClipMult", {
    min: 0.5,
    max: 4,
    step: 0.1,
  });
  pane.addInput(params, "cellTrimR", {
    min: 0,
    max: 100,
    step: 1,
  });
  pane.addSeparator();
  pane.addInput(params, "cellDropOutType", {
    options: {
      perlin: "perlin",
      mod: "mod",
    },
  });
  pane.addInput(params, "cellDropOutPercent", {
    min: 0,
    max: 0.95,
    step: 0.05,
  });
  pane.addInput(params, "cellDropOutMult", {
    min: 0.05,
    max: 5,
    step: 0.05,
  });
  pane.addInput(params, "cellDropOutMod", {
    min: 1,
    max: 50,
    step: 1,
  });
  pane.addSeparator();

  // debugging
  pane.addInput(params, "showCellTrimCircles", { label: "Show Trim Circles" });
  pane.addSeparator();
  pane.addInput(params, "showCells", { label: "Show Cells" });
  pane.addInput(params, "showCellSites", { label: "Show Cell Sites" });
  pane.addInput(params, "showPrimMst", { label: "Show Prim MST" });
  pane.addSeparator();
  pane.addInput(params, "showCellText", { label: "Show Cell Text" });
  pane.addInput(params, "textSize", {
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
