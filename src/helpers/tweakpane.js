import { Pane } from "tweakpane";
import { presets } from "../presets";

export default function tp(
  params,
  computeCallback,
  redrawCallback,
  didLoadPresetCallback
) {
  const pane = new Pane();
  let pauseUpdates = false;

  const presetOptions = presets.map((p, i) => ({
    text: `Preset ${i + 1}`,
    value: i,
  }));

  // presets and export
  const presetsList = pane.addBlade({
    view: "list",
    label: "Presets",
    options: presetOptions,
    value: 0,
  });

  presetsList.on("change", (e) => {
    pauseUpdates = true;
    pane.importPreset({ ...params, ...presets[e.value] });
    pauseUpdates = false;
    didLoadPresetCallback();
  });

  const exportButton = pane.addButton({
    title: "copy + console.log()",
    label: "Parameters",
  });

  exportButton.on("click", async () => {
    const p = JSON.stringify(pane.exportPreset());
    console.log(p);
    await navigator.clipboard.writeText(p);
  });

  pane.addSeparator();

  // monitors
  pane.addMonitor(params, "actualCellCount", {});
  pane.addSeparator();

  // ui
  pane.addInput(params, "scale", {
    min: 0.5,
    max: 10,
    step: 0.1,
  });
  pane.addSeparator();

  // core params
  pane.addInput(params, "cellCount", {
    min: 50,
    max: 1000,
    step: 1,
    compute: true,
  });
  pane.addInput(params, "startCell", {
    min: 0,
    max: 50,
    step: 1,
    compute: true,
  });
  pane.addInput(params, "cellAngle", {
    min: 100,
    max: 179,
    step: 1,
    compute: true,
  });
  pane.addInput(params, "cellAngleFrac", {
    min: 0,
    max: 1,
    step: 0.1,
    compute: true,
  });
  pane.addInput(params, "cellSize", {
    min: 6,
    max: 40,
    step: 1,
    compute: true,
  });
  pane.addInput(params, "cellClipR", {
    min: 0,
    max: 100,
    step: 1,
    compute: true,
  });
  pane.addSeparator();

  // debugging
  pane.addInput(params, "showCellClipCircles", { label: "Show Clip Circles" });
  pane.addInput(params, "showCells", { label: "Show Cells" });
  pane.addInput(params, "showPrimMst", { label: "Show Prim MST" });
  pane.addInput(params, "showCellSites", { label: "Show Cell Sites" });
  pane.addInput(params, "showCellText", { label: "Show Cell Text" });
  pane.addInput(params, "textSize", {
    label: "Text Size",
    min: 8,
    max: 14,
    step: 0.25,
  });

  // updates
  pane.on("change", () => {
    if (!pauseUpdates) {
      if (1) computeCallback();
      redrawCallback();
    }
  });

  // populate with initial preset
  pauseUpdates = true;
  pane.importPreset({ ...params, ...presets[0] });
  pauseUpdates = false;
  didLoadPresetCallback();

  return pane;
}
